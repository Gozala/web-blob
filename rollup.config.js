import multiInput from "rollup-plugin-multi-input"

export default ["src", "test"].map((dir) => ({
  input: `${dir}/**/*.js`,
  output: {
    dir: "dist",
    preserveModules: true,
    sourcemap: true,
    format: "cjs",
    entryFileNames: "[name].cjs",
  },
  plugins: [multiInput({ relative: `dir` })],
}))
