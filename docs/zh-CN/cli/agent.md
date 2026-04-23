---
read_when:
    - 你想从脚本中运行一个智能体轮次（可选择传递回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一个智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-04-23T20:42:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86605487ca74fd21ff82739c57e5745eff7022ff095583533db50ce5a26a29a
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

通过 Gateway 网关运行一个智能体轮次（嵌入式模式请使用 `--local`）。
使用 `--agent <id>` 可直接指定一个已配置的智能体。

至少传入一个会话选择器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关内容：

- 智能体发送工具：[Agent send](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：必填，消息正文
- `-t, --to <dest>`：用于派生会话键的接收方
- `--session-id <id>`：显式会话 ID
- `--agent <id>`：智能体 ID；会覆盖路由绑定
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为会话持久化 verbose 级别
- `--channel <channel>`：传递渠道；省略时使用 main 会话渠道
- `--reply-to <target>`：回复目标覆盖项
- `--reply-channel <channel>`：回复渠道覆盖项
- `--reply-account <id>`：回复账户覆盖项
- `--local`：直接运行嵌入式智能体（在插件注册表预加载之后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认 600 或配置值）
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 说明

- Gateway 网关模式会在 Gateway 网关请求失败时回退到嵌入式智能体。使用 `--local` 可在一开始就强制采用嵌入式执行。
- `--local` 仍会先预加载插件注册表，因此插件提供的提供商、工具和渠道在嵌入式运行期间仍可用。
- `--channel`、`--reply-channel` 和 `--reply-account` 会影响回复传递，不影响会话路由。
- 当此命令触发 `models.json` 重新生成时，由 SecretRef 管理的提供商凭证会以非秘密标记形式持久化（例如环境变量名、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析后的秘密明文。
- 标记写入以源配置为准：OpenClaw 会从当前活动的源配置快照中持久化标记，而不是从已解析的运行时秘密值中持久化。
