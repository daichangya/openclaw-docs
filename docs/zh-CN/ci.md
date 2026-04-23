---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T00:37:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff20444a58e039b3a036d3b7413afb142b306eb28fd49375bc2ddb3484e8cd06
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 检测仅文档变更、已变更作用域、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | Node 相关变更 |
| `checks-fast-core`               | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | Node 相关变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更 |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片 | Node 相关变更 |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展分支 | Node 相关变更 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、防护、测试类型和严格 smoke 检查 | Node 相关变更 |
| `check-additional`               | 架构、边界、扩展表面防护、包边界以及 gateway-watch 分片 | Node 相关变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 检查 | Node 相关变更 |
| `checks`                         | 剩余的 Linux Node 分支：渠道测试和仅推送时运行的 Node 22 兼容性 | Node 相关变更 |
| `check-docs`                     | 文档格式化、lint 和失效链接检查 | 文档有变更 |
| `skills-python`                  | 面向 Python 支持 Skills 的 Ruff + pytest | Python Skills 相关变更 |
| `checks-windows`                 | Windows 专用测试分支 | Windows 相关变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试分支 | macOS 相关变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更 |
| `android`                        | Android 构建与测试矩阵 | Android 相关变更 |

## 快速失败顺序

作业的排序方式旨在让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定究竟存在哪些分支。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行，这样下游消费者就能在共享构建准备好后立即开始。
4. 之后再扇出更重的平台和运行时分支：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台分支仍然只针对平台源代码变更。
Windows Node 检查的作用域仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该分支的 CI 工作流表面；不相关的源代码、插件、install-smoke 和仅测试变更会保留在 Linux Node 分支上，因此不会为了已经由常规测试分片覆盖的内容而占用一台 16-vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个作用域脚本。它从更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在安装、打包和容器相关变更时运行。它的 QR 包 smoke 会强制重新运行 Docker `pnpm install` 层，同时保留 BuildKit 的 pnpm store 缓存，因此仍然能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建出的运行时镜像，因此在不增加额外 Docker 构建的前提下，加入了真实的容器到容器 WebSocket 覆盖。单独的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行受限的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍保持为手动/全套件，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比广义的 CI 平台作用域更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心仅测试变更只会运行核心测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，扩展仅测试变更只会运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展为扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全为先，落到所有分支。

在推送时，`checks` 矩阵会加入仅推送时运行的 `compat-node22` 分支。在拉取请求中，该分支会被跳过，矩阵只关注常规测试/渠道分支。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业保持较小：渠道契约把 registry 和核心覆盖拆成总共六个加权分片，内置插件测试在六个扩展 worker 之间平衡分配，自动回复以三个平衡 worker 运行，而不是六个很小的 worker，agentic Gateway 网关/插件配置则分散到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广义的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广义的 agents 分支使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在导入/调度，而不是由某个单一慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担拖尾。`check-additional` 会把包边界 compile/canary 工作放在一起，并将其与运行时拓扑 Gateway 网关/架构工作分开；边界防护分片会在单个作业内并发运行其体量较小且彼此独立的防护项，而 gateway watch 回归使用最小化的 `gatewayWatch` 构建配置，而不是重建完整的 CI 产物 sidecar 集合。
`extension-fast` 仅在 PR 中运行，因为推送时已经会执行完整的内置插件分片。这样可以为代码审查提供已变更插件的反馈，同时又不会在 `main` 上额外占用一个 Blacksmith worker 去重复 `checks-node-extensions` 中已经存在的覆盖。

当同一个 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会把被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败了，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本的（`CI-v6-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余 built-artifact 消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 带来的成本高于节省的收益；install-smoke Docker 构建也是如此，其中 32-vCPU 的排队时间成本高于节省的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 `origin/main...HEAD` 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分支运行已变更的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速防护
pnpm check:test-types
pnpm check:timed    # 相同门控，并附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI artifact/build-smoke 分支相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
