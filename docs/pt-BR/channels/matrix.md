---
read_when:
    - Configurar o Matrix no OpenClaw
    - Configurar E2EE e verificação do Matrix
summary: Status do suporte ao Matrix, configuração inicial e exemplos de configuração
title: Matrix
x-i18n:
    generated_at: "2026-04-05T12:37:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix é o plugin de canal Matrix incluído do OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin incluído

O Matrix é distribuído como plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Matrix, instale-o
manualmente:

Instalar a partir do npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulte [Plugins](/tools/plugin) para o comportamento de plugins e regras de instalação.

## Configuração inicial

1. Verifique se o plugin Matrix está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.

Caminhos de configuração interativa:

```bash
openclaw channels add
openclaw configure --section channels
```

O que o assistente do Matrix realmente solicita:

- URL do homeserver
- método de autenticação: token de acesso ou senha
- ID de usuário apenas quando você escolhe autenticação por senha
- nome do dispositivo opcional
- se deseja habilitar E2EE
- se deseja configurar o acesso a salas Matrix agora

Comportamentos do assistente que importam:

- Se já existirem variáveis de ambiente de autenticação do Matrix para a conta selecionada, e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho por variável de ambiente e grava apenas `enabled: true` para essa conta.
- Quando você adiciona outra conta Matrix interativamente, o nome da conta informado é normalizado no ID de conta usado na configuração e nas variáveis de ambiente. Por exemplo, `Ops Bot` vira `ops-bot`.
- Os prompts da lista de permissões de DM aceitam imediatamente valores completos `@user:server`. Nomes de exibição só funcionam quando a consulta ao diretório em tempo real encontra uma única correspondência exata; caso contrário, o assistente pede que você tente novamente com um ID Matrix completo.
- Os prompts da lista de permissões de sala aceitam IDs e aliases de sala diretamente. Eles também podem resolver nomes de salas já ingressadas em tempo real, mas nomes não resolvidos só são mantidos como digitados durante a configuração e são ignorados depois pela resolução de lista de permissões em tempo de execução. Prefira `!room:server` ou `#alias:server`.
- A identidade de sala/sessão em tempo de execução usa o ID estável da sala Matrix. Aliases declarados pela sala são usados apenas como entradas de consulta, não como chave de sessão de longo prazo nem como identidade estável de grupo.
- Para resolver nomes de salas antes de salvá-los, use `openclaw channels resolve --channel matrix "Project Room"`.

Configuração mínima baseada em token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuração baseada em senha (o token é armazenado em cache após o login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

O Matrix armazena credenciais em cache em `~/.openclaw/credentials/matrix/`.
A conta padrão usa `credentials.json`; contas nomeadas usam `credentials-<account>.json`.

Equivalentes em variáveis de ambiente (usados quando a chave de configuração não está definida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para contas não padrão, use variáveis de ambiente com escopo por conta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemplo para a conta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Para o ID de conta normalizado `ops-bot`, use:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

O Matrix escapa a pontuação nos IDs de conta para evitar colisões nas variáveis de ambiente com escopo.
Por exemplo, `-` vira `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho por variável de ambiente quando essas variáveis de autenticação já estão presentes e a conta selecionada ainda não tem autenticação do Matrix salva na configuração.

## Exemplo de configuração

Esta é uma configuração base prática com emparelhamento de DM, lista de permissões de sala e E2EE habilitado:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Prévias de streaming

O streaming de respostas do Matrix é opt-in.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie um único rascunho de resposta,
edite esse rascunho no local enquanto o modelo gera texto e depois o finalize quando a resposta
terminar:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` é o padrão. O OpenClaw espera a resposta final e a envia uma vez.
- `streaming: "partial"` cria uma mensagem de prévia editável para o bloco atual do assistente, em vez de enviar várias mensagens parciais.
- `blockStreaming: true` habilita mensagens de progresso Matrix separadas. Com `streaming: "partial"`, o Matrix mantém o rascunho ao vivo do bloco atual e preserva os blocos concluídos como mensagens separadas.
- Quando `streaming: "partial"` e `blockStreaming` está desativado, o Matrix apenas edita o rascunho ao vivo e envia a resposta concluída quando esse bloco ou turno termina.
- Se a prévia não couber mais em um único evento Matrix, o OpenClaw interrompe o streaming da prévia e volta para a entrega final normal.
- Respostas com mídia ainda enviam anexos normalmente. Se uma prévia obsoleta não puder mais ser reutilizada com segurança, o OpenClaw a remove antes de enviar a resposta final com mídia.
- Edições de prévia consomem chamadas extras à API Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador com relação a limite de taxa.

`blockStreaming` por si só não habilita prévias em rascunho.
Use `streaming: "partial"` para edições de prévia; depois adicione `blockStreaming: true` apenas se também quiser que blocos concluídos do assistente permaneçam visíveis como mensagens de progresso separadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file`, de modo que as prévias de imagem são criptografadas junto com o anexo completo. Salas não criptografadas continuam usando `thumbnail_url` simples. Nenhuma configuração é necessária — o plugin detecta automaticamente o estado de E2EE.

### Salas bot para bot

Por padrão, mensagens Matrix de outras contas Matrix do OpenClaw configuradas são ignoradas.

Use `allowBots` quando você quiser intencionalmente tráfego Matrix entre agentes:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` aceita mensagens de outras contas de bot Matrix configuradas em salas e DMs permitidas.
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot em salas. DMs continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de autorresposta.
- O Matrix não expõe aqui um sinalizador nativo de bot; o OpenClaw trata "de autoria de bot" como "enviado por outra conta Matrix configurada neste gateway OpenClaw".

Use listas de permissões rigorosas de sala e exigências de menção ao habilitar tráfego bot para bot em salas compartilhadas.

Habilitar criptografia:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Verificar status de verificação:

```bash
openclaw matrix verify status
```

Status detalhado (diagnóstico completo):

```bash
openclaw matrix verify status --verbose
```

Incluir a chave de recuperação armazenada na saída legível por máquina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inicializar cross-signing e estado de verificação:

```bash
openclaw matrix verify bootstrap
```

Suporte a múltiplas contas: use `channels.matrix.accounts` com credenciais por conta e `name` opcional. Consulte [Referência de configuração](/gateway/configuration-reference#multi-account-all-channels) para o padrão compartilhado.

Diagnóstico detalhado do bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forçar uma redefinição nova da identidade de cross-signing antes do bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo com uma chave de recuperação:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Detalhes detalhados da verificação do dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Verificar a integridade do backup de chaves de sala:

```bash
openclaw matrix verify backup status
```

Diagnóstico detalhado da integridade do backup:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar chaves de sala do backup do servidor:

```bash
openclaw matrix verify backup restore
```

Diagnóstico detalhado da restauração:

```bash
openclaw matrix verify backup restore --verbose
```

Excluir o backup atual do servidor e criar uma nova linha de base de backup. Se a
chave de backup armazenada não puder ser carregada corretamente, essa redefinição também poderá recriar o armazenamento secreto para que
futuras inicializações frias possam carregar a nova chave de backup:

```bash
openclaw matrix verify backup reset --yes
```

Todos os comandos `verify` são concisos por padrão (incluindo logs internos silenciosos do SDK) e mostram diagnóstico detalhado apenas com `--verbose`.
Use `--json` para saída totalmente legível por máquina em scripts.

Em configurações com múltiplas contas, os comandos CLI do Matrix usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina `channels.matrix.defaultAccount` primeiro ou essas operações implícitas da CLI vão parar e pedir que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou de dispositivo tenham como alvo explícito uma conta nomeada:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia estiver desabilitada ou indisponível para uma conta nomeada, avisos e erros de verificação do Matrix apontarão para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

### O que "verificado" significa

O OpenClaw trata este dispositivo Matrix como verificado apenas quando ele é verificado pela sua própria identidade de cross-signing.
Na prática, `openclaw matrix verify status --verbose` expõe três sinais de confiança:

- `Locally trusted`: este dispositivo é confiável apenas pelo cliente atual
- `Cross-signing verified`: o SDK informa que o dispositivo está verificado via cross-signing
- `Signed by owner`: o dispositivo é assinado pela sua própria chave de self-signing

`Verified by owner` passa a ser `yes` apenas quando há verificação por cross-signing ou assinatura do proprietário.
Confiança local, por si só, não é suficiente para o OpenClaw tratar o dispositivo como totalmente verificado.

### O que o bootstrap faz

`openclaw matrix verify bootstrap` é o comando de reparo e configuração para contas Matrix criptografadas.
Ele faz tudo o que segue, nesta ordem:

- inicializa o armazenamento secreto, reutilizando uma chave de recuperação existente quando possível
- inicializa o cross-signing e envia chaves públicas de cross-signing ausentes
- tenta marcar e fazer cross-sign do dispositivo atual
- cria um novo backup de chaves de sala no servidor, caso ainda não exista

Se o homeserver exigir autenticação interativa para enviar chaves de cross-signing, o OpenClaw tenta o envio primeiro sem autenticação, depois com `m.login.dummy` e, então, com `m.login.password` quando `channels.matrix.password` estiver configurado.

Use `--force-reset-cross-signing` apenas quando você quiser intencionalmente descartar a identidade atual de cross-signing e criar uma nova.

Se você quiser intencionalmente descartar o backup atual de chaves de sala e iniciar uma nova
linha de base de backup para mensagens futuras, use `openclaw matrix verify backup reset --yes`.
Faça isso apenas quando aceitar que histórico criptografado antigo irrecuperável continuará
indisponível e que o OpenClaw poderá recriar o armazenamento secreto se o segredo atual do backup
não puder ser carregado com segurança.

### Nova linha de base de backup

Se você quiser manter o funcionamento de futuras mensagens criptografadas e aceitar perder histórico antigo irrecuperável, execute estes comandos em ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Adicione `--account <id>` a cada comando quando quiser direcionar explicitamente uma conta Matrix nomeada.

### Comportamento na inicialização

Quando `encryption: true`, o Matrix define `startupVerification` por padrão como `"if-unverified"`.
Na inicialização, se este dispositivo ainda não estiver verificado, o Matrix solicitará autoverificação em outro cliente Matrix,
evitará solicitações duplicadas enquanto uma já estiver pendente e aplicará um cooldown local antes de tentar novamente após reinicializações.
Tentativas de solicitação com falha são repetidas mais cedo do que a criação bem-sucedida da solicitação, por padrão.
Defina `startupVerification: "off"` para desabilitar solicitações automáticas na inicialização, ou ajuste `startupVerificationCooldownHours`
se quiser uma janela de repetição mais curta ou mais longa.

A inicialização também executa automaticamente uma etapa conservadora de bootstrap de criptografia.
Essa etapa tenta primeiro reutilizar o armazenamento secreto atual e a identidade atual de cross-signing, e evita redefinir o cross-signing, a menos que você execute um fluxo explícito de reparo por bootstrap.

Se a inicialização encontrar um estado de bootstrap quebrado e `channels.matrix.password` estiver configurado, o OpenClaw poderá tentar um caminho de reparo mais rigoroso.
Se o dispositivo atual já estiver assinado pelo proprietário, o OpenClaw preservará essa identidade em vez de redefini-la automaticamente.

Atualizando a partir do plugin Matrix público anterior:

- O OpenClaw reutiliza automaticamente a mesma conta Matrix, o mesmo token de acesso e a mesma identidade de dispositivo quando possível.
- Antes de executar quaisquer mudanças acionáveis de migração do Matrix, o OpenClaw cria ou reutiliza um snapshot de recuperação em `~/Backups/openclaw-migrations/`.
- Se você usa várias contas Matrix, defina `channels.matrix.defaultAccount` antes de atualizar do layout antigo de armazenamento plano para que o OpenClaw saiba qual conta deve receber esse estado legado compartilhado.
- Se o plugin anterior armazenava localmente uma chave de descriptografia de backup de chaves de sala Matrix, a inicialização ou `openclaw doctor --fix` a importará automaticamente para o novo fluxo de chave de recuperação.
- Se o token de acesso do Matrix mudou depois que a migração foi preparada, a inicialização agora examina raízes de armazenamento irmãs com hash do token em busca de estado legado pendente de restauração antes de desistir da restauração automática do backup.
- Se o token de acesso do Matrix mudar depois para a mesma conta, homeserver e usuário, o OpenClaw agora prefere reutilizar a raiz de armazenamento existente mais completa com hash do token, em vez de começar com um diretório de estado Matrix vazio.
- Na próxima inicialização do gateway, chaves de sala com backup são restauradas automaticamente no novo armazenamento de criptografia.
- Se o plugin antigo tinha chaves de sala somente locais que nunca foram salvas em backup, o OpenClaw avisará claramente. Essas chaves não podem ser exportadas automaticamente do armazenamento de criptografia Rust anterior, então parte do histórico criptografado antigo pode continuar indisponível até recuperação manual.
- Consulte [Migração do Matrix](/install/migrating-matrix) para o fluxo completo de atualização, limites, comandos de recuperação e mensagens comuns de migração.

O estado criptografado em tempo de execução é organizado em raízes por conta, por usuário e por hash de token em
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Esse diretório contém o armazenamento de sincronização (`bot-storage.json`), armazenamento de criptografia (`crypto/`),
arquivo de chave de recuperação (`recovery-key.json`), snapshot do IndexedDB (`crypto-idb-snapshot.json`),
vínculos de thread (`thread-bindings.json`) e estado de verificação na inicialização (`startup-verification.json`)
quando esses recursos estão em uso.
Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor
raiz existente para essa tupla conta/homeserver/usuário, para que o estado anterior de sincronização, criptografia, vínculos de thread
e verificação na inicialização continue visível.

### Modelo de armazenamento de criptografia do Node

O Matrix E2EE neste plugin usa o caminho oficial de criptografia Rust do `matrix-js-sdk` no Node.
Esse caminho espera persistência baseada em IndexedDB quando você quer que o estado de criptografia sobreviva a reinicializações.

Atualmente, o OpenClaw fornece isso no Node por:

- usar `fake-indexeddb` como o shim de API IndexedDB esperado pelo SDK
- restaurar o conteúdo do IndexedDB da criptografia Rust a partir de `crypto-idb-snapshot.json` antes de `initRustCrypto`
- persistir o conteúdo atualizado do IndexedDB de volta em `crypto-idb-snapshot.json` após a inicialização e durante a execução
- serializar a restauração e persistência do snapshot em relação a `crypto-idb-snapshot.json` com um bloqueio consultivo de arquivo, para que a persistência em tempo de execução do gateway e a manutenção por CLI não concorram pelo mesmo arquivo de snapshot

Trata-se de infraestrutura de compatibilidade/armazenamento, não de uma implementação de criptografia personalizada.
O arquivo de snapshot é um estado sensível de tempo de execução e é armazenado com permissões restritivas de arquivo.
No modelo de segurança do OpenClaw, o host do gateway e o diretório de estado local do OpenClaw já estão dentro do limite confiável do operador, então isso é principalmente uma preocupação operacional de durabilidade, e não um limite separado de confiança remota.

Melhoria planejada:

- adicionar suporte a SecretRef para material persistente de chave Matrix, para que chaves de recuperação e segredos relacionados de criptografia do armazenamento possam vir de provedores de segredos do OpenClaw, em vez de apenas arquivos locais

## Gerenciamento de perfil

Atualize o próprio perfil Matrix para a conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser direcionar explicitamente uma conta Matrix nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw primeiro a envia ao Matrix e armazena a URL `mxc://` resolvida de volta em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Avisos automáticos de verificação

O Matrix agora publica avisos de ciclo de vida de verificação diretamente na DM estrita de verificação como mensagens `m.notice`.
Isso inclui:

- avisos de solicitação de verificação
- avisos de verificação pronta (com orientação explícita "Verificar por emoji")
- avisos de início e conclusão da verificação
- detalhes SAS (emoji e decimal) quando disponíveis

Solicitações de verificação recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente pelo OpenClaw.
Para fluxos de autoverificação, o OpenClaw também inicia automaticamente o fluxo SAS quando a verificação por emoji fica disponível e confirma o próprio lado.
Para solicitações de verificação de outro usuário/dispositivo Matrix, o OpenClaw aceita automaticamente a solicitação e depois espera o fluxo SAS seguir normalmente.
Você ainda precisa comparar o SAS em emoji ou decimal no seu cliente Matrix e confirmar "They match" lá para concluir a verificação.

O OpenClaw não aceita automaticamente, às cegas, fluxos duplicados iniciados por ele mesmo. Na inicialização, ele não cria uma nova solicitação quando já existe uma solicitação de autoverificação pendente.

Avisos de protocolo/sistema de verificação não são encaminhados ao pipeline de chat do agente, então eles não produzem `NO_REPLY`.

### Higiene de dispositivos

Dispositivos Matrix antigos gerenciados pelo OpenClaw podem se acumular na conta e dificultar o entendimento da confiança em salas criptografadas.
Liste-os com:

```bash
openclaw matrix devices list
```

Remova dispositivos obsoletos gerenciados pelo OpenClaw com:

```bash
openclaw matrix devices prune-stale
```

### Reparo de sala direta

Se o estado de mensagem direta sair de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos que apontam para salas solo antigas em vez da DM ativa. Inspecione o mapeamento atual de um peer com:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare-o com:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

O reparo mantém a lógica específica do Matrix dentro do plugin:

- ele prefere uma DM estrita 1:1 que já esteja mapeada em `m.direct`
- caso contrário, recorre a qualquer DM estrita 1:1 atualmente ingressada com esse usuário
- se não existir uma DM íntegra, cria uma nova sala direta e reescreve `m.direct` para apontar para ela

O fluxo de reparo não exclui salas antigas automaticamente. Ele apenas escolhe a DM íntegra e atualiza o mapeamento para que novos envios Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a atingir a sala correta.

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios por ferramentas de mensagem.

- `threadReplies: "off"` mantém respostas no nível superior e mantém mensagens de entrada com thread na sessão pai.
- `threadReplies: "inbound"` responde dentro de uma thread apenas quando a mensagem de entrada já estava nessa thread.
- `threadReplies: "always"` mantém respostas de sala em uma thread enraizada na mensagem que acionou o evento e roteia essa conversa pela sessão com escopo de thread correspondente desde a primeira mensagem acionadora.
- `dm.threadReplies` substitui a configuração de nível superior apenas para DMs. Por exemplo, você pode manter threads de sala isoladas e DMs planas.
- Mensagens de entrada com thread incluem a mensagem raiz da thread como contexto adicional para o agente.
- Envios por ferramenta de mensagem agora herdam automaticamente a thread Matrix atual quando o destino é a mesma sala, ou o mesmo usuário-alvo de DM, a menos que um `threadId` explícito seja fornecido.
- Há suporte a vínculos de thread em tempo de execução para Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread agora funcionam em salas e DMs Matrix.
- `/focus` no nível superior de sala/DM Matrix cria uma nova thread Matrix e a vincula à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread Matrix existente vincula essa thread atual.

## Vínculos de conversa ACP

Salas, DMs e threads Matrix existentes podem ser transformadas em workspaces ACP duráveis sem alterar a superfície de chat.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread Matrix existente que deseja continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual continua sendo a superfície de chat e mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de uma thread Matrix existente, `--bind here` vincula essa thread atual no local.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Observações:

- `--bind here` não cria uma thread Matrix filha.
- `threadBindings.spawnAcpSessions` só é necessário para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread Matrix filha.

### Configuração de vínculos de thread

O Matrix herda padrões globais de `session.threadBindings` e também oferece suporte a substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Os sinalizadores de criação vinculada a thread do Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` no nível superior crie e vincule novas threads Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a threads Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação de entrada e reações de confirmação de entrada.

- As ferramentas de reação de saída são controladas por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento Matrix específico.
- `reactions` lista o resumo atual de reações de um evento Matrix específico.
- `emoji=""` remove as próprias reações da conta do bot nesse evento.
- `remove: true` remove apenas a reação com o emoji especificado da conta do bot.

O escopo das reações de confirmação segue a ordem de resolução padrão do OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback para o emoji da identidade do agente

O escopo de reação de confirmação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

O modo de notificação de reação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- padrão: `own`

Comportamento atual:

- `reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando têm como alvo mensagens Matrix de autoria do bot.
- `reactionNotifications: "off"` desabilita eventos de sistema de reação.
- Remoções de reações ainda não são sintetizadas em eventos de sistema porque o Matrix as expõe como redações, e não como remoções autônomas de `m.reaction`.

## Contexto de histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala Matrix aciona o agente.
- Ele recorre a `messages.groupChat.historyLimit`. Defina `0` para desabilitar.
- O histórico de sala Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala Matrix é apenas pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram resposta e então captura esse intervalo quando uma menção ou outro gatilho chega.
- A mensagem atual que acionou o evento não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada daquele turno.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot original do histórico em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar de sala, como texto de resposta obtido, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de lista de permissões de sala/usuário.
- `contextVisibility: "allowlist_quote"` funciona como `allowlist`, mas ainda mantém uma resposta citada explícita.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem de entrada pode acionar uma resposta.
A autorização do gatilho ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

## Exemplo de política de DM e sala

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consulte [Grupos](/channels/groups) para comportamento de controle por menção e lista de permissões.

Exemplo de emparelhamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de emparelhamento pendente e pode enviar uma resposta de lembrete novamente após um curto cooldown, em vez de gerar um novo código.

Consulte [Emparelhamento](/channels/pairing) para o fluxo compartilhado de emparelhamento de DM e layout de armazenamento.

## Aprovações de execução

O Matrix pode atuar como um cliente de aprovação de execução para uma conta Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa `channels.matrix.dm.allowFrom` como fallback)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Os aprovadores devem ser IDs de usuário Matrix, como `@owner:example.org`. O Matrix habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desabilitar explicitamente o Matrix como cliente de aprovação nativo. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política de fallback de aprovação de execução.

O roteamento nativo do Matrix hoje é apenas para execução:

- `channels.matrix.execApprovals.*` controla o roteamento nativo de DM/canal apenas para aprovações de execução.
- Aprovações de plugin ainda usam o `/approve` compartilhado no mesmo chat mais qualquer encaminhamento configurado em `approvals.plugin`.
- O Matrix ainda pode reutilizar `channels.matrix.dm.allowFrom` para autorização de aprovação de plugin quando consegue inferir aprovadores com segurança, mas não expõe um caminho separado nativo de distribuição por DM/canal para aprovação de plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para as DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala ou DM Matrix de origem
- `target: "both"` envia para as DMs dos aprovadores e para a sala ou DM Matrix de origem

Hoje, o Matrix usa prompts de aprovação em texto. Os aprovadores os resolvem com `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. A entrega por canal inclui o texto do comando, então habilite `channel` ou `both` apenas em salas confiáveis.

Os prompts de aprovação Matrix reutilizam o planejador de aprovações compartilhado do núcleo. A superfície nativa específica do Matrix é apenas o transporte para aprovações de execução: roteamento de sala/DM e comportamento de envio/atualização/exclusão de mensagens.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Aprovações de execução](/tools/exec-approvals)

## Exemplo com múltiplas contas

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Valores de nível superior em `channels.matrix` atuam como padrões para contas nomeadas, a menos que uma conta os substitua.
Você pode restringir entradas de sala herdadas a uma conta Matrix com `groups.<room>.account` (ou o legado `rooms.<room>.account`).
Entradas sem `account` permanecem compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` continuam funcionando quando a conta padrão é configurada diretamente no nível superior `channels.matrix.*`.
Padrões parciais compartilhados de autenticação não criam por si só uma conta padrão implícita separada. O OpenClaw só sintetiza a conta `default` de nível superior quando esse padrão tem autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem continuar detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfizerem a autenticação depois.
Se o Matrix já tiver exatamente uma conta nomeada, ou `defaultAccount` apontar para uma chave de conta nomeada existente, a promoção de reparo/configuração de conta única para múltiplas contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves de autenticação/bootstrap do Matrix são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, sondagem e operações de CLI.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos CLI que dependem de seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita para um comando.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção SSRF, a menos que você
faça opt-in explicitamente por conta.

Se o seu homeserver estiver em localhost, um IP de LAN/Tailscale ou um hostname interno, habilite
`allowPrivateNetwork` para essa conta Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Exemplo de configuração via CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esse opt-in permite apenas destinos privados/internos confiáveis. Homeservers públicos em texto claro, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Proxy para tráfego Matrix

Se a sua implantação Matrix precisar de um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Contas nomeadas podem substituir o padrão de nível superior com `channels.matrix.accounts.<id>.proxy`.
O OpenClaw usa a mesma configuração de proxy para tráfego Matrix em tempo de execução e para sondas de status de conta.

## Resolução de destino

O Matrix aceita estes formatos de destino em qualquer lugar em que o OpenClaw pedir um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

A consulta ao diretório em tempo real usa a conta Matrix autenticada:

- Consultas de usuário consultam o diretório de usuários Matrix nesse homeserver.
- Consultas de sala aceitam diretamente IDs e aliases explícitos de sala e depois recorrem à busca de nomes de salas ingressadas para essa conta.
- A busca por nome em salas ingressadas é best-effort. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de lista de permissões em tempo de execução.

## Referência de configuração

- `enabled`: habilita ou desabilita o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estão configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `allowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Habilite isso quando o homeserver resolver para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo de usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: token de acesso para autenticação baseada em token. Há suporte a valores em texto simples e valores SecretRef para `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` em provedores env/file/exec. Consulte [Gerenciamento de segredos](/gateway/secrets).
- `password`: senha para login baseado em senha. Há suporte a valores em texto simples e valores SecretRef.
- `deviceId`: ID explícito de dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login por senha.
- `avatarUrl`: URL armazenada do próprio avatar para sincronização de perfil e atualizações `set-profile`.
- `initialSyncLimit`: limite de eventos de sincronização na inicialização.
- `encryption`: habilita E2EE.
- `allowlistOnly`: força comportamento somente por lista de permissões para DMs e salas.
- `allowBots`: permite mensagens de outras contas Matrix do OpenClaw configuradas (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade de contexto suplementar de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permissões de IDs de usuário para tráfego de sala.
- Entradas de `groupAllowFrom` devem ser IDs completos de usuário Matrix. Nomes não resolvidos são ignorados em tempo de execução.
- `historyLimit`: máximo de mensagens de sala a incluir como contexto de histórico de grupo. Recorre a `messages.groupChat.historyLimit`. Defina `0` para desabilitar.
- `replyToMode`: `off`, `first` ou `all`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `partial`, `true` ou `false`. `partial` e `true` habilitam prévias em rascunho de mensagem única com atualizações por edição no local.
- `blockStreaming`: `true` habilita mensagens separadas de progresso para blocos concluídos do assistente enquanto o streaming de prévia em rascunho está ativo.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão vinculada a thread.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho do bloco de mensagem de saída.
- `chunkMode`: `length` ou `newline`.
- `responsePrefix`: prefixo opcional de mensagem para respostas de saída.
- `ackReaction`: substituição opcional da reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional do escopo da reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reação de entrada (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para tratamento de mídia Matrix. Aplica-se a envios de saída e processamento de mídia de entrada.
- `autoJoin`: política de entrada automática em convites (`always`, `allowlist`, `off`). Padrão: `off`.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o tratamento do convite; o OpenClaw não confia no estado de alias declarado pela sala convidante.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Entradas de `dm.allowFrom` devem ser IDs completos de usuário Matrix, a menos que você já as tenha resolvido por consulta em diretório em tempo real.
- `dm.threadReplies`: substituição da política de thread apenas para DMs (`off`, `inbound`, `always`). Substitui a configuração de nível superior `threadReplies` tanto para posicionamento de resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa de aprovações de execução no Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix autorizados a aprovar solicitações de execução. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de política por sala. Prefira IDs ou aliases de sala; nomes de sala não resolvidos são ignorados em tempo de execução. A identidade de sessão/grupo usa o ID estável da sala após a resolução, enquanto rótulos legíveis por humanos continuam vindo dos nomes das salas.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com múltiplas contas.
- `groups.<room>.allowBots`: substituição no nível da sala para remetentes bot configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: lista de permissões de remetentes por sala.
- `groups.<room>.tools`: substituições por sala para permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição de controle por menção no nível da sala. `true` desabilita exigências de menção para essa sala; `false` volta a forçá-las.
- `groups.<room>.skills`: filtro opcional de Skills no nível da sala.
- `groups.<room>.systemPrompt`: trecho opcional de prompt do sistema no nível da sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle por ferramenta e por ação (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionados

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Emparelhamento](/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e fortalecimento
