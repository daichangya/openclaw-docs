---
read_when:
    - OpenClaw pluginを作成している場合
    - plugin config schemaを提供する必要がある場合、またはplugin validation errorsをデバッグしている場合
summary: plugin manifest + JSON schema要件（厳格な設定検証）
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-05T12:52:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin Manifest（openclaw.plugin.json）

このページは、**ネイティブなOpenClaw plugin manifest** のみを対象としています。

互換bundleレイアウトについては、[Plugin bundles](/plugins/bundles) を参照してください。

互換bundle形式では、別のmanifest filesを使います。

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` または、manifestを持たない
  デフォルトのClaude componentレイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClawはそれらのbundleレイアウトも自動検出しますが、このページで説明する
`openclaw.plugin.json` schemaに対しては検証しません。

互換bundleについて、OpenClawは現在、bundle metadataに加えて、宣言された
skill roots、Claude command roots、Claude bundleの `settings.json` defaults、
Claude bundleのLSP defaults、および、そのレイアウトがOpenClaw runtimeの期待に一致する場合に
サポートされるhook packsを読み取ります。

すべてのネイティブOpenClaw pluginは、**plugin root** に
`openclaw.plugin.json` fileを必ず含めなければなりません。OpenClawはこのmanifestを使って、
**plugin codeを実行せずに**設定を検証します。manifestが欠けている、または無効な場合は
plugin errorとして扱われ、config validationをブロックします。

plugin system全体のガイドは [Plugins](/tools/plugin) を参照してください。
ネイティブcapability modelと現在の外部互換ガイダンスについては:
[Capability model](/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、plugin codeを読み込む前にOpenClawが読むmetadataです。

用途:

- plugin identity
- config validation
- plugin runtimeを起動しなくても利用できるauthおよびonboarding metadata
- plugin runtimeが読み込まれる前に解決されるべきaliasとauto-enable metadata
- plugin runtimeが読み込まれる前にpluginを自動有効化すべき
  shorthand model-family ownership metadata
- bundled compat wiringおよびcontract coverageに使われる静的capability ownership snapshot
- runtimeを読み込まずにcatalogおよびvalidation surfacesへマージされるべきchannel固有config metadata
- config UI hints

用途ではないもの:

- runtime behaviorの登録
- code entrypointsの宣言
- npm install metadata

それらはplugin codeと `package.json` に属します。

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

## リッチな例

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

## トップレベルフィールドリファレンス

| Field                               | Required | Type                             | 意味                                                                                                                                                                                       |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | 正規のplugin idです。これは `plugins.entries.<id>` で使われるidです。                                                                                                                      |
| `configSchema`                      | Yes      | `object`                         | このpluginのconfig用インラインJSON Schemaです。                                                                                                                                            |
| `enabledByDefault`                  | No       | `true`                           | bundled pluginをデフォルト有効としてマークします。デフォルトで無効のままにするには、省略するか、`true` 以外の任意の値を設定します。                                                       |
| `legacyPluginIds`                   | No       | `string[]`                       | この正規plugin idへ正規化されるlegacy idsです。                                                                                                                                             |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | auth、config、またはmodel refsで言及されたときに、このpluginを自動有効化すべきprovider idsです。                                                                                            |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的plugin kindを宣言します。                                                                                                                                |
| `channels`                          | No       | `string[]`                       | このpluginが所有するchannel idsです。discoveryとconfig validationに使われます。                                                                                                            |
| `providers`                         | No       | `string[]`                       | このpluginが所有するprovider idsです。                                                                                                                                                      |
| `modelSupport`                      | No       | `object`                         | plugin runtime前にpluginを自動読み込みするために使われる、manifest所有のshorthand model-family metadataです。                                                                              |
| `cliBackends`                       | No       | `string[]`                       | このpluginが所有するCLI inference backend idsです。明示的なconfig refsからの起動時自動有効化に使われます。                                                                                 |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | plugin codeを読み込まずにOpenClawが調べられる、軽量なprovider-auth env metadataです。                                                                                                      |
| `providerAuthChoices`               | No       | `object[]`                       | onboarding picker、preferred-provider解決、単純なCLI flag配線のための軽量auth-choice metadataです。                                                                                        |
| `contracts`                         | No       | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、video-generation、web-fetch、web search、およびtool ownership用の静的bundled capability snapshotです。 |
| `channelConfigs`                    | No       | `Record<string, object>`         | runtime前にdiscoveryとvalidation surfacesへマージされる、manifest所有のchannel config metadataです。                                                                                        |
| `skills`                            | No       | `string[]`                       | plugin rootからの相対パスで指定する、読み込むskill directoriesです。                                                                                                                         |
| `name`                              | No       | `string`                         | 人が読めるplugin名です。                                                                                                                                                                     |
| `description`                       | No       | `string`                         | plugin surfacesに表示される短い要約です。                                                                                                                                                   |
| `version`                           | No       | `string`                         | 情報用のplugin versionです。                                                                                                                                                                 |
| `uiHints`                           | No       | `Record<string, object>`         | config fields向けのUI labels、placeholders、sensitivity hintsです。                                                                                                                          |

## providerAuthChoicesリファレンス

各 `providerAuthChoices` エントリは、1つのonboardingまたはauth choiceを表します。
OpenClawはprovider runtimeが読み込まれる前にこれを読みます。

| Field                 | Required | Type                                            | 意味                                                                                                     |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | このchoiceが属するprovider idです。                                                                      |
| `method`              | Yes      | `string`                                        | ディスパッチ先のauth method idです。                                                                     |
| `choiceId`            | Yes      | `string`                                        | onboardingおよびCLI flowsで使われる安定したauth-choice idです。                                          |
| `choiceLabel`         | No       | `string`                                        | ユーザー向けラベルです。省略時、OpenClawは `choiceId` を使います。                                       |
| `choiceHint`          | No       | `string`                                        | picker向けの短い補助テキストです。                                                                       |
| `assistantPriority`   | No       | `number`                                        | assistant主導の対話型pickerで、値が小さいほど先に並びます。                                              |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | assistant pickerからは隠しつつ、手動CLI選択は許可します。                                                |
| `deprecatedChoiceIds` | No       | `string[]`                                      | ユーザーをこの置き換えchoiceへ誘導すべきlegacy choice idsです。                                          |
| `groupId`             | No       | `string`                                        | 関連choiceをまとめる任意のgroup idです。                                                                 |
| `groupLabel`          | No       | `string`                                        | そのgroupのユーザー向けラベルです。                                                                      |
| `groupHint`           | No       | `string`                                        | group向けの短い補助テキストです。                                                                        |
| `optionKey`           | No       | `string`                                        | 単一flagの単純なauth flow用内部option keyです。                                                          |
| `cliFlag`             | No       | `string`                                        | `--openrouter-api-key` のようなCLI flag名です。                                                          |
| `cliOption`           | No       | `string`                                        | `--openrouter-api-key <key>` のような完全なCLI option形です。                                            |
| `cliDescription`      | No       | `string`                                        | CLI helpで使われる説明です。                                                                             |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | このchoiceをどのonboarding surfaceに表示するか。省略時は `["text-inference"]` がデフォルトになります。 |

## uiHintsリファレンス

`uiHints` は、config field名から小さな表示ヒントへのマップです。

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

各field hintには次を含められます。

| Field         | Type       | 意味                                 |
| ------------- | ---------- | ------------------------------------ |
| `label`       | `string`   | ユーザー向けfield label。            |
| `help`        | `string`   | 短い補助テキスト。                   |
| `tags`        | `string[]` | 任意のUI tags。                      |
| `advanced`    | `boolean`  | fieldをadvancedとしてマークします。  |
| `sensitive`   | `boolean`  | fieldをsecretまたはsensitiveとしてマークします。 |
| `placeholder` | `string`   | form input向けplaceholder text。     |

## contractsリファレンス

`contracts` は、plugin runtimeをimportせずにOpenClawが
読み取れる静的capability ownership metadataにのみ使ってください。

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

各リストは任意です。

| Field                            | Type       | 意味                                                     |
| -------------------------------- | ---------- | -------------------------------------------------------- |
| `speechProviders`                | `string[]` | このpluginが所有するspeech provider idsです。            |
| `realtimeTranscriptionProviders` | `string[]` | このpluginが所有するrealtime-transcription provider idsです。 |
| `realtimeVoiceProviders`         | `string[]` | このpluginが所有するrealtime-voice provider idsです。    |
| `mediaUnderstandingProviders`    | `string[]` | このpluginが所有するmedia-understanding provider idsです。 |
| `imageGenerationProviders`       | `string[]` | このpluginが所有するimage-generation provider idsです。  |
| `videoGenerationProviders`       | `string[]` | このpluginが所有するvideo-generation provider idsです。  |
| `webFetchProviders`              | `string[]` | このpluginが所有するweb-fetch provider idsです。         |
| `webSearchProviders`             | `string[]` | このpluginが所有するweb-search provider idsです。        |
| `tools`                          | `string[]` | bundled contract checks用にこのpluginが所有するagent tool namesです。 |

## channelConfigsリファレンス

channel pluginがruntime前に軽量config metadataを必要とする場合は
`channelConfigs` を使ってください。

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

各channelエントリには次を含められます。

| Field         | Type                     | 意味                                                                                     |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用JSON Schemaです。宣言された各channel configエントリで必須です。       |
| `uiHints`     | `Record<string, object>` | そのchannel config section向けの任意のUI labels/placeholders/sensitive hintsです。      |
| `label`       | `string`                 | runtime metadataがまだ準備できていない場合にpickerおよびinspect surfacesへマージされるchannel labelです。 |
| `description` | `string`                 | inspectおよびcatalog surfaces向けの短いchannel descriptionです。                         |
| `preferOver`  | `string[]`               | selection surfacesでこのchannelが優先すべきlegacyまたは低優先度plugin idsです。         |

## modelSupportリファレンス

plugin runtimeが読み込まれる前に、`gpt-5.4` や `claude-sonnet-4.6` のような
shorthand model idsからOpenClawがprovider pluginを推測すべき場合は、
`modelSupport` を使ってください。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な `provider/model` refsは、manifest metadata内の所有 `providers` を使います
- `modelPatterns` は `modelPrefixes` より優先されます
- 1つのnon-bundled pluginと1つのbundled pluginの両方が一致した場合、non-bundled
  pluginが勝ちます
- 残る曖昧さは、ユーザーまたはconfigがproviderを指定するまで無視されます

フィールド:

| Field           | Type       | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand model idsに対して `startsWith` で一致させるprefixesです。 |
| `modelPatterns` | `string[]` | profile suffix除去後のshorthand model idsに対して一致させるregex sourcesです。 |

legacyなトップレベルcapability keysは非推奨です。`openclaw doctor --fix` を使って、
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、`webSearchProviders` を `contracts` 配下へ移動してください。
通常のmanifest loadingでは、これらのトップレベルfieldsはcapability
ownershipとして扱われなくなりました。

## manifestとpackage.jsonの違い

この2つのファイルは別の役割を持ちます。

| File                   | 用途                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | discovery、config validation、auth-choice metadata、およびplugin code実行前に存在している必要があるUI hints                  |
| `package.json`         | npm metadata、dependency installation、およびentrypoints、install gating、setup、catalog metadataに使われる `openclaw` block |

どこに置くべきmetadataか迷ったら、次のルールを使ってください。

- OpenClawがplugin codeを読み込む前に知る必要があるなら、`openclaw.plugin.json` に置く
- packaging、entry files、またはnpm install behaviorに関するものなら、`package.json` に置く

### discoveryに影響するpackage.json fields

一部のpre-runtime plugin metadataは、`openclaw.plugin.json` ではなく
`package.json` の `openclaw` block配下に意図的に置かれています。

重要な例:

| Field                                                             | 意味                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ネイティブplugin entrypointsを宣言します。                                             |
| `openclaw.setupEntry`                                             | onboardingおよび遅延channel startup中に使われる、軽量なsetup専用entrypointです。      |
| `openclaw.channel`                                                | labels、docs paths、aliases、selection copyのような軽量channel catalog metadataです。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | bundledおよび外部公開plugin向けのinstall/update hintsです。                            |
| `openclaw.install.defaultChoice`                                  | 複数install sourceが利用可能なときの優先install pathです。                            |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` のようなsemver floorで表す、サポートされる最小OpenClaw host versionです。 |
| `openclaw.install.allowInvalidConfigRecovery`                     | configが無効なときの、限定的なbundled-plugin再インストール回復経路を許可します。       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | startup中、完全なchannel pluginより先にsetup-only channel surfacesを読み込めるようにします。 |

`openclaw.install.minHostVersion` は、install時とmanifest
registry loading時に強制されます。無効な値は拒否されます。新しすぎるが有効な値は、
古いhostではそのpluginをスキップさせます。

`openclaw.install.allowInvalidConfigRecovery` は意図的に対象を絞っています。
任意の壊れたconfigをinstall可能にするものではありません。現時点では、
missing bundled plugin pathや、その同じbundled pluginに対する古い `channels.<id>` エントリのような、
特定の古いbundled-plugin upgrade failureからinstall flowが回復することだけを許可します。
無関係なconfig errorsは引き続きinstallをブロックし、operatorは
`openclaw doctor --fix` へ誘導されます。

## JSON Schema要件

- **すべてのpluginはJSON Schemaを含めなければなりません**。configを受け付けない場合でも必要です。
- 空のschemaでも構いません（例: `{ "type": "object", "additionalProperties": false }`）。
- Schemaはruntime時ではなく、config read/write時に検証されます。

## 検証の挙動

- plugin manifestでchannel idが宣言されていない限り、不明な `channels.*` keysは**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*` は
  **discoverable** なplugin idsを参照しなければなりません。不明なidsは**エラー**です。
- pluginがインストールされていてもmanifestまたはschemaが壊れている、あるいは欠けている場合、
  validationは失敗し、Doctorがplugin errorを報告します。
- plugin configが存在してもpluginが**無効**なら、そのconfigは保持され、
  Doctor + logsで**警告**が表示されます。

完全な `plugins.*` schemaについては [Configuration reference](/gateway/configuration) を参照してください。

## 注意

- manifestは、ローカルfilesystem loadを含む**ネイティブOpenClaw pluginsで必須**です。
- runtimeは引き続きplugin moduleを別途読み込みます。manifestは
  discovery + validation専用です。
- ネイティブmanifestはJSON5で解析されるため、最終値がobjectである限り、
  comments、trailing commas、unquoted keysが受け付けられます。
- manifest loaderが読むのは文書化されたmanifest fieldsだけです。ここに
  独自のトップレベルkeysを追加するのは避けてください。
- `providerAuthEnvVars` は、auth probes、env-marker
  validation、そのほかenv名を調べるためだけにplugin runtimeを起動したくない
  provider-auth surfaces向けの軽量metadata経路です。
- `providerAuthChoices` は、auth-choice pickers、
  `--auth-choice` 解決、preferred-provider mapping、provider runtime読み込み前の単純なonboarding
  CLI flag登録向けの軽量metadata経路です。provider codeが必要なruntime wizard
  metadataについては、
  [Provider runtime hooks](/plugins/architecture#provider-runtime-hooks) を参照してください。
- 排他的plugin kindsは `plugins.slots.*` で選択されます。
  - `kind: "memory"` は `plugins.slots.memory` で選択されます。
  - `kind: "context-engine"` は `plugins.slots.contextEngine`
    で選択されます（デフォルト: built-in `legacy`）。
- pluginが不要なら、`channels`、`providers`、`cliBackends`、`skills` は省略できます。
- pluginがnative modulesに依存する場合は、build stepsと
  package-manager allowlist要件（たとえば pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/plugins/building-plugins) — pluginのはじめに
- [Plugin Architecture](/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/plugins/sdk-overview) — Plugin SDKリファレンス
