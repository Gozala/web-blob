import { Response } from "node-fetch"
import { Blob } from "../src/lib.js"
import { assert } from "./test.js"

/**
 * @param {import('./test').Test} test
 */
export const test = test => {
  test("node-fetch recognizes blobs", async () => {
    // @ts-expect-error - our blob isn't one expected by node-fetch
    const response = new Response(new Blob(['hello']))
    assert.equal(await response.text(), "hello")
  })
}
