---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T01:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c2678951a24b4a485f145472b28c8c372876182bbd27836dfb06639cdd78e1e
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只改动无关区域时跳过高开销作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅为文档改动、已变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | Node 相关改动 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | Node 相关改动 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果 | Node 相关改动 |
| `checks-node-extensions` | 针对整个扩展套件运行完整的内置插件测试分片 | Node 相关改动 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分支 | Node 相关改动 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有扩展改动的拉取请求 |
| `check` | 分片后的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格烟雾测试 | Node 相关改动 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | Node 相关改动 |
| `build-smoke` | 已构建 CLI 的烟雾测试和启动内存烟雾测试 | Node 相关改动 |
| `checks` | 剩余的 Linux Node 分支：渠道测试和仅推送时运行的 Node 22 兼容性 | Node 相关改动 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档发生改动 |
| `skills-python` | 面向 Python 支撑的 Skills 的 Ruff + pytest | Python Skills 相关改动 |
| `checks-windows` | Windows 特定测试分支 | Windows 相关改动 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | macOS 相关改动 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关改动 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | Android 相关改动 |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再运行高开销作业：

1. `preflight` 决定哪些分支会实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支并行运行，这样下游使用方可以在共享构建准备好后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs` 中，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会仅因这些改动就强制触发 Windows、Android 或 macOS 原生构建；这些平台分支仍然只在对应平台源码变更时才运行。
Windows Node 检查的范围限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该分支的 CI 工作流表面；无关的源码、插件、install-smoke 和纯测试改动仍保留在 Linux Node 分支上，这样它们就不会为已由常规测试分片覆盖的内容占用一台 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过其自己的 `preflight` 作业复用同一范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会在安装、打包、容器相关改动、内置扩展生产改动，以及 Docker smoke 作业会覆盖到的 core plugin/channel/Gateway 网关/插件 SDK 表面发生变更时运行。纯测试和纯文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制重新运行 Docker `pnpm install` 层，同时保留 BuildKit pnpm store 缓存，因此仍然能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。另有一个单独的 `docker-e2e-fast` 作业，会在 120 秒命令超时限制下运行受限的内置插件 Docker 配置：setup-entry 依赖修复，以及合成的内置加载器失败隔离。完整的内置更新/渠道矩阵仍然保持为手动/全量套件，因为它会执行多次真实的 npm update 和 doctor 修复流程。

本地变更分支逻辑位于 `scripts/changed-lanes.mjs` 中，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产改动会运行 core 生产 typecheck 加 core 测试，core 纯测试改动只会运行 core 测试 typecheck/测试，扩展生产改动会运行扩展生产 typecheck 加扩展测试，而扩展纯测试改动只会运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 改动会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置改动会以安全优先方式退回到所有分支。

在 push 上，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 分支。在拉取请求上，该分支会被跳过，矩阵保持聚焦于常规测试/渠道分支。

最慢的 Node 测试族已被拆分或均衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆分为总计六个带权分片，内置插件测试在六个扩展 worker 之间均衡分布，自动回复以三个均衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。宽泛的浏览器、QA、媒体及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。宽泛的 agents 分支使用共享的 Vitest 文件级并行调度器，因为它受 import/调度主导，而不是被某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部时延。`check-additional` 将包边界 compile/canary 工作保持在一起，并将其与运行时拓扑 Gateway 网关/架构工作分开；边界守卫分片会在一个作业内并发运行其小型独立守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或清单；它的单元测试分支仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关 push 上重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样能为评审提供已变更插件的反馈，同时不会在 `main` 上为 `checks-node-extensions` 中已经存在的覆盖额外占用一个 Blacksmith worker。

当同一 PR 或 `main` 引用上有更新的 push 到达时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败了，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被后续运行取代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖已构建产物的使用方、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于其节省效果 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 `origin/main...HEAD` 的本地变更分支分类器
pnpm check:changed   # 智能本地门控：按边界分支运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物/build-smoke 分支相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
