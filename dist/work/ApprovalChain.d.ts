/**
 * Approval chains as adopter configuration. Stages are open codes the adopter
 * declares (for example `technical`, `controller`, `final`); the package never
 * hard-codes roles. Each stage needs a distinct human.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * An ordered list of distinct approval stages under a chain key.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ApprovalChain: Schema.Struct<{
    readonly key: Schema.String;
    readonly stages: Schema.NonEmptyArray<Schema.String>;
}>;
/** @since 0.1.0 @category models */
export type ApprovalChain = typeof ApprovalChain.Type;
/**
 * The stage after `completed` approvals, or `undefined` when the chain is complete.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const nextStage: (chain: ApprovalChain, completed: number) => string | undefined;
//# sourceMappingURL=ApprovalChain.d.ts.map