---
read_when:
    - OpenClawプラグインを構築している
    - プラグイン設定スキーマを出荷する必要がある、またはプラグイン検証エラーをデバッグする必要がある
summary: プラグインマニフェスト + JSON Schema要件（厳格な設定検証）
title: プラグインマニフェスト
x-i18n:
    generated_at: "2026-04-09T01:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a7ee4b621a801d2a8f32f8976b0e1d9433c7810eb360aca466031fc0ffb286a
    source_path: plugins/manifest.md
    workflow: 15
---

# プラグインマニフェスト（openclaw.plugin.json）

このページは**ネイティブOpenClawプラグインマニフェスト**専用です。

互換バンドルのレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codexバンドル: `.codex-plugin/plugin.json`
- Claudeバンドル: `.claude-plugin/plugin.json` またはマニフェストなしのデフォルトClaudeコンポーネントレイアウト
- Cursorバンドル: `.cursor-plugin/plugin.json`

OpenClawはそれらのバンドルレイアウトも自動検出しますが、ここで説明する`openclaw.plugin.json`スキーマに対しては検証されません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClawランタイムの期待に一致する場合、バンドルメタデータに加えて、宣言されたskill root、Claude command root、Claudeバンドルの`settings.json`デフォルト、ClaudeバンドルのLSPデフォルト、およびサポートされるhook packを読み取ります。

すべてのネイティブOpenClawプラグインは、**plugin root**に`openclaw.plugin.json`ファイルを**必ず**含める必要があります。OpenClawはこのマニフェストを使って、**プラグインコードを実行せずに**設定を検証します。マニフェストがない、または無効な場合はプラグインエラーとして扱われ、設定検証がブロックされます。

完全なプラグインシステムガイドは[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブのcapability modelと現在の外部互換性ガイダンスについては、
[Capability model](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json`は、OpenClawがプラグインコードを読み込む前に読み取るメタデータです。

用途:

- プラグインの識別
- 設定検証
- プラグインランタイムを起動しなくても利用可能であるべき認証およびオンボーディングメタデータ
- プラグインランタイムが読み込まれる前に解決されるべきエイリアスおよび自動有効化メタデータ
- ランタイムが読み込まれる前にプラグインを自動有効化すべき短縮モデルファミリー所有メタデータ
- 同梱互換配線およびコントラクトカバレッジに使う静的capability ownershipスナップショット
- ランタイムを読み込まずにカタログおよび検証サーフェスにマージされるべきチャンネル固有設定メタデータ
- 設定UIヒント

使わないでください:

- ランタイム動作の登録
- コードエントリーポイントの宣言
- npmインストールメタデータ

それらはプラグインコードおよび`package.json`に属します。

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
  "cliBackends": ["openrouter-cli"],
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

| Field                               | Required | Type                             | 意味                                                                                                                                                       |
| ----------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Yes      | `string`                         | 正式なplugin idです。このidは`plugins.entries.<id>`で使われます。                                                                                          |
| `configSchema`                      | Yes      | `object`                         | このプラグイン設定用のインラインJSON Schemaです。                                                                                                           |
| `enabledByDefault`                  | No       | `true`                           | 同梱プラグインをデフォルトで有効にすることを示します。省略するか、`true`以外の値を設定すると、プラグインはデフォルトで無効のままになります。              |
| `legacyPluginIds`                   | No       | `string[]`                       | この正式plugin idに正規化される旧idです。                                                                                                                  |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | auth、config、またはmodel refでそれらが言及されたときにこのプラグインを自動有効化すべきprovider idです。                                                |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | `plugins.slots.*`で使われる排他的なプラグイン種別を宣言します。                                                                                            |
| `channels`                          | No       | `string[]`                       | このプラグインが所有するchannel idです。検出と設定検証に使われます。                                                                                       |
| `providers`                         | No       | `string[]`                       | このプラグインが所有するprovider idです。                                                                                                                  |
| `modelSupport`                      | No       | `object`                         | ランタイム前にプラグインを自動読み込みするために使われる、マニフェスト所有の短縮モデルファミリーメタデータです。                                          |
| `cliBackends`                       | No       | `string[]`                       | このプラグインが所有するCLI推論バックエンドidです。明示的な設定参照からの起動時自動有効化に使われます。                                                  |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | OpenClawがプラグインコードを読み込まずに確認できる、軽量なprovider-auth環境変数メタデータです。                                                          |
| `providerAuthAliases`               | No       | `Record<string, string>`         | 認証参照に別のprovider idを再利用すべきprovider idです。たとえば、ベースproviderのAPIキーやauth profileを共有するコーディングproviderなどです。          |
| `channelEnvVars`                    | No       | `Record<string, string[]>`       | OpenClawがプラグインコードを読み込まずに確認できる、軽量なchannel環境変数メタデータです。env駆動のchannelセットアップや、汎用起動/設定ヘルパーが見るべきauthサーフェスに使います。 |
| `providerAuthChoices`               | No       | `object[]`                       | オンボーディングpicker、preferred-provider解決、および単純なCLIフラグ配線のための軽量なauth choiceメタデータです。                                      |
| `contracts`                         | No       | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびtool ownership向けの静的な同梱capability snapshotです。 |
| `channelConfigs`                    | No       | `Record<string, object>`         | ランタイムが読み込まれる前に検出および検証サーフェスにマージされる、マニフェスト所有のchannel設定メタデータです。                                        |
| `skills`                            | No       | `string[]`                       | 読み込むSkillsディレクトリです。plugin rootからの相対パスです。                                                                                            |
| `name`                              | No       | `string`                         | 人間が読むためのプラグイン名です。                                                                                                                         |
| `description`                       | No       | `string`                         | プラグインサーフェスに表示される短い要約です。                                                                                                             |
| `version`                           | No       | `string`                         | 参考情報としてのプラグインバージョンです。                                                                                                                 |
| `uiHints`                           | No       | `Record<string, object>`         | 設定フィールド用のUIラベル、プレースホルダー、機密性ヒントです。                                                                                           |

## providerAuthChoicesリファレンス

各`providerAuthChoices`エントリーは、1つのオンボーディングまたは認証選択肢を記述します。
OpenClawはこれをproviderランタイムが読み込まれる前に読み取ります。

| Field                 | Required | Type                                            | 意味                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | このchoiceが属するprovider idです。                                                   |
| `method`              | Yes      | `string`                                        | ディスパッチ先のauth method idです。                                                  |
| `choiceId`            | Yes      | `string`                                        | オンボーディングおよびCLIフローで使われる安定したauth-choice idです。                 |
| `choiceLabel`         | No       | `string`                                        | ユーザー向けラベルです。省略した場合、OpenClawは`choiceId`へフォールバックします。    |
| `choiceHint`          | No       | `string`                                        | picker用の短い補助テキストです。                                                      |
| `assistantPriority`   | No       | `number`                                        | assistant主導の対話型pickerで、値が小さいほど先に並びます。                           |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | assistant pickerからは隠しつつ、手動CLI選択は引き続き許可します。                     |
| `deprecatedChoiceIds` | No       | `string[]`                                      | この置き換えchoiceへユーザーをリダイレクトすべき旧choice idです。                     |
| `groupId`             | No       | `string`                                        | 関連するchoiceをグループ化するための任意のgroup idです。                              |
| `groupLabel`          | No       | `string`                                        | そのグループのユーザー向けラベルです。                                                |
| `groupHint`           | No       | `string`                                        | グループ用の短い補助テキストです。                                                    |
| `optionKey`           | No       | `string`                                        | 単一フラグの単純なauthフロー用の内部option keyです。                                  |
| `cliFlag`             | No       | `string`                                        | `--openrouter-api-key`のようなCLIフラグ名です。                                       |
| `cliOption`           | No       | `string`                                        | `--openrouter-api-key <key>`のような完全なCLIオプション形状です。                     |
| `cliDescription`      | No       | `string`                                        | CLIヘルプで使われる説明です。                                                         |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | このchoiceを表示すべきオンボーディングサーフェスです。省略した場合、`["text-inference"]`がデフォルトになります。 |

## uiHintsリファレンス

`uiHints`は、設定フィールド名から小さなレンダリングヒントへのマップです。

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

各フィールドヒントには次を含められます。

| Field         | Type       | 意味                             |
| ------------- | ---------- | -------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベルです。 |
| `help`        | `string`   | 短い補助テキストです。             |
| `tags`        | `string[]` | 任意のUIタグです。                |
| `advanced`    | `boolean`  | フィールドを高度な項目として示します。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密として示します。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキストです。 |

## contractsリファレンス

`contracts`は、OpenClawがプラグインランタイムをimportせずに読める静的なcapability ownershipメタデータにのみ使ってください。

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

| Field                            | Type       | 意味                                               |
| -------------------------------- | ---------- | -------------------------------------------------- |
| `speechProviders`                | `string[]` | このプラグインが所有するspeech provider idです。   |
| `realtimeTranscriptionProviders` | `string[]` | このプラグインが所有するrealtime-transcription provider idです。 |
| `realtimeVoiceProviders`         | `string[]` | このプラグインが所有するrealtime-voice provider idです。 |
| `mediaUnderstandingProviders`    | `string[]` | このプラグインが所有するmedia-understanding provider idです。 |
| `imageGenerationProviders`       | `string[]` | このプラグインが所有するimage-generation provider idです。 |
| `videoGenerationProviders`       | `string[]` | このプラグインが所有するvideo-generation provider idです。 |
| `webFetchProviders`              | `string[]` | このプラグインが所有するweb-fetch provider idです。 |
| `webSearchProviders`             | `string[]` | このプラグインが所有するweb-search provider idです。 |
| `tools`                          | `string[]` | 同梱コントラクトチェック用にこのプラグインが所有するagent tool名です。 |

## channelConfigsリファレンス

`channelConfigs`は、channel pluginがランタイム読み込み前に軽量な設定メタデータを必要とする場合に使ってください。

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

各channelエントリーには次を含められます。

| Field         | Type                     | 意味                                                                                   |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`用のJSON Schemaです。宣言された各channel設定エントリーで必須です。     |
| `uiHints`     | `Record<string, object>` | そのchannel設定セクション用の任意のUIラベル/プレースホルダー/機密性ヒントです。       |
| `label`       | `string`                 | ランタイムメタデータがまだ準備できていないときにpickerおよびinspectサーフェスへマージされるchannelラベルです。 |
| `description` | `string`                 | inspectおよびcatalogサーフェス用の短いchannel説明です。                               |
| `preferOver`  | `string[]`               | 選択サーフェスでこのchannelが優先されるべき旧plugin idまたは低優先度plugin idです。   |

## modelSupportリファレンス

`modelSupport`は、`gpt-5.4`や`claude-sonnet-4.6`のような短縮model idから、プラグインランタイム読み込み前にOpenClawがprovider pluginを推測すべき場合に使います。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な`provider/model`参照では、所有する`providers`マニフェストメタデータを使います
- `modelPatterns`は`modelPrefixes`より優先されます
- 非同梱プラグイン1つと同梱プラグイン1つの両方が一致する場合、非同梱プラグインが優先されます
- それ以外の曖昧さは、ユーザーまたは設定がproviderを指定するまで無視されます

フィールド:

| Field           | Type       | 意味                                                                        |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮model idに対して`startsWith`で一致させるプレフィックスです。            |
| `modelPatterns` | `string[]` | profile suffix削除後の短縮model idに対して一致させるregex sourceです。     |

旧来のトップレベルcapabilityキーは非推奨です。`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、および`webSearchProviders`を`contracts`配下へ移動するには`openclaw doctor --fix`を使ってください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドをcapability ownershipとしては扱いません。

## マニフェストとpackage.jsonの違い

この2つのファイルは異なる役割を持ちます。

| File                   | 用途                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 検出、設定検証、auth-choiceメタデータ、およびプラグインコード実行前に存在している必要があるUIヒント                              |
| `package.json`         | npmメタデータ、依存関係インストール、およびエントリーポイント、インストールゲート、セットアップ、またはcatalogメタデータに使う`openclaw`ブロック |

どこにメタデータを置くべきか迷う場合は、次のルールを使ってください。

- OpenClawがプラグインコードを読み込む前に知っておく必要があるなら、`openclaw.plugin.json`に置きます
- パッケージング、エントリーファイル、またはnpmインストール動作に関するものなら、`package.json`に置きます

### 検出に影響するpackage.jsonフィールド

一部のランタイム前プラグインメタデータは、`openclaw.plugin.json`ではなく、`package.json`の`openclaw`ブロック配下に意図的に置かれています。

重要な例:

| Field                                                             | 意味                                                                                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ネイティブプラグインのエントリーポイントを宣言します。                                                                                    |
| `openclaw.setupEntry`                                             | オンボーディングおよび遅延channel起動時に使われる、軽量なセットアップ専用エントリーポイントです。                                        |
| `openclaw.channel`                                                | ラベル、docs path、エイリアス、選択用コピーなどの軽量なchannel catalogメタデータです。                                                   |
| `openclaw.channel.configuredState`                                | 完全なchannelランタイムを読み込まずに「envのみのセットアップはすでに存在するか？」へ答えられる、軽量なconfigured-state checkerメタデータです。 |
| `openclaw.channel.persistedAuthState`                             | 完全なchannelランタイムを読み込まずに「何かがすでにサインイン済みか？」へ答えられる、軽量なpersisted-auth checkerメタデータです。       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 同梱および外部公開プラグイン用のインストール/更新ヒントです。                                                                            |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用可能な場合の優先インストールパスです。                                                                          |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22`のようなsemver floorを使う、サポートされる最小OpenClaw host versionです。                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効な場合に、限定的な同梱プラグイン再インストール回復パスを許可します。                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中、完全なchannelプラグインより先にセットアップ専用channelサーフェスを読み込めるようにします。                                       |

`openclaw.install.minHostVersion`は、インストール時とmanifest registry読み込み時に適用されます。無効な値は拒否され、新しすぎるが有効な値は古いhost上でそのプラグインをスキップします。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定的です。任意の壊れた設定をインストール可能にするものではありません。現時点では、特定の古い同梱プラグインアップグレード失敗、たとえば同梱プラグインパスの欠落や、その同じ同梱プラグインに対する古い`channels.<id>`エントリーのような場合から、インストールフローが回復することだけを許可します。無関係な設定エラーは引き続きインストールをブロックし、オペレーターは`openclaw doctor --fix`に誘導されます。

`openclaw.channel.persistedAuthState`は、小さなchecker module向けのpackageメタデータです。

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

これは、セットアップ、doctor、またはconfigured-stateフローが、完全なchannel pluginを読み込む前に軽量なyes/no auth probeを必要とする場合に使います。対象のexportは永続化状態のみを読む小さな関数にしてください。完全なchannel runtime barrelを経由させないでください。

`openclaw.channel.configuredState`も、軽量なenv-only configured check用に同じ形を取ります。

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

これは、channelがenvやその他の小さな非ランタイム入力からconfigured-stateに答えられる場合に使います。その判定に完全なconfig解決または実際のchannel runtimeが必要なら、そのロジックは代わりにプラグインの`config.hasConfiguredState`フックに置いてください。

## JSON Schema要件

- **すべてのプラグインはJSON Schemaを必ず含める必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも構いません（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み書き時に検証されます。

## 検証の挙動

- 不明な`channels.*`キーは、channel idがプラグインマニフェストで宣言されていない限り**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および`plugins.slots.*`は、**検出可能な**plugin idを参照していなければなりません。不明なidは**エラー**です。
- プラグインがインストールされていても、マニフェストまたはスキーマが壊れているか欠けている場合、検証は失敗し、Doctorはそのプラグインエラーを報告します。
- プラグイン設定が存在していても、プラグインが**無効**の場合、設定は保持され、Doctorとログに**警告**が表示されます。

完全な`plugins.*`スキーマについては、[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注意

- マニフェストは、ローカルファイルシステム読み込みを含む**ネイティブOpenClawプラグインで必須**です。
- ランタイムは引き続きプラグインモジュールを別途読み込みます。マニフェストは検出と検証専用です。
- ネイティブマニフェストはJSON5で解析されるため、最終値がオブジェクトである限り、コメント、末尾カンマ、引用符なしキーを受け付けます。
- マニフェストローダーが読むのは、文書化されたマニフェストフィールドのみです。ここに独自のトップレベルキーを追加するのは避けてください。
- `providerAuthEnvVars`は、auth probe、env-marker検証、および環境変数名を確認するだけのためにプラグインランタイムを起動すべきでない類似のprovider-authサーフェス向けの軽量メタデータ経路です。
- `providerAuthAliases`により、providerバリアントは、別のproviderのauth env vars、auth profile、設定ベースauth、およびAPIキーのオンボーディング選択肢を、コアにその関係をハードコードせずに再利用できます。
- `channelEnvVars`は、shell-envフォールバック、セットアッププロンプト、および環境変数名を確認するだけのためにプラグインランタイムを起動すべきでない類似のchannelサーフェス向けの軽量メタデータ経路です。
- `providerAuthChoices`は、providerランタイム読み込み前のauth-choice picker、`--auth-choice`解決、preferred-providerマッピング、および単純なオンボーディングCLIフラグ登録向けの軽量メタデータ経路です。providerコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なプラグイン種別は`plugins.slots.*`を通じて選択されます。
  - `kind: "memory"` は`plugins.slots.memory`で選択されます。
  - `kind: "context-engine"` は`plugins.slots.contextEngine`で選択されます
    （デフォルト: 組み込みの`legacy`）。
- `channels`、`providers`、`cliBackends`、および`skills`は、プラグインでそれらが不要な場合は省略できます。
- プラグインがネイティブモジュールに依存する場合は、ビルド手順と、必要なpackage manager allowlist要件（たとえばpnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — プラグインのはじめに
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
