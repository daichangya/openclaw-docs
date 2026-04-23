---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um esquema de configuração do plugin ou depurar erros de validação de plugin
summary: Manifest do Plugin + requisitos de esquema JSON (validação estrita de configuração)
title: Manifest do Plugin
x-i18n:
    generated_at: "2026-04-23T05:40:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da8ce35aca4c12bf49a4c3e352fb7fc2b5768cb34157a00dabd247fe60b4f04
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest do Plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifest nativo de Plugin do OpenClaw**.

Para layouts de bundle compatíveis, veja [Bundles de Plugin](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifest diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente Claude
  sem um manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao esquema de `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais raízes de
Skill declaradas, raízes de comando Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo Plugin nativo do OpenClaw **deve** fornecer um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifest para validar a configuração
**sem executar o código do plugin**. Manifests ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Veja o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de auth e onboarding que devem estar disponíveis sem iniciar o runtime do plugin
- dicas baratas de ativação que superfícies do plano de controle podem inspecionar antes de o runtime
  ser carregado
- descritores baratos de configuração que superfícies de configuração/onboarding podem inspecionar antes de o
  runtime ser carregado
- metadados de alias e auto-habilitação que devem ser resolvidos antes de o runtime do plugin ser carregado
- metadados abreviados de propriedade de família de modelo que devem autoativar o
  plugin antes de o runtime ser carregado
- snapshots estáticos de propriedade de capacidade usados para compat wiring empacotado e
  cobertura de contrato
- metadados baratos do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
  antes de o runtime do plugin ser carregado
- metadados de configuração específicos de canal que devem ser mesclados em superfícies de catálogo e
  validação sem carregar o runtime
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

## Exemplo avançado

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

| Campo | Obrigatório | Tipo | O que significa |
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | Sim | `string` | ID canônico do plugin. Este é o ID usado em `plugins.entries.<id>`. |
| `configSchema` | Sim | `object` | Esquema JSON inline para a configuração deste plugin. |
| `enabledByDefault` | Não | `true` | Marca um plugin empacotado como habilitado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desabilitado por padrão. |
| `legacyPluginIds` | Não | `string[]` | IDs legados que são normalizados para este ID canônico de plugin. |
| `autoEnableWhenConfiguredProviders` | Não | `string[]` | IDs de provedor que devem auto-habilitar este plugin quando auth, configuração ou referências de modelo os mencionarem. |
| `kind` | Não | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`. |
| `channels` | Não | `string[]` | IDs de canal pertencentes a este plugin. Usado para descoberta e validação de configuração. |
| `providers` | Não | `string[]` | IDs de provedor pertencentes a este plugin. |
| `modelSupport` | Não | `object` | Metadados abreviados de família de modelo pertencentes ao manifest usados para carregar automaticamente o plugin antes do runtime. |
| `providerEndpoints` | Não | `object[]` | Metadados pertencentes ao manifest sobre host/baseUrl de endpoint para rotas de provedor que o core precisa classificar antes de o runtime do provedor ser carregado. |
| `cliBackends` | Não | `string[]` | IDs de backend de inferência CLI pertencentes a este plugin. Usado para autoativação na inicialização a partir de referências explícitas de configuração. |
| `syntheticAuthRefs` | Não | `string[]` | Referências de provedor ou backend CLI cujo hook de auth sintética pertencente ao plugin deve ser sondado durante a descoberta fria de modelo antes de o runtime ser carregado. |
| `nonSecretAuthMarkers` | Não | `string[]` | Valores de placeholder de chave de API pertencentes a plugin empacotado que representam estado de credencial local, OAuth ou ambiente sem segredo. |
| `commandAliases` | Não | `object[]` | Nomes de comando pertencentes a este plugin que devem produzir diagnóstico de configuração e CLI com reconhecimento de plugin antes de o runtime ser carregado. |
| `providerAuthEnvVars` | Não | `Record<string, string[]>` | Metadados baratos de env de auth de provedor que o OpenClaw pode inspecionar sem carregar o código do plugin. |
| `providerAuthAliases` | Não | `Record<string, string>` | IDs de provedor que devem reutilizar outro ID de provedor para busca de auth, por exemplo um provedor de coding que compartilha a chave de API do provedor base e perfis de auth. |
| `channelEnvVars` | Não | `Record<string, string[]>` | Metadados baratos de env de canal que o OpenClaw pode inspecionar sem carregar o código do plugin. Use isto para superfícies de configuração ou auth de canal orientadas por env que helpers genéricos de inicialização/configuração devem enxergar. |
| `providerAuthChoices` | Não | `object[]` | Metadados baratos de escolha de auth para seletores de onboarding, resolução de provedor preferido e vínculo simples de flags CLI. |
| `activation` | Não | `object` | Dicas baratas de ativação para carregamento acionado por provedor, comando, canal, rota e capacidade. Apenas metadados; o runtime do plugin ainda é responsável pelo comportamento real. |
| `setup` | Não | `object` | Descritores baratos de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin. |
| `qaRunners` | Não | `object[]` | Descritores baratos de executor de QA usados pelo host compartilhado `openclaw qa` antes de o runtime do plugin ser carregado. |
| `contracts` | Não | `object` | Snapshot estático de capacidade empacotada para propriedade de fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagem, geração de música, geração de vídeo, web-fetch, busca na web e ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não | `Record<string, object>` | Padrões baratos de compreensão de mídia para IDs de provedor declarados em `contracts.mediaUnderstandingProviders`. |
| `channelConfigs` | Não | `Record<string, object>` | Metadados de configuração de canal pertencentes ao manifest mesclados em superfícies de descoberta e validação antes de o runtime ser carregado. |
| `skills` | Não | `string[]` | Diretórios de Skills para carregar, relativos à raiz do plugin. |
| `name` | Não | `string` | Nome legível do plugin. |
| `description` | Não | `string` | Resumo curto exibido em superfícies do plugin. |
| `version` | Não | `string` | Versão informativa do plugin. |
| `uiHints` | Não | `Record<string, object>` | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração. |

## Referência de `providerAuthChoices`

Cada entrada em `providerAuthChoices` descreve uma opção de onboarding ou auth.
O OpenClaw lê isso antes de o runtime do provedor ser carregado.

| Campo | Obrigatório | Tipo | O que significa |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | Sim | `string` | ID do provedor ao qual esta opção pertence. |
| `method` | Sim | `string` | ID do método de auth para encaminhamento. |
| `choiceId` | Sim | `string` | ID estável da opção de auth usado por fluxos de onboarding e CLI. |
| `choiceLabel` | Não | `string` | Rótulo visível ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback. |
| `choiceHint` | Não | `string` | Texto curto de ajuda para o seletor. |
| `assistantPriority` | Não | `number` | Valores menores aparecem antes em seletores interativos conduzidos pelo assistente. |
| `assistantVisibility` | Não | `"visible"` \| `"manual-only"` | Oculta a opção dos seletores do assistente, ainda permitindo seleção manual por CLI. |
| `deprecatedChoiceIds` | Não | `string[]` | IDs legados de opções que devem redirecionar usuários para esta opção substituta. |
| `groupId` | Não | `string` | ID opcional de grupo para agrupar opções relacionadas. |
| `groupLabel` | Não | `string` | Rótulo visível ao usuário para esse grupo. |
| `groupHint` | Não | `string` | Texto curto de ajuda para o grupo. |
| `optionKey` | Não | `string` | Chave de opção interna para fluxos simples de auth com uma única flag. |
| `cliFlag` | Não | `string` | Nome da flag CLI, como `--openrouter-api-key`. |
| `cliOption` | Não | `string` | Formato completo da opção CLI, como `--openrouter-api-key <key>`. |
| `cliDescription` | Não | `string` | Descrição usada na ajuda da CLI. |
| `onboardingScopes` | Não | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin possui um nome de comando em runtime que usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando CLI raiz. O OpenClaw
usa esses metadados para diagnósticos sem importar o código de runtime do plugin.

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

| Campo | Obrigatório | Tipo | O que significa |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | Sim | `string` | Nome do comando que pertence a este plugin. |
| `kind` | Não | `"runtime-slash"` | Marca o alias como um comando slash de chat em vez de um comando CLI raiz. |
| `cliCommand` | Não | `string` | Comando CLI raiz relacionado a ser sugerido para operações de CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem ativá-lo mais tarde.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribuir com um ou mais executores de transporte sob a
raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o runtime do plugin
continua sendo responsável pelo registro real na CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a faixa de QA ao vivo Matrix com suporte de Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo | Obrigatório | Tipo | O que significa |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sim | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`. |
| `description` | Não | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

Este bloco é apenas metadado. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` ou outros entrypoints de runtime/plugin.
Consumidores atuais o usam como uma dica de redução antes do carregamento mais amplo do plugin, portanto,
metadados de ativação ausentes normalmente só custam desempenho; eles não devem
alterar a correção enquanto os fallbacks legados de propriedade do manifest ainda existirem.

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

| Campo | Obrigatório | Tipo | O que significa |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders` | Não | `string[]` | IDs de provedor que devem ativar este plugin quando solicitados. |
| `onCommands` | Não | `string[]` | IDs de comando que devem ativar este plugin. |
| `onChannels` | Não | `string[]` | IDs de canal que devem ativar este plugin. |
| `onRoutes` | Não | `string[]` | Tipos de rota que devem ativar este plugin. |
| `onCapabilities` | Não | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capacidade usadas pelo planejamento de ativação do plano de controle. |

Consumidores ativos atuais:

- o planejamento de CLI acionado por comando usa fallback para o legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de configuração/canal acionado por canal usa fallback para a propriedade
  legada `channels[]` quando metadados explícitos de ativação de canal estão ausentes
- o planejamento de configuração/runtime acionado por provedor usa fallback para a propriedade
  legada `providers[]` e `cliBackends[]` de nível superior quando metadados explícitos de ativação de
  provedor estão ausentes

## Referência de `setup`

Use `setup` quando superfícies de configuração e onboarding precisarem de metadados baratos pertencentes ao plugin
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

`cliBackends` de nível superior continua válido e segue descrevendo
backends de inferência CLI. `setup.cliBackends` é a superfície de descritor específica de configuração para
fluxos de configuração/plano de controle que devem permanecer apenas em metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferida
de consulta orientada a descritor para descoberta de configuração. Se o descritor apenas
reduz o plugin candidato e a configuração ainda precisa de hooks de runtime mais ricos em tempo de configuração,
defina `requiresRuntime: true` e mantenha `setup-api` como o caminho de execução de
fallback.

Como a consulta de configuração pode executar código `setup-api` pertencente ao plugin, valores normalizados de
`setup.providers[].id` e `setup.cliBackends[]` devem permanecer únicos entre os
plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um
vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Campo | Obrigatório | Tipo | O que significa |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | Sim | `string` | ID do provedor exposto durante configuração ou onboarding. Mantenha IDs normalizados globalmente únicos. |
| `authMethods` | Não | `string[]` | IDs de método de configuração/auth que este provedor suporta sem carregar o runtime completo. |
| `envVars` | Não | `string[]` | Variáveis de ambiente que superfícies genéricas de configuração/status podem verificar antes de o runtime do plugin ser carregado. |

### Campos de `setup`

| Campo | Obrigatório | Tipo | O que significa |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | Não | `object[]` | Descritores de configuração de provedor expostos durante configuração e onboarding. |
| `cliBackends` | Não | `string[]` | IDs de backend em tempo de configuração usados para consulta orientada a descritor. Mantenha IDs normalizados globalmente únicos. |
| `configMigrations` | Não | `string[]` | IDs de migração de configuração pertencentes à superfície de configuração deste plugin. |
| `requiresRuntime` | Não | `boolean` | Se a configuração ainda precisa da execução de `setup-api` após a consulta do descritor. |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para requisições ao OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo | Tipo | O que significa |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | Rótulo de campo visível ao usuário. |
| `help` | `string` | Texto curto de ajuda. |
| `tags` | `string[]` | Tags opcionais de UI. |
| `advanced` | `boolean` | Marca o campo como avançado. |
| `sensitive` | `boolean` | Marca o campo como secreto ou sensível. |
| `placeholder` | `string` | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capacidade que o OpenClaw pode
ler sem importar o runtime do plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Campo | Tipo | O que significa |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | IDs de runtime embutido para os quais um plugin empacotado pode registrar factories. |
| `speechProviders` | `string[]` | IDs de provedor de fala que este plugin possui. |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedor de transcrição em tempo real que este plugin possui. |
| `realtimeVoiceProviders` | `string[]` | IDs de provedor de voz em tempo real que este plugin possui. |
| `mediaUnderstandingProviders` | `string[]` | IDs de provedor de compreensão de mídia que este plugin possui. |
| `imageGenerationProviders` | `string[]` | IDs de provedor de geração de imagem que este plugin possui. |
| `videoGenerationProviders` | `string[]` | IDs de provedor de geração de vídeo que este plugin possui. |
| `webFetchProviders` | `string[]` | IDs de provedor de web-fetch que este plugin possui. |
| `webSearchProviders` | `string[]` | IDs de provedor de busca na web que este plugin possui. |
| `tools` | `string[]` | Nomes de ferramentas do agente que este plugin possui para verificações de contrato empacotadas. |

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de compreensão de mídia tiver
modelos padrão, prioridade de fallback automática de auth ou suporte nativo a documentos que
helpers genéricos do core precisem antes de o runtime ser carregado. As chaves também devem ser declaradas em
`contracts.mediaUnderstandingProviders`.

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

| Campo | Tipo | O que significa |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | Capacidades de mídia expostas por este provedor. |
| `defaultModels` | `Record<string, string>` | Padrões de capacidade para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority` | `Record<string, number>` | Números menores aparecem antes no fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]` | Entradas de documento nativas compatíveis com o provedor. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes de o
runtime ser carregado.

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

| Campo | Tipo | O que significa |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | Esquema JSON para `channels.<id>`. Obrigatório para cada entrada de configuração de canal declarada. |
| `uiHints` | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label` | `string` | Rótulo do canal mesclado em superfícies de seletor e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string` | Descrição curta do canal para superfícies de inspeção e catálogo. |
| `preferOver` | `string[]` | IDs de plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provedor a partir de
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

- referências explícitas `provider/model` usam os metadados de manifest `providers` do proprietário
- `modelPatterns` têm precedência sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado
  vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo | Tipo | O que significa |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` contra IDs abreviados de modelo. |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas contra IDs abreviados de modelo após remover o sufixo do perfil. |

Chaves legadas de capacidade de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifest não trata mais esses campos de nível superior como
propriedade de capacidade.

## Manifest versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo | Use para |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de auth e dicas de UI que devem existir antes de o código do plugin ser executado |
| `package.json` | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, controle de instalação, configuração ou metadados de catálogo |

Se você não tiver certeza sobre onde uma informação deve ficar, use esta regra:

- se o OpenClaw precisa conhecê-la antes de carregar o código do plugin, coloque-a em `openclaw.plugin.json`
- se ela trata de empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-a em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin em pré-runtime intencionalmente ficam em `package.json` sob o
bloco `openclaw` em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo | O que significa |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | Declara entrypoints nativos de plugin. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeExtensions` | Declara entrypoints de runtime em JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.setupEntry` | Entrypoint leve apenas de configuração usado durante onboarding, inicialização adiada de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry` | Declara o entrypoint de configuração em JavaScript compilado para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.channel` | Metadados baratos de catálogo de canal como rótulos, caminhos de documentação, aliases e texto de seleção. |
| `openclaw.channel.configuredState` | Metadados leves do verificador de estado configurado que podem responder “a configuração somente por env já existe?” sem carregar o runtime completo do canal. |
| `openclaw.channel.persistedAuthState` | Metadados leves do verificador de auth persistida que podem responder “já existe algo autenticado?” sem carregar o runtime completo do canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | Dicas de instalação/atualização para plugins empacotados e publicados externamente. |
| `openclaw.install.defaultChoice` | Caminho de instalação preferido quando várias fontes de instalação estão disponíveis. |
| `openclaw.install.minHostVersion` | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`. |
| `openclaw.install.expectedIntegrity` | String de integridade esperada do dist npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido em relação a ela. |
| `openclaw.install.allowInvalidConfigRecovery` | Permite um caminho estreito de recuperação por reinstalação de plugin empacotado quando a configuração está inválida. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de configuração sejam carregadas antes do plugin completo do canal durante a inicialização. |

Os metadados do manifest decidem quais opções de provedor/canal/configuração aparecem no
onboarding antes de o runtime ser carregado. `package.json#openclaw.install` informa ao
onboarding como obter ou habilitar esse plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do registro
de manifests. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
plugin em hosts mais antigos.

A fixação exata da versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Combine isso com
`expectedIntegrity` quando quiser que fluxos de atualização falhem de forma fechada se o
artefato npm obtido não corresponder mais à versão fixada. O onboarding interativo só
oferece opções de instalação npm a partir de metadados confiáveis de catálogo quando `npmSpec` é uma
versão exata e `expectedIntegrity` está presente; caso contrário, ele usa fallback para uma
fonte local ou ignora.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de `SecretRef` precisarem identificar contas configuradas sem carregar o runtime
completo. O entrypoint de configuração deve expor metadados do canal mais adaptadores seguros para setup de
configuração, status e segredos; mantenha clientes de rede, listeners do gateway e
runtimes de transporte no entrypoint principal da extensão.

Campos de entrypoint de runtime não substituem verificações de limite de pacote para campos
de entrypoint de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar carregável
um caminho de escape em `openclaw.extensions`.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele
não torna instaláveis configurações arbitrariamente quebradas. Hoje ele só permite que fluxos de instalação
recuperem falhas específicas e antigas de upgrade de plugin empacotado, como um
caminho ausente de plugin empacotado ou uma entrada antiga `channels.<id>` para esse mesmo
plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e orientam operadores
para `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` é um metadado de pacote para um pequeno módulo verificador:

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

Use-o quando fluxos de setup, doctor ou estado configurado precisarem de uma sondagem barata de auth
sim/não antes de o plugin completo do canal ser carregado. A exportação alvo deve ser uma pequena
função que leia apenas o estado persistido; não a encaminhe pelo barrel completo de runtime
do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas de
estado configurado somente por env:

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

Use-o quando um canal puder responder ao estado configurado a partir de env ou de outras entradas
mínimas e fora do runtime. Se a verificação precisar de resolução completa de configuração ou do runtime
real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência de descoberta (IDs de plugin duplicados)

O OpenClaw descobre plugins de várias raízes (empacotados, instalação global, workspace, caminhos explicitamente selecionados na configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifest de **maior precedência** será mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado na configuração** — um caminho explicitamente fixado em `plugins.entries.<id>`
2. **Empacotado** — plugins enviados com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia derivada ou antiga de um plugin empacotado no workspace não substituirá a build empacotada.
- Para realmente substituir um plugin empacotado por um local, fixe-o via `plugins.entries.<id>` para que ele vença por precedência, em vez de depender da descoberta pelo workspace.
- Descartes por duplicidade são registrados em log para que o Doctor e os diagnósticos de inicialização possam apontar para a cópia descartada.

## Requisitos de JSON Schema

- **Todo plugin deve fornecer um JSON Schema**, mesmo que não aceite configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Esquemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifest de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **descobríveis**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifest ou esquema ausente ou quebrado,
  a validação falhará e o Doctor reportará o erro do plugin.
- Se existir configuração do plugin, mas o plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Veja [Referência de configuração](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifest é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos.
- O runtime ainda carrega o módulo do plugin separadamente; o manifest é apenas para
  descoberta + validação.
- Manifests nativos são analisados com JSON5, então comentários, vírgulas finais e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas campos de manifest documentados são lidos pelo carregador de manifest. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de auth, validação
  de marcadores de env e superfícies semelhantes de auth de provedor que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthAliases` permite que variantes de provedor reutilizem as variáveis de ambiente de auth,
  perfis de auth, auth apoiada em configuração e opção de onboarding por chave de API
  de outro provedor sem hardcoding dessa relação no core.
- `providerEndpoints` permite que plugins de provedor sejam proprietários de metadados simples de
  correspondência de host/baseUrl de endpoint. Use isso apenas para classes de endpoint que o core
  já suporta; o plugin continua sendo responsável pelo comportamento de runtime.
- `syntheticAuthRefs` é o caminho barato de metadados para hooks de auth sintética pertencentes ao provedor
  que precisam estar visíveis para descoberta fria de modelo antes de o registro de runtime
  existir. Liste apenas referências cujo provedor de runtime ou backend CLI realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` é o caminho barato de metadados para chaves de API placeholder pertencentes a
  plugin empacotado, como marcadores de credenciais locais, OAuth ou do ambiente.
  O core trata isso como não secreto para exibição de auth e auditorias de segredo sem
  hardcoding do provedor proprietário.
- `channelEnvVars` é o caminho barato de metadados para fallback por env do shell, prompts de setup
  e superfícies semelhantes de canal que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env. Nomes de env são metadados, não ativação por
  si só: status, auditoria, validação de entrega de Cron e outras superfícies somente leitura
  ainda aplicam política de confiança e ativação efetiva do plugin antes de
  tratar uma variável de ambiente como um canal configurado.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de auth,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples de flags CLI de onboarding
  antes de o runtime do provedor ser carregado. Para metadados de wizard em runtime
  que exigem código do provedor, veja
  [Hooks de runtime do provedor](/pt-BR/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` interno).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisar deles.
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — introdução aos plugins
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
