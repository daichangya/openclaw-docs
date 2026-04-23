---
read_when:
    - 你需要了解某个 CI 作业为什么会运行，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T05:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在仅有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外拥有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅为文档变更、变更范围、变更的扩展，并构建 CI 清单 | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无需安装依赖的生产锁文件审计 | 始终在非草稿推送和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包含渠道、bundled、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的 bundled plugins 的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型以及严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试以及启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 用于已构建产物渠道测试的校验器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式确保廉价检查会在高开销作业运行前先失败：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs` 中，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但仅凭这些编辑本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只会在对应平台源码发生变更时运行。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、plugin、安装 smoke 和仅测试类变更仍然保留在 Linux Node 通道中，这样它们就不会为已经由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会针对安装、打包、容器相关变更、bundled extension 生产代码变更，以及 Docker smoke 作业所覆盖的核心 plugin/channel/Gateway 网关/插件 SDK 表面运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此它仍然能测试安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业中先前构建的运行时镜像，因此在不新增 Docker 构建的前提下增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，并在 E2E 容器 smoke 运行器之间复用它；可复用的 live/E2E 工作流也遵循相同模式，在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在设置了 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行该矩阵。QR 和安装器 Docker 测试保留了它们各自以安装为重点的 Dockerfile。另一个独立的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行受限的 bundled-plugin Docker 配置：setup-entry 依赖修复加上 synthetic bundled-loader 故障隔离。完整的 bundled 更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs` 中，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产代码变更会运行 core prod typecheck 加 core tests，核心仅测试类变更只会运行 core test typecheck/tests，扩展生产代码变更会运行 extension prod typecheck 加 extension tests，而扩展仅测试类变更只会运行 extension test typecheck/tests。公共插件 SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些核心契约。仅包含发布元数据的版本号变更会运行有针对性的 version/config/root-dependency 检查。未知的根目录/配置变更会安全地退回到所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵只聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或平衡，因此每个作业都保持较小规模：渠道契约将注册表和核心覆盖拆分为总计六个加权分片，bundled plugin 测试在六个扩展 worker 间平衡分布，auto-reply 以三个平衡 worker 运行，而不是六个过小的 worker，agentic Gateway 网关/plugin 配置则分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项 plugin 测试使用各自专用的 Vitest 配置，而不是共享的 plugin 通用配置。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。`check-additional` 会把 package-boundary compile/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内并发运行其较小且彼此独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量校验作业，同时避免额外占用两个 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话日志 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的 bundled plugin 分片。这样既能为评审提供已变更 plugin 的反馈，也不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键已进行版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 节省下来的成本不如带来的损失；`install-smoke` 的 Docker 构建，其中 32 vCPU 的排队时间带来的成本不如收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更范围内的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，并显示各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
