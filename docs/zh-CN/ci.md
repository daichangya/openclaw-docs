---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T15:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc6f7ae078e5d6fc43f4516016861b96197cce10ced72e3b3a0407cc9da1d2fb
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅有不相关区域变更时跳过高开销作业。

## 作业概览

| 作业                             | 目的                                                                                             | 运行时机                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、变更的扩展插件，并构建 CI 清单                                   | 所有非草稿推送和 PR 都会运行        |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                           | 所有非草稿推送和 PR 都会运行        |
| `security-dependency-audit`      | 针对 npm 漏洞通告执行无需依赖安装的生产锁文件审计                                                | 所有非草稿推送和 PR 都会运行        |
| `security-fast`                  | 快速安全作业所需的聚合作业                                                                       | 所有非草稿推送和 PR 都会运行        |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物                                    | 与 Node 相关的变更                  |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                                | 与 Node 相关的变更                  |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                     | 与 Node 相关的变更                  |
| `checks-node-extensions`         | 针对整个扩展插件套件执行完整的内置插件测试分片                                                   | 与 Node 相关的变更                  |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置插件、契约和扩展插件通道                                     | 与 Node 相关的变更                  |
| `extension-fast`                 | 仅针对已变更的内置插件执行聚焦测试                                                               | 检测到扩展插件变更时                |
| `check`                          | 分片后的主本地门控等价项：生产类型、lint、守卫、测试类型和严格冒烟测试                           | 与 Node 相关的变更                  |
| `check-additional`               | 架构、边界、扩展插件表面守卫、包边界以及 gateway-watch 分片                                      | 与 Node 相关的变更                  |
| `build-smoke`                    | 已构建 CLI 的冒烟测试以及启动内存冒烟测试                                                        | 与 Node 相关的变更                  |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试以及仅在推送时运行的 Node 22 兼容性                              | 与 Node 相关的变更                  |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                                    | 文档发生变更时                      |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | 与 Python Skills 相关的变更         |
| `checks-windows`                 | Windows 专属测试通道                                                                             | 与 Windows 相关的变更               |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                    | 与 macOS 相关的变更                 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                              | 与 macOS 相关的变更                 |
| `android`                        | Android 构建和测试矩阵                                                                           | 与 Android 相关的变更               |

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试仅会在与安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界上比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产 `tsgo` 类型检查加核心测试；仅核心测试变更则只运行核心测试类型检查/测试；扩展插件生产代码变更会运行扩展插件生产类型检查加扩展插件测试；仅扩展插件测试变更则只运行扩展插件测试类型检查/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展插件验证，因为扩展插件依赖这些核心契约。仅发布元数据的版本号提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以保守方式触发所有通道。

在推送时，`checks` 矩阵会加入仅在推送时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵将专注于常规测试/渠道通道。

最慢的 Node 测试家族会拆分为 include-file 分片，以便每个作业都保持较小规模：渠道契约将 registry 和核心覆盖各自拆成八个加权分片，auto-reply reply command 测试拆成四个 include-pattern 分片，其余大型 auto-reply reply prefix 分组则各自拆成两个分片。`check-additional` 还会将 package-boundary compile/canary 工作与运行时拓扑 gateway/architecture 工作分离。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但不会在整个工作流已被替代后继续排队。  
CI 并发键采用带版本的形式（`CI-v2-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 `main` 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、短聚合校验作业（`security-fast`、`check`、`check-additional`、`checks-fast-contracts-channels`）、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`、`security-dependency-audit`、`build-artifacts`、除 `check-lint` 之外的 Linux 检查、长矩阵聚合校验器、文档检查、Python Skills、`android`                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省的时间                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                   |

## 本地等价命令

```bash
pnpm changed:lanes   # 查看针对 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地门控：按边界通道执行变更的类型检查/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
