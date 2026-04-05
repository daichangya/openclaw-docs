---
read_when:
    - OpenClaw で Mistral モデルを使いたい
    - Mistral API key のオンボーディングと model ref が必要
summary: OpenClaw で Mistral モデルと Voxtral 文字起こしを使う
title: Mistral
x-i18n:
    generated_at: "2026-04-05T12:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw は、テキスト / 画像モデルルーティング（`mistral/...`）と、
media understanding における Voxtral 経由の音声文字起こしの両方で Mistral をサポートしています。
Mistral は memory embeddings（`memorySearch.provider = "mistral"`）にも使用できます。

## CLI セットアップ

```bash
openclaw onboard --auth-choice mistral-api-key
# または非対話
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## 設定スニペット（LLM provider）

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## 組み込み LLM カタログ

OpenClaw は現在、次のバンドル済み Mistral カタログを同梱しています。

| Model ref                        | Input       | Context | Max output | Notes |
| -------------------------------- | ----------- | ------- | ---------- | ----- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | デフォルトモデル |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1 |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | 小型のマルチモーダルモデル |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Coding |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2 |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | reasoning 対応 |

## 設定スニペット（Voxtral による音声文字起こし）

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

## 注意

- Mistral auth は `MISTRAL_API_KEY` を使います。
- Provider base URL のデフォルトは `https://api.mistral.ai/v1` です。
- Onboarding のデフォルトモデルは `mistral/mistral-large-latest` です。
- Mistral の media-understanding デフォルト音声モデルは `voxtral-mini-latest` です。
- Media transcription パスは `/v1/audio/transcriptions` を使用します。
- Memory embeddings パスは `/v1/embeddings` を使用します（デフォルトモデル: `mistral-embed`）。
