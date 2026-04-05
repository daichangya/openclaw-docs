---
read_when:
    - メディア理解を設計またはリファクタリングする場合
    - 受信音声/動画/画像の前処理を調整する場合
summary: プロバイダーおよびCLIフォールバックによる受信画像/音声/動画の理解（任意）
title: メディア理解
x-i18n:
    generated_at: "2026-04-05T12:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# メディア理解 - 受信時 (2026-01-17)

OpenClawは、応答パイプラインが動く前に**受信メディア**（画像/音声/動画）を要約できます。ローカルツールまたはプロバイダーキーが利用可能なときに自動検出し、無効化やカスタマイズも可能です。理解処理がオフでも、モデルには通常どおり元のファイル/URLが渡されます。

ベンダー固有のメディア動作はベンダープラグインによって登録され、OpenClaw
coreは共有の`tools.media`設定、フォールバック順序、応答パイプライン統合を担当します。

## 目的

- 任意: より速いルーティングとより良いコマンド解析のために、受信メディアを事前に短いテキストへ要約する。
- 元のメディアを常にモデルへ渡すことを維持する。
- **プロバイダーAPI**と**CLIフォールバック**をサポートする。
- 順序付きフォールバック（エラー/サイズ/タイムアウト）を伴う複数モデルを許可する。

## 高レベルの動作

1. 受信添付ファイルを収集する（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
2. 有効な各機能（画像/音声/動画）について、ポリシーに従って添付ファイルを選択する（デフォルト: **最初**）。
3. 最初に適格なモデルエントリを選ぶ（サイズ + 機能 + 認証）。
4. モデルが失敗するかメディアが大きすぎる場合、**次のエントリへフォールバック**する。
5. 成功時:
   - `Body`は`[Image]`、`[Audio]`、または`[Video]`ブロックになる。
   - 音声は`{{Transcript}}`を設定する。コマンド解析では、キャプションがあればそれを使い、なければ文字起こしを使う。
   - キャプションはブロック内で`User text:`として保持される。

理解処理が失敗した場合や無効な場合でも、**応答フローは元の本文 + 添付ファイルで継続**します。

## 設定概要

`tools.media`は、**共有モデル**と機能ごとの上書きをサポートします:

- `tools.media.models`: 共有モデルリスト（`capabilities`で制御）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - プロバイダー上書き（`baseUrl`、`headers`、`providerOptions`）
  - `tools.media.audio.providerOptions.deepgram`によるDeepgram音声オプション
  - 音声文字起こしのecho制御（`echoTranscript`、デフォルト`false`、`echoFormat`）
  - 任意の**機能ごとの`models`リスト**（共有モデルより優先）
  - `attachments`ポリシー（`mode`、`maxAttachments`、`prefer`）
  - `scope`（channel/chatType/session keyによる任意の制御）
- `tools.media.concurrency`: 同時実行する機能処理数の上限（デフォルト**2**）。

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

各`models[]`エントリは**provider**または**CLI**にできます:

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

CLIテンプレートでは次も使用できます:

- `{{MediaDir}}`（メディアファイルを含むディレクトリ）
- `{{OutputDir}}`（この実行のために作成されるスクラッチディレクトリ）
- `{{OutputBase}}`（拡張子なしのスクラッチファイルベースパス）

## デフォルトと上限

推奨デフォルト:

- `maxChars`: 画像/動画では**500**（短く、コマンド向き）
- `maxChars`: 音声では**未設定**（制限を設定しない限り全文文字起こし）
- `maxBytes`:
  - 画像: **10MB**
  - 音声: **20MB**
  - 動画: **50MB**

ルール:

- メディアが`maxBytes`を超える場合、そのモデルはスキップされ、**次のモデルが試されます**。
- **1024 bytes**未満の音声ファイルは空/破損と見なされ、プロバイダー/CLI文字起こしの前にスキップされます。
- モデルが`maxChars`を超える出力を返した場合、出力は切り詰められます。
- `prompt`のデフォルトは単純な「Describe the {media}.」に`maxChars`の案内を加えたものです（画像/動画のみ）。
- アクティブなPrimary画像モデルがすでにネイティブにvisionをサポートしている場合、OpenClawは`[Image]`要約ブロックを省略し、代わりに元の画像をモデルへ渡します。
- `<capability>.enabled: true`でもモデルが設定されていない場合、OpenClawはそのプロバイダーが機能をサポートしていれば**アクティブな応答モデル**を試します。

### メディア理解の自動検出（デフォルト）

`tools.media.<capability>.enabled`が`false`に設定されておらず、かつ
モデルが設定されていない場合、OpenClawは次の順序で自動検出し、**最初に動作した選択肢で停止**します:

1. そのプロバイダーが機能をサポートしている場合の**アクティブな応答モデル**。
2. **`agents.defaults.imageModel`**のprimary/fallback参照（画像のみ）。
3. **ローカルCLI**（音声のみ。インストール済みの場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR`にencoder/decoder/joiner/tokensが必要）
   - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL`または同梱tinyモデルを使用）
   - `whisper`（Python CLI。モデルを自動ダウンロード）
4. **Gemini CLI**（`gemini`）を`read_many_files`付きで使用
5. **プロバイダー認証**
   - 機能をサポートする設定済みの`models.providers.*`エントリは、
     バンドル済みフォールバック順より先に試されます。
   - 画像対応モデルを持つ画像専用config providerは、バンドル済みベンダープラグインでなくても、自動的にメディア理解向けに登録されます。
   - バンドル済みフォールバック順:
     - 音声: OpenAI → Groq → Deepgram → Google → Mistral
     - 画像: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - 動画: Google → Qwen → Moonshot

自動検出を無効化するには、次を設定します:

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

注: バイナリ検出はmacOS/Linux/Windowsでベストエフォートです。CLIが`PATH`上にあることを確認するか（`~`は展開されます）、完全なコマンドパス付きで明示的なCLIモデルを設定してください。

### プロキシ環境のサポート（providerモデル）

プロバイダーベースの**音声**および**動画**メディア理解が有効な場合、OpenClawは
プロバイダーHTTP呼び出しに対して標準的なアウトバウンドプロキシ環境変数を使用します:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ環境変数が設定されていない場合、メディア理解は直接egressを使います。
プロキシ値の形式が不正な場合、OpenClawは警告をログに出し、直接取得にフォールバックします。

## 機能（任意）

`capabilities`を設定すると、そのエントリはそのメディア種別でのみ実行されます。共有
リストでは、OpenClawがデフォルトを推論できます:

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

CLIエントリでは、意図しない一致を避けるため、**`capabilities`を明示的に設定**してください。
`capabilities`を省略した場合、そのエントリは置かれているリストに対して有効になります。

## プロバイダー対応表（OpenClaw統合）

| Capability | Provider integration | Notes |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | ベンダープラグインが画像サポートを登録します。MiniMaxとMiniMax OAuthはどちらも`MiniMax-VL-01`を使い、画像対応config providerは自動登録されます。 |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | プロバイダー文字起こし（Whisper/Deepgram/Gemini/Voxtral）。                                                                                |
| Video      | Google, Qwen, Moonshot                                                                 | ベンダープラグインによるプロバイダー動画理解。Qwen動画理解はStandard DashScopeエンドポイントを使用します。                         |

MiniMaxに関する注記:

- `minimax`および`minimax-portal`の画像理解は、プラグイン所有の
  `MiniMax-VL-01`メディアプロバイダーから提供されます。
- バンドル済みMiniMaxテキストカタログは引き続きテキスト専用で始まります。明示的な
  `models.providers.minimax`エントリにより、画像対応のM2.7チャット参照が具体化されます。

## モデル選択ガイダンス

- 品質と安全性が重要な場合は、各メディア機能について利用可能な中で最も強力な最新世代モデルを優先してください。
- 信頼できない入力を扱うtool対応エージェントでは、古い/弱いメディアモデルは避けてください。
- 可用性のために、各機能ごとに少なくとも1つのフォールバックを維持してください（高品質モデル + より高速/低コストモデル）。
- CLIフォールバック（`whisper-cli`、`whisper`、`gemini`）は、プロバイダーAPIが利用できない場合に便利です。
- `parakeet-mlx`に関する注記: `--output-dir`付きでは、出力形式が`txt`（または未指定）の場合、OpenClawは`<output-dir>/<media-basename>.txt`を読み取ります。`txt`以外の形式ではstdoutにフォールバックします。

## 添付ファイルポリシー

機能ごとの`attachments`は、どの添付ファイルを処理するかを制御します:

- `mode`: `first`（デフォルト）または`all`
- `maxAttachments`: 処理数の上限（デフォルト**1**）
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"`の場合、出力には`[Image 1/2]`、`[Audio 2/2]`のようなラベルが付きます。

ファイル添付ファイル抽出の動作:

- 抽出されたファイルテキストは、メディアプロンプトへ追加される前に
  **信頼できない外部コンテンツ**としてラップされます。
- 注入されるブロックでは、次のような明示的な境界マーカーが使われます:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`。さらに
  `Source: External`メタデータ行も含まれます。
- この添付ファイル抽出パスでは、メディアプロンプトが膨らみすぎないよう、
  長い`SECURITY NOTICE:`バナーを意図的に省略します。それでも境界マーカーとメタデータは残ります。
- ファイルから抽出可能なテキストがない場合、OpenClawは`[No extractable text]`を注入します。
- このパスでPDFがレンダリング済みページ画像へフォールバックした場合、メディアプロンプトには
  `[PDF content rendered to images; images not forwarded to model]`
  というプレースホルダーが保持されます。これは、この添付ファイル抽出ステップが転送するのはテキストブロックであり、レンダリング済みPDF画像ではないためです。

## 設定例

### 1) 共有モデルリスト + 上書き

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

### 4) 単一エントリのマルチモーダル（明示的capabilities）

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

メディア理解が実行されると、`/status`には短いサマリー行が含まれます:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

ここには、機能ごとの結果と、該当する場合は選択されたprovider/modelが表示されます。

## 注記

- 理解処理は**ベストエフォート**です。エラーが発生しても応答はブロックされません。
- 理解処理が無効でも、添付ファイルは引き続きモデルへ渡されます。
- `scope`を使うと、理解処理を実行する場所を制限できます（例: DMのみ）。

## 関連ドキュメント

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
