import {all,saveRecord,getRecord,revisions} from './database.js';
import {api} from './firebase.js';
import {state} from './state.js';
export async function exportBackup(){
  const [records,profiles,messages,contributions,favorites,files]=await Promise.all(['records','profiles','messages','contributions','favorites','files'].map(all));
  const versions={};for(const r of records)versions[r.id]=await revisions(r.id);
  const backup={format:'ciclope-net',version:2,exportedAt:new Date().toISOString(),campaign:state.campaign,records,profiles,messages,contributions,favorites,versions,files:files.map(f=>({...f,data:f.data.toBase64()}))};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ciclope-net-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);return records.length;
}
export function validateBackup(data){
  if(data?.format!=='ciclope-net'||data.version!==2||!Array.isArray(data.records)||data.records.length>2000)throw new Error('Selecione um backup CICLOPE NET versão 2 com até 2.000 registros.');
  const ids=new Set();for(const r of data.records){if(!r.id||ids.has(r.id)||!r.title||!r.type||!Array.isArray(r.links)||!Array.isArray(r.attachments))throw new Error('O backup contém registros inválidos ou IDs repetidos.');ids.add(r.id);}
  return data;
}
export async function importBackup(data,progress){
  validateBackup(data);
  // Persist only an import journal; database persistence always belongs to Firestore.
  const fingerprint=`${data.exportedAt||''}:${data.records.map(r=>r.id).join(',')}`;
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const key=`ciclope.import.${digest}`,stored=localStorage.getItem(key);
  const journal=stored?JSON.parse(stored):{map:Object.fromEntries(data.records.map(r=>[r.id,crypto.randomUUID()])),created:[],linked:[]};
  const map=journal.map,save=()=>localStorage.setItem(key,JSON.stringify(journal));save();
  const {db}=await import('./firebase.js'),{doc,getDoc,setDoc,Bytes,serverTimestamp}=await import('../vendor/firebase.js');
  for(const f of data.files||[]){const ref=doc(db,'networks/principal/files',f.id);if(!(await getDoc(ref)).exists()){const {id,...value}=f;await setDoc(ref,{...value,data:Bytes.fromBase64String(f.data),uploadedBy:state.uid,createdAt:serverTimestamp()});}}
  let completed=0;
  for(const record of data.records){
    if(!journal.created.includes(record.id)){
      const existing=await getRecord(map[record.id]);
      if(!existing){const clean={...record,links:[],sourceMessage:'',attachments:record.attachments.filter(a=>a.path?.startsWith('networks/principal/files/')),summary:record.summary||'',fields:record.fields||{},tags:record.tags||[]};await saveRecord(clean,0,map[record.id],record.deleted);}
      journal.created.push(record.id);save();
    }
    progress?.(++completed,data.records.length*2);
  }
  for(const record of data.records){
    if(!journal.linked.includes(record.id)){
      const existing=await getRecord(map[record.id]);
      const links=record.links.filter(v=>map[v]).map(v=>map[v]);
      if(links.length)await saveRecord({...existing,links},existing.revision,existing.id,existing.deleted);
      journal.linked.push(record.id);save();
    }
    progress?.(++completed,data.records.length*2);
  }
  localStorage.removeItem(key);return data.records.length;
}
