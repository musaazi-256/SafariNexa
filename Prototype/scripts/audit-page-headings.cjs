/** Audit every App Router page, including headings supplied by layouts/components. */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../src");
function files(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(path.join(directory,entry.name)) : [path.join(directory,entry.name)]);
}
const sourceFiles = files(root).filter(file => file.endsWith(".tsx") && !file.includes(".test."));
const metadata = new Map();
for (const file of sourceFiles) {
  const source = ts.createSourceFile(file,fs.readFileSync(file,"utf8"),99,true,4);
  const imports = new Map();
  let heading = false, redirectOnly = false, hasJsx = false;
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
    const base = specifier.startsWith("@/") ? path.join(root,specifier.slice(2)) : path.resolve(path.dirname(file),specifier);
    const target = [base+".tsx",path.join(base,"index.tsx")].find(candidate=>fs.existsSync(candidate));
    if (!target) continue;
    if (statement.importClause.name) imports.set(statement.importClause.name.text,target);
    for (const item of statement.importClause.namedBindings?.elements ?? []) imports.set(item.name.text,target);
  }
  const dependencies = new Set();
  function visit(node) {
    if (ts.isJsxFragment(node)) hasJsx = true;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      hasJsx = true;
      const tag = node.tagName.getText(source);
      if (tag === "h1" && !file.endsWith("/components/page-header.tsx")) throw new Error(`Unshared h1 in ${file}`);
      if (["PageHeader","PageHero","PageTitle"].includes(tag)) heading = true;
      if (imports.has(tag)) dependencies.add(imports.get(tag));
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === "redirect") redirectOnly = true;
    ts.forEachChild(node,visit);
  }
  visit(source);
  metadata.set(file,{heading,redirectOnly:redirectOnly && !hasJsx,dependencies});
}
function inheritsHeading(file,seen=new Set()) {
  if (seen.has(file)) return false;
  seen.add(file);
  const item = metadata.get(file);
  return Boolean(item && (item.heading || [...item.dependencies].some(target=>inheritsHeading(target,seen))));
}
let count = 0, inherited = 0, redirects = 0;
const missing = [];
for (const file of sourceFiles.filter(file=>file.endsWith("/page.tsx"))) {
  count++;
  if (inheritsHeading(file)) continue;
  let directory = path.dirname(file), found = false;
  while (directory.startsWith(path.join(root,"app"))) {
    if (inheritsHeading(path.join(directory,"layout.tsx"))) {found=true;break;}
    directory=path.dirname(directory);
  }
  if (found) {inherited++;continue;}
  if (metadata.get(file).redirectOnly) {redirects++;continue;}
  missing.push(path.relative(root,file));
}
console.log(JSON.stringify({pages:count,layoutHeadings:inherited,redirectPages:redirects,missing},null,2));
if (missing.length) process.exitCode=1;
