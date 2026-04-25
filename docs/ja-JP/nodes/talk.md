---
read_when:
    - macOS/iOS/AndroidでTalkモードを実装すること
    - 音声/TTS/割り込み動作を変更すること
summary: 'Talkモード: 設定されたTTS providerを使った継続的な音声会話'
title: Talkモード
x-i18n:
    generated_at: "2026-04-25T13:51:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Talkモードは、継続的な音声会話ループです。

1. 音声を聞き取る
2. transcriptをモデルへ送信する（main session、`chat.send`）
3. 応答を待つ
4. 設定されたTalk provider（`talk.speak`）でそれを読み上げる

## 動作（macOS）

- Talkモードが有効な間は**常時表示オーバーレイ**。
- **Listening → Thinking → Speaking**のフェーズ遷移。
- **短いポーズ**（無音ウィンドウ）で、現在のtranscriptが送信されます。
- 返信は**WebChatに書き込まれます**（入力した場合と同じ）。
- **音声による割り込み**（デフォルトで有効）: assistantが話している間にユーザーが話し始めると、再生を停止し、次のprompt用に割り込みタイムスタンプを記録します。

## 返信内の音声ディレクティブ

assistantは、音声制御のために返信の先頭へ**1行のJSON**を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true`は現在の返信にのみ適用されます。
- `once`がない場合、そのvoiceはTalkモードの新しいデフォルトになります。
- JSON行はTTS再生前に取り除かれます。

サポートされるキー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時、Talkはtranscript送信前のプラットフォーム既定の無音待機時間を維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）
- `provider`: アクティブなTalk providerを選択します。macOSローカル再生経路には`elevenlabs`、`mlx`、または`system`を使用します。
- `providers.<provider>.voiceId`: ElevenLabsでは`ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`にフォールバックします（またはAPIキーが利用可能な場合は最初のElevenLabs voice）。
- `providers.elevenlabs.modelId`: 未設定時のデフォルトは`eleven_v3`です。
- `providers.mlx.modelId`: 未設定時のデフォルトは`mlx-community/Soprano-80M-bf16`です。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY`にフォールバックします（または利用可能ならgateway shell profile）。
- `outputFormat`: macOS/iOSではデフォルトで`pcm_44100`、Androidでは`pcm_24000`です（MP3ストリーミングを強制するには`mp3_*`を設定）。

## macOS UI

- メニューバートグル: **Talk**
- Configタブ: **Talk Mode**グループ（voice id + 割り込みトグル）
- オーバーレイ:
  - **Listening**: マイクレベルに応じてクラウドが脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状リング
  - クラウドをクリック: 読み上げ停止
  - Xをクリック: Talkモード終了

## 注意

- Speech + Microphone権限が必要です。
- セッションキー`main`に対して`chat.send`を使用します。
- gatewayは、アクティブなTalk providerを使って`talk.speak`経由でTalk再生を解決します。Androidでは、そのRPCが利用できない場合にのみローカルsystem TTSへフォールバックします。
- macOSのローカルMLX再生は、存在する場合は同梱の`openclaw-mlx-tts` helper、なければ`PATH`上の実行ファイルを使用します。開発中にカスタムhelper binaryを指すには、`OPENCLAW_MLX_TTS_BIN`を設定してください。
- `eleven_v3`の`stability`は`0.0`、`0.5`、`1.0`に検証されます。他のモデルは`0..1`を受け付けます。
- `latency_tier`は、設定時に`0..4`へ検証されます。
- Androidは、低遅延AudioTrackストリーミング用に`pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100`出力形式をサポートします。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [Audio and voice notes](/ja-JP/nodes/audio)
- [Media understanding](/ja-JP/nodes/media-understanding)
