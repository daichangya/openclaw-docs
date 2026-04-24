---
read_when:
    - O OpenClaw não está funcionando e você precisa do caminho mais rápido para corrigir
    - Você quer um fluxo de triagem antes de entrar em runbooks detalhados
summary: Central de solução de problemas orientada por sintomas para o OpenClaw
title: Solução de problemas geral
x-i18n:
    generated_at: "2026-04-24T08:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c832c3f7609c56a5461515ed0f693d2255310bf2d3958f69f57c482bcbef97f0
    source_path: help/troubleshooting.md
    workflow: 15
---

Se você só tem 2 minutos, use esta página como porta de entrada para a triagem.

## Primeiros 60 segundos

Execute esta sequência exata nesta ordem:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Saída esperada em uma linha:

- `openclaw status` → mostra os canais configurados e nenhum erro óbvio de autenticação.
- `openclaw status --all` → o relatório completo está presente e pode ser compartilhado.
- `openclaw gateway probe` → o alvo esperado do gateway está acessível (`Reachable: yes`). `Capability: ...` informa qual nível de autenticação o probe conseguiu comprovar, e `Read probe: limited - missing scope: operator.read` indica diagnóstico degradado, não falha de conexão.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` e uma linha plausível de `Capability: ...`. Use `--require-rpc` se você também precisar de comprovação de RPC com escopo de leitura.
- `openclaw doctor` → sem erros bloqueantes de config/serviço.
- `openclaw channels status --probe` → um gateway acessível retorna o estado de transporte ao vivo por conta
  mais resultados de probe/auditoria como `works` ou `audit ok`; se o
  gateway estiver inacessível, o comando recua para resumos apenas da config.
- `openclaw logs --follow` → atividade estável, sem erros fatais repetidos.

## Anthropic long context 429

Se você vir:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vá para [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend local compatível com OpenAI funciona diretamente, mas falha no OpenClaw

Se o seu backend local ou auto-hospedado `/v1` responde a pequenos probes diretos de
`/v1/chat/completions`, mas falha em `openclaw infer model run` ou em turns normais
do agente:

1. Se o erro mencionar que `messages[].content` espera uma string, defina
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Se o backend ainda falhar apenas em turns de agente do OpenClaw, defina
   `models.providers.<provider>.models[].compat.supportsTools: false` e tente novamente.
3. Se chamadas diretas minúsculas ainda funcionarem, mas prompts maiores do OpenClaw fizerem o
   backend falhar, trate o problema restante como uma limitação upstream do modelo/servidor e
   continue no runbook detalhado:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## A instalação do Plugin falha com openclaw extensions ausentes

Se a instalação falhar com `package.json missing openclaw.extensions`, o pacote do Plugin
está usando um formato antigo que o OpenClaw não aceita mais.

Corrija no pacote do Plugin:

1. Adicione `openclaw.extensions` ao `package.json`.
2. Aponte as entradas para arquivos de runtime gerados (geralmente `./dist/index.js`).
3. Republique o Plugin e execute `openclaw plugins install <package>` novamente.

Exemplo:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referência: [Arquitetura de Plugin](/pt-BR/plugins/architecture)

## Árvore de decisão

```mermaid
flowchart TD
  A[OpenClaw não está funcionando] --> B{O que falha primeiro}
  B --> C[Sem respostas]
  B --> D[Dashboard ou Control UI não conectam]
  B --> E[Gateway não inicia ou serviço não está em execução]
  B --> F[Canal conecta, mas as mensagens não fluem]
  B --> G[Cron ou Heartbeat não disparou ou não entregou]
  B --> H[Node está pareado, mas a execução de câmera/canvas/tela falha]
  B --> I[Ferramenta de navegador falha]

  C --> C1[/Seção Sem respostas/]
  D --> D1[/Seção Control UI/]
  E --> E1[/Seção Gateway/]
  F --> F1[/Seção Fluxo do canal/]
  G --> G1[/Seção Automação/]
  H --> H1[/Seção Ferramentas do Node/]
  I --> I1[/Seção Navegador/]
```

<AccordionGroup>
  <Accordion title="Sem respostas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Seu canal mostra o transporte conectado e, quando houver suporte, `works` ou `audit ok` em `channels status --probe`
    - O remetente aparece como aprovado (ou a política de DM está aberta/lista de permissão)

    Assinaturas comuns nos logs:

    - `drop guild message (mention required` → o bloqueio por menção bloqueou a mensagem no Discord.
    - `pairing request` → o remetente não está aprovado e está aguardando aprovação de pareamento por DM.
    - `blocked` / `allowlist` nos logs do canal → remetente, sala ou grupo está filtrado.

    Páginas detalhadas:

    - [/gateway/troubleshooting#no-replies](/pt-BR/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
    - [/channels/pairing](/pt-BR/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard ou Control UI não conectam">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - `Dashboard: http://...` é mostrado em `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Sem loop de autenticação nos logs

    Assinaturas comuns nos logs:

    - `device identity required` → o contexto HTTP/não seguro não consegue concluir a autenticação do dispositivo.
    - `origin not allowed` → o `Origin` do navegador não é permitido para o alvo
      de gateway da Control UI.
    - `AUTH_TOKEN_MISMATCH` com dicas de retry (`canRetryWithDeviceToken=true`) → uma tentativa de repetição confiável com device-token pode ocorrer automaticamente.
    - Essa repetição com token em cache reutiliza o conjunto de escopos armazenado em cache com o
      token do dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm
      o conjunto de escopos solicitado por eles.
    - No caminho assíncrono da Control UI via Tailscale Serve, tentativas com falha para o mesmo
      `{scope, ip}` são serializadas antes de o limitador registrar a falha, então uma
      segunda repetição inválida concorrente já pode mostrar `retry later`.
    - `too many failed authentication attempts (retry later)` a partir de uma origem
      localhost do navegador → falhas repetidas desse mesmo `Origin` são temporariamente
      bloqueadas; outra origem localhost usa um bucket separado.
    - `repeated unauthorized` após essa repetição → token/senha incorretos, incompatibilidade de modo de autenticação ou token de dispositivo pareado desatualizado.
    - `gateway connect failed:` → a UI está apontando para a URL/porta errada ou para um gateway inacessível.

    Páginas detalhadas:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/pt-BR/web/control-ui)
    - [/gateway/authentication](/pt-BR/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway não inicia ou o serviço está instalado, mas não está em execução">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`

    Assinaturas comuns nos logs:

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo do gateway é remoto, ou o arquivo de config não tem a marca de modo local e deve ser reparado.
    - `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do gateway (token/senha, ou trusted-proxy quando configurado).
    - `another gateway instance is already listening` ou `EADDRINUSE` → a porta já está em uso.

    Páginas detalhadas:

    - [/gateway/troubleshooting#gateway-service-not-running](/pt-BR/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/pt-BR/gateway/background-process)
    - [/gateway/configuration](/pt-BR/gateway/configuration)

  </Accordion>

  <Accordion title="Canal conecta, mas as mensagens não fluem">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma boa saída se parece com:

    - O transporte do canal está conectado.
    - As verificações de pareamento/lista de permissão passam.
    - As menções são detectadas quando exigidas.

    Assinaturas comuns nos logs:

    - `mention required` → o bloqueio por menção em grupo bloqueou o processamento.
    - `pairing` / `pending` → o remetente da DM ainda não está aprovado.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema de token/permissão do canal.

    Páginas detalhadas:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/pt-BR/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/pt-BR/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron ou Heartbeat não disparou ou não entregou">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - `cron.status` mostra como habilitado com um próximo wake.
    - `cron runs` mostra entradas recentes `ok`.
    - O Heartbeat está habilitado e não está fora do horário ativo.

    Assinaturas comuns nos logs:

    - `cron: scheduler disabled; jobs will not run automatically` → o cron está desabilitado.
    - `heartbeat skipped` com `reason=quiet-hours` → fora do horário ativo configurado.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/só cabeçalhos.
    - `heartbeat skipped` com `reason=no-tasks-due` → o modo de tarefas de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos das tarefas venceu ainda.
    - `heartbeat skipped` com `reason=alerts-disabled` → toda a visibilidade do Heartbeat está desabilitada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados).
    - `requests-in-flight` → a lane principal está ocupada; o wake do Heartbeat foi adiado.
    - `unknown accountId` → a conta de destino da entrega do Heartbeat não existe.

    Páginas detalhadas:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/pt-BR/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node está pareado, mas a ferramenta falha em câmera/canvas/tela/exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Uma boa saída se parece com:

    - O Node aparece como conectado e pareado para a role `node`.
    - Existe capacidade para o comando que você está invocando.
    - O estado de permissão está concedido para a ferramenta.

    Assinaturas comuns nos logs:

    - `NODE_BACKGROUND_UNAVAILABLE` → traga o app do node para o primeiro plano.
    - `*_PERMISSION_REQUIRED` → a permissão do SO foi negada/está ausente.
    - `SYSTEM_RUN_DENIED: approval required` → a aprovação de exec está pendente.
    - `SYSTEM_RUN_DENIED: allowlist miss` → o comando não está na allowlist de exec.

    Páginas detalhadas:

    - [/gateway/troubleshooting#node-paired-tool-fails](/pt-BR/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)
    - [/tools/exec-approvals](/pt-BR/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec de repente pede aprovação">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    O que mudou:

    - Se `tools.exec.host` não estiver definido, o padrão é `auto`.
    - `host=auto` resolve para `sandbox` quando um runtime sandbox está ativo, caso contrário para `gateway`.
    - `host=auto` é apenas roteamento; o comportamento sem prompt “YOLO” vem de `security=full` mais `ask=off` em gateway/node.
    - Em `gateway` e `node`, `tools.exec.security` não definido usa `full` por padrão.
    - `tools.exec.ask` não definido usa `off` por padrão.
    - Resultado: se você está vendo aprovações, alguma política local do host ou por sessão tornou o exec mais restritivo em relação aos padrões atuais.

    Restaure o comportamento atual padrão sem aprovação:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Alternativas mais seguras:

    - Defina apenas `tools.exec.host=gateway` se você só quiser roteamento estável no host.
    - Use `security=allowlist` com `ask=on-miss` se quiser exec no host, mas ainda quiser revisão em casos fora da allowlist.
    - Ative o modo sandbox se quiser que `host=auto` volte a resolver para `sandbox`.

    Assinaturas comuns nos logs:

    - `Approval required.` → o comando está aguardando `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → a aprovação de exec no host do node está pendente.
    - `exec host=sandbox requires a sandbox runtime for this session` → seleção implícita/explícita de sandbox, mas o modo sandbox está desativado.

    Páginas detalhadas:

    - [/tools/exec](/pt-BR/tools/exec)
    - [/tools/exec-approvals](/pt-BR/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/pt-BR/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="A ferramenta de navegador falha">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Uma boa saída se parece com:

    - O status do navegador mostra `running: true` e um navegador/perfil escolhido.
    - `openclaw` inicia, ou `user` consegue ver abas locais do Chrome.

    Assinaturas comuns nos logs:

    - `unknown command "browser"` ou `unknown command 'browser'` → `plugins.allow` está definido e não inclui `browser`.
    - `Failed to start Chrome CDP on port` → a inicialização do navegador local falhou.
    - `browser.executablePath not found` → o caminho binário configurado está errado.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não suportado.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir deste host.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil attach-only não tem um alvo CDP ativo.
    - substituições antigas de viewport / modo escuro / localidade / offline em perfis attach-only ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação sem reiniciar o gateway.

    Páginas detalhadas:

    - [/gateway/troubleshooting#browser-tool-fails](/pt-BR/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/pt-BR/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Relacionado

- [FAQ](/pt-BR/help/faq) — perguntas frequentes
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting) — problemas específicos do gateway
- [Doctor](/pt-BR/gateway/doctor) — verificações automatizadas de integridade e reparos
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting) — problemas de conectividade de canais
- [Solução de problemas de automação](/pt-BR/automation/cron-jobs#troubleshooting) — problemas de Cron e Heartbeat
