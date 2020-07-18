import tap from "tape"

export const test = (name, unit) =>
  tap(name, async (assert) => {
    try {
      await unit(assert)
      assert.end()
    } catch (error) {
      assert.fail(error)
    }
  })
