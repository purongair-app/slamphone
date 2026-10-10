import esbuild from 'esbuild';
import fs from 'node:fs/promises';
await esbuild.build({entryPoints:['src/entry.tsx'],outfile:'app.js',bundle:true,minify:true,format:'iife',platform:'browser',target:'es2020',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},alias:{'@':'./src'},plugins:[{name:'dynamic-shim',setup(build){build.onResolve({filter:/^next\/dynamic$/},()=>({path:'dynamic',namespace:'shim'}));build.onLoad({filter:/.*/,namespace:'shim'},()=>({contents:'import React from "react";export default function dynamic(fn){const C=React.lazy(fn);return function Dynamic(p){return React.createElement(React.Suspense,{fallback:React.createElement("p",null,"กำลังโหลด…")},React.createElement(C,p))}}',loader:'js',resolveDir:process.cwd()}))}}]});
await fs.copyFile('src/app/globals.css','styles.css');

const confirmation=await esbuild.build({entryPoints:['src/lib/change-confirmation.ts'],bundle:true,minify:true,format:'iife',globalName:'MobileHubSecurity',target:'es2020',write:false});
const cms=await fs.readFile('apps-script/StorefrontAdmin.source.html','utf8');
await fs.writeFile('apps-script/StorefrontAdmin.html',cms.replace('<!-- SECURITY_MODULE -->','<script>'+confirmation.outputFiles[0].text+'</script>'));
