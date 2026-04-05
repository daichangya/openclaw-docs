---
read_when:
    - 多くの LLM に対して 1 つの API キーを使いたい場合
    - OpenClaw で OpenRouter 経由のモデルを実行したい場合
summary: OpenClaw で OpenRouter の統合 API を使って多くのモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T12:54:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter は、単一の endpoint と API キーの背後で、多数のモデルにリクエストをルーティングする **統合 API** を提供します。OpenAI 互換なので、ほとんどの OpenAI SDK は base URL を切り替えるだけで利用できます。

## CLI セットアップ

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## config スニペット

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 注意

- model ref は `openrouter/<provider>/<model>` です。
- オンボーディングではデフォルトで `openrouter/auto` が設定されます。後で
  `openclaw models set openrouter/<provider>/<model>` を使って具体的なモデルに切り替えてください。
- より多くの model / provider オプションについては [/concepts/model-providers](/concepts/model-providers) を参照してください。
- OpenRouter は内部的に API キーを使った Bearer token を使用します。
- 実際の OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は
  OpenRouter のドキュメントにある app attribution header も追加します:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw`, および
  `X-OpenRouter-Categories: cli-agent`。
- 検証済み OpenRouter route では、Anthropic model ref は引き続き
  OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。これは、
  OpenClaw が system / developer prompt ブロックでより良い prompt cache 再利用のために使うものです。
- OpenRouter provider を別の proxy / base URL に向け直した場合、OpenClaw は
  それらの OpenRouter 固有 header や Anthropic cache marker を注入しません。
- OpenRouter は引き続き proxy スタイルの OpenAI 互換パスを通るため、
  `serviceTier`、Responses の `store`、
  OpenAI reasoning 互換ペイロード、prompt cache ヒントなどの
  ネイティブ OpenAI 専用リクエスト整形は転送されません。
- Gemini ベースの OpenRouter ref は、proxy-Gemini パス上に留まります:
  OpenClaw はそこで Gemini thought-signature のサニタイズを維持しますが、
  ネイティブ Gemini の再生検証や bootstrap 書き換えは有効にしません。
- サポートされる `auto` 以外の route では、OpenClaw は選択された thinking level を
  OpenRouter proxy reasoning ペイロードにマッピングします。未対応モデルのヒントと
  `openrouter/auto` では、その reasoning 注入はスキップされます。
- model params で OpenRouter provider routing を渡した場合、OpenClaw は
  共通 stream wrapper が動作する前に、それを OpenRouter routing metadata として転送します。
