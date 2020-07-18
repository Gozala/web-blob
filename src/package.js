import { TextEncoder, TextDecoder } from "util"
import streams from "web-streams-polyfill"

const { ReadableStream: ReadableStreamPolyfill } = streams
/** @type {typeof window.ReadableStream} */
export const ReadableStream = ReadableStreamPolyfill

export { TextEncoder, TextDecoder }
