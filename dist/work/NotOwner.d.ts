/**
 * Owner-only steps: affirming a journal entry, promoting or dismissing a time
 * proposal. Only the person whose time it is may take them.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
declare const NotOwner_base: Schema.Class<NotOwner, Schema.TaggedStruct<"NotOwner", {
    readonly action: Schema.String;
    readonly owner: Schema.String;
    readonly actor: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A human other than the record's owner attempted an owner-only step.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NotOwner extends NotOwner_base {
}
export {};
//# sourceMappingURL=NotOwner.d.ts.map