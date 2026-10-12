/**
 * A reference to a person: identified (inside the employer and its DPA-covered
 * audiences) or pseudonymous (per issuer and audience, derived by the exchange
 * package). Pay and identity never travel with work records.
 *
 * @since 0.1.0
 * @module
 */
import { PersonId } from '../core/Ids.ts';
import { Schema } from 'effect';
/**
 * Identified person or an audience-scoped pseudonym (64 lowercase hex, with its key epoch).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PersonRef: Schema.TaggedUnion<{
    readonly identified: Schema.TaggedStruct<"identified", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    }>;
    readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
        readonly pseudonym: Schema.String;
        readonly epoch: Schema.Number;
    }>;
}>;
/** @since 0.1.0 @category models */
export type PersonRef = typeof PersonRef.Type;
/**
 * A stable join key for a person reference.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const personKey: (ref: PersonRef) => string;
/**
 * The identified person id, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const identifiedId: (ref: PersonRef) => PersonId | undefined;
/**
 * Reference an identified person.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const identified: (personId: PersonId) => PersonRef;
//# sourceMappingURL=PersonRef.d.ts.map