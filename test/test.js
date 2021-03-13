import * as uvuassert from "uvu/assert"

const deepEqual = uvuassert.equal
const isEqual = uvuassert.equal
const isEquivalent = uvuassert.equal
export const assert = { ...uvuassert, deepEqual, isEqual, isEquivalent }

/**
 * @typedef {(name:string, unit:(test:Test) => any) => void} Test
 */
