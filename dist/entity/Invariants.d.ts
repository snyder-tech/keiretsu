/**
 * Every config invariant, run after structural decode. Issues carry stable
 * codes; `error` fails decoding, `hold` and `warning` are returned with the
 * decoded group.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `key.pattern` | error | record keys are lower-kebab slugs |
 * | `key.duplicate` | error | entity, counterparty and person keys share one namespace |
 * | `key.former-duplicate` | error | former keys are unique and never a current key |
 * | `id.duplicate` | error | record ids are unique |
 * | `identifier.*` | error/warning | per-scheme format and checksum (see `Identifier`) |
 * | `identifier.duplicate` | error | (scheme, value) is held by one party |
 * | `identifier.scheme-country` | warning | a country scheme matches the party's jurisdiction |
 * | `identifier.gstin-pan-mismatch` | error | a GSTIN embeds the entity's PAN |
 * | `timeline.order` | error | timelines are ordered, contiguous, non-overlapping, open only at the end |
 * | `timeline.outside-lifecycle` | error | timelines lie inside the entity lifecycle |
 * | `currency.unknown` | error | currencies are active ISO 4217 codes |
 * | `ref.unresolved` | error | every key reference resolves |
 *
 * Graph and people invariants are listed in `GraphInvariants` and `PeopleInvariants`.
 *
 * @since 0.1.0
 * @module
 */
import { type CurrencyTableShape } from '../core/Currency.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { type KeiretsuModel } from './Model.ts';
import { type RegimeCodePack } from './RegimePack.ts';
/**
 * Validation options.
 *
 * @since 0.1.0
 * @category models
 */
export interface ValidateOptions {
    /** Regime code pack for withholding and social-security codes (default: the bundled sample). */
    readonly regimePack?: RegimeCodePack | undefined;
    /** Currency table (default: bundled ISO 4217). */
    readonly currencyTable?: CurrencyTableShape | undefined;
}
/**
 * Run every invariant over a normalized model.
 *
 * @since 0.1.0
 * @category validation
 */
export declare const validate: (model: KeiretsuModel, options?: ValidateOptions) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=Invariants.d.ts.map