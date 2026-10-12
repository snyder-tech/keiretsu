/**
 * Declared tax groups and an ownership screen.
 *
 * Groups are declared by the adopter (IRC §1563 controlled groups, the §41(f)
 * single-taxpayer rule, OECD associated enterprises, consolidated returns, GST
 * groups). The screen checks a declared group against derived ownership and
 * yields a warning when ownership does not support it; it never determines
 * group membership. Decision support; professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { EvidenceRef } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { activeEdges, type OwnershipEdge } from './Ownership.ts';

/** @since 0.1.0 @category schemas */
export const TaxGroupKind = Schema.Literals(['us-1563-controlled', 'us-41f-single-taxpayer', 'oecd-associated', 'consolidated-return', 'gst-group']);
/** @since 0.1.0 @category models */
export type TaxGroupKind = typeof TaxGroupKind.Type;

/**
 * A tax group as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxGroupInput = Schema.Struct({
  kind: TaxGroupKind,
  members: Schema.NonEmptyArray(Schema.NonEmptyString),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  evidence: Schema.Array(EvidenceRef),
});
/** @since 0.1.0 @category models */
export type TaxGroupInput = typeof TaxGroupInput.Encoded;
/** @since 0.1.0 @category models */
export type TaxGroup = typeof TaxGroupInput.Type & { readonly key: string };

/**
 * Ownership thresholds used by the screen: §1563(a)(1) "at least 80 percent", §41(f)(5)
 * "more than 50 percent". Kinds without a threshold are not screened.
 *
 * @since 0.1.0
 * @category constants
 */
export const SCREEN_THRESHOLD_BPS: Readonly<Partial<Record<TaxGroupKind, number>>> = {
  'us-1563-controlled': 8000,
  'consolidated-return': 8000,
  'us-41f-single-taxpayer': 5001,
};

const heldBy = (edges: ReadonlyArray<OwnershipEdge>, holders: ReadonlySet<string>, owned: string): number =>
  edges.filter((edge) => edge.owned === owned && holders.has(edge.owner)).reduce((total, edge) => total + Math.max(edge.shareBps, edge.votingBps ?? 0), 0);

const closure = (options: { readonly root: string; readonly members: ReadonlyArray<string>; readonly edges: ReadonlyArray<OwnershipEdge>; readonly thresholdBps: number }): ReadonlySet<string> => {
  const covered = new Set([options.root]);
  let grew = true;
  while (grew) {
    const next = options.members.filter((member) => !covered.has(member) && heldBy(options.edges, covered, member) >= options.thresholdBps);
    next.forEach((member) => covered.add(member));
    grew = next.length > 0;
  }
  return covered;
};

/**
 * Whether some common owner (a member or an outside party) reaches every member through
 * chains of holdings at or above `thresholdBps` on `date`. Unverified edges are excluded.
 *
 * @since 0.1.0
 * @category screens
 */
export const ownershipSupports = (options: {
  readonly members: ReadonlyArray<string>;
  readonly edges: ReadonlyArray<OwnershipEdge>;
  readonly date: string;
  readonly thresholdBps: number;
}): boolean => {
  const edges = activeEdges(options.edges, { date: options.date });
  const roots = new Set([...options.members, ...edges.filter((edge) => options.members.includes(edge.owned)).map((edge) => edge.owner)]);
  return [...roots].some((root) => {
    const covered = closure({ root, members: options.members, edges, thresholdBps: options.thresholdBps });
    return options.members.every((member) => covered.has(member));
  });
};
