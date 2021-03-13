import { test as blobTest } from "./blob.spec.js"
import { test as sliceTest } from "./slice.spec.js"

/**
 * @param {import('./test').Test} test
 */
export default test => {
  blobTest(test)
  sliceTest(test)
}
