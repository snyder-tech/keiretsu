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
export const PersonRef = Schema.TaggedUnion({
  identified: { personId: PersonId },
  pseudonymous: { pseudonym: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)), epoch: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)) },
});
/** @since 0.1.0 @category models */
export type PersonRef = typeof PersonRef.Type;

/**
 * A stable join key for a person reference.
 *
 * @since 0.1.0
 * @category accessors
 */
export const personKey = (ref: PersonRef): string => (ref._tag === 'identified' ? `id:${ref.personId}` : `ps:${ref.epoch}:${ref.pseudonym}`);

/**
 * The identified person id, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export const identifiedId = (ref: PersonRef): PersonId | undefined => (ref._tag === 'identified' ? ref.personId : undefined);

/**
 * Reference an identified person.
 *
 * @since 0.1.0
 * @category constructors
 */
export const identified = (personId: PersonId): PersonRef => ({ _tag: 'identified', personId });
