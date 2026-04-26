---
read_when:
    - 新安装、新手引导卡住或首次运行报错
    - 选择认证方式和提供商订阅
    - 无法访问 docs.openclaw.ai、无法打开仪表板、安装卡住
sidebarTitle: First-run FAQ
summary: 常见问题：快速开始与首次运行设置——安装、新手引导、认证、订阅、初始故障
title: 常见问题：首次运行设置
x-i18n:
    generated_at: "2026-04-26T07:49:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcb8dc24317457344298e5c7591062941de4df6e8b321cb8317335386c1da1f4
    source_path: help/faq-first-run.md
    workflow: 15
---

  快速开始与首次运行问答。有关日常操作、模型、认证、会话和故障排除，请参见主 [常见问题](/zh-CN/help/faq)。

  ## 快速开始与首次运行设置

  <AccordionGroup>
  <Accordion title="我卡住了，最快的解决办法是什么">
    使用一个能够**看到你的机器**的本地 AI 智能体。这比在 Discord 里提问有效得多，因为大多数“我卡住了”的情况都是**本地配置或环境问题**，远程协助者无法检查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你机器级别的设置问题（PATH、服务、权限、认证文件）。通过可修改的（git）安装方式为它们提供**完整的源码检出**：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从一个 git 检出**安装 OpenClaw，因此智能体可以读取代码和文档，并根据你正在运行的确切版本进行推理。你之后随时可以通过重新运行安装器并去掉 `--install-method git` 切回稳定版。

    提示：让智能体先**规划并监督**修复过程（一步一步），然后只执行必要的命令。这样能让改动保持最小，也更容易审计。

    如果你发现了真实的 bug 或修复方案，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    先从这些命令开始（在寻求帮助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 Gateway 网关/智能体健康状态 + 基本配置。
    - `openclaw models status`：检查提供商认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见的配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[如果出了问题，先看最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档：[安装](/zh-CN/install)、[安装器标志](/zh-CN/install/installer)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳过。各种跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：不在已配置的活跃时间窗口内
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但还没有任何任务到达执行间隔
    - `alerts-disabled`：所有 Heartbeat 可见性都被禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在真实的 Heartbeat 运行完成后，到期时间戳才会前移。被跳过的运行不会将任务标记为已完成。

    文档：[Heartbeat](/zh-CN/gateway/heartbeat)、[自动化与任务](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行，并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导也可以自动构建 UI 资源。完成新手引导后，你通常会在端口 **18789** 上运行 Gateway 网关。

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

  <Accordion title="完成新手引导后，我如何打开仪表板？">
    向导会在新手引导结束后立即用干净的（非 token 化）仪表板 URL 打开你的浏览器，并且也会在摘要中打印该链接。保持该标签页打开；如果没有自动启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="我该如何在 localhost 和远程环境中为仪表板认证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求共享密钥认证，请将已配置的 token 或密码粘贴到 Control UI 设置中。
    - Token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，可使用 `openclaw doctor --generate-gateway-token` 生成一个 token。

    **不在 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定到 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份头会满足 Control UI/WebSocket 认证（无需粘贴共享密钥，前提是信任 Gateway 网关主机）；HTTP API 仍然需要共享密钥认证，除非你明确使用私有入口 `none` 或受信任代理 HTTP 认证。
      来自同一客户端的错误并发 Serve 认证尝试，会在失败认证限制器记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的共享密钥。
    - **具备身份感知的反向代理**：将 Gateway 网关放在非 loopback 的受信任代理之后，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。通过隧道时共享密钥认证仍然适用；如果出现提示，请粘贴已配置的 token 或密码。

    有关绑定模式和认证细节，请参见 [仪表板](/zh-CN/web/dashboard) 和 [Web 界面](/zh-CN/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec 审批配置？">
    它们控制的是不同层级：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道作为 exec 审批的原生审批客户端

    主机 exec 策略仍然是真正的审批门控。聊天配置只控制审批提示显示在哪里，以及人们如何回应它们。

    在大多数设置中，你**不**需要同时配置两者：

    - 如果聊天本身已支持命令和回复，则同一聊天中的 `/approve` 会通过共享路径生效。
    - 如果受支持的原生渠道可以安全推断审批者，OpenClaw 现在会在 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时自动启用私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主要路径；只有当工具结果表明聊天审批不可用，或手动审批是唯一方式时，智能体才应包含手动 `/approve` 命令。
    - 仅在提示还必须转发到其他聊天或显式运维房间时，才使用 `approvals.exec`。
    - 仅在你明确希望将审批提示回发到发起的房间/话题中时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批则再次分离：默认使用同一聊天中的 `/approve`，可选 `approvals.plugin` 转发，且只有部分原生渠道会在此基础上继续保留插件审批原生处理。

    简而言之：转发用于路由，原生客户端配置用于更丰富的渠道特定 UX。
    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。Gateway 网关**不推荐**使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量——文档列出个人使用只需 **512MB-1GB RAM**、**1 个核心** 和大约 **500MB** 磁盘，并注明 **Raspberry Pi 4 可以运行它**。

    如果你想留出更多余量（日志、媒体、其他服务），推荐 **2GB**，但这
    不是硬性最低要求。

    提示：一台小型 Pi/VPS 可以托管 Gateway 网关，而你可以在笔记本/手机上配对 **nodes**，用于本地屏幕/摄像头/canvas 或命令执行。参见 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短回答：可以运行，但要预期会有一些粗糙边缘。

    - 使用 **64 位**操作系统，并保持 Node >= 22。
    - 优先使用**可修改的（git）安装方式**，这样你可以查看日志并快速更新。
    - 开始时不要加渠道/Skills，然后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/zh-CN/platforms/linux)、[安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch。现在怎么办？">
    该界面依赖 Gateway 网关可达且已认证。TUI 也会在第一次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这行字但**没有回复**，并且 token 一直是 0，说明智能体根本没有运行。

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

    如果 Gateway 网关是远程的，请确保隧道/Tailscale 连接正常，并且 UI
    指向了正确的 Gateway 网关。参见 [远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把设置迁移到新机器（Mac mini）而不重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这样可以
    让你的机器人“完全保持原样”（记忆、会话历史、认证和渠道状态），前提是你同时复制**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、认证配置文件、WhatsApp 凭证、会话和记忆。如果你处于远程模式，请记住会话存储和工作区归 Gateway 网关主机所有。

    **重要：**如果你只是把工作区提交/推送到 GitHub，你备份的是**记忆 + 引导文件**，但**不包括**会话历史或认证。那些内容位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容：[迁移](/zh-CN/install/migrating)、[磁盘上的存储位置](#where-things-live-on-disk)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [远程模式](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本的新内容？">
    查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目位于顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的
    部分就是最近发布的版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（必要时还会有 docs/other 部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会因 Xfinity Advanced Security 而错误地屏蔽 `docs.openclaw.ai`。请禁用该功能或将 `docs.openclaw.ai` 加入允许列表，然后重试。
    也请通过这里帮助我们解除屏蔽：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档也镜像在 GitHub 上：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和 beta 的区别">
    **稳定版**和 **beta** 是 **npm dist-tag**，不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，稳定版本会先发布到 **beta**，然后通过一个明确的
    提升步骤将同一个版本移动到 `latest`。维护者也可以在需要时
    直接发布到 `latest`。这就是为什么 beta 和稳定版在提升后
    可能指向**同一个版本**。

    查看变更内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    有关安装单行命令以及 beta 和 dev 的区别，请参见下方的手风琴部分。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（在提升后可能与 `latest` 一致）。
    **Dev** 是 `main` 的移动头部（git）；发布时会使用 npm dist-tag `dev`。

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
    有两种选择：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个本地仓库，可以编辑，然后通过 git 更新。

    如果你更喜欢手动进行一次干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/zh-CN/cli/update)、[开发渠道](/zh-CN/install/development-channels)、
    [安装](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略参考：

    - **安装：**2-5 分钟
    - **新手引导：**5-15 分钟，取决于你配置了多少渠道/模型

    如果卡住了，请使用 [安装器卡住](#quick-start-and-first-run-setup)
    和 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

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

    Windows（PowerShell）等价方式：

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
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

    **2）安装后提示 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（在 Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你想获得最顺畅的 Windows 设置体验，请使用 **WSL2**，而不是原生 Windows。
    文档：[Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示中文乱码——我该怎么办？">
    这通常是原生 Windows shell 中控制台代码页不匹配导致的。

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

    如果你在最新 OpenClaw 上仍能复现这个问题，请在这里跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——如何获得更好的答案？">
    使用**可修改的（git）安装方式**，这样你就能在本地拥有完整源码和文档，然后
    在_该文件夹中_询问你的机器人（或 Claude/Codex），这样它就能读取仓库并给出精确回答。

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
    远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护了一个**托管中心**，涵盖常见提供商。选择一个并按照指南操作：

    - [VPS 托管](/zh-CN/vps)（所有提供商集中在一个地方）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，而你通过 Control UI
    （或 Tailscale/SSH）从笔记本电脑/手机访问它。你的状态和工作区
    存放在服务器上，因此应将该主机视为事实来源并做好备份。

    你可以将 **nodes**（Mac/iOS/Android/无头）配对到这个云端 Gateway 网关，以访问
    本地屏幕/摄像头/canvas，或在笔记本电脑上运行命令，同时将
    Gateway 网关保留在云端。

    中心：[Platforms](/zh-CN/platforms)。远程访问：[Gateway 网关远程](/zh-CN/gateway/remote)。
    Nodes：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会断开当前会话），可能需要一个干净的 git 检出，并且
    可能会要求确认。更安全的做法是：由操作员在 shell 中运行更新。

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

    文档：[更新](/zh-CN/cli/update)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/认证设置**（提供商 OAuth、API 密钥、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + 引导文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少认证，它还会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以使用**API 密钥**（Anthropic/OpenAI/其他）运行 OpenClaw，或者使用
    **纯本地模型**，这样你的数据会保留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是这些提供商的可选认证方式。

    对于 OpenClaw 中的 Anthropic，实际区分如下：

    - **Anthropic API 密钥**：正常的 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅认证**：Anthropic 员工
      告诉我们，这种用法再次被允许，因此 OpenClaw 将 `claude -p`
      的使用视为该集成的已认可用法，除非 Anthropic 发布新的
      政策

    对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是更
    可预测的设置方式。OpenAI Codex OAuth 明确支持用于 OpenClaw 这样的外部
    工具。

    OpenClaw 还支持其他托管的订阅式选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档：[Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [本地模型](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API 密钥的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    OpenClaw 将 Claude 订阅认证和 `claude -p` 的使用视为该集成的已认可
    用法，除非 Anthropic 发布新的政策。如果你想要
    最可预测的服务端设置，还是应改用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 员工告诉我们，这种用法再次被允许，因此 OpenClaw 将
    Claude CLI 复用和 `claude -p` 的使用视为该集成的已认可用法，
    除非 Anthropic 发布新的政策。

    Anthropic setup-token 仍然作为受支持的 OpenClaw token 路径可用，但 OpenClaw 现在在可用时更倾向于使用 Claude CLI 复用和 `claude -p`。
    对于生产环境或多用户工作负载，Anthropic API 密钥认证仍然是
    更安全、更可预测的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参见 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这意味着你当前窗口内的 **Anthropic 配额/速率限制** 已耗尽。如果你
    使用 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
    使用 **Anthropic API 密钥**，请检查 Anthropic Console
    中的使用量/计费，并根据需要提高限制。

    如果消息具体是：
    `Extra usage is required for long context requests`，则表示该请求正尝试使用
    Anthropic 的 1M 上下文 beta（`context1m: true`）。这只有在你的
    凭证符合长上下文计费资格时才有效（API 密钥计费，或启用了 Extra Usage 的
    OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样当某个提供商受到速率限制时，OpenClaw 仍可继续回复。
    参见 [Models](/zh-CN/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock Mantle（Converse）** 提供商。在存在 AWS 环境标记时，OpenClaw 可以自动发现流式/文本 Bedrock 目录，并将其合并为一个隐式 `amazon-bedrock` 提供商；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加一个手动提供商条目。参见 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [模型提供商](/zh-CN/providers/models)。如果你更倾向于托管式密钥流程，在 Bedrock 前面使用一个兼容 OpenAI 的代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 认证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。对于通过默认 PI 运行器使用 Codex OAuth，请使用
    `openai-codex/gpt-5.5`。对于直接使用 OpenAI API 密钥访问，请使用
    `openai/gpt-5.5`。GPT-5.5 也可以通过 `openai-codex/gpt-5.5` 使用
    订阅/OAuth，或通过 `openai/gpt-5.5` 和 `agentRuntime.id: "codex"` 使用原生 Codex 应用服务器
    运行。
    参见 [模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍然提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的提供商和 auth-profile id。
    它也是 Codex OAuth 的显式 PI 模型前缀：

    - `openai/gpt-5.5` = PI 中当前直接使用 OpenAI API 密钥的路径
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路径
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = 原生 Codex 应用服务器路径
    - `openai-codex:...` = auth profile id，不是模型引用

    如果你想走直接的 OpenAI Platform 计费/限额路径，请设置
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 订阅认证，请使用
    `openclaw models auth login --provider openai-codex` 登录，并在
    PI 运行中使用 `openai-codex/*` 模型引用。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能与 ChatGPT Web 不同？">
    Codex OAuth 使用 OpenAI 管理的、随套餐而变化的配额窗口。在实际中，
    即使二者都绑定到同一个账户，这些限额也可能与 ChatGPT 网站/应用中的体验不同。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的提供商使用量/配额窗口，但它不会凭空创建或规范化 ChatGPT Web
    权益，使其成为直接 API 访问。如果你想使用直接的 OpenAI Platform
    计费/限额路径，请配合 API 密钥使用 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅认证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这样的外部工具/工作流中使用订阅 OAuth。
    新手引导可以为你运行 OAuth 流程。

    参见 [OAuth](/zh-CN/concepts/oauth)、[模型提供商](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件认证流程**，而不是在 `openclaw.json` 中配置 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 可在 `PATH` 中找到
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth token 存储在 Gateway 网关主机上的 auth profiles 中。详情参见：[模型提供商](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常闲聊吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小模型会截断并泄漏。如果你必须这样做，请在本地运行你能承受的**最大**模型构建（LM Studio），并参见 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化的模型会增加提示注入风险——参见 [安全](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量保持在特定区域内？">
    选择固定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供美国托管选项；选择美国托管变体即可让数据保留在该区域内。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 一起列出，这样在遵守你所选区域提供商的同时，回退模型仍然可用。
  </Accordion>

  <Accordion title="安装这个必须买一台 Mac mini 吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 是可选项——有些人
    会买一台作为常开主机，但小型 VPS、家用服务器或 Raspberry Pi 级别的设备也可以。

    只有在你需要**仅限 macOS 的工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles 服务器可运行在任何 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你还需要其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS node。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持需要 Mac mini 吗？">
    你需要**某台已登录 Messages 的 macOS 设备**。它**不一定非要是** Mac mini——
    任何 Mac 都可以。对于 iMessage，请**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles 服务器运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意一台已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
    - 如果你想要最简单的单机设置，也可以把所有东西都运行在这台 Mac 上。

    文档：[BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为一个
    **node**（配套设备）连接。Nodes 不运行 Gateway 网关——它们提供额外
    能力，例如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或 node host，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Nodes](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

  </Accordion>

  <Accordion title="可以用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到一些运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    对于稳定的 Gateway 网关，请使用 **Node**。

    如果你仍然想尝试 Bun，请在非生产 Gateway 网关上进行，
    并且不要接入 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 是**真人发送者的 Telegram 用户 ID**（数字）。
    它不是机器人用户名。

    设置过程只要求填写数字用户 ID。如果你的配置中已经有旧版 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全的方法（不使用第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方方式（隐私性较差）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    参见 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。把每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164，例如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会得到各自独立的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账号**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）则是按 WhatsApp 账号全局生效的。参见 [多智能体路由](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置各自的默认模型，然后将入站路由（提供商账户或特定 peer）绑定到各自的智能体。示例配置见 [多智能体路由](/zh-CN/concepts/multi-agent)。另请参见 [Models](/zh-CN/concepts/models) 和 [配置](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上用吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具才能在非登录 shell 中被解析。
    近期版本还会在 Linux systemd 服务中预置常见用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在已设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装与 npm install 的区别">
    - **可修改的（git）安装：**完整源码检出，可编辑，最适合贡献者。
      你在本地运行构建，也可以修改代码/文档。
    - **npm install：**全局 CLI 安装，不含仓库，最适合“直接运行”。
      更新来自 npm dist-tags。

    文档：[入门指南](/zh-CN/start/getting-started)、[更新](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后可以在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种方式，然后运行 Doctor，让 Gateway 网关服务指向新的入口点。
    这**不会删除你的数据**——它只会改变 OpenClaw 代码的安装方式。你的状态
    （`~/.openclaw`）和工作区（`~/.openclaw/workspace`）都会保持不变。

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

    Doctor 会检测 Gateway 网关服务入口点不匹配，并提供重写服务配置以匹配当前安装的选项（在自动化中使用 `--repair`）。

    备份建议：参见 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="Gateway 网关应该运行在我的笔记本上还是 VPS 上？">
    简短回答：**如果你想要 24/7 的可靠性，就用 VPS**。如果你想要
    最低摩擦，并且能接受休眠/重启，那么就在本地运行。

    **笔记本（本地 Gateway 网关）**

    - **优点：**无服务器成本，可直接访问本地文件，有可见的浏览器窗口。
    - **缺点：**休眠/网络中断 = 连接断开，操作系统更新/重启会打断运行，必须保持唤醒。

    **VPS / 云端**

    - **优点：**始终在线，网络稳定，没有笔记本休眠问题，更容易持续运行。
    - **缺点：**通常是无头运行（使用截图），只能远程访问文件，你必须通过 SSH 更新。

    **OpenClaw 特别说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 在 VPS 上都能正常工作。唯一真正的权衡是**无头浏览器**还是可见窗口。参见 [Browser](/zh-CN/tools/browser)。

    **推荐默认选择：**如果你之前遇到过 Gateway 网关断连，优先选择 VPS。本地运行也很适合当你正在主动使用 Mac，并且希望访问本地文件或通过可见浏览器进行 UI 自动化时使用。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必须，但为了**可靠性和隔离性**，我们推荐这样做。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，更少受到休眠/重启中断，权限更干净，更容易持续运行。
    - **共享笔记本/台式机：**用于测试和主动使用完全没问题，但在机器休眠或更新时会出现暂停。

    如果你想兼顾两者优势，可以把 Gateway 网关放在专用主机上，再把你的笔记本配对为一个 **node**，用于本地屏幕/摄像头/exec 工具。参见 [Nodes](/zh-CN/nodes)。
    有关安全指导，请阅读 [安全](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础的 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：**1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐配置：**1-2 vCPU、2GB RAM 或更多余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档：[Linux](/zh-CN/platforms/linux)、[VPS 托管](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。把 VM 视作 VPS 即可：它需要始终在线、可访问，并且有足够的
    RAM 供 Gateway 网关和你启用的所有渠道使用。

    基准建议：

    - **绝对最低配置：**1 vCPU、1GB RAM。
    - **推荐配置：**如果你运行多个渠道、浏览器自动化或媒体工具，建议使用 2GB RAM 或更多。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用的是 Windows，**WSL2 是最简单的 VM 风格设置**，并且工具兼容性最好。
    参见 [Windows](/zh-CN/platforms/windows)、[VPS 托管](/zh-CN/vps)。
    如果你是在 VM 中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 主常见问题（模型、会话、Gateway 网关、安全等）
- [安装概览](/zh-CN/install)
- [入门指南](/zh-CN/start/getting-started)
- [故障排除](/zh-CN/help/troubleshooting)
