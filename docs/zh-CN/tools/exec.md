---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-04-23T23:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e2a7fc3b0570d59a6694d0a4ff9def1a5721c8a3d13abf7f947e7ea835535b3
    source_path: tools/exec.md
    workflow: 15
---

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。
如果 `process` 被禁止，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体划分作用域；`process` 只能看到同一智能体下的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
键/值形式的环境变量覆盖，会合并到继承环境之上。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在该延迟（毫秒）后自动将命令转为后台运行。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令置于后台运行，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="1800">
在这么多秒后杀死命令。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时于伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 会在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 执行的强制模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 执行的审批提示行为。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时使用的节点 id/name。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提权模式 —— 从沙箱逃逸到已配置的宿主路径。只有当 elevated 最终解析为 `full` 时，才会强制 `security=full`。
</ParamField>

说明：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时为 sandbox，否则为 gateway。
- `auto` 是默认路由策略，不是通配符。单次调用时允许从 `auto` 切换到 `host=node`；只有在没有活动沙箱运行时时，才允许单次调用 `host=gateway`。
- 在没有额外配置的情况下，`host=auto` 仍然“开箱即用”：没有沙箱时会解析为 `gateway`；有活动沙箱时则保持在沙箱内。
- `elevated` 会从沙箱逃逸到已配置的宿主路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时为 `node`。它仅在当前会话/provider 启用了提权访问时可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要一个已配对的节点（配套应用或无头节点宿主）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 来选择其中一个。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- 在非 Windows 宿主上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，它会优先使用 `PATH` 中的 `bash`（或 `sh`），以避免 fish 不兼容脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 宿主上，exec 会优先发现 PowerShell 7（依次检查 Program Files、ProgramW6432、然后 PATH），然后回退到 Windows PowerShell 5.1。
- 宿主执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），以便 shell/profile 规则检测 exec 工具上下文。
- 重要：沙箱隔离默认**关闭**。如果沙箱隔离关闭，隐式 `host=auto` 会解析为 `gateway`。显式 `host=sandbox` 仍会以失败关闭方式处理，而不是静默地在 gateway 宿主上运行。请启用沙箱隔离，或在审批下使用 `host=gateway`。
- 脚本预检（用于检测常见 Python/Node shell 语法错误）只会检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。
- 对于从现在开始的长时间运行工作，请启动一次，然后依赖启用后的自动完成唤醒机制，当命令输出内容或失败时唤醒。日志、状态、输入或人工干预请使用 `process`；不要用 sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后执行或按计划执行的工作，请使用 cron，而不是 `exec` 的 sleep/延迟模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec 会话会在退出时排入一个系统事件并请求 heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过该值时，发出一次“running”通知（设为 0 可禁用）。
- `tools.exec.host`（默认：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：sandbox 为 `deny`，gateway + node 在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批的宿主 exec 是 gateway + node 的默认行为。如果你希望启用审批/允许列表行为，请同时收紧 `tools.exec.*` 和宿主 `~/.openclaw/exec-approvals.json`；参见[Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自宿主策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制使用 gateway 或 node 路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，宿主 exec 会直接遵循已配置策略；没有额外的启发式命令混淆预过滤器，也没有脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`，始终需要显式审批。`allow-always` 仍可持久信任无害的解释器/脚本调用，但内联 eval 形式每次仍会提示。
- `tools.exec.pathPrepend`：在 exec 运行前追加到 `PATH` 前部的目录列表（仅 gateway + sandbox）。
- `tools.exec.safeBins`：无需显式允许列表条目的仅 stdin 安全二进制文件。有关行为细节，请参见[Safe bins](/zh-CN/tools/exec-approvals#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：为 `safeBins` 路径检查显式信任的额外目录。`PATH` 条目不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。宿主执行会拒绝 `env.PATH` 覆盖。守护进程本身仍以最小化 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 会在 profile sourcing 之后通过内部环境变量将 `env.PATH` 追加到前面（不使用 shell 插值）；`tools.exec.pathPrepend` 在这里同样生效。
- `host=node`：只有你传入的未被阻止的环境变量覆盖会发送到节点。宿主执行会拒绝 `env.PATH` 覆盖，节点宿主也会忽略它。如果你需要在节点上添加更多 PATH 条目，请配置节点宿主服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 标签页中包含一个小型“Exec 节点绑定”面板，用于配置相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**按会话**默认值。
不带参数发送 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道允许列表/配对加上 `commands.useAccessGroups`）。
它只会更新**会话状态**，不会写入配置。若要硬禁用 exec，请通过工具策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。
除非你显式设置 `security=full` 且 `ask=off`，否则宿主审批仍会生效。

## Exec 审批（配套应用 / 节点宿主）

沙箱隔离智能体可以要求在 `exec` 于 gateway 或节点宿主上运行前进行逐次请求审批。
有关策略、允许列表和 UI 流程，请参见[Exec 审批](/zh-CN/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回，
`status: "approval-pending"` 和一个审批 id。一旦审批通过（或被拒绝 / 超时），Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在 `tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 通知。
在支持原生审批卡片/按钮的渠道上，智能体应首先依赖该原生 UI，仅当工具结果明确说明聊天审批不可用，或手动审批是唯一途径时，才附带手动 `/approve` 命令。

## Allowlist + safe bins

手动允许列表强制只匹配**解析后的二进制路径**（不支持仅按 basename 匹配）。当
`security=allowlist` 时，只有在每个管道片段都在允许列表中或属于 safe bin 的情况下，shell 命令才会被自动允许。链式命令（`;`、`&&`、`||`）和重定向在
allowlist 模式下会被拒绝，除非每个顶层片段都满足允许列表条件（包括 safe bin）。
重定向仍然不受支持。
持久化的 `allow-always` 信任也不会绕过此规则：链式命令仍要求每个顶层片段都匹配。

`autoAllowSkills` 是 exec 审批中的一条单独的便捷路径。它不同于
手动路径允许列表条目。若要实现严格的显式信任，请保持
`autoAllowSkills` 关闭。

请将这两个控制项用于不同任务：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤二进制文件。
- `tools.exec.safeBinTrustedDirs`：为 safe-bin 可执行路径显式信任的额外目录。
- `tools.exec.safeBinProfiles`：为自定义 safe bin 提供显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要将 `safeBins` 视为通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目，并保持审批提示开启。
当解释器/运行时 `safeBins` 条目缺少显式 profiles 时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
当你显式将 `jq` 这类宽行为二进制文件重新加入 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式允许列表解释器，请启用 `tools.exec.strictInlineEval`，以便内联代码 eval 形式仍需重新审批。

有关完整策略细节和示例，请参见[Exec 审批](/zh-CN/tools/exec-approvals#safe-bins-stdin-only)和[Safe bins versus allowlist](/zh-CN/tools/exec-approvals#safe-bins-versus-allowlist)。

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

轮询用于按需查看状态，而不是等待循环。如果启用了自动完成唤醒，
命令可以在输出内容或失败时唤醒会话。

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

`apply_patch` 是 `exec` 的一个子工具，用于结构化的多文件编辑。
对于 OpenAI 和 OpenAI Codex 模型，它默认启用。只有在你想禁用它或将其限制为特定模型时，才需要使用配置：

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
- `tools.exec.applyPatch.enabled` 默认值为 `true`；设置为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（仅限工作区内）。只有在你明确希望 `apply_patch` 在工作区目录之外写入/删除时，才将其设为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全性](/zh-CN/gateway/security) — 工具策略和提权访问
