---
read_when:
    - Você está criando um Plugin do OpenClaw
    - Você precisa entregar um schema de configuração do plugin ou depurar erros de validação do plugin
summary: Manifesto de Plugin + requisitos do schema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-24T08:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Esta página é apenas para o **manifesto de plugin nativo do OpenClaw**.

Para layouts de bundles compatíveis, consulte [Plugin bundles](/pt-BR/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao schema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê metadados do bundle mais raízes de
Skills declaradas, raízes de comandos do Claude, padrões de `settings.json` do bundle Claude,
padrões de LSP do bundle Claude e pacotes de hooks compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/pt-BR/tools/plugin).
Para o modelo de capability nativo e a orientação atual sobre compatibilidade externa:
[Modelo de capability](/pt-BR/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê **antes de carregar o
código do seu plugin**. Tudo abaixo deve ser barato o suficiente para ser inspecionado sem inicializar
o runtime do plugin.

**Use-o para:**

- identidade do plugin, validação de configuração e dicas de UI de configuração
- metadados de autenticação, onboarding e configuração (alias, ativação automática, vars de ambiente do provedor, opções de autenticação)
- dicas de ativação para superfícies do plano de controle
- propriedade abreviada de família de modelos
- snapshots estáticos de propriedade de capability (`contracts`)
- metadados do executor de QA que o host compartilhado `openclaw qa` pode inspecionar
- metadados de configuração específicos de canal mesclados em catálogo e superfícies de validação

**Não o use para:** registrar comportamento de runtime, declarar pontos de entrada de código
ou metadados de instalação do npm. Isso pertence ao código do seu plugin e ao `package.json`.

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

| Campo                                | Obrigatório | Tipo                             | O que significa                                                                                                                                                                                                                   |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sim         | `string`                         | Id canônico do plugin. Este é o id usado em `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Sim         | `object`                         | Schema JSON inline para a configuração deste plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Não         | `true`                           | Marca um plugin incluído como ativado por padrão. Omita-o, ou defina qualquer valor diferente de `true`, para deixar o plugin desativado por padrão.                                                                            |
| `legacyPluginIds`                    | Não         | `string[]`                       | Ids legados que são normalizados para este id canônico do plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Não         | `string[]`                       | Ids de provedor que devem ativar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                                                                           |
| `kind`                               | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Não         | `string[]`                       | Ids de canal controlados por este plugin. Usado para descoberta e validação de configuração.                                                                                                                                      |
| `providers`                          | Não         | `string[]`                       | Ids de provedor controlados por este plugin.                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | Não         | `string`                         | Caminho de módulo leve de descoberta de provedor, relativo à raiz do plugin, para metadados de catálogo de provedor com escopo de manifesto que podem ser carregados sem ativar o runtime completo do plugin.                 |
| `modelSupport`                       | Não         | `object`                         | Metadados abreviados de família de modelos controlados pelo manifesto, usados para carregar automaticamente o plugin antes do runtime.                                                                                           |
| `providerEndpoints`                  | Não         | `object[]`                       | Metadados de host/baseUrl de endpoint controlados pelo manifesto para rotas de provedor que o core precisa classificar antes que o runtime do provedor seja carregado.                                                          |
| `cliBackends`                        | Não         | `string[]`                       | Ids de backend de inferência da CLI controlados por este plugin. Usado para ativação automática na inicialização a partir de referências explícitas de configuração.                                                              |
| `syntheticAuthRefs`                  | Não         | `string[]`                       | Referências de provedor ou backend da CLI cujo hook de autenticação sintética controlado pelo plugin deve ser sondado durante descoberta cold de modelo antes que o runtime seja carregado.                                      |
| `nonSecretAuthMarkers`               | Não         | `string[]`                       | Valores de placeholder de chave de API controlados por plugin incluído que representam estado não secreto local, OAuth ou de credenciais de ambiente.                                                                            |
| `commandAliases`                     | Não         | `object[]`                       | Nomes de comando controlados por este plugin que devem produzir diagnósticos de configuração e CLI com reconhecimento de plugin antes que o runtime seja carregado.                                                               |
| `providerAuthEnvVars`                | Não         | `Record<string, string[]>`       | Metadados leves de env de autenticação de provedor que o OpenClaw pode inspecionar sem carregar código do plugin.                                                                                                                |
| `providerAuthAliases`                | Não         | `Record<string, string>`         | Ids de provedor que devem reutilizar outro id de provedor para busca de autenticação, por exemplo um provedor de coding que compartilha a mesma chave de API e perfis de autenticação do provedor base.                         |
| `channelEnvVars`                     | Não         | `Record<string, string[]>`       | Metadados leves de env de canal que o OpenClaw pode inspecionar sem carregar código do plugin. Use isto para superfícies de configuração ou autenticação de canal baseadas em env que auxiliares genéricos de inicialização/configuração devam enxergar. |
| `providerAuthChoices`                | Não         | `object[]`                       | Metadados leves de opções de autenticação para seletores de onboarding, resolução de provedor preferido e integração simples de flags de CLI.                                                                                    |
| `activation`                         | Não         | `object`                         | Metadados leves do planejador de ativação para carregamento acionado por provedor, comando, canal, rota e capability. Apenas metadados; o runtime do plugin continua controlando o comportamento real.                          |
| `setup`                              | Não         | `object`                         | Descritores leves de configuração/onboarding que superfícies de descoberta e configuração podem inspecionar sem carregar o runtime do plugin.                                                                                    |
| `qaRunners`                          | Não         | `object[]`                       | Descritores leves de executor de QA usados pelo host compartilhado `openclaw qa` antes que o runtime do plugin seja carregado.                                                                                                   |
| `contracts`                          | Não         | `object`                         | Snapshot estático de capability incluída para hooks externos de autenticação, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de música, geração de vídeo, busca na web, pesquisa na web e propriedade de ferramentas. |
| `mediaUnderstandingProviderMetadata` | Não         | `Record<string, object>`         | Padrões leves de entendimento de mídia para ids de provedor declarados em `contracts.mediaUnderstandingProviders`.                                                                                                                |
| `channelConfigs`                     | Não         | `Record<string, object>`         | Metadados de configuração de canal controlados pelo manifesto, mesclados em superfícies de descoberta e validação antes que o runtime seja carregado.                                                                            |
| `skills`                             | Não         | `string[]`                       | Diretórios de Skills a carregar, relativos à raiz do plugin.                                                                                                                                                                      |
| `name`                               | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                                                           |
| `description`                        | Não         | `string`                         | Resumo curto exibido nas superfícies do plugin.                                                                                                                                                                                   |
| `version`                            | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                                                                 |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma opção de onboarding ou autenticação.
O OpenClaw lê isso antes que o runtime do provedor seja carregado.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sim         | `string`                                        | Id do provedor ao qual esta opção pertence.                                                               |
| `method`              | Sim         | `string`                                        | Id do método de autenticação para o qual encaminhar.                                                      |
| `choiceId`            | Sim         | `string`                                        | Id estável da opção de autenticação usado pelos fluxos de onboarding e CLI.                               |
| `choiceLabel`         | Não         | `string`                                        | Rótulo visível para o usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                      |
| `choiceHint`          | Não         | `string`                                        | Texto curto de ajuda para o seletor.                                                                      |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos conduzidos pelo assistente.                 |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a opção dos seletores do assistente, mas ainda permite seleção manual pela CLI.                   |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | Ids legados de opção que devem redirecionar usuários para esta opção de substituição.                    |
| `groupId`             | Não         | `string`                                        | Id opcional de grupo para agrupar opções relacionadas.                                                    |
| `groupLabel`          | Não         | `string`                                        | Rótulo visível para o usuário desse grupo.                                                                |
| `groupHint`           | Não         | `string`                                        | Texto curto de ajuda para o grupo.                                                                        |
| `optionKey`           | Não         | `string`                                        | Chave de opção interna para fluxos simples de autenticação com uma única flag.                            |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                         |
| `cliOption`           | Não         | `string`                                        | Formato completo da opção de CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                          |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta opção deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

## Referência de `commandAliases`

Use `commandAliases` quando um plugin controla um nome de comando de runtime que os usuários podem
colocar por engano em `plugins.allow` ou tentar executar como um comando raiz da CLI. O OpenClaw
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

| Campo        | Obrigatório | Tipo              | O que significa                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Sim         | `string`          | Nome do comando que pertence a este plugin.                               |
| `kind`       | Não         | `"runtime-slash"` | Marca o alias como um comando slash de chat, e não como um comando raiz da CLI. |
| `cliCommand` | Não         | `string`          | Comando raiz de CLI relacionado a sugerir para operações na CLI, se existir. |

## Referência de `activation`

Use `activation` quando o plugin puder declarar de forma barata quais eventos do plano de controle
devem incluí-lo em um plano de ativação/carregamento.

Este bloco é metadado do planejador, não uma API de ciclo de vida. Ele não registra
comportamento de runtime, não substitui `register(...)` e não promete que o
código do plugin já foi executado. O planejador de ativação usa esses campos para
restringir plugins candidatos antes de recorrer a metadados existentes de
propriedade no manifesto, como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks.

Prefira o metadado mais específico que já descreva a propriedade. Use
`providers`, `channels`, `commandAliases`, descritores de setup ou `contracts`
quando esses campos expressarem o relacionamento. Use `activation` para dicas extras do planejador
que não possam ser representadas por esses campos de propriedade.

Este bloco é apenas metadado. Ele não registra comportamento de runtime e não
substitui `register(...)`, `setupEntry` nem outros pontos de entrada de runtime/plugin.
Os consumidores atuais o usam como uma dica de restrição antes de um carregamento mais amplo de plugins, então a ausência de metadados de ativação normalmente afeta apenas o desempenho; ela não deve
alterar a correção enquanto os fallbacks legados de propriedade do manifesto ainda existirem.

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

| Campo            | Obrigatório | Tipo                                                 | O que significa                                                                                           |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Não         | `string[]`                                           | Ids de provedor que devem incluir este plugin em planos de ativação/carregamento.                         |
| `onCommands`     | Não         | `string[]`                                           | Ids de comando que devem incluir este plugin em planos de ativação/carregamento.                          |
| `onChannels`     | Não         | `string[]`                                           | Ids de canal que devem incluir este plugin em planos de ativação/carregamento.                            |
| `onRoutes`       | Não         | `string[]`                                           | Tipos de rota que devem incluir este plugin em planos de ativação/carregamento.                           |
| `onCapabilities` | Não         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Dicas amplas de capability usadas pelo planejamento de ativação do plano de controle. Prefira campos mais específicos quando possível. |

Consumidores live atuais:

- o planejamento da CLI acionado por comando recorre ao legado
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- o planejamento de configuração/canal acionado por canal recorre à propriedade legada `channels[]`
  quando faltam metadados explícitos de ativação de canal
- o planejamento de configuração/runtime acionado por provedor recorre à propriedade legada
  `providers[]` e `cliBackends[]` de nível superior quando faltam metadados explícitos
  de ativação de provedor

Os diagnósticos do planejador conseguem distinguir dicas explícitas de ativação de fallback de propriedade do manifesto. Por exemplo, `activation-command-hint` significa que
`activation.onCommands` correspondeu, enquanto `manifest-command-alias` significa que o
planejador usou a propriedade de `commandAliases`. Esses rótulos de motivo são para
diagnósticos do host e testes; autores de plugins devem continuar declarando os metadados
que melhor descrevem a propriedade.

## Referência de `qaRunners`

Use `qaRunners` quando um plugin contribuir com um ou mais executores de transporte abaixo
da raiz compartilhada `openclaw qa`. Mantenha esses metadados baratos e estáticos; o
runtime do plugin continua controlando o registro real da CLI por meio de uma superfície leve
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Executa a lane live QA do Matrix com suporte a Docker contra um homeserver descartável"
    }
  ]
}
```

| Campo         | Obrigatório | Tipo     | O que significa                                                      |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Sim         | `string` | Subcomando montado sob `openclaw qa`, por exemplo `matrix`.          |
| `description` | Não         | `string` | Texto de ajuda de fallback usado quando o host compartilhado precisa de um comando stub. |

## Referência de `setup`

Use `setup` quando superfícies de configuração e onboarding precisarem de metadados leves
controlados pelo plugin antes que o runtime seja carregado.

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

`cliBackends` de nível superior continua válido e continua descrevendo
backends de inferência da CLI. `setup.cliBackends` é a superfície de descritor específica de setup para
fluxos de setup/plano de controle que devem permanecer apenas como metadados.

Quando presentes, `setup.providers` e `setup.cliBackends` são a superfície preferencial
de busca baseada primeiro em descritor para descoberta de setup. Se o descritor apenas
restringir o plugin candidato e o setup ainda precisar de hooks de runtime mais ricos no momento da configuração, defina `requiresRuntime: true` e mantenha `setup-api` como o
caminho de execução de fallback.

Como a busca de setup pode executar código `setup-api` controlado pelo plugin, valores
normalizados de `setup.providers[].id` e `setup.cliBackends[]` devem permanecer exclusivos entre
plugins descobertos. Propriedade ambígua falha de forma fechada em vez de escolher um vencedor pela ordem de descoberta.

### Referência de `setup.providers`

| Campo         | Obrigatório | Tipo       | O que significa                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sim         | `string`   | Id do provedor exposto durante setup ou onboarding. Mantenha ids normalizados globalmente exclusivos. |
| `authMethods` | Não         | `string[]` | Ids de método de setup/autenticação que este provedor suporta sem carregar o runtime completo. |
| `envVars`     | Não         | `string[]` | Vars de ambiente que superfícies genéricas de setup/status podem verificar antes que o runtime do plugin seja carregado. |

### Campos de `setup`

| Campo              | Obrigatório | Tipo       | O que significa                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Não         | `object[]` | Descritores de setup de provedor expostos durante setup e onboarding.                                 |
| `cliBackends`      | Não         | `string[]` | Ids de backend em tempo de setup usados para busca baseada primeiro em descritor. Mantenha ids normalizados globalmente exclusivos. |
| `configMigrations` | Não         | `string[]` | Ids de migração de configuração controlados pela superfície de setup deste plugin.                    |
| `requiresRuntime`  | Não         | `boolean`  | Se o setup ainda precisa de execução de `setup-api` após a busca por descritor.                      |

## Referência de `uiHints`

`uiHints` é um mapa de nomes de campo de configuração para pequenas dicas de renderização.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chave de API",
      "help": "Usada para requisições do OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada dica de campo pode incluir:

| Campo         | Tipo       | O que significa                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Rótulo do campo visível para o usuário. |
| `help`        | `string`   | Texto curto de ajuda.                   |
| `tags`        | `string[]` | Tags opcionais de UI.                   |
| `advanced`    | `boolean`  | Marca o campo como avançado.            |
| `sensitive`   | `boolean`  | Marca o campo como secreto ou sensível. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulário. |

## Referência de `contracts`

Use `contracts` apenas para metadados estáticos de propriedade de capability que o OpenClaw pode
ler sem importar o runtime do plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Campo                            | Tipo       | O que significa                                                  |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ids de runtime embutido para os quais um plugin incluído pode registrar factories. |
| `externalAuthProviders`          | `string[]` | Ids de provedor cujo hook de perfil de autenticação externa este plugin controla. |
| `speechProviders`                | `string[]` | Ids de provedor de fala que este plugin controla.                |
| `realtimeTranscriptionProviders` | `string[]` | Ids de provedor de transcrição em tempo real que este plugin controla. |
| `realtimeVoiceProviders`         | `string[]` | Ids de provedor de voz em tempo real que este plugin controla.   |
| `memoryEmbeddingProviders`       | `string[]` | Ids de provedor de embedding de memória que este plugin controla. |
| `mediaUnderstandingProviders`    | `string[]` | Ids de provedor de entendimento de mídia que este plugin controla. |
| `imageGenerationProviders`       | `string[]` | Ids de provedor de geração de imagem que este plugin controla.   |
| `videoGenerationProviders`       | `string[]` | Ids de provedor de geração de vídeo que este plugin controla.    |
| `webFetchProviders`              | `string[]` | Ids de provedor de busca na web que este plugin controla.        |
| `webSearchProviders`             | `string[]` | Ids de provedor de pesquisa na web que este plugin controla.     |
| `tools`                          | `string[]` | Nomes de ferramentas de agente que este plugin controla para verificações de contrato de plugins incluídos. |

Plugins de provedor que implementam `resolveExternalAuthProfiles` devem declarar
`contracts.externalAuthProviders`. Plugins sem essa declaração ainda são executados
por um fallback de compatibilidade obsoleto, mas esse fallback é mais lento e
será removido após a janela de migração.

Provedores incluídos de embedding de memória devem declarar
`contracts.memoryEmbeddingProviders` para cada id de adaptador que expõem, incluindo
adaptadores integrados como `local`. Caminhos autônomos da CLI usam esse contrato de manifesto
para carregar apenas o plugin proprietário antes que o runtime completo do Gateway
registre os provedores.

## Referência de `mediaUnderstandingProviderMetadata`

Use `mediaUnderstandingProviderMetadata` quando um provedor de entendimento de mídia tiver
modelos padrão, prioridade de fallback de autenticação automática ou suporte nativo a documentos que
helpers genéricos do core precisem antes que o runtime seja carregado. As chaves também devem ser declaradas em
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

| Campo                  | Tipo                                | O que significa                                                             |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capabilities de mídia expostas por este provedor.                           |
| `defaultModels`        | `Record<string, string>`            | Padrões de capability para modelo usados quando a configuração não especifica um modelo. |
| `autoPriority`         | `Record<string, number>`            | Números menores vêm antes na ordenação para fallback automático de provedor baseado em credenciais. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entradas nativas de documento compatíveis com o provedor.                   |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados leves de configuração antes
que o runtime seja carregado.

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

| Campo         | Tipo                     | O que significa                                                                              |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo do canal mesclado nas superfícies de seletor e inspeção quando os metadados de runtime ainda não estiverem prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                            |
| `preferOver`  | `string[]`               | Ids de plugin legados ou de menor prioridade que este canal deve superar em superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw precisar inferir seu plugin de provedor a partir de
ids abreviados de modelo, como `gpt-5.5` ou `claude-sonnet-4.6`, antes que o runtime do plugin
seja carregado.

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
- se um plugin não incluído e um plugin incluído corresponderem ao mesmo tempo, o plugin não incluído vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em ids abreviados de modelo.          |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em ids abreviados de modelo após remoção do sufixo de perfil. |

Chaves legadas de capability de nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como
propriedade de capability.

## Manifesto versus package.json

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de opção de autenticação e dicas de UI que devem existir antes da execução do código do plugin |
| `package.json`         | Metadados do npm, instalação de dependências e o bloco `openclaw` usado para pontos de entrada, bloqueio de instalação, configuração ou metadados de catálogo |

Se não tiver certeza sobre onde um metadado deve ficar, use esta regra:

- se o OpenClaw precisar conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se estiver relacionado a empacotamento, arquivos de entrada ou comportamento de instalação do npm, coloque-o em `package.json`

### Campos de package.json que afetam a descoberta

Alguns metadados de plugin em tempo anterior ao runtime intencionalmente ficam em `package.json`, no bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara pontos de entrada de plugins nativos. Deve permanecer dentro do diretório do pacote do plugin.                                                                             |
| `openclaw.runtimeExtensions`                                      | Declara pontos de entrada de runtime JavaScript compilados para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                       |
| `openclaw.setupEntry`                                             | Ponto de entrada leve apenas de setup usado durante onboarding, inicialização diferida de canal e descoberta somente leitura de status de canal/SecretRef. Deve permanecer dentro do diretório do pacote do plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara o ponto de entrada compilado de setup em JavaScript para pacotes instalados. Deve permanecer dentro do diretório do pacote do plugin.                                      |
| `openclaw.channel`                                                | Metadados leves de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção.                                                                          |
| `openclaw.channel.configuredState`                                | Metadados leves de verificador de estado configurado que podem responder "já existe alguma configuração somente por env?" sem carregar o runtime completo do canal.                |
| `openclaw.channel.persistedAuthState`                             | Metadados leves de verificador de autenticação persistida que podem responder "já existe algo autenticado?" sem carregar o runtime completo do canal.                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins incluídos e publicados externamente.                                                                                                  |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias fontes de instalação estiverem disponíveis.                                                                                           |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.                                                                                               |
| `openclaw.install.expectedIntegrity`                              | String de integridade esperada do dist npm, como `sha512-...`; os fluxos de instalação e atualização verificam o artefato obtido com base nela.                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho restrito de recuperação por reinstalação de plugin incluído quando a configuração é inválida.                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal somente de setup sejam carregadas antes do plugin completo de canal durante a inicialização.                                                      |

Os metadados do manifesto decidem quais opções de provedor/canal/setup aparecem no
onboarding antes que o runtime seja carregado. `package.json#openclaw.install` informa ao
onboarding como buscar ou ativar esse plugin quando o usuário escolhe uma dessas
opções. Não mova dicas de instalação para `openclaw.plugin.json`.

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos. Valores inválidos são rejeitados; valores mais novos, mas válidos, ignoram o
plugin em hosts mais antigos.

A fixação exata de versão npm já fica em `npmSpec`, por exemplo
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entradas oficiais de catálogo externo
devem combinar especificações exatas com `expectedIntegrity`, para que os fluxos de atualização falhem de forma fechada se o artefato npm obtido não corresponder mais à versão fixada.
O onboarding interativo ainda oferece especificações npm confiáveis do registro, incluindo nomes puros
de pacote e dist-tags, por compatibilidade. Diagnósticos de catálogo podem
distinguir fontes exatas, flutuantes, fixadas por integridade e sem integridade.
Quando `expectedIntegrity` está presente, os fluxos de instalação/atualização o aplicam; quando
é omitido, a resolução do registro é registrada sem fixação de integridade.

Plugins de canal devem fornecer `openclaw.setupEntry` quando status, lista de canais
ou varreduras de SecretRef precisarem identificar contas configuradas sem carregar o runtime
completo. O ponto de entrada de setup deve expor metadados de canal, além de adaptadores seguros para setup de config,
status e secrets; mantenha clientes de rede, listeners de gateway e runtimes de transporte
no ponto de entrada principal da extensão.

Campos de ponto de entrada de runtime não substituem verificações de limite de pacote para
campos de ponto de entrada de origem. Por exemplo, `openclaw.runtimeExtensions` não pode tornar
carregável um caminho `openclaw.extensions` que escape do pacote.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna configurações arbitrariamente quebradas instaláveis. Hoje ele permite apenas que
fluxos de instalação recuperem falhas específicas e antigas de atualização de plugin incluído, como
um caminho ausente de plugin incluído ou uma entrada antiga `channels.<id>` para esse mesmo
plugin incluído. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam operadores
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

Use isso quando fluxos de setup, doctor ou estado configurado precisarem de uma sondagem barata de autenticação
sim/não antes de o plugin completo de canal ser carregado. A exportação de destino deve ser uma função pequena
que leia apenas o estado persistido; não a encaminhe pelo barrel completo
de runtime do canal.

`openclaw.channel.configuredState` segue o mesmo formato para verificações baratas
de estado configurado somente por env:

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

Use isso quando um canal puder responder o estado configurado a partir de env ou de outras
entradas pequenas que não sejam de runtime. Se a verificação precisar da resolução completa da configuração ou do runtime
real do canal, mantenha essa lógica no hook `config.hasConfiguredState` do plugin.

## Precedência de descoberta (ids duplicados de plugin)

O OpenClaw descobre plugins a partir de várias raízes (incluídos, instalação global, workspace, caminhos explicitamente selecionados na configuração). Se duas descobertas compartilharem o mesmo `id`, apenas o manifesto de **maior precedência** é mantido; duplicatas de menor precedência são descartadas em vez de serem carregadas ao lado dele.

Precedência, da maior para a menor:

1. **Selecionado pela configuração** — um caminho fixado explicitamente em `plugins.entries.<id>`
2. **Incluído** — plugins distribuídos com o OpenClaw
3. **Instalação global** — plugins instalados na raiz global de plugins do OpenClaw
4. **Workspace** — plugins descobertos em relação ao workspace atual

Implicações:

- Uma cópia bifurcada ou antiga de um plugin incluído parada no workspace não vai sobrepor a versão incluída.
- Para realmente substituir um plugin incluído por um local, fixe-o em `plugins.entries.<id>` para que ele vença por precedência em vez de depender da descoberta no workspace.
- Descartes por duplicidade são registrados em log para que diagnósticos do Doctor e de inicialização possam apontar para a cópia descartada.

## Requisitos do Schema JSON

- **Todo plugin deve incluir um JSON Schema**, mesmo que não aceite configuração.
- Um schema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Schemas são validados no momento de leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o id do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar ids de plugin **detectáveis**. Ids desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou schema quebrado ou ausente,
  a validação falha e o Doctor informa o erro do plugin.
- Se existir configuração de plugin, mas o plugin estiver **desativado**, a configuração é mantida e
  um **aviso** é exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o schema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos locais do sistema de arquivos. O runtime ainda carrega separadamente o módulo do plugin; o manifesto serve apenas para descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas finais e chaves sem aspas são aceitos, desde que o valor final continue sendo um objeto.
- Apenas campos de manifesto documentados são lidos pelo carregador de manifesto. Evite chaves personalizadas de nível superior.
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um plugin não precisar deles.
- `providerDiscoveryEntry` deve permanecer leve e não deve importar código amplo de runtime; use-o para metadados estáticos de catálogo de provedor ou descritores restritos de descoberta, não para execução em tempo de requisição.
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (padrão `legacy`).
- Metadados de variável de ambiente (`providerAuthEnvVars`, `channelEnvVars`) são apenas declarativos. Status, auditoria, validação de entrega por Cron e outras superfícies somente leitura ainda aplicam confiança do plugin e política de ativação efetiva antes de tratar uma variável de ambiente como configurada.
- Para metadados de assistente de runtime que exigem código de provedor, consulte [Hooks de runtime de provedor](/pt-BR/plugins/architecture-internals#provider-runtime-hooks).
- Se seu plugin depender de módulos nativos, documente as etapas de build e quaisquer requisitos de allowlist do gerenciador de pacotes (por exemplo, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Relacionado

<CardGroup cols={3}>
  <Card title="Criando plugins" href="/pt-BR/plugins/building-plugins" icon="rocket">
    Primeiros passos com plugins.
  </Card>
  <Card title="Arquitetura de plugins" href="/pt-BR/plugins/architecture" icon="diagram-project">
    Arquitetura interna e modelo de capability.
  </Card>
  <Card title="Visão geral do SDK" href="/pt-BR/plugins/sdk-overview" icon="book">
    Referência do SDK de plugins e importações por subcaminho.
  </Card>
</CardGroup>
