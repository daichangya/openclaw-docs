---
read_when:
    - OpenClaw で DeepSeek を使いたい場合
    - API キーの環境変数または CLI の認証オプションが必要です
summary: DeepSeek のセットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) は、OpenAI互換APIを備えた高性能なAIモデルを提供しています。

| プロパティ | 値                         |
| -------- | -------------------------- |
| プロバイダー | `deepseek`                 |
| 認証     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI互換                 |
| Base URL | `https://api.deepseek.com` |

## はじめに

<Steps>
  <Step title="API キーを取得">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) でAPI キーを作成します。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    API キーの入力を求められ、`deepseek/deepseek-v4-flash` がデフォルトモデルとして設定されます。

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話型セットアップ">
    スクリプト化されたインストールやヘッドレス環境でのインストールでは、すべてのフラグを直接渡します。

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway がデーモン（launchd/systemd）として実行される場合は、`DEEPSEEK_API_KEY`
がそのプロセスで利用可能であることを確認してください（たとえば、`~/.openclaw/.env` または
`env.shellEnv` 経由）。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力   | コンテキスト | 最大出力   | 注記                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | デフォルトモデル; V4の思考対応サーフェス |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4の思考対応サーフェス                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2の非思考サーフェス         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 推論対応のV3.2サーフェス             |

<Tip>
V4モデルはDeepSeekの`thinking`制御をサポートしています。OpenClaw は、ツール呼び出しを含む思考セッションを継続できるように、フォローアップターンでDeepSeek の`reasoning_content`も再送します。
</Tip>

## 設定例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>
