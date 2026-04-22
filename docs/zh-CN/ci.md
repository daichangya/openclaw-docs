---
read_when:
    - 你需要了解为什么某个 CI 作业运行了，或者没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:41:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10f3e1cf27e9f02e1a1a22159c93d6a205f5ccfbcce25184f7e8349c5cd31692
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域控制，在仅有不相关区域发生变更时跳过高成本作业。

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、已变更作用域、已变更扩展，并构建 CI 清单                                     | 所有非草稿推送和 PR 都会运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿推送和 PR 都会运行       |
| `security-dependency-audit`      | 针对 npm 安全通告执行无需依赖安装的生产锁文件审计                                            | 所有非草稿推送和 PR 都会运行       |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿推送和 PR 都会运行       |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物                                  | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性任务，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片执行渠道契约检查，并提供稳定的聚合检查结果                                               | 与 Node 相关的变更                 |
| `checks-node-extensions`         | 针对整个扩展套件执行完整的内置插件测试分片                                                   | 与 Node 相关的变更                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展任务                                         | 与 Node 相关的变更                 |
| `extension-fast`                 | 仅针对发生变更的内置插件执行聚焦测试                                                         | 检测到扩展变更时                   |
| `check`                          | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke                       | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                                      | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | 与 Node 相关的变更                 |
| `checks`                         | 剩余的 Linux Node 任务：渠道测试和仅在推送时运行的 Node 22 兼容性                            | 与 Node 相关的变更                 |
| `check-docs`                     | 文档格式、lint 和坏链接检查                                                                   | 文档发生变更时                     |
| `skills-python`                  | 针对 Python 支持的 Skills 执行 Ruff + pytest                                                 | 与 Python Skills 相关的变更        |
| `checks-windows`                 | Windows 专用测试任务                                                                          | 与 Windows 相关的变更              |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试任务                                                 | 与 macOS 相关的变更                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                           | 与 macOS 相关的变更                |
| `android`                        | Android 构建和测试矩阵                                                                        | 与 Android 相关的变更              |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定到底存在哪些任务。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 任务并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时任务随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台任务仍然只根据平台源码变更决定是否运行。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该任务的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 任务中，因此不会为已经由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用相同的作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 仅在与安装、打包和容器相关的变更时运行。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍然能覆盖安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此在不增加额外 Docker 构建的前提下，提供真实的容器到容器 WebSocket 覆盖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查/测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全为先，退回到所有任务。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 任务。在拉取请求中，该任务会被跳过，矩阵会专注于常规测试/渠道任务。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖分别拆分为八个带权分片，auto-reply reply 测试按前缀组拆分，而 agentic gateway/plugin 配置会分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 会将包边界 compile/canary 工作保持在一起，并将其与运行时拓扑 gateway/架构工作分开；边界守卫分片会在一个作业内并发运行其体量较小且彼此独立的守卫，而 gateway watch 回归则使用最小化的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v4-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖构建产物的消费者、`android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，使用 8 vCPU 的成本高于节省的收益；install-smoke 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的收益                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界任务运行变更相关的类型检查 / lint / 测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述门禁相同，但带有各阶段耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # `vitest` 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链接检查
pnpm build          # 当 CI 产物 / build-smoke 任务相关时，构建 `dist`
```
