---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-21T02:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc2fd83f9e122a40183ad7c31e1bfa5004d3362f7240297589962874b8c47f76
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有无关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                             | 用途                                                                                      | 运行时机                         |
| -------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更的扩展，并构建 CI 清单                                     | 所有非草稿推送和 PR 都会运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                    | 所有非草稿推送和 PR 都会运行     |
| `security-dependency-audit`      | 针对 npm 安全通告执行无依赖的生产锁文件审计                                               | 所有非草稿推送和 PR 都会运行     |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                | 所有非草稿推送和 PR 都会运行     |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物                               | 与 Node 相关的变更               |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                         | 与 Node 相关的变更               |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                              | 与 Node 相关的变更               |
| `checks-node-extensions`         | 针对整个扩展套件的完整 bundled-plugin 测试分片                                            | 与 Node 相关的变更               |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、bundled、contract 和扩展通道                              | 与 Node 相关的变更               |
| `extension-fast`                 | 仅针对已变更 bundled 插件的聚焦测试                                                       | 检测到扩展变更时                 |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                        | 与 Node 相关的变更               |
| `check-additional`               | 架构、边界、扩展表面 guard、包边界，以及 gateway-watch 分片                               | 与 Node 相关的变更               |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                  | 与 Node 相关的变更               |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试和仅推送时运行的 Node 22 兼容性                           | 与 Node 相关的变更               |
| `check-docs`                     | 文档格式、lint 和坏链接检查                                                                | 文档发生变更                     |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                | 与 Python Skills 相关的变更      |
| `checks-windows`                 | Windows 专用测试通道                                                                       | 与 Windows 相关的变更            |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                              | 与 macOS 相关的变更              |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                       | 与 macOS 相关的变更              |
| `android`                        | Android 构建和测试矩阵                                                                     | 与 Android 相关的变更            |

## 快速失败顺序

作业的排序方式确保廉价检查会先失败，再决定是否运行昂贵作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不需要等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行执行，这样下游消费者可以在共享构建准备好后立刻开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
单独的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在安装、打包和容器相关变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁比宽泛的 CI 平台作用域更严格地处理架构边界：core 生产变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查/测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。未知的根目录/配置变更会以安全优先的方式落到所有通道。

在推送时，`checks` 矩阵会增加仅推送时运行的 `compat-node22` 通道。在拉取请求中，这个通道会被跳过，矩阵会专注于常规测试/渠道通道。

最慢的 Node 测试家族会拆分为 include-file 分片，以便让每个作业保持较小规模：渠道契约会将 registry 和 core 覆盖各自拆分为 8 个加权分片，auto-reply reply command 测试会拆分为 4 个 include-pattern 分片，其他大型 auto-reply reply prefix 分组则各自拆分为 2 个分片。`check-additional` 还会把 package-boundary compile/canary 工作与 runtime topology gateway/architecture 工作分开。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查会明确指出这种取消情况，以便更容易与测试失败区分。

## 运行器

| 运行器                           | 作业                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                                                                          |

Blacksmith Linux 作业使用 `useblacksmith/checkout`，这样重复的 CI 运行可以复用 Blacksmith git mirror 缓存。Windows 和 macOS 作业则继续使用上游 `actions/checkout`。

## 本地等价项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更类型检查/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guard
pnpm check:test-types
pnpm check:timed    # 同一门禁，并带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
