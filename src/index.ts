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

type Codepoints = {
	ucs: string;
} & Partial<Record<Exclude<CpType, 'ucs'>, string>>;
type Radicals = {
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
	misc: Misc;
	dicNumbers?: DicNumbers;
	queryCodes: QueryCode[];
	readings?: Readings;
	meanings?: Meanings;
	nanoris?: string[];
}

async function buildData() {
	const rawdata = await fs.readFile(
		`${__dirname}/../raw/kanjidic2.xml`,
		'utf-8',
	);
	const {kanjidic2} = await parseStringPromise(rawdata, {
		explicitArray: true,
		// valueProcessors: [processors.parseNumbers],
	});

	const characters: KanjiDic2CharacterRaw[] = kanjidic2.character;

	// console.log([
	// 	...new Set(
	// 		characters
	// 			// .filter((c) => c.reading_meaning?.[0].rmgroup?.[0].meaning)
	// 			.flatMap((char) => {
	// 				return char.dic_number?.[0].dic_ref.flatMap((x) => typeof x._);
	// 			}),
	// 	),
	// ]);
	// characters.forEach((char) => {
	// 	if (char.dic_number === undefined) {
	// 		console.log(JSON.stringify(char, null, 2));
	// 	}
	// 	char.dic_number[0].dic_ref.forEach((x) => {
	// 		if (x.$.m_vol) {
	// 			console.log(x.$.m_vol);
	// 			if (isNaN(Number(x.$.m_page))) {
	// 				console.log(x.$.m_page);
	// 			}
	// 		}
	// 	});
	// });
	// 	// if (
	// 	// 	char.dic_number?.[0].dic_ref.forEach(x => typeof Number(x.$.m_page))
	// 	// 		qc.q_code.some(
	// 	// 			(q) => q.$.qc_type === 'skip' && q.$.skip_misclass === undefined,
	// 	// 		),
	// 	// 	)
	// 	// ) {
	// 	// 	throw new Error(`something is wrong with character ${char.literal}`);
	// 	// }
	//
	// 	// const cp_values = character.codepoint.cp_value;
	// 	// if (cp_values.some((v) => Object.keys(v.$).length > 1)) {
	// 	// 	throw new Error(`something is wrong with character ${character.literal}`);
	// 	// }
	// });

	const json = characters.map((c) => {
		// const json = characters.slice(5, 6).map((c) => {
		const character: Partial<KanjiDic2Character> = {
			literal: c.literal[0],
		};
		/* Codepoints */
		const codepoints = Object.fromEntries(
			c.codepoint[0].cp_value.map((c) => [c.$.cp_type, c._]),
		);
		if (!('ucs' in codepoints)) {
			throw new Error('"ucs" not found.');
		}
		character.codepoints = codepoints as Codepoints;

		/* Radicals */
		const radicals = Object.fromEntries(
			c.radical[0].rad_value.map((c) => [c.$.rad_type, c._]),
		);
		if (!('classical' in radicals)) {
			throw new Error('"classical" not found.');
		}
		character.radicals = radicals as Radicals;

		/* Misc */
		const misc = c.misc[0];
		character.misc = {
			strokeCounts: misc.stroke_count.map((stroke) =>
				Number(stroke),
			) as KanjiDic2Character['misc']['strokeCounts'],
		};
		if (misc.grade) {
			character.misc.grade = Number(misc.grade[0]);
		}
		if (misc.freq) {
			character.misc.freq = Number(misc.freq[0]);
		}
		if (misc.jlpt) {
			// TODO: need modern JLPT...
			character.misc.jlpt = Number(
				misc.jlpt,
			) as KanjiDic2Character['misc']['jlpt'];
		}
		if (misc.variant) {
			const variants = misc.variant.map((v) => ({
				type: v.$.var_type,
				value: v._,
			}));
			character.misc.variants = variants;
		}

		/* Dic Numbers */
		if (c.dic_number) {
			const dicNumbers = Object.fromEntries(
				c.dic_number[0].dic_ref.flatMap((dn) => {
					const pairs = [[dn.$.dr_type, dn._]];
					if (dn.$.m_vol) {
						pairs.push(['m_vol', dn.$.m_vol]);
					}
					if (dn.$.m_page) {
						pairs.push(['m_page', dn.$.m_page]);
					}
					return pairs;
				}),
			);
			character.dicNumbers = dicNumbers;
		}

		/* Query Codes */
		const queryCodes = c.query_code[0].q_code.map((dn) => ({
			type: dn.$.qc_type,
			value: dn._,
			...(dn.$.skip_misclass ? {skip_misclass: dn.$.skip_misclass} : {}),
		}));
		character.queryCodes = queryCodes;

		if (c.reading_meaning) {
			/* Readings */
			if (c.reading_meaning[0].rmgroup[0].reading) {
				character.readings = Object.fromEntries(
					c.reading_meaning[0].rmgroup[0].reading.map((r) => [r.$.r_type, r._]),
				);
			}
			/* Meanings */
			if (c.reading_meaning[0].rmgroup[0].meaning) {
				character.meanings = {};
				for (const meaning of c.reading_meaning[0].rmgroup[0].meaning) {
					const lang = typeof meaning === 'string' ? 'en' : meaning.$.m_lang;
					const value = typeof meaning === 'string' ? meaning : meaning._;
					(character.meanings[lang] ??= []).push(value);
				}
			}
			/* Nanoris */
			if (c.reading_meaning[0].nanori) {
				character.nanoris = c.reading_meaning[0].nanori;
			}
		}

		return character;
	});

	fs.writeFile(`${__dirname}/../DATA.JSON`, JSON.stringify(json));
}

await buildData();
