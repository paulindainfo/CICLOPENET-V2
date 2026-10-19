import {state,onCleanup} from './state.js';
import {live,limit,orderBy,collectionRef,query,getDocs,getDoc,documentRef,unpack} from './database.js';
import {startAfter} from '../vendor/firebase.js';
import {api} from './firebase.js';
import {esc,$,$$,icon,date,errorMessage,toast,recordUrl,busy} from './ui.js';
import {schemas} from './schema.js';
import {recordForm} from './forms.js';
import {hydrateImages} from './uploads.js';
export function chat(){
  $('#view').innerHTML=`<div class="chat-layout"><div class="chat-heading"><div><p class="eyebrow">COMUNICAÇÃO INTERNA</p><h1>Canal da rede <span class="tag"># coterie</span></h1></div><p class="muted small">Histórico compartilhado · 4 perfis</p></div><div id="message-scroll" class="message-scroll"><div class="load-row"><button id="older-messages" class="button secondary" hidden>Carregar mensagens anteriores</button></div><div class="channel-intro">${icon('rumor')}<h2>O silêncio também deixa rastros.</h2><p>Transmita informações. Compartilhe arquivos. Conecte as descobertas.</p></div><div id="messages"></div></div><button id="new-messages" class="new-messages" hidden>Novas transmissões ↓</button><form id="chat-form" class="chat-composer"><label class="sr-only" for="message-body">Sua mensagem</label><textarea id="message-body" name="body" maxlength="6000" rows="2" placeholder="Transmitir para a coterie…" required></textarea><div class="composer-bottom"><span class="muted small">Ctrl + Enter para transmitir · texto em várias linhas</span><button class="button primary" type="submit">Enviar ${icon('arrow')}</button></div><p id="chat-error" class="form-error" role="alert"></p></form></div>`;
  const draftKey=`ciclope.chat-draft.${state.profile}`,body=$('#message-body');body.value=localStorage.getItem(draftKey)||'';
  body.oninput=()=>{pendingId='';localStorage.setItem(draftKey,body.value);};
  let recent=[],older=[],pinned=[],cursor=null,first=true,alive=true;
  const draw=()=>{
    const scroller=$('#message-scroll'),nearBottom=scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<130;
    const messages=[...new Map([...pinned,...older,...recent].map(m=>[m.id,m])).values()].sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
    $('#messages').innerHTML=messages.map(m=>{const p=state.profiles.find(p=>p.id===m.profile);return `<article class="message ${m.profile===state.profile?'own':''}" id="message-${esc(m.id)}"><span class="avatar">${p?.avatar?`<img data-image="${esc(p.avatar.path)}" alt="">`:esc((p?.name||m.authorName).slice(0,1))}</span><div class="message-content"><div class="message-meta"><strong>${esc(p?.name||m.authorName)}</strong><time>${date(m.createdAt)}</time></div><p class="message-text">${esc(m.body)}</p>${m.shared?`<a class="shared-record" href="${recordUrl(m.shared.id)}">${icon(m.shared.type)}<span><small>ARQUIVO COMPARTILHADO · ${esc(schemas[m.shared.type]?.singular)}</small><strong>${esc(m.shared.title)}</strong><p>${esc(m.shared.summary)}</p></span>${icon('arrow')}</a>`:''}<div class="message-tools"><label>Preservar como <select data-convert="${esc(m.id)}" aria-label="Converter mensagem em registro"><option value="">Selecionar…</option><option value="theory">Teoria de investigação</option><option value="clue">Pista</option><option value="rumor">Rumor</option><option value="note">Anotação</option><option value="document">Documento / associar a NPC ou sessão</option></select></label><button class="text-button" data-copy="${esc(m.id)}">Copiar referência</button></div></div></article>`;}).join('');
    $$('[data-convert]').forEach(el=>el.onchange=()=>{if(!el.value)return;const m=messages.find(m=>m.id===el.dataset.convert);recordForm(el.value,null,{title:m.body.slice(0,80)||m.shared?.title||'Transmissão preservada',content:m.body,summary:'Registrado a partir de uma transmissão da coterie.',sourceMessage:m.id,links:m.shared?[m.shared.id]:[],fields:{}});el.value='';});
    $$('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(`${location.href.split('#')[0]}#/chat?message=${b.dataset.copy}`).then(()=>toast('Referência copiada.')).catch(()=>toast('Não foi possível copiar a referência.')));
    hydrateImages($('#messages'));
    if(first||nearBottom){scroller.scrollTop=scroller.scrollHeight;$('#new-messages').hidden=true;}else $('#new-messages').hidden=false;
    first=false;localStorage.setItem('ciclope.chat-seen',String(Date.now()));state.unread=0;
  };
  live('messages',[orderBy('createdAt','desc'),orderBy('__name__','desc'),limit(50)],(rows,snap)=>{recent=rows;cursor=older.length?cursor:snap.docs.at(-1);$('#older-messages').hidden=snap.size<50&&!older.length;draw();const target=new URLSearchParams(location.hash.split('?')[1]).get('message');if(target)$(`#message-${CSS.escape(target)}`)?.scrollIntoView({block:'center'});},e=>{$('#chat-error').textContent=errorMessage(e);});
  const target=new URLSearchParams(location.hash.split('?')[1]).get('message');if(target)getDoc(documentRef('messages',target)).then(s=>{if(alive&&s.exists()){pinned=[unpack(s)];draw();$(`#message-${CSS.escape(target)}`)?.scrollIntoView({block:'center'});}}).catch(e=>toast(errorMessage(e)));
  $('#older-messages').onclick=e=>busy(e.target,async()=>{try{const s=await getDocs(query(collectionRef('messages'),orderBy('createdAt','desc'),orderBy('__name__','desc'),startAfter(cursor),limit(50)));if(!alive)return;older.push(...s.docs.map(d=>({id:d.id,...d.data()})));cursor=s.docs.at(-1)||cursor;draw();$('#older-messages').hidden=s.size<50;}catch(error){toast(errorMessage(error));}});
  $('#new-messages').onclick=()=>{$('#message-scroll').scrollTop=$('#message-scroll').scrollHeight;$('#new-messages').hidden=true;};
  let pendingId='';
  $('#chat-form').onsubmit=async e=>{e.preventDefault();if(!body.value.trim())return;pendingId=pendingId||crypto.randomUUID();$('#chat-error').textContent='';await busy($('[type=submit]',e.target),async()=>{try{await api('sendMessage',{id:pendingId,body:body.value});pendingId='';body.value='';localStorage.removeItem(draftKey);}catch(error){$('#chat-error').textContent=errorMessage(error);}});};
  body.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){$('#chat-form').requestSubmit();e.preventDefault();}};
  onCleanup(()=>{alive=false;});
}
