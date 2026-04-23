---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T05:04:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 345fd6200405e8b3f4ba9baadbbd491aa506f889c38631685aa5a8392e082109
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在仅有不相关区域发生变更时跳过高成本作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测仅文档变更、变更作用域、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的定向测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建产物的渠道测试验证器，以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排列顺序经过设计，使廉价检查能在高成本作业运行前先失败：

1. `preflight` 决定究竟存在哪些分支。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行进行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时分支会在此之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台分支仍仅限于平台源码变更。
Windows Node 检查仅针对 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该分支的 CI 工作流表面进行作用域划分；不相关的源码、插件、安装 smoke 和仅测试变更仍保留在 Linux Node 分支上，因此不会为了已经由常规测试分片覆盖的内容而占用一台 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过其自己的 `preflight` 作业复用同一个作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会针对安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/gateway/插件 SDK 表面运行。仅测试和仅文档编辑不会占用 Docker workers。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装过程，而无需每次运行都重新下载依赖。它的 gateway-network e2e 会复用作业前面构建好的运行时镜像，因此在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，并在 E2E 容器 smoke 运行器之间复用；可复用的 live/E2E 工作流也遵循这一模式，会在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。QR 和安装器 Docker 测试则保留各自以安装为重点的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业，在 120 秒命令超时下运行受限的内置插件 Docker 配置：setup-entry 依赖修复加上 synthetic bundled-loader failure isolation。完整的内置更新/渠道矩阵仍保留为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 过程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比较宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 变更会扩展为扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式回退到所有分支。

在推送时，`checks` 矩阵会加入仅推送时运行的 `compat-node22` 分支。在拉取请求中，该分支会被跳过，矩阵会聚焦于常规测试/渠道分支。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆分为总共六个加权分片，内置插件测试在六个扩展 workers 之间平衡分配，自动回复以三个平衡 workers 运行而不是六个很小的 workers，而 agentic gateway/plugin 配置则分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广泛的 browser、QA、media 和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 分支使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。`check-additional` 将包边界 compile/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成之后，于 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量级验证作业，同时避免再占用两个额外的 Blacksmith workers 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或清单；它的单元测试分支仍会使用 SMS/通话日志 BuildConfig 标志来编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。
`extension-fast` 仅限 PR，因为 push 运行已经会执行完整的内置插件分片。这样既能为评审提供已变更插件的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖已经存在于 `checks-node-extensions` 中的内容。

当同一 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于收益；以及 `install-smoke` 的 Docker 构建，在那里 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界分支运行变更范围内的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 分支相关时，构建 `dist`
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队耗时以及最慢的作业
```
