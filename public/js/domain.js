export const TYPES = ['person','place','rumor','investigation','clue','theory','document','session','event','note'];
import {PROFILE_IDS} from './roster.js';
export {PROFILE_IDS};
export const TEXT_FIELDS = ['aliases','entityType','clan','sect','generation','status','location','occupation','appearance','personality','history','motivations','affiliations','relationship','threat','confirmed','suspicions','observations','source','reliability','hypothesis','questions','conclusions','address','owner','faction','risk','situation','fictionalDate','sortDate','eventType','sessionNumber','realDate','participants','happenings','discoveries','decisions','consequences','openMysteries','resolvedMysteries','category','objectives','contacts','edition','bloodPotency'];
export const PROFILE_FIELDS = ['name','player','clan','sect','generation','concept','biography','description','nature','demeanor','notes','signature','color','edition','bloodPotency'];
export function fail(message) { throw new Error(message); }
export function text(value, max=12000) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) fail(`Texto inválido (máximo ${max} caracteres).`);
  return value.trim();
}
export function id(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) fail('Identificador inválido.');
  return value;
}
export function normalize(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
export function searchTokens(record) {
  const priority = normalize([record.title, ...(record.tags||[]), ...Object.values(record.fields||{})].join(' ')).split(/\s+/);
  const words = [...new Set([...priority, ...normalize(record.summary+' '+record.content).split(/\s+/)])].filter(w=>w.length>1).slice(0,600);
  const tokens = new Set();
  for(const w of words) tokens.add(w.slice(0,60));
  for(const w of priority.filter(Boolean)) for(let i=2;i<=Math.min(w.length,24);i++) tokens.add(w.slice(0,i));
  return [...tokens].slice(0,2400);
}
export function validAsset(value, uid) {
  if(!value) return null;
  const path = text(value.path,240);
  if(!/^networks\/principal\/files\/[a-zA-Z0-9_.-]+$/.test(path)) fail('Caminho de arquivo inválido.');
  const type=text(value.type,100), size=value.size;
  if(!['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain'].includes(type)) fail('Tipo de arquivo não permitido.');
  if(!Number.isInteger(size)||size<1||size>900*1024) fail('Arquivo deve ter até 900 KB.');
  return {path,type,size,name:text(value.name,180)};
}
export function validRecord(input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) fail('Registro inválido.');
  if(!TYPES.includes(input.type)) fail('Categoria inválida.');
  const title=text(input.title,160);
  if(!title) fail('Informe um título ou nome.');
  const fields={};
  for(const [key,value] of Object.entries(input.fields||{})) {
    if(!TEXT_FIELDS.includes(key)) fail(`Campo desconhecido: ${key}`);
    fields[key]=text(value);
  }
  if(input.type==='investigation'&&!['open','progress','closed','archived'].includes(fields.status)) fail('Estado de investigação inválido.');
  const links=[...new Set(input.links||[])];
  if(links.length>24) fail('Limite de 24 vínculos por registro.');
  links.forEach(id);
  const tags=[...new Set((input.tags||[]).map(t=>text(t,40)))].filter(Boolean);
  if(tags.length>12) fail('Limite de 12 tags.');
  const attachments=(input.attachments||[]).map(v=>validAsset(v));
  if(attachments.length>4) fail('Limite de 4 anexos.');
  const ownerProfile=input.type==='note'?text(input.ownerProfile,20):'';
  if(input.type==='note'&&!PROFILE_IDS.includes(ownerProfile)) fail('Perfil da anotação inválido.');
  const result={type:input.type,title,summary:text(input.summary,600),content:text(input.content,40000),fields,tags,links,attachments,ownerProfile,sourceMessage:input.sourceMessage?id(input.sourceMessage):''};
  if(JSON.stringify(result).length>100000) fail('Registro muito grande. Divida o conteúdo em contribuições.');
  return result;
}
export function validProfile(input) {
  const result={};
  for(const key of PROFILE_FIELDS) result[key]=text(input[key],key==='name'?80:12000);
  if(!result.name) fail('Informe o nome do personagem.');
  if(result.color&&!/^#[a-fA-F0-9]{6}$/.test(result.color)) fail('Cor inválida.');
  result.avatar=validAsset(input.avatar);
  if(result.avatar&&!result.avatar.type.startsWith('image/')) fail('O avatar precisa ser uma imagem.');
  if(JSON.stringify(result).length>60000) fail('Perfil muito grande.');
  return result;
}
export function validBackup(data) {
  if(data?.format!=='ciclope-net'||data.version!==2||!Array.isArray(data.records)||data.records.length>2000) fail('Backup inválido: versão 2 e até 2.000 registros por importação.');
  const ids=new Set();
  for(const r of data.records) { id(r.id); if(ids.has(r.id)) fail('IDs duplicados no backup.'); ids.add(r.id); validRecord(r); }
  return data;
}
