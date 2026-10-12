/**
 * Owner-only steps: affirming a journal entry, promoting or dismissing a time
 * proposal. Only the person whose time it is may take them.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

/**
 * A human other than the record's owner attempted an owner-only step.
 *
 * @since 0.1.0
 * @category errors
 */
export class NotOwner extends Schema.TaggedError<NotOwner>()('NotOwner', {
  action: Schema.String,
  owner: Schema.String,
  actor: Schema.String,
}) {}
