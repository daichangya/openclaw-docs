---
read_when:
    - OpenClaw のメディア機能の概要をお探しの場合
    - どのメディア provider を設定するかを決める場合
    - 非同期メディア生成がどのように動作するかを理解する შემთხვევაში
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、および media-understanding 機能の概要
title: メディア概要
x-i18n:
    generated_at: "2026-04-26T11:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw は画像、動画、音楽を生成し、受信メディア（画像、音声、動画）を理解し、text-to-speech で返信を音声として読み上げます。すべてのメディア機能は tool 駆動です。agent が会話に基づいていつ使うかを判断し、各 tool は少なくとも 1 つのバックエンド provider が設定されている場合にのみ表示されます。

## 機能

<CardGroup cols={2}>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    `image_generate` により、テキスト prompt や参照画像から画像を作成・編集します。同期式 — 返信内でそのまま完了します。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` による text-to-video、image-to-video、video-to-video。非同期 — バックグラウンドで実行され、準備完了時に結果を投稿します。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` により音楽または音声トラックを生成します。共有 provider では非同期、ComfyUI ワークフローパスでは同期式です。
  </Card>
  <Card title="Text-to-speech" href="/ja-JP/tools/tts" icon="microphone">
    `tts` tool と `messages.tts` config により、送信返信を音声に変換します。同期式です。
  </Card>
  <Card title="Media understanding" href="/ja-JP/nodes/media-understanding" icon="eye">
    vision 対応 model provider と専用 media-understanding Plugin を使って、受信した画像、音声、動画を要約します。
  </Card>
  <Card title="Speech-to-text" href="/ja-JP/nodes/audio" icon="ear-listen">
    batch STT または Voice Call の streaming STT provider を通じて、受信音声メッセージを文字起こしします。
  </Card>
</CardGroup>

## Provider 機能マトリクス

| Provider | Image | Video | Music | TTS | STT | Realtime voice | Media understanding |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| Local CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
Media understanding は、provider config に登録された vision 対応または audio 対応 model を使用します。上記マトリクスには専用の media-understanding 対応を持つ provider を記載していますが、ほとんどのマルチモーダル LLM provider（Anthropic、Google、OpenAI など）も、アクティブ reply model として設定されていれば受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能 | モード | 理由 |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 画像 | 同期 | provider の応答は数秒で返るため、返信内でそのまま完了します。 |
| Text-to-speech | 同期 | provider の応答は数秒で返るため、返信音声に添付されます。 |
| 動画 | 非同期 | provider の処理に 30 秒から数分かかります。 |
| 音楽（共有） | 非同期 | 動画と同じ provider 処理特性です。 |
| 音楽（ComfyUI） | 同期 | ローカルワークフローが設定済み ComfyUI サーバーに対してインライン実行されます。 |

非同期 tool では、OpenClaw は provider にリクエストを送信し、すぐに task id を返し、そのジョブを task ledger で追跡します。agent はジョブ実行中でも他のメッセージへの応答を続けます。provider が完了すると、OpenClaw は agent を wake し、完成したメディアを元のチャネルへ投稿できるようにします。

## Speech-to-text と Voice Call

Deepgram、ElevenLabs、Mistral、OpenAI、SenseAudio、xAI は、設定されていれば batch `tools.media.audio` パスを通じて受信音声を文字起こしできます。mention ゲーティングやコマンド解析のために voice note を事前処理する channel Plugin は、文字起こし済み添付を受信コンテキスト上にマークするため、共有 media-understanding パスは同じ音声に対して 2 回目の STT 呼び出しを行わず、その transcript を再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call の streaming STT provider も登録するため、ライブ電話音声を、録音完了を待たずに選択した vendor へ転送できます。

## Provider マッピング（vendor がサーフェスごとにどう分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、batch TTS、バックエンド realtime voice、および media-understanding サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、batch TTS、batch STT、Voice Call streaming STT、バックエンド realtime voice、および memory embedding サーフェス。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、code execution、batch TTS、batch STT、および Voice Call streaming STT。xAI Realtime voice は上流の機能として存在しますが、共有 realtime-voice 契約で表現できるようになるまでは OpenClaw には登録されません。
  </Accordion>
</AccordionGroup>

## 関連

- [Image generation](/ja-JP/tools/image-generation)
- [Video generation](/ja-JP/tools/video-generation)
- [Music generation](/ja-JP/tools/music-generation)
- [Text-to-speech](/ja-JP/tools/tts)
- [Media understanding](/ja-JP/nodes/media-understanding)
- [Audio nodes](/ja-JP/nodes/audio)
