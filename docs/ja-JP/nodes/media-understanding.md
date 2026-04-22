---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声/動画/画像の前処理の調整
summary: 受信画像/音声/動画の理解（任意）と、プロバイダーおよびCLIのフォールバック
title: メディア理解
x-i18n:
    generated_at: "2026-04-22T04:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# メディア理解 - 受信（2026-01-17）

OpenClawは、返信パイプラインの実行前に**受信メディア**（画像/音声/動画）を要約できます。ローカルツールやプロバイダーキーが利用可能かどうかを自動検出し、無効化やカスタマイズも可能です。理解がオフの場合でも、モデルには通常どおり元のファイル/URLが渡されます。

ベンダー固有のメディア動作はベンダーPluginによって登録され、OpenClaw
coreは共有の`tools.media`設定、フォールバック順序、返信パイプラインへの
統合を担当します。

## 目標

- 任意: より高速なルーティングと、より良いコマンド解析のために、受信メディアを短いテキストへ事前要約する。
- 元のメディア配信をモデルへ保持する（常に）。
- **プロバイダーAPI**と**CLIフォールバック**をサポートする。
- 順序付きフォールバックを持つ複数モデルを許可する（エラー/サイズ/タイムアウト）。

## 高レベルの動作

1. 受信添付ファイル（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
2. 有効な各機能（画像/音声/動画）について、ポリシーに従って添付を選択します（デフォルト: **first**）。
3. 最初に条件を満たすモデルエントリを選択します（サイズ + 機能 + 認証）。
4. モデルが失敗した、またはメディアが大きすぎる場合、**次のエントリへフォールバック**します。
5. 成功時:
   - `Body`は`[Image]`、`[Audio]`、または`[Video]`ブロックになります。
   - 音声は`{{Transcript}}`を設定します。コマンド解析では、caption textがあればそれを使用し、ない場合はtranscriptを使用します。
   - captionsはブロック内の`User text:`として保持されます。

理解に失敗した、または無効化されている場合でも、**返信フローは継続**し、元の本文 + 添付ファイルをそのまま使います。

## 設定概要

`tools.media`は、**共有モデル**に加えて機能ごとの上書きをサポートします。

- `tools.media.models`: 共有モデル一覧（絞り込みには`capabilities`を使用）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - プロバイダー上書き（`baseUrl`、`headers`、`providerOptions`）
  - `tools.media.audio.providerOptions.deepgram`経由のDeepgram音声オプション
  - 音声transcriptのecho制御（`echoTranscript`、デフォルト`false`、`echoFormat`）
  - 任意の**機能ごとの`models`一覧**（共有モデルより優先）
  - `attachments`ポリシー（`mode`、`maxAttachments`、`prefer`）
  - `scope`（チャネル/chatType/session keyによる任意の絞り込み）
- `tools.media.concurrency`: 同時実行する機能数の上限（デフォルト**2**）。

```json5
{
  tools: {
    media: {
      models: [
        /* 共有リスト */
      ],
      image: {
        /* 任意の上書き */
      },
      audio: {
        /* 任意の上書き */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 任意の上書き */
      },
    },
  },
}
```

### モデルエントリ

各`models[]`エントリは**provider**または**CLI**にできます。

```json5
{
  type: "provider", // 省略時のデフォルト
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 任意。マルチモーダルエントリで使用
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLIテンプレートでは、次も使用できます。

- `{{MediaDir}}`（メディアファイルを含むディレクトリ）
- `{{OutputDir}}`（この実行用に作成されるscratch dir）
- `{{OutputBase}}`（拡張子なしのscratch file base path）

## デフォルトと制限

推奨デフォルト:

- `maxChars`: 画像/動画では**500**（短く、コマンド向き）
- `maxChars`: 音声では**未設定**（制限を設定しない限り完全transcript）
- `maxBytes`:
  - 画像: **10MB**
  - 音声: **20MB**
  - 動画: **50MB**

ルール:

- メディアが`maxBytes`を超える場合、そのモデルはスキップされ、**次のモデルが試されます**。
- **1024 bytes**未満の音声ファイルは空/破損として扱われ、provider/CLIによるtranscriptionの前にスキップされます。
- モデルの返却が`maxChars`を超えた場合、出力は切り詰められます。
- `prompt`のデフォルトは単純な「Describe the {media}.」に、`maxChars`のガイダンスを加えたものです（画像/動画のみ）。
- アクティブなプライマリ画像モデルがすでにネイティブでvisionをサポートしている場合、OpenClawは`[Image]`要約ブロックをスキップし、代わりに元の画像をそのままモデルへ渡します。
- 明示的な`openclaw infer image describe --model <provider/model>`リクエストは別扱いです。これは、その画像対応provider/modelを直接実行します。`ollama/qwen2.5vl:7b`のようなOllama参照も含まれます。
- `<capability>.enabled: true`でモデルが設定されていない場合、OpenClawはそのproviderが機能をサポートしていれば、**アクティブな返信モデル**を試します。

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled`が明示的に`false`に設定されておらず、
モデルも設定していない場合、OpenClawは次の順序で自動検出し、**最初に
動作した選択肢で停止**します。

1. **アクティブな返信モデル**（そのproviderがその機能をサポートしている場合）。
2. **`agents.defaults.imageModel`**のprimary/fallback参照（画像のみ）。
3. **ローカルCLI**（音声のみ。インストールされている場合）
   - `sherpa-onnx-offline`（encoder/decoder/joiner/tokensを含む`SHERPA_ONNX_MODEL_DIR`が必要）
   - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL`または同梱tiny modelを使用）
   - `whisper`（Python CLI。モデルを自動ダウンロード）
4. `read_many_files`を使う**Gemini CLI**（`gemini`）
5. **プロバイダー認証**
   - 機能をサポートする設定済み`models.providers.*`エントリは、
     組み込みフォールバック順序より前に試されます。
   - 画像対応モデルを持つ画像専用の設定プロバイダーは、
     組み込みベンダーPluginでなくてもメディア理解用に自動登録されます。
   - Ollama画像理解は、たとえば`agents.defaults.imageModel`や
     `openclaw infer image describe --model ollama/<vision-model>`で
     明示的に選択した場合に利用できます。
   - 組み込みフォールバック順序:
     - 音声: OpenAI → Groq → Deepgram → Google → Mistral
     - 画像: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - 動画: Google → Qwen → Moonshot

自動検出を無効にするには、次を設定します。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

注: バイナリ検出はmacOS/Linux/Windows全体でベストエフォートです。CLIが`PATH`上にあることを確認してください（`~`は展開されます）。または、完全なコマンドパスを持つ明示的なCLIモデルを設定してください。

### プロキシ環境サポート（providerモデル）

providerベースの**音声**および**動画**メディア理解が有効な場合、OpenClawは
provider HTTP呼び出しに対して標準の外向きプロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ環境変数が設定されていない場合、メディア理解は直接外向き通信を使います。
プロキシ値の形式が不正な場合、OpenClawは警告を記録し、直接取得にフォールバックします。

## 機能（任意）

`capabilities`を設定した場合、そのエントリはそのメディア種別に対してのみ実行されます。共有
リストについては、OpenClawはデフォルトを推定できます。

- `openai`、`anthropic`、`minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google`（Gemini API）: **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- 画像対応モデルを持つ任意の`models.providers.<id>.models[]`カタログ:
  **image**

CLIエントリでは、意図しない一致を避けるために**`capabilities`を明示的に設定してください**。
`capabilities`を省略した場合、そのエントリは置かれているリストに対して対象になります。

## プロバイダー対応表（OpenClaw連携）

| Capability | Provider integration                                                                   | Notes                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor plugins register image support; MiniMax and MiniMax OAuth both use `MiniMax-VL-01`; image-capable config providers auto-register. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Provider transcription (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video      | Google, Qwen, Moonshot                                                                 | Provider video understanding via vendor plugins; Qwen video understanding uses the Standard DashScope endpoints.                         |

MiniMaxに関する注記:

- `minimax`および`minimax-portal`の画像理解は、Plugin所有の
  `MiniMax-VL-01`メディアプロバイダーから提供されます。
- 組み込みのMiniMaxテキストカタログは、引き続きテキスト専用で始まります。
  明示的な`models.providers.minimax`エントリにより、画像対応のM2.7 chat参照が実体化されます。

## モデル選択ガイダンス

- 品質と安全性が重要な場合、各メディア機能には利用可能な中で最も強力な最新世代モデルを優先してください。
- 信頼されない入力を扱うツール有効エージェントでは、古い/弱いメディアモデルは避けてください。
- 可用性のため、機能ごとに少なくとも1つのフォールバックを維持してください（高品質モデル + より高速/低コストモデル）。
- CLIフォールバック（`whisper-cli`、`whisper`、`gemini`）は、provider APIが利用できない場合に有用です。
- `parakeet-mlx`注記: `--output-dir`使用時、出力形式が`txt`（または未指定）の場合、OpenClawは`<output-dir>/<media-basename>.txt`を読み取ります。`txt`以外の形式ではstdoutにフォールバックします。

## 添付ファイルポリシー

機能ごとの`attachments`は、どの添付ファイルを処理するかを制御します。

- `mode`: `first`（デフォルト）または`all`
- `maxAttachments`: 処理数の上限（デフォルト**1**）
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"`の場合、出力には`[Image 1/2]`、`[Audio 2/2]`のようなラベルが付きます。

ファイル添付の抽出動作:

- 抽出されたファイルテキストは、メディアpromptに追加される前に
  **信頼されない外部コンテンツ**としてラップされます。
- 注入されるブロックは、
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、
  `Source: External`メタデータ行を含みます。
- この添付抽出経路では、メディアpromptの肥大化を避けるため、
  長い`SECURITY NOTICE:`バナーは意図的に省略されます。それでも境界
  マーカーとメタデータは残ります。
- ファイルに抽出可能なテキストがない場合、OpenClawは`[No extractable text]`を注入します。
- PDFがこの経路でレンダリング済みページ画像へフォールバックした場合、
  メディアpromptには
  `[PDF content rendered to images; images not forwarded to model]`
  というプレースホルダーが維持されます。これは、この添付抽出ステップが
  レンダリング済みPDF画像ではなくテキストブロックを転送するためです。

## 設定例

### 1) 共有モデル一覧 + 上書き

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) 音声 + 動画のみ（画像オフ）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) 任意の画像理解

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) マルチモーダル単一エントリ（明示的なcapabilities）

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## ステータス出力

メディア理解が実行されると、`/status`には短い要約行が含まれます。

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

ここには、機能ごとの結果と、該当する場合は選択されたprovider/modelが表示されます。

## 注記

- 理解は**ベストエフォート**です。エラーがあっても返信は妨げられません。
- 理解が無効な場合でも、添付ファイルは引き続きモデルに渡されます。
- 理解を実行する場所を制限するには`scope`を使用してください（例: DMのみ）。

## 関連ドキュメント

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
