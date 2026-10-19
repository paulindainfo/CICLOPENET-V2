# Arquitetura final — opção gratuita

O proprietário determinou custo de infraestrutura zero em 19/10/2026. A arquitetura inicialmente considerada com banco nomeado, Functions e Storage foi substituída antes da publicação. A solução entregue usa exclusivamente Firebase Spark e hospedagem estática gratuita.

## Persistência e entidades

Projeto: schrecknet-e40df. Banco: `(default)`. Raiz: `networks/principal`. As coleções originais permanecem fora de `networks/`.

| Caminho relativo | Conteúdo |
| --- | --- |
| profiles/user1…user4 | Quatro identidades de personagem e revisão |
| members/{uid} | Associação do dispositivo, papel, ativo, hash do convite |
| invites/{sha256} | Papel, expiração, usos e limite; lista negada |
| records/{uuid} | Entidade tipada, título, resumo, conteúdo, campos, tags, vínculos, anexos e autoria |
| records/{uuid}/versions/{revisão} | Snapshot imutável da versão |
| profiles/{id}/versions/{revisão} | Histórico de personalização |
| messages/{uuid} | Texto, perfil, UID, horário e cartão compartilhado |
| contributions/{uuid} | Observação individual vinculada ao registro |
| activity/{registro_revisão} | Atividade que acompanha a alteração |
| favorites/{perfil_registro} | Referência organizada por perfil |
| files/{uuid} | Bytes, tipo, nome, tamanho, remetente técnico e horário |

Tipos de registro: person, place, rumor, investigation, clue, theory, document, session, event e note. `links` guarda IDs da coleção única; o tipo está no registro de destino. Referências inversas usam consulta `links array-contains ID`. Lixeira usa `deleted`; vínculos sobrevivem à remoção. As contribuições independentes evitam disputa pelo resumo oficial.

## Operações e integridade

Módulos da interface chamam `api` em firebase.js, que encaminha a operations.js. Esse módulo usa transações reais do SDK Firestore. Não há servidor simulado nem dados compartilhados no localStorage. A alteração verifica a revisão esperada e escreve registro, versão, atividade e contadores atomicamente. As regras exigem os documentos correspondentes usando getAfter. Revisões antigas não podem ser sobrescritas nem registros apagados fisicamente por um cliente.

Horários de autoria e atualização usam serverTimestamp. A transação compara a revisão carregada no início da edição, inclusive em uma tentativa automática de repetição. Um conflito retorna mensagem explícita; o rascunho permanece local. Leituras para validar vínculos acontecem antes da transação para evitar os limites de avaliação em transações extensas. Essa referência pode ficar obsoleta se um administrador apagar fisicamente o destino; clientes comuns só usam lixeira.

As regras validam o documento principal, categorias, tamanhos de textos principais, atributos indexados, autoria técnica, anexos, convites e permissões. Campos livres e os tokens de busca também passam pela validação completa do cliente. A colaboração não pretende resistir a vandalismo de um integrante autorizado, que já tem direito a editar conteúdo compartilhado. O histórico oferece recuperação.

## Acesso sem cadastro

Anonymous Auth cria uma identidade técnica persistente no navegador. Um convite aleatório de 256 bits é transformado em SHA-256 no navegador e usado para localizar o convite. Não há permissão de listar convites ou membros. O resgate cria a associação do próprio UID e incrementa o uso do convite na mesma transação, validada pelas regras. Conhecer apenas o ID de um perfil ou o Firebase apiKey não concede acesso.

Revogação administrativa pode definir members/{uid}.active=false. O Firestore verifica a associação atual nas leituras e escritas. A seleção de perfil é uma preferência, não autenticação: dados associados a um perfil não são confidenciais para outros membros.

O namespace legado preserva o comportamento de contas autenticadas tradicionais fora de networks/. Identidades anônimas não recebem acesso ao legado. O snapshot das regras originais está em REGRAS_ORIGINAIS.txt. Essa mudança de produção depende da autorização final.

## Anexos e gratuidade

Firestore armazena bytes em documentos separados de até 900 KB, sem índice sobre o campo binário. Não é usado Cloud Storage, pois a infraestrutura desejada precisa permanecer no Spark. Imagens passam por decodificação raster e compressão no navegador; SVG/HTML/executáveis não são permitidos. As regras também validam tamanho real dos bytes e tipo aceito. Anexos são baixados com a sessão autorizada e apresentados como blob temporário. Não existem links públicos permanentes para arquivos.

O limite por registro é 4 anexos, 24 vínculos e 12 tags, validado inclusive no teste de formulário extenso. Para acervos maiores, divida materiais em documentos relacionados. As cotas gratuitas são compartilhadas com o site antigo; não há cobrança automática de excesso enquanto o projeto permanecer sem faturamento, mas operações podem ser bloqueadas quando a cota se esgotar.

## Consultas e escalabilidade

Perfis e metadados da campanha são pequenos listeners globais. Listas usam 40 documentos por página; chat escuta 50 mensagens recentes e permite buscar mais histórico. Atividade: 12 itens. As assinaturas de cada tela são encerradas ao navegar. Nenhuma consulta normal baixa a coleção inteira.

Busca usa até 2.400 tokens por documento, acentos normalizados, palavras inteiras e prefixos dos campos prioritários. Consulta inicial pelo primeiro termo e refinamento dos demais por página. Sem promessa de fuzzy, ranking semântico ou indexação ilimitada. Índices compostos de listas, filtros, vínculos, cronologia e contribuições estão em firestore.indexes.json. Uploads/binários e conteúdo longo não recebem índices desnecessários.

Exportação percorre páginas e inclui os arquivos binários em base64. A importação cria novos IDs, remapeia vínculos, preserva os atuais e salva um diário local de progresso. Dados de chat, perfis e histórico ficam no backup para recuperação administrativa; a interface não falsifica autoria antiga na importação. Fontes, SDK e imagens do aplicativo são locais, com caminhos relativos e roteamento hash compatível com GitHub Pages.
