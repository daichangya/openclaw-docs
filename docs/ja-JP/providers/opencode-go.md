---
read_when:
    - OpenCode Go カタログを使いたい場合
    - Go ホスト型モデルのランタイム model ref が必要です
summary: 共有の OpenCode セットアップで OpenCode Go カタログを使う
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go は、[OpenCode](/ja-JP/providers/opencode) 内の Go カタログです。
Zen カタログと同じ `OPENCODE_API_KEY` を使用しますが、上流のモデル単位ルーティングが正しく保たれるよう、ランタイム provider id は `opencode-go` のままです。

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Runtime provider | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Parent setup     | [OpenCode](/ja-JP/providers/opencode) |

## 組み込みカタログ

OpenClaw は、Go カタログを同梱の pi モデルレジストリから取得します。現在のモデル一覧は `openclaw models list --provider opencode-go` を実行して確認してください。

同梱の pi カタログ時点では、この provider には次が含まれます。

| Model ref                  | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (3x 制限)   |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## はじめに

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="キーを直接渡す">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## config の例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="ルーティング動作">
    model ref が `opencode-go/...` を使っていれば、OpenClaw はモデル単位のルーティングを自動処理します。追加の provider config は不要です。
  </Accordion>

  <Accordion title="ランタイム ref 規約">
    ランタイム ref は明示的なままです。Zen には `opencode/...`、Go には `opencode-go/...` を使います。
    これにより、両カタログ間で上流のモデル単位ルーティングが正しく保たれます。
  </Accordion>

  <Accordion title="共有認証情報">
    Zen と Go の両カタログで同じ `OPENCODE_API_KEY` を使用します。セットアップ中にキーを入力すると、両方のランタイム provider 用の認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディングの概要と Zen + Go の完全なカタログリファレンスについては、[OpenCode](/ja-JP/providers/opencode) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="OpenCode（親）" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログ概要、高度な注記。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
</CardGroup>
