---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-21T21:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在仅修改了无关区域时跳过高开销作业。

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                          |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | 检测是否仅文档变更、变更范围、变更的扩展，并构建 CI 清单                                     | 所有非草稿推送和 PR 都会运行      |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿推送和 PR 都会运行      |
| `security-dependency-audit`      | 针对 npm 安全公告执行不依赖安装的生产 lockfile 审计                                          | 所有非草稿推送和 PR 都会运行      |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿推送和 PR 都会运行      |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物                              | 与 Node 相关的变更                |
| `checks-fast-core`               | 快速 Linux 正确性分支，例如内置/plugin-contract/protocol 检查                                | 与 Node 相关的变更                |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片                                                   | 与 Node 相关的变更                |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展分支                                         | 与 Node 相关的变更                |
| `extension-fast`                 | 仅针对已变更的内置插件执行聚焦测试                                                           | 检测到扩展变更时                  |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟检查                       | 与 Node 相关的变更                |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 Gateway 网关 watch 分片                                 | 与 Node 相关的变更                |
| `build-smoke`                    | 已构建 CLI 的冒烟测试和启动内存冒烟测试                                                      | 与 Node 相关的变更                |
| `checks`                         | 剩余的 Linux Node 分支：渠道测试以及仅在 push 上运行的 Node 22 兼容性                        | 与 Node 相关的变更                |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                     | 文档发生变更时                    |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更       |
| `checks-windows`                 | Windows 专用测试分支                                                                          | 与 Windows 相关的变更             |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试分支                                                 | 与 macOS 相关的变更               |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                           | 与 macOS 相关的变更               |
| `android`                        | Android 构建和测试矩阵                                                                        | 与 Android 相关的变更             |

## 快速失败顺序

作业的排序方式是让便宜的检查先失败，再决定是否运行更昂贵的作业：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支并行执行，这样下游消费者可以在共享构建就绪后立即开始。
4. 之后再展开更重的平台和运行时分支：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。

独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试只会在与安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比 CI 的宽范围平台判定更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只运行扩展测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的版本/config/根依赖检查。未知的根目录/config 变更会采用保守策略，运行所有分支。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 分支。在拉取请求上，这个分支会被跳过，矩阵会保持聚焦于常规测试/渠道分支。

最慢的 Node 测试家族会拆分为按包含文件划分的分片，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖拆成各自八个按权重分配的分片；auto-reply reply command 测试拆成四个按 include pattern 划分的分片；其他较大的 auto-reply reply prefix 组则各拆成两个分片。`check-additional` 还会将 package-boundary compile/canary 工作与运行时拓扑 Gateway 网关/架构工作分开。

当同一个 PR 或 `main` 引用上有新的推送到来时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则请将其视为 CI 噪音。聚合分片检查会明确指出这种取消情况，以便更容易与测试失败区分开来。

## 运行器

| 运行器                           | 作业                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行 `macos-node`、`macos-swift`；fork 则回退到 `macos-latest`                                                               |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界分支执行变更后的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 的 artifact/build-smoke 分支相关时，构建 dist
```
