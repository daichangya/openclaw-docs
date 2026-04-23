---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T18:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8cca997a1606bafc08c904bf5527cf6aefb2a0428c2cb7668c757c7a1a08c4e1
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有不相关区域发生变更时跳过昂贵的作业。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也支持手动触发；它会并行展开模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认使用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已经合并，并确认每个重复 PR 都要么共享一个被引用的问题，要么具有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、bundled、contract 和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更的内置插件进行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、guards、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面 guards、package-boundary 和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 用于已构建产物渠道测试的校验作业，以及仅推送时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支撑 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排列顺序经过设计，使得廉价检查可以在昂贵作业运行之前先失败：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不需要等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 之后才会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更生效。
Windows Node 检查的作用域仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更仍然保留在 Linux Node 通道上，这样它们就不会为了已经由常规测试分片覆盖的内容而占用一个 16-vCPU 的 Windows runner。
单独的 `install-smoke` 工作流会通过其自己的 `preflight` 作业复用相同的作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会在安装、打包、容器相关变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的核心 plugin/channel/gateway/Plugin SDK 表面发生变更时运行。纯测试和纯文档编辑不会占用 Docker workers。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而无需在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此在不增加另一次 Docker 构建的前提下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发度为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。默认情况下，这个本地聚合作业会在第一次失败后停止调度新的池化通道，每个通道有 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或提供商敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。定时的 live/E2E 工作流每天都会运行完整的发布路径 Docker 套件。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。一个单独的 `docker-e2e-fast` 作业会在 120 秒命令超时下运行受限的内置插件 Docker 配置：setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的 bundled update/channel 矩阵仍然属于手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比宽泛的 CI 平台作用域更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心纯测试变更只运行核心测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展纯测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅含发布元数据的版本提升会运行定向的版本/配置/root-dependency 检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在推送时，`checks` 矩阵会增加仅推送时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵只聚焦于常规的测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模，同时不过度预留 runners：渠道契约以三个加权分片运行，内置插件测试会在六个扩展 workers 间平衡，小型核心单元通道会成对组合，auto-reply 会以三个平衡 workers 运行而不是六个很小的 workers，而 agentic Gateway 网关/plugin 配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业会以单个 Vitest worker 和更大的 Node heap 串行运行插件配置组，这样以导入为主的插件批次就不会让小型 CI runners 过载。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免让共享运行时分片承担尾部耗时。`check-additional` 会将 package-boundary compile/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界 guard 分片会在一个作业内并发运行其小型独立 guards。Gateway watch、渠道测试和核心 support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，保留它们原有的检查名称作为轻量校验作业，同时避免额外两个 Blacksmith workers 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会在开启 SMS/通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次 Android 相关推送时重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为推送运行本身已经会执行完整的内置插件分片。这能在代码评审期间保留已变更插件的反馈，同时不会在 `main` 上为已经由 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会把已被替代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也在失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于其节省；install-smoke Docker 构建也是如此，因为 32-vCPU 的排队时间成本高于其节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一门禁，并附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
```
