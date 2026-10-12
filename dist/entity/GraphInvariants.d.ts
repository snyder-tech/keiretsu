/**
 * Invariants over the ownership and control graph and declared tax groups.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `ownership.self` | error | an entity does not own itself |
 * | `ownership.over-allocated` | error | per owned entity and date, Σ shareBps ≤ 10,000 |
 * | `ownership.cycle` | error | the ownership graph is acyclic on every date |
 * | `ownership.unverified` | warning | unverified edges are surfaced and excluded from derivations |
 * | `control.self` | error | an entity does not control itself |
 * | `control.full-overlap` | error | no two `full` control edges for one entity overlap |
 * | `control.joint-single` | error | `joint` control needs two or more overlapping controllers |
 * | `control.equity-without-ownership` | error | an `equity` basis needs matching ownership throughout |
 * | `control.unverified` | warning | as for ownership |
 * | `edge.verified-without-evidence` | error | `verified` assurance carries evidence |
 * | `tax-group.ownership-unsupported` | warning | derived ownership does not support a declared group |
 * | `tax-group.member-duplicate` | error | members are listed once |
 *
 * @since 0.1.0
 * @module
 */
import { type ValidationIssue } from '../core/Issue.ts';
import type { KeiretsuModel } from './Model.ts';
/**
 * Validate the ownership/control graph and tax groups.
 *
 * @since 0.1.0
 * @category validation
 */
export declare const validateGraph: (model: KeiretsuModel) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=GraphInvariants.d.ts.map