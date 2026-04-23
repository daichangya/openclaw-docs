---
read_when:
    - 使用或修改 exec 工具 to=final code omitted
    - 调试 stdin 或 TTY 行为 to=final code omitted
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具 to=final code omitted
x-i18n:
    generated_at: "2026-04-23T21:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6bd2c66cd9b05fce703c5a59e6134f8ae9a20965edb0b7df585b81e72d08d2
    source_path: tools/exec.md
    workflow: 15
---

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。
如果不允许 `process`，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体划分作用域；`process` 只能看到同一智能体的会话。

## 参数

- `command`（必填）
- `workdir`（默认为 cwd）
- `env`（键/值覆盖项）
- `yieldMs`（默认 10000）：延迟后自动转后台
- `background`（布尔值）：立即转后台
- `timeout`（秒，默认 1800）：到期后终止
- `pty`（布尔值）：在可用时于伪终端中运行（TTY-only CLI、编码智能体、终端 UI）
- `host`（`auto | sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：`gateway`/`node` 的强制模式
- `ask`（`off | on-miss | always`）：`gateway`/`node` 的审批提示
- `node`（字符串）：`host=node` 时的节点 id/name
- `elevated`（布尔值）：请求提权模式（从沙箱跳转到已配置主机路径）；仅当提权最终解析为 `full` 时，才会强制 `security=full`

说明：

- `host` 默认是 `auto`：如果该会话启用了沙箱运行时，则使用 sandbox，否则使用 gateway。
- `auto` 是默认路由策略，不是通配符。每次调用时允许从 `auto` 指定 `host=node`；而每次调用指定 `host=gateway` 仅在当前没有启用沙箱运行时时才允许。
- 在不做额外配置的情况下，`host=auto` 仍然可以“直接工作”：没有沙箱时，它会解析为 `gateway`；有活动沙箱时，它会停留在沙箱内。
- `elevated` 会从沙箱跳转到已配置的主机路径：默认是 `gateway`，当 `tools.exec.host=node`（或会话默认值是 `host=node`）时则为 `node`。仅当当前会话/提供商启用了提权访问时，此功能才可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要一个已配对的节点（配套应用或无头节点主机）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 进行选择。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- 在非 Windows 主机上，若设置了 `SHELL`，exec 会使用它；如果 `SHELL` 是 `fish`，则它会优先从 `PATH` 中选择 `bash`（或 `sh`），以避免 fish 不兼容脚本；只有在两者都不存在时，才会回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（`pwsh`）（依次检查 Program Files、ProgramW6432，然后 PATH），随后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和 loader 覆盖项（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），以便 shell/profile 规则能够检测到 exec-tool 上下文。
- 重要：默认情况下，沙箱隔离是**关闭的**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析为 `gateway`。显式 `host=sandbox` 仍会 fail closed，而不是静默
  在 gateway 主机上运行。请启用沙箱隔离，或结合审批使用 `host=gateway`。
- 脚本预检查（用于发现常见 Python/Node shell 语法错误）只会检查处于
  生效 `workdir` 边界内的文件。如果某个脚本路径解析到 `workdir` 之外，则会跳过对
  该文件的预检查。
- 对于现在开始的长时间运行工作，请只启动一次，并依赖启用后的自动
  完成唤醒机制：当命令产生输出或失败时会触发唤醒。
  如需查看日志、状态、输入或干预，请使用 `process`；不要通过
  sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后或按计划执行的工作，请使用 cron，而不是使用
  `exec` 的 sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec 会话在退出时会将一个系统事件加入队列并请求 heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过此值时，发出一次“running”提示（设为 0 可禁用）。
- `tools.exec.host`（默认：`auto`；当沙箱运行时启用时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：对 sandbox 为 `deny`，对 gateway + node 在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批主机 exec 是 gateway + node 的默认模式。如果你希望启用审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机上的 `~/.openclaw/exec-approvals.json`；参见 [Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制走 gateway 或 node 路由，请设置 `tools.exec.host`，或使用 `/exec host=...`。
- 在 `security=full` 且 `ask=off` 模式下，主机 exec 会直接遵循已配置策略；不会额外增加基于启发式的命令混淆预过滤器或脚本预检查拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`，始终需要显式审批。`allow-always` 仍可持久化无害的解释器/脚本调用，但内联 eval 形式每次都会提示。
- `tools.exec.pathPrepend`：要在 exec 运行时（仅 gateway + sandbox）添加到 `PATH` 前面的目录列表。
- `tools.exec.safeBins`：stdin-only 的安全二进制，可在没有显式 allowlist 条目的情况下运行。行为细节参见 [Safe bins](/zh-CN/tools/exec-approvals#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的额外显式受信任目录。`PATH` 条目永远不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：为自定义 safe bin 提供可选的 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

示例：

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 处理

- `host=gateway`：将你的登录 shell `PATH` 合并进 exec 环境。主机执行会
  拒绝 `env.PATH` 覆盖项。守护进程本身仍以最小化 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在 profile source 之后通过内部环境变量将 `env.PATH` 追加到前面（无 shell 插值）；
  `tools.exec.pathPrepend` 在这里也会生效。
- `host=node`：只会将你传入的、未被屏蔽的 env 覆盖项发送给节点。主机执行会
  拒绝 `env.PATH` 覆盖项，节点主机也会忽略它们。如果你需要在节点上增加 PATH 条目，
  请配置节点主机服务环境（systemd/launchd），或将工具安装在标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI：Nodes 标签页中包含一个小型“Exec node binding”面板，用于配置相同设置。

## 会话覆盖项（`/exec`）

使用 `/exec` 可为**每个会话**设置 `host`、`security`、`ask` 和 `node` 的默认值。
不带参数发送 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道允许列表/配对 加上 `commands.useAccessGroups`）。
它只会更新**会话状态**，不会写入配置。若要硬禁用 exec，请通过工具
策略进行拒绝（`tools.deny: ["exec"]` 或按智能体设置）。除非你显式设置了
`security=full` 且 `ask=off`，否则主机审批仍会生效。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离智能体可以要求在 exec 于 gateway 或 node 主机上运行之前进行逐请求审批。
详见 [Exec 审批](/zh-CN/tools/exec-approvals) 了解策略、允许列表和 UI 流程。

当需要审批时，exec 工具会立即返回，
并带有 `status: "approval-pending"` 和一个审批 id。一旦审批通过（或被拒绝 / 超时），
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 提示。
在支持原生审批卡片/按钮的渠道上，智能体应优先依赖该
原生 UI，只有当工具结果明确指出聊天审批不可用，或手动审批是唯一可用路径时，才应附带手动 `/approve` 命令。

## Allowlist + safe bins

手动 allowlist 强制只匹配**已解析的二进制路径**（不做 basename 匹配）。当
`security=allowlist` 时，只有当每个 pipeline 段都
在 allowlist 中或属于 safe bin 时，shell 命令才会被自动允许。链式执行（`;`、`&&`、`||`）和重定向在
allowlist 模式下会被拒绝，除非每个顶层段都满足 allowlist（包括 safe bins）。
重定向仍然不受支持。
持久的 `allow-always` 信任也不能绕过该规则：链式命令仍然要求每个
顶层段都匹配。

`autoAllowSkills` 是 exec 审批中的一个单独便利路径。它不同于
手动路径 allowlist 条目。若要实现严格的显式信任，请保持 `autoAllowSkills` 关闭。

请将这两个控制用于不同用途：

- `tools.exec.safeBins`：小型、仅 stdin 的流式过滤二进制。
- `tools.exec.safeBinTrustedDirs`：safe-bin 可执行路径的显式额外受信任目录。
- `tools.exec.safeBinProfiles`：自定义 safe bins 的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要将 `safeBins` 当作通用 allowlist 使用，也不要向其中添加解释器/运行时二进制（例如 `python3`、`node`、`ruby`、`bash`）。如果需要这些，请使用显式 allowlist 条目，并保持审批提示启用。
当解释器/运行时 `safeBins` 条目缺失显式 profiles 时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
当你显式将如 `jq` 这样的宽行为二进制重新加入 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式 allowlist 了解释器，请启用 `tools.exec.strictInlineEval`，这样内联代码 eval 形式仍然需要新的审批。

完整策略细节和示例请参见 [Exec 审批](/zh-CN/tools/exec-approvals#safe-bins-stdin-only) 和 [Safe bins 与 allowlist](/zh-CN/tools/exec-approvals#safe-bins-versus-allowlist)。

## 示例

前台：

```json
{ "tool": "exec", "command": "ls -la" }
```

后台 + 轮询：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

轮询用于按需查看状态，而不是等待循环。如果已启用自动完成唤醒，
命令在产生输出或失败时可以唤醒会话。

发送按键（tmux 风格）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（仅发送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴（默认使用 bracketed 模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的一个子工具，用于结构化多文件编辑。
默认对 OpenAI 和 OpenAI Codex 模型启用。只有当你想禁用它，或只允许特定模型使用它时，才需要通过配置控制：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

说明：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认值为 `true`；如要对 OpenAI 模型禁用该工具，请将其设置为 `false`。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（限制在工作区内）。只有当你明确希望 `apply_patch` 在工作区目录之外进行写入/删除时，才应将其设置为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) —— shell 命令的审批门控
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 在沙箱环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) —— 长时间运行的 exec 与 process 工具
- [Security](/zh-CN/gateway/security) —— 工具策略与提权访问
