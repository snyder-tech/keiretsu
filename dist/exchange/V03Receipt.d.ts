/** Complete record acknowledgments, explicitly separating validation from application. */
import { Effect } from 'effect';
import { type SigningKey } from './Jws.ts';
import type { KeyResolver } from './KeyResolver.ts';
import { type ExchangeErrorV03 } from './V03Bundle.ts';
import { type EnvelopeV03, type LimitsV03, ReceiptV03, type RecordIdentityV03, UnsealedReceiptV03 } from './V03Contracts.ts';
export declare const sealReceiptV03: (input: UnsealedReceiptV03) => Effect.Effect<{
    readonly text: string;
    readonly receipt: ReceiptV03;
}, ExchangeErrorV03>;
export declare const readReceiptV03: (text: string, limits: LimitsV03) => Effect.Effect<ReceiptV03, ExchangeErrorV03>;
export declare const signReceiptV03: (options: {
    readonly text: string;
    readonly key: SigningKey;
    readonly limits: LimitsV03;
}) => Effect.Effect<string, ExchangeErrorV03>;
export interface ReceiptExpectationV03 {
    readonly envelope: Pick<EnvelopeV03, 'issuer' | 'audience' | 'bundleId' | 'seq' | 'contentDigest'>;
    readonly phase: UnsealedReceiptV03['phase'];
    readonly identities: ReadonlyArray<RecordIdentityV03>;
    readonly applicationId?: string;
    readonly original?: ReceiptV03;
}
export declare const verifyReceiptV03: (options: {
    readonly text: string;
    readonly expected: ReceiptExpectationV03;
    readonly limits: LimitsV03;
}) => Effect.Effect<ReceiptV03, ExchangeErrorV03, KeyResolver>;
//# sourceMappingURL=V03Receipt.d.ts.map