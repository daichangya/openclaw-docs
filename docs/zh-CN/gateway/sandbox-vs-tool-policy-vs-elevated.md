---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 为什么工具会被阻止：沙箱运行时、工具允许/拒绝策略，以及提权执行门禁
title: 沙箱与工具策略与提权执行的区别
x-i18n:
    generated_at: "2026-04-20T18:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# 沙箱与工具策略与提权执行的区别

OpenClaw 有三种相关但不同的控制方式：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端还是主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用 / 被允许**。
3. **提权执行**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅限 exec 的逃生通道**：当你处于沙箱中时，可用于在沙箱外运行（默认是 `gateway`，或者当 exec 目标被配置为 `node` 时使用 `node`）。

## 快速调试

使用检查器查看 OpenClaw **实际**在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效的沙箱模式 / 作用域 / 工作区访问权限
- 当前会话是否处于沙箱中（主会话与非主会话）
- 生效的沙箱工具允许 / 拒绝设置（以及它来自智能体 / 全局 / 默认配置中的哪一层）
- 提权执行门禁和修复建议键路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非主会话会进入沙箱（这是群组 / 渠道场景中常见的“意外”来源）。
- `"all"`：所有内容都在沙箱中运行。

完整矩阵（作用域、工作区挂载、镜像）请参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会**穿透**沙箱文件系统：你挂载的任何内容都会以你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果你省略模式，默认是可读写；对于源码 / 密钥，优先使用 `:ro`。
- `scope: "shared"` 会忽略每个智能体的独立绑定挂载（只应用全局绑定挂载）。
- OpenClaw 会对绑定源进行两次校验：先检查规范化后的源路径，然后在通过最深的现有祖先路径解析后再次检查。通过符号链接父目录逃逸，无法绕过被阻止路径或允许根目录检查。
- 不存在的叶子路径也会被安全检查。如果 `/workspace/alias-out/new-file` 通过一个符号链接父目录解析到被阻止路径，或超出已配置的允许根目录范围，该绑定挂载会被拒绝。
- 挂载 `/var/run/docker.sock` 实际上等于把主机控制权交给沙箱；只有在你明确知道自己在做什么时才应这样做。
- 工作区访问权限（`workspaceAccess: "ro"` / `"rw"`）与绑定挂载模式相互独立。

## 工具策略：哪些工具存在 / 可调用

有两层很重要：

- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局 / 每智能体工具策略**：`tools.allow` / `tools.deny` 和 `agents.list[].tools.allow` / `agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在处于沙箱中时生效）：`tools.sandbox.tools.allow` / `tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验规则：

- `deny` 永远优先。
- 如果 `allow` 非空，其他所有内容都会被视为已阻止。
- 工具策略是硬性终止条件：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为已授权发送者修改会话默认值；它不会授予工具访问权限。  
  提供商工具键既可以使用 `provider`（例如 `google-antigravity`），也可以使用 `provider/model`（例如 `openai/gpt-5.4`）。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持 `group:*` 条目，它会展开为多个工具：

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

可用的工具组：

- `group:runtime`：`exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名）
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

## 提权执行：仅限 exec 的“在主机上运行”

提权执行**不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱中，`/elevated on`（或带 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要审批）。
- 使用 `/elevated full` 可跳过该会话中的 exec 审批。
- 如果你本来就是直接运行，提权执行实际上没有效果（但仍受门禁控制）。
- 提权执行**不**受 Skills 作用域限制，也**不**会覆盖工具允许 / 拒绝策略。
- 提权执行不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，并且只有在配置的 / 会话中的目标本来就是 `node` 时，才会保留 `node`。
- `/exec` 与提权执行是分开的。它只会为已授权发送者调整每个会话的 exec 默认值。

门禁：

- 启用开关：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

参见 [提权执行模式](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”修复方法

### “工具 X 被沙箱工具策略阻止”

修复建议键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按智能体设置 `agents.list[].sandbox.mode=off`）
- 允许该工具在沙箱中使用：
  - 从 `tools.sandbox.tools.deny` 中移除它（或按智能体从 `agents.list[].tools.sandbox.tools.deny` 中移除）
  - 或者把它添加到 `tools.sandbox.tools.allow`（或按智能体添加到 allow）

### “我以为这是主会话，为什么它在沙箱里？”

在 `"non-main"` 模式下，群组 / 渠道键**不是**主会话。请使用主会话键（由 `sandbox explain` 显示），或将模式切换为 `"off"`。

## 另请参见

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整的沙箱参考（模式、作用域、后端、镜像）
- [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 每个智能体的覆盖项和优先级
- [提权执行模式](/zh-CN/tools/elevated)
