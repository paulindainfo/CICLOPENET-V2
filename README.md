# CICLOPE NET V2

**Nosferatu Information Network.** Aplicação colaborativa para cinco participantes de Vampiro: A Máscara, feita em HTML, CSS e módulos JavaScript. Sem framework de interface, sem cadastro por email/senha e sem banco fictício em localStorage.

## Participantes da mesa

Paulo (dono do site, convite de administrador), Flavia, Duda, Sofia e Felipe (mestre da mesa, convite próprio de administrador). Os IDs user1 a user4 foram preservados; Felipe usa user5. A permissão administrativa pertence ao dispositivo que usa o convite, independentemente do perfil selecionado. Os códigos ficam somente nos arquivos privados locais.

## Aplicativo Android

[Baixar e instalar o APK](https://paulindainfo.github.io/CICLOPENET-V2/apk/). Usa o mesmo ícone, site e banco; Android 8 ou superior. Cada instalação precisa de convite. Avisos gratuitos de mensagens e atualizações por verificação periódica de 15 minutos ou mais, conforme as restrições do Android; não são push instantâneo. O botão Avisos configura e testa as notificações. Código e instruções de compilação/assinatura em [docs/ANDROID.md](docs/ANDROID.md). Esta entrega foi compilada e teve sua assinatura verificada, mas ainda não foi testada em um celular Android físico.

## Situação da entrega

Publicado em **https://paulindainfo.github.io/CICLOPENET-V2/**, com código completo em **https://github.com/paulindainfo/CICLOPENET-V2**. GitHub Pages ativo, regras e índices publicados, cinco perfis inicializados e projeto mantido no Spark sem faturamento. O repositório original CICLOPENET foi preservado.

Criação, edição, chat, colaboração e backups foram testados nos emuladores e em dois contextos de navegador. Na URL pública, foram verificados HTTPS, carregamento sem CORS, perfis e índices reais, layout desktop/mobile e bloqueio de visitantes sem convite. Não foram criados ou apagados registros temporários da campanha em produção.

Veja o diagnóstico do original em [docs/DIAGNOSTICO.md](docs/DIAGNOSTICO.md), a arquitetura final em [docs/ARQUITETURA.md](docs/ARQUITETURA.md), o teste verificável em [docs/TESTES.md](docs/TESTES.md) e o alcance das regras em [docs/PUBLICACAO.md](docs/PUBLICACAO.md).

## Plano gratuito, sem Blaze

O projeto existente **schrecknet-e40df** permanece no Spark. A V2 usa o banco Firestore padrão na área `networks/principal`, separada logicamente das coleções originais `campaigns` e `users`. Não depende de Cloud Functions, Storage, servidor pago, assinatura adicional ou cartão de crédito.

As cotas gratuitas são compartilhadas com o site original: em caso de esgotamento, o Firebase pode interromper as operações até a renovação da cota. Permanecer no Spark evita cobrança por excesso. Não ative Blaze para executar este projeto. Consulte as cotas vigentes no [Firebase](https://firebase.google.com/docs/firestore/quotas) e o comportamento dos [planos](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

Para manter uploads gratuitos, imagens são reduzidas a até 1600 px e comprimidas; anexos PDF/TXT e imagens finais têm limite de **900 KB por arquivo**, armazenados como bytes no Firestore com acesso protegido. Até **4 anexos, 24 vínculos e 12 tags por registro**. Arquivos maiores devem ser divididos em documentos menores. O aplicativo não é um serviço de armazenamento de mídia em massa.

## O que está implementado

- Quatro perfis persistentes, personalização, avatar, troca de personagem e autoria declarada.
- Dashboard com contagens reais, atividades, investigações e rumores recentes.
- Pessoas, locais, rumores, investigações, pistas, teorias, documentos, sessões, eventos e anotações.
- Cadastro rápido, detalhes opcionais, edição, lixeira reversível, histórico e restauração de versões.
- Kanban com mudança de estado, relações entre categorias e referências inversas.
- Contribuições separadas do conteúdo principal e proteção contra edição simultânea.
- Chat em tempo real, histórico paginado, mensagens multilinha, cartões de fichas e conversão de mensagem em registro com referência à origem.
- Busca global indexada, filtros, tags, favoritos e quadro visual de conexões clicáveis.
- Cronologia com data ficcional livre e chave de ordenação independente.
- Upload e download autenticado de imagens, PDFs e TXT, sem URLs públicas portadoras de token.
- Backup JSON incluindo anexos, perfis, chat, contribuições e versões. Importação de cópias dos registros com remapeamento de vínculos e retomada em caso de interrupção.
- Interface responsiva, navegação por teclado, textos escapados, rascunhos locais, estados vazios e avisos de conexão.

## Acesso dos jogadores

1. O responsável envia um convite privado a cada jogador.
2. No primeiro acesso do dispositivo, o jogador cola o convite.
3. Seleciona Usuário 1, 2, 3 ou 4 e personaliza o personagem.
4. Nos próximos acessos, o navegador recupera a autorização e o perfil escolhido.

O Firebase Anonymous Auth identifica o **dispositivo**, não a pessoa. As regras exigem uma associação válida à rede. A escolha de personagem não é autenticação forte: qualquer integrante autorizado pode selecionar qualquer perfil. Anotações e favoritos são organizados por perfil, mas são visíveis ao grupo. O convite é uma credencial de acesso: mantenha-o privado. Nenhuma senha administrativa ou chave de servidor vai para o frontend.

A V2 usa a instância Firebase nomeada `ciclope-net-v2`, isolando sua sessão técnica da sessão de login do site original, mesmo quando ambos estão no mesmo domínio do GitHub Pages.

Cada convite padrão expira em sete dias e autoriza dois dispositivos. O primeiro concede administração da crônica; os três restantes concedem edição dos registros. Limpar os dados do navegador ou trocar de navegador exige nova autorização.

## Executar localmente

Requisitos de desenvolvimento: Node.js 22, Java 21 para emuladores e navegador Chrome. Nenhuma instalação é exigida dos jogadores.

```sh
npm ci
npm start
```

Abra o endereço apresentado. Sem rede configurada, o aplicativo mostra a tela real de autorização, sem dados demonstrativos fingindo sincronização. Para testes totalmente isolados:

**Não abra public/index.html por duplo clique ou endereço file://.** Navegadores bloqueiam módulos JavaScript nesse modo, gerando um erro de CORS com origem null. Abra o endereço HTTP apresentado por npm start ou o link HTTPS do GitHub Pages. Não é necessário desativar a segurança do navegador.

```sh
npm run emulators
```

Em outro terminal:

```sh
node scripts/bootstrap.mjs --emulator
npm start
```

Abra `http://127.0.0.1:5173/?emulator=1` e use um dos convites gerados. O modo emulador só funciona em localhost/127.0.0.1. Os dados de teste não são enviados ao projeto de produção. Para a suíte de navegador, inicie `node scripts/serve.mjs 5174`; execute `node tests/browser.mjs` com os emuladores ativos.

## Ativar a rede real, após autorização

Não publique somente os arquivos estáticos: as regras e os perfis precisam estar ativos.

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project schrecknet-e40df
node scripts/provision.mjs --free
node scripts/bootstrap.mjs --out CONVITES.private.json
```

`bootstrap` cria a crônica e os cinco perfis somente se não existirem; não apaga registros existentes. Cada execução gera cinco novos convites. O arquivo **CONVITES.private.json é privado**, ignorado pelo Git e excluído do ZIP público. Não coloque os códigos em README, URLs ou código. Os índices podem levar alguns minutos para terminar de construir. A configuração web pública já está em `public/js/config.js`.

As regras de produção anteriores liberavam todos os documentos para qualquer conta autenticada. A nova versão exige associação para `networks/` e mantém o acesso tradicional autenticado às demais coleções, bloqueando identidades anônimas da V2 fora de sua área. **Essa mudança afeta regras de produção e exige a autorização final descrita em docs/PUBLICACAO.md.**

## Publicar no GitHub Pages

O código fonte completo fica em `main`; os arquivos estáticos de `public/` ficam em `gh-pages`. O Pages usa a raiz de `gh-pages`, com `.nojekyll`. Essa publicação não depende de GitHub Actions personalizado ou de serviços pagos.

Depois da autorização explícita do proprietário e com a conta correta conectada:

```sh
node scripts/publish-github.mjs --confirm-publication
```

O script verifica a conta, cria `paulindainfo/CICLOPENET-V2` público se necessário, envia o código, envia os arquivos estáticos e ativa Pages. Não contém tokens: usa o Gerenciador de Credenciais do Git. Aguarde o build do Pages e confirme a URL devolvida antes de considerar a publicação concluída. O endereço esperado é `https://paulindainfo.github.io/CICLOPENET-V2/`.

Para outra hospedagem estática, publique apenas o conteúdo de `public/`. Os caminhos são relativos e o roteamento usa hash, funcionando em subpastas e após recarregar uma ficha.

## Estrutura e manutenção

```text
public/                 Aplicação estática que os jogadores acessam
  css/                  Identidade visual e responsividade
  assets/               Símbolo e ícones próprios
  js/                   Interface, módulos de domínio e operações Firebase
  vendor/               SDK Firebase empacotado e licenças
scripts/                Administração, testes, empacotamento e publicação
tests/                  Domínio, integração e testes de navegador
docs/                   Diagnóstico, arquitetura, testes e publicação
firestore.rules         Regras geradas, completas e versionadas
firestore.indexes.json  Índices das consultas reais
firebase.json           Configuração do Firebase
```

O aplicativo usa o SDK local de `public/vendor/`, sem depender de CDN em tempo de uso. Para atualizar o SDK, atualize as dependências e execute:

```sh
npx esbuild scripts/firebase-vendor.mjs --bundle --minify --format=esm --outfile=public/vendor/firebase.js --legal-comments=external
```

O arquivo `scripts/build-rules.mjs` é a fonte mantida das regras; `node scripts/build-rules.mjs` regenera `firestore.rules`. Depois de qualquer mudança de segurança, execute novamente os testes de integração antes de publicar.

```sh
npm test
npm run check
npm run test:integration
npm run package
```

## Limites de colaboração, pesquisa e recuperação

O histórico é preservado em cada alteração; a interface e o backup mostram as últimas 50 versões por registro. Exclusões de registros são lógicas. Comentários e mensagens são imutáveis para clientes comuns. Nenhuma autorização depende apenas do personagem escolhido.

A busca usa tokens normalizados (sem acento) e prefixos de nomes, tags e campos, com palavras completas no conteúdo. A primeira palavra consulta o índice `array-contains`; as demais refinam os resultados paginados. Não é uma busca semântica, fuzzy ou de trechos arbitrários. O conteúdo indexa até 600 palavras distintas, priorizando título/tags/campos. Filtros combinados à busca refinam a página consultada; continue carregando resultados quando necessário.

O cliente valida os detalhes dos campos e existência de vínculos; as regras impõem associação, autoria técnica, formato principal, categorias, atributos indexados, limites, versões e operações atômicas. Sem servidor pago, a geração do índice textual e a validação completa dos campos livres ficam no cliente. O modelo pressupõe colaboração entre os membros autorizados; um membro malicioso ainda pode vandalizar conteúdo ao qual tem direito de edição, com histórico recuperável. Visitantes externos sem convite não recebem esse direito.

A importação pela interface cria cópias dos registros e anexos, remapeando relações internas. Não substitui os registros atuais nem reconstitui chat/perfis/versões como se fossem ações antigas dos jogadores. Esses dados continuam preservados no JSON para recuperação administrativa controlada. Backups de até 25 MB e 2.000 registros por importação. Para uma base maior, faça cópias administrativas por partes antes de ultrapassar essas dimensões. O diário local permite retomar a mesma importação; ele não é o banco da aplicação.

Este projeto não inclui textos de livros, regras completas ou imagens protegidas de Vampiro. A terminologia dos campos é opcional e não impõe uma edição específica.
