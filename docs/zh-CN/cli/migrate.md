---
read_when:
    - 你想从 Hermes 或另一个智能体系统迁移到 OpenClaw】【。
    - 你正在添加一个由插件拥有的迁移提供商】【。
summary: 从另一个智能体系统导入状态的 CLI 参考
title: 迁移
x-i18n:
    generated_at: "2026-04-27T08:00:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3efe1f29ae0e7832b7a349f2260e6934990d09ca74a16b73b31350613e2f77aa
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

通过由插件拥有的迁移提供商，从另一个智能体系统导入状态。

```bash
openclaw migrate list
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
```

## 安全模型

`openclaw migrate` 采用“预览优先”模式。提供商会在任何更改发生前返回一份逐项列出的计划，其中包括冲突、已跳过的项以及敏感项。JSON 计划、应用输出和迁移报告会对嵌套的疑似密钥字段进行脱敏，例如 API 密钥、令牌、授权头、cookie 和密码。

`openclaw migrate apply <provider>` 会先预览计划，并在更改状态之前提示确认，除非设置了 `--yes`。在非交互模式下，apply 需要 `--yes`。使用 `--json` 且未设置 `--yes` 时，apply 会打印 JSON 计划，并且不会修改状态。

Apply 会在执行迁移之前创建并验证一个 OpenClaw 备份。如果本地尚不存在 OpenClaw 状态，则会跳过备份步骤，迁移仍可继续。若在状态已存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。

当计划中存在冲突时，Apply 模式会拒绝继续执行。请先查看计划，然后在确实有意替换现有目标时，使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入逐项备份。

默认情况下绝不会导入密钥。使用 `--include-secrets` 以导入受支持的凭证。

## Hermes

内置的 Hermes 提供商默认会在 `~/.hermes` 检测 Hermes 状态。如果 Hermes 位于其他位置，请使用 `--from <path>`。

Hermes 迁移可导入：

- `config.yaml` 中的默认模型配置
- `providers` 和 `custom_providers` 中已配置的模型提供商及自定义 OpenAI 兼容端点
- `mcp_servers` 或 `mcp.servers` 中的 MCP 服务器定义
- 将 `SOUL.md` 和 `AGENTS.md` 导入到 OpenClaw 智能体工作区
- 通过追加到工作区 memory 文件，导入 `memories/MEMORY.md` 和 `memories/USER.md`
- OpenClaw 文件 memory 的 memory 配置默认值，以及针对 Honcho 等外部 memory 提供商的仅归档 / 需手动审核项
- 来自 `skills/<name>/` 且带有 `SKILL.md` 文件的 Skills
- 来自 `skills.config` 的按 Skill 划分的配置值
- 来自 `.env` 的受支持 API 密钥，仅在使用 `--include-secrets` 时导入

仅归档的 Hermes 状态会被复制到迁移报告中，供手动审核，但不会载入到在线的 OpenClaw 配置或凭证中。这会保留不透明或不安全的状态，例如 `plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`auth.json` 和 `state.db`，而不会假装 OpenClaw 可以自动执行或信任它们。

受支持的 Hermes `.env` 键包括 `OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY` 和 `DEEPSEEK_API_KEY`。

应用迁移后，请运行：

```bash
openclaw doctor
```

## 插件契约

迁移源是插件。插件会在 `openclaw.plugin.json` 中声明其提供商 id：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

在运行时，插件会调用 `api.registerMigrationProvider(...)`。该提供商实现 `detect`、`plan` 和 `apply`；核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将审核后的计划传入 `apply(ctx, plan)`，而提供商仅可在该参数缺失时重新构建计划，以保持兼容性。提供商插件可以使用 `openclaw/plugin-sdk/migration` 进行条目构造和汇总计数，也可以使用 `openclaw/plugin-sdk/migration-runtime` 进行具备冲突感知的文件复制、仅归档报告复制和迁移报告处理。

当某个提供商检测到已知来源时，新手引导也可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 使用相同的插件迁移提供商，并且在应用前仍会显示预览。新手引导导入要求使用全新的 OpenClaw 设置；如果你已经有本地状态，请先重置配置、凭证、会话和工作区。对于现有设置，带备份以及覆盖或合并的导入目前受功能开关控制。
