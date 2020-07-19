import multiInput from "rollup-plugin-multi-input"
export default {
  input: ["src/*.js", "test/*.js"],
  output: {
    dir: "dist",
    preserveModules: true,
    sourcemap: true,
    format: "cjs",
    entryFileNames: "[name].cjs",
  },
  plugins: [multiInput({ relative: "" })],
}
