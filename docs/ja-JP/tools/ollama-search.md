---
read_when:
    - '`web_search` に Ollama を使いたい場合'
    - キー不要の `web_search` プロバイダが必要な場合
    - Ollama Web Search のセットアップガイダンスが必要な場合
summary: 設定済みの Ollama ホスト経由の Ollama Web Search
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-26T11:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw は、同梱の `web_search` プロバイダとして **Ollama Web Search** をサポートしています。これは Ollama の Web Search API を使用し、タイトル、URL、スニペットを含む構造化結果を返します。

Ollama モデルプロバイダとは異なり、このセットアップではデフォルトで API キーは不要です。ただし、次は必要です。

- OpenClaw から到達可能な Ollama ホスト
- `ollama signin`

## セットアップ

<Steps>
  <Step title="Ollama を起動する">
    Ollama がインストールされ、実行中であることを確認してください。
  </Step>
  <Step title="サインインする">
    次を実行します。

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search を選ぶ">
    次を実行します。

    ```bash
    openclaw configure --section web
    ```

    その後、プロバイダとして **Ollama Web Search** を選択します。

  </Step>
</Steps>

すでにモデルに Ollama を使用している場合、Ollama Web Search は同じ設定済みホストを再利用します。

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

Ollama ホストが bearer 認証を想定している場合、OpenClaw は
`models.providers.ollama.apiKey`（または対応する env ベースのプロバイダ認証）も Web Search リクエストに再利用します。

## 注記

- このプロバイダには Web Search 専用の API キーフィールドは不要です。
- Ollama ホストが認証保護されている場合、OpenClaw は通常の Ollama
  プロバイダ API キーを、存在すれば再利用します。
- OpenClaw は、セットアップ中に Ollama に到達できない、またはサインインされていない場合に警告しますが、選択自体はブロックしません。
- より高優先度の認証付きプロバイダが設定されていない場合、ランタイムの自動検出は Ollama Web Search にフォールバックできます。
- このプロバイダは Ollama の `/api/web_search` エンドポイントを使用します。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダと自動検出
- [Ollama](/ja-JP/providers/ollama) -- Ollama モデルのセットアップと cloud/local モード
