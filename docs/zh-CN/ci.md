---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0df7f296bff684a61f86eae1ba683c1fb9297092476ef0d404c77097fcf7845
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只改动了无关区域时跳过高开销作业。

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 检测是否仅有文档改动、改动范围、已改动的扩展，并构建 CI 清单                                 | 所有非草稿推送和 PR 都会运行         |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿推送和 PR 都会运行         |
| `security-dependency-audit`      | 针对 npm 安全公告执行无需依赖安装的生产锁文件审计                                            | 所有非草稿推送和 PR 都会运行         |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿推送和 PR 都会运行         |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物                              | 与 Node 相关的改动                   |
| `checks-fast-core`               | 快速 Linux 正确性检查通道，例如 bundled/plugin-contract/protocol 检查                        | 与 Node 相关的改动                   |
| `checks-fast-contracts-channels` | 分片执行的渠道契约检查，并提供稳定的聚合检查结果                                             | 与 Node 相关的改动                   |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片                                                   | 与 Node 相关的改动                   |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展通道                                         | 与 Node 相关的改动                   |
| `extension-fast`                 | 仅针对已改动内置插件的定向测试                                                               | 检测到扩展改动时                     |
| `check`                          | 分片执行的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格烟雾测试                     | 与 Node 相关的改动                   |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                                      | 与 Node 相关的改动                   |
| `build-smoke`                    | 已构建 CLI 的烟雾测试和启动内存烟雾测试                                                      | 与 Node 相关的改动                   |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试以及仅在 push 时运行的 Node 22 兼容性检查                    | 与 Node 相关的改动                   |
| `check-docs`                     | 文档格式、lint 和坏链检查                                                                     | 文档有改动时                         |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                 | 与 Python Skills 相关的改动          |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的改动                |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的改动                  |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的改动                  |
| `android`                        | Android 构建和测试矩阵                                                                       | 与 Android 相关的改动                |

## 快速失败顺序

作业的排列顺序确保低成本检查会在高成本作业启动前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物作业和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游使用方可以在共享构建准备好后立即开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会校验 Node CI 作业图以及工作流 lint，但不会仅因自身修改就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只由平台源码改动触发。
Windows Node 检查的范围限定为 Windows 专用的进程/路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和纯测试改动仍留在 Linux Node 通道中，这样就不会为已经由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装烟雾测试只会在与安装、打包和容器相关的改动时运行。它的二维码包烟雾测试会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍然能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此能够增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。

本地的改动通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产改动会运行 core 生产类型检查加 core 测试，core 仅测试改动只运行 core 测试类型检查/测试，扩展生产改动会运行扩展生产类型检查加扩展测试，而扩展仅测试改动只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 改动会扩展为扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本/配置/root 依赖检查。未知的 root/配置改动会以安全优先方式退回到所有通道。

在 push 时，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，这个通道会被跳过，矩阵会专注于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以保证每个作业都保持较小规模：渠道契约会把注册表和 core 覆盖分别拆成八个带权重的分片，自动回复 reply 测试会按前缀组拆分，而 agentic gateway/plugin 配置会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。`check-additional` 会把包边界编译/canary 工作放在一起，并与运行时拓扑的 Gateway 网关/架构工作分离；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归使用最小化的 `gatewayWatch` 构建配置，而不是重建完整的 CI 构建产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会把被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被替代后继续排队。
CI 并发键是带版本号的（`CI-v3-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 的成本高于节省的收益；以及 `install-smoke` 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的收益                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看本地针对 origin/main...HEAD 的改动通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道执行改动相关的类型检查/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述相同的门禁，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
```
