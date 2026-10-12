/**
 * Disclosure levels and per-record-kind disclosure policy.
 *
 * A bundle declares one disclosure level. Each domain package registers a
 * {@link RecordKindPolicy} for every record kind it ships: the most revealing
 * level the kind may travel at, how to find the person references inside a
 * record, and whether the kind may leave the issuer's control group. The
 * exchange package enforces these generically; it never imports a domain.
 *
 * A kind without a registered policy fails closed (`disclosure.undeclared`).
 *
 * @since 0.1.0
 * @module
 */
import type { Actor } from '../core/Actor.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { Schema } from 'effect';
import { type ControlGroup, type PartyRef } from './Party.ts';
/**
 * What the audience may see about people: `identified` (person ids),
 * `pseudonymous` (per-audience pseudonyms) or `aggregate` (no per-person rows).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
/** @since 0.1.0 @category models */
export type Disclosure = typeof Disclosure.Type;
/**
 * Order disclosure levels from least (`aggregate`, 0) to most revealing (`identified`, 2).
 *
 * @since 0.1.0
 * @category ordering
 */
export declare const rank: (level: Disclosure) => number;
/**
 * How a person appears inside a record. Port: the entity package owns the full
 * `PersonRef` union; exchange needs only its level.
 *
 * @since 0.1.0
 * @category models
 */
export interface PersonRefView {
    readonly level: 'identified' | 'pseudonymous' | 'role-only';
}
/**
 * Person references carried by a core {@link Actor}: humans and agent
 * operators are identified; systems carry none.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const fromActor: (actor: Actor) => ReadonlyArray<PersonRefView>;
/**
 * Whether a kind may leave the issuer's control group: `allowed`; only as a
 * redacted view kind (`view-required`); or `never`.
 *
 * @since 0.1.0
 * @category models
 */
export type CrossGroup = 'allowed' | 'view-required' | 'never';
/**
 * Disclosure policy a domain registers for one record kind.
 *
 * @since 0.1.0
 * @category models
 */
export interface RecordKindPolicy<R> {
    readonly kind: string;
    /** Most revealing bundle level this kind may travel at. */
    readonly maxDisclosure: Disclosure;
    /** Least revealing bundle level this kind is meaningful at (e.g. engagements need `identified`). */
    readonly minDisclosure?: Disclosure;
    /** Extractors returning every person reference in a record. */
    readonly personRefPaths: ReadonlyArray<(record: R) => ReadonlyArray<PersonRefView>>;
    readonly crossesControlGroup: CrossGroup;
}
/**
 * One policy per record kind of a profile, keyed by kind.
 *
 * @since 0.1.0
 * @category models
 */
export type PolicySet<P extends {
    readonly [kind: string]: {
        readonly Type: unknown;
    };
}> = {
    readonly [K in keyof P & string]: RecordKindPolicy<P[K]['Type']> & {
        readonly kind: K;
    };
};
/**
 * The parts of a bundle disclosure checking reads (decoded, known-kind records only).
 *
 * @since 0.1.0
 * @category models
 */
export interface DisclosureSubject {
    readonly disclosure: Disclosure;
    readonly issuer: string;
    readonly audience: PartyRef;
    readonly records: ReadonlyArray<{
        readonly index: number;
        readonly kind: string;
        readonly record: unknown;
    }>;
}
/**
 * A disclosure finding on one record.
 *
 * @since 0.1.0
 * @category models
 */
export interface RecordIssue {
    readonly index: number;
    readonly issue: ValidationIssue;
}
/**
 * Check every known record against its kind's policy, the bundle level and the
 * audience's position relative to the control group.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const checkDisclosure: (subject: DisclosureSubject, policies: {
    readonly [kind: string]: RecordKindPolicy<never>;
}, controlGroup: ControlGroup) => ReadonlyArray<RecordIssue>;
//# sourceMappingURL=Disclosure.d.ts.map