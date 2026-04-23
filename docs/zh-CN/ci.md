---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T05:14:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3c2cf85b45405fdd5cc1d74c7cc07c4f16c3d9dcf8ca93286a0ba78ba4b6dd1
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能作用域工作流之外还有两条专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更、`main` 上的每夜运行以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - Live Telegram, Live Frontier` 工作流会在 `main` 上每夜运行以及手动触发时运行；它使用 `qa-live-shared` 环境，并为实时 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行这两条 QA Lab 通道。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测仅文档变更、变更作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游构建产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如内置/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更的内置插件执行聚焦测试 | 具有扩展变更的拉取请求 |
| `check` | 分片的主本地门禁等效项：生产类型、lint、守卫、测试类型以及严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试以及启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建构件渠道测试的验证器，以及仅推送时启用的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业顺序经过安排，使低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 随后更重的平台和运行时通道再展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更启用。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、安装 smoke 和仅测试变更仍然留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它会基于更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会在安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/Gateway 网关/插件 SDK 表面发生变化时运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍会覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此增加了真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。本地 `test:docker:all` 会预构建一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，并在 E2E 容器 smoke 运行器之间复用；可复用的 live/E2E 工作流也采用同样的模式，在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。QR 和 installer Docker 测试保留各自以安装为重点的 Dockerfile。单独的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行有界的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然是手动/完整套件，因为它会执行多次真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的插件 SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/root 依赖检查。未知的 root/配置变更会以保守方式回退到所有通道。

在推送时，`checks` 矩阵会增加仅推送启用的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵仍专注于常规测试/渠道通道。

最慢的 Node 测试家族已经被拆分或平衡，因此每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆成总计六个加权分片，内置插件测试在六个扩展 worker 之间平衡，自动回复以三个平衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/plugin 配置会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的 browser、QA、media 和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受 import/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片成为尾部瓶颈。`check-additional` 将 package-boundary compile/canary 工作保持在一起，并将 runtime topology 架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行其体量较小且彼此独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量级验证作业，又避免了额外两个 Blacksmith worker 和第二个构建产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会在启用 SMS/通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样可以在评审时保留已变更插件的反馈，同时避免在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有较新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被更新版本取代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 `main` 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建，其中 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查本地针对 origin/main...HEAD 的 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更范围内的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，并附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间以及最慢的作业
```
