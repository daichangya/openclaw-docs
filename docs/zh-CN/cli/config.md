---
read_when:
    - 你想以非交互方式读取或编辑配置
summary: '`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-04-24T03:14:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助工具：按路径 get/set/unset/file/schema/validate 值，并打印当前正在使用的配置文件。不带子命令运行时，会打开配置向导（与 `openclaw configure` 相同）。

根选项：

- `--section <section>`：当你在不带子命令的情况下运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器

支持的引导式分区：

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

以 JSON 格式将为 `openclaw.json` 生成的 JSON schema 打印到标准输出。

它包含的内容：

- 当前的根配置 schema，以及供编辑器工具使用的根 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当存在匹配的字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据
- 当存在匹配的字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据
- 当可以加载运行时清单时，尽力提供实时的插件 + 渠道 schema 元数据
- 即使当前配置无效，也会提供一个干净的回退 schema

相关的运行时 RPC：

- `config.schema.lookup` 会返回一个标准化的配置路径，以及一个浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据和直接子项摘要。可将其用于 Control UI 或自定义客户端中的路径范围逐级查看。

```bash
openclaw config schema
```

当你想使用其他工具检查或验证它时，可以将其输出到文件：

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

值会尽可能按 JSON5 解析；否则会被视为字符串。使用 `--strict-json` 可强制要求进行 JSON5 解析。`--json` 仍然作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会以 JSON 形式打印原始值，而不是终端格式化文本。

默认情况下，对象赋值会替换目标路径。对于那些通常保存用户新增条目的受保护 map/list 路径，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，如果替换会移除现有条目，则会拒绝该操作，除非你传入 `--replace`。

当你向这些 map 添加条目时，请使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有当你明确希望所提供的值成为完整目标值时，才使用 `--replace`。

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

- 对于不支持运行时可变的表面，SecretRef 赋值会被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token，以及 WhatsApp 凭证 JSON）。参见 [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)。

批处理解析始终以批处理负载（`--batch-json`/`--batch-file`）作为唯一真实来源。
`--strict-json` / `--json` 不会改变批处理解析行为。

JSON 路径/值模式对 SecretRef 和提供商同样受支持：

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

常用标志：

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

环境提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

文件提供商（`--provider-source file`）：

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

加固后的 Exec 提供商示例：

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

使用 `--dry-run` 可以在不写入 `openclaw.json` 的情况下验证更改。

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

Dry-run 行为：

- 构建器模式：对已更改的 ref/provider 运行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批处理模式）：运行 schema 验证以及 SecretRef 可解析性检查。
- 已知不受支持的 SecretRef 目标表面也会运行策略验证。
- 策略检查会评估更改后的完整配置，因此父对象写入（例如将 `hooks` 设置为对象）不能绕过不受支持表面的验证。
- 为避免命令副作用，dry-run 默认会跳过 Exec SecretRef 检查。
- 将 `--allow-exec` 与 `--dry-run` 一起使用，可选择启用 Exec SecretRef 检查（这可能会执行提供商命令）。
- `--allow-exec` 仅适用于 dry-run；如果未与 `--dry-run` 一起使用会报错。

`--dry-run --json` 会打印机器可读报告：

- `ok`：dry-run 是否通过
- `operations`：已评估的赋值操作数量
- `checks`：是否运行了 schema/可解析性检查
- `checks.resolvabilityComplete`：可解析性检查是否完整运行（当跳过 Exec ref 时为 false）
- `refsChecked`：dry-run 期间实际解析的 ref 数量
- `skippedExecRefs`：由于未设置 `--allow-exec` 而被跳过的 Exec ref 数量
- `errors`：当 `ok=false` 时的结构化 schema/可解析性失败信息

### JSON 输出结构

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
      ref?: string, // 仅在可解析性错误时出现
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

如果 dry-run 失败：

- `config schema validation failed`：更改后的配置结构无效；请修复路径/值或 provider/ref 对象结构。
- `Config policy validation failed: unsupported SecretRef usage`：请将该凭证移回纯文本/字符串输入，并仅在受支持的表面上使用 SecretRefs。
- `SecretRef assignment(s) could not be resolved`：当前无法解析所引用的 provider/ref（缺少环境变量、文件指针无效、Exec 提供商失败，或 provider/source 不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 Exec ref；如果你需要验证 Exec 可解析性，请使用 `--allow-exec` 重新运行。
- 对于批处理模式，请修复失败的条目，并在写入前重新运行 `--dry-run`。

## 写入安全

`openclaw config set` 和其他由 OpenClaw 拥有的配置写入器，会在提交到磁盘前验证更改后完整配置。如果新负载未通过 schema 验证，或看起来像是具有破坏性的覆盖，当前生效的配置将保持不变，而被拒绝的负载会保存到旁边，文件名为 `openclaw.json.rejected.*`。
当前生效的配置路径必须是常规文件。写入不支持使用符号链接的 `openclaw.json` 布局；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

对于小改动，优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的负载并修复完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接通过编辑器写入，但正在运行的 Gateway 网关 会在这些更改通过验证之前将其视为不受信任。无效的直接编辑可在启动或热重载期间从最后一次已知有效备份中恢复。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

## 子命令

- `config file`：打印当前生效的配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向常规文件，而不是符号链接。

编辑后请重启 Gateway 网关。

## 验证

在不启动 Gateway 网关 的情况下，根据当前生效的 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

在 `openclaw config validate` 通过后，你可以使用本地 TUI，让一个内嵌智能体在你从同一终端验证每项更改时，对照文档比较当前生效的配置：

如果验证已经失败，请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

```bash
openclaw chat
```

然后在 TUI 内运行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型的修复流程：

- 让智能体将你当前的配置与相关文档页面进行比较，并建议最小修复方案。
- 使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修改。
- 每次更改后重新运行 `openclaw config validate`。
- 如果验证通过，但运行时仍然不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 以获取迁移和修复帮助。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
