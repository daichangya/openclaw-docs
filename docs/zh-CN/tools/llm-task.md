---
read_when:
    - 你想在工作流中加入一个仅输出 JSON 的 LLM 步骤
    - 你需要用于自动化的、经过 schema 验证的 LLM 输出
summary: 用于工作流的仅 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-04-23T19:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b8dcc3c23f5181c36a8b2b34528a984bc703065617ed7091f2513cbcfb20912
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM 任务

`llm-task` 是一个**可选插件工具**，用于运行一个仅输出 JSON 的 LLM 任务，并返回结构化输出（可选择根据 JSON Schema 进行验证）。

这非常适合 Lobster 这样的工作流引擎：你可以添加一个单独的 LLM 步骤，而不必为每个工作流编写自定义的 OpenClaw 代码。

## 启用插件

1. 启用插件：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 将该工具加入 allowlist（它以 `optional: true` 注册）：

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

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是一个 `provider/model` 字符串的 allowlist。如果设置了它，则任何不在列表中的请求都会被拒绝。

## 工具参数

- `prompt`（字符串，必填）
- `input`（任意类型，可选）
- `schema`（对象，可选的 JSON Schema）
- `provider`（字符串，可选）
- `model`（字符串，可选）
- `thinking`（字符串，可选）
- `authProfileId`（字符串，可选）
- `temperature`（数字，可选）
- `maxTokens`（数字，可选）
- `timeoutMs`（数字，可选）

`thinking` 接受标准的 OpenClaw 推理预设，例如 `low` 或 `medium`。

## 输出

返回 `details.json`，其中包含已解析的 JSON（如果提供了 `schema`，还会根据其进行验证）。

## 示例：Lobster 工作流步骤

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

## 安全说明

- 该工具是**仅 JSON** 的，并会指示模型只输出 JSON（不使用代码围栏，不添加说明文字）。
- 本次运行不会向模型暴露任何工具。
- 除非你使用 `schema` 进行验证，否则应将输出视为不可信。
- 在任何具有副作用的步骤（发送、发布、执行）之前先设置审批。
