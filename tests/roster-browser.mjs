import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {bootstrap} from '../scripts/bootstrap.mjs';
import {ROSTER} from '../public/js/roster.js';
const invites=await bootstrap({local:true});
const server=spawn(process.execPath,['scripts/serve.mjs','5175'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Servidor encerrou: ${code}`)));});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
await mkdir('artifacts/screenshots',{recursive:true});
try{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5175/?emulator=1');
    await page.locator('#invite-code').fill(invites[4].code);
    await page.getByRole('button',{name:'Autorizar este terminal'}).click();
    await page.locator('[data-profile=user5]').waitFor();
    assert.equal(await page.locator('[data-profile]').count(),5);
    assert.deepEqual(await page.locator('[data-profile] strong').allTextContents(),ROSTER.map(p=>p.name));
    assert.equal(await page.locator('[data-profile=user1] small').textContent(),'DONO DO SITE');
    assert.equal(await page.locator('[data-profile=user5] small').textContent(),'MESTRE DA MESA');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/screenshots/profiles-${width}.png`,fullPage:true});
    await page.locator('[data-profile=user5]').click();await page.locator('#quick-new').waitFor();
    assert.match(await page.locator('.banner-meta').textContent(),/5 identidades/);
    await page.evaluate(()=>location.hash='#/settings');
    await page.locator('#campaign-form').waitFor();
    assert.equal(await page.getByRole('button',{name:'Salvar crônica'}).isEnabled(),true);
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['Cinco nomes no seletor desktop e mobile','Identificação de dono e mestre','Felipe entra com administração','Contagem de cinco participantes','Sem overflow horizontal']}));
}finally{
  await browser.close();server.kill();
  const require=createRequire(import.meta.url);await require('firebase-admin/firestore').getFirestore().terminate();for(const app of require('firebase-admin/app').getApps())await require('firebase-admin/app').deleteApp(app);
}
