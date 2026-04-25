---
read_when:
    - text-to-speech に Gradium を使いたい場合
    - Gradium API キーまたは音声設定が必要です
summary: OpenClaw で Gradium の text-to-speech を使う
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium は OpenClaw に同梱されている text-to-speech provider です。通常の音声返信、ボイスノート互換の Opus 出力、そして電話向けサーフェス用の 8 kHz u-law 音声を生成できます。

## セットアップ

Gradium API キーを作成し、それを OpenClaw から参照できるようにします。

```bash
export GRADIUM_API_KEY="gsk_..."
```

キーは `messages.tts.providers.gradium.apiKey` の下に config として保存することもできます。

## config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## 音声

| Name      | Voice ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

デフォルト音声: Emma。

## 出力

- 音声ファイル返信には WAV を使います。
- ボイスノート返信には Opus を使い、voice 互換としてマークされます。
- 電話向け合成では 8 kHz の `ulaw_8000` を使います。

## 関連

- [Text-to-Speech](/ja-JP/tools/tts)
- [Media Overview](/ja-JP/tools/media-overview)
