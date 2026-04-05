---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando até seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-05T12:42:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuração

O OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 oferece suporte a comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.

Se o arquivo não existir, o OpenClaw usará padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens para o bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Veja a [referência completa](/gateway/configuration-reference) para todos os campos disponíveis.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para configuração interativa ou veja o guia [Exemplos de configuração](/gateway/configuration-examples) para configurações completas prontas para copiar e colar.
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
  <Tab title="CLI (uma linha)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI de controle">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A UI de controle renderiza um formulário a partir do schema de configuração ativo, incluindo metadados de documentação `title` / `description` dos campos, além de schemas de plugins e canais quando disponíveis, com um editor **Raw JSON** como rota de escape. Para UIs de navegação detalhada e outras ferramentas, o gateway também expõe `config.schema.lookup` para buscar um único nó do schema com escopo de caminho, além de resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondem totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

Observações sobre ferramentas de schema:

- `openclaw config schema` imprime a mesma família de JSON Schema usada pela UI de controle e pela validação de configuração.
- Os valores `title` e `description` dos campos são levados para a saída do schema para ferramentas de editor e formulário.
- Entradas de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos metadados de documentação quando há documentação de campo correspondente.
- Ramos de composição `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação, para que variantes de união/interseção mantenham a mesma ajuda de campo.
- `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de schema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns e campos de validação semelhantes), metadados de dica de UI correspondentes e resumos imediatos dos filhos para ferramentas de navegação detalhada.
- Schemas de plugin/canal em runtime são mesclados quando o gateway consegue carregar o registro atual de manifests.

Quando a validação falha:

- O Gateway não inicia
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar correções

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Veja a página dedicada do canal para as etapas de configuração:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

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
    Defina o modelo primário e fallbacks opcionais:

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

    - `agents.defaults.models` define o catálogo de modelos e funciona como allowlist para `/model`.
    - Refs de modelo usam o formato `provider/model` (por exemplo `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagem para transcrição/ferramenta (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Veja [CLI de modelos](/concepts/models) para trocar modelos no chat e [Failover de modelo](/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para provedores personalizados/self-hosted, veja [Provedores personalizados](/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens para o bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de allowlist pareado)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Veja a [referência completa](/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar bloqueio por menção em chats de grupo">
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

    - **Menções por metadados**: @menções nativas (toque para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/gateway/configuration-reference#group-chat-mention-gating) para substituições por canal e modo de self-chat.

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
          { id: "writer" }, // herda github, weather
          { id: "docs", skills: ["docs-search"] }, // substitui os padrões
          { id: "locked-down", skills: [] }, // sem Skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para nenhuma Skill.
    - Veja [Skills](/tools/skills), [Configuração de Skills](/tools/skills-config) e a [Referência de configuração](/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de integridade de canais do gateway">
    Controle quão agressivamente o gateway reinicia canais que parecem obsoletos:

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
    - Veja [Verificações de integridade](/gateway/health) para depuração operacional e a [referência completa](/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
    Sessões controlam continuidade e isolamento de conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para múltiplos usuários
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
    - Veja [Gerenciamento de sessão](/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Ativar sandboxing">
    Execute sessões de agente em contêineres Docker isolados:

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

    Crie a imagem primeiro: `scripts/sandbox-setup.sh`

    Veja [Sandboxing](/gateway/sandboxing) para o guia completo e a [referência completa](/gateway/configuration-reference#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Ativar push com relay para builds oficiais do iOS">
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

    Equivalente em CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isso faz:

    - Permite que o gateway envie `push.test`, wake nudges e reconnect wakes por meio do relay externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay para toda a implantação.
    - Vincula cada registro com relay à identidade do gateway com a qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds locais/manuais do iOS em APNs direto. Envios com relay se aplicam apenas a builds oficiais distribuídas que se registraram pelo relay.
    - Deve corresponder ao base URL do relay embutido na build oficial/TestFlight do iOS, para que o tráfego de registro e envio chegue à mesma implantação do relay.

    Fluxo completo:

    1. Instale uma build oficial/TestFlight do iOS compilada com o mesmo base URL do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Faça o pareamento do app iOS com o gateway e deixe tanto as sessões de nó quanto as de operador se conectarem.
    4. O app iOS busca a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e, em seguida, publica o payload `push.apns.register` com relay no gateway pareado.
    5. O gateway armazena o identificador do relay e a concessão de envio, depois os usa para `push.test`, wake nudges e reconnect wakes.

    Observações operacionais:

    - Se você trocar o app iOS para outro gateway, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse gateway.
    - Se você distribuir uma nova build do iOS apontando para outra implantação de relay, o app atualiza seu registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por ambiente.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma rota de escape de desenvolvimento somente para loopback; não persista URLs HTTP de relay na configuração.

    Veja [App iOS](/platforms/ios#relay-backed-push-for-official-builds) para o fluxo completo e [Fluxo de autenticação e confiança](/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar heartbeat (check-ins periódicos)">
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
    - `directPolicy`: `allow` (padrão) ou `block` para alvos de heartbeat em estilo DM
    - Veja [Heartbeat](/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar jobs cron">
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

    - `sessionRetention`: remove sessões concluídas de execuções isoladas de `sessions.json` (padrão `24h`; defina `false` para desativar).
    - `runLog`: faz pruning de `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Jobs cron](/automation/cron-jobs) para visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Ative endpoints HTTP de webhook no Gateway:

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
    - Trate todo conteúdo de payload de hook/webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook é somente por cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desativadas flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração bem delimitada.
    - Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão escolhidas pelo chamador.
    - Para agentes acionados por hooks, prefira camadas fortes e modernas de modelo e política estrita de ferramentas (por exemplo, apenas mensagens mais sandboxing sempre que possível).

    Veja a [referência completa](/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multiagente">
    Execute múltiplos agentes isolados com workspaces e sessões separados:

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

    Veja [Multi-Agent](/concepts/multi-agent) e a [referência completa](/gateway/configuration-reference#multi-agent-routing) para regras de binding e perfis de acesso por agente.

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
    - **Array de arquivos**: mesclado profundamente em ordem (o posterior prevalece)
    - **Chaves irmãs**: mescladas após os includes (substituem valores incluídos)
    - **Includes aninhados**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parse e includes circulares

  </Accordion>
</AccordionGroup>

## Config hot reload

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente — não é necessário reinício manual para a maioria das configurações.

### Modos de recarga

| Modo                  | Comportamento                                                                          |
| --------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica alterações seguras a quente imediatamente. Reinicia automaticamente para as críticas. |
| **`hot`**             | Aplica somente alterações seguras a quente. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**         | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.              |
| **`off`**             | Desativa a observação de arquivos. Alterações entram em vigor no próximo reinício manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado a quente vs o que precisa de reinício

A maioria dos campos é aplicada a quente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinício são tratadas automaticamente.

| Categoria             | Campos                                                               | Precisa reiniciar? |
| --------------------- | -------------------------------------------------------------------- | ------------------ |
| Canais                | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de extensão | Não           |
| Agente e modelos      | `agent`, `agents`, `models`, `routing`                               | Não                |
| Automação             | `hooks`, `cron`, `agent.heartbeat`                                   | Não                |
| Sessões e mensagens   | `session`, `messages`                                                | Não                |
| Ferramentas e mídia   | `tools`, `browser`, `skills`, `audio`, `talk`                        | Não                |
| UI e diversos         | `ui`, `logging`, `identity`, `bindings`                              | Não                |
| Servidor do gateway   | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)                | **Sim**            |
| Infraestrutura        | `discovery`, `canvasHost`, `plugins`                                 | **Sim**            |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** dispara um reinício.
</Note>

## RPC de configuração (atualizações programáticas)

<Note>
RPCs de gravação do plano de controle (`config.apply`, `config.patch`, `update.run`) têm limite de taxa de **3 solicitações a cada 60 segundos** por `deviceId+clientIp`. Quando limitado, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

Fluxo seguro/padrão:

- `config.schema.lookup`: inspeciona uma subárvore de configuração com escopo de caminho com um nó de schema superficial, metadados de dica correspondentes e resumos imediatos dos filhos
- `config.get`: busca o snapshot atual + hash
- `config.patch`: caminho preferido para atualização parcial
- `config.apply`: substituição completa da configuração apenas
- `update.run`: autoatualização + reinicialização explícitas

Quando você não estiver substituindo a configuração inteira, prefira `config.schema.lookup` e depois `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (substituição completa)">
    Valida + grava a configuração completa e reinicia o Gateway em uma única etapa.

    <Warning>
    `config.apply` substitui a **configuração inteira**. Use `config.patch` para atualizações parciais ou `openclaw config set` para chaves únicas.
    </Warning>

    Parâmetros:

    - `raw` (string) — payload JSON5 para a configuração inteira
    - `baseHash` (opcional) — hash da configuração de `config.get` (obrigatório quando a configuração existe)
    - `sessionKey` (opcional) — chave de sessão para o ping de wake-up após o reinício
    - `note` (opcional) — observação para o sentinel de reinício
    - `restartDelayMs` (opcional) — atraso antes do reinício (padrão 2000)

    Solicitações de reinício são consolidadas enquanto uma já estiver pendente/em andamento, e um cooldown de 30 segundos é aplicado entre ciclos de reinício.

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
    - Arrays são substituídos

    Parâmetros:

    - `raw` (string) — JSON5 somente com as chaves a alterar
    - `baseHash` (obrigatório) — hash da configuração de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — iguais a `config.apply`

    O comportamento de reinício corresponde ao de `config.apply`: reinícios pendentes consolidados mais cooldown de 30 segundos entre ciclos de reinício.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai, além de:

- `.env` do diretório de trabalho atual (se existir)
- `~/.openclaw/.env` (fallback global)

Nenhum desses arquivos substitui variáveis de ambiente existentes. Você também pode definir variáveis inline na configuração:

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

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Referencie variáveis de ambiente em qualquer valor string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`
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

Detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de segredos](/gateway/secrets).
Caminhos de credenciais compatíveis estão listados em [Superfície de credenciais SecretRef](/reference/secretref-credential-surface).
</Accordion>

Veja [Environment](/help/environment) para precedência e fontes completas.

## Referência completa

Para a referência completa campo por campo, veja **[Referência de configuração](/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/gateway/configuration-examples) · [Referência de configuração](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
