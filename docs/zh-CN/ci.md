---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T17:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 638b1c7dce952e8df09a17f5dc64461d96ab82b74c513d8e76c3aa1733ee0967
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域控制，在仅有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅文档变更、变更作用域、已变更的内置插件，并构建 CI 清单 | 在所有非草稿推送和拉取请求上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和拉取请求上始终运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行不依赖安装的生产锁文件审计 | 在所有非草稿推送和拉取请求上始终运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 在所有非草稿推送和拉取请求上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如内置/插件契约/协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 Gateway 监视分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 分支：渠道测试，以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按以下顺序排列，以便廉价检查能先于高开销作业失败：

1. `preflight` 决定究竟存在哪些分支。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行执行，这样下游消费者就可以在共享构建准备好后立即启动。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs` 中，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一份作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 仅会针对安装、打包和容器相关变更运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs` 中，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：核心生产变更会运行核心生产 typecheck 加核心测试；仅核心测试变更只运行核心测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。未知的根目录/配置变更会以安全优先方式回退到所有分支。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 分支。在拉取请求中，该分支会被跳过，矩阵会专注于常规测试/渠道分支。

最慢的 Node 测试族会拆分为 include-file 分片，以便每个作业都保持较小规模：渠道契约会把 registry/core/extension 覆盖拆成聚焦分片，而 auto-reply reply 测试会把每个大型前缀组拆成两个 include-pattern 分片。`check-additional` 还会将 package-boundary compile/canary 工作与运行时拓扑 Gateway/架构工作分开。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404` | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest` | `macos-node`、`macos-swift` |

## 本地等效项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界分支执行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接
pnpm build          # 当 CI 的 artifact/build-smoke 分支相关时，构建 dist
```
