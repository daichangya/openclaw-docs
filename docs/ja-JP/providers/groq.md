---
read_when:
    - OpenClaw で Groq を使いたい
    - API key の env var または CLI auth choice が必要
summary: Groq のセットアップ（auth + model 選択）
title: Groq
x-i18n:
    generated_at: "2026-04-05T12:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンソースモデル
（Llama、Gemma、Mistral など）で超高速推論を提供します。OpenClaw は
OpenAI 互換 API を通じて Groq に接続します。

- Provider: `groq`
- Auth: `GROQ_API_KEY`
- API: OpenAI 互換

## クイックスタート

1. [console.groq.com/keys](https://console.groq.com/keys) から API キーを取得します。

2. API キーを設定します:

```bash
export GROQ_API_KEY="gsk_..."
```

3. デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 設定ファイルの例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 音声文字起こし

Groq は、高速な Whisper ベースの音声文字起こしも提供しています。
media-understanding provider として設定されている場合、
OpenClaw は共有の `tools.media.audio`
surface を通じて、Groq の `whisper-large-v3-turbo`
モデルを使って音声メッセージを文字起こしします。

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## 環境に関する注意

Gateway が daemon（launchd / systemd）として実行される場合は、`GROQ_API_KEY` が
そのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
`env.shellEnv` 経由）。

## 音声に関する注記

- 共有設定パス: `tools.media.audio`
- デフォルトの Groq 音声 base URL: `https://api.groq.com/openai/v1`
- デフォルトの Groq 音声モデル: `whisper-large-v3-turbo`
- Groq の音声文字起こしは、OpenAI 互換の `/audio/transcriptions`
  パスを使用します

## 利用可能なモデル

Groq のモデルカタログは頻繁に変わります。現在利用可能なモデルを確認するには `openclaw models list | grep groq`
を実行するか、
[console.groq.com/docs/models](https://console.groq.com/docs/models) を確認してください。

よく使われる選択肢には、次のものがあります。

- **Llama 3.3 70B Versatile** - 汎用、大きなコンテキスト
- **Llama 3.1 8B Instant** - 高速、軽量
- **Gemma 2 9B** - コンパクトで効率的
- **Mixtral 8x7B** - MoE アーキテクチャ、強い推論性能

## リンク

- [Groq Console](https://console.groq.com)
- [API Documentation](https://console.groq.com/docs)
- [Model List](https://console.groq.com/docs/models)
- [Pricing](https://groq.com/pricing)
