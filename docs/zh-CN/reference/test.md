---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（Vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-23T21:04:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6b9c765c8a6a3ad668626e0787a9a94bcb250d2627594ef960ab024f229e8ca
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：会杀掉任何仍占用默认控制端口的残留 gateway 进程，然后使用隔离的 gateway 端口运行完整 Vitest 测试套件，从而避免服务器测试与正在运行的实例冲突。当之前的 gateway 运行把端口 18789 占住时，请使用这个命令。
- `pnpm test:coverage`：使用 V8 coverage（通过 `vitest.unit.config.ts`）运行单元测试套件。这是一个按已加载文件计算的单元覆盖率门禁，而不是整个仓库的全文件覆盖率。阈值是 70% 的 lines/functions/statements 和 55% 的 branches。由于 `coverage.all` 为 false，该门禁只度量单元覆盖率套件中实际加载的文件，而不是把所有拆分 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅针对相对 `origin/main` 发生变化的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只触及可路由的源码/测试文件时，会把 git 变更路径展开为带作用域的 Vitest lanes。配置/设置类变更仍会回退为原生 root projects 运行，以确保接线类修改在需要时能够更广泛地重跑。
- `pnpm changed:lanes`：显示相对 `origin/main` 的 diff 所触发的架构 lanes。
- `pnpm check:changed`：针对相对 `origin/main` 的 diff 运行智能变更门禁。它会让 core 变更运行 core 测试 lanes，让 extension 变更运行 extension 测试 lanes，让纯测试变更只运行测试 typecheck/tests，将公共插件 SDK 或插件契约变更扩展到 extension 验证，并让仅涉及发布元数据的版本号变更仅运行定向的版本/配置/根依赖检查。
- `pnpm test`：会将显式文件/目录目标路由到带作用域的 Vitest lanes。未指定目标时，会使用固定分片组，并展开到叶子配置，以进行本地并行执行；extension 组始终展开到按 extension 划分的分片配置，而不是跑一个巨大的 root-project 进程。
- 完整运行和 extension 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地耗时数据；之后的运行会使用这些耗时来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时制品。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专门的轻量 lanes，仅保留 `test/setup.ts`，而运行时较重的用例仍保留在原有 lanes 中。
- 选定的 `plugin-sdk` 和 `commands` helper 源文件也会让 `pnpm test:changed` 映射到这些轻量 lanes 中的显式同级测试，因此小型 helper 修改可以避免重跑重量级运行时套件。
- `auto-reply` 现在也被拆分为三个专门配置（`core`、`top-level`、`reply`），这样 reply harness 就不会压制较轻量的 top-level 状态/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有 extension/plugin 分片。重量级渠道扩展和 OpenAI 会作为专门分片运行；其他 extension 组保持批处理。使用 `pnpm test extensions/<id>` 可只运行一个内置插件 lane。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入分解报告，同时对于显式文件/目录目标仍使用带作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入分析，但只针对相对 `origin/main` 有变化的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交的 git diff，对比带路由的 changed-mode 路径与原生 root-project 运行的性能。
- `pnpm test:perf:changed:bench -- --worktree`：在不先提交的情况下，对当前 worktree 的变更集做基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个 full-suite Vitest 叶子配置，并写入按组聚合的耗时数据，以及按配置划分的 JSON/log 制品。测试性能智能体会在尝试修复慢测试之前，将其作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对比性能优化变更前后的分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 gateway 端到端冒烟测试（多实例 WS/HTTP/node pairing）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并通过 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行 provider 实时测试（minimax/zai）。需要 API keys，并通过 `LIVE=1`（或 provider 专用的 `*_LIVE_TEST=1`）来取消跳过。
- `pnpm test:docker:all`：先构建一次共享实时测试镜像和 Docker E2E 镜像，然后默认以并发度 4 运行 Docker 冒烟 lanes，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在首次失败后停止安排新的并行 lane；每个 lane 的默认超时为 120 分钟，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的 lanes 会在并行池之后以独占方式运行。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要一个可用的实时模型 key（例如在 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像普通 unit/e2e 套件那样以 CI 稳定性为目标。
- `pnpm test:docker:mcp-channels`：启动一个带种子的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio bridge 验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，以便让冒烟测试反映桥接层的真实输出。

## 本地 PR 门禁

用于本地 PR 落地/门禁检查时，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载宿主机上偶发失败，请先重跑一次，再判断是否为真实回归；之后可用 `pnpm test <path/to/test>` 进行隔离。对于内存受限宿主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准

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

输出包括每条命令的 `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profiles，从而让计时与 profile 捕获使用同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 制品写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将全套件制品写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新受版本控制的基线夹具 `test/fixtures/cli-startup-bench.json`

受版本控制的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化新手引导冒烟测试时才需要它。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪 TTY 驱动交互式向导，验证配置/工作区/会话文件，然后启动 gateway 并运行 `openclaw health`。

## QR 导入冒烟（Docker）

确保维护中的 QR 运行时辅助工具能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
