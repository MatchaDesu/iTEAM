// Static project check only: does not start the server or connect to Supabase.
// Run: npm run check
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ejs = require('ejs');

const root = __dirname;
const errors = [];
const pass = (message) => console.log(`  OK  ${message}`);
const fail = (message) => { errors.push(message); console.log(`  FAIL ${message}`); };
const walk = (dir, ext) => fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full, ext) : (entry.name.endsWith(ext) ? [full] : []);
    }) : [];
const rel = (file) => path.relative(root, file).replaceAll(path.sep, '/');

console.log('\n1) JavaScript syntax');
const jsFiles = ['app.js', ...walk(path.join(root, 'config'), '.js'), ...walk(path.join(root, 'controllers'), '.js'),
    ...walk(path.join(root, 'middleware'), '.js'), ...walk(path.join(root, 'models'), '.js'),
    ...walk(path.join(root, 'routes'), '.js'), ...walk(path.join(root, 'utils'), '.js')];
for (const file of jsFiles) {
    try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); pass(rel(file)); }
    catch (err) { fail(`${rel(file)} syntax error: ${err.stderr?.toString().trim() || err.message}`); }
}

console.log('\n2) EJS compilation');
const viewsDir = path.join(root, 'views');
const viewFiles = walk(viewsDir, '.ejs');
for (const file of viewFiles) {
    try {
        const source = fs.readFileSync(file, 'utf8');
        ejs.compile(source, { filename: file });
        for (const [, include] of source.matchAll(/include\(\s*['"]([^'"]+)['"]/g)) {
            const target = path.resolve(path.dirname(file), include.endsWith('.ejs') ? include : `${include}.ejs`);
            if (!fs.existsSync(target)) fail(`${rel(file)} includes missing file: ${include}`);
        }
        pass(rel(file));
    }
    catch (err) { fail(`${rel(file)}: ${err.message}`); }
}

console.log('\n3) Controller render targets');
const views = new Set(viewFiles.map((file) => path.relative(viewsDir, file).replace(/\\/g, '/').replace(/\.ejs$/, '')));
for (const file of walk(path.join(root, 'controllers'), '.js')) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [, target] of source.matchAll(/res\.render\(\s*['"]([^'"]+)['"]/g)) {
        if (views.has(target)) pass(`${rel(file)} -> views/${target}.ejs`);
        else fail(`${rel(file)} renders missing view: ${target}`);
    }
}

console.log('\n4) Route mounts and route modules');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const routeFiles = walk(path.join(root, 'routes'), '.js');
for (const file of routeFiles) {
    const routeName = `./routes/${path.basename(file, '.js')}`;
    if (!appSource.includes(`require('${routeName}')`) && !appSource.includes(`require("${routeName}")`)) {
        fail(`${rel(file)} is not mounted in app.js`);
        continue;
    }
    try {
        const router = require(file);
        if (typeof router !== 'function' || !Array.isArray(router.stack)) fail(`${rel(file)} does not export an Express router`);
        else {
            const routes = router.stack.filter((layer) => layer.route);
            const invalid = routes.flatMap((layer) => layer.route.stack.filter((handler) => typeof handler.handle !== 'function'));
            if (!routes.length) fail(`${rel(file)} has no registered routes`);
            else if (invalid.length) fail(`${rel(file)} has a route without a callable handler`);
            else pass(`${rel(file)} mounted; ${routes.length} routes with callable handlers`);
        }
    } catch (err) { fail(`${rel(file)} cannot load: ${err.message}`); }
}

console.log(errors.length ? `\nFound ${errors.length} static issue(s).` : `\nStatic checks passed (${jsFiles.length} JS, ${viewFiles.length} EJS).`);
console.log('This does not prove runtime behavior or database connectivity; use npm test for mocked use-case tests.');
process.exitCode = errors.length ? 1 : 0;
