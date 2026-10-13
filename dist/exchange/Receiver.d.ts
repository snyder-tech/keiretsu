import { type Period } from '../core/Temporal.ts';
import { Effect, Option } from 'effect';
import { type BundleCodec, type BundleDecodeError, type Profile, type UnsupportedMajor } from './Bundle.ts';
import { type RecordKindPolicy } from './Disclosure.ts';
import type { SigningKey } from './Jws.ts';
import { type PartyRef } from './Party.ts';
import { type BundleReceipt, type ReceiptError } from './Receipt.ts';
import { type ChainFork, type ReplayConflict, SequenceStore } from './Sequence.ts';
import { type BundlePolicy } from './Verify.ts';
/**
 * Receiver configuration for one call.
 *
 * @since 0.1.0
 * @category models
 */
export interface ReceiveOptions<P extends Profile> {
    readonly codec: BundleCodec<P>;
    readonly text: string;
    readonly policy: BundlePolicy;
    readonly disclosure: {
        readonly [kind: string]: RecordKindPolicy<never>;
    };
    /** Spec versions this receiver supports (default: the current version). */
    readonly supported?: ReadonlyArray<string>;
    /** The receiver's open period; records for another period are `accepted-in-period`. */
    readonly receiverPeriod?: Period;
    /** Receiver's own party reference, supplied by the host installation. */
    readonly self: PartyRef;
    /** Sign the receipt with this key. */
    readonly signingKey?: SigningKey;
}
/**
 * Result of receiving one bundle.
 *
 * @since 0.1.0
 * @category models
 */
export type ReceiveResult = {
    readonly _tag: 'receipted';
    readonly receipt: BundleReceipt;
    readonly text: string;
    readonly committed: boolean;
} | {
    readonly _tag: 'duplicate';
    readonly receipt: BundleReceipt;
    readonly text: string;
    readonly original: Option.Option<string>;
} | {
    readonly _tag: 'held';
    readonly expectedSeq: number;
    readonly reason: string;
} | {
    readonly _tag: 'halted';
    readonly reason: string;
};
/**
 * Receive one bundle from its exact wire text.
 *
 * @since 0.1.0
 * @category receiving
 */
export declare const receive: <P extends Profile>(options: ReceiveOptions<P>) => Effect.Effect<ReceiveResult, BundleDecodeError | UnsupportedMajor | ReplayConflict | ChainFork | ReceiptError, SequenceStore>;
//# sourceMappingURL=Receiver.d.ts.map