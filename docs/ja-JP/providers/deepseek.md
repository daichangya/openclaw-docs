---
read_when:
    - OpenClaw で DeepSeek を使いたい場合
    - API キーの env var または CLI の auth choice が必要な場合
summary: DeepSeek のセットアップ（auth + モデル選択）
x-i18n:
    generated_at: "2026-04-05T12:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) は、OpenAI 互換 API を備えた高性能な AI モデルを提供します。

- Provider: `deepseek`
- Auth: `DEEPSEEK_API_KEY`
- API: OpenAI 互換
- Base URL: `https://api.deepseek.com`

## クイックスタート

API キーを設定します（推奨: Gateway 用に保存する）:

```bash
openclaw onboard --auth-choice deepseek-api-key
```

これにより API キーの入力が求められ、デフォルトモデルとして `deepseek/deepseek-chat` が設定されます。

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## 環境に関する注意

Gateway が daemon（launchd/systemd）として動作している場合は、`DEEPSEEK_API_KEY` が
そのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
`env.shellEnv` 経由）。

## 組み込みカタログ

| Model ref                    | Name              | Input | Context | Max output | Notes                                             |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | デフォルトモデル。DeepSeek V3.2 の非 thinking サーフェス |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | reasoning 対応の V3.2 サーフェス                    |

現在、bundled の両モデルは source 上で streaming usage compatibility を告知しています。

API キーは [platform.deepseek.com](https://platform.deepseek.com/api_keys) で取得してください。
