---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um schema de configuração do Plugin ou depurar erros de validação do Plugin
summary: Manifesto do Plugin + requisitos do schema JSON (validação estrita de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto do Plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifesto nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, veja [Bundles de Plugin](/pt-BR/plugins/bundles).

Os formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados em relação ao schema de `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle, além das raízes de Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle do Claude, padrões de LSP do bundle do Claude e pacotes de hooks compatíveis quando o layout corresponde às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na **raiz do Plugin**. O OpenClaw usa esse manifesto para validar a configuração **sem executar código do Plugin**. Manifestos ausentes ou inválidos são tratados como erros de Plugin e bloqueiam a validação da configuração.

Veja o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código do seu Plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o runtime do plugin
- dicas baratas de ativação que superfícies do plano de controle podem inspecionar antes de o runtime ser carregado
- descritores baratos de configuração que superfícies de setup/onboarding podem inspecionar antes de o runtime ser carregado
- metadados de alias e autoativação que devem ser resolvidos antes de o runtime do plugin ser carregado
- metadados abreviados de propriedade de famílias de modelos que devem autoativar o plugin antes de o runtime ser carregado
- snapshots estáticos de propriedade de capacidades usados para wiring de compatibilidade de bundles e cobertura de contrato
- metadados baratos do executor de QA que o host compartilhado `openclaw qa` pode inspecionar antes de o runtime do plugin ser carregado
- metadados de configuração específicos de canais que devem ser mesclados em superfícies de catálogo e validação sem carregar o runtime
- dicas de UI de configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses pertencem ao código do seu Plugin e ao `package.json`.

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
| `configSchema`                      | Sim         | `object`                         | JSON Schema embutido para a configuração deste plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin empacotado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                               |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico do plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                |
| `providers`                         | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                       |
| `providerEndpoints`                 | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o core precisa classificar antes de o runtime do provedor ser carregado.                                        |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas na configuração.                                              |
| `syntheticAuthRefs`                 | Não         | `string[]`                       | Referências de provedor ou backend de CLI cujo hook de autenticação sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelos antes de o runtime ser carregado.               |
| `nonSecretAuthMarkers`              | Não         | `string[]`                       | Valores de chave de API de placeholder pertencentes a plugins empacotados que representam estado não secreto local, OAuth ou de credenciais do ambiente.                                                   |
| `commandAliases`                    | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir configuração e diagnósticos de CLI com reconhecimento do plugin antes de o runtime ser carregado.                                           |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados simples de env para autenticação de provedor que o OpenClaw pode inspecionar sem carregar código do plugin.                                                                                      |
| `providerAuthAliases`               | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para busca de autenticação, por exemplo, um provedor de coding que compartilha a chave de API e os perfis de autenticação do provedor base.   |
| `channelEnvVars`                    | Não         | `Record<string, string[]>`       | Metadados simples de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para superfícies de setup ou autenticação de canal orientadas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados simples de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e associação simples de flags de CLI.                                                          |
| `activation`                        | Não         | `object`                         | Dicas simples de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin continua sendo o dono do comportamento real.                  |
| `setup`                             | Não         | `object`                         | Descritores simples de setup/onboarding que superfícies de descoberta e setup podem inspecionar sem carregar o runtime do plugin.                                                                          |
| `qaRunners`                         | Não         | `object[]`                       | Descritores simples de executores de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do plugin ser carregado.                                                                           |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades empacotadas para fala, transcrição em tempo real, voz em tempo real, media-understanding, geração de imagem, geração de música, geração de vídeo, web-fetch, busca na web e propriedade de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados em superfícies de descoberta e validação antes de o runtime ser carregado.                                                         |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                      |
| `description`                       | Não         | `string`                         | Resumo curto mostrado em superfícies do plugin.                                                                                                                                                              |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                      |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                        |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para o qual encaminhar.                                                 |
| `choiceId`            | Sim         | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e CLI.                         |
| `choiceLabel`         | Não         | `string`                                        | Rótulo exibido ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                     |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                 |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.            |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite a seleção manual pela CLI.          |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar os usuários para esta escolha de substituição.        |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                             |
| `groupLabel`          | Não         | `string`                                        | Rótulo exibido ao usuário para esse grupo.                                                           |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                   |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                       |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                    |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                     |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin é dono de um nome de comando de runtime que os usuários podem, por engano,
colocar em `plugins.allow` ou tentar executar como um comando de CLI raiz. O OpenClaw
usa esses metadados para diagnósticos sem importar código de runtime do plugin.

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
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat em vez de um comando CLI raiz. |
| `cliCommand` | Não         | `string`          | Comando CLI raiz relacionado a ser sugerido para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin pode declarar de forma barata quais eventos do plano de controle
devem ativá-lo mais tarde.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribui com um ou mais executores de transporte sob a raiz compartilhada `openclaw qa`.
Mantenha esses metadados simples e estáticos; o runtime do plugin continua sendo o dono do registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a trilha de QA ao vivo do Matrix com Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.         |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

Este bloco é apenas metadados. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` ou outros entrypoints de runtime/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo do plugin, então
a ausência de metadados de ativação normalmente só custa desempenho; ela não deve
alterar a correção enquanto fallbacks legados de propriedade do manifesto ainda existirem.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                    |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Não         | `string[]`                                           | IDs de provedores que devem ativar este plugin quando solicitados. |
| `onCommands`     | Não         | `string[]`                                           | IDs de comandos que devem ativar este plugin.                      |
| `onChannels`     | Não         | `string[]`                                           | IDs de canais que devem ativar este plugin.                        |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem ativar este plugin.                        |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos atualmente:

- o planejamento da CLI acionado por comando usa como fallback
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de setup/canal acionado por canal usa como fallback a propriedade legada
  de `channels[]` quando os metadados explícitos de ativação de canal estão ausentes
- o planejamento de setup/runtime acionado por provedor usa como fallback a propriedade legada
  de `providers[]` e `cliBackends[]` no nível superior quando os metadados explícitos de ativação de provedor
  estão ausentes

## Referência de `setup`

Use `setup` quando superfícies de setup e onboarding precisarem de metadados simples pertencentes ao plugin
antes de o runtime ser carregado.

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

`cliBackends` no nível superior continua válido e segue descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de plano de controle/setup que devem permanecer apenas em metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferencial
baseada em descritores para busca de setup. Se o descritor apenas restringe o plugin candidato e o setup ainda precisa de hooks de runtime mais ricos no momento do setup,
defina `requiresRuntime: true` e mantenha `setup-api` no lugar como
caminho de execução de fallback.

Como a busca de setup pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre
os plugins descobertos. Propriedade ambígua falha de forma segura em vez de escolher um
vencedor com base na ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sim         | `string`   | ID do provedor exposto durante setup ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de métodos de setup/autenticação que este provedor oferece suporte sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de setup/status podem verificar antes de o runtime do plugin ser carregado. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                               |
| `cliBackends`      | Não         | `string[]` | IDs de backend usados em tempo de setup para busca baseada em descritores. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de setup deste plugin.                    |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa da execução de `setup-api` após a busca por descritor.                    |

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

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo exibido ao usuário.     |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidades que o OpenClaw pode
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

| Campo                            | Tipo       | O que significa                                                 |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este plugin.           |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de media-understanding pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de provedores de web-fetch pertencentes a este plugin.      |
| `webSearchProviders`             | `string[]` | IDs de provedores de busca na web pertencentes a este plugin.   |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato de bundles. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados simples de configuração antes de o runtime ser carregado.

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
      "description": "Conexão com homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                          |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado em superfícies de seleção e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                        |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin
ser carregado.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados do manifesto `providers` do proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos comparados com `startsWith` em relação a IDs abreviados de modelo.      |
| `modelPatterns` | `string[]` | Fontes de regex comparadas com IDs abreviados de modelo após a remoção do sufixo do perfil. |

Chaves legadas de capacidade no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos servem para tarefas diferentes:

| Arquivo                | Use para                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde uma parte dos metadados deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-la antes de carregar o código do plugin, coloque-a em `openclaw.plugin.json`
- se for sobre empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-a em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin pré-runtime intencionalmente ficam em `package.json`, no bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                                                                       |
| `openclaw.setupEntry`                                             | Entrypoint leve somente para setup usado durante onboarding e inicialização adiada de canal.                                                |
| `openclaw.channel`                                                | Metadados simples de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                |
| `openclaw.channel.configuredState`                                | Metadados leves de verificação de estado configurado que podem responder “já existe configuração apenas por env?” sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificação de autenticação persistida que podem responder “já existe algo conectado?” sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.                                                         |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando múltiplas fontes de instalação estão disponíveis.                                                     |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin empacotado quando a configuração é inválida.                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de setup sejam carregadas antes do plugin de canal completo durante a inicialização.              |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos.
Valores inválidos são rejeitados; valores mais novos, porém válidos, ignoram o
plugin em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele
não torna configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que
fluxos de instalação se recuperem de falhas específicas e obsoletas de upgrade de plugin empacotado, como um
caminho ausente para o plugin empacotado ou uma entrada `channels.<id>` obsoleta para esse mesmo
plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e encaminham os operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um pequeno
módulo verificador:

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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma
sondagem simples de autenticação sim/não antes de o plugin de canal completo ser carregado. A exportação de destino deve ser uma pequena
função que apenas leia o estado persistido; não a encaminhe pelo barrel completo
do runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações simples
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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras
entradas pequenas que não dependam de runtime. Se a verificação precisar da resolução completa da configuração ou do runtime real
do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Requisitos do JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que ele não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor relata o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Veja [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para Plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final continue sendo um objeto.
- Apenas os campos de manifesto documentados são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho de metadados simples para sondagens de autenticação, validação
  de marcadores de env e superfícies semelhantes de autenticação de provedor que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis de ambiente de autenticação,
  perfis de autenticação, autenticação baseada em configuração e a escolha de onboarding por chave de API
  de outro provedor sem codificar rigidamente essa relação no core.
- `providerEndpoints` permite que plugins de provedor sejam donos de metadados simples de correspondência
  de host/baseUrl de endpoint. Use isso apenas para classes de endpoint que o core já suporta;
  o plugin continua sendo o dono do comportamento de runtime.
- `syntheticAuthRefs` é o caminho de metadados simples para hooks de autenticação sintética pertencentes ao provedor
  que precisam estar visíveis para a descoberta fria de modelos antes que o registro de runtime exista.
  Liste apenas referências cujo provedor de runtime ou backend de CLI realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho de metadados simples para chaves de API placeholder pertencentes a plugins empacotados,
  como marcadores de credenciais locais, OAuth ou do ambiente.
  O core trata esses valores como não secretos para exibição de autenticação e auditorias de segredo sem
  codificar rigidamente o provedor proprietário.
- `channelEnvVars` é o caminho de metadados simples para fallback por env do shell, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho de metadados simples para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples
  de flags de CLI de onboarding antes de o runtime do provedor ser carregado. Para metadados de assistente de runtime
  que exigem código do provedor, veja
  [Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` integrado).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — introdução aos plugins
- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
