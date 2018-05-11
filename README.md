# json5-writer
> Comment-preserving JSON5 parser

json5-writer provides an API for parsing JSON5 without losing comments or formatting. It does this by transforming JSON5 into a JavaScript AST and using [jscodeshift](https://github.com/facebook/jscodeshift) to update values.

## Example
`config.json5`:
```json5
{
  // actions
  'eat honey': {
    cooldown: 4,
  },

  // Note: A day without a friend is like a pot without a single drop of honey left inside.

  // entities
  'bear':  {
    actions: [ 'eat honey' ],
    canSpeak: true,
  },
}
```

`updateConfig.js`:
```js
const json5Writer = require('json5-writer')
const config = fs.readFileSync('config.json5', 'utf-8')
const writer = json5Writer.load(config)
writer.write({
  'eat honey': { cooldown: 3 },
  speak: { cooldown: 2 },
  bear: { actions: ['eat honey', 'speak'] },
})
fs.writeFileSync('config.json5', writer.toSource(), 'utf-8')
```

`config.json5` diff:
```diff
 {
   // actions
   'eat honey': {
-    cooldown: 4,
+    cooldown: 3,
   },
+
+  'speak': {
+    cooldown: 2,
+  },

   // Note: A day without a friend is like a pot without a single drop of honey left inside.

   // entities
   'bear':  {
-    actions: [ 'eat honey' ],
-    canSpeak: true,
+    actions: ['eat honey', 'speak'],
   },
 }
```

## Installation
```sh
npm install --save json5-writer
```

## Usage
```js
const writerInstance = json5Writer.load(json)
writerInstance.write(value) // write an object or array to JSON5
const ast = writerInstance.ast // provides direct access to AST with jscodeshift API.
const newJson = writerInstance.toSource(options)
```

#### `.write(value)`
Writes an object or array to JSON5. Any field or property that doesn't exist in `value` is removed from the JSON5.

To keep an existing value, use `undefined`:
```js
const writer = json5Writer.load(`[{ name: 'Noah' }, { name: 'Nancy' }]`)
writer.write([{ name: undefined, age: 28 }, undefined ])
write.toSource() // [{ name: 'Noah', age: 28 }, { name: 'Nancy' }]
```

#### `.ast`
Directly access the JSON5 turned JavaScript AST, wrapped in the [jscodeshift API](https://github.com/facebook/jscodeshift#the-jscodeshift-api).

```
const writer = json5Writer.load([1, 2, 3, 4])
writer.ast.find(j.Literal).forEach(path => {
  if (path.value.value % 2 === 0) path.value.value = 0
})
write.toSource() // [1, 0, 3, 0]
```

#### `.toSource(options)`
Write loaded JSON5 to a string.

`options` control what is output. By default, single quotes and trailing commas are enabled.

`.toSource({quote: 'double'}) // sets strings to use double quotes in transformed code`

See the list of options [here](https://github.com/benjamn/recast/blob/52a7ec3eaaa37e78436841ed8afc948033a86252/lib/options.js#L61).
