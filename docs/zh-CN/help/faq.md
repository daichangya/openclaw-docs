---
read_when:
    - 回答常见的设置、安装、新手引导或运行时支持问题
    - 在进一步调试之前，对用户报告的问题进行分流处理
summary: 关于 OpenClaw 设置、配置和使用的常见问题
title: 常见问题
x-i18n:
    generated_at: "2026-04-20T18:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bde531507540bc91bc131c3e27d72a8be76cc53ef46a5e01aaeaf02a71cc8a2
    source_path: help/faq.md
    workflow: 15
---

# 常见问题

针对真实世界部署场景（本地开发、VPS、多智能体、OAuth/API 密钥、模型故障切换）提供快速答案，以及更深入的故障排除。对于运行时诊断，请参见 [故障排除](/zh-CN/gateway/troubleshooting)。完整配置参考请参见 [Configuration](/zh-CN/gateway/configuration)。

## 如果出现故障，最初的六十秒

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

   显示 supervisor 运行时状态与 RPC 可达性、探测目标 URL，以及服务可能使用了哪个配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 网关健康探测，包括在支持时执行渠道探测
   （需要可访问的 Gateway 网关）。参见 [Health](/zh-CN/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，则回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；参见 [Logging](/zh-CN/logging) 和 [故障排除](/zh-CN/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。参见 [Doctor](/zh-CN/gateway/doctor)。

7. **Gateway 网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向正在运行的 Gateway 网关请求完整快照（仅 WS）。参见 [Health](/zh-CN/gateway/health)。

## 快速开始和首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快的解决办法是什么？">
    使用一个能够**查看你的机器**的本地 AI 智能体。这比去 Discord 提问有效得多，
    因为大多数“我卡住了”的情况其实都是**本地配置或环境问题**，
    远程协助者无法直接检查。

    - **Claude Code**： [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**： [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你机器级别的
    设置问题（PATH、服务、权限、凭证文件）。请通过可修改的（git）安装方式，
    向它们提供**完整源码检出**：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这会**从 git 检出**安装 OpenClaw，因此智能体可以读取代码 + 文档，
    并基于你正在运行的确切版本进行推理。你之后始终可以通过重新运行安装程序、
    且不带 `--install-method git` 来切回稳定版。

    提示：让智能体先**规划并监督**修复过程（分步骤），然后只执行
    必要的命令。这样可以让改动保持最小，也更容易审计。

    如果你发现了真实 bug 或修复，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    从这些命令开始（在寻求帮助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：快速查看 Gateway 网关/智能体健康状态 + 基本配置。
    - `openclaw models status`：检查提供商凭证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见的配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环： [最初的六十秒](#first-60-seconds-if-something-is-broken)。
    安装文档： [Install](/zh-CN/install)、[Installer flags](/zh-CN/install/installer)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直被跳过。各种跳过原因是什么意思？">
    常见的 Heartbeat 跳过原因：

    - `quiet-hours`：处于配置的 active-hours 时间窗口之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/仅标题的脚手架内容
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式已启用，但还没有任何任务到达间隔时间
    - `alerts-disabled`：所有 Heartbeat 可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在一次真实的 Heartbeat 运行
    完成后，才会推进到期时间戳。被跳过的运行不会将任务标记为已完成。

    文档： [Heartbeat](/zh-CN/gateway/heartbeat)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用新手引导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导还可以自动构建 UI 资源。完成新手引导后，你通常会在端口 **18789** 上运行 Gateway 网关。

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

  <Accordion title="完成新手引导后，我该如何打开仪表板？">
    向导会在新手引导结束后立即用一个干净的（不带令牌）仪表板 URL 打开你的浏览器，并且也会在摘要中打印该链接。保持那个标签页打开；如果它没有自动启动，请在同一台机器上复制/粘贴打印出的 URL。
  </Accordion>

  <Accordion title="在 localhost 和远程环境下，我该如何为仪表板进行身份验证？">
    **localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret 身份验证，请将配置的 token 或 password 粘贴到 Control UI 设置中。
    - token 来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - password 来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置 shared secret，可使用 `openclaw doctor --generate-gateway-token` 生成一个 token。

    **不在 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定到 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头会满足 Control UI/WebSocket 身份验证要求（无需粘贴 shared secret，前提是信任 Gateway 网关主机）；HTTP API 仍然需要 shared-secret 身份验证，除非你明确使用 private-ingress `none` 或 trusted-proxy HTTP 身份验证。
      来自同一客户端的错误并发 Serve 身份验证尝试，会在 failed-auth limiter 记录之前被串行化，因此第二次错误重试可能已经显示 `retry later`。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置 password 身份验证），打开 `http://<tailscale-ip>:18789/`，然后在仪表板设置中粘贴匹配的 shared secret。
    - **具备身份感知能力的反向代理**：让 Gateway 网关保持在非 loopback 的 trusted proxy 后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开该代理 URL。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。通过隧道仍然适用 shared-secret 身份验证；如果出现提示，请粘贴配置的 token 或 password。

    有关绑定模式和身份验证详情，请参见 [Dashboard](/web/dashboard) 和 [Web surfaces](/web)。

  </Accordion>

  <Accordion title="为什么聊天审批会有两个 exec approval 配置？">
    它们控制的是不同层：

    - `approvals.exec`：将审批提示转发到聊天目标
    - `channels.<channel>.execApprovals`：让该渠道作为 exec approvals 的原生审批客户端

    主机 exec 策略仍然是真正的审批关卡。聊天配置只控制审批提示
    出现在哪里，以及人们可以如何响应。

    在大多数设置中，你**不**需要同时配置两者：

    - 如果聊天本身已经支持命令和回复，那么同一聊天中的 `/approve` 会通过共享路径生效。
    - 如果受支持的原生渠道能够安全推断审批者，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在会自动启用私信优先的原生审批。
    - 当原生审批卡片/按钮可用时，该原生 UI 是主要路径；只有在工具结果显示聊天审批不可用或手动审批是唯一途径时，智能体才应包含手动 `/approve` 命令。
    - 仅当提示也必须转发到其他聊天或明确的运维房间时，才使用 `approvals.exec`。
    - 仅当你明确希望审批提示也回发到发起的房间/话题中时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 插件审批则是另一套机制：默认使用同一聊天中的 `/approve`、可选的 `approvals.plugin` 转发，并且只有部分原生渠道会在其上继续保留原生插件审批处理。

    简而言之：转发用于路由，原生客户端配置用于提供更丰富的渠道专属 UX。
    参见 [Exec Approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐使用 `pnpm`。**不推荐** Gateway 网关使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    可以。Gateway 网关很轻量——文档列出了**512MB-1GB RAM**、**1 个核心**以及大约 **500MB**
    磁盘空间即可满足个人使用需求，并说明 **Raspberry Pi 4 可以运行它**。

    如果你希望留出更多余量（日志、媒体、其他服务），推荐使用 **2GB**，但这
    不是硬性最低要求。

    提示：一个小型 Pi/VPS 可以托管 Gateway 网关，你还可以在笔记本电脑/手机上配对 **nodes**，用于
    本地屏幕/摄像头/canvas 或命令执行。参见 [Nodes](/zh-CN/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么建议吗？">
    简短回答：可以运行，但要预期会有一些边角问题。

    - 使用 **64-bit** 操作系统，并保持 Node >= 22。
    - 优先选择**可修改的（git）安装**，这样你可以查看日志并快速更新。
    - 开始时不要启用渠道/Skills，然后逐个添加。
    - 如果你遇到奇怪的二进制问题，通常是 **ARM 兼容性** 问题。

    文档： [Linux](/zh-CN/platforms/linux)、[Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / 新手引导无法 hatch。现在怎么办？">
    该界面依赖 Gateway 网关可达且身份验证成功。TUI 还会在首次 hatch 时自动发送
    “Wake up, my friend!”。如果你看到这行字却**没有回复**，
    且 token 始终为 0，说明智能体根本没有运行。

    1. 重启 Gateway 网关：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + 身份验证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，请运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 网关在远程机器上，请确保隧道/Tailscale 连接已建立，并且 UI
    指向了正确的 Gateway 网关。参见 [Remote access](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把我的设置迁移到一台新机器（Mac mini）上，而不重新做新手引导吗？">
    可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这样
    可以让你的机器人“完全保持不变”（memory、会话历史、凭证和渠道
    状态），前提是你复制了**这两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 网关服务。

    这会保留配置、auth profiles、WhatsApp 凭证、会话和 memory。如果你处于
    远程模式，请记住会话存储和工作区都由 Gateway 网关主机持有。

    **重要：**如果你只把工作区提交/推送到 GitHub，那么你备份的是
    **memory + bootstrap 文件**，但**不包括**会话历史或凭证。那些内容位于
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关内容： [Migrating](/zh-CN/install/migrating)、[磁盘上的存放位置](#where-things-live-on-disk)、
    [智能体工作区](/zh-CN/concepts/agent-workspace)、[Doctor](/zh-CN/gateway/doctor)、
    [Remote mode](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本有哪些新内容？">
    查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在最上方。如果顶部部分标记为 **Unreleased**，那么下一个带日期的
    部分就是最近发布的版本。条目按 **Highlights**、**Changes** 和
    **Fixes** 分组（需要时还会有 docs/其他部分）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    某些 Comcast/Xfinity 连接会因 Xfinity
    Advanced Security 而错误地屏蔽 `docs.openclaw.ai`。请将其禁用，或将 `docs.openclaw.ai` 加入允许名单，然后重试。
    也请通过这里的链接帮助我们解除封锁： [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档在 GitHub 上也有镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 的区别">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是独立的代码线：

    - `latest` = stable
    - `beta` = 用于测试的早期构建

    通常，一个 stable 版本会先发布到 **beta**，然后通过一个显式的
    提升步骤把同一版本移动到 `latest`。维护者在需要时也可以
    直接发布到 `latest`。这就是为什么在提升之后，beta 和 stable 可能会
    指向**同一个版本**。

    查看有哪些变化：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装单行命令以及 beta 和 dev 的区别，请参见下面的折叠面板。

  </Accordion>

  <Accordion title="如何安装 beta 版本？beta 和 dev 有什么区别？">
    **Beta** 是 npm dist-tag `beta`（在提升后可能与 `latest` 相同）。
    **Dev** 是 `main` 的移动头部（git）；发布时使用 npm dist-tag `dev`。

    单行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装程序（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多细节： [Development channels](/zh-CN/install/development-channels) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何试用最新内容？">
    有两种方式：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可修改安装（来自安装站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这样你会得到一个可本地编辑的仓库，然后可以通过 git 更新。

    如果你更想手动进行干净克隆，请使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档： [Update](/cli/update)、[Development channels](/zh-CN/install/development-channels)、
    [Install](/zh-CN/install)。

  </Accordion>

  <Accordion title="安装和新手引导通常需要多长时间？">
    粗略参考：

    - **安装：**2-5 分钟
    - **新手引导：**5-15 分钟，取决于你配置了多少渠道/模型

    如果卡住了，请参见 [安装程序卡住了？](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速调试循环。

  </Accordion>

  <Accordion title="安装程序卡住了？如何获得更多反馈？">
    使用**详细输出**重新运行安装程序：

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

    Windows（PowerShell）对应方式：

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项： [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示 git not found 或 openclaw not recognized">
    两个常见的 Windows 问题：

    **1）npm 错误 spawn git / git not found**

    - 安装 **Git for Windows**，并确保 `git` 已在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装程序。

    **2）安装后 openclaw is not recognized**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH 中（Windows 上不需要 `\bin` 后缀；在大多数系统上它是 `%AppData%\npm`）。
    - 更新 PATH 后，关闭并重新打开 PowerShell。

    如果你希望获得最顺畅的 Windows 设置体验，请使用 **WSL2**，而不是原生 Windows。
    文档： [Windows](/zh-CN/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文——我该怎么办？">
    这通常是原生 Windows shell 中控制台代码页不匹配导致的。

    症状：

    - `system.run`/`exec` 输出中的中文显示为乱码
    - 同一个命令在另一个终端配置中显示正常

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

    如果在最新 OpenClaw 上仍能复现此问题，请在以下位置跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——我怎样才能获得更好的答案？">
    使用**可修改的（git）安装**，这样你就能在本地拥有完整源码和文档，然后
    在_该目录中_向你的机器人（或 Claude/Codex）提问，这样它就能读取仓库并给出更准确的回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多细节： [Install](/zh-CN/install) 和 [Installer flags](/zh-CN/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行新手引导。

    - Linux 快速路径 + 服务安装： [Linux](/zh-CN/platforms/linux)。
    - 完整演练： [入门指南](/zh-CN/start/getting-started)。
    - 安装程序 + 更新： [Install & updates](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以。安装到服务器上，然后通过 SSH/Tailscale 访问 Gateway 网关。

    指南： [exe.dev](/zh-CN/install/exe-dev)、[Hetzner](/zh-CN/install/hetzner)、[Fly.io](/zh-CN/install/fly)。
    远程访问： [Gateway remote](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title="云端/VPS 安装指南在哪里？">
    我们维护了一个包含常见提供商的**托管中心**。选择一个并按照对应指南操作：

    - [VPS hosting](/zh-CN/vps)（所有提供商集中在一处）
    - [Fly.io](/zh-CN/install/fly)
    - [Hetzner](/zh-CN/install/hetzner)
    - [exe.dev](/zh-CN/install/exe-dev)

    它在云端的工作方式是：**Gateway 网关运行在服务器上**，而你通过
    Control UI（或 Tailscale/SSH）从笔记本电脑/手机访问它。你的状态 + 工作区
    存放在服务器上，因此请将该主机视为事实来源并做好备份。

    你可以将 **nodes**（Mac/iOS/Android/headless）配对到该云端 Gateway 网关，以便访问
    本地屏幕/摄像头/canvas，或在保留 Gateway 网关位于云端的同时，在你的笔记本电脑上运行命令。

    中心页： [Platforms](/zh-CN/platforms)。远程访问： [Gateway remote](/zh-CN/gateway/remote)。
    Nodes： [Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自己更新自己吗？">
    简短回答：**可以，但不推荐**。更新流程可能会重启
    Gateway 网关（这会中断当前活动会话），可能需要干净的 git 检出，并且
    可能提示你进行确认。更安全的方式是：由操作员在 shell 中运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必须从智能体中自动化执行：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档： [Update](/cli/update)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="新手引导实际上会做什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导你完成：

    - **模型/身份验证设置**（提供商 OAuth、API 密钥、Anthropic setup-token，以及 LM Studio 等本地模型选项）
    - **工作区**位置 + bootstrap 文件
    - **Gateway 网关设置**（bind/port/auth/tailscale）
    - **渠道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及像 QQ Bot 这样的内置渠道插件）
    - **守护进程安装**（macOS 上为 LaunchAgent；Linux/WSL2 上为 systemd 用户单元）
    - **健康检查**和 **Skills** 选择

    如果你配置的模型未知或缺少凭证，它还会发出警告。

  </Accordion>

  <Accordion title="运行这个需要 Claude 或 OpenAI 订阅吗？">
    不需要。你可以通过 **API keys**（Anthropic/OpenAI/其他）运行 OpenClaw，也可以使用
    **仅本地模型**，让你的数据保留在设备上。订阅（Claude
    Pro/Max 或 OpenAI Codex）只是这些提供商的可选身份验证方式。

    对于 OpenClaw 中的 Anthropic，实际区分如下：

    - **Anthropic API key**：按常规 Anthropic API 计费
    - **OpenClaw 中的 Claude CLI / Claude 订阅身份验证**：Anthropic 工作人员
      告诉我们这种用法再次被允许，OpenClaw 目前将 `claude -p`
      用法视为该集成下被认可的方式，除非 Anthropic 发布新的
      政策

    对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是更
    可预测的设置方式。OpenAI Codex OAuth 已明确支持 OpenClaw 这类外部
    工具。

    OpenClaw 还支持其他托管型订阅选项，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文档： [Anthropic](/zh-CN/providers/anthropic)、[OpenAI](/zh-CN/providers/openai)、
    [Qwen Cloud](/zh-CN/providers/qwen)、
    [MiniMax](/zh-CN/providers/minimax)、[GLM Models](/zh-CN/providers/glm)、
    [Local models](/zh-CN/gateway/local-models)、[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以在没有 API key 的情况下使用 Claude Max 订阅吗？">
    可以。

    Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此
    除非 Anthropic 发布新政策，否则 OpenClaw 会将 Claude 订阅身份验证和 `claude -p` 用法视为
    该集成下被认可的方式。如果你想要最可预测的服务器端设置，建议改用 Anthropic API key。

  </Accordion>

  <Accordion title="你们支持 Claude 订阅身份验证（Claude Pro 或 Max）吗？">
    支持。

    Anthropic 工作人员告诉我们，这种用法再次被允许，因此除非 Anthropic 发布新政策，
    否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为
    该集成下被认可的方式。

    Anthropic setup-token 仍然是 OpenClaw 支持的 token 路径之一，但在可用时，OpenClaw 现在更倾向于使用 Claude CLI 复用和 `claude -p`。
    对于生产环境或多用户工作负载，Anthropic API key 身份验证仍然是
    更安全、也更可预测的选择。如果你想在 OpenClaw 中使用其他订阅式托管
    选项，请参见 [OpenAI](/zh-CN/providers/openai)、[Qwen / Model
    Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [GLM
    Models](/zh-CN/providers/glm)。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="为什么我会看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
这表示你当前时间窗口内的 **Anthropic 配额/速率限制** 已耗尽。如果你
使用 **Claude CLI**，请等待窗口重置或升级你的套餐。如果你
使用的是 **Anthropic API key**，请检查 Anthropic Console
中的使用情况/计费信息，并按需提高限制。

    如果消息具体是：
    `Extra usage is required for long context requests`，则表示该请求正在尝试使用
    Anthropic 的 1M 上下文测试版（`context1m: true`）。这仅在你的
    凭证符合长上下文计费资格时才可用（API key 计费，或
    启用了 Extra Usage 的 OpenClaw Claude 登录路径）。

    提示：设置一个**回退模型**，这样当某个提供商受到速率限制时，OpenClaw 仍可继续回复。
    参见 [Models](/cli/models)、[OAuth](/zh-CN/concepts/oauth) 和
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    支持。OpenClaw 内置了 **Amazon Bedrock（Converse）** 提供商。在存在 AWS 环境标记时，OpenClaw 可以自动发现支持流式/文本的 Bedrock 模型目录，并将其合并为隐式 `amazon-bedrock` 提供商；否则你也可以显式启用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或添加一个手动提供商条目。参见 [Amazon Bedrock](/zh-CN/providers/bedrock) 和 [Model providers](/zh-CN/providers/models)。如果你更喜欢托管密钥流程，在 Bedrock 前面加一个兼容 OpenAI 的代理仍然是有效选项。
  </Accordion>

  <Accordion title="Codex 身份验证是如何工作的？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。新手引导可以运行 OAuth 流程，并会在适当时将默认模型设置为 `openai-codex/gpt-5.4`。参见 [Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。
  </Accordion>

  <Accordion title="为什么 ChatGPT GPT-5.4 不会在 OpenClaw 中解锁 openai/gpt-5.4？">
    OpenClaw 将这两条路径分开处理：

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 直接 OpenAI Platform API

    在 OpenClaw 中，ChatGPT/Codex 登录接入的是 `openai-codex/*` 路线，
    而不是直接的 `openai/*` 路线。如果你想在 OpenClaw 中使用直接 API 路径，
    请设置 `OPENAI_API_KEY`（或等效的 OpenAI 提供商配置）。
    如果你想在 OpenClaw 中使用 ChatGPT/Codex 登录，请使用 `openai-codex/*`。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限额可能与 ChatGPT 网页版不同？">
    `openai-codex/*` 使用 Codex OAuth 路线，其可用配额窗口由
    OpenAI 管理，并取决于你的套餐。实际上，即使两者绑定到同一账户，
    这些限制也可能与 ChatGPT 网站/应用中的体验不同。

    OpenClaw 可以在
    `openclaw models status` 中显示当前可见的提供商使用量/配额窗口，但不会凭空生成或
    将 ChatGPT 网页版权益标准化为直接 API 访问。如果你想使用直接的 OpenAI Platform
    计费/限额路径，请使用带 API key 的 `openai/*`。

  </Accordion>

  <Accordion title="你们支持 OpenAI 订阅身份验证（Codex OAuth）吗？">
    支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。
    OpenAI 明确允许在 OpenClaw 这样的外部工具/工作流中
    使用订阅 OAuth。新手引导可以帮你运行该 OAuth 流程。

    参见 [OAuth](/zh-CN/concepts/oauth)、[Model providers](/zh-CN/concepts/model-providers) 和 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用的是**插件身份验证流程**，而不是在 `openclaw.json` 中配置 client id 或 secret。

    步骤：

    1. 在本地安装 Gemini CLI，确保 `gemini` 已加入 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这会将 OAuth tokens 存储在 Gateway 网关主机上的 auth profiles 中。详情参见： [Model providers](/zh-CN/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小卡模型会截断且更容易泄漏。如果你一定要用，请在本地运行你能承载的**最大**模型构建（LM Studio），并参见 [/gateway/local-models](/zh-CN/gateway/local-models)。更小/量化的模型会增加提示注入风险——参见 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="如何让托管模型流量保持在特定区域内？">
    选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 提供了美国托管选项；请选择美国托管变体，以便将数据保留在该区域内。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 一并列出，这样在遵守你所选区域化提供商限制的同时，回退选项仍然可用。
  </Accordion>

  <Accordion title="安装这个必须买一台 Mac mini 吗？">
    不需要。OpenClaw 可运行在 macOS 或 Linux 上（Windows 通过 WSL2）。Mac mini 只是可选项——有些人
    会买一台作为常开主机，但小型 VPS、家庭服务器或 Raspberry Pi 级别的机器也可以。

    只有在你需要**仅限 macOS 的工具**时才需要 Mac。对于 iMessage，请使用 [BlueBubbles](/zh-CN/channels/bluebubbles)（推荐）——BlueBubbles server 可运行在任何 Mac 上，而 Gateway 网关可以运行在 Linux 或其他地方。如果你想使用其他仅限 macOS 的工具，请在 Mac 上运行 Gateway 网关，或配对一个 macOS 节点。

    文档： [BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、[Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="要支持 iMessage，我需要一台 Mac mini 吗？">
    你需要**某台已登录 Messages 的 macOS 设备**。它**不一定**非得是 Mac mini——
    任何 Mac 都可以。对于 iMessage，请**使用 [BlueBubbles](/zh-CN/channels/bluebubbles)**（推荐）——BlueBubbles server 运行在 macOS 上，而 Gateway 网关可以运行在 Linux 或其他地方。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway 网关，并在任意已登录 Messages 的 Mac 上运行 BlueBubbles server。
    - 如果你想要最简单的单机设置，也可以把所有内容都运行在那台 Mac 上。

    文档： [BlueBubbles](/zh-CN/channels/bluebubbles)、[Nodes](/zh-CN/nodes)、
    [Mac remote mode](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？">
    可以。**Mac mini 可以运行 Gateway 网关**，而你的 MacBook Pro 可以作为
    **节点**（配套设备）连接。节点本身不运行 Gateway 网关——它们提供额外
    能力，例如该设备上的屏幕/摄像头/canvas 和 `system.run`。

    常见模式：

    - Gateway 网关运行在 Mac mini 上（始终在线）。
    - MacBook Pro 运行 macOS 应用或节点主机，并与 Gateway 网关配对。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档： [Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 吗？">
    **不推荐**使用 Bun。我们观察到运行时 bug，尤其是在 WhatsApp 和 Telegram 上。
    稳定运行的 Gateway 网关请使用 **Node**。

    如果你仍然想尝试 Bun，请仅在非生产 Gateway 网关上进行，
    并且不要使用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 里应该填什么？">
    `channels.telegram.allowFrom` 应填写**发送消息的人类用户的 Telegram user ID**（数字）。它不是机器人用户名。

    设置流程只接受数字用户 ID。如果你的配置中已经有遗留的 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全的方式（不使用第三方机器人）：

    - 给你的机器人发私信，然后运行 `openclaw logs --follow`，读取 `from.id`。

    官方 Bot API：

    - 给你的机器人发私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates`，读取 `message.from.id`。

    第三方方式（隐私性较低）：

    - 给 `@userinfobot` 或 `@getidsbot` 发私信。

    参见 [/channels/telegram](/zh-CN/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多个人可以使用同一个 WhatsApp 号码连接不同的 OpenClaw 实例吗？">
    可以，通过**多智能体路由**实现。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 形如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都会拥有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账户**，而私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账户都是全局的。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [WhatsApp](/zh-CN/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以同时运行一个“快速聊天”智能体和一个“用于编码的 Opus”智能体吗？'>
    可以。使用多智能体路由：为每个智能体设置各自的默认模型，然后将入站路由（提供商账户或特定 peers）绑定到对应智能体。示例配置见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。另请参见 [Models](/zh-CN/concepts/models) 和 [Configuration](/zh-CN/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 能在 Linux 上工作吗？">
    可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务的 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具才能在非登录 shell 中被解析。
    新版本还会在 Linux systemd 服务中预置常见的用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在已设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安装和 npm install 的区别">
    - **可修改的（git）安装：**完整源码检出，可编辑，最适合贡献者。
      你可以在本地运行构建，并修改代码/文档。
    - **npm install：**全局 CLI 安装，不包含仓库，最适合“只想跑起来”。
      更新来自 npm dist-tags。

    文档： [入门指南](/zh-CN/start/getting-started)、[Updating](/zh-CN/install/updating)。

  </Accordion>

  <Accordion title="之后我可以在 npm 安装和 git 安装之间切换吗？">
    可以。安装另一种方式后，再运行 Doctor，让 Gateway 网关服务指向新的入口点。
    这**不会删除你的数据**——它只会更改 OpenClaw 代码的安装方式。你的状态
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

    Doctor 会检测 Gateway 网关服务入口点是否不匹配，并提供将服务配置重写为匹配当前安装的选项（在自动化中使用 `--repair`）。

    备份建议：参见 [备份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该把 Gateway 网关运行在笔记本电脑上还是 VPS 上？">
    简短回答：**如果你想要 24/7 可靠性，就用 VPS**。如果你想要
    最低的使用门槛，并且可以接受休眠/重启带来的影响，那就在本地运行。

    **笔记本电脑（本地 Gateway 网关）**

    - **优点：**没有服务器成本，可直接访问本地文件，可见的实时浏览器窗口。
    - **缺点：**休眠/网络中断 = 断线，操作系统更新/重启会中断，机器必须保持唤醒。

    **VPS / 云端**

    - **优点：**始终在线，网络稳定，没有笔记本休眠问题，更容易持续运行。
    - **缺点：**通常以 headless 方式运行（使用截图），只能远程访问文件，更新时必须通过 SSH。

    **OpenClaw 特定说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 在 VPS 上都能正常工作。唯一真正的取舍是 **headless 浏览器** 与可见窗口之间的差别。参见 [Browser](/zh-CN/tools/browser)。

    **推荐默认选择：**如果你之前遇到过 Gateway 网关断连，选 VPS。若你经常在 Mac 上主动使用它，并且希望访问本地文件或使用带可见浏览器的 UI 自动化，那么本地运行也很适合。

  </Accordion>

  <Accordion title="把 OpenClaw 运行在专用机器上有多重要？">
    不是必须，但**为了可靠性和隔离性，推荐这样做**。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，更少受到休眠/重启影响，权限更清晰，更容易持续运行。
    - **共享笔记本/台式机：**用于测试和主动使用完全没问题，但当机器休眠或更新时，预计会出现暂停。

    如果你想两者兼得，可以把 Gateway 网关放在专用主机上，再把你的笔记本电脑配对为一个**节点**，用于本地屏幕/摄像头/exec 工具。参见 [Nodes](/zh-CN/nodes)。
    有关安全指导，请阅读 [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低要求和推荐操作系统是什么？">
    OpenClaw 很轻量。对于基础的 Gateway 网关 + 一个聊天渠道：

    - **绝对最低配置：**1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐配置：**1-2 vCPU、2GB RAM 或更多余量（日志、媒体、多个渠道）。Node 工具和浏览器自动化可能比较吃资源。

    操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在这些系统上测试最充分。

    文档： [Linux](/zh-CN/platforms/linux)、[VPS hosting](/zh-CN/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗？要求是什么？">
    可以。把 VM 当作 VPS 看待即可：它需要始终在线、可访问，并且有足够的
    RAM 来运行 Gateway 网关以及你启用的任何渠道。

    基础建议：

    - **绝对最低配置：**1 vCPU、1GB RAM。
    - **推荐配置：**如果你运行多个渠道、浏览器自动化或媒体工具，建议 2GB RAM 或更多。
    - **操作系统：**Ubuntu LTS 或其他现代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最容易的 VM 风格设置**，并且具有最好的工具链
    兼容性。参见 [Windows](/zh-CN/platforms/windows)、[VPS hosting](/zh-CN/vps)。
    如果你是在 VM 中运行 macOS，请参见 [macOS VM](/zh-CN/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## OpenClaw 是什么？

<AccordionGroup>
  <Accordion title="用一段话介绍 OpenClaw 是什么？">
    OpenClaw 是一个运行在你自有设备上的个人 AI 助手。它会在你已经使用的消息表面上回复你（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等内置渠道插件），并且在受支持的平台上还能提供语音 + 实时 Canvas。**Gateway 网关**是始终在线的控制平面；这个助手本身才是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不只是“Claude 的一个包装器”。它是一个**本地优先的控制平面**，让你可以在**自己的硬件上**
    运行一个功能强大的助手，并通过你已经在使用的聊天应用访问它，同时具备
    有状态会话、memory 和工具——而无需把你的工作流控制权交给托管式
    SaaS。

    亮点：

    - **你的设备，你的数据：**在任何你想要的地方运行 Gateway 网关（Mac、Linux、VPS），并将
      工作区 + 会话历史保留在本地。
    - **真实渠道，而不是网页沙箱：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，
      并且在受支持平台上支持移动语音和 Canvas。
    - **模型无关：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，支持按智能体路由
      和故障切换。
    - **纯本地选项：**运行本地模型，这样如果你愿意，**所有数据都可以保留在你的设备上**。
    - **多智能体路由：**按渠道、账户或任务拆分不同智能体，每个都有自己的
      工作区和默认设置。
    - **开源且可修改：**可检查、可扩展、可自托管，无供应商锁定。

    文档： [Gateway 网关](/zh-CN/gateway)、[Channels](/zh-CN/channels)、[Multi-agent](/zh-CN/concepts/multi-agent)、
    [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="我刚刚完成设置——第一步应该做什么？">
    很好的起步项目包括：

    - 搭建一个网站（WordPress、Shopify，或简单的静态站点）。
    - 制作一个移动应用原型（大纲、界面、API 方案）。
    - 整理文件和文件夹（清理、命名、打标签）。
    - 连接 Gmail 并自动化摘要或后续跟进。

    它可以处理大型任务，但在你把任务拆分成多个阶段，并
    使用子智能体并行工作时，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常见的五个日常使用场景是什么？">
    日常高价值用法通常包括：

    - **个人简报：**汇总你关心的收件箱、日历和新闻。
    - **研究与起草：**快速调研、摘要，以及电子邮件或文档的初稿。
    - **提醒与跟进：**由 cron 或 heartbeat 驱动的提醒和清单。
    - **浏览器自动化：**填写表单、收集数据、重复执行网页任务。
    - **跨设备协作：**从手机发送任务，让 Gateway 网关在服务器上执行，然后在聊天中接收结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 做潜在客户开发、外联、广告和博客吗？">
    对于**调研、筛选和起草**来说，可以。它可以扫描网站、构建候选名单、
    汇总潜在客户信息，并撰写外联或广告文案草稿。

    对于**外联或广告投放**，请始终保留人工参与。避免垃圾信息，遵守当地法律和
    平台政策，并在发送前审核所有内容。最安全的模式是让
    OpenClaw 起草，由你审批。

    文档： [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="相比 Claude Code，在网页开发方面有什么优势？">
    OpenClaw 是一个**个人助手**和协作协调层，而不是 IDE 替代品。若要获得
    仓库内最快的直接编码循环，请使用 Claude Code 或 Codex。当你
    需要持久 memory、跨设备访问和工具编排时，请使用 OpenClaw。

    优势：

    - **跨会话持久 memory + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway 网关**（可运行在 VPS 上，随时随地交互）
    - **节点**支持本地浏览器/屏幕/摄像头/exec

    展示： [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不把仓库弄脏的情况下自定义 skills？">
    使用托管覆盖，而不是直接修改仓库中的副本。把你的更改放到 `~/.openclaw/skills/<name>/SKILL.md`（或者通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加一个文件夹）。优先级顺序为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`，因此托管覆盖仍然会优先于内置 skills，而无需修改 git。如果你需要全局安装某个 skill，但只让部分智能体可见，请把共享副本保存在 `~/.openclaw/skills` 中，并通过 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的修改才应该放在仓库中并以 PR 形式提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 会在下一次会话中将其视为 `<workspace>/skills`。如果某个 skill 只应对特定智能体可见，请再配合使用 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    当前支持的模式有：

    - **Cron jobs**：隔离作业可以为每个作业设置 `model` 覆盖。
    - **子智能体**：把任务路由到具有不同默认模型的独立智能体。
    - **按需切换**：使用 `/model` 随时切换当前会话模型。

    参见 [Cron jobs](/zh-CN/automation/cron-jobs)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行重任务时会卡住。我该如何卸载这些负载？">
    对于耗时长或可并行的任务，请使用**子智能体**。子智能体运行在它们自己的会话中，
    返回摘要，并保持你的主聊天仍然可响应。

    你可以让机器人“为这个任务生成一个子智能体”，或使用 `/subagents`。
    使用聊天中的 `/status` 查看 Gateway 网关当前正在做什么（以及它是否繁忙）。

    Token 提示：长任务和子智能体都会消耗 token。如果你关心成本，可以通过 `agents.defaults.subagents.model` 为子智能体设置更便宜的模型。

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上与线程绑定的子智能体会话是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到某个子智能体或会话目标，这样该线程中的后续消息就会持续发送到那个绑定的会话。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true` 生成（也可选 `mode: "session"` 以支持持久后续交互）。
    - 或者使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 查看绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖项：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Discord](/zh-CN/channels/discord)、[Configuration Reference](/zh-CN/gateway/configuration-reference)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="子智能体完成了，但完成更新发到了错误的位置，或者根本没有发出。我该检查什么？">
    先检查解析后的请求者路由：

    - 当存在绑定的线程或会话路由时，完成模式的子智能体投递会优先使用它。
    - 如果完成来源只携带一个渠道，OpenClaw 会回退到请求者会话中存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），以便仍可直接投递。
    - 如果既没有绑定路由，也没有可用的存储路由，直接投递可能失败，结果将回退为排队的会话投递，而不是立即发到聊天中。
    - 无效或过期的目标仍可能强制回退到队列投递，或导致最终投递失败。
    - 如果子任务最后一条可见的助手回复恰好是静默 token `NO_REPLY` / `no_reply`，或恰好是 `ANNOUNCE_SKIP`，OpenClaw 会有意抑制公告，而不是发布过时的早期进度。
    - 如果子任务在仅执行工具调用后超时，公告可能会将其折叠为简短的部分进度摘要，而不是回放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Sub-agents](/zh-CN/tools/subagents)、[Background Tasks](/zh-CN/automation/tasks)、[Session Tools](/zh-CN/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒没有触发。我该检查什么？">
    Cron 在 Gateway 网关进程内运行。如果 Gateway 网关没有持续运行，
    定时作业就不会执行。

    检查清单：

    - 确认已启用 cron（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 网关是否 24/7 运行（没有休眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但没有任何内容发送到渠道。为什么？">
    先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不应有任何外部消息。
    - 缺失或无效的 announce 目标（`channel` / `to`）表示运行器跳过了对外投递。
    - 渠道身份验证失败（`unauthorized`、`Forbidden`）表示运行器尝试投递了，但凭证阻止了它。
    - 静默的隔离结果（仅有 `NO_REPLY` / `no_reply`）会被视为有意不投递，因此运行器也会抑制排队回退投递。

    对于隔离的 cron 作业，最终投递由运行器负责。智能体应当
    返回纯文本摘要，由运行器发送。`--no-deliver` 会让
    该结果保留在内部；它并不会让智能体改为通过
    消息工具直接发送。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Background Tasks](/zh-CN/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 cron 运行会切换模型，或重试一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 在活动运行抛出 `LiveSessionModelSwitchError` 时，
    可以持久化运行时模型切换并重试。重试会保留切换后的
    提供商/模型；如果切换还携带了新的 auth profile 覆盖，cron
    也会在重试前将其持久化。

    相关选择规则：

    - 若适用，Gmail hook 模型覆盖优先级最高。
    - 然后是每个作业的 `model`。
    - 然后是任何已存储的 cron 会话模型覆盖。
    - 最后是常规的智能体/默认模型选择。

    重试循环是有界的。初始尝试加上 2 次切换重试之后，
    cron 会中止，而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 Skills？">
    使用原生 `openclaw skills` 命令，或直接将 Skills 放入你的工作区。macOS 的 Skills UI 在 Linux 上不可用。
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
    目录。只有在你想发布或同步自己 Skills 时，才需要安装单独的 `clawhub` CLI。若要在多个智能体之间共享安装，请将 Skill 放在
    `~/.openclaw/skills` 下，并使用 `agents.defaults.skills` 或
    `agents.list[].skills` 来缩小哪些智能体可以看到它。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划运行任务，或持续在后台运行吗？">
    可以。使用 Gateway 网关调度器：

    - **Cron jobs**：用于计划任务或重复任务（在重启后仍会保留）。
    - **Heartbeat**：用于“主会话”的定期检查。
    - **隔离作业**：用于会发布摘要或投递到聊天中的自主智能体。

    文档： [Cron jobs](/zh-CN/automation/cron-jobs)、[Automation & Tasks](/zh-CN/automation)、
    [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅限 Apple macOS 的 Skills 吗？">
    不能直接运行。macOS Skills 受 `metadata.openclaw.os` 和所需二进制文件控制，并且只有当它们在 **Gateway 网关主机** 上符合条件时，Skills 才会出现在 system prompt 中。在 Linux 上，仅 `darwin` 的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖该门控逻辑。

    有三种受支持的模式：

    **选项 A - 在 Mac 上运行 Gateway 网关（最简单）。**
    在存在 macOS 二进制文件的机器上运行 Gateway 网关，然后通过 [远程模式](#gateway-ports-already-running-and-remote-mode) 或 Tailscale 从 Linux 连接。由于 Gateway 网关主机是 macOS，这些 Skills 会正常加载。

    **选项 B - 使用 macOS 节点（无需 SSH）。**
    在 Linux 上运行 Gateway 网关，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将 **Node Run Commands** 设为 “Always Ask” 或 “Always Allow”。当节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。智能体会通过 `nodes` 工具运行这些 Skills。如果你选择 “Always Ask”，在提示中批准 “Always Allow” 会将该命令加入允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    保持 Gateway 网关运行在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上执行的 SSH 包装器。然后覆盖该 Skill，使其允许 Linux，从而保持符合条件。

    1. 为该二进制文件创建一个 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将该包装器放到 Linux 主机的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆盖 Skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动新会话，以刷新 Skills 快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置。

    可选方案：

    - **自定义 Skill / 插件：**最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：**无需编写代码，但更慢，也更脆弱。

    如果你想为每个客户保留上下文（如代理机构工作流），一种简单模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 正在进行的工作）。
    - 让智能体在会话开始时获取该页面。

    如果你想要原生集成，请提交功能请求，或构建一个
    面向这些 API 的 Skill。

    安装 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装会落在当前工作区的 `skills/` 目录中。若要在多个智能体之间共享 Skills，请将它们放到 `~/.openclaw/skills/<name>/SKILL.md`。如果共享安装只应对部分智能体可见，请配置 `agents.defaults.skills` 或 `agents.list[].skills`。有些 Skills 依赖通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（见上方 Homebrew Linux 常见问题条目）。参见 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和 [ClawHub](/zh-CN/tools/clawhub)。

  </Accordion>

  <Accordion title="如何让 OpenClaw 使用我现有的已登录 Chrome？">
    使用内置的 `user` 浏览器 profile，它通过 Chrome DevTools MCP 进行附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自定义名称，可以创建一个显式 MCP profile：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    这条路径可以使用本地主机浏览器，或已连接的浏览器节点。如果 Gateway 网关运行在别处，那么请在浏览器所在机器上运行节点主机，或改用远程 CDP。

    `existing-session` / `user` 的当前限制：

    - 操作基于 ref，而不是基于 CSS 选择器
    - 上传需要 `ref` / `inputRef`，并且目前一次只支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器或原始 CDP profile

  </Accordion>
</AccordionGroup>

## 沙箱隔离和 memory

<AccordionGroup>
  <Accordion title="有专门的沙箱隔离文档吗？">
    有。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。对于 Docker 专用设置（在 Docker 中运行完整 Gateway 网关或沙箱镜像），请参见 [Docker](/zh-CN/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉功能有限——我该如何启用完整功能？">
    默认镜像以安全优先方式构建，并以 `node` 用户运行，因此它不
    包含系统包、Homebrew 或内置浏览器。若要获得更完整的设置：

    - 持久化 `/home/node`，使用 `OPENCLAW_HOME_VOLUME`，这样缓存才能保留。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖预构建进镜像。
    - 通过内置 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH`，并确保该路径被持久化。

    文档： [Docker](/zh-CN/install/docker)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="我可以让私信保持私密，同时让群组公开/沙箱隔离，并只用一个智能体吗？">
    可以——前提是你的私密流量是**私信**，公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/渠道会话（非主会话键）会在配置的沙箱后端中运行，而主私信会话则保留在主机上运行。如果你没有选择具体后端，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱隔离会话中可用的工具。

    设置演练 + 示例配置： [群组：私密私信 + 公开群组](/zh-CN/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考： [Gateway 网关配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何把主机文件夹绑定到沙箱中？">
    设置 `agents.defaults.sandbox.docker.binds` 为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局绑定和按智能体绑定会合并；当 `scope: "shared"` 时，按智能体绑定会被忽略。对于任何敏感内容请使用 `:ro`，并记住绑定会绕过沙箱文件系统边界。

    OpenClaw 会同时根据规范化路径，以及通过最深层已存在祖先解析出的规范路径来验证绑定源。这意味着即使最后一个路径段尚不存在，通过父级符号链接逃逸的情况也仍会以失败关闭的方式被拦截，并且允许根目录检查在符号链接解析后依然适用。

    示例和安全说明请参见 [沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts) 和 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="memory 是如何工作的？">
    OpenClaw 的 memory 就是智能体工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中整理后的长期笔记（仅主会话/私密会话）

    OpenClaw 还会运行一个**静默的预压缩 memory 刷新**，提醒模型
    在自动压缩前写入持久笔记。这只会在工作区
    可写时运行（只读沙箱会跳过）。参见 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="memory 老是忘事。我怎样才能让它记住？">
    让机器人**把这个事实写入 memory**。长期笔记应写入 `MEMORY.md`，
    短期上下文则写入 `memory/YYYY-MM-DD.md`。

    这仍然是我们正在改进的领域。提醒模型去存储记忆会有帮助；
    它会知道该怎么做。如果它还是一直忘记，请确认 Gateway 网关在每次运行时
    使用的都是同一个工作区。

    文档： [Memory](/zh-CN/concepts/memory)、[智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="memory 会永久保留吗？有哪些限制？">
    memory 文件存储在磁盘上，除非你删除它们，否则会一直保留。限制来自你的
    存储空间，而不是模型。**会话上下文**仍然受模型
    上下文窗口限制，因此长对话可能会被压缩或截断。这就是为什么
    会有 memory 搜索——它只会把相关部分重新拉回上下文中。

    文档： [Memory](/zh-CN/concepts/memory)、[Context](/zh-CN/concepts/context)。

  </Accordion>

  <Accordion title="语义 memory 搜索需要 OpenAI API key 吗？">
    只有在你使用 **OpenAI embeddings** 时才需要。Codex OAuth 只覆盖聊天/补全，
    **不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或
    Codex CLI 登录）**并不能帮助启用语义 memory 搜索。OpenAI embeddings
    仍然需要真实的 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置提供商，OpenClaw 会在能够解析到 API key 时
    自动选择一个提供商（auth profiles、`models.providers.*.apiKey` 或环境变量）。
    如果能解析到 OpenAI key，它会优先选择 OpenAI；否则如果能解析到 Gemini key，
    就选择 Gemini；再之后是 Voyage，然后是 Mistral。如果没有可用的远程 key，
    memory 搜索会保持禁用状态，直到你完成配置。如果你配置了本地模型路径
    且该路径存在，OpenClaw
    会优先选择 `local`。当你显式设置
    `memorySearch.provider = "ollama"` 时，也支持 Ollama。

    如果你更希望保持本地化，可设置 `memorySearch.provider = "local"`（并可选设置
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，请设置
    `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embeddings
    模型——设置细节请参见 [Memory](/zh-CN/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 磁盘上的存放位置

<AccordionGroup>
  <Accordion title="与 OpenClaw 一起使用的所有数据都会保存在本地吗？">
    不会——**OpenClaw 的状态是本地的**，但**外部服务仍然会看到你发送给它们的内容**。

    - **默认本地：**会话、memory 文件、配置和工作区都位于 Gateway 网关主机上
      （`~/.openclaw` + 你的工作区目录）。
    - **因需求而远程：**你发送给模型提供商（Anthropic/OpenAI 等）的消息会进入
      它们的 API，而聊天平台（WhatsApp/Telegram/Slack 等）会在
      它们的服务器上存储消息数据。
    - **你可以控制足迹：**使用本地模型可以让提示保留在你的机器上，但渠道
      流量仍然会经过该渠道的服务器。

    相关内容： [智能体工作区](/zh-CN/concepts/agent-workspace)、[Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 把数据存储在哪里？">
    一切都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时会复制到 auth profiles 中）             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys，以及可选的 `keyRef`/`tokenRef`）   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供商的可选文件后备 secret 负载                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容文件（静态 `api_key` 条目已清理）                          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 按智能体划分的状态（agentDir + sessions）                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史与状态（按智能体）                                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（按智能体）                                             |

    旧版单智能体路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、memory 文件、Skills 等）是单独的，并通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于**智能体工作区**中，而不是 `~/.openclaw`。

    - **工作区（按智能体）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`（若不存在 `MEMORY.md`，则使用旧版回退 `memory.md`）、
      `memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
    - **状态目录（`~/.openclaw`）**：配置、渠道/提供商状态、auth profiles、会话、日志，
      以及共享 Skills（`~/.openclaw/skills`）。

    默认工作区为 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后“忘记”了内容，请确认 Gateway 网关在每次启动时
    使用的都是同一个工作区（并记住：远程模式使用的是**Gateway 网关主机的**
    工作区，而不是你本地笔记本上的工作区）。

    提示：如果你希望某个行为或偏好能长期保留，请让机器人**把它写入
    AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    参见 [智能体工作区](/zh-CN/concepts/agent-workspace) 和 [Memory](/zh-CN/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    把你的**智能体工作区**放进一个**私有** git 仓库，并备份到某个
    私密位置（例如 GitHub 私有仓库）。这样可以保存 memory + AGENTS/SOUL/USER
    文件，并让你以后能恢复这个助手的“心智”。

    **不要**提交 `~/.openclaw` 下的任何内容（凭证、会话、tokens，或加密的 secrets 负载）。
    如果你需要完整恢复，请分别备份工作区和状态目录
    （参见上面的迁移问题）。

    文档： [智能体工作区](/zh-CN/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何彻底卸载 OpenClaw？">
    请参见专门指南： [Uninstall](/zh-CN/install/uninstall)。
  </Accordion>

  <Accordion title="智能体可以在工作区之外工作吗？">
    可以。工作区是**默认 cwd** 和 memory 锚点，而不是一个硬性沙箱。
    相对路径会在工作区内解析，但绝对路径仍可访问主机上的其他
    位置，除非启用了沙箱隔离。如果你需要隔离，请使用
    [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing) 或按智能体配置的沙箱设置。如果你
    希望某个仓库成为默认工作目录，请将该智能体的
    `workspace` 指向仓库根目录。OpenClaw 仓库本身只是源代码；除非你有意让智能体在其中工作，否则请将
    工作区与之分开。

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
    会话状态由**Gateway 网关主机**持有。如果你处于远程模式，那么你关心的会话存储位于远程机器上，而不是本地笔记本。参见 [会话管理](/zh-CN/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式？在哪里？">
    OpenClaw 会从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果该文件缺失，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在什么都没监听 / UI 显示 unauthorized'>
    非 loopback 绑定**需要有效的 Gateway 网关身份验证路径**。实际来说，这意味着：

    - shared-secret 身份验证：token 或 password
    - 位于已正确配置的非 loopback、具备身份感知能力的反向代理之后时，使用 `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` **不会**单独启用本地 Gateway 网关身份验证。
    - 只有当 `gateway.auth.*` 未设置时，本地调用路径才能将 `gateway.remote.*` 作为回退。
    - 对于 password 身份验证，请改为设置 `gateway.auth.mode: "password"` 并搭配 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析成功，解析会以失败关闭的方式结束（不会被远程回退掩盖）。
    - shared-secret 的 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行身份验证（存储于 app/UI 设置中）。像 Tailscale Serve 或 `trusted-proxy` 这样带身份的模式则使用请求标头。避免把 shared secrets 放进 URL。
    - 当使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机的 loopback 反向代理仍然**不能**满足 trusted-proxy 身份验证。trusted proxy 必须是已配置的非 loopback 来源。

  </Accordion>

  <Accordion title="为什么现在在 localhost 上也需要 token？">
    OpenClaw 默认强制启用 Gateway 网关身份验证，包括 loopback。在正常默认路径下，这意味着 token 身份验证：如果没有显式配置身份验证路径，Gateway 网关启动时会解析为 token 模式并自动生成一个 token，然后保存到 `gateway.auth.token`，因此**本地 WS 客户端也必须进行身份验证**。这样可以阻止其他本地进程调用 Gateway 网关。

    如果你偏好不同的身份验证路径，可以显式选择 password 模式（或者，对于非 loopback 且具备身份感知能力的反向代理，选择 `trusted-proxy`）。如果你**确实**想要开放的 loopback，请在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 随时都可以帮你生成 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后我必须重启吗？">
    Gateway 网关会监视配置，并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：安全更改热应用，关键更改则重启
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

    - `off`：隐藏标语文本，但保留横幅标题/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换显示有趣/季节性标语（默认行为）。
    - 如果你想完全不显示横幅，请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 web search（以及 web fetch）？">
    `web_fetch` 无需 API key 即可使用。`web_search` 则取决于你选择的
    提供商：

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily 等基于 API 的提供商，需要按其常规方式配置 API key。
    - Ollama Web 搜索 无需 key，但它使用你配置的 Ollama 主机，并要求执行 `ollama signin`。
    - DuckDuckGo 无需 key，但它是非官方的基于 HTML 的集成。
    - SearXNG 无需 key/可自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：**运行 `openclaw configure --section web` 并选择一个提供商。
    环境变量替代方案：

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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    提供商专属的 web search 配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    为兼容性考虑，旧版 `tools.web.search.*` 提供商路径目前仍会临时加载，但不应在新配置中继续使用。
    Firecrawl web fetch 回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    说明：

    - 如果你使用允许列表，请加入 `web_search` / `web_fetch` / `x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 会从可用凭证中自动检测第一个已就绪的 fetch 回退提供商。目前内置提供商是 Firecrawl。
    - 守护进程会从 `~/.openclaw/.env`（或服务环境）中读取环境变量。

    文档： [Web tools](/zh-CN/tools/web)。

  </Accordion>

  <Accordion title="config.apply 把我的配置清空了。我该如何恢复并避免再次发生？">
    `config.apply` 会替换**整个配置**。如果你发送的是部分对象，其余所有内容
    都会被移除。

    当前 OpenClaw 会防止许多意外覆盖：

    - OpenClaw 自有的配置写入会在写入前验证更改后的完整配置。
    - 无效或具有破坏性的 OpenClaw 自有写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑导致启动或热重载失败，Gateway 网关会恢复最后一个已知正常配置，并将被拒绝的文件保存为 `openclaw.json.clobbered.*`。
    - 恢复后，主智能体会收到启动警告，这样它就不会盲目再次写入错误配置。

    恢复方法：

    - 检查 `openclaw logs --follow`，查找 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 检查活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果当前已恢复的活动配置工作正常，就保留它，然后使用 `openclaw config set` 或 `config.patch` 仅将你原本打算修改的键复制回来。
    - 运行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果你没有 last-known-good 或被拒绝的负载，就从备份恢复，或者重新运行 `openclaw doctor` 并重新配置渠道/模型。
    - 如果这是意料之外的情况，请提交 bug，并附上你最后已知的配置或任何备份。
    - 本地编码智能体通常可以根据日志或历史记录重建可用配置。

    避免方法：

    - 小改动请使用 `openclaw config set`。
    - 交互式编辑请使用 `openclaw configure`。
    - 当你不确定确切路径或字段结构时，先用 `config.schema.lookup`；它会返回一个浅层 schema 节点以及直接子节点摘要，方便继续下钻。
    - 部分 RPC 编辑请使用 `config.patch`；仅在需要完整替换配置时才使用 `config.apply`。
    - 如果你在智能体运行中使用仅限所有者的 `gateway` 工具，它仍然会拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括会标准化到相同受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档： [配置](/cli/config)、[Configure](/cli/configure)、[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多台设备之间运行一个中央 Gateway 网关和多个专用工作节点？">
    常见模式是**一个 Gateway 网关**（例如 Raspberry Pi）加上**节点**和**智能体**：

    - **Gateway 网关（中央）：**负责渠道（Signal/WhatsApp）、路由和会话。
    - **节点（设备）：**Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **智能体（工作节点）：**为特定角色提供独立的大脑/工作区（例如“Hetzner 运维”“个人数据”）。
    - **子智能体：**当你想要并行执行时，从主智能体中生成后台工作。
    - **TUI：**连接到 Gateway 网关，并切换智能体/会话。

    文档： [Nodes](/zh-CN/nodes)、[远程访问](/zh-CN/gateway/remote)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以以 headless 模式运行吗？">
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

    默认值是 `false`（有界面模式）。在某些网站上，headless 更容易触发反机器人检查。参见 [Browser](/zh-CN/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，适用于大多数自动化任务（表单、点击、抓取、登录）。主要区别在于：

    - 没有可见的浏览器窗口（如果你需要可视化，请使用截图）。
    - 某些网站在 headless 模式下对自动化更严格（CAPTCHA、反机器人机制）。
      例如，X/Twitter 经常会屏蔽 headless 会话。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任意基于 Chromium 的浏览器），然后重启 Gateway 网关。
    完整配置示例请参见 [Browser](/zh-CN/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 网关和节点

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 网关和节点之间传播？">
    Telegram 消息由 **Gateway 网关** 处理。Gateway 网关运行智能体，
    只有在需要节点工具时，才会通过 **Gateway WebSocket** 调用节点：

    Telegram → Gateway → 智能体 → `node.*` → 节点 → Gateway → Telegram

    节点不会看到入站提供商流量；它们只接收节点 RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 网关托管在远程，我的智能体如何访问我的电脑？">
    简短回答：**把你的电脑配对为一个节点**。Gateway 网关运行在别处，但它可以
    通过 Gateway WebSocket 调用你本地机器上的 `node.*` 工具（屏幕、摄像头、system）。

    典型设置：

    1. 在始终在线的主机（VPS/家庭服务器）上运行 Gateway 网关。
    2. 让 Gateway 网关主机和你的电脑处于同一个 tailnet 中。
    3. 确保 Gateway 网关 WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，并以**通过 SSH 远程连接**模式（或直接 tailnet）
       连接，以便它可以注册为一个节点。
    5. 在 Gateway 网关上批准该节点：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP bridge；节点通过 Gateway WebSocket 连接。

    安全提醒：配对一个 macOS 节点意味着允许在该机器上运行 `system.run`。只
    配对你信任的设备，并查阅 [Security](/zh-CN/gateway/security)。

    文档： [Nodes](/zh-CN/nodes)、[Gateway protocol](/zh-CN/gateway/protocol)、[macOS 远程模式](/zh-CN/platforms/mac/remote)、[Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接，但我收不到回复。现在怎么办？">
    先检查基础项：

    - Gateway 网关是否运行：`openclaw gateway status`
    - Gateway 网关健康状态：`openclaw status`
    - 渠道健康状态：`openclaw channels status`

    然后验证身份验证和路由：

    - 如果你使用 Tailscale Serve，请确认 `gateway.auth.allowTailscale` 已正确设置。
    - 如果你通过 SSH 隧道连接，请确认本地隧道已建立，并且指向了正确端口。
    - 确认你的允许列表（私信或群组）包含你的账户。

    文档： [Tailscale](/zh-CN/gateway/tailscale)、[远程访问](/zh-CN/gateway/remote)、[Channels](/zh-CN/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信吗（本地 + VPS）？">
    可以。虽然没有内置的“bot-to-bot”桥接，但你可以通过几种
    可靠方式实现：

    **最简单：**使用两个机器人都能访问的普通聊天渠道（Telegram/Slack/WhatsApp）。
    让 Bot A 给 Bot B 发送消息，然后让 Bot B 像平常一样回复。

    **CLI bridge（通用）：**运行一个脚本，使用
    `openclaw agent --message ... --deliver` 调用另一个 Gateway 网关，目标设为另一个机器人
    正在监听的聊天。如果其中一个机器人在远程 VPS 上，请让你的 CLI 指向那个远程 Gateway 网关，
    通过 SSH/Tailscale 访问（参见 [远程访问](/zh-CN/gateway/remote)）。

    示例模式（在能够访问目标 Gateway 网关的机器上运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加上一条护栏，防止两个机器人无限循环（仅提及时回复、渠道
    允许列表，或“不要回复机器人消息”的规则）。

    文档： [远程访问](/zh-CN/gateway/remote)、[Agent CLI](/cli/agent)、[Agent send](/zh-CN/tools/agent-send)。

  </Accordion>

  <Accordion title="多个智能体需要使用不同的 VPS 吗？">
    不需要。一个 Gateway 网关可以托管多个智能体，每个都有自己的工作区、默认模型
    和路由。这是正常的设置，而且比每个智能体
    单独运行一个 VPS 更便宜、也更简单。

    只有当你需要强隔离（安全边界）或完全不同且不想共享的
    配置时，才需要分开使用多个 VPS。否则，保留一个 Gateway 网关，并
    使用多个智能体或子智能体。

  </Accordion>

  <Accordion title="与其从 VPS 通过 SSH 访问，在我的个人笔记本上使用节点有什么好处吗？">
    有——节点是从远程 Gateway 网关访问你笔记本的首选方式，而且它们
    提供的不只是 shell 访问。Gateway 网关运行在 macOS/Linux 上（Windows 通过 WSL2），并且
    很轻量（小型 VPS 或 Raspberry Pi 级别的机器就足够了；4 GB RAM 已很充裕），因此一种常见
    设置是始终在线的主机加上你的笔记本作为节点。

    - **不需要入站 SSH。** 节点会主动连接到 Gateway WebSocket，并使用设备配对。
    - **更安全的执行控制。** `system.run` 在那台笔记本上由节点允许列表/审批机制控制。
    - **更多设备工具。** 节点除了 `system.run` 之外，还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 把 Gateway 网关放在 VPS 上，但通过笔记本上的节点主机在本地运行 Chrome，或者通过 Chrome MCP 附加到主机上的本地 Chrome。

    SSH 适合临时性的 shell 访问，但对于持续的智能体工作流和
    设备自动化来说，节点更简单。

    文档： [Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[Browser](/zh-CN/tools/browser)。

  </Accordion>

  <Accordion title="节点会运行一个 Gateway 网关服务吗？">
    不会。除非你有意运行隔离配置文件，否则每台主机上应只运行**一个 Gateway 网关**（参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。节点是连接到
    Gateway 网关的外设（iOS/Android 节点，或菜单栏应用中的 macOS “节点模式”）。关于 headless 节点
    主机和 CLI 控制，请参见 [Node host CLI](/cli/node)。

    `gateway`、`discovery` 和 `canvasHost` 的更改都需要完全重启。

  </Accordion>

  <Accordion title="有没有通过 API / RPC 应用配置的方法？">
    有。

    - `config.schema.lookup`：在写入前检查某个配置子树，包括其浅层 schema 节点、匹配的 UI 提示以及直接子节点摘要
    - `config.get`：获取当前快照 + hash
    - `config.patch`：安全的部分更新（大多数 RPC 编辑首选）；能热重载时热重载，需要时重启
    - `config.apply`：验证并替换完整配置；能热重载时热重载，需要时重启
    - 仅限所有者的 `gateway` 运行时工具仍然拒绝改写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名会标准化到相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这会设置你的工作区，并限制哪些人可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale，并从我的 Mac 连接？">
    最简步骤：

    1. **在 VPS 上安装并登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装并登录**
       - 使用 Tailscale 应用，并登录到同一个 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中启用 MagicDNS，这样 VPS 就会有一个稳定名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway 网关 WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情况下访问 Control UI，请在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这会让 Gateway 网关继续绑定到 loopback，并通过 Tailscale 暴露 HTTPS。参见 [Tailscale](/zh-CN/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac 节点连接到远程 Gateway 网关（Tailscale Serve）？">
    Serve 会暴露 **Gateway 网关 Control UI + WS**。节点会通过同一个 Gateway 网关 WS 端点连接。

    推荐设置：

    1. **确保 VPS 和 Mac 位于同一个 tailnet 中**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       应用会为 Gateway 网关端口建立隧道，并作为节点连接。
    3. **在 Gateway 网关上批准该节点**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档： [Gateway protocol](/zh-CN/gateway/protocol)、[设备发现](/zh-CN/gateway/discovery)、[macOS 远程模式](/zh-CN/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该安装到第二台笔记本，还是只添加一个节点？">
    如果你只需要第二台笔记本上的**本地工具**（屏幕/摄像头/exec），就把它添加为一个
    **节点**。这样可以保留单个 Gateway 网关，并避免重复配置。当前本地节点工具
    仅支持 macOS，但我们计划将其扩展到其他操作系统。

    只有在你需要**强隔离**或两个完全独立的机器人时，才安装第二个 Gateway 网关。

    文档： [Nodes](/zh-CN/nodes)、[Nodes CLI](/cli/nodes)、[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 `.env` 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 会从父进程（shell、launchd/systemd、CI 等）读取环境变量，此外还会额外加载：

    - 当前工作目录中的 `.env`
    - `~/.openclaw/.env`（即 `$OPENCLAW_STATE_DIR/.env`）中的全局回退 `.env`

    这两个 `.env` 文件都不会覆盖现有环境变量。

    你还可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

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

  <Accordion title="我是通过服务启动 Gateway 网关的，结果环境变量消失了。怎么办？">
    两种常见修复方式：

    1. 将缺失的键放入 `~/.openclaw/.env`，这样即使服务没有继承你的 shell 环境，也能被读取。
    2. 启用 shell 导入（自愿启用的便利功能）：

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
    `openclaw models status` 报告的是**shell 环境导入**是否启用。“Shell env: off”
    **不**表示你的环境变量丢失了——它只是表示 OpenClaw 不会自动加载
    你的登录 shell。

    如果 Gateway 网关作为服务运行（launchd/systemd），它不会继承你的 shell
    环境。可通过以下任一方式修复：

    1. 将 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其加入配置中的 `env` 块（仅在缺失时应用）。

    然后重启 Gateway 网关并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot token 会从 `COPILOT_GITHUB_TOKEN` 读取（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）。
    参见 [/concepts/model-providers](/zh-CN/concepts/model-providers) 和 [/environment](/zh-CN/help/environment)。

  </Accordion>
</AccordionGroup>

## 会话和多个聊天

<AccordionGroup>
  <Accordion title="如何开始一段全新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。参见 [会话管理](/zh-CN/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，会话会自动重置吗？">
    会话可以在 `session.idleMinutes` 之后过期，但这项功能**默认禁用**（默认值 **0**）。
    将其设为正值即可启用空闲过期。启用后，空闲期结束后的**下一条**
    消息会为该聊天键启动一个全新的会话 ID。
    这不会删除记录——只是开始一个新会话。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法做一个 OpenClaw 实例团队（一个 CEO 和多个智能体）？">
    可以，通过**多智能体路由**和**子智能体**实现。你可以创建一个协调者
    智能体，以及多个拥有各自工作区和模型的工作智能体。

    不过，最好把这看作一种**有趣的实验**。它会消耗很多 token，而且通常
    不如使用一个机器人配合多个会话高效。我们更典型的设想是：
    你和一个机器人对话，通过不同会话进行并行工作。这个
    机器人也可以在需要时生成子智能体。

    文档： [多智能体路由](/zh-CN/concepts/multi-agent)、[Sub-agents](/zh-CN/tools/subagents)、[Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文会在任务进行到一半时被截断？如何防止？">
    会话上下文受模型窗口限制。长聊天、大量工具输出或许多
    文件都可能触发压缩或截断。

    有帮助的做法：

    - 让机器人总结当前状态并写入文件。
    - 在长任务前使用 `/compact`，切换话题时使用 `/new`。
    - 将重要上下文保存在工作区中，并让机器人重新读取。
    - 对于长任务或并行工作，使用子智能体，这样主聊天可以保持更小。
    - 如果这种情况经常发生，请选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何彻底重置 OpenClaw，但保留安装？">
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

    - 如果新手引导检测到现有配置，也会提供**重置**选项。参见 [新手引导（CLI）](/zh-CN/start/wizard)。
    - 如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），请分别重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发环境重置：`openclaw gateway --dev --reset`（仅开发环境；会清除开发配置 + 凭证 + 会话 + 工作区）。

  </Accordion>

  <Accordion title='我遇到了 “context too large” 错误——该如何重置或压缩？'>
    可使用以下方式之一：

    - **压缩**（保留对话，但会总结较早的轮次）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 来指导摘要内容。

    - **重置**（为相同聊天键创建新的会话 ID）：

      ```
      /new
      /reset
      ```

    如果问题持续发生：

    - 启用或调整**会话修剪**（`agents.defaults.contextPruning`），以裁剪旧的工具输出。
    - 使用上下文窗口更大的模型。

    文档： [Compaction](/zh-CN/concepts/compaction)、[Session pruning](/zh-CN/concepts/session-pruning)、[会话管理](/zh-CN/concepts/session)。

  </Accordion>

  <Accordion title='为什么我会看到 “LLM request rejected: messages.content.tool_use.input field required”？'>
    这是提供商验证错误：模型发出了一个缺少必需
    `input` 的 `tool_use` 块。通常意味着会话历史已过时或已损坏（常见于长线程
    或工具/schema 变更之后）。

    解决方法：使用 `/new`（独立消息）开始一个全新会话。

  </Accordion>

  <Accordion title="为什么我每 30 分钟都会收到 heartbeat 消息？">
    Heartbeat 默认每 **30m** 运行一次（使用 OAuth 身份验证时为 **1h**）。你可以调整或禁用它们：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在，但实际上为空（只有空行和 Markdown
    标题，比如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
    如果该文件不存在，heartbeat 仍会运行，并由模型决定该做什么。

    按智能体覆盖请使用 `agents.list[].heartbeat`。文档： [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把一个“机器人账号”加到 WhatsApp 群组里吗？'>
    不需要。OpenClaw 运行在**你自己的账号**上，所以只要你在群里，OpenClaw 就能看到它。
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
    方式 1（最快）：跟踪日志，然后在群里发送一条测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    方式 2（如果已配置/已加入允许列表）：从配置中列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档： [WhatsApp](/zh-CN/channels/whatsapp)、[Directory](/cli/directory)、[Logs](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组里不回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @ 提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups`，但没有加入 `"*"`，并且该群组也不在允许列表中。

    参见 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程会和私信共享上下文吗？">
    直接聊天默认会折叠到主会话中。群组/渠道拥有各自的会话键，而 Telegram 话题 / Discord 线程则是独立会话。参见 [Groups](/zh-CN/channels/groups) 和 [Group messages](/zh-CN/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和智能体？">
    没有硬性限制。几十个（甚至上百个）都没问题，但请注意：

    - **磁盘增长：**会话 + 记录存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**智能体越多，并发模型使用也越多。
    - **运维开销：**按智能体划分的 auth profiles、工作区和渠道路由。

    提示：

    - 每个智能体保留一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长明显，请清理旧会话（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 检查零散工作区和 profile 不匹配问题。

  </Accordion>

  <Accordion title="我可以同时运行多个机器人或聊天（Slack）吗？应该如何设置？">
    可以。使用**多智能体路由**来运行多个隔离的智能体，并按
    渠道/账户/peer 路由入站消息。Slack 作为渠道受到支持，也可以绑定到特定智能体。

    浏览器访问能力很强，但并不是“人类能做什么它都能做”——反机器人机制、CAPTCHA 和 MFA
    仍然可能阻止自动化。若要获得最可靠的浏览器控制，请在主机上使用本地 Chrome MCP，
    或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 网关主机（VPS/Mac mini）。
    - 每个角色一个智能体（bindings）。
    - 将 Slack 渠道绑定到这些智能体。
    - 在需要时通过 Chrome MCP 或节点使用本地浏览器。

    文档： [Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[Slack](/zh-CN/channels/slack)、
    [Browser](/zh-CN/tools/browser)、[Nodes](/zh-CN/nodes)。

  </Accordion>
</AccordionGroup>

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型就是你设置在这里的内容：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 的形式引用（例如：`openai/gpt-5.4`）。如果你省略 provider，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，只有在这之后才会回退到已配置的默认提供商这一已弃用的兼容路径。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是继续暴露一个过时且已移除提供商的默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：**使用你当前提供商栈中可用的最强、最新一代模型。
    **对于启用了工具或接收不可信输入的智能体：**优先考虑模型能力，而不是成本。
    **对于日常/低风险聊天：**使用更便宜的回退模型，并按智能体角色进行路由。

    MiniMax 有自己的文档： [MiniMax](/zh-CN/providers/minimax) 和
    [Local models](/zh-CN/gateway/local-models)。

    经验法则：对于高风险工作，使用你**负担得起的最佳模型**；而对于日常
    聊天或摘要，则使用更便宜的模型。你可以按智能体路由模型，并使用子智能体来
    并行处理长任务（每个子智能体都会消耗 token）。参见 [Models](/zh-CN/concepts/models) 和
    [Sub-agents](/zh-CN/tools/subagents)。

    强烈警告：较弱或过度量化的模型更容易受到提示注入
    和不安全行为的影响。参见 [Security](/zh-CN/gateway/security)。

    更多背景： [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**字段。避免完整替换配置。

    安全选项：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你确实打算替换整个配置，否则不要对部分对象使用 `config.apply`。
    对于 RPC 编辑，请先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。lookup 返回的数据会给你规范化路径、浅层 schema 文档/约束以及直接子节点摘要，
    便于进行部分更新。
    如果你已经覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档： [Models](/zh-CN/concepts/models)、[Configure](/cli/configure)、[配置](/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。对于本地模型来说，Ollama 是最简单的路径。

    最快捷设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull gemma4`
    3. 如果你还想使用云端模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会同时提供云端模型和你的本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云端模型不需要本地拉取
    - 手动切换时，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或高度量化的模型更容易受到提示
    注入攻击。对于任何能够使用工具的机器人，我们强烈建议使用**大模型**。
    如果你仍然想使用小模型，请启用沙箱隔离和严格的工具允许列表。

    文档： [Ollama](/zh-CN/providers/ollama)、[Local models](/zh-CN/gateway/local-models)、
    [Model providers](/zh-CN/concepts/model-providers)、[Security](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能各不相同，并且会随时间变化；没有固定的提供商推荐。
    - 请在每个 Gateway 网关上使用 `openclaw models status` 检查当前运行时设置。
    - 对于安全敏感/启用工具的智能体，请使用当前可用的最强、最新一代模型。
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

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你还可以为该提供商强制指定特定的 auth profile（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前活跃的是哪个智能体、正在使用哪个 `auth-profiles.json` 文件，以及接下来将尝试哪个 auth profile。
    在可用时，它还会显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我通过 @profile 设置的 profile？**

    重新运行 `/model`，**不要**带 `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到默认值，请从 `/model` 中选择它（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前生效的是哪个 auth profile。

  </Accordion>

  <Accordion title="我可以日常任务用 GPT 5.2，编码时用 Codex 5.3 吗？">
    可以。设一个为默认值，需要时再切换：

    - **快速切换（按会话）：**日常任务用 `/model gpt-5.4`，编码时用 `/model openai-codex/gpt-5.4` 搭配 Codex OAuth。
    - **默认值 + 切换：**将 `agents.defaults.model.primary` 设为 `openai/gpt-5.4`，然后在编码时切换到 `openai-codex/gpt-5.4`（或反过来）。
    - **子智能体：**将编码任务路由给使用不同默认模型的子智能体。

    参见 [Models](/zh-CN/concepts/models) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.4 配置快速模式？">
    你可以使用按会话切换，或配置默认值：

    - **按会话：**当会话使用 `openai/gpt-5.4` 或 `openai-codex/gpt-5.4` 时，发送 `/fast on`。
    - **按模型默认值：**将 `agents.defaults.models["openai/gpt-5.4"].params.fastMode` 设为 `true`。
    - **Codex OAuth 也是如此：**如果你也使用 `openai-codex/gpt-5.4`，请在那边设置相同标志。

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

    对于 OpenAI，快速模式会在受支持的原生 Responses 请求中映射为 `service_tier = "priority"`。会话级 `/fast` 覆盖优先于配置默认值。

    参见 [Thinking and fast mode](/zh-CN/tools/thinking) 和 [OpenAI fast mode](/zh-CN/providers/openai#openai-fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到 “Model ... is not allowed”，然后就没有回复了？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的**允许列表**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    这个错误会**替代**正常回复返回。解决方法：将该模型加入
    `agents.defaults.models`，移除该允许列表，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 “Unknown model: minimax/MiniMax-M2.7”？'>
    这表示**提供商未配置**（没有找到 MiniMax 提供商配置或 auth
    profile），因此无法解析该模型。

    修复检查清单：

    1. 升级到当前的 OpenClaw 版本（或直接从源码 `main` 运行），然后重启 Gateway 网关。
    2. 确保已配置 MiniMax（通过向导或 JSON），或者确保环境变量/auth profiles 中存在 MiniMax 凭证，
       以便注入匹配的提供商
       （`minimax` 对应 `MINIMAX_API_KEY`，`minimax-portal` 对应 `MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth）。
    3. 使用与你的身份验证路径精确匹配的模型 id（区分大小写）：
       API key 设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       然后从列表中选择（或在聊天中使用 `/model list`）。

    参见 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认模型，把 OpenAI 用于复杂任务吗？">
    可以。将**MiniMax 设为默认值**，并在需要时**按会话**切换模型。
    回退是给**错误**用的，不是给“高难度任务”用的，所以请使用 `/model` 或单独的智能体。

    **选项 A：按会话切换**

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

    **选项 B：单独的智能体**

    - 智能体 A 默认：MiniMax
    - 智能体 B 默认：OpenAI
    - 按智能体路由，或使用 `/agent` 切换

    文档： [Models](/zh-CN/concepts/models)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是。OpenClaw 内置了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才会应用）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名自定义别名，则以你的值为准。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（aliases）？">
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

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）就会解析为该模型 ID。

  </Accordion>

  <Accordion title="如何添加来自其他提供商的模型，比如 OpenRouter 或 Z.AI？">
    OpenRouter（按 token 付费；模型很多）：

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

    如果你引用了某个 provider/model，但缺少所需的提供商 key，就会收到运行时身份验证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后出现 No API key found for provider**

    这通常表示**新智能体**的 auth 存储是空的。身份验证是按智能体隔离的，并存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>`，并在向导中配置身份验证。
    - 或将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致 auth/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障切换和 “All models failed”

<AccordionGroup>
  <Accordion title="故障切换是如何工作的？">
    故障切换分两个阶段进行：

    1. 同一提供商内部的 **Auth profile 轮换**。
    2. 按 `agents.defaults.model.fallbacks` 列表回退到下一个**模型**。

    对失败的 profiles 会应用冷却时间（指数退避），因此即使某个提供商遭遇速率限制或暂时故障，OpenClaw 仍可继续响应。

    速率限制桶不仅包括普通的 `429` 响应。OpenClaw
    还会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及周期性
    用量窗口限制（`weekly/monthly limit reached`）等消息视为值得进行故障切换的
    速率限制。

    某些看似计费相关的响应并不是 `402`，而某些 HTTP `402`
    响应也仍然会保留在该临时错误桶中。如果某个提供商在 `401` 或 `403` 上返回了
    明确的计费文本，OpenClaw 仍可将其保留在
    计费通道中，但提供商专属文本匹配器仅会作用于拥有它们的
    提供商（例如 OpenRouter 的 `Key limit exceeded`）。如果某条 `402`
    消息看起来反而像是可重试的用量窗口或
    组织/工作区支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误则不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这样的特征会保留在压缩/重试路径上，而不会推进模型
    回退。

    泛化的服务器错误文本被有意限制得比“任何包含
    unknown/error 的内容”更窄。OpenClaw 的确会将某些带有提供商上下文的临时形态
    视为值得故障切换的超时/过载信号，例如 Anthropic 裸 `An unknown error occurred`、OpenRouter 裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有临时服务器文本的 JSON `api_error` 负载
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及像 `ModelNotReadyException` 这样的提供商繁忙错误，前提是
    提供商上下文匹配。
    通用的内部回退文本，如 `LLM request failed with an unknown
    error.`，会保持保守，不会仅凭自身触发模型回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这表示系统尝试使用 auth profile ID `anthropic:default`，但无法在预期的 auth 存储中找到对应凭证。

    **修复检查清单：**

    - **确认 auth profiles 的存放位置**（新路径 vs 旧路径）
      - 当前路径：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认 Gateway 网关已加载你的环境变量**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但 Gateway 网关是通过 systemd/launchd 运行的，它可能不会继承该变量。请把它放入 `~/.openclaw/.env`，或启用 `env.shellEnv`。
    - **确认你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **做一次模型/auth 状态检查**
      - 使用 `openclaw models status` 查看已配置模型，以及提供商是否已完成身份验证。

    **针对 “No credentials found for profile anthropic” 的修复检查清单**

    这表示当前运行被固定到了某个 Anthropic auth profile，但 Gateway 网关
    无法在其 auth 存储中找到它。

    - **使用 Claude CLI**
      - 在 Gateway 网关主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API key**
      - 在**Gateway 网关主机**上的 `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`。
      - 清除任何强制使用缺失 profile 的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在 Gateway 网关主机上运行命令**
      - 在远程模式下，auth profiles 位于 Gateway 网关机器上，而不是你的笔记本上。

  </Accordion>

  <Accordion title="为什么它还会去尝试 Google Gemini，然后失败？">
    如果你的模型配置里把 Google Gemini 作为回退项（或你切换到了某个 Gemini 简写），OpenClaw 就会在模型回退时尝试它。如果你没有配置 Google 凭证，就会看到 `No API key found for provider "google"`。

    解决方法：要么提供 Google 身份验证，要么从 `agents.defaults.model.fallbacks` / aliases 中删除或避免使用 Google 模型，以免回退路由到那里。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：会话历史中包含**没有签名的 thinking blocks**（通常来自
    已中止/不完整的流）。Google Antigravity 要求 thinking blocks 必须带有签名。

    解决方法：OpenClaw 现在会为 Google Antigravity Claude 去除无签名的 thinking blocks。如果问题仍然出现，请开始一个**新会话**，或对该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## Auth profiles：它们是什么，以及如何管理

相关内容：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、token 存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是 auth profile？">
    Auth profile 是与某个提供商绑定的命名凭证记录（OAuth 或 API key）。Profiles 存放在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的 profile ID 是什么样的？">
    OpenClaw 使用带提供商前缀的 ID，例如：

    - `anthropic:default`（当不存在 email 身份时很常见）
    - `anthropic:<email>` 用于 OAuth 身份
    - 你自行选择的自定义 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制优先尝试哪个 auth profile 吗？">
    可以。配置支持为 profiles 添加可选元数据，以及按提供商定义顺序（`auth.order.<provider>`）。这**不会**存储 secrets；它只是将 ID 映射到 provider/mode，并设置轮换顺序。

    如果某个 profile 处于短暂**冷却期**（速率限制/超时/auth 失败）或更长时间的**禁用**状态（计费/余额不足），OpenClaw 可能会临时跳过它。若要检查这一点，请运行 `openclaw models status --json` 并查看 `auth.unusableProfiles`。可调项：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷却期可以按模型维度生效。对于某个模型处于冷却中的 profile，在同一提供商下的兄弟模型上仍可能可用，
    而计费/禁用窗口则仍会阻止整个 profile。

    你还可以通过 CLI 设置**按智能体**的顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # 默认为配置的默认智能体（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 将轮换锁定到单个 profile（只尝试这个）
    openclaw models auth order set --provider anthropic anthropic:default

    # 或设置显式顺序（提供商内部回退）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆盖（回退到配置 auth.order / round-robin）
    openclaw models auth order clear --provider anthropic
    ```

    要指定某个特定智能体：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    要验证实际会尝试什么，请使用：

    ```bash
    openclaw models status --probe
    ```

    如果某个已存储 profile 被排除在显式顺序之外，probe 会为该 profile 报告
    `excluded_by_auth_order`，而不是悄悄尝试它。

  </Accordion>

  <Accordion title="OAuth 和 API key 有什么区别？">
    OpenClaw 两者都支持：

    - **OAuth** 通常会利用订阅访问权限（在适用时）。
    - **API keys** 使用按 token 计费。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API keys。

  </Accordion>
</AccordionGroup>

## Gateway 网关：端口、“已在运行”和远程模式

<AccordionGroup>
  <Accordion title="Gateway 网关使用哪个端口？">
    `gateway.port` 控制单一的复用端口，用于 WebSocket + HTTP（Control UI、hooks 等）。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认值 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示 “Runtime: running”，但 “Connectivity probe: failed”？'>
    因为 “running” 是 **supervisor** 的视角（launchd/systemd/schtasks）。而连接探测是 CLI 实际去连接 Gateway 网关 WebSocket 的结果。

    使用 `openclaw gateway status`，并重点看这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（当进程存活但端口未监听时，这是常见根因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示的 “Config (cli)” 和 “Config (service)” 不同？'>
    你正在编辑一个配置文件，而服务实际运行的是另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复方法：

    ```bash
    openclaw gateway install --force
    ```

    请在你希望服务使用的同一组 `--profile` / 环境下运行该命令。

  </Accordion>

  <Accordion title='“another gateway instance is already listening” 是什么意思？'>
    OpenClaw 会在启动时立即绑定 WebSocket 监听器来强制执行运行时锁（默认是 `ws://127.0.0.1:18789`）。如果绑定因 `EADDRINUSE` 失败，它就会抛出 `GatewayLockError`，表示已有另一个实例正在监听。

    解决方法：停止另一个实例、释放端口，或使用 `openclaw gateway --port <port>` 在其他端口运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到其他地方的 Gateway 网关）？">
    设置 `gateway.mode: "remote"`，并指向远程 WebSocket URL，可选附带 shared-secret 远程凭证：

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

    - 只有当 `gateway.mode` 为 `local` 时，`openclaw gateway` 才会启动（除非你传入了覆盖标志）。
    - macOS 应用会监视配置文件，并在这些值变化时实时切换模式。
    - `gateway.remote.token` / `.password` 只是客户端侧的远程凭证；它们本身不会启用本地 Gateway 网关身份验证。

  </Accordion>

  <Accordion title='Control UI 显示 “unauthorized”（或一直重连）。现在怎么办？'>
    你的 Gateway 网关身份验证路径与 UI 的身份验证方式不匹配。

    事实（基于代码）：

    - Control UI 会将 token 保存在当前浏览器标签页会话和所选 Gateway 网关 URL 对应的 `sessionStorage` 中，因此同一标签页刷新后仍可正常使用，而无需恢复长期保存在 `localStorage` 中的 token。
    - 当出现 `AUTH_TOKEN_MISMATCH` 时，如果 Gateway 网关返回了重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任客户端可以使用缓存的设备 token 执行一次有界重试。
    - 这个缓存 token 的重试现在会复用与该设备 token 一起存储的已批准 scopes。显式传入 `deviceToken` / 显式 `scopes` 的调用方，仍会保留它们请求的 scope 集，而不会继承缓存 scopes。
    - 在这个重试路径之外，连接身份验证优先级为：显式 shared token/password 优先，其次是显式 `deviceToken`，然后是已存储设备 token，最后是 bootstrap token。
    - Bootstrap token 的 scope 检查按角色前缀执行。内置的 bootstrap operator allowlist 只能满足 operator 请求；节点或其他非 operator 角色仍然需要它们自己角色前缀下的 scopes。

    修复方法：

    - 最快的方法：`openclaw dashboard`（打印并复制仪表板 URL，尝试打开；如果是 headless 环境，会显示 SSH 提示）。
    - 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是远程环境，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
    - shared-secret 模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的 secret。
    - Tailscale Serve 模式：确认 `gateway.auth.allowTailscale` 已启用，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份标头的原始 loopback/tailnet URL。
    - trusted-proxy 模式：确认你是通过已配置的非 loopback、具备身份感知能力的代理访问，而不是通过同主机 loopback 代理或原始 Gateway 网关 URL。
    - 如果一次重试之后仍然不匹配，请轮换/重新批准已配对的设备 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换调用提示被拒绝，请检查两点：
      - 已配对设备会话只能轮换它们**自己的**设备，除非它们还拥有 `operator.admin`
      - 显式 `--scope` 值不能超出调用方当前的 operator scopes
    - 还是卡住？运行 `openclaw status --all`，并参照 [故障排除](/zh-CN/gateway/troubleshooting)。身份验证详情请参见 [Dashboard](/web/dashboard)。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet，但它无法绑定，且没有任何监听">
    `tailnet` 绑定会从你的网络接口中选择一个 Tailscale IP（100.64.0.0/10）。如果机器未接入 Tailscale（或该接口已断开），就没有可绑定的地址。

    修复方法：

    - 在该主机上启动 Tailscale（使其获得一个 100.x 地址），或者
    - 改为使用 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式选项。`auto` 更倾向于 loopback；如果你希望仅绑定到 tailnet，请使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主机上运行多个 Gateway 网关吗？">
    通常不需要——一个 Gateway 网关就可以运行多个消息渠道和多个智能体。只有在你需要冗余（例如救援机器人）或强隔离时，才需要多个 Gateway 网关。

    可以，但你必须隔离以下内容：

    - `OPENCLAW_CONFIG_PATH`（每个实例独立配置）
    - `OPENCLAW_STATE_DIR`（每个实例独立状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（会自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或在手动运行时传入 `--port`）。
    - 安装按 profile 区分的服务：`openclaw --profile <name> gateway install`。

    Profiles 还会为服务名添加后缀（`ai.openclaw.<profile>`；旧版格式为 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南： [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 是什么意思？'>
    Gateway 网关是一个 **WebSocket server**，它期望收到的第一条消息
    是一个 `connect` frame。如果它收到的是其他内容，就会关闭连接，
    并返回 **code 1008**（策略违规）。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`），而不是使用 WS 客户端。
    - 你使用了错误的端口或路径。
    - 某个代理或隧道剥离了身份验证标头，或发送了非 Gateway 网关请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，则使用 `wss://...`）。
    2. 不要在普通浏览器标签页中打开 WS 端口。
    3. 如果启用了身份验证，请在 `connect` frame 中包含 token/password。

    如果你使用的是 CLI 或 TUI，URL 应该类似这样：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议细节： [Gateway protocol](/zh-CN/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置一个稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快查看日志尾部的方法：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 Gateway 网关通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profiles 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多内容请参见 [故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 网关服务？">
    使用 Gateway 网关辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行 Gateway 网关，`openclaw gateway --force` 可以重新夺回端口。参见 [Gateway 网关](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——如何重新启动 OpenClaw？">
    Windows 有**两种安装模式**：

    **1）WSL2（推荐）：**Gateway 网关运行在 Linux 内部。

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

    **2）原生 Windows（不推荐）：**Gateway 网关直接运行在 Windows 中。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你是手动运行它（无服务），请使用：

    ```powershell
    openclaw gateway run
    ```

    文档： [Windows（WSL2）](/zh-CN/platforms/windows)、[Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="Gateway 网关已经启动，但始终收不到回复。我该检查什么？">
    先做一轮快速健康检查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - **Gateway 网关主机**上没有加载模型身份验证（检查 `models status`）。
    - 渠道配对/允许列表阻止了回复（检查渠道配置 + 日志）。
    - WebChat/Dashboard 在未使用正确 token 的情况下打开。

    如果你处于远程模式，请确认隧道/Tailscale 连接已建立，并且
    Gateway 网关 WebSocket 可达。

    文档： [Channels](/zh-CN/channels)、[故障排除](/zh-CN/gateway/troubleshooting)、[远程访问](/zh-CN/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason"——现在怎么办？'>
    这通常表示 UI 丢失了 WebSocket 连接。请检查：

    1. Gateway 网关是否在运行？`openclaw gateway status`
    2. Gateway 网关是否健康？`openclaw status`
    3. UI 是否使用了正确的 token？`openclaw dashboard`
    4. 如果是远程环境，隧道/Tailscale 链路是否已连通？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档： [Dashboard](/web/dashboard)、[远程访问](/zh-CN/gateway/remote)、[故障排除](/zh-CN/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败了。我该检查什么？">
    先查看日志和渠道状态：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后根据错误进行匹配：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目过多。OpenClaw 已经会裁剪到 Telegram 的限制并用更少命令重试，但某些菜单项仍然需要被移除。请减少插件/Skill/自定义命令，或者如果你不需要菜单，则禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 上运行或位于代理之后，请确认允许出站 HTTPS，并且 `api.telegram.org` 的 DNS 解析正常。

    如果 Gateway 网关是远程的，请确保你查看的是 Gateway 网关主机上的日志。

    文档： [Telegram](/zh-CN/channels/telegram)、[渠道故障排除](/zh-CN/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有任何输出。我该检查什么？">
    先确认 Gateway 网关可达，并且智能体可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你希望在聊天
    渠道中收到回复，请确认已启用投递（`/deliver on`）。

    文档： [TUI](/web/tui)、[Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何彻底停止，然后再启动 Gateway 网关？">
    如果你已安装服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**受监督的服务**（macOS 上为 launchd，Linux 上为 systemd）。
    当 Gateway 网关作为后台守护进程运行时，请使用这种方式。

    如果你是在前台运行，请用 Ctrl-C 停止，然后运行：

    ```bash
    openclaw gateway run
    ```

    文档： [Gateway 网关服务运行手册](/zh-CN/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 和 openclaw gateway 有什么区别">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在当前终端会话中**前台**运行 Gateway 网关。

    如果你已安装服务，请使用 Gateway 网关命令。若你只是想进行一次性的前台运行，请使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出故障时，最快获取更多细节的方法">
    使用 `--verbose` 启动 Gateway 网关，以获得更多控制台细节。然后检查日志文件，查看渠道身份验证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的 Skill 生成了一张图片/PDF，但什么都没有发送">
    智能体发出的附件必须包含一行 `MEDIA:<path-or-url>`（单独成行）。参见 [OpenClaw assistant setup](/zh-CN/start/openclaw) 和 [Agent send](/zh-CN/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还请检查：

    - 目标渠道支持发送媒体，并且没有被允许列表阻止。
    - 文件在提供商的大小限制内（图片会被缩放到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 会将本地路径发送限制在工作区、temp/media-store 和经过沙箱验证的文件中。
    - `tools.fs.workspaceOnly=false` 允许 `MEDIA:` 发送智能体已可读取的主机本地文件，但仅限媒体加安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似 secret 的文件仍会被阻止。

    参见 [Images](/zh-CN/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给入站私信安全吗？">
    请将入站私信视为不可信输入。默认设置旨在降低风险：

    - 支持私信的渠道在默认情况下使用**配对**行为：
      - 未知发送者会收到一个配对码；机器人不会处理他们的消息。
      - 使用以下命令批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求每个渠道最多 **3 个**；如果代码没有送达，请检查 `openclaw pairing list --channel <channel> [--account <id>]`
    - 若要公开开放私信，需要显式选择加入（`dmPolicy: "open"` 并将允许列表设为 `"*"`）。

    运行 `openclaw doctor` 以发现有风险的私信策略。

  </Accordion>

  <Accordion title="提示注入只是公共机器人的问题吗？">
    不是。提示注入针对的是**不可信内容**，而不只是“谁可以给机器人发私信”。
    如果你的助手会读取外部内容（web search/fetch、浏览器页面、邮件、
    文档、附件、粘贴的日志），这些内容就可能包含试图
    劫持模型的指令。即使**你是唯一的发送者**，这种情况也可能发生。

    最大的风险出现在启用了工具时：模型可能被诱导去
    外泄上下文，或代表你调用工具。可以通过以下方式缩小影响范围：

    - 使用只读或禁用工具的“reader”智能体来总结不可信内容
    - 对启用工具的智能体关闭 `web_search` / `web_fetch` / `browser`
    - 也将解码后的文件/文本文档视为不可信：OpenResponses
      `input_file` 和媒体附件提取都会将提取出的文本包裹在
      明确的外部内容边界标记中，而不是直接传入原始文件文本
    - 使用沙箱隔离和严格的工具允许列表

    详情： [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人应该有自己的邮箱、GitHub 账号或电话号码吗？">
    对大多数设置来说，是的。使用独立的账号和电话号码来隔离机器人，
    可以在出问题时缩小影响范围。这样也更容易轮换
    凭证或撤销访问权限，而不会影响你的个人账户。

    从小规模开始。只授予它你实际需要的工具和账户访问权限，
    如果后续确实需要，再逐步扩展。

    文档： [Security](/zh-CN/gateway/security)、[Pairing](/zh-CN/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主处理我的短信吗？这样安全吗？">
    我们**不**推荐对你的个人消息实现完全自主。最安全的模式是：

    - 让私信保持在**配对模式**或严格的允许列表中。
    - 如果你想让它代表你发送消息，请使用**单独的号码或账号**。
    - 让它先起草，然后**发送前由你批准**。

    如果你想尝试，请在专用账户上进行，并保持隔离。参见
    [Security](/zh-CN/gateway/security)。

  </Accordion>

  <Accordion title="我可以将更便宜的模型用于个人助理任务吗？">
    可以，**前提是**该智能体仅用于聊天，并且输入是可信的。较小档位
    更容易受到指令劫持，因此对于启用工具的智能体
    或在读取不可信内容时，应避免使用它们。如果你必须使用较小模型，请锁定
    工具并在沙箱中运行。参见 [Security](/zh-CN/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 里运行了 /start，但没有收到配对码">
    只有在未知发送者向机器人发消息且
    `dmPolicy: "pairing"` 已启用时，才会发送配对码。单独的 `/start` 不会生成配对码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即访问，请将你的 sender id 加入允许列表，或为该账户设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对是如何工作的？">
    不会。WhatsApp 默认的私信策略是**配对**。未知发送者只会收到一个配对码，他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或你显式触发的发送。

    使用以下命令批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导中的电话号码提示用于设置你的**允许列表/所有者**，从而允许你自己的私信。它不会用于自动发送。如果你是在个人 WhatsApp 号码上运行，请使用该号码，并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务和“它停不下来”

<AccordionGroup>
  <Accordion title="如何阻止内部系统消息显示在聊天中？">
    大多数内部消息或工具消息只会在该会话启用 **verbose**、**trace** 或 **reasoning** 时出现。

    在你看到它们的聊天中执行以下操作：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，请检查 Control UI 中的会话设置，并将 verbose
    设为 **inherit**。同时确认你没有使用在配置中将 `verboseDefault` 设为
    `on` 的 bot profile。

    文档： [Thinking and verbose](/zh-CN/tools/thinking)、[Security](/zh-CN/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
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

    这些都是中止触发词（不是斜杠命令）。

    对于后台进程（来自 exec 工具），你可以让智能体运行：

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands 概览：参见 [Slash commands](/zh-CN/tools/slash-commands)。

    大多数命令必须作为**独立**消息发送，并且以 `/` 开头，但少数快捷方式（如 `/status`）对允许列表中的发送者也支持内联使用。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（“Cross-context messaging denied”）'>
    OpenClaw 默认会阻止**跨提供商**消息发送。如果某个工具调用绑定到
    Telegram，它就不会向 Discord 发送，除非你显式允许这样做。

    为该智能体启用跨提供商消息：

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

    编辑配置后重启 Gateway 网关。

  </Accordion>

  <Accordion title='为什么感觉机器人会“忽略”连续快速发送的消息？'>
    队列模式控制新消息如何与正在进行的运行交互。使用 `/queue` 更改模式：

    - `steer` - 新消息重定向当前任务
    - `followup` - 按顺序一次处理一条消息
    - `collect` - 批量收集消息并回复一次（默认）
    - `steer-backlog` - 先立即重定向，再处理积压消息
    - `interrupt` - 中止当前运行并重新开始

    对于 followup 模式，你还可以添加诸如 `debounce:2s cap:25 drop:summarize` 之类的选项。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 Anthropic API key 时的默认模型是什么？'>
    在 OpenClaw 中，凭证和模型选择是分离的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API key）会启用身份验证，但实际默认模型仍然是你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，则表示 Gateway 网关无法在对应运行智能体的预期 `auth-profiles.json` 中找到 Anthropic 凭证。
  </Accordion>
</AccordionGroup>

---

还是卡住了？请到 [Discord](https://discord.com/invite/clawd) 提问，或发起一个 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。
