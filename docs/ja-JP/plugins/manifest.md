---
read_when:
    - OpenClaw Pluginを構築しています
    - plugin config schemaを提供する必要がある、またはplugin検証エラーをデバッグする必要があります
summary: Plugin manifestとJSON schemaの要件（厳格なconfig検証）
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-23T04:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest（`openclaw.plugin.json`）

このページは、**ネイティブなOpenClaw plugin manifest** のみを対象としています。

互換bundle layoutについては、[Plugin bundles](/ja-JP/plugins/bundles) を参照してください。

互換bundle formatでは、異なるmanifest fileを使います。

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` またはmanifestなしのデフォルトClaude component
  layout
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClawはそれらのbundle layoutも自動検出しますが、このページで説明する
`openclaw.plugin.json` schema に対しては検証されません。

互換bundleについて、OpenClawは現在、layoutがOpenClaw runtimeの期待に一致する場合に、
bundle metadata、宣言されたskill root、Claude command root、Claude bundleの
`settings.json` default、Claude bundleのLSP default、およびサポートされるhook packを読み取ります。

すべてのネイティブOpenClaw pluginは、**plugin root** に
`openclaw.plugin.json` fileを必ず含める必要があります。OpenClawはこのmanifestを使って、
**plugin codeを実行せずに** configurationを検証します。manifestが欠けているか無効な場合は
plugin errorとして扱われ、config validationをブロックします。

plugin system全体のガイドは [Plugins](/ja-JP/tools/plugin) を参照してください。
ネイティブcapability modelと現在のexternal-compatibilityガイダンスについては
[Capability model](/ja-JP/plugins/architecture#public-capability-model) を参照してください。

## このfileの役割

`openclaw.plugin.json` は、plugin codeを読み込む前にOpenClawが読むmetadataです。

用途:

- plugin identity
- config validation
- plugin runtimeを起動しなくても利用可能であるべきauthおよびonboarding metadata
- runtime load前にcontrol-plane surfaceが参照できる軽量なactivation hint
- runtime load前にsetup/onboarding surfaceが参照できる軽量なsetup descriptor
- plugin runtime load前に解決されるべきaliasおよびauto-enable metadata
- runtime load前にpluginを自動有効化すべきshorthand model-family ownership metadata
- bundled compat wiringおよびcontract coverageに使う静的capability ownership snapshot
- plugin runtime load前に共有 `openclaw qa` hostが参照できる軽量なQA runner metadata
- runtimeを読み込まずにcatalogおよびvalidation surfaceへマージされるべきchannel固有config metadata
- config UI hint

用途ではないもの:

- runtime behaviorの登録
- code entrypointの宣言
- npm install metadata

これらはplugin codeと `package.json` に属します。

## 最小例

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

## 詳細な例

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

## トップレベルfieldリファレンス

| Field                                | Required | Type                             | 意味 |
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Yes      | `string`                         | 正規のplugin idです。これは `plugins.entries.<id>` で使われるidです。 |
| `configSchema`                       | Yes      | `object`                         | このpluginのconfig用インラインJSON Schemaです。 |
| `enabledByDefault`                   | No       | `true`                           | bundled pluginをデフォルトで有効にすることを示します。省略するか、`true` 以外の値を設定すると、そのpluginはデフォルトでは無効のままです。 |
| `legacyPluginIds`                    | No       | `string[]`                       | この正規plugin idに正規化される旧idです。 |
| `autoEnableWhenConfiguredProviders`  | No       | `string[]`                       | auth、config、またはmodel refで言及されたときにこのpluginを自動有効化すべきprovider idです。 |
| `kind`                               | No       | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的なplugin kindを宣言します。 |
| `channels`                           | No       | `string[]`                       | このpluginが所有するchannel idです。discoveryおよびconfig validationに使われます。 |
| `providers`                          | No       | `string[]`                       | このpluginが所有するprovider idです。 |
| `modelSupport`                       | No       | `object`                         | runtime前にpluginを自動読み込みするために使われる、manifest所有のshorthand model-family metadataです。 |
| `providerEndpoints`                  | No       | `object[]`                       | provider runtimeの読み込み前にcoreが分類しなければならないprovider route向けの、manifest所有endpoint host/baseUrl metadataです。 |
| `cliBackends`                        | No       | `string[]`                       | このpluginが所有するCLI inference backend idです。明示的なconfig refからの起動時自動有効化に使われます。 |
| `syntheticAuthRefs`                  | No       | `string[]`                       | runtime読み込み前のcold model discovery中に、このplugin所有のsynthetic auth hookをprobeすべきproviderまたはCLI backend refです。 |
| `nonSecretAuthMarkers`               | No       | `string[]`                       | non-secretなlocal、OAuth、またはambient credential状態を表す、bundled plugin所有のplaceholder API key値です。 |
| `commandAliases`                     | No       | `object[]`                       | runtime読み込み前にplugin対応のconfigおよびCLI diagnosticsを生成すべき、このplugin所有のcommand名です。 |
| `providerAuthEnvVars`                | No       | `Record<string, string[]>`       | OpenClawがplugin codeを読み込まずに参照できる軽量なprovider-auth env metadataです。 |
| `providerAuthAliases`                | No       | `Record<string, string>`         | auth lookupで別のprovider idを再利用すべきprovider idです。たとえば、ベースproviderのAPI keyとauth profileを共有するcoding providerなどです。 |
| `channelEnvVars`                     | No       | `Record<string, string[]>`       | OpenClawがplugin codeを読み込まずに参照できる軽量なchannel env metadataです。env駆動のchannel setupや、汎用のstartup/config helperが認識すべきauth surfaceに使ってください。 |
| `providerAuthChoices`                | No       | `object[]`                       | オンボーディングpicker、preferred-provider解決、および単純なCLI flag配線向けの軽量auth-choice metadataです。 |
| `activation`                         | No       | `object`                         | provider、command、channel、route、およびcapability起点の読み込み向けの軽量activation hintです。metadataのみであり、実際の動作は引き続きplugin runtimeが所有します。 |
| `setup`                              | No       | `object`                         | discoveryおよびsetup surfaceがplugin runtimeを読み込まずに参照できる軽量なsetup/onboarding descriptorです。 |
| `qaRunners`                          | No       | `object[]`                       | plugin runtime読み込み前に共有 `openclaw qa` hostが使う軽量QA runner descriptorです。 |
| `contracts`                          | No       | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびtool ownership向けの静的bundled capability snapshotです。 |
| `mediaUnderstandingProviderMetadata` | No       | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたprovider id向けの軽量media-understanding defaultです。 |
| `channelConfigs`                     | No       | `Record<string, object>`         | runtime読み込み前にdiscoveryおよびvalidation surfaceへマージされるmanifest所有のchannel config metadataです。 |
| `skills`                             | No       | `string[]`                       | 読み込むSkill directoryです。plugin rootからの相対パスで指定します。 |
| `name`                               | No       | `string`                         | 人が読むplugin名です。 |
| `description`                        | No       | `string`                         | plugin surfaceに表示される短い要約です。 |
| `version`                            | No       | `string`                         | 情報表示用のplugin versionです。 |
| `uiHints`                            | No       | `Record<string, object>`         | config field用のUI label、placeholder、およびsensitivity hintです。 |

## `providerAuthChoices` リファレンス

各 `providerAuthChoices` エントリは、1つのオンボーディングまたはauth choiceを記述します。
OpenClawはこれをprovider runtimeの読み込み前に読み取ります。

| Field                 | Required | Type                                            | 意味 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | このchoiceが属するprovider idです。 |
| `method`              | Yes      | `string`                                        | ディスパッチ先のauth method idです。 |
| `choiceId`            | Yes      | `string`                                        | オンボーディングおよびCLIフローで使われる安定したauth-choice idです。 |
| `choiceLabel`         | No       | `string`                                        | ユーザー向けlabelです。省略した場合、OpenClawは `choiceId` にフォールバックします。 |
| `choiceHint`          | No       | `string`                                        | picker向けの短い補足テキストです。 |
| `assistantPriority`   | No       | `number`                                        | assistant主導の対話型pickerで、値が小さいほど先に並びます。 |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | assistant pickerではchoiceを隠しつつ、手動CLI選択は引き続き許可します。 |
| `deprecatedChoiceIds` | No       | `string[]`                                      | この置き換えchoiceへユーザーをリダイレクトすべき旧choice idです。 |
| `groupId`             | No       | `string`                                        | 関連choiceをまとめるための任意のgroup idです。 |
| `groupLabel`          | No       | `string`                                        | そのgroupのユーザー向けlabelです。 |
| `groupHint`           | No       | `string`                                        | group向けの短い補足テキストです。 |
| `optionKey`           | No       | `string`                                        | 単一flagの単純なauth flow向け内部option keyです。 |
| `cliFlag`             | No       | `string`                                        | `--openrouter-api-key` のようなCLI flag名です。 |
| `cliOption`           | No       | `string`                                        | `--openrouter-api-key <key>` のような完全なCLI option形式です。 |
| `cliDescription`      | No       | `string`                                        | CLI helpで使われる説明です。 |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | このchoiceを表示すべきオンボーディングsurfaceです。省略時は `["text-inference"]` がデフォルトです。 |

## `commandAliases` リファレンス

pluginがruntime command名を所有していて、ユーザーがそれを誤って
`plugins.allow` に入れたり、ルートCLI commandとして実行しようとしたりする可能性がある場合は
`commandAliases` を使います。OpenClawはこのmetadataを使って、
plugin runtime codeをimportせずにdiagnosticsを行います。

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

| Field        | Required | Type              | 意味 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Yes      | `string`          | このpluginに属するcommand名です。 |
| `kind`       | No       | `"runtime-slash"` | このaliasがルートCLI commandではなくチャットのslash commandであることを示します。 |
| `cliCommand` | No       | `string`          | 存在する場合、CLI操作向けに提案する関連ルートCLI commandです。 |

## `activation` リファレンス

pluginが、後でどのcontrol-plane eventによって有効化されるべきかを
軽量に宣言できる場合は `activation` を使います。

## `qaRunners` リファレンス

pluginが共有 `openclaw qa` ルート配下に1つ以上のtransport runnerを提供する場合は
`qaRunners` を使います。このmetadataは軽量で静的に保ってください。
実際のCLI登録は、`qaRunnerCliRegistrations` をexportする軽量な
`runtime-api.ts` surfaceを通じて、引き続きplugin runtimeが所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てhomeserverに対してDockerベースのMatrixライブQAレーンを実行する"
    }
  ]
}
```

| Field         | Required | Type     | 意味 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Yes      | `string` | `openclaw qa` 配下にマウントされるsubcommandです。たとえば `matrix`。 |
| `description` | No       | `string` | 共有hostがstub commandを必要とするときに使われるフォールバックhelp textです。 |

このblockはmetadataのみです。runtime behaviorは登録せず、
`register(...)`、`setupEntry`、その他のruntime/plugin entrypointの代替にもなりません。
現在のconsumerはこれを、より広いplugin読み込み前の絞り込みhintとして使うため、
activation metadataが欠けていても通常はperformanceコストが生じるだけで、
旧manifest ownershipフォールバックが存在する間は正しさは変わらないはずです。

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

| Field            | Required | Type                                                 | 意味 |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | No       | `string[]`                                           | 要求時にこのpluginを有効化すべきprovider idです。 |
| `onCommands`     | No       | `string[]`                                           | このpluginを有効化すべきcommand idです。 |
| `onChannels`     | No       | `string[]`                                           | このpluginを有効化すべきchannel idです。 |
| `onRoutes`       | No       | `string[]`                                           | このpluginを有効化すべきroute kindです。 |
| `onCapabilities` | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-planeの有効化計画で使われる大まかなcapability hintです。 |

現在のlive consumer:

- command起点のCLI planningは、旧来の
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- channel起点のsetup/channel planningは、明示的なchannel activation metadataが欠けている場合、
  旧来の `channels[]` ownershipにフォールバックします
- provider起点のsetup/runtime planningは、明示的なprovider
  activation metadataが欠けている場合、旧来の
  `providers[]` とトップレベル `cliBackends[]` ownershipにフォールバックします

## `setup` リファレンス

setupおよびオンボーディングsurfaceがruntime読み込み前に軽量なplugin所有metadataを必要とする場合は
`setup` を使います。

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

トップレベルの `cliBackends` も有効なままで、引き続きCLI inference
backendを記述します。`setup.cliBackends` は、metadataのみを保つべき
control-plane/setup flow向けのsetup固有descriptor surfaceです。

存在する場合、`setup.providers` と `setup.cliBackends` は、
setup discoveryにおけるdescriptor-first lookup surfaceとして優先されます。
descriptorがcandidate pluginを絞り込むだけで、setup時にさらに豊富なruntime hookが必要な場合は、
`requiresRuntime: true` を設定し、フォールバック実行経路として `setup-api` を残してください。

setup lookupはplugin所有の `setup-api` codeを実行できるため、
正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、
検出されたplugin全体で一意でなければなりません。ownershipが曖昧な場合、
discovery順で勝者を選ばず、fail closedします。

### `setup.providers` リファレンス

| Field         | Required | Type       | 意味 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Yes      | `string`   | setupまたはオンボーディング中に公開されるprovider idです。正規化idはグローバルに一意に保ってください。 |
| `authMethods` | No       | `string[]` | full runtimeを読み込まずにこのproviderがサポートするsetup/auth method idです。 |
| `envVars`     | No       | `string[]` | generic setup/status surfaceがplugin runtime読み込み前に確認できるenv varです。 |

### `setup` field

| Field              | Required | Type       | 意味 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | setupおよびオンボーディング中に公開されるprovider setup descriptorです。 |
| `cliBackends`      | No       | `string[]` | descriptor-first setup lookupで使われるsetup時backend idです。正規化idはグローバルに一意に保ってください。 |
| `configMigrations` | No       | `string[]` | このpluginのsetup surfaceが所有するconfig migration idです。 |
| `requiresRuntime`  | No       | `boolean`  | descriptor lookup後も `setup-api` 実行が必要かどうかです。 |

## `uiHints` リファレンス

`uiHints` は、config field名から小さなrendering hintへのmapです。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "OpenRouterリクエストに使用",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各field hintには次を含められます。

| Field         | Type       | 意味 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー向けfield labelです。 |
| `help`        | `string`   | 短い補足テキストです。 |
| `tags`        | `string[]` | 任意のUI tagです。 |
| `advanced`    | `boolean`  | そのfieldを高度な項目として示します。 |
| `sensitive`   | `boolean`  | そのfieldをsecretまたはsensitiveとして示します。 |
| `placeholder` | `string`   | form input用のplaceholder textです。 |

## `contracts` リファレンス

`contracts` は、OpenClawがplugin runtimeをimportせずに読み取れる、
静的なcapability ownership metadataにのみ使ってください。

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

各listは任意です。

| Field                            | Type       | 意味 |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | bundled pluginがfactoryを登録できるembedded runtime idです。 |
| `speechProviders`                | `string[]` | このpluginが所有するspeech provider idです。 |
| `realtimeTranscriptionProviders` | `string[]` | このpluginが所有するrealtime-transcription provider idです。 |
| `realtimeVoiceProviders`         | `string[]` | このpluginが所有するrealtime-voice provider idです。 |
| `mediaUnderstandingProviders`    | `string[]` | このpluginが所有するmedia-understanding provider idです。 |
| `imageGenerationProviders`       | `string[]` | このpluginが所有するimage-generation provider idです。 |
| `videoGenerationProviders`       | `string[]` | このpluginが所有するvideo-generation provider idです。 |
| `webFetchProviders`              | `string[]` | このpluginが所有するweb-fetch provider idです。 |
| `webSearchProviders`             | `string[]` | このpluginが所有するweb-search provider idです。 |
| `tools`                          | `string[]` | bundled contract check向けにこのpluginが所有するagent tool名です。 |

## `mediaUnderstandingProviderMetadata` リファレンス

media-understanding providerに、generic core helperがruntime読み込み前に必要とする
default model、自動authフォールバック優先度、またはネイティブdocumentサポートがある場合は、
`mediaUnderstandingProviderMetadata` を使います。keyは
`contracts.mediaUnderstandingProviders` にも宣言されている必要があります。

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

各provider entryには次を含められます。

| Field                  | Type                                | 意味 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このproviderが公開するmedia capabilityです。 |
| `defaultModels`        | `Record<string, string>`            | configでmodelが指定されていないときに使う、capabilityごとのmodel defaultです。 |
| `autoPriority`         | `Record<string, number>`            | credentialベースの自動providerフォールバックで、数値が小さいほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | このproviderがサポートするネイティブdocument inputです。 |

## `channelConfigs` リファレンス

channel pluginがruntime読み込み前に軽量なconfig metadataを必要とする場合は
`channelConfigs` を使います。

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

各channel entryには次を含められます。

| Field         | Type                     | 意味 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用JSON Schemaです。宣言された各channel config entryで必須です。 |
| `uiHints`     | `Record<string, object>` | そのchannel config section向けの任意のUI label/placeholder/sensitive hintです。 |
| `label`       | `string`                 | runtime metadataの準備前でもpickerおよびinspect surfaceにマージされるchannel labelです。 |
| `description` | `string`                 | inspectおよびcatalog surface向けの短いchannel説明です。 |
| `preferOver`  | `string[]`               | selection surfaceでこのchannelが優先すべき旧pluginまたは低優先度plugin idです。 |

## `modelSupport` リファレンス

`gpt-5.4` や `claude-sonnet-4.6` のようなshorthand model idから、
plugin runtime読み込み前にOpenClawがあなたのprovider pluginを推定すべき場合は
`modelSupport` を使います。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な `provider/model` refでは、所有する `providers` manifest metadataを使います
- `modelPatterns` は `modelPrefixes` より優先されます
- 1つのnon-bundled pluginと1つのbundled pluginの両方が一致する場合、non-bundled
  pluginが勝ちます
- それ以外の曖昧さは、ユーザーまたはconfigがproviderを指定するまで無視されます

Field:

| Field           | Type       | 意味 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand model idに対して `startsWith` で一致させるprefixです。 |
| `modelPatterns` | `string[]` | profile suffix除去後のshorthand model idに対して一致させるregex sourceです。 |

旧来のトップレベルcapability keyは非推奨です。`openclaw doctor --fix` を使って
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、および `webSearchProviders` を `contracts` 配下へ移動してください。
通常のmanifest読み込みでは、これらのトップレベルfieldはもはやcapability
ownershipとして扱われません。

## Manifestとpackage.jsonの違い

この2つのfileは異なる役割を持ちます。

| File                   | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | plugin code実行前に存在していなければならないdiscovery、config validation、auth-choice metadata、およびUI hint |
| `package.json`         | npm metadata、dependency install、およびentrypoint、install gating、setup、またはcatalog metadataに使う `openclaw` block |

どこにmetadataを置くべきかわからない場合は、次のルールを使ってください。

- plugin codeを読み込む前にOpenClawが知っておく必要があるなら、`openclaw.plugin.json` に置く
- packaging、entry file、またはnpm install動作に関するものなら、`package.json` に置く

### discoveryに影響する `package.json` field

一部のpre-runtime plugin metadataは、意図的に `openclaw.plugin.json` ではなく
`package.json` の `openclaw` blockに置かれます。

重要な例:

| Field                                                             | 意味 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ネイティブplugin entrypointを宣言します。plugin package directory内にとどめる必要があります。 |
| `openclaw.runtimeExtensions`                                      | install済みpackage向けの、ビルド済みJavaScript runtime entrypointを宣言します。plugin package directory内にとどめる必要があります。 |
| `openclaw.setupEntry`                                             | オンボーディング、遅延channel起動、および読み取り専用channel status/SecretRef discovery中に使う軽量なsetup専用entrypointです。plugin package directory内にとどめる必要があります。 |
| `openclaw.runtimeSetupEntry`                                      | install済みpackage向けの、ビルド済みJavaScript setup entrypointを宣言します。plugin package directory内にとどめる必要があります。 |
| `openclaw.channel`                                                | label、docs path、alias、selection copyのような軽量なchannel catalog metadataです。 |
| `openclaw.channel.configuredState`                                | full channel runtimeを読み込まずに「env-only setupがすでに存在するか」を判定できる軽量なconfigured-state checker metadataです。 |
| `openclaw.channel.persistedAuthState`                             | full channel runtimeを読み込まずに「すでに何かにサインイン済みか」を判定できる軽量なpersisted-auth checker metadataです。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | bundled pluginおよび外部公開plugin向けのinstall/update hintです。 |
| `openclaw.install.defaultChoice`                                  | 複数のinstall sourceがあるときの推奨install pathです。 |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` のようなsemver下限で表す、サポートされる最小OpenClaw host versionです。 |
| `openclaw.install.allowInvalidConfigRecovery`                     | configが無効なときに、限定的なbundled plugin再install復旧経路を許可します。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動時に、full channel pluginより先にsetup専用channel surfaceを読み込めるようにします。 |

`openclaw.install.minHostVersion` はinstall時およびmanifest
registry読み込み時に適用されます。無効な値は拒否され、妥当だがより新しい値の場合は、
古いhostではそのpluginをスキップします。

channel pluginは、status、channel list、またはSecretRef scanで、
full runtimeを読み込まずに設定済みaccountを識別する必要がある場合、
`openclaw.setupEntry` を提供するべきです。setup entryはchannel metadataに加えて、
setup-safeなconfig、status、およびsecrets adapterを公開するべきです。
network client、gateway listener、およびtransport runtimeはメインextension
entrypoint側に残してください。

runtime entrypoint fieldは、source
entrypoint fieldに対するpackage-boundary checkを上書きしません。たとえば、
`openclaw.runtimeExtensions` が、境界外へ抜ける `openclaw.extensions` pathを
読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。これによって
任意の壊れたconfigがinstall可能になるわけではありません。現在これは、
bundled plugin pathの欠落や、同じbundled plugin向けの古い `channels.<id>` entryなど、
特定の古いbundled-plugin upgrade失敗からinstall flowが復旧できるようにするだけです。
無関係なconfig errorは引き続きinstallをブロックし、運用者を
`openclaw doctor --fix` へ案内します。

`openclaw.channel.persistedAuthState` は、小さなchecker module向けのpackage metadataです。

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

これは、setup、doctor、またはconfigured-state flowが、full channel pluginの読み込み前に
軽量なyes/no auth probeを必要とする場合に使います。対象exportは、永続化stateだけを読む
小さな関数にしてください。full channel runtime barrel経由にはしないでください。

`openclaw.channel.configuredState` も、軽量なenv-only
configured check向けに同じ形を取ります。

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

これは、あるchannelがenvや他の小さな
non-runtime inputからconfigured-stateを判定できる場合に使います。
full config解決や実際のchannel runtimeが必要な場合は、そのロジックは代わりに
pluginの `config.hasConfiguredState` hookに置いてください。

## Discoveryの優先順位（重複plugin id）

OpenClawは複数のroot（bundled、global install、workspace、明示的にconfigで選ばれたpath）からpluginを検出します。2つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い** manifestだけが保持され、低優先順位の重複は並行して読み込まれるのではなく破棄されます。

優先順位（高い順）:

1. **Config-selected** — `plugins.entries.<id>` で明示的に固定されたpath
2. **Bundled** — OpenClawに同梱されたplugin
3. **Global install** — グローバルOpenClaw plugin rootにinstallされたplugin
4. **Workspace** — 現在のworkspaceに対して相対的に検出されたplugin

影響:

- workspace内にあるbundled pluginのforkや古いコピーは、bundled buildを上書きしません。
- bunded pluginをローカル版で本当に上書きしたい場合は、workspace discoveryに頼るのではなく、`plugins.entries.<id>` で固定して優先順位で勝たせてください。
- 重複破棄はログに記録されるため、Doctorや起動時diagnosticsで破棄されたコピーを示せます。

## JSON Schema要件

- **すべてのpluginはJSON Schemaを含める必要があります**。configを一切受け付けない場合でも同様です。
- 空のschemaでも構いません（例: `{ "type": "object", "additionalProperties": false }`）。
- schemaはruntime時ではなく、config read/write時に検証されます。

## 検証の動作

- 不明な `channels.*` keyは、channel idがplugin manifestで宣言されていない限り**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*`
  は、**検出可能な** plugin idを参照していなければなりません。不明なidは**エラー**です。
- pluginがinstall済みでも、manifestまたはschemaが壊れているか欠けている場合、
  検証は失敗し、Doctorがplugin errorを報告します。
- plugin configが存在していても、そのpluginが**無効**である場合、configは保持され、
  Doctor + logsに**警告**が表示されます。

完全な `plugins.*` schemaについては [Configuration reference](/ja-JP/gateway/configuration) を参照してください。

## 注

- manifestは、ローカルfilesystem読み込みを含む**ネイティブOpenClaw pluginで必須**です。
- runtimeは引き続きplugin moduleを別途読み込みます。manifestは
  discovery + validation専用です。
- ネイティブmanifestはJSON5でparseされるため、最終的な値がobjectである限り、
  comment、trailing comma、unquoted keyが許容されます。
- manifest loaderが読むのは文書化されたmanifest fieldのみです。ここに
  カスタムのトップレベルkeyを追加するのは避けてください。
- `providerAuthEnvVars` は、auth probe、env-marker
  validation、およびenv名を調べるためだけにplugin runtimeを起動すべきでない類似のprovider-auth surface向けの軽量metadata経路です。
- `providerAuthAliases` は、provider variantが別providerのauth
  env var、auth profile、configベースauth、およびAPI-keyオンボーディングchoiceを
  再利用できるようにし、その関係をcoreにハードコードせずに済ませます。
- `providerEndpoints` は、provider pluginが単純なendpoint host/baseUrl
  一致metadataを所有できるようにします。coreがすでにサポートしているendpoint classにのみ使ってください。
  runtime behavior自体は引き続きpluginが所有します。
- `syntheticAuthRefs` は、runtime
  registryが存在する前のcold model discoveryに見える必要がある、provider所有のsynthetic
  auth hook向けの軽量metadata経路です。runtime providerまたはCLI backendが実際に
  `resolveSyntheticAuth` を実装しているrefだけを列挙してください。
- `nonSecretAuthMarkers` は、local、OAuth、またはambient credential markerのような、
  bundled plugin所有のplaceholder API key向け軽量metadata経路です。
  coreは、所有providerをハードコードせずに、これらをauth表示およびsecret audit用のnon-secretとして扱います。
- `channelEnvVars` は、shell-envフォールバック、setup
  prompt、およびenv名を調べるためだけにplugin runtimeを起動すべきでない類似のchannel surface向けの軽量metadata経路です。
  env名はmetadataであり、それ自体でactivationになるわけではありません。status、audit、Cron配信検証、
  その他の読み取り専用surfaceは、env varをconfigured channelとして扱う前に、
  引き続きplugin trustと有効なactivation policyを適用します。
- `providerAuthChoices` は、auth-choice picker、
  `--auth-choice` 解決、preferred-provider mapping、およびprovider runtime読み込み前の単純なオンボーディング
  CLI flag登録向けの軽量metadata経路です。provider codeが必要なruntime ウィザード
  metadataについては、
  [Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。
- 排他的plugin kindは `plugins.slots.*` で選択されます。
  - `kind: "memory"` は `plugins.slots.memory` で選択されます。
  - `kind: "context-engine"` は `plugins.slots.contextEngine`
    で選択されます（デフォルト: 組み込みの `legacy`）。
- `channels`、`providers`、`cliBackends`、および `skills` は、
  pluginで不要な場合は省略できます。
- pluginがネイティブmoduleに依存する場合は、build手順と
  package-manager allowlist要件（たとえば pnpm の `allow-build-scripts`
  - `pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — pluginではじめる
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
