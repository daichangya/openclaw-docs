---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T17:13:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5480c1f9f6f77639be2767df88cdb4eb5e91b49f60bd4d6730c6fe3e16f34918
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在仅修改了不相关区域时跳过高开销作业。

## 作业概览

| 作业                             | 目的                                                                                       | 运行时机                          |
| -------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| `preflight`                      | 检测是否仅有文档改动、变更范围、变更的扩展，并构建 CI 清单                                 | 所有非草稿推送和 PR 都会运行      |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                     | 所有非草稿推送和 PR 都会运行      |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产锁文件审计                                                    | 所有非草稿推送和 PR 都会运行      |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                 | 所有非草稿推送和 PR 都会运行      |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物                              | 与 Node 相关的变更                |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件/插件契约/协议检查                                     | 与 Node 相关的变更                |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                               | 与 Node 相关的变更                |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片                                                     | 与 Node 相关的变更                |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展通道                                      | 与 Node 相关的变更                |
| `extension-fast`                 | 仅针对发生变更的内置插件执行聚焦测试                                                       | 检测到扩展变更时                  |
| `check`                          | 分片后的主本地门禁等价项：生产类型、lint、守卫、测试类型以及严格烟雾检查                   | 与 Node 相关的变更                |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片                                  | 与 Node 相关的变更                |
| `build-smoke`                    | 基于已构建 CLI 的烟雾测试和启动内存烟雾测试                                                | 与 Node 相关的变更                |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试，以及仅在推送时运行的 Node 22 兼容性检查                  | 与 Node 相关的变更                |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                              | 文档发生变更时                    |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                 | 与 Python Skills 相关的变更       |
| `checks-windows`                 | Windows 专用测试通道                                                                       | 与 Windows 相关的变更             |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                               | 与 macOS 相关的变更               |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                        | 与 macOS 相关的变更               |
| `android`                        | Android 构建和测试矩阵                                                                     | 与 Android 相关的变更             |

## 快速失败顺序

作业按顺序排列，以便在高开销作业启动前，先让低成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行执行，这样下游使用方在共享构建就绪后即可立即开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node 和 Windows 的 CI 作业图以及工作流 lint，但本身不会强制触发 Android 或 macOS 原生构建；这些平台通道仍然只对原生源代码变更生效。
独立的 `install-smoke` 工作流通过其自身的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装烟雾测试只会在安装、打包和容器相关变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的插件 SDK 或插件契约变更会扩展为扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/root 依赖检查。未知的 root/配置变更会以安全优先方式回退到所有通道。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以保持每个作业都足够小：渠道契约将 registry 和 core 覆盖拆成各八个加权分片，auto-reply 回复测试按前缀组拆分，而 agentic gateway/插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 将包边界 compile/canary 工作保持在一起，并将其与运行时拓扑 gateway/架构工作分开；gateway watch 回归使用最小化的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则请将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但在整个工作流已被替代后不会继续排队。
CI 并发键采用带版本号的形式（`CI-v2-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余已构建产物使用方、`android`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的收益                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                     |

## 本地等价命令

```bash
pnpm changed:lanes   # 查看本地针对 origin/main...HEAD 的 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述相同的门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
```
