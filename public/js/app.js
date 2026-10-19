import {identify,api,auth,db,emulator} from './firebase.js';
import {doc,onSnapshot,getDoc} from '../vendor/firebase.js';
import {state,setProfile,cleanupRoute,currentProfile} from './state.js';
import {esc,$,$$,icon,errorMessage,toast} from './ui.js';
import {live,limit,orderBy} from './database.js';
import {profilePicker,editProfile,avatar} from './profiles.js';
import {dashboard,activityFeed} from './dashboard.js';
import {renderList,renderRecord} from './records.js';
import {chat} from './chat.js';
import {search} from './search.js';
import {connections} from './connections.js';
import {settings,favorites} from './settings.js';
import {schemas} from './schema.js';
import {hydrateImages} from './uploads.js';

const nav=[['PRINCIPAL',[['dashboard','Visão da rede'],['chat','Canal da rede'],['search','Pesquisa']]],['BANCO DE DADOS',[['person','Pessoas'],['place','Locais'],['rumor','Rumores'],['investigation','Investigações'],['clue','Pistas'],['theory','Teorias'],['document','Documentos'],['connections','Conexões']]],['CRÔNICA',[['session','Sessões'],['event','Cronologia']]],['SEU TERMINAL',[['profile','Meu perfil'],['note','Anotações'],['favorites','Favoritos'],['settings','Configurações']]]];
let globals=[],mounted=false;
const routeName=()=>location.hash.replace(/^#\/?/,'').split(/[/?]/)[0]||'dashboard';
function shell(){
  const p=currentProfile();if(!p){setProfile('');profilePicker();mounted=false;return;}
  $('#app').innerHTML=`<div class="shell"><aside class="sidebar" id="sidebar"><a href="#/" class="brand"><img src="assets/sigil.svg" alt=""><span><strong>CICLOPE NET</strong><small>Nosferatu Information Network</small></span></a><nav aria-label="Navegação principal">${nav.map(([group,links])=>`<div class="nav-group">${group}</div>${links.map(([route,label])=>`<a class="nav-link" href="#/${route}" data-route="${route}">${icon(route==='connections'?'network':route==='favorites'?'star':route==='profile'?'person':route)}<span>${label}</span>${route==='chat'?'<span id="unread-badge" class="nav-badge" hidden></span>':''}</a>`).join('')}`).join('')}</nav><div class="sidebar-status"><span class="status-dot" id="network-dot"></span><span id="network-status">VERIFICANDO CONEXÃO</span></div></aside><div class="content-area"><header class="topbar"><button class="icon-button mobile-toggle" id="mobile-menu" aria-label="Abrir menu" aria-expanded="false">${icon('menu')}</button><div class="breadcrumb mono">CICLOPE / <b id="breadcrumb">VISÃO DA REDE</b></div><a href="#/search" class="top-search">${icon('search')}Pesquisar na rede…<kbd>Ctrl K</kbd></a><button class="top-profile" id="top-profile">${avatar(p)}<span>${esc(p.name)}<small>TERMINAL AUTORIZADO</small></span></button></header><div id="connection-strip" class="connection-strip" hidden></div><main id="main"><div class="view" id="view" tabindex="-1"></div></main></div></div>`;
  $('#mobile-menu').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#mobile-menu').setAttribute('aria-expanded',String(open));};
  $('#top-profile').onclick=()=>{location.hash='#/profile';};
  $$('[data-route]').forEach(a=>a.onclick=()=>{$('#sidebar').classList.remove('open');$('#mobile-menu').setAttribute('aria-expanded','false');});
  mounted=true;hydrateImages();connectionState();route();
}
function route(){
  cleanupRoute();if(!state.ready)return;if(!state.profile){mounted=false;profilePicker();return;}if(!mounted){shell();return;}
  $('#modal').close();const name=routeName(),id=location.hash.split('?')[0].split('/')[2];
  const label=nav.flatMap(([,links])=>links).find(([r])=>r===name)?.[1]||'ARQUIVO';$('#breadcrumb').textContent=label.toUpperCase();document.title=`${label} · CICLOPE NET`;
  $$('[data-route]').forEach(a=>{a.classList.toggle('active',a.dataset.route===name);if(a.dataset.route===name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(name==='dashboard'){dashboard();activityFeed();}
  else if(schemas[name])renderList(name);
  else if(name==='record'&&id)renderRecord(decodeURIComponent(id));
  else if(name==='chat')chat();
  else if(name==='search')search();
  else if(name==='profile')editProfile();
  else if(name==='settings')settings();
  else if(name==='favorites')favorites();
  else if(name==='connections')connections();
  else {location.hash='#/';return;}
  window.scrollTo(0,0);
}
function connectionState(fromCache){
  if(!$('#network-status'))return;const offline=!navigator.onLine||fromCache===true;
  $('#network-status').textContent=emulator?'AMBIENTE DE TESTES':offline?'CONEXÃO PENDENTE':'REDE CONECTADA';
  $('#network-dot').classList.toggle('open',offline);
  $('#connection-strip').hidden=!offline;$('#connection-strip').textContent='Conexão interrompida ou aguardando o servidor. Os dados exibidos podem estar desatualizados; seus rascunhos ficam neste navegador.';
}
function gate(message=''){
  mounted=false;state.ready=false;cleanupRoute();globals.forEach(fn=>fn());globals=[];
  $('#app').innerHTML=`<main id="main" class="gate"><div class="gate-visual"><a class="gate-brand" href="#/"><img src="assets/sigil.svg" alt="" width="45"><span>CICLOPE NET<small>Nosferatu Information Network</small></span></a><div class="gate-statement"><p class="eyebrow">REDE SUBTERRÂNEA / ACESSO POR CONVITE</p><h1>A cidade guarda<br>seus segredos.<br><em>Nós, os registros.</em></h1><p>Pessoas. Pistas. Histórias que não podem desaparecer.<br>Conhecimento é a moeda dos que observam.</p></div><span class="eyebrow">O OLHO PERMANECE ABERTO.</span></div><section class="gate-content"><p class="eyebrow">TERMINAL DE ACESSO</p><h2>Entre na rede.</h2><p class="muted">No primeiro acesso deste dispositivo, use o convite privado da sua coterie. Depois, basta escolher seu personagem.</p><form class="gate-form" id="invite-form"><label class="field"><span>Convite da rede</span><input id="invite-code" name="code" placeholder="Cole o convite recebido" maxlength="200" autocomplete="off" spellcheck="false" required></label><button type="submit" class="button primary">Autorizar este terminal ${icon('arrow')}</button><p class="form-error" id="gate-error" role="alert">${esc(message)}</p></form><button id="retry-connect" class="text-button">Já autorizei este terminal · tentar reconectar</button><details><summary>A rede ainda não foi ativada?</summary><div class="setup-details"><p>A V2 precisa de seu servidor Firebase publicado e dos quatro perfis inicializados. Esta tela não substitui o banco de dados.</p><p>O responsável deve seguir o README do projeto: autorizar o Firebase, provisionar o banco e o área exclusiva no Firestore, publicar as regras e índices e gerar os convites.</p><p>Sem email e senha para os jogadores. A autorização técnica do dispositivo acontece pelo Firebase Anonymous Auth. O convite não fica no código ou no endereço do site.</p></div></details><p class="gate-footer">CICLOPE NET V2 · A seleção de personagem é identidade declarada, não autenticação pessoal.</p></section></main>`;
  $('#retry-connect').onclick=()=>start();
  $('#invite-form').onsubmit=async e=>{e.preventDefault();const button=$('[type=submit]',e.target);button.disabled=true;try{await identify();await api('redeemInvite',{code:$('#invite-code').value.trim()});$('#invite-code').value='';await auth.currentUser.getIdToken(true);await start();}catch(error){$('#gate-error').textContent=errorMessage(error);}finally{button.disabled=false;}};
}
async function start(){
  try{
    await identify();const access=await api('access');state.role=access.role;await auth.currentUser.getIdToken(true);
    state.campaign=(await getDoc(doc(db,'networks','principal'))).data()||{};
    globals.forEach(fn=>fn());globals=[];
    let resolveProfiles;const ready=new Promise(resolve=>{resolveProfiles=resolve;});
    globals.push(live('profiles',[],rows=>{state.profiles=rows.sort((a,b)=>a.id.localeCompare(b.id));resolveProfiles();if(mounted){const p=currentProfile();if(p){$('#top-profile').innerHTML=avatar(p)+`<span>${esc(p.name)}<small>TERMINAL AUTORIZADO</small></span>`;hydrateImages($('#top-profile'));}}},error=>gate(errorMessage(error)),false));
    globals.push(onSnapshot(doc(db,'networks','principal'),{includeMetadataChanges:true},snapshot=>{state.campaign=snapshot.data()||{};connectionState(snapshot.metadata.fromCache);$$('[data-count]').forEach(el=>el.textContent=state.campaign.counts?.[el.dataset.count]||0);},error=>gate(errorMessage(error))));
    await ready;
    if(state.profiles.length!==4){gate('A rede ainda precisa ser inicializada com os quatro perfis.');return;}
    state.ready=true;
    globals.push(live('messages',[orderBy('createdAt','desc'),limit(30)],rows=>{const seen=Number(localStorage.getItem('ciclope.chat-seen')||Date.now());state.unread=routeName()==='chat'?0:rows.filter(m=>m.createdAt>seen&&m.profile!==state.profile).length;const badge=$('#unread-badge');if(badge){badge.hidden=!state.unread;badge.textContent=String(state.unread);}},()=>{},false));
    if(state.profile)shell();else profilePicker();
  }catch(error){gate(errorMessage(error));}
}
addEventListener('hashchange',route);addEventListener('ciclope:profile',()=>{mounted=false;cleanupRoute();if(state.profile)shell();else profilePicker();});
addEventListener('online',()=>connectionState());addEventListener('offline',()=>connectionState(true));
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(state.ready)location.hash='#/search';}});
addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(errorMessage(e.reason||{}));});
start();
