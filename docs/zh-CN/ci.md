---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T00:25:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff20444a58e039b3a036d3b7413afb142b306eb28fd49375bc2ddb3484e8cd06
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 检测私钥和审计工作流 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 进行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件执行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 通道：渠道测试和仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式确保低成本检查会先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游使用方可以在共享构建准备好后立即开始。
4. 之后再扇出更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些修改就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源代码变更而触发。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、插件、安装冒烟和仅测试变更仍停留在 Linux Node 通道中，这样它们就不会为了已经由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟只会在安装、打包和与容器相关的变更时运行。它的 QR 包冒烟会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍然能覆盖安装路径，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此能增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时限制下运行受限的内置插件 Docker 配置：入口依赖修复以及合成的内置加载器故障隔离。完整的内置更新/渠道矩阵仍然是手动/全套件模式，因为它会反复执行真实的 npm update 和 doctor 修复流程。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心仅测试变更只运行核心测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公共插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本变更会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加一个仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续专注于常规测试/渠道通道。

最慢的 Node 测试族群已经被拆分或平衡，以便让每个作业都保持较小规模：渠道契约将注册表和核心覆盖拆分为总共六个加权分片，内置插件测试在六个扩展 worker 间平衡分配，自动回复改为三个平衡 worker，而不是六个很小的 worker，agentic Gateway 网关/插件配置则分散到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。`check-additional` 会把 package-boundary 的 compile/canary 工作放在一起，并将其与运行时拓扑 Gateway 网关/架构工作分开；边界守卫分片会在一个作业内部并发运行其体量较小、彼此独立的守卫，而 gateway watch 回归会使用最小化的 `gatewayWatch` 构建配置，而不是重建整套 CI 产物 sidecar。
`extension-fast` 仅限 PR，因为 push 运行已经会执行完整的内置插件分片。这样既能为评审提供已变更插件的反馈，又不会在 `main` 上为 `checks-node-extensions` 中已经覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代之后继续排队。
CI 并发键已版本化（`CI-v6-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余使用构建产物的下游作业、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 节省下来的资源抵不过成本；`install-smoke` 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于其收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应命令

```bash
pnpm changed:lanes   # 查看针对 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但会输出每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
