---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin config schemaを出荷する必要がある、またはPlugin検証エラーをデバッグする必要がある場合
summary: Plugin manifest + JSON schema要件（厳格なconfig検証）
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-25T13:54:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

このページは **ネイティブOpenClaw plugin manifest** のみを対象としています。

互換bundle layoutについては [Plugin bundles](/ja-JP/plugins/bundles) を参照してください。

互換bundle形式では異なるmanifest fileを使います:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` またはmanifestなしのデフォルトClaude component
  layout
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClawはそれらのbundle layoutも自動検出しますが、ここで説明する
`openclaw.plugin.json` schemaに対しては検証されません。

互換bundleについて、OpenClawは現在、bundle metadataに加えて、宣言された
skill root、Claude command root、Claude bundleの `settings.json` デフォルト、
Claude bundle LSPデフォルト、およびlayoutがOpenClaw runtimeの想定に一致する場合は
サポートされるhook packを読み取ります。

すべてのネイティブOpenClaw Pluginは、**plugin root** に
`openclaw.plugin.json` fileを必ず含めなければなりません。OpenClawはこのmanifestを使って、
**plugin codeを実行せずに** 設定を検証します。manifestの欠落や無効なmanifestは
plugin errorとして扱われ、config validationをブロックします。

完全なplugin systemガイドは [Plugins](/ja-JP/tools/plugin) を参照してください。
ネイティブcapability modelと現在の外部互換性ガイダンスについては:
[Capability model](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClawが **plugin codeを読み込む前に**
読むmetadataです。以下の内容はすべて、plugin runtimeを起動せずに調べられる程度に
軽量でなければなりません。

**用途:**

- plugin identity、config validation、config UI hint
- auth、オンボーディング、setup metadata（alias、auto-enable、provider env var、auth choice）
- control-planeサーフェス向けのactivation hint
- shorthand model-family ownership
- 静的なcapability ownership snapshot（`contracts`）
- 共有 `openclaw qa` hostが検査できるQA runner metadata
- catalogおよびvalidationサーフェスにマージされるchannel固有config metadata

**用途ではないもの:** runtime behaviorの登録、code entrypointの宣言、
npm install metadata。これらはplugin codeと `package.json` に属します。

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

## トップレベルフィールドリファレンス

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正式なplugin id。これは `plugins.entries.<id>` で使われるidです。                                                                                                                                                                |
| `configSchema`                       | はい     | `object`                         | このplugin設定用のインラインJSON Schema。                                                                                                                                                                                         |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル済みPluginをデフォルト有効としてマークします。デフォルト無効のままにするには、省略するか `true` 以外の値を設定してください。                                                                                            |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正式plugin idに正規化されるレガシーid。                                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、config、またはmodel refで言及されたときに、このpluginを自動有効化すべきprovider id。                                                                                                                                       |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的なplugin kindを宣言します。                                                                                                                                                                    |
| `channels`                           | いいえ   | `string[]`                       | このpluginが所有するchannel id。検出とconfig validationに使われます。                                                                                                                                                            |
| `providers`                          | いいえ   | `string[]`                       | このpluginが所有するprovider id。                                                                                                                                                                                                 |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | full plugin runtimeを有効化せずに読み込める、manifestスコープのprovider catalog metadata向けの軽量なprovider-discovery module path。plugin rootからの相対パスです。                                                              |
| `modelSupport`                       | いいえ   | `object`                         | runtime前にpluginを自動読み込みするために使われる、manifest所有のshorthand model-family metadata。                                                                                                                               |
| `modelCatalog`                       | いいえ   | `object`                         | このpluginが所有するprovider向けの宣言的model catalog metadata。これは、plugin runtimeを読み込まずに、将来の読み取り専用listing、オンボーディング、model picker、alias、抑制を行うためのcontrol-plane契約です。                |
| `providerEndpoints`                  | いいえ   | `object[]`                       | provider runtime読み込み前にcoreが分類しなければならないprovider route向けの、manifest所有endpoint host/baseUrl metadata。                                                                                                       |
| `cliBackends`                        | いいえ   | `string[]`                       | このpluginが所有するCLI推論バックエンドid。明示的config refからの起動時自動有効化に使われます。                                                                                                                                 |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | runtime読み込み前のcold model discovery中に、このplugin所有のsynthetic auth hookをprobeすべきproviderまたはCLI backend ref。                                                                                                     |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | ローカル、OAuth、またはambient credential状態を表す、バンドル済みPlugin所有のplaceholder API key値。                                                                                                                            |
| `commandAliases`                     | いいえ   | `object[]`                       | runtime読み込み前にplugin認識のconfigおよびCLI診断を生成すべき、このplugin所有のcommand名。                                                                                                                                      |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | provider auth/status lookup向けの、非推奨の互換env metadata。新規pluginでは `setup.providers[].envVars` を推奨します。OpenClawは非推奨期間中、引き続きこれを読み取ります。                                                       |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth lookupのために別のprovider idを再利用すべきprovider id。たとえば、ベースproviderのAPI keyとauth profileを共有するcoding providerなど。                                                                                      |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | plugin codeを読み込まずにOpenClawが検査できる軽量なchannel env metadata。env駆動のchannel setupまたは、汎用startup/config helperが認識すべきauthサーフェスに使ってください。                                                   |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングpicker、preferred-provider解決、単純なCLI flag配線向けの軽量なauth-choice metadata。                                                                                                                             |
| `activation`                         | いいえ   | `object`                         | provider、command、channel、route、capabilityトリガーによる読み込み向けの軽量なactivation planner metadata。metadataのみであり、実際の挙動は引き続きplugin runtimeが所有します。                                                |
| `setup`                              | いいえ   | `object`                         | discoveryおよびsetupサーフェスがplugin runtimeを読み込まずに検査できる、軽量なsetup/オンボーディング記述子。                                                                                                                    |
| `qaRunners`                          | いいえ   | `object[]`                       | 共有 `openclaw qa` hostがplugin runtimeを読み込む前に使う軽量なQA runner記述子。                                                                                                                                                 |
| `contracts`                          | いいえ   | `object`                         | external auth hook、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、tool ownership向けの静的なbundled capability snapshot。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたprovider id向けの軽量なmedia-understandingデフォルト。                                                                                                                       |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | runtime読み込み前にdiscoveryおよびvalidationサーフェスへマージされる、manifest所有のchannel config metadata。                                                                                                                    |
| `skills`                             | いいえ   | `string[]`                       | plugin rootからの相対パスで指定する、読み込むSkill directory。                                                                                                                                                                    |
| `name`                               | いいえ   | `string`                         | 人が読むplugin名。                                                                                                                                                                                                                |
| `description`                        | いいえ   | `string`                         | pluginサーフェスに表示される短い要約。                                                                                                                                                                                            |
| `version`                            | いいえ   | `string`                         | 情報提供用のplugin version。                                                                                                                                                                                                      |
| `uiHints`                            | いいえ   | `Record<string, object>`         | config field向けのUIラベル、placeholder、機密性hint。                                                                                                                                                                             |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1つのオンボーディングまたはauth choiceを記述します。
OpenClawは、provider runtime読み込み前にこれを読み取ります。
provider setupフローは、まずこれらのmanifest choiceを優先し、その後、互換性のために
runtimeのwizard metadataおよびinstall-catalog choiceへフォールバックします。

| フィールド            | 必須     | 型                                              | 意味                                                                                                      |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | このchoiceが属するprovider id。                                                                           |
| `method`              | はい     | `string`                                        | ディスパッチ先のauth method id。                                                                          |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使われる安定したauth-choice id。                                         |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略した場合、OpenClawは `choiceId` にフォールバックします。                           |
| `choiceHint`          | いいえ   | `string`                                        | picker向けの短い補助テキスト。                                                                            |
| `assistantPriority`   | いいえ   | `number`                                        | assistant駆動の対話型pickerで、値が小さいほど先に並びます。                                               |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | assistant pickerではchoiceを隠しつつ、手動CLI選択は許可します。                                           |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | この置き換えchoiceへユーザーをリダイレクトすべきレガシーchoice id。                                       |
| `groupId`             | いいえ   | `string`                                        | 関連choiceをグループ化するための任意group id。                                                            |
| `groupLabel`          | いいえ   | `string`                                        | そのgroupのユーザー向けラベル。                                                                           |
| `groupHint`           | いいえ   | `string`                                        | group向けの短い補助テキスト。                                                                             |
| `optionKey`           | いいえ   | `string`                                        | 単一flagの単純なauth flow向け内部option key。                                                             |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` のようなCLI flag名。                                                               |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` のような完全なCLI option形状。                                               |
| `cliDescription`      | いいえ   | `string`                                        | CLI helpで使われる説明。                                                                                  |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | このchoiceをどのオンボーディングサーフェスに表示すべきか。省略時は `["text-inference"]` がデフォルトです。 |

## commandAliases リファレンス

Pluginが、ユーザーが誤って
`plugins.allow` に入れたり、root CLI commandとして実行しようとしたりしうる
runtime command名を所有する場合は `commandAliases` を使ってください。OpenClawは、
plugin runtime codeをimportせずに診断のためこのmetadataを使います。

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

| フィールド   | 必須     | 型                | 意味                                                                            |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | このpluginに属するcommand名。                                                   |
| `kind`       | いいえ   | `"runtime-slash"` | このaliasをroot CLI commandではなくchat slash commandとしてマークします。       |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI操作に対して提案すべき関連root CLI command。                   |

## activation リファレンス

Pluginが、どのcontrol-plane eventで
activation/load planに含めるべきかを安価に宣言できる場合は `activation` を使ってください。

このブロックはplanner metadataであり、lifecycle APIではありません。runtime behaviorは登録せず、
`register(...)` を置き換えず、plugin codeがすでに実行済みであることも保証しません。
activation plannerは、既存のmanifest ownership
metadata（`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, hooksなど）へフォールバックする前に、候補pluginを絞り込むためにこれらのフィールドを使います。

所有関係をすでに表現している、もっとも狭いmetadataを優先してください。関係をそれらのownership fieldで表現できる場合は、
`providers`, `channels`, `commandAliases`, setup descriptor, `contracts`
を使ってください。`activation` は、それらのownership fieldでは表現できない
追加のplanner hint向けに使います。

このブロックはmetadataのみです。runtime behaviorは登録せず、
`register(...)`、`setupEntry`、その他のruntime/plugin entrypointも置き換えません。
現在のconsumerは、より広いplugin読み込みの前に絞り込みhintとしてこれを使うため、
activation metadataが欠けても通常は性能コストが増えるだけです。従来のmanifest ownershipフォールバックが残っている限り、
正しさは変わらないはずです。

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

| フィールド       | 必須     | 型                                                   | 意味                                                                                                  |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `onProviders`    | いいえ   | `string[]`                                           | activation/load planにこのpluginを含めるべきprovider id。                                            |
| `onCommands`     | いいえ   | `string[]`                                           | activation/load planにこのpluginを含めるべきcommand id。                                             |
| `onChannels`     | いいえ   | `string[]`                                           | activation/load planにこのpluginを含めるべきchannel id。                                             |
| `onRoutes`       | いいえ   | `string[]`                                           | activation/load planにこのpluginを含めるべきroute kind。                                             |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane activation planningで使われる広いcapability hint。可能ならより狭いfieldを優先してください。 |

現在のlive consumer:

- commandトリガーのCLI planningは、従来の
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- channelトリガーのsetup/channel planningは、明示的channel activation metadataがない場合、
  従来の `channels[]` ownershipにフォールバックします
- providerトリガーのsetup/runtime planningは、明示的provider
  activation metadataがない場合、従来の
  `providers[]` およびトップレベル `cliBackends[]` ownershipにフォールバックします

planner diagnosticsは、明示的activation hintとmanifest
ownershipフォールバックを区別できます。たとえば、`activation-command-hint` は
`activation.onCommands` が一致したことを意味し、`manifest-command-alias` は
plannerが代わりに `commandAliases` ownershipを使ったことを意味します。これらのreason labelは
host diagnosticsとtest向けです。plugin authorは、引き続き所有関係をもっともよく表現するmetadataを宣言してください。

## qaRunners リファレンス

Pluginが共有 `openclaw qa` root配下に1つ以上のtransport runnerを提供する場合は
`qaRunners` を使ってください。このmetadataは安価で静的に保ってください。実際のCLI登録は、
`qaRunnerCliRegistrations` をexportする軽量な
`runtime-api.ts` サーフェスを通じて、引き続きplugin runtimeが所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てhomeserverに対してDockerバックエンドのMatrix live QA laneを実行する"
    }
  ]
}
```

| フィールド    | 必須     | 型       | 意味                                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `commandName` | はい     | `string` | `openclaw qa` 配下にマウントされるsubcommand。たとえば `matrix`。               |
| `description` | いいえ   | `string` | 共有hostがstub commandを必要とする場合に使われるフォールバックhelp text。       |

## setup リファレンス

setupおよびオンボーディングサーフェスがruntime読み込み前に
plugin所有metadataを安価に必要とする場合は `setup` を使ってください。

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

トップレベル `cliBackends` は引き続き有効であり、CLI推論
backendを記述し続けます。`setup.cliBackends` は、metadata-onlyであるべき
control-plane/setup flow向けのsetup専用descriptorサーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` はsetup discoveryにおける
descriptor-firstな優先lookupサーフェスです。descriptorが候補pluginを絞り込むだけで、
setupによりリッチなsetup-time runtime hookがまだ必要な場合は、
`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を残してください。

OpenClawは、汎用provider authおよび
env-var lookupにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は、
非推奨期間中は互換adapterを通じて引き続きサポートされますが、これをまだ使っている非バンドルPluginには
manifest diagnosticが出ます。新しいPluginはsetup/status env metadataを
`setup.providers[].envVars` に置くべきです。

OpenClawは、setup entryがない場合、または `setup.requiresRuntime: false`
がsetup runtime不要を宣言している場合に、
`setup.providers[].authMethods` から単純なsetup choiceも導出できます。
カスタムラベル、CLI flag、オンボーディングscope、assistant metadataには、
明示的な `providerAuthChoices` エントリが引き続き優先されます。

それらのdescriptorでsetupサーフェスに十分な場合にのみ `requiresRuntime: false` を設定してください。
OpenClawは明示的な `false` をdescriptor-only契約として扱い、
setup lookupのために `setup-api` や `openclaw.setupEntry` を実行しません。
descriptor-only pluginがそれでもそれらのsetup runtime entryのいずれかを含んでいる場合、
OpenClawは追加的diagnosticを報告しつつ、それを無視し続けます。
`requiresRuntime` を省略すると従来のフォールバック挙動が維持されるため、
flagなしでdescriptorを追加した既存pluginは壊れません。

setup lookupはplugin所有の `setup-api` codeを実行する可能性があるため、
正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、
検出されたplugin間で一意でなければなりません。所有関係が曖昧な場合は、
discovery順で勝者を選ぶのではなくfail-closedします。

setup runtimeが実行される場合、setup registry diagnosticsは、
`setup-api` がmanifest descriptorで宣言していないproviderやCLI backendを登録したり、
descriptorに一致するruntime登録がなかったりすると、descriptor driftを報告します。
これらのdiagnosticは追加的なものであり、従来pluginを拒否しません。

### setup.providers リファレンス

| フィールド    | 必須     | 型         | 意味                                                                                   |
| ------------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | はい     | `string`   | setupまたはオンボーディング中に公開されるprovider id。正規化済みidはグローバル一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | full runtimeを読み込まずにこのproviderがサポートするsetup/auth method id。            |
| `envVars`     | いいえ   | `string[]` | plugin runtime読み込み前に、汎用setup/statusサーフェスが確認できるenv var。           |

### setup フィールド

| フィールド         | 必須     | 型         | 意味                                                                                              |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | setupおよびオンボーディング中に公開されるprovider setup descriptor。                              |
| `cliBackends`      | いいえ   | `string[]` | descriptor-first setup lookupに使うsetup時backend id。正規化済みidはグローバル一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | このpluginのsetupサーフェスが所有するconfig migration id。                                        |
| `requiresRuntime`  | いいえ   | `boolean`  | descriptor lookup後にも、setupに引き続き `setup-api` 実行が必要かどうか。                         |

## uiHints リファレンス

`uiHints` は、config field名から小さな描画hintへのマップです。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "OpenRouterリクエストに使用されます",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各field hintには次を含められます:

| フィールド    | 型         | 意味                                      |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | ユーザー向けfieldラベル。                 |
| `help`        | `string`   | 短い補助テキスト。                        |
| `tags`        | `string[]` | 任意のUI tag。                            |
| `advanced`    | `boolean`  | fieldをadvancedとしてマークします。       |
| `sensitive`   | `boolean`  | fieldをsecretまたはsensitiveとしてマークします。 |
| `placeholder` | `string`   | form input用のplaceholder text。          |

## contracts リファレンス

`contracts` は、OpenClawが
plugin runtimeをimportせずに読める静的capability ownership metadataにのみ使ってください。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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

各リストは任意です:

| フィールド                       | 型         | 意味                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory id。現在は `codex-app-server`。        |
| `agentToolResultMiddleware`      | `string[]` | バンドル済みPluginがtool-result middlewareを登録できるruntime id。         |
| `externalAuthProviders`          | `string[]` | このpluginが外部auth profile hookを所有するprovider id。                  |
| `speechProviders`                | `string[]` | このpluginが所有するspeech provider id。                                  |
| `realtimeTranscriptionProviders` | `string[]` | このpluginが所有するrealtime-transcription provider id。                  |
| `realtimeVoiceProviders`         | `string[]` | このpluginが所有するrealtime-voice provider id。                          |
| `memoryEmbeddingProviders`       | `string[]` | このpluginが所有するmemory embedding provider id。                        |
| `mediaUnderstandingProviders`    | `string[]` | このpluginが所有するmedia-understanding provider id。                     |
| `imageGenerationProviders`       | `string[]` | このpluginが所有するimage-generation provider id。                        |
| `videoGenerationProviders`       | `string[]` | このpluginが所有するvideo-generation provider id。                        |
| `webFetchProviders`              | `string[]` | このpluginが所有するweb-fetch provider id。                               |
| `webSearchProviders`             | `string[]` | このpluginが所有するweb-search provider id。                              |
| `tools`                          | `string[]` | バンドル済みcontract check向けに、このpluginが所有するagent tool名。      |

`contracts.embeddedExtensionFactories` は、バンドル済みCodex
app-server専用extension factory向けに維持されています。バンドル済みtool-result transformは、
代わりに `contracts.agentToolResultMiddleware` を宣言し、
`api.registerAgentToolResultMiddleware(...)` で登録してください。外部Pluginは、
そのseamが高信頼のtool
outputをモデルが見る前に書き換え可能であるため、tool-result middlewareを登録できません。

`resolveExternalAuthProfiles` を実装するprovider Pluginは、
`contracts.externalAuthProviders` を宣言してください。
宣言がなくても、Pluginは非推奨の互換フォールバック経由で引き続き動作しますが、
そのフォールバックは低速で、移行期間後に削除されます。

バンドル済みmemory embedding providerは、公開するすべてのadapter idについて
`contracts.memoryEmbeddingProviders` を宣言するべきです。これには `local` のような
組み込みadapterも含まれます。standalone CLIパスは、このmanifest契約を使って、
完全なGateway runtimeがprovider登録を行う前に、所有pluginだけを読み込みます。

## mediaUnderstandingProviderMetadata リファレンス

media-understanding providerが、generic core helperがruntime読み込み前に必要とする
default model、自動authフォールバック優先度、またはネイティブdocumentサポートを持つ場合は、
`mediaUnderstandingProviderMetadata` を使ってください。キーは
`contracts.mediaUnderstandingProviders` にも宣言されていなければなりません。

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

各providerエントリには次を含められます:

| フィールド             | 型                                  | 意味                                                                          |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このproviderが公開するmediacapability。                                       |
| `defaultModels`        | `Record<string, string>`            | configでmodel指定がないときに使う、capabilityからmodelへのデフォルト。       |
| `autoPriority`         | `Record<string, number>`            | 自動credentialベースproviderフォールバックで、値が小さいほど先に並びます。   |
| `nativeDocumentInputs` | `"pdf"[]`                           | このproviderがサポートするネイティブdocument input。                          |

## channelConfigs リファレンス

チャネルPluginがruntime読み込み前に安価なconfig metadataを必要とする場合は
`channelConfigs` を使ってください。read-onlyなchannel setup/status discoveryは、
setup entryがない場合や、
`setup.requiresRuntime: false` がsetup runtime不要を宣言している場合、
設定済みexternal channelに対してこのmetadataを直接使えます。

チャネルPluginでは、`configSchema` と `channelConfigs` は異なる
パスを記述します:

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドルPluginは、対応する
`channelConfigs` エントリも宣言するべきです。これがないと、OpenClawは引き続きpluginを読み込めますが、
plugin runtimeが実行されるまで、cold-path config schema、setup、Control UIサーフェスは
channel所有option shapeを知ることができません。

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

各channelエントリには次を含められます:

| フィールド    | 型                       | 意味                                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用JSON Schema。宣言された各channel configエントリで必須です。                     |
| `uiHints`     | `Record<string, object>` | そのchannel config section向けの、任意のUIラベル/placeholder/sensitive hint。                     |
| `label`       | `string`                 | runtime metadata未準備時にpickerおよびinspectサーフェスへマージされるchannelラベル。             |
| `description` | `string`                 | inspectおよびcatalogサーフェス向けの短いchannel説明。                                             |
| `preferOver`  | `string[]`               | selectionサーフェスで、このchannelが優先すべきレガシーまたは低優先度plugin id。                  |

## modelSupport リファレンス

plugin runtime読み込み前に、`gpt-5.5` や `claude-sonnet-4.6` のような
shorthand model idからOpenClawがあなたのprovider Pluginを推論すべき場合は、
`modelSupport` を使ってください。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します:

- 明示的な `provider/model` refは、所有する `providers` manifest metadataを使います
- `modelPatterns` は `modelPrefixes` に勝ちます
- 1つの非バンドルPluginと1つのバンドル済みPluginの両方が一致する場合、非バンドル
  Pluginが勝ちます
- 残る曖昧さは、ユーザーまたはconfigがproviderを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand model idに対して `startsWith` で一致させるprefix。         |
| `modelPatterns` | `string[]` | profile suffix削除後のshorthand model idに対して一致させるregex source。 |

## modelCatalog リファレンス

plugin runtimeを読み込む前にOpenClawがprovider model metadataを知るべき場合は
`modelCatalog` を使ってください。これは、固定catalog
row、provider alias、抑制ルール、discovery mode向けのmanifest所有ソースです。
runtime refreshは引き続きprovider runtime codeに属しますが、manifestはcoreに対し、
runtimeがいつ必要かを伝えます。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "Azure OpenAI Responsesでは利用できない"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

トップレベルフィールド:

| フィールド     | 型                                                       | 意味                                                                                                   |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | このpluginが所有するprovider id向けcatalog row。キーはトップレベル `providers` にも現れるべきです。 |
| `aliases`      | `Record<string, object>`                                 | catalogまたは抑制planningで、所有providerへ解決されるべきprovider alias。                              |
| `suppressions` | `object[]`                                               | provider固有の理由で、このpluginが別ソース由来のmodel rowを抑制するもの。                             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | provider catalogがmanifest metadataから読めるか、cacheへrefreshできるか、またはruntimeが必要か。     |

providerフィールド:

| フィールド | 型                       | 意味                                                                 |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl`  | `string`                 | このprovider catalog内のmodel向け、任意のデフォルトbase URL。        |
| `api`      | `ModelApi`               | このprovider catalog内のmodel向け、任意のデフォルトAPI adapter。     |
| `headers`  | `Record<string, string>` | このprovider catalogに適用される、任意の静的header。                 |
| `models`   | `object[]`               | 必須のmodel row。`id` のないrowは無視されます。                      |

modelフィールド:

| フィールド      | 型                                                             | 意味                                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` prefixを含まないproviderローカルmodel id。                     |
| `name`          | `string`                                                       | 任意の表示名。                                                              |
| `api`           | `ModelApi`                                                     | 任意のmodel単位API上書き。                                                  |
| `baseUrl`       | `string`                                                       | 任意のmodel単位base URL上書き。                                             |
| `headers`       | `Record<string, string>`                                       | 任意のmodel単位静的header。                                                 |
| `input`         | `Array<"text" \| "image" \| "document">`                       | modelが受け付けるモダリティ。                                               |
| `reasoning`     | `boolean`                                                      | modelがreasoning挙動を公開するかどうか。                                    |
| `contextWindow` | `number`                                                       | ネイティブproviderのcontext window。                                        |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効runtime context上限。             |
| `maxTokens`     | `number`                                                       | 既知であれば最大出力トークン数。                                            |
| `cost`          | `object`                                                       | 任意の100万トークンあたりUSD価格。任意の `tieredPricing` を含みます。       |
| `compat`        | `object`                                                       | OpenClaw model config compatibilityに一致する任意の互換フラグ。             |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧状態。rowを完全に表示してはいけない場合だけ抑制してください。            |
| `statusReason`  | `string`                                                       | 利用不可状態とともに表示される任意の理由。                                  |
| `replaces`      | `string[]`                                                     | このmodelが置き換える古いproviderローカルmodel id。                         |
| `replacedBy`    | `string`                                                       | deprecated row向けの、置き換え先providerローカルmodel id。                  |
| `tags`          | `string[]`                                                     | pickerおよびfilterで使われる安定したtag。                                   |

`modelCatalog` にruntime専用データを入れないでください。providerが完全なmodel
setを知るのにaccount
state、APIリクエスト、またはローカルプロセス検出を必要とする場合、そのproviderは
`discovery` で `refreshable` または `runtime` として宣言してください。

レガシーなトップレベルcapability keyは非推奨です。`openclaw doctor --fix` を使って、
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders` を `contracts` 配下へ移動してください。通常の
manifest読み込みでは、もはやそれらのトップレベルfieldをcapability
ownershipとして扱いません。

## Manifest と package.json の違い

この2つのファイルは役割が異なります:

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | plugin code実行前に存在していなければならないdiscovery、config validation、auth-choice metadata、UI hint                         |
| `package.json`         | npm metadata、dependency installation、およびentrypoint、install gating、setup、catalog metadataに使われる `openclaw` ブロック |

どのmetadataをどこに置くべきか迷ったら、次のルールを使ってください:

- OpenClawがplugin codeを読み込む前に知る必要があるなら、`openclaw.plugin.json` に置く
- packaging、entry file、またはnpm install挙動に関するものなら、`package.json` に置く

### discoveryに影響する package.json フィールド

一部のruntime前plugin metadataは、意図的に
`openclaw.plugin.json` ではなく、`package.json` の
`openclaw` ブロック内に置かれます。

重要な例:

| フィールド                                                            | 意味                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                 | ネイティブplugin entrypointを宣言します。plugin package directory内にとどめなければなりません。                                                                                     |
| `openclaw.runtimeExtensions`                                          | インストール済みpackage向けのビルド済みJavaScript runtime entrypointを宣言します。plugin package directory内にとどめなければなりません。                                             |
| `openclaw.setupEntry`                                                 | オンボーディング、遅延channel起動、read-only channel status/SecretRef discovery中に使われる軽量なsetup専用entrypoint。plugin package directory内にとどめなければなりません。          |
| `openclaw.runtimeSetupEntry`                                          | インストール済みpackage向けのビルド済みJavaScript setup entrypointを宣言します。plugin package directory内にとどめなければなりません。                                               |
| `openclaw.channel`                                                    | ラベル、docs path、alias、selection copyのような軽量なchannel catalog metadata。                                                                                                     |
| `openclaw.channel.configuredState`                                    | 「env-only setupがすでに存在するか？」に、full channel runtimeを読み込まずに答えられる軽量なconfigured-state checker metadata。                                                       |
| `openclaw.channel.persistedAuthState`                                 | 「すでに何かログイン済みか？」に、full channel runtimeを読み込まずに答えられる軽量なpersisted-auth checker metadata。                                                                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`             | バンドル済みPluginおよび外部公開Plugin向けのinstall/update hint。                                                                                                                     |
| `openclaw.install.defaultChoice`                                      | 複数のinstall sourceが利用可能な場合の優先install path。                                                                                                                              |
| `openclaw.install.minHostVersion`                                     | `>=2026.3.22` のようなsemver floorを使う、最小対応OpenClaw host version。                                                                                                             |
| `openclaw.install.expectedIntegrity`                                  | `sha512-...` のような期待されるnpm dist integrity文字列。installおよびupdateフローは、取得したartifactがこれに一致するか検証します。                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                         | configが無効な場合に、限定されたbundled-plugin再インストール回復パスを許可します。                                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`     | startup中、full channel pluginより前にsetup専用channelサーフェスを読み込めるようにします。                                                                                            |

manifest metadataは、runtime読み込み前のオンボーディングで、どのprovider/channel/setup choiceを表示するかを決定します。`package.json#openclaw.install` は、
ユーザーがそれらのchoiceの1つを選んだとき、オンボーディングに対して
そのpluginをどう取得または有効化するかを伝えます。install hintを
`openclaw.plugin.json` に移してはいけません。

`openclaw.install.minHostVersion` は、install時およびmanifest
registry読み込み時に強制されます。無効な値は拒否されます。有効だが新しすぎる値の場合、
古いhostではそのpluginはスキップされます。

厳密なnpm version pinningは、たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` にあります。公式の外部catalog
entryでは、exact specと `expectedIntegrity` を組み合わせるべきです。これにより、取得されたnpm artifactが
固定されたreleaseに一致しなくなった場合、update flowはfail-closedします。
対話型オンボーディングでは、互換性のため、bare
package名やdist-tagを含む信頼済みregistry npm specも引き続き提供されます。catalog diagnosticは、
exact、floating、integrity-pinned、missing-integrity、package-name
mismatch、invalid default-choice sourceを区別できます。また、
`expectedIntegrity` があるのに、それをpinできる有効なnpm sourceがない場合にも警告します。
`expectedIntegrity` が存在する場合、
install/update flowはそれを強制します。省略されている場合、registry解決は
integrity pinなしで記録されます。

チャネルPluginは、status、channel list、
またはSecretRef scanで、full
runtimeを読み込まずに設定済みaccountを識別する必要がある場合、`openclaw.setupEntry` を提供すべきです。
setup entryは、channel metadataに加えてsetup-safeなconfig、
status、secrets adapterを公開すべきです。network client、Gateway listener、
transport runtimeはメインextension entrypointに置いてください。

runtime entrypoint fieldは、source
entrypoint fieldに対するpackage-boundaryチェックを上書きしません。たとえば、
`openclaw.runtimeExtensions` が、package外へ逃げる `openclaw.extensions` pathを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に狭い機能です。
任意の壊れたconfigをinstall可能にするものではありません。現時点では、
欠落したbundled plugin pathや、同じbundled pluginに対する古い `channels.<id>` entryのような、
特定の古いbundled-plugin upgrade failureからの回復に対してのみinstall flowを許可します。
無関係なconfig errorは引き続きinstallをブロックし、operatorを `openclaw doctor --fix` へ誘導します。

`openclaw.channel.persistedAuthState` は、小さなchecker
module向けのpackage metadataです:

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

setup、doctor、configured-state flowが、full
channel plugin読み込み前に安価なyes/no auth
probeを必要とする場合に使ってください。対象exportは、永続化状態のみを読む小さな関数であるべきです。
full channel runtime barrel経由にしてはいけません。

`openclaw.channel.configuredState` も、安価なenv-only
configuredチェック向けに同じ形状に従います:

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

チャネルがenvまたは他の小さな非runtime入力からconfigured-stateに答えられる場合に使ってください。
チェックにfull config解決または実際の
channel runtimeが必要な場合は、そのロジックは代わりにpluginの `config.hasConfiguredState`
hookに置いてください。

## Discoveryの優先順位（重複plugin id）

OpenClawは複数のroot（bundled、global install、workspace、明示的にconfig選択されたpath）からpluginを検出します。2つの検出結果が同じ `id` を共有する場合、**もっとも優先順位の高い** manifestだけが保持されます。優先順位の低い重複は、並んで読み込まれるのではなく破棄されます。

優先順位（高い順）:

1. **Config-selected** — `plugins.entries.<id>` で明示的に固定されたpath
2. **Bundled** — OpenClawに同梱されるplugin
3. **Global install** — グローバルOpenClaw plugin rootにインストールされたplugin
4. **Workspace** — 現在のworkspace相対で検出されたplugin

影響:

- workspace内にあるbundled pluginのforkや古いコピーは、bundled buildを上書きしません。
- bunded pluginをローカルのものに実際に上書きしたい場合は、workspace discoveryに頼らず、優先順位で勝つよう `plugins.entries.<id>` で固定してください。
- 重複して破棄されたことはログに記録されるため、Doctorとstartup diagnosticは破棄されたコピーを示せます。

## JSON Schema要件

- **すべてのpluginはJSON Schemaを必ず含める必要があります**。configを受け付けない場合でも同様です。
- 空のschemaでも構いません（例: `{ "type": "object", "additionalProperties": false }`）。
- schemaはruntime時ではなく、config read/write時に検証されます。

## 検証の挙動

- 未知の `channels.*` keyは、そのchannel idが
  plugin manifestで宣言されていない限り **エラー** です。
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`
  は、**検出可能な** plugin idを参照しなければなりません。未知のidは **エラー** です。
- pluginがインストール済みでも、manifestまたはschemaが壊れている/欠落している場合、
  validationは失敗し、Doctorはplugin errorを報告します。
- plugin configが存在しても、そのpluginが **無効** の場合、config自体は保持され、
  Doctor + ログに **警告** が表示されます。

完全な `plugins.*` schemaについては [Configuration reference](/ja-JP/gateway/configuration) を参照してください。

## 注記

- manifestは、ローカルfilesystem読み込みを含む **ネイティブOpenClaw Pluginで必須** です。runtimeは引き続きplugin moduleを別途読み込みます。manifestはdiscovery + validation専用です。
- ネイティブmanifestはJSON5で解析されるため、最終的な値がobjectである限り、コメント、末尾カンマ、引用符なしkeyが受け付けられます。
- manifest loaderが読むのは文書化されたmanifest fieldだけです。カスタムのトップレベルkeyは避けてください。
- `channels`, `providers`, `cliBackends`, `skills` は、pluginがそれらを必要としない場合、すべて省略できます。
- `providerDiscoveryEntry` は軽量に保たなければならず、広範なruntime codeをimportすべきではありません。request時実行ではなく、静的provider catalog metadataまたは狭いdiscovery descriptor向けに使ってください。
- 排他的plugin kindは `plugins.slots.*` 経由で選択されます: `kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルト `legacy`）です。
- env-var metadata（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、`channelEnvVars`）は宣言的なものにすぎません。status、audit、Cron配信validation、その他のread-onlyサーフェスは、env varをconfiguredとして扱う前に、引き続きplugin trustと有効なactivation policyを適用します。
- provider codeを必要とするruntime wizard metadataについては、[Provider runtime hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
- Pluginがnative moduleに依存する場合は、ビルド手順とpackage-manager allowlist要件（たとえば pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginの始め方。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャとcapability model。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDKリファレンスとsubpath import。
  </Card>
</CardGroup>
