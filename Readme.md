# @web-std/blob

![Node.js CI][node.js ci]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

Web API compatible [Blob][] for nodejs.

## Comparison to Alternatives

#### [fetch-blob][]

The reason this library exists is because [fetch-blob][] chooses to compromise
Web API compatibility of [`blob.stream()`][w3c blob.stream] by useing nodejs
native [Readable][] stream. We found this to be problematic when sharing code
across nodejs and browser rutimes. Instead this library stays true to the
specification by using [ReadableStream][] implementation from [web-streams-polyfill][]
library even if that is less convinient in nodejs context.

> Note: Both node [Readable][] streams and web [ReadableStream][] implement
> `AsyncIterable` intreface and in theory either could be used with [for await][]
> loops. In practice however major browsers do not yet ship `AsyncIterable`
> support for [ReadableStream][]s wich in our experience makes choice made by
> [node-fetch][] impractical.

[fetch-blob][] is build around node [Buffer][]s. This implementation is built
around standard [Uint8Array][]s.

[fetch-blob] chooses to use [WeakMap][]s for encapsulating private state. This
library chooses to use to use properties with names that start with `_`. While
those properties aren't truly private they do have better performance profile
and make it possible to interop with this library, which we found impossible
to do with [node-fetch][].

### Usage

```js
import { Blob } from "@web-std/blob"
const blob = new Blob(["hello", new TextEncoder().encode("world")])
for await (const chunk of blob.stream()) {
  console.log(chunk)
}
```

### Usage from Typescript

This library makes use of [typescript using JSDOC annotations][ts-jsdoc] and
also generates type difinitions along with typed definition maps. So you should
be able to get all the type innference out of the box.

## Install

    npm install @web-std/blob

[node.js ci]: https://github.com/web-std/blob/workflows/Node.js%20CI/badge.svg
[version.icon]: https://img.shields.io/npm/v/@web-std/blob.svg
[downloads.icon]: https://img.shields.io/npm/dm/@web-std/blob.svg
[package.url]: https://npmjs.org/package/@web-std/blob
[downloads.image]: https://img.shields.io/npm/dm/@web-std/blob.svg
[downloads.url]: https://npmjs.org/package/@web-std/blob
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
[blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
[fetch-blob]: https://github.com/node-fetch/fetch-blob
[readablestream]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
[readable]: https://nodejs.org/api/stream.html#stream_readable_streams
[w3c blob.stream]: https://w3c.github.io/FileAPI/#dom-blob-stream
[web-streams-polyfill]:https://www.npmjs.com/package/web-streams-polyfill
[for await]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
[buffer]: https://nodejs.org/api/buffer.html
[weakmap]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[ts-jsdoc]: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
[Uint8Array]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[node-fetch]:https://github.com/node-fetch/
