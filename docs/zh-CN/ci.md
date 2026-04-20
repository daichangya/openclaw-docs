---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T12:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb9b7f5febd691d214575edb52def3292e746710123c990366c677ba90adc37
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域判断，在仅有不相关区域发生变更时跳过昂贵的作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅改动文档、已变更的作用域、已变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性检查通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-node-extensions` | 整个扩展套件中的完整 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括 channel、bundled、contract 和 extension 通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更 bundled 插件的聚焦测试 | 检测到扩展变更时 |
| `check` | CI 中的主要本地门禁：`pnpm check` 加 `pnpm build:strict-smoke` | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、导入环保护，以及 Gateway 网关 watch 回归测试 harness | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试，以及启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 其余 Linux Node 通道：channel 测试，以及仅在 push 上运行的 Node 22 兼容性测试 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排列顺序经过设计，使得廉价检查能在昂贵作业启动前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不必等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者就能在共享构建准备好后立刻开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 仅会在安装、打包和容器相关变更时运行。

在 push 上，`checks` 矩阵会添加仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵将专注于常规测试 / channel 通道。

## Runner

| Runner | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404` | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest` | `macos-node`、`macos-swift` |

## 本地等效命令

```bash
pnpm check          # 快速本地门禁：project-reference tsgo + lint + 快速保护检查
pnpm check:timed    # 相同门禁，但会显示每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
