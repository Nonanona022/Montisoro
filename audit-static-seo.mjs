import fs from 'node:fs';
import path from 'node:path';

const pagesDir = path.join('website','pages');
const sitemap = fs.readFileSync(path.join('website','sitemap.xml'),'utf8');
const routes = [...sitemap.matchAll(/<loc>https:\/\/montisoro\.com([^<]*)<\/loc>/g)].map(m=>m[1] || '/');
const publicRoutes = new Set(routes);
const files = new Map([
  ['/','Home.html'],['/home-en','Home-en.html'],['/faq','FAQ.html'],['/faq-en','FAQ-en.html'],['/referentie','Referentie.html'],['/references-en','references-en.html'],
]);
for (const route of routes) if (!files.has(route)) files.set(route,`${route.slice(1)}.html`);

const errors=[];
const fail=m=>errors.push(m);
for (const [route,name] of files){
  const file=path.join(pagesDir,name);
  if(!fs.existsSync(file)){fail(`${route}: missing ${file}`);continue;}
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{JSON.parse(match[1]);}catch(error){fail(`${route}: invalid JSON-LD (${error.message})`);}
  }
  for(const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)){
    const href=match[1];
    if(!href.startsWith('/') || href.startsWith('//')) continue;
    const target=href.split(/[?#]/)[0] || '/';
    if(!publicRoutes.has(target)) fail(`${route}: internal link target is not canonical/public: ${href}`);
  }
}

for(const name of ['referentie-case.html','reference-case-en.html','referentie-case-alcon.html','reference-case-alcon-en.html','referentie-case-feneko.html','reference-case-feneko-en.html']){
  const html=fs.readFileSync(path.join(pagesDir,name),'utf8');
  if(!html.includes('data-prerendered="true"')) fail(`${name}: missing pre-render marker`);
  if(!html.includes('"@type":"Article"')) fail(`${name}: missing Article schema`);
}

if(errors.length){console.error(`Static SEO audit failed (${errors.length}):`);for(const e of errors)console.error(`- ${e}`);process.exit(1);}
console.log(`Static SEO audit passed: ${routes.length} sitemap routes, valid JSON-LD and canonical internal links.`);
