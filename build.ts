const args = [
  "run", "-A", "npm:esbuild@0.28.1/bin/esbuild",
  "main.ts", "--bundle", "--platform=node",
  "--external:obsidian", "--external:electron",
  "--external:@codemirror/autocomplete", "--external:@codemirror/collab",
  "--external:@codemirror/commands", "--external:@codemirror/language",
  "--external:@codemirror/lint", "--external:@codemirror/search",
  "--external:@codemirror/state", "--external:@codemirror/view",
  "--external:@lezer/common", "--external:@lezer/highlight", "--external:@lezer/lr",
  "--format=cjs", "--target=es2018",
  "--tree-shaking=true", "--outfile=main.js",
];
if (Deno.args[0] !== "production") args.push("--sourcemap=inline");
const { code } = await new Deno.Command("deno", { args, stdout: "inherit", stderr: "inherit" }).output();
Deno.exit(code);
