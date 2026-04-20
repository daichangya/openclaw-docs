---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T14:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69056ef80de9f1744b4a8ad71c0a8927307430defa2b8a21a8613525e9c5ac18
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域判断，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                      | 用途                                                                                     | 运行时机                           |
| ------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`              | 检测是否仅有文档变更、已变更的作用域、已变更的扩展，并构建 CI 清单                        | 所有非草稿推送和 PR 都会运行       |
| `security-fast`          | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计                                      | 所有非草稿推送和 PR 都会运行       |
| `build-artifacts`        | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物                           | 与 Node 相关的变更                 |
| `checks-fast-core`       | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                         | 与 Node 相关的变更                 |
| `checks-node-extensions` | 针对整个扩展套件运行完整的内置插件测试分片                                                | 与 Node 相关的变更                 |
| `checks-node-core-test`  | Core Node 测试分片，不包括渠道、内置项、契约和扩展通道                                    | 与 Node 相关的变更                 |
| `extension-fast`         | 仅针对已变更的内置插件运行聚焦测试                                                        | 检测到扩展变更时                   |
| `check`                  | CI 中的主要本地门禁：`pnpm check`、`pnpm check:test-types` 和 `pnpm build:strict-smoke`   | 与 Node 相关的变更                 |
| `check-additional`       | 架构、边界、导入循环保护，以及 Gateway 网关 watch 回归测试                                | 与 Node 相关的变更                 |
| `build-smoke`            | 已构建 CLI 的冒烟测试和启动内存冒烟测试                                                   | 与 Node 相关的变更                 |
| `checks`                 | 剩余的 Linux Node 通道：渠道测试以及仅在 push 时运行的 Node 22 兼容性检查                 | 与 Node 相关的变更                 |
| `check-docs`             | 文档格式、lint 和坏链检查                                                                  | 文档发生变更时                     |
| `skills-python`          | 针对 Python 支持的 Skills 运行 Ruff + pytest                                              | 与 Python Skills 相关的变更        |
| `checks-windows`         | Windows 特定测试通道                                                                       | 与 Windows 相关的变更              |
| `macos-node`             | 使用共享构建产物的 macOS TypeScript 测试通道                                              | 与 macOS 相关的变更                |
| `macos-swift`            | macOS 应用的 Swift lint、构建和测试                                                        | 与 macOS 相关的变更                |
| `android`                | Android 构建和测试矩阵                                                                     | 与 Android 相关的变更              |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不需要等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
单独的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试只会在与安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 `typecheck` 加 core 测试，core 仅测试变更只运行 core 测试 `typecheck`/测试，扩展生产变更会运行扩展生产 `typecheck` 加扩展测试，扩展仅测试变更只运行扩展测试 `typecheck`/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展为扩展校验，因为扩展依赖这些 core 契约。未知的根目录/配置变更会以安全优先的方式落到所有通道。

在 push 时，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，这个通道会被跳过，矩阵会专注于常规测试/渠道通道。

## 运行器

| 运行器                           | 作业                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android`     |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                          |

## 本地对应命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类结果
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速保护检查
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
