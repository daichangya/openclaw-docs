---
read_when:
    - 查找操作系统支持或安装路径
    - 决定在哪里运行 Gateway 网关
summary: 平台支持概览（Gateway 网关 + 配套应用）
title: 平台
x-i18n:
    generated_at: "2026-04-24T03:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

OpenClaw 核心使用 TypeScript 编写。**推荐使用 Node 作为运行时**。
不建议将 Bun 用于 Gateway 网关——在 WhatsApp 和
Telegram 渠道上存在已知问题；详情请参见 [Bun（实验性）](/zh-CN/install/bun)。

目前已有 macOS（菜单栏应用）和移动节点（iOS/Android）的配套应用。Windows 和
Linux 配套应用正在规划中，但 Gateway 网关目前已获得完整支持。
Windows 原生配套应用也在规划中；Gateway 网关推荐通过 WSL2 运行。

## 选择你的操作系统

- macOS：[macOS](/zh-CN/platforms/macos)
- iOS：[iOS](/zh-CN/platforms/ios)
- Android：[Android](/zh-CN/platforms/android)
- Windows：[Windows](/zh-CN/platforms/windows)
- Linux：[Linux](/zh-CN/platforms/linux)

## VPS 与托管

- VPS 中心：[VPS 托管](/zh-CN/vps)
- Fly.io：[Fly.io](/zh-CN/install/fly)
- Hetzner（Docker）：[Hetzner](/zh-CN/install/hetzner)
- GCP（Compute Engine）：[GCP](/zh-CN/install/gcp)
- Azure（Linux VM）：[Azure](/zh-CN/install/azure)
- exe.dev（VM + HTTPS 代理）：[exe.dev](/zh-CN/install/exe-dev)

## 常用链接

- 安装指南：[入门指南](/zh-CN/start/getting-started)
- Gateway 网关运行手册：[Gateway](/zh-CN/gateway)
- Gateway 网关配置：[Configuration](/zh-CN/gateway/configuration)
- 服务状态：`openclaw gateway status`

## Gateway 网关服务安装（CLI）

使用以下任一方式（均受支持）：

- 向导（推荐）：`openclaw onboard --install-daemon`
- 直接执行：`openclaw gateway install`
- 配置流程：`openclaw configure` → 选择 **Gateway service**
- 修复/迁移：`openclaw doctor`（会提供安装或修复服务的选项）

服务目标取决于操作系统：

- macOS：LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；旧版为 `com.openclaw.*`）
- Linux/WSL2：systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows：计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），如果创建任务被拒绝，则回退为每用户 Startup 文件夹登录项

## 相关内容

- [安装概览](/zh-CN/install)
- [macOS 应用](/zh-CN/platforms/macos)
- [iOS 应用](/zh-CN/platforms/ios)
