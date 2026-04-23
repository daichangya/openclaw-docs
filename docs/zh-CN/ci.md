---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T00:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f58ae3956a11133d5905a3b74b638c08a0d0533651ae3a6730f8c8b45ab34c44
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域判断，在仅有不相关区域发生变更时跳过昂贵的作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅为文档变更、变更作用域、已变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 分支：渠道测试和仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式是让廉价检查先失败，再启动昂贵作业：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台分支仍然只对平台源代码变更生效。
Windows Node 检查的作用域限定为 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该分支的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 分支上，因此不会为了已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用相同的作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在与安装、打包和容器相关的变更时运行。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而无需在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此在不增加额外 Docker 构建的情况下，补充了真实的容器到容器 WebSocket 覆盖。另有一个单独的 `docker-e2e-fast` 作业，在 120 秒命令超时下运行受限的内置插件 Docker 配置：setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁比宽泛的 CI 平台作用域对架构边界更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只会运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只会运行扩展测试 typecheck/测试。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行定向的版本/配置/root 依赖检查。未知的根目录/配置变更会以安全优先方式落到所有分支。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 分支。在拉取请求上，这个分支会被跳过，矩阵仍聚焦于常规测试/渠道分支。

最慢的 Node 测试族被拆分或平衡处理，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖拆分为总共六个带权分片，内置插件测试在六个扩展 worker 之间平衡分配，auto-reply 作为三个平衡 worker 运行，而不是六个很小的 worker，agentic gateway/plugin 配置则分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 分支使用共享的 Vitest 文件并行调度器，因为它主要受 import/调度支配，而不是被某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部耗时。`check-additional` 将 package-boundary 的编译/canary 工作放在一起，并将其与运行时拓扑 gateway/architecture 工作分开；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的 push 到达时，GitHub 可能会将已过时的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被新的运行取代后继续排队。
CI 并发键已进行版本化（`CI-v6-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能够更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖构建产物的消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的时间；以及 `install-smoke` 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的时间 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界分支运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接检查
pnpm build          # 当 CI 产物/build-smoke 分支相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
