# Diagnóstico e decisões — CICLOPE NET V2

Análise de 18/10/2026. Fonte principal: https://github.com/paulindainfo/CICLOPENET, commit f4b9ac757c9779db5cd75e0fab33c1c0a396e3ba. Os dois HTML, os 13 módulos JavaScript e os dois CSS foram lidos. A cópia de referência está em reference/original e não integra a distribuição. O acesso pelo leitor web ao endereço publicado falhou; a análise funcional abaixo é do código, não de uma sessão autenticada. Não foram consultados registros privados, configurações do console nem regras do banco original.

## O que existe e deve continuar

HTML com barra lateral e painel de conteúdo, CSS preto/cinza/vermelho, tipografia monoespaçada, Firebase SDK 12.0.0, autenticação por email e senha e Firestore. O dashboard escuta pessoas, rumores e logs. Pessoas permitem nome, clã, imagem por URL, status e descrição; rumores têm fonte, confiança em estrelas, tags e descrição; locais têm endereço e domínio. Esses módulos criam, listam e excluem registros. Investigações têm três colunas e uma ficha com pistas em um array. A cronologia tem categorias e um número textual de sessão. O login cria users/{uid}; o projeto público identificado é schrecknet-e40df. A configuração web é pública por natureza, não concede autorização administrativa.

Preservar nome, subtítulo, atmosfera de rede Nosferatu, navegação lateral, fichas de pessoas, rumores classificados, o quadro de investigações e o histórico da crônica.

## Limitações verificadas

Não há edição dos registros, busca global, sessões como entidades, chat, upload real, histórico de versões, relações entre coleções nem perfis de personagem. As pistas são textos sem ID/autoria própria; o Kanban não implementa movimento de status. O dashboard conta somente pessoas/rumores. Os listeners não são cancelados ao sair das telas. O código usa variáveis globais derivadas dos IDs do DOM e interpola dados do usuário em innerHTML, expondo risco de XSS. Algumas exclusões não confirmam; em pessoas o log de exclusão é disparado antes da confirmação. O fallback assets/semfoto.png não existe no repositório. config.js está vazio, ui.js não integra a navegação, e as regras/índices não estão versionados. Faltam viewport, estados de erro, fluxo mobile e prevenção de conflitos. Não é possível concluir quais regras estão em produção pelo código público.

## Referências pesquisadas e aplicação

- Kanka, https://kanka.io/features e https://docs.kanka.io/en/latest/features/permissions.html: entidades relacionadas, autoria, permissões independentes da aparência. Aplicação: vínculos universais e referências inversas, categorias consistentes.
- World Anvil, https://blog.worldanvil.com/worldanvil/tutorials/how-to-plan-and-record-your-campaign-in-chronicles/: histórico de campanha conectado a eventos. Aplicação: sessões separadas dos eventos e datas ficcionais livres com chave de ordenação explícita.
- Obsidian Canvas, https://obsidian.md/canvas: conexões visuais como complemento da leitura. Aplicação: mapa clicável de relações com navegação convencional preservada.
- Vampire NEXUS, https://resources.demiplane.com/nexus/vampire/tools/character-tools-overview: diferencia conceito, descrição e dados mecânicos. Aplicação: campos opcionais; a V2 não calcula regras. NEXUS é específico de V5; geração, natureza/comportamento e potência do sangue são opcionais para acomodar crônicas de outras edições, sem importar livros.
- Firebase: https://firebase.google.com/docs/auth/web/anonymous-auth, https://firebase.google.com/docs/functions/callable, https://firebase.google.com/docs/firestore/manage-data/transactions, https://firebase.google.com/docs/functions/manage-functions, https://firebase.google.com/docs/storage/security/rules-conditions. Aplicação: identidade técnica invisível, validação no servidor, transações, listeners limitados e regras fechadas.

## Arquitetura final após a exigência de custo zero

O plano inicial considerou banco nomeado, funções callable e Storage. A consulta autorizada ao projeto confirmou Spark sem faturamento. Em 19/10/2026 o proprietário determinou que o sistema permaneça 100% gratuito; a arquitetura foi adaptada antes da publicação.

A implementação final usa o Firestore padrão do projeto existente, com os dados em networks/principal; as coleções originais ficam fora desse namespace. Anonymous Auth identifica o dispositivo, e um convite aleatório de 256 bits com hash SHA-256, prazo e limite de usos autoriza a associação. Os cinco perfis são identidades declaradas, não autenticação individual. Nenhuma migração dos registros antigos é automática.

As alterações usam transações reais, com revisão esperada, histórico imutável, atividade e contadores na mesma operação. Regras de segurança verificam associação, autoria técnica, estrutura principal, versões e operações vinculadas. Detalhes livres e indexação textual são validados no cliente. Exclusões são lógicas e as contribuições ficam separadas do texto principal. Listas e histórico do chat são paginados; listeners são encerrados ao navegar.

Sem Storage pago, imagens são comprimidas e arquivos de até 900 KB são armazenados como bytes no Firestore com acesso protegido. O limite final é de 4 anexos, 24 vínculos e 12 tags por registro, testado inclusive no formulário extenso. Backup JSON inclui os binários. A importação cria cópias com novos IDs e vínculos remapeados, sem reescrever autoria histórica. Chat, perfis e versões ficam preservados no JSON para recuperação administrativa.

Hospedagem prevista: novo repositório paulindainfo/CICLOPENET-V2 e GitHub Pages gratuito; código em main e frontend em gh-pages. A publicação e a mudança das regras de produção foram autorizadas e concluídas em 19/10/2026. O site original permanece preservado. Consulte ARQUITETURA.md e PUBLICACAO.md para o modelo completo e o alcance das regras.
## Design e experiência

Barra lateral carvão, linha vermelha discreta, tipografia de leitura no conteúdo e monoespaçada na sinalização. Dashboard com números reais, investigações ativas, atividade recente e atalhos. Cadastro rápido com detalhes recolhidos; erros junto ao formulário e rascunho local recuperável. No celular, menu recolhível e colunas adaptadas. Sem animação constante, glitch ou estatísticas inventadas. A ausência de configuração ou autorização apresenta instruções reais, nunca dados fingindo sincronização.
