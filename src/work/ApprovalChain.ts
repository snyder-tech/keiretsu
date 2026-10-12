/**
 * Approval chains as adopter configuration. Stages are open codes the adopter
 * declares (for example `technical`, `controller`, `final`); the package never
 * hard-codes roles. Each stage needs a distinct human.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { OpenCode } from './Code.ts';

/**
 * An ordered list of distinct approval stages under a chain key.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ApprovalChain = Schema.Struct({
  key: OpenCode,
  stages: Schema.NonEmptyArray(OpenCode),
}).check(Schema.makeFilter((chain) => (new Set(chain.stages).size === chain.stages.length ? undefined : 'approval stages are distinct')));
/** @since 0.1.0 @category models */
export type ApprovalChain = typeof ApprovalChain.Type;

/**
 * The stage after `completed` approvals, or `undefined` when the chain is complete.
 *
 * @since 0.1.0
 * @category accessors
 */
export const nextStage = (chain: ApprovalChain, completed: number): string | undefined => chain.stages[completed];
