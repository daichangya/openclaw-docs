---
read_when:
    - メディア理解を設計またはリファクタリングする
    - 受信音声/動画/画像の前処理を調整する
summary: 受信した画像/音声/動画の理解（任意）と、provider + CLI フォールバック
title: メディア理解
x-i18n:
    generated_at: "2026-04-25T13:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# メディア理解 - 受信（2026-01-17）

OpenClaw は、返信パイプラインが実行される前に**受信メディア**（画像/音声/動画）を要約できます。ローカルツールまたは provider key が利用可能なときに自動検出し、無効化やカスタマイズも可能です。理解機能がオフでも、モデルには通常どおり元のファイル/URL が渡されます。

vendor 固有のメディア動作は vendor Plugin によって登録されますが、OpenClaw
core は共有の `tools.media` 設定、フォールバック順序、および返信パイプライン統合を管理します。

## 目的

- 任意: ルーティングの高速化とコマンド解析の改善のために、受信メディアを短いテキストへ事前変換する。
- 元のメディアをモデルへ渡す処理は保持する（常に）。
- **provider API** と **CLI フォールバック** をサポートする。
- 順序付きフォールバックを持つ複数モデルを許可する（エラー/サイズ/タイムアウト）。

## 高レベルな動作

1. 受信添付を収集する（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
2. 有効な各 capability（画像/音声/動画）について、ポリシーに従って添付を選択する（デフォルト: **最初**）。
3. 最初に適格なモデルエントリを選ぶ（サイズ + capability + auth）。
4. モデルが失敗するかメディアが大きすぎる場合は、**次のエントリへフォールバック**する。
5. 成功した場合:
   - `Body` は `[Image]`、`[Audio]`、または `[Video]` ブロックになる。
   - 音声では `{{Transcript}}` が設定される。コマンド解析では、caption text があればそれを使い、なければ transcript を使う。
   - Caption はブロック内の `User text:` として保持される。

理解に失敗した場合、または無効化されている場合でも、**返信フローは継続**し、元の body + attachments を使います。

## 設定概要

`tools.media` は**共有モデル**と capability ごとの上書きをサポートします。

- `tools.media.models`: 共有モデルリスト（`capabilities` で制御）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - defaults（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - provider overrides（`baseUrl`、`headers`、`providerOptions`）
  - `tools.media.audio.providerOptions.deepgram` 経由の Deepgram 音声オプション
  - 音声 transcript echo 制御（`echoTranscript`、デフォルト `false`、`echoFormat`）
  - 任意の **capability ごとの `models` リスト**（共有モデルより優先）
  - `attachments` ポリシー（`mode`、`maxAttachments`、`prefer`）
  - `scope`（channel/chatType/session key による任意の制御）

- `tools.media.concurrency`: capability 実行の最大同時数（デフォルト **2**）。

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

各 `models[]` エントリは **provider** または **CLI** のいずれかです。

```json5
{
  type: "provider", // 省略時のデフォルト
  provider: "openai",
  model: "gpt-5.5",
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

CLI テンプレートでは次も使用できます。

- `{{MediaDir}}`（メディアファイルを含むディレクトリ）
- `{{OutputDir}}`（この実行用に作成される scratch dir）
- `{{OutputBase}}`（拡張子なしの scratch file base path）

## デフォルトと制限

推奨デフォルト:

- `maxChars`: 画像/動画では **500**（短く、コマンド向き）
- `maxChars`: 音声では **未設定**（制限を設定しない限り全文 transcript）
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

ルール:

- メディアが `maxBytes` を超える場合、そのモデルはスキップされ、**次のモデルが試されます**。
- **1024 bytes** 未満の音声ファイルは空/破損として扱われ、provider/CLI transcription の前にスキップされます。
- モデルが `maxChars` を超える内容を返した場合、出力は切り詰められます。
- `prompt` のデフォルトは、単純な 「Describe the {media}.」 に `maxChars` ガイダンスを加えたものです（画像/動画のみ）。
- アクティブな primary image model がすでにネイティブに vision をサポートしている場合、OpenClaw は
  `[Image]` 要約ブロックをスキップし、元画像をそのままモデルへ渡します。
- Gateway/WebChat の primary model が text-only の場合、image attachment は
  offload された `media://inbound/*` ref として保持されるため、image/PDF tools や設定済み image model で引き続き検査でき、attachment が失われません。
- 明示的な `openclaw infer image describe --model <provider/model>` リクエストは
  異なります。これらは、その image-capable provider/model を直接実行します。`ollama/qwen2.5vl:7b` のような Ollama ref も含みます。
- `<capability>.enabled: true` だがモデルが設定されていない場合、OpenClaw は
  その provider が capability をサポートしていれば**アクティブな返信モデル**を試します。

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled` が **`false` に設定されておらず**、
モデルも設定されていない場合、OpenClaw は次の順序で自動検出し、**最初に
動作した選択肢で停止**します。

1. その provider が capability をサポートしている場合の**アクティブな返信モデル**
2. **`agents.defaults.imageModel`** の primary/fallback ref（image のみ）
3. **ローカル CLI**（audio のみ、インストールされている場合）
   - `sherpa-onnx-offline`（encoder/decoder/joiner/tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - `whisper-cli`（`whisper-cpp`; `WHISPER_CPP_MODEL` またはバンドル済み tiny model を使用）
   - `whisper`（Python CLI; モデルを自動ダウンロード）
4. `read_many_files` を使う **Gemini CLI**（`gemini`）
5. **Provider auth**
   - capability をサポートする設定済み `models.providers.*` エントリは、
     バンドル済みフォールバック順序より前に試されます。
   - image-capable model を持つ image-only config provider は、バンドル済み vendor Plugin でなくても、メディア理解用に自動登録されます。
   - Ollama の image understanding は、たとえば `agents.defaults.imageModel` や
     `openclaw infer image describe --model ollama/<vision-model>` を通じて明示的に選択した場合に利用できます。
   - バンドル済みのフォールバック順序:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

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

注意: バイナリ検出は macOS/Linux/Windows でベストエフォートです。CLI が `PATH` 上にあることを確認してください（`~` は展開されます）。または、完全なコマンドパスで明示的な CLI model を設定してください。

### Proxy 環境サポート（provider models）

provider ベースの **audio** および **video** メディア理解が有効な場合、OpenClaw は
provider HTTP 呼び出しに対して標準的な outbound proxy 環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

proxy 環境変数が設定されていない場合、メディア理解は直接 egress を使用します。  
proxy 値の形式が不正な場合、OpenClaw は warning をログし、直接
fetch にフォールバックします。

## Capabilities（任意）

`capabilities` を設定した場合、そのエントリはそれらのメディアタイプに対してのみ実行されます。共有
リストでは、OpenClaw はデフォルトを推論できます。

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
- image-capable model を持つ任意の `models.providers.<id>.models[]` カタログ:
  **image**

CLI エントリでは、意図しない一致を避けるため **`capabilities` を明示的に設定**してください。  
`capabilities` を省略した場合、そのエントリはそれが置かれたリストに対して適格になります。

## Provider サポートマトリクス（OpenClaw 統合）

| Capability | Provider integration                                                                                                         | Notes                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI、OpenAI Codex OAuth、Codex app-server、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、config providers | vendor Plugin が image support を登録します。`openai-codex/*` は OAuth provider の仕組みを使用し、`codex/*` は制限付きの Codex app-server turn を使用します。MiniMax と MiniMax OAuth はどちらも `MiniMax-VL-01` を使用し、image-capable な config provider は自動登録されます。 |
| Audio      | OpenAI、Groq、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral                                                         | provider transcription（Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                                 |
| Video      | Google、Qwen、Moonshot                                                                                                       | vendor Plugin 経由の provider video understanding。Qwen の video understanding は Standard DashScope endpoint を使用します。                                                                                                          |

MiniMax に関する注意:

- `minimax` と `minimax-portal` の image understanding は、Plugin 管理の
  `MiniMax-VL-01` media provider から提供されます。
- バンドル済み MiniMax text catalog は、依然として text-only から始まります。明示的な
  `models.providers.minimax` エントリは、image-capable な M2.7 chat ref を実体化します。

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア capability に対して利用可能な中で最も強力な最新世代モデルを優先してください。
- 信頼できない入力を扱うツール有効エージェントでは、古い/弱いメディアモデルは避けてください。
- 可用性のため、capability ごとに少なくとも 1 つの fallback を維持してください（高品質モデル + より高速/低コストモデル）。
- CLI フォールバック（`whisper-cli`、`whisper`、`gemini`）は、provider API が利用できない場合に有用です。
- `parakeet-mlx` に関する注意: `--output-dir` を使う場合、出力形式が `txt`（または未指定）のとき、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の形式では stdout にフォールバックします。

## Attachment ポリシー

capability ごとの `attachments` は、どの attachment を処理するかを制御します。

- `mode`: `first`（デフォルト）または `all`
- `maxAttachments`: 処理する最大数（デフォルト **1**）
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` のようなラベルが付きます。

ファイル attachment 抽出の動作:

- 抽出されたファイルテキストは、メディアプロンプトに追加される前に
  **信頼できない外部コンテンツ** としてラップされます。
- 注入されるブロックは、
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、
  `Source: External` メタデータ行を含みます。
- この attachment 抽出経路では、メディアプロンプトの肥大化を避けるため、
  長い `SECURITY NOTICE:` バナーは意図的に省略されます。ただし境界
  マーカーとメタデータ自体は維持されます。
- 抽出可能なテキストがないファイルについては、OpenClaw は `[No extractable text]` を注入します。
- PDF がこの経路でレンダリング済みページ画像へフォールバックした場合、メディアプロンプトには
  `[PDF content rendered to images; images not forwarded to model]`
  というプレースホルダーが維持されます。これは、この attachment 抽出ステップではレンダリングされた PDF 画像ではなく、テキストブロックを転送するためです。

## 設定例

### 1) 共有モデルリスト + 上書き

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
          { provider: "openai", model: "gpt-5.5" },
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

### 4) マルチモーダル単一エントリ（明示的 capabilities）

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
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

これは、capability ごとの結果と、該当する場合は選択された provider/model を示します。

## 注意

- 理解は**ベストエフォート**です。エラーがあっても返信はブロックされません。
- 理解機能が無効でも、attachments は引き続きモデルへ渡されます。
- 理解を実行する場所を制限するには `scope` を使用します（たとえば DM のみ）。

## 関連ドキュメント

- [Configuration](/ja-JP/gateway/configuration)
- [Image & Media Support](/ja-JP/nodes/images)
