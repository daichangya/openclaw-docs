---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 为什么某个工具被阻止：沙箱运行时、工具允许/拒绝策略，以及提权 exec 门槛
title: 沙箱隔离 vs 工具策略 vs 提权权限
x-i18n:
    generated_at: "2026-04-23T20:49:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5525901fef8c3cb78780e37ba7e8029cc39155e871f27f2b783cd47cf9c30bac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw 有三个相关但不同的控制项：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端还是宿主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/被允许**。
3. **提权权限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅适用于 exec 的逃生口**，用于在启用沙箱时脱离沙箱运行（默认是 `gateway`，如果 exec 目标配置为 `node`，则为 `node`）。

## 快速调试

使用检查器查看 OpenClaw **实际**在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效中的沙箱模式/范围/工作区访问权限
- 当前会话是否处于沙箱中（main vs non-main）
- 生效中的沙箱工具 allow/deny（以及它来自 agent/global/default 中的哪一层）
- 提权权限门槛以及修复建议键路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在宿主机上运行。
- `"non-main"`：只有非主会话会进入沙箱（这是群组/渠道中常见的“意外”来源）。
- `"all"`：所有内容都在沙箱中运行。

完整矩阵（scope、工作区挂载、镜像）请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会**穿透**沙箱文件系统：无论你挂载什么，它都会以你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果省略模式，默认是读写；对于源码/secret，优先使用 `:ro`。
- `scope: "shared"` 会忽略每智能体绑定（只应用全局绑定）。
- OpenClaw 会对绑定源进行两次验证：先验证规范化后的源路径，再在通过最深现有祖先路径解析后再次验证。通过符号链接父目录进行逃逸，无法绕过阻止路径或允许根目录检查。
- 不存在的叶子路径仍会被安全检查。如果 `/workspace/alias-out/new-file` 通过一个带符号链接的父目录解析到被阻止路径，或位于已配置允许根目录之外，该绑定会被拒绝。
- 绑定 `/var/run/docker.sock` 基本等同于把宿主机控制权交给沙箱；只有在你明确有意这样做时才应使用。
- 工作区访问权限（`workspaceAccess: "ro"`/`"rw"`）与绑定模式彼此独立。

## 工具策略：哪些工具存在/可调用

有两层需要关注：

- **工具配置档**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置档**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/每智能体工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在启用沙箱时生效）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则：

- `deny` 永远优先。
- 如果 `allow` 非空，则其他所有内容都视为被阻止。
- 工具策略是硬性终止点：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为已授权发送者更改会话默认值；它不会授予工具访问权限。
  提供商工具键可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.5`）。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持 `group:*` 条目，可展开为多个工具：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用组：

- `group:runtime`：`exec`、`process`、`code_execution`（`bash` 可作为
  `exec` 的别名）
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:web`：`web_search`、`x_search`、`web_fetch`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`
- `group:media`：`image`、`image_generate`、`video_generate`、`tts`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括 provider 插件）

## 提权权限：仅适用于 exec 的“在宿主机上运行”

提权权限**不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱中，`/elevated on`（或带 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要审批）。
- 使用 `/elevated full` 可跳过该会话的 exec 审批。
- 如果你本来就在直接运行模式下，提权权限实际上没有效果（但仍受门槛控制）。
- 提权权限**不**按 Skills 作用域控制，且**不会**覆盖工具 allow/deny。
- 提权权限不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，只有当配置/会话目标本来就是 `node` 时才会保留 `node`。
- `/exec` 与提权权限是分开的。它只会为已授权发送者调整每会话 exec 默认值。

门槛：

- 启用开关：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

请参阅[提权模式](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”修复方法

### “工具 X 被沙箱工具策略阻止”

修复键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或每智能体 `agents.list[].sandbox.mode=off`）
- 允许该工具在沙箱中运行：
  - 将其从 `tools.sandbox.tools.deny`（或每智能体 `agents.list[].tools.sandbox.tools.deny`）中移除
  - 或将其添加到 `tools.sandbox.tools.allow`（或每智能体 allow）中

### “我以为这是 main，为什么它被放进沙箱了？”

在 `"non-main"` 模式下，群组/渠道键**不是** main。请使用主会话键（`sandbox explain` 中会显示），或将模式切换为 `"off"`。

## 另请参阅

- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 完整沙箱参考（模式、范围、后端、镜像）
- [多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools) —— 每智能体覆盖和优先级
- [提权模式](/zh-CN/tools/elevated)
