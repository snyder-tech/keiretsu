/**
 * Capacity forecasts: the long planning horizon. A provider tells an audience
 * how many minutes per week it expects a person (pseudonymous) or a role to
 * have available over the next thirteen weeks. A forecast is **non-binding**
 * (`binding: false` on the wire): it reserves nothing and commits no one.
 * Reservations are capacity holds; commitments are the employer's; the firm
 * near-term view is the two-week `FirmSchedule`.
 *
 * Forecasts are revisioned: a new forecast for the same id is the next
 * revision and names the digest it supersedes. Agents may prepare forecasts.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { RevisionFields, revisionChain } from '../core/Envelope.ts';
import { EntityId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { CapacitySubject } from './CapacityOffer.ts';
import { PartyRef } from './PartyRef.ts';
import { addDays, Weekday, weekdayOf } from './TimeZone.ts';
import { CapacityForecastId } from './WorkIds.ts';

/**
 * Weeks in the forecast horizon.
 *
 * @since 0.1.0
 * @category constants
 */
export const FORECAST_HORIZON_WEEKS = 13;

/**
 * Forecast minutes for one subject in one week (0 to 10,080).
 *
 * @since 0.1.0
 * @category schemas
 */
export const ForecastWeek = Schema.Struct({
  weekStart: IsoDate,
  subject: CapacitySubject,
  minutes: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_080 })),
});
/** @since 0.1.0 @category models */
export type ForecastWeek = typeof ForecastWeek.Type;

interface ForecastShape {
  readonly weekStartDay: Weekday;
  readonly horizonStart: string;
  readonly weeks: ReadonlyArray<ForecastWeek>;
}

const weekOutsideHorizon = (forecast: ForecastShape): string | undefined => {
  const end = addDays(forecast.horizonStart, FORECAST_HORIZON_WEEKS * 7);
  const stray = forecast.weeks.find((week) => week.weekStart < forecast.horizonStart || week.weekStart >= end || weekdayOf(week.weekStart) !== forecast.weekStartDay);
  return stray === undefined ? undefined : `week ${stray.weekStart} is not a week start inside the ${FORECAST_HORIZON_WEEKS}-week horizon`;
};

/**
 * A non-binding thirteen-week capacity forecast.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityForecast = Schema.Struct({
  id: CapacityForecastId,
  ...RevisionFields,
  recordedAt: Instant,
  provider: EntityId,
  audience: PartyRef,
  preparedBy: Actor,
  weekStartDay: Weekday,
  horizonStart: IsoDate,
  /** Always false: a forecast reserves and commits nothing. */
  binding: Schema.Literal(false),
  weeks: Schema.Array(ForecastWeek),
}).check(
  revisionChain,
  Schema.makeFilter((forecast) => (weekdayOf(forecast.horizonStart) === forecast.weekStartDay ? undefined : 'horizonStart falls on the declared weekStartDay')),
  Schema.makeFilter((forecast) => (forecast.audience._tag === 'entity' && forecast.audience.entityId === forecast.provider ? 'a forecast is addressed to another party' : undefined)),
  Schema.makeFilter(weekOutsideHorizon),
  Schema.makeFilter((forecast) => (new Set(forecast.weeks.map((week) => JSON.stringify([week.weekStart, week.subject]))).size === forecast.weeks.length ? undefined : 'one row per week and subject')),
);
/** @since 0.1.0 @category models */
export type CapacityForecast = typeof CapacityForecast.Type;
