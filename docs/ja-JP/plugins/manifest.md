---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin設定スキーマを提供する必要がある、またはPluginバリデーションエラーをデバッグする必要があります
summary: Plugin manifest + JSON schema要件（厳格な設定バリデーション）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-04-22T04:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Pluginマニフェスト (`openclaw.plugin.json`)

このページは**ネイティブOpenClaw Pluginマニフェスト**のみを対象としています。

互換バンドルのレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では異なるマニフェストファイルを使用します。

- Codexバンドル: `.codex-plugin/plugin.json`
- Claudeバンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルトClaude component
  レイアウト
- Cursorバンドル: `.cursor-plugin/plugin.json`

OpenClawはそれらのバンドルレイアウトも自動検出しますが、ここで説明する
`openclaw.plugin.json`スキーマに対してはバリデーションされません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClaw実行時の想定に一致する場合、
バンドルメタデータに加えて、宣言されたskillルート、Claude commandルート、
Claudeバンドルの`settings.json`デフォルト、ClaudeバンドルのLSPデフォルト、
およびサポートされているhook packを読み取ります。

すべてのネイティブOpenClaw Pluginは、**plugin root**に
`openclaw.plugin.json`ファイルを含める**必要があります**。OpenClawはこのマニフェストを使って、
**Pluginコードを実行せずに**設定をバリデーションします。マニフェストが欠けている、または無効な場合は
Pluginエラーとして扱われ、設定バリデーションをブロックします。

完全なPluginシステムガイドについては[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブcapability modelおよび現在の外部互換ガイダンスについては、
[Capability model](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json`は、OpenClawがPluginコードをロードする前に読み取る
メタデータです。

用途:

- Pluginの識別情報
- 設定バリデーション
- Plugin実行時を起動しなくても利用できる認証とオンボーディングのメタデータ
- 実行時ロード前にコントロールプレーン画面が確認できる軽量な有効化ヒント
- 実行時ロード前にセットアップ/オンボーディング画面が確認できる軽量なセットアップ記述子
- Plugin実行時ロード前に解決されるべきエイリアスと自動有効化メタデータ
- 実行時ロード前にPluginを自動有効化すべき、短縮形のモデルファミリー所有メタデータ
- バンドルされた互換配線と契約カバレッジに使われる、静的なcapability ownershipスナップショット
- 共有の`openclaw qa`ホストがPlugin実行時ロード前に確認できる軽量なQA runnerメタデータ
- 実行時をロードせずにカタログおよびバリデーション画面へマージされるべき、チャンネル固有の設定メタデータ
- 設定UIヒント

用途ではないもの:

- 実行時動作の登録
- コードentrypointの宣言
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

## トップレベルフィールドリファレンス

| フィールド | 必須 | 型 | 意味 |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | はい | `string` | 正規のPlugin ID。これは`plugins.entries.<id>`で使われるIDです。 |
| `configSchema` | はい | `object` | このPlugin設定用のインラインJSON Schema。 |
| `enabledByDefault` | いいえ | `true` | バンドルされたPluginをデフォルト有効としてマークします。デフォルトで無効のままにするには、省略するか、`true`以外の任意の値を設定します。 |
| `legacyPluginIds` | いいえ | `string[]` | この正規Plugin IDへ正規化される従来のID。 |
| `autoEnableWhenConfiguredProviders` | いいえ | `string[]` | 認証、設定、またはモデル参照で触れられたときに、このPluginを自動有効化すべきプロバイダーID。 |
| `kind` | いいえ | `"memory"` \| `"context-engine"` | `plugins.slots.*`で使われる排他的なPlugin種別を宣言します。 |
| `channels` | いいえ | `string[]` | このPluginが所有するチャンネルID。検出と設定バリデーションに使われます。 |
| `providers` | いいえ | `string[]` | このPluginが所有するプロバイダーID。 |
| `modelSupport` | いいえ | `object` | 実行時前にPluginを自動ロードするために使われる、マニフェスト所有の短縮形モデルファミリーメタデータ。 |
| `providerEndpoints` | いいえ | `object[]` | プロバイダー実行時ロード前にコアが分類しなければならないプロバイダールート向けの、マニフェスト所有endpoint host/baseUrlメタデータ。 |
| `cliBackends` | いいえ | `string[]` | このPluginが所有するCLI推論backend ID。明示的な設定参照からの起動時自動有効化に使われます。 |
| `syntheticAuthRefs` | いいえ | `string[]` | 実行時ロード前のコールドモデル検出中に、そのPlugin所有synthetic auth hookをプローブすべきプロバイダーまたはCLI backend参照。 |
| `nonSecretAuthMarkers` | いいえ | `string[]` | 非シークレットなlocal、OAuth、またはambient credential状態を表す、バンドル済みPlugin所有のプレースホルダーAPI key値。 |
| `commandAliases` | いいえ | `object[]` | 実行時ロード前にPlugin対応の設定およびCLI診断を生成すべき、このPluginが所有するコマンド名。 |
| `providerAuthEnvVars` | いいえ | `Record<string, string[]>` | OpenClawがPluginコードをロードせずに確認できる、軽量なプロバイダー認証環境変数メタデータ。 |
| `providerAuthAliases` | いいえ | `Record<string, string>` | 認証参照で別のプロバイダーIDを再利用すべきプロバイダーID。たとえば、ベースプロバイダーのAPI keyと認証プロファイルを共有するcodingプロバイダーなど。 |
| `channelEnvVars` | いいえ | `Record<string, string[]>` | OpenClawがPluginコードをロードせずに確認できる、軽量なチャンネル環境変数メタデータ。環境変数駆動のチャンネルセットアップや、汎用の起動/設定ヘルパーが確認すべき認証画面にはこれを使用してください。 |
| `providerAuthChoices` | いいえ | `object[]` | オンボーディングピッカー、優先プロバイダー解決、単純なCLIフラグ配線用の軽量な認証選択メタデータ。 |
| `activation` | いいえ | `object` | プロバイダー、コマンド、チャンネル、ルート、capabilityトリガー読み込み向けの軽量な有効化ヒント。メタデータのみであり、実際の動作は引き続きPlugin実行時が所有します。 |
| `setup` | いいえ | `object` | 検出画面とセットアップ画面がPlugin実行時をロードせずに確認できる、軽量なセットアップ/オンボーディング記述子。 |
| `qaRunners` | いいえ | `object[]` | 共有の`openclaw qa`ホストがPlugin実行時ロード前に使用する軽量なQA runner記述子。 |
| `contracts` | いいえ | `object` | 音声、リアルタイム文字起こし、リアルタイム音声、media-understanding、画像生成、音楽生成、動画生成、web-fetch、web search、およびツール所有権向けの静的バンドルcapabilityスナップショット。 |
| `channelConfigs` | いいえ | `Record<string, object>` | 実行時ロード前に検出およびバリデーション画面へマージされる、マニフェスト所有のチャンネル設定メタデータ。 |
| `skills` | いいえ | `string[]` | Plugin rootからの相対パスで指定する、読み込むskillディレクトリ。 |
| `name` | いいえ | `string` | 人間が読むためのPlugin名。 |
| `description` | いいえ | `string` | Plugin画面に表示される短い要約。 |
| `version` | いいえ | `string` | 情報用のPluginバージョン。 |
| `uiHints` | いいえ | `Record<string, object>` | 設定フィールド向けUIラベル、プレースホルダー、機密性ヒント。 |

## providerAuthChoicesリファレンス

各`providerAuthChoices`エントリは、1つのオンボーディングまたは認証選択を記述します。
OpenClawはこれをプロバイダー実行時のロード前に読み取ります。

| フィールド | 必須 | 型 | 意味 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | この選択が属するプロバイダーID。 |
| `method` | はい | `string` | ディスパッチ先の認証メソッドID。 |
| `choiceId` | はい | `string` | オンボーディングおよびCLIフローで使われる安定した認証選択ID。 |
| `choiceLabel` | いいえ | `string` | ユーザー向けラベル。省略した場合、OpenClawは`choiceId`へフォールバックします。 |
| `choiceHint` | いいえ | `string` | ピッカー用の短い補助テキスト。 |
| `assistantPriority` | いいえ | `number` | assistant駆動の対話型ピッカーでは、値が小さいほど先に並びます。 |
| `assistantVisibility` | いいえ | `"visible"` \| `"manual-only"` | assistantピッカーからは非表示にしつつ、手動CLI選択は許可します。 |
| `deprecatedChoiceIds` | いいえ | `string[]` | ユーザーをこの置き換え選択へリダイレクトすべき従来の選択ID。 |
| `groupId` | いいえ | `string` | 関連する選択をまとめるための任意のグループID。 |
| `groupLabel` | いいえ | `string` | そのグループのユーザー向けラベル。 |
| `groupHint` | いいえ | `string` | グループ用の短い補助テキスト。 |
| `optionKey` | いいえ | `string` | 単純な1フラグ認証フロー用の内部オプションキー。 |
| `cliFlag` | いいえ | `string` | `--openrouter-api-key`のようなCLIフラグ名。 |
| `cliOption` | いいえ | `string` | `--openrouter-api-key <key>`のような完全なCLIオプション形式。 |
| `cliDescription` | いいえ | `string` | CLIヘルプで使われる説明。 |
| `onboardingScopes` | いいえ | `Array<"text-inference" \| "image-generation">` | この選択を表示すべきオンボーディング画面。省略した場合、デフォルトは`["text-inference"]`です。 |

## commandAliasesリファレンス

Pluginが、ユーザーが誤って`plugins.allow`に書いたり、ルートCLIコマンドとして
実行しようとしたりしがちな実行時コマンド名を所有している場合は、`commandAliases`を使用します。OpenClawは
Plugin実行時コードをimportせずに、このメタデータを診断に使用します。

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
| `name` | はい | `string` | このPluginに属するコマンド名。 |
| `kind` | いいえ | `"runtime-slash"` | このエイリアスが、ルートCLIコマンドではなくチャットのスラッシュコマンドであることを示します。 |
| `cliCommand` | いいえ | `string` | 存在する場合、CLI操作向けに提案する関連ルートCLIコマンド。 |

## activationリファレンス

Pluginが、どのコントロールプレーンイベントで後から有効化されるべきかを
軽量に宣言できる場合は、`activation`を使用します。

## qaRunnersリファレンス

Pluginが共有`openclaw qa`ルートの下に1つ以上のtransport runnerを提供する場合は、
`qaRunners`を使用します。このメタデータは軽量かつ静的に保ってください。実際のCLI登録は、
`qaRunnerCliRegistrations`をexportする軽量な
`runtime-api.ts`画面を通じて、引き続きPlugin実行時が所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "DockerバックのMatrix live QAレーンを一時的なhomeserverに対して実行"
    }
  ]
}
```

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい | `string` | `openclaw qa`配下にマウントされるサブコマンド。例: `matrix`。 |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とする場合に使われるフォールバックヘルプテキスト。 |

このブロックはメタデータのみです。実行時動作を登録するものではなく、
`register(...)`、`setupEntry`、その他の実行時/Plugin entrypointを置き換えるものでもありません。
現在の利用側では、より広いPluginロード前の絞り込みヒントとして使用されるため、
activationメタデータが欠けていても通常は性能コストが発生するだけです。従来のマニフェスト所有フォールバックが残っている間は、
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

| フィールド | 必須 | 型 | 意味 |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders` | いいえ | `string[]` | 要求時にこのPluginを有効化すべきプロバイダーID。 |
| `onCommands` | いいえ | `string[]` | このPluginを有効化すべきコマンドID。 |
| `onChannels` | いいえ | `string[]` | このPluginを有効化すべきチャンネルID。 |
| `onRoutes` | いいえ | `string[]` | このPluginを有効化すべきルート種別。 |
| `onCapabilities` | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの有効化計画で使われる大まかなcapabilityヒント。 |

現在のlive利用側:

- コマンドトリガーCLI計画は、従来の
  `commandAliases[].cliCommand`または`commandAliases[].name`へフォールバックします
- チャンネルトリガーのセットアップ/チャンネル計画は、明示的なチャンネルactivationメタデータがない場合、
  従来の`channels[]`所有権へフォールバックします
- プロバイダートリガーのセットアップ/実行時計画は、明示的なプロバイダー
  activationメタデータがない場合、従来の
  `providers[]`およびトップレベル`cliBackends[]`所有権へフォールバックします

## setupリファレンス

セットアップおよびオンボーディング画面が、実行時ロード前に軽量なPlugin所有メタデータを必要とする場合は、`setup`を使用します。

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

トップレベルの`cliBackends`は引き続き有効で、CLI推論backendを記述し続けます。
`setup.cliBackends`は、メタデータのみを保つべきコントロールプレーン/セットアップフロー向けの、
セットアップ専用記述子画面です。

存在する場合、`setup.providers`と`setup.cliBackends`は、
セットアップ検出向けの優先される記述子先行の参照画面です。記述子が候補Pluginの絞り込みだけを行い、
セットアップにさらに豊富なセットアップ時実行時hookが必要な場合は、
`requiresRuntime: true`を設定し、フォールバック実行パスとして
`setup-api`を維持してください。

セットアップ参照ではPlugin所有の`setup-api`コードを実行できるため、
正規化された`setup.providers[].id`および`setup.cliBackends[]`の値は、
検出されたPlugin間で一意でなければなりません。所有権が曖昧な場合は、
検出順で勝者を選ぶのではなく、fail closedします。

### setup.providersリファレンス

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | はい | `string` | セットアップまたはオンボーディング中に公開されるプロバイダーID。正規化されたIDはグローバルに一意に保ってください。 |
| `authMethods` | いいえ | `string[]` | 完全な実行時をロードせずにこのプロバイダーがサポートするセットアップ/認証メソッドID。 |
| `envVars` | いいえ | `string[]` | 汎用のセットアップ/ステータス画面がPlugin実行時ロード前に確認できる環境変数。 |

### setupフィールド

| フィールド | 必須 | 型 | 意味 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | いいえ | `object[]` | セットアップおよびオンボーディング中に公開されるプロバイダーセットアップ記述子。 |
| `cliBackends` | いいえ | `string[]` | 記述子先行セットアップ参照に使われるセットアップ時backend ID。正規化されたIDはグローバルに一意に保ってください。 |
| `configMigrations` | いいえ | `string[]` | このPluginのセットアップ画面が所有する設定migration ID。 |
| `requiresRuntime` | いいえ | `boolean` | 記述子参照後もセットアップに`setup-api`実行が必要かどうか。 |

## uiHintsリファレンス

`uiHints`は、設定フィールド名から小さなレンダリングヒントへのマップです。

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

各フィールドヒントには以下を含められます。

| フィールド | 型 | 意味 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | ユーザー向けフィールドラベル。 |
| `help` | `string` | 短い補助テキスト。 |
| `tags` | `string[]` | 任意のUIタグ。 |
| `advanced` | `boolean` | このフィールドを高度な設定としてマークします。 |
| `sensitive` | `boolean` | このフィールドをシークレットまたは機密情報としてマークします。 |
| `placeholder` | `string` | フォーム入力用のプレースホルダーテキスト。 |

## contractsリファレンス

`contracts`は、OpenClawがPlugin実行時をimportせずに
読み取れる静的なcapability ownershipメタデータにのみ使用してください。

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

| フィールド | 型 | 意味 |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders` | `string[]` | このPluginが所有する音声プロバイダーID。 |
| `realtimeTranscriptionProviders` | `string[]` | このPluginが所有するリアルタイム文字起こしプロバイダーID。 |
| `realtimeVoiceProviders` | `string[]` | このPluginが所有するリアルタイム音声プロバイダーID。 |
| `mediaUnderstandingProviders` | `string[]` | このPluginが所有するmedia-understandingプロバイダーID。 |
| `imageGenerationProviders` | `string[]` | このPluginが所有する画像生成プロバイダーID。 |
| `videoGenerationProviders` | `string[]` | このPluginが所有する動画生成プロバイダーID。 |
| `webFetchProviders` | `string[]` | このPluginが所有するweb-fetchプロバイダーID。 |
| `webSearchProviders` | `string[]` | このPluginが所有するweb-searchプロバイダーID。 |
| `tools` | `string[]` | バンドル契約チェック用にこのPluginが所有するagentツール名。 |

## channelConfigsリファレンス

チャンネルPluginが、実行時ロード前に軽量な設定メタデータを必要とする場合は、
`channelConfigs`を使用します。

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

各チャンネルエントリには以下を含められます。

| フィールド | 型 | 意味 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>`用のJSON Schema。宣言された各チャンネル設定エントリに必須です。 |
| `uiHints` | `Record<string, object>` | そのチャンネル設定セクション用の任意のUIラベル/プレースホルダー/機密性ヒント。 |
| `label` | `string` | 実行時メタデータがまだ利用できないときに、ピッカーおよびinspect画面へマージされるチャンネルラベル。 |
| `description` | `string` | inspectおよびカタログ画面用の短いチャンネル説明。 |
| `preferOver` | `string[]` | 選択画面でこのチャンネルが優先すべき、従来または低優先のPlugin ID。 |

## modelSupportリファレンス

Plugin実行時ロード前に、OpenClawが`gpt-5.4`や`claude-sonnet-4.6`のような
短縮モデルIDからプロバイダーPluginを推測すべき場合は、`modelSupport`を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは以下の優先順位を適用します。

- 明示的な`provider/model`参照では、所有する`providers`マニフェストメタデータを使用します
- `modelPatterns`は`modelPrefixes`より優先されます
- 1つの非バンドルPluginと1つのバンドルPluginの両方が一致する場合、非バンドル
  Pluginが勝ちます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド | 型 | 意味 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデルIDに対して`startsWith`で一致させるプレフィックス。 |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の短縮モデルIDに対して一致させるRegexソース。 |

従来のトップレベルcapabilityキーは非推奨です。`openclaw doctor --fix`を使って
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、`webSearchProviders`を`contracts`の下へ移動してください。通常の
マニフェストロードでは、これらのトップレベルフィールドをcapability
ownershipとしては扱いません。

## マニフェストとpackage.json

この2つのファイルは異なる役割を持ちます。

| ファイル | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Pluginコード実行前に存在しなければならない、検出、設定バリデーション、認証選択メタデータ、UIヒント |
| `package.json` | npmメタデータ、依存関係インストール、およびentrypoint、インストール制御、セットアップ、またはカタログメタデータに使う`openclaw`ブロック |

どのメタデータをどちらに置くべきか迷ったら、次のルールを使ってください。

- OpenClawがPluginコードをロードする前に知る必要があるなら、`openclaw.plugin.json`に置きます
- パッケージ化、entryファイル、またはnpmインストール動作に関するものなら、`package.json`に置きます

### 検出に影響するpackage.jsonフィールド

一部の実行時前Pluginメタデータは、`openclaw.plugin.json`ではなく、
`package.json`の`openclaw`ブロック内に意図的に置かれています。

重要な例:

| フィールド | 意味 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | ネイティブPlugin entrypointを宣言します。Plugin packageディレクトリ内に留める必要があります。 |
| `openclaw.runtimeExtensions` | インストール済みパッケージ向けのビルド済みJavaScript実行時entrypointを宣言します。Plugin packageディレクトリ内に留める必要があります。 |
| `openclaw.setupEntry` | オンボーディング、遅延チャンネル起動、読み取り専用チャンネル状態/SecretRef検出で使われる軽量なsetup専用entrypoint。Plugin packageディレクトリ内に留める必要があります。 |
| `openclaw.runtimeSetupEntry` | インストール済みパッケージ向けのビルド済みJavaScript setup entrypointを宣言します。Plugin packageディレクトリ内に留める必要があります。 |
| `openclaw.channel` | ラベル、ドキュメントパス、エイリアス、選択用コピーのような軽量チャンネルカタログメタデータ。 |
| `openclaw.channel.configuredState` | フルチャンネル実行時をロードせずに「環境変数のみのセットアップがすでに存在するか」を判定できる、軽量なconfigured-state checkerメタデータ。 |
| `openclaw.channel.persistedAuthState` | フルチャンネル実行時をロードせずに「すでにサインイン済みのものがあるか」を判定できる、軽量なpersisted-auth checkerメタデータ。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開Plugin向けのインストール/更新ヒント。 |
| `openclaw.install.defaultChoice` | 複数のインストール元が利用可能な場合の優先インストール経路。 |
| `openclaw.install.minHostVersion` | `>=2026.3.22`のようなsemver floorで表す、最小サポートOpenClaw hostバージョン。 |
| `openclaw.install.allowInvalidConfigRecovery` | 設定が無効な場合に、限定的なバンドル済みPlugin再インストール復旧経路を許可します。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中に、フルチャンネルPluginの前にsetup専用チャンネル画面をロードできるようにします。 |

`openclaw.install.minHostVersion`は、インストール時およびマニフェスト
registryロード時に強制されます。無効な値は拒否され、より新しいが有効な値は古いhostでは
Pluginをスキップします。

チャンネルPluginは、フル
実行時をロードせずに状態、チャンネル一覧、またはSecretRefスキャンで設定済みアカウントを識別する必要がある場合、
`openclaw.setupEntry`を提供するべきです。setup entryは、チャンネルメタデータに加え、
setup-safeな設定、状態、シークレットアダプターを公開するべきです。ネットワーククライアント、Gatewayリスナー、
transport実行時はメイン拡張entrypointに残してください。

実行時entrypointフィールドは、ソース
entrypointフィールドのpackage境界チェックを上書きしません。たとえば、
`openclaw.runtimeExtensions`は、パスが外へ逃げる`openclaw.extensions`をロード可能にはできません。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定的です。
任意の壊れた設定をインストール可能にするものではありません。現在は、特定の古いバンドル済みPluginアップグレード失敗、
たとえばバンドル済みPluginパスの欠落や、その同じバンドル済みPlugin向けの古い`channels.<id>`エントリなどから
インストールフローが復旧できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、
運用者を`openclaw doctor --fix`へ誘導します。

`openclaw.channel.persistedAuthState`は、小さなchecker
モジュール用のpackageメタデータです。

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

セットアップ、doctor、またはconfigured-stateフローで、フルチャンネルPluginがロードされる前に
軽量なyes/no認証プローブが必要な場合に使用します。対象exportは、永続化された状態のみを読む
小さな関数にしてください。フルチャンネル実行時barrelを経由させてはいけません。

`openclaw.channel.configuredState`も、軽量な環境変数のみの
configuredチェック向けに同じ形式に従います。

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

チャンネルが、環境変数やその他の小さな
非実行時入力からconfigured-stateを判定できる場合に使用します。チェックに完全な設定解決や実際の
チャンネル実行時が必要な場合は、そのロジックを代わりにPluginの`config.hasConfiguredState`
hookに置いてください。

## 検出優先順位（重複するPlugin ID）

OpenClawは、複数のルート（バンドル済み、グローバルインストール、ワークスペース、明示的設定で選ばれたパス）からPluginを検出します。2つの検出結果が同じ`id`を共有する場合、**最も高い優先順位**のマニフェストだけが保持されます。低優先順位の重複は、並行してロードされるのではなく破棄されます。

優先順位は高い順に次の通りです:

1. **設定で選択済み** — `plugins.entries.<id>`に明示的に固定されたパス
2. **バンドル済み** — OpenClawに同梱されるPlugin
3. **グローバルインストール** — グローバルOpenClaw Plugin rootにインストールされたPlugin
4. **ワークスペース** — 現在のワークスペースから相対的に検出されたPlugin

影響:

- ワークスペース内にあるバンドル済みPluginのforkや古いコピーは、バンドル版を上書きしません。
- バンドル済みPluginをローカル版で本当に上書きしたい場合は、ワークスペース検出に頼るのではなく、`plugins.entries.<id>`で固定して、優先順位で勝たせてください。
- 重複による破棄はログに記録されるため、Doctorや起動時診断で破棄されたコピーを指摘できます。

## JSON Schema要件

- **すべてのPluginはJSON Schemaを含める必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも問題ありません（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは実行時ではなく、設定の読み取り/書き込み時にバリデーションされます。

## バリデーション動作

- 不明な`channels.*`キーは**エラー**です。ただし、そのチャンネルIDが
  Pluginマニフェストで宣言されている場合を除きます。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*`は
  **検出可能な**Plugin IDを参照しなければなりません。不明なIDは**エラー**です。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れている、または欠けている場合、
  バリデーションは失敗し、DoctorがPluginエラーを報告します。
- Plugin設定が存在しても、そのPluginが**無効**の場合、設定は保持され、
  Doctor + ログで**警告**が表示されます。

完全な`plugins.*`スキーマについては[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注意

- マニフェストは、ローカルファイルシステムからのロードを含む**ネイティブOpenClaw Pluginに必須**です。
- 実行時は引き続きPluginモジュールを別個にロードします。マニフェストは
  検出 + バリデーション専用です。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値が引き続きオブジェクトである限り、
  コメント、末尾カンマ、引用符なしキーが受け入れられます。
- マニフェストローダーが読み取るのは文書化されたマニフェストフィールドだけです。ここに
  カスタムのトップレベルキーを追加しないでください。
- `providerAuthEnvVars`は、認証プローブ、環境変数マーカー
  バリデーション、および環境変数名を確認するだけのためにPlugin
  実行時を起動すべきでない類似のプロバイダー認証画面向けの軽量メタデータ経路です。
- `providerAuthAliases`により、プロバイダーバリアントは別のプロバイダーの認証
  環境変数、認証プロファイル、設定ベース認証、API keyオンボーディング選択を
  コアにその関係をハードコードせずに再利用できます。
- `providerEndpoints`により、プロバイダーPluginは単純なendpoint host/baseUrl
  一致メタデータを所有できます。これはコアがすでにサポートするendpoint classにのみ使用してください。
  実行時動作は引き続きPluginが所有します。
- `syntheticAuthRefs`は、実行時
  registryが存在する前のコールドモデル検出で見える必要がある、プロバイダー所有synthetic
  auth hook向けの軽量メタデータ経路です。実行時プロバイダーまたはCLI backendが実際に
  `resolveSyntheticAuth`を実装している参照だけを列挙してください。
- `nonSecretAuthMarkers`は、local、OAuth、またはambient credentialマーカーのような、
  バンドル済みPlugin所有のプレースホルダーAPI key向け軽量メタデータ経路です。
  コアは、所有プロバイダーをハードコードせずに、認証表示およびシークレット監査で
  これらを非シークレットとして扱います。
- `channelEnvVars`は、シェル環境変数フォールバック、セットアップ
  プロンプト、および環境変数名を確認するだけのためにPlugin実行時を
  起動すべきでない類似のチャンネル画面向けの軽量メタデータ経路です。環境変数名はメタデータであり、
  それ自体が有効化ではありません。状態、監査、Cron配信バリデーション、
  その他の読み取り専用画面では、環境変数を設定済みチャンネルとして扱う前に、引き続きPlugin信頼と有効な有効化ポリシーを適用します。
- `providerAuthChoices`は、認証選択ピッカー、
  `--auth-choice`解決、優先プロバイダーマッピング、およびプロバイダー実行時ロード前の単純なオンボーディング
  CLIフラグ登録向けの軽量メタデータ経路です。プロバイダーコードを必要とする実行時ウィザード
  メタデータについては、
  [Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なPlugin種別は`plugins.slots.*`を通じて選択されます。
  - `kind: "memory"`は`plugins.slots.memory`で選択されます。
  - `kind: "context-engine"`は`plugins.slots.contextEngine`で選択されます
    （デフォルト: 組み込み`legacy`）。
- `channels`、`providers`、`cliBackends`、`skills`は、
  Pluginがそれらを必要としない場合は省略できます。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順と必要な
  package-manager許可リスト要件（例: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — Pluginではじめる
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
