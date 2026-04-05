---
read_when:
    - Pareando nodes iOS/Android a um gateway
    - Usando canvas/câmera de node para contexto do agente
    - Adicionando novos comandos de node ou helpers de CLI
summary: 'Nodes: pareamento, recursos, permissões e helpers de CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nodes
x-i18n:
    generated_at: "2026-04-05T12:47:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodes

Um **node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [Protocolo do Gateway](/gateway/protocol).

Transporte legado: [Protocolo de bridge](/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para nodes atuais).

O macOS também pode executar em **modo node**: o app de barra de menu se conecta ao servidor WS do Gateway e expõe seus comandos locais de canvas/câmera como um node (assim `openclaw nodes …` funciona nesta máquina Mac).

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de gateway.
- Mensagens de Telegram/WhatsApp/etc. chegam ao **gateway**, não aos nodes.
- Runbook de solução de problemas: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pareamento + status

**Nodes WS usam pareamento de dispositivo.** Nodes apresentam uma identidade de dispositivo durante `connect`; o Gateway
cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove via CLI de dispositivos (ou UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se um node tentar novamente com detalhes de autenticação alterados (role/scopes/chave pública), a solicitação
pendente anterior será substituída e um novo `requestId` será criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um node como **paired** quando a role de pareamento do dispositivo inclui `node`.
- O registro de pareamento do dispositivo é o contrato durável de roles aprovadas. A rotação
  de token permanece dentro desse contrato; ela não pode promover um node pareado a
  uma role diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) é um armazenamento separado
  de pareamento de node controlado pelo gateway; ele **não** controla o handshake WS `connect`.
- O escopo de aprovação segue os comandos declarados na solicitação pendente:
  - solicitação sem comando: `operator.pairing`
  - comandos de node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (`system.run`)

Use um **host de node** quando seu Gateway estiver em uma máquina e você quiser que comandos
sejam executados em outra. O modelo continua falando com o **gateway**; o gateway
encaminha chamadas `exec` ao **host de node** quando `host=node` é selecionado.

### O que é executado onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramenta.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.openclaw/exec-approvals.json`.

Observação sobre aprovação:

- Execuções de node com aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de shell/arquivo de runtime, o OpenClaw também vincula, no melhor esforço, um único
  operando de arquivo local concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução com aprovação será negada em vez de fingir cobertura total do runtime. Use sandboxing,
  hosts separados ou uma allowlist/fluxo confiável explícito para uma semântica mais ampla de interpretador.

### Iniciar um host de node (foreground)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind em loopback)

Se o Gateway usar bind em loopback (`gateway.bind=loopback`, padrão no modo local),
hosts de node remotos não podem se conectar diretamente. Crie um túnel SSH e aponte o
host de node para a ponta local do túnel.

Exemplo (host de node -> host do gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` oferece suporte a autenticação por token ou senha.
- Variáveis de ambiente são preferíveis: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- O fallback por configuração é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis segundo as regras de precedência remota.
- Se SecretRefs locais ativos `gateway.auth.*` estiverem configurados, mas não resolvidos, a autenticação do host de node falhará de forma fechada.
- A resolução de autenticação do host de node só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host de node (serviço)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Parear + nomear

No host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se o node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list`
e aprove o `requestId` atual.

Opções de nome:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição no gateway).

### Adicionar comandos à allowlist

Aprovações de exec são **por host de node**. Adicione entradas à allowlist a partir do gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host de node em `~/.openclaw/exec-approvals.json`.

### Apontar `exec` para o node

Configure padrões (configuração do gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Depois de definido, qualquer chamada `exec` com `host=node` será executada no host de node (sujeita à
allowlist/aprovações do node).

`host=auto` não escolherá implicitamente o node por conta própria, mas uma solicitação explícita por chamada com `host=node` é permitida a partir de `auto`. Se você quiser que exec no node seja o padrão da sessão, defina `tools.exec.host=node` ou `/exec host=node ...` explicitamente.

Relacionado:

- [CLI do host de node](/cli/node)
- [Ferramenta exec](/tools/exec)
- [Aprovações de exec](/tools/exec-approvals)

## Invocando comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem helpers de nível mais alto para fluxos comuns de trabalho de “fornecer ao agente um anexo MEDIA”.

## Capturas de tela (snapshots de canvas)

Se o node estiver exibindo o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Helper de CLI (grava em um arquivo temporário e imprime `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles de Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Observações:

- `canvas present` aceita URLs ou caminhos de arquivo locais (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Somente JSONL A2UI v0.8 é compatível (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O node deve estar **foregrounded** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 excessivos.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nodes)

Nodes compatíveis expõem `screen.record` (`mp4`). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa a captura do microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando houver múltiplos monitores.

## Localização (nodes)

Nodes expõem `location.get` quando Location está ativado nas configurações.

Helper de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- A localização fica **desativada por padrão**.
- “Always” exige permissão do sistema; a busca em segundo plano é no melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede a permissão **SMS** e o dispositivo oferece suporte a telefonia.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- O prompt de permissão deve ser aceito no dispositivo Android antes que o recurso seja anunciado.
- Dispositivos apenas com Wi‑Fi, sem telefonia, não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nodes Android podem anunciar famílias adicionais de comandos quando os recursos correspondentes estiverem ativados.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invocação:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- Comandos de movimento são controlados por recursos com base nos sensores disponíveis.

## Comandos de sistema (host de node / mac node)

O node do macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de node headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície de RPC direto para comandos explícitos de node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o gateway encaminha esse plano armazenado, não quaisquer campos de
  comando/cwd/sessão editados posteriormente pelo chamador.
- `system.notify` respeita o estado de permissão de notificação no app macOS.
- Metadados não reconhecidos de `platform` / `deviceFamily` de node usam uma allowlist conservadora padrão que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` delimitados por solicitação são reduzidos a uma allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez dos caminhos do wrapper. Se o desempacotamento não for seguro, nenhuma entrada de allowlist será persistida automaticamente.
- Em hosts de node Windows no modo allowlist, execuções de wrapper de shell via `cmd.exe /c` exigem aprovação (a entrada na allowlist sozinha não permite automaticamente a forma com wrapper).
- `system.notify` oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas extras de PATH, configure o ambiente do serviço do host de node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo node do macOS, `system.run` é controlado por aprovações de exec no app macOS (Configurações → Aprovações de exec).
  Ask/allowlist/full se comportam da mesma forma que no host de node headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de node headless, `system.run` é controlado por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Binding de exec em node

Quando vários nodes estão disponíveis, você pode vincular exec a um node específico.
Isso define o node padrão para `exec host=node` (e pode ser substituído por agente).

Padrão global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Substituição por agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Remova para permitir qualquer node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado por nome de permissão (por exemplo `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de node headless (multiplataforma)

O OpenClaw pode executar um **host de node headless** (sem UI) que se conecta ao
WebSocket do Gateway e expõe `system.run` / `system.which`. Isso é útil em Linux/Windows
ou para executar um node mínimo ao lado de um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é obrigatório (o Gateway mostrará um prompt de pareamento de dispositivo).
- O host de node armazena seu id de node, token, nome de exibição e informações de conexão com o gateway em `~/.openclaw/node.json`.
- Aprovações de exec são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Aprovações de exec](/tools/exec-approvals)).
- No macOS, o host de node headless executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de exec do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de forma fechada se ele estiver indisponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo mac node

- O app de barra de menu do macOS se conecta ao servidor WS do Gateway como um node (assim `openclaw nodes …` funciona nesta máquina Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.
