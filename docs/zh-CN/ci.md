---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2340bc163801cb9c947b10895d307affb58a4d839aa1c8294c3ab6a99a783712
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在只改动无关区域时跳过高开销作业。

## 作业概览

| 作业                              | 目的                                                                                  | 运行时机                        |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| `preflight`                       | 检测是否仅文档改动、改动范围、变更的扩展，并构建 CI 清单                             | 所有非草稿推送和 PR 都会运行    |
| `security-scm-fast`               | 通过 `zizmor` 进行私钥检测和工作流审计                                               | 所有非草稿推送和 PR 都会运行    |
| `security-dependency-audit`       | 针对 npm 安全通告执行无依赖的生产锁文件审计                                          | 所有非草稿推送和 PR 都会运行    |
| `security-fast`                   | 快速安全作业所需的聚合作业                                                           | 所有非草稿推送和 PR 都会运行    |
| `build-artifacts`                 | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物                          | 与 Node 相关的改动              |
| `checks-fast-core`                | 快速 Linux 正确性分支，例如内置插件 / 插件契约 / 协议检查                            | 与 Node 相关的改动              |
| `checks-fast-contracts-channels`  | 分片的渠道契约检查，并提供稳定的聚合检查结果                                         | 与 Node 相关的改动              |
| `checks-node-extensions`          | 针对整个扩展套件执行完整的内置插件测试分片                                           | 与 Node 相关的改动              |
| `checks-node-core-test`           | Core Node 测试分片，不包含渠道、内置插件、契约和扩展分支                             | 与 Node 相关的改动              |
| `extension-fast`                  | 仅针对发生变更的内置插件执行聚焦测试                                                 | 检测到扩展改动时                |
| `check`                           | 分片的主本地门控等效流程：生产类型、lint、守卫、测试类型和严格冒烟检查               | 与 Node 相关的改动              |
| `check-additional`                | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                              | 与 Node 相关的改动              |
| `build-smoke`                     | 已构建 CLI 的冒烟测试和启动内存冒烟检查                                              | 与 Node 相关的改动              |
| `checks`                          | 剩余的 Linux Node 分支：渠道测试和仅在推送时运行的 Node 22 兼容性检查                | 与 Node 相关的改动              |
| `check-docs`                      | 文档格式化、lint 和坏链接检查                                                         | 文档发生改动时                  |
| `skills-python`                   | 针对 Python 支持的 Skills 运行 Ruff + pytest                                         | 与 Python Skills 相关的改动     |
| `checks-windows`                  | Windows 专用测试分支                                                                  | 与 Windows 相关的改动           |
| `macos-node`                      | 使用共享构建产物的 macOS TypeScript 测试分支                                         | 与 macOS 相关的改动             |
| `macos-swift`                     | macOS 应用的 Swift lint、构建和测试                                                   | 与 macOS 相关的改动             |
| `android`                         | Android 构建和测试矩阵                                                                | 与 Android 相关的改动           |

## 快速失败顺序

作业顺序经过安排，使便宜的检查先失败，避免高开销作业继续运行：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不必等待更重的产物构建和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行运行，这样下游消费者可在共享构建完成后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台分支仍然只会在对应平台源码变更时运行。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装冒烟检查只会在安装、打包和容器相关改动时运行。它的 QR 包冒烟检查会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此它仍然能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此在不额外增加一次 Docker 构建的前提下，提供真实的容器到容器 WebSocket 覆盖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产代码改动会运行 core 生产类型检查加 core 测试，core 仅测试改动只运行 core 测试类型检查 / 测试，扩展生产代码改动会运行扩展生产类型检查加扩展测试，而扩展仅测试改动只运行扩展测试类型检查 / 测试。公共 Plugin SDK 或插件契约变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以保守方式触发所有分支。

在推送时，`checks` 矩阵会加入仅在推送时运行的 `compat-node22` 分支。在拉取请求中，该分支会被跳过，矩阵会专注于常规测试 / 渠道分支。

最慢的 Node 测试家族会被拆分或均衡，以保持每个作业都足够小：渠道契约将注册表和 core 覆盖拆为各自 8 个加权分片，auto-reply 回复测试按前缀组拆分，而 agentic Gateway 网关 / 插件配置会分散到现有仅源码的 agentic Node 作业中，而不是等待构建产物。`check-additional` 会把包边界编译 / 金丝雀检查放在一起，并将其与运行时拓扑 Gateway 网关 / 架构工作分离；边界守卫分片会在单个作业内并发运行这些较小且相互独立的守卫，而 gateway watch 回归测试使用最小化的 `gatewayWatch` 构建配置，而不是重新构建整套完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但在整个工作流已被更新版本取代后不会继续排队。
CI 并发键带有版本号（`CI-v2-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置插件检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android`                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本节省不抵收益；以及 install-smoke Docker 构建，其中 32 vCPU 的排队成本高于其节省的时间                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node`，在 `openclaw/openclaw` 上运行；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift`，在 `openclaw/openclaw` 上运行；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                  |

## 本地等效项

```bash
pnpm changed:lanes   # 检查 `origin/main...HEAD` 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分支运行变更相关的类型检查 / lint / 测试
pnpm check          # 快速本地门控：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同的门控，但带有每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 坏链接检查
pnpm build          # 当 CI 产物 / build-smoke 分支相关时，构建 dist
```
