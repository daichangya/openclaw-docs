---
read_when:
    - OpenCode Goカタログが必要です
    - Goホスト型モデル向けの実行時モデル参照が必要です
summary: 共有のOpenCodeセットアップでOpenCode Goカタログを使用します
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Goは[OpenCode](/ja-JP/providers/opencode)内のGoカタログです。
Zenカタログと同じ`OPENCODE_API_KEY`を使用しますが、上流のモデルごとのルーティングを正しく保つため、
実行時プロバイダーIDは`opencode-go`のままです。

| プロパティ | 値 |
| ---------------- | ------------------------------- |
| 実行時プロバイダー | `opencode-go` |
| 認証 | `OPENCODE_API_KEY` |
| 親セットアップ | [OpenCode](/ja-JP/providers/opencode) |

## サポートされるモデル

OpenClawは、バンドルされたpiモデルregistryからGoカタログを取得します。現在のモデル一覧は
`openclaw models list --provider opencode-go`で確認してください。

バンドルされたpiカタログ時点では、このプロバイダーに次が含まれます。

| モデル参照 | 名前 |
| -------------------------- | --------------------- |
| `opencode-go/glm-5` | GLM-5 |
| `opencode-go/glm-5.1` | GLM-5.1 |
| `opencode-go/kimi-k2.5` | Kimi K2.5 |
| `opencode-go/kimi-k2.6` | Kimi K2.6 (3x limits) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni |
| `opencode-go/mimo-v2-pro` | MiMo V2 Pro |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |
| `opencode-go/minimax-m2.7` | MiniMax M2.7 |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus |

## はじめに

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Goモデルをデフォルトに設定">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
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
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 設定例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 詳細メモ

<AccordionGroup>
  <Accordion title="ルーティング動作">
    モデル参照が`opencode-go/...`を使っている場合、OpenClawはモデルごとのルーティングを自動で処理します。
    追加のプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="実行時参照の慣例">
    実行時参照は明示的なままです: Zenは`opencode/...`、Goは`opencode-go/...`。
    これにより、両カタログ間で上流のモデルごとのルーティングを正しく保てます。
  </Accordion>

  <Accordion title="共有認証情報">
    同じ`OPENCODE_API_KEY`がZenカタログとGoカタログの両方で使われます。セットアップ中に
    キーを入力すると、両方の実行時プロバイダー向け認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディング概要と完全な
Zen + Goカタログリファレンスについては[OpenCode](/ja-JP/providers/opencode)を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログ概要、詳細メモ。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>
