---
read_when:
    - あなたはOpenClaw Pluginを構築しています
    - Plugin設定スキーマを提供するか、Pluginの検証エラーをデバッグする必要があります
summary: Pluginマニフェスト + JSONスキーマの要件（厳格な設定検証）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-04-21T19:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Pluginマニフェスト (`openclaw.plugin.json`)

このページは、**ネイティブなOpenClaw Pluginマニフェスト**のみを対象としています。

互換バンドルのレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` またはマニフェストなしのデフォルトのClaude componentレイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClawはそれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマに対しては検証されません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClawランタイムの期待に一致している場合に、バンドルメタデータに加えて、宣言されたskillルート、Claude commandルート、Claude bundleの `settings.json` デフォルト値、Claude bundleのLSPデフォルト値、およびサポートされるhook packを読み取ります。

すべてのネイティブなOpenClaw Pluginは、**pluginルート**に `openclaw.plugin.json` ファイルを**必ず**含める必要があります。OpenClawはこのマニフェストを使用して、**Pluginコードを実行せずに**設定を検証します。マニフェストが存在しない、または無効な場合はPluginエラーとして扱われ、設定の検証がブロックされます。

完全なPluginシステムガイドについては、[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブなcapability modelと現在の外部互換性ガイダンスについては、
[Capability model](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClawがPluginコードをロードする前に読み取るメタデータです。

用途:

- Pluginの識別情報
- 設定の検証
- Pluginランタイムを起動せずに利用可能であるべき認証およびオンボーディングのメタデータ
- コントロールプレーンの画面がランタイムのロード前に確認できる、アクティベーションの軽量なヒント
- セットアップ/オンボーディングの画面がランタイムのロード前に確認できる、セットアップの軽量な記述子
- Pluginランタイムのロード前に解決されるべきエイリアスおよび自動有効化メタデータ
- Pluginランタイムのロード前にPluginを自動アクティベートすべき、モデルファミリー所有権の簡略メタデータ
- バンドル済み互換配線および契約カバレッジに使用される、静的なcapability ownershipスナップショット
- 共有の `openclaw qa` ホストがPluginランタイムのロード前に確認できる、軽量なQA runnerメタデータ
- ランタイムをロードせずに、カタログおよび検証画面にマージされるべきチャネル固有の設定メタデータ
- 設定UIのヒント

用途ではないもの:

- ランタイム動作の登録
- コードのエントリーポイントの宣言
- npm installメタデータ

これらはPluginコードおよび `package.json` に属します。

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

| フィールド | 必須 | 型 | 意味 |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | はい | `string` | 正規のPlugin IDです。これは `plugins.entries.<id>` で使われるIDです。 |
| `configSchema` | はい | `object` | このPluginの設定に対するインラインJSON Schemaです。 |
| `enabledByDefault` | いいえ | `true` | バンドル済みPluginがデフォルトで有効であることを示します。デフォルトで無効のままにするには、省略するか、`true` 以外の任意の値を設定します。 |
| `legacyPluginIds` | いいえ | `string[]` | この正規Plugin IDに正規化されるレガシーIDです。 |
| `autoEnableWhenConfiguredProviders` | いいえ | `string[]` | 認証、設定、またはモデル参照でこれらが言及されたときに、このPluginを自動有効化すべきprovider IDです。 |
| `kind` | いいえ | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的なPlugin種別を宣言します。 |
| `channels` | いいえ | `string[]` | このPluginが所有するchannel IDです。検出および設定検証に使用されます。 |
| `providers` | いいえ | `string[]` | このPluginが所有するprovider IDです。 |
| `modelSupport` | いいえ | `object` | ランタイムの前にPluginを自動ロードするために使われる、マニフェスト所有の簡略モデルファミリーメタデータです。 |
| `providerEndpoints` | いいえ | `object[]` | コアがproviderランタイムのロード前に分類しなければならないproviderルート向けの、マニフェスト所有のendpoint host/baseUrlメタデータです。 |
| `cliBackends` | いいえ | `string[]` | このPluginが所有するCLI推論backend IDです。明示的な設定参照からの起動時自動アクティベーションに使用されます。 |
| `syntheticAuthRefs` | いいえ | `string[]` | ランタイムのロード前に、コールドモデル検出中にPlugin所有のsynthetic auth hookを調査すべきproviderまたはCLI backend参照です。 |
| `nonSecretAuthMarkers` | いいえ | `string[]` | 非シークレットなローカル、OAuth、またはアンビエント認証情報の状態を表す、バンドル済みPlugin所有のプレースホルダーAPIキー値です。 |
| `commandAliases` | いいえ | `object[]` | ランタイムのロード前に、Plugin対応の設定およびCLI診断を生成すべき、このPluginが所有するコマンド名です。 |
| `providerAuthEnvVars` | いいえ | `Record<string, string[]>` | OpenClawがPluginコードをロードせずに確認できる、軽量なprovider認証envメタデータです。 |
| `providerAuthAliases` | いいえ | `Record<string, string>` | 認証参照に別のprovider IDを再利用すべきprovider IDです。たとえば、ベースproviderのAPIキーや認証プロファイルを共有するcoding providerなどです。 |
| `channelEnvVars` | いいえ | `Record<string, string[]>` | OpenClawがPluginコードをロードせずに確認できる、軽量なchannel envメタデータです。env駆動のchannelセットアップや、汎用の起動/設定ヘルパーが認識すべき認証画面にはこれを使用してください。 |
| `providerAuthChoices` | いいえ | `object[]` | オンボーディングピッカー、優先provider解決、単純なCLIフラグ配線のための、軽量な認証選択メタデータです。 |
| `activation` | いいえ | `object` | provider、command、channel、route、およびcapabilityトリガー読み込み向けの軽量なアクティベーションヒントです。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。 |
| `setup` | いいえ | `object` | 検出およびセットアップ画面がPluginランタイムをロードせずに確認できる、軽量なセットアップ/オンボーディング記述子です。 |
| `qaRunners` | いいえ | `object[]` | 共有の `openclaw qa` ホストがPluginランタイムのロード前に使用する、軽量なQA runner記述子です。 |
| `contracts` | いいえ | `object` | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびtool所有権に対する静的なバンドル済みcapabilityスナップショットです。 |
| `channelConfigs` | いいえ | `Record<string, object>` | ランタイムのロード前に検出および検証画面へマージされる、マニフェスト所有のchannel設定メタデータです。 |
| `skills` | いいえ | `string[]` | Pluginルートからの相対パスで指定する、ロードするSkillsディレクトリです。 |
| `name` | いいえ | `string` | 人が読めるPlugin名です。 |
| `description` | いいえ | `string` | Plugin画面に表示される短い要約です。 |
| `version` | いいえ | `string` | 情報用のPluginバージョンです。 |
| `uiHints` | いいえ | `Record<string, object>` | 設定フィールドに対するUIラベル、プレースホルダー、および機密性ヒントです。 |

## `providerAuthChoices` リファレンス

各 `providerAuthChoices` エントリは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClawはこれをproviderランタイムのロード前に読み取ります。

| フィールド | 必須 | 型 | 意味 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | この選択肢が属するprovider IDです。 |
| `method` | はい | `string` | ディスパッチ先の認証方式IDです。 |
| `choiceId` | はい | `string` | オンボーディングおよびCLIフローで使われる安定した認証選択肢IDです。 |
| `choiceLabel` | いいえ | `string` | ユーザー向けラベルです。省略された場合、OpenClawは `choiceId` にフォールバックします。 |
| `choiceHint` | いいえ | `string` | ピッカー用の短いヘルパーテキストです。 |
| `assistantPriority` | いいえ | `number` | assistant主導の対話型ピッカーでは、値が小さいほど先に並びます。 |
| `assistantVisibility` | いいえ | `"visible"` \| `"manual-only"` | assistantのピッカーではこの選択肢を非表示にしつつ、手動のCLI選択は引き続き可能にします。 |
| `deprecatedChoiceIds` | いいえ | `string[]` | ユーザーをこの置き換え選択肢へリダイレクトすべきレガシーchoice IDです。 |
| `groupId` | いいえ | `string` | 関連する選択肢をグループ化するための任意のgroup IDです。 |
| `groupLabel` | いいえ | `string` | そのグループのユーザー向けラベルです。 |
| `groupHint` | いいえ | `string` | グループ用の短いヘルパーテキストです。 |
| `optionKey` | いいえ | `string` | 単一フラグの単純な認証フロー用の内部optionキーです。 |
| `cliFlag` | いいえ | `string` | `--openrouter-api-key` のようなCLIフラグ名です。 |
| `cliOption` | いいえ | `string` | `--openrouter-api-key <key>` のような完全なCLIオプション形式です。 |
| `cliDescription` | いいえ | `string` | CLIヘルプで使われる説明です。 |
| `onboardingScopes` | いいえ | `Array<"text-inference" \| "image-generation">` | この選択肢を表示すべきオンボーディング画面です。省略された場合、デフォルトは `["text-inference"]` です。 |

## `commandAliases` リファレンス

ユーザーがそれを誤って `plugins.allow` に書いたり、ルートCLIコマンドとして実行しようとしたりする可能性がある、Plugin所有のランタイムコマンド名がある場合は `commandAliases` を使います。OpenClawはこのメタデータを、Pluginランタイムコードをimportせずに診断に利用します。

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
| `name` | はい | `string` | このPluginに属するコマンド名です。 |
| `kind` | いいえ | `"runtime-slash"` | このエイリアスを、ルートCLIコマンドではなくチャットのスラッシュコマンドとして示します。 |
| `cliCommand` | いいえ | `string` | 存在する場合、CLI操作向けに提案する関連ルートCLIコマンドです。 |

## `activation` リファレンス

Pluginがどのコントロールプレーンイベントで後からアクティベートされるべきかを低コストで宣言できる場合は、`activation` を使います。

## `qaRunners` リファレンス

Pluginが共有の `openclaw qa` ルート配下に1つ以上のtransport runnerを提供する場合は、`qaRunners` を使います。このメタデータは軽量かつ静的に保ってください。実際のCLI登録は引き続きPluginランタイムが所有し、`qaRunnerCliRegistrations` をexportする軽量な `runtime-api.ts` サーフェスを通じて行います。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てのhomeserverに対してDockerベースのMatrixライブQAレーンを実行します"
    }
  ]
}
```

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい | `string` | `openclaw qa` 配下にマウントされるサブコマンドです。たとえば `matrix` です。 |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とする場合に使われるフォールバックのヘルプテキストです。 |

このブロックはメタデータ専用です。ランタイム動作を登録するものではなく、`register(...)`、`setupEntry`、その他のランタイム/Pluginエントリーポイントを置き換えるものでもありません。現在の利用側は、より広いPlugin読み込みの前に絞り込みヒントとしてこれを使用しているため、`activation` メタデータが欠けていても通常は性能コストが増えるだけです。レガシーなマニフェスト所有権フォールバックがまだ存在する間は、正しさは変わらないはずです。

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
| `onProviders` | いいえ | `string[]` | 要求されたときにこのPluginをアクティベートすべきprovider IDです。 |
| `onCommands` | いいえ | `string[]` | このPluginをアクティベートすべきcommand IDです。 |
| `onChannels` | いいえ | `string[]` | このPluginをアクティベートすべきchannel IDです。 |
| `onRoutes` | いいえ | `string[]` | このPluginをアクティベートすべきroute種別です。 |
| `onCapabilities` | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる、広範なcapabilityヒントです。 |

現在のライブ利用側:

- commandトリガーのCLI計画は、レガシーな `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- channelトリガーのセットアップ/チャネル計画は、明示的なchannel activationメタデータがない場合、レガシーな `channels[]` 所有権にフォールバックします
- providerトリガーのセットアップ/ランタイム計画は、明示的なprovider activationメタデータがない場合、レガシーな `providers[]` およびトップレベルの `cliBackends[]` 所有権にフォールバックします

## `setup` リファレンス

ランタイムのロード前に、セットアップおよびオンボーディング画面で低コストなPlugin所有メタデータが必要な場合は、`setup` を使います。

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

トップレベルの `cliBackends` は引き続き有効で、CLI推論backendを記述し続けます。`setup.cliBackends` は、メタデータ専用であるべきコントロールプレーン/セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、これらはセットアップ検出における優先的なdescriptor-first lookupサーフェスになります。記述子が候補Pluginの絞り込みだけを行い、それでもセットアップ時により豊富なランタイムhookが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

セットアップlookupはPlugin所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出されたPlugin全体で一意でなければなりません。所有権が曖昧な場合は、検出順で勝者を選ぶのではなく、クローズドに失敗します。

### `setup.providers` リファレンス

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | はい | `string` | セットアップまたはオンボーディング中に公開されるprovider IDです。正規化されたIDはグローバルで一意に保ってください。 |
| `authMethods` | いいえ | `string[]` | 完全なランタイムをロードせずにこのproviderがサポートする、セットアップ/認証方式IDです。 |
| `envVars` | いいえ | `string[]` | 汎用のセットアップ/ステータス画面がPluginランタイムのロード前に確認できるenv varです。 |

### `setup` フィールド

| フィールド | 必須 | 型 | 意味 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | いいえ | `object[]` | セットアップおよびオンボーディング中に公開されるproviderセットアップ記述子です。 |
| `cliBackends` | いいえ | `string[]` | descriptor-firstなセットアップlookupに使われるセットアップ時backend IDです。正規化されたIDはグローバルで一意に保ってください。 |
| `configMigrations` | いいえ | `string[]` | このPluginのセットアップ画面が所有する設定migration IDです。 |
| `requiresRuntime` | いいえ | `boolean` | 記述子lookup後もセットアップに `setup-api` の実行が必要かどうかです。 |

## `uiHints` リファレンス

`uiHints` は、設定フィールド名から小さな描画ヒントへのマップです。

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

| フィールド | 型 | 意味 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | ユーザー向けのフィールドラベルです。 |
| `help` | `string` | 短いヘルパーテキストです。 |
| `tags` | `string[]` | 任意のUIタグです。 |
| `advanced` | `boolean` | このフィールドを高度な項目として示します。 |
| `sensitive` | `boolean` | このフィールドを秘密または機密として示します。 |
| `placeholder` | `string` | フォーム入力用のプレースホルダーテキストです。 |

## `contracts` リファレンス

`contracts` は、OpenClawがPluginランタイムをimportせずに読み取れる、静的なcapability ownershipメタデータにのみ使用してください。

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
| `speechProviders` | `string[]` | このPluginが所有するspeech provider IDです。 |
| `realtimeTranscriptionProviders` | `string[]` | このPluginが所有するrealtime-transcription provider IDです。 |
| `realtimeVoiceProviders` | `string[]` | このPluginが所有するrealtime-voice provider IDです。 |
| `mediaUnderstandingProviders` | `string[]` | このPluginが所有するmedia-understanding provider IDです。 |
| `imageGenerationProviders` | `string[]` | このPluginが所有するimage-generation provider IDです。 |
| `videoGenerationProviders` | `string[]` | このPluginが所有するvideo-generation provider IDです。 |
| `webFetchProviders` | `string[]` | このPluginが所有するweb-fetch provider IDです。 |
| `webSearchProviders` | `string[]` | このPluginが所有するweb-search provider IDです。 |
| `tools` | `string[]` | バンドル済み契約チェックのためにこのPluginが所有するagent tool名です。 |

## `channelConfigs` リファレンス

channel Pluginがランタイムのロード前に低コストな設定メタデータを必要とする場合は、`channelConfigs` を使います。

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
      "description": "Matrix homeserver接続",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

各channelエントリには以下を含められます。

| フィールド | 型 | 意味 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` のJSON Schemaです。宣言された各channel設定エントリで必須です。 |
| `uiHints` | `Record<string, object>` | そのchannel設定セクション向けの任意のUIラベル/プレースホルダー/機密性ヒントです。 |
| `label` | `string` | ランタイムメタデータの準備ができていないときに、ピッカーおよび確認画面へマージされるchannelラベルです。 |
| `description` | `string` | 確認およびカタログ画面向けの短いchannel説明です。 |
| `preferOver` | `string[]` | 選択画面でこのchannelが優先されるべき、レガシーまたは優先度の低いPlugin IDです。 |

## `modelSupport` リファレンス

`gpt-5.4` や `claude-sonnet-4.6` のような短縮モデルIDから、Pluginランタイムのロード前にOpenClawがprovider Pluginを推測すべき場合は、`modelSupport` を使います。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な `provider/model` 参照では、所有する `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 1つの非バンドルPluginと1つのバンドル済みPluginの両方が一致する場合、非バンドルPluginが優先されます
- 残る曖昧さは、ユーザーまたは設定がproviderを指定するまで無視されます

フィールド:

| フィールド | 型 | 意味 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデルIDに対して `startsWith` で一致させるプレフィックスです。 |
| `modelPatterns` | `string[]` | プロファイルサフィックスを除去した後の短縮モデルIDに対して一致させる正規表現ソースです。 |

レガシーなトップレベルcapabilityキーは非推奨です。`openclaw doctor --fix` を使って、`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` を `contracts` 配下へ移動してください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドはもはやcapability ownershipとして扱われません。

## マニフェストとpackage.jsonの違い

この2つのファイルは異なる役割を持ちます。

| ファイル | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Pluginコードの実行前に存在している必要がある、検出、設定検証、認証選択メタデータ、およびUIヒント |
| `package.json` | npmメタデータ、依存関係のインストール、およびエントリーポイント、インストール制御、セットアップ、またはカタログメタデータに使われる `openclaw` ブロック |

どこに置くべきメタデータか迷った場合は、次のルールを使ってください。

- OpenClawがPluginコードのロード前に知る必要がある場合は、`openclaw.plugin.json` に置きます
- パッケージ化、エントリーファイル、またはnpm installの動作に関するものであれば、`package.json` に置きます

### 検出に影響する `package.json` フィールド

一部のランタイム前Pluginメタデータは、`openclaw.plugin.json` ではなく、`package.json` 内の `openclaw` ブロックに意図的に置かれています。

重要な例:

| フィールド | 意味 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions` | ネイティブPluginのエントリーポイントを宣言します。 |
| `openclaw.setupEntry` | オンボーディング、遅延channel起動、読み取り専用のchannel status/SecretRef検出で使われる、軽量なセットアップ専用エントリーポイントです。 |
| `openclaw.channel` | ラベル、docs path、エイリアス、選択用コピーなどの軽量なchannelカタログメタデータです。 |
| `openclaw.channel.configuredState` | 「envのみのセットアップがすでに存在するか？」に、完全なchannelランタイムをロードせずに答えられる軽量なconfigured-state checkerメタデータです。 |
| `openclaw.channel.persistedAuthState` | 「すでに何かにサインインしているか？」に、完全なchannelランタイムをロードせずに答えられる軽量なpersisted-auth checkerメタデータです。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開Plugin向けのインストール/更新ヒントです。 |
| `openclaw.install.defaultChoice` | 複数のインストール元が利用可能な場合の優先インストールパスです。 |
| `openclaw.install.minHostVersion` | `>=2026.3.22` のようなsemver下限を使用する、サポートされる最小のOpenClaw hostバージョンです。 |
| `openclaw.install.allowInvalidConfigRecovery` | 設定が無効な場合に、限定的なバンドル済みPlugin再インストール回復パスを許可します。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中に完全なchannel Pluginより前に、セットアップ専用のchannel画面をロードできるようにします。 |

`openclaw.install.minHostVersion` は、インストール中およびマニフェストレジストリ読み込み中に強制されます。無効な値は拒否されます。新しすぎるが有効な値は、古いhostではそのPluginをスキップします。

channel Pluginは、status、channel list、またはSecretRefスキャンで完全なランタイムをロードせずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供すべきです。setup entryは、channelメタデータに加えて、セットアップで安全な設定、status、およびsecrets adapterを公開すべきです。ネットワーククライアント、Gatewayリスナー、およびtransport runtimeはメインのextension entrypointに置いてください。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。任意の壊れた設定をインストール可能にするものではありません。現時点では、バンドル済みPluginパスの欠落や、その同じバンドル済みPluginに対する古い `channels.<id>` エントリのような、特定の古いバンドル済みPluginアップグレード失敗からのインストールフロー回復のみを許可します。無関係な設定エラーは引き続きインストールをブロックし、運用者に `openclaw doctor --fix` を案内します。

`openclaw.channel.persistedAuthState` は、小さなcheckerモジュールのためのpackageメタデータです。

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

完全なchannel Pluginのロード前に、setup、doctor、またはconfigured-stateフローが低コストなyes/no認証確認を必要とする場合に使います。対象のexportは、永続化された状態のみを読み取る小さな関数にしてください。完全なchannel runtime barrelを経由させないでください。

`openclaw.channel.configuredState` も、低コストなenvのみconfiguredチェック向けに同じ形式に従います。

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

channelがenvやその他の小さな非ランタイム入力からconfigured-stateに答えられる場合に使います。チェックに完全な設定解決や実際のchannel runtimeが必要なら、そのロジックは代わりにPluginの `config.hasConfiguredState` hookに置いてください。

## JSON Schemaの要件

- **すべてのPluginはJSON Schemaを必ず含める必要があります**。設定をまったく受け付けない場合でも同様です。
- 空のスキーマでも受け入れられます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み書き時に検証されます。

## 検証の動作

- 不明な `channels.*` キーは、channel IDがPluginマニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*` は、**検出可能な**Plugin IDを参照していなければなりません。不明なIDは**エラー**です。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れているか存在しない場合、検証は失敗し、DoctorがPluginエラーを報告します。
- Plugin設定が存在していても、そのPluginが**無効**の場合、設定は保持され、Doctorとログで**警告**が表示されます。

完全な `plugins.*` スキーマについては、[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注意

- マニフェストは、ローカルファイルシステム読み込みを含む**ネイティブなOpenClaw Pluginでは必須**です。
- ランタイムは引き続きPluginモジュールを個別にロードします。マニフェストは検出と検証のためだけのものです。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、引用符なしキーが許可されます。
- マニフェストローダーが読み取るのは文書化されたマニフェストフィールドのみです。ここにカスタムのトップレベルキーを追加するのは避けてください。
- `providerAuthEnvVars` は、認証確認、env-marker検証、およびenv名を確認するためだけにPluginランタイムを起動すべきでない類似のprovider認証画面に向けた、低コストなメタデータパスです。
- `providerAuthAliases` により、coreにその関係をハードコードせずに、providerバリアントが別のproviderの認証env var、認証プロファイル、設定ベースの認証、およびAPIキーのオンボーディング選択肢を再利用できます。
- `providerEndpoints` により、provider Pluginが単純なendpoint host/baseUrl一致メタデータを所有できます。coreがすでにサポートしているendpoint classに対してのみ使用してください。ランタイム動作は引き続きPluginが所有します。
- `syntheticAuthRefs` は、ランタイムレジストリが存在する前のコールドモデル検出で可視である必要がある、provider所有のsynthetic auth hook向けの低コストなメタデータパスです。ランタイムproviderまたはCLI backendが実際に `resolveSyntheticAuth` を実装している参照のみを列挙してください。
- `nonSecretAuthMarkers` は、ローカル、OAuth、またはアンビエント認証情報マーカーのような、バンドル済みPlugin所有のプレースホルダーAPIキー向けの低コストなメタデータパスです。coreは、所有providerをハードコードせずに、認証表示およびシークレット監査でこれらを非シークレットとして扱います。
- `channelEnvVars` は、シェルenvフォールバック、セットアッププロンプト、およびenv名を確認するためだけにPluginランタイムを起動すべきでない類似のchannel画面に向けた、低コストなメタデータパスです。
- `providerAuthChoices` は、認証選択ピッカー、`--auth-choice` 解決、優先providerマッピング、およびproviderランタイムのロード前の単純なオンボーディングCLIフラグ登録に向けた、低コストなメタデータパスです。providerコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なPlugin種別は `plugins.slots.*` を通じて選択されます。
  - `kind: "memory"` は `plugins.slots.memory` によって選択されます。
  - `kind: "context-engine"` は `plugins.slots.contextEngine` によって選択されます（デフォルト: 組み込みの `legacy`）。
- Pluginが必要としない場合、`channels`、`providers`、`cliBackends`、および `skills` は省略できます。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順と、必要なパッケージマネージャーの許可リスト要件を文書化してください（たとえば、pnpmの `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — Pluginのはじめに
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
