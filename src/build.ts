import fs from 'fs/promises';
import {parseStringPromise, processors} from 'xml2js';
import type {
	Codepoints,
	KanjiDic2Character,
	KanjiDic2CharacterRaw,
	Radicals,
} from './types.js';
const __dirname = import.meta.dirname;

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
			c.radical[0].rad_value.map((c) => [c.$.rad_type, Number(c._)]),
		);
		if (!('classical' in radicals)) {
			throw new Error('"classical" not found.');
		}
		character.radicals = radicals as Radicals;

		/* Misc */
		const misc = c.misc[0];
		character.strokeCounts = misc.stroke_count.map((stroke) =>
			Number(stroke),
		) as KanjiDic2Character['strokeCounts'];
		if (misc.grade) {
			character.grade = Number(misc.grade[0]);
		}
		if (misc.freq) {
			character.freq = Number(misc.freq[0]);
		}
		if (misc.jlpt) {
			// TODO: need modern JLPT...
			character.jlpt = Number(misc.jlpt) as KanjiDic2Character['jlpt'];
		}
		if (misc.variant) {
			const variants = misc.variant.map((v) => ({
				type: v.$.var_type,
				value: v._,
			}));
			character.variants = variants;
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

		return character as KanjiDic2Character;
	});

	fs.writeFile(`${__dirname}/../KANJIS.json`, JSON.stringify(json));
}

await buildData();
