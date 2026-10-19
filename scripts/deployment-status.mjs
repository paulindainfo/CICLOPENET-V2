import {spawnSync} from 'node:child_process';
import {adminRequest,getAdminDocument} from './admin-rest.mjs';
const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\nusername=paulindainfo\n\n',encoding:'utf8',windowsHide:true});
if(result.status)throw new Error('Credencial GitHub indisponível.');
const credential=Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim()];})),headers={Authorization:`Bearer ${credential.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
async function get(path){const r=await fetch(`https://api.github.com/repos/paulindainfo/CICLOPENET-V2${path}`,{headers});return {http:r.status,data:await r.json()};}
const pages=await get('/pages'),build=await get('/pages/builds/latest');
console.log(JSON.stringify({pages:{http:pages.http,url:pages.data.html_url,status:pages.data.status,source:pages.data.source},build:{http:build.http,status:build.data.status,error:build.data.error?.message,commit:build.data.commit}}));
const indexes=await adminRequest('https://firestore.googleapis.com/v1/projects/schrecknet-e40df/databases/(default)/collectionGroups/-/indexes');
console.log(JSON.stringify({indexes:(indexes.indexes||[]).map(i=>({collection:i.name.split('/collectionGroups/')[1]?.split('/')[0],state:i.state}))}));
const root=await getAdminDocument('networks/principal');console.log(JSON.stringify({networkInitialized:!!root,profiles:(await Promise.all([1,2,3,4].map(i=>getAdminDocument('networks/principal/profiles/user'+i)))).filter(Boolean).length}));
if(pages.data.html_url){const r=await fetch(pages.data.html_url,{headers:{'Cache-Control':'no-cache'}});console.log(JSON.stringify({siteHTTP:r.status,titlePresent:(await r.text()).includes('CICLOPE NET')}));}
