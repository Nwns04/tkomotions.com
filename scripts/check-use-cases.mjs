import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
function load(path, deps = {}) {
 const exports = {};
 const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 vm.runInNewContext(source, { exports, require: name => { if (!(name in deps)) throw new Error(name); return deps[name]; } }); return exports;
}
const content = load('src/lib/use-cases.ts');
const cases = content.useCases;
const packages = load('src/lib/ai-packages.ts').solutions;
assert.ok(cases.length >= 10);
for (const key of ['slug','seoTitle','seoDescription','headline','description']) assert.equal(new Set(cases.map(item => item[key])).size, cases.length, key + ' is unique');
const questions = cases.flatMap(item => item.faq.map(pair => pair[0]));
assert.equal(new Set(questions).size, questions.length, 'FAQ questions are distinct');
for (const item of cases) {
 assert.ok(item.faq.length >= 5);
 assert.ok(item.problem.length >= 2 && item.solution.length >= 2 && item.example.length >= 3);
 assert.ok(packages.some(pack => pack.number === item.packageKey));
 assert.ok(item.related.every(slug => cases.some(other => other.slug === slug) && slug !== item.slug));
 const words = JSON.stringify(item).split(/\s+/).length;
 assert.ok(words > 450, item.slug + ' has substantial content');
}
const sitemap = load('src/app/sitemap.ts', { '@/lib/use-cases': content }).default();
for (const path of ['/use-cases', '/solutions/ai', ...cases.map(item => '/use-cases/' + item.slug)]) assert.ok(sitemap.some(item => item.url === 'https://tkomotions.com' + path), path + ' sitemap');
assert.equal(new Set(sitemap.map(item=>item.url)).size,sitemap.length);
assert.ok(fs.readFileSync('public/robots.txt','utf8').includes('Allow: /'));
console.log('PASS: ' + cases.length + ' unique use cases, ' + questions.length + ' distinct FAQs, content, package and related links, sitemap paths and robots allowance.');
