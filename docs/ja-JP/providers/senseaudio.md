---
read_when:
    - 音声添付ファイル向けに SenseAudio の speech-to-text を使いたい場合
    - SenseAudio API キーの env var または音声 config パスが必要です
summary: 受信ボイスノート向けの SenseAudio バッチ speech-to-text
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio は、OpenClaw の共有 `tools.media.audio` パイプラインを通じて、受信した音声/ボイスノート添付ファイルを文字起こしできます。OpenClaw は OpenAI 互換の transcription エンドポイントにマルチパート音声を POST し、返されたテキストを `{{Transcript}}` と `[Audio]` ブロックとして注入します。

| Detail        | Value                                            |
| ------------- | ------------------------------------------------ |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Docs          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Auth          | `SENSEAUDIO_API_KEY`                             |
| Default model | `senseaudio-asr-pro-1.5-260319`                  |
| Default URL   | `https://api.senseaudio.cn/v1`                   |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="音声 provider を有効にする">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ボイスノートを送信する">
    接続済みの任意の channel から音声メッセージを送信してください。OpenClaw は
    音声を SenseAudio にアップロードし、その transcript を返信パイプラインで使用します。
  </Step>
</Steps>

## オプション

| Option     | Path                                  | Description                    |
| ---------- | ------------------------------------- | ------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR model id        |
| `language` | `tools.media.audio.models[].language` | 任意の言語ヒント               |
| `prompt`   | `tools.media.audio.prompt`            | 任意の文字起こしプロンプト     |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | OpenAI 互換 base の上書き      |
| `headers`  | `tools.media.audio.request.headers`   | 追加のリクエストヘッダー       |

<Note>
SenseAudio は OpenClaw ではバッチ STT のみです。Voice Call のリアルタイム文字起こしは、引き続きストリーミング STT をサポートする provider を使用します。
</Note>
