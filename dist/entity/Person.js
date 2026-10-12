/**
 * People. A person carries a keiretsu `PersonId` and, issuer-side only, a
 * crosswalk of subject identifiers in each employer's systems (HR number,
 * directory object id). The crosswalk is never disclosed in bundles; partners
 * see a pseudonym (see `Pseudonym`).
 *
 * @since 0.1.0
 * @module
 */
import { PersonId } from "../core/Ids.js";
import { Schema } from 'effect';
/**
 * One subject identifier issued by a declared entity, optionally in a declared system.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SubjectRef = Schema.Struct({
    issuer: Schema.NonEmptyString,
    system: Schema.optional(Schema.NonEmptyString),
    subject: Schema.NonEmptyString,
});
/**
 * People and their subject crosswalks are issuer-only.
 *
 * @since 0.1.0
 * @category constants
 */
export const PERSON_DISCLOSURE = 'issuer-only';
/**
 * A person as authored in config. No names, pay or contact data: those stay in the
 * adopter's HR system of record.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PersonInput = Schema.Struct({
    id: PersonId,
    subjects: Schema.optional(Schema.Array(SubjectRef)),
});
//# sourceMappingURL=Person.js.map