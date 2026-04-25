---
read_when:
    - メディア機能の概要を探している場合
    - どのメディア provider を設定するか決める შემთხვევაში
    - 非同期メディア生成の仕組みを理解する иқәanalysis to=final code=None Translate from English to Japanese only. Need output translated text only. Preserve product names etc. "speech" maybe keep? translate prose all Japanese. "Media overview" heading can be Japanese. Let's craft.
summary: メディア生成、理解、および speech 機能の統合ランディングページ
title: メディア概要
x-i18n:
    generated_at: "2026-04-25T14:00:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# メディア生成と理解

OpenClaw は、画像、動画、音楽を生成し、受信メディア（画像、音声、動画）を理解し、text-to-speech で返信を音声として読み上げます。すべてのメディア機能はツール駆動です。エージェントは会話に基づいてそれらをいつ使うかを判断し、各ツールは、少なくとも 1 つの対応 provider が設定されている場合にのみ表示されます。

## 機能の一覧

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 画像生成             | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | テキストプロンプトまたは参照から画像を作成または編集する |
| 動画生成             | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | テキスト、画像、または既存動画から動画を作成する         |
| 音楽生成             | `music_generate` | ComfyUI, Google, MiniMax                                                                     | テキストプロンプトから音楽または音声トラックを作成する   |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo  | 送信する返信を音声へ変換する                             |
| メディア理解         | （自動）         | 任意の vision/audio 対応モデル provider に加え、CLI フォールバック                            | 受信した画像、音声、動画を要約する                       |

## Provider 機能マトリクス

この表は、プラットフォーム全体で各 provider がどのメディア機能をサポートするかを示します。

| Provider    | Image | Video | Music | TTS | STT / 文字起こし | Realtime Voice | メディア理解 |
| ----------- | ----- | ----- | ----- | --- | ---------------- | -------------- | ------------ |
| Alibaba     |       | Yes   |       |     |                  |                |              |
| BytePlus    |       | Yes   |       |     |                  |                |              |
| ComfyUI     | Yes   | Yes   | Yes   |     |                  |                |              |
| Deepgram    |       |       |       |     | Yes              | Yes            |              |
| ElevenLabs  |       |       |       | Yes | Yes              |                |              |
| fal         | Yes   | Yes   |       |     |                  |                |              |
| Google      | Yes   | Yes   | Yes   | Yes |                  | Yes            | Yes          |
| Gradium     |       |       |       | Yes |                  |                |              |
| Local CLI   |       |       |       | Yes |                  |                |              |
| Microsoft   |       |       |       | Yes |                  |                |              |
| MiniMax     | Yes   | Yes   | Yes   | Yes |                  |                |              |
| Mistral     |       |       |       |     | Yes              |                |              |
| OpenAI      | Yes   | Yes   |       | Yes | Yes              | Yes            | Yes          |
| Qwen        |       | Yes   |       |     |                  |                |              |
| Runway      |       | Yes   |       |     |                  |                |              |
| SenseAudio  |       |       |       |     | Yes              |                |              |
| Together    |       | Yes   |       |     |                  |                |              |
| Vydra       | Yes   | Yes   |       | Yes |                  |                |              |
| xAI         | Yes   | Yes   |       | Yes | Yes              |                | Yes          |
| Xiaomi MiMo | Yes   |       |       | Yes |                  |                | Yes          |

<Note>
メディア理解では、provider config に登録された任意の vision 対応または audio 対応モデルを使用します。上の表では、専用のメディア理解サポートを持つ provider を強調しています。multimodal モデルを持つ多くの LLM provider（Anthropic、Google、OpenAI など）も、アクティブな返信モデルとして設定されていれば受信メディアを理解できます。
</Note>

## 非同期生成の仕組み

動画生成と音楽生成は、provider の処理に通常 30 秒から数分かかるため、バックグラウンドタスクとして実行されます。エージェントが `video_generate` または `music_generate` を呼び出すと、OpenClaw は request を provider に送信し、すぐに task ID を返し、その job を task ledger で追跡します。job の実行中もエージェントは他のメッセージへの応答を続けます。provider が完了すると、OpenClaw はエージェントを起こし、完成したメディアを元の channel へ投稿できるようにします。画像生成と TTS は同期的で、返信と同時に完了します。

Deepgram、ElevenLabs、Mistral、OpenAI、SenseAudio、および xAI は、設定されていれば、バッチ `tools.media.audio` 経路を通じて受信音声を文字起こしできます。  
Deepgram、ElevenLabs、Mistral、OpenAI、および xAI は、Voice Call 向けの
ストリーミング STT provider も登録するため、完了した録音を待たずに、
ライブの電話音声を選択した vendor に転送できます。

Google は、OpenClaw の画像、動画、音楽、バッチ TTS、バックエンド realtime
voice、およびメディア理解 surface に対応します。OpenAI は、OpenClaw の画像、
動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンド realtime voice、
および memory embedding surface に対応します。xAI は現在、OpenClaw の画像、動画、
search、code-execution、バッチ TTS、バッチ STT、および Voice Call ストリーミング STT
surface に対応します。xAI Realtime voice は upstream の機能ですが、それを表現できる共有 realtime voice contract が整うまでは、OpenClaw では登録されません。

## クイックリンク

- [Image Generation](/ja-JP/tools/image-generation) -- 画像の生成と編集
- [Video Generation](/ja-JP/tools/video-generation) -- text-to-video、image-to-video、video-to-video
- [Music Generation](/ja-JP/tools/music-generation) -- 音楽と音声トラックの作成
- [Text-to-Speech](/ja-JP/tools/tts) -- 返信を音声へ変換
- [Media Understanding](/ja-JP/nodes/media-understanding) -- 受信した画像、音声、動画を理解する

## 関連

- [Image generation](/ja-JP/tools/image-generation)
- [Video generation](/ja-JP/tools/video-generation)
- [Music generation](/ja-JP/tools/music-generation)
- [Text-to-speech](/ja-JP/tools/tts)
