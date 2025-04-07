import fs from 'fs/promises';
import {parseStringPromise, processors} from 'xml2js';
const __dirname = import.meta.dirname;

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
	_: number;
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

interface KanjiDic2CharacterRaw {
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
			jlpt?: [1 | 2 | 3 | 4];
		},
	];

	dic_number?: [
		{
			dic_ref: {
				/** Converted to number in JSON */
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

type Codepoint = {
	ucs: string;
} & Partial<Record<Exclude<CpType, 'ucs'>, string>>;
type Radical = {
	classical: number;
} & Partial<Record<Exclude<RadType, 'classical'>, number>>;
type Range<
	N extends number,
	Acc extends number[] = [],
> = Acc['length'] extends N ? Acc[number] : Range<N, [...Acc, Acc['length']]>;
type StrokeCount = Exclude<Range<35>, 0>;

type DicNumber = Partial<Record<DrType, number>> & {
	m_vol?: string; // Optional volume for Moro
	m_page?: string; // Optional page for Moro
};

type QueryCode = Partial<Record<QcType, string>> & {
	skip_misclass?: SkipMisClassType; // Optional when skip is present
};

type Reading = Partial<Record<ReadingType, string[]>>;
type Meaning = Partial<Record<MeanLang | 'en', string[]>>;

export interface KanjiDic2Character {
	literal: string;
	codepoint: Codepoint;
	radical: Radical;
	misc: {
		grade?: number;
		/**
		 * Can have one, two or three values (...)
		 */
		strokeCount:
			| [StrokeCount]
			| [StrokeCount, StrokeCount]
			| [StrokeCount, StrokeCount, StrokeCount];
		freq?: number;
		jlpt?: 1 | 2 | 3 | 4 | 5;
		variant?: [{type: ExtendedCpType; value: string}];
	};
	dicNumber?: DicNumber;
	queryCode: QueryCode;
	reading?: Reading;
	meaning?: Meaning;
	nanori?: string[];
}

async function buildData() {
	const rawdata = await fs.readFile(
		`${__dirname}/../raw/kanjidic2.xml`,
		'utf-8',
	);
	const {kanjidic2} = await parseStringPromise(rawdata, {
		explicitArray: true,
		valueProcessors: [processors.parseNumbers],
	});

	const characters: KanjiDic2CharacterRaw[] = kanjidic2.character;

	// const test: KanjiDic2Character = characters[1];
	// console.log(JSON.stringify(test));

	// All possible values in codepoint
	console.log([
		...new Set(
			characters
				// .filter((c) => c.reading_meaning?.[0].rmgroup?.[0].meaning)
				.flatMap((char) => {
					return char.dic_number?.[0].dic_ref
						.filter((x) => x.$.m_page)
						.flatMap((x) => typeof x.$.m_page);
				}),
		),
	]);
	characters.forEach((char) => {
		char.dic_number?.[0].dic_ref.forEach((x) => {
			if (x.$.m_vol) {
				console.log(x.$.m_vol);
				if (isNaN(Number(x.$.m_page))) {
					console.log(x.$.m_page);
				}
			}
		});
		// if (
		// 	char.dic_number?.[0].dic_ref.forEach(x => typeof Number(x.$.m_page))
		// 		qc.q_code.some(
		// 			(q) => q.$.qc_type === 'skip' && q.$.skip_misclass === undefined,
		// 		),
		// 	)
		// ) {
		// 	throw new Error(`something is wrong with character ${char.literal}`);
		// }

		// const cp_values = character.codepoint.cp_value;
		// if (cp_values.some((v) => Object.keys(v.$).length > 1)) {
		// 	throw new Error(`something is wrong with character ${character.literal}`);
		// }
	});
}

await buildData();
