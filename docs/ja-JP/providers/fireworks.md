---
read_when:
    - OpenClawでFireworksを使いたい
    - FireworksのAPIキー環境変数またはデフォルトmodel idが必要です
summary: Fireworksのセットアップ（認証 + モデル選択）
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai)は、OpenAI互換APIを通じてオープンウェイトモデルとルーティングモデルを公開しています。OpenClawには、組み込みのFireworks provider Pluginが含まれています。

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI互換のchat/completions                           |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Default model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## はじめに

<Steps>
  <Step title="オンボーディングでFireworks認証を設定する">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    これにより、FireworksキーがOpenClaw設定に保存され、Fire Pass starter modelがデフォルトとして設定されます。

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非対話型の例

スクリプトまたはCIのセットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | Fireworks上の最新のKimi model。Fireworks K2.6リクエストではthinkingは無効です。Kimiのthinking出力が必要な場合は、Moonshotへ直接ルーティングしてください。 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Fireworks上のデフォルト組み込みstarter model                                                                                                       |

<Tip>
Fireworksが新しいQwenやGemmaのリリースのような新しいモデルを公開した場合、組み込みカタログの更新を待たずに、そのFireworks model idを使って直接切り替えられます。
</Tip>

## カスタムFireworks model id

OpenClawは動的なFireworks model idも受け付けます。Fireworksに表示される正確なmodel idまたはrouter idを使用し、先頭に`fireworks/`を付けてください。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="model idのprefix付与の仕組み">
    OpenClaw内のすべてのFireworks model refは、`fireworks/`に続けてFireworksプラットフォーム上の正確なidまたはrouter pathを付けた形式で始まります。例:

    - Router model: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClawはAPIリクエストを構築する際に`fireworks/` prefixを取り除き、残りのpathをFireworks endpointへ送信します。

  </Accordion>

  <Accordion title="環境に関する注記">
    Gatewayが対話型shellの外で動作している場合は、`FIREWORKS_API_KEY`がそのプロセスでも利用可能であることを確認してください。

    <Warning>
    `~/.profile`のみに置かれたキーは、その環境がそこにも取り込まれていない限り、launchd/systemd daemonでは役に立ちません。gatewayプロセスが読み取れるようにするには、`~/.openclaw/.env`または`env.shellEnv`でキーを設定してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとFAQ。
  </Card>
</CardGroup>
