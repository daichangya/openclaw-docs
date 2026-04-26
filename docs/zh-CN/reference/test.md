---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force` / `coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-26T22:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57a5eff6e46662960a9b06a1f6883bb22b3fd8598de6338b4e7da3fa1b90b492
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务器测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行导致端口 `18789` 仍被占用时，使用此命令。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 使用 V8 coverage 运行单元测试套件。这是一个基于已加载文件的单元 coverage 检查，而不是覆盖整个仓库所有文件的 coverage。阈值为：行数 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该检查只统计被单元 coverage 套件加载的文件，而不会把所有拆分测试通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：只针对相对于 `origin/main` 发生变更的文件运行单元 coverage。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，将 Git 变更路径展开为有范围限制的 Vitest 测试通道。配置 / setup 变更仍会回退到原生根项目运行方式，因此接线类修改在需要时会更广泛地重新运行测试。
- `pnpm test:changed:focused`：用于内循环的变更测试运行。它只会基于直接修改的测试文件、同级 `*.test.ts` 文件、显式源文件映射以及本地导入图来运行精确目标。广泛的 / 配置 / package 变更会被跳过，而不是扩展为完整的变更测试回退运行。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构测试通道。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更检查。它会将核心代码与核心测试通道一起运行，将扩展代码与扩展测试通道一起运行，仅测试变更则只运行测试类型检查 / 测试；对于公开的 插件 SDK 或插件契约变更，会额外扩展一次扩展校验；对于仅包含发布元数据的版本号提升，则保持在有针对性的版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：将显式传入的文件 / 目录目标路由到有范围限制的 Vitest 测试通道。未指定目标时，会使用固定的分片组，并展开到叶子配置以便在本地并行执行；扩展组始终会展开为各个扩展 / 插件的分片配置，而不是使用一个巨大的根项目进程。
- 完整测试、扩展测试和 include-pattern 分片运行会把本地耗时数据更新到 `.artifacts/vitest-shard-timings.json`；后续整套配置运行会利用这些耗时数据来平衡慢分片和快分片。include-pattern CI 分片会把分片名称附加到耗时键名中，因此筛选后的分片耗时仍可见，而不会覆盖整套配置的耗时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量测试通道，只保留 `test/setup.ts`，而运行时负担较重的用例仍保留在原有测试通道中。
- 带有同级测试的源文件会优先映射到该同级测试，然后才会回退到更宽泛的目录 glob。`test/helpers/channels` 和 `test/helpers/plugins` 下的辅助文件变更会使用本地导入图来运行导入它们的测试，而不是在依赖路径明确时广泛运行所有分片。
- `auto-reply` 现在还拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层 Status / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展 / 插件分片。重量级渠道插件、浏览器插件以及 OpenAI 会作为专用分片运行；其他插件组保持批量运行。对单个内置插件测试通道，使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆解报告，同时对显式文件 / 目录目标仍使用有范围限制的测试通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对相对于 `origin/main` 发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 Git diff，对路由后的 changed 模式路径与原生根项目运行做基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：先不提交，直接对当前 worktree 的变更集做基准对比。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为 unit runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶子配置，并写出分组耗时数据以及每个配置的 JSON / 日志产物。测试性能智能体会将其作为尝试修复慢测试之前的基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对比性能优化变更前后的分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API key，并设置 `LIVE=1`（或特定提供商的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，构建 / 复用一个裸 Node / Git runner 镜像以及一个功能镜像，后者会把该 tarball 安装到 `/app`，然后通过加权调度器在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行 Docker smoke 测试通道。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器 / 更新 / 插件依赖测试通道；这些通道会挂载预构建 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于正常的已构建应用功能测试通道。`scripts/package-openclaw-for-docker.mjs` 是本地 / CI 唯一的 package 打包器。Docker 测试通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行所选计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，其中包括所选测试通道、镜像类型、package / live-image 需求以及凭证检查，而不会实际构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值也为 10。重量级测试通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认是每个提供商一个重量级测试通道，通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 控制。对于更大的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。为避免本地 Docker daemon 在创建时出现风暴，测试通道启动默认错开 2 秒；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认会对 Docker 做预检，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出一次活跃测试通道状态，在兼容测试通道之间共享提供商 CLI 工具缓存，对临时性的 live 提供商失败默认重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将测试通道耗时存储到 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可只打印测试通道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 调整状态输出频率，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 只运行确定性的 / 本地测试通道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只运行 live 提供商测试通道；对应的 package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅 live 模式会把 main 和 tail 的 live 测试通道合并为一个按最长优先排序的池，这样提供商桶就可以一起打包 Claude、Codex 和 Gemini 的工作。运行器在首次失败后会停止调度新的池化测试通道，除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`；每个测试通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail 测试通道使用更紧的单通道上限。CLI 后端 Docker 设置命令有单独的超时控制，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（默认 180）。每个测试通道的日志和 `summary.json` 阶段耗时会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的源码 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、由光标提升的可点击元素、iframe 引用以及 frame 元数据。
- CLI 后端 live Docker 探测可以作为聚焦测试通道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规 unit / e2e 测试套件那样以 CI 稳定性为预期。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证路由后的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 发送的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试能反映 bridge 实际发出的内容。

## 本地 PR 检查门槛

对于本地 PR 提交 / 合入前检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个单词回复：ok。不要使用标点或额外文本。”

上次运行（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准测试

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：同时包含两个预设

输出内容包括每个命令的 `sampleCount`、avg、p50、p95、min/max、exit-code / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此耗时采集和 profile 捕获使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1`，将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1`，刷新已检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化的新手引导 smoke 测试时才需要。

在一个干净的 Linux 容器中运行完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置 / workspace / session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke 测试（Docker）

确保维护中的 QR 运行时 helper 能在受支持的 Docker Node 运行时下正确加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [测试 live](/zh-CN/help/testing-live)
