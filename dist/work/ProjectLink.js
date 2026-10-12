import { PartyRef, sameParty, partyKey } from "../core/PartyRef.js";
/**
 * Bilateral project links: a work object owned by one entity joined to a work
 * object owned by another. A link becomes `active` only once a human acting for
 * each owner has accepted it.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, requireHuman } from "../core/Actor.js";
import { BitemporalFields, RevisionFields, revisionChain, validInterval } from "../core/Envelope.js";
import { Instant } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { openVocabulary } from "./Code.js";
import { WorkObjectRef } from "./WorkObject.js";
import { ProjectLinkId } from "./WorkIds.js";
/**
 * How the provider's work object relates to the recipient's.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ProjectLinkRelation = openVocabulary(['delivers-to', 'subcontracts', 'co-delivers']);
/**
 * One owner's acceptance, by a person acting for that owner.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LinkAcceptance = Schema.Struct({ party: PartyRef, by: Actor, at: Instant });
const acceptedBy = (acceptances, party) => acceptances.some((acceptance) => sameParty(acceptance.party, party) && acceptance.by._tag === 'human' && sameParty(acceptance.by.actingFor, party));
/**
 * A bilateral link between two entities' work objects.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ProjectLink = Schema.Struct({
    id: ProjectLinkId,
    ...RevisionFields,
    ...BitemporalFields,
    provider: WorkObjectRef,
    recipient: WorkObjectRef,
    relation: ProjectLinkRelation,
    state: Schema.Literals(['proposed', 'active', 'suspended', 'revoked']),
    acceptances: Schema.Array(LinkAcceptance),
}).check(revisionChain, validInterval, Schema.makeFilter((link) => (sameParty(link.provider.owner, link.recipient.owner) ? 'a project link joins work objects owned by different entities' : undefined)), Schema.makeFilter((link) => link.acceptances.every((acceptance) => sameParty(acceptance.party, link.provider.owner) || sameParty(acceptance.party, link.recipient.owner))
    ? undefined
    : 'only the two owners accept a project link'), Schema.makeFilter((link) => link.state !== 'active' || (acceptedBy(link.acceptances, link.provider.owner) && acceptedBy(link.acceptances, link.recipient.owner))
    ? undefined
    : 'an active project link needs acceptance by a human acting for each owner'));
/**
 * The accepting person does not act for either owner.
 *
 * @since 0.1.0
 * @category errors
 */
export class NotLinkParty extends Schema.TaggedError()('NotLinkParty', { actingFor: Schema.String }) {
}
/**
 * Record one owner's acceptance; the link activates when both owners have accepted.
 *
 * @since 0.1.0
 * @category transitions
 */
export const acceptLink = (options) => Effect.gen(function* () {
    // Re-check at runtime: wire-decoded actors can reach here without the compile-time guarantee.
    const human = yield* requireHuman(options.by, 'accept-project-link');
    const { link } = options;
    if (!sameParty(human.actingFor, link.provider.owner) && !sameParty(human.actingFor, link.recipient.owner))
        return yield* Effect.fail(new NotLinkParty({ actingFor: partyKey(human.actingFor) }));
    const acceptances = [...link.acceptances, { party: human.actingFor, by: human, at: options.at }];
    const active = acceptedBy(acceptances, link.provider.owner) && acceptedBy(acceptances, link.recipient.owner);
    return { ...link, acceptances, state: active ? 'active' : link.state };
});
//# sourceMappingURL=ProjectLink.js.map