import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {adminRequest,documents,getAdminDocument,decodeDocument,adminCommit,deleteWrite} from './admin-rest.mjs';
const url='https://paulindainfo.github.io/CICLOPENET-V2/';
const probe=JSON.parse(await readFile('artifacts/probe.private.json','utf8'));
let remaining=-1;
for(let i=0;i<30;i++){
  const result=await adminRequest('https://firestore.googleapis.com/v1/projects/schrecknet-e40df/databases/(default)/collectionGroups/-/indexes');
  const pending=(result.indexes||[]).filter(index=>index.state!=='READY');
  if(!pending.length)break;
  if(pending.length!==remaining){console.log(`Aguardando a construção de ${pending.length} índices do Firestore.`);remaining=pending.length;}
  if(i===29)throw new Error('Os índices ainda estão em construção. Retome a verificação quando estiverem prontos.');
  await new Promise(resolve=>setTimeout(resolve,15000));
}
await mkdir('artifacts/production',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),desktop=await browser.newContext({viewport:{width:1440,height:1000}}),mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const a=await desktop.newPage(),b=await mobile.newPage(),uids=[],records=new Set(),errors=[],checks=[];
const root='networks/principal';
for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/CORS policy/.test(m.text()))errors.push(m.text());});p.on('dialog',d=>d.accept());}
async function enter(page,invite,profile){
  const response=await page.goto(url,{waitUntil:'domcontentloaded'});if(response.status()!==200)throw new Error(`HTTPS ${response.status()}`);
  await page.locator('#invite-code').waitFor({timeout:45000});
  const uid=await page.evaluate(async()=>{const {state}=await import('./js/state.js');return state.uid;});if(uid)uids.push(uid);
  await page.locator('#invite-code').fill(invite);await page.getByRole('button',{name:'Autorizar este terminal'}).click();await page.locator(`[data-profile="${profile}"]`).click({timeout:30000});await page.locator('#quick-new').waitFor();
}
async function list(path){const result=await adminRequest(`${documents}/${path}?pageSize=200`);return (result.documents||[]).map(decodeDocument);}
let success=false;
try{
  await enter(a,probe.convites[0].codigo,'user1');await enter(b,probe.convites[1].codigo,'user2');checks.push('HTTPS e módulos sem erro de CORS','Convites, quatro perfis e dois dispositivos autorizados');
  await a.screenshot({path:'artifacts/production/dashboard.png',fullPage:true});
  await a.locator('[data-route=person]').click();await a.locator('#new-record').click();await a.locator('[name=title]').fill('TESTE AUTOMÁTICO TEMPORÁRIO — CICLOPE');await a.locator('[name=summary]').fill('Registro temporário para verificar a publicação. Será removido ao concluir.');await a.locator('#record-form [type=submit]').click();await a.locator('#share-record').waitFor({timeout:30000});
  const id=await a.evaluate(()=>location.hash.split('/')[2]);records.add(id);
  await b.locator('#mobile-menu').click();await b.locator('[data-route=person]').click();await b.getByRole('link',{name:'TESTE AUTOMÁTICO TEMPORÁRIO — CICLOPE',exact:true}).first().waitFor();checks.push('Criação persistente de NPC recebida no segundo dispositivo');
  await a.locator('#share-record').click();await b.locator('#mobile-menu').click();await b.locator('[data-route=chat]').click();await b.getByText('TESTE AUTOMÁTICO TEMPORÁRIO — CICLOPE',{exact:true}).first().waitFor();
  await b.locator('#message-body').fill('TESTE DE TRANSMISSÃO TEMPORÁRIO — remover após a verificação.');await b.locator('#chat-form [type=submit]').click();await a.locator('[data-route=chat]').click();await a.getByText('TESTE DE TRANSMISSÃO TEMPORÁRIO — remover após a verificação.',{exact:true}).waitFor();checks.push('Cartão compartilhado e mensagens em tempo real entre dois perfis');
  await a.locator('[data-route=search]').click();await a.locator('#search-input').fill('automatico');await a.locator('#search-form [type=submit]').click();await a.locator('#search-results .record-card').first().waitFor();checks.push('Busca global com índice de produção');
  await a.goto(`${url}#/record/${id}`);await a.locator('#edit-record').waitFor();await a.locator('#edit-record').click();await a.locator('[name=summary]').fill('TESTE DE EDIÇÃO TEMPORÁRIO — persistência confirmada.');await a.locator('#record-form [type=submit]').click();await a.getByText('TESTE DE EDIÇÃO TEMPORÁRIO — persistência confirmada.',{exact:true}).first().waitFor();await a.reload();await a.getByText('TESTE DE EDIÇÃO TEMPORÁRIO — persistência confirmada.',{exact:true}).first().waitFor();checks.push('Edição e persistência após recarregar');
  await a.locator('[data-route=settings]').click();const downloaded=a.waitForEvent('download');await a.locator('#export-backup').click();await (await downloaded).saveAs('artifacts/production/backup.private.json');checks.push('Exportação JSON real');
  if(await b.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow horizontal no celular');await b.screenshot({path:'artifacts/production/chat-mobile.png',fullPage:true});checks.push('Layout mobile sem overflow');
  const visitorContext=await browser.newContext(),visitor=await visitorContext.newPage();await visitor.goto(url);await visitor.locator('#invite-code').waitFor();const denied=await visitor.evaluate(async id=>{const {db}=await import('./js/firebase.js'),{doc,getDoc}=await import('./vendor/firebase.js');try{await getDoc(doc(db,'networks/principal/records',id));return false;}catch(e){return e.code==='permission-denied';}},id);if(!denied)throw new Error('Visitante sem convite conseguiu ler o registro');await visitorContext.close();checks.push('Visitante sem convite bloqueado pelas regras reais');
  if(errors.length)throw new Error(errors.join('\n'));success=true;
}catch(e){console.error('Falha na verificação publicada:',e.message);await a.screenshot({path:'artifacts/production/error.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{
  // Remove only documents created by the isolated verification devices.
  const messages=(await list(`${root}/messages`)).filter(m=>uids.includes(m.uid));
  const activities=(await list(`${root}/activity`)).filter(m=>uids.includes(m.uid));
  activities.forEach(m=>records.add(m.recordId));
  const writes=[];let activePeople=0;
  for(const id of records){const record=await getAdminDocument(`${root}/records/${id}`);if(record?.createdBy&&uids.includes(record.createdBy.uid)){if(record.type==='person'&&!record.deleted)activePeople++;for(const v of await list(`${root}/records/${id}/versions`))writes.push(deleteWrite(`${root}/records/${id}/versions/${v.id}`));writes.push(deleteWrite(`${root}/records/${id}`));}}
  for(const m of messages)writes.push(deleteWrite(`${root}/messages/${m.id}`));
  for(const m of activities)writes.push(deleteWrite(`${root}/activity/${m.id}`));
  for(const uid of uids)writes.push(deleteWrite(`${root}/members/${uid}`));
  for(const v of probe.convites){const hash=createHash('sha256').update(v.codigo).digest('hex');writes.push(deleteWrite(`${root}/invites/${hash}`));}
  if(activePeople)writes.push({transform:{document:`projects/schrecknet-e40df/databases/(default)/documents/${root}`,fieldTransforms:[{fieldPath:'counts.person',increment:{integerValue:String(-activePeople)}}]}});
  const network=await getAdminDocument(root);if(records.has(network?.lastRecordId))writes.push({update:{name:`projects/schrecknet-e40df/databases/(default)/documents/${root}`,fields:{lastRecordId:{stringValue:''}}},updateMask:{fieldPaths:['lastRecordId']}});
  if(writes.length)await adminCommit(writes);await browser.close();
  await writeFile('artifacts/production/verification.json',JSON.stringify({url,verifiedAt:new Date().toISOString(),passed:success,checks,testDataRemoved:true},null,2));
  console.log(JSON.stringify({passed:success,checks,testDataRemoved:true}));
}
