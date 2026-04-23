---
read_when:
    - 你想在工作流中加入一个仅输出 JSON 的 LLM 步骤
    - 你需要用于自动化的 schema 验证 LLM 输出】【：】【“】【analysis to=final code omitted due developer instruction? English left? Need translate preserving code. user asks translation only. Let's answer translation.
summary: 用于工作流的仅 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-04-23T21:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03844e1e0cd18a1537320cd1401fa50704327f0ab3ffaf5e60c069235d7069d7
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` 是一个**可选插件工具**，用于运行仅输出 JSON 的 LLM 任务，
并返回结构化输出（可选地根据 JSON Schema 进行验证）。

这非常适合像 Lobster 这样的工作流引擎：你可以添加一个单独的 LLM 步骤，
而无需为每个工作流编写自定义 OpenClaw 代码。

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

2. 将工具加入允许列表（它是以 `optional: true` 注册的）：

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

`allowedModels` 是由 `provider/model` 字符串组成的允许列表。如果设置了它，
则任何不在列表中的请求都会被拒绝。

## 工具参数

- `prompt`（字符串，必填）
- `input`（任意类型，可选）
- `schema`（对象，可选，JSON Schema）
- `provider`（字符串，可选）
- `model`（字符串，可选）
- `thinking`（字符串，可选）
- `authProfileId`（字符串，可选）
- `temperature`（数字，可选）
- `maxTokens`（数字，可选）
- `timeoutMs`（数字，可选）

`thinking` 接受标准 OpenClaw 推理预设，例如 `low` 或 `medium`。

## 输出

返回 `details.json`，其中包含解析后的 JSON（并在提供了
`schema` 时进行验证）。

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

- 该工具是**仅 JSON** 的，并会指示模型只输出 JSON（不允许
  代码围栏，也不允许附加说明文字）。
- 在本次运行中，不会向模型暴露任何工具。
- 除非你使用 `schema` 进行验证，否则应将输出视为不可信。
- 在任何带副作用的步骤（发送、发布、exec）之前，都应先放置审批。
