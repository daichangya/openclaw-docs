---
read_when:
    - O OpenClaw não está funcionando e você precisa do caminho mais rápido para uma correção
    - Você quer um fluxo de triagem antes de mergulhar em runbooks detalhados
summary: Hub de solução de problemas do OpenClaw orientado por sintomas
title: Solução geral de problemas
x-i18n:
    generated_at: "2026-04-21T05:38:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5d8c9f804084985c672c5a003ce866e8142ab99fe81abb7a0d38e22aea4b88
    source_path: help/troubleshooting.md
    workflow: 15
---

# Solução de problemas

Se você só tem 2 minutos, use esta página como porta de entrada para triagem.

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

Saída boa em uma linha:

- `openclaw status` → mostra os canais configurados e nenhum erro de autenticação óbvio.
- `openclaw status --all` → relatório completo presente e compartilhável.
- `openclaw gateway probe` → o destino esperado do gateway está acessível (`Reachable: yes`). `Capability: ...` informa qual nível de autenticação a sonda conseguiu provar, e `Read probe: limited - missing scope: operator.read` significa diagnóstico degradado, não falha de conexão.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` e uma linha plausível de `Capability: ...`. Use `--require-rpc` se também precisar de prova de RPC com escopo de leitura.
- `openclaw doctor` → nenhum erro bloqueante de config/serviço.
- `openclaw channels status --probe` → com gateway acessível retorna
  estado de transporte em tempo real por conta, além de resultados de probe/audit como `works` ou `audit ok`; se o
  gateway estiver inacessível, o comando recorre a resumos baseados apenas na config.
- `openclaw logs --follow` → atividade estável, sem erros fatais repetidos.

## Anthropic long context 429

Se você vir:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vá para [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend local compatível com OpenAI funciona diretamente, mas falha no OpenClaw

Se o seu backend local ou hospedado por você em `/v1` responde a pequenas
sondas diretas de `/v1/chat/completions`, mas falha em `openclaw infer model run` ou em turnos
normais do agente:

1. Se o erro mencionar `messages[].content` esperando uma string, defina
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Se o backend ainda falhar apenas em turnos de agente do OpenClaw, defina
   `models.providers.<provider>.models[].compat.supportsTools: false` e tente novamente.
3. Se chamadas diretas minúsculas ainda funcionarem, mas prompts maiores do OpenClaw derrubarem o
   backend, trate o problema restante como uma limitação do modelo/servidor upstream e
   continue no runbook detalhado:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Instalação de Plugin falha com extensões openclaw ausentes

Se a instalação falhar com `package.json missing openclaw.extensions`, o pacote do Plugin
está usando um formato antigo que o OpenClaw não aceita mais.

Corrija no pacote do Plugin:

1. Adicione `openclaw.extensions` ao `package.json`.
2. Aponte as entradas para arquivos runtime compilados (geralmente `./dist/index.js`).
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

Referência: [Plugin architecture](/pt-BR/plugins/architecture)

## Árvore de decisão

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
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

    Uma saída boa se parece com:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Seu canal mostra transporte conectado e, quando compatível, `works` ou `audit ok` em `channels status --probe`
    - O remetente aparece como aprovado (ou a política de DM é open/allowlist)

    Assinaturas comuns em logs:

    - `drop guild message (mention required` → o bloqueio por menção impediu a mensagem no Discord.
    - `pairing request` → o remetente não está aprovado e está aguardando aprovação de pareamento de DM.
    - `blocked` / `allowlist` nos logs do canal → o remetente, a sala ou o grupo está filtrado.

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

    Uma saída boa se parece com:

    - `Dashboard: http://...` aparece em `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Nenhum loop de autenticação nos logs

    Assinaturas comuns em logs:

    - `device identity required` → o contexto HTTP/não seguro não consegue concluir a autenticação do device.
    - `origin not allowed` → o `Origin` do navegador não é permitido para o destino do gateway da Control UI.
    - `AUTH_TOKEN_MISMATCH` com dicas de retry (`canRetryWithDeviceToken=true`) → uma tentativa automática com token de device confiável pode ocorrer.
    - Essa tentativa com token em cache reutiliza o conjunto de scopes em cache armazenado com o token do
      device pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm, em vez disso,
      o conjunto de scopes solicitado.
    - No caminho assíncrono da Control UI com Tailscale Serve, tentativas com falha para o mesmo
      `{scope, ip}` são serializadas antes de o limitador registrar a falha, então uma segunda tentativa ruim simultânea já pode mostrar `retry later`.
    - `too many failed authentication attempts (retry later)` a partir de uma
      origem de navegador localhost → falhas repetidas vindas do mesmo `Origin` ficam temporariamente
      bloqueadas; outra origem localhost usa um bucket separado.
    - `repeated unauthorized` depois dessa tentativa → token/senha incorretos, incompatibilidade de modo de autenticação ou token de device pareado obsoleto.
    - `gateway connect failed:` → a UI está apontando para a URL/porta errada ou para um gateway inacessível.

    Páginas detalhadas:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/pt-BR/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/pt-BR/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway não inicia ou o serviço está instalado mas não está em execução">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Uma saída boa se parece com:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`

    Assinaturas comuns em logs:

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo do gateway é remote, ou o arquivo de config está sem a marca de modo local e deve ser reparado.
    - `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do gateway (token/senha ou trusted-proxy, quando configurado).
    - `another gateway instance is already listening` ou `EADDRINUSE` → porta já está em uso.

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

    Uma saída boa se parece com:

    - O transporte do canal está conectado.
    - As verificações de pareamento/allowlist passam.
    - As menções são detectadas quando exigidas.

    Assinaturas comuns em logs:

    - `mention required` → o bloqueio por menção impediu o processamento.
    - `pairing` / `pending` → o remetente de DM ainda não foi aprovado.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema de permissão/token do canal.

    Páginas detalhadas:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/pt-BR/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/pt-BR/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron ou Heartbeat não disparou ou não foi entregue">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Uma saída boa se parece com:

    - `cron.status` mostra ativado com um próximo wake.
    - `cron runs` mostra entradas `ok` recentes.
    - O Heartbeat está ativado e não está fora do horário ativo.

    Assinaturas comuns em logs:

    - `cron: scheduler disabled; jobs will not run automatically` → o Cron está desativado.
    - `heartbeat skipped` com `reason=quiet-hours` → fora do horário ativo configurado.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/com apenas cabeçalho.
    - `heartbeat skipped` com `reason=no-tasks-due` → o modo de tarefa de `HEARTBEAT.md` está ativo, mas nenhum intervalo de tarefa venceu ainda.
    - `heartbeat skipped` com `reason=alerts-disabled` → toda a visibilidade de Heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados).
    - `requests-in-flight` → a lane principal está ocupada; o wake do Heartbeat foi adiado.
    - `unknown accountId` → a conta de destino de entrega do Heartbeat não existe.

    Páginas detalhadas:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/pt-BR/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node está pareado, mas a ferramenta falha em camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Uma saída boa se parece com:

      - O node aparece como conectado e pareado para a role `node`.
      - Existe Capability para o comando que você está invocando.
      - O estado de permissão está concedido para a ferramenta.

      Assinaturas comuns em logs:

      - `NODE_BACKGROUND_UNAVAILABLE` → traga o app do node para o primeiro plano.
      - `*_PERMISSION_REQUIRED` → a permissão do sistema operacional foi negada/está ausente.
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

      - Se `tools.exec.host` não estiver definido, o padrão será `auto`.
      - `host=auto` é resolvido como `sandbox` quando um runtime de sandbox está ativo; caso contrário, como `gateway`.
      - `host=auto` é apenas roteamento; o comportamento sem prompt "YOLO" vem de `security=full` mais `ask=off` em gateway/node.
      - Em `gateway` e `node`, `tools.exec.security` não definido assume `full` por padrão.
      - `tools.exec.ask` não definido assume `off` por padrão.
      - Resultado: se você está vendo aprovações, alguma política local do host ou por sessão tornou o exec mais restrito do que os padrões atuais.

      Restaurar o comportamento atual padrão sem aprovação:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternativas mais seguras:

      - Defina apenas `tools.exec.host=gateway` se você só quiser roteamento estável do host.
      - Use `security=allowlist` com `ask=on-miss` se quiser exec no host, mas ainda quiser revisão quando houver falhas na allowlist.
      - Ative o modo sandbox se quiser que `host=auto` volte a ser resolvido para `sandbox`.

      Assinaturas comuns em logs:

      - `Approval required.` → o comando está aguardando `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → a aprovação de exec no host do node está pendente.
      - `exec host=sandbox requires a sandbox runtime for this session` → seleção implícita/explícita de sandbox, mas o modo sandbox está desativado.

      Páginas detalhadas:

      - [/tools/exec](/pt-BR/tools/exec)
      - [/tools/exec-approvals](/pt-BR/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/pt-BR/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Falha na ferramenta Browser">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Uma saída boa se parece com:

      - O status do Browser mostra `running: true` e um browser/profile escolhido.
      - `openclaw` inicia, ou `user` consegue ver abas locais do Chrome.

      Assinaturas comuns em logs:

      - `unknown command "browser"` ou `unknown command 'browser'` → `plugins.allow` está definido e não inclui `browser`.
      - `Failed to start Chrome CDP on port` → a inicialização local do browser falhou.
      - `browser.executablePath not found` → o caminho configurado do binário está incorreto.
      - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não compatível.
      - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
      - `No Chrome tabs found for profile="user"` → o profile de anexação do Chrome MCP não tem abas locais do Chrome abertas.
      - `Remote CDP for profile "<name>" is not reachable` → o endpoint remoto de CDP configurado não está acessível a partir deste host.
      - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o profile somente de anexação não tem um destino CDP ativo.
      - substituições antigas de viewport / dark mode / locale / offline em profiles attach-only ou de CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação sem reiniciar o gateway.

      Páginas detalhadas:

      - [/gateway/troubleshooting#browser-tool-fails](/pt-BR/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/pt-BR/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — perguntas frequentes
- [Gateway Troubleshooting](/pt-BR/gateway/troubleshooting) — problemas específicos do gateway
- [Doctor](/pt-BR/gateway/doctor) — verificações automáticas de integridade e reparos
- [Channel Troubleshooting](/pt-BR/channels/troubleshooting) — problemas de conectividade de canal
- [Automation Troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting) — problemas de Cron e Heartbeat
