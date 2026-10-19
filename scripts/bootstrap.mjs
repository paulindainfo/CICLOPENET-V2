import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {ROSTER,initialProfile} from '../public/js/roster.js';
const require=createRequire(import.meta.url);
const {initializeApp,applicationDefault,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
import {cliCredential} from './admin-auth.mjs';
const emulator=process.argv.includes('--emulator');
export async function bootstrap({local=emulator,projectId=local?'demo-ciclope':'schrecknet-e40df'}={}){
  if(!local){
    const {getAdminDocument,adminCommit,createWrite,project}=await import('./admin-rest.mjs');if(projectId!==project)throw new Error('Projeto de produção diferente da configuração autorizada.');
    const root='networks/principal',writes=[],existing=await getAdminDocument(root);
    if(!existing)writes.push(createWrite(root,{name:'Crônica sem título',city:'',description:'',edition:'',revision:1,counts:{},createdAt:Date.now()}));
    for(const p of ROSTER)if(!await getAdminDocument(`${root}/profiles/${p.id}`))writes.push(createWrite(`${root}/profiles/${p.id}`,initialProfile(p)));
    const invites=[];for(let i=0;i<ROSTER.length;i++){const code=randomBytes(32).toString('hex'),digest=createHash('sha256').update(code).digest('hex'),role=ROSTER[i].role;writes.push(createWrite(`${root}/invites/${digest}`,{role,expiresAt:Date.now()+7*86400000,maxUses:2,uses:0,createdAt:Date.now()}));invites.push({code,role});}
    await adminCommit(writes);return invites;
  }
  if(local){process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8180';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';}
  if(!getApps().length)initializeApp({projectId,...(!local?{credential:cliCredential()}:{})});
  const db=getFirestore(),root=db.doc('networks/principal');
  await db.runTransaction(async tx=>{
    const existing=await tx.get(root);
    const profiles=await Promise.all(ROSTER.map(p=>tx.get(root.collection('profiles').doc(p.id))));
    if(!existing.exists)tx.create(root,{name:'Crônica sem título',city:'',description:'',edition:'',revision:1,counts:{},createdAt:Date.now()});
    profiles.forEach((s,i)=>{if(!s.exists)tx.create(s.ref,initialProfile(ROSTER[i]));});
  });
  const invites=[];
  for(let i=0;i<ROSTER.length;i++){
    const code=randomBytes(32).toString('hex'),digest=createHash('sha256').update(code).digest('hex');
    await root.collection('invites').doc(digest).create({role:ROSTER[i].role,expiresAt:Date.now()+7*86400000,maxUses:2,uses:0,createdAt:Date.now()});
    invites.push({code,role:ROSTER[i].role});
  }
  return invites;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{const invites=await bootstrap(),outIndex=process.argv.indexOf('--out');if(outIndex>=0){const destination=path.resolve(process.argv[outIndex+1]||'');if(!destination.endsWith('.private.json'))throw new Error('O arquivo de convites deve terminar em .private.json.');await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,JSON.stringify({rede:'CICLOPE NET V2',site:'https://paulindainfo.github.io/CICLOPENET-V2/',expiresAt:new Date(Date.now()+7*86400000).toISOString(),dispositivosPorConvite:2,orientacao:'Cole o código na tela de acesso. O convite de administrador deve ficar com o responsável pela crônica. Não publique este arquivo.',convites:invites.map((v,i)=>({perfil:ROSTER[i].name,papel:v.role,codigo:v.code}))},null,2));console.log(`Rede e cinco perfis inicializados. Convites salvos em arquivo privado: ${destination}`);}else{console.log('Rede inicializada. Convites válidos por 7 dias, 2 dispositivos cada. NÃO publique estes códigos:');invites.forEach((v,i)=>console.log(`Perfil ${i+1} / ${v.role}: ${v.code}`));}process.exit(0);}catch(e){console.error('Inicialização não concluída:',e.message);process.exit(1);}
}
