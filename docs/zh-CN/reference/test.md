---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force`/`coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-20T16:43:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d12f555db4121430fa37b35d00966dd73f3a9f7d310fd4d3f2cb1c6cd5ea016
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 的行 / 分支 / 函数 / 语句覆盖率。覆盖率排除了集成度较高的入口点（CLI 连接逻辑、gateway/telegram 桥接、webchat 静态服务器），以便将目标集中在适合单元测试的逻辑上。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将变更过的 Git 路径展开为有范围限制的 Vitest 测试通道。配置 / 设置变更仍会回退为原生根项目运行，这样在需要时，连接逻辑相关改动仍会广泛重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构测试通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更检查。它会将核心改动与核心测试通道一起运行，将扩展改动与扩展测试通道一起运行，将仅测试改动限制为只跑测试类型检查 / 测试，并将公共插件 SDK 或插件契约的改动扩展为对扩展的验证。
- `pnpm test`：通过有范围限制的 Vitest 测试通道路由显式指定的文件 / 目录目标。未指定目标的运行会使用固定的分片组，并展开到叶子配置以便在本地并行执行；扩展组总是展开为按扩展划分的分片配置，而不是一个庞大的根项目进程。
- 完整运行和扩展分片运行会更新位于 `.artifacts/vitest-shard-timings.json` 的本地耗时数据；后续运行会使用这些耗时信息来平衡慢分片与快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时工件。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量测试通道进行路由，只保留 `test/setup.ts`，而运行时负载较重的用例仍保留在原有测试通道中。
- 部分 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量测试通道中的显式同级测试，因此对小型辅助函数的修改无需重跑重量级、依赖运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样回复测试框架就不会主导较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重量级渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组则保持批量运行。使用 `pnpm test extensions/<id>` 可运行某一个内置插件测试通道。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆解报告，同时仍对显式文件 / 目录目标使用有范围限制的测试通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交 Git diff，对比“已路由的 changed 模式路径”与“原生根项目运行”的基准表现。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作区变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 按需启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false`，并带有自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API key，并且需要设置 `LIVE=1`（或特定提供商的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元测试 / e2e 测试套件那样要求具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证经路由的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 `stdio` 桥接传输的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 `stdio` MCP 帧，因此该冒烟测试能够反映桥接实际发出的内容。

## 本地 PR 检查门禁

在本地进行 PR 合并 / 门禁检查时，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，在将其视为回归之前先重新运行一次，然后用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 key）

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

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、退出码 / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此耗时采集与 profile 捕获使用同一套测试框架。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会以 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会以 `runs=5` 和 `warmup=1` 刷新已提交的基线夹具 `test/fixtures/cli-startup-bench.json`

已提交的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化新手引导冒烟测试时才需要。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
