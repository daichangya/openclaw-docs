---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门控以及本地命令对应关系
title: CI 流水线
x-i18n:
    generated_at: "2026-04-09T02:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，仅在变更与相关区域有关时才运行高开销作业。

## 作业概览

| 作业                      | 用途                                                                                  | 运行时机                         |
| ------------------------ | ------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`              | 检测仅文档变更、变更作用域、变更的扩展，并构建 CI 清单                               | 所有非草稿的推送和 PR 都会运行   |
| `security-fast`          | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计                                 | 所有非草稿的推送和 PR 都会运行   |
| `build-artifacts`        | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品                          | 与 Node 相关的变更               |
| `checks-fast-core`       | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                    | 与 Node 相关的变更               |
| `checks-fast-extensions` | 在 `checks-fast-extensions-shard` 完成后聚合扩展分片通道                             | 与 Node 相关的变更               |
| `extension-fast`         | 仅针对已变更的内置插件运行聚焦测试                                                   | 检测到扩展变更时                 |
| `check`                  | CI 中的主要本地门禁：`pnpm check` 加 `pnpm build:strict-smoke`                        | 与 Node 相关的变更               |
| `check-additional`       | 架构、边界、导入循环防护，以及 Gateway 网关 watch 回归测试工具                       | 与 Node 相关的变更               |
| `build-smoke`            | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试                                        | 与 Node 相关的变更               |
| `checks`                 | 更重的 Linux Node 通道：完整测试、渠道测试，以及仅在 push 时运行的 Node 22 兼容性测试 | 与 Node 相关的变更               |
| `check-docs`             | 文档格式、lint 和失效链接检查                                                        | 文档发生变更时                   |
| `skills-python`          | 面向 Python 支持的 Skills 的 Ruff + pytest                                           | 与 Python Skills 相关的变更      |
| `checks-windows`         | Windows 特定测试通道                                                                 | 与 Windows 相关的变更            |
| `macos-node`             | 使用共享构建制品的 macOS TypeScript 测试通道                                         | 与 macOS 相关的变更              |
| `macos-swift`            | macOS 应用的 Swift lint、构建和测试                                                  | 与 macOS 相关的变更              |
| `android`                | Android 构建和测试矩阵                                                               | 与 Android 相关的变更            |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游使用方可以在共享构建准备好后立即启动。
4. 然后更重的平台和运行时通道会展开：`checks-fast-core`、`checks-fast-extensions`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
独立的 `install-smoke` 工作流也会通过它自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 只会在与安装、打包和容器相关的变更时运行。

在 push 上，`checks` 矩阵会增加仅限 push 的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵将继续专注于常规测试/渠道通道。

## 运行器

| 运行器                           | 作业                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android`     |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                          |

## 本地对应命令

```bash
pnpm check          # 类型检查 + lint + 格式检查
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 失效链接检查
pnpm build          # 当 CI 制品/build-smoke 通道相关时构建 dist
```
