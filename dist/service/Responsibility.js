/** Facts for bilateral work responsibility; hosts own authorization and atomic persistence. */
import { Context, Effect, Schema } from 'effect';
import { brand } from "../core/Id.js";
import { HumanActorSchema } from "../core/Actor.js";
import { Sha256, digestValueSync } from "../core/CanonicalJson.js";
import { EvidenceRef } from "../core/Envelope.js";
import { PartyRef, sameParty } from "../core/PartyRef.js";
import { Instant, compareInstants } from "../core/Temporal.js";
import { WorkObjectRef, workObjectKey } from "../work/WorkObject.js";
export const ResponsibilityOfferId = brand('keiretsu/ResponsibilityOfferId');
export const WorkRevisionRef = Schema.Struct({ work: WorkObjectRef, revision: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)), digest: Sha256 });
const decisionFields = { decidedBy: HumanActorSchema, decidedAt: Instant, evidence: Schema.NonEmptyArray(EvidenceRef) };
export const ResponsibilityOffer = Schema.Struct({
    id: ResponsibilityOfferId,
    mode: Schema.Literals(['copy', 'delegation', 'handoff']),
    work: WorkRevisionRef,
    from: PartyRef,
    to: PartyRef,
    responsibility: Schema.NonEmptyString,
    expiresAt: Instant,
    ...decisionFields,
}).check(Schema.makeFilter((row) => (!sameParty(row.from, row.to) ? undefined : 'offer requires distinct parties')), Schema.makeFilter((row) => (sameParty(row.decidedBy.actingFor, row.from) ? undefined : 'offer maker acts for the offering party')), Schema.makeFilter((row) => (compareInstants(row.decidedAt, row.expiresAt) < 0 ? undefined : 'offer expires after its decision')));
export const ResponsibilityAcceptance = Schema.Struct({ offerId: ResponsibilityOfferId, offerDigest: Sha256, work: WorkRevisionRef, ...decisionFields });
export const ResponsibilityRelease = Schema.Struct({ offerId: ResponsibilityOfferId, offerDigest: Sha256, acceptanceDigest: Sha256, work: WorkRevisionRef, ...decisionFields });
export class ResponsibilityDenied extends Schema.TaggedError()('ResponsibilityDenied', { action: Schema.Literals(['offer', 'accept', 'release']) }) {
}
export const ResponsibilityAuthorityRequest = Schema.Struct({
    action: Schema.Literals(['offer', 'accept', 'release']),
    party: PartyRef,
    work: WorkRevisionRef,
    offerId: ResponsibilityOfferId,
    offerDigest: Sha256,
    decisionDigest: Sha256,
    actor: HumanActorSchema,
    evidence: Schema.NonEmptyArray(EvidenceRef),
});
/** Host compares authenticated principal and current delegated authority to this exact request. */
export class ResponsibilityAuthority extends Context.Service()('keiretsu/service/ResponsibilityAuthority') {
}
export class ResponsibilityConflict extends Schema.TaggedError()('ResponsibilityConflict', {
    reason: Schema.Literals(['party', 'expired', 'work-revision', 'offer', 'acceptance', 'copy-has-no-transfer']),
}) {
}
const sameRevision = (left, right) => workObjectKey(left.work) === workObjectKey(right.work) && left.revision === right.revision && left.digest === right.digest;
/** Digests bind actual facts; no source status is consulted. */
const validateAcceptance = Effect.fnUntraced(function* (input) {
    if ((yield* digestValueSync(input.offer)) !== input.offerDigest)
        return yield* new ResponsibilityConflict({ reason: 'offer' });
    if (input.acceptance.offerId !== input.offer.id || input.acceptance.offerDigest !== input.offerDigest)
        return yield* new ResponsibilityConflict({ reason: 'offer' });
    if (!sameRevision(input.offer.work, input.acceptance.work))
        return yield* new ResponsibilityConflict({ reason: 'work-revision' });
    if (!sameParty(input.acceptance.decidedBy.actingFor, input.offer.to))
        return yield* new ResponsibilityConflict({ reason: 'party' });
    if (compareInstants(input.acceptance.decidedAt, input.offer.decidedAt) < 0 || compareInstants(input.acceptance.decidedAt, input.offer.expiresAt) >= 0)
        return yield* new ResponsibilityConflict({ reason: 'expired' });
    return input.acceptance;
});
export const offerResponsibility = Effect.fn('keiretsu.offerResponsibility')(function* (offer) {
    const offerDigest = yield* digestValueSync(offer);
    const authority = yield* ResponsibilityAuthority;
    yield* authority.authorize({ action: 'offer', party: offer.from, work: offer.work, offerId: offer.id, offerDigest, decisionDigest: offerDigest, actor: offer.decidedBy, evidence: offer.evidence });
    return offer;
});
export const acceptResponsibility = Effect.fn('keiretsu.acceptResponsibility')(function* (input) {
    const acceptance = yield* validateAcceptance(input);
    const authority = yield* ResponsibilityAuthority;
    yield* verifyPriorOffer(input.offer, input.offerDigest);
    yield* authority.authorize({
        action: 'accept',
        party: input.offer.to,
        work: acceptance.work,
        offerId: input.offer.id,
        offerDigest: input.offerDigest,
        decisionDigest: yield* digestValueSync(acceptance),
        actor: acceptance.decidedBy,
        evidence: acceptance.evidence,
    });
    return acceptance;
});
const verifyPriorOffer = Effect.fnUntraced(function* (offer, offerDigest) {
    const authority = yield* ResponsibilityAuthority;
    yield* authority.verifyPriorDecision({
        action: 'offer',
        party: offer.from,
        work: offer.work,
        offerId: offer.id,
        offerDigest,
        decisionDigest: offerDigest,
        actor: offer.decidedBy,
        evidence: offer.evidence,
    });
});
const verifyPriorAcceptance = Effect.fnUntraced(function* (input) {
    yield* verifyPriorOffer(input.offer, input.offerDigest);
    const authority = yield* ResponsibilityAuthority;
    yield* authority.verifyPriorDecision({
        action: 'accept',
        party: input.offer.to,
        work: input.acceptance.work,
        offerId: input.offer.id,
        offerDigest: input.offerDigest,
        decisionDigest: input.acceptanceDigest,
        actor: input.acceptance.decidedBy,
        evidence: input.acceptance.evidence,
    });
});
export const releaseResponsibility = Effect.fn('keiretsu.releaseResponsibility')(function* (input) {
    yield* validateAcceptance(input);
    if ((yield* digestValueSync(input.acceptance)) !== input.acceptanceDigest)
        return yield* new ResponsibilityConflict({ reason: 'acceptance' });
    if (input.offer.mode === 'copy')
        return yield* new ResponsibilityConflict({ reason: 'copy-has-no-transfer' });
    if (input.release.offerId !== input.offer.id || input.release.offerDigest !== input.offerDigest)
        return yield* new ResponsibilityConflict({ reason: 'offer' });
    if (input.release.acceptanceDigest !== input.acceptanceDigest || compareInstants(input.release.decidedAt, input.acceptance.decidedAt) < 0)
        return yield* new ResponsibilityConflict({ reason: 'acceptance' });
    if (!sameRevision(input.offer.work, input.release.work))
        return yield* new ResponsibilityConflict({ reason: 'work-revision' });
    if (!sameParty(input.release.decidedBy.actingFor, input.offer.from))
        return yield* new ResponsibilityConflict({ reason: 'party' });
    yield* verifyPriorAcceptance(input);
    const authority = yield* ResponsibilityAuthority;
    yield* authority.authorize({
        action: 'release',
        party: input.offer.from,
        work: input.release.work,
        offerId: input.offer.id,
        offerDigest: input.offerDigest,
        decisionDigest: yield* digestValueSync(input.release),
        actor: input.release.decidedBy,
        evidence: input.release.evidence,
    });
    return input.release;
});
//# sourceMappingURL=Responsibility.js.map