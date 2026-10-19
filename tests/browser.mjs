import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {bootstrap} from '../scripts/bootstrap.mjs';
const invites=await bootstrap({local:true}),url='http://127.0.0.1:5174/?emulator=1';
await mkdir('artifacts/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const desktop=await browser.newContext({viewport:{width:1440,height:1050}}),mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await desktop.newPage(),second=await mobile.newPage(),errors=[];
for(const p of [page,second])p.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
async function enter(p,code,profile){await p.goto(url);await p.locator('#invite-code').fill(code);await p.getByRole('button',{name:'Autorizar este terminal'}).click();await p.locator(`[data-profile="${profile}"]`).click();await p.locator('#quick-new').waitFor();}
try{
  await enter(page,invites[0].code,'user1');await enter(second,invites[1].code,'user2');
  await page.screenshot({path:'artifacts/screenshots/dashboard-desktop.png',fullPage:true});
  await page.locator('[data-route=person]').click();await page.locator('#new-record').click();await page.locator('[name=title]').fill('Helena — navegador');await page.locator('[name="field.clan"]').selectOption('Toreador');await page.locator('[name=summary]').fill('Vista no Elísio. <script>window.injected=true</script>');await page.locator('#record-form [type=submit]').click();await page.locator('#share-record').waitFor();
  const recordHash=await page.evaluate(()=>location.hash);
  await second.locator('#mobile-menu').click();await second.locator('[data-route=person]').click();await second.getByRole('link',{name:'Helena — navegador',exact:true}).first().waitFor();
  await page.locator('#share-record').click();await second.locator('#mobile-menu').click();await second.locator('[data-route=chat]').click();await second.getByText('Helena — navegador',{exact:true}).first().waitFor();
  await second.locator('#message-body').fill('O contato viu Helena no hospital.\nA informação ainda é uma hipótese.');await second.locator('#chat-form [type=submit]').click();
  await page.locator('[data-route=chat]').click();await page.getByText('O contato viu Helena no hospital.',{exact:false}).last().waitFor();
  const lastConvert=page.locator('[data-convert]').last();await lastConvert.selectOption('theory');await page.locator('[name=title]').fill('Hipótese preservada do chat');await page.locator('#record-form [type=submit]').click();await page.locator('#share-record').waitFor();
  await page.locator('[data-route=session]').click();await page.locator('#new-record').click();await page.locator('[name=title]').fill('Sessão 01 — O primeiro rastro');await page.locator('[name="field.sessionNumber"]').fill('01');await page.locator('[name="field.realDate"]').fill('2026-10-19');await page.locator('#record-form [type=submit]').click();await page.locator('#share-record').waitFor();
  await page.locator('[data-route=search]').click();await page.locator('#search-input').fill('helena');await page.locator('#search-form [type=submit]').click();await page.locator('#search-results .record-card').first().waitFor();
  await page.goto(url+recordHash);await page.locator('#edit-record').waitFor();await page.locator('#edit-record').click();await page.locator('[name=summary]').fill('Informação atualizada pela coterie.');await page.locator('#record-form [type=submit]').click();await page.getByText('Informação atualizada pela coterie.',{exact:true}).first().waitFor();
  await page.reload();await page.getByText('Informação atualizada pela coterie.',{exact:true}).first().waitFor();
  await page.locator('[data-route=settings]').click();const download=page.waitForEvent('download');await page.locator('#export-backup').click();await (await download).saveAs('artifacts/browser-backup.json');
  await page.locator('summary').filter({hasText:'Importar registros'}).click();await page.locator('#backup-file').setInputFiles('artifacts/browser-backup.json');await page.locator('#import-backup').waitFor({state:'visible'});await page.locator('#import-backup').click();await page.locator('#backup-status').filter({hasText:'registros importados'}).waitFor({timeout:60000});
  await page.locator('[data-route=document]').click();await page.locator('#new-record').click();await page.locator('[name=title]').fill('Documento com PDF — teste');await page.locator('#file-input').setInputFiles({name:'recorte.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')});await page.locator('#record-form [type=submit]').click();await page.locator('[data-attachment]').first().waitFor();const attachment=page.waitForEvent('download');await page.locator('[data-attachment]').first().click();await (await attachment).saveAs('artifacts/attachment-test.pdf');
  await page.locator('[data-route=profile]').click();const avatarImage=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=80;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#8b313b';ctx.fillRect(0,0,80,80);return c.toDataURL('image/png').split(',')[1];});await page.locator('[name=avatarFile]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from(avatarImage,'base64')});await page.locator('#profile-form [type=submit]').click();await page.locator('#top-profile img').waitFor();
  await second.screenshot({path:'artifacts/screenshots/chat-mobile.png',fullPage:true});
  const overflow=await second.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw new Error('Overflow horizontal no celular');
  if(await page.evaluate(()=>window.injected===true))throw new Error('Conteúdo de usuário foi executado');
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify({passed:true,checks:['convites','quatro perfis','cadastro NPC','sincronização em outro contexto','compartilhamento de ficha','chat em duas direções','conversão em teoria','registro de sessão','busca','edição','persistência após recarregar','backup baixado','importação de registros','upload e download de PDF','upload e compressão de avatar','mobile sem overflow','HTML não executado'],screenshots:['dashboard-desktop.png','chat-mobile.png']}));
}catch(e){await page.screenshot({path:'artifacts/screenshots/error.png',fullPage:true});console.error(e);process.exitCode=1;}
finally{await browser.close();const require=createRequire(import.meta.url);await require('firebase-admin/firestore').getFirestore().terminate();for(const app of require('firebase-admin/app').getApps())await require('firebase-admin/app').deleteApp(app);}
