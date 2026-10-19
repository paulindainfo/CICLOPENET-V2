export const clans=['Banu Haqim / Assamita','Brujah','Gangrel','Hecata','Giovanni','Lasombra','Malkavian','Ministério / Seguidores de Set','Nosferatu','Ravnos','Salubri','Toreador','Tremere','Tzimisce','Ventrue','Caitiff','Sangue Fraco','Outro / desconhecido'];
export const statuses={open:'Aberta',progress:'Em andamento',closed:'Concluída',archived:'Arquivada'};
export const labels={aliases:'Apelidos',entityType:'Tipo de entidade',clan:'Clã',sect:'Seita / afiliação',generation:'Geração',status:'Estado',location:'Localização conhecida',occupation:'Ocupação',appearance:'Aparência',personality:'Personalidade',history:'História conhecida',motivations:'Motivações',affiliations:'Afiliações',relationship:'Relação com a coterie',threat:'Ameaça estimada',confirmed:'Informações confirmadas',suspicions:'Suspeitas',observations:'Observações',source:'Fonte',reliability:'Confiabilidade',hypothesis:'Hipótese principal',questions:'Perguntas sem resposta',conclusions:'Conclusões',address:'Endereço / localização',owner:'Proprietário',faction:'Facção controladora',risk:'Nível de risco',situation:'Situação atual',fictionalDate:'Data na crônica (livre)',sortDate:'Chave de ordenação da crônica',eventType:'Tipo de acontecimento',sessionNumber:'Número da sessão',realDate:'Data real',participants:'Participantes',happenings:'Principais acontecimentos',discoveries:'Descobertas',decisions:'Decisões importantes',consequences:'Consequências',openMysteries:'Mistérios abertos',resolvedMysteries:'Mistérios resolvidos',category:'Categoria',objectives:'Objetivos',contacts:'Contatos',edition:'Edição da crônica',bloodPotency:'Potência do sangue (opcional)'};
export const schemas={
  person:{label:'Pessoas',singular:'Pessoa',intro:'Rostos, alianças e ameaças. Tudo que a rede sabe sobre eles.',quick:['clan','entityType','sect'],detail:['aliases','generation','bloodPotency','status','location','occupation','appearance','personality','history','motivations','affiliations','relationship','threat','confirmed','suspicions','observations']},
  place:{label:'Locais',singular:'Local',intro:'Dos salões do Elísio às passagens sob a cidade.',quick:['category','faction','risk'],detail:['address','owner','situation','observations']},
  rumor:{label:'Rumores',singular:'Rumor',intro:'Toda informação tem uma fonte. Nem toda fonte diz a verdade.',quick:['status','source','reliability'],detail:['realDate','observations']},
  investigation:{label:'Investigações',singular:'Investigação',intro:'Siga os rastros. Conecte os fatos. Questione as certezas.',quick:['status'],detail:['hypothesis','participants','questions','conclusions','observations']},
  clue:{label:'Pistas',singular:'Pista',intro:'Evidências preservadas, sempre vinculadas à sua origem.',quick:['source','status'],detail:['confirmed','observations']},
  theory:{label:'Teorias',singular:'Teoria',intro:'Hipóteses dos personagens. Uma teoria ainda não é um fato.',quick:['status'],detail:['hypothesis','questions','conclusions']},
  document:{label:'Documentos',singular:'Documento',intro:'Cartas, recortes e transmissões recuperadas pela rede.',quick:['category','source'],detail:['realDate','observations']},
  session:{label:'Sessões',singular:'Sessão',intro:'A memória coletiva da sua crônica, noite após noite.',quick:['sessionNumber','realDate','participants'],detail:['happenings','discoveries','decisions','consequences','openMysteries','resolvedMysteries','observations']},
  event:{label:'Cronologia',singular:'Evento',intro:'O que aconteceu. O que trouxe a cidade até aqui.',quick:['fictionalDate','sortDate','eventType'],detail:['realDate','observations']},
  note:{label:'Anotações',singular:'Anotação',intro:'Seu espaço na rede. Associado ao perfil e visível ao grupo.',quick:['category'],detail:['objectives','contacts','observations']}
};
export function fieldOptions(type,key){
  if(key==='clan')return ['',...clans];
  if(key==='entityType')return ['','Vampiro','Mortal','Carniçal','Organização','Outra entidade','Personagem jogador'];
  if(key==='sect')return ['','Camarilla','Anarquistas','Sabá','Independente','Desconhecida','Outra'];
  if(key==='status'&&type==='investigation')return Object.entries(statuses);
  if(key==='status'&&type==='rumor')return ['Não verificado','Em investigação','Parcialmente confirmado','Confirmado','Desmentido'];
  if(key==='status'&&type==='theory')return ['Hipótese','Em análise','Apoiada por evidências','Refutada'];
  if(key==='status'&&type==='clue')return ['Não verificada','Evidência confirmada','Contestada'];
  if(key==='eventType')return ['Vivido pela coterie','Histórico','Política','Máscara','Combate','Morte'];
  if(['risk','threat'].includes(key))return ['','Desconhecido','Baixo','Moderado','Alto','Crítico'];
  if(key==='reliability')return ['Desconhecida','Baixa','Moderada','Alta','Fonte confirmada'];
  return null;
}
