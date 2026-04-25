---
read_when:
    - OpenClaw で DeepSeek を使いたい場合
    - API キーの env var または CLI 認証の選択肢が必要です
summary: DeepSeek のセットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:57:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) は、OpenAI 互換 API を備えた高性能な AI モデルを提供しています。

| Property | Value                      |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 互換                |
| Base URL | `https://api.deepseek.com` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    これにより API キーの入力が求められ、デフォルトモデルとして `deepseek/deepseek-v4-flash` が設定されます。

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider deepseek
    ```

    実行中の Gateway を必要とせずに同梱の静的カタログを確認するには、次を使用します。

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話型セットアップ">
    スクリプト化またはヘッドレス環境でのインストールでは、すべてのフラグを直接渡します。

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
Gateway がデーモン（launchd/systemd）として動作する場合は、`DEEPSEEK_API_KEY`
がそのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
`env.shellEnv` 経由）。
</Warning>

## 組み込みカタログ

| Model ref                    | Name              | Input | Context   | Max output | Notes                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | デフォルトモデル。thinking 対応の V4 サーフェス |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | thinking 対応の V4 サーフェス              |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 の non-thinking サーフェス   |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | reasoning 対応の V3.2 サーフェス           |

<Tip>
V4 モデルは DeepSeek の `thinking` 制御をサポートしています。OpenClaw は、thinking セッションでツール呼び出しが継続できるよう、フォローアップターンで DeepSeek の `reasoning_content` も再送します。
</Tip>

## Thinking とツール

DeepSeek V4 の thinking セッションは、ほとんどの OpenAI 互換 provider よりも厳格な再送コントラクトを持っています。thinking が有効な assistant メッセージにツール呼び出しが含まれる場合、DeepSeek は前回の assistant の `reasoning_content` を次のリクエストで送り返すことを要求します。OpenClaw はこれを DeepSeek Plugin 内で処理するため、`deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro` では通常の複数ターンのツール利用が機能します。

既存セッションを別の OpenAI 互換 provider から DeepSeek V4 モデルへ切り替えると、古い assistant のツール呼び出しターンにはネイティブな DeepSeek `reasoning_content` がない場合があります。OpenClaw は、DeepSeek V4 の thinking リクエストに対してその不足フィールドを補うため、provider は `/new` を要求せずに再送されたツール呼び出し履歴を受け入れられます。

OpenClaw で thinking が無効な場合（UI の **None** 選択を含む）、OpenClaw は DeepSeek に `thinking: { type: "disabled" }` を送信し、送信履歴から再送された `reasoning_content` を除去します。これにより、thinking 無効セッションは DeepSeek の non-thinking パスに保たれます。

デフォルトの高速パスには `deepseek/deepseek-v4-flash` を使用してください。より強力な V4 モデルが必要で、より高いコストまたはレイテンシを許容できる場合は `deepseek/deepseek-v4-pro` を使用してください。

## ライブテスト

直接ライブモデルスイートには、最新モデルセットとして DeepSeek V4 が含まれています。DeepSeek V4 の直接モデルチェックだけを実行するには、次を使います。

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

このライブチェックでは、両方の V4 モデルが完了できることと、thinking/ツールのフォローアップターンが DeepSeek に必要な再送ペイロードを保持していることを検証します。

## config の例

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
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agents、models、providers の完全な config リファレンス。
  </Card>
</CardGroup>
