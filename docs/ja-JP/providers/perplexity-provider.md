---
read_when:
    - Perplexityをweb search providerとして設定したい場合
    - Perplexity API keyまたはOpenRouter proxyのセットアップが必要な場合
summary: Perplexity Web Search providerのセットアップ（API key、検索モード、フィルタリング）
title: Perplexity（Provider）
x-i18n:
    generated_at: "2026-04-05T12:54:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity（Web Search Provider）

Perplexity pluginは、Perplexity
Search APIまたはOpenRouter経由のPerplexity Sonarを通じてweb search機能を提供します。

<Note>
このページではPerplexity **provider** のセットアップを扱います。Perplexity
**tool**（agentがそれをどう使うか）については、[Perplexity tool](/tools/perplexity-search) を参照してください。
</Note>

- 種別: web search provider（model providerではありません）
- Auth: `PERPLEXITY_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter経由）
- Config path: `plugins.entries.perplexity.config.webSearch.apiKey`

## クイックスタート

1. API keyを設定します:

```bash
openclaw configure --section web
```

または、直接設定します:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. 設定されていれば、agentはweb search時に自動的にPerplexityを使用します。

## 検索モード

pluginは、API keyの接頭辞に基づいてtransportを自動選択します:

| Key prefix | Transport                    | Features                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | ネイティブPerplexity Search API | 構造化結果、ドメイン/言語/日付フィルター         |
| `sk-or-`   | OpenRouter（Sonar）           | 引用付きのAI合成回答                             |

## ネイティブAPIのフィルタリング

ネイティブPerplexity API（`pplx-` key）を使う場合、検索では次をサポートします:

- **Country**: 2文字の国コード
- **Language**: ISO 639-1言語コード
- **Date range**: day、week、month、year
- **Domain filters**: allowlist/denylist（最大20ドメイン）
- **Content budget**: `max_tokens`, `max_tokens_per_page`

## 環境に関する注意

Gatewayがdaemon（launchd/systemd）として動作している場合は、
`PERPLEXITY_API_KEY` がそのprocessから利用可能であることを確認してください（たとえば
`~/.openclaw/.env` または `env.shellEnv` 経由）。
