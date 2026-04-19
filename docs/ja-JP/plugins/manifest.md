---
read_when:
    - OpenClaw Pluginを構築しています
    - Pluginの設定スキーマを提供する必要がある、またはPluginのバリデーションエラーをデバッグする必要がある
summary: Pluginマニフェスト + JSONスキーマの要件（厳格な設定バリデーション）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-04-19T01:11:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Pluginマニフェスト（`openclaw.plugin.json`）

このページは、**ネイティブなOpenClaw Pluginマニフェスト**のみを対象としています。

互換性のあるバンドルレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codexバンドル: `.codex-plugin/plugin.json`
- Claudeバンドル: `.claude-plugin/plugin.json` またはマニフェストなしのデフォルトのClaudeコンポーネントレイアウト
- Cursorバンドル: `.cursor-plugin/plugin.json`

OpenClawはそれらのバンドルレイアウトも自動検出しますが、ここで説明する`openclaw.plugin.json`スキーマに対してはバリデーションされません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClawランタイムの想定に一致する場合に、バンドルメタデータに加えて、宣言されたskillルート、Claudeコマンドルート、Claudeバンドルの`settings.json`デフォルト、ClaudeバンドルのLSPデフォルト、およびサポートされるhook packを読み取ります。

すべてのネイティブなOpenClaw Pluginは、**Pluginルート**に`openclaw.plugin.json`ファイルを必ず含める必要があります。OpenClawはこのマニフェストを使って、**Pluginコードを実行せずに**設定をバリデーションします。マニフェストが存在しない、または無効な場合はPluginエラーとして扱われ、設定バリデーションはブロックされます。

完全なPluginシステムガイドについては、[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブなcapabilityモデルと現在の外部互換性ガイダンスについては、
[Capability model](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json`は、OpenClawがPluginコードをロードする前に読み取るメタデータです。

用途:

- Pluginの識別情報
- 設定バリデーション
- Pluginランタイムを起動せずに利用可能であるべき認証およびオンボーディングのメタデータ
- ランタイムがロードされる前にコントロールプレーンのサーフェスが確認できる、軽量なアクティベーションヒント
- ランタイムがロードされる前にセットアップ／オンボーディングのサーフェスが確認できる、軽量なセットアップ記述子
- Pluginランタイムがロードされる前に解決されるべきエイリアスおよび自動有効化メタデータ
- ランタイムがロードされる前にPluginを自動アクティベートすべき、省略記法のモデルファミリー所有メタデータ
- バンドルされた互換性配線およびコントラクトカバレッジで使用される静的なcapability所有スナップショット
- 共有の`openclaw qa`ホストがPluginランタイムのロード前に確認できる、軽量なQAランナーメタデータ
- ランタイムをロードせずにカタログおよびバリデーションのサーフェスへマージされるべき、チャネル固有の設定メタデータ
- 設定UIのヒント

用途ではないもの:

- ランタイム動作の登録
- コードエントリーポイントの宣言
- npmインストールメタデータ

これらはPluginコードと`package.json`に属します。

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

## トップレベルフィールドのリファレンス

| フィールド                          | 必須     | 型                               | 意味                                                                                                                                                                                                         |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | はい     | `string`                         | 正規のPlugin idです。このidは`plugins.entries.<id>`で使用されます。                                                                                                                                          |
| `configSchema`                      | はい     | `object`                         | このPluginの設定に対するインラインJSON Schemaです。                                                                                                                                                          |
| `enabledByDefault`                  | いいえ   | `true`                           | バンドルされたPluginをデフォルトで有効としてマークします。省略するか、`true`以外の値を設定すると、そのPluginはデフォルトで無効のままになります。                                                            |
| `legacyPluginIds`                   | いいえ   | `string[]`                       | この正規Plugin idに正規化されるレガシーidです。                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | いいえ   | `string[]`                       | 認証、設定、またはモデル参照でこれらが言及されたときに、このPluginを自動有効化すべきprovider idです。                                                                                                        |
| `kind`                              | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*`で使用される排他的なPlugin種別を宣言します。                                                                                                                                                |
| `channels`                          | いいえ   | `string[]`                       | このPluginが所有するチャネルidです。検出と設定バリデーションに使用されます。                                                                                                                                 |
| `providers`                         | いいえ   | `string[]`                       | このPluginが所有するprovider idです。                                                                                                                                                                        |
| `modelSupport`                      | いいえ   | `object`                         | ランタイムの前にPluginを自動ロードするために使われる、マニフェスト所有の省略記法モデルファミリーメタデータです。                                                                                             |
| `providerEndpoints`                 | いいえ   | `object[]`                       | providerランタイムがロードされる前にコアが分類する必要があるproviderルート向けの、マニフェスト所有のendpoint host/baseUrlメタデータです。                                                                   |
| `cliBackends`                       | いいえ   | `string[]`                       | このPluginが所有するCLI推論バックエンドidです。明示的な設定参照からの起動時自動アクティベーションに使用されます。                                                                                            |
| `syntheticAuthRefs`                 | いいえ   | `string[]`                       | ランタイムがロードされる前のコールドなモデル検出中に、このPlugin所有のsynthetic auth hookをプローブすべきproviderまたはCLIバックエンド参照です。                                                            |
| `nonSecretAuthMarkers`              | いいえ   | `string[]`                       | 非シークレットなローカル、OAuth、または環境依存の認証状態を表す、バンドルされたPlugin所有のプレースホルダーAPI key値です。                                                                                   |
| `commandAliases`                    | いいえ   | `object[]`                       | ランタイムがロードされる前に、Plugin対応の設定およびCLI診断を生成すべき、このPluginが所有するコマンド名です。                                                                                                 |
| `providerAuthEnvVars`               | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードをロードせずに確認できる、軽量なprovider認証envメタデータです。                                                                                                                        |
| `providerAuthAliases`               | いいえ   | `Record<string, string>`         | 認証参照時に別のprovider idを再利用すべきprovider idです。たとえば、ベースproviderのAPI keyと認証プロファイルを共有するcoding providerなどです。                                                            |
| `channelEnvVars`                    | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードをロードせずに確認できる、軽量なチャネルenvメタデータです。envベースのチャネルセットアップや、汎用の起動／設定ヘルパーが認識すべき認証サーフェスにはこれを使用してください。        |
| `providerAuthChoices`               | いいえ   | `object[]`                       | オンボーディングの選択UI、優先providerの解決、単純なCLIフラグ配線のための軽量な認証選択メタデータです。                                                                                                       |
| `activation`                        | いいえ   | `object`                         | provider、コマンド、チャネル、ルート、capabilityトリガーによるロードのための軽量なアクティベーションヒントです。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。                    |
| `setup`                             | いいえ   | `object`                         | 検出およびセットアップのサーフェスがPluginランタイムをロードせずに確認できる、軽量なセットアップ／オンボーディング記述子です。                                                                                |
| `qaRunners`                         | いいえ   | `object[]`                       | ランタイムがロードされる前に共有の`openclaw qa`ホストで使用される、軽量なQAランナー記述子です。                                                                                                              |
| `contracts`                         | いいえ   | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびtool ownershipに関する静的なバンドルcapabilityスナップショットです。 |
| `channelConfigs`                    | いいえ   | `Record<string, object>`         | ランタイムがロードされる前に検出およびバリデーションのサーフェスへマージされる、マニフェスト所有のチャネル設定メタデータです。                                                                                |
| `skills`                            | いいえ   | `string[]`                       | Pluginルートからの相対パスで指定する、ロードするSkillsディレクトリです。                                                                                                                                     |
| `name`                              | いいえ   | `string`                         | 人間が読めるPlugin名です。                                                                                                                                                                                   |
| `description`                       | いいえ   | `string`                         | Pluginサーフェスに表示される短い概要です。                                                                                                                                                                   |
| `version`                           | いいえ   | `string`                         | 情報用のPluginバージョンです。                                                                                                                                                                               |
| `uiHints`                           | いいえ   | `Record<string, object>`         | 設定フィールドに対するUIラベル、プレースホルダー、および機密性ヒントです。                                                                                                                                    |

## `providerAuthChoices` リファレンス

各`providerAuthChoices`エントリは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClawはこれをproviderランタイムがロードされる前に読み取ります。

| フィールド            | 必須     | 型                                              | 意味                                                                                                       |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するprovider idです。                                                                        |
| `method`              | はい     | `string`                                        | ディスパッチ先となる認証方式idです。                                                                       |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使用される安定したauth-choice idです。                                    |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベルです。省略した場合、OpenClawは`choiceId`を代わりに使用します。                           |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー用の短い補足テキストです。                                                                         |
| `assistantPriority`   | いいえ   | `number`                                        | アシスタント主導の対話型ピッカーで、値が小さいものほど先に並びます。                                       |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | アシスタントのピッカーからはこの選択肢を隠しつつ、手動CLI選択は引き続き許可します。                        |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置き換え後の選択肢へリダイレクトすべき、レガシーなchoice idです。                             |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のgroup idです。                                                   |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベルです。                                                                     |
| `groupHint`           | いいえ   | `string`                                        | そのグループ向けの短い補足テキストです。                                                                   |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグのシンプルな認証フローで使う内部オプションキーです。                                             |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key`のようなCLIフラグ名です。                                                            |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>`のような完全なCLIオプション形式です。                                          |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使われる説明です。                                                                              |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示すべきオンボーディングのサーフェスです。省略した場合、デフォルトは`["text-inference"]`です。 |

## `commandAliases` リファレンス

Pluginが、ユーザーが誤って`plugins.allow`に入れたり、ルートCLIコマンドとして実行しようとしたりする可能性があるランタイムコマンド名を所有している場合は、`commandAliases`を使用します。OpenClawはこのメタデータを、Pluginランタイムコードをインポートせずに診断に使用します。

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

| フィールド   | 必須     | 型                | 意味                                                                         |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | このPluginに属するコマンド名です。                                           |
| `kind`       | いいえ   | `"runtime-slash"` | そのエイリアスを、ルートCLIコマンドではなくチャットのスラッシュコマンドとして示します。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI操作向けに提案する関連するルートCLIコマンドです。            |

## `activation` リファレンス

Pluginが、どのコントロールプレーンイベントによって後でアクティベートされるべきかを軽量に宣言できる場合は、`activation`を使用します。

## `qaRunners` リファレンス

Pluginが共有の`openclaw qa`ルート配下に1つ以上のトランスポートランナーを提供する場合は、`qaRunners`を使用します。このメタデータは軽量かつ静的に保ってください。実際のCLI登録は引き続きPluginランタイムが所有し、`qaRunnerCliRegistrations`をエクスポートする軽量な`runtime-api.ts`サーフェスを通じて行います。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てhomeserverに対してDockerベースのMatrixライブQAレーンを実行します"
    }
  ]
}
```

| フィールド    | 必須     | 型       | 意味                                                                   |
| ------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | はい     | `string` | `openclaw qa`配下にマウントされるサブコマンドです。たとえば`matrix`です。 |
| `description` | いいえ   | `string` | 共有ホストがスタブコマンドを必要とするときに使うフォールバックのヘルプテキストです。 |

このブロックはメタデータのみです。ランタイム動作を登録するものではなく、`register(...)`、`setupEntry`、その他のランタイム／Pluginエントリーポイントを置き換えるものでもありません。現在の利用側では、より広いPluginロードの前に絞り込みヒントとして使用されるため、activationメタデータが欠けていても通常は性能にのみ影響し、レガシーなマニフェスト所有フォールバックがまだ存在する限り、正しさは変わらないはずです。

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

| フィールド       | 必須     | 型                                                   | 意味                                                             |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | いいえ   | `string[]`                                           | 要求されたときにこのPluginをアクティベートすべきprovider idです。 |
| `onCommands`     | いいえ   | `string[]`                                           | このPluginをアクティベートすべきコマンドidです。                 |
| `onChannels`     | いいえ   | `string[]`                                           | このPluginをアクティベートすべきチャネルidです。                 |
| `onRoutes`       | いいえ   | `string[]`                                           | このPluginをアクティベートすべきルート種別です。                 |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる大まかなcapabilityヒントです。 |

現在の実利用側:

- コマンドトリガーのCLI計画は、レガシーな
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- チャネルトリガーのセットアップ／チャネル計画は、明示的なチャネルactivationメタデータがない場合、
  レガシーな `channels[]` 所有にフォールバックします
- providerトリガーのセットアップ／ランタイム計画は、明示的なprovider
  activationメタデータがない場合、レガシーな
  `providers[]` とトップレベルの `cliBackends[]` 所有にフォールバックします

## `setup` リファレンス

ランタイムがロードされる前に、セットアップおよびオンボーディングのサーフェスでPlugin所有の軽量なメタデータが必要な場合は、`setup`を使用します。

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

トップレベルの`cliBackends`は引き続き有効で、CLI推論バックエンドを記述し続けます。`setup.cliBackends`は、メタデータのみを維持すべきコントロールプレーン／セットアップフロー向けの、セットアップ専用記述子サーフェスです。

`setup.providers`と`setup.cliBackends`が存在する場合、それらはセットアップ検出における優先的な記述子ファーストの参照サーフェスになります。記述子が候補Pluginを絞り込むだけで、セットアップにさらに豊富なセットアップ時ランタイムhookが必要な場合は、`requiresRuntime: true`を設定し、フォールバック実行パスとして`setup-api`を維持してください。

セットアップ参照ではPlugin所有の`setup-api`コードを実行できるため、正規化された`setup.providers[].id`および`setup.cliBackends[]`の値は、検出されたPlugin全体で一意でなければなりません。所有関係があいまいな場合は、検出順から勝者を選ぶのではなく、安全側に倒して失敗します。

### `setup.providers` リファレンス

| フィールド    | 必須     | 型         | 意味                                                                                   |
| ------------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | はい     | `string`   | セットアップまたはオンボーディング中に公開されるprovider idです。正規化されたidは全体で一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | フルランタイムをロードせずにこのproviderがサポートするセットアップ／認証方式idです。  |
| `envVars`     | いいえ   | `string[]` | 汎用のセットアップ／ステータスサーフェスがPluginランタイムのロード前に確認できるenv varです。 |

### `setup` フィールド

| フィールド         | 必須     | 型         | 意味                                                                                                  |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップおよびオンボーディング中に公開されるproviderセットアップ記述子です。                     |
| `cliBackends`      | いいえ   | `string[]` | 記述子ファーストのセットアップ参照に使用されるセットアップ時バックエンドidです。正規化されたidは全体で一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | このPluginのセットアップサーフェスが所有する設定migration idです。                                    |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子参照の後もセットアップに`setup-api`の実行が必要かどうかです。                                   |

## `uiHints` リファレンス

`uiHints`は、設定フィールド名から小さなレンダリングヒントへのマップです。

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

各フィールドヒントには以下を含められます。

| フィールド    | 型         | 意味                                     |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | ユーザー向けのフィールドラベルです。     |
| `help`        | `string`   | 短い補足テキストです。                   |
| `tags`        | `string[]` | 任意のUIタグです。                       |
| `advanced`    | `boolean`  | そのフィールドを高度な項目として示します。 |
| `sensitive`   | `boolean`  | そのフィールドを秘密または機密として示します。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキストです。 |

## `contracts` リファレンス

`contracts`は、OpenClawがPluginランタイムをインポートせずに読み取れる、静的なcapability所有メタデータにのみ使用してください。

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

| フィールド                       | 型         | 意味                                                                 |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `speechProviders`                | `string[]` | このPluginが所有するspeech provider idです。                         |
| `realtimeTranscriptionProviders` | `string[]` | このPluginが所有するrealtime-transcription provider idです。         |
| `realtimeVoiceProviders`         | `string[]` | このPluginが所有するrealtime-voice provider idです。                 |
| `mediaUnderstandingProviders`    | `string[]` | このPluginが所有するmedia-understanding provider idです。            |
| `imageGenerationProviders`       | `string[]` | このPluginが所有するimage-generation provider idです。               |
| `videoGenerationProviders`       | `string[]` | このPluginが所有するvideo-generation provider idです。               |
| `webFetchProviders`              | `string[]` | このPluginが所有するweb-fetch provider idです。                      |
| `webSearchProviders`             | `string[]` | このPluginが所有するweb-search provider idです。                     |
| `tools`                          | `string[]` | バンドルされたコントラクトチェック用にこのPluginが所有するagent tool名です。 |

## `channelConfigs` リファレンス

チャネルPluginが、ランタイムがロードされる前に軽量な設定メタデータを必要とする場合は、`channelConfigs`を使用します。

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

各チャネルエントリには以下を含められます。

| フィールド    | 型                       | 意味                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`用のJSON Schemaです。宣言された各チャネル設定エントリで必須です。             |
| `uiHints`     | `Record<string, object>` | そのチャネル設定セクション向けの任意のUIラベル／プレースホルダー／機密性ヒントです。         |
| `label`       | `string`                 | ランタイムメタデータの準備ができていないときに、ピッカーおよびinspectサーフェスへマージされるチャネルラベルです。 |
| `description` | `string`                 | inspectおよびcatalogサーフェス向けの短いチャネル説明です。                                   |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが優先して上回るべき、レガシーまたは優先度の低いPlugin idです。 |

## `modelSupport` リファレンス

`gpt-5.4`や`claude-sonnet-4.6`のような省略記法モデルidから、Pluginランタイムがロードされる前にOpenClawがprovider Pluginを推論すべき場合は、`modelSupport`を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な`provider/model`参照では、所有する`providers`マニフェストメタデータを使用します
- `modelPatterns`は`modelPrefixes`より優先されます
- 1つの非バンドルPluginと1つのバンドルPluginの両方が一致する場合は、非バンドルPluginが優先されます
- 残るあいまいさは、ユーザーまたは設定がproviderを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                              |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 省略記法モデルidに対して`startsWith`で一致判定するプレフィックスです。            |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の省略記法モデルidに対して一致判定する正規表現ソースです。 |

レガシーなトップレベルcapabilityキーは非推奨です。`openclaw doctor --fix`を使用して、`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、および`webSearchProviders`を`contracts`配下へ移動してください。通常のマニフェストロードでは、これらのトップレベルフィールドはもはやcapability所有として扱われません。

## マニフェストとpackage.jsonの違い

この2つのファイルは役割が異なります。

| ファイル                 | 用途                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json`   | 検出、設定バリデーション、auth-choiceメタデータ、およびPluginコード実行前に存在している必要があるUIヒント                      |
| `package.json`           | npmメタデータ、依存関係のインストール、およびエントリーポイント、インストール制御、セットアップ、またはcatalogメタデータに使う`openclaw`ブロック |

どこに置くべきメタデータか迷う場合は、次のルールを使ってください。

- OpenClawがPluginコードをロードする前に知っている必要があるなら、`openclaw.plugin.json`に置いてください
- パッケージ化、エントリーファイル、またはnpmインストール動作に関するものなら、`package.json`に置いてください

### 検出に影響する`package.json`フィールド

一部の事前ランタイムPluginメタデータは、`openclaw.plugin.json`ではなく、`package.json`内の`openclaw`ブロックに意図的に置かれています。

重要な例:

| フィールド                                                        | 意味                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ネイティブなPluginエントリーポイントを宣言します。                                                                                     |
| `openclaw.setupEntry`                                             | オンボーディングおよび遅延チャネル起動中に使われる、軽量なセットアップ専用エントリーポイントです。                                     |
| `openclaw.channel`                                                | ラベル、ドキュメントパス、エイリアス、選択用コピーなどの軽量なチャネルcatalogメタデータです。                                          |
| `openclaw.channel.configuredState`                                | フルチャネルランタイムをロードせずに「envのみのセットアップがすでに存在するか？」に答えられる、軽量なconfigured-stateチェッカーメタデータです。 |
| `openclaw.channel.persistedAuthState`                             | フルチャネルランタイムをロードせずに「すでに何かサインイン済みか？」に答えられる、軽量なpersisted-authチェッカーメタデータです。       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドルPluginおよび外部公開Plugin向けのインストール／更新ヒントです。                                                                  |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用可能な場合の優先インストールパスです。                                                                       |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22`のようなsemver下限で表す、サポートされる最小のOpenClawホストバージョンです。                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効な場合に、限定的なバンドルPlugin再インストール回復パスを許可します。                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中、完全なチャネルPluginの前にセットアップ専用のチャネルサーフェスをロードできるようにします。                                     |

`openclaw.install.minHostVersion`は、インストール時およびマニフェストレジストリのロード時に強制されます。無効な値は拒否されます。新しいが有効な値の場合、古いホストではそのPluginはスキップされます。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定的です。これによって任意の壊れた設定がインストール可能になるわけではありません。現在は、不足しているバンドルPluginパスや、同じバンドルPluginに対する古い`channels.<id>`エントリなど、特定の古いバンドルPluginアップグレード失敗からインストールフローが回復できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、オペレーターは`openclaw doctor --fix`へ案内されます。

`openclaw.channel.persistedAuthState`は、小さなチェッカーモジュール用のパッケージメタデータです。

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

セットアップ、doctor、またはconfigured-stateフローで、完全なチャネルPluginがロードされる前に、安価なyes/no認証プローブが必要な場合にこれを使用します。対象のexportは、永続化状態のみを読み取る小さな関数であるべきです。完全なチャネルランタイムbarrel経由にはしないでください。

`openclaw.channel.configuredState`も、安価なenvのみのconfiguredチェックに対して同じ形に従います。

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

チャネルが、envまたはその他の小さな非ランタイム入力からconfigured-stateに答えられる場合にこれを使用します。チェックに完全な設定解決または実際のチャネルランタイムが必要なら、そのロジックは代わりにPluginの`config.hasConfiguredState`hookに置いてください。

## JSON Schemaの要件

- **すべてのPluginはJSON Schemaを必ず含める必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも構いません（たとえば、`{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み取り／書き込み時にバリデーションされます。

## バリデーション動作

- 不明な`channels.*`キーは、チャネルidがPluginマニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および`plugins.slots.*`は、**検出可能な**Plugin idを参照していなければなりません。不明なidは**エラー**です。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れている、または存在しない場合、バリデーションは失敗し、DoctorがPluginエラーを報告します。
- Plugin設定が存在していても、そのPluginが**無効**である場合、設定は保持され、Doctorとログに**警告**が表示されます。

完全な`plugins.*`スキーマについては、[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注意事項

- マニフェストは、ローカルファイルシステムからのロードを含め、**ネイティブなOpenClaw Pluginでは必須**です。
- ランタイムは引き続きPluginモジュールを別個にロードします。マニフェストはあくまで検出とバリデーションのためのものです。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、引用符なしキーを使用できます。
- マニフェストローダーが読み取るのは、ドキュメント化されたマニフェストフィールドのみです。ここにカスタムのトップレベルキーを追加するのは避けてください。
- `providerAuthEnvVars`は、認証プローブ、env-markerバリデーション、およびenv名を確認するためだけにPluginランタイムを起動すべきでない類似のprovider認証サーフェス向けの、軽量なメタデータパスです。
- `providerAuthAliases`により、providerバリアントは、その関係をコアにハードコードすることなく、別のproviderの認証env var、認証プロファイル、設定ベースの認証、およびAPI keyオンボーディング選択肢を再利用できます。
- `providerEndpoints`により、provider Pluginは単純なendpoint host/baseUrl一致メタデータを所有できます。これはコアがすでにサポートしているendpoint classに対してのみ使用してください。ランタイム動作は引き続きPluginが所有します。
- `syntheticAuthRefs`は、ランタイムレジストリがまだ存在しない段階のコールドなモデル検出で可視でなければならない、provider所有のsynthetic auth hook向けの軽量なメタデータパスです。ランタイムproviderまたはCLIバックエンドが実際に`resolveSyntheticAuth`を実装している参照だけを列挙してください。
- `nonSecretAuthMarkers`は、ローカル、OAuth、または環境依存の認証マーカーなど、バンドルされたPlugin所有のプレースホルダーAPI key向けの軽量なメタデータパスです。コアは、所有するproviderをハードコードすることなく、認証表示およびシークレット監査においてこれらを非シークレットとして扱います。
- `channelEnvVars`は、shell-envフォールバック、セットアッププロンプト、およびenv名を確認するためだけにPluginランタイムを起動すべきでない類似のチャネルサーフェス向けの、軽量なメタデータパスです。
- `providerAuthChoices`は、providerランタイムがロードされる前のauth-choiceピッカー、`--auth-choice`解決、優先providerマッピング、および単純なオンボーディングCLIフラグ登録向けの軽量なメタデータパスです。providerコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なPlugin種別は`plugins.slots.*`を通じて選択されます。
  - `kind: "memory"` は `plugins.slots.memory` で選択されます。
  - `kind: "context-engine"` は `plugins.slots.contextEngine` で選択されます
    （デフォルト: 組み込みの`legacy`）。
- Pluginが必要としない場合、`channels`、`providers`、`cliBackends`、および`skills`は省略できます。
- Pluginがネイティブモジュールに依存している場合は、ビルド手順と、必要なパッケージマネージャーの許可リスト要件（たとえば、pnpmの`allow-build-scripts`
  - `pnpm rebuild <package>`）をドキュメント化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — Pluginのはじめに
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
