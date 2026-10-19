# Escopo da autorização de publicação

Autorização final recebida do proprietário em 19/10/2026 para executar o escopo abaixo. O repositório original será preservado.

1. Criar o repositório público `paulindainfo/CICLOPENET-V2`, enviar o código completo em main e o frontend em gh-pages.
2. Ativar GitHub Pages gratuito com a raiz de gh-pages. URL esperada: https://paulindainfo.github.io/CICLOPENET-V2/.
3. Publicar firestore.rules e firestore.indexes.json no projeto existente schrecknet-e40df, banco padrão, mantendo o Spark sem faturamento.
4. Inicializar networks/principal e os quatro perfis se ainda não existirem. Gerar quatro convites privados, fora do código público.
5. Verificar a URL publicada e testar a integração em produção sem inserir dados fictícios da campanha.

O repositório original paulindainfo/CICLOPENET e seus documentos de campanha não serão substituídos ou migrados automaticamente.

## Alcance das regras

As regras originais permitiam leitura/escrita de qualquer documento para qualquer conta autenticada. O arquivo REGRAS_ORIGINAIS.txt registra a configuração consultada antes da mudança.

A nova regra protege networks/ por associação do UID à rede. Fora de networks/, mantém o acesso de contas autenticadas tradicionais e bloqueia contas anônimas criadas para a V2. Assim, a V2 compartilha o banco gratuito sem conceder às suas identidades técnicas acesso aos registros antigos. O login original usa email/senha e permanece compatível. Configurações futuras que utilizem autenticação anônima fora de networks/ precisarão de regras específicas.

Em 19/10/2026, a revisão automática de aprovação recusou a primeira tentativa de publicar as regras por considerar que substituir regras de produção poderia afetar o site atual e exigir autorização explícita sobre esse alcance. As regras não foram aplicadas por aquela tentativa. O proprietário recebeu este escopo e autorizou expressamente a publicação, as regras, os índices e os quatro perfis na mesma data.

## Recuperação

Antes de qualquer atualização futura, exporte um backup JSON da V2 e registre a versão das regras. Em caso de problema de interface, publique a revisão anterior do frontend; o histórico dos registros permanece no Firestore. Para falha de autorização, corrija as regras do namespace afetado, mantendo networks/ fechado para visitantes sem associação. Repor a regra original ampla voltaria a expor a V2 a todas as contas autenticadas e não é uma recuperação segura.
