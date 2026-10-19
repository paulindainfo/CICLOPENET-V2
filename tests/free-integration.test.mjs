import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,getDoc,setDoc,collection,query,limit,getDocs,onSnapshot,terminate,Bytes,serverTimestamp,where,orderBy} from 'firebase/firestore';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {bootstrap} from '../scripts/bootstrap.mjs';
const invites=await bootstrap({local:true});
const adminRequire=createRequire(import.meta.url),adminDb=adminRequire('firebase-admin/firestore').getFirestore();for(const name of ['records','activity','files','messages','contributions','favorites'])await adminDb.recursiveDelete(adminDb.collection('networks/principal/'+name));await adminDb.doc('networks/principal').update({counts:{},revision:1});for(let i=1;i<=4;i++)await adminDb.doc('networks/principal/profiles/user'+i).update({revision:1});await adminDb.recursiveDelete(adminDb.collection('networks/principal/profiles/user1/versions'));
await mkdir(new URL('../artifacts',import.meta.url),{recursive:true});
await writeFile(new URL('../artifacts/operations-node.mjs',import.meta.url),(await readFile(new URL('../public/js/operations.js',import.meta.url),'utf8')).replaceAll('../vendor/firebase.js','firebase/firestore').replaceAll('./domain.js','../public/js/domain.js'));
const {operate}=await import('../artifacts/operations-node.mjs');
async function client(name){
  const app=initializeApp({projectId:'demo-ciclope',apiKey:'demo-key'},name),auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});await signInAnonymously(auth);
  const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8180);
  return {app,auth,db,call:(action,data={})=>operate(db,auth,data.profile||'user1',action,data)};
}
const a=await client('terminal-a'),b=await client('terminal-b'),stranger=await client('outsider');
const ref=(client,id)=>doc(client.db,'networks/principal/records',id);
const base={type:'person',title:'Victor — teste de integração',summary:'Observação inicial',content:'<img src=x onerror=alert(1)>',fields:{clan:'Ventrue'},links:[],tags:['teste'],attachments:[]};
test('arquitetura gratuita: regras, persistência e colaboração',async t=>{
  await t.test('visitante sem convite não lê, não grava e não se concede permissão',async()=>{
    await assert.rejects(getDoc(ref(stranger,'npc-victor')),/permission|Missing/i);
    await assert.rejects(stranger.call('saveRecord',{id:'bad',record:base,expectedRevision:0}),/convite/i);
    await assert.rejects(setDoc(doc(stranger.db,'networks/principal/members',stranger.auth.currentUser.uid),{active:true,role:'admin',createdAt:serverTimestamp(),inviteHash:'0'.repeat(64)}));
    await assert.rejects(stranger.call('redeemInvite',{code:'0'.repeat(64)}),/inválido/i);
  });
  await t.test('dois dispositivos entram por convite e recuperam quatro perfis',async()=>{
    await a.call('redeemInvite',{code:invites[0].code});await b.call('redeemInvite',{code:invites[1].code});
    assert.equal((await getDocs(query(collection(a.db,'networks/principal/profiles'),limit(4)))).size,4);
    assert.equal((await a.call('access')).role,'admin');assert.equal((await b.call('access')).role,'member');
  });
  await t.test('NPC persiste e é recebido em outro terminal em tempo real',async()=>{
    const received=new Promise((resolve,reject)=>{let unsub;const timer=setTimeout(()=>{unsub();reject(new Error('Timeout'));},15000);unsub=onSnapshot(ref(b,'npc-victor'),s=>{if(s.exists()){clearTimeout(timer);unsub();resolve(s.data());}},reject);});
    await a.call('saveRecord',{id:'npc-victor',record:base,expectedRevision:0});const data=await received;assert.equal(data.title,base.title);assert.equal(data.content,base.content);assert.equal(data.revision,1);
  });
  await t.test('edição concorrente acusa conflito e preserva versões',async()=>{
    const results=await Promise.allSettled([a.call('saveRecord',{id:'npc-victor',record:{...base,summary:'Edição A'},expectedRevision:1}),b.call('saveRecord',{id:'npc-victor',record:{...base,summary:'Edição B'},expectedRevision:1,profile:'user2'})]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/mudou em outro terminal/);
    assert.equal((await getDoc(doc(a.db,'networks/principal/records/npc-victor/versions/1'))).data().summary,base.summary);
  });
  await t.test('cliente não burla versão, autoria, histórico, contadores ou permissões',async()=>{
    const current=(await getDoc(ref(a,'npc-victor'))).data();
    await assert.rejects(setDoc(ref(a,'npc-victor'),{...current,title:'Forjado'}));
    await assert.rejects(setDoc(doc(b.db,'networks/principal'),{name:'Forjado',counts:{person:100000}}));
    await assert.rejects(setDoc(doc(b.db,'networks/principal/members',b.auth.currentUser.uid),{active:true,role:'admin'}));
    await assert.rejects(setDoc(doc(a.db,'networks/principal/records/npc-victor/versions/1'),{...current,title:'Versão reescrita'}));
  });
  await t.test('investigação e pista mantêm relações entre entidades',async()=>{
    await a.call('saveRecord',{id:'invest-1',expectedRevision:0,record:{...base,type:'investigation',title:'Desaparecimento',fields:{status:'open'},links:['npc-victor']}});
    await b.call('saveRecord',{id:'clue-1',profile:'user2',expectedRevision:0,record:{...base,type:'clue',title:'Foto do hospital',fields:{status:'Não verificada'},links:['npc-victor','invest-1']}});
    assert.deepEqual((await getDoc(ref(a,'clue-1'))).data().links,['npc-victor','invest-1']);
  });
  await t.test('chat compartilha cartão e mensagem vira teoria rastreável',async()=>{
    await a.call('sendMessage',{id:'msg-1',body:'Victor estava no hospital.\nPrecisamos investigar.',recordId:'npc-victor'});await a.call('sendMessage',{id:'msg-1',body:'Duplicada'});
    const m=(await getDoc(doc(b.db,'networks/principal/messages/msg-1'))).data();assert.equal(m.shared.title,base.title);assert.ok(m.body.includes('\n'));
    await b.call('saveRecord',{id:'theory-1',profile:'user2',expectedRevision:0,record:{...base,type:'theory',title:'Hipótese do hospital',sourceMessage:'msg-1',links:['invest-1','npc-victor']}});
    assert.equal((await getDoc(ref(a,'theory-1'))).data().sourceMessage,'msg-1');
  });
  await t.test('contribuições de dois jogadores persistem separadamente',async()=>{
    await Promise.all([a.call('comment',{id:'c-1',recordId:'invest-1',body:'Observação A'}),b.call('comment',{id:'c-2',recordId:'invest-1',body:'Observação B',profile:'user2'})]);
    assert.equal((await getDoc(doc(a.db,'networks/principal/contributions/c-1'))).data().body,'Observação A');assert.equal((await getDoc(doc(b.db,'networks/principal/contributions/c-2'))).data().body,'Observação B');
  });
  await t.test('lixeira preserva versões e vínculos',async()=>{
    const current=(await getDoc(ref(a,'npc-victor'))).data();await a.call('saveRecord',{id:'npc-victor',record:current,expectedRevision:current.revision,deleted:true});assert.equal((await getDoc(ref(b,'npc-victor'))).data().deleted,true);assert.equal((await getDoc(ref(b,'clue-1'))).data().links[0],'npc-victor');await a.call('saveRecord',{id:'npc-victor',record:current,expectedRevision:current.revision+1});
  });
  await t.test('arquivos binários são compartilhados; HTML e visitantes são negados',async()=>{
    const path='networks/principal/files/pdf-test',data=Bytes.fromUint8Array(new TextEncoder().encode('%PDF-1.4\n%%EOF')),file={path,name:'teste.pdf',type:'application/pdf',size:14,data,uploadedBy:a.auth.currentUser.uid,createdAt:serverTimestamp()};file.size=data.toUint8Array().byteLength;
    await assert.rejects(setDoc(doc(stranger.db,path),{...file,uploadedBy:stranger.auth.currentUser.uid}));await assert.rejects(setDoc(doc(a.db,path),{...file,type:'text/html'}));await setDoc(doc(a.db,path),file);assert.equal((await getDoc(doc(b.db,path))).data().size,file.size);
  });
  await t.test('perfil pode ser personalizado sem autenticação individual',async()=>{
    await a.call('saveProfile',{expectedRevision:1,value:{name:'Olho de Vidro',clan:'Nosferatu',signature:'Conhecimento é moeda.',color:'#b3444b'}});assert.equal((await getDoc(doc(b.db,'networks/principal/profiles/user1'))).data().name,'Olho de Vidro');
  });
  await t.test('configuração administrativa depende do dispositivo, não do perfil',async()=>{
    await assert.rejects(b.call('saveCampaign',{expectedRevision:1,value:{name:'Não autorizado'}}),/administrador/i);await a.call('saveCampaign',{profile:'user4',expectedRevision:1,value:{name:'Crônica de teste',city:'São Paulo',description:'',edition:'Livre'}});assert.equal((await getDoc(doc(b.db,'networks/principal'))).data().name,'Crônica de teste');
  });
  await t.test('conta anônima da V2 não lê o banco legado',async()=>{await assert.rejects(getDoc(doc(a.db,'campaigns/principal/pessoas/test')));});
  await t.test('cronologia preserva data ficcional livre e inclui ordenação automática',async()=>{
    await a.call('saveRecord',{id:'event-1',expectedRevision:0,record:{...base,type:'event',title:'A terceira lua',fields:{fictionalDate:'Noite da terceira lua',eventType:'Histórico'}}});
    const event=(await getDoc(ref(b,'event-1'))).data();assert.equal(event.fields.fictionalDate,'Noite da terceira lua');assert.match(event.fields.sortDate,/^\d{4}-\d{2}-\d{2}$/);
    const result=await getDocs(query(collection(b.db,'networks/principal/records'),where('type','==','event'),orderBy('fields.sortDate'),limit(40)));assert.equal(result.size,1);
  });
  await t.test('formulário extenso respeita os limites de avaliação das regras',async()=>{
    const {TEXT_FIELDS}=await import('../public/js/domain.js');
    const fields=Object.fromEntries(TEXT_FIELDS.map(k=>[k,'Texto detalhado']));
    const targets=[];for(let i=0;i<24;i++){const id='target-'+i;await a.call('saveRecord',{id,expectedRevision:0,record:{...base,title:'Alvo '+i}});targets.push(id);}
    const attachments=Array.from({length:4},()=>({path:'networks/principal/files/pdf-test',name:'teste.pdf',type:'application/pdf',size:14}));
    await a.call('saveRecord',{id:'full-record',expectedRevision:0,record:{...base,title:'Registro detalhado',fields,tags:Array.from({length:12},(_,i)=>'tag'+i),links:targets,attachments}});
    assert.equal((await getDoc(ref(b,'full-record'))).data().links.length,24);
  });
});
test.after(async()=>{
  for(const c of [a,b,stranger]){await terminate(c.db);await deleteApp(c.app);}
  const require=createRequire(import.meta.url);await require('firebase-admin/firestore').getFirestore().terminate();for(const app of require('firebase-admin/app').getApps())await require('firebase-admin/app').deleteApp(app);
});
