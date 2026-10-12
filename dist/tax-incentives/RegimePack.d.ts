import { IncentiveRegime } from './IncentiveRegime.ts';
/**
 * Stable ids of the example regimes.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const ExampleRegimeIds: {
    readonly usIrc41: "01920000-0000-7000-8000-000000000041";
    readonly usIrc174A: "01920000-0000-7000-8000-00000000174a";
    readonly usIrc174Foreign: "01920000-0000-7000-8000-00000000174f";
    readonly usPaResearchCredit: "01920000-0000-7000-8000-00000000a001";
    readonly inSection35: "01920000-0000-7000-8000-000000000035";
    readonly pkSection154A: "01920000-0000-7000-8000-00000000154a";
};
/**
 * Decode the example pack. Evaluated on call so importing the module costs nothing.
 *
 * @since 0.1.0
 * @category data
 */
export declare const examplePack: () => ReadonlyArray<IncentiveRegime>;
//# sourceMappingURL=RegimePack.d.ts.map