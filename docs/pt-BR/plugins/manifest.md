---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa distribuir um esquema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto de plugin + requisitos de esquema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-09T01:29:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a7ee4b621a801d2a8f32f8976b0e1d9433c7810eb360aca466031fc0ffb286a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de plugin (openclaw.plugin.json)

Esta página é apenas para o **manifesto de plugin nativo do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao esquema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais as
raízes declaradas de Skills, raízes de comandos Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hook suportados quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidade nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidade](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código
do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o
  runtime do plugin
- metadados de alias e autoativação que devem ser resolvidos antes do carregamento do runtime do plugin
- metadados abreviados de propriedade de família de modelos que devem autoativar o
  plugin antes do carregamento do runtime
- snapshots estáticos de propriedade de capacidade usados para compat wiring incluído e
  cobertura de contrato
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e validação
  sem carregar o runtime
- dicas de UI de configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses pertencem ao código do seu plugin e ao `package.json`.

## Exemplo mínimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Exemplo completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin de provedor OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Chave de API do OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Chave de API do OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referência dos campos de nível superior

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                      | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                         |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin incluído como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                 |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provedor que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                  |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canal pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                 |
| `providers`                         | Não         | `string[]`                       | IDs de provedor pertencentes a este plugin.                                                                                                                                                                  |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                       |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backend de inferência CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                   |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados leves de env de autenticação de provedor que o OpenClaw pode inspecionar sem carregar o código do plugin.                                                                                         |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provedor que devem reutilizar outro ID de provedor para busca de autenticação, por exemplo um provedor de codificação que compartilha a chave de API e os perfis de autenticação do provedor base. |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use isto para configuração de canal orientada por env ou superfícies de autenticação que auxiliares genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados leves de escolha de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                                 |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades incluídas para speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search e propriedade de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados em superfícies de descoberta e validação antes do carregamento do runtime.                                                          |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                      |
| `description`                       | Não         | `string`                         | Resumo curto mostrado nas superfícies do plugin.                                                                                                                                                             |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de providerAuthChoices

Cada entrada em `providerAuthChoices` descreve uma opção de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                               |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta opção pertence.                                                                   |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para encaminhamento.                                                             |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado por fluxos de onboarding e CLI.                                   |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                              |
| `choiceHint`          | Não         | `string`                                        | Texto auxiliar curto para o seletor.                                                                          |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos orientados por assistente.                       |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a opção dos seletores do assistente, ainda permitindo seleção manual pela CLI.                         |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta opção substituta.                            |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar opções relacionadas.                                                        |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                    |
| `groupHint`           | Não         | `string`                                        | Texto auxiliar curto para o grupo.                                                                            |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                                |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                             |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                              |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`.    |

## Referência de uiHints

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para solicitações ao OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo voltado ao usuário.     |
| `help`        | `string`   | Texto auxiliar curto.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como segredo ou sensível. |
| `placeholder` | `string`   | Texto placeholder para entradas de formulário. |

## Referência de contracts

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode
ler sem importar o runtime do plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista é opcional:

| Campo                            | Tipo       | O que significa                                             |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provedor de speech pertencentes a este plugin.       |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real deste plugin.  |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedor de voz em tempo real deste plugin.          |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedor de compreensão de mídia deste plugin.       |
| `imageGenerationProviders`       | `string[]` | IDs de provedor de geração de imagens deste plugin.         |
| `videoGenerationProviders`       | `string[]` | IDs de provedor de geração de vídeo deste plugin.           |
| `webFetchProviders`              | `string[]` | IDs de provedor de busca web deste plugin.                  |
| `webSearchProviders`             | `string[]` | IDs de provedor de pesquisa web deste plugin.               |
| `tools`                          | `string[]` | Nomes de ferramentas de agente pertencentes a este plugin para verificações de contrato incluídas. |

## Referência de channelConfigs

Use `channelConfigs` quando um plugin de canal precisar de metadados de configuração leves antes
do carregamento do runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL do homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexão com o homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada de configuração de canal declarada. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                              |
| `preferOver`  | `string[]`               | IDs de plugin legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

## Referência de modelSupport

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provedor a partir de
IDs abreviados de modelo, como `gpt-5.4` ou `claude-sonnet-4.6`, antes do carregamento do runtime
do plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados de manifesto `providers` do proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não incluído e um plugin incluído corresponderem, o plugin não incluído
  vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs abreviados de modelo.            |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em IDs abreviados de modelo após remoção do sufixo do perfil. |

Chaves legadas de capacidade no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin pré-runtime vivem intencionalmente em `package.json`, no bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos do plugin.                                                                                                          |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de configuração usado durante onboarding e inicialização adiada de canal.                                               |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                     |
| `openclaw.channel.configuredState`                                | Metadados leves do verificador de estado configurado que podem responder "já existe configuração apenas por env?" sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves do verificador de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins incluídos e publicados externamente.                                                              |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis.                                                           |
| `openclaw.install.minHostVersion`                                 | Versão mínima suportada do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho limitado de recuperação por reinstalação de plugin incluído quando a configuração é inválida.                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de configuração sejam carregadas antes do plugin completo de canal durante a inicialização.            |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro
de manifesto. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
plugin em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente limitado. Ele
não torna instaláveis configurações arbitrariamente quebradas. Hoje ele só permite que
fluxos de instalação se recuperem de falhas específicas de upgrade de plugin incluído desatualizado, como
um caminho ausente de plugin incluído ou uma entrada `channels.<id>` desatualizada para esse mesmo
plugin incluído. Erros de configuração não relacionados continuam bloqueando a instalação e enviam operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um pequeno módulo
verificador:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Use-o quando fluxos de configuração, doctor ou estado configurado precisarem de uma sonda de autenticação
sim/não leve antes de o plugin completo de canal ser carregado. A exportação de destino deve ser uma
pequena função que leia apenas o estado persistido; não a encaminhe pelo barrel completo
de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações leves
de estado configurado apenas por env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Use-o quando um canal puder responder o estado configurado a partir de env ou de outras
entradas pequenas não ligadas ao runtime. Se a verificação precisar de resolução completa de configuração ou do
runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos de JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Esquemas são validados no momento de leitura/escrita da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **detectáveis**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema quebrado ou ausente,
  a validação falhará e o Doctor reportará o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto serve apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos de manifesto documentados são lidos pelo carregador de manifesto. Evite adicionar
  chaves de nível superior personalizadas aqui.
- `providerAuthEnvVars` é o caminho de metadados leves para sondas de autenticação, validação
  de marcador de env e superfícies semelhantes de autenticação de provedor que não devem iniciar o
  runtime do plugin apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis de env de autenticação,
  perfis de autenticação, autenticação baseada em configuração e a opção de onboarding por chave de API
  de outro provedor sem codificar essa relação no core.
- `channelEnvVars` é o caminho de metadados leves para fallback de env de shell, prompts
  de configuração e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho de metadados leves para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples
  de flags CLI de onboarding antes do carregamento do runtime do provedor. Para metadados de wizard de runtime
  que exigem código do provedor, consulte
  [Hooks de runtime de provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` interno).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — primeiros passos com plugins
- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
