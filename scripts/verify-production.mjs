// Read-only verification: never redeems invites or writes/deletes campaign documents.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {adminRequest,getAdminDocument} from './admin-rest.mjs';
import {ROSTER} from '../public/js/roster.js';
const url='https://paulindainfo.github.io/CICLOPENET-V2/';
let previous=-1;
for(let i=0;i<30;i++){
  const result=await adminRequest('https://firestore.googleapis.com/v1/projects/schrecknet-e40df/databases/(default)/collectionGroups/-/indexes'),pending=(result.indexes||[]).filter(v=>v.state!=='READY');
  if(!pending.length)break;if(pending.length!==previous){console.log(`Aguardando ${pending.length} índices em construção.`);previous=pending.length;}if(i===29)throw new Error('Índices ainda não estão prontos.');await new Promise(resolve=>setTimeout(resolve,15000));
}
const profiles=await Promise.all(ROSTER.map(p=>getAdminDocument('networks/principal/profiles/'+p.id)));if(profiles.some(p=>!p))throw new Error('Perfil inicial ausente.');
const invitation=JSON.parse(await readFile('CONVITES.private.json','utf8'));
for(const entry of invitation.convites){const hash=createHash('sha256').update(entry.codigo).digest('hex'),stored=await getAdminDocument('networks/principal/invites/'+hash);if(!stored||stored.role!==entry.papel||stored.uses>stored.maxUses||stored.expiresAt<=Date.now())throw new Error('Um convite está ausente, expirado ou com dados inválidos.');}
await mkdir('artifacts/production',{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[`${profiles.length} perfis no banco real`,`${invitation.convites.length} convites privados com permissões verificadas`,'Índices de produção prontos'],errors=[];
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/CORS policy/.test(m.text()))errors.push(m.text());});
    const response=await page.goto(url,{waitUntil:'domcontentloaded'});if(response.status()!==200)throw new Error(`Página pública respondeu ${response.status()}`);await page.locator('#invite-code').waitFor({timeout:45000});
    const status=await page.evaluate(async()=>{const {state}=await import('./js/state.js'),{db,auth}=await import('./js/firebase.js'),{doc,getDoc}=await import('./vendor/firebase.js');const codes=[];for(const path of ['networks/principal/profiles/user1','campaigns/principal']){try{await getDoc(doc(db,path));codes.push('unexpected-access');}catch(e){codes.push(e.code);}}return {identified:!!state.uid,appName:auth.app.name,codes};});
    if(status.appName!=='ciclope-net-v2')throw new Error('A versão com a sessão isolada ainda não foi propagada pelo Pages.');if(!status.identified||status.codes.some(c=>c!=='permission-denied'))throw new Error('Bloqueio do visitante não foi confirmado.');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow horizontal.');
    await page.screenshot({path:`artifacts/production/access-${viewport.width}.png`,fullPage:true});await context.close();
  }
  checks.push('HTTPS 200 e carregamento dos módulos sem CORS em desktop e mobile','Sessão de autenticação isolada do site original','Visitante sem convite bloqueado no conteúdo V2 e no legado','Layout da tela pública sem overflow');
  const local=await browser.newContext(),page=await local.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('public/index.html')).href);await page.getByRole('heading',{name:'Abra pelo endereço da rede.'}).waitFor();await local.close();checks.push('Abertura file:// mostra orientação e não tenta carregar módulos');
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile('artifacts/production/verification.json',JSON.stringify({url,verifiedAt:new Date().toISOString(),passed:true,readOnly:true,checks},null,2));console.log(JSON.stringify({passed:true,readOnly:true,checks}));
}finally{await browser.close();}
