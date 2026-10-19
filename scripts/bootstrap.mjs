import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {initializeApp,applicationDefault,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
import {cliCredential} from './admin-auth.mjs';
const emulator=process.argv.includes('--emulator');
export async function bootstrap({local=emulator,projectId=local?'demo-ciclope':'schrecknet-e40df'}={}){
  if(local){process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8180';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';}
  if(!getApps().length)initializeApp({projectId,...(!local?{credential:cliCredential()}:{})});
  const db=getFirestore(),root=db.doc('networks/principal');
  await db.runTransaction(async tx=>{
    const existing=await tx.get(root);
    const profiles=await Promise.all([1,2,3,4].map(i=>tx.get(root.collection('profiles').doc(`user${i}`))));
    if(!existing.exists)tx.create(root,{name:'Crônica sem título',city:'',description:'',edition:'',revision:1,counts:{},createdAt:Date.now()});
    profiles.forEach((s,i)=>{if(!s.exists)tx.create(s.ref,{name:`Usuário ${i+1}`,clan:'',sect:'',player:'',signature:'',avatar:null,color:['#b3444b','#9d8968','#68899d','#9280ab'][i],revision:1,updatedAt:Date.now()});});
  });
  const invites=[];
  for(let i=0;i<4;i++){
    const code=randomBytes(32).toString('hex'),digest=createHash('sha256').update(code).digest('hex');
    await root.collection('invites').doc(digest).create({role:i===0?'admin':'member',expiresAt:Date.now()+7*86400000,maxUses:2,uses:0,createdAt:Date.now()});
    invites.push({code,role:i===0?'admin':'member'});
  }
  return invites;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{const invites=await bootstrap();console.log('Rede inicializada. Convites válidos por 7 dias, 2 dispositivos cada. NÃO publique estes códigos:');invites.forEach((v,i)=>console.log(`Perfil ${i+1} / ${v.role}: ${v.code}`));process.exit(0);}catch(e){console.error('Inicialização não concluída:',e.message);process.exit(1);}
}
