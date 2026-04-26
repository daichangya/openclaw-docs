---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T22:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: da03ca18ec9d3cc7057ce33d22fc692a2e0735e5bc88fedec7cfc1e144d49cd6
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围划分，在仅有不相关区域发生变更时跳过高成本作业。

QA Lab 在主智能范围工作流之外有专用的 CI lane。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix lane 和实时 Telegram lane 作为并行作业扇出运行。实时作业使用 `qa-live-shared` environment，而 Telegram lane 使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab lanes。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认是 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在变更 GitHub 状态之前，它会验证已落地的 PR 确实已合并，并验证每个重复 PR 是否具有共享的引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。若 `main` 已继续前进，或者过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行，则 workflow-run 触发会被跳过。当它运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来累积到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 时间内已有另一个 workflow-run 触发已经运行或正在运行，它就会跳过。手动触发会绕过这个按天统计的活动门控。该 lane 会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率不变的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝任何降低通过基线测试数量的更改。如果基线中已有失败测试，Codex 只能修复明显的失败项，并且在提交任何内容之前，智能体处理后的完整测试套件报告必须通过。当机器人推送落地前 `main` 又有新进展时，该 lane 会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 目的                                                                                         | 运行时机                               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、已变更扩展，并构建 CI manifest                               | 所有非草稿 push 和 PR                  |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿 push 和 PR                  |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                                           | 所有非草稿 push 和 PR                  |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 所有非草稿 push 和 PR                  |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及供下游复用的构建产物                             | 与 Node 相关的变更                     |
| `checks-fast-core`               | 快速 Linux 正确性 lane，例如 bundled/plugin-contract/protocol 检查                           | 与 Node 相关的变更                     |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                     |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片                                                       | 与 Node 相关的变更                     |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展 lane                                        | 与 Node 相关的变更                     |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                               | 含扩展变更的拉取请求                   |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、防护项、测试类型和严格 smoke                        | 与 Node 相关的变更                     |
| `check-additional`               | 架构、边界、扩展表面防护、包边界以及 gateway-watch 分片                                      | 与 Node 相关的变更                     |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | 与 Node 相关的变更                     |
| `checks`                         | 已构建产物渠道测试的验证器，以及仅在 push 上运行的 Node 22 兼容性检查                        | 与 Node 相关的变更                     |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                                | 文档发生变更                           |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更            |
| `checks-windows`                 | Windows 专用测试 lane                                                                        | 与 Windows 相关的变更                  |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试 lane                                                | 与 macOS 相关的变更                    |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更                    |
| `android`                        | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建                                     | 与 Android 相关的变更                  |
| `test-performance-agent`         | 在可信活动之后每日执行的 Codex 慢测试优化                                                    | 主 CI 成功后或手动触发                 |

## 快速失败顺序

作业按顺序排列，以便低成本检查能在高成本作业运行前先失败：

1. `preflight` 决定哪些 lane 会存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux lanes 并行运行，这样下游消费者就能在共享构建完成后立即启动。
4. 更重的平台和运行时 lanes 会在此之后扇出运行：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会仅因这些编辑就强制触发 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只针对平台源码变更进行范围控制。
仅涉及 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及窄范围的插件契约辅助工具 / 测试路由编辑，会走一条快速的仅 Node manifest 路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的防护矩阵，前提是变更文件仅限于快速任务可直接覆盖的路由或辅助工具表面。
Windows Node 检查的范围仅限于 Windows 专用的进程 / 路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该 lane 的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更仍保留在 Linux Node lanes 中，这样就不会为已经由常规测试分片覆盖的内容占用一个 16-vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` job 复用相同的范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于 pull request，Docker/包表面、内置插件包 / manifest 变更，以及 Docker smoke 作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面会走快速路径。仅源码级的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 `gateway-network` e2e，验证一个内置扩展构建参数，并在 240 秒的聚合命令超时下运行受限的内置插件 Docker profile，其中每个场景的 Docker 运行时间也分别设有上限。完整路径会为每夜定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的 pull request 保留 QR 包安装和 installer Docker/update 覆盖。推送到 `main`，包括 merge commit，不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流仍保留快速 Docker smoke，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由单独的 `run_bun_global_install_smoke` 门控；它会在夜间调度和 release checks 工作流中运行，手动触发 `install-smoke` 时也可选择启用，但 pull request 和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer/update/plugin-dependency lanes 的裸 Node/Git runner，另一个是功能镜像，会将同一个 tarball 安装到 `/app` 中，用于常规功能 lanes。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 仅执行被选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行各个 lane；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整，而对 provider 敏感的尾部池槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型 lane 的上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务 lane 过度占用 Docker，同时让较轻的 lane 继续填满可用槽位。默认情况下，各 lane 启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合流程会先对 Docker 做 preflight，移除过期的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 用时以便按“最长优先”排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，它会在首次失败后停止调度新的池化 lane，并且每个 lane 都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lanes 使用更严格的单 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lanes，包括仅限发布的 lanes，如 `install-e2e`，以及拆分的内置更新 lanes，如 `bundled-channel-update-acpx`，同时会跳过 cleanup smoke，以便智能体复现单个失败 lane。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw；如果计划需要 install/update/plugin-dependency lanes，就构建并推送一个带 SHA 标签的 bare GHCR Docker E2E 镜像；如果计划需要 package-installed functionality lanes，则构建一个带 SHA 标签的 functional GHCR Docker E2E 镜像。发布路径的 Docker 套件最多会拆成三个分块 job，在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行，这样每个分块只拉取自己需要的镜像类型，并通过相同的加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、阶段耗时、调度器计划 JSON，以及每个 lane 的重跑命令。工作流输入 `docker_lanes` 会让选定 lanes 针对已准备好的镜像运行，而不是运行这三个分块 job；这样可以将失败 lane 的调试限制在一个有针对性的 Docker job 中；如果被选中的 lane 是 live Docker lane，该定向 job 会在本地为该次重跑构建 live-test 镜像。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块中运行，而不是再额外占用第四个 Docker worker；只有 openwebui-only dispatch 时，Open WebUI 才会保留独立 job。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片执行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core prod typecheck 加 core tests，core 纯测试变更只运行 core test typecheck/tests，扩展生产变更会运行 extension prod typecheck 加 extension tests，而扩展纯测试变更只运行 extension test typecheck/tests。公开的插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本 / 配置 / 根依赖检查。未知的 root/config 变更会以安全优先方式退回到所有 lanes。

在 push 上，`checks` 矩阵会增加仅限 push 的 `compat-node22` lane。在 pull request 上，该 lane 会被跳过，矩阵会继续聚焦于常规测试 / 渠道 lanes。

最慢的 Node 测试族会被拆分或重新平衡，以便每个 job 都保持较小规模而不过度占用 runner：渠道契约分成三个加权分片运行，内置插件测试在六个扩展 worker 上做负载均衡，小型 core 单元 lane 会成对组合，自动回复会作为四个平衡 worker 运行，并且 reply 子树会拆分为 agent-runner、dispatch 以及 commands/state-routing 分片，agentic Gateway 网关 / 插件配置会分散到现有的仅源码 agentic Node jobs 中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用其专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片 job 每次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node heap，这样导入密集型插件批次就不会产生额外的 CI jobs。广泛的 agents lane 使用共享的 Vitest 文件级并行调度器，因为它主要受导入 / 调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以防共享运行时分片承担尾部压力。基于 include pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与筛选后的分片。`check-additional` 会将 package-boundary 的 compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；边界防护分片会在一个 job 内并发运行其体量较小、相互独立的防护项。Gateway watch、渠道测试以及 core support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 构建完成后并发运行，同时保留其旧的检查名称作为轻量级 verifier jobs，从而避免再占用两个额外的 Blacksmith workers 和第二条 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会在启用 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包 job。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经执行了完整的内置插件分片。这样既能为评审保留已变更插件的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去做 `checks-node-extensions` 已经覆盖过的内容。

当同一个 PR 或 `main` ref 上有更新的 push 到来时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 上最新的一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
CI 并发 key 采用了带版本号的形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 `main` 运行。

## 运行器

| 运行器 | Jobs |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于其节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于其节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效项

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界 lane 执行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速防护项
pnpm check:test-types
pnpm check:timed    # 相同门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接检查
pnpm build          # 当 CI 构建产物 / build-smoke lanes 相关时，构建 dist
pnpm ci:timings                               # 汇总最新一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的 jobs
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
