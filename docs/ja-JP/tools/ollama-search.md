---
read_when:
    - Ollama を `web_search` に使いたいとき
    - API キー不要の `web_search` プロバイダーを使いたいとき
    - Ollama Web Search のセットアップ手順が必要なとき
summary: 設定済みの Ollama ホストを使う Ollama Web Search
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T12:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw は、同梱の `web_search` プロバイダーとして **Ollama Web Search** をサポートしています。
これは Ollama の実験的な Web 検索 API を使い、タイトル、
URL、スニペットを含む構造化結果を返します。

Ollama モデルプロバイダーとは異なり、このセットアップではデフォルトで
API キーは不要です。ただし、次が必要です。

- OpenClaw から到達可能な Ollama ホスト
- `ollama signin`

## セットアップ

<Steps>
  <Step title="Ollama を起動">
    Ollama がインストールされ、実行中であることを確認してください。
  </Step>
  <Step title="サインイン">
    次を実行します:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search を選ぶ">
    次を実行します:

    ```bash
    openclaw configure --section web
    ```

    その後、プロバイダーとして **Ollama Web Search** を選択します。

  </Step>
</Steps>

すでにモデルで Ollama を使っている場合、Ollama Web Search は同じ
設定済みホストを再利用します。

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

任意の Ollama ホスト上書き:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

明示的な Ollama base URL が設定されていない場合、OpenClaw は `http://127.0.0.1:11434` を使用します。

Ollama ホストが bearer 認証を期待する場合、OpenClaw は
Web 検索リクエストにも `models.providers.ollama.apiKey`（または一致する環境変数ベースのプロバイダー認証）
を再利用します。

## メモ

- このプロバイダーには、Web 検索専用の API キーフィールドは不要です。
- Ollama ホストが認証保護されている場合、OpenClaw は通常の Ollama
  プロバイダー API キーがあればそれを再利用します。
- セットアップ中に Ollama に到達できない、またはサインインされていない場合、OpenClaw は警告を出しますが、
  選択自体はブロックしません。
- 実行時の自動検出では、より優先度の高い
  認証情報付きプロバイダーが設定されていない場合に、Ollama Web Search へフォールバックできます。
- このプロバイダーは Ollama の実験的な `/api/experimental/web_search`
  エンドポイントを使用します。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Ollama](/ja-JP/providers/ollama) -- Ollama モデルのセットアップとクラウド/ローカルモード
