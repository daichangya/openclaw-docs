---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8c90ba88b3b08f87407e3b1cd90c13b1a2b2b6cb3c0e23b4f4f367614c97cc2
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有无关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                              | 目的                                                                                         | 运行时机                         |
| --------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                       | 检测仅文档变更、已变更作用域、已变更扩展，并构建 CI 清单                                     | 所有非草稿推送和拉取请求都会运行 |
| `security-scm-fast`               | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿推送和拉取请求都会运行 |
| `security-dependency-audit`       | 针对 npm advisories 执行无依赖的生产锁文件审计                                               | 所有非草稿推送和拉取请求都会运行 |
| `security-fast`                   | 快速安全作业的必需聚合作业                                                                   | 所有非草稿推送和拉取请求都会运行 |
| `build-artifacts`                 | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品                                  | 与 Node 相关的变更               |
| `checks-fast-core`                | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更               |
| `checks-fast-contracts-channels`  | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更               |
| `checks-node-extensions`          | 针对整个扩展套件的完整 bundled-plugin 测试分片                                               | 与 Node 相关的变更               |
| `checks-node-core-test`           | Core Node 测试分片，不包括渠道、bundled、contract 和扩展通道                                 | 与 Node 相关的变更               |
| `extension-fast`                  | 仅针对已变更 bundled plugins 的聚焦测试                                                      | 检测到扩展变更时                 |
| `check`                           | 分片的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟检查                         | 与 Node 相关的变更               |
| `check-additional`                | 架构、边界、扩展表面守卫、包边界以及 Gateway 网关 watch 分片                                 | 与 Node 相关的变更               |
| `build-smoke`                     | 已构建 CLI 的冒烟测试和启动内存冒烟检查                                                      | 与 Node 相关的变更               |
| `checks`                          | 剩余的 Linux Node 通道：渠道测试以及仅在 push 时运行的 Node 22 兼容性                        | 与 Node 相关的变更               |
| `check-docs`                      | 文档格式化、lint 和失效链接检查                                                              | 文档发生变更                     |
| `skills-python`                   | 面向 Python 支撑的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更      |
| `checks-windows`                  | Windows 特定测试通道                                                                         | 与 Windows 相关的变更            |
| `macos-node`                      | 使用共享构建制品的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的变更              |
| `macos-swift`                     | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更              |
| `android`                         | Android 构建和测试矩阵                                                                       | 与 Android 相关的变更            |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者就能在共享构建准备好后立即启动。
4. 随后再扇出更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会校验 Node CI 作业图和工作流 lint，但不会因此单独强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只根据对应平台源码变更来决定是否运行。
Windows Node 检查的作用域限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、plugin、install-smoke 和纯测试变更会保留在 Linux Node 通道上，这样就不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个作用域脚本。它基于更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟仅会在与安装、打包和容器相关的变更时运行。它的 QR 包冒烟会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此能增加真实的容器到容器 WebSocket 覆盖，而无需再添加一次 Docker 构建。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产类型检查加 core 测试，core 纯测试变更只运行 core 测试类型检查/测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展纯测试变更只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号提升会运行有针对性的版本/配置/root-dependency 检查。未知的根目录/配置变更会以安全优先方式退化为运行所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆分为各八个加权分片，auto-reply 以三个平衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/plugin 配置会分布到现有的仅源码 agentic Node 作业中，而不是等待已构建制品。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并将其与运行时拓扑 Gateway 网关/架构工作分开；boundary guard 分片会在一个作业内部并发运行它的小型独立守卫，而 gateway watch 回归会使用最小化的 `gatewayWatch` 构建配置，而不是重建完整的 CI 制品 sidecar 集合。

当同一 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被新运行取代后继续排队。
CI 并发键带有版本号（`CI-v5-*`），这样 GitHub 侧旧队列组中的僵尸任务就无法无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、其余使用已构建制品的消费者、`android`                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省的收益；`install-smoke` 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的收益                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行已变更的类型检查/lint/测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，并附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # `vitest` 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 制品/build-smoke 通道相关时，构建 `dist`
```
