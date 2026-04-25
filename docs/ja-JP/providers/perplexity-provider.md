---
read_when:
    - Perplexity を Web 検索プロバイダーとして設定したい場合
    - Perplexity API キーまたは OpenRouter プロキシ設定が必要です
summary: Perplexity web search provider のセットアップ（API キー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Perplexity プラグインは、Perplexity
Search API または OpenRouter 経由の Perplexity Sonar を通じて Web 検索機能を提供します。

<Note>
このページでは Perplexity **provider** のセットアップを扱います。Perplexity
**tool**（エージェントがこれをどのように使うか）については、[Perplexity tool](/ja-JP/tools/perplexity-search) を参照してください。
</Note>

| プロパティ | 値 |
| ----------- | ---------------------------------------------------------------------- |
| タイプ | Web 検索プロバイダー（モデルプロバイダーではありません） |
| 認証 | `PERPLEXITY_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter 経由） |
| 設定パス | `plugins.entries.perplexity.config.webSearch.apiKey` |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話型の Web 検索設定フローを実行します。

    ```bash
    openclaw configure --section web
    ```

    または、キーを直接設定します。

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="検索を開始する">
    キーが設定されると、エージェントは自動的に Perplexity を Web 検索に使用します。
    追加の手順は不要です。
  </Step>
</Steps>

## 検索モード

このプラグインは、API キーの接頭辞に基づいて転送方式を自動選択します。

<Tabs>
  <Tab title="ネイティブ Perplexity API (pplx-)">
    キーが `pplx-` で始まる場合、OpenClaw はネイティブの Perplexity Search
    API を使用します。この転送方式は構造化された結果を返し、ドメイン、言語、
    日付フィルタリングをサポートします（以下のフィルタリングオプションを参照）。
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    キーが `sk-or-` で始まる場合、OpenClaw は OpenRouter 経由で
    Perplexity Sonar モデルを使ってルーティングします。この転送方式は
    引用付きの AI 合成回答を返します。
  </Tab>
</Tabs>

| キー接頭辞 | 転送方式 | 機能 |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | ネイティブ Perplexity Search API | 構造化結果、ドメイン/言語/日付フィルター |
| `sk-or-`   | OpenRouter (Sonar)           | 引用付きの AI 合成回答 |

## ネイティブ API のフィルタリング

<Note>
フィルタリングオプションは、ネイティブ Perplexity API
（`pplx-` キー）を使用している場合にのみ利用できます。OpenRouter/Sonar 検索はこれらのパラメータをサポートしません。
</Note>

ネイティブ Perplexity API を使用する場合、検索は次のフィルターをサポートします。

| フィルター | 説明 | 例 |
| -------------- | -------------------------------------- | ----------------------------------- |
| 国 | 2 文字の国コード | `us`, `de`, `jp` |
| 言語 | ISO 639-1 言語コード | `en`, `fr`, `zh` |
| 日付範囲 | 新しさの期間 | `day`, `week`, `month`, `year` |
| ドメインフィルター | allowlist または denylist（最大 20 ドメイン） | `example.com` |
| コンテンツ予算 | 応答ごと / ページごとのトークン上限 | `max_tokens`, `max_tokens_per_page` |

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    OpenClaw Gateway がデーモン（launchd/systemd）として実行される場合は、
    `PERPLEXITY_API_KEY` がそのプロセスから利用できることを確認してください。

    <Warning>
    `~/.profile` にのみ設定されたキーは、その環境が明示的に取り込まれない限り、
    launchd/systemd デーモンからは見えません。gateway プロセスが確実に
    読み取れるように、キーは `~/.openclaw/.env` または `env.shellEnv` で
    設定してください。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter プロキシ設定">
    Perplexity 検索を OpenRouter 経由でルーティングしたい場合は、
    ネイティブ Perplexity キーの代わりに `OPENROUTER_API_KEY`（接頭辞 `sk-or-`）
    を設定してください。OpenClaw は接頭辞を検出して、自動的に Sonar 転送方式へ
    切り替えます。

    <Tip>
    OpenRouter 転送方式は、すでに OpenRouter アカウントを持っていて、
    複数のプロバイダーにまたがる請求を一元化したい場合に便利です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/ja-JP/tools/perplexity-search" icon="magnifying-glass">
    エージェントがどのように Perplexity 検索を呼び出し、結果を解釈するか。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プラグインエントリを含む完全な設定リファレンス。
  </Card>
</CardGroup>
