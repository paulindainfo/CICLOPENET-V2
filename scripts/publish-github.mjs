// Execute only after the owner explicitly approves publication.
import {spawnSync} from 'node:child_process';
import {mkdir,cp,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
if(!process.argv.includes('--confirm-publication'))throw new Error('Publicação pendente de autorização explícita do proprietário.');
const owner='paulindainfo',name='CICLOPENET-V2',base=path.resolve('.');
const credential=spawnSync('git',['credential','fill'],{input:`protocol=https\nhost=github.com\nusername=${owner}\n\n`,encoding:'utf8',windowsHide:true});
if(credential.status)throw new Error('Conecte sua conta GitHub.');
const values=Object.fromEntries(credential.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim()];}));
const headers={Authorization:`Bearer ${values.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
async function api(endpoint,method='GET',body){const response=await fetch(`https://api.github.com${endpoint}`,{method,headers,...(body?{body:JSON.stringify(body)}:{})});const raw=await response.text(),result=raw?JSON.parse(raw):{};if(!response.ok){const e=new Error(`GitHub ${response.status}: ${result.message}`);e.status=response.status;throw e;}return result;}
const user=await api('/user');if(user.login.toLowerCase()!==owner)throw new Error('A conta conectada não é a proprietária do destino aprovado.');
let repo;try{repo=await api(`/repos/${owner}/${name}`);}catch(e){if(e.status!==404)throw e;repo=await api('/user/repos','POST',{name,description:'CICLOPE NET — Nosferatu Information Network. Crônica colaborativa com Firebase gratuito.',private:false,auto_init:false});}
if(!repo.permissions?.admin)throw new Error('É necessário administrar este repositório para ativar o Pages.');
function git(args,cwd=base){const result=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true});if(result.status)throw new Error(result.stderr||result.stdout);return result.stdout.trim();}
try{await stat(path.join(base,'.git'));}catch{git(['init','--initial-branch=main']);}
git(['config','user.name','CICLOPE NET']);git(['config','user.email','ciclope-net@users.noreply.github.com']);
const remote=`https://${owner}@github.com/${owner}/${name}.git`;
if(git(['remote']).split(/\s+/).includes('origin')){if(!git(['remote','get-url','origin']).endsWith(`/${owner}/${name}.git`))throw new Error('O checkout aponta para outro repositório.');}else git(['remote','add','origin',remote]);
git(['add','--all']);if(git(['status','--porcelain']))git(['commit','-m','Implementa CICLOPE NET V2 com colaboração e Firebase Spark']);
git(['push','-u','origin','main']);console.log('Código completo enviado ao repositório aprovado.');
const publishDir=path.join(base,'artifacts','pages');await mkdir(publishDir,{recursive:true});await cp(path.join(base,'public'),publishDir,{recursive:true});await writeFile(path.join(publishDir,'.nojekyll'),'');
try{await stat(path.join(publishDir,'.git'));}catch{git(['init','--initial-branch=gh-pages'],publishDir);git(['config','user.name','CICLOPE NET'],publishDir);git(['config','user.email','ciclope-net@users.noreply.github.com'],publishDir);git(['remote','add','origin',remote],publishDir);}
git(['add','--all'],publishDir);if(git(['status','--porcelain'],publishDir))git(['commit','-m','Publica aplicação estática CICLOPE NET'],publishDir);git(['push','-u','origin','gh-pages'],publishDir);
let pages;try{pages=await api(`/repos/${owner}/${name}/pages`);if(pages.source?.branch!=='gh-pages'||pages.source?.path!=='/')await api(`/repos/${owner}/${name}/pages`,'PUT',{build_type:'legacy',source:{branch:'gh-pages',path:'/'}});}catch(e){if(e.status!==404)throw e;await api(`/repos/${owner}/${name}/pages`,'POST',{build_type:'legacy',source:{branch:'gh-pages',path:'/'}});pages=await api(`/repos/${owner}/${name}/pages`);}
console.log(JSON.stringify({repository:repo.html_url,pages:pages.html_url,source:'gh-pages',status:'Publicação solicitada; confirme o build antes de declarar o site disponível.'}));
