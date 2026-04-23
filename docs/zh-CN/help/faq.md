---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题
    - 在深入调试之前对用户报告的问题进行初步排查
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-23T20:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd98f014ec2cdfe3c85e69303126fcd8bb94ade15e9770d15311484a7ef78480
    source_path: help/faq.md
    workflow: 15
---

针对真实环境（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障转移）提供快速解答和更深入的故障排除。对于运行时诊断，请参阅[故障排除](/zh-CN/gateway/troubleshooting)。对于完整配置参考，请参阅[配置](/zh-CN/gateway/configuration)。

## 如果出现问题，最初的六十秒

1. **快速状态（第一项检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：OS + 更新、gateway/服务可达性、智能体/会话、provider 配置 + 运行时问题（当 gateway 可达时）。

2. **可粘贴的报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，包含日志尾部（token 已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深入探测**

   ```bash
   openclaw status --deep
   ```

   执行实时 gateway 健康探测，包括在支持时的渠道探测
   （需要 gateway 可达）。参见[健康检查](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；参见[日志](/zh-CN/logging)和[故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。参见[Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向正在运行的 gateway 请求完整快照（仅 WS）。参见[健康检查](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快解决问题的方法是什么">
    使用一个能够**看到你的机器**的本地 AI 智能体。这比在 Discord 里提问有效得多，因为大多数“我卡住了”的情况都属于**本地配置或环境问题**，远程协助者无法直接检查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复机器级设置
    （PATH、服务、权限、认证文件）。请通过可修改的（git）安装方式，把**完整源码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码和文档，并根据你正在运行的确切版本进行推理。之后你随时可以重新运行安装器（不带 `--install-method git`）切回稳定版。

    提示：让智能体先**规划并监督**修复流程（逐步执行），然后只运行必要的命令。这样可以让改动更小，也更容易审计。

    如果你发现了真实 bug 或修复方法，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    先从这些命令开始（求助时请附上输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 gateway/智能体健康状态 + 基本配置。
    - `openclaw models status`：检查 provider 认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出现问题，最初的六十秒](#如果出现问题最初的六十秒)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。那些跳过原因是什么意思？">
    常见 heartbeat 跳过原因：

    - `quiet-hours`：位于配置的活跃时间窗口之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的骨架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但尚无任何任务间隔到期
    - `alerts-disabled`：所有 heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，到期时间戳只会在一次真实的 heartbeat 运行
    完成后推进。被跳过的运行不会把任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。完成新手引导后，你通常会在 **18789** 端口运行 Gateway 网关。

    从源码开始（贡献者/开发者）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果你还没有全局安装，可以通过 `pnpm openclaw onboard` 运行它。

  </Accordion>

  <Accordion title="新手引导完成后，我该如何打开仪表板？">
    向导会在新手引导结束后立即用浏览器打开一个干净的（不含 token 的）仪表板 URL，并且也会在摘要中打印该链接。请保持那个标签页打开；如果没有自动启动，就在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="我该如何在 localhost 和远程环境中对仪表板进行认证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的 token 或 password 粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - Password 来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，请使用 `openclaw doctor --generate-gateway-token` 生成 token。

    **不在 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定在 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份请求头即可满足 Control UI/WebSocket 认证（无需粘贴共享密钥，前提是 gateway 主机受信任）；HTTP API 仍然需要共享密钥认证，除非你有意使用私有入口 `none` 或 trusted-proxy HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试会在失败认证限流器记录之前被串行化，因此第二次错误重试就可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置 password 认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **身份感知反向代理**：将 Gateway 网关置于非 loopback trusted proxy 之后，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。通过隧道时共享密钥认证仍然生效；如果出现提示，请粘贴已配置的 token 或 password。

    有关绑定模式和认证细节，请参阅[仪表板](/zh-CN/web/dashboard)和[Web 界面](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec 审批配置？">
    它们控制的是不同层次：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：使该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批门槛。聊天配置只控制审批
    提示出现在哪里，以及人们如何作出回应。

    在大多数设置中，你**不**需要同时配置两者：

    - 如果聊天本身已经支持命令和回复，则同一聊天中的 `/approve` 会通过共享路径工作。
    - 如果受支持的原生渠道可以安全推断审批人，那么当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 就是主要路径；只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 仅当提示还必须转发到其他聊天或显式运维房间时，才使用 `approvals.exec`。
    - 仅当你明确希望将审批提示发回原始房间/话题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批又是另一套：默认使用同一聊天中的 `/approve`、可选的 `approvals.plugin` 转发，而且只有部分原生渠道会额外保留插件审批原生处理。

    简而言之：转发用于路由，原生客户端配置用于更丰富的渠道专属 UX。
    参见[Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。Gateway 网关**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="它能运行在 Raspberry Pi 上吗？">
    可以。Gateway 网关很轻量——文档中指出个人使用情况下 **512MB-1GB RAM**、**1 核** 和约 **500MB**
    磁盘空间就足够，并明确说明 **Raspberry Pi 4 可以运行它**。

    如果你希望有更多余量（日志、媒体、其他服务），**推荐 2GB**，但
    这不是硬性最低要求。

    提示：一个小型 Pi/VPS 可以托管 Gateway 网关，而你可以在笔记本/手机上配对 **nodes**，用于
    本地屏幕/摄像头/canvas 或命令执行。参见 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短结论：可以运行，但预计会有一些棘手边缘情况。

    - 使用 **64 位** OS，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 一开始不要启用渠道/Skills，之后再逐个添加。
    - 如果你遇到奇怪的二进制问题，通常是 **ARM 兼容性** 问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch。现在怎么办？">
    该界面依赖 Gateway 网关可达并通过认证。TUI 在首次 hatch 时也会自动发送
    “Wake up, my friend!”。如果你看到这一行但**没有回复**
    且 token 一直保持为 0，说明智能体根本没有运行。

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

    3. 如果仍然卡住，请运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关是远程的，请确认隧道/Tailscale 连接正常，并且 UI
    指向的是正确的 Gateway 网关。参见[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不用重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这样
    可以保持你的机器人“完全一样”（memory、会话历史、认证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、auth profiles、WhatsApp 凭证、会话和 memory。如果你处于
    远程模式，请记住 gateway 主机才拥有会话存储和工作区。

    **重要：** 如果你只是把工作区提交/推送到 GitHub，你备份的是
    **memory + 引导文件**，但**不是**会话历史或认证信息。后两者位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[迁移](/zh-CN/install/migrating)、[磁盘上的存放位置](#where-things-live-on-disk)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本的新内容？">
    查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在最上方。如果最上面的部分标记为 **Unreleased**，则下一个带日期的
    部分就是最新已发布版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（在需要时也会有 docs/other 部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会错误地通过 Xfinity
    Advanced Security 屏蔽 `docs.openclaw.ai`。请将其禁用或把 `docs.openclaw.ai` 加入允许列表，然后重试。
    也请通过这里反馈，帮助我们解除屏蔽：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档在 GitHub 上也有镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和 beta 版有什么区别？">
    **稳定版** 和 **beta** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，一个稳定版本会先发布到 **beta**，然后通过显式
    提升步骤把同一个版本移动到 `latest`。维护者在必要时也可以
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升后
    可能会指向**同一个版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    有关安装单行命令以及 beta 和 dev 的区别，请参阅下面的折叠项。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部（git）；发布后使用 npm dist-tag `dev`。

    单行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装器（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节：[开发渠道](/zh-CN/install/development-channels) 和 [安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新内容？">
    有两个选项：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会获得一个可本地编辑的仓库，然后可以通过 git 更新。

    如果你更喜欢手动进行干净检出，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多久？">
    大致参考：

    - **安装：** 2-5 分钟
    - **新手引导：** 5-15 分钟，取决于你配置了多少渠道/模型

    如果卡住了，请查看[安装器卡住](#quick-start-and-first-run-setup)
    和[我卡住了](#quick-start-and-first-run-setup)中的快速调试循环。

  </Accordion>

  <Accordion title="安装器卡住了？我该如何获得更多反馈？">
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
    # install.ps1 目前还没有专用的 -Verbose 标志。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装器标志](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示 git not found 或 openclaw not recognized">
    Windows 上常见的两个问题：

    **1）npm 错误 spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 已在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装器。

    **2）安装后 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你想要最顺畅的 Windows 设置，请使用 **WSL2** 而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文——我该怎么办？">
    这通常是原生 Windows shell 的控制台代码页不匹配问题。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同一命令在另一个终端配置中显示正常

    PowerShell 中的快速解决方法：

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

    如果在最新 OpenClaw 上你仍能复现这个问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——我该如何获得更好的答案？">
    使用**可修改的（git）安装**，这样你就能在本地拥有完整源码和文档，然后
    在_该文件夹内_向你的机器人（或 Claude/Codex）提问，这样它就可以读取仓库并给出更准确的回答。

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
    任何 Linux VPS 都可以。安装在服务器上，然后使用 SSH/Tailscale 访问 Gateway 网关。

    指南：[exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们保留了一个**托管中心**页面，汇总常见提供商。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，而你通过
    Control UI（或 Tailscale/SSH）从你的笔记本/手机访问它。你的状态和工作区
    存放在服务器上，因此应将主机视为事实来源并做好备份。

    你可以将 **nodes**（Mac/iOS/Android/无头）配对到该云端 Gateway 网关，以访问
    本地屏幕/摄像头/canvas，或在笔记本上运行命令，同时保持
    Gateway 网关在云端。

    中心页：[平台](/zh-CN/platforms)。远程访问：[Gateway 网关远程访问](/zh-CN/gateway/remote)。
    Nodes：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（从而中断当前会话），可能需要干净的 git 检出，并且
    可能要求确认。更安全的方式是：由操作员从 shell 运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体自动化执行：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[更新](/zh-CN/cli/update)、[更新说明](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/认证设置**（provider OAuth、API 密钥、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/Tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及像 QQ Bot 这样的内置渠道插件）
    - **守护进程安装**（macOS 上是 LaunchAgent；Linux/WSL2 上是 systemd 用户单元）
    - **健康检查** 和 **Skills** 选择

    如果你配置的模型未知或缺少认证信息，它还会发出警告。

  </Accordion>

  <Accordion title="运行它需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用 **API 密钥**（Anthropic/OpenAI/其他）运行 OpenClaw，也可以使用
    **仅本地模型**，这样你的数据会保留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是这些 provider 的可选认证方式。

    对于 OpenClaw 中的 Anthropic，实际上的划分是：

    - **Anthropic API 密钥**：正常的 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅认证**：Anthropic 工作人员
      告诉我们这类使用再次被允许，OpenClaw 目前将 `claude -p`
      的用法视为该集成的受认可方式，除非 Anthropic 发布新的
      政策

    对于长期运行的 gateway 主机来说，Anthropic API 密钥仍然是更
    可预测的设置方式。OpenAI Codex OAuth 被明确支持用于 OpenClaw 这类外部
    工具。

    OpenClaw 还支持其他托管式订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 以及
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API 密钥的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    除非 Anthropic 发布新的政策，否则 OpenClaw 会将 Claude 订阅认证和 `claude -p` 的使用视为该集成的受认可方式。如果你希望获得
    最可预测的服务器端设置，请改用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 工作人员告诉我们，这种使用方式再次被允许，因此 OpenClaw 会将
    Claude CLI 复用和 `claude -p` 的使用视为该集成的受认可方式，
    除非 Anthropic 发布新的政策。

    Anthropic setup-token 仍然是 OpenClaw 支持的 token 路径之一，但现在在可用时，OpenClaw 更优先选择 Claude CLI 复用和 `claude -p`。
    对于生产环境或多用户负载，Anthropic API 密钥认证仍然是
    更安全、更可预测的选择。如果你还希望在 OpenClaw 中使用其他订阅式托管
    选项，请参阅 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这意味着你在当前窗口内的 **Anthropic 配额/速率限制** 已耗尽。如果你
    使用 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用 **Anthropic API 密钥**，请检查 Anthropic Console
    中的使用量/计费情况，并在需要时提高限制。

    如果消息特别显示为：
    `Extra usage is required for long context requests`，说明该请求正在尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。这仅在你的
    凭证具备长上下文计费资格时才有效（API 密钥计费，或
    启用了 Extra Usage 的 OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样当某个 provider 被限流时，OpenClaw 仍可继续回复。
    请参阅[Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock Mantle（Converse）** provider。存在 AWS 环境标记时，OpenClaw 可以自动发现支持流式/文本的 Bedrock 目录，并将其合并为隐式 `amazon-bedrock` provider；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled` 或添加手动 provider 条目。请参阅 [Amazon Bedrock Mantle](/zh-CN/providers/bedrock) 和 [模型 providers](/zh-CN/providers/models)。如果你更喜欢受管理的密钥流程，在 Bedrock 前放置一个兼容 OpenAI 的代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 认证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。新的模型引用应使用标准的 `openai/gpt-5.5` 路径；`openai-codex/gpt-*` 仍然是旧版兼容别名。请参阅 [模型 providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 还会提到 openai-codex？">
    `openai-codex` 仍然是 ChatGPT/Codex OAuth 的内部 auth/profile provider id。模型引用应使用标准 OpenAI：

    - `openai/gpt-5.5` = 标准 GPT-5.5 模型引用
    - `openai-codex/gpt-5.5` = 旧版兼容别名
    - `openai-codex:...` = auth profile id，不是模型引用

    如果你希望走直接 OpenAI Platform 计费/限制路径，请设置
    `OPENAI_API_KEY`。如果你希望使用 ChatGPT/Codex 订阅认证，请通过
    `openclaw models auth login --provider openai-codex` 登录，并在新配置中继续使用
    `openai/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能与 ChatGPT 网页版不同？">
    Codex OAuth 使用由 OpenAI 管理、依赖套餐的配额窗口。实际中，
    即使两者都绑定到同一个账户，这些限制也可能与 ChatGPT 网站/应用体验不同。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的 provider 使用量/配额窗口，但它不会将 ChatGPT 网页版
    权益虚构或标准化为直接 API 访问。如果你希望获得直接 OpenAI Platform
    计费/限制路径，请将 `openai/*` 与 API 密钥配合使用。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这样的外部工具/工作流中使用订阅 OAuth。
    新手引导可以帮你完成 OAuth 流程。

    请参阅 [OAuth](/zh-CN/concepts/oauth)、[模型 providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件认证流程**，而不是在 `openclaw.json` 中填写 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 位于 `PATH` 中
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth token 存储在 gateway 主机上的 auth profiles 中。详情请参阅：[模型 providers](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小卡会截断并泄漏。如果你必须这样做，请在本地运行你能承受的**最大**模型构建（LM Studio），并查看 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化模型会增加提示注入风险——参见[安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量始终留在特定区域？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供了美国托管选项；选择美国托管变体即可让数据保留在该区域。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 与这些选项一起列出，这样在尊重你所选区域 provider 的同时，回退模型仍然可用。
  </Accordion>

  <Accordion title="安装这个一定要买 Mac Mini 吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 只是可选项——有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别设备也可以。

    只有当你需要 **仅限 macOS 的工具** 时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器运行在任意 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你想使用其他仅限 macOS 的工具，可以在 Mac 上运行 Gateway 网关，或者配对一个 macOS 节点。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="要支持 iMessage，我需要 Mac mini 吗？">
    你需要**某台 macOS 设备**登录到 Messages。它**不必**是 Mac mini——
    任意 Mac 都可以。对于 iMessage，请**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - Gateway 网关运行在 Linux/VPS 上，而 BlueBubbles 服务器运行在任意一台已登录 Messages 的 Mac 上。
    - 如果你希望最简单的单机设置，可以把所有内容都运行在 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，我可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点不会运行 Gateway 网关——它们提供额外
    能力，例如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（常开）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    要获得稳定的 Gateway 网关，请使用 **Node**。

    如果你仍想尝试 Bun，请仅在非生产 Gateway 网关上
    并且不启用 WhatsApp/Telegram 的情况下实验。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。它不是机器人用户名。

    设置流程只要求填写数字用户 ID。如果你的配置中已经有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全的方式（不依赖第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私较差）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    请参阅 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 例如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会获得自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账户**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账户来说仍然是全局的。请参阅[多智能体路由](/zh-CN/concepts/multi-agent)和[WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编程的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置各自的默认模型，然后将入站路由（provider 账户或特定 peers）绑定到各个智能体。示例配置见[多智能体路由](/zh-CN/concepts/multi-agent)。另请参阅[模型](/zh-CN/concepts/models)和[配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上使用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），以便 `brew` 安装的工具能在非登录 shell 中被解析。
    最新构建还会在 Linux systemd 服务上预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改 git 安装和 npm install 有什么区别">
    - **可修改（git）安装：** 完整源码检出，可编辑，最适合贡献者。
      你可以在本地构建，并修改代码/文档。
    - **npm install：** 全局 CLI 安装，不包含仓库，最适合“直接运行”。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后我还能在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种形式，然后运行 Doctor，让 gateway 服务指向新的入口点。
    这**不会删除你的数据**——它只会更改 OpenClaw 的代码安装。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）都不会受到影响。

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

    Doctor 会检测 gateway 服务入口点不匹配，并提示你重写服务配置以匹配当前安装（在自动化中请使用 `--repair`）。

    备份提示：参见[备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑上运行 Gateway 网关，还是放在 VPS 上？">
    简短回答：**如果你想要 24/7 可靠性，就用 VPS**。如果你希望
    最低摩擦，并且能接受睡眠/重启带来的影响，就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：** 无服务器成本，可直接访问本地文件，拥有可见的实时浏览器窗口。
    - **缺点：** 睡眠/网络断开 = 连接中断，OS 更新/重启会打断运行，必须保持机器唤醒。

    **VPS / 云端**

    - **优点：** 常开、网络稳定、没有笔记本睡眠问题、更容易持续运行。
    - **缺点：** 通常是无头运行（需要用截图），只能远程访问文件，更新时必须通过 SSH。

    **OpenClaw 特有说明：** WhatsApp/Telegram/Slack/Mattermost/Discord 在 VPS 上都工作良好。真正的权衡只是**无头浏览器**还是可见窗口。参见 [Browser](/zh-CN/tools/browser)。

    **推荐默认方式：** 如果你以前遇到过 gateway 断连，就用 VPS。本地运行在你主动使用 Mac、并且希望访问本地文件或使用带可见浏览器的 UI 自动化时非常适合。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但**为了可靠性和隔离性，推荐这样做**。

    - **专用主机（VPS/Mac mini/Pi）：** 常开、较少受睡眠/重启中断、权限更干净、更容易保持长期运行。
    - **共用笔记本/台式机：** 非常适合测试和主动使用，但当机器睡眠或更新时，运行会暂停。

    如果你希望两者兼得，可以把 Gateway 网关放在专用主机上，再将笔记本配对为**节点**，用于本地屏幕/摄像头/exec 工具。参见 [Nodes](/zh-CN/nodes)。
    有关安全建议，请阅读[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 配置要求和推荐 OS 是什么？">
    OpenClaw 很轻量。对于基础 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：** 1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐配置：** 1-2 vCPU、2GB RAM 或更高，以留出余量（日志、媒体、多个渠道）。节点工具和浏览器自动化可能比较吃资源。

    OS：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？需要什么条件？">
    可以。将 VM 视作 VPS 即可：它需要保持常开、可访问，并且拥有足够的
    RAM 来运行 Gateway 网关和你启用的任何渠道。

    基线建议：

    - **绝对最低配置：** 1 vCPU、1GB RAM。
    - **推荐配置：** 如果你运行多个渠道、浏览器自动化或媒体工具，建议使用 2GB RAM 或更多。
    - **OS：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最简单的 VM 风格设置**，并且具有最好的工具
    兼容性。参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你在 VM 中运行 macOS，请参阅 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 什么是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段话解释，OpenClaw 是什么？">
    OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它会在你已经使用的消息界面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及像 QQ Bot 这样的内置渠道插件），并且在支持的平台上还可以提供语音 + 实时 Canvas。**Gateway 网关**是始终在线的控制平面；助手才是产品本身。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是“只是一个 Claude 包装器”。它是一个**本地优先的控制平面**，让你能够在**自己的硬件**上运行一个强大的助手，并通过你已经在使用的聊天应用访问它，同时拥有有状态会话、memory 和工具——而无需把你的工作流控制权交给某个托管 SaaS。

    亮点：

    - **你的设备，你的数据：** 你可以在任何地方运行 Gateway 网关（Mac、Linux、VPS），并让工作区和会话历史保留在本地。
    - **真实渠道，而不是网页沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      以及在支持平台上的移动语音和 Canvas。
    - **与模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，并支持按智能体路由
      和故障转移。
    - **仅本地选项：** 如果你愿意，可以运行本地模型，从而让**所有数据都保留在你的设备上**。
    - **多智能体路由：** 按渠道、账户或任务拆分独立智能体，每个智能体都有自己的
      工作区和默认设置。
    - **开源且可修改：** 可检查、可扩展、可自托管，没有供应商锁定。

    文档：[Gateway 网关](/zh-CN/gateway)、[渠道](/zh-CN/channels)、[多智能体](/zh-CN/concepts/multi-agent)、
    [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好它——我应该先做什么？">
    很适合起步的项目包括：

    - 搭建一个网站（WordPress、Shopify 或一个简单静态站点）。
    - 原型化一个移动应用（大纲、界面、API 计划）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动生成摘要或后续跟进。

    它可以处理大型任务，但当你把任务拆成多个阶段并
    使用子智能体进行并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常收益通常体现在：

    - **个人简报：** 你关心的收件箱、日历和新闻摘要。
    - **研究与起草：** 快速研究、摘要，以及邮件或文档的首稿。
    - **提醒与跟进：** 由 cron 或 heartbeat 驱动的提醒和清单。
    - **浏览器自动化：** 填表、采集数据、重复执行 Web 任务。
    - **跨设备协作：** 从手机发出任务，让 Gateway 网关在服务器上运行，然后在聊天中返回结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做获客、外联、广告和博客吗？">
    可以，适用于**研究、筛选和起草**。它可以扫描网站、建立候选名单、
    总结潜在客户信息，并撰写外联或广告文案草稿。

    对于**外联或广告投放**，请保持人工参与。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审查所有内容。最安全的模式是让
    OpenClaw 起草，由你审批。

    文档：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="相比 Claude Code，在 Web 开发方面它有什么优势？">
    OpenClaw 是一个**个人助手**和协作编排层，而不是 IDE 替代品。对于仓库中的最快直接编码循环，请使用
    Claude Code 或 Codex。需要持久 memory、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - **跨会话的持久 memory + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（可运行在 VPS 上，并随时随地交互）
    - 用于本地浏览器/屏幕/摄像头/exec 的 **Nodes**

    展示页：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不污染仓库的情况下自定义 Skills？">
    使用受管覆盖，而不是直接编辑仓库副本。将你的改动放到 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加一个文件夹）。优先级顺序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此受管覆盖仍然会在不修改 git 的情况下优先于内置 Skills。如果你需要全局安装该技能，但只希望某些智能体可见，请将共享副本保留在 `~/.openclaw/skills` 中，并使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游提交的改动才应放在仓库中并通过 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 Skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一个会话中将其视为 `<workspace>/skills`。如果该技能只应对某些智能体可见，请结合 `agents.defaults.skills` 或 `agents.list[].skills` 一起使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    当前支持的模式包括：

    - **Cron Jobs**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：将任务路由到具有不同默认模型的独立智能体。
    - **按需切换**：随时使用 `/model` 切换当前会话模型。

    请参阅 [Cron Jobs](/zh-CN/automation/cron-jobs)、[多智能体路由](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行重任务时会卡住。我该如何卸载这部分负载？">
    对于长时间运行或并行任务，请使用**子智能体**。子智能体在自己的会话中运行，
    返回摘要，并保持你的主聊天响应流畅。

    让你的机器人“为这个任务生成一个子智能体”，或使用 `/subagents`。
    使用聊天中的 `/status` 查看 Gateway 网关当前正在做什么（以及它是否繁忙）。

    Token 提示：长任务和子智能体都会消耗 token。如果你在意成本，可以通过 `agents.defaults.subagents.model` 为子智能体设置一个
    更便宜的模型。

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上基于线程绑定的子智能体会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个子智能体或会话目标，从而让该线程中的后续消息始终停留在该绑定会话上。

    基本流程：

    - 使用 `sessions_spawn` 并传入 `thread: true` 进行生成（如需持久后续跟进，可选 `mode: "session"`）。
    - 或使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消焦点。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[子智能体](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[配置参考](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体完成了，但完成更新发到了错误的地方，或者根本没发出来。我该检查什么？">
    先检查解析后的请求方路由：

    - 完成模式的子智能体投递会优先使用任何已绑定的线程或会话路由（如果存在）。
    - 如果完成来源只携带渠道信息，OpenClaw 会回退到请求方会话中存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），这样直接投递仍可能成功。
    - 如果既没有绑定路由，也没有可用的已存储路由，直接投递可能失败，结果会回退为排队会话投递，而不是立即发到聊天中。
    - 无效或过期的目标仍然可能迫使系统回退到队列，或导致最终投递失败。
    - 如果子任务最后一个对用户可见的助手回复恰好是静默 token `NO_REPLY` / `no_reply`，或恰好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制 announce，而不是发送较早的过期进度。
    - 如果子任务在只执行了工具调用后超时，announce 可能会将其折叠为简短的部分进度摘要，而不是重放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子智能体](/zh-CN/tools/subagents)、[后台任务](/zh-CN/automation/tasks)、[会话工具](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我该检查什么？">
    Cron 在 Gateway 网关进程内运行。如果 Gateway 网关没有持续运行，
    计划任务就不会执行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`），并且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 持续运行（无睡眠/重启）。
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

    - `--no-deliver` / `delivery.mode: "none"` 表示不应有运行器回退发送。
    - 缺失或无效的 announce 目标（`channel` / `to`）意味着运行器跳过了出站投递。
    - 渠道认证失败（`unauthorized`、`Forbidden`）意味着运行器尝试投递了，但凭证阻止了它。
    - 静默的隔离结果（仅有 `NO_REPLY` / `no_reply`）会被视为有意不可投递，因此运行器也会抑制排队回退投递。

    对于隔离 cron 作业，如果聊天路由可用，智能体仍可通过 `message`
    工具直接发送。`--announce` 只控制那些智能体尚未自行发送的最终文本的运行器
    回退路径。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[后台任务](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么某次隔离 cron 运行会切换模型或重试一次？">
    这通常是 live 模型切换路径，而不是重复调度。

    隔离 cron 在活动运行抛出 `LiveSessionModelSwitchError` 时，
    会持久化运行时模型切换并重试。重试会保留已切换的
    provider/模型；如果切换还带来了新的 auth profile 覆盖，cron
    也会在重试前将其持久化。

    相关选择规则：

    - 适用时，Gmail hook 模型覆盖优先级最高。
    - 然后是每作业 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后才是正常的智能体/默认模型选择。

    重试循环是有上限的。初次尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/zh-CN/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或直接将 Skills 放入工作区。macOS Skills UI 在 Linux 上不可用。
    可在 [https://clawhub.ai](https://clawhub.ai) 浏览技能。

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

    原生 `openclaw skills install` 会写入当前活动工作区的 `skills/`
    目录。只有在你想发布或同步自己的 Skills 时，才需要额外安装 `clawhub` CLI。若希望在多个智能体之间共享安装，请将技能放到
    `~/.openclaw/skills` 下，并在需要限制可见智能体时使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或在后台持续运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs** 用于计划任务或循环任务（跨重启持久化）。
    - **Heartbeat** 用于“主会话”的周期性检查。
    - **隔离作业** 用于会发布摘要或投递到聊天中的自主智能体。

    文档：[Cron jobs](/zh-CN/automation/cron-jobs)、[自动化与任务](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅限 Apple macOS 的 Skills 吗？">
    不能直接运行。macOS 技能由 `metadata.openclaw.os` 加必需二进制文件控制，并且只有当 **Gateway 网关主机** 上满足条件时，这些技能才会出现在系统提示中。在 Linux 上，仅限 `darwin` 的技能（如 `apple-notes`、`apple-reminders`、`things-mac`）除非你覆盖门控，否则不会加载。

    你有三种受支持的模式：

    **方案 A —— 在 Mac 上运行 Gateway 网关（最简单）。**
    在具备 macOS 二进制文件的地方运行 Gateway 网关，然后通过[远程模式](#gateway-ports-already-running-and-remote-mode)或 Tailscale 从 Linux 连接。由于 Gateway 网关主机是 macOS，这些技能会正常加载。

    **方案 B —— 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将**Node Run Commands** 设置为 “Always Ask” 或 “Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的技能视为可用。智能体会通过 `nodes` 工具运行这些技能。如果你选择 “Always Ask”，在提示中批准 “Always Allow” 会将该命令加入允许列表。

    **方案 C —— 通过 SSH 代理 macOS 二进制文件（高级）。**
    将 Gateway 网关保留在 Linux 上，但让所需 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖技能，使其允许 Linux，这样它就会保持可用。

    1. 为该二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 主机的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖技能元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动一个新会话，以便刷新 Skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    可选方式：

    - **自定义 skill / 插件：** 最适合可靠的 API 访问（Notion/HeyGen 都提供 API）。
    - **浏览器自动化：** 无需写代码即可使用，但速度更慢，也更脆弱。

    如果你希望为每个客户保留上下文（代理/机构工作流），一种简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 当前工作）。
    - 让智能体在会话开始时获取该页面。

    如果你想要原生集成，可以提交功能请求，或者构建一个面向这些 API 的 skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落到当前活动工作区的 `skills/` 目录。若要在多个智能体之间共享 Skills，请将它们放到 `~/.openclaw/skills/<name>/SKILL.md`。如果只希望部分智能体能看到共享安装，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。某些技能依赖通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（参见上方 Homebrew Linux 常见问题）。请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我现有已登录的 Chrome？">
    使用内置的 `user` 浏览器配置档，它会通过 Chrome DevTools MCP 连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，可以创建显式 MCP 配置档：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    该路径可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 网关运行在其他地方，请在浏览器所在机器上运行节点主机，或改用远程 CDP。

    当前 `existing-session` / `user` 的限制：

    - 操作为 ref 驱动，而不是 CSS 选择器驱动
    - 上传要求使用 `ref` / `inputRef`，并且当前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍需要受管浏览器或原始 CDP 配置档

  </Accordion>
</AccordionGroup>

## 沙箱隔离和 memory

<AccordionGroup>
  <Accordion title="有单独的沙箱隔离文档吗？">
    有。请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。对于 Docker 专用设置（完整 Gateway 网关运行在 Docker 中，或沙箱镜像），请参阅 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉限制很多——我该如何启用完整功能？">
    默认镜像以安全优先为设计，并以 `node` 用户运行，因此它
    不包含系统软件包、Homebrew 或内置浏览器。若要获得更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，使缓存得以保留。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖烘焙到镜像中。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保该路径被持久化。

    文档：[Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以用同一个智能体，让私信保持私密，但让群组公开/沙箱隔离吗？">
    可以——前提是你的私密流量是**私信**，而公共流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非主键）会在配置的沙箱后端中运行，而主私信会话仍留在宿主机上。如果你没有选择后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱会话中可用的工具。

    设置演练 + 示例配置：[群组：私密私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 网关配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何把宿主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定和每智能体绑定会合并；当 `scope: "shared"` 时，会忽略每智能体绑定。对任何敏感内容都使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会根据规范化路径和通过最深现有祖先解析得到的规范路径，双重验证绑定源。这意味着即使最后一个路径段尚不存在，通过符号链接父目录进行逃逸仍会以失败关闭方式被阻止，并且在符号链接解析后，允许根目录检查仍然适用。

    示例和安全说明请参阅[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)和[沙箱隔离 vs 工具策略 vs 提权权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="Memory 是如何工作的？">
    OpenClaw 的 memory 就是智能体工作区中的 Markdown 文件：

    - 位于 `memory/YYYY-MM-DD.md` 的每日笔记
    - 位于 `MEMORY.md` 的长期整理笔记（仅主会话/私密会话）

    OpenClaw 还会在自动压缩前运行一次**静默的 pre-compaction memory flush**，提醒模型
    在自动压缩之前写入持久笔记。该流程仅在工作区
    可写时运行（只读沙箱会跳过它）。请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="Memory 总是遗忘内容。我该如何让它记住？">
    让机器人**把事实写入 memory**。长期笔记应写入 `MEMORY.md`，
    短期上下文应写入 `memory/YYYY-MM-DD.md`。

    这是我们仍在持续改进的领域。提醒模型去存储 memory 会有帮助；
    它会知道该怎么做。如果它仍然不断遗忘，请确认 Gateway 网关在每次运行时都使用同一个
    工作区。

    文档：[Memory](/zh-CN/concepts/memory)、[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="Memory 会永久保存吗？它的限制是什么？">
    Memory 文件存储在磁盘上，除非你删除它们，否则会一直存在。限制来自你的
    存储空间，而不是模型。**会话上下文** 仍然受限于模型的
    上下文窗口，因此长对话可能会被压缩或截断。这正是
    memory 搜索存在的原因——它只会把相关部分重新拉回上下文中。

    文档：[Memory](/zh-CN/concepts/memory)、[上下文](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义 memory 搜索是否需要 OpenAI API 密钥？">
    只有在你使用 **OpenAI embeddings** 时才需要。Codex OAuth 只覆盖聊天/补全，
    **不**授予 embeddings 访问权限，因此**仅登录 Codex（无论是 OAuth 还是
    Codex CLI 登录）**并不能帮助语义 memory 搜索。OpenAI embeddings
    仍然需要真正的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置 provider，OpenClaw 会在能够解析 API 密钥时
    自动选择 provider（auth profiles、`models.providers.*.apiKey` 或环境变量）。
    如果能解析到 OpenAI 密钥，则优先选择 OpenAI；否则如果能解析到 Gemini 密钥，
    就选择 Gemini；接着是 Voyage，然后是 Mistral。如果没有可用的远程密钥，
    memory 搜索会保持禁用，直到你完成配置。如果你已配置且存在本地模型路径，
    OpenClaw 会优先选择 `local`。当你显式设置
    `memorySearch.provider = "ollama"` 时，也支持 Ollama。

    如果你更希望保持本地化，可设置 `memorySearch.provider = "local"`（并可选设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型——设置细节请参阅 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的存放位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有数据都会保存在本地吗？">
    不会——**OpenClaw 的状态在本地**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：** 会话、memory 文件、配置和工作区都存放在 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需求而远程：** 你发送给模型 providers（Anthropic/OpenAI 等）的消息会进入
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）也会在其
      服务器上存储消息数据。
    - **你可以控制数据足迹：** 使用本地模型可以让提示保留在你的机器上，但渠道
      流量仍然会经过对应渠道的服务器。

    相关内容：[智能体工作区](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存在哪里？">
    所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 用途                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时会复制到 auth profiles 中）              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API 密钥，以及可选的 `keyRef`/`tokenRef`）    |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | 可选的文件支持 secret payload，供 `file` SecretRef providers 使用   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目会被清理）                         |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider 状态（例如 `whatsapp/<accountId>/creds.json`）             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每智能体状态（agentDir + sessions）                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史与状态（按智能体）                                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体）                                              |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、memory 文件、Skills 等）是独立的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**中，而不是 `~/.openclaw`。

    - **工作区（每智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
      小写根目录 `memory.md` 仅作为旧版修复输入；当两个文件同时存在时，`openclaw doctor --fix`
      可以将其合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）**：配置、渠道/provider 状态、auth profiles、会话、日志，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“遗忘”，请确认 Gateway 网关在每次启动时都使用同一个
    工作区（并记住：远程模式使用的是**gateway 主机的**
    工作区，而不是你本地笔记本上的工作区）。

    提示：如果你希望某种行为或偏好持久存在，请让机器人**把它写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    请参阅[智能体工作区](/zh-CN/concepts/agent-workspace)和[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的**智能体工作区**放到一个**私有** git 仓库中，并备份到某个
    私有位置（例如 GitHub private）。这样可以捕获 memory + AGENTS/SOUL/USER
    文件，并让你之后能够恢复助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、token 或加密 secrets payload）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （参见上面的迁移问题）。

    文档：[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参阅专门指南：[卸载](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和 memory 锚点，而不是硬性沙箱。
    相对路径会在工作区内解析，但绝对路径仍可访问其他
    宿主机位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或每智能体沙箱设置。如果你
    希望某个仓库成为默认工作目录，可将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库本身只是源代码；除非你有意希望智能体在其中工作，否则请保持工作区独立。

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
    会话状态由**gateway 主机**持有。如果你处于远程模式，那么你关心的会话存储位于远程机器上，而不是本地笔记本。请参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？放在哪里？">
    OpenClaw 会从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件不存在，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在什么都没在监听 / UI 提示 unauthorized'>
    非 loopback 绑定**要求存在有效的 gateway 认证路径**。在实践中这意味着：

    - 共享密钥认证：token 或 password
    - `gateway.auth.mode: "trusted-proxy"`，并位于正确配置的非 loopback 身份感知反向代理之后

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

    - `gateway.remote.token` / `.password` 本身**不会**启用本地 gateway 认证。
    - 只有在 `gateway.auth.*` 未设置时，本地调用路径才能将 `gateway.remote.*` 作为回退。
    - 对于 password 认证，请设置 `gateway.auth.mode: "password"`，并同时设置 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，则解析会以失败关闭方式终止（不会用远程回退来掩盖）。
    - 共享密钥的 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（保存在应用/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样的携带身份模式则改用请求头。避免将共享密钥放入 URL。
    - 当 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理仍然**不**满足 trusted-proxy 认证。受信任代理必须是已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要 token？">
    OpenClaw 默认强制启用 gateway 认证，包括 loopback。在正常默认路径下，这意味着 token 认证：如果没有配置显式认证路径，gateway 启动时会解析为 token 模式并自动生成一个 token，保存到 `gateway.auth.token`，因此**本地 WS 客户端也必须认证**。这样可以阻止其他本地进程调用 Gateway 网关。

    如果你更希望使用其他认证路径，可以显式选择 password 模式（或者对于非 loopback 身份感知反向代理，使用 `trusted-proxy`）。如果你**确实**想要开放的 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 随时都可以为你生成 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="修改配置后需要重启吗？">
    Gateway 网关会监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，对关键更改执行重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何禁用有趣的 CLI 标语？">
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
    - `random`：轮换显示有趣/季节性标语（默认行为）。
    - 如果你希望完全不显示 banner，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（以及网页抓取）？">
    `web_fetch` 无需 API 密钥即可工作。`web_search` 则取决于你选择的
    provider：

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily 等基于 API 的 providers 需要正常的 API 密钥设置。
    - Ollama Web 搜索无需密钥，但它会使用你配置的 Ollama 主机，并要求执行 `ollama signin`。
    - DuckDuckGo 无需密钥，但它是基于 HTML 的非官方集成。
    - SearXNG 无需密钥/可自托管；可配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择一个 provider。
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

    provider 专用的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` provider 路径目前仍会加载以保持兼容，但新配置中不应再使用。
    Firecrawl 的网页抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会根据可用凭证自动检测第一个可用的抓取回退 provider。目前内置 provider 是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。我该如何恢复并避免这种情况？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其余所有内容
    都会被移除。

    当前 OpenClaw 已对许多意外覆盖提供保护：

    - OpenClaw 自有配置写入会在写入前验证完整的变更后配置。
    - 无效或破坏性的 OpenClaw 自有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会恢复最近一次可用配置，并将被拒绝文件保存为 `openclaw.json.clobbered.*`。
    - 恢复后，主智能体会收到启动警告，这样它就不会盲目再次写入坏配置。

    恢复方法：

    - 检查 `openclaw logs --follow` 中的 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 查看活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果当前恢复后的配置能正常工作，就保留它，然后仅通过 `openclaw config set` 或 `config.patch` 把你真正想要的键复制回去。
    - 运行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果你没有最近一次可用配置或被拒绝 payload，请从备份恢复，或重新运行 `openclaw doctor` 并重新配置 channels/models。
    - 如果这次情况出乎意料，请提交 bug，并附上你最近一次已知配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史记录重建出一个可工作的配置。

    避免方法：

    - 小改动使用 `openclaw config set`。
    - 交互式编辑使用 `openclaw configure`。
    - 当你不确定准确路径或字段形状时，先使用 `config.schema.lookup`；它会返回一个浅层 schema 节点以及其直接子节点摘要，便于下钻检查。
    - 对于部分 RPC 编辑，请使用 `config.patch`；只有在确实要整体替换配置时才使用 `config.apply`。
    - 如果你在智能体运行中使用了仅限所有者的 `gateway` 工具，它仍会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会规范化到同一受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/zh-CN/cli/config)、[配置向导](/zh-CN/cli/configure)、[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多台设备之间运行一个中心 Gateway 网关和专用工作节点？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）配合 **nodes** 和 **智能体**：

    - **Gateway 网关（中心）：** 持有渠道（Signal/WhatsApp）、路由和会话。
    - **Nodes（设备）：** Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作节点）：** 为特殊角色提供独立的大脑/工作区（例如“Hetzner ops”、“Personal data”）。
    - **子智能体：** 当你需要并行时，从主智能体生成后台工作。
    - **TUI：** 连接到 Gateway 网关并切换智能体/会话。

    文档：[Nodes](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[TUI](/zh-CN/web/tui)。

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

    默认值是 `false`（有头）。在某些网站上，无头模式更容易触发反机器人检查。参见 [Browser](/zh-CN/tools/browser)。

    无头模式使用**相同的 Chromium 引擎**，适用于大多数自动化场景（表单、点击、抓取、登录）。主要差异是：

    - 没有可见的浏览器窗口（如需可视化，请使用截图）。
    - 某些网站在无头模式下对自动化更严格（CAPTCHA、反机器人）。
      例如，X/Twitter 经常会拦截无头会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制路径（或任何基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参阅 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 gateways 和 nodes

<AccordionGroup>
  <Accordion title="命令是如何在 Telegram、gateway 和 nodes 之间传播的？">
    Telegram 消息由 **gateway** 处理。gateway 运行智能体，
    只有在需要节点工具时，才会通过 **Gateway WebSocket** 调用节点：

    Telegram → Gateway → 智能体 → `node.*` → Node → Gateway → Telegram

    Nodes 不会看到入站 provider 流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程环境，我的智能体如何访问我的电脑？">
    简短回答：**将你的电脑配对为一个 node**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、system）。

    典型设置：

    1. 在始终在线的主机上运行 Gateway 网关（VPS/家用服务器）。
    2. 将 Gateway 网关主机和你的电脑放到同一个 tailnet 中。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**通过 SSH 远程连接**模式（或直接 tailnet）
       连接，使其能注册为一个 node。
    5. 在 Gateway 网关上批准该 node：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；nodes 通过 Gateway WebSocket 连接。

    安全提醒：配对 macOS node 允许在该机器上执行 `system.run`。
    只配对你信任的设备，并查看[安全](/zh-CN/gateway/security)。

    文档：[Nodes](/zh-CN/nodes)、[Gateway 协议](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。现在怎么办？">
    先检查基础项：

    - Gateway 网关正在运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，请确认 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立并指向正确端口。
    - 确认你的允许列表（私信或群组）包含你的账户。

    文档：[Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[渠道](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。虽然没有内置“机器人对机器人”桥接，但你可以通过几种
    可靠方式实现：

    **最简单的方式：** 使用两个机器人都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让机器人 A 向机器人 B 发送消息，然后让机器人 B 像平常一样回复。

    **CLI bridge（通用）：** 运行一个脚本，调用另一个 Gateway 网关的
    `openclaw agent --message ... --deliver`，目标是另一个机器人
    正在监听的聊天。如果其中一个机器人位于远程 VPS 上，就通过 SSH/Tailscale
    将你的 CLI 指向那个远程 Gateway 网关（参见[远程访问](/zh-CN/gateway/remote)）。

    示例模式（从能够访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加一道防护规则，防止两个机器人无限循环（例如只允许提及、使用渠道
    允许列表，或设定“不要回复机器人消息”的规则）。

    文档：[远程访问](/zh-CN/gateway/remote)、[Agent CLI](/zh-CN/cli/agent)、[智能体发送](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要分别使用独立 VPS 吗？">
    不需要。一个 Gateway 网关就可以托管多个智能体，每个智能体都有自己的工作区、默认模型
    和路由。这是正常设置，比每个智能体运行
    一台独立 VPS 更便宜也更简单。

    只有在你需要硬隔离（安全边界）或需要完全不同且不想共享的配置时，才考虑使用独立 VPS。否则，请保持一个 Gateway 网关，并
    使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="相比从 VPS 通过 SSH 访问，在我的个人笔记本上使用 node 有什么好处吗？">
    有——nodes 是从远程 Gateway 网关访问你笔记本电脑的第一等方式，而且它们
    不仅仅提供 shell 访问。Gateway 网关运行在 macOS/Linux（Windows 通过 WSL2）上，并且
    很轻量（小型 VPS 或 Raspberry Pi 级别设备即可；4 GB RAM 已经很充足），因此一种常见
    设置是始终在线的主机 + 你的笔记本作为一个 node。

    - **无需入站 SSH。** Nodes 会主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。** `system.run` 会受到该笔记本上节点允许列表/审批的控制。
    - **更多设备工具。** 除了 `system.run` 之外，nodes 还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 将 Gateway 网关保留在 VPS 上，但通过笔记本上的 node host 本地运行 Chrome，或通过 Chrome MCP 连接主机上的本地 Chrome。

    SSH 适合临时 shell 访问，但对于持续的智能体工作流和
    设备自动化来说，nodes 更简单。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="Nodes 会运行一个 gateway 服务吗？">
    不会。每台主机通常只应运行**一个 gateway**，除非你有意运行隔离配置档（参见[多个 gateways](/zh-CN/gateway/multiple-gateways)）。Nodes 是连接到
    gateway 的外设（iOS/Android nodes，或菜单栏应用中的 macOS “node mode”）。关于无头 node
    host 和 CLI 控制，请参阅 [Node host CLI](/zh-CN/cli/node)。

    修改 `gateway`、`discovery` 和 `canvasHost` 后，需要执行完整重启。

  </Accordion>

  <Accordion title="有没有通过 API / RPC 应用配置的方法？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树，包括其浅层 schema 节点、匹配到的 UI 提示和直接子节点摘要
    - `config.get`：获取当前快照 + hash
    - `config.patch`：安全的部分更新（多数 RPC 编辑的首选）；会在可能时热重载，并在需要时重启
    - `config.apply`：验证 + 替换完整配置；会在可能时热重载，并在需要时重启
    - 仅限所有者的 `gateway` 运行时工具仍会拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会规范化到相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制谁可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从我的 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用，并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，使 VPS 拥有稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你希望无需 SSH 就能使用 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 gateway 保持绑定在 loopback 上，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何把 Mac node 连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 暴露的是**Gateway Control UI + WS**。Nodes 通过同一个 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS 和 Mac 位于同一个 tailnet 中**。
    2. **在 Remote 模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       应用会将 Gateway 端口做隧道转发，并作为 node 连接。
    3. **在 gateway 上批准该 node：**

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 协议](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装，还是只添加一个 node？">
    如果你只需要第二台笔记本上的**本地工具**（屏幕/摄像头/exec），就把它添加为
    **node**。这样可以保持单一 Gateway 网关，并避免重复配置。本地 node 工具
    目前仅支持 macOS，但我们计划将其扩展到其他 OS。

    只有在你需要**硬隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)、[多个 gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 是如何加载环境变量的？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

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

    完整优先级和来源请参阅 [/environment](/zh-CN/help/environment)。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway 网关，但环境变量消失了。怎么办？">
    两个常见修复方式：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，它们也能被读取。
    2. 启用 shell 导入（选择加入的便捷功能）：

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

    这会运行你的登录 shell，并且只导入缺失的预期键名（永不覆盖）。等效环境变量为：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示 "Shell env: off."。为什么？'>
    `openclaw models status` 报告的是**shell 环境变量导入**是否已启用。“Shell env: off”
    **不**表示你的环境变量缺失——它只表示 OpenClaw 不会自动加载
    你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下任一种方式修复：

    1. 将 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其添加到配置中的 `env` 块中（仅在缺失时应用）。

    然后重启 gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot token 会从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多聊天

<AccordionGroup>
  <Accordion title="如何开始一个新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。请参阅[会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 后过期，但此功能**默认禁用**（默认值为 **0**）。
    将它设置为正数即可启用空闲过期。启用后，在空闲期之后的**下一条**
    消息会为该聊天键开启一个新的会话 ID。
    这不会删除 transcript——只是开启一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法打造一个 OpenClaw 实例团队（一个 CEO 和很多智能体）？">
    有，可以通过**多智能体路由**和**子智能体**来实现。你可以创建一个协调者
    智能体和多个工作智能体，每个都有自己的工作区和模型。

    不过，这更适合被看作一个**有趣的实验**。它会消耗大量 token，而且通常
    不如使用一个机器人配合多个独立会话来得高效。我们通常设想的模式是
    与一个机器人交流，并通过不同会话处理并行工作。这个
    机器人在需要时也可以生成子智能体。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[子智能体](/zh-CN/tools/subagents)、[Agents CLI](/zh-CN/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务中途被截断？我该如何防止？">
    会话上下文受模型上下文窗口限制。长聊天、大量工具输出或很多
    文件都可能触发压缩或截断。

    有帮助的方法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务之前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人重新读取。
    - 对于长任务或并行工作，使用子智能体，这样主聊天会保持更小。
    - 如果这种情况经常发生，请选择具有更大上下文窗口的模型。

  </Accordion>

  <Accordion title="如何彻底重置 OpenClaw 但保留安装？">
    使用 reset 命令：

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

    - 如果新手引导检测到已有配置，也会提供**重置**选项。请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profile（`--profile` / `OPENCLAW_PROFILE`），请分别重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发环境重置：`openclaw gateway --dev --reset`（仅限开发；会清空开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我遇到了 "context too large" 错误——该如何重置或压缩？'>
    使用以下任一种方式：

    - **压缩**（保留对话，但总结较早轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来指导摘要方式。

    - **重置**（对同一聊天键使用新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果它持续发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`），以裁剪旧的工具输出。
    - 使用具有更大上下文窗口的模型。

    文档：[压缩](/zh-CN/concepts/compaction)、[会话修剪](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 "LLM request rejected: messages.content.tool_use.input field required"？'>
    这是 provider 验证错误：模型发出了一个 `tool_use` 区块，但缺少必需的
    `input`。这通常意味着会话历史已经过期或损坏（经常出现在长线程
    或工具/schema 变更之后）。

    修复方法：通过 `/new`（作为独立消息）开启一个新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟都会收到 heartbeat 消息？">
    Heartbeat 默认每 **30 分钟**运行一次（使用 OAuth 认证时为 **1 小时**）。可调节或禁用：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或设为 "0m" 以禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown
    标题，例如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果文件不存在，heartbeat 仍会运行，并由模型决定该做什么。

    每智能体覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把“机器人账号”加入 WhatsApp 群组吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到该群。
    默认情况下，群组回复会被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你希望只有**你自己**能够触发群组回复：

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
    方式 1（最快）：跟踪日志，并在群里发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    方式 2（如果已经完成配置/加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[目录](/zh-CN/cli/directory)、[日志](/zh-CN/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组里不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 但没有 `"*"`，而该群组不在允许列表中。

    请参阅 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会和私信共享上下文吗？">
    直接聊天默认会折叠到主会话。群组/渠道拥有各自的会话键，而 Telegram 话题 / Discord 线程则是独立会话。请参阅 [群组](/zh-CN/channels/groups) 和 [群组消息](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬限制。几十个（甚至上百个）都没问题，但请注意：

    - **磁盘增长：** 会话 + transcript 存放在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：** 智能体越多，意味着并发模型使用越多。
    - **运维开销：** 每智能体 auth profiles、工作区和渠道路由。

    提示：

    - 为每个智能体保持一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘变大，请清理旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 查找散落的工作区和 profile 不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个隔离智能体，并按
    渠道/账户/peer 路由入站消息。Slack 作为渠道是受支持的，也可以绑定到特定智能体。

    浏览器访问能力很强，但并不等于“能做任何人类能做的事情”——反机器人机制、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每种角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 需要时通过 Chrome MCP 或 node 使用本地浏览器。

    文档：[多智能体路由](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型是你设置为以下字段的内容：

    ```
    agents.defaults.model.primary
    ```

    模型使用 `provider/model` 格式引用（例如：`openai/gpt-5.5`）。如果你省略 provider，OpenClaw 会先尝试别名，然后尝试对该精确模型 id 进行唯一已配置 provider 匹配，最后才会回退到已配置默认 provider，作为已弃用的兼容路径。如果该 provider 不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置 provider/模型，而不是暴露一个已过时、已移除 provider 的默认值。但你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：** 使用你 provider 栈中可用的最强最新一代模型。
    **对于启用了工具或处理不受信任输入的智能体：** 优先考虑模型强度，而不是成本。
    **对于日常/低风险聊天：** 使用更便宜的回退模型，并按智能体角色进行路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对于高风险工作，使用你能负担得起的**最佳模型**；对于日常
    聊天或摘要，则使用更便宜的模型。你可以按智能体路由模型，并使用子智能体来
    并行处理长任务（每个子智能体都会消耗 token）。请参阅[模型](/zh-CN/concepts/models)和
    [子智能体](/zh-CN/tools/subagents)。

    强烈警告：较弱或过度量化的模型更容易受到提示
    注入和不安全行为的影响。请参阅[安全](/zh-CN/gateway/security)。

    更多背景信息：[模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**相关字段。避免整体替换配置。

    安全选项：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你就是打算替换整个配置，否则不要对部分对象使用 `config.apply`。
    对于 RPC 编辑，先使用 `config.schema.lookup` 检查，并优先使用 `config.patch`。
    lookup payload 会给出规范化路径、浅层 schema 文档/约束以及直接子节点摘要，
    用于部分更新。
    如果你确实覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档：[模型](/zh-CN/concepts/models)、[配置向导](/zh-CN/cli/configure)、[配置](/zh-CN/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。Ollama 是本地模型最简单的接入路径。

    最快设置方式：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull gemma4`
    3. 如果你也想使用云模型，请运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会提供云模型以及你的本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云模型不需要本地拉取
    - 如需手动切换，请使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或高度量化的模型更容易受到提示
    注入的影响。对于任何可以使用工具的机器人，我们强烈推荐使用**大模型**。
    如果你仍然想用小模型，请启用沙箱隔离并使用严格的工具允许列表。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型 providers](/zh-CN/concepts/model-providers)、[安全](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能彼此不同，并且会随时间变化；没有固定的 provider 推荐。
    - 请在每个 gateway 上使用 `openclaw models status` 查看当前运行时设置。
    - 对于安全敏感/启用工具的智能体，请使用可用的最强最新一代模型。
  </Accordion>

  <Accordion title="如何动态切换模型（无需重启）？">
    将 `/model` 命令作为独立消息发送：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。你也可以通过 `agents.defaults.models` 添加自定义别名。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。可通过编号选择：

    ```
    /model 3
    ```

    你也可以为该 provider 强制指定特定 auth profile（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前激活的是哪个智能体、正在使用哪个 `auth-profiles.json` 文件，以及接下来将尝试哪个 auth profile。
    在可用时，它还会显示已配置的 provider 端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消我通过 @profile 设置的 profile 固定？**

    重新运行 `/model`，**不要**带 `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到默认值，可从 `/model` 中选择默认项（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前活动的 auth profile。

  </Accordion>

  <Accordion title="我可以用 GPT 5.5 处理日常任务，用 Codex 5.5 进行编程吗？">
    可以。把其中一个设为默认值，并按需切换：

    - **快速切换（按会话）：** 日常任务使用 `/model gpt-5.5`，或保持相同模型，只在需要时切换 auth/profile。
    - **默认值：** 将 `agents.defaults.model.primary` 设为 `openai/gpt-5.5`。
    - **子智能体：** 将编程任务路由到使用不同默认模型的子智能体。

    请参阅[模型](/zh-CN/concepts/models)和[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置 fast mode？">
    可使用会话开关或配置默认值：

    - **按会话：** 当会话正在使用 `openai/gpt-5.5` 时，发送 `/fast on`。
    - **按模型默认值：** 将 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 设为 `true`。
    - **旧版别名：** 较老的 `openai-codex/gpt-*` 条目仍可保留自己的参数，但新配置应将参数放在 `openai/gpt-*` 上。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，fast mode 会在支持的原生 Responses 请求上映射为 `service_tier = "priority"`。会话级 `/fast` 覆盖优先于配置默认值。

    请参阅 [Thinking 和 fast mode](/zh-CN/tools/thinking) 以及 [OpenAI fast mode](/zh-CN/providers/openai#openai-fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到 "Model ... is not allowed"，然后就没有回复了？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 以及任何
    会话覆盖的**允许列表**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    该错误会**代替**正常回复返回。修复方法：将该模型添加到
    `agents.defaults.models`，移除允许列表，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 "Unknown model: minimax/MiniMax-M2.7"？'>
    这意味着**provider 未配置**（未找到 MiniMax provider 配置或 auth
    profile），因此模型无法被解析。

    修复清单：

    1. 升级到当前 OpenClaw 版本（或从源码 `main` 运行），然后重启 gateway。
    2. 确认 MiniMax 已完成配置（通过向导或 JSON），或者已在环境变量/auth profiles 中存在
       MiniMax 认证信息，以便注入匹配的 provider
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth）。
    3. 使用与你的认证路径匹配的精确模型 id（区分大小写）：
       API 密钥设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       然后从列表中选择（或在聊天中使用 `/model list`）。

    请参阅 [MiniMax](/zh-CN/providers/minimax) 和 [模型](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认模型，而在复杂任务中使用 OpenAI 吗？">
    可以。将 **MiniMax 设为默认值**，并在需要时按**会话**切换模型。
    回退是为**错误**准备的，而不是为“困难任务”准备的，因此请使用 `/model` 或单独的智能体。

    **方案 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **方案 B：使用独立智能体**

    - 智能体 A 默认：MiniMax
    - 智能体 B 默认：OpenAI
    - 按智能体路由，或使用 `/agent` 切换

    文档：[模型](/zh-CN/concepts/models)、[多智能体路由](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 内置了一些默认简写（仅当该模型存在于 `agents.defaults.models` 中时才会生效）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名自定义别名，则以你的值为准。

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

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）会解析为对应模型 ID。

  </Accordion>

  <Accordion title="如何添加来自 OpenRouter 或 Z.AI 等其他 providers 的模型？">
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

    如果你引用了某个 provider/model，但缺少所需的 provider 密钥，就会遇到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后出现 No API key found for provider**

    这通常意味着**新智能体**有一个空的 auth 存储。认证是按智能体区分的，并存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>` 并在向导中配置认证。
    - 或者将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致 auth/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障转移与 “All models failed”

<AccordionGroup>
  <Accordion title="故障转移是如何工作的？">
    故障转移分为两个阶段：

    1. 同一 provider 内的 **Auth profile 轮换**。
    2. 回退到 `agents.defaults.model.fallbacks` 中的下一个 **模型回退**。

    对失败的 profiles 会应用冷却（指数退避），因此即使某个 provider 被限流或暂时故障，OpenClaw 仍能继续回复。

    限流桶不仅包含普通 `429` 响应。OpenClaw
    还会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted` 以及周期性
    使用窗口限制（`weekly/monthly limit reached`）等消息视为值得触发故障转移的
    限流情况。

    某些看起来像计费问题的响应并不是 `402`，而某些 HTTP `402`
    响应也会继续留在该瞬态桶中。如果某个 provider 在 `401` 或 `403`
    上返回显式计费文本，OpenClaw 仍然可以将其保留在
    计费通道中，但 provider 专用的文本匹配器仍然只作用于拥有它们的
    provider（例如 OpenRouter 的 `Key limit exceeded`）。如果某条 `402`
    消息看起来像可重试的使用窗口，或像组织/工作区支出限制
    （`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误则不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这样的特征会保留在压缩/重试路径中，而不会推进模型回退。

    通用服务器错误文本的处理有意比“任何带有
    unknown/error 的内容”更严格。OpenClaw 确实会将 provider 范围内的瞬态形态
    视为值得故障转移的超时/过载信号，例如 Anthropic 的裸 `An unknown error occurred`、OpenRouter 的裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有瞬态服务器文本的 JSON `api_error` payload
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及 provider 繁忙错误如 `ModelNotReadyException`，前提是 provider 上下文匹配。
    像 `LLM request failed with an unknown
    error.` 这样的通用内部回退文本则保持保守，不会单独触发模型回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这意味着系统尝试使用 auth profile ID `anthropic:default`，但在预期的 auth 存储中找不到对应凭证。

    **修复清单：**

    - **确认 auth profiles 的位置**（新路径与旧路径）
      - 当前路径：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认 Gateway 网关已加载你的环境变量**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但 Gateway 网关通过 systemd/launchd 运行，它可能不会继承。请将其放入 `~/.openclaw/.env` 或启用 `env.shellEnv`。
    - **确认你正在编辑正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **做一次模型/认证状态检查**
      - 使用 `openclaw models status` 查看已配置模型以及 providers 是否已认证。

    **针对 “No credentials found for profile anthropic” 的修复清单**

    这意味着当前运行被固定到了 Anthropic auth profile，但 Gateway 网关
    在其 auth 存储中找不到它。

    - **使用 Claude CLI**
      - 在 gateway 主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 密钥**
      - 将 `ANTHROPIC_API_KEY` 放入**gateway 主机**上的 `~/.openclaw/.env`。
      - 清除任何强制使用缺失 profile 的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在 gateway 主机上运行命令**
      - 在远程模式下，auth profiles 存储在 gateway 机器上，而不是你的笔记本上。

  </Accordion>

  <Accordion title="为什么它还尝试了 Google Gemini 并失败了？">
    如果你的模型配置包含 Google Gemini 作为回退（或者你切换到了 Gemini 简写），OpenClaw 会在模型回退时尝试它。如果你尚未配置 Google 凭证，就会看到 `No API key found for provider "google"`。

    修复方法：要么提供 Google 认证，要么从 `agents.defaults.model.fallbacks` / 别名中移除或避免 Google 模型，这样回退就不会路由到那里。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：会话历史中包含**没有签名的 thinking 块**（通常来自
    已中止/部分流式输出）。Google Antigravity 要求 thinking 块必须带签名。

    修复方法：OpenClaw 现在会为 Google Antigravity Claude 清除未签名的 thinking 块。如果问题仍然出现，请开启一个**新会话**，或对该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## Auth profiles：它们是什么以及如何管理

相关内容：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、token 存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是 auth profile？">
    Auth profile 是绑定到某个 provider 的命名凭证记录（OAuth 或 API 密钥）。Profiles 存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的 profile ID 是什么样的？">
    OpenClaw 使用带 provider 前缀的 ID，例如：

    - `anthropic:default`（没有 email 身份时很常见）
    - `anthropic:<email>` 用于 OAuth 身份
    - 你自定义的 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制哪个 auth profile 会先被尝试吗？">
    可以。配置支持 profiles 的可选元数据，以及按 provider 的顺序设置（`auth.order.<provider>`）。这**不会**存储 secrets；它只会将 ID 映射到 provider/mode，并设置轮换顺序。

    如果某个 profile 处于短期**冷却**（限流/超时/认证失败）或较长期的**禁用**状态（计费/余额不足），OpenClaw 可能会暂时跳过它。要检查这一点，请运行 `openclaw models status --json` 并查看 `auth.unusableProfiles`。调优项：`auth.cooldowns.billingBackoffHours*`。

    限流冷却可以按模型作用域进行。对于某个模型处于冷却中的 profile，仍然可能在同一 provider 下对兄弟模型可用，而计费/禁用窗口仍会阻止整个 profile。

    你还可以通过 CLI 设置**每智能体**顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # 默认为已配置的默认智能体（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 将轮换锁定到单个 profile（只尝试这一个）
    openclaw models auth order set --provider anthropic anthropic:default

    # 或设置显式顺序（provider 内回退）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆盖（回退到配置 auth.order / round-robin）
    openclaw models auth order clear --provider anthropic
    ```

    若要指定某个特定智能体：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    若要验证实际会尝试什么，请使用：

    ```bash
    openclaw models status --probe
    ```

    如果某个已存储 profile 被显式顺序排除，probe 会将该 profile 报告为
    `excluded_by_auth_order`，而不是悄悄尝试它。

  </Accordion>

  <Accordion title="OAuth 和 API 密钥有什么区别？">
    OpenClaw 同时支持两者：

    - **OAuth** 通常利用订阅访问权限（在适用时）。
    - **API 密钥** 使用按 token 计费。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API 密钥。

  </Accordion>
</AccordionGroup>

## Gateway：端口、“already running”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、hooks 等）复用的单一端口。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 "Runtime: running"，但 "Connectivity probe: failed"？'>
    因为 “running” 是 **supervisor** 的视角（launchd/systemd/schtasks）。而 connectivity probe 是 CLI 真正去连接 gateway WebSocket 的结果。

    使用 `openclaw gateway status`，并重点查看这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（进程还活着但端口未监听时的常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 "Config (cli)" 和 "Config (service)" 不同？'>
    这是因为你编辑的是一个配置文件，而服务实际运行的是另一个配置文件（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复方法：

    ```bash
    openclaw gateway install --force
    ```

    请在你希望服务使用的同一个 `--profile` / 环境中运行该命令。

  </Accordion>

  <Accordion title='“another gateway instance is already listening” 是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`），以强制实现运行时锁。如果绑定因 `EADDRINUSE` 失败，它就会抛出 `GatewayLockError`，表示已有另一个实例正在监听。

    修复：停止另一个实例、释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到别处的 Gateway 网关）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，必要时附带共享密钥远程凭证：

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    说明：

    - 只有当 `gateway.mode` 为 `local`（或你传递了覆盖标志）时，`openclaw gateway` 才会启动。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧远程凭证；它们本身不会启用本地 gateway 认证。

  </Accordion>

  <Accordion title='Control UI 提示 "unauthorized"（或者不断重连）。现在怎么办？'>
    你的 gateway 认证路径与 UI 的认证方式不匹配。

    事实（来自代码）：

    - Control UI 会将 token 保存在 `sessionStorage` 中，并绑定到当前浏览器标签页会话和所选 gateway URL，因此同一标签页刷新后仍可正常使用，而无需恢复长期 `localStorage` token 持久化。
    - 当发生 `AUTH_TOKEN_MISMATCH` 时，受信任客户端在 gateway 返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时，可以使用缓存的设备 token 进行一次有界重试。
    - 该缓存 token 重试现在会复用与该设备 token 一起存储的缓存已批准作用域。显式 `deviceToken` / 显式 `scopes` 的调用方仍会保留其请求的作用域集合，而不是继承缓存作用域。
    - 在该重试路径之外，连接认证优先级依次是：显式共享 token/password、显式 `deviceToken`、已存储设备 token、bootstrap token。
    - Bootstrap token 的作用域检查是按角色前缀进行的。内置 bootstrap 操作员允许列表只满足操作员请求；node 或其他非操作员角色仍然需要各自角色前缀下的作用域。

    修复：

    - 最快方式：`openclaw dashboard`（会打印并复制 dashboard URL，并尝试打开；如果是无头环境会显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程环境，请先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的 secret。
    - Tailscale Serve 模式：确认 `gateway.auth.allowTailscale` 已启用，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份请求头的原始 loopback/tailnet URL。
    - Trusted-proxy 模式：确认你是通过已配置的非 loopback 身份感知代理访问，而不是通过同主机 loopback 代理或原始 gateway URL。
    - 如果一次重试后仍然不匹配，请轮换/重新批准已配对的设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换命令提示被拒绝，请检查两点：
      - 已配对设备会话只能轮换它们**自己的**设备，除非它们同时拥有 `operator.admin`
      - 显式 `--scope` 值不能超过调用方当前的操作员作用域
    - 仍然卡住？请运行 `openclaw status --all`，并按照[故障排除](/zh-CN/gateway/troubleshooting)操作。认证细节见[仪表板](/zh-CN/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定且没有任何监听">
    `tailnet` 绑定会从你的网络接口中选取一个 Tailscale IP（100.64.0.0/10）。如果机器没有加入 Tailscale（或接口未启动），就没有可绑定的地址。

    修复：

    - 在该主机上启动 Tailscale（让它拥有一个 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    说明：`tailnet` 是显式模式。`auto` 会优先选择 loopback；当你想要仅限 tailnet 绑定时，请使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主机上运行多个 Gateways 吗？">
    通常不需要——一个 Gateway 网关就能运行多个消息渠道和智能体。只有在你需要冗余（例如救援机器人）或硬隔离时，才需要多个 Gateways。

    可以，但你必须隔离以下内容：

    - `OPENCLAW_CONFIG_PATH`（每实例配置）
    - `OPENCLAW_STATE_DIR`（每实例状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 为每个实例使用 `openclaw --profile <name> ...`（会自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或者在手动运行时传入 `--port`）。
    - 安装按 profile 区分的服务：`openclaw --profile <name> gateway install`。

    Profiles 还会给服务名加后缀（`ai.openclaw.<profile>`；旧版为 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多个 gateways](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket 服务器**，它期望收到的第一条消息
    是一个 `connect` frame。如果收到其他内容，它会以 **code 1008**
    （策略违规）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你用了错误的端口或路径。
    - 某个代理或隧道剥离了认证请求头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS 则用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了认证，请在 `connect` frame 中附带 token/password。

    如果你使用 CLI 或 TUI，URL 应如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议细节：[Gateway 协议](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快跟踪日志的方法：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 gateway 通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profiles 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多内容请参阅[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    使用 gateway 辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行 gateway，`openclaw gateway --force` 可以重新夺回端口。请参阅 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——该如何重启 OpenClaw？">
    Windows 上有**两种安装模式**：

    **1）WSL2（推荐）：** Gateway 网关运行在 Linux 中。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装服务，请在前台启动它：

    ```bash
    openclaw gateway run
    ```

    **2）原生 Windows（不推荐）：** Gateway 网关直接运行在 Windows 上。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行（无服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows（WSL2）](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已经启动，但回复始终没有到达。我该检查什么？">
    先做一次快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - **gateway 主机**上未加载模型认证（检查 `models status`）。
    - 渠道配对/允许列表拦截了回复（检查渠道配置 + 日志）。
    - WebChat/仪表板打开时未使用正确 token。

    如果你处于远程模式，请确认隧道/Tailscale 连接正常，并且
    Gateway WebSocket 可达。

    文档：[渠道](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason"——现在怎么办？'>
    这通常意味着 UI 丢失了 WebSocket 连接。请检查：

    1. Gateway 网关是否正在运行？`openclaw gateway status`
    2. Gateway 网关是否健康？`openclaw status`
    3. UI 是否持有正确 token？`openclaw dashboard`
    4. 如果是远程环境，隧道/Tailscale 链路是否正常？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[仪表板](/zh-CN/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我该检查什么？">
    先看日志和渠道状态：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后按错误类型处理：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目过多。OpenClaw 已经会裁剪到 Telegram 限制并尝试用更少命令重试，但某些菜单项仍然需要被移除。请减少插件/Skills/自定义命令，或在你不需要菜单时禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 上运行或位于代理之后，请确认出站 HTTPS 可用，并且 `api.telegram.org` 的 DNS 正常。

    如果 Gateway 网关是远程的，请确保你查看的是 Gateway 主机上的日志。

    文档：[Telegram](/zh-CN/channels/telegram)、[渠道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有任何输出。我该检查什么？">
    先确认 Gateway 网关可达，并且智能体能够运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你期望回复出现在某个聊天
    渠道中，请确保投递已启用（`/deliver on`）。

    文档：[TUI](/zh-CN/web/tui)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何彻底停止然后重新启动 Gateway 网关？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监管的服务**（macOS 上是 launchd，Linux 上是 systemd）。
    当 Gateway 网关作为后台守护进程运行时，请使用这种方式。

    如果你是前台运行，请按 Ctrl-C 停止，然后运行：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 和 openclaw gateway 有什么区别？">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在当前终端会话中**前台运行** gateway。

    如果你安装了服务，请使用 gateway 命令。想执行一次性前台运行时，请使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出问题时，最快获得更多细节的方法是什么？">
    使用 `--verbose` 启动 Gateway 网关，以获取更多控制台细节。然后检查日志文件，查看渠道认证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的 skill 生成了一张图片/PDF，但什么都没有发送出去">
    智能体发出的出站附件必须包含一行 `MEDIA:<path-or-url>`（单独占一行）。请参阅[OpenClaw 助手设置](/zh-CN/start/openclaw)和[智能体发送](/zh-CN/tools/agent-send)。

    CLI 发送方式：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还要检查：

    - 目标渠道支持出站媒体，并且没有被允许列表阻止。
    - 文件大小在 provider 限制之内（图片会被调整到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、temp/media-store 和通过沙箱验证的文件内。
    - `tools.fs.workspaceOnly=false` 允许 `MEDIA:` 发送智能体本来就能读取的宿主机本地文件，但仅限于媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似 secret 的文件仍会被阻止。

    请参阅[图像](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全与访问控制

<AccordionGroup>
  <Accordion title="把 OpenClaw 暴露给入站私信安全吗？">
    应将入站私信视为不受信任输入。默认设置就是为了降低风险：

    - 在支持私信的渠道上，默认行为是**配对**：
      - 未知发送者会收到配对码；机器人不会处理他们的消息。
      - 批准方式：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求在**每个渠道最多 3 条**；如果代码没有送达，请检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 要公开开放私信，必须显式选择加入（`dmPolicy: "open"` 且允许列表为 `"*"`）。

    运行 `openclaw doctor` 可以发现高风险私信策略。

  </Accordion>

  <Accordion title="提示注入只是公共机器人需要担心的问题吗？">
    不是。提示注入关乎的是**不受信任内容**，而不仅仅是谁能给机器人发私信。
    如果你的助手会读取外部内容（Web 搜索/抓取、浏览器页面、邮件、
    文档、附件、粘贴的日志），这些内容就可能包含试图
    劫持模型的指令。即使**你是唯一发送者**，这也可能发生。

    最大风险在于启用了工具：模型可能会被诱导去
    窃取上下文或代表你调用工具。要降低爆炸半径，可采取以下措施：

    - 使用只读或禁用工具的“阅读器”智能体来总结不受信任内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 同样将解码后的文件/文档文本视为不受信任：OpenResponses
      `input_file` 和媒体附件提取都会把提取出的文本包装在
      显式的外部内容边界标记内，而不是直接传递原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情：[安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人应该有自己的邮箱、GitHub 账号或电话号码吗？">
    对于大多数设置来说，是的。使用独立账户和电话号码隔离机器人，
    可以在出问题时减小影响范围。这也让你更容易轮换
    凭证或撤销访问权限，而不会影响你的个人账户。

    从小范围开始。只授予你真正需要的工具和账户访问权限，之后
    如有需要再逐步扩展。

    文档：[安全](/zh-CN/gateway/security)、[配对](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗？这样安全吗？">
    我们**不推荐**让它完全自主处理你的个人消息。最安全的模式是：

    - 将私信保持在**配对模式**或严格允许列表中。
    - 如果你希望它代表你发消息，请使用**单独的号码或账户**。
    - 让它先起草，然后**发送前审批**。

    如果你想实验，请在专用账户上进行，并保持隔离。参见
    [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我可以为个人助手任务使用更便宜的模型吗？">
    可以，**前提是**该智能体仅用于聊天，且输入是可信的。较小层级
    更容易受到指令劫持，因此请避免将它们用于启用工具的智能体，
    或用于读取不受信任内容的场景。如果你必须使用较小模型，请收紧
    工具权限并在沙箱中运行。参见[安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 里运行了 /start，但没有收到配对码">
    只有当未知发送者给机器人发消息且
    启用了 `dmPolicy: "pairing"` 时，才会发送配对码。单独的 `/start` 不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你希望立即获得访问权限，请将你的发送者 id 加入允许列表，或为该账户设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会主动给我的联系人发消息吗？配对是怎么工作的？">
    不会。默认的 WhatsApp 私信策略是**配对**。未知发送者只会收到一个配对码，他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或你显式触发的发送。

    批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导中的电话号码提示：它用于设置你的**允许列表/所有者**，以便允许你自己的私信。它不会用于自动发送。如果你是在个人 WhatsApp 号码上运行，请填写该号码，并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、终止任务，以及“它就是不停”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部或工具消息只会在会话启用了 **verbose**、**trace** 或 **reasoning** 时显示。

    请在你看到这些消息的聊天中执行：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，请检查 Control UI 中的会话设置，并将 verbose
    设为 **inherit**。同时确认你没有使用在配置中将 `verboseDefault` 设为
    `on` 的机器人 profile。

    文档：[Thinking 和 verbose](/zh-CN/tools/thinking)、[安全](/zh-CN/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消一个正在运行的任务？">
    将以下任一内容**作为独立消息发送**（不要加斜杠）：

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    这些是中止触发词（不是 Slash commands）。

    对于后台进程（来自 exec 工具），你可以让智能体执行：

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands 概览请参阅：[Slash commands](/zh-CN/tools/slash-commands)。

    大多数命令必须作为一个**独立**消息发送，并以 `/` 开头，但少数快捷方式（例如 `/status`）对于已加入允许列表的发送者也支持内联使用。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（"Cross-context messaging denied"）'>
    OpenClaw 默认会阻止**跨 provider**消息传递。如果某个工具调用绑定到了
    Telegram，它就不会发送到 Discord，除非你显式允许它。

    为该智能体启用跨 provider 消息传递：

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    编辑配置后请重启 gateway。

  </Accordion>

  <Accordion title='为什么感觉机器人会“忽略”连续快速发来的消息？'>
    Queue 模式控制新消息如何与一个正在运行中的任务交互。使用 `/queue` 更改模式：

    - `steer` - 新消息重定向当前任务
    - `followup` - 逐条运行消息
    - `collect` - 批量收集消息并回复一次（默认）
    - `steer-backlog` - 先重定向，再处理积压
    - `interrupt` - 中止当前运行并重新开始

    你还可以为 followup 模式添加诸如 `debounce:2s cap:25 drop:summarize` 的选项。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='使用 Anthropic API 密钥时，默认模型是什么？'>
    在 OpenClaw 中，凭证与模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API 密钥）只能启用认证，而实际的默认模型仍然是你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，说明 Gateway 网关在当前运行智能体的预期 `auth-profiles.json` 中找不到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

仍然卡住？请到 [Discord](https://discord.com/invite/clawd) 提问，或发起一个 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。
