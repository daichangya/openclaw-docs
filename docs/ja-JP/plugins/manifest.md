---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin設定スキーマを提供する必要がある、またはPluginバリデーションエラーをデバッグする必要があります
summary: Pluginマニフェスト + JSONスキーマ要件（厳格な設定バリデーション）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-04-24T09:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

このページは、**ネイティブOpenClaw Pluginマニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では異なるマニフェストファイルを使用します:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` またはマニフェストのないデフォルトのClaude component
  レイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClawはそれらのバンドルレイアウトも自動検出しますが、ここで説明する
`openclaw.plugin.json` スキーマに対してはバリデーションされません。

互換バンドルについて、OpenClawは現在、バンドルメタデータに加えて、宣言された
skill root、Claude command root、Claude bundleの`settings.json`デフォルト、
Claude bundleのLSPデフォルト、およびレイアウトが
OpenClawランタイム期待値に一致する場合のサポート対象hook packを読み取ります。

すべてのネイティブOpenClaw Pluginは、**plugin root**に
`openclaw.plugin.json` ファイルを**必ず**含める必要があります。OpenClawはこのマニフェストを使って、
**Pluginコードを実行せずに**設定をバリデーションします。マニフェストが欠落している、
または無効な場合はPluginエラーとして扱われ、設定バリデーションをブロックします。

完全なPluginシステムガイドは[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブcapability modelおよび現在の外部互換性ガイダンスについては:
[Capability model](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClawが**Pluginコードをロードする前に**
読み取るメタデータです。以下の内容はすべて、Pluginランタイムを起動せずに調べられる程度に軽量である必要があります。

**用途:**

- Plugin ID、設定バリデーション、設定UIヒント
- 認証、オンボーディング、セットアップメタデータ（alias、自動有効化、プロバイダー環境変数、認証選択肢）
- control-planeサーフェス向けの有効化ヒント
- shorthand model-family ownership
- 静的なcapability ownershipスナップショット（`contracts`）
- 共有`openclaw qa`ホストが検査できるQAランナーメタデータ
- カタログおよびバリデーションサーフェスにマージされるチャンネル固有の設定メタデータ

**用途にしないもの:** ランタイム動作の登録、コードentrypointの宣言、
またはnpmインストールメタデータ。これらはPluginコードと`package.json`に属します。

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

| フィールド | 必須 | 型 | 意味 |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正式なPlugin idです。このidは `plugins.entries.<id>` で使用されます。 |
| `configSchema`                       | はい     | `object`                         | このPlugin設定用のインラインJSONスキーマです。 |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル済みPluginをデフォルトで有効としてマークします。省略するか、`true`以外の値を設定すると、Pluginはデフォルトで無効のままになります。 |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正式なPlugin idに正規化されるlegacy idです。 |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | 認証、設定、またはモデルrefがこれらに言及したときに、このPluginを自動有効化すべきプロバイダーidです。 |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的なPlugin種別を宣言します。 |
| `channels`                           | いいえ   | `string[]`                       | このPluginが所有するチャンネルidです。Discoveryと設定バリデーションに使用されます。 |
| `providers`                          | いいえ   | `string[]`                       | このPluginが所有するプロバイダーidです。 |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Plugin rootからの相対パスで指定する軽量なprovider-discoveryモジュールパスです。フルPluginランタイムを有効化せずにロードできる、マニフェストスコープのプロバイダーカタログメタデータ用です。 |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前にPluginを自動ロードするために使われる、マニフェスト所有の短縮モデルファミリーメタデータです。 |
| `providerEndpoints`                  | いいえ   | `object[]`                       | コアがプロバイダーランタイムのロード前に分類しなければならない、プロバイダールート向けのマニフェスト所有endpoint host/baseUrlメタデータです。 |
| `cliBackends`                        | いいえ   | `string[]`                       | このPluginが所有するCLI推論backend idです。明示的な設定refから起動時に自動有効化するために使用されます。 |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイムロード前のコールドモデルDiscovery時に、このPlugin所有のsynthetic auth hookを調査すべきプロバイダーまたはCLI backend refです。 |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非シークレットなローカル、OAuth、またはambient credential状態を表す、バンドル済みPlugin所有のプレースホルダーAPIキー値です。 |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイムロード前に、Plugin対応の設定およびCLI診断を生成すべき、このPlugin所有のコマンド名です。 |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードをロードせずに検査できる、軽量なプロバイダー認証環境変数メタデータです。 |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | 認証参照時に別のプロバイダーidを再利用すべきプロバイダーidです。たとえば、ベースプロバイダーのAPIキーと認証プロファイルを共有するコーディングプロバイダーなどです。 |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードをロードせずに検査できる、軽量なチャンネル環境変数メタデータです。env駆動のチャンネルセットアップや、汎用の起動/設定ヘルパーが認識すべき認証サーフェスにはこれを使用してください。 |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングピッカー、優先プロバイダー解決、およびシンプルなCLIフラグ配線向けの軽量な認証選択メタデータです。 |
| `activation`                         | いいえ   | `object`                         | プロバイダー、コマンド、チャンネル、ルート、およびcapabilityトリガーによるロード向けの軽量な有効化プランナーメタデータです。メタデータ専用であり、実際の動作は引き続きPluginランタイムが所有します。 |
| `setup`                              | いいえ   | `object`                         | DiscoveryおよびセットアップサーフェスがPluginランタイムをロードせずに検査できる、軽量なセットアップ/オンボーディング記述子です。 |
| `qaRunners`                          | いいえ   | `object[]`                       | Pluginランタイムロード前に共有 `openclaw qa` ホストが使用する軽量なQAランナー記述子です。 |
| `contracts`                          | いいえ   | `object`                         | 外部認証hook、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびツール所有権に関する静的なバンドル済みcapabilityスナップショットです。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダーid向けの、軽量なmedia-understandingデフォルトです。 |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイムロード前にDiscoveryおよびバリデーションサーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータです。 |
| `skills`                             | いいえ   | `string[]`                       | Plugin rootからの相対パスで指定する、ロードするSkillディレクトリです。 |
| `name`                               | いいえ   | `string`                         | 人が読めるPlugin名です。 |
| `description`                        | いいえ   | `string`                         | Pluginサーフェスに表示される短い概要です。 |
| `version`                            | いいえ   | `string`                         | 情報提供用のPluginバージョンです。 |
| `uiHints`                            | いいえ   | `Record<string, object>`         | 設定フィールド向けのUIラベル、プレースホルダー、および機密性ヒントです。 |

## providerAuthChoicesリファレンス

各 `providerAuthChoices` エントリは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClawはこれをプロバイダーランタイムのロード前に読み取ります。

| フィールド | 必須 | 型 | 意味 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するプロバイダーidです。 |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッドidです。 |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使われる安定した認証選択idです。 |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベルです。省略時、OpenClawは `choiceId` にフォールバックします。 |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー向けの短い補助テキストです。 |
| `assistantPriority`   | いいえ   | `number`                                        | assistant駆動の対話型ピッカーで、値が小さいほど先に並びます。 |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | assistantピッカーではこの選択肢を非表示にしつつ、手動CLI選択は引き続き許可します。 |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置き換え選択肢へリダイレクトすべきlegacy choice idです。 |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループidです。 |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベルです。 |
| `groupHint`           | いいえ   | `string`                                        | グループ向けの短い補助テキストです。 |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグのシンプルな認証フロー向けの内部option keyです。 |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` のようなCLIフラグ名です。 |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` のような完全なCLI option形式です。 |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使われる説明です。 |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢をどのオンボーディングサーフェスに表示するか。省略時は `["text-inference"]` になります。 |

## commandAliasesリファレンス

`commandAliases` は、Pluginが所有するランタイムコマンド名を、ユーザーが誤って
`plugins.allow` に入れたり、ルートCLIコマンドとして実行しようとしたりする可能性がある場合に使用します。OpenClawは
このメタデータを、Pluginランタイムコードをimportせずに診断のために使用します。

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

| フィールド | 必須 | 型 | 意味 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | はい     | `string`          | このPluginに属するコマンド名です。 |
| `kind`       | いいえ   | `"runtime-slash"` | このaliasを、ルートCLIコマンドではなくチャットスラッシュコマンドとしてマークします。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI操作向けに提案する関連ルートCLIコマンドです。 |

## activationリファレンス

`activation` は、そのPluginがどのcontrol-planeイベントで
有効化/ロードプランに含めるべきかを、軽量に宣言できる場合に使用します。

このブロックはプランナーメタデータであり、ライフサイクルAPIではありません。ランタイム動作を登録せず、
`register(...)` を置き換えず、またPluginコードがすでに実行済みであることも保証しません。アクティベーションプランナーは、
既存の `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools`、およびhooksのようなマニフェスト所有メタデータにフォールバックする前に、これらのフィールドを使って候補Pluginを絞り込みます。

すでに所有関係を表している最も狭いメタデータを優先してください。
その関係を表現できるなら、`providers`、`channels`、`commandAliases`、setup記述子、または `contracts`
を使用してください。`activation` は、それらの所有フィールドでは表現できない追加のプランナーヒントに使用します。

このブロックはメタデータ専用です。ランタイム動作を登録せず、
`register(...)`、`setupEntry`、またはその他のランタイム/Plugin entrypointを置き換えません。
現在の利用側は、より広いPluginロード前の絞り込みヒントとしてこれを使用するため、
activationメタデータが欠けても通常はパフォーマンスにしか影響せず、
legacyマニフェスト所有フォールバックが存在する限り、正しさは変わらないはずです。

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

| フィールド | 必須 | 型 | 意味 |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | いいえ   | `string[]`                                           | このPluginを有効化/ロードプランに含めるべきプロバイダーidです。 |
| `onCommands`     | いいえ   | `string[]`                                           | このPluginを有効化/ロードプランに含めるべきコマンドidです。 |
| `onChannels`     | いいえ   | `string[]`                                           | このPluginを有効化/ロードプランに含めるべきチャンネルidです。 |
| `onRoutes`       | いいえ   | `string[]`                                           | このPluginを有効化/ロードプランに含めるべきルート種別です。 |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-planeアクティベーションプランニングで使われる広いcapabilityヒントです。可能な場合はより狭いフィールドを優先してください。 |

現在の実利用側:

- コマンドトリガーCLIプランニングはlegacy
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- チャンネルトリガーsetup/channelプランニングは、明示的なチャンネルactivationメタデータがない場合、
  legacy `channels[]` 所有権にフォールバックします
- プロバイダートリガーsetup/runtimeプランニングは、明示的なprovider
  activationメタデータがない場合、legacy
  `providers[]` およびトップレベル `cliBackends[]` 所有権にフォールバックします

プランナー診断では、明示的なactivationヒントとマニフェスト
所有権フォールバックを区別できます。たとえば、`activation-command-hint` は
`activation.onCommands` が一致したことを意味し、`manifest-command-alias` は
代わりにプランナーが `commandAliases` 所有権を使用したことを意味します。これらの理由ラベルは
ホスト診断およびテスト用であり、Plugin作者は引き続き所有関係を最も適切に表すメタデータを宣言するべきです。

## qaRunnersリファレンス

`qaRunners` は、Pluginが共有 `openclaw qa` ルートの下に1つ以上のtransport runnerを提供する場合に使用します。このメタデータは軽量かつ静的に保ってください。実際のCLI登録は引き続きPlugin
ランタイムが所有し、それは `qaRunnerCliRegistrations` をエクスポートする軽量な
`runtime-api.ts` サーフェスを通じて行われます。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てhomeserverに対してDockerバックのMatrixライブQAレーンを実行"
    }
  ]
}
```

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい     | `string` | `openclaw qa` 配下にマウントされるサブコマンドです。例: `matrix`。 |
| `description` | いいえ   | `string` | 共有ホストがスタブコマンドを必要とするときに使われるフォールバックヘルプテキストです。 |

## setupリファレンス

`setup` は、setupおよびオンボーディングサーフェスがランタイムロード前に
Plugin所有の軽量メタデータを必要とする場合に使用します。

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

トップレベルの `cliBackends` は引き続き有効で、CLI推論
backendを記述し続けます。`setup.cliBackends` は、メタデータ専用に保つべき
control-plane/setupフロー向けのsetup専用記述子サーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、これらは
setup Discovery向けの優先されるdescriptor-first参照サーフェスになります。
記述子が候補Pluginを絞り込むだけで、setupにさらに豊富なsetup時ランタイムhookが必要な場合は、
`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を残してください。

setup参照ではPlugin所有の `setup-api` コードを実行できるため、
正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出されたPlugin全体で一意である必要があります。曖昧な
所有権は、Discovery順から勝者を選ばずにクローズドフェイルします。

### setup.providersリファレンス

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | はい     | `string`   | setupまたはオンボーディング中に公開されるプロバイダーidです。正規化されたidはグローバルに一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | フルランタイムをロードせずにこのプロバイダーがサポートするsetup/認証メソッドidです。 |
| `envVars`     | いいえ   | `string[]` | Pluginランタイムロード前に、汎用setup/statusサーフェスが確認できる環境変数です。 |

### setupフィールド

| フィールド | 必須 | 型 | 意味 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | setupおよびオンボーディング中に公開されるプロバイダーsetup記述子です。 |
| `cliBackends`      | いいえ   | `string[]` | descriptor-first setup参照に使われるsetup時backend idです。正規化されたidはグローバルに一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | このPluginのsetupサーフェスが所有する設定migration idです。 |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子参照後にもsetupで `setup-api` 実行が必要かどうか。 |

## uiHintsリファレンス

`uiHints` は、設定フィールド名から小さなレンダリングヒントへのマップです。

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

各フィールドヒントには次を含めることができます:

| フィールド | 型 | 意味 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベル。 |
| `help`        | `string`   | 短い補助テキスト。 |
| `tags`        | `string[]` | 任意のUIタグ。 |
| `advanced`    | `boolean`  | そのフィールドを高度向けとしてマークします。 |
| `sensitive`   | `boolean`  | そのフィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contractsリファレンス

`contracts` は、OpenClawがPluginランタイムをimportせずに
読み取れる静的なcapability ownershipメタデータにのみ使用してください。

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

各リストは任意です:

| フィールド | 型 | 意味 |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | バンドル済みPluginがfactoryを登録できる埋め込みランタイムid。 |
| `externalAuthProviders`          | `string[]` | このPluginが所有する外部認証プロファイルhookのプロバイダーid。 |
| `speechProviders`                | `string[]` | このPluginが所有するspeechプロバイダーid。 |
| `realtimeTranscriptionProviders` | `string[]` | このPluginが所有するrealtime-transcriptionプロバイダーid。 |
| `realtimeVoiceProviders`         | `string[]` | このPluginが所有するrealtime-voiceプロバイダーid。 |
| `memoryEmbeddingProviders`       | `string[]` | このPluginが所有するメモリembeddingプロバイダーid。 |
| `mediaUnderstandingProviders`    | `string[]` | このPluginが所有するmedia-understandingプロバイダーid。 |
| `imageGenerationProviders`       | `string[]` | このPluginが所有するimage-generationプロバイダーid。 |
| `videoGenerationProviders`       | `string[]` | このPluginが所有するvideo-generationプロバイダーid。 |
| `webFetchProviders`              | `string[]` | このPluginが所有するweb-fetchプロバイダーid。 |
| `webSearchProviders`             | `string[]` | このPluginが所有するweb searchプロバイダーid。 |
| `tools`                          | `string[]` | バンドル済み契約チェック用にこのPluginが所有するagentツール名。 |

`resolveExternalAuthProfiles` を実装するプロバイダーPluginは
`contracts.externalAuthProviders` を宣言する必要があります。宣言のないPluginも
非推奨の互換フォールバック経由で引き続き動作しますが、そのフォールバックは遅く、
移行期間後に削除されます。

バンドル済みメモリembeddingプロバイダーは、
`local` のような組み込みadapterを含め、公開するすべてのadapter idについて
`contracts.memoryEmbeddingProviders` を宣言する必要があります。スタンドアロンCLIパスは、
フルGatewayランタイムがプロバイダーを登録する前に、所有Pluginのみをロードするために
このマニフェスト契約を使用します。

## mediaUnderstandingProviderMetadataリファレンス

`mediaUnderstandingProviderMetadata` は、media-understandingプロバイダーに
デフォルトモデル、自動認証フォールバック優先度、またはネイティブ文書サポートがあり、
汎用コアヘルパーがランタイムロード前にそれを必要とする場合に使用します。キーは
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

各プロバイダーエントリには次を含めることができます:

| フィールド | 型 | 意味 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディアcapability。 |
| `defaultModels`        | `Record<string, string>`            | 設定でモデルが指定されていない場合に使われる、capabilityごとのモデルデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 自動認証情報ベースのプロバイダーフォールバックで、値が小さいほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | このプロバイダーがサポートするネイティブ文書入力。 |

## channelConfigsリファレンス

`channelConfigs` は、チャンネルPluginがランタイムロード前に
軽量な設定メタデータを必要とする場合に使用します。

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

各チャンネルエントリには次を含めることができます:

| フィールド | 型 | 意味 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用のJSONスキーマです。宣言された各チャンネル設定エントリで必須です。 |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション向けの任意のUIラベル/プレースホルダー/機密性ヒント。 |
| `label`       | `string`                 | ランタイムメタデータが未準備なときに、ピッカーおよびinspectサーフェスへマージされるチャンネルラベル。 |
| `description` | `string`                 | inspectおよびcatalogサーフェス向けの短いチャンネル説明。 |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャンネルが優先すべきlegacyまたは低優先度のPlugin id。 |

## modelSupportリファレンス

`modelSupport` は、`gpt-5.5` や `claude-sonnet-4.6` のような短縮モデルidから
Pluginランタイムロード前にOpenClawがあなたのプロバイダーPluginを推測すべき場合に使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します:

- 明示的な `provider/model` refは、所有する `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- バンドルされていないPluginとバンドル済みPluginの両方が一致した場合、
  バンドルされていないPluginが優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド | 型 | 意味 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデルidに対して `startsWith` で一致するプレフィックス。 |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の短縮モデルidに対して一致する正規表現ソース。 |

legacyトップレベルcapabilityキーは非推奨です。`openclaw doctor --fix` を使って
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、および `webSearchProviders` を `contracts` 配下へ移動してください。通常の
マニフェストロードでは、これらのトップレベルフィールドをもはやcapability
ownershipとして扱いません。

## マニフェストとpackage.jsonの違い

この2つのファイルは異なる役割を持ちます:

| ファイル | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery、設定バリデーション、認証選択メタデータ、およびPluginコード実行前に存在している必要があるUIヒント |
| `package.json`         | npmメタデータ、依存関係インストール、およびentrypoint、インストールゲート、setup、またはcatalogメタデータに使われる `openclaw` ブロック |

どこに置くべきメタデータかわからない場合は、次のルールを使ってください:

- OpenClawがPluginコードをロードする前に知る必要があるなら、`openclaw.plugin.json` に置きます
- パッケージング、entryファイル、またはnpmインストール動作に関するものなら、`package.json` に置きます

### Discoveryに影響するpackage.jsonフィールド

一部のランタイム前Pluginメタデータは、意図的に `openclaw.plugin.json` ではなく
`package.json` の `openclaw` ブロック配下に置かれています。

重要な例:

| フィールド | 意味 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ネイティブPlugin entrypointを宣言します。Pluginパッケージディレクトリ内にとどめる必要があります。 |
| `openclaw.runtimeExtensions`                                      | インストール済みパッケージ用のビルド済みJavaScriptランタイムentrypointを宣言します。Pluginパッケージディレクトリ内にとどめる必要があります。 |
| `openclaw.setupEntry`                                             | オンボーディング、遅延チャンネル起動、および読み取り専用のチャンネルステータス/SecretRef Discovery中に使われる軽量なsetup専用entrypointです。Pluginパッケージディレクトリ内にとどめる必要があります。 |
| `openclaw.runtimeSetupEntry`                                      | インストール済みパッケージ用のビルド済みJavaScript setup entrypointを宣言します。Pluginパッケージディレクトリ内にとどめる必要があります。 |
| `openclaw.channel`                                                | ラベル、ドキュメントパス、alias、選択用コピーなどの軽量なチャンネルcatalogメタデータ。 |
| `openclaw.channel.configuredState`                                | 「envのみのセットアップがすでに存在するか？」に、フルチャンネルランタイムをロードせずに答えられる軽量なconfigured-stateチェッカーメタデータ。 |
| `openclaw.channel.persistedAuthState`                             | 「何かがすでにサインイン済みか？」に、フルチャンネルランタイムをロードせずに答えられる軽量なpersisted-authチェッカーメタデータ。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドル済みPluginおよび外部公開Plugin向けのインストール/更新ヒント。 |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用可能な場合の優先インストールパス。 |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` のようなsemver下限を使った、サポートされる最小OpenClawホストバージョン。 |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` のような期待されるnpm dist integrity文字列です。インストールおよび更新フローでは、取得したアーティファクトをこれと照合します。 |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効なときの限定的なバンドル済みPlugin再インストール回復パスを許可します。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中、フルチャンネルPluginの前にsetup専用チャンネルサーフェスをロードできるようにします。 |

マニフェストメタデータは、ランタイムロード前の
オンボーディングにどのプロバイダー/チャンネル/setup選択肢が表示されるかを決定します。`package.json#openclaw.install` は、
ユーザーがそれらの選択肢の1つを選んだときに、そのPluginをどう取得または有効化するかを
オンボーディングへ伝えます。インストールヒントを `openclaw.plugin.json` に移さないでください。

`openclaw.install.minHostVersion` は、インストール中およびマニフェスト
レジストリ読み込み中に強制されます。無効な値は拒否されます。新しいが有効な値の場合、古いホストではそのPluginをスキップします。

厳密なnpmバージョン固定は、すでに `npmSpec` にあります。たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` です。公式の外部catalog
エントリでは、updateフローが取得したnpmアーティファクトが固定済みリリースと一致しなくなった場合にクローズドフェイルするよう、
厳密なspecを `expectedIntegrity` と組み合わせるべきです。
対話型オンボーディングでは、互換性のため、パッケージ名のみやdist-tagを含む
信頼済みレジストリnpm specも引き続き提供されます。catalog診断では、
厳密、浮動、integrity固定済み、およびintegrity未設定のソースを区別できます。
`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。存在しない場合、
レジストリ解決はintegrity固定なしで記録されます。

チャンネルPluginは、ステータス、チャンネル一覧、
またはSecretRefスキャンでフルランタイムをロードせずに設定済みアカウントを識別する必要がある場合、
`openclaw.setupEntry` を提供するべきです。setup entrypointは、チャンネルメタデータに加え、setupで安全なconfig、
status、およびsecrets adapterを公開する必要があります。ネットワーククライアント、Gatewayリスナー、および
transportランタイムは、メインextension entrypointに置いてください。

ランタイムentrypointフィールドは、ソース
entrypointフィールドに対するパッケージ境界チェックを上書きしません。たとえば、
`openclaw.runtimeExtensions` は、外へ逃げる `openclaw.extensions` パスをロード可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。これによって
任意の壊れた設定がインストール可能になるわけではありません。現在は、特定の古いバンドル済みPluginアップグレード失敗からの回復、たとえば
バンドル済みPluginパスの欠落や、その同じバンドル済みPluginに対する古い `channels.<id>` エントリだけを
インストールフローで回復可能にします。無関係な設定エラーは引き続きインストールをブロックし、
運用者を `openclaw doctor --fix` へ誘導します。

`openclaw.channel.persistedAuthState` は、小さなチェッカーモジュール向けの
パッケージメタデータです:

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

setup、doctor、またはconfigured-stateフローが、フル
チャンネルPluginロード前に、安価なyes/no認証プローブを必要とする場合に使用します。対象のexportは、
永続化状態のみを読み取る小さな関数にしてください。フル
チャンネルランタイムbarrelを経由させないでください。

`openclaw.channel.configuredState` は、安価なenvのみの
configuredチェック向けに、同じ形状に従います:

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

チャンネルが、envまたはその他の小さな
非ランタイム入力からconfigured-stateに答えられる場合に使用します。チェックにフル設定解決または実際の
チャンネルランタイムが必要な場合は、そのロジックを代わりにPluginの `config.hasConfiguredState`
hook内に置いてください。

## Discovery優先順位（重複するPlugin id）

OpenClawは複数のルート（バンドル済み、グローバルインストール、workspace、明示的に設定選択されたパス）からPluginを検出します。2つの検出結果が同じ `id` を共有する場合、**最も高い優先順位**のマニフェストだけが保持され、それより低い優先順位の重複は並行してロードされずに破棄されます。

優先順位は高い順に次の通りです:

1. **設定選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClawに同梱されるPlugin
3. **グローバルインストール** — グローバルOpenClaw PluginルートにインストールされたPlugin
4. **Workspace** — 現在のworkspace相対で検出されたPlugin

影響:

- workspaceに置かれたバンドル済みPluginのforkや古いコピーは、バンドル版をシャドーしません。
- バンドル済みPluginをローカル版で実際に上書きするには、workspace Discoveryに頼るのではなく、`plugins.entries.<id>` 経由で固定して優先順位で勝たせてください。
- 重複破棄はログに記録されるため、Doctorおよび起動診断で破棄されたコピーを示せます。

## JSONスキーマ要件

- **すべてのPluginはJSONスキーマを必ず含める必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも問題ありません（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み取り/書き込み時にバリデーションされます。

## バリデーション動作

- 不明な `channels.*` キーは**エラー**です。ただし、そのチャンネルidが
  Pluginマニフェストで宣言されている場合を除きます。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*`
  は、**検出可能な**Plugin idを参照する必要があります。不明なidは**エラー**です。
- Pluginがインストール済みでも、マニフェストまたはスキーマが壊れているか欠落している場合、
  バリデーションは失敗し、DoctorがPluginエラーを報告します。
- Plugin設定が存在しても、そのPluginが**無効**の場合、設定は保持され、
  **警告**がDoctor + ログに表示されます。

完全な `plugins.*` スキーマについては、[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注意

- マニフェストは、ローカルファイルシステムロードを含む**ネイティブOpenClaw Pluginで必須**です。ランタイムは引き続きPluginモジュールを別途ロードします。マニフェストはDiscovery + バリデーション専用です。
- ネイティブマニフェストはJSON5でパースされるため、最終値が引き続きオブジェクトである限り、コメント、末尾カンマ、クォートなしキーが受け入れられます。
- マニフェストローダーが読むのは、文書化されたマニフェストフィールドのみです。カスタムのトップレベルキーは避けてください。
- Pluginが不要なら、`channels`、`providers`、`cliBackends`、および `skills` はすべて省略できます。
- `providerDiscoveryEntry` は軽量のままにし、広範なランタイムコードをimportしないようにしてください。静的なプロバイダーカタログメタデータや狭いDiscovery記述子に使用し、リクエスト時実行には使わないでください。
- 排他的Plugin種別は `plugins.slots.*` を通じて選択されます: `kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルト `legacy`）。
- 環境変数メタデータ（`providerAuthEnvVars`、`channelEnvVars`）は宣言専用です。ステータス、監査、Cron配信バリデーション、その他の読み取り専用サーフェスは、環境変数を設定済みとして扱う前に、引き続きPlugin信頼と実効有効化ポリシーを適用します。
- プロバイダーコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順と必要なパッケージマネージャー許可リスト要件（たとえば pnpm の `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginのはじめに。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャとcapability model。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDKリファレンスとsubpath import。
  </Card>
</CardGroup>
