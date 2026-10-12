/**
 * Controlled-group context per taxable year. Membership whose ownership is
 * not verified stays `undetermined` and blocks group-level outputs instead of
 * being guessed. Supplied by `@snyder-tech/keiretsu/entity` control edges and
 * confirmed by a human.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Controlled group for one taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ControlledGroupYear: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
    readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
    readonly members: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/EntityId">>;
    readonly status: Schema.Literals<readonly ["established", "undetermined"]>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type ControlledGroupYear = typeof ControlledGroupYear.Type;
/**
 * The group record for a tax year that contains every listed entity, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const groupContaining: (groups: ReadonlyArray<ControlledGroupYear>, taxYear: string, entities: ReadonlyArray<string>) => ControlledGroupYear | undefined;
//# sourceMappingURL=ControlledGroupYear.d.ts.map