type CpType = 'ucs' | 'jis208' | 'jis212' | 'jis213';
type ExtendedCpType =
	| CpType
	| 'nelson_c'
	| 'deroo'
	| 'oneill'
	| 'njecd'
	| 's_h';
type CpValueRaw = {
	_: string;
	$: {cp_type: CpType}; // 'ucs' will always exist
};

type RadType = 'classical' | 'nelson_c';
type RadValueRaw = {
	/** Converted to number in JSON */
	_: string;
	$: {rad_type: 'classical' | 'nelson_c'}; // 'clasical' will always exist
};

type DrType =
	| 'busy_people'
	| 'nelson_c'
	| 'nelson_n'
	| 'halpern_njecd'
	| 'halpern_kkd'
	| 'halpern_kkld'
	| 'halpern_kkld_2ed'
	| 'heisig'
	| 'heisig6'
	| 'gakken'
	| 'oneill_names'
	| 'oneill_kk'
	| 'moro'
	| 'henshall'
	| 'henshall3'
	| 'sh_kk'
	| 'sh_kk2'
	| 'sakade'
	| 'jf_cards'
	| 'tutt_cards'
	| 'crowley'
	| 'kanji_in_context'
	| 'kodansha_compact'
	| 'maniette';

type QcType = 'skip' | 'sh_desc' | 'four_corner' | 'deroo';
type SkipMisClassType =
	| 'stroke_diff'
	| 'posn'
	| 'stroke_count'
	| 'stroke_and_posn';

type ReadingType =
	| 'pinyin'
	| 'korean_r'
	| 'korean_h'
	| 'vietnam'
	| 'ja_on'
	| 'ja_kun';

type MeanLang = 'fr' | 'es' | 'pt';

/** Converted to number in JSON */
type StrokeCountRaw =
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6'
	| '7'
	| '8'
	| '9'
	| '10'
	| '11'
	| '12'
	| '13'
	| '14'
	| '15'
	| '16'
	| '17'
	| '18'
	| '19'
	| '20'
	| '21'
	| '22'
	| '23'
	| '24'
	| '25'
	| '26'
	| '27'
	| '28'
	| '29'
	| '30'
	| '31'
	| '32'
	| '33'
	| '34';

export interface KanjiDic2CharacterRaw {
	literal: [string];
	codepoint: [
		{
			/**
			 * 2 or 3 values
			 */
			cp_value: [CpValueRaw, CpValueRaw] | [CpValueRaw, CpValueRaw, CpValueRaw];
		},
	];
	radical: [
		{
			/**
			 * 1 or 2 values
			 */
			rad_value: [RadValueRaw] | [RadValueRaw, RadValueRaw];
		},
	];
	misc: [
		{
			/** Converted to number in JSON */
			grade?: [string];
			stroke_count:
				| [StrokeCountRaw]
				| [StrokeCountRaw, StrokeCountRaw]
				| [StrokeCountRaw, StrokeCountRaw, StrokeCountRaw];
			variant?: {
				_: string;
				$: {
					var_type: ExtendedCpType;
				};
			}[];
			/** Converted to number in JSON */
			freq?: [string];
			/**
			 * Converted to number in JSON
			 *
			 * @deprecated
			 */
			jlpt?: ['1' | '2' | '3' | '4'];
		},
	];

	dic_number?: [
		{
			dic_ref: {
				_: string;
				$: {
					dr_type: DrType;
					/**
					 * for moro
					 */
					m_vol?: string;
					/**
					 * for moro
					 */
					m_page?: string;
				};
			}[];
		},
	];

	query_code: [
		{
			q_code: {
				_: string;
				$: {
					qc_type: QcType;
					skip_misclass?: SkipMisClassType;
				};
			}[];
		},
	];

	reading_meaning?: [
		{
			rmgroup: [
				{
					reading: {
						_: string;
						$: {
							r_type: ReadingType;
						};
					}[];
					meaning?: (string | {_: string; $: {m_lang: MeanLang}})[];
				},
			];
			nanori?: string[];
		},
	];
}

export type Codepoints = {
	ucs: string;
} & Partial<Record<Exclude<CpType, 'ucs'>, string>>;
export type Radicals = {
	classical: number;
} & Partial<Record<Exclude<RadType, 'classical'>, number>>;
type Range<
	N extends number,
	Acc extends number[] = [],
> = Acc['length'] extends N ? Acc[number] : Range<N, [...Acc, Acc['length']]>;
type StrokeCount = Exclude<Range<35>, 0>;

interface Misc {
	grade?: number;
	/**
	 * Can have one, two or three values (...)
	 */
	strokeCounts:
		| [StrokeCount]
		| [StrokeCount, StrokeCount]
		| [StrokeCount, StrokeCount, StrokeCount];
	freq?: number;
	jlpt?: 1 | 2 | 3 | 4 | 5;
	variants?: {type: ExtendedCpType; value: string}[];
}

type DicNumbers = Partial<Record<DrType, string>> & {
	m_vol?: string; // Optional volume for Moro
	m_page?: string; // Optional page for Moro
};

// type QueryCodes = Partial<Record<QcType, string>> & {
// 	skip_misclass?: SkipMisClassType; // Optional when skip is present
// };
type QueryCode =
	| {type: QcType; value: string}
	| {type: 'skip'; value: string; skip_misclass?: SkipMisClassType};

type Readings = Partial<Record<ReadingType, string[]>>;
type Meanings = Partial<Record<MeanLang | 'en', string[]>>;

export interface KanjiDic2Character {
	literal: string;
	codepoints: Codepoints;
	radicals: Radicals;
	grade?: number;
	/**
	 * Can have one, two or three values (...)
	 */
	strokeCounts:
		| [StrokeCount]
		| [StrokeCount, StrokeCount]
		| [StrokeCount, StrokeCount, StrokeCount];
	freq?: number;
	jlpt?: 1 | 2 | 3 | 4 | 5;
	variants?: {type: ExtendedCpType; value: string}[];
	dicNumbers?: DicNumbers;
	queryCodes: QueryCode[];
	readings?: Readings;
	meanings?: Meanings;
	nanoris?: string[];
}
