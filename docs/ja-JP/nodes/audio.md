---
read_when:
    - 音声文字起こしやメディア処理を変更する場合
summary: 受信した音声/ボイスノートがどのようにダウンロード、文字起こしされ、返信に挿入されるか
title: 音声とボイスノート
x-i18n:
    generated_at: "2026-04-05T12:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# 音声 / ボイスノート（2026-01-17）

## 動作する内容

- **メディア理解（音声）**: 音声理解が有効になっている場合（または自動検出される場合）、OpenClawは次の処理を行います:
  1. 最初の音声添付ファイル（ローカルパスまたはURL）を見つけ、必要に応じてダウンロードします。
  2. 各モデルエントリーに送信する前に `maxBytes` を適用します。
  3. 対象となる最初のモデルエントリーを順番に実行します（providerまたはCLI）。
  4. 失敗またはスキップした場合（サイズ超過/タイムアウト）、次のエントリーを試します。
  5. 成功すると、`Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定します。
- **コマンド解析**: 文字起こしに成功すると、スラッシュコマンドが引き続き動作するように `CommandBody`/`RawBody` が文字起こし内容に設定されます。
- **詳細ログ**: `--verbose` では、文字起こしが実行されたときと、本文が置き換えられたときをログに記録します。

## 自動検出（デフォルト）

**モデルを設定しておらず**、かつ `tools.media.audio.enabled` が **`false` に設定されていない**場合、
OpenClawは次の順序で自動検出し、最初に動作したオプションで停止します:

1. **アクティブな返信モデル**（そのproviderが音声理解をサポートしている場合）。
2. **ローカルCLI**（インストールされている場合）
   - `sherpa-onnx-offline`（`SHERPA_ONNX_MODEL_DIR` に encoder/decoder/joiner/tokens が必要）
   - `whisper-cli`（`whisper-cpp` 由来。`WHISPER_CPP_MODEL` または同梱のtinyモデルを使用）
   - `whisper`（Python CLI。モデルを自動ダウンロード）
3. **Gemini CLI**（`gemini`）の `read_many_files` を使用
4. **プロバイダー認証**
   - 音声をサポートする設定済みの `models.providers.*` エントリーを先に試します
   - 同梱のフォールバック順: OpenAI → Groq → Deepgram → Google → Mistral

自動検出を無効にするには、`tools.media.audio.enabled: false` を設定してください。
カスタマイズするには、`tools.media.audio.models` を設定してください。
注: バイナリ検出は macOS/Linux/Windows でベストエフォートです。CLIが `PATH` 上にあることを確認し（`~` は展開されます）、または完全なコマンドパスを持つ明示的なCLIモデルを設定してください。

## 設定例

### Provider + CLI フォールバック（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### スコープ制御付きのproviderのみ

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### providerのみ（Deepgram）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### providerのみ（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### 文字起こしをチャットにエコーする（opt-in）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // デフォルトは false
        echoFormat: '📝 "{transcript}"', // 任意。{transcript} をサポート
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注記と制限

- provider認証は標準のモデル認証順序に従います（auth profile、env var、`models.providers.*.apiKey`）。
- Groqのセットアップ詳細: [Groq](/providers/groq)。
- `provider: "deepgram"` を使用すると、Deepgramは `DEEPGRAM_API_KEY` を取得します。
- Deepgramのセットアップ詳細: [Deepgram (audio transcription)](/providers/deepgram)。
- Mistralのセットアップ詳細: [Mistral](/providers/mistral)。
- 音声providerは、`tools.media.audio` 経由で `baseUrl`、`headers`、`providerOptions` を上書きできます。
- デフォルトのサイズ上限は20MB（`tools.media.audio.maxBytes`）です。サイズ超過の音声はそのモデルではスキップされ、次のエントリーが試されます。
- 1024バイト未満の小さすぎる/空の音声ファイルは、provider/CLI文字起こしの前にスキップされます。
- 音声のデフォルト `maxChars` は**未設定**です（全文字起こし）。出力を切り詰めるには `tools.media.audio.maxChars` またはエントリーごとの `maxChars` を設定してください。
- OpenAIの自動デフォルトは `gpt-4o-mini-transcribe` です。より高い精度が必要なら `model: "gpt-4o-transcribe"` を設定してください。
- 複数のボイスノートを処理するには `tools.media.audio.attachments` を使います（`mode: "all"` + `maxAttachments`）。
- 文字起こしはテンプレート内で `{{Transcript}}` として利用できます。
- `tools.media.audio.echoTranscript` はデフォルトでオフです。agent処理前に元のチャットへ文字起こし確認を返すには有効にしてください。
- `tools.media.audio.echoFormat` はエコーテキストをカスタマイズします（プレースホルダー: `{transcript}`）。
- CLIのstdoutには上限があります（5MB）。CLI出力は簡潔に保ってください。

### プロキシ環境のサポート

providerベースの音声文字起こしは、標準の外向きプロキシenv varを尊重します:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシenv varが設定されていない場合は、直接egressが使われます。プロキシ設定が不正な場合、OpenClawは警告を記録し、直接fetchにフォールバックします。

## グループでのメンション検出

グループチャットで `requireMention: true` が設定されている場合、OpenClawはメンションを確認する**前に**音声を文字起こしするようになりました。これにより、メンションを含むボイスノートも処理できるようになります。

**仕組み:**

1. ボイスメッセージにテキスト本文がなく、かつグループでメンションが必須の場合、OpenClawは「事前」文字起こしを行います。
2. 文字起こし内容に対してメンションパターン（例: `@BotName`、絵文字トリガー）を確認します。
3. メンションが見つかると、メッセージは完全な返信パイプラインへ進みます。
4. ボイスノートがメンションゲートを通過できるよう、文字起こし内容がメンション検出に使われます。

**フォールバック動作:**

- 事前文字起こし中に失敗した場合（タイムアウト、APIエラーなど）、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混在メッセージ（テキスト + 音声）が誤ってドロップされることはありません。

**Telegramグループ/トピックごとのopt-out:**

- そのグループで事前文字起こしのメンション確認をスキップするには、`channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとに上書きするには `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（`true` でスキップ、`false` で強制有効化）。
- デフォルトは `false` です（メンションゲート条件に一致する場合、事前処理が有効）。

**例:** `requireMention: true` のTelegramグループで、ユーザーが「Hey @Claude, what's the weather?」というボイスノートを送信します。ボイスノートは文字起こしされ、メンションが検出され、agentが返信します。

## 注意点

- スコープルールは最初に一致したものが優先されます。`chatType` は `direct`、`group`、`room` に正規化されます。
- CLIが終了コード0で終了し、プレーンテキストを出力することを確認してください。JSONは `jq -r .text` で整形する必要があります。
- `parakeet-mlx` では、`--output-dir` を渡した場合、`--output-format` が `txt`（または省略）のときは OpenClaw が `<output-dir>/<media-basename>.txt` を読み取ります。`txt` 以外の出力形式では stdout 解析にフォールバックします。
- 返信キューのブロックを避けるため、タイムアウト（`timeoutSeconds`、デフォルト60秒）は適切な値に保ってください。
- メンション検出のための事前文字起こしでは、**最初の**音声添付ファイルのみを処理します。追加の音声はメインのメディア理解フェーズで処理されます。
