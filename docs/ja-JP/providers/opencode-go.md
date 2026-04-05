---
read_when:
    - OpenCode Go カタログを使いたい場合
    - Go ホスト型モデルの runtime model ref が必要な場合
summary: 共有の OpenCode セットアップで OpenCode Go カタログを使用する
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T12:54:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go は、[OpenCode](/providers/opencode) 内の Go カタログです。
Zen カタログと同じ `OPENCODE_API_KEY` を使用しますが、上流のモデル単位ルーティングが正しく機能するよう、
runtime provider id は `opencode-go` のまま維持されます。

## サポートされるモデル

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI セットアップ

```bash
openclaw onboard --auth-choice opencode-go
# または非対話型
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## config スニペット

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## ルーティング動作

model ref が `opencode-go/...` を使用している場合、OpenClaw がモデル単位のルーティングを自動的に処理します。

## 注意

- 共有の onboarding とカタログ概要については [OpenCode](/providers/opencode) を使用してください。
- runtime ref は明示的なままです: Zen は `opencode/...`、Go は `opencode-go/...`。
