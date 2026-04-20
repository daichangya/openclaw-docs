---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-20T15:52:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f1e2b7bbeb21f4e49af9240e77667f449d6dc02d89bf70f9e3db721326e1824
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务端测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行遗留了被占用的 18789 端口时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 的行、分支、函数和语句覆盖率。覆盖率会排除集成较重的入口点（CLI 连接逻辑、gateway/telegram 桥接、webchat 静态服务器），以便将目标集中在适合单元测试的逻辑上。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元测试覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源文件/测试文件时，会将变更的 git 路径展开为有范围的 Vitest 通道。配置/设置变更仍会回退到原生根项目运行，因此在需要时，连接逻辑改动仍会触发更广泛的重新运行。
- `pnpm changed:lanes`：显示针对 `origin/main` 的 diff 所触发的架构通道。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更检查。它会让 core 工作搭配 core 测试通道运行，让扩展工作搭配扩展测试通道运行，让仅测试类工作只运行测试类型检查/测试，并将公开的 Plugin SDK 或插件契约改动扩展到扩展验证中。
- `pnpm test`：通过有范围的 Vitest 通道路由显式的文件/目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以进行本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量通道进行路由，这些通道只保留 `test/setup.ts`，而将运行时较重的用例保留在现有通道中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此对小型辅助函数的修改可以避免重新运行依赖重运行时的重型测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply 测试框架就不会拖慢较轻量的顶层状态/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重型渠道扩展和 OpenAI 作为专用分片运行；其他扩展组保持批处理。对单个内置插件通道使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时 + 导入明细报告，同时仍对显式文件/目录目标使用有范围的通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一个已提交 git diff 的路由变更模式路径与原生根项目运行进行基准测试对比。
- `pnpm test:perf:changed:bench -- --worktree`：对当前工作树变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥以及 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥（例如配置在 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元/e2e 测试套件那样被期望在 CI 中保持稳定。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio 桥接验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是桥接实际发出的内容。

## 本地 PR 检查门

在本地执行 PR 合并/检查门验证时，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现偶发失败，在将其视为回归之前先重新运行一次，然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个词回复：ok。不要使用标点或额外文本。”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279 ms（最小 1114，最大 2431）
- opus 中位数 2454 ms（最小 1224，最大 3170）

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
- `all`：以上两个预设

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、exit-code/signal 分布以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，以便计时与 profile 采集使用同一个测试框架。

保存输出约定：

- `pnpm test:startup:bench:smoke` 将目标冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 使用 `runs=5` 和 `warmup=1` 刷新已签入的基线夹具 `test/fixtures/cli-startup-bench.json`

已签入夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导端到端测试（Docker）

Docker 是可选的；这仅在需要容器化新手引导冒烟测试时才需要。

在一个干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
