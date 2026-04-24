---
read_when:
    - 调试模型认证或 OAuth 过期
    - 编写认证或凭证存储文档
summary: 模型认证：OAuth、API 密钥、Claude CLI 复用，以及 Anthropic setup-token
title: 认证
x-i18n:
    generated_at: "2026-04-24T03:15:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# 认证（模型提供商）

<Note>
本页介绍的是**模型提供商**认证（API 密钥、OAuth、Claude CLI 复用，以及 Anthropic setup-token）。关于 **Gateway 网关连接** 认证（token、password、trusted-proxy），请参见 [配置](/zh-CN/gateway/configuration) 和 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商使用 OAuth 和 API 密钥。对于长期运行的 Gateway 网关主机，API 密钥通常是最可预测的选项。当它们与你的提供商账户模型匹配时，也支持订阅 / OAuth 流程。

完整的 OAuth 流程和存储布局，请参见 [/concepts/oauth](/zh-CN/concepts/oauth)。
关于基于 SecretRef 的认证（`env`/`file`/`exec` 提供商），请参见 [Secrets Management](/zh-CN/gateway/secrets)。
关于 `models status --probe` 使用的凭证资格 / reason-code 规则，请参见
[Auth Credential Semantics](/zh-CN/auth-credential-semantics)。

## 推荐设置（API 密钥，任意提供商）

如果你运行的是长期在线的 Gateway 网关，建议先为你选择的提供商使用 API 密钥。
对 Anthropic 而言，API 密钥认证仍然是最可预测的服务器设置方式，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在你的提供商控制台中创建 API 密钥。
2. 将其放在**Gateway 网关主机**上（即运行 `openclaw gateway` 的机器）。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 网关 在 systemd/launchd 下运行，建议将密钥放在
   `~/.openclaw/.env` 中，以便守护进程可以读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启守护进程（或重启你的 Gateway 网关进程）并重新检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，新手引导也可以为守护进程使用存储
API 密钥：`openclaw onboard`。

关于环境继承（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）的详细信息，请参见 [帮助](/zh-CN/help)。

## Anthropic：Claude CLI 和 token 兼容性

Anthropic setup-token 认证在 OpenClaw 中仍然作为受支持的 token 路径可用。此后 Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的认可方式，除非 Anthropic 发布新的政策。当主机上可用 Claude CLI 复用时，这现在是首选路径。

对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是最可预测的设置方式。如果你想在同一主机上复用现有的 Claude 登录，请在新手引导 / 配置中使用 Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# 在 Gateway 网关主机上运行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 先让 Claude Code 自身在 Gateway 网关主机上登录到 Anthropic。
2. 然后告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli`
   后端，并存储对应的 OpenClaw 认证配置文件。

如果 `claude` 不在 `PATH` 中，请先安装 Claude Code，或将
`agents.defaults.cliBackends.claude-cli.command` 设置为真实的二进制路径。

手动粘贴 token（任意提供商；会写入 `auth-profiles.json` + 更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

认证配置文件引用也支持用于静态凭证：

- `api_key` 凭证可使用 `keyRef: { source, provider, id }`
- `token` 凭证可使用 `tokenRef: { source, provider, id }`
- OAuth 模式配置文件不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则该配置文件的基于 SecretRef 的 `keyRef`/`tokenRef` 输入会被拒绝。

适合自动化的检查（缺失 / 已过期时退出码为 `1`，即将过期时为 `2`）：

```bash
openclaw models status --check
```

实时认证探测：

```bash
openclaw models status --probe
```

说明：

- 探测行可能来自认证配置文件、环境凭证或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了某个已存储配置文件，探测会为该配置文件报告
  `excluded_by_auth_order`，而不是尝试使用它。
- 如果认证存在，但 OpenClaw 无法为该提供商解析出可探测的模型候选项，探测会报告
  `status: no_model`。
- 速率限制冷却可以是模型级别的。对某个模型处于冷却中的配置文件，仍可能可用于同一提供商上的兄弟模型。

可选运维脚本（systemd/Termux）记录在这里：
[认证监控脚本](/zh-CN/help/scripts#auth-monitoring-scripts)

## Anthropic 说明

Anthropic `claude-cli` 后端现已再次受支持。

- Anthropic 工作人员告诉我们，这条 OpenClaw 集成路径再次被允许。
- 因此，除非 Anthropic 发布新的政策，OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为
  Anthropic 支持运行时的认可方式。
- 对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是最可预测的选择，并且便于明确控制服务器端计费。

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway 网关）

某些提供商支持在 API 调用遇到提供商速率限制时，使用其他密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单一覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还会额外将 `GOOGLE_API_KEY` 作为回退项。
- 相同的密钥列表在使用前会先去重。
- OpenClaw 仅在速率限制错误时使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试的最终错误。

## 控制使用哪个凭证

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 可为当前会话固定特定的提供商凭证（配置文件 id 示例：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）可打开紧凑选择器；使用 `/model status` 可查看完整视图（候选项 + 下一个认证配置文件，以及配置后可见的提供商端点详情）。

### 按智能体（CLI 覆盖）

为智能体设置显式的认证配置文件顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 来定位特定智能体；省略它则使用已配置的默认智能体。
当你调试顺序问题时，`openclaw models status --probe` 会将被省略的
已存储配置文件显示为 `excluded_by_auth_order`，而不是静默跳过它们。
当你调试冷却问题时，请记住速率限制冷却可能绑定到某个模型 id，
而不是整个提供商配置文件。

## 故障排除

### “No credentials found”

如果缺少 Anthropic 配置文件，请在**Gateway 网关主机**上配置 Anthropic API 密钥，或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### token 即将过期 / 已过期

运行 `openclaw models status` 以确认哪个配置文件即将过期。如果某个
Anthropic token 配置文件缺失或已过期，请通过
setup-token 刷新该设置，或迁移到 Anthropic API 密钥。

## 相关内容

- [Secrets management](/zh-CN/gateway/secrets)
- [远程访问](/zh-CN/gateway/remote)
- [认证存储](/zh-CN/concepts/oauth)
