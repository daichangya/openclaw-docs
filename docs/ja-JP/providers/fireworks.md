---
read_when:
    - OpenClaw で Fireworks を使いたい
    - Fireworks API key の env var またはデフォルト model id が必要
summary: Fireworks のセットアップ（auth + model 選択）
x-i18n:
    generated_at: "2026-04-05T12:53:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) は、OpenAI 互換 API を通じて open-weight モデルとルーティングされたモデルを公開します。OpenClaw には現在、バンドルされた Fireworks provider plugin が含まれています。

- Provider: `fireworks`
- Auth: `FIREWORKS_API_KEY`
- API: OpenAI 互換の chat/completions
- Base URL: `https://api.fireworks.ai/inference/v1`
- デフォルトモデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## クイックスタート

オンボーディングを通じて Fireworks auth を設定します。

```bash
openclaw onboard --auth-choice fireworks-api-key
```

これにより、Fireworks キーが OpenClaw config に保存され、Fire Pass のスターターモデルがデフォルトとして設定されます。

## 非対話の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 環境に関する注意

Gateway が対話シェルの外で実行される場合は、`FIREWORKS_API_KEY`
がそのプロセスからも利用可能であることを確認してください。`~/.profile` にだけ置かれたキーは、
その環境がそこにも取り込まれない限り、launchd / systemd daemon では役に立ちません。

## 組み込みカタログ

| Model ref                                              | Name                        | Input      | Context | Max output | Notes |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ----- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Fireworks 上のデフォルトのバンドル済みスターターモデル |

## カスタム Fireworks model id

OpenClaw は動的な Fireworks model id も受け付けます。Fireworks が表示する正確な model または router id を使い、先頭に `fireworks/` を付けてください。

例:

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

Fireworks が新しい Qwen や Gemma リリースのような新しいモデルを公開した場合、バンドル済みカタログの更新を待たずに、その Fireworks model id を使って直接切り替えられます。
