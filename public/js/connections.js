import {getRecord,pageRecords,where,orderBy} from './database.js';
import {state,onCleanup} from './state.js';
import {esc,$,icon,errorMessage,recordUrl,empty} from './ui.js';
import {titleBlock,linkRow} from './records.js';
import {schemas} from './schema.js';
export async function connections(){
  let alive=true;onCleanup(()=>{alive=false;});
  $('#view').innerHTML=titleBlock('INTELIGÊNCIA RELACIONAL','Quadro de conexões','Escolha um arquivo e explore os vínculos ao seu redor.')+`<p class="notice">Cada ponto abre o registro correspondente. O quadro mostra até 40 conexões imediatas; a lista abaixo oferece a mesma navegação.</p><div id="connections-content"><p class="muted">Mapeando conexões…</p></div>`;
  try{
    const focus=new URLSearchParams(location.hash.split('?')[1]).get('id');
    let nodes=[],center;
    if(focus){center=await getRecord(focus);if(center){const incoming=await pageRecords([where('links','array-contains',focus),orderBy('updatedAt','desc')],null,40);const outgoing=await Promise.all(center.links.slice(0,40).map(getRecord));nodes=[center,...new Map([...outgoing.filter(Boolean),...incoming.rows].map(r=>[r.id,r])).values()].slice(0,41);}}
    else {const page=await pageRecords([where('deleted','==',false),orderBy('updatedAt','desc')],null,24);nodes=page.rows;center=nodes[0];}
    if(!alive)return;
    if(!nodes.length){$('#connections-content').innerHTML=empty('A rede ainda não tem conexões','Crie registros e associe-os para revelar os rastros.');return;}
    const points=nodes.map((r,i)=>{if(focus&&i===0)return {r,x:450,y:260};const a=(i/(nodes.length||1))*Math.PI*2;return {r,x:450+330*Math.cos(a),y:260+190*Math.sin(a)};});
    const lines=points.flatMap(p=>p.r.links.map(id=>points.find(q=>q.r.id===id)).filter(Boolean).map(q=>`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`)).join('');
    $('#connections-content').innerHTML=`<div class="connection-map"><svg viewBox="0 0 900 520" role="img" aria-label="Mapa de registros conectados"><g class="graph-lines">${lines}</g>${points.map(p=>`<a href="${recordUrl(p.r.id)}"><circle cx="${p.x}" cy="${p.y}" r="22" class="graph-node"/><text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="node-mark">${esc(schemas[p.r.type].singular.slice(0,1))}</text><text x="${p.x}" y="${p.y+43}" text-anchor="middle">${esc(p.r.title.slice(0,24))}</text></a>`).join('')}</svg></div><div class="panel"><h2>Arquivos mapeados</h2><div class="connection-list">${nodes.map(r=>`<div>${linkRow(r)}<a class="text-link small" href="#/connections?id=${r.id}">Explorar conexões deste arquivo →</a></div>`).join('')}</div></div>`;
  }catch(error){if(alive)$('#connections-content').textContent=errorMessage(error);}
}
