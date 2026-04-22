---
read_when:
    - OpenClawでVercel AI Gatewayを使いたいです
    - API key環境変数またはCLI認証選択が必要です
summary: Vercel AI Gatewayセットアップ（認証 + モデル選択）
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:28:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway)は、単一のエンドポイントを通じて数百のモデルへアクセスできる統一APIを提供します。

| プロパティ | 値 |
| ------------- | -------------------------------- |
| プロバイダー | `vercel-ai-gateway` |
| 認証 | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages互換 |
| モデルカタログ | `/v1/models`経由で自動検出 |

<Tip>
OpenClawはGatewayの`/v1/models`カタログを自動検出するため、
`/models vercel-ai-gateway`には現在のモデル参照として
`vercel-ai-gateway/openai/gpt-5.4`や
`vercel-ai-gateway/moonshotai/kimi-k2.6`が含まれます。
</Tip>

## はじめに

<Steps>
  <Step title="API keyを設定">
    オンボーディングを実行し、AI Gateway認証オプションを選択します:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを設定">
    モデルをOpenClaw設定に追加します:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能か確認">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非対話型の例

スクリプトまたはCIセットアップでは、すべての値をコマンドラインで渡します:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## モデルID短縮形

OpenClawはVercel Claude短縮モデル参照を受け付け、実行時に正規化します:

| 短縮入力 | 正規化後のモデル参照 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
設定では、短縮形でも完全修飾モデル参照でも使用できます。OpenClawが正規形を自動で解決します。
</Tip>

## 詳細メモ

<AccordionGroup>
  <Accordion title="daemonプロセス向け環境変数">
    OpenClaw Gatewayがdaemon（launchd/systemd）として動作している場合は、
    `AI_GATEWAY_API_KEY`がそのプロセスで利用可能であることを確認してください。

    <Warning>
    `~/.profile`にだけ設定されたキーは、その環境が明示的にimportされない限り、
    launchd/systemd daemonからは見えません。Gatewayプロセスが
    読み取れるようにするには、`~/.openclaw/.env`または`env.shellEnv`でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="プロバイダールーティング">
    Vercel AI Gatewayは、モデル
    参照プレフィックスに基づいて上流プロバイダーへリクエストをルーティングします。たとえば、`vercel-ai-gateway/anthropic/claude-opus-4.6`は
    Anthropic経由へ、`vercel-ai-gateway/openai/gpt-5.4`は
    OpenAI経由へ、`vercel-ai-gateway/moonshotai/kimi-k2.6`は
    MoonshotAI経由へルーティングされます。単一の`AI_GATEWAY_API_KEY`で、すべての
    上流プロバイダーに対する認証を処理します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとFAQ。
  </Card>
</CardGroup>
