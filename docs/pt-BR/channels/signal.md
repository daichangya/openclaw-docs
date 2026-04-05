---
read_when:
    - Configurando o suporte ao Signal
    - Depurando envio/recebimento no Signal
summary: Suporte ao Signal via signal-cli (JSON-RPC + SSE), caminhos de configuração e modelo de número
title: Signal
x-i18n:
    generated_at: "2026-04-05T12:36:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Status: integração com CLI externa. O Gateway se comunica com `signal-cli` via HTTP JSON-RPC + SSE.

## Pré-requisitos

- OpenClaw instalado no seu servidor (o fluxo Linux abaixo foi testado no Ubuntu 24).
- `signal-cli` disponível no host onde o gateway é executado.
- Um número de telefone que possa receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso via navegador para o captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número Signal separado** para o bot (recomendado).
2. Instale `signal-cli` (Java é necessário se você usar a build JVM).
3. Escolha um caminho de configuração:
   - **Caminho A (vinculação por QR):** `signal-cli link -n "OpenClaw"` e escaneie com o Signal.
   - **Caminho B (registro por SMS):** registre um número dedicado com captcha + verificação por SMS.
4. Configure o OpenClaw e reinicie o gateway.
5. Envie a primeira DM e aprove o pareamento (`openclaw pairing approve signal <CODE>`).

Configuração mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Referência de campos:

| Campo       | Descrição                                            |
| ----------- | ---------------------------------------------------- |
| `account`   | Número de telefone do bot no formato E.164 (`+15551234567`) |
| `cliPath`   | Caminho para `signal-cli` (`signal-cli` se estiver no `PATH`) |
| `dmPolicy`  | Política de acesso a DM (`pairing` recomendado)      |
| `allowFrom` | Números de telefone ou valores `uuid:<id>` permitidos para enviar DM |

## O que é

- Canal Signal via `signal-cli` (não libsignal embutido).
- Roteamento determinístico: as respostas sempre voltam para o Signal.
- DMs compartilham a sessão principal do agente; grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).

## Escritas de configuração

Por padrão, o Signal tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desabilite com:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## O modelo de número (importante)

- O gateway se conecta a um **dispositivo Signal** (a conta do `signal-cli`).
- Se você executar o bot na **sua conta pessoal do Signal**, ele ignorará suas próprias mensagens (proteção contra loop).
- Para “eu mando mensagem para o bot e ele responde”, use um **número de bot separado**.

## Caminho de configuração A: vincular conta Signal existente (QR)

1. Instale `signal-cli` (build JVM ou nativa).
2. Vincule uma conta de bot:
   - `signal-cli link -n "OpenClaw"` e depois escaneie o QR no Signal.
3. Configure o Signal e inicie o gateway.

Exemplo:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Suporte a múltiplas contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Consulte [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) para o padrão compartilhado.

## Caminho de configuração B: registrar número de bot dedicado (SMS, Linux)

Use isto quando você quiser um número de bot dedicado em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que possa receber SMS (ou verificação por voz para linhas fixas).
   - Use um número de bot dedicado para evitar conflitos de conta/sessão.
2. Instale `signal-cli` no host do gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a build JVM (`signal-cli-${VERSION}.tar.gz`), instale JRE 25+ primeiro.
Mantenha `signal-cli` atualizado; o upstream observa que versões antigas podem quebrar à medida que as APIs do servidor Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se captcha for necessário:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Conclua o captcha, copie o destino do link `signalcaptcha://...` em “Open Signal”.
3. Execute a partir do mesmo IP externo da sessão do navegador sempre que possível.
4. Execute o registro novamente imediatamente (tokens de captcha expiram rápido):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure o OpenClaw, reinicie o gateway e verifique o canal:

```bash
# Se você executa o gateway como um serviço systemd do usuário:
systemctl --user restart openclaw-gateway.service

# Em seguida, verifique:
openclaw doctor
openclaw channels status --probe
```

5. Faça o pareamento do remetente de DM:
   - Envie qualquer mensagem para o número do bot.
   - Aprove o código no servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salve o número do bot como contato no seu telefone para evitar “Unknown contact”.

Importante: registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão principal do app Signal para esse número. Prefira um número de bot dedicado ou use o modo de vinculação por QR se precisar manter a configuração existente do app no seu telefone.

Referências upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Se você quiser gerenciar `signal-cli` por conta própria (inicializações lentas da JVM, init de contêiner ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Isso ignora a inicialização automática e a espera na inicialização dentro do OpenClaw. Para inicializações lentas com auto-start, defina `channels.signal.startupTimeoutMs`.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até serem aprovadas (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pareamento é a troca de token padrão para DMs do Signal. Detalhes: [Pairing](/channels/pairing)
- Remetentes somente com UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.
- `channels.signal.groups["<group-id>" | "*"]` pode substituir o comportamento do grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com múltiplas contas.
- Observação de runtime: se `channels.signal` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- `signal-cli` é executado como um daemon; o gateway lê eventos via SSE.
- Mensagens de entrada são normalizadas no envelope compartilhado de canais.
- As respostas sempre são roteadas de volta para o mesmo número ou grupo.

## Mídia + limites

- O texto de saída é dividido em blocos por `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- Anexos compatíveis (base64 buscado de `signal-cli`).
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para ignorar o download de mídia.
- O contexto de histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com fallback para `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).

## Digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em andamento.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é true, o OpenClaw encaminha confirmações de leitura para DMs permitidas.
- Signal-cli não expõe confirmações de leitura para grupos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=signal`.
- Alvos: remetente E.164 ou UUID (use `uuid:<id>` da saída de pareamento; UUID sem prefixo também funciona).
- `messageId` é o timestamp Signal da mensagem à qual você está reagindo.
- Reações em grupo exigem `targetAuthor` ou `targetAuthorUuid`.

Exemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: habilita/desabilita ações de reação (padrão true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desabilita reações do agente (a ferramenta de mensagem `react` retornará erro).
  - `minimal`/`extensive` habilita reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Alvos de entrega (CLI/cron)

- DMs: `signal:+15551234567` (ou E.164 simples).
- DMs por UUID: `uuid:<id>` (ou UUID sem prefixo).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se compatível com a sua conta Signal).

## Solução de problemas

Execute primeiro esta sequência:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois confirme o estado de pareamento de DM, se necessário:

```bash
openclaw pairing list signal
```

Falhas comuns:

- Daemon acessível, mas sem respostas: verifique as configurações da conta/daemon (`httpUrl`, `account`) e o modo de recebimento.
- DMs ignoradas: o remetente está com aprovação de pareamento pendente.
- Mensagens de grupo ignoradas: o controle de remetente/menção do grupo bloqueia a entrega.
- Erros de validação de configuração após edições: execute `openclaw doctor --fix`.
- Signal ausente do diagnóstico: confirme `channels.signal.enabled: true`.

Verificações extras:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [/channels/troubleshooting](/channels/troubleshooting).

## Observações de segurança

- `signal-cli` armazena chaves de conta localmente (normalmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta Signal antes de migrar ou reconstruir o servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"` a menos que você queira explicitamente um acesso a DM mais amplo.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar um novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: habilitar/desabilitar a inicialização do canal.
- `channels.signal.account`: E.164 para a conta do bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: inicialização automática do daemon (padrão true se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera da inicialização em ms (limite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignorar downloads de anexo.
- `channels.signal.ignoreStories`: ignorar stories do daemon.
- `channels.signal.sendReadReceipts`: encaminhar confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: allowlist de DM (E.164 ou `uuid:<id>`). `open` requer `"*"`. O Signal não tem nomes de usuário; use ids de telefone/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: allowlist de remetentes de grupo.
- `channels.signal.groups`: substituições por grupo, indexadas pelo id do grupo Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com múltiplas contas.
- `channels.signal.historyLimit`: máximo de mensagens de grupo a incluir como contexto (0 desabilita).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Substituições por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.signal.mediaMaxMb`: limite de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o Signal não oferece suporte a menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e hardening
