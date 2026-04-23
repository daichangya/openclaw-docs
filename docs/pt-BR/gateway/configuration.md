---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando até seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-23T05:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuração

O OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 oferece suporte a comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts com `openclaw.json`
como symlink não são compatíveis com gravações controladas pelo OpenClaw; uma gravação atômica pode substituir
o caminho em vez de preservar o symlink. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, tools, sandboxing ou automação (Cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Veja a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

<Tip>
**É novo em configuração?** Comece com `openclaw onboard` para configuração interativa ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para configurações completas de copiar e colar.
</Tip>

## Configuração mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando a configuração

<Tabs>
  <Tab title="Assistente interativo">
    ```bash
    openclaw onboard       # fluxo completo de onboarding
    openclaw configure     # assistente de configuração
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI de controle">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A UI de controle renderiza um formulário a partir do schema da configuração ativa, incluindo metadados de documentação de campo
    `title` / `description`, além de schemas de Plugin e canal quando
    disponíveis, com um editor de **Raw JSON** como rota de escape. Para UIs de detalhamento
    e outras ferramentas, o gateway também expõe `config.schema.lookup` para
    buscar um nó de schema com escopo de um caminho mais resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondam totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

Observações sobre ferramentas de schema:

- `openclaw config schema` imprime a mesma família de JSON Schema usada pela UI de controle
  e pela validação da configuração.
- Trate essa saída do schema como o contrato canônico legível por máquina para
  `openclaw.json`; esta visão geral e a referência de configuração a resumem.
- Os valores de campo `title` e `description` são propagados para a saída do schema para
  ferramentas de editor e formulário.
- Entradas de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos
  metadados de documentação quando a documentação de campo correspondente existe.
- Ramificações de composição `anyOf` / `oneOf` / `allOf` também herdam os mesmos
  metadados de documentação, para que variantes de união/interseção mantenham a mesma ajuda de campo.
- `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de
  schema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns
  e campos de validação semelhantes), metadados de dica de UI correspondentes e resumos imediatos
  dos filhos para ferramentas de detalhamento.
- Schemas dinâmicos de Plugin/canal são mesclados quando o gateway consegue carregar o
  registro de manifests atual.
- `pnpm config:docs:check` detecta divergência entre artefatos de baseline de configuração voltados para documentação
  e a superfície atual do schema.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway também mantém uma cópia confiável do último estado válido após uma inicialização bem-sucedida. Se
`openclaw.json` for alterado depois fora do OpenClaw e não passar mais na validação, a inicialização
e o hot reload preservam o arquivo quebrado como um snapshot `.clobbered.*` com timestamp,
restauram a última cópia válida conhecida e registram um aviso destacado com o motivo da recuperação.
A recuperação de leitura na inicialização também trata quedas bruscas de tamanho, ausência de metadados de configuração e
a ausência de `gateway.mode` como assinaturas críticas de sobrescrita quando a última cópia válida conhecida
tinha esses campos.
Se uma linha de status/log for acidentalmente adicionada no início antes de uma configuração JSON
válida, a inicialização do gateway e `openclaw doctor --fix` podem remover o prefixo,
preservar o arquivo poluído como `.clobbered.*` e continuar com o JSON
recuperado.
O próximo turno do agente principal também recebe um aviso de evento de sistema informando que a
configuração foi restaurada e não deve ser regravada cegamente. A promoção da última cópia válida conhecida
é atualizada após a inicialização validada e após hot reloads aceitos, incluindo
gravações de configuração controladas pelo OpenClaw cujo hash do arquivo persistido ainda corresponda à
gravação aceita. A promoção é ignorada quando o candidato contém placeholders
de secrets redigidos, como `***` ou valores de token encurtados.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Veja a página dedicada de cada canal para os passos de configuração:

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
    Defina o modelo primário e os fallbacks opcionais:

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

    - `agents.defaults.models` define o catálogo de modelos e atua como a allowlist para `/model`.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à allowlist sem remover modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que você passe `--replace`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla a redução de escala de imagens de transcrição/tool (padrão `1200`); valores menores normalmente reduzem o uso de vision tokens em execuções com muitas capturas de tela.
    - Veja [CLI de modelos](/pt-BR/concepts/models) para trocar de modelo no chat e [Failover de modelos](/pt-BR/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para providers personalizados/self-hosted, veja [Providers personalizados](/pt-BR/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de permissões pareadas)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas de canal.

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar bloqueio por menção em chat de grupo">
    Mensagens em grupo exigem menção por padrão. Configure padrões por agente:

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

    - **Menções de metadados**: @-mentions nativos (WhatsApp tocar para mencionar, Telegram @bot etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#group-chat-mention-gating) para sobrescritas por canal e modo de conversa consigo mesmo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` para uma base compartilhada e, em seguida, sobrescreva agentes
    específicos com `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // herda github, weather
          { id: "docs", skills: ["docs-search"] }, // substitui os padrões
          { id: "locked-down", skills: [] }, // sem skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para não ter Skills.
    - Veja [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de configuração](/pt-BR/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de saúde de canais do gateway">
    Controle o quão agressivamente o gateway reinicia canais que parecem obsoletos:

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

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar globalmente os reinícios do monitoramento de saúde.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar reinicializações automáticas para um canal ou conta sem desabilitar o monitor global.
    - Veja [Verificações de saúde](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
    As sessões controlam a continuidade e o isolamento da conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para vários usuários
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
    - Veja [Gerenciamento de sessão](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
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

    Construa a imagem primeiro: `scripts/sandbox-setup.sh`

    Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push com relay para builds oficiais do iOS">
    O push com relay é configurado em `openclaw.json`.

    Defina isto na configuração do gateway:

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

    Equivalente na CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isso faz:

    - Permite que o gateway envie `push.test`, wake nudges e wakes de reconexão por meio do relay externo.
    - Usa uma permissão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay de implantação inteira.
    - Vincula cada registro com relay à identidade do gateway com a qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds locais/manuais do iOS em APNs direto. Envios com relay se aplicam apenas a builds oficiais distribuídos que se registraram por meio do relay.
    - Deve corresponder à URL base do relay incorporada no build oficial/TestFlight do iOS, para que o tráfego de registro e envio alcance a mesma implantação do relay.

    Fluxo de ponta a ponta:

    1. Instale um build oficial/TestFlight do iOS que tenha sido compilado com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Pareie o app iOS com o gateway e deixe as sessões de Node e de operador se conectarem.
    4. O app iOS obtém a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e então publica a carga `push.apns.register` com relay para o gateway pareado.
    5. O gateway armazena o identificador do relay e a permissão de envio e então os usa para `push.test`, wake nudges e wakes de reconexão.

    Observações operacionais:

    - Se você trocar o app iOS para um gateway diferente, reconecte o app para que ele possa publicar um novo registro de relay vinculado àquele gateway.
    - Se você distribuir um novo build do iOS apontando para uma implantação de relay diferente, o app atualiza seu registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma rota de escape de desenvolvimento somente para loopback; não persista URLs HTTP de relay na configuração.

    Veja [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

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

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desabilitar.
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

    - `sessionRetention`: remove sessões concluídas de execuções isoladas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: remove conteúdo de `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Jobs de Cron](/pt-BR/automation/cron-jobs) para uma visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Habilite endpoints HTTP de Webhook no Gateway:

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
    - Trate todo o conteúdo de payload de hook/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook é somente por header (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desabilitadas as flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração estritamente delimitada.
    - Se você habilitar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por hook, prefira tiers de modelo fortes e modernos e política de tool estrita (por exemplo, somente mensagens mais sandboxing quando possível).

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

  <Accordion title="Dividir a configuração em vários arquivos ($include)">
    Use `$include` para organizar configurações grandes:

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
    - **Array de arquivos**: mesclagem profunda em ordem (o último prevalece)
    - **Chaves irmãs**: mescladas após os includes (sobrescrevem valores incluídos)
    - **Includes aninhados**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que faz o include
    - **Gravações controladas pelo OpenClaw**: quando uma gravação altera apenas uma seção de nível superior
      respaldada por um include de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through não compatível**: includes na raiz, arrays de include e includes
      com sobrescritas em chaves irmãs falham de forma segura para gravações controladas pelo OpenClaw, em vez de
      achatar a configuração
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parse e includes circulares

  </Accordion>
</AccordionGroup>

## Hot reload da configuração

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente — sem necessidade de reinício manual para a maioria das configurações.

Edições diretas no arquivo são tratadas como não confiáveis até serem validadas. O watcher espera
a agitação de gravação temporária/rename do editor se estabilizar, lê o arquivo final e rejeita
edições externas inválidas restaurando a última configuração válida conhecida. Gravações de configuração
controladas pelo OpenClaw usam a mesma barreira de schema antes de gravar; sobrescritas destrutivas, como
remover `gateway.mode` ou reduzir o arquivo em mais da metade, são rejeitadas
e salvas como `.rejected.*` para inspeção.

Se você vir `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` nos logs, inspecione o arquivo
`.clobbered.*` correspondente ao lado de `openclaw.json`, corrija o payload rejeitado e então execute
`openclaw config validate`. Veja [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config)
para o checklist de recuperação.

### Modos de recarga

| Modo                   | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão)  | Aplica alterações seguras instantaneamente. Reinicia automaticamente para alterações críticas. |
| **`hot`**              | Aplica apenas alterações seguras instantaneamente. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.               |
| **`off`**              | Desabilita a observação do arquivo. As alterações entram em vigor no próximo reinício manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado instantaneamente vs. o que precisa de reinício

A maioria dos campos é aplicada instantaneamente sem downtime. No modo `hybrid`, alterações que exigem reinício são tratadas automaticamente.

| Categoria            | Campos                                                            | Reinício necessário? |
| -------------------- | ----------------------------------------------------------------- | -------------------- |
| Canais               | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de Plugin | Não              |
| Agente e modelos     | `agent`, `agents`, `models`, `routing`                            | Não                  |
| Automação            | `hooks`, `cron`, `agent.heartbeat`                                | Não                  |
| Sessões e mensagens  | `session`, `messages`                                             | Não                  |
| Tools e mídia        | `tools`, `browser`, `skills`, `audio`, `talk`                     | Não                  |
| UI e diversos        | `ui`, `logging`, `identity`, `bindings`                           | Não                  |
| Servidor Gateway     | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)             | **Sim**              |
| Infraestrutura       | `discovery`, `canvasHost`, `plugins`                              | **Sim**              |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** aciona reinício.
</Note>

## RPC de configuração (atualizações programáticas)

<Note>
RPCs de gravação do plano de controle (`config.apply`, `config.patch`, `update.run`) têm limite de taxa de **3 solicitações por 60 segundos** por `deviceId+clientIp`. Quando limitado, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

Fluxo seguro/padrão:

- `config.schema.lookup`: inspeciona uma subárvore de configuração com escopo de um caminho com um nó de
  schema superficial, metadados de dicas correspondentes e resumos imediatos dos filhos
- `config.get`: busca o snapshot atual + hash
- `config.patch`: caminho preferido para atualização parcial
- `config.apply`: substituição completa da configuração apenas
- `update.run`: autoatualização + reinício explícitos

Quando você não estiver substituindo a configuração inteira, prefira `config.schema.lookup`
e depois `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (substituição completa)">
    Valida + grava a configuração completa e reinicia o Gateway em uma etapa.

    <Warning>
    `config.apply` substitui a **configuração inteira**. Use `config.patch` para atualizações parciais ou `openclaw config set` para chaves individuais.
    </Warning>

    Parâmetros:

    - `raw` (string) — payload JSON5 para a configuração inteira
    - `baseHash` (opcional) — hash da configuração de `config.get` (obrigatório quando a configuração existe)
    - `sessionKey` (opcional) — chave de sessão para o ping de ativação após o reinício
    - `note` (opcional) — observação para o sentinela de reinício
    - `restartDelayMs` (opcional) — atraso antes do reinício (padrão 2000)

    Solicitações de reinício são consolidadas enquanto uma já estiver pendente/em andamento, e um cooldown de 30 segundos se aplica entre ciclos de reinício.

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
    Mescla uma atualização parcial na configuração existente (semântica de JSON merge patch):

    - Objetos são mesclados recursivamente
    - `null` exclui uma chave
    - Arrays substituem

    Parâmetros:

    - `raw` (string) — JSON5 apenas com as chaves a alterar
    - `baseHash` (obrigatório) — hash da configuração de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — iguais a `config.apply`

    O comportamento de reinício corresponde ao de `config.apply`: reinícios pendentes consolidados mais um cooldown de 30 segundos entre ciclos de reinício.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai mais:

- `.env` do diretório de trabalho atual (se existir)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos sobrescreve variáveis de ambiente existentes. Você também pode definir variáveis de ambiente inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação do env do shell (opcional)">
  Se habilitado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente em variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Referencie variáveis de ambiente em qualquer valor string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Refs de secret (env, file, exec)">
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

Os detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de secrets](/pt-BR/gateway/secrets).
Os caminhos de credenciais compatíveis estão listados em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Veja [Ambiente](/pt-BR/help/environment) para precedência e fontes completas.

## Referência completa

Para a referência completa campo a campo, veja **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_
