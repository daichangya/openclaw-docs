---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门槛，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T12:57:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b128a0112dbaa6449b4f2ace018939f552f99929044732d18d5bea8b46695815
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域判断，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更的作用域、已变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性检查路径，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件运行完整的 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括 channel、bundled、contract 和 extension 路径 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更 bundled plugin 的聚焦测试 | 检测到 extension 变更时 |
| `check` | CI 中的主要本地门槛：`pnpm check` 加 `pnpm build:strict-smoke` | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、导入环守卫，以及 Gateway 网关 watch 回归测试 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 其余 Linux Node 路径：channel 测试以及仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试路径 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试路径 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排列顺序经过设计，让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些路径会实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 路径并行，这样下游使用方可以在共享构建就绪后立即启动。
4. 更重的平台和运行时路径随后展开：`checks-fast-core`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
单独的 `install-smoke` 工作流也通过它自己的 `preflight` 作业复用同一个作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试只会在安装、打包和容器相关变更时运行。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 路径。在拉取请求上，该路径会被跳过，矩阵会保持聚焦于常规测试/channel 路径。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404` | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest` | `macos-node`、`macos-swift` |

## 本地等效命令

```bash
pnpm check          # 快速本地门槛：project-reference tsgo + 分片 lint + 并行快速守卫
pnpm check:timed    # 相同门槛，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 路径相关时，构建 dist
```
