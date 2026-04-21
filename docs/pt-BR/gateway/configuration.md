---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando para seções específicas da config
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-21T05:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuração

O OpenClaw lê uma config opcional em <Tooltip tip="JSON5 suporta comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma config:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (Cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Veja a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para uma configuração interativa ou consulte o guia [Configuration Examples](/pt-BR/gateway/configuration-examples) para ver configs completas para copiar e colar.
</Tip>

## Config mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando a config

<Tabs>
  <Tab title="Assistente interativo">
    ```bash
    openclaw onboard       # fluxo completo de onboarding
    openclaw configure     # assistente de config
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Control UI renderiza um formulário a partir do schema de config em tempo real, incluindo metadados de documentação dos campos
    `title` / `description`, além dos schemas de Plugin e canal quando
    disponíveis, com um editor **Raw JSON** como rota de escape. Para UIs com detalhamento
    e outras ferramentas, o gateway também expõe `config.schema.lookup` para
    buscar um node do schema restrito a um caminho junto com resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as mudanças automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw só aceita configurações que correspondam completamente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

Observações sobre ferramentas de schema:

- `openclaw config schema` imprime a mesma família de JSON Schema usada pela Control UI
  e pela validação da config.
- Trate essa saída de schema como o contrato canônico legível por máquina para
  `openclaw.json`; esta visão geral e a referência de configuração o resumem.
- Os valores de `title` e `description` dos campos são carregados para a saída do schema para
  ferramentas de editor e formulário.
- Entradas de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos
  metadados de documentação quando existe documentação de campo correspondente.
- Ramos de composição `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados
  de documentação, para que variantes de união/interseção mantenham a mesma ajuda de campo.
- `config.schema.lookup` retorna um caminho de config normalizado com um node raso do
  schema (`title`, `description`, `type`, `enum`, `const`, limites comuns
  e campos de validação semelhantes), metadados de dica de UI correspondentes e resumos
  imediatos dos filhos para ferramentas com detalhamento.
- Schemas dinâmicos de Plugin/canal são mesclados quando o gateway consegue carregar o
  registro de manifest atual.
- `pnpm config:docs:check` detecta divergência entre os artefatos de baseline de config
  voltados para a documentação e a superfície atual do schema.

Quando a validação falha:

- O Gateway não inicia
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway também mantém uma cópia confiável do último estado válido após uma inicialização bem-sucedida. Se
`openclaw.json` for alterado depois fora do OpenClaw e deixar de validar, a inicialização
e o hot reload preservam o arquivo quebrado como um snapshot `.clobbered.*` com timestamp,
restauram a última cópia válida conhecida e registram um aviso bem visível com o motivo da recuperação.
O próximo turno do agente principal também recebe um aviso de evento do sistema informando que a
config foi restaurada e não deve ser reescrita cegamente. A promoção do último estado válido conhecido
é atualizada após uma inicialização validada e após hot reloads aceitos, incluindo
gravações de config feitas pelo OpenClaw cujo hash do arquivo persistido ainda corresponde à
gravação aceita. A promoção é ignorada quando o candidato contém placeholders de segredo
redigidos como `***` ou valores de token encurtados.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de config em `channels.<provider>`. Veja a página dedicada do canal para as etapas de configuração:

    - [WhatsApp](/pt-BR/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/pt-BR/channels/telegram) — `channels.telegram`
    - [Discord](/pt-BR/channels/discord) — `channels.discord`
    - [Feishu](/pt-BR/channels/feishu) — `channels.feishu`
    - [Google Chat](/pt-BR/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/pt-BR/channels/msteams) — `channels.msteams`
    - [Slack](/pt-BR/channels/slack) — `channels.slack`
    - [Signal](/pt-BR/channels/signal) — `channels.signal`
    - [iMessage](/pt-BR/channels/imessage) — `channels.imessage`
    - [Mattermost](/pt-BR/channels/mattermost) — `channels.mattermost`

    Todos os canais compartilham o mesmo padrão de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Escolher e configurar modelos">
    Defina o modelo principal e fallbacks opcionais:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define o catálogo de modelos e atua como allowlist para `/model`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagens de transcrição/ferramenta (padrão `1200`); valores menores geralmente reduzem o uso de vision tokens em execuções com muitas capturas de tela.
    - Veja [Models CLI](/pt-BR/concepts/models) para trocar de modelo no chat e [Model Failover](/pt-BR/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para provedores personalizados/hospedados por você, veja [Custom providers](/pt-BR/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de allowlist pareada)
    - `"open"`: permite todas as DMs de entrada (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar bloqueio por menção em chat de grupo">
    Mensagens de grupo, por padrão, **exigem menção**. Configure padrões por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menções por metadados**: menções nativas com @ (WhatsApp tocar para mencionar, Telegram @bot etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#group-chat-mention-gating) para substituições por canal e modo de conversa consigo mesmo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` para uma base compartilhada e depois substitua agentes específicos com `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para não ter Skills.
    - Veja [Skills](/pt-BR/tools/skills), [Skills config](/pt-BR/tools/skills-config) e
      a [Configuration Reference](/pt-BR/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de integridade de canais do gateway">
    Controle com que agressividade o gateway reinicia canais que parecem obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Defina `gateway.channelHealthCheckMinutes: 0` para desativar globalmente reinicializações do monitor de integridade.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desativar reinicializações automáticas de um canal ou conta sem desativar o monitor global.
    - Veja [Health Checks](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e resets">
    Sessões controlam a continuidade e o isolamento da conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartilhado) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para roteamento de sessão vinculado a thread (o Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Veja [Session Management](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Ativar sandboxing">
    Execute sessões de agente em runtimes de sandbox isolados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Primeiro construa a imagem: `scripts/sandbox-setup.sh`

    Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Ativar push com relay para builds oficiais do iOS">
    O push com relay é configurado em `openclaw.json`.

    Defina isto na config do gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Padrão: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente em CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isso faz:

    - Permite que o gateway envie `push.test`, sinais de wake e wakes de reconexão por meio do relay externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay válido para toda a implantação.
    - Vincula cada registro com relay ao identity do gateway com o qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds iOS locais/manuais em APNs direto. Envios com relay se aplicam apenas a builds oficiais distribuídos que se registraram por meio do relay.
    - Deve corresponder à URL base do relay embutida no build iOS oficial/TestFlight, para que o tráfego de registro e envio chegue à mesma implantação de relay.

    Fluxo ponta a ponta:

    1. Instale um build iOS oficial/TestFlight compilado com a mesma URL base de relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Faça o pareamento do app iOS com o gateway e permita que as sessões de node e operator se conectem.
    4. O app iOS busca o identity do gateway, registra-se no relay usando App Attest mais o recibo do app e então publica a carga `push.apns.register` com relay no gateway pareado.
    5. O gateway armazena o handle do relay e a concessão de envio, e depois os usa para `push.test`, sinais de wake e wakes de reconexão.

    Observações operacionais:

    - Se você trocar o app iOS para um gateway diferente, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse gateway.
    - Se você distribuir um novo build iOS apontando para uma implantação de relay diferente, o app atualiza seu registro de relay em cache em vez de reutilizar a origem de relay antiga.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma rota de escape de desenvolvimento apenas para loopback; não persista URLs HTTP de relay na config.

    Veja [iOS App](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo ponta a ponta e [Authentication and trust flow](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (check-ins periódicos)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desativar.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Veja [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar jobs de Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: remove sessões isoladas concluídas de `sessions.json` (padrão `24h`; defina `false` para desativar).
    - `runLog`: faz prune de `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Cron jobs](/pt-BR/automation/cron-jobs) para a visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Ative endpoints HTTP de Webhook no Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Observação de segurança:
    - Trate todo o conteúdo de carga de hook/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook é apenas por cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens na query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desativadas as flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração estritamente delimitada.
    - Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para limitar as session keys selecionadas pelo chamador.
    - Para agentes acionados por hook, prefira níveis fortes e modernos de modelo e política estrita de ferramentas (por exemplo, apenas mensagens mais sandboxing, quando possível).

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multiagente">
    Execute vários agentes isolados com workspaces e sessões separadas:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Veja [Multi-Agent](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/configuration-reference#multi-agent-routing) para regras de binding e perfis de acesso por agente.

  </Accordion>

  <Accordion title="Dividir a config em vários arquivos ($include)">
    Use `$include` para organizar configs grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Arquivo único**: substitui o objeto que o contém
    - **Array de arquivos**: faz deep merge em ordem (o último vence)
    - **Chaves irmãs**: mescladas após os includes (substituem valores incluídos)
    - **Includes aninhados**: suportados até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parse e includes circulares

  </Accordion>
</AccordionGroup>

## Hot reload da config

O Gateway observa `~/.openclaw/openclaw.json` e aplica as alterações automaticamente — não é necessário reiniciar manualmente para a maioria das configurações.

Edições diretas no arquivo são tratadas como não confiáveis até serem validadas. O watcher espera
a atividade temporária de escrita/renomeação do editor se estabilizar, lê o arquivo final e rejeita
edições externas inválidas restaurando a última config válida conhecida. Gravações de config feitas
pelo OpenClaw usam o mesmo bloqueio de schema antes de gravar; substituições destrutivas como
remover `gateway.mode` ou reduzir o arquivo em mais da metade são rejeitadas
e salvas como `.rejected.*` para inspeção.

Se você vir `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` nos logs, inspecione o arquivo
`.clobbered.*` correspondente ao lado de `openclaw.json`, corrija a carga rejeitada e então execute
`openclaw config validate`. Veja [Gateway troubleshooting](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config)
para a checklist de recuperação.

### Modos de reload

| Modo                    | Comportamento                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão)   | Aplica alterações seguras em hot imediatamente. Reinicia automaticamente para as críticas. |
| **`hot`**               | Aplica em hot apenas alterações seguras. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**           | Reinicia o Gateway em qualquer alteração de config, segura ou não.                      |
| **`off`**               | Desativa a observação de arquivo. As alterações entram em vigor na próxima reinicialização manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado em hot vs o que precisa de reinicialização

A maioria dos campos é aplicada em hot sem indisponibilidade. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria             | Campos                                                               | Precisa reiniciar? |
| --------------------- | -------------------------------------------------------------------- | ------------------ |
| Canais                | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de extensão | Não                |
| Agente e modelos      | `agent`, `agents`, `models`, `routing`                               | Não                |
| Automação             | `hooks`, `cron`, `agent.heartbeat`                                   | Não                |
| Sessões e mensagens   | `session`, `messages`                                                | Não                |
| Ferramentas e mídia   | `tools`, `browser`, `skills`, `audio`, `talk`                        | Não                |
| UI e diversos         | `ui`, `logging`, `identity`, `bindings`                              | Não                |
| Servidor Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Sim**            |
| Infraestrutura        | `discovery`, `canvasHost`, `plugins`                                 | **Sim**            |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** dispara reinicialização.
</Note>

## RPC de config (atualizações programáticas)

<Note>
RPCs de escrita do plano de controle (`config.apply`, `config.patch`, `update.run`) têm limite de taxa de **3 solicitações por 60 segundos** por `deviceId+clientIp`. Quando limitado, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

Fluxo seguro/padrão:

- `config.schema.lookup`: inspeciona uma subárvore de config com escopo de caminho com um node raso
  do schema, metadados de dica correspondentes e resumos imediatos dos filhos
- `config.get`: busca o snapshot atual + hash
- `config.patch`: caminho preferido para atualizações parciais
- `config.apply`: substituição de config completa apenas
- `update.run`: self-update + reinicialização explícitas

Quando você não estiver substituindo a config inteira, prefira `config.schema.lookup`
e depois `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (substituição completa)">
    Valida + grava a config completa e reinicia o Gateway em uma única etapa.

    <Warning>
    `config.apply` substitui a **config inteira**. Use `config.patch` para atualizações parciais ou `openclaw config set` para chaves únicas.
    </Warning>

    Parâmetros:

    - `raw` (string) — carga JSON5 para a config inteira
    - `baseHash` (opcional) — hash da config de `config.get` (obrigatório quando a config existe)
    - `sessionKey` (opcional) — session key para o ping de wake-up após a reinicialização
    - `note` (opcional) — observação para o sentinel de reinicialização
    - `restartDelayMs` (opcional) — atraso antes da reinicialização (padrão 2000)

    Solicitações de reinicialização são consolidadas enquanto uma já está pendente/em andamento, e um cooldown de 30 segundos é aplicado entre ciclos de reinicialização.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (atualização parcial)">
    Mescla uma atualização parcial à config existente (semântica de JSON merge patch):

    - Objetos são mesclados recursivamente
    - `null` exclui uma chave
    - Arrays substituem

    Parâmetros:

    - `raw` (string) — JSON5 apenas com as chaves a serem alteradas
    - `baseHash` (obrigatório) — hash da config de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — iguais a `config.apply`

    O comportamento de reinicialização corresponde ao de `config.apply`: consolidação de reinicializações pendentes mais um cooldown de 30 segundos entre ciclos de reinicialização.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai e também de:

- `.env` do diretório de trabalho atual (se presente)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos substitui variáveis de ambiente já existentes. Você também pode definir variáveis de ambiente inline na config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de env do shell (opcional)">
  Se ativado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente em variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores da config">
  Referencie variáveis de ambiente em qualquer valor de string da config com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas são aceitos: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Refs de segredo (env, file, exec)">
  Para campos que oferecem suporte a objetos SecretRef, você pode usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Secrets Management](/pt-BR/gateway/secrets).
Os caminhos de credenciais compatíveis estão listados em [SecretRef Credential Surface](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Veja [Environment](/pt-BR/help/environment) para a precedência completa e todas as fontes.

## Referência completa

Para a referência completa campo por campo, veja **[Configuration Reference](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Configuration Examples](/pt-BR/gateway/configuration-examples) · [Configuration Reference](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_
