---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T02:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2747878d3dee312caffb13f482b2260cb02fb9ddd3c172e176789ad9fbaa82a
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在只改动了无关区域时跳过高开销作业。

## 作业概览

| 作业 | 目的 | 何时运行 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 通知执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试以及启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 通道：渠道测试和仅推送时的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支撑 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建与测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序安排，让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者就能在共享构建准备好后立即开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因自身变更就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对对应平台源码变更而触发。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装 smoke 和纯测试变更仍留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会在安装、打包、容器相关变更、内置扩展生产变更，以及 Docker smoke 作业覆盖到的 core plugin/channel/Gateway 网关/Plugin SDK 表面发生变更时运行。纯测试和纯文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能验证安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此能增加真实的容器到容器 WebSocket 覆盖，而无需再新增一次 Docker 构建。另一个独立的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行受限的内置插件 Docker 配置：入口依赖修复与合成的内置加载器故障隔离。完整的内置更新/渠道矩阵仍保留为手动或完整套件执行，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比广义的 CI 平台范围更严格：core 生产变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查/测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查/测试。公共 Plugin SDK 或 plugin-contract 的变更会扩展为扩展验证，因为扩展依赖这些 core 契约。仅发布元数据版本号变更会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以保守方式触发所有通道。

在推送时，`checks` 矩阵会加入仅推送时存在的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵只保留常规测试/渠道通道。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆成总计六个带权重的分片，内置插件测试会在六个扩展 worker 间平衡分配，自动回复以三个平衡 worker 运行，而不是六个很小的 worker，agentic Gateway 网关/plugin 配置分散到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广义的浏览器、QA、媒体以及杂项插件测试使用它们专用的 Vitest 配置，而不是共享插件兜底配置。广义的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入和调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担拖尾。`check-additional` 会将 package-boundary 编译/canary 工作保持在一起，并把运行时拓扑架构与 gateway watch 覆盖拆开；边界守卫分片会在一个作业内并发运行其较小且相互独立的守卫，而 gateway watch 回归会复用来自 `build-artifacts` 的同次运行构建好的 `dist/` 和 `dist-runtime/` 缓存，因此它能在不于自身 worker 中重新构建运行时产物的前提下衡量 watch 稳定性。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有独立的源码集或清单；它的单元测试通道仍会带着 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复进行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样可以在评审时保留针对变更插件的快速反馈，同时避免在 `main` 上为已被 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将这视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建，在这里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，并附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
