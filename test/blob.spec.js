import * as lib from "../src/lib.js"
import { Blob } from "../src/lib.js"
import { test } from "./test.js"

test("test baisc", async (test) => {
  test.isEqual(typeof lib.Blob, "function")
})

test("test jsdom", async (test) => {
  const blob = new Blob(["TEST"])
  test.isEqual(blob.size, 4, "Initial blob should have a size of 4")
})

test("should encode a blob with proper size when given two strings as arguments", async (test) => {
  const blob = new Blob(["hi", "hello"])
  test.isEqual(blob.size, 7)
})

test("should encode arraybuffers with right content", async (test) => {
  const bytes = new Uint8Array(5)
  for (let i = 0; i < 5; i++) bytes[i] = i
  const blob = new Blob([bytes.buffer])
  const buffer = await blob.arrayBuffer()
  const result = new Uint8Array(buffer)
  for (let i = 0; i < 5; i++) {
    test.isEqual(result[i], i)
  }
})

test("should encode typed arrays with right content", async (test) => {
  const bytes = new Uint8Array(5)
  for (let i = 0; i < 5; i++) bytes[i] = i
  const blob = new Blob([bytes])

  const buffer = await blob.arrayBuffer()
  const result = new Uint8Array(buffer)

  for (let i = 0; i < 5; i++) {
    test.isEqual(result[i], i)
  }
})

test("should encode sliced typed arrays with right content", async (test) => {
  const bytes = new Uint8Array(5)
  for (let i = 0; i < 5; i++) bytes[i] = i
  const blob = new Blob([bytes.subarray(2)])

  const buffer = await blob.arrayBuffer()
  const result = new Uint8Array(buffer)
  for (let i = 0; i < 3; i++) {
    test.isEqual(result[i], i + 2)
  }
})

test("should encode with blobs", async (test) => {
  const bytes = new Uint8Array(5)
  for (let i = 0; i < 5; i++) bytes[i] = i
  const blob = new Blob([new Blob([bytes.buffer])])
  const buffer = await blob.arrayBuffer()
  const result = new Uint8Array(buffer)
  for (let i = 0; i < 5; i++) {
    test.isEqual(result[i], i)
  }
})

test("should enode mixed contents to right size", async (test) => {
  const bytes = new Uint8Array(5)
  for (let i = 0; i < 5; i++) {
    bytes[i] = i
  }
  const blob = new Blob([bytes.buffer, "hello"])
  test.isEqual(blob.size, 10)
})

test("should accept mime type", async (test) => {
  const blob = new Blob(["hi", "hello"], { type: "text/html" })
  test.isEqual(blob.type, "text/html")
})

test("should be an instance of constructor", async (test) => {
  const blob = new Blob(["hi"])
  test.ok(blob instanceof Blob)
})

test("from text", async (test) => {
  const blob = new Blob(["hello"])
  test.isEqual(blob.size, 5, "is right size")
  test.isEqual(blob.type, "", "type is empty")
  test.isEqual(await blob.text(), "hello", "reads as text")
  test.isEquivalent(new Uint8Array(await blob.arrayBuffer()), [
    ..."hello".split("").map((char) => char.charCodeAt(0)),
  ])
})

test("from text with type", async (test) => {
  const blob = new Blob(["hello"], { type: "text/markdown" })
  test.isEqual(blob.size, 5, "is right size")
  test.isEqual(blob.type, "text/markdown", "type is set")
  test.isEqual(await blob.text(), "hello", "reads as text")
  test.isEquivalent(new Uint8Array(await blob.arrayBuffer()), [
    ..."hello".split("").map((char) => char.charCodeAt(0)),
  ])
})

test("empty blob", async (test) => {
  const blob = new Blob([])
  test.isEqual(blob.size, 0, "size is 0")
  test.isEqual(blob.type, "", "type is empty")
  test.isEqual(await blob.text(), "", "reads as text")
  test.isEquivalent(
    await blob.arrayBuffer(),
    new ArrayBuffer(0),
    "returns empty buffer"
  )
})

test("no args", async (test) => {
  const blob = new Blob()
  test.isEqual(blob.size, 0, "size is 0")
  test.isEqual(blob.type, "", "type is empty")
  test.isEqual(await blob.text(), "", "reads as text")
  test.isEquivalent(
    await blob.arrayBuffer(),
    new ArrayBuffer(0),
    "returns empty buffer"
  )
})

test("all emtpy args", async (test) => {
  const blob = new Blob([
    "",
    new Blob(),
    "",
    new Uint8Array(0),
    new ArrayBuffer(0),
  ])
  test.isEqual(blob.size, 0, "size is 0")
  test.isEqual(blob.type, "", "type is empty")
  test.isEqual(await blob.text(), "", "reads as text")
  test.isEquivalent(
    await blob.arrayBuffer(),
    new ArrayBuffer(0),
    "returns empty buffer"
  )
})

test("combined blob", async (test) => {
  const uint8 = new Uint8Array([1, 2, 3])
  const uint16 = new Uint16Array([8, 190])
  const float32 = new Float32Array([5.4, 9, 1.5])
  const string = "hello world"
  const blob = new Blob([uint8, uint16, float32, string])

  const b8 = blob.slice(0, uint8.byteLength)
  const r8 = new Uint8Array(await b8.arrayBuffer())
  test.isEquivalent(uint8, r8)

  const b16 = blob.slice(uint8.byteLength, uint8.byteLength + uint16.byteLength)
  const r16 = new Uint16Array(await b16.arrayBuffer())
  test.isEquivalent(uint16, r16)

  const b32 = blob.slice(
    uint8.byteLength + uint16.byteLength,
    uint8.byteLength + uint16.byteLength + float32.byteLength
  )
  const r32 = new Float32Array(await b32.arrayBuffer())
  test.isEquivalent(float32, r32)

  const bs = blob.slice(
    uint8.byteLength + uint16.byteLength + float32.byteLength
  )
  test.isEqual(string, await bs.text())

  test.isEqual("wo", await bs.slice(6, 8).text())
  test.isEqual("world", await bs.slice(6).text())
  test.isEqual("world", await blob.slice(-5).text())
})

test("emoji", async (test) => {
  const emojis = `👍🤷🎉😤`
  const blob = new Blob([emojis])
  const nestle = new Blob([new Blob([blob, blob])])
  test.isEqual(emojis + emojis, await nestle.text())
})

test("streams", async (test) => {
  const blob = new Blob(["hello", " ", "world"], { type: "text/plain" })
  const stream = blob.stream()

  const reader = stream.getReader()
  const chunks = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    if (value != null) {
      chunks.push(Buffer.from(value))
    }
  }

  test.deepEqual("hello world", Buffer.concat(chunks).toString())
})
