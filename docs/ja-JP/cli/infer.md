---
read_when:
    - '`openclaw infer` コマンドの追加または変更'
    - 安定したヘッドレスcapability自動化の設計
summary: プロバイダーバックのモデル、画像、音声、TTS、動画、Web、埋め込みワークフロー向けのinfer-first CLI
title: Inference CLI
x-i18n:
    generated_at: "2026-04-25T13:44:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` は、プロバイダーバックの推論ワークフロー向けの正式なヘッドレスサーフェスです。

これは意図的に、生のGateway RPC名でも生のagent tool idでもなく、capabilityファミリーを公開します。

## inferをSkillにする

これをエージェントにコピーして貼り付けてください:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良いinferベースのSkillは、次のようにするべきです:

- 一般的なユーザー意図を正しいinferサブコマンドにマッピングする
- カバーするワークフロー向けに、いくつかの代表的なinfer例を含める
- 例や提案では `openclaw infer ...` を優先する
- Skill本文の中でinferサーフェス全体を再度ドキュメント化しない

典型的なinfer重視のSkillの対象範囲:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## inferを使う理由

`openclaw infer` は、OpenClaw内でのプロバイダーバック推論タスク向けに、一貫した1つのCLIを提供します。

利点:

- バックエンドごとに単発のラッパーを配線する代わりに、OpenClawですでに設定済みのプロバイダーとモデルを使えます。
- モデル、画像、音声文字起こし、TTS、動画、Web、埋め込みのワークフローを1つのコマンドツリーの下にまとめられます。
- スクリプト、自動化、エージェント駆動ワークフロー向けに、安定した `--json` 出力形式を使えます。
- タスクが本質的に「推論を実行する」ことである場合、OpenClawのファーストパーティサーフェスを優先できます。
- ほとんどのinferコマンドで、Gatewayを必要とせず通常のローカルパスを使えます。

エンドツーエンドのプロバイダーチェックには、下位レベルの
プロバイダーテストがグリーンになったら `openclaw infer ...` を優先してください。
これは、プロバイダーリクエストが行われる前に、出荷されているCLI、設定読み込み、
default-agent解決、バンドル済みPlugin有効化、ランタイム依存関係修復、
および共有capabilityランタイムをテストします。

## コマンドツリー

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## よくあるタスク

この表は、よくある推論タスクを対応するinferコマンドにマッピングしたものです。

| タスク                  | コマンド                                                               | 注記                                                   |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| テキスト/モデルプロンプトを実行 | `openclaw infer model run --prompt "..." --json`                       | デフォルトでは通常のローカルパスを使用                 |
| 画像を生成する          | `openclaw infer image generate --prompt "..." --json`                  | 既存ファイルから始める場合は `image edit` を使用       |
| 画像ファイルを説明する  | `openclaw infer image describe --file ./image.png --json`              | `--model` は画像対応の `<provider/model>` である必要があります |
| 音声を書き起こす        | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` は `<provider/model>` である必要があります   |
| 音声を合成する          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` はGateway向けです                          |
| 動画を生成する          | `openclaw infer video generate --prompt "..." --json`                  | `--resolution` などのプロバイダーヒントをサポート      |
| 動画ファイルを説明する  | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` は `<provider/model>` である必要があります   |
| Webを検索する           | `openclaw infer web search --query "..." --json`                       |                                                        |
| Webページを取得する     | `openclaw infer web fetch --url https://example.com --json`            |                                                        |
| 埋め込みを作成する      | `openclaw infer embedding create --text "..." --json`                  |                                                        |

## 振る舞い

- `openclaw infer ...` は、これらのワークフロー向けの主要CLIサーフェスです。
- 出力を別のコマンドまたはスクリプトで消費する場合は `--json` を使ってください。
- 特定のバックエンドが必要な場合は、`--provider` または `--model provider/model` を使ってください。
- `image describe`、`audio transcribe`、`video describe` では、`--model` は `<provider/model>` 形式でなければなりません。
- `image describe` では、明示的な `--model` により、そのprovider/modelを直接実行します。モデルはモデルカタログまたはプロバイダー設定で画像対応である必要があります。`codex/<model>` は、制限付きのCodex app-server画像理解ターンを実行します。`openai-codex/<model>` はOpenAI Codex OAuthプロバイダーパスを使用します。
- ステートレス実行コマンドはデフォルトでローカルです。
- Gateway管理状態のコマンドはデフォルトでgatewayです。
- 通常のローカルパスでは、Gatewayを起動しておく必要はありません。
- `model run` はワンショットです。そのコマンド向けにagent runtimeを通じて開かれたMCPサーバーは、ローカル実行でも `--gateway` 実行でも、返信後に破棄されます。そのため、スクリプトから繰り返し呼び出してもstdio MCP子プロセスは生き続けません。

## Model

プロバイダーバックのテキスト推論とmodel/providerの確認には `model` を使います。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

注記:

- `model run` はagent runtimeを再利用するため、provider/modelの上書きは通常のagent実行と同様に動作します。
- `model run` はヘッドレス自動化向けであるため、コマンド終了後にセッション単位のバンドル済みMCP runtimeを保持しません。
- `model auth login`、`model auth logout`、`model auth status` は、保存されたプロバイダー認証状態を管理します。

## Image

生成、編集、説明には `image` を使います。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

注記:

- 既存の入力ファイルから始める場合は `image edit` を使ってください。
- `image providers --json` を使うと、どのバンドル済み画像プロバイダーが
  発見可能か、設定済みか、選択されているか、また各プロバイダーがどの生成/編集capabilityを
  公開しているかを確認できます。
- 画像生成の変更に対する、最も限定的なlive CLI smokeとして
  `image generate --model <provider/model> --json` を使ってください。例:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSONレスポンスには、`ok`、`provider`、`model`、`attempts`、および書き込まれた
  出力パスが報告されます。`--output` が設定されている場合、最終的な拡張子は
  プロバイダーが返したMIME typeに従うことがあります。

- `image describe` では、`--model` は画像対応の `<provider/model>` である必要があります。
- ローカルのOllama vision modelでは、先にモデルをpullし、`OLLAMA_API_KEY` を任意のプレースホルダー値、たとえば `ollama-local` に設定してください。[Ollama](/ja-JP/providers/ollama#vision-and-image-description) を参照してください。

## Audio

ファイル文字起こしには `audio` を使います。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注記:

- `audio transcribe` はファイル文字起こし用であり、リアルタイムセッション管理用ではありません。
- `--model` は `<provider/model>` である必要があります。

## TTS

音声合成とTTSプロバイダー状態には `tts` を使います。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注記:

- `tts status` はGateway管理のTTS状態を反映するため、デフォルトでgatewayになります。
- TTSの振る舞いを確認および設定するには `tts providers`、`tts voices`、`tts set-provider` を使ってください。

## Video

生成と説明には `video` を使います。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注記:

- `video generate` は `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark`、`--timeout-ms` を受け付け、それらを動画生成runtimeへ転送します。
- `video describe` では、`--model` は `<provider/model>` である必要があります。

## Web

検索および取得ワークフローには `web` を使います。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注記:

- 利用可能、設定済み、選択済みのプロバイダーを確認するには `web providers` を使ってください。

## Embedding

ベクター作成と埋め込みプロバイダー確認には `embedding` を使います。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON出力

inferコマンドは、共有エンベロープの下でJSON出力を正規化します:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

トップレベルフィールドは安定しています:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

生成メディアコマンドでは、`outputs` にOpenClawが書き込んだファイルが含まれます。
自動化では、人が読むstdoutを解析する代わりに、
その配列内の `path`、`mimeType`、`size`、およびメディア固有の寸法を使ってください。

## よくある落とし穴

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 注記

- `openclaw capability ...` は `openclaw infer ...` のエイリアスです。

## 関連

- [CLI reference](/ja-JP/cli)
- [Models](/ja-JP/concepts/models)
