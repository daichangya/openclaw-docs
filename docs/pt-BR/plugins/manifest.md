---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa entregar um esquema de configuração de plugin ou depurar erros de validação de plugin
summary: Manifesto do Plugin + requisitos do esquema JSON (validação estrita de configuração)
title: Manifesto do Plugin
x-i18n:
    generated_at: "2026-04-22T05:34:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b80735690799682939e8c8c27b6a364caa3ceadcf6319155ddeb20eb0538c313
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto do Plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle do Codex: `.codex-plugin/plugin.json`
- Bundle do Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude sem manifesto
- Bundle do Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados em relação ao esquema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais as raízes de skill declaradas, as raízes de comando do Claude, os padrões de `settings.json` do bundle do Claude, os padrões de LSP do bundle do Claude e os pacotes de hook compatíveis quando o layout corresponde às expectativas de tempo de execução do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na **raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração **sem executar o código do plugin**. Manifestos ausentes ou inválidos são tratados como erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidade e a orientação atual de compatibilidade externa:
[Modelo de capacidade](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o tempo de execução do plugin
- dicas de ativação leves que as superfícies do plano de controle podem inspecionar antes de o tempo de execução ser carregado
- descritores de configuração leves que as superfícies de configuração/onboarding podem inspecionar antes de o tempo de execução ser carregado
- metadados de alias e autoativação que devem ser resolvidos antes de o tempo de execução do plugin ser carregado
- metadados abreviados de propriedade de família de modelos que devem autoativar o plugin antes de o tempo de execução ser carregado
- snapshots estáticos de propriedade de capacidade usados para a integração de compatibilidade agrupada e cobertura de contrato
- metadados leves do executor de QA que o host compartilhado `openclaw qa` pode inspecionar antes de o tempo de execução do plugin ser carregado
- metadados de configuração específicos de canal que devem ser mesclados às superfícies de catálogo e validação sem carregar o tempo de execução
- dicas de UI de configuração

Não o use para:

- registrar comportamento de tempo de execução
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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                              |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Sim         | `string`                         | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                       | Sim         | `object`                         | Esquema JSON inline para a configuração deste plugin.                                                                                                                                                        |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin agrupado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão.                                                 |
| `legacyPluginIds`                    | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                 |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                             |
| `channels`                           | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                                                |
| `providers`                          | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                                                |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto usados para carregar automaticamente o plugin antes do tempo de execução.                                                              |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint pertencentes ao manifesto para rotas de provedor que o núcleo precisa classificar antes de o tempo de execução do provedor ser carregado.                            |
| `cliBackends`                        | Não         | `string[]`                       | IDs de backends de inferência da CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas na configuração.                                              |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend de CLI cujo hook de autenticação sintética pertencente ao plugin deve ser verificado durante a descoberta fria de modelos antes de o tempo de execução ser carregado.   |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de chave de API de placeholder pertencentes a plugins agrupados que representam estado de credencial não secreta local, OAuth ou do ambiente.                                                      |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comandos pertencentes a este plugin que devem produzir configuração com reconhecimento do plugin e diagnósticos de CLI antes de o tempo de execução ser carregado.                                |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados leves de variáveis de ambiente de autenticação de provedor que o OpenClaw pode inspecionar sem carregar o código do plugin.                                                                      |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | IDs de provedores que devem reutilizar outro ID de provedor para busca de autenticação, por exemplo, um provedor de codificação que compartilha a chave de API do provedor base e perfis de autenticação. |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de variáveis de ambiente de canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use isto para superfícies de autenticação ou configuração de canal baseadas em env que auxiliares genéricos de inicialização/configuração devem ver. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e ligação simples de flags da CLI.                                                               |
| `activation`                         | Não         | `object`                         | Dicas leves de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o tempo de execução do plugin continua sendo responsável pelo comportamento real.    |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o tempo de execução do plugin.                                                    |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de executores de QA usados pelo host compartilhado `openclaw qa` antes de o tempo de execução do plugin ser carregado.                                                                   |
| `contracts`                          | Não         | `object`                         | Snapshot estático de capacidade agrupada para fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagem, geração de música, geração de vídeo, busca web, pesquisa na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de compreensão de mídia para IDs de provedores declarados em `contracts.mediaUnderstandingProviders`.                                                                                         |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes de o tempo de execução ser carregado.                                               |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                                        |
| `name`                               | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                      |
| `description`                        | Não         | `string`                         | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                              |
| `version`                            | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                |
| `uiHints`                            | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                            |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o tempo de execução do provedor ser carregado.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                             |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para o qual deve encaminhar.                                                 |
| `choiceId`            | Sim         | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                           |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                      |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados primeiro em seletores interativos orientados pelo assistente.               |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, mas ainda permite seleção manual pela CLI.                 |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar usuários para esta escolha de substituição.                 |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                  |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                        |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                            |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                         |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção da CLI, como `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                          |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin é dono de um nome de comando em tempo de execução que os usuários podem, por engano, colocar em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw usa esses metadados para diagnósticos sem importar o código de tempo de execução do plugin.

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

| Campo        | Obrigatório | Tipo              | O que significa                                                               |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                                   |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat em vez de um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz relacionado da CLI a sugerir para operações de CLI, se existir.  |

## Referência de `activation`

Use `activation` quando o plugin puder declarar de forma leve quais eventos do plano de controle devem ativá-lo mais tarde.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribuir com um ou mais executores de transporte sob a raiz compartilhada `openclaw qa`. Mantenha esses metadados leves e estáticos; o tempo de execução do plugin continua sendo responsável pelo registro real da CLI por meio de uma superfície leve `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a faixa de QA ao vivo do Matrix com suporte de Docker em um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                      |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.          |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

Este bloco contém apenas metadados. Ele não registra comportamento de tempo de execução e não substitui `register(...)`, `setupEntry` ou outros entrypoints de tempo de execução/plugin. Os consumidores atuais o usam como uma dica de refinamento antes de um carregamento mais amplo de plugins, então a ausência de metadados de ativação normalmente só custa desempenho; não deve alterar a correção enquanto os fallbacks legados de propriedade no manifesto ainda existirem.

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

- o planejamento da CLI acionado por comando usa como fallback `commandAliases[].cliCommand` ou `commandAliases[].name` legados
- o planejamento de configuração/canal acionado por canal usa como fallback a propriedade legada `channels[]` quando faltam metadados explícitos de ativação de canal
- o planejamento de configuração/tempo de execução acionado por provedor usa como fallback a propriedade legada `providers[]` e `cliBackends[]` de nível superior quando faltam metadados explícitos de ativação de provedor

## Referência de `setup`

Use `setup` quando as superfícies de configuração e onboarding precisarem de metadados leves pertencentes ao plugin antes de o tempo de execução ser carregado.

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

`cliBackends` de nível superior continua válido e segue descrevendo backends de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de configuração para fluxos de configuração/plano de controle que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida de busca com descritor em primeiro lugar para descoberta de configuração. Se o descritor apenas restringir o plugin candidato e a configuração ainda precisar de hooks de tempo de execução mais ricos no momento da configuração, defina `requiresRuntime: true` e mantenha `setup-api` como caminho de execução de fallback.

Como a busca de configuração pode executar código `setup-api` pertencente ao plugin, os valores normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                     |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Sim         | `string`   | ID do provedor exposto durante configuração ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não         | `string[]` | IDs de métodos de configuração/autenticação que este provedor suporta sem carregar o tempo de execução completo. |
| `envVars`     | Não         | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes de o tempo de execução do plugin ser carregado. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de configuração de provedor expostos durante configuração e onboarding.                  |
| `cliBackends`      | Não         | `string[]` | IDs de backend em tempo de configuração usados para busca com descritor em primeiro lugar. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não         | `string[]` | IDs de migração de configuração pertencentes à superfície de configuração deste plugin.              |
| `requiresRuntime`  | Não         | `boolean`  | Se a configuração ainda precisa da execução de `setup-api` após a busca por descritor.              |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campos de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para solicitações do OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                          |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Rótulo do campo voltado ao usuário.      |
| `help`        | `string`   | Texto curto de ajuda.                    |
| `tags`        | `string[]` | Tags opcionais de UI.                    |
| `advanced`    | `boolean`  | Marca o campo como avançado.             |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível.  |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode ler sem importar o tempo de execução do plugin.

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

| Campo                            | Tipo       | O que significa                                               |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este plugin. |
| `webFetchProviders`              | `string[]` | IDs de provedores de busca web pertencentes a este plugin.    |
| `webSearchProviders`             | `string[]` | IDs de provedores de pesquisa na web pertencentes a este plugin. |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato agrupado. |

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver modelos padrão, prioridade de fallback automático de autenticação ou suporte nativo a documentos que auxiliares genéricos do núcleo precisem antes de o tempo de execução ser carregado. As chaves também devem ser declaradas em `contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Cada entrada de provedor pode incluir:

| Campo                  | Tipo                                | O que significa                                                             |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor.                            |
| `defaultModels`        | `Record<string, string>`            | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores são ordenados primeiro para fallback automático de provedor com base em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas de documento nativas compatíveis com o provedor.                   |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes de o tempo de execução ser carregado.

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
      "description": "Conexão com homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal pode incluir:

| Campo         | Tipo                     | O que significa                                                                        |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos de UI/placeholders/dicas de sensibilidade opcionais para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado às superfícies de seletor e inspeção quando os metadados de tempo de execução não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                      |
| `preferOver`  | `string[]`               | IDs de plugins legados ou de menor prioridade que este canal deve superar nas superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o tempo de execução do plugin ser carregado.

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
- se um plugin não agrupado e um plugin agrupado corresponderem, o plugin não agrupado vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em relação a IDs abreviados de modelo. |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em relação a IDs abreviados de modelo após a remoção do sufixo de perfil. |

As chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal do manifesto não trata mais esses campos de nível superior como propriedade de capacidade.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes de o código do plugin ser executado |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza de onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se ele for sobre empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-o em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin pré-tempo de execução ficam intencionalmente em `package.json` sob o bloco `openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin. Deve permanecer dentro do diretório do pacote do plugin.                                                                                     |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de tempo de execução JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                   |
| `openclaw.setupEntry`                                             | Entrypoint leve somente de configuração usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o entrypoint JavaScript compilado de configuração para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                        |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                          |
| `openclaw.channel.configuredState`                                | Metadados leves do verificador de estado configurado que podem responder “a configuração somente por env já existe?” sem carregar o tempo de execução completo do canal.           |
| `openclaw.channel.persistedAuthState`                             | Metadados leves do verificador de autenticação persistida que podem responder “já existe algo autenticado?” sem carregar o tempo de execução completo do canal.                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins agrupados e publicados externamente.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando há várias fontes de instalação disponíveis.                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin agrupado quando a configuração é inválida.                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de configuração sejam carregadas antes do plugin de canal completo durante a inicialização.                                                |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, fazem o plugin ser ignorado em hosts mais antigos.

Plugins de canal devem fornecer `openclaw.setupEntry` quando verificações de status, lista de canais ou SecretRef precisarem identificar contas configuradas sem carregar o tempo de execução completo. A entrada de configuração deve expor metadados do canal mais adaptadores seguros para configuração, status e segredos; mantenha clientes de rede, listeners do Gateway e tempos de execução de transporte no entrypoint principal da extensão.

Campos de entrypoint de tempo de execução não substituem verificações de limite de pacote para campos de entrypoint de código-fonte. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável um caminho `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não torna instaláveis configurações arbitrariamente quebradas. Hoje, ele permite apenas que fluxos de instalação se recuperem de falhas específicas e obsoletas de upgrade de plugin agrupado, como um caminho ausente de plugin agrupado ou uma entrada `channels.<id>` obsoleta para esse mesmo plugin agrupado. Erros de configuração não relacionados continuam bloqueando a instalação e encaminham os operadores para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um módulo verificador mínimo:

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

Use isso quando fluxos de configuração, doctor ou estado configurado precisarem de uma sondagem leve de autenticação sim/não antes de o plugin de canal completo ser carregado. A exportação de destino deve ser uma função pequena que leia apenas o estado persistido; não a encaminhe pelo barrel completo de tempo de execução do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações leves de estado configurado apenas por env:

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

Use isso quando um canal puder responder ao estado configurado a partir de env ou outras entradas mínimas que não dependam de tempo de execução. Se a verificação precisar de resolução completa de configuração ou do tempo de execução real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência de descoberta (IDs de plugin duplicados)

O OpenClaw descobre plugins a partir de várias raízes (agrupados, instalação global, workspace, caminhos explícitos selecionados na configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** será mantido; duplicatas de menor precedência serão descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Agrupado** — plugins enviados com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou desatualizada de um plugin agrupado que esteja no workspace não substituirá a versão agrupada.
- Para realmente substituir um plugin agrupado por um local, fixe-o via `plugins.entries.<id>` para que ele vença pela precedência, em vez de depender da descoberta no workspace.
- Descartes por duplicidade são registrados em log para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos do esquema JSON

- **Todo plugin deve incluir um esquema JSON**, mesmo que não aceite nenhuma configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Os esquemas são validados no momento de leitura/gravação da configuração, não em tempo de execução.

## Comportamento de validação

- Chaves `channels.*` desconhecidas são **erros**, a menos que o ID do canal seja declarado por um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*` devem referenciar IDs de plugin **descobertos**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema ausente ou quebrado, a validação falhará e o Doctor reportará o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração será mantida e um **aviso** será exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O tempo de execução ainda carrega o módulo do plugin separadamente; o manifesto é apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas à direita e chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas os campos de manifesto documentados são lidos pelo carregador de manifesto. Evite adicionar aqui chaves personalizadas de nível superior.
- `providerAuthEnvVars` é o caminho leve de metadados para sondagens de autenticação, validação de marcadores de env e superfícies semelhantes de autenticação de provedor que não devem iniciar o tempo de execução do plugin apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis de ambiente de autenticação, perfis de autenticação, autenticação baseada em configuração e escolha de onboarding de chave de API de outro provedor sem codificar rigidamente essa relação no núcleo.
- `providerEndpoints` permite que plugins de provedor sejam donos de metadados simples de correspondência de host/baseUrl de endpoint. Use isso apenas para classes de endpoint que o núcleo já suporta; o plugin continua sendo responsável pelo comportamento de tempo de execução.
- `syntheticAuthRefs` é o caminho leve de metadados para hooks de autenticação sintética pertencentes ao provedor que precisam estar visíveis para a descoberta fria de modelos antes que o registro de tempo de execução exista. Liste apenas referências cujo provedor de tempo de execução ou backend de CLI realmente implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho leve de metadados para chaves de API placeholder pertencentes a plugins agrupados, como marcadores de credenciais locais, OAuth ou do ambiente. O núcleo trata isso como não segredo para exibição de autenticação e auditorias de segredos, sem codificar rigidamente o provedor proprietário.
- `channelEnvVars` é o caminho leve de metadados para fallback de env do shell, prompts de configuração e superfícies de canal semelhantes que não devem iniciar o tempo de execução do plugin apenas para inspecionar nomes de env. Nomes de env são metadados, não ativação por si só: status, auditoria, validação de entrega de Cron e outras superfícies somente leitura ainda aplicam a política de confiança do plugin e de ativação efetiva antes de tratar uma variável de ambiente como um canal configurado.
- `providerAuthChoices` é o caminho leve de metadados para seletores de escolha de autenticação, resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples de flags de CLI de onboarding antes de o tempo de execução do provedor ser carregado. Para metadados de assistente em tempo de execução que exigem código do provedor, consulte [Hooks de tempo de execução do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por meio de `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` interno).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — primeiros passos com plugins
- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
