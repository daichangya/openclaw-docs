---
read_when:
    - 多くのLLMに対して単一のAPIキーを使いたい場合
    - OpenClawでKilo Gateway経由でモデルを実行したい場合
summary: Kilo Gatewayの統合APIを使って、OpenClawで多数のモデルにアクセスする
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T12:53:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gatewayは、単一の
エンドポイントとAPIキーの背後で多くのモデルにリクエストをルーティングする**統合API**を提供します。これはOpenAI互換なので、ほとんどのOpenAI SDKはbase URLを切り替えるだけで動作します。

## APIキーの取得

1. [app.kilo.ai](https://app.kilo.ai) にアクセスします
2. サインインするか、アカウントを作成します
3. API Keys に移動して新しいキーを生成します

## CLIセットアップ

```bash
openclaw onboard --auth-choice kilocode-api-key
```

または、環境変数を設定します:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## 設定スニペット

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## デフォルトモデル

デフォルトモデルは `kilocode/kilo/auto` です。これはKilo Gatewayによって管理される、プロバイダー所有のスマートルーティング
モデルです。

OpenClawは `kilocode/kilo/auto` を安定したデフォルト参照として扱いますが、
このルートに対するソース裏付けのあるタスクからupstream modelへのマッピングは公開しません。

## 利用可能なモデル

OpenClawは起動時にKilo Gatewayから利用可能なモデルを動的に検出します。アカウントで利用可能なモデルの完全な一覧を見るには
`/models kilocode` を使用してください。

gatewayで利用可能な任意のモデルは、`kilocode/` プレフィックスを付けて使用できます:

```
kilocode/kilo/auto              (default - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...and many more
```

## 注記

- モデル参照は `kilocode/<model-id>` です（例: `kilocode/anthropic/claude-sonnet-4`）。
- デフォルトモデル: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- バンドルされたフォールバックcatalogには、常に `kilocode/kilo/auto`（`Kilo Auto`）が含まれ、
  `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、
  `maxTokens: 128000` が設定されています
- 起動時に、OpenClawは `GET https://api.kilo.ai/api/gateway/models` を試し、
  検出されたモデルを静的フォールバックcatalogより前にマージします
- `kilocode/kilo/auto` の背後にある正確なupstream routingは、OpenClawにハードコードされているのではなく、
  Kilo Gatewayが所有します
- Kilo Gatewayはソース上でOpenRouter互換として文書化されているため、
  ネイティブOpenAIリクエスト整形ではなく、プロキシ型のOpenAI互換経路にとどまります
- GeminiベースのKilo参照は引き続きproxy-Gemini経路上にあるため、OpenClawは
  ネイティブGemini replay検証やbootstrap rewriteを有効にせず、
  そこでGemini thought-signature sanitationを維持します。
- Kiloの共有stream wrapperは、provider app headerを追加し、
  サポートされる具体的なモデル参照向けにproxy reasoning payloadを正規化します。`kilocode/kilo/auto`
  や、その他のproxy reasoning非対応ヒントでは、そのreasoning注入をスキップします。
- その他のモデル/プロバイダーオプションについては、[/concepts/model-providers](/concepts/model-providers) を参照してください。
- Kilo Gatewayは内部的に、APIキーを使ったBearer tokenを使用します。
