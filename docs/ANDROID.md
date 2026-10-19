# CICLOPE NET para Android

APK nativo leve que abre o site publicado dentro do Android WebView, preservando o ícone SVG como drawable vetorial. Usa o mesmo Firebase, crônica, cinco perfis e regras. Não replica nem migra os dados. Pacote: br.com.ciclopenet; versão 2.1.0 (1); Android 8/API 26 ou superior; target API 35. Nenhuma biblioteca externa Android, assinatura de serviço ou cobrança foi adicionada.

## Instalação e acesso

Baixe o APK na página /apk/ ou nos Releases do GitHub. Abra o arquivo no Android e permita a instalação pelo navegador quando solicitado. Use o convite no aplicativo, que conta como outro dispositivo. A autorização do navegador não é transferida automaticamente. Os convites atuais permitem dois dispositivos cada; se ambos já tiverem sido usados, o responsável deve gerar outro convite. A configuração e o ícone permanecem no aparelho; a conexão com a internet é necessária para usar a rede. O sistema Android WebView deve estar atualizado.

## Avisos gratuitos

O JobScheduler consulta as últimas dez mensagens e dez atividades com o ID token da sessão anônima autorizada pelo convite. As regras normais do Firestore continuam sendo aplicadas. Apenas alterações posteriores à autorização são consideradas; contribuições do próprio dispositivo não disparam avisos. Os avisos são agrupados por chat/arquivos, sem expor conteúdo no bloqueio de tela. A seleção do perfil não concede acesso administrativo.

Os avisos são periódicos, **não push instantâneo**. O intervalo solicitado é 15 minutos; bateria, Doze e restrições do fabricante podem aumentar esse tempo. Forçar a parada impede verificações até abrir o aplicativo novamente. O app aberto usa a sincronização e os indicadores já existentes no site. Não há serviço permanente nem promessa de entrega imediata. O botão Avisos ativa, desativa e testa a exibição. Android 13 ou superior pede POST_NOTIFICATIONS.

As consultas usam a cota gratuita atual do Firestore. Com cinco aparelhos e 96 consultas diárias por aparelho, o limite de dez documentos em cada uma das duas coleções representa até 9.600 documentos/dia, além das leituras de autorização e do uso normal do site. O Android pode executar menos consultas. Continua sujeito às cotas Spark; não é necessário habilitar faturamento.

Referências: [JobScheduler e intervalos](https://developer.android.com/reference/android/app/job/JobInfo.Builder#setPeriodic(long)), [permissão de notificações](https://developer.android.com/develop/ui/views/notifications/notification-permission), [Firestore REST e autenticação](https://firebase.google.com/docs/firestore/use-rest-api).

## Construção e assinatura

No Windows com Java 21 e Python, execute `python scripts/android-sdk.py` e `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android.ps1`. Os dois pacotes oficiais do SDK Google são baixados em artifacts/android-tools e seus checksums são verificados. A compilação usa AAPT2, javac, D8, zipalign e apksigner, sem Android Studio ou Gradle. O resultado é CICLOPE-NET.apk.

Guarde **CICLOPE-NET.private.jks** e **ANDROID-ASSINATURA.private.json** em uma cópia privada: são necessários para assinar atualizações compatíveis. Não os publique nem envie com o APK. APKs, chaves, senhas e arquivos de construção são ignorados pelo Git; apenas o APK e seu checksum são enviados aos Releases. O ZIP público contém o código Android, sem a chave.

O aplicativo mantém o refresh token do próprio dispositivo em armazenamento privado, com backup desabilitado; não embute chaves administrativas. Não permite HTTP, navegação externa dentro do WebView nem frames no site. Downloads e backups usam o seletor de arquivos do Android (até 16 MB por arquivo no app; backups maiores podem ser baixados pelo site). O aplicativo não inclui códigos de convite.

## Verificação desta entrega

Compilação Java/Dex, recursos e manifesto, alinhamento e assinatura APK v2/v3 verificados. A ponte web é testada em navegador com interface nativa simulada, autorização por convite e exportação de arquivo. **Não houve teste em aparelho Android físico ou emulador Android nesta entrega rápida.** O botão Testar aviso permite conferir a permissão de notificações no celular; não simula uma mensagem recebida do servidor.
