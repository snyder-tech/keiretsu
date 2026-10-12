/**
 * People. A person carries a keiretsu `PersonId` and, issuer-side only, a
 * crosswalk of subject identifiers in each employer's systems (HR number,
 * directory object id). The crosswalk is never disclosed in bundles; partners
 * see a pseudonym (see `Pseudonym`).
 *
 * @since 0.1.0
 * @module
 */
import { PersonId } from '../core/Ids.ts';
import { Schema } from 'effect';
/**
 * One subject identifier issued by a declared entity, optionally in a declared system.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SubjectRef: Schema.Struct<{
    readonly issuer: Schema.NonEmptyString;
    readonly system: Schema.optional<Schema.NonEmptyString>;
    readonly subject: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type SubjectRef = typeof SubjectRef.Type;
/**
 * Disclosure class of a record kind: who may see it.
 *
 * @since 0.1.0
 * @category models
 */
export type Disclosure = 'issuer-only' | 'group' | 'counterparty';
/**
 * People and their subject crosswalks are issuer-only.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const PERSON_DISCLOSURE: Disclosure;
/**
 * A person as authored in config. No names, pay or contact data: those stay in the
 * adopter's HR system of record.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PersonInput: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly subjects: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly issuer: Schema.NonEmptyString;
        readonly system: Schema.optional<Schema.NonEmptyString>;
        readonly subject: Schema.NonEmptyString;
    }>>>;
}>;
/** @since 0.1.0 @category models */
export type PersonInput = typeof PersonInput.Encoded;
/** @since 0.1.0 @category models */
export type Person = {
    readonly key: string;
    readonly id: PersonId;
    readonly subjects: ReadonlyArray<SubjectRef>;
};
//# sourceMappingURL=Person.d.ts.map