---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁以及对应的本地命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T20:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f06d3bec8a44402afb3aeec252105d3e3c985307deb3fcc0859c2d1df50f2612
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个 pull request 上运行。它使用智能范围划分，在仅更改了无关区域时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。
`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic pack。
`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可通过手动派发运行；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出。
实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex lease。
`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于在落地后清理重复 PR。它默认采用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都有共享的引用 issue 或重叠的变更 hunk。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它；但如果当天 UTC 内另一个 workflow-run 调用已经运行过或正在运行，它就会跳过。手动派发会绕过这个每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围且保持覆盖率的测试性能修复，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线本身有失败测试，Codex 只能修复明显失败的问题，并且在提交任何内容之前，智能体执行后的完整测试套件报告必须通过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| ---- | ---- | -------- |
| `preflight` | 检测仅文档变更、变更范围、已变更的 extensions，并构建 CI 清单 | 所有非草稿 push 和 PR |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 所有非草稿 push 和 PR |
| `security-dependency-audit` | 针对 npm advisory 执行无依赖的生产 lockfile 审计 | 所有非草稿 push 和 PR |
| `security-fast` | 快速安全作业的必需聚合作业 | 所有非草稿 push 和 PR |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | Node 相关变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | Node 相关变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果 | Node 相关变更 |
| `checks-node-extensions` | 覆盖整个 extension 套件的完整内置插件测试分片 | Node 相关变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和 extension 通道 | Node 相关变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有 extension 变更的 pull request |
| `check` | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟 | Node 相关变更 |
| `check-additional` | 架构、边界、extension-surface 守卫、package-boundary 和 gateway-watch 分片 | Node 相关变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟 | Node 相关变更 |
| `checks` | 已构建产物渠道测试的验证器，以及仅 push 时运行的 Node 22 兼容性检查 | Node 相关变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS app 的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动后每日进行一次 Codex 慢测试优化 | Main CI 成功后或手动派发 |

## 快速失败顺序

作业的排序方式确保廉价检查会先失败，而不会让高开销作业先运行：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，这样下游使用方可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会仅因为这些编辑本身就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更进行范围匹配。
Windows Node 检查的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和纯测试变更仍会留在 Linux Node 通道中，因此不会为已由普通测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过其自身的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会对安装、打包、容器相关变更、内置 extension 生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/gateway/Plugin SDK 表面运行。纯测试和纯文档编辑不会占用 Docker worker。它的 QR package smoke 会强制重新运行 Docker `pnpm install` 层，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而不必在每次运行时重新下载依赖。其 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此在不增加另一次 Docker 构建的前提下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合默认会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵之前先构建并推送一个带 SHA tag 的 GHCR Docker E2E 镜像，然后在矩阵中使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。定时的 live/E2E 工作流每天都会运行完整的发布路径 Docker 套件。QR 和安装器 Docker 测试则保留各自专注于安装的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时下运行有界的内置插件 Docker 配置文件：setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然是手动/完整套件，因为它会执行重复的真实 npm update 和 doctor 修复过程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 纯测试变更只运行 core 测试 typecheck/测试，extension 生产变更会运行 extension 生产 typecheck 加 extension 测试，extension 纯测试变更只运行 extension 测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展到 extension 验证，因为 extensions 依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的 version/config/root-dependency 检查。未知的 root/config 变更会以安全优先方式回退到所有通道。

在 push 上，`checks` 矩阵会额外加入仅 push 时运行的 `compat-node22` 通道。在 pull request 上，该通道会被跳过，矩阵只聚焦于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或均衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个 extension worker 之间均衡分配，小型 core 单元通道成对组合，auto-reply 改为三个均衡 worker 而不是六个很小的 worker，而 agentic gateway/plugin 配置则分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物。范围较广的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。Extension 分片作业会以单个 Vitest worker 和更大的 Node heap 串行运行插件配置组，这样导入负载较重的插件批次就不会使小型 CI runner 过度提交。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，保留它们旧的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会在启用了 SMS/通话日志 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经执行完整的内置插件分片。这能为代码审查提供已变更插件的反馈，同时避免在 `main` 上为 `checks-node-extensions` 已覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` ref 上有更新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。

CI 并发键采用了版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞更新的 main 运行。

## Runner

| Runner | 作业 |
| ------ | ---- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于收益；install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本也高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更后的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但输出每阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
