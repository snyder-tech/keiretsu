/**
 * Withholding and social-security regime codes as a versioned data pack.
 *
 * Codes are open on the wire (`<country>-<name>` or `x-<name>`); whether a code
 * is known comes from a pack the adopter supplies. The bundled sample pack is
 * marked `needs-verification` and cites the provisions it names; it is
 * illustrative, not legal or tax advice.
 *
 * @since 0.1.0
 * @module
 */
import { CountryCode } from "../core/Country.js";
import { Schema } from 'effect';
/**
 * Regime code pattern, e.g. `us-w2`, `in-192`, `pk-149`, or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RegimeCode = Schema.String.check(Schema.isPattern(/^(?:[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*|x-[a-z0-9]+(?:-[a-z0-9]+)*)$/));
/** @since 0.1.0 @category schemas */
export const RegimeEntry = Schema.Struct({
    code: RegimeCode,
    kind: Schema.Literals(['withholding', 'social-security']),
    country: CountryCode,
    label: Schema.NonEmptyString,
    citations: Schema.Array(Schema.NonEmptyString),
});
/**
 * A versioned regime code pack.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RegimeCodePack = Schema.Struct({
    edition: Schema.NonEmptyString,
    status: Schema.Literals(['needs-verification', 'adopter-verified']),
    entries: Schema.Array(RegimeEntry),
});
/**
 * Bundled sample pack (US, India, Pakistan). `needs-verification`: India renumbered its
 * Income-tax Act provisions from tax year 2026-27, and every citation needs review.
 *
 * @since 0.1.0
 * @category data
 */
export const samplePack = () => Schema.decodeUnknownSync(RegimeCodePack)({
    edition: 'keiretsu-sample-2026.10',
    status: 'needs-verification',
    entries: [
        { code: 'us-w2', kind: 'withholding', country: 'US', label: 'US wage withholding', citations: ['IRC §3402'] },
        { code: 'us-1099-nec', kind: 'withholding', country: 'US', label: 'US non-employee compensation (backup withholding only)', citations: ['IRC §3406', 'IRC §6041A'] },
        { code: 'in-192', kind: 'withholding', country: 'IN', label: 'India TDS on salary', citations: ['Income-tax Act 1961 s.192 (successor provision under the 2025 Act to verify)'] },
        { code: 'in-194j', kind: 'withholding', country: 'IN', label: 'India TDS on professional or technical fees', citations: ['Income-tax Act 1961 s.194J (successor provision to verify)'] },
        { code: 'pk-149', kind: 'withholding', country: 'PK', label: 'Pakistan withholding on salary', citations: ['Income Tax Ordinance 2001 s.149'] },
        { code: 'pk-153', kind: 'withholding', country: 'PK', label: 'Pakistan withholding on services', citations: ['Income Tax Ordinance 2001 s.153(1)(b)'] },
        { code: 'us-fica', kind: 'social-security', country: 'US', label: 'US FICA', citations: ['IRC §3101', 'IRC §3111'] },
        { code: 'in-epf', kind: 'social-security', country: 'IN', label: 'India Employees Provident Fund', citations: ['EPF & MP Act 1952 (Code on Social Security 2020 to verify)'] },
        { code: 'in-esi', kind: 'social-security', country: 'IN', label: 'India Employees State Insurance', citations: ['ESI Act 1948 (Code on Social Security 2020 to verify)'] },
        { code: 'pk-eobi', kind: 'social-security', country: 'PK', label: 'Pakistan EOBI', citations: ['Employees Old-Age Benefits Act 1976'] },
        { code: 'pk-pessi', kind: 'social-security', country: 'PK', label: 'Punjab employees social security', citations: ['Provincial Employees Social Security Ordinance 1965 (provincial successor to verify)'] },
    ],
});
/**
 * Look up a code in a pack.
 *
 * @since 0.1.0
 * @category accessors
 */
export const lookup = (pack, code) => pack.entries.find((entry) => entry.code === code);
//# sourceMappingURL=RegimePack.js.map