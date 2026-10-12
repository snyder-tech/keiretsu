import { issue } from "../core/Issue.js";
import { Schema } from 'effect';
import { crossesGroup } from "./Party.js";
/**
 * What the audience may see about people: `identified` (person ids),
 * `pseudonymous` (per-audience pseudonyms) or `aggregate` (no per-person rows).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Disclosure = Schema.Literals(['identified', 'pseudonymous', 'aggregate']);
const DISCLOSURE_RANK = { aggregate: 0, pseudonymous: 1, identified: 2 };
/**
 * Order disclosure levels from least (`aggregate`, 0) to most revealing (`identified`, 2).
 *
 * @since 0.1.0
 * @category ordering
 */
export const rank = (level) => DISCLOSURE_RANK[level];
const PERSON_RANK = { 'role-only': 0, pseudonymous: 1, identified: 2 };
/**
 * Person references carried by a core {@link Actor}: humans and agent
 * operators are identified; systems carry none.
 *
 * @since 0.1.0
 * @category constructors
 */
export const fromActor = (actor) => (actor._tag === 'system' ? [] : [{ level: 'identified' }]);
const lookup = (policies, kind) => {
    if (!Object.hasOwn(policies, kind))
        return undefined;
    // SAFETY: the policy is looked up by the record's own kind, and the record was
    // decoded with that kind's schema, so its extractors accept the record.
    return policies[kind];
};
const levelIssues = (subject, policy, at) => {
    const level = rank(subject.disclosure);
    return [
        ...(level > rank(policy.maxDisclosure) ? [issue('disclosure.kind-exceeds-max', 'error', at, `this kind travels at most ${policy.maxDisclosure}; the bundle is ${subject.disclosure}`)] : []),
        ...(policy.minDisclosure !== undefined && level < rank(policy.minDisclosure)
            ? [issue('disclosure.kind-below-min', 'error', at, `this kind needs at least ${policy.minDisclosure}; the bundle is ${subject.disclosure}`)]
            : []),
    ];
};
const groupIssues = (subject, policy, at) => {
    if (!subject.crossesGroup || policy.crossesControlGroup === 'allowed')
        return [];
    return policy.crossesControlGroup === 'never'
        ? [issue('disclosure.never-crosses', 'error', at, 'this kind never leaves the issuer control group')]
        : [issue('disclosure.view-required', 'error', at, 'outside the control group send the redacted view kind instead')];
};
const personIssues = (subject, policy, entry, at) => {
    const ceiling = rank(subject.disclosure);
    return policy.personRefPaths
        .flatMap((extract) => extract(entry.record))
        .filter((person) => PERSON_RANK[person.level] > ceiling)
        .map((person) => issue('disclosure.person-ref', 'error', at, `a ${subject.disclosure} bundle cannot carry a ${person.level} person reference`));
};
/**
 * Check every known record against its kind's policy, the bundle level and the
 * audience's position relative to the control group.
 *
 * @since 0.1.0
 * @category checks
 */
export const checkDisclosure = (subject, policies, controlGroup) => {
    const context = { disclosure: subject.disclosure, crossesGroup: crossesGroup(subject, controlGroup) };
    return subject.records.flatMap((entry) => {
        const at = `records[${entry.index}]`;
        const policy = lookup(policies, entry.kind);
        const issues = policy === undefined
            ? [issue('disclosure.undeclared', 'error', at, `no disclosure policy is registered for kind ${entry.kind}`)]
            : [...levelIssues(context, policy, at), ...groupIssues(context, policy, at), ...personIssues(context, policy, entry, at)];
        return issues.map((found) => ({ index: entry.index, issue: found }));
    });
};
//# sourceMappingURL=Disclosure.js.map