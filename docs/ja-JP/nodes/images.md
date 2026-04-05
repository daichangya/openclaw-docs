---
read_when:
    - メディアパイプラインまたは添付ファイルを変更する場合
summary: send、Gateway、エージェント応答における画像およびメディア処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-04-05T12:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# 画像とメディアのサポート (2025-12-05)

WhatsAppチャンネルは**Baileys Web**経由で動作します。このドキュメントでは、send、Gateway、エージェント応答における現在のメディア処理ルールをまとめています。

## 目的

- `openclaw message send --media`で、任意のキャプション付きメディアを送信する。
- web inboxからの自動応答で、テキストとともにメディアを含められるようにする。
- タイプごとの上限を妥当かつ予測しやすいものに保つ。

## CLIサーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media`は任意。メディアのみ送信する場合、キャプションは空でもかまいません。
  - `--dry-run`は解決済みペイロードを表示します。`--json`は`{ channel, to, messageId, mediaUrl, caption }`を出力します。

## WhatsApp Webチャンネルの動作

- 入力: ローカルファイルパス**または**HTTP(S) URL。
- フロー: Bufferに読み込み、メディア種別を検出し、正しいペイロードを構築します:
  - **画像:** JPEGにリサイズして再圧縮します（最大辺2048px）。`channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）を目標にします。
  - **音声/ボイス/動画:** 16 MBまでそのまま通します。音声はボイスノートとして送信されます（`ptt: true`）。
  - **ドキュメント:** それ以外はすべて、100 MBまで。利用可能な場合はファイル名を保持します。
- WhatsAppのGIF風再生: `gifPlayback: true`付きでMP4を送信します（CLI: `--gif-playback`）。これによりモバイルクライアントでインラインループ再生されます。
- MIME検出は、まずマジックバイト、次にヘッダー、最後にファイル拡張子を優先します。
- キャプションは`--message`または`reply.text`から取得します。空のキャプションも許可されます。
- ログ: 非verboseでは`↩️`/`✅`を表示します。verboseではサイズとソースパス/URLも含まれます。

## 自動応答パイプライン

- `getReplyFromConfig`は`{ text?, mediaUrl?, mediaUrls? }`を返します。
- メディアがある場合、web senderは`openclaw message send`と同じパイプラインを使用してローカルパスまたはURLを解決します。
- 複数のメディアエントリが指定された場合は、順番に送信されます。

## コマンドへの受信メディア（Pi）

- 受信したwebメッセージにメディアが含まれる場合、OpenClawはそれを一時ファイルにダウンロードし、次のテンプレート変数を公開します:
  - 受信メディア用の疑似URLである`{{MediaUrl}}`
  - コマンド実行前に書き出されるローカル一時パスである`{{MediaPath}}`
- セッションごとのDocker sandboxが有効な場合、受信メディアはsandbox workspaceにコピーされ、`MediaPath`/`MediaUrl`は`media/inbound/<filename>`のような相対パスに書き換えられます。
- メディア理解（`tools.media.*`または共有`tools.media.models`で設定されている場合）はテンプレート適用前に実行され、`Body`に`[Image]`、`[Audio]`、`[Video]`ブロックを挿入できます。
  - 音声では`{{Transcript}}`が設定され、コマンド解析には文字起こしが使われるため、スラッシュコマンドも引き続き機能します。
  - 動画と画像の説明では、コマンド解析用にキャプションテキストが保持されます。
  - アクティブなPrimary画像モデルがすでにネイティブにvisionをサポートしている場合、OpenClawは`[Image]`要約ブロックを省略し、代わりに元の画像をモデルへ渡します。
- デフォルトでは、最初に一致した画像/音声/動画の添付ファイルのみが処理されます。複数の添付ファイルを処理するには`tools.media.<cap>.attachments`を設定してください。

## 制限とエラー

**送信時の上限（WhatsApp web send）**

- 画像: 再圧縮後に`channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）まで。
- 音声/ボイス/動画: 上限16 MB。ドキュメント: 上限100 MB。
- サイズ超過または読み取り不能なメディア → ログに明確なエラーを出し、応答はスキップされます。

**メディア理解の上限（文字起こし/説明）**

- 画像のデフォルト: 10 MB（`tools.media.image.maxBytes`）。
- 音声のデフォルト: 20 MB（`tools.media.audio.maxBytes`）。
- 動画のデフォルト: 50 MB（`tools.media.video.maxBytes`）。
- サイズ超過のメディアでは理解処理はスキップされますが、応答自体は元の本文のまま継続されます。

## テスト向けメモ

- 画像/音声/ドキュメントのケースについて、send + replyフローをカバーする。
- 画像の再圧縮（サイズ上限）と、音声のボイスノートフラグを検証する。
- 複数メディアの応答が順次送信として展開されることを確認する。
