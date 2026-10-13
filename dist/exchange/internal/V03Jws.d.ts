import { Effect } from 'effect';
import { BUNDLE_TYP, RECEIPT_TYP } from '../Jws.ts';
import { type ExchangeErrorV03 } from '../V03Bundle.ts';
import type { LimitsV03 } from '../V03Contracts.ts';
/** Exchange 0.3 uses exact protected/binding member sets. Legacy Jws behavior is frozen.
 * Canonical base64url does not require canonical JSON whitespace or member ordering.
 * Limits apply to decoded header JSON before parsing, as well as to the outer envelope.
 */
export declare const validateJwsV03: (options: {
    readonly jws: string;
    readonly typ: typeof BUNDLE_TYP | typeof RECEIPT_TYP;
    readonly limits: LimitsV03;
}) => Effect.Effect<void, ExchangeErrorV03, never>;
//# sourceMappingURL=V03Jws.d.ts.map