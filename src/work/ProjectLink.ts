import { PartyRef, sameParty, partyKey } from '../core/PartyRef.ts';
/**
 * Bilateral project links: a work object owned by one entity joined to a work
 * object owned by another. A link becomes `active` only once a human acting for
 * each owner has accepted it.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, type HumanActor, type HumanRequired, requireHuman } from '../core/Actor.ts';
import { BitemporalFields, RevisionFields, revisionChain, validInterval } from '../core/Envelope.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';

import { openVocabulary } from './Code.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { ProjectLinkId } from './WorkIds.ts';

/**
 * How the provider's work object relates to the recipient's.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ProjectLinkRelation = openVocabulary(['delivers-to', 'subcontracts', 'co-delivers']);
/** @since 0.1.0 @category models */
export type ProjectLinkRelation = typeof ProjectLinkRelation.Type;

/**
 * One owner's acceptance, by a person acting for that owner.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LinkAcceptance = Schema.Struct({ party: PartyRef, by: Actor, at: Instant });
/** @since 0.1.0 @category models */
export type LinkAcceptance = typeof LinkAcceptance.Type;

const acceptedBy = (acceptances: ReadonlyArray<LinkAcceptance>, party: PartyRef): boolean =>
  acceptances.some((acceptance) => sameParty(acceptance.party, party) && acceptance.by._tag === 'human' && sameParty(acceptance.by.actingFor, party));

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
}).check(
  revisionChain,
  validInterval,
  Schema.makeFilter((link) => (sameParty(link.provider.owner, link.recipient.owner) ? 'a project link joins work objects owned by different entities' : undefined)),
  Schema.makeFilter((link) =>
    link.acceptances.every((acceptance) => sameParty(acceptance.party, link.provider.owner) || sameParty(acceptance.party, link.recipient.owner))
      ? undefined
      : 'only the two owners accept a project link',
  ),
  Schema.makeFilter((link) =>
    link.state !== 'active' || (acceptedBy(link.acceptances, link.provider.owner) && acceptedBy(link.acceptances, link.recipient.owner))
      ? undefined
      : 'an active project link needs acceptance by a human acting for each owner',
  ),
);
/** @since 0.1.0 @category models */
export type ProjectLink = typeof ProjectLink.Type;

/**
 * The accepting person does not act for either owner.
 *
 * @since 0.1.0
 * @category errors
 */
export class NotLinkParty extends Schema.TaggedError<NotLinkParty>()('NotLinkParty', { actingFor: Schema.String }) {}

/**
 * Record one owner's acceptance; the link activates when both owners have accepted.
 *
 * @since 0.1.0
 * @category transitions
 */
export const acceptLink = (options: { readonly link: ProjectLink; readonly by: HumanActor; readonly at: Instant }): Effect.Effect<ProjectLink, HumanRequired | NotLinkParty> =>
  Effect.gen(function* () {
    // Re-check at runtime: wire-decoded actors can reach here without the compile-time guarantee.
    const human = yield* requireHuman(options.by, 'accept-project-link');
    const { link } = options;
    if (!sameParty(human.actingFor, link.provider.owner) && !sameParty(human.actingFor, link.recipient.owner)) return yield* Effect.fail(new NotLinkParty({ actingFor: partyKey(human.actingFor) }));
    const acceptances = [...link.acceptances, { party: human.actingFor, by: human, at: options.at }];
    const active = acceptedBy(acceptances, link.provider.owner) && acceptedBy(acceptances, link.recipient.owner);
    return { ...link, acceptances, state: active ? 'active' : link.state };
  });
