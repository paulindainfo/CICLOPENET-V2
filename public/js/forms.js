import {schemas,labels,fieldOptions,statuses} from './schema.js';
import {esc,$,$$,icon,openModal,busy,toast,errorMessage,recordUrl} from './ui.js';
import {saveRecord,pageRecords,getRecord,where,orderBy} from './database.js';
import {state} from './state.js';
import {upload} from './uploads.js';
export const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function inputField(type,key,value=''){
  const options=fieldOptions(type,key), long=['appearance','personality','history','motivations','confirmed','suspicions','observations','hypothesis','questions','conclusions','happenings','discoveries','decisions','consequences','openMysteries','resolvedMysteries','objectives','contacts'].includes(key);
  let control;
  if(options)control=`<select name="field.${key}">${options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o||'Não informado'];return `<option value="${esc(v)}" ${value===v?'selected':''}>${esc(l)}</option>`;}).join('')}</select>`;
  else if(long)control=`<textarea name="field.${key}" rows="3" maxlength="12000">${esc(value)}</textarea>`;
  else control=`<input name="field.${key}" value="${esc(value)}" ${key==='realDate'?'type="date"':'type="text"'} maxlength="12000" ${key==='sortDate'?'placeholder="Ex.: 0012-03 — ordenação textual"':''}>`;
  return `<label class="field ${long?'wide':''}"><span>${esc(labels[key])}</span>${control}</label>`;
}
export function recordForm(type,record=null,prefill={}){
  const spec=schemas[type], initial=record||{type,title:'',summary:'',content:'',tags:[],links:[],attachments:[],fields:{...(type==='investigation'?{status:'open'}:{})},...prefill};
  const draftKey=`ciclope.draft.${state.profile}.${record?.id||type}`, saved=localStorage.getItem(draftKey);
  let base=initial, expected=record?.revision||0;
  if(saved){try{const draft=JSON.parse(saved);if(confirm('Existe um rascunho neste navegador. Recuperar o texto?')){base=draft.record;expected=draft.revision;}}catch{localStorage.removeItem(draftKey);}}
  let links=[...(base.links||[])],attachments=[...(base.attachments||[])],dirty=false;const linkTitles=new Map();
  const modal=openModal(`${record?'Editar':'Registrar'} ${spec.singular.toLowerCase()}`,`
    <form id="record-form" class="editor">
      <p class="muted">Comece com o essencial. Os detalhes podem chegar depois.</p>
      <label class="field"><span>${type==='person'||type==='place'?'Nome':'Título'} <b>*</b></span><input name="title" maxlength="160" value="${esc(base.title)}" required autofocus></label>
      <div class="form-grid">${spec.quick.map(key=>inputField(type,key,base.fields?.[key])).join('')}</div>
      <label class="field"><span>Resumo / observação rápida</span><textarea name="summary" rows="3" maxlength="600">${esc(base.summary)}</textarea></label>
      <details ${record?'open':''}><summary>Descrição e informações detalhadas</summary><label class="field"><span>Descrição / conteúdo</span><textarea name="content" rows="7" maxlength="40000">${esc(base.content)}</textarea></label><div class="form-grid">${spec.detail.map(key=>inputField(type,key,base.fields?.[key])).join('')}</div></details>
      <label class="field"><span>Tags <small>separadas por vírgula</small></span><input name="tags" maxlength="1200" value="${esc((base.tags||[]).join(', '))}" placeholder="desaparecimentos, centro, Camarilla"></label>
      <fieldset><legend>Registros relacionados</legend><p class="muted small">Vincule pessoas, pistas, locais e sessões. Pesquise duas letras ou mais.</p><div id="linked-chips" class="chips"></div><input id="link-query" aria-label="Pesquisar registros para vincular" placeholder="Buscar na rede…" autocomplete="off"><div id="link-results" class="picker-results"></div></fieldset>
      <fieldset><legend>Imagens e anexos</legend><p class="muted small">JPG, PNG, WebP, GIF, PDF ou TXT · até 900 KB por arquivo · 4 anexos.</p><div id="attachment-list"></div><input id="file-input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain" aria-label="Adicionar arquivos"></fieldset>
      <p id="form-error" class="form-error" role="alert"></p><div class="editor-footer"><span class="muted small" id="draft-state">${saved?'Rascunho disponível neste navegador':'Alterações ainda não enviadas'}</span><button type="button" class="button secondary" id="cancel-edit">Cancelar</button><button class="button primary" type="submit">${icon('plus')}Salvar na rede</button></div>
    </form>`);
  const form=$('#record-form');
  const collect=()=>{
    const data=new FormData(form), fields={};
    for(const [key,value] of data)if(key.startsWith('field.'))fields[key.slice(6)]=String(value);
    return {type,title:String(data.get('title')),summary:String(data.get('summary')),content:String(data.get('content')),tags:String(data.get('tags')).split(',').map(v=>v.trim()).filter(Boolean),fields,links,attachments,sourceMessage:base.sourceMessage||'',ownerProfile:type==='note'?state.profile:''};
  };
  const persist=()=>{dirty=true;try{localStorage.setItem(draftKey,JSON.stringify({record:collect(),revision:expected}));$('#draft-state').textContent='Rascunho salvo neste navegador';}catch{$('#draft-state').textContent='Sem espaço para rascunho local';}};
  form.addEventListener('input',persist);
  const close=()=>{if(!dirty||confirm('Fechar a edição? O rascunho fica salvo neste navegador.'))modal.close();};
  $('#close-modal').onclick=close;$('#cancel-edit').onclick=close;
  modal.oncancel=e=>{e.preventDefault();close();};
  const showLinks=()=>{$('#linked-chips').innerHTML=links.map(value=>`<span class="chip">${esc(linkTitles.get(value)||value.slice(0,8))}<button type="button" data-unlink="${esc(value)}" aria-label="Remover vínculo">×</button></span>`).join('');$$('[data-unlink]',form).forEach(b=>b.onclick=()=>{links=links.filter(v=>v!==b.dataset.unlink);showLinks();persist();});};
  const showAttachments=()=>{$('#attachment-list').innerHTML=attachments.map((a,i)=>`<p class="attachment-row">${icon(a.type.startsWith('image/')?'person':'document')} ${esc(a.name)} <button type="button" class="text-button" data-remove-file="${i}">Remover</button></p>`).join('');$$('[data-remove-file]',form).forEach(b=>b.onclick=()=>{attachments.splice(Number(b.dataset.removeFile),1);showAttachments();persist();});};
  showLinks();showAttachments();
  Promise.all(links.map(getRecord)).then(rows=>{rows.filter(Boolean).forEach(r=>linkTitles.set(r.id,r.title));if(form.isConnected)showLinks();}).catch(()=>{});
  let searchTimer,sequence=0;
  $('#link-query').oninput=e=>{clearTimeout(searchTimer);const value=normalized(e.target.value).split(' ')[0],request=++sequence;if(value.length<2){$('#link-results').innerHTML='';return;}searchTimer=setTimeout(async()=>{
    try{const page=await pageRecords([where('searchTokens','array-contains',value),where('deleted','==',false),orderBy('updatedAt','desc')],null,12);if(request!==sequence||!modal.open)return;$('#link-results').innerHTML=page.rows.filter(r=>r.id!==record?.id&&!links.includes(r.id)).map(r=>`<button type="button" class="picker-item" data-link="${esc(r.id)}">${icon(r.type)}<span>${esc(r.title)}<small>${schemas[r.type].singular}</small></span>${icon('plus')}</button>`).join('')||'<p class="muted small">Nenhum registro encontrado.</p>';$$('[data-link]',form).forEach(b=>b.onclick=()=>{linkTitles.set(b.dataset.link,page.rows.find(r=>r.id===b.dataset.link)?.title||b.dataset.link);links.push(b.dataset.link);showLinks();persist();b.remove();});}catch(error){$('#link-results').textContent=errorMessage(error);}
  },300);};
  form.onsubmit=async e=>{
    e.preventDefault();$('#form-error').textContent='';
    await busy($('[type=submit]',form),async()=>{
      try{
        const files=[...$('#file-input').files];
        if(files.length+attachments.length>4)throw new Error('Limite de 4 anexos por registro.');
        for(const file of files){attachments.push(await upload(file));persist();}
        $('#file-input').value='';showAttachments();
        const value=collect();
        if(!record){const term=normalized(value.title).split(' ')[0];if(term.length>=2){const candidates=await pageRecords([where('searchTokens','array-contains',term),where('deleted','==',false),orderBy('updatedAt','desc')],null,30);if(candidates.rows.some(r=>r.type===type&&normalized(r.title)===normalized(value.title))&&!confirm('Já existe um registro com este nome. Criar outro mesmo assim?'))return;}}
        const result=await saveRecord(value,expected,record?.id);
        localStorage.removeItem(draftKey);dirty=false;modal.close();toast('Dados atualizados na rede.');location.hash=recordUrl(result.id).slice(1);
      }catch(error){persist();$('#form-error').textContent=errorMessage(error);}
    });
  };
}
