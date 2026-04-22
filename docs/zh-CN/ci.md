---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T17:07:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 785b60abd6f11de296d146b46bad9c24dd450180a1d42f19d2653199eb9b3fd3
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                             | 目的                                                                                              | 运行时机                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的扩展插件，并构建 CI 清单                                          | 所有非草稿推送和 PR 都运行   |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                            | 所有非草稿推送和 PR 都运行   |
| `security-dependency-audit`      | 基于生产锁文件、无需安装依赖地对照 npm 安全通告进行审计                                           | 所有非草稿推送和 PR 都运行   |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                         | 所有非草稿推送和 PR 都运行   |
| `build-artifacts`                | 一次性构建 `dist/` 和 Control UI，并上传供下游作业复用的产物                                      | 与 Node 相关的变更           |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件 / 插件契约 / 协议检查                                          | 与 Node 相关的变更           |
| `checks-fast-contracts-channels` | 分片执行的渠道契约检查，并提供稳定的聚合检查结果                                                  | 与 Node 相关的变更           |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整内置插件测试分片                                                            | 与 Node 相关的变更           |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展通道                                              | 与 Node 相关的变更           |
| `extension-fast`                 | 仅针对发生变更的内置插件进行聚焦测试                                                              | 检测到扩展变更时             |
| `check`                          | 分片执行的主要本地门禁等价项：生产类型、lint、防护检查、测试类型和严格冒烟测试                    | 与 Node 相关的变更           |
| `check-additional`               | 架构、边界、扩展表面防护、包边界，以及基于构建产物的 gateway-watch 检查                           | 与 Node 相关的变更           |
| `build-smoke`                    | 基于已构建 CLI 的冒烟测试和启动内存冒烟测试                                                       | 与 Node 相关的变更           |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试，以及仅在 push 上运行的 Node 22 兼容性                           | 与 Node 相关的变更           |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                                     | 文档发生变更时               |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                        | 与 Python Skills 相关的变更  |
| `checks-windows`                 | Windows 特定测试通道                                                                              | 与 Windows 相关的变更        |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                      | 与 macOS 相关的变更          |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                               | 与 macOS 相关的变更          |
| `android`                        | Android 构建和测试矩阵                                                                            | 与 Android 相关的变更        |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的产物构建和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node 和 Windows CI 作业图以及工作流 lint，但不会仅因这些编辑就强制触发 Android 或 macOS 原生构建；这些平台通道仍然只对原生源码变更生效。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一份范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装冒烟测试只会在安装、打包和容器相关变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查 / 测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查 / 测试。公共 Plugin SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据版本号变更会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式触发所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵仍聚焦于常规测试 / 渠道通道。

最慢的 Node 测试家族已被拆分或平衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖拆为各自八个加权分片，auto-reply 回复测试按前缀组拆分，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。`check-additional` 将包边界 compile / canary 工作放在一起，保持架构检查独立，并通过共享的 `build-artifacts` 输出运行运行时拓扑 Gateway 网关检查，而不是重新构建 `dist/`。

当同一 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会把被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键已进行版本化（`CI-v2-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片 / 聚合以及基于产物的运行时拓扑 Gateway 网关检查、文档检查、Python Skills、workflow-sanity、labeler、自动响应；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余基于构建产物的消费者、`android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，这个作业对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于它带来的收益                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 本地等价项

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
