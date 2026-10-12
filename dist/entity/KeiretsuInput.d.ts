import { Schema } from 'effect';
/**
 * Lower-kebab slug used for every config key.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const SLUG_PATTERN: RegExp;
/**
 * The configuration schema. Structural only; cross-record invariants run in `Invariants`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const KeiretsuInput: Schema.Struct<{
    readonly tenant: Schema.String;
    readonly entities: Schema.$Record<Schema.String, Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly formerKeys: Schema.optional<Schema.$Array<Schema.NonEmptyString>>;
        readonly legalName: Schema.Union<readonly [Schema.NonEmptyString, Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.NonEmptyString;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>]>;
        readonly legalForm: Schema.optional<Schema.String>;
        readonly jurisdiction: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly identifiers: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly value: Schema.NonEmptyString;
        }>>>;
        readonly functionalCurrency: Schema.Union<readonly [Schema.brand<Schema.String, "keiretsu/CurrencyCode">, Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>]>;
        readonly reportingCurrency: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
        readonly fiscalYear: Schema.Union<readonly [Schema.TaggedUnion<{
            readonly "month-end": Schema.TaggedStruct<"month-end", {
                readonly endMonth: Schema.Number;
            }>;
            readonly "52-53-week": Schema.TaggedStruct<"52-53-week", {
                readonly endWeekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
                readonly rule: Schema.Literals<readonly ["last", "nearest"]>;
                readonly month: Schema.Number;
            }>;
        }>, Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.TaggedUnion<{
                readonly "month-end": Schema.TaggedStruct<"month-end", {
                    readonly endMonth: Schema.Number;
                }>;
                readonly "52-53-week": Schema.TaggedStruct<"52-53-week", {
                    readonly endWeekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
                    readonly rule: Schema.Literals<readonly ["last", "nearest"]>;
                    readonly month: Schema.Number;
                }>;
            }>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>]>;
        readonly accountingBasis: Schema.Union<readonly [Schema.Struct<{
            readonly framework: Schema.Literals<readonly ["us-gaap", "ifrs", "ind-as", "pk-ifrs", "tax-basis", "other"]>;
            readonly method: Schema.Literals<readonly ["accrual", "cash", "modified-cash"]>;
        }>, Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.Struct<{
                readonly framework: Schema.Literals<readonly ["us-gaap", "ifrs", "ind-as", "pk-ifrs", "tax-basis", "other"]>;
                readonly method: Schema.Literals<readonly ["accrual", "cash", "modified-cash"]>;
            }>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>]>;
        readonly booksSystem: Schema.optional<Schema.Union<readonly [Schema.NonEmptyString, Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.NonEmptyString;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>]>>;
        readonly lifecycle: Schema.NonEmptyArray<Schema.Struct<{
            readonly value: Schema.Literals<readonly ["forming", "active", "dormant", "dissolved"]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>>;
        }>>;
        readonly workCalendar: Schema.optional<Schema.NonEmptyString>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>;
    readonly counterparties: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        readonly legalName: Schema.NonEmptyString;
        readonly jurisdiction: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly identifiers: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly value: Schema.NonEmptyString;
        }>>>;
        readonly roles: Schema.NonEmptyArray<Schema.Union<readonly [Schema.Literals<readonly ["customer", "vendor", "partner", "reseller", "licensor", "licensee", "employer-of-record", "paying-agent"]>, Schema.String]>>;
        readonly relatedParty: Schema.optional<Schema.Struct<{
            readonly basis: Schema.Union<readonly [Schema.Literals<readonly ["common-control", "significant-influence", "key-management-personnel", "close-family", "associated-enterprise"]>, Schema.String]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>>>;
    readonly brands: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly entity: Schema.NonEmptyString;
        readonly name: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["dba", "trade-name", "product-brand"]>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>>>;
    readonly systems: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["qbo", "xero", "tally", "netsuite", "d365", "plain-text-ledger", "hris", "payroll", "psa", "other"]>, Schema.String]>;
        readonly tenantRef: Schema.optional<Schema.NonEmptyString>;
        readonly authority: Schema.Literals<readonly ["system-of-record", "mirror", "export-only"]>;
    }>>>;
    readonly ownership: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly owner: Schema.NonEmptyString;
        readonly owned: Schema.NonEmptyString;
        readonly shareBps: Schema.Number;
        readonly votingBps: Schema.optional<Schema.Number>;
        readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>>>;
    readonly control: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly controller: Schema.NonEmptyString;
        readonly controlled: Schema.NonEmptyString;
        readonly scope: Schema.Literals<readonly ["full", "limited", "joint", "significant-influence"]>;
        readonly bases: Schema.NonEmptyArray<Schema.Literals<readonly ["equity", "contractual", "governance", "operational", "potential-voting"]>>;
        readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>>>;
    readonly taxGroups: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly kind: Schema.Literals<readonly ["us-1563-controlled", "us-41f-single-taxpayer", "oecd-associated", "consolidated-return", "gst-group"]>;
        readonly members: Schema.NonEmptyArray<Schema.NonEmptyString>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>>;
    readonly people: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly subjects: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly issuer: Schema.NonEmptyString;
            readonly system: Schema.optional<Schema.NonEmptyString>;
            readonly subject: Schema.NonEmptyString;
        }>>>;
    }>>>;
    readonly engagements: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/EngagementId">;
        readonly person: Schema.NonEmptyString;
        readonly employer: Schema.NonEmptyString;
        readonly contractingParty: Schema.NonEmptyString;
        readonly payingAgent: Schema.optional<Schema.NonEmptyString>;
        readonly reimbursementAgreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
        readonly costBearer: Schema.NonEmptyString;
        readonly host: Schema.optional<Schema.NonEmptyString>;
        readonly relationship: Schema.Struct<{
            readonly kind: Schema.Literals<readonly ["employee", "contractor", "secondee", "officer", "eor-placed"]>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
            readonly decidedBy: Schema.TaggedStruct<"human", {
                readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                readonly actingFor: Schema.TaggedUnion<{
                    readonly entity: Schema.TaggedStruct<"entity", {
                        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                    }>;
                    readonly counterparty: Schema.TaggedStruct<"counterparty", {
                        readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                    }>;
                }>;
            }>;
            readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        }>;
        readonly payrollCountry: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly taxResidence: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly workLocation: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly timeZone: Schema.optional<Schema.String>;
        readonly withholdingRegime: Schema.String;
        readonly socialSecurityRegimes: Schema.$Array<Schema.String>;
        readonly fteBps: Schema.Number;
        readonly workCalendar: Schema.optional<Schema.NonEmptyString>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>>>;
    readonly workCalendars: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly jurisdiction: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly weekendDays: Schema.$Array<Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>>;
        readonly standardDayMinutes: Schema.Number;
        readonly holidayPacks: Schema.$Array<Schema.NonEmptyString>;
    }>>>;
    readonly holidayPacks: Schema.optional<Schema.$Record<Schema.String, Schema.Struct<{
        readonly jurisdiction: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly edition: Schema.NonEmptyString;
        readonly status: Schema.Literals<readonly ["needs-verification", "adopter-verified"]>;
        readonly citations: Schema.optional<Schema.$Array<Schema.NonEmptyString>>;
        readonly entries: Schema.$Array<Schema.Struct<{
            readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly name: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["public", "bank", "restricted", "company"]>;
            readonly status: Schema.Literals<readonly ["provisional", "confirmed"]>;
        }>>;
    }>>>;
    readonly currencies: Schema.optional<Schema.$Array<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>>;
    readonly countries: Schema.optional<Schema.$Array<Schema.brand<Schema.String, "keiretsu/CountryCode">>>;
}>;
/**
 * What an adopter authors: the encoded (plain JSON) side of {@link KeiretsuInput}.
 *
 * @since 0.1.0
 * @category models
 */
export type KeiretsuInput = typeof KeiretsuInput.Encoded;
/**
 * The decoded configuration.
 *
 * @since 0.1.0
 * @category models
 */
export type DecodedInput = typeof KeiretsuInput.Type;
/**
 * A flat literal key space. Every downstream API is generic over `K extends KeySpace`.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeySpace {
    readonly entity: string;
    readonly counterparty: string;
    readonly person: string;
    readonly system: string;
    readonly currency: string;
    readonly country: string;
}
type Field<T, F extends string> = T extends {
    readonly [P in F]?: infer V;
} ? V : never;
type KeysOf<T> = T extends Readonly<Record<string, unknown>> ? Extract<keyof T, string> : never;
type ElementOf<T> = T extends ReadonlyArray<infer X> ? X : never;
type TimelineValue<T> = T extends ReadonlyArray<infer S> ? (S extends {
    readonly value: infer V;
} ? V : never) : T;
type ValuesOf<T> = T[keyof T];
type EntitiesOf<C extends KeiretsuInput> = C['entities'];
type CounterpartiesOf<C extends KeiretsuInput> = Field<C, 'counterparties'>;
type EntityCurrencies<C extends KeiretsuInput> = ValuesOf<{
    [E in keyof EntitiesOf<C>]: TimelineValue<EntitiesOf<C>[E]['functionalCurrency']> | Field<EntitiesOf<C>[E], 'reportingCurrency'>;
}>;
type EntityCountries<C extends KeiretsuInput> = ValuesOf<{
    [E in keyof EntitiesOf<C>]: EntitiesOf<C>[E]['jurisdiction']['country'];
}>;
type CounterpartyCountries<C extends KeiretsuInput> = ValuesOf<{
    [P in keyof CounterpartiesOf<C>]: CounterpartiesOf<C>[P] extends {
        readonly jurisdiction: {
            readonly country: infer Country;
        };
    } ? Country : never;
}>;
/**
 * Derive the literal key space of a config declared `as const satisfies KeiretsuInput`.
 *
 * - `entity`, `counterparty`, `person`, `system`: the declared record keys
 * - `currency`: functional and reporting currencies plus `currencies`
 * - `country`: entity and counterparty jurisdictions plus `countries`
 *
 * @since 0.1.0
 * @category models
 */
export type KeySpaceOf<C extends KeiretsuInput> = {
    readonly entity: Extract<keyof EntitiesOf<C>, string>;
    readonly counterparty: KeysOf<CounterpartiesOf<C>>;
    readonly person: KeysOf<Field<C, 'people'>>;
    readonly system: KeysOf<Field<C, 'systems'>>;
    readonly currency: Extract<EntityCurrencies<C> | ElementOf<Field<C, 'currencies'>>, string>;
    readonly country: Extract<EntityCountries<C> | CounterpartyCountries<C> | ElementOf<Field<C, 'countries'>>, string>;
};
/**
 * Party keys of a key space: entities, counterparties and people (one namespace).
 *
 * @since 0.1.0
 * @category models
 */
export type PartyKeyOf<K extends KeySpace> = K['entity'] | K['counterparty'] | K['person'];
export {};
//# sourceMappingURL=KeiretsuInput.d.ts.map