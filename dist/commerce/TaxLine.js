/**
 * Invoice tax lines, by regime, with UNCL 5305 duty/tax category codes.
 *
 * Tax lines are produced by a tax-determination step **after** invoice
 * assembly, never from charge lines, and this package never decides a rate,
 * place of supply or exemption: it records what was determined and checks
 * the line's internal consistency. Rules that depend on law are flagged as
 * holds for a professional, not resolved. Decision support; professional
 * review required.
 *
 * Categories (UNCL 5305): `S` standard, `Z` zero-rated, `E` exempt, `AE`
 * reverse charge, `K` intra-community (EEA) supply, `G` export outside the
 * EU / free export, `O` outside scope, `L`/`M` Canary Islands / Ceuta and Melilla.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { iso4217 } from "../core/Currency.js";
import { Decimal } from "../core/Decimal.js";
import * as DecimalMath from "../core/Decimal.js";
import { CountryCode, Situs, SubdivisionCode } from "../core/Country.js";
import { EvidenceRef } from "../core/Envelope.js";
import { Money, units } from "../core/Money.js";
import { divide, RoundingMode } from "../core/Rounding.js";
import { IsoDate } from "../core/Temporal.js";
import { fault } from "./Invariant.js";
/**
 * UNCL 5305 duty/tax/fee category code.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxCategory = Schema.Literals(['S', 'Z', 'E', 'AE', 'K', 'G', 'O', 'L', 'M']);
/**
 * Categories that carry an exemption reason (EN 16931 BT-120/121).
 *
 * @since 0.1.0
 * @category constants
 */
export const EXEMPTION_REASON_CATEGORIES = new Set(['Z', 'E', 'AE', 'K', 'G', 'O']);
/**
 * One rated component (GST CGST/SGST/IGST, a state and a local sales tax…).
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxComponent = Schema.Struct({
    kind: Schema.NonEmptyString.check(Schema.isMaxLength(32)),
    /** Rate as a fraction (`0.09` for 9%). */
    rate: Decimal,
    amount: Money,
});
const LineFields = {
    category: TaxCategory,
    base: Money,
    components: Schema.Array(TaxComponent),
    amount: Money,
    rounding: RoundingMode,
    exemptionReason: Schema.optional(Schema.NonEmptyString.check(Schema.isMaxLength(200))),
    /** The determination this line came from (tax package or adviser). */
    determination: Schema.optional(EvidenceRef),
};
/**
 * India GST treatment. Export under LUT is zero-rated without IGST; export with
 * payment charges IGST that is refunded later.
 *
 * @since 0.1.0
 * @category schemas
 */
export const InGstTreatment = Schema.Literals(['intra-state', 'inter-state', 'export-lut', 'export-with-payment']);
/**
 * A tax line.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxLine = Schema.TaggedUnion({
    none: { ...LineFields },
    'us-sales-tax': { ...LineFields, jurisdiction: SubdivisionCode, localJurisdiction: Schema.optional(Schema.NonEmptyString) },
    'in-gst': {
        ...LineFields,
        treatment: InGstTreatment,
        supplierGstState: SubdivisionCode,
        placeOfSupply: Situs,
        sacCode: Schema.String.check(Schema.isPattern(/^\d{4,8}$/)),
        lut: Schema.optional(Schema.Struct({ ref: Schema.NonEmptyString, fiscalYear: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}$/)) })),
        /** Receipt of convertible foreign exchange (FIRC/BRC) that zero-rating depends on. */
        realisation: Schema.optional(Schema.Struct({ currency: Schema.String.check(Schema.isPattern(/^[A-Z]{3}$/)), dueBy: IsoDate, evidence: Schema.optional(EvidenceRef) })),
    },
    'pk-provincial-sales-tax': { ...LineFields, province: SubdivisionCode, authority: Schema.NonEmptyString },
    'eu-vat': { ...LineFields, memberState: CountryCode, reverseCharge: Schema.Boolean, buyerVatId: Schema.optional(Schema.NonEmptyString) },
});
const sum = (amounts) => amounts.reduce((total, money) => total + units(money), 0n);
const expectedComponent = (base, component, options) => {
    const digits = options.table.minorUnits(base.currency);
    if (digits === undefined)
        return undefined;
    const exact = DecimalMath.multiply(DecimalMath.fromUnits(units(base), digits), DecimalMath.toScaled(component.rate));
    return divide(exact, 10n ** BigInt(DecimalMath.SCALE_DIGITS - digits), options.rounding);
};
const checkArithmetic = (line, subject, context) => {
    const table = context.table ?? iso4217;
    const currencies = new Set([line.base.currency, line.amount.currency, ...line.components.map((component) => component.amount.currency)]);
    if (currencies.size !== 1)
        return [fault('tax.currency-mismatch', subject, 'base, components and amount share one currency')];
    return [
        ...(line.base.currency === context.documentCurrency || line._tag === 'in-gst' ? [] : [fault('tax.document-currency', subject, 'tax is stated in the document currency')]),
        ...(sum(line.components.map((component) => component.amount)) === units(line.amount) ? [] : [fault('tax.amount-not-sum', subject, 'amount is the sum of its components')]),
        ...line.components.flatMap((component) => {
            const expected = expectedComponent(line.base, component, { rounding: line.rounding, table });
            if (expected === undefined)
                return [fault('tax.unknown-currency', subject, `${line.base.currency} is not in the currency table`)];
            return expected === units(component.amount) ? [] : [fault('tax.component-mismatch', subject, `${component.kind} should be ${expected} minor units`)];
        }),
        ...(units(line.amount) < 0n || units(line.base) < 0n ? [fault('tax.negative', subject, 'tax lines are stated positive; credit notes carry the sign')] : []),
    ];
};
const indianFiscalYear = (date) => {
    const year = Number(date.slice(0, 4));
    const start = Number(date.slice(5, 7)) >= 4 ? year : year - 1;
    return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
};
const kinds = (line) => line.components.map((component) => component.kind).sort().join('+');
const checkExportLut = (line, subject, context) => [
    ...(line.components.length === 0 && units(line.amount) === 0n ? [] : [fault('tax.in-gst.export-lut-charged', subject, 'export under LUT carries no IGST')]),
    ...(line.category === 'Z' ? [] : [fault('tax.in-gst.export-lut-category', subject, 'export under LUT is category Z')]),
    ...(line.lut === undefined ? [fault('tax.in-gst.lut-missing', subject, 'export under LUT cites the LUT')] : []),
    ...(line.lut !== undefined && line.lut.fiscalYear !== indianFiscalYear(context.issueDate)
        ? [fault('tax.in-gst.lut-fiscal-year', subject, `LUT is for ${line.lut.fiscalYear}; the invoice falls in ${indianFiscalYear(context.issueDate)}`)]
        : []),
    ...(line.placeOfSupply.country === 'IN' ? [fault('tax.in-gst.export-place-of-supply', subject, 'an export has its place of supply outside India')] : []),
    ...(line.realisation === undefined
        ? [fault('tax.in-gst.realisation-untracked', subject, 'zero-rating depends on receipt in convertible foreign exchange; track the realisation', 'hold')]
        : line.realisation.currency === 'INR'
            ? [fault('tax.in-gst.realisation-currency', subject, 'realisation in INR does not support zero-rating; adviser review', 'hold')]
            : []),
];
const checkInGst = (line, subject, context) => {
    const common = [
        ...(line.supplierGstState.startsWith('IN-') ? [] : [fault('tax.in-gst.supplier-state', subject, 'supplier GST state is an Indian subdivision')]),
        ...(line.base.currency === 'INR' ? [] : [fault('tax.in-gst.tax-currency', subject, 'GST amounts are stated in INR (tax currency)')]),
    ];
    switch (line.treatment) {
        case 'intra-state':
            return [
                ...common,
                ...(kinds(line) === 'cgst+sgst' ? [] : [fault('tax.in-gst.intra-state-components', subject, 'intra-state supply carries CGST and SGST')]),
                ...(line.placeOfSupply.subdivision === line.supplierGstState ? [] : [fault('tax.in-gst.intra-state-place', subject, 'intra-state supply is in the supplier state')]),
            ];
        case 'inter-state':
        case 'export-with-payment':
            return [...common, ...(kinds(line) === 'igst' ? [] : [fault('tax.in-gst.igst-components', subject, `${line.treatment} supply carries IGST only`)])];
        case 'export-lut':
            return [...common, ...checkExportLut(line, subject, context)];
    }
};
const checkRegime = (line, subject, context) => TaxLine.match(line, {
    none: (none) => (none.category === 'O' && none.components.length === 0 ? [] : [fault('tax.none-shape', subject, 'no-tax lines are category O without components')]),
    'us-sales-tax': (sales) => [
        ...(sales.jurisdiction.startsWith('US-') ? [] : [fault('tax.us.jurisdiction', subject, 'sales tax jurisdiction is a US state')]),
        ...(sales.determination === undefined ? [fault('tax.us.nexus-undetermined', subject, 'a sales-tax line cites its nexus and taxability determination', 'hold')] : []),
    ],
    'in-gst': (gst) => checkInGst(gst, subject, context),
    'pk-provincial-sales-tax': (pst) => (pst.province.startsWith('PK-') ? [] : [fault('tax.pk.province', subject, 'province is a Pakistan subdivision')]),
    'eu-vat': (vat) => vat.reverseCharge
        ? [
            ...(vat.category === 'AE' ? [] : [fault('tax.eu-vat.reverse-charge-category', subject, 'reverse charge is category AE')]),
            ...(units(vat.amount) === 0n ? [] : [fault('tax.eu-vat.reverse-charge-amount', subject, 'reverse-charged VAT is accounted for by the buyer; the line amount is zero')]),
            ...(vat.buyerVatId === undefined ? [fault('tax.eu-vat.buyer-vat-id', subject, 'reverse charge requires the buyer VAT identifier')] : []),
        ]
        : [],
});
/**
 * Validate one tax line: category/exemption consistency, arithmetic and regime rules.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateTaxLine = (line, options) => [
    ...(EXEMPTION_REASON_CATEGORIES.has(line.category) && line.exemptionReason === undefined
        ? [fault('tax.exemption-reason-missing', options.subject, `category ${line.category} states an exemption reason`)]
        : []),
    ...checkArithmetic(line, options.subject, options.context),
    ...checkRegime(line, options.subject, options.context),
];
/**
 * Exposed for tests and adapters: the Indian fiscal year (`2026-27`) of a date.
 *
 * @since 0.1.0
 * @category accessors
 */
export const inFiscalYear = (date) => indianFiscalYear(date);
//# sourceMappingURL=TaxLine.js.map