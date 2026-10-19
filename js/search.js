import {state,onCleanup} from './state.js';
import {pageRecords,where,orderBy} from './database.js';
import {esc,$,empty,errorMessage,busy} from './ui.js';
import {card,titleBlock} from './records.js';
import {normalized} from './forms.js';
import {schemas} from './schema.js';
import {hydrateImages} from './uploads.js';
export function search(){
  const initial=new URLSearchParams(location.hash.split('?')[1]).get('q')||'';
  $('#view').innerHTML=titleBlock('CONSULTA AOS ARQUIVOS','Pesquisa na rede','Nomes, palavras e tags. Todos os arquivos, em uma única consulta.')+`<form id="search-form" class="global-search-form"><input id="search-input" aria-label="Pesquisar em toda a rede" value="${esc(initial)}" placeholder="O que você está procurando?" minlength="2" maxlength="120" required><button class="button primary" type="submit">Pesquisar</button></form><p class="muted small">Busca por palavras completas no conteúdo e prefixos em nomes, tags e campos. Mínimo de duas letras. Resultados paginados; sem busca semântica.</p><div id="search-results">${empty('Toda informação deixa um rastro','Pesquise por um nome, assunto ou tag da sua crônica.')}</div><div class="load-row"><button id="search-more" class="button secondary" hidden>Continuar buscando</button></div>`;
  let constraints=[],cursor=null,rows=[],terms=[],seq=0,alive=true;
  const draw=()=>{
    const matches=rows.filter(r=>terms.every(t=>normalized([r.title,r.summary,r.content,...r.tags,...Object.values(r.fields)].join(' ')).includes(t)));
    $('#search-results').innerHTML=matches.length?Object.entries(schemas).filter(([type])=>matches.some(r=>r.type===type)).map(([type,spec])=>`<section class="search-group"><h2>${spec.label} <span>${matches.filter(r=>r.type===type).length}</span></h2><div class="record-grid">${matches.filter(r=>r.type===type).map(card).join('')}</div></section>`).join(''):empty('Nenhum registro nesta página','Tente outro termo ou continue a consulta, se houver mais resultados.');hydrateImages($('#search-results'));
  };
  const next=async()=>{const request=seq;const page=await pageRecords(constraints,cursor,60);if(!alive||request!==seq)return;rows.push(...page.rows);cursor=page.cursor;$('#search-more').hidden=!page.more;draw();};
  const run=async()=>{terms=normalized($('#search-input').value).split(' ').filter(t=>t.length>=2);if(!terms.length){$('#search-results').innerHTML=empty('Use uma palavra de duas letras ou mais','Artigos isolados não são indexados.');return;}seq++;cursor=null;rows=[];constraints=[where('searchTokens','array-contains',terms[0]),where('deleted','==',false),orderBy('updatedAt','desc')];$('#search-results').textContent='Pesquisando arquivos…';try{await next();}catch(error){$('#search-results').innerHTML=empty('Consulta interrompida',errorMessage(error));}};
  $('#search-form').onsubmit=e=>{e.preventDefault();run();};$('#search-more').onclick=e=>busy(e.target,()=>next().catch(error=>{$('#search-results').textContent=errorMessage(error);}));
  if(initial)run();onCleanup(()=>{alive=false;seq++;});
}
