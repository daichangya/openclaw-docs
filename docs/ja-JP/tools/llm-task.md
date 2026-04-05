---
read_when:
    - ワークフロー内で JSON 専用の LLM ステップを使いたい
    - 自動化のためにスキーマ検証済みの LLM 出力が必要である
summary: ワークフロー向けの JSON 専用 LLM タスク（任意の plugin tool）
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T12:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` は、JSON 専用の LLM タスクを実行し、
構造化出力を返す**任意の plugin tool**です（必要に応じて JSON Schema に対して検証可能です）。

これは Lobster のようなワークフローエンジンに最適です。各ワークフローごとにカスタムの OpenClaw コードを書かなくても、
単一の LLM ステップを追加できます。

## plugin を有効にする

1. plugin を有効にします:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. tool を allowlist に追加します（`optional: true` で登録されます）:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 設定（任意）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` は `provider/model` 文字列の allowlist です。設定されている場合、
一覧外のリクエストは拒否されます。

## tool パラメーター

- `prompt`（文字列、必須）
- `input`（任意、任意）
- `schema`（オブジェクト、任意の JSON Schema）
- `provider`（文字列、任意）
- `model`（文字列、任意）
- `thinking`（文字列、任意）
- `authProfileId`（文字列、任意）
- `temperature`（数値、任意）
- `maxTokens`（数値、任意）
- `timeoutMs`（数値、任意）

`thinking` は、`low` や `medium` などの標準的な OpenClaw 推論プリセットを受け付けます。

## 出力

解析済み JSON を含む `details.json` を返します（`schema` が指定されている場合はそれに対して検証も行います）。

## 例: Lobster ワークフローステップ

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全に関する注意

- この tool は**JSON 専用**であり、モデルには JSON のみを出力するよう指示します（コードフェンスなし、説明文なし）。
- この実行では、モデルに対して tools は公開されません。
- `schema` で検証しない限り、出力は信頼できないものとして扱ってください。
- 副作用のあるステップ（send、post、exec）の前に承認を入れてください。
