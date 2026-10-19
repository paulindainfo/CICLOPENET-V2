import {doc,collection,runTransaction,getDoc,setDoc,serverTimestamp} from '../vendor/firebase.js';
import {validRecord,validProfile,searchTokens,PROFILE_IDS} from './domain.js';
const error=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
export async function operate(db,auth,profile,action,data={}){
  const uid=auth.currentUser?.uid;if(!uid)error('unauthenticated','Dispositivo não identificado.');
  const root=doc(db,'networks/principal'),col=name=>collection(root,name),member=doc(col('members'),uid);
  if(action==='redeemInvite'){
    if(!/^[a-f0-9]{64}$/.test(data.code))error('invalid-argument','Convite inválido.');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data.code)))].map(n=>n.toString(16).padStart(2,'0')).join('');
    const invite=doc(col('invites'),digest);
    await runTransaction(db,async tx=>{const [m,i]=await Promise.all([tx.get(member),tx.get(invite)]);if(m.data()?.active)return;const v=i.data();if(!v||v.expiresAt<Date.now()||v.uses>=v.maxUses)error('permission-denied','Convite inválido, expirado ou esgotado.');tx.set(member,{active:true,role:v.role,inviteHash:digest,createdAt:serverTimestamp()});tx.update(invite,{uses:v.uses+1});});
    return {ok:true};
  }
  const membership=(await getDoc(member)).data();
  if(!membership?.active)error('permission-denied','Este dispositivo precisa de um convite válido.');
  if(action==='access')return {role:membership.role};
  if(!PROFILE_IDS.includes(profile))error('invalid-argument','Selecione um dos quatro perfis.');
  const actor={uid,profile};
  if(action==='saveRecord'){
    const clean=validRecord(data.record),ref=doc(col('records'),data.id);
    if(clean.type==='event'&&!clean.fields.sortDate){const today=new Date();clean.fields.sortDate=clean.fields.realDate||`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;}
    if(clean.links.includes(data.id))error('invalid-argument','O arquivo não pode vincular a si próprio.');
    const linked=await Promise.all(clean.links.map(value=>getDoc(doc(col('records'),value))));
    if(linked.some(s=>!s.exists()))error('invalid-argument','Um vínculo não existe mais.');
    if(clean.sourceMessage&&!(await getDoc(doc(col('messages'),clean.sourceMessage))).exists())error('invalid-argument','Mensagem de origem não encontrada.');
    return runTransaction(db,async tx=>{
      const [snap,network]=await Promise.all([tx.get(ref),tx.get(root)]),old=snap.data();
      if((old?.revision||0)!==data.expectedRevision)error('aborted','Este registro mudou em outro terminal. Seu rascunho foi preservado. Reabra a versão atual antes de salvar.');
      if(old&&old.type!==clean.type)error('invalid-argument','A categoria não pode ser alterada.');
      const deleted=data.deleted===true,record={...clean,deleted,revision:(old?.revision||0)+1,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp(),createdBy:old?.createdBy||actor,updatedBy:actor,searchTokens:searchTokens(clean)};
      const counts={...(network.data()?.counts||{})};counts[record.type]=(counts[record.type]||0)+(deleted?0:1)-(old&&!old.deleted?1:0);
      tx.set(ref,record);tx.set(doc(collection(ref,'versions'),String(record.revision)),record);
      tx.update(root,{counts,lastRecordId:data.id,updatedAt:serverTimestamp()});
      tx.set(doc(col('activity'),`${data.id}_${record.revision}`),{profile,uid,action:deleted?'removeu':old?(old.deleted?'restaurou':'atualizou'):'registrou',recordId:data.id,title:clean.title,type:clean.type,revision:record.revision,createdAt:serverTimestamp()});
      return {id:data.id,revision:record.revision};
    }).catch(async e=>{if(e.code==='permission-denied'){const latest=(await getDoc(ref)).data();if((latest?.revision||0)!==data.expectedRevision)error('aborted','Este registro mudou em outro terminal. Seu rascunho foi preservado. Reabra a versão atual antes de salvar.');}throw e;});
  }
  if(action==='saveProfile'){
    const clean=validProfile(data.value),ref=doc(col('profiles'),profile);
    return runTransaction(db,async tx=>{const old=(await tx.get(ref)).data();if(old.revision!==data.expectedRevision)error('aborted','O perfil mudou em outro terminal. Reabra antes de editar.');const value={...clean,revision:old.revision+1,updatedAt:serverTimestamp(),updatedBy:actor};tx.set(ref,value);tx.set(doc(collection(ref,'versions'),String(value.revision)),value);return {ok:true};});
  }
  if(action==='sendMessage'){
    if(typeof data.body!=='string'||data.body.length>6000)error('invalid-argument','Mensagem deve ter até 6.000 caracteres.');
    const ref=doc(col('messages'),data.id);
    return runTransaction(db,async tx=>{const old=await tx.get(ref);if(old.exists())return {id:data.id};const shared=data.recordId?await tx.get(doc(col('records'),data.recordId)):null,p=(await tx.get(doc(col('profiles'),profile))).data();if(shared&&(!shared.exists()||shared.data().deleted))error('not-found','Registro indisponível.');tx.set(ref,{body:data.body.trim(),profile,uid,authorName:p.name,createdAt:serverTimestamp(),shared:shared?{id:data.recordId,title:shared.data().title,type:shared.data().type,summary:shared.data().summary}:null});return {id:data.id};});
  }
  if(action==='comment'){
    if(typeof data.body!=='string'||!data.body.trim()||data.body.length>12000)error('invalid-argument','Escreva uma observação de até 12.000 caracteres.');
    const ref=doc(col('contributions'),data.id);
    await runTransaction(db,async tx=>{if((await tx.get(ref)).exists())return;tx.set(ref,{recordId:data.recordId,body:data.body.trim(),profile,uid,createdAt:serverTimestamp()});});return {ok:true};
  }
  if(action==='favorite'){
    const {deleteDoc}=await import('../vendor/firebase.js');const ref=doc(col('favorites'),`${profile}_${data.recordId}`);
    if(data.enabled)await setDoc(ref,{profile,recordId:data.recordId});else await deleteDoc(ref);return {ok:true};
  }
  if(action==='saveCampaign'){
    if(membership.role!=='admin')error('permission-denied','Apenas o dispositivo administrador pode alterar a crônica.');
    return runTransaction(db,async tx=>{const old=(await tx.get(root)).data();if(old.revision!==data.expectedRevision)error('aborted','As configurações mudaram. Reabra a página.');const value=data.value;tx.update(root,{name:String(value.name||'').slice(0,100),city:String(value.city||'').slice(0,100),description:String(value.description||'').slice(0,8000),edition:String(value.edition||'').slice(0,100),revision:old.revision+1});return {ok:true};});
  }
  error('invalid-argument','Operação desconhecida.');
}
