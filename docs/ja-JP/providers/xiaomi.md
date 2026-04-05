---
read_when:
    - OpenClawでXiaomi MiMoモデルを使いたい場合
    - '`XIAOMI_API_KEY` の設定が必要な場合'
summary: OpenClawでXiaomi MiMoモデルを使用する
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T12:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMoは、**MiMo** モデル向けのAPIプラットフォームです。OpenClawはXiaomiの
OpenAI互換エンドポイントをAPIキー認証付きで使用します。
[Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) でAPIキーを作成し、その後
同梱の `xiaomi` プロバイダーにそのキーを設定してください。

## 組み込みcatalog

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Authorization: `Bearer $XIAOMI_API_KEY`

| Model ref              | Input       | Context   | Max output | Notes                        |
| ---------------------- | ----------- | --------- | ---------- | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | デフォルトモデル             |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Reasoning対応                |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Reasoning対応のマルチモーダル |

## CLIセットアップ

```bash
openclaw onboard --auth-choice xiaomi-api-key
# または非対話式
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 設定スニペット

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## 注記

- デフォルトモデル参照: `xiaomi/mimo-v2-flash`。
- 追加の組み込みモデル: `xiaomi/mimo-v2-pro`、`xiaomi/mimo-v2-omni`。
- `XIAOMI_API_KEY` が設定されている場合（またはauth profileが存在する場合）、プロバイダーは自動的に注入されます。
- プロバイダールールについては [/concepts/model-providers](/concepts/model-providers) を参照してください。
