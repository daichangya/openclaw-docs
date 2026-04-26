---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T21:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3332c240435650af6f2cfe898d47bd7da8bdc58edb8dc8544699a741625d9b27
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围界定，在只改动无关区域时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专门的 CI 车道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将 mock parity gate、实时 Matrix 车道和实时 Telegram 车道并行展开为多个作业。实时作业使用 `qa-live-shared` environment，而 Telegram 车道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 车道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并落地后进行重复项清理的手动工作流。它默认使用 dry-run，只有当 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue 或重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护车道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，也可以通过手动触发直接运行。工作流运行触发的调用会在 `main` 已继续前进，或最近一小时内已创建了另一次未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护车道。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已有另一次由工作流运行触发的调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按天统计的活动门禁。该车道会构建完整测试套件分组的 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率不变的测试性能修复，而不是做大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线中有失败的测试，Codex 只能修复明显的失败，并且在提交任何内容之前，智能体处理后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该车道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档改动、已变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 进行无需依赖安装的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性车道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展车道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 具有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的校验器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试车道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试车道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后进行的每日 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定到底有哪些车道会存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 车道并行，这样下游使用方可以在共享构建准备好后立即开始。
4. 更重的平台和运行时车道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会校验 Node CI 图和工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台车道仍然只针对对应平台源码变更进行范围界定。
仅涉及 CI 路由的编辑、选定的低成本核心测试夹具编辑，以及窄范围的插件契约辅助工具 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于该快速任务可直接覆盖的路由或辅助工具表面时，这一路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守卫矩阵。
Windows Node 检查的范围限定在 Windows 特定的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该车道的 CI 工作流表面；无关的源码、插件、install-smoke 和纯测试变更仍留在 Linux Node 车道上，因此不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于 pull request，Docker/包表面、内置插件包 / manifest 变更，以及 Docker smoke 作业会覆盖到的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码层面的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建根目录 Dockerfile 镜像一次，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有界的内置插件 Docker profile，同时每个场景的 Docker run 也分别受限。完整路径则保留 QR 包安装以及安装器 Docker / 更新覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及确实触及安装器 / 包 / Docker 表面的 pull request。推送到 `main`（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍保留快速 Docker smoke，而把完整 install smoke 留给夜间任务或发布校验。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但 pull request 和 `main` push 不会运行它。QR 和安装器 Docker 测试保持各自专注安装流程的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，以及两个共享的 `scripts/e2e/Dockerfile` built-app 镜像：一个 bare 镜像供安装器 / 更新 / 插件依赖车道使用，另一个 functional 镜像会预先准备内置插件运行时依赖，供常规功能车道使用。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个车道选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行各车道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；面向提供商敏感尾部池的默认槽位数同样为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型车道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，从而避免 npm 安装和多服务车道过度占用 Docker，同时让较轻的车道继续填满可用槽位。车道启动默认错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可以通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做 preflight，移除陈旧的 OpenClaw E2E 容器，输出活跃车道状态，持久化车道耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化车道，并且每个车道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；某些实时 / 尾部车道使用更紧的单车道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确指定的调度器车道，包括仅发布使用的车道（如 `install-e2e`）以及拆分的内置更新车道（如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体复现某个失败车道。可复用的 live/E2E 工作流会构建并推送一个带 SHA 标签的 bare GHCR Docker E2E 镜像，以及一个带 SHA 标签的 functional GHCR Docker E2E 镜像，然后以最多三个分块作业运行发布路径 Docker 套件，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块都能拉取所需类型的镜像，并通过同一个加权调度器执行多个车道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含车道日志、耗时、`summary.json`、阶段耗时以及每个车道的重跑命令。工作流输入 `docker_lanes` 会让所选车道针对已准备好的镜像运行，而不是运行这三个分块作业；这能把失败车道调试限制在一个有针对性的 Docker 作业中；如果选中的车道是实时 Docker 车道，那么该定向作业会为这次重跑在本地构建 live-test 镜像。当在发布路径套件中请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是额外占用第四个 Docker worker；只有在 openwebui-only 触发时，Open WebUI 才保留独立作业。定时 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程能与其他内置检查分片并行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心纯测试变更只运行核心测试 typecheck / tests，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展纯测试变更只运行扩展测试 typecheck / tests。公开的插件 SDK 或插件契约变更会扩展到扩展校验，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式退化为运行所有车道。

在 push 上，`checks` 矩阵会额外添加仅在 push 上运行的 `compat-node22` 车道。在 pull request 上，该车道会被跳过，矩阵仍然聚焦于常规测试 / 渠道车道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡，小型核心单元车道会成对组合，自动回复会运行在四个平衡的 worker 上，并把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic gateway / 插件配置则分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业每次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node 堆，这样导入负载高的插件批次就不会产生额外的 CI 作业。广泛的 agents 车道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度影响，而不是被某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤分片。`check-additional` 会把包边界 compile / canary 工作保留在一起，并把运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及核心 support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已构建完成，从而在保留旧检查名称作为轻量校验作业的同时，避免再增加两个 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试车道仍会在启用 SMS / call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这使得评审时能获得已变更插件的反馈，同时不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖 `checks-node-extensions` 已经包含的内容。

当同一个 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会把被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被新的运行取代后不会继续排队。
CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 `main` 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 节省下来的还不如额外成本多；install-smoke Docker 构建也是如此，其中 32 vCPU 的排队时间成本高于它带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界车道运行 changed typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接检查
pnpm build          # 当 CI 构建产物 / build-smoke 车道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
