---
read_when:
    - Você está criando um plugin do OpenClaw
    - Você precisa distribuir um esquema de configuração de plugin ou depurar erros de validação de plugin
summary: Requisitos do manifesto de plugin + esquema JSON (validação estrita de configuração)
title: Manifesto de Plugin
x-i18n:
    generated_at: "2026-04-05T12:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifesto de plugin (`openclaw.plugin.json`)

Esta página é apenas para o **manifesto nativo de plugin do OpenClaw**.

Para layouts de bundle compatíveis, consulte [Bundles de plugin](/plugins/bundles).

Formatos de bundle compatíveis usam arquivos de manifesto diferentes:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` ou o layout padrão de componente do Claude
  sem manifesto
- Bundle Cursor: `.cursor-plugin/plugin.json`

O OpenClaw também detecta automaticamente esses layouts de bundle, mas eles não são validados
em relação ao esquema `openclaw.plugin.json` descrito aqui.

Para bundles compatíveis, o OpenClaw atualmente lê os metadados do bundle mais as
raízes de skill declaradas, raízes de comandos do Claude, padrões `settings.json` do bundle Claude,
padrões LSP do bundle Claude e pacotes de hook compatíveis quando o layout corresponde
às expectativas de runtime do OpenClaw.

Todo plugin nativo do OpenClaw **deve** incluir um arquivo `openclaw.plugin.json` na
**raiz do plugin**. O OpenClaw usa esse manifesto para validar a configuração
**sem executar o código do plugin**. Manifestos ausentes ou inválidos são tratados como
erros de plugin e bloqueiam a validação da configuração.

Consulte o guia completo do sistema de plugins: [Plugins](/tools/plugin).
Para o modelo nativo de capacidades e a orientação atual de compatibilidade externa:
[Modelo de capacidades](/plugins/architecture#public-capability-model).

## O que este arquivo faz

`openclaw.plugin.json` são os metadados que o OpenClaw lê antes de carregar o
código do seu plugin.

Use-o para:

- identidade do plugin
- validação de configuração
- metadados de autenticação e onboarding que devem estar disponíveis sem iniciar o
  runtime do plugin
- metadados de alias e ativação automática que devem ser resolvidos antes de o runtime do plugin carregar
- metadados abreviados de propriedade de família de modelos que devem ativar
  automaticamente o plugin antes de o runtime carregar
- snapshots estáticos de propriedade de capacidades usados para o wiring de compatibilidade empacotada e
  cobertura de contratos
- metadados de configuração específicos de canal que devem ser mesclados às superfícies de catálogo e validação
  sem carregar o runtime
- dicas de UI de configuração

Não o use para:

- registrar comportamento de runtime
- declarar entrypoints de código
- metadados de instalação npm

Esses itens pertencem ao código do plugin e ao `package.json`.

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Campo                               | Obrigatório | Tipo                             | O que significa                                                                                                                                                                         |
| ----------------------------------- | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Sim         | `string`                         | ID canônico do plugin. Esse é o ID usado em `plugins.entries.<id>`.                                                                                                                    |
| `configSchema`                      | Sim         | `object`                         | JSON Schema inline para a configuração deste plugin.                                                                                                                                    |
| `enabledByDefault`                  | Não         | `true`                           | Marca um plugin empacotado como habilitado por padrão. Omita-o ou defina qualquer valor diferente de `true` para deixar o plugin desabilitado por padrão.                            |
| `legacyPluginIds`                   | Não         | `string[]`                       | IDs legados que são normalizados para este ID canônico de plugin.                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Não         | `string[]`                       | IDs de provedores que devem habilitar automaticamente este plugin quando autenticação, configuração ou referências de modelo os mencionarem.                                           |
| `kind`                              | Não         | `"memory"` \| `"context-engine"` | Declara um tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                        |
| `channels`                          | Não         | `string[]`                       | IDs de canais pertencentes a este plugin. Usado para descoberta e validação de configuração.                                                                                            |
| `providers`                         | Não         | `string[]`                       | IDs de provedores pertencentes a este plugin.                                                                                                                                           |
| `modelSupport`                      | Não         | `object`                         | Metadados abreviados de família de modelos pertencentes ao manifesto usados para carregar automaticamente o plugin antes do runtime.                                                   |
| `cliBackends`                       | Não         | `string[]`                       | IDs de backend de inferência da CLI pertencentes a este plugin. Usado para ativação automática na inicialização a partir de referências explícitas de configuração.                    |
| `providerAuthEnvVars`               | Não         | `Record<string, string[]>`       | Metadados baratos de env de autenticação do provedor que o OpenClaw pode inspecionar sem carregar o código do plugin.                                                                  |
| `providerAuthChoices`               | Não         | `object[]`                       | Metadados baratos de escolhas de autenticação para seletores de onboarding, resolução de provedor preferido e wiring simples de flags da CLI.                                         |
| `contracts`                         | Não         | `object`                         | Snapshot estático de capacidades empacotadas para fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagem, geração de vídeo, web-fetch, web search e propriedade de ferramentas. |
| `channelConfigs`                    | Não         | `Record<string, object>`         | Metadados de configuração de canal pertencentes ao manifesto, mesclados às superfícies de descoberta e validação antes de o runtime carregar.                                         |
| `skills`                            | Não         | `string[]`                       | Diretórios de Skills a serem carregados, relativos à raiz do plugin.                                                                                                                    |
| `name`                              | Não         | `string`                         | Nome legível do plugin.                                                                                                                                                                 |
| `description`                       | Não         | `string`                         | Resumo curto exibido nas superfícies de plugin.                                                                                                                                         |
| `version`                           | Não         | `string`                         | Versão informativa do plugin.                                                                                                                                                           |
| `uiHints`                           | Não         | `Record<string, object>`         | Rótulos de UI, placeholders e dicas de sensibilidade para campos de configuração.                                                                                                       |

## Referência de `providerAuthChoices`

Cada entrada de `providerAuthChoices` descreve uma escolha de onboarding ou autenticação.
O OpenClaw lê isso antes de o runtime do provedor carregar.

| Campo                 | Obrigatório | Tipo                                            | O que significa                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Sim         | `string`                                        | ID do provedor ao qual esta escolha pertence.                                                                |
| `method`              | Sim         | `string`                                        | ID do método de autenticação para encaminhamento.                                                            |
| `choiceId`            | Sim         | `string`                                        | ID estável da escolha de autenticação usado por fluxos de onboarding e da CLI.                              |
| `choiceLabel`         | Não         | `string`                                        | Rótulo voltado ao usuário. Se omitido, o OpenClaw usa `choiceId` como fallback.                             |
| `choiceHint`          | Não         | `string`                                        | Texto auxiliar curto para o seletor.                                                                         |
| `assistantPriority`   | Não         | `number`                                        | Valores menores são ordenados antes em seletores interativos guiados pelo assistente.                       |
| `assistantVisibility` | Não         | `"visible"` \| `"manual-only"`                  | Oculta a escolha dos seletores do assistente, ainda permitindo seleção manual pela CLI.                     |
| `deprecatedChoiceIds` | Não         | `string[]`                                      | IDs legados de escolha que devem redirecionar os usuários para esta escolha substituta.                     |
| `groupId`             | Não         | `string`                                        | ID opcional de grupo para agrupar escolhas relacionadas.                                                    |
| `groupLabel`          | Não         | `string`                                        | Rótulo voltado ao usuário para esse grupo.                                                                   |
| `groupHint`           | Não         | `string`                                        | Texto auxiliar curto para o grupo.                                                                           |
| `optionKey`           | Não         | `string`                                        | Chave interna de opção para fluxos simples de autenticação com uma única flag.                              |
| `cliFlag`             | Não         | `string`                                        | Nome da flag da CLI, como `--openrouter-api-key`.                                                           |
| `cliOption`           | Não         | `string`                                        | Forma completa da opção da CLI, como `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Não         | `string`                                        | Descrição usada na ajuda da CLI.                                                                             |
| `onboardingScopes`    | Não         | `Array<"text-inference" \| "image-generation">` | Em quais superfícies de onboarding esta escolha deve aparecer. Se omitido, o padrão é `["text-inference"]`. |

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
| `label`       | `string`   | Rótulo do campo voltado ao usuário.     |
| `help`        | `string`   | Texto auxiliar curto.                   |
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

| Campo                            | Tipo       | O que significa                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------------ |
| `speechProviders`                | `string[]` | IDs de provedores de fala pertencentes a este plugin.              |
| `realtimeTranscriptionProviders` | `string[]` | IDs de provedores de transcrição em tempo real pertencentes a este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de provedores de voz em tempo real pertencentes a este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de provedores de compreensão de mídia pertencentes a este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de provedores de geração de imagem pertencentes a este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de provedores de geração de vídeo pertencentes a este plugin.  |
| `webFetchProviders`              | `string[]` | IDs de provedores de web-fetch pertencentes a este plugin.         |
| `webSearchProviders`             | `string[]` | IDs de provedores de web search pertencentes a este plugin.        |
| `tools`                          | `string[]` | Nomes de ferramentas do agente pertencentes a este plugin para verificações de contrato empacotado. |

## Referência de `channelConfigs`

Use `channelConfigs` quando um plugin de canal precisar de metadados baratos de configuração antes de o
runtime carregar.

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

| Campo         | Tipo                     | O que significa                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obrigatório para cada entrada declarada de configuração de canal. |
| `uiHints`     | `Record<string, object>` | Rótulos/placeholders/dicas de sensibilidade opcionais de UI para essa seção de configuração de canal. |
| `label`       | `string`                 | Rótulo de canal mesclado às superfícies de seletor e inspeção quando os metadados de runtime não estão prontos. |
| `description` | `string`                 | Descrição curta do canal para superfícies de inspeção e catálogo.                                 |
| `preferOver`  | `string[]`               | IDs legados ou de menor prioridade de plugin que este canal deve superar nas superfícies de seleção. |

## Referência de `modelSupport`

Use `modelSupport` quando o OpenClaw deve inferir seu plugin de provedor a partir de
IDs abreviados de modelo como `gpt-5.4` ou `claude-sonnet-4.6` antes de o runtime do plugin
carregar.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

O OpenClaw aplica esta precedência:

- referências explícitas `provider/model` usam os metadados do manifesto `providers` proprietário
- `modelPatterns` têm prioridade sobre `modelPrefixes`
- se um plugin não empacotado e um plugin empacotado corresponderem, o plugin não empacotado
  vence
- a ambiguidade restante é ignorada até que o usuário ou a configuração especifique um provedor

Campos:

| Campo           | Tipo       | O que significa                                                                     |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixos correspondidos com `startsWith` em IDs abreviados de modelo.              |
| `modelPatterns` | `string[]` | Fontes de regex correspondidas em IDs abreviados de modelo após a remoção do sufixo de perfil. |

Chaves legadas de capacidades no nível superior estão obsoletas. Use `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` para `contracts`; o carregamento normal
do manifesto não trata mais esses campos de nível superior como propriedade
de capacidades.

## Manifesto versus `package.json`

Os dois arquivos têm funções diferentes:

| Arquivo                | Use para                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descoberta, validação de configuração, metadados de escolha de autenticação e dicas de UI que precisam existir antes de o código do plugin ser executado |
| `package.json`         | Metadados npm, instalação de dependências e o bloco `openclaw` usado para entrypoints, bloqueio de instalação, setup ou metadados de catálogo |

Se você não tiver certeza de onde um metadado pertence, use esta regra:

- se o OpenClaw precisa conhecê-lo antes de carregar o código do plugin, coloque-o em `openclaw.plugin.json`
- se ele trata de empacotamento, arquivos de entrada ou comportamento de instalação npm, coloque-o em `package.json`

### Campos de `package.json` que afetam a descoberta

Alguns metadados de plugin pré-runtime intencionalmente ficam em `package.json`, no bloco
`openclaw`, em vez de `openclaw.plugin.json`.

Exemplos importantes:

| Campo                                                             | O que significa                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara entrypoints nativos de plugin.                                                   |
| `openclaw.setupEntry`                                             | Entrypoint leve apenas de setup usado durante onboarding e inicialização adiada de canais. |
| `openclaw.channel`                                                | Metadados baratos de catálogo de canal, como rótulos, caminhos de documentação, aliases e texto de seleção. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Dicas de instalação/atualização para plugins empacotados e publicados externamente.     |
| `openclaw.install.defaultChoice`                                  | Caminho de instalação preferido quando várias origens de instalação estão disponíveis.   |
| `openclaw.install.minHostVersion`                                 | Versão mínima compatível do host OpenClaw, usando um piso semver como `>=2026.3.22`.    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite um caminho estreito de recuperação de reinstalação de plugin empacotado quando a configuração é inválida. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que superfícies de canal apenas de setup carreguem antes do plugin de canal completo durante a inicialização. |

`openclaw.install.minHostVersion` é aplicado durante a instalação e o carregamento do
registro de manifestos. Valores inválidos são rejeitados; valores válidos, porém mais novos, ignoram o
plugin em hosts mais antigos.

`openclaw.install.allowInvalidConfigRecovery` é intencionalmente restrito. Ele não
torna configurações arbitrariamente quebradas instaláveis. Hoje ele só permite que fluxos de instalação
se recuperem de falhas específicas e antigas de upgrade de plugin empacotado, como um
caminho ausente de plugin empacotado ou uma entrada antiga `channels.<id>` para esse mesmo
plugin empacotado. Erros de configuração não relacionados ainda bloqueiam a instalação e enviam os operadores
para `openclaw doctor --fix`.

## Requisitos de JSON Schema

- **Todo plugin deve incluir um JSON Schema**, mesmo que ele não aceite configuração.
- Um esquema vazio é aceitável (por exemplo, `{ "type": "object", "additionalProperties": false }`).
- Esquemas são validados no momento da leitura/gravação da configuração, não em runtime.

## Comportamento de validação

- Chaves desconhecidas em `channels.*` são **erros**, a menos que o ID do canal seja declarado por
  um manifesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devem referenciar IDs de plugin **detectáveis**. IDs desconhecidos são **erros**.
- Se um plugin estiver instalado, mas tiver um manifesto ou esquema quebrado ou ausente,
  a validação falha e o Doctor informa o erro do plugin.
- Se a configuração do plugin existir, mas o plugin estiver **desabilitado**, a configuração será mantida e
  um **aviso** será exibido no Doctor + logs.

Consulte [Referência de configuração](/pt-BR/gateway/configuration) para o esquema completo de `plugins.*`.

## Observações

- O manifesto é **obrigatório para plugins nativos do OpenClaw**, incluindo carregamentos do sistema de arquivos local.
- O runtime ainda carrega o módulo do plugin separadamente; o manifesto é apenas para
  descoberta + validação.
- Manifestos nativos são analisados com JSON5, então comentários, vírgulas à direita e
  chaves sem aspas são aceitos, desde que o valor final ainda seja um objeto.
- Apenas os campos de manifesto documentados são lidos pelo carregador de manifesto. Evite adicionar
  chaves personalizadas de nível superior aqui.
- `providerAuthEnvVars` é o caminho barato de metadados para sondagens de autenticação, validação de marcadores de env
  e superfícies semelhantes de autenticação de provedor que não devem iniciar o runtime do plugin
  apenas para inspecionar nomes de env.
- `providerAuthChoices` é o caminho barato de metadados para seletores de escolha de autenticação,
  resolução de `--auth-choice`, mapeamento de provedor preferido e registro simples
  de flags de onboarding da CLI antes de o runtime do provedor carregar. Para metadados de assistente de runtime
  que exigem código do provedor, consulte
  [Hooks de runtime do provedor](/plugins/architecture#provider-runtime-hooks).
- Tipos exclusivos de plugin são selecionados por `plugins.slots.*`.
  - `kind: "memory"` é selecionado por `plugins.slots.memory`.
  - `kind: "context-engine"` é selecionado por `plugins.slots.contextEngine`
    (padrão: `legacy` integrado).
- `channels`, `providers`, `cliBackends` e `skills` podem ser omitidos quando um
  plugin não precisa deles.
- Se o seu plugin depender de módulos nativos, documente as etapas de build e quaisquer
  requisitos de allowlist do gerenciador de pacotes (por exemplo, `allow-build-scripts` do pnpm
  - `pnpm rebuild <package>`).

## Relacionado

- [Criando Plugins](/plugins/building-plugins) — primeiros passos com plugins
- [Arquitetura de Plugins](/plugins/architecture) — arquitetura interna
- [Visão geral do SDK](/plugins/sdk-overview) — referência do SDK de Plugin
