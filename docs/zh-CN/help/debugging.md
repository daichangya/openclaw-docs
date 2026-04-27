---
read_when:
    - 你需要检查原始模型输出中的推理泄漏问题
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一套可重复的调试工作流
summary: 调试工具：监视模式、原始模型流以及推理泄漏追踪
title: 调试
x-i18n:
    generated_at: "2026-04-27T06:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374af10312e07d4c4e45d07416fa2d0920dd300e739ebb7a3b72b1e327f21cc1
    source_path: help/debugging.md
    workflow: 15
---

用于调试流式输出的辅助工具，尤其适用于提供商将推理内容混入普通文本时的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 可设置**仅运行时**的配置覆盖（存储在内存中，不写入磁盘）。
`/debug` 默认禁用；通过 `commands.debug: true` 启用。
当你需要切换一些冷门设置而不想编辑 `openclaw.json` 时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖，并恢复为磁盘上的配置。

## 会话 trace 输出

当你希望只在某个会话中查看插件拥有的 trace/debug 行，
而不启用完整 verbose 模式时，请使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如 Active Memory 调试摘要。
普通 verbose 状态/工具输出仍使用 `/verbose`，而运行时专用配置覆盖仍使用
`/debug`。

## 临时 CLI 调试计时

OpenClaw 保留 `src/cli/debug-timing.ts` 作为一个用于本地排查的小型辅助工具。
它有意默认不接入 CLI 启动流程、命令路由或任何命令。仅在调试慢命令时使用，
然后在提交行为变更前移除相应的 import 和 span。

当某条命令很慢，而你需要先快速拆解各阶段耗时，
再决定是使用 CPU profiler 还是修复某个特定子系统时，可使用它。

### 添加临时 span

将辅助工具添加到你正在排查的代码附近。例如，在调试
`openclaw models list` 时，可在
`src/commands/models/list.list-command.ts` 中临时加入如下补丁：

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

指南：

- 临时阶段名称请使用 `debug:` 前缀。
- 只在怀疑较慢的代码段周围添加少量 span。
- 优先使用宽泛阶段名称，如 `registry`、`auth_store` 或 `rows`，而不是辅助函数名。
- 对同步工作使用 `time()`，对 Promise 使用 `timeAsync()`。
- 保持 stdout 干净。该辅助工具会写入 stderr，因此命令的 JSON 输出仍可解析。
- 在提交最终修复 PR 前移除临时 import 和 span。
- 在 issue 或 PR 中附上计时输出或简短摘要，以说明优化依据。

### 使用可读输出运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

来自一次临时 `models list` 排查的示例输出：

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

从这份输出可得出的结论：

| Phase | Time | 含义 |
| ----- | ---: | ---- |
| `debug:models:list:auth_store` | 20.3s | auth-profile store 加载是最大的成本，应优先排查。 |
| `debug:models:list:ensure_models_json` | 5.0s | 同步 `models.json` 的开销足够大，值得检查缓存或跳过条件。 |
| `debug:models:list:load_model_registry` | 5.9s | 注册表构建和 provider 可用性检查也有明显成本。 |
| `debug:models:list:read_registry_models` | 2.4s | 读取全部注册表模型并非没有成本，对 `--all` 可能很重要。 |
| 行追加阶段 | 总计 3.2s | 即使只构建 5 行显示结果，也用了数秒，因此应进一步查看过滤路径。 |
| `debug:models:list:print_model_table` | 0ms | 渲染不是瓶颈。 |

这些结论已经足以指导下一次补丁，而无需将计时代码保留在
生产路径中。

### 使用 JSON 输出运行

当你想保存或比较计时数据时，请使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr 的每一行都是一个 JSON 对象：

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 提交前清理

在打开最终 PR 之前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

除非该 PR 明确是在添加永久性的诊断能力，否则该命令不应返回任何临时埋点调用点。
对于普通性能修复，只保留行为变更、测试以及包含计时证据的简短说明。

对于更深层的 CPU 热点，请使用 Node profiling（`--cpu-prof`）或外部
profiler，而不是继续添加更多计时包装。

## Gateway 网关监视模式

为了快速迭代，可在文件监视器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

它映射到：

```bash
node scripts/watch-node.mjs gateway --force
```

当 `src/` 下的构建相关文件、扩展源码文件、
扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts` 发生变化时，监视器会重启
gateway。扩展元数据变更会重启 gateway，但不会强制执行 `tsdown` 重建；
源码和配置变更仍会先重建 `dist`。

在 `gateway:watch` 后追加任何 gateway CLI 标志，
这些标志都会在每次重启时透传。现在，对同一仓库/同一标志集重复运行相同的监视命令
会替换旧的 watcher，而不是留下重复的 watcher 父进程。

## Dev profile + dev gateway（`--dev`）

使用 dev profile 可以隔离状态，并为调试启动一个安全、可丢弃的环境。
这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）**：将状态隔离到 `~/.openclaw-dev` 下，
  并默认将 gateway 端口设为 `19001`（派生端口也会随之变动）。
- **`gateway --dev`**：告诉 Gateway 网关在配置和工作区缺失时自动创建默认配置 +
  workspace（并跳过 `BOOTSTRAP.md`）。

推荐流程（dev profile + dev bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

其作用如下：

1. **Profile 隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 端口也会相应偏移）

2. **Dev bootstrap**（`gateway --dev`）
   - 若配置缺失则写入一个最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设置为 dev workspace。
   - 设置 `agent.skipBootstrap=true`（不使用 `BOOTSTRAP.md`）。
   - 若工作区文件缺失则写入初始文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（protocol droid）。
   - 在 dev 模式下跳过渠道 provider（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局** profile 标志，会被某些运行器吞掉。如果你需要显式写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话以及 dev workspace（使用
`trash`，而不是 `rm`），然后重新创建默认的 dev 设置。

<Tip>
如果已有非 dev 的 gateway 正在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以记录**原始助手流**，即在任何过滤/格式化之前的内容。
这是查看推理内容是否以普通文本 delta
（或作为独立 thinking block）到达的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始分块日志（pi-mono）

若要在分块被解析成 block 之前捕获**原始 OpenAI 兼容分块**，
pi-mono 提供了单独的记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这只会由使用 pi-mono
> `openai-completions` provider 的进程输出。

## 安全说明

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 请将日志保留在本地，并在调试后删除。
- 如果你要共享日志，请先清理密钥和个人敏感信息。

## 相关内容

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
