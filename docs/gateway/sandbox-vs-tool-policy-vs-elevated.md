---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 为什么某个工具会被阻止：沙箱运行时、工具允许/拒绝策略，以及提升权限的 exec 门控
title: 沙箱 vs 工具策略 vs 提升权限
x-i18n:
    generated_at: "2026-04-23T22:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw 有三种相关但不同的控制机制：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端还是主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/允许调用**。
3. **提升权限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅限 exec 的逃生舱口**，当你处于沙箱中时可在沙箱外运行（默认是 `gateway`，或者当 exec 目标配置为 `node` 时使用 `node`）。

## 快速调试

使用检查器查看 OpenClaw **实际**在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效的沙箱 mode/scope/workspace access
- 该会话当前是否处于沙箱中（main vs non-main）
- 生效的沙箱工具 allow/deny（以及它来自智能体/全局/默认值中的哪一层）
- 提升权限门控和修复用键路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非主会话会进入沙箱（这是群组/渠道场景中常见的“意外”来源）。
- `"all"`：所有内容都在沙箱中运行。

完整矩阵（scope、workspace mounts、镜像）请参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会**穿透**沙箱文件系统：你挂载的任何内容都会按你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果省略模式，默认是读写；对于源码/密钥，优先使用 `:ro`。
- `scope: "shared"` 会忽略按智能体设置的 binds（仅应用全局 binds）。
- OpenClaw 会对绑定源进行两次验证：先对归一化后的源路径验证，然后在通过最深已存在祖先路径解析后再次验证。通过符号链接父路径逃逸无法绕过受阻路径或允许根目录检查。
- 不存在的叶子路径也会被安全检查。如果 `/workspace/alias-out/new-file` 通过某个符号链接父目录解析到受阻路径，或落在配置的允许根目录之外，该绑定会被拒绝。
- 绑定 `/var/run/docker.sock` 实际上等同于把主机控制权交给沙箱；只有在你明确有意这样做时才应使用。
- 工作区访问（`workspaceAccess: "ro"`/`"rw"`）与绑定模式彼此独立。

## 工具策略：哪些工具存在/可调用

有两层很重要：

- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许名单）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/按智能体工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在处于沙箱时适用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则：

- `deny` 永远优先。
- 如果 `allow` 非空，其余所有项都会被视为阻止。
- 工具策略是硬性终点：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为已授权发送者更改会话默认值；它不会授予工具访问权限。
  提供商工具键既可使用 `provider`（例如 `google-antigravity`），也可使用 `provider/model`（例如 `openai/gpt-5.4`）。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持 `group:*` 条目，它们会展开为多个工具：

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

可用的组：

- `group:runtime`：`exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名接受）
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
- `group:openclaw`：所有内置 OpenClaw 工具（不包括提供商插件）

## 提升权限：仅限 exec 的“在主机上运行”

提升权限**不会**授予额外工具；它只影响 `exec`。

- 如果你在沙箱中，`/elevated on`（或带 `elevated: true` 的 `exec`）会在沙箱外运行（可能仍然需要审批）。
- 使用 `/elevated full` 可跳过该会话中的 exec 审批。
- 如果你已经在直接运行环境中，提升权限基本等同于无操作（但仍受门控）。
- 提升权限**不是**按 Skills 作用域控制的，也**不会**覆盖工具 allow/deny。
- 提升权限不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，并且仅当配置的/会话目标本身已是 `node` 时才保留 `node`。
- `/exec` 与提升权限是分开的。它只会为已授权发送者调整按会话的 exec 默认值。

门控：

- 启用开关：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许名单：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

参见 [提升权限模式](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”修复方法

### “工具 X 被沙箱工具策略阻止”

修复键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按智能体设置 `agents.list[].sandbox.mode=off`）
- 在沙箱内允许该工具：
  - 将其从 `tools.sandbox.tools.deny` 中移除（或按智能体从 `agents.list[].tools.sandbox.tools.deny` 中移除）
  - 或将其添加到 `tools.sandbox.tools.allow`（或按智能体 allow）

### “我以为这是 main，为什么它被放进沙箱了？”

在 `"non-main"` 模式下，群组/渠道键**不是** main。请使用 main 会话键（`sandbox explain` 会显示），或将模式切换为 `"off"`。

## 相关内容

- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 完整沙箱参考（模式、作用域、后端、镜像）
- [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) —— 按智能体覆盖和优先级
- [提升权限模式](/zh-CN/tools/elevated)
