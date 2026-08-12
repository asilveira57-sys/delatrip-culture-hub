import fs from "node:fs";
const BASE="https://delatrip-culture-hub.lovable.app";
const j=(f)=>JSON.parse(fs.readFileSync(`src/data/${f}`,"utf8"));
const products=j("products.json").filter(p=>p.disponivel);
const cats=j("categories.json").filter(c=>c.ativo);
const brands=j("brands.json");
const posts=j("posts.json");
const byId=new Map(cats.map(c=>[c.id,c]));
const path=(c)=>{const out=[];let a=c,g=0;while(a&&g++<6){out.unshift(a.slug);a=a.paiId?byId.get(a.paiId):undefined;}return out.join("/");};
const urls=[
 ["/",1.0],["/catalogo",0.9],["/marcas",0.8],["/blog",0.7],["/acessorios",0.7],["/tabacos",0.7],
 ["/sobre",0.5],["/contato",0.5],["/faq",0.5],["/busca",0.3],
 ["/legal/termos",0.3],["/legal/privacidade",0.3],["/legal/aviso-legal",0.3],
 ...cats.map(c=>[`/catalogo/${path(c)}`,0.8]),
 ...brands.map(b=>[`/${b.slug}`,0.6]),
 ...products.map(p=>[`/produto/${p.slug}`,0.6]),
 ...posts.map(p=>[`/blog/${p.slug}`,0.5]),
];
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u,p])=>`  <url>\n    <loc>${BASE}${u==="/"?"":u}</loc>\n    <priority>${p.toFixed(1)}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync("public/sitemap.xml",xml);
console.log("urls:",urls.length);
