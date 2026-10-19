// Explicit owner-requested roster update. Does not remove data or replace existing invitations.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {adminRequest,documents,decodeDocument,adminCommit,createWrite,fields,getAdminDocument} from './admin-rest.mjs';
import {ROSTER,initialProfile} from '../public/js/roster.js';
if(!process.argv.includes('--apply'))throw new Error('Use --apply somente para aplicar a alteração solicitada pelo dono da mesa.');
const root='networks/principal',privateFile='CONVITES.private.json';
const invitations=JSON.parse(await readFile(privateFile,'utf8')),writes=[],before=[];
for(const p of ROSTER){
  const location=`${root}/profiles/${p.id}`;
  let raw;
  try{raw=await adminRequest(`${documents}/${location}`);}catch(e){if(e.status!==404)throw e;}
  if(!raw){writes.push(createWrite(location,initialProfile(p)));continue;}
  const old=decodeDocument(raw);before.push(raw);
  if(old.name===p.name)continue;
  // Preserve every character field, file reference and timestamp not explicitly changed.
  const changed={name:p.name,revision:old.revision+1,updatedAt:new Date(),updatedBy:{uid:'owner-roster-administration',profile:'user1'}};
  writes.push({update:{name:raw.name,fields:fields(changed)},updateMask:{fieldPaths:Object.keys(changed)},currentDocument:{updateTime:raw.updateTime}});
  writes.push({update:{name:`${raw.name}/versions/${changed.revision}`,fields:{...raw.fields,...fields(changed)}},currentDocument:{exists:false}});
}
for(let i=0;i<4;i++){
  const entry=invitations.convites[i];
  if(!entry?.codigo)throw new Error('Convite original ausente; nenhuma alteração foi aplicada.');
  const stored=await getAdminDocument(`${root}/invites/${createHash('sha256').update(entry.codigo).digest('hex')}`);
  if(stored?.role!==ROSTER[i].role)throw new Error('Permissão do convite original diferente do esperado.');
  entry.perfil=ROSTER[i].name;entry.expiresAt=new Date(stored.expiresAt).toISOString();
}
let felipe=invitations.convites.find(v=>v.perfil==='Felipe');
if(!felipe){
  const code=randomBytes(32).toString('hex'),expiresAt=Date.now()+7*86400000;
  writes.push(createWrite(`${root}/invites/${createHash('sha256').update(code).digest('hex')}`,{role:'admin',expiresAt,maxUses:2,uses:0,createdAt:Date.now()}));
  felipe={perfil:'Felipe',funcao:'Mestre da mesa',papel:'admin',codigo:code,expiresAt:new Date(expiresAt).toISOString()};
  invitations.convites.push(felipe);
}else{
  const stored=await getAdminDocument(`${root}/invites/${createHash('sha256').update(felipe.codigo).digest('hex')}`);
  if(stored?.role!=='admin')throw new Error('Convite existente do Felipe não confere.');
}
await mkdir('artifacts/roster',{recursive:true});
await writeFile('artifacts/roster/before.private.json',JSON.stringify(before,null,2));
// Save a recovery copy before the atomic commit; this directory is never published.
await writeFile('artifacts/roster/invitations-pending.private.json',JSON.stringify(invitations,null,2));
if(writes.length)await adminCommit(writes);
await writeFile(privateFile,JSON.stringify(invitations,null,2));
await writeFile('CONVITE-FELIPE.private.json',JSON.stringify({rede:invitations.rede,site:invitations.site,...felipe,dispositivosPorConvite:2,comoUsar:'Abra o site e cole o código na tela de acesso. Depois selecione Felipe. Este convite autoriza o dispositivo como administrador; mantenha o código privado.'},null,2));
const profiles=await Promise.all(ROSTER.map(p=>getAdminDocument(`${root}/profiles/${p.id}`)));
if(profiles.some((p,i)=>p?.name!==ROSTER[i].name))throw new Error('A verificação dos nomes não foi concluída.');
console.log(JSON.stringify({updated:true,profiles:profiles.map(p=>({id:p.id,name:p.name})),felipeInviteRole:'admin',privateFile:'CONVITE-FELIPE.private.json',preservedOriginalInvites:true}));
