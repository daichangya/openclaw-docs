---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T06:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbf34eba5db5711a19227d56a65222cee61486f9bd643c1eb47f8d2cbab5776b
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅修改不相关区域时跳过高成本作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围判定，并展开完整的常规 CI 作业图，用于候选发布版本或大范围验证。

`Full Release Validation` 是手动总控工作流，用于“发布前运行所有内容”。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，以执行安装冒烟测试、软件包验收、Docker 发布路径测试套件、实时/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包 spec 时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个旁路运行工作流，用于验证软件包制品，而不会阻塞发布工作流。它会从已发布的 npm spec、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 制品中解析出一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的内容。配置档覆盖 smoke、package、product、full 以及自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布软件包验证不会被实时 ClawHub 可用性所阻塞。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 制品，而已发布 npm spec 路径则保留给独立分发使用。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而 package acceptance 验证单个 tarball，并通过用户在安装或更新后会实际经历的同一套 Docker E2E harness 来验证。

该工作流有四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 制品上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。该可复用工作流会下载该制品、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该软件包运行所选 Docker 通道，而不是打包工作流检出的内容。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行；如果 Package Acceptance 已解析出软件包，它会安装相同的 `package-under-test` 制品；独立的 Telegram 分发仍可安装已发布的 npm spec。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 通道失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享制品应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样，当前测试 harness 就可以在不运行旧工作流逻辑的情况下，验证较早的可信源提交。

配置档映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：在 `package` 基础上增加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：完整的 Docker 发布路径分片，包含 OpenWebUI
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。该配置档是大多数 Parallels 软件包/更新验证的 GitHub 原生替代方案，其中 Telegram 会通过 QA 实时传输验证同一软件包制品。跨操作系统发布检查仍会覆盖特定操作系统的新手引导、安装器和平台行为；软件包/更新的产品验证应首先从 Package Acceptance 开始。

示例：

```bash
# 使用产品级覆盖验证当前 beta 软件包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前 harness 打包并验证一个发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证一个 tarball URL。对于 source=url，SHA-256 是必填项。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

在调试失败的 package acceptance 运行时，请先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的 package 配置档或精确的 Docker 通道，而不是重跑完整的发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动分发；它会并行展开 mock parity gate、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道。实时作业使用 `qa-live-shared` 环境，而 Telegram/Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发总是会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个面向维护者的手动工作流，用于合并后的重复 PR 清理。它默认是 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue 或重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯定时调度：`main` 上成功的、非机器人推送 CI 运行可以触发它，手动分发也可以直接运行它。工作流运行触发会在 `main` 已继续前进，或最近一小时内已创建另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时运行一次即可覆盖自上次文档处理以来积累的所有 `main` 变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有纯定时调度：`main` 上成功的、非机器人推送 CI 运行可以触发它，但如果同一 UTC 日已经有另一个工作流运行触发已运行或正在运行，它就会跳过。手动分发会绕过这一每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只可修复明显故障，并且代理处理后的完整测试套件报告必须通过，之后才能提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会重新变基已验证的补丁、重新运行 `pnpm check:changed` 并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建制品检查以及可复用的下游制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、软件包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建制品渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 通道 | 用于发布的手动 CI 分发 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建制品的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后进行的每日 Codex 慢测试优化 | main CI 成功后或手动分发 |

手动 CI 分发会运行与常规 CI 相同的作业图，但会强制开启每个有范围判定的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此针对候选发布版本的完整测试套件不会被同一 ref 上的其他 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方针对分支、标签或完整提交 SHA 运行该作业图，同时使用所选分发 ref 对应的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围判定逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有有范围判定的区域都已发生变更。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只会在对应平台源码变更时运行。
仅涉及 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及狭窄的插件契约 helper/test-routing 编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务可直接覆盖的路由或 helper 表面时，这一路径会跳过 build artifacts、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及附加守卫矩阵。
Windows Node 检查的范围仅限于 Windows 特有的进程/路径包装器、npm/pnpm/UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 以及仅测试变更会保留在 Linux Node 通道上，从而避免为已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过其自身的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，快速路径会针对 Docker/package 表面、内置插件 package/manifest 变更，以及 Docker smoke 作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行。仅源码的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI smoke、运行 container gateway-network e2e、验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有边界的内置插件 Docker 配置档，同时每个场景的 Docker run 也分别设有上限。完整路径则保留 QR package install 以及 installer Docker/update 覆盖，用于夜间定时运行、手动分发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。推送到 `main`（包括合并提交）不会强制走完整路径；当 changed-scope 逻辑在 push 上本应请求完整覆盖时，工作流仍会保留快速 Docker smoke，而将完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider smoke 由单独的 `run_bun_global_install_smoke` 控制；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自专注安装场景的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer/update/plugin-dependency 通道的纯 Node/Git runner，另一个是功能镜像，它会将同一个 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行各通道；默认 main-pool 并行槽数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的 tail-pool 并行槽数默认也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过度超配，而较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍然可以从空池中启动，然后会独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker 守护进程出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合流程会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以实现最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布时运行的通道（如 `install-e2e`）以及拆分后的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的软件包制品，或从 `package_artifact_run_id` 下载软件包制品；验证 tarball 清单；当计划需要已安装软件包的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送使用 package-digest 标记的 bare/functional GHCR Docker E2E 镜像；并在已有输入时复用 `docker_e2e_bare_image` / `docker_e2e_functional_image` 或现有 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高级软件包门禁：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流的制品中解析出一个候选项，然后将这个单一的 `package-under-test` 制品传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，以便当前的 acceptance 逻辑可以在不检出旧工作流代码的情况下验证较旧的可信提交。发布检查会针对目标 ref 运行 `package` acceptance 配置档；该配置档覆盖 package/update/plugin contracts，是大多数 Parallels package/update 覆盖的默认 GitHub 原生替代方案。发布路径 Docker 套件最多运行三个分片作业，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分片只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当完整发布路径覆盖请求 OpenWebUI 时，它会被折叠进 `plugins-integrations`；只有在仅针对 OpenWebUI 的分发中，才会保留单独的 `openwebui` 分片。每个分片都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表格以及每通道重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行分片作业，这样失败通道的调试就能限定在一个目标 Docker 作业内，并会为该次运行准备、下载或复用软件包制品；如果所选通道是 live Docker 通道，目标作业会在该次重跑中本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，因此失败通道可以复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 制品，并打印组合后的/每通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢通道和阶段关键路径摘要。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查分片并行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界上比广义的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint/guards；核心仅测试变更只运行核心测试 typecheck 和核心 lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或 plugin-contract 变更会扩大到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展扫描属于显式测试工作。仅发布元数据的版本号更新会运行有针对性的 version/config/root-dependency 检查。未知的根目录/配置变更会安全回退到所有检查通道。

手动 CI 分发会运行 `checks-node-compat-node22` 作为候选发布版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该通道，使矩阵聚焦于 Node 24 测试/渠道通道。

最慢的 Node 测试家族会被拆分或重新平衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约会分成三个带权分片，内置插件测试会在六个扩展 worker 之间平衡，小型 core 单元通道会成对组合，自动回复会作为四个平衡 worker 运行，其中 reply 子树又拆分为 agent-runner、dispatch 以及 commands/state-routing 分片，而 agentic Gateway 网关/插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建制品。广泛的浏览器、QA、媒体和杂项插件测试会使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node 堆，因此导入密集型插件批次不会产生额外的 CI 作业。广泛的智能体通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片拖成尾部。基于 include pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 会将 package-boundary compile/canary 工作保留在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界守卫分片会在一个作业内并发运行其小型独立守卫。Gateway 网关 watch、渠道测试以及核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行；这保留了它们原有的检查名称作为轻量验证器作业，同时避免额外两个 Blacksmith worker 和第二条制品消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；其单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复进行 debug APK 打包作业。

当同一 PR 或 `main` ref 上有较新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然高到让 8 vCPU 的成本高于收益；install-smoke Docker 构建也是如此，在那里 32 vCPU 的排队时间成本高于带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node` 在 `openclaw/openclaw` 上运行；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` 在 `openclaw/openclaw` 上运行；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更的 typecheck/lint/guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一门禁，并附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 低成本智能变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 制品/build-smoke 通道相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
