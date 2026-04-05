---
read_when:
    - Executando o Gateway pela CLI (dev ou servidores)
    - Depurando autenticação, modos de bind e conectividade do Gateway
    - Descobrindo gateways via Bonjour (DNS-SD local + de área ampla)
summary: CLI do Gateway do OpenClaw (`openclaw gateway`) — executar, consultar e descobrir gateways
title: gateway
x-i18n:
    generated_at: "2026-04-05T12:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# CLI do Gateway

O Gateway é o servidor WebSocket do OpenClaw (canais, nodes, sessões, hooks).

Os subcomandos desta página ficam sob `openclaw gateway …`.

Documentação relacionada:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Executar o Gateway

Execute um processo local do Gateway:

```bash
openclaw gateway
```

Alias de foreground:

```bash
openclaw gateway run
```

Observações:

- Por padrão, o Gateway se recusa a iniciar, a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/dev.
- Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração corrompida ou sobrescrita e repare-a em vez de assumir implicitamente o modo local.
- Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a “adivinhar local” por você.
- Bind além de loopback sem autenticação é bloqueado (proteção de segurança).
- `SIGUSR1` dispara uma reinicialização em processo quando autorizado (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto gateway tool/config apply/update continuam permitidos).
- Os handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo raw, restaure o terminal antes de sair.

### Opções

- `--port <port>`: porta WebSocket (o padrão vem de config/env; normalmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de bind do listener.
- `--auth <token|password>`: substituição do modo de autenticação.
- `--token <token>`: substituição do token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
- `--password <password>`: substituição da senha. Aviso: senhas inline podem ficar expostas em listagens locais de processos.
- `--password-file <path>`: lê a senha do gateway de um arquivo.
- `--tailscale <off|serve|funnel>`: expõe o Gateway via Tailscale.
- `--tailscale-reset-on-exit`: redefine a configuração serve/funnel do Tailscale ao encerrar.
- `--allow-unconfigured`: permite iniciar o gateway sem `gateway.mode=local` na configuração. Isso ignora a proteção de inicialização apenas para bootstrap ad hoc/dev; não grava nem repara o arquivo de configuração.
- `--dev`: cria uma configuração + workspace de dev se estiverem ausentes (ignora `BOOTSTRAP.md`).
- `--reset`: redefine configuração + credenciais + sessões + workspace de dev (requer `--dev`).
- `--force`: mata qualquer listener existente na porta selecionada antes de iniciar.
- `--verbose`: logs detalhados.
- `--cli-backend-logs`: mostra apenas logs do backend da CLI no console (e habilita stdout/stderr).
- `--claude-cli-logs`: alias obsoleto para `--cli-backend-logs`.
- `--ws-log <auto|full|compact>`: estilo de log do websocket (padrão `auto`).
- `--compact`: alias para `--ws-log compact`.
- `--raw-stream`: registra eventos brutos de stream do modelo em jsonl.
- `--raw-stream-path <path>`: caminho jsonl do stream bruto.

## Consultar um Gateway em execução

Todos os comandos de consulta usam WebSocket RPC.

Modos de saída:

- Padrão: legível para humanos (colorido em TTY).
- `--json`: JSON legível por máquina (sem estilo/spinner).
- `--no-color` (ou `NO_COLOR=1`): desabilita ANSI mantendo o layout humano.

Opções compartilhadas (quando compatíveis):

- `--url <url>`: URL WebSocket do Gateway.
- `--token <token>`: token do Gateway.
- `--password <password>`: senha do Gateway.
- `--timeout <ms>`: timeout/orçamento (varia por comando).
- `--expect-final`: aguarda uma resposta “final” (chamadas de agente).

Observação: ao definir `--url`, a CLI não usa fallback para credenciais de config ou ambiente.
Passe `--token` ou `--password` explicitamente. Ausência de credenciais explícitas é um erro.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Busca resumos de custo de uso nos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opções:

- `--days <days>`: número de dias a incluir (padrão `30`).

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sondagem RPC opcional.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opções:

- `--url <url>`: adiciona um alvo explícito de sondagem. O remoto configurado + localhost ainda são sondados.
- `--token <token>`: autenticação por token para a sondagem.
- `--password <password>`: autenticação por senha para a sondagem.
- `--timeout <ms>`: timeout da sondagem (padrão `10000`).
- `--no-probe`: ignora a sondagem RPC (visualização somente do serviço).
- `--deep`: também examina serviços em nível de sistema.
- `--require-rpc`: retorna código não zero quando a sondagem RPC falha. Não pode ser combinado com `--no-probe`.

Observações:

- `gateway status` continua disponível para diagnóstico mesmo quando a configuração local da CLI está ausente ou inválida.
- `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sondagem quando possível.
- Se um SecretRef de autenticação obrigatório não for resolvido neste caminho de comando, `gateway status --json` informa `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a sondagem for bem-sucedida, avisos de auth-ref não resolvido são suprimidos para evitar falsos positivos.
- Use `--require-rpc` em scripts e automações quando um serviço em escuta não for suficiente e você precisar que o próprio RPC do Gateway esteja íntegro.
- `--deep` adiciona uma varredura best-effort para instalações extras de launchd/systemd/schtasks. Quando vários serviços parecidos com gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das configurações deve executar um gateway por máquina.
- A saída humana inclui o caminho resolvido do arquivo de log mais o snapshot dos caminhos/validade de configuração da CLI versus serviço para ajudar a diagnosticar drift de perfil ou state-dir.
- Em instalações Linux com systemd, as verificações de drift de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unit (incluindo `%h`, caminhos entre aspas, múltiplos arquivos e arquivos opcionais com `-`).
- As verificações de drift resolvem SecretRefs de `gateway.auth.token` usando env de runtime mesclado (env do comando do serviço primeiro, depois fallback para env do processo).
- Se a autenticação por token não estiver efetivamente ativa (modo explícito `gateway.auth.mode` de `password`/`none`/`trusted-proxy`, ou modo ausente em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de drift de token ignoram a resolução do token de configuração.

### `gateway probe`

`gateway probe` é o comando de “depurar tudo”. Ele sempre sonda:

- o gateway remoto configurado por você (se definido), e
- localhost (loopback) **mesmo que um remoto esteja configurado**.

Se você passar `--url`, esse alvo explícito é adicionado antes de ambos. A saída humana rotula os
alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

Se vários gateways estiverem acessíveis, ele imprime todos eles. Vários gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretação:

- `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
- `RPC: ok` significa que chamadas RPC detalhadas (`health`/`status`/`system-presence`/`config.get`) também tiveram sucesso.
- `RPC: limited - missing scope: operator.read` significa que a conexão teve sucesso, mas o RPC detalhado é limitado por escopo. Isso é informado como alcance **degradado**, não falha total.
- O código de saída é não zero apenas quando nenhum alvo sondado está acessível.

Observações de JSON (`--json`):

- Nível superior:
  - `ok`: pelo menos um alvo está acessível.
  - `degraded`: pelo menos um alvo teve RPC detalhado limitado por escopo.
  - `primaryTargetId`: melhor alvo para tratar como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado, depois loopback local.
  - `warnings[]`: registros de aviso best-effort com `code`, `message` e `targetIds` opcionais.
  - `network`: dicas de URL de loopback local/tailnet derivadas da configuração atual e da rede do host.
  - `discovery.timeoutMs` e `discovery.count`: orçamento/contagem de descoberta real usado nesta execução de sondagem.
- Por alvo (`targets[].connect`):
  - `ok`: alcance após conexão + classificação degradada.
  - `rpcOk`: sucesso total do RPC detalhado.
  - `scopeLimited`: falha do RPC detalhado devido à ausência de escopo de operador.

Códigos de aviso comuns:

- `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando voltou para sondagens diretas.
- `multiple_gateways`: mais de um alvo estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
- `auth_secretref_unresolved`: um SecretRef de autenticação configurado não pôde ser resolvido para um alvo com falha.
- `probe_scope_limited`: a conexão WebSocket teve sucesso, mas o RPC detalhado foi limitado pela ausência do escopo `operator.read`.

#### Remoto via SSH (paridade com app Mac)

O modo “Remote over SSH” do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas a loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opções:

- `--ssh <target>`: `user@host` ou `user@host:port` (a porta é `22` por padrão).
- `--ssh-identity <path>`: arquivo de identidade.
- `--ssh-auto`: escolhe o primeiro host de gateway descoberto como alvo SSH a partir do
  endpoint de descoberta resolvido (`local.` mais o domínio de área ampla configurado, se houver). Dicas
  somente TXT são ignoradas.

Configuração (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC de baixo nível.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opções:

- `--params <json>`: string de objeto JSON para params (padrão `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Observações:

- `--params` precisa ser JSON válido.
- `--expect-final` é principalmente para RPCs no estilo de agente que fazem streaming de eventos intermediários antes de uma carga final.

## Gerenciar o serviço do Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opções dos comandos:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Observações:

- `gateway install` oferece suporte a `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados do ambiente do serviço.
- Se a autenticação por token exigir um token e o token SecretRef configurado não puder ser resolvido, a instalação falha de forma fechada em vez de persistir fallback em texto simples.
- Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` com SecretRef em vez de `--password` inline.
- No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` apenas do shell não relaxa os requisitos de token da instalação; use configuração persistente (`gateway.auth.password` ou `env` da configuração) ao instalar um serviço gerenciado.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.
- Os comandos de ciclo de vida aceitam `--json` para automação.

## Descobrir gateways (Bonjour)

`gateway discover` varre beacons do Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; consulte [/gateway/bonjour](/gateway/bonjour)

Somente gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta Wide-Area incluem (TXT):

- `role` (dica do papel do gateway)
- `transport` (dica do transporte, por exemplo `gateway`)
- `gatewayPort` (porta WebSocket, normalmente `18789`)
- `sshPort` (opcional; clientes usam `22` como padrão para alvos SSH quando ausente)
- `tailnetDns` (hostname do MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + fingerprint do certificado)
- `cliPath` (dica de instalação remota gravada na zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Opções:

- `--timeout <ms>`: timeout por comando (browse/resolve); padrão `2000`.
- `--json`: saída legível por máquina (também desabilita estilo/spinner).

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Observações:

- A CLI varre `local.` mais o domínio wide-area configurado quando houver um habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas
  somente TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são transmitidos quando
  `discovery.mdns.mode` é `full`. O DNS-SD wide-area ainda grava `cliPath`; `sshPort`
  continua opcional lá também.
