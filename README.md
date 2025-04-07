# kanjidic2-json

This project was used to convert [KANJIDIC2 XML Dataset](https://www.edrdg.org/kanjidic/kanjd2index_legacy.html) to a more down-to-earth JSON structure that can be used to interrogate KANJI-related data in a more human-readable fashion.

The resulting data has conveniently be pushed to the repository (`KANJIS.json` file).

Keep in mind that I don't hold any rights to the data, and by using this data you agree to the licence linked to the original data (see the anchor above.)

## Usage

You can either directly work with the file `KANJIS.json`, but in this case you'd have to figure out how structured is the data.

Another more convenient way is to use the NodeJS ESM module with available typings.

- Install the library in your project:

```bash
npm i -D kanjidic2-json
```

- Use it in your program:

```js
import KANJIS from 'kanjidic2-json' with {type: 'json'};
```

**Note: If you are using TypeScript, you need to set `"resolveJsonModule"` to `true` in your configuration file.**
