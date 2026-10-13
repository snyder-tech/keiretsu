import { Effect } from 'effect';
import { sameParty } from "../core/PartyRef.js";
import { compareInstants } from "../core/Temporal.js";
import { admissionScopeKey } from "./AdmissionScopeRef.js";
import { AdmissionDenied, AdmissionRevisionConflict, UnsupportedAdmission } from "./AdmissionError.js";
const checkCurrent = Effect.fnUntraced(function* (right, command, authority) {
    if (right.id.toLowerCase() !== command.entitlementId.toLowerCase() || !sameParty(right.issuer, authority.issuer))
        return yield* new AdmissionDenied({ reason: 'grant-mismatch' });
    if (right.revision !== command.expectedRevision)
        return yield* new AdmissionRevisionConflict({ expected: command.expectedRevision, actual: right.revision });
    if (right.status._tag === 'revoked')
        return yield* new AdmissionDenied({ reason: 'revoked' });
    if (right.revision === Number.MAX_SAFE_INTEGER)
        return yield* new AdmissionDenied({ reason: 'revision-exhausted' });
});
const matchesCredential = (right, credential) => credential.entitlementId.toLowerCase() === right.id.toLowerCase() &&
    credential.id.toLowerCase() === right.credentialId.toLowerCase() &&
    credential.generation === right.credentialGeneration &&
    credential.presentationDigest === right.presentationDigest;
const checkCredential = Effect.fnUntraced(function* (right, command) {
    const credential = command.credential;
    const scan = command.scan;
    if (!matchesCredential(right, credential)) {
        return yield* new AdmissionDenied({ reason: 'credential-mismatch' });
    }
    if (scan.credentialId.toLowerCase() !== credential.id.toLowerCase() || scan.presentationDigest !== credential.presentationDigest)
        return yield* new AdmissionDenied({ reason: 'credential-mismatch' });
    if (admissionScopeKey(scan.event) !== admissionScopeKey(right.event))
        return yield* new AdmissionDenied({ reason: 'scope-mismatch' });
    const actualSlot = scan.slot === undefined ? undefined : admissionScopeKey(scan.slot);
    const expectedSlot = right.slot === undefined ? undefined : admissionScopeKey(right.slot);
    if (actualSlot !== expectedSlot)
        return yield* new AdmissionDenied({ reason: 'scope-mismatch' });
});
const redeemRight = Effect.fnUntraced(function* (options) {
    const { right, command, authority } = options;
    if (command.scan.connectivity === 'offline')
        return yield* new UnsupportedAdmission({ capability: 'offline' });
    if (right.policy._tag !== 'single-entry')
        return yield* new UnsupportedAdmission({ capability: right.policy._tag });
    yield* checkCredential(right, command);
    if (right.consumption._tag === 'redeemed')
        return yield* new AdmissionDenied({ reason: 'consumed' });
    if (compareInstants(authority.authorizedAt, right.validFrom) < 0 || compareInstants(authority.authorizedAt, right.validTo) >= 0)
        return yield* new AdmissionDenied({ reason: 'outside-validity' });
    return { ...right, revision: right.revision + 1, consumption: { _tag: 'redeemed', redemptionId: options.redemptionId, redeemedAt: authority.authorizedAt } };
});
const replaceCredential = Effect.fnUntraced(function* (right, command) {
    const next = command.replacement;
    if (next.entitlementId.toLowerCase() !== right.id.toLowerCase() ||
        next.generation !== right.credentialGeneration + 1 ||
        next.id.toLowerCase() === right.credentialId.toLowerCase() ||
        next.presentationDigest === right.presentationDigest) {
        return yield* new AdmissionDenied({ reason: 'credential-mismatch' });
    }
    return { ...right, revision: right.revision + 1, credentialGeneration: next.generation, credentialId: next.id, presentationDigest: next.presentationDigest };
});
/** Pure proposal only. The host must apply it inside its atomic boundary, never after a detached read. */
export const transitionAdmission = Effect.fnUntraced(function* (options) {
    const { right, command, authority } = options;
    yield* checkCurrent(right, command, authority);
    switch (command._tag) {
        case 'redeem':
            return yield* redeemRight({ ...options, command });
        case 'replace-credential':
            return yield* replaceCredential(right, command);
        case 'revoke':
            return { ...right, revision: right.revision + 1, status: { _tag: 'revoked', revokedAt: authority.authorizedAt, reason: command.reason } };
    }
});
//# sourceMappingURL=AdmissionTransition.js.map