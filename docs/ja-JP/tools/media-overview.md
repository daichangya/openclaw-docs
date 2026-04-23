---
read_when:
    - メディア capabilities の概要を探している場合
    - どのメディア provider を設定するかを決めること
    - 非同期メディア生成がどのように動作するかを理解すること
summary: メディア生成、理解、および音声 capabilities の統合ランディングページ
title: メディア概要
x-i18n:
    generated_at: "2026-04-23T04:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# メディア生成と理解

OpenClaw は画像、動画、音楽を生成し、受信メディア（画像、音声、動画）を理解し、text-to-speech で返信を音声として読み上げます。すべてのメディア capability はツール駆動です。エージェントは会話に基づいてそれらをいつ使うか判断し、各ツールは少なくとも 1 つの対応 provider が設定されている場合にのみ表示されます。

## capability の概要

| Capability           | ツール             | Provider                                                                                    | 機能                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 画像生成     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | テキストプロンプトまたは参照から画像を作成または編集する |
| 動画生成     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | テキスト、画像、または既存の動画から動画を作成する    |
| 音楽生成     | `music_generate` | ComfyUI, Google, MiniMax                                                                     | テキストプロンプトから音楽または音声トラックを作成する         |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | 送信返信を音声に変換する               |
| メディア理解  | （自動）      | 任意の vision/audio 対応モデル provider、および CLI フォールバック                                  | 受信画像、音声、動画を要約する             |

## Provider capability マトリクス

この表は、プラットフォーム全体でどの provider がどのメディア capability をサポートするかを示します。

| Provider   | 画像 | 動画 | 音楽 | TTS | STT / 文字起こし | メディア理解 |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |       | Yes   |       |     |                     |                     |
| BytePlus   |       | Yes   |       |     |                     |                     |
| ComfyUI    | Yes   | Yes   | Yes   |     |                     |                     |
| Deepgram   |       |       |       |     | Yes                 |                     |
| ElevenLabs |       |       |       | Yes | Yes                 |                     |
| fal        | Yes   | Yes   |       |     |                     |                     |
| Google     | Yes   | Yes   | Yes   |     |                     | Yes                 |
| Microsoft  |       |       |       | Yes |                     |                     |
| MiniMax    | Yes   | Yes   | Yes   | Yes |                     |                     |
| Mistral    |       |       |       |     | Yes                 |                     |
| OpenAI     | Yes   | Yes   |       | Yes | Yes                 | Yes                 |
| Qwen       |       | Yes   |       |     |                     |                     |
| Runway     |       | Yes   |       |     |                     |                     |
| Together   |       | Yes   |       |     |                     |                     |
| Vydra      | Yes   | Yes   |       |     |                     |                     |
| xAI        | Yes   | Yes   |       | Yes | Yes                 | Yes                 |

<Note>
メディア理解では、provider 設定に登録されている任意の vision 対応または audio 対応モデルを使用します。上の表では、専用のメディア理解サポートを持つ provider を強調しています。マルチモーダルモデルを持つほとんどの LLM provider（Anthropic、Google、OpenAI など）も、アクティブな返信モデルとして設定されていれば受信メディアを理解できます。
</Note>

## 非同期生成の仕組み

動画生成と音楽生成は、provider 側の処理に通常 30 秒から数分かかるため、バックグラウンドタスクとして実行されます。エージェントが `video_generate` または `music_generate` を呼び出すと、OpenClaw は provider にリクエストを送信し、即座にタスク ID を返し、タスク台帳でジョブを追跡します。ジョブ実行中も、エージェントは他のメッセージへの返信を続けます。provider の処理が完了すると、OpenClaw はエージェントを起こし、完成したメディアを元のチャンネルに投稿できるようにします。画像生成と TTS は同期的で、返信の中でインラインに完了します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は、設定されていればいずれも
バッチ `tools.media.audio` パスを通じて受信音声を文字起こしできます。Deepgram、
ElevenLabs、Mistral、OpenAI、xAI は Voice Call ストリーミング STT
provider も登録するため、ライブの電話音声を、録音完了を待たずに選択したベンダーへ
転送できます。

OpenAI は、OpenClaw の画像、動画、バッチ TTS、バッチ STT、Voice Call
ストリーミング STT、realtime voice、およびメモリ embedding サーフェスに対応しています。xAI は現在、OpenClaw の画像、動画、検索、コード実行、バッチ TTS、バッチ STT、
および Voice Call ストリーミング STT サーフェスに対応しています。xAI Realtime voice は上流の
capability ですが、共有 realtime voice コントラクトでそれを表現できるようになるまで、OpenClaw には登録されません。

## クイックリンク

- [画像生成](/ja-JP/tools/image-generation) -- 画像の生成と編集
- [動画生成](/ja-JP/tools/video-generation) -- text-to-video、image-to-video、video-to-video
- [音楽生成](/ja-JP/tools/music-generation) -- 音楽と音声トラックの作成
- [Text-to-Speech](/ja-JP/tools/tts) -- 返信を音声に変換
- [メディア理解](/ja-JP/nodes/media-understanding) -- 受信画像、音声、動画の理解
