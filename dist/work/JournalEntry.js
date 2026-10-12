/**
 * The first rung of the trust ladder: an append-only work journal.
 *
 * People, agents and hooks write journal entries; only the owner affirms them.
 * Corrections and retractions are new entries that name what they supersede.
 * Journals are owner-only: they never enter exchange bundles (see `Disclosure`).
 * Content stays with the owner; the wire carries its digest.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, requireHuman } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { EventId, JournalEntryId, PersonId } from "../core/Ids.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { openVocabulary } from "./Code.js";
import { DayMinutes } from "./EconomicEvent.js";
import { NotOwner } from "./NotOwner.js";
import { WorkObjectRef } from "./WorkObject.js";
/**
 * Journal entry kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalKind = openVocabulary(['worklog', 'decision', 'blocker', 'plan', 'estimate', 'handoff', 'ai-session', 'correction', 'retract']);
/**
 * Who wrote the entry (W3C PROV `wasAttributedTo`) and, for agents, with what.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalProvenance = Schema.Struct({
    origin: Schema.Literals(['human', 'agent', 'hook']),
    actor: Actor,
    model: Schema.optional(Schema.NonEmptyString),
    promptVersion: Schema.optional(Schema.NonEmptyString),
    inputDigest: Schema.optional(Sha256),
});
/**
 * The owner's affirmation that an entry is a true account of their work.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Affirmation = Schema.Struct({ by: Actor, at: Instant });
const provenanceConsistent = (provenance, owner) => {
    if (provenance.origin === 'human')
        return provenance.actor._tag === 'human' && provenance.actor.personId === owner;
    if (provenance.origin === 'agent')
        return provenance.actor._tag === 'agent';
    return provenance.actor._tag !== 'human';
};
/**
 * One append-only journal entry.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalEntry = Schema.Struct({
    id: JournalEntryId,
    owner: PersonId,
    recordedAt: Instant,
    kind: JournalKind,
    supersedes: Schema.optional(JournalEntryId),
    provenance: JournalProvenance,
    links: Schema.Array(WorkObjectRef),
    workDate: Schema.optional(IsoDate),
    effortMinutes: Schema.optional(DayMinutes),
    contentDigest: Sha256,
    computeEventIds: Schema.Array(EventId),
    affirmation: Schema.optional(Affirmation),
}).check(Schema.makeFilter((entry) => (entry.kind === 'correction' || entry.kind === 'retract') && entry.supersedes === undefined ? 'corrections and retractions name the entry they supersede' : undefined), Schema.makeFilter((entry) => (entry.supersedes === entry.id ? 'an entry cannot supersede itself' : undefined)), Schema.makeFilter((entry) => (provenanceConsistent(entry.provenance, entry.owner) ? undefined : 'provenance origin does not match its actor')), Schema.makeFilter((entry) => entry.affirmation === undefined || (entry.affirmation.by._tag === 'human' && entry.affirmation.by.personId === entry.owner)
    ? undefined
    : 'only the owner affirms a journal entry'));
/**
 * The entry already carries an affirmation.
 *
 * @since 0.1.0
 * @category errors
 */
export class AlreadyAffirmed extends Schema.TaggedError()('AlreadyAffirmed', { entryId: Schema.String }) {
}
/**
 * The owner affirms an entry. Agents and other people cannot.
 *
 * @since 0.1.0
 * @category transitions
 */
export const affirm = (options) => Effect.gen(function* () {
    // Re-check at runtime: wire-decoded actors can reach here without the compile-time guarantee.
    const human = yield* requireHuman(options.by, 'affirm-journal-entry');
    const { entry } = options;
    if (human.personId !== entry.owner)
        return yield* Effect.fail(new NotOwner({ action: 'affirm-journal-entry', owner: entry.owner, actor: human.personId }));
    if (entry.affirmation !== undefined)
        return yield* Effect.fail(new AlreadyAffirmed({ entryId: entry.id }));
    return { ...entry, affirmation: { by: human, at: options.at } };
});
/**
 * Whether an entry is affirmed by its owner.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isAffirmed = (entry) => entry.affirmation !== undefined && entry.affirmation.by._tag === 'human' && entry.affirmation.by.personId === entry.owner;
//# sourceMappingURL=JournalEntry.js.map