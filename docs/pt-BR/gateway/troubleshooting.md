---
read_when:
    - O hub de solução de problemas apontou você para cá para um diagnóstico mais profundo
    - Você precisa de seções estáveis de runbook baseadas em sintomas com comandos exatos
summary: Runbook aprofundado de solução de problemas para gateway, canais, automação, nós e browser
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-05T12:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solução de problemas do Gateway

Esta página é o runbook aprofundado.
Comece em [/help/troubleshooting](/help/troubleshooting) se quiser primeiro o fluxo rápido de triagem.

## Escada de comandos

Execute estes primeiro, nesta ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinais esperados de funcionamento saudável:

- `openclaw gateway status` mostra `Runtime: running` e `RPC probe: ok`.
- `openclaw doctor` não relata problemas bloqueadores de configuração/serviço.
- `openclaw channels status --probe` mostra status de transporte ativo por conta e,
  quando compatível, resultados de probe/auditoria como `works` ou `audit ok`.

## Anthropic 429 uso extra necessário para contexto longo

Use isto quando logs/erros incluírem:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não é elegível para uso de contexto longo.
- As solicitações falham apenas em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

1. Desative `context1m` para esse modelo para voltar à janela de contexto normal.
2. Use uma chave de API da Anthropic com faturamento, ou ative Anthropic Extra Usage na conta Anthropic OAuth/assinatura.
3. Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.

Relacionado:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Sem respostas

Se os canais estiverem ativos, mas nada responder, verifique roteamento e política antes de reconectar qualquer coisa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Procure por:

- Pairing pendente para remetentes de DM.
- Bloqueio por menção em grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades de lista de permissões de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado pela política.

Relacionado:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Conectividade da Dashboard control ui

Quando a dashboard/control UI não conecta, valide URL, modo de autenticação e pressupostos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL da dashboard corretas.
- Incompatibilidade de modo de autenticação/token entre cliente e gateway.
- Uso de HTTP onde a identidade do dispositivo é necessária.

Assinaturas comuns:

- `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
- `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins`
  (ou você está conectando a partir de uma origem de navegador não loopback sem uma
  lista de permissões explícita).
- `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o
  fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → o cliente assinou a carga errada
  (ou um timestamp obsoleto) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com token de dispositivo em cache.
- Essa nova tentativa com token em cache reutiliza o conjunto de escopos armazenado com o token do
  dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm
  o conjunto de escopos solicitado.
- Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é
  token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado,
  depois token de bootstrap.
- No caminho assíncrono da Control UI por Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes de o limitador registrar a falha. Duas novas tentativas
  ruins simultâneas do mesmo cliente podem, portanto, mostrar `retry later`
  na segunda tentativa em vez de duas incompatibilidades simples.
- `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador
  → falhas repetidas da mesma `Origin` normalizada são temporariamente bloqueadas;
  outra origem localhost usa um bucket separado.
- `unauthorized` repetido após essa nova tentativa → divergência entre token compartilhado e token de dispositivo; atualize a configuração do token e reaprove/rotacione o token do dispositivo se necessário.
- `gateway connect failed:` → host/porta/url de destino errados.

### Mapa rápido de códigos detalhados de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código detalhado             | Significado                                             | Ação recomendada                                                                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório. | Cole/defina o token no cliente e tente novamente. Para caminhos da dashboard: `openclaw config get gateway.auth.token` e então cole nas configurações da Control UI.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não corresponde ao token de autenticação do gateway. | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam os escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute o [checklist de recuperação de divergência de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está obsoleto ou revogado. | Rotacione/reaprove o token do dispositivo usando a [CLI devices](/cli/devices) e então reconecte.                                                                                                                                                                                            |
| `PAIRING_REQUIRED`           | A identidade do dispositivo é conhecida, mas não está aprovada para esta função. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`.                                                                                                                                                                                      |

Verificação de migração do device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está conectando e verifique se ele:

1. espera por `connect.challenge`
2. assina a carga vinculada ao desafio
3. envia `connect.params.device.nonce` com o mesmo nonce do desafio

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado só podem gerenciar **o próprio** dispositivo, a menos que o
  chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que
  a sessão do chamador já possui

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (modos de autenticação do gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Serviço do Gateway não está em execução

Use isto quando o serviço estiver instalado, mas o processo não permanecer ativo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Procure por:

- `Runtime: stopped` com dicas de saída.
- Incompatibilidade de configuração de serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo local do gateway não está ativado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para reaplicar a configuração esperada do modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão de configuração é `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do gateway (token/senha, ou trusted-proxy onde configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
- `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você realmente precisar de mais de um, isole portas + config/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Avisos de probe do Gateway

Use isto quando `openclaw gateway probe` alcança algo, mas ainda imprime um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback de SSH, vários gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou destinos diretos configurados/loopback.
- `multiple reachable gateways detected` → mais de um destino respondeu. Normalmente isso significa uma configuração intencional de múltiplos gateways ou listeners obsoletos/duplicados.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes está limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- texto de aviso de SecretRef não resolvido em `gateway.auth.*` / `gateway.remote.*` → o material de autenticação não estava disponível neste caminho do comando para o destino com falha.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Canal conectado, mas mensagens não fluem

Se o estado do canal estiver conectado, mas o fluxo de mensagens estiver morto, foque em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permissões de grupo e requisitos de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção em grupo.
- `pairing` / rastros de aprovação pendente → o remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Entrega de cron e heartbeat

Se cron ou heartbeat não executou ou não entregou, verifique primeiro o estado do agendador, depois o destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron ativado e próximo despertar presente.
- Status do histórico de execuções do trabalho (`ok`, `skipped`, `error`).
- Motivos de heartbeat ignorado (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desativado.
- `cron: timer tick failed` → falha no tick do agendador; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horários ativos.
- `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos markdown, então o OpenClaw ignora a chamada ao modelo.
- `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas vence neste tick.
- `heartbeat: unknown accountId` → id de conta inválido para o destino de entrega do heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → o destino do heartbeat foi resolvido para um destino do tipo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou substituição por agente) está definido como `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Ferramenta de nó pareado falha

Se um nó estiver pareado, mas as ferramentas falharem, isole estado em primeiro plano, permissão e aprovação.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Nó online com as capacidades esperadas.
- Concessões de permissão do SO para câmera/microfone/localização/tela.
- Aprovações de exec e estado de lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do nó precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do SO ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Ferramenta browser falha

Use isto quando ações da ferramenta browser falham mesmo que o gateway em si esteja saudável.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Procure por:

- Se `plugins.allow` está definido e inclui `browser`.
- Caminho válido do executável do browser.
- Acessibilidade do perfil CDP.
- Disponibilidade do Chrome local para perfis `existing-session` / `user`.

Assinaturas comuns:

- `unknown command "browser"` ou `unknown command 'browser'` → o plugin browser integrado foi excluído por `plugins.allow`.
- ferramenta browser ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
- `Failed to start Chrome CDP on port` → o processo do browser falhou ao iniciar.
- `browser.executablePath not found` → o caminho configurado é inválido.
- `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não compatível, como `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
- `No Chrome tabs found for profile="user"` → o perfil de anexação Chrome MCP não tem abas locais abertas no Chrome.
- `Remote CDP for profile "<name>" is not reachable` → o endpoint remoto de CDP configurado não é alcançável a partir do host do gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil attach-only não tem um destino alcançável, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não tem o pacote completo do Playwright; snapshots ARIA e capturas básicas de página ainda podem funcionar, mas navegação, snapshots de IA, capturas de elemento por seletor CSS e exportação para PDF continuam indisponíveis.
- `fullPage is not supported for element screenshots` → a solicitação de captura misturou `--full-page` com `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de screenshot em Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload no Chrome MCP precisam de refs de snapshot, não seletores CSS.
- `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não oferecem suporte a substituições de timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um browser gerenciado ou perfil CDP bruto.
- substituições obsoletas de viewport / dark-mode / locale / offline em perfis attach-only ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação Playwright/CDP sem reiniciar todo o gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Se você atualizou e algo de repente quebrou

A maioria das falhas após atualização é causada por divergência de configuração ou aplicação de padrões mais rígidos.

### 1) O comportamento de autenticação e substituição de URL mudou

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, chamadas da CLI podem estar apontando para o remoto enquanto seu serviço local está funcionando bem.
- Chamadas com `--url` explícito não usam fallback para credenciais armazenadas.

Assinaturas comuns:

- `gateway connect failed:` → destino de URL incorreto.
- `unauthorized` → endpoint alcançável, mas autenticação errada.

### 2) As proteções de bind e autenticação estão mais rígidas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

O que verificar:

- Binds fora de loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação por token/senha compartilhada ou uma implantação `trusted-proxy` fora de loopback configurada corretamente.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do gateway.
- `RPC probe: failed` enquanto o runtime está em execução → gateway vivo, mas inacessível com a autenticação/url atuais.

### 3) O estado de pairing e identidade do dispositivo mudou

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

O que verificar:

- Aprovações de dispositivo pendentes para dashboard/nós.
- Aprovações de pairing de DM pendentes após mudanças de política ou identidade.

Assinaturas comuns:

- `device identity required` → autenticação do dispositivo não satisfeita.
- `pairing required` → remetente/dispositivo precisa ser aprovado.

Se a configuração do serviço e o runtime ainda discordarem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
