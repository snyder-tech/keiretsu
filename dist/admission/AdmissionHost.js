import { Context, Effect, Schema } from 'effect';
import { digestValue } from "../core/CanonicalJson.js";
import { AdmissionCommand, AdmissionReceipt, AdmissionAuthorization } from "./AdmissionCommand.js";
import { AdmissionDenied, AdmissionHostFailure } from "./AdmissionError.js";
export class AdmissionAuthority extends Context.Service()('@snyder-tech/keiretsu/admission/AdmissionAuthority') {
}
export class AdmissionHost extends Context.Service()('@snyder-tech/keiretsu/admission/AdmissionHost') {
}
const receiptMatches = (command, receipt, digest) => receipt.entitlementId.toLowerCase() === command.entitlementId.toLowerCase() &&
    receipt.operation === command._tag &&
    receipt.requestDigest === digest &&
    receipt.idempotencyKey === command.idempotencyKey &&
    receipt.revision === command.expectedRevision + 1;
const scanMatches = (command, receipt) => command._tag !== 'redeem' || receipt.scanId?.toLowerCase() === command.scan.id.toLowerCase();
/** The only ingress accepts commands, never a caller-supplied authorization grant. */
export const executeAdmission = Effect.fn('executeAdmission')(function* (input) {
    const command = yield* Schema.decodeUnknownEffect(AdmissionCommand, { onExcessProperty: 'error' })(input);
    const requestDigest = yield* digestValue(command);
    const authority = yield* AdmissionAuthority;
    const grant = yield* authority.authorize(command, requestDigest);
    const authorization = yield* Schema.decodeUnknownEffect(AdmissionAuthorization, { onExcessProperty: 'error' })(grant);
    if (authorization.requestDigest !== requestDigest)
        return yield* new AdmissionDenied({ reason: 'grant-mismatch' });
    const host = yield* AdmissionHost;
    const output = yield* host.commitAtomic(command, authorization);
    const receipt = yield* Schema.decodeUnknownEffect(AdmissionReceipt, { onExcessProperty: 'error' })(output);
    if (!receiptMatches(command, receipt, requestDigest) || !scanMatches(command, receipt))
        return yield* new AdmissionHostFailure({ operation: command._tag });
    return receipt;
});
//# sourceMappingURL=AdmissionHost.js.map