# Verificação da V2

Ambiente utilizado: Windows, Node 22, Java 21, emuladores oficiais Firebase Auth/Firestore e Google Chrome em execução isolada. O frontend testado é o mesmo código de public/, com a opção de emulador limitada a localhost. Nenhum dado demonstrativo foi inicializado na campanha real.

## Executado

- Sintaxe de JavaScript, importações locais e JSON.
- 8 testes de domínio: cadastro mínimo, normalização do índice, tipos e vínculos, entradas inválidas, texto HTML preservado como dado, tipos/tamanhos de anexos, avatar e estrutura de backup.
- 15 cenários de integração com as regras reais nos emuladores (16 resultados TAP incluindo o agrupamento): visitante sem convite; tentativa de autoautorizar; dois dispositivos e quatro perfis; persistência e snapshot em tempo real; conflito de revisão; tentativas de burlar autoria/histórico/contadores/papel; investigação e pista vinculadas; cartão de chat e teoria referenciada; contribuições paralelas; lixeira e restauração; bytes compartilhados e bloqueio de HTML; personalização de perfil; administração independente do personagem; bloqueio do banco legado; cronologia com data ficcional livre; registro com todos os campos de detalhe, 24 vínculos, 12 tags e 4 anexos.
- Navegador desktop 1440×1050 e contexto mobile 390×844: resgate de convites, seleção de perfis, NPC consultado no segundo contexto, compartilhamento, chat nas duas direções, conversão de mensagem em teoria, sessão, busca, edição, recarregamento, exportação JSON, importação de registros, upload/download de PDF, upload/compressão de avatar, prevenção de execução de HTML e ausência de rolagem horizontal na tela mobile de chat.
- Inspeção visual das capturas do dashboard desktop e chat mobile.

Os testes apontaram falhas nos limites de avaliação de regras para registros extensos. A validação foi ajustada e o cenário no limite passou. A validação completa dos campos livres permanece no cliente; a estrutura de autorização, transação, autoria técnica e histórico é imposta pelas regras. Um arquivo de imagem inválido foi corretamente rejeitado; o teste de avatar foi repetido com imagem raster válida.

## Limites da verificação

Não foram executados testes em aparelhos físicos, Safari/iOS, milhares de mensagens reais simultâneas ou recuperação administrativa completa de um projeto apagado. A validação pública da URL, dos índices de produção e do acesso no site publicado será executada somente depois da autorização final. Nenhum teste local comprova que uma implantação ainda não publicada está disponível online.

## Procedimento reproduzível

1. Execute npm ci e npm test.
2. Execute npm run check.
3. Com Java 21 disponível, execute npm run test:integration. O comando inicia e encerra um ambiente demo-ciclope isolado.
4. Para testar a interface, inicie npm run emulators e node scripts/serve.mjs 5174 em terminais separados. Execute node tests/browser.mjs. O script gera convites locais, testa dois contextos e grava capturas/resultados em artifacts/.
5. Após publicação autorizada, abra o endereço do Pages em dois navegadores, use convites distintos e selecione perfis diferentes.
6. Personalize o perfil, crie um NPC e confirme a presença no segundo navegador. Edite no primeiro e confirme a atualização.
7. Abra o mesmo NPC para edição nos dois navegadores e tente salvar revisões diferentes. A segunda operação deve informar conflito e preservar o rascunho.
8. Crie uma investigação e uma pista, vinculando-a ao NPC. Abra as referências nos dois sentidos.
9. Compartilhe a ficha no chat. No segundo navegador, abra o cartão e envie uma mensagem multilinha. Converta-a em teoria e confirme a referência à origem.
10. Registre uma sessão e associe os arquivos relevantes. Crie um evento com data ficcional livre e chave de ordenação retroativa.
11. Faça pesquisa por nome, tag e palavra do conteúdo. Verifique filtros e carregamento de mais páginas.
12. Envie imagem/PDF pequeno, abra a ficha no segundo navegador e baixe o anexo.
13. Exporte o JSON. Em caso de teste de importação, confirme que cópias recebem novos IDs e vínculos remapeados sem substituir os atuais.
14. Recarregue o navegador e confira a recuperação do perfil e dos registros.
15. Teste um navegador sem convite: a seleção de perfil não deve liberar acesso aos registros.
16. Desconecte a rede durante uma edição. A interface deve preservar o rascunho e informar que não conseguiu salvar. Reconecte e envie novamente.
