import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(!process.argv.includes('--publish'))throw new Error('Use --publish para disponibilizar o APK assinado.');
const repo='paulindainfo/CICLOPENET-V2',tag='v2.1.0-android';
const credential=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\nusername=paulindainfo\n\n',encoding:'utf8',windowsHide:true});
if(credential.status)throw new Error('Credencial GitHub indisponível.');
const values=Object.fromEntries(credential.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim()];}));
const headers={Authorization:`Bearer ${values.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
async function api(path,method='GET',body){const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{method,headers:{...headers,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok){const e=new Error(`GitHub ${r.status}: ${data.message}`);e.status=r.status;throw e;}return data;}
const apk=await readFile('CICLOPE-NET.apk'),checksum=createHash('sha256').update(apk).digest('hex')+'  CICLOPE-NET.apk\n';
await writeFile('artifacts/CICLOPE-NET.apk.sha256',checksum);
let release;try{release=await api(`/releases/tags/${tag}`);}catch(e){if(e.status!==404)throw e;release=await api('/releases','POST',{tag_name:tag,target_commitish:'main',name:'CICLOPE NET para Android — 2.1.0',draft:true,body:'APK assinado para Android 8 ou superior. Usa o mesmo site e banco de dados da rede. Autorize o aplicativo com seu convite.\n\nAvisos de mensagens e atualizações por verificação periódica, a cada 15 minutos ou mais, conforme as restrições do Android. Não são notificações push instantâneas. O botão Avisos permite ativar, desativar e testar notificações. Requer internet e Android System WebView atualizado.\n\nA compilação e a assinatura foram verificadas. A integração web foi testada com o navegador; esta versão inicial ainda não foi testada em um aparelho Android físico.\n\nPara instalar, baixe CICLOPE-NET.apk e permita a instalação pelo navegador quando o Android solicitar.'});}
for(const [name,data,type] of [['CICLOPE-NET.apk',apk,'application/vnd.android.package-archive'],['CICLOPE-NET.apk.sha256',Buffer.from(checksum),'text/plain']]){
  const old=release.assets?.find(a=>a.name===name);if(old){if(old.size!==data.length)throw new Error('O asset existente é diferente; publique uma nova versão.');continue;}
  const r=await fetch(release.upload_url.replace(/\{.*$/,'')+'?name='+encodeURIComponent(name),{method:'POST',headers:{...headers,'Content-Type':type},body:data});if(!r.ok)throw new Error(`Upload ${name}: HTTP ${r.status}`);
}
release=await api(`/releases/${release.id}`,'PATCH',{draft:false});
console.log(JSON.stringify({release:release.html_url,download:release.assets.find(a=>a.name==='CICLOPE-NET.apk')?.browser_download_url,bytes:apk.length,sha256:checksum.split(' ')[0]}));
