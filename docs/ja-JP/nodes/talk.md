---
read_when:
    - macOS/iOS/AndroidでTalk modeを実装している
    - voice/TTS/interrupt動作を変更している
summary: 'Talk mode: ElevenLabs TTSによる連続音声会話'
title: Talk Mode
x-i18n:
    generated_at: "2026-04-05T12:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Talk Mode

Talk modeは連続音声会話ループです。

1. 音声を聞き取る
2. transcriptをmodelへ送る（main session、chat.send）
3. 応答を待つ
4. 設定されたTalk provider（`talk.speak`）で読み上げる

## 動作（macOS）

- Talk modeが有効な間は**常時表示オーバーレイ**。
- **Listening → Thinking → Speaking** のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在のtranscriptが送信されます。
- 返信は**WebChatに書き込まれます**（入力して送る場合と同じ）。
- **音声による割り込み**（デフォルトでオン）: assistantが話している間にユーザーが話し始めると、再生を停止し、次のプロンプトのために割り込みタイムスタンプを記録します。

## 返信内のvoice directive

assistantは、voiceを制御するために返信の先頭へ**1行のJSON**を付けることがあります。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の非空行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。
- `once` がない場合、そのvoiceはTalk modeの新しいデフォルトになります。
- JSON行はTTS再生前に取り除かれます。

サポートされるキー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

デフォルト値:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時、Talkはtranscript送信前のプラットフォームごとのデフォルト一時停止ウィンドウを維持します（macOSとAndroidでは `700 ms`、iOSでは `900 ms`）
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` へフォールバックします（またはAPI keyが利用可能な場合は最初のElevenLabs voice）
- `modelId`: 未設定時は `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY` へフォールバックします（または利用可能ならgateway shell profile）
- `outputFormat`: macOS/iOSでは `pcm_44100`、Androidでは `pcm_24000` がデフォルトです（MP3 streamingを強制するには `mp3_*` を設定してください）

## macOS UI

- メニューバートグル: **Talk**
- Configタブ: **Talk Mode** グループ（voice id + interruptトグル）
- オーバーレイ:
  - **Listening**: mic levelに応じてcloudが脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状のリング
  - cloudをクリック: 読み上げ停止
  - Xをクリック: Talk modeを終了

## 注意

- Speech + Microphone権限が必要です。
- session key `main` に対して `chat.send` を使います。
- Gatewayは、アクティブなTalk providerを使って `talk.speak` 経由でTalk再生を解決します。Androidでは、そのRPCが利用できない場合のみローカルsystem TTSへフォールバックします。
- `eleven_v3` の `stability` は `0.0`、`0.5`、`1.0` に検証されます。他のmodelでは `0..1` を受け入れます。
- `latency_tier` は設定時に `0..4` として検証されます。
- Androidは、低遅延のAudioTrack streaming向けに `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` のoutput formatをサポートします。
