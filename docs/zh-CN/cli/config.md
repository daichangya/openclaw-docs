---
read_when:
    - 你想以非交互方式读取或编辑配置
summary: '`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-04-23T20:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d9a9b081906971c44b88a67f70ee20015a88441ce2a2cfdf9c83e01a432458
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助工具：按路径 get/set/unset/file/schema/validate
值，并打印当前活动的配置文件。不带子命令运行时，
会打开配置向导（与 `openclaw configure` 相同）。

根选项：

- `--section <section>`：当你在不带子命令的情况下运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器

支持的引导分区：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## 示例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.5":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将为 `openclaw.json` 生成的 JSON schema 以 JSON 形式输出到 stdout。

包含内容：

- 当前根配置 schema，以及用于编辑器工具的根 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当存在匹配字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据
- 当存在匹配字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据
- 当可加载运行时 manifest 时，尽力提供实时的插件 + 渠道 schema 元数据
- 即使当前配置无效，也会提供一个干净的回退 schema

相关运行时 RPC：

- `config.schema.lookup` 返回一条规范化配置路径，以及一个浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界），
  匹配的 UI 提示元数据和直接子项摘要。可用于
  Control UI 或自定义客户端中的按路径深入查看。

```bash
openclaw config schema
```

当你想用其他工具检查或验证它时，可将其输出到文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点表示法或方括号表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用智能体列表索引来定位特定智能体：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值会在可能时按 JSON5 解析；否则会被视为字符串。
使用 `--strict-json` 强制要求按 JSON5 解析。`--json` 仍然作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值作为 JSON 输出，而不是终端格式化文本。

默认情况下，对象赋值会替换目标路径。那些通常保存用户添加条目的受保护 map/list 路径，
如 `agents.defaults.models`、
`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和
`auth.profiles`，会拒绝会移除现有条目的替换操作，除非你传入 `--replace`。

向这些 map 添加条目时，请使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.5":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅当你明确希望所提供的值成为
完整目标值时，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值方式：

1. 值模式：`openclaw config set <path> <value>`
2. SecretRef 构建器模式：

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. 提供商构建器模式（仅限 `secrets.providers.<alias>` 路径）：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. 批处理模式（`--batch-json` 或 `--batch-file`）：

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

策略说明：

- 不支持的运行时可变表面上的 SecretRef 赋值会被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook 令牌以及 WhatsApp creds JSON）。参见 [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)。

批处理解析始终将批处理载荷（`--batch-json`/`--batch-file`）作为真实来源。
`--strict-json` / `--json` 不会改变批处理解析行为。

JSON 路径/值模式仍然支持 SecretRef 和提供商：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## 提供商构建器标志

提供商构建器目标路径必须使用 `secrets.providers.<alias>`。

通用标志：

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

Env 提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

File 提供商（`--provider-source file`）：

- `--provider-path <path>`（必填）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec 提供商（`--provider-source exec`）：

- `--provider-command <path>`（必填）
- `--provider-arg <arg>`（可重复）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（可重复）
- `--provider-pass-env <ENV_VAR>`（可重复）
- `--provider-trusted-dir <path>`（可重复）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

加固的 exec 提供商示例：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

使用 `--dry-run` 验证更改，而不写入 `openclaw.json`。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Dry run 行为：

- 构建器模式：对变更后的 refs/providers 执行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批处理模式）：执行 schema 验证以及 SecretRef 可解析性检查。
- 已知不支持的 SecretRef 目标表面也会执行策略验证。
- 策略检查会评估变更后的完整配置，因此父对象写入（例如将 `hooks` 设置为一个对象）无法绕过不支持表面验证。
- 默认情况下，dry run 期间会跳过 exec SecretRef 检查，以避免命令副作用。
- 在 `--dry-run` 时使用 `--allow-exec` 可选择启用 exec SecretRef 检查（这可能会执行提供商命令）。
- `--allow-exec` 仅适用于 dry run；若未与 `--dry-run` 一起使用则会报错。

`--dry-run --json` 会输出机器可读报告：

- `ok`：dry run 是否通过
- `operations`：已评估的赋值操作数
- `checks`：是否运行了 schema/可解析性检查
- `checks.resolvabilityComplete`：可解析性检查是否完整执行（当跳过 exec refs 时为 false）
- `refsChecked`：dry run 期间实际解析的 ref 数量
- `skippedExecRefs`：因未设置 `--allow-exec` 而被跳过的 exec ref 数量
- `errors`：当 `ok=false` 时，结构化的 schema/可解析性失败信息

### JSON 输出形状

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // 出现在可解析性错误中
    },
  ],
}
```

成功示例：

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

失败示例：

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

如果 dry run 失败：

- `config schema validation failed`：你变更后的配置形状无效；请修正路径/值或 provider/ref 对象形状。
- `Config policy validation failed: unsupported SecretRef usage`：将该凭证改回明文/字符串输入，并仅在受支持的表面上使用 SecretRefs。
- `SecretRef assignment(s) could not be resolved`：当前无法解析被引用的 provider/ref（环境变量缺失、文件指针无效、exec 提供商失败，或 provider/source 不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry run 跳过了 exec refs；如果你需要验证 exec 可解析性，请使用 `--allow-exec` 重新运行。
- 对于批处理模式，请修复失败条目，并在写入前重新运行 `--dry-run`。

## 写入安全

`openclaw config set` 和其他由 OpenClaw 管理的配置写入器会在提交到磁盘之前，
验证变更后的完整配置。如果新载荷未通过 schema
验证，或看起来像是破坏性覆盖，当前活动配置将保持不变，
被拒绝的载荷会作为 `openclaw.json.rejected.*` 保存在其旁边。
当前活动配置路径必须是常规文件。符号链接的 `openclaw.json`
布局不支持写入；请改用 `OPENCLAW_CONFIG_PATH` 直接指向
真实文件。

对于小修改，优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的载荷并修复完整配置形状：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接通过编辑器写入，但正在运行的 Gateway 网关会在这些修改通过验证之前将其视为
不可信。无效的直接编辑可在启动或热重载期间，从上一次已知良好的备份中恢复。参见
[Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

## 子命令

- `config file`：打印当前活动配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向常规文件，而不是符号链接。

编辑后请重启 Gateway 网关。

## 验证

根据当前活动 schema 验证当前配置，而不启动
Gateway 网关。

```bash
openclaw config validate
openclaw config validate --json
```

当 `openclaw config validate` 通过后，你可以使用本地 TUI，让
一个嵌入式智能体在你从同一个终端逐项验证更改时，对照文档比较当前活动配置：

如果验证已经失败，请先从 `openclaw configure` 或
`openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置
保护。

```bash
openclaw chat
```

然后在 TUI 中：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修复循环：

- 让智能体将你当前配置与相关文档页面进行比较，并建议最小修复方案。
- 使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修改。
- 每次修改后重新运行 `openclaw config validate`。
- 如果验证通过但运行时仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移和修复帮助。
