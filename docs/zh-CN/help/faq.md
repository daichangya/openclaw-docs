---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题
    - 在进行更深入调试之前，对用户报告的问题进行初步排查
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-07T12:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa44229d4c0f9f448b4b11be141ecc9fdc89ddaefff37f18f14173cd95cd5b49
    source_path: help/faq.md
    workflow: 15
---

# 常见问题

快速解答，以及面向真实环境设置的更深入故障排除（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障切换）。关于运行时诊断，请参见 [故障排除](/zh-CN/gateway/troubleshooting)。完整配置参考请参见 [配置](/zh-CN/gateway/configuration)。

## 如果出了问题，最初的六十秒该做什么

1. **快速状态（第一项检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、Gateway 网关/服务可达性、智能体/会话、提供商配置 + 运行时问题（当 Gateway 网关可达时）。

2. **可粘贴的报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，在支持时也包括渠道探测
   （需要可达的 Gateway 网关）。参见 [健康](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则退回到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志分开；参见 [日志记录](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置与状态 + 运行健康检查。参见 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。参见 [健康](/zh-CN/gateway/health)。

## 快速开始与首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快如何解决问题">
    使用一个能**看见你的机器**的本地 AI 智能体。这比在 Discord 里提问有效得多，
    因为大多数“我卡住了”的情况都是**本地配置或环境问题**，
    远程帮助者无法直接检查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复机器级别的
    设置问题（PATH、服务、权限、认证文件）。请通过可修改的
    （git）安装方式把**完整源码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从一个 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，
    并根据你正在运行的确切版本进行分析。你随时可以之后通过不带
    `--install-method git` 重新运行安装器切回稳定版。

    提示：让智能体**规划并监督**修复过程（分步进行），然后只执行
    必要的命令。这样能让修改更小，也更容易审计。

    如果你发现了真实 bug 或修复，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    先从这些命令开始（求助时请附上输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：Gateway 网关/智能体健康状态 + 基础配置的快速快照。
    - `openclaw models status`：检查提供商认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出了问题，最初的六十秒该做什么](#如果出了问题最初的六十秒该做什么)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 总是跳过。各种跳过原因是什么意思？">
    常见的 heartbeat 跳过原因：

    - `quiet-hours`：超出配置的 active-hours 时间窗口
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但当前没有任何任务间隔到期
    - `alerts-disabled`：所有 heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在一次真实 heartbeat 运行
    完成后，才会推进到期时间戳。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库建议从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导还可以自动构建 UI 资源。完成新手引导后，你通常会在 **18789** 端口上运行 Gateway 网关。

    从源码运行（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # 首次运行时会自动安装 UI 依赖
    openclaw onboard
    ```

    如果你还没有全局安装，可以通过 `pnpm openclaw onboard` 运行。

  </Accordion>

  <Accordion title="完成新手引导后，如何打开仪表板？">
    向导会在新手引导结束后立即用浏览器打开一个干净的（不带令牌的）仪表板 URL，并且也会在总结中打印该链接。请保持那个标签页打开；如果没有自动启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 和远程环境中为仪表板认证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的令牌或密码粘贴到 Control UI 设置中。
    - 令牌来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果还没有配置共享密钥，请使用 `openclaw doctor --generate-gateway-token` 生成令牌。

    **不在 localhost 上：**

    - **Tailscale Serve**（推荐）：保持 bind loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份头会满足 Control UI/WebSocket 认证（无需粘贴共享密钥，前提是信任 Gateway 网关主机）；HTTP API 仍然需要共享密钥认证，除非你明确使用 private-ingress `none` 或 trusted-proxy HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试会在 failed-auth limiter 记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet bind**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴对应的共享密钥。
    - **支持身份感知的反向代理**：将 Gateway 网关保持在一个非 loopback 的 trusted proxy 后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开该代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。共享密钥认证仍然适用于该隧道；如有提示，请粘贴已配置的令牌或密码。

    关于 bind 模式和认证细节，请参见 [仪表板](/web/dashboard) 和 [Web 界面](/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec approval 配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批关卡。聊天配置只控制审批
    提示出现在哪里，以及人们如何回应。

    在大多数设置中，你**不**需要同时使用两者：

    - 如果聊天已支持命令和回复，那么同一聊天中的 `/approve` 会通过共享路径生效。
    - 如果某个受支持的原生渠道能够安全推断审批人，OpenClaw 现在会在 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，自动启用私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主要路径；只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 只有当提示还必须被转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 只有当你明确希望审批提示也回发到原始房间/话题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是另一套：默认使用同一聊天中的 `/approve`、可选的 `approvals.plugin` 转发，并且只有某些原生渠道会在此基础上保留插件审批的原生处理。

    简短来说：转发用于路由，原生客户端配置用于更丰富的渠道特定 UX。
    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。**不建议**在 Gateway 网关上使用 Bun。
  </Accordion>

  <Accordion title="它能运行在 Raspberry Pi 上吗？">
    可以。Gateway 网关很轻量 —— 文档列出的个人使用需求是 **512MB-1GB RAM**、**1 个核心**、约 **500MB**
    磁盘，并注明 **Raspberry Pi 4 可以运行它**。

    如果你想留出更多余量（日志、媒体、其他服务），推荐 **2GB**，
    但这不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway 网关，而你可以在笔记本/手机上配对**节点**，
    以获得本地屏幕/摄像头/canvas 或命令执行能力。参见 [节点](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="安装到 Raspberry Pi 有什么建议吗？">
    简短回答：可以运行，但要预期会有一些边角问题。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先选择**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 先不要启用 channels/Skills，再逐个添加。
    - 如果你遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding 无法 hatch。现在怎么办？">
    这个界面依赖 Gateway 网关可达且已认证。TUI 也会在首次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这行但**没有回复**，
    且 tokens 一直是 0，说明智能体根本没有运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + 认证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确保隧道/Tailscale 连接已建立，并且 UI
    指向了正确的 Gateway 网关。参见 [远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这会
    保持你的 bot “完全一样”（记忆、会话历史、认证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、认证配置文件、WhatsApp 凭据、会话和记忆。如果你处于
    remote 模式，请记住会话存储和工作区属于 gateway host。

    **重要：**如果你只是把工作区提交/推送到 GitHub，你备份的是
    **记忆 + bootstrap 文件**，但**不是**会话历史或认证。那些位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[迁移](/zh-CN/install/migrating)、[磁盘上的文件位置](#磁盘上的文件位置)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本有什么新内容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在顶部。如果顶部部分标记为 **Unreleased**，那么下一个带日期的
    部分就是最新已发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（必要时也会有 docs/other 等部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会错误地通过 Xfinity
    Advanced Security 阻止 `docs.openclaw.ai`。请禁用它或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    也请通过这里帮助我们解除封锁：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问站点，文档也镜像在 GitHub 上：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tag**，不是不同的代码分支：

    - `latest` = stable
    - `beta` = 用于测试的早期构建

    通常，一个稳定版本会先发布到 **beta**，然后通过显式
    promotion 步骤将同一版本移动到 `latest`。维护者在需要时也可以
    直接发布到 `latest`。这就是为什么 beta 和 stable 在 promotion 后
    可能指向**同一个版本**。

    查看变更：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装一行命令以及 beta 和 dev 的区别，请参见下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（promotion 后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部（git）；发布时使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[开发通道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新版本？">
    两种方式：

    1. **Dev 通道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个可本地编辑的仓库，然后通过 git 更新。

    如果你更喜欢手动进行一次干净的 clone，可使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/cli/update)、[开发通道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常要多久？">
    大致参考：

    - **安装：**2-5 分钟
    - **新手引导：**5-15 分钟，取决于你配置了多少渠道/模型

    如果它卡住了，请参见 [安装器卡住](#快速开始与首次运行设置)
    以及 [我卡住了](#快速开始与首次运行设置) 中的快速调试循环。

  </Accordion>

  <Accordion title="安装器卡住了？如何获得更多反馈？">
    使用**详细输出**重新运行安装器：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    带详细输出的 beta 安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    对于可修改的（git）安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效方式：

    ```powershell
    # install.ps1 目前还没有专门的 -Verbose 标志。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示 git not found 或 openclaw not recognized">
    两个常见的 Windows 问题：

    **1）npm 错误 spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2）安装后 openclaw is not recognized**

    - 你的 npm 全局 bin 目录不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你想要最顺畅的 Windows 设置，请使用 **WSL2** 而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示中文乱码，我该怎么办？">
    这通常是原生 Windows shell 的控制台代码页不匹配问题。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同样的命令在另一个终端配置中显示正常

    PowerShell 中的快速变通方案：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然后重启 Gateway 网关并重试你的命令：

    ```powershell
    openclaw gateway restart
    ```

    如果你在最新 OpenClaw 上仍能复现此问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题，我怎样才能得到更好的答案？">
    使用**可修改的（git）安装**，这样你本地就有完整源码和文档，然后
    在_那个文件夹里_向你的 bot（或 Claude/Codex）提问，
    让它读取仓库并给出准确答案。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节：[安装](/zh-CN/install) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装：[Linux](/zh-CN/platforms/linux)。
    - 完整演练：[入门指南](/zh-CN/start/getting-started)。
    - 安装器 + 更新：[安装与更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。在服务器上安装，然后通过 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护了一个**托管中心**，列出了常见提供商。选一个并按指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，你通过
    Control UI（或 Tailscale/SSH）从笔记本/手机访问它。你的状态 + 工作区
    都保存在服务器上，因此应将该主机视为真实来源并做好备份。

    你可以将**节点**（Mac/iOS/Android/headless）配对到这个云端 Gateway 网关，
    以访问本地屏幕/摄像头/canvas，或在笔记本上运行命令，同时将
    Gateway 网关保留在云端。

    中心页：[平台](/zh-CN/platforms)。远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。
    节点：[节点](/zh-CN/nodes)、[节点 CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（从而中断当前会话），可能需要一个干净的 git 检出，
    还可能要求确认。更安全的方式是：由操作员在 shell 中运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体中自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[更新](/cli/update)、[更新中](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在 **local mode** 中，它会引导你完成：

    - **模型/认证设置**（提供商 OAuth、API 密钥、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + bootstrap 文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd user unit）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少认证，它还会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用 **API 密钥**（Anthropic/OpenAI/其他）运行 OpenClaw，
    也可以使用**纯本地模型**，让数据留在你的设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）是这些提供商的可选认证方式。

    在 OpenClaw 中，对 Anthropic 来说，实际区分如下：

    - **Anthropic API key**：普通的 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude subscription auth**：Anthropic 员工
      告诉我们这种用法再次被允许，OpenClaw 会将 `claude -p`
      用法视为该集成的许可用法，除非 Anthropic 发布新政策

    对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是
    更可预测的设置方式。OpenAI Codex OAuth 则被明确支持用于
    OpenClaw 这样的外部工具。

    OpenClaw 也支持其他托管的订阅式选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API key 的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    OpenClaw 将 Claude subscription auth 和 `claude -p` 用法视为该集成中被许可的方式，
    除非 Anthropic 发布新政策。如果你想要
    最可预测的服务器端设置，还是建议改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证吗（Claude Pro 或 Max）？">
    支持。

    Anthropic 员工告诉我们这种用法再次被允许，因此 OpenClaw 认为
    Claude CLI 复用和 `claude -p` 用法在该集成中是被许可的，
    除非 Anthropic 发布新的政策。

    Anthropic setup-token 仍然可作为受支持的 OpenClaw 令牌路径，但 OpenClaw 现在在可用时优先使用 Claude CLI 复用和 `claude -p`。
    对于生产环境或多用户工作负载，Anthropic API key 认证仍然是
    更安全、更可预测的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参见 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
这意味着你在当前窗口内的 **Anthropic 配额/速率限制**已耗尽。如果你
使用 **Claude CLI**，请等待窗口重置或升级套餐。如果你
使用 **Anthropic API key**，请检查 Anthropic Console
中的使用量/计费，并根据需要提高限制。

    如果消息特别是：
    `Extra usage is required for long context requests`，说明请求正在尝试使用
    Anthropic 的 1M context beta（`context1m: true`）。这只有在你的
    凭证有资格进行长上下文计费时才可用（API key 计费，或启用了 Extra Usage 的
    OpenClaw Claude-login 路径）。

    提示：设置一个**回退模型**，这样在某个提供商被限流时，OpenClaw 仍能继续回复。
    参见 [模型](/cli/models)、[OAuth](/zh-CN/concepts/oauth)，以及
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。在存在 AWS 环境标记时，OpenClaw 可以自动发现流式/文本 Bedrock 目录，并将其作为隐式 `amazon-bedrock` 提供商合并；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或手动添加 provider 条目。参见 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你更喜欢托管密钥流程，在 Bedrock 前面加一个 OpenAI 兼容代理也是有效方案。
  </Accordion>

  <Accordion title="Codex 认证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。新手引导可以运行 OAuth 流程，并会在适当时将默认模型设置为 `openai-codex/gpt-5.4`。参见 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 ChatGPT GPT-5.4 不会解锁 OpenClaw 中的 openai/gpt-5.4？">
    OpenClaw 将这两条路径分开处理：

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 直接 OpenAI Platform API

    在 OpenClaw 中，ChatGPT/Codex 登录连接到 `openai-codex/*` 路径，
    而不是直接的 `openai/*` 路径。如果你想在
    OpenClaw 中使用直接 API 路径，请设置 `OPENAI_API_KEY`（或等效的 OpenAI provider 配置）。
    如果你想在 OpenClaw 中使用 ChatGPT/Codex 登录，请使用 `openai-codex/*`。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能与 ChatGPT 网页版不同？">
    `openai-codex/*` 使用 Codex OAuth 路径，其可用配额窗口
    由 OpenAI 管理，并且取决于套餐。实际上，这些限制可能与
    ChatGPT 网站/应用的体验不同，即使两者绑定的是同一个账号。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的 provider 使用量/配额窗口，但它不会凭空生成或将 ChatGPT 网页版
    权益标准化为直接 API 访问。如果你想要直接的 OpenAI Platform
    计费/限额路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这样的外部工具/工作流中
    使用订阅 OAuth。新手引导可以为你运行该 OAuth 流程。

    参见 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件认证流程**，而不是在 `openclaw.json` 中配置 `client id` 或 `secret`。

    步骤：

    1. 在本地安装 Gemini CLI，让 `gemini` 出现在 `PATH` 中
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 gateway host 上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth 令牌存储在 gateway host 上的 auth profile 中。详情见：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常闲聊吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小卡模型会截断并泄漏。如果你必须使用，请在本地运行你能承受的**最大**模型构建（LM Studio），并参见 [/gateway/local-models](/zh-CN/gateway/local-models)。较小/量化后的模型会增加 prompt injection 风险 —— 参见 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量始终位于特定区域？">
    选择固定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可让数据保持在该区域内。你仍然可以通过 `models.mode: "merge"` 将 Anthropic/OpenAI 一并列出，以便在尊重所选区域提供商的同时保留回退能力。
  </Accordion>

  <Accordion title="安装这个一定要买一台 Mac Mini 吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 是可选的 —— 有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在你需要**仅限 macOS 的工具**时才必须用 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）—— BlueBubbles 服务器运行在任意 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你还想用其他仅限 macOS 的工具，可以在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[节点](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="支持 iMessage 一定要有 Mac mini 吗？">
    你需要**某台已登录 Messages 的 macOS 设备**。它**不一定**是 Mac mini —— 任何 Mac 都可以。对于 iMessage，**请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）—— BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，在任意已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，也可以把所有东西都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[节点](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，还能连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不运行 Gateway 网关 —— 它们提供额外的
    能力，比如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（常开）。
    - MacBook Pro 运行 macOS 应用或 node host，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    对于稳定的 Gateway 网关，请使用 **Node**。

    如果你仍然想尝试 Bun，请在非生产 Gateway 网关上实验，
    并且不要启用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里该填什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram user ID**（数字），不是 bot 用户名。

    新手引导接受 `@username` 输入，并会解析成数字 ID，但 OpenClaw 授权只使用数字 ID。

    更安全的方式（无需第三方 bot）：

    - 给你的 bot 发私信，然后运行 `openclaw logs --follow`，读取 `from.id`。

    官方 Bot API：

    - 给你的 bot 发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates`，读取 `message.from.id`。

    第三方方式（隐私性较差）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    参见 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个不同的 OpenClaw 实例可以共用一个 WhatsApp 号码吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 格式如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会拥有各自的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账号**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账号来说是全局的。参见 [多智能体路由](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：给每个智能体设置自己的默认模型，然后将入站路由（provider 账号或特定 peers）绑定到各自的智能体。示例配置位于 [多智能体路由](/zh-CN/concepts/multi-agent)。另请参见 [模型](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上运行吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），以便 `brew` 安装的工具在非登录 shell 中也能被解析。
    最新版本还会在 Linux systemd 服务中预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时尊重 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装和 npm install 有什么区别">
    - **可修改的（git）安装：**完整源码检出、可编辑，最适合贡献者。
      你需要在本地运行构建，也可以修改代码/文档。
    - **npm install：**全局 CLI 安装，没有仓库，最适合“直接运行”。
      更新来自 npm dist-tag。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后可以在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种形式，然后运行 Doctor，让 gateway service 指向新的入口点。
    这**不会删除你的数据** —— 它只会更改 OpenClaw 代码的安装方式。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）会保持不变。

    从 npm 切换到 git：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    从 git 切换到 npm：

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor 会检测 gateway service 入口点不匹配，并提供将服务配置重写为当前安装方式的选项（在自动化中使用 `--repair`）。

    备份建议：参见 [备份策略](#磁盘上的文件位置)。

  </Accordion>

  <Accordion title="我应该把 Gateway 网关运行在笔记本上还是 VPS 上？">
    简短回答：**如果你需要 24/7 可靠性，请使用 VPS**。如果你希望
    阻力最低，并且可以接受休眠/重启，那就在本地运行。

    **笔记本（本地 Gateway 网关）**

    - **优点：**无服务器成本，直接访问本地文件，可见的浏览器窗口。
    - **缺点：**休眠/网络中断 = 断连，操作系统更新/重启会中断，必须保持唤醒。

    **VPS / 云端**

    - **优点：**常开、网络稳定、没有笔记本休眠问题、更容易持续运行。
    - **缺点：**通常无头运行（使用截图）、只能远程访问文件、你必须通过 SSH 更新。

    **OpenClaw 特定说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 都可以很好地运行在 VPS 上。真正的权衡只是**无头浏览器**与可见窗口。参见 [浏览器](/zh-CN/tools/browser)。

    **推荐默认方案：**如果你以前遇到过 gateway 断开连接，请使用 VPS。本地运行则非常适合你正在主动使用 Mac，并且想要本地文件访问或使用带可见浏览器的 UI 自动化时。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但**建议这样做，以提高可靠性和隔离性**。

    - **专用主机（VPS/Mac mini/Pi）：**常开，睡眠/重启中断更少，权限更清晰，更容易持续运行。
    - **共用笔记本/台式机：**用于测试和主动使用完全没问题，但机器休眠或更新时会出现暂停。

    如果你想两全其美，可以将 Gateway 网关保留在专用主机上，并把笔记本作为**节点**配对，以提供本地屏幕/摄像头/exec 工具。参见 [节点](/zh-CN/nodes)。
    关于安全指导，请阅读 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于一个基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低：**1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐：**1-2 vCPU、2GB RAM 或更多，以获得余量（日志、媒体、多渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任意现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试得最好。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？有什么要求？">
    可以。把 VM 当成 VPS 即可：它需要始终运行、可被访问，并且有足够的
    内存用于 Gateway 网关和你启用的任何渠道。

    基线建议：

    - **绝对最低：**1 vCPU、1GB RAM。
    - **推荐：**如果你运行多个渠道、浏览器自动化或媒体工具，建议 2GB RAM 或更多。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你在 Windows 上，**WSL2 是最简单的 VM 风格设置**，并且工具兼容性最好。
    参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话说明什么是 OpenClaw？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等内置渠道插件），并且在受支持的平台上还支持语音 + 实时 Canvas。**Gateway 网关**是始终在线的控制平面；这个助手本身才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 并不只是“一个 Claude 包装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件**上运行一个
    能力强大的助手，并通过你已在使用的聊天应用访问它，同时拥有
    有状态的会话、记忆和工具 —— 无需把你的工作流控制权交给托管式
    SaaS。

    亮点：

    - **你的设备，你的数据：**在任何你想要的地方运行 Gateway 网关（Mac、Linux、VPS），并保持
      工作区 + 会话历史保留在本地。
    - **真实渠道，而不是 Web 沙箱：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      以及受支持平台上的移动语音和 Canvas。
    - **模型无关：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      和故障切换。
    - **纯本地选项：**运行本地模型，这样**所有数据都可以保留在你的设备上**。
    - **多智能体路由：**按渠道、账号或任务拆分不同智能体，每个都有自己的
      工作区和默认配置。
    - **开源且可修改：**可检查、可扩展、可自托管，没有厂商锁定。

    文档：[Gateway 网关](/zh-CN/gateway)、[渠道](/zh-CN/channels)、[多智能体](/zh-CN/concepts/multi-agent)、
    [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好它 —— 现在先做什么？">
    适合上手的第一个项目：

    - 搭建一个网站（WordPress、Shopify，或简单静态站点）。
    - 原型设计一个移动应用（大纲、界面、API 方案）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动生成摘要或跟进项。

    它能处理大型任务，但如果你将任务拆分为多个阶段，并
    使用子智能体进行并行工作，效果通常会更好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常高价值场景通常是：

    - **个人简报：**你关心的收件箱、日历和新闻摘要。
    - **研究与起草：**快速研究、总结，以及邮件或文档的初稿。
    - **提醒与跟进：**由 cron 或 heartbeat 驱动的提醒和清单。
    - **浏览器自动化：**填写表单、收集数据、重复性网页任务。
    - **跨设备协作：**从手机发起任务，让 Gateway 网关在服务器上运行，然后把结果返回到聊天中。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    对于**研究、筛选和起草**来说可以。它可以扫描网站、建立候选清单、
    总结潜在客户信息，并撰写外联内容或广告文案草稿。

    对于**外联或广告投放**，请保留人工参与。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审查所有内容。最安全的模式是让
    OpenClaw 起草，由你审批。

    文档：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，它在 Web 开发上的优势是什么？">
    OpenClaw 是一个**个人助手**和协调层，而不是 IDE 替代品。在仓库内进行最快的直接编码循环时，
    请使用 Claude Code 或 Codex。当你
    需要持久记忆、跨设备访问和工具编排时，再使用 OpenClaw。

    优势：

    - **持久记忆 + 工作区**，跨会话保留
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（运行在 VPS 上，随时随地交互）
    - 用于本地浏览器/屏幕/摄像头/exec 的**节点**

    展示页：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何自定义 skills，同时不让仓库变脏？">
    使用受管覆盖，而不是直接编辑仓库里的副本。把你的修改放到 `~/.openclaw/skills/<name>/SKILL.md`（或者通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加一个文件夹）。优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此受管覆盖仍会优先于内置 skills，而无需修改 git。如果你希望该 skill 全局安装但只对某些智能体可见，请将共享副本保存在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的修改才应该保留在仓库中，并通过 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果这个 skill 只应对特定智能体可见，请结合 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    目前支持的模式有：

    - **Cron jobs**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：把任务路由到不同默认模型的独立智能体。
    - **按需切换**：随时使用 `/model` 切换当前会话模型。

    参见 [Cron jobs](/zh-CN/automation/cron-jobs)、[多智能体路由](/zh-CN/concepts/multi-agent) 和 [Slash 命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="bot 在处理繁重任务时会卡住。如何把这类工作卸载出去？">
    对于长时间或并行任务，请使用**子智能体**。子智能体在自己的会话中运行，
    返回一个摘要，并让你的主聊天保持响应。

    你可以让 bot “为这个任务启动一个子智能体”，或使用 `/subagents`。
    使用聊天中的 `/status` 查看 Gateway 网关当前在做什么（以及它是否繁忙）。

    令牌提示：长任务和子智能体都会消耗令牌。如果你关心成本，请通过
    `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上与线程绑定的 subagent 会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个子智能体或会话目标，这样该线程中的后续消息会持续保留在该绑定会话中。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 启动（也可以额外设置 `mode: "session"`，用于持久后续交互）。
    - 或使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消 focus。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[子智能体](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[配置参考](/zh-CN/gateway/configuration-reference)、[Slash 命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体完成了，但完成通知发到了错误的地方或根本没发出来。我应该检查什么？">
    先检查解析后的请求者路由：

    - 完成模式下的子智能体投递会优先使用任何已绑定的线程或会话路由。
    - 如果完成来源只携带一个渠道，OpenClaw 会回退到请求者会话保存的路由（`lastChannel` / `lastTo` / `lastAccountId`），这样直接投递仍有可能成功。
    - 如果既没有绑定路由，也没有可用的已保存路由，直接投递可能失败，结果会回退到排队的会话投递，而不是立即发到聊天中。
    - 无效或过期的目标仍可能导致队列回退或最终投递失败。
    - 如果子任务最后一个可见的 assistant 回复正好是静默令牌 `NO_REPLY` / `no_reply`，或正好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制通知，而不是发布先前的过期进度。
    - 如果子任务在只执行了工具调用后超时，通知可能会将其折叠为简短的部分进度摘要，而不是回放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[会话工具](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我应该检查什么？">
    Cron 在 Gateway 网关进程内运行。如果 Gateway 网关没有持续运行，
    计划任务就不会执行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 持续运行（没有休眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但没有向渠道发送任何内容。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示预期不会有任何外部消息。
    - 缺失或无效的通知目标（`channel` / `to`）表示运行器跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）表示运行器尝试投递了，但凭证阻止了它。
    - 静默隔离结果（仅有 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此运行器也会抑制排队回退投递。

    对于隔离的 cron 作业，最终投递由运行器负责。预期
    智能体返回一个纯文本摘要，供运行器发送。`--no-deliver` 会将
    该结果保留在内部；它并不会让智能体改用
    message 工具直接发送。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么一个隔离的 cron 运行会切换模型或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离 cron 可以在活跃运行抛出 `LiveSessionModelSwitchError` 时，
    持久化一次运行时模型切换并重试。重试会保留切换后的
    provider/model，如果切换还带来了新的 auth profile 覆盖，cron
    也会在重试前将其持久化。

    相关选择规则：

    - 若适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每个作业的 `model`。
    - 然后是任何已存储的 cron-session 模型覆盖。
    - 最后才是正常的智能体/默认模型选择。

    重试循环是有边界的。在初始尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或将 Skills 放入你的工作区。macOS 的 Skills UI 在 Linux 上不可用。
    可在 [https://clawhub.ai](https://clawhub.ai) 浏览 Skills。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 会写入当前工作区的 `skills/`
    目录。只有当你想发布或同步自己的 Skills 时，才需要额外安装 `clawhub` CLI。如果要在多个智能体间共享安装，请把 skill 放在
    `~/.openclaw/skills` 下，并使用 `agents.defaults.skills` 或
    `agents.list[].skills` 限制哪些智能体可以看到它。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或者持续在后台工作吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs** 用于计划任务或重复任务（重启后仍会保留）。
    - **Heartbeat** 用于“主会话”的周期性检查。
    - **隔离作业**用于可自主运行、并发布摘要或投递到聊天中的智能体。

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以在 Linux 上运行仅限 Apple macOS 的 skills 吗？">
    不能直接运行。macOS skills 受 `metadata.openclaw.os` 和所需二进制文件限制，只有在它们在 **Gateway host** 上符合条件时，skills 才会出现在 system prompt 中。在 Linux 上，`darwin` 专属技能（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖这一限制。

    你有三种受支持的模式：

    **方案 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的地方运行 Gateway 网关，然后通过 [远程模式](#gateway-ports-already-running-and-remote-mode) 或 Tailscale 从 Linux 连接。由于 Gateway host 是 macOS，这些技能会正常加载。

    **方案 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并将 Mac 上的 **Node Run Commands** 设置为 “Always Ask” 或 “Always Allow”。当所需二进制文件存在于节点上时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。智能体会通过 `nodes` 工具运行这些技能。如果你选择 “Always Ask”，在提示中批准 “Always Allow” 会将该命令加入 allowlist。

    **方案 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    将 Gateway 网关保留在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖该 skill，使其允许在 Linux 上使用，以保持其符合条件。

    1. 为二进制文件创建一个 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 主机的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖 skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: 通过 macOS 上的 memo CLI 管理 Apple Notes。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，让 skills 快照刷新。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    方案：

    - **自定义 skill / plugin：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需写代码，但更慢且更脆弱。

    如果你想为每个客户保留上下文（代理机构工作流），一种简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在会话开始时先抓取该页面。

    如果你想要原生集成，请提交功能请求或构建一个
    面向这些 API 的 skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落到当前工作区的 `skills/` 目录。对于跨智能体共享的 skills，请把它们放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只想让部分智能体看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。有些 skills 依赖通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（见上面的 Homebrew Linux 常见问题）。参见 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我当前已登录的 Chrome？">
    使用内置的 `user` 浏览器配置，它会通过 Chrome DevTools MCP 进行附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，可以创建一个显式 MCP 配置：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这条路径是主机本地的。如果 Gateway 网关运行在别处，请在浏览器所在机器上运行一个 node host，或者改用远程 CDP。

    `existing-session` / `user` 当前的限制：

    - 操作是基于 ref 的，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，并且目前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器或原始 CDP 配置

  </Accordion>
</AccordionGroup>

## 沙箱隔离和记忆

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。关于 Docker 特定设置（在 Docker 中运行完整 gateway 或沙箱镜像），请参见 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉功能受限 —— 如何启用完整功能？">
    默认镜像以安全优先方式运行，使用 `node` 用户，因此
    不包含系统软件包、Homebrew 或内置浏览器。若想获得更完整的设置：

    - 持久化 `/home/node` 并使用 `OPENCLAW_HOME_VOLUME`，这样缓存可以保留。
    - 通过 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保该路径被持久化。

    文档：[Docker](/zh-CN/install/docker)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以只用一个智能体，让私信保持私密，而群组公开/沙箱隔离吗？">
    可以 —— 前提是你的私密流量是**私信**，而公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非 main 键）会在 Docker 中运行，而主私信会话仍在主机上运行。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置：[群组：个人私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 网关配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何把主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局和每个智能体的绑定会合并；当 `scope: "shared"` 时，每个智能体的绑定会被忽略。对于敏感内容请使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会根据标准化路径以及通过最深存在祖先解析出的规范路径来验证绑定源。这意味着，即使最后一个路径段还不存在，通过符号链接父目录逃逸的情况也会被安全地拒绝，同时在符号链接解析后允许根目录检查仍然适用。

    示例和安全说明请参见 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 的记忆就是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中整理后的长期笔记（仅主/私密会话）

    OpenClaw 还会运行一次**静默的预压缩记忆刷新**，提醒模型
    在自动压缩前写下持久笔记。只有在工作区
    可写时才会运行（只读沙箱会跳过）。参见 [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="记忆总是忘事。如何让它记住？">
    让 bot **把这个事实写入记忆**。长期笔记应写入 `MEMORY.md`，
    短期上下文则放入 `memory/YYYY-MM-DD.md`。

    这是我们仍在持续改进的领域。提醒模型存储记忆会有帮助；
    它知道该怎么做。如果它总是忘记，请确认 Gateway 网关每次运行使用的
    是同一个工作区。

    文档：[记忆](/zh-CN/concepts/memory)、[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保留吗？有什么限制？">
    记忆文件保存在磁盘上，除非你删除，否则会一直存在。限制来自你的
    存储空间，而不是模型。**会话上下文**仍然受模型上下文窗口限制，
    因此长对话可能会被压缩或截断。这就是为什么有
    记忆搜索 —— 它只会把相关部分拉回上下文。

    文档：[记忆](/zh-CN/concepts/memory)、[上下文](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索必须要有 OpenAI API key 吗？">
    只有当你使用 **OpenAI embeddings** 时才需要。Codex OAuth 只覆盖聊天/补全，
    **不**授予 embeddings 访问权限，因此**仅通过 Codex 登录（OAuth 或
    Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI embeddings
    仍然需要真实 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置 provider，OpenClaw 会在
    它能解析出 API key 时自动选择 provider（auth profile、`models.providers.*.apiKey` 或环境变量）。
    如果能解析出 OpenAI key，它会优先选择 OpenAI；否则若能解析出 Gemini key，则选择 Gemini；然后是 Voyage，再然后是 Mistral。如果没有可用的远程 key，记忆
    搜索会保持禁用，直到你完成配置。如果你已配置并存在本地模型路径，OpenClaw
    会优先选择 `local`。如果你显式设置
    `memorySearch.provider = "ollama"`，也支持 Ollama。

    如果你更倾向于完全本地，请设置 `memorySearch.provider = "local"`（以及可选的
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"`，并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型 —— 设置详情见 [记忆](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的文件位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都会保存在本地吗？">
    不会 —— **OpenClaw 的状态保存在本地**，但**外部服务仍然会看到你发给它们的内容**。

    - **默认保存在本地：**会话、记忆文件、配置和工作区保存在 Gateway host 上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需求而远程：**你发送给模型提供商（Anthropic/OpenAI 等）的消息会发往
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会在
      它们的服务器上存储消息数据。
    - **你可以控制暴露范围：**使用本地模型可让提示保留在你的机器上，但渠道
      流量仍会经过对应渠道的服务器。

    相关内容：[智能体工作区](/zh-CN/concepts/agent-workspace)、[记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存储在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）下：

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到 auth profile）                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API 密钥，以及可选的 `keyRef`/`tokenRef`） |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 的可选文件后备 secret 载荷               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每个智能体的状态（agentDir + sessions）                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史与状态（按智能体划分）                                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体划分）                                         |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、Skills 等）是单独的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**中，而不是 `~/.openclaw`。

    - **工作区（每个智能体）：**`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`（当 `MEMORY.md` 不存在时，会退回到旧版 `memory.md`），
      `memory/YYYY-MM-DD.md`，以及可选的 `HEARTBEAT.md`。
    - **状态目录（`~/.openclaw`）：**配置、渠道/提供商状态、auth profiles、sessions、logs，
      以及共享 skills（`~/.openclaw/skills`）。

    默认工作区为 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果 bot 在重启后“忘记”了内容，请确认 Gateway 网关每次启动使用的
    都是同一个工作区（并记住：remote 模式使用的是 **gateway host**
    的工作区，而不是你本地笔记本的）。

    提示：如果你想保留一个持久的行为或偏好，请让 bot **把它写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    参见 [智能体工作区](/zh-CN/concepts/agent-workspace) 和 [记忆](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的**智能体工作区**放入一个**私有** git 仓库中，并备份到某个
    私有位置（例如 GitHub 私有仓库）。这可以保留记忆 + AGENTS/SOUL/USER
    文件，并让你以后能恢复这个助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、令牌或加密 secrets 载荷）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （参见上面的迁移问题）。

    文档：[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全卸载 OpenClaw？">
    请参见专门指南：[卸载](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径可以访问其他
    主机位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每个智能体的沙箱设置。如果你
    想让某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源码；除非你有意让智能体在其中工作，否则请将
    工作区与其分开。

    示例（将仓库作为默认 cwd）：

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="远程模式：会话存储在哪里？">
    会话状态由 **gateway host** 持有。如果你处于 remote 模式，你关心的会话存储位于远程机器上，而不是本地笔记本上。参见 [会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件不存在，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在没有任何监听 / UI 提示 unauthorized'>
    非 loopback bind **需要有效的 gateway auth 路径**。实际上这意味着：

    - 共享密钥认证：令牌或密码
    - 在正确配置的非 loopback 身份感知反向代理后使用 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    说明：

    - `gateway.remote.token` / `.password` **本身**不会启用本地 gateway auth。
    - 只有当 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 作为回退。
    - 对于密码认证，请改为设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未能解析，解析会失败并保持关闭（不会用 remote 回退来掩盖问题）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（存储在 app/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的身份携带模式则改用请求头。避免把共享密钥放进 URL。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理**仍然不能**满足 trusted-proxy 认证。trusted proxy 必须是一个已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要令牌？">
    OpenClaw 默认强制启用 gateway auth，包括 loopback。在正常默认路径下，这意味着 token 认证：如果没有配置显式认证路径，gateway 启动时会解析为 token 模式并自动生成一个令牌，保存到 `gateway.auth.token`，因此**本地 WS 客户端也必须认证**。这可以阻止其他本地进程调用 Gateway 网关。

    如果你更喜欢其他认证路径，可以显式选择 password 模式（或者，对于非 loopback 的身份感知反向代理，可选 `trusted-proxy`）。如果你**真的**想开放 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可随时帮你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="修改配置后必须重启吗？">
    Gateway 网关会监视配置，并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全变更热应用，关键变更则重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何关闭有趣的 CLI 标语？">
    在配置中设置 `cli.banner.taglineMode`：

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`：隐藏标语文本，但保留 banner 标题/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你想完全隐藏 banner，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及 Web 抓取）？">
    `web_fetch` 无需 API key 即可工作。`web_search` 取决于你选择的
    provider：

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily 等基于 API 的 provider 需要它们正常的 API key 设置。
    - Ollama Web 搜索不需要 key，但会使用你配置的 Ollama 主机，并且需要 `ollama signin`。
    - DuckDuckGo 不需要 key，但它是一个非官方的基于 HTML 的集成。
    - SearXNG 不需要 key/可自托管；请配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：**运行 `openclaw configure --section web` 并选择一个 provider。
    环境变量替代方式：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：`XAI_API_KEY`
    - Kimi：`KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity：`PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG：`SEARXNG_BASE_URL`
    - Tavily：`TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // 可选；省略则自动检测
            },
          },
        },
    }
    ```

    提供商特定的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧的 `tools.web.search.*` provider 路径目前仍会为了兼容而临时加载，但不应再用于新配置。
    Firecrawl 的 Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用 allowlist，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非被显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个就绪的抓取回退 provider。目前内置 provider 是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。如何恢复并避免这种情况？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其他所有内容
    都会被移除。

    恢复方式：

    - 从备份恢复（git 或复制的 `~/.openclaw/openclaw.json`）。
    - 如果没有备份，请重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这超出预期，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史重建一个可工作的配置。

    避免方式：

    - 小改动请使用 `openclaw config set`。
    - 交互式编辑请使用 `openclaw configure`。
    - 如果你不确定精确路径或字段结构，先使用 `config.schema.lookup`；它会返回浅层 schema 节点以及直接子项摘要，方便逐层钻取。
    - 对于部分 RPC 编辑，请使用 `config.patch`；仅在你确实要替换完整配置时才用 `config.apply`。
    - 如果你在智能体运行中使用仅限 owner 的 `gateway` 工具，它仍然会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会被标准化到同一受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/cli/config)、[Configure](/cli/configure)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何运行一个中央 Gateway 网关，并让不同设备承担专门工作？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中央）：**负责渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：**Mac/iOS/Android 作为外围设备连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作者）：**用于特殊角色的独立大脑/工作区（例如“Hetzner 运维”“个人数据”）。
    - **子智能体：**当你想并行工作时，从主智能体中启动后台任务。
    - **TUI：**连接到 Gateway 网关并切换智能体/会话。

    文档：[节点](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以无头运行吗？">
    可以。这是一个配置选项：

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    默认值为 `false`（有头）。无头模式更容易在某些网站上触发反机器人检查。参见 [浏览器](/zh-CN/tools/browser)。

    无头模式使用**同一个 Chromium 引擎**，适用于大多数自动化任务（表单、点击、抓取、登录）。主要区别是：

    - 没有可见的浏览器窗口（如果你需要可视化，请使用截图）。
    - 某些网站对无头模式下的自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会阻止无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参见 [浏览器](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 网关和节点之间传播？">
    Telegram 消息由 **gateway** 处理。gateway 运行智能体，
    只有在需要节点工具时，才会通过**Gateway WebSocket**
    调用节点：

    Telegram → Gateway → 智能体 → `node.*` → 节点 → Gateway → Telegram

    节点看不到入站 provider 流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程，我的智能体如何访问我的电脑？">
    简短回答：**把你的电脑配对成一个节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 调用你本地机器上的 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终在线的主机（VPS/家庭服务器）上运行 Gateway 网关。
    2. 将 Gateway host 和你的电脑放在同一个 tailnet 中。
    3. 确保 Gateway WS 可达（tailnet bind 或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以 **Remote over SSH** 模式（或直接 tailnet）
       连接，这样它就可以注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；节点通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS 节点意味着允许在该机器上执行 `system.run`。只
    配对你信任的设备，并查看 [安全](/zh-CN/gateway/security)。

    文档：[节点](/zh-CN/nodes)、[Gateway 协议](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到任何回复。怎么办？">
    检查基础项：

    - Gateway 网关正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确认 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立并指向正确端口。
    - 确认你的 allowlist（私信或群组）包含你的账号。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[渠道](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。没有内置的“bot-to-bot”桥接，但你可以通过几种
    可靠方式把它们连起来：

    **最简单：**使用双方 bot 都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 向 Bot B 发送消息，然后让 Bot B 像平时一样回复。

    **CLI bridge（通用）：**运行一个脚本，通过
    `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，目标是另一个 bot
    正在监听的聊天。如果其中一个 bot 在远程 VPS 上，请让你的 CLI 指向那个远程 Gateway 网关，
    可通过 SSH/Tailscale（参见 [远程访问](/zh-CN/gateway/remote)）。

    示例模式（从能够访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：请添加防护规则，避免两个 bot 无休止地互相循环回复（例如仅在被提及时回复、使用渠道
    allowlist，或设定“不回复 bot 消息”的规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[智能体 CLI](/cli/agent)、[智能体发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要分别使用不同的 VPS 吗？">
    不需要。一个 Gateway 网关可以承载多个智能体，每个智能体都有自己的工作区、模型默认值
    和路由。这是最常见的设置方式，比起
    每个智能体一台 VPS 更便宜也更简单。

    只有在你需要硬隔离（安全边界）或非常
    不同且不希望共享的配置时，才需要分别使用不同的 VPS。否则，请保留一个 Gateway 网关，
    使用多个智能体或子智能体即可。

  </Accordion>

  <Accordion title="与从 VPS 通过 SSH 访问相比，在我的个人笔记本上使用节点有好处吗？">
    有 —— 节点是从远程 Gateway 网关访问你笔记本的一等方式，而且
    它的能力不止于 shell 访问。Gateway 网关可运行在 macOS/Linux 上（Windows 通过 WSL2），并且
    很轻量（小型 VPS 或 Raspberry Pi 级别的设备就足够；4 GB RAM 完全够用），因此一种常见
    设置是常开主机 + 你的笔记本作为节点。

    - **不需要入站 SSH。**节点会主动连出到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。**`system.run` 受该笔记本上的节点 allowlist/approval 控制。
    - **更多设备工具。**除了 `system.run`，节点还提供 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。**将 Gateway 网关保留在 VPS 上，但通过笔记本上的 node host 本地运行 Chrome，或通过 Chrome MCP 附加到主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续性的智能体工作流和
    设备自动化来说，节点更简单。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/cli/nodes)、[浏览器](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行 gateway 服务吗？">
    不会。除非你有意运行隔离的配置文件（参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)），否则每台主机上通常只应运行**一个 gateway**。节点是连接到
    gateway 的外围设备（iOS/Android 节点，或菜单栏应用中的 macOS “node mode”）。关于无头 node
    host 和 CLI 控制，请参见 [Node host CLI](/cli/node)。

    对 `gateway`、`discovery` 和 `canvasHost` 的更改都需要完整重启。

  </Accordion>

  <Accordion title="有没有 API / RPC 方式来应用配置？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树，包括其浅层 schema 节点、匹配的 UI 提示和直接子项摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的部分更新（大多数 RPC 编辑的首选）；尽可能热重载，必要时重启
    - `config.apply`：验证 + 替换完整配置；尽可能热重载，必要时重启
    - 仅限 owner 的 `gateway` 运行时工具仍然拒绝改写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会标准化到同样受保护的 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制谁可以触发 bot。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale，并从 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在 Mac 上安装并登录**
       - 使用 Tailscale 应用并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，让 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情况下访问 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 gateway 保持绑定到 loopback，并通过 Tailscale 暴露 HTTPS。参见 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露**Gateway 控制 UI + WS**。节点通过相同的 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS + Mac 在同一个 tailnet 中**。
    2. **在 macOS 应用中使用 Remote 模式**（SSH 目标可以是 tailnet 主机名）。
       应用会对 Gateway 端口建立隧道，并作为节点连接。
    3. **在 gateway 上批准该节点：**

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 协议](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（屏幕/摄像头/exec），请把它作为
    **节点**添加。这样可以保持单一 Gateway 网关，并避免重复配置。当前本地节点工具
    仅支持 macOS，但我们计划扩展到其他操作系统。

    只有在你需要**硬隔离**或两个完全独立的 bot 时，才安装第二个 Gateway 网关。

    文档：[节点](/zh-CN/nodes)、[节点 CLI](/cli/nodes)、[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 从父进程（shell、launchd/systemd、CI 等）读取环境变量，另外还会加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）的全局回退 `.env`

    这两个 `.env` 文件都不会覆盖已存在的环境变量。

    你也可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整优先级和来源请参见 [/environment](/zh-CN/help/environment)。

  </Accordion>

  <Accordion title="我通过服务启动 Gateway 网关后，环境变量消失了。怎么办？">
    两个常见修复方法：

    1. 把缺失的键放到 `~/.openclaw/.env` 中，这样即使服务没有继承你的 shell 环境，也能读取到。
    2. 启用 shell 导入（可选的便捷功能）：

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    这会运行你的登录 shell，并且只导入缺失的预期键名（绝不覆盖）。对应环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 “Shell env: off.”。为什么？'>
    `openclaw models status` 报告的是**是否启用了 shell 环境导入**。“Shell env: off”
    **不**表示你的环境变量丢失了 —— 它只是意味着 OpenClaw 不会
    自动加载你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。你可以通过以下任一方式修复：

    1. 把令牌放到 `~/.openclaw/.env` 中：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其加入配置中的 `env` 块（仅在缺失时应用）。

    然后重启 gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot 令牌会从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    参见 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一个全新的对话？">
    发送 `/new` 或 `/reset` 作为单独的一条消息。参见 [会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 后过期，但这**默认是关闭的**（默认值为 **0**）。
    将其设置为正值即可启用空闲过期。启用后，在空闲期结束后的**下一条**
    消息会为该聊天键启动一个新的会话 id。
    这不会删除转录内容 —— 只是开始一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建一个 OpenClaw 实例团队（一个 CEO 和许多智能体）？">
    可以，通过**多智能体路由**和**子智能体**来实现。你可以创建一个协调者
    智能体，以及多个拥有各自工作区和模型的工作智能体。

    不过，更适合把这看作一个**有趣的实验**。它会消耗很多令牌，而且
    通常不如使用一个 bot 搭配多个会话高效。我们更倾向于的典型模式是：
    你只跟一个 bot 交流，但为并行工作保留不同会话。那个
    bot 也可以在需要时生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[智能体 CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么任务进行到一半时上下文被截断了？如何避免？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或很多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让 bot 总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让 bot 重新读回来。
    - 对长时间或并行工作使用子智能体，让主聊天保持更小。
    - 如果这种情况经常发生，请选择一个上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw，但保留安装？">
    使用重置命令：

    ```bash
    openclaw reset
    ```

    非交互式完整重置：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然后重新运行设置：

    ```bash
    openclaw onboard --install-daemon
    ```

    说明：

    - 如果检测到现有配置，新手引导也会提供**重置**选项。参见 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发用；会清空开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我收到“context too large”错误 —— 如何重置或压缩？'>
    使用以下方式之一：

    - **压缩**（保留对话，但总结较早的轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来指导摘要内容。

    - **重置**（针对同一聊天键启动新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果它总是发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`），以裁剪旧的工具输出。
    - 使用上下文窗口更大的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话修剪](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到“LLM request rejected: messages.content.tool_use.input field required”？'>
    这是 provider 验证错误：模型输出了一个缺少必需
    `input` 的 `tool_use` 块。通常意味着会话历史陈旧或损坏（常见于长线程
    或工具/schema 更改之后）。

    解决方法：发送 `/new`（单独一条消息）以开始一个新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟会收到一次 heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 认证时为 **1h**）。可调整或禁用它们：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 以禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上是空的（只有空行和 markdown
    标题如 `# Heading`），OpenClaw 会跳过 heartbeat 运行，以节省 API 调用。
    如果文件不存在，heartbeat 仍会运行，并由模型决定要做什么。

    每个智能体的覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把“bot 账号”加到 WhatsApp 群组里吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到它。
    默认情况下，群组回复会被阻止，直到你允许对应发送者（`groupPolicy: "allowlist"`）。

    如果你只想让**你自己**可以触发群组回复：

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="如何获取 WhatsApp 群组的 JID？">
    方案 1（最快）：跟踪日志，然后在群里发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    方案 2（如果已经配置/允许列出）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/cli/directory)、[日志](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 不在群组里回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @mention bot（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 却没有包含 `"*"`，而该群组又不在 allowlist 中。

    参见 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会和私信共享上下文吗？">
    默认情况下，直接聊天会折叠到主会话。群组/渠道拥有各自的会话键，而 Telegram 话题 / Discord 线程则是独立会话。参见 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至上百个）都没问题，但请注意：

    - **磁盘增长：**会话 + 转录内容位于 `~/.openclaw/agents/<agentId>/sessions/`。
    - **令牌成本：**智能体越多，并发模型使用越多。
    - **运维开销：**每个智能体的 auth profile、工作区和渠道路由。

    建议：

    - 每个智能体保留一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增大，请清理旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 检测游离工作区和 profile 不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个 bot 或聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个彼此隔离的智能体，并根据
    渠道/账号/peer 路由入站消息。Slack 作为渠道受支持，并且可以绑定到特定智能体。

    浏览器访问能力很强，但并不是“像人类一样什么都能做” —— 反机器人、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 需要时使用本地浏览器，通过 Chrome MCP 或节点访问。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [浏览器](/zh-CN/tools/browser)、[节点](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型就是你设置在下面这个位置的内容：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 形式引用（例如：`openai/gpt-5.4`）。如果你省略 provider，OpenClaw 会先尝试别名，然后尝试精确 model id 的唯一已配置 provider 匹配，最后才会退回到已配置默认 provider 这一已废弃的兼容路径。如果该 provider 已不再暴露配置中的默认模型，OpenClaw 会退回到第一个已配置 provider/model，而不是继续沿用一个过时、已移除 provider 的默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：**使用你的 provider 堆栈中最新一代、能力最强的模型。
    **对于启用工具或处理不受信任输入的智能体：**优先考虑模型能力，而不是成本。
    **对于常规/低风险聊天：**使用更便宜的回退模型，并按智能体角色路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对高风险工作，使用**你能负担得起的最佳模型**；对于常规
    聊天或摘要，则使用更便宜的模型。你可以按智能体路由模型，并使用子智能体来
    并行化长任务（每个子智能体都会消耗令牌）。参见 [模型](/zh-CN/concepts/models) 和
    [子智能体](/zh-CN/tools/subagents)。

    强烈警告：较弱/过度量化的模型更容易受到 prompt
    injection 和不安全行为影响。参见 [安全](/zh-CN/gateway/security)。

    更多背景：[模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**相关字段。避免整份配置替换。

    安全方式：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你明确要替换整个配置，否则不要用部分对象执行 `config.apply`。
    对于 RPC 编辑，请先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。该 lookup 载荷会给出标准化路径、浅层 schema 文档/约束，以及直接子项摘要，
    用于部分更新。
    如果你已经覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档：[模型](/zh-CN/concepts/models)、[Configure](/cli/configure)、[配置](/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。Ollama 是本地模型最简单的路径。

    最快设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull glm-4.7-flash`
    3. 如果你也想使用云模型，请运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会同时提供云模型和你的本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云模型不需要本地 pull
    - 手动切换时，可使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或高度量化的模型更容易受到 prompt
    injection 影响。对于任何能使用工具的 bot，我们强烈推荐使用**大模型**。
    如果你仍然想使用小模型，请启用沙箱隔离和严格的工具 allowlist。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型提供商](/zh-CN/concepts/model-providers)、[安全](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能彼此不同，并且会随时间变化；没有固定的 provider 推荐。
    - 使用 `openclaw models status` 检查每个 gateway 当前的运行时设置。
    - 对于安全敏感/启用工具的智能体，请使用最新一代中能力最强的模型。
  </Accordion>

  <Accordion title="如何动态切换模型（无需重启）？">
    将 `/model` 命令作为单独一条消息发送：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。自定义别名可通过 `agents.defaults.models` 添加。

    你可以使用 `/model`、`/model list` 或 `/model status` 查看可用模型。

    `/model`（和 `/model list`）会显示一个紧凑的编号选择器。通过数字选择：

    ```
    /model 3
    ```

    你也可以为 provider 强制指定一个特定 auth profile（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前激活的是哪个智能体、正在使用哪个 `auth-profiles.json` 文件，以及接下来将尝试哪个 auth profile。
    它还会在可用时显示已配置的 provider endpoint（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我通过 @profile 设置的 profile？**

    不带 `@profile` 后缀重新运行 `/model`：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到默认值，请从 `/model` 中选择它（或者发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前激活的 auth profile。

  </Accordion>

  <Accordion title="我可以用 GPT 5.2 做日常任务，用 Codex 5.3 做编码吗？">
    可以。将其中一个设为默认值，需要时再切换：

    - **快速切换（按会话）：**日常任务使用 `/model gpt-5.4`，使用 Codex OAuth 编码时使用 `/model openai-codex/gpt-5.4`。
    - **默认值 + 切换：**将 `agents.defaults.model.primary` 设为 `openai/gpt-5.4`，编码时再切换到 `openai-codex/gpt-5.4`（或反过来）。
    - **子智能体：**将编码任务路由到默认模型不同的子智能体。

    参见 [模型](/zh-CN/concepts/models) 和 [Slash 命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.4 配置快速模式？">
    你可以使用会话开关或配置默认值：

    - **按会话：**当会话正在使用 `openai/gpt-5.4` 或 `openai-codex/gpt-5.4` 时，发送 `/fast on`。
    - **按模型默认值：**将 `agents.defaults.models["openai/gpt-5.4"].params.fastMode` 设为 `true`。
    - **Codex OAuth 也一样：**如果你也使用 `openai-codex/gpt-5.4`，请对它设置相同标志。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，快速模式会在受支持的原生 Responses 请求上映射到 `service_tier = "priority"`。会话级 `/fast` 覆盖优先于配置默认值。

    参见 [思考和快速模式](/zh-CN/tools/thinking) 和 [OpenAI 快速模式](/zh-CN/providers/openai#openai-fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到“Model ... is not allowed”，然后没有回复？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的**allowlist**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    这个错误会**替代**正常回复返回。修复方式：将该模型加入
    `agents.defaults.models`，移除 allowlist，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到“Unknown model: minimax/MiniMax-M2.7”？'>
    这意味着**provider 未配置**（没有找到 MiniMax provider 配置或 auth
    profile），因此无法解析该模型。

    修复清单：

    1. 升级到当前 OpenClaw 版本（或从源码 `main` 运行），然后重启 gateway。
    2. 确保已配置 MiniMax（通过向导或 JSON），或者环境/auth profile 中存在 MiniMax 认证，
       从而可以注入对应 provider
       （`MINIMAX_API_KEY` 对应 `minimax`，`MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth 对应 `minimax-portal`）。
    3. 根据你的认证路径使用精确的模型 id（区分大小写）：
       API key 设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       并从列表中选择（或者在聊天中使用 `/model list`）。

    参见 [MiniMax](/zh-CN/providers/minimax) 和 [模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认模型，而把 OpenAI 用于复杂任务吗？">
    可以。使用**MiniMax 作为默认值**，并在需要时**按会话**切换模型。
    回退是针对**错误**的，而不是“高难度任务”，所以请使用 `/model` 或单独的智能体。

    **方案 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **方案 B：分离智能体**

    - 智能体 A 默认：MiniMax
    - 智能体 B 默认：OpenAI
    - 按智能体路由或使用 `/agent` 切换

    文档：[模型](/zh-CN/concepts/models)、[多智能体路由](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 附带了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才生效）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名的自定义别名，则以你的值为准。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（别名）？">
    别名来自 `agents.defaults.models.<modelId>.alias`。示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）就会解析到对应模型 ID。

  </Accordion>

  <Accordion title="如何添加 OpenRouter 或 Z.AI 等其他提供商的模型？">
    OpenRouter（按 token 计费；模型很多）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM 模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    如果你引用了某个 provider/model，但缺少所需的 provider key，就会收到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **新增智能体后提示 No API key found for provider**

    这通常意味着**新智能体**的认证存储是空的。认证是按智能体隔离的，
    存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复方式：

    - 运行 `openclaw agents add <id>` 并在向导中配置认证。
    - 或将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致认证/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障切换和“All models failed”

<AccordionGroup>
  <Accordion title="故障切换是如何工作的？">
    故障切换分两个阶段：

    1. **同一 provider 内部的 auth profile 轮换**。
    2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    对失败的 profile 会应用冷却时间（指数退避），因此即使某个 provider 被限流或暂时失败，OpenClaw 也能继续响应。

    速率限制桶不仅仅包括普通的 `429` 响应。OpenClaw
    还会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted` 以及周期性的
    使用窗口限制（`weekly/monthly limit reached`）视为值得故障切换的
    速率限制。

    有些看起来像计费问题的响应并不是 `402`，有些 HTTP `402`
    响应也仍然会保留在那个瞬时错误桶中。如果某个 provider 在 `401` 或 `403`
    上返回明确的计费文本，OpenClaw 仍然可以把它保留在
    计费通道中，但 provider 特定的文本匹配器只作用于
    拥有它们的 provider（例如 OpenRouter 的 `Key limit exceeded`）。如果一个 `402`
    消息看起来更像可重试的使用窗口限制或
    组织/工作区支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误不同：诸如
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这类特征会保留在压缩/重试路径中，而不会推进模型
    回退。

    通用服务器错误文本被有意限制得比“任何包含
    unknown/error 的内容”更窄。OpenClaw 确实会将 provider 范围内的瞬时形态
    视为值得故障切换的超时/过载信号，例如 Anthropic 的裸 `An unknown error occurred`、OpenRouter 的裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有瞬时服务器文本的 JSON `api_error` 载荷
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及 provider 繁忙错误如 `ModelNotReadyException`，前提是 provider 上下文
    匹配。
    通用内部回退文本如 `LLM request failed with an unknown
    error.` 会保持保守，不会单独触发模型回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这意味着系统尝试使用 auth profile ID `anthropic:default`，但在预期的 auth 存储中找不到与之对应的凭证。

    **修复清单：**

    - **确认 auth profile 的存放位置**（新旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量已被 Gateway 网关加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway 网关，它可能不会继承该变量。请把它放到 `~/.openclaw/.env` 中，或启用 `env.shellEnv`。
    - **确保你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **对模型/认证状态做基本检查**
      - 使用 `openclaw models status` 查看已配置模型以及 provider 是否已完成认证。

    **“No credentials found for profile anthropic” 的修复清单**

    这意味着本次运行被固定到了某个 Anthropic auth profile，但 Gateway 网关
    无法在其 auth 存储中找到它。

    - **使用 Claude CLI**
      - 在 gateway host 上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API key**
      - 将 `ANTHROPIC_API_KEY