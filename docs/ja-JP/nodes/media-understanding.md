---
read_when:
    - メディア理解の設計またはリファクタリング
    - 受信音声/動画/画像の前処理の調整
summary: 受信画像/音声/動画の理解（任意）とプロバイダー + CLI フォールバック
title: メディア理解
x-i18n:
    generated_at: "2026-04-23T04:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# メディア理解 - 受信（2026-01-17）

OpenClaw は、返信パイプラインが実行される前に**受信メディア**（画像/音声/動画）を要約できます。ローカルツールやプロバイダーキーが利用可能かどうかを自動検出し、無効化やカスタマイズも可能です。理解がオフの場合でも、モデルには通常どおり元のファイル/URL が渡されます。

ベンダー固有のメディア動作はベンダー Plugin によって登録され、一方で OpenClaw
コアは共有の `tools.media` 設定、フォールバック順序、および返信パイプライン統合を担当します。

## 目的

- 任意: 受信メディアを短いテキストに事前要約し、ルーティングの高速化とコマンド解析の改善を行う。
- 元のメディアのモデルへの配信は常に維持する。
- **プロバイダー API** と **CLI フォールバック** をサポートする。
- エラー/サイズ/タイムアウト時の順序付きフォールバックを伴う複数モデルを許可する。

## 高レベル動作

1. 受信添付ファイル（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集します。
2. 有効な各 capability（image/audio/video）について、ポリシーに従って添付ファイルを選択します（デフォルト: **first**）。
3. 最初の適格なモデルエントリ（サイズ + capability + auth）を選択します。
4. モデルが失敗するかメディアが大きすぎる場合、**次のエントリにフォールバック**します。
5. 成功した場合:
   - `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになります。
   - 音声では `{{Transcript}}` が設定されます。コマンド解析では、キャプションテキストがあればそれを使い、
     なければトランスクリプトを使います。
   - キャプションはブロック内で `User text:` として保持されます。

理解に失敗した場合、または無効化されている場合でも、**返信フローは元の本文 + 添付ファイルのまま**継続します。

## 設定概要

`tools.media` は、**共有モデル** と capability ごとのオーバーライドをサポートします。

- `tools.media.models`: 共有モデル一覧（制御には `capabilities` を使用）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - プロバイダーオーバーライド（`baseUrl`、`headers`、`providerOptions`）
  - `tools.media.audio.providerOptions.deepgram` による Deepgram 音声オプション
  - 音声トランスクリプトのエコー制御（`echoTranscript`、デフォルト `false`、`echoFormat`）
  - 任意の capability ごとの **`models` 一覧**（共有モデルより優先）
  - `attachments` ポリシー（`mode`、`maxAttachments`、`prefer`）
  - `scope`（任意の channel/chatType/session key による制限）
- `tools.media.concurrency`: capability 実行の最大同時数（デフォルト **2**）。

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### モデルエントリ

各 `models[]` エントリは **provider** または **CLI** にできます。

```json5
{
  type: "provider", // omitted の場合のデフォルト
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
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

CLI テンプレートでは次も使用できます。

- `{{MediaDir}}`（メディアファイルを含むディレクトリ）
- `{{OutputDir}}`（この実行用に作成されるスクラッチディレクトリ）
- `{{OutputBase}}`（スクラッチファイルのベースパス。拡張子なし）

## デフォルトと制限

推奨デフォルト:

- `maxChars`: 画像/動画では **500**（短く、コマンド向き）
- `maxChars`: 音声では **未設定**（制限を設定しない限り完全なトランスクリプト）
- `maxBytes`:
  - 画像: **10MB**
  - 音声: **20MB**
  - 動画: **50MB**

ルール:

- メディアが `maxBytes` を超える場合、そのモデルはスキップされ、**次のモデルが試されます**。
- **1024 bytes** 未満の音声ファイルは空または破損として扱われ、プロバイダー/CLI による文字起こしの前にスキップされます。
- モデルが `maxChars` を超える内容を返した場合、出力は切り詰められます。
- `prompt` のデフォルトは単純な「Describe the {media}.」に `maxChars` ガイダンスを加えたものです（画像/動画のみ）。
- アクティブなプライマリ画像モデルがすでにネイティブに vision をサポートしている場合、OpenClaw
  は `[Image]` 要約ブロックをスキップし、代わりに元の画像を
  モデルに渡します。
- 明示的な `openclaw infer image describe --model <provider/model>` リクエストは別です。これらは、その画像対応の provider/model を直接実行し、
  `ollama/qwen2.5vl:7b` のような Ollama 参照も含みます。
- `<capability>.enabled: true` だがモデルが設定されていない場合、OpenClaw は
  そのプロバイダーが capability をサポートしていれば**アクティブな返信モデル**を試します。

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled` が **`false` に設定されておらず**、
モデルも設定されていない場合、OpenClaw は次の順で自動検出し、**最初に動作する選択肢で停止**します。

1. そのプロバイダーが capability をサポートしている場合の**アクティブな返信モデル**。
2. **`agents.defaults.imageModel`** の primary/fallback 参照（画像のみ）。
3. **ローカル CLI**（音声のみ。インストールされている場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR` に encoder/decoder/joiner/tokens が必要）
   - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL` または同梱の tiny model を使用）
   - `whisper`（Python CLI。モデルを自動ダウンロード）
4. `read_many_files` を使う **Gemini CLI**（`gemini`）
5. **プロバイダー認証**
   - capability をサポートする設定済み `models.providers.*` エントリは、
     同梱のフォールバック順序より先に試されます。
   - 画像対応モデルを持つ画像専用の設定プロバイダーは、同梱ベンダー Plugin でなくても
     メディア理解用に自動登録されます。
   - Ollama の画像理解は、たとえば `agents.defaults.imageModel` や
     `openclaw infer image describe --model ollama/<vision-model>` を通じて
     明示的に選択されたときに利用可能です。
   - 同梱のフォールバック順序:
     - 音声: OpenAI → Groq → xAI → Deepgram → Google → Mistral
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

注: バイナリ検出は macOS/Linux/Windows でベストエフォートです。CLI が `PATH` 上にあることを確認してください（`~` は展開されます）。または、完全なコマンドパスで明示的な CLI モデルを設定してください。

### プロキシ環境サポート（provider モデル）

プロバイダーベースの**音声**および**動画**メディア理解が有効な場合、OpenClaw は
プロバイダーへの HTTP 呼び出しで標準の送信プロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ環境変数が設定されていない場合、メディア理解は直接送信を使います。
プロキシ値が不正な場合、OpenClaw は警告をログに出し、直接フェッチにフォールバックします。

## Capabilities（任意）

`capabilities` を設定した場合、そのエントリはそのメディアタイプに対してのみ実行されます。共有
一覧では、OpenClaw はデフォルトを推測できます。

- `openai`、`anthropic`、`minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google`（Gemini API）: **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- 画像対応モデルを持つ任意の `models.providers.<id>.models[]` カタログ:
  **image**

CLI エントリでは、意図しない一致を避けるため **`capabilities` を明示的に設定**してください。
`capabilities` を省略した場合、そのエントリは配置された一覧に対して適格になります。

## プロバイダーサポートマトリクス（OpenClaw 統合）

| Capability | プロバイダー統合                                                                   | 注記                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 画像      | OpenAI、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、設定プロバイダー | ベンダー Plugin が画像サポートを登録します。MiniMax と MiniMax OAuth はどちらも `MiniMax-VL-01` を使用し、画像対応の設定プロバイダーは自動登録されます。 |
| 音声      | OpenAI、Groq、Deepgram、Google、Mistral                                                | プロバイダー文字起こし（Whisper/Deepgram/Gemini/Voxtral）。                                                                                |
| 動画      | Google、Qwen、Moonshot                                                                 | ベンダー Plugin によるプロバイダー動画理解。Qwen の動画理解は Standard DashScope エンドポイントを使用します。                         |

MiniMax に関する注記:

- `minimax` と `minimax-portal` の画像理解は、Plugin が所有する
  `MiniMax-VL-01` メディアプロバイダーから提供されます。
- 同梱の MiniMax テキストカタログは引き続きテキスト専用から始まり、
  明示的な `models.providers.minimax` エントリによって画像対応の M2.7 chat 参照が具体化されます。

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア capability ごとに利用可能な最新世代の最強モデルを優先してください。
- 信頼できない入力を扱うツール有効エージェントでは、古い/弱いメディアモデルは避けてください。
- 可用性のために capability ごとに少なくとも 1 つのフォールバックを維持してください（高品質モデル + より高速/低コストなモデル）。
- CLI フォールバック（`whisper-cli`、`whisper`、`gemini`）は、プロバイダー API が使えないときに有用です。
- `parakeet-mlx` に関する注記: `--output-dir` を指定すると、出力形式が `txt`（または未指定）の場合、
  OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の形式では stdout にフォールバックします。

## 添付ファイルポリシー

capability ごとの `attachments` は、どの添付ファイルを処理するかを制御します。

- `mode`: `first`（デフォルト）または `all`
- `maxAttachments`: 処理数の上限（デフォルト **1**）
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` のようにラベルが付きます。

ファイル添付の抽出動作:

- 抽出されたファイルテキストは、メディアプロンプトに追加される前に
  **信頼できない外部コンテンツ**としてラップされます。
- 注入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、
  `Source: External` メタデータ行を含みます。
- この添付抽出パスでは、メディアプロンプトの肥大化を避けるため、
  長い `SECURITY NOTICE:` バナーは意図的に省略されます。それでも境界
  マーカーとメタデータは残ります。
- ファイルに抽出可能なテキストがない場合、OpenClaw は `[No extractable text]` を注入します。
- PDF がこのパスでレンダリング済みページ画像にフォールバックした場合でも、メディアプロンプトには
  `[PDF content rendered to images; images not forwarded to model]`
  というプレースホルダーが保持されます。これは、この添付抽出ステップではレンダリングされた PDF 画像ではなくテキストブロックを転送するためです。

## 設定例

### 1) 共有モデル一覧 + オーバーライド

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

### 4) マルチモーダル単一エントリ（明示的な capabilities）

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

メディア理解が実行されると、`/status` には短い要約行が含まれます。

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

これは、capability ごとの結果と、該当する場合は選択された provider/model を示します。

## 注記

- 理解は**ベストエフォート**です。エラーが返信を妨げることはありません。
- 理解が無効な場合でも、添付ファイルは引き続きモデルに渡されます。
- 理解を実行する場所を制限するには `scope` を使ってください（例: DM のみ）。

## 関連ドキュメント

- [設定](/ja-JP/gateway/configuration)
- [画像とメディアのサポート](/ja-JP/nodes/images)
