---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um esquema de configuração do plugin ou depurar erros de validação do plugin
summary: Requisitos do manifesto do Plugin + esquema JSON (validação estrita de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto do Plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de Plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados em relação ao esquema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais as raízes de Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle do Claude, padrões de LSP do bundle do Claude e pacotes de hooks compatíveis quando o layout corresponde às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na **raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração **sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capacidade nativo e a orientação atual de compatibilidade externa:
[Modelo de capacidade](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o runtime do plugin
- dicas de ativação baratas que superfícies do plano de controle podem inspecionar antes de o runtime carregar
- descritores de configuração baratos que superfícies de setup/onboarding podem inspecionar antes de o runtime carregar
- metadados de alias e autoativação que devem ser resolvidos antes de o runtime do plugin carregar
- metadados abreviados de propriedade de família de modelos que devem ativar automaticamente o plugin antes de o runtime carregar
- snapshots estáticos de propriedade de capacidade usados para a integração de compatibilidade empacotada e cobertura de contrato
- metadados baratos do executor de QA que o host compartilhado `openclaw qa` pode inspecionar antes de o runtime do plugin carregar
- metadados de configuração específicos de canal que devem ser mesclados nas superfícies de catálogo e validação sem carregar o runtime
- dicas de UI para configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação do npm

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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

## Referência de campos de nível superior

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                      | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                                        |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin empacotado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provider que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                  |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Não         | `string[]`                       | IDs de canal pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                 |
| `providers`                         | Não         | `string[]`                       | IDs de provider pertencentes a este plugin.                                                                                                                                                                 |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto usados para carregar automaticamente o plugin antes do runtime.                                                                        |
| `providerEndpoints`                 | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provider que o núcleo precisa classificar antes de o runtime do provider carregar.                                            |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backend de inferência CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração.                                                   |
| `syntheticAuthRefs`                 | Não         | `string[]`                       | Referências de provider ou backend CLI cujo hook de autenticação sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes de o runtime carregar.                         |
| `nonSecretAuthMarkers`              | Não         | `string[]`                       | Valores de placeholder de chave de API pertencentes a plugins empacotados que representam estado de credencial local, OAuth ou ambiente não secreto.                                                       |
| `commandAliases`                    | Não         | `object[]`                       | Nomes de comando pertencentes a este plugin que devem produzir diagnósticos de configuração e CLI conscientes do plugin antes de o runtime carregar.                                                        |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados baratos de variáveis de ambiente de autenticação de provider que o OpenClaw pode inspecionar sem carregar código do plugin.                                                                      |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provider que devem reutilizar outro ID de provider para busca de autenticação, por exemplo, um provider de código que compartilha a chave de API e os perfis de autenticação do provider base.      |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados baratos de variáveis de ambiente de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para superfícies de setup ou autenticação de canal orientadas por env que auxiliares genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados baratos de escolha de autenticação para seletores de onboarding, resolução de provider preferido e integração simples de flags de CLI.                                                           |
| `activation`                        | Não         | `object`                         | Dicas baratas de ativação para carregamento acionado por provider, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin continua sendo dono do comportamento real.                     |
| `setup`                             | Não         | `object`                         | Descritores baratos de setup/onboarding que superfícies de descoberta e setup podem inspecionar sem carregar o runtime do plugin.                                                                          |
| `qaRunners`                         | Não         | `object[]`                       | Descritores baratos de executor de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do plugin carregar.                                                                                  |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidade empacotada para propriedade de fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de música, geração de vídeo, busca web, pesquisa na web e ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto mesclados em superfícies de descoberta e validação antes de o runtime carregar.                                                               |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills para carregar, relativos à raiz do plugin.                                                                                                                                             |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                     |
| `description`                       | Não         | `string`                         | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                             |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                               |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                           |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provider carregar.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provider ao qual esta escolha pertence.                                                             |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para o qual encaminhar.                                                      |
| `choiceId`            | Sim         | `string`                                        | ID estável de escolha de autenticação usado por fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                           |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                      |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.                  |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual via CLI.                   |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar os usuários para esta escolha substituta.                   |
| `groupId`             | Não         | `string`                                        | ID de grupo opcional para agrupar escolhas relacionadas.                                                  |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                        |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                            |
| `cliFlag`             | Não         | `string`                                        | Nome da flag de CLI, como `--openrouter-api-key`.                                                         |
| `cliOption`           | Não         | `string`                                        | Forma completa da opção de CLI, como `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                          |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin é dono de um nome de comando de runtime que os usuários podem, por engano, colocar em `plugins.allow` ou tentar executar como um comando CLI raiz. O OpenClaw usa esses metadados para diagnósticos sem importar o código de runtime do plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Campo        | Obrigatório | Tipo              | O que significa                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                               |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat, e não como um comando CLI raiz. |
| `cliCommand` | Não         | `string`          | Comando CLI raiz relacionado a ser sugerido para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin pode declarar de forma barata quais eventos do plano de controle devem ativá-lo depois.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribui com um ou mais executores de transporte sob a raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o runtime do plugin continua sendo dono do registro real da CLI por meio de uma superfície leve `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.         |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

Este bloco é apenas metadados. Ele não registra comportamento de runtime e não substitui `register(...)`, `setupEntry` nem outros entrypoints de runtime/plugin.
Os consumidores atuais o usam como uma dica de refinamento antes do carregamento mais amplo do plugin, então a ausência de metadados de ativação normalmente afeta apenas o desempenho; ela não deve alterar a correção enquanto ainda existirem fallbacks legados de propriedade do manifesto.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                   |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | IDs de provider que devem ativar este plugin quando solicitados.  |
| `onCommands`     | Não         | `string[]`                                           | IDs de comando que devem ativar este plugin.                      |
| `onChannels`     | Não         | `string[]`                                           | IDs de canal que devem ativar este plugin.                        |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem ativar este plugin.                       |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos no momento:

- o planejamento de CLI acionado por comando usa como fallback `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de setup/canal acionado por canal usa como fallback a propriedade legada `channels[]` quando faltam metadados explícitos de ativação de canal
- o planejamento de setup/runtime acionado por provider usa como fallback a propriedade legada `providers[]` e `cliBackends[]` de nível superior quando faltam metadados explícitos de ativação de provider

## Referência de `setup`

Use `setup` quando superfícies de setup e onboarding precisarem de metadados baratos pertencentes ao plugin antes de o runtime carregar.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

O `cliBackends` de nível superior continua válido e segue descrevendo backends de inferência CLI. `setup.cliBackends` é a superfície de descritor específica de setup para fluxos de plano de controle/setup que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida de busca orientada por descritor para descoberta de setup. Se o descritor apenas restringe o plugin candidato e o setup ainda precisa de hooks de runtime mais ricos no momento do setup, defina `requiresRuntime: true` e mantenha `setup-api` em vigor como caminho de execução de fallback.

Como a busca de setup pode executar código `setup-api` pertencente ao plugin, os valores normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os plugins descobertos. Propriedade ambígua falha em modo fechado em vez de escolher um vencedor com base na ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID do provider exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de método de setup/autenticação compatíveis com este provider sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes de o runtime do plugin carregar. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provider expostos durante setup e onboarding.                                |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de setup usados para busca de setup orientada por descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                     |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa da execução de `setup-api` após a busca por descritor.                      |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                            |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Rótulo do campo voltado ao usuário.        |
| `help`        | `string`   | Texto curto de ajuda.                      |
| `tags`        | `string[]` | Tags opcionais de UI.                      |
| `advanced`    | `boolean`  | Marca o campo como avançado.               |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.    |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode ler sem importar o runtime do plugin.

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

| Campo                            | Tipo       | O que significa                                                |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provider de fala pertencentes a este plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provider de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provider de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provider de compreensão de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provider de geração de imagens pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provider de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de provider de busca web pertencentes a este plugin.       |
| `webSearchProviders`             | `string[]` | IDs de provider de pesquisa na web pertencentes a este plugin. |
| `tools`                          | `string[]` | Nomes de ferramentas de agente pertencentes a este plugin para verificações de contrato empacotadas. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes de o runtime carregar.

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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                          |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade de UI opcionais para essa seção de configuração do canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                        |
| `preferOver`  | `string[]`               | IDs de plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provider a partir de IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin carregar.

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
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provider

Campos:

| Campo           | Tipo       | O que significa                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em relação a IDs abreviados de modelo. |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em relação a IDs abreviados de modelo após a remoção do sufixo de perfil. |

As chaves legadas de capacidade no nível superior estão obsoletas. Use `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal do manifesto não trata mais esses campos de nível superior como propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos servem a funções diferentes:

| Arquivo                | Use para                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes de o código do plugin ser executado |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde uma parte dos metadados deve ficar, use esta regra:

- se o OpenClaw precisa conhecê-la antes de carregar o código do plugin, coloque-a em `openclaw.plugin.json`
- se ela diz respeito a empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-a em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin anteriores ao runtime ficam intencionalmente em `package.json`, no bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                                                                       |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas para setup usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder "já existe setup apenas por env?" sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                         |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando múltiplas fontes de instalação estão disponíveis.                                                     |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin empacotado quando a configuração é inválida.                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup carreguem antes do plugin de canal completo durante a inicialização.                       |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o plugin em hosts mais antigos.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais ou verificações de SecretRef precisarem identificar contas configuradas sem carregar o runtime completo. A entrada de setup deve expor metadados do canal mais adaptadores seguros para setup de configuração, status e segredos; mantenha clientes de rede, listeners do Gateway e runtimes de transporte no entrypoint principal da extensão.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não torna instaláveis configurações arbitrariamente quebradas. Hoje, ele só permite que fluxos de instalação se recuperem de falhas específicas e obsoletas de upgrade de plugin empacotado, como um caminho ausente de plugin empacotado ou uma entrada obsoleta `channels.<id>` para esse mesmo plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e encaminham operadores para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um módulo verificador minúsculo:

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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma sondagem barata de autenticação do tipo sim/não antes de o plugin completo de canal carregar. O export alvo deve ser uma função pequena que leia apenas o estado persistido; não o encaminhe pelo barrel completo de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de estado configurado apenas por env:

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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras entradas mínimas que não sejam de runtime. Se a verificação precisar da resolução completa da configuração ou do runtime real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos de JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os esquemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*` devem referenciar IDs de plugin **detectáveis**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema quebrado ou ausente, a validação falhará e o Doctor reportará o erro do plugin.
- Se existir configuração de plugin, mas o plugin estiver **desabilitado**, a configuração será mantida e um **aviso** será exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto é apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas à direita e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas os campos de manifesto documentados são lidos pelo carregador de manifesto. Evite adicionar aqui chaves personalizadas de nível superior.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de autenticação, validação de marcadores de env e superfícies semelhantes de autenticação de provider que não devem iniciar o runtime do plugin apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provider reutilizem as variáveis de ambiente de autenticação, perfis de autenticação, autenticação baseada em configuração e a escolha de onboarding de chave de API de outro provider sem codificar rigidamente essa relação no núcleo.
- `providerEndpoints` permite que plugins de provider sejam donos de metadados simples de correspondência de host/baseUrl de endpoint. Use-o apenas para classes de endpoint que o núcleo já oferece suporte; o plugin continua sendo dono do comportamento de runtime.
- `syntheticAuthRefs` é o caminho barato de metadados para hooks de autenticação sintética pertencentes ao provider que precisam ficar visíveis para a descoberta fria de modelos antes de o registro de runtime existir. Liste apenas referências cujo provider de runtime ou backend CLI realmente implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho barato de metadados para chaves de API placeholder pertencentes a plugins empacotados, como marcadores de credencial local, OAuth ou ambiente.
  O núcleo trata esses valores como não secretos para exibição de autenticação e auditorias de segredo sem codificar rigidamente o provider proprietário.
- `channelEnvVars` é o caminho barato de metadados para fallback de env de shell, prompts de setup e superfícies semelhantes de canal que não devem iniciar o runtime do plugin apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de autenticação, resolução de `--auth-choice`, mapeamento de provider preferido e registro simples de flags de CLI de onboarding antes de o runtime do provider carregar. Para metadados de assistente de runtime que exigem código do provider, consulte
  [Hooks de runtime de provider](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` embutido).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — introdução ao desenvolvimento de plugins
- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
