// @flow strict

import { EOL, ReadableStream } from "./package.js"

/*::
type USVString = string
export type BlobPart =
  | BufferSource
  | Blob
  | USVString

export type BlobPropertyBag = {
  type?: string;
  endings?:EndingType;
}

export type EndingType =
  | "transparent"
  | "native"

type Part =
  | Buffer
  | BlobAPI

interface BlobAPI {
  +size:number;
  +type:string;
  slice(start?:number, end?:number, type?:string):BlobAPI;
  text():Promise<string>;
  arrayBuffer():Promise<ArrayBuffer>;
  stream():ReadableStream;
}
*/

const noparts = []
const noopitons = {}
const nointernalparts = []

const $type = Symbol("Blob.prototype.type")
const $size = Symbol("Blob.prototype.size")
const $parts = Symbol("parts")

export const $arrayBuffer = Symbol("Blob.prototype.arrayBuffer")
export const $text = Symbol("Blob.prototype.text")
export const $stream = Symbol("Blob.prototype.stream")

export class Blob {
  constructor(
    parts /*:BlobPart[]*/ = noparts,
    options /*:BlobPropertyBag*/ = noopitons
  ) {
    const { type, endings } = options
    const chunks = []
    let size = 0
    for (const part of parts) {
      if (typeof part === "string") {
        const chunk =
          endings === "native"
            ? Buffer.from(convertLineEndingsToNative(part))
            : Buffer.from(part)
        chunks.push(chunk)
        size += chunk.length
      } else if (part instanceof Buffer) {
        const { length } = part
        if (length > 0) {
          chunks.push(part)
          size + part.length
        }
      } else if (part instanceof Blob) {
        const blob /*:BlobAPI*/ = part
        chunks.push(blob)
        size += part.size
      } else if (part instanceof ArrayBuffer) {
        const { byteLength } = part
        if (byteLength > 0) {
          const chunk = Buffer.from(part)
          chunks.push(chunk)
          size += byteLength
        }
      } else if (ArrayBuffer.isView(part)) {
        const { byteLength } = part
        if (byteLength > 0) {
          const chunk = Buffer.from(
            part.buffer,
            part.byteOffset,
            part.byteLength
          )
          chunks.push(chunk)
          size += byteLength
        }
      } else {
        const blob = BlobAdapter.from(part)
        if (blob.size > 0) {
          chunks.push(blob)
          size + blob.size
        }
      }
    }

    setBlobState(this, size, type || "", chunks)
  }
  get size() /*:number*/ {
    const self /*:any*/ = this
    return self[$size]
  }
  get type() /*:string*/ {
    const self /*:any*/ = this
    return self[$type]
  }
  slice(
    start /*:number*/ = 0,
    end /*:number*/ = this.size,
    type /*:string*/ = ""
  ) /*:Blob*/ {
    const { size } = this
    const from = start < 0 ? Math.max(size + start, 0) : Math.min(start, size)
    const to = end < 0 ? Math.max(size + end) : Math.min(end, size)
    const byteLength = Math.max(to - from, 0)
    const blob = new Blob()
    if (byteLength === 0) {
      return setBlobState(blob, 0, type)
    } else if (size === byteLength) {
      return setBlobState(blob, byteLength, type, Blob$parts(this))
    } else {
      const parts = Blob$sliceParts(this, from, to)
      return setBlobState(blob, byteLength, type, parts)
    }
  }

  async text() /*:Promise<string>*/ {
    let text = ""
    for (const part of Blob$parts(this)) {
      if (part instanceof Buffer) {
        text += part.toString("utf-8")
      } else {
        text += await part.text()
      }
    }
    return text
  }
  async arrayBuffer() /*:Promise<ArrayBuffer>*/ {
    const buffers = []
    for (const part of Blob$parts(this)) {
      if (part instanceof Buffer) {
        buffers.push(part)
      } else if (part instanceof Blob) {
        const buffer = await part.arrayBuffer()
        buffers.push(Buffer.from(buffer))
      }
    }
    return toArrayBuffer(Buffer.concat(buffers))
  }
  stream() /*:ReadableStream*/ {
    return ReadableStream$fromAsyncIterable(() => Blob$iterate(this))
  }
  toString() /*:"[object Blob]"*/ {
    return "[object Blob]"
  }
}

Object.defineProperty(Blob.prototype, $arrayBuffer, {
  value: Blob.prototype.arrayBuffer,
  writable: false,
  configurable: false,
  enumerable: false
})

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
  value: "Blob",
  writable: false,
  enumerable: false,
  configurable: true
})

class BlobAdapter {
  /*::
  +size:number
  +type:string
  +source:any
  */
  static from(value /*:any*/) /*:BlobAdapter*/ {
    if (
      value != null &&
      typeof value.size === "number" &&
      typeof value.type === "string" &&
      typeof value.slice === "function" &&
      (typeof value[$arrayBuffer] === "function" ||
        typeof value[$text] === "function" ||
        typeof value[$stream] === "function")
    ) {
      const { size, type } = value
      return new BlobAdapter(size, type, value)
    } else {
      throw new TypeError(`Passed value is not a valid BlobPart`)
    }
  }
  constructor(size, type, source) {
    this.size = size
    this.type = type
    this.source = source
  }
  async text() {
    const { source, size } = this
    if (source[$text]) {
      return await source[$text]()
    } else {
      const buffer = await this.arrayBuffer()
      return Buffer.from(buffer).toString("utf-8")
    }
  }
  async arrayBuffer() /*:Promise<ArrayBuffer>*/ {
    const { source } = this
    if (source[$arrayBuffer]) {
      const buffer /*:ArrayBuffer*/ = await source[$arrayBuffer]()
      return buffer
    }

    if (source[$text]) {
      const text = await source[$text]()
      return toArrayBuffer(Buffer.from(text))
    }

    if (source[$stream]) {
      const stream /*:ReadableStream*/ = source[$stream]()
      const chunks = await ReadableStream$all(stream)
      return toArrayBuffer(Buffer.concat(chunks))
    }

    throw TypeError("Invalid Blob")
  }
  stream() {
    const { source } = this
    if (source[$stream]) {
      return source[$stream]()
    } else if (source[$arrayBuffer]) {
      return ReadableStream$fromArrayBufferPromise(this.arrayBuffer())
    } else if (source[$text]) {
      return ReadableStream$fromArrayBufferPromise(this.arrayBuffer())
    } else {
      throw TypeError("Invalid Blob")
    }
  }
  slice(start = 0, end = this.size, type = "") {
    const { size } = this
    const from = start < 0 ? Math.max(size + start, 0) : Math.min(start, size)
    const to = end < 0 ? Math.max(size + end) : Math.min(end, size)
    const slice = this.source.slice(from, to, type)
    return slice instanceof Blob ? slice : BlobAdapter.from(slice)
  }
}

const ReadableStream$all = async (stream /*:any*/) /*:Promise<Buffer[]>*/ => {
  const buffers = []
  for await (const chunk of stream) {
    buffers.push(chunk)
  }
  return buffers
}

const ReadableStream$fromArrayBufferPromise = promise =>
  ReadableStream$fromAsyncIterable(async function*() {
    const buffer = await promise
    yield new Uint8Array(buffer)
  })

const Blob$parts = (blob /*:Blob*/) /*:Part[]*/ => {
  const anyBlob /*:any*/ = blob
  return anyBlob[$parts]
}

const Blob$sliceParts = (
  blob /*:Blob*/,
  start /*:number*/,
  end /*:number*/
) /*:Part[]*/ => {
  const parts = Blob$parts(blob).slice(0)
  let startOffset = 0
  let endOffset = blob.size

  let index = 0
  while (startOffset < start) {
    const part = parts[index++]
    const size = part instanceof Buffer ? part.length : part.size
    startOffset += size

    if (startOffset > start) {
      parts.splice(0, index)
      parts.unshift(part.slice(size - (startOffset - start)))
    } else if (startOffset === start) {
      parts.splice(0, index)
    }
  }

  index = parts.length - 1
  while (endOffset > end) {
    const part = parts[index--]
    const size = part instanceof Buffer ? part.length : part.size
    endOffset -= size

    if (endOffset < end) {
      parts.splice(index, parts.length)
      parts.push(part.slice(0, end - endOffset))
    } else if (endOffset === end) {
      parts.splice(index + 1, parts.length)
    }
  }

  return parts
}

const Blob$iterate = async function*(blob /*:Blob*/) {
  for (const part of Blob$parts(blob)) {
    if (part instanceof Buffer) {
      yield part
    } else {
      const stream /*:any*/ = part.stream()
      yield* stream
    }
  }
}
const convertLineEndingsToNative = text => text.replace(/\r\n|\r|\n/g, EOL)

const ReadableStream$fromAsyncIterable = (
  init /*:() => AsyncIterator<Uint8Array>*/
) => new ReadableStream(new Pump(init))

const toArrayBuffer = ({ buffer, byteOffset, length } /*:Buffer*/) =>
  buffer.slice(byteOffset, byteOffset + length)

class Pump {
  /*::
  init:() => AsyncIterator<Uint8Array>
  controller:ReadableStreamController
  chunks:AsyncIterator<Uint8Array>
  isWorking:boolean
  isCancelled:boolean
  cancel:*
  start:*
  pull:*
  */
  constructor(init /*:() => AsyncIterator<Uint8Array>*/) {
    this.init = init
  }
  start(controller) {
    this.controller = controller
    this.chunks = this.init()
    this.work()
    this.isWorking = false
    this.isCancelled = false
  }
  async work() {
    const { controller, chunks } = this
    while (!this.isCancelled && controller.desiredSize > 0) {
      this.isWorking = true
      try {
        const next = await chunks.next()
        if (!next.done && !this.isCancelled) {
          controller.enqueue(next.value)
        } else {
          controller.close()
        }
      } catch (error) {
        this.isWorking = false
        controller.error(error)
      }
    }
    this.isWorking = false
  }
  pull() {
    if (!this.isWorking) {
      this.work()
    }
  }
  cancel() {
    this.isCancelled = true
  }
}

const setBlobState = (
  blob /*:Blob*/,
  size /*:number*/,
  type /*:string*/ = "",
  parts /*:Part[]*/ = nointernalparts
) /*:Blob*/ => {
  const anyBlob /*:self*/ = blob
  anyBlob[$type] = /[^\u0020-\u007E]/.test(type) ? "" : type.toLowerCase()
  anyBlob[$size] = size
  anyBlob[$parts] = parts
  return blob
}
