---
read_when:
    - 你遇到了连接性/身份验证问题，并希望获得引导式修复
    - 你已完成更新，并希望进行安装完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: doctor
x-i18n:
    generated_at: "2026-04-23T07:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

用于 Gateway 网关和渠道的健康检查 + 快速修复。

相关内容：

- 故障排除：[故障排除](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 示例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 选项

- `--no-workspace-suggestions`：禁用工作区 memory/search 建议
- `--yes`：接受默认值，不进行提示
- `--repair`：不经提示应用推荐修复
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：以非交互方式运行；仅执行安全迁移
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--deep`：扫描系统服务中额外的 Gateway 网关安装

说明：

- 交互式提示（如钥匙串/OAuth 修复）仅会在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过插件的预加载，以保持无头健康检查的快速执行。交互式会话在检查需要插件参与时仍会完整加载插件。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键，同时列出每一项被删除内容。
- 状态完整性检查现在会检测会话目录中孤立的 transcript 文件，并可将其归档为 `.deleted.<timestamp>`，以安全回收空间。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务结构，并可在调度器需要在运行时自动规范化之前原地重写它们。
- Doctor 会修复缺失的内置插件运行时依赖，而无需对已安装的 OpenClaw 软件包具有写入权限。对于 root 拥有的 npm 安装或加固的 systemd 单元，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写目录，例如 `/var/lib/openclaw/plugin-runtime-deps`。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）迁移到 `talk.provider` + `talk.providers.<provider>`。
- 重复运行 `doctor --fix` 时，如果唯一差异只是对象键顺序，将不再报告/应用 Talk 规范化。
- Doctor 包含 memory-search 就绪性检查，并且在缺少嵌入凭证时会建议运行 `openclaw configure --section model`。
- 如果已启用沙箱模式但 Docker 不可用，doctor 会报告高信号警告并给出修复建议（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，而当前命令路径中不可用，doctor 会报告只读警告，不会写入明文回退凭证。
- 如果渠道 SecretRef 检查在修复路径中失败，doctor 会继续执行并报告警告，而不是提前退出。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中存在可解析的 Telegram 令牌。如果无法检查令牌，doctor 会报告警告，并在该次运行中跳过自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续出现“未授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
