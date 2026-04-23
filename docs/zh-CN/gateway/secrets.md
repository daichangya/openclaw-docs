---
read_when:
    - 为提供商凭证和 `auth-profiles.json` refs 配置 SecretRefs
    - 在生产环境中安全地执行秘密重载、审计、配置和应用 开元棋牌 to=final code omitted
    - 理解启动快速失败、非活动表面过滤和上一次已知良好配置行为
summary: 秘密管理：SecretRef 契约、运行时快照行为与安全的单向清除
title: 秘密管理
x-i18n:
    generated_at: "2026-04-23T20:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw 支持增量式 SecretRef，因此在受支持的情况下，凭证无需以明文形式存储在配置中。

明文仍然可用。SecretRef 是按凭证逐项选择启用的可选功能。

## 目标与运行时模型

秘密会被解析到内存中的运行时快照里。

- 解析发生在激活期间，并且是急切解析，而不是在请求路径上惰性解析。
- 当某个实际处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重载使用原子交换：要么完全成功，要么保留上一次已知良好的快照。
- SecretRef 策略违规（例如 OAuth 模式的认证配置文件与 SecretRef 输入组合使用）会在运行时快照交换之前导致激活失败。
- 运行时请求只会从当前活动的内存快照中读取。
- 在首次成功完成配置激活/加载后，运行时代码路径会持续读取该活动内存快照，直到成功重载并完成交换。
- 出站传递路径也从该活动快照中读取（例如 Discord 回复/线程传递和 Telegram 操作发送）；它们不会在每次发送时重新解析 SecretRefs。

这样可以避免在高频请求路径上受到秘密提供商故障的影响。

## 活动表面过滤

SecretRef 只会在实际上处于活动状态的表面上进行验证。

- 已启用的表面：未解析的 refs 会阻止启动/重载。
- 非活动表面：未解析的 refs 不会阻止启动/重载。
- 非活动 refs 会发出非致命诊断，代码为 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`。

非活动表面的示例：

- 已禁用的渠道/账户条目。
- 启用账户没有继承的顶级渠道凭证。
- 已禁用的工具/功能表面。
- 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用密钥。
  在自动模式下（未设置 provider），系统会按优先级依次尝试各密钥进行提供商自动检测，直到某个密钥成功解析。
  选定之后，未选中的提供商密钥会被视为非活动，直到被选中。
- 沙箱 SSH 认证材料（`agents.defaults.sandbox.ssh.identityData`、
  `certificateData`、`knownHostsData`，以及每个智能体的覆盖项）仅在默认智能体或已启用智能体的生效沙箱后端为 `ssh` 时处于活动状态。
- `gateway.remote.token` / `gateway.remote.password` SecretRefs 在以下任一情况成立时处于活动状态：
  - `gateway.mode=remote`
  - 已配置 `gateway.remote.url`
  - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
  - 在本地模式下且不存在上述远程表面时：
    - 当令牌认证可能胜出且未配置 env/auth 令牌时，`gateway.remote.token` 处于活动状态。
    - 当密码认证可能胜出且未配置 env/auth 密码时，`gateway.remote.password` 才处于活动状态。
- 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动认证解析来说处于非活动状态，因为该运行时会优先采用环境变量令牌输入。

## Gateway 网关认证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、
`gateway.remote.token` 或 `gateway.remote.password` 上配置 SecretRef 时，Gateway 网关启动/重载会显式记录
该表面的状态：

- `active`：该 SecretRef 属于生效认证表面，必须可解析。
- `inactive`：该 SecretRef 会在此运行时中被忽略，因为有其他认证表面胜出，或
  因为远程认证未启用/未激活。

这些条目会以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活动表面策略所使用的原因，因此你可以看到某个凭证为何被视为活动或非活动。

## 新手引导引用预检查

当新手引导在交互模式下运行，并且你选择使用 SecretRef 存储时，OpenClaw 会在保存前运行预检查验证：

- Env refs：验证环境变量名，并确认在设置期间可见非空值。
- Provider refs（`file` 或 `exec`）：验证提供商选择、解析 `id`，并检查解析值类型。
- 快速开始复用路径：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会在探测/仪表盘引导之前先解析它（适用于 `env`、`file` 和 `exec` refs），并使用相同的快速失败门控。

如果验证失败，新手引导会显示错误并允许你重试。

## SecretRef 契约

在所有地方都使用同一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

验证规则：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

验证规则：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须是绝对 JSON pointer（`/...`）
- 段中的 RFC6901 转义规则：`~` => `~0`，`/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

验证规则：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` 不得包含以 `/` 分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

## 提供商配置

在 `secrets.providers` 下定义提供商：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 或 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env 提供商

- 可通过 `allowlist` 设置可选允许列表。
- 环境变量值缺失或为空都会导致解析失败。

### File 提供商

- 从 `path` 读取本地文件。
- `mode: "json"` 期待 JSON 对象载荷，并将 `id` 解析为 pointer。
- `mode: "singleValue"` 期待 ref id 为 `"value"`，并返回文件内容。
- 路径必须通过所有权/权限检查。
- Windows 失败即关闭说明：如果无法对某个路径进行 ACL 验证，则解析失败。仅对受信任路径，可在该提供商上设置 `allowInsecurePath: true`，以绕过路径安全检查。

### Exec 提供商

- 运行已配置的绝对二进制路径，不经过 shell。
- 默认情况下，`command` 必须指向常规文件（不能是符号链接）。
- 设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shim）。OpenClaw 会验证解析后的目标路径。
- 对于包管理器路径（例如 `["/opt/homebrew"]`），应将 `allowSymlinkCommand` 与 `trustedDirs` 搭配使用。
- 支持超时、无输出超时、输出字节限制、环境变量允许列表以及受信任目录。
- Windows 失败即关闭说明：如果无法对命令路径进行 ACL 验证，则解析失败。仅对受信任路径，可在该提供商上设置 `allowInsecurePath: true`，以绕过路径安全检查。

请求载荷（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

响应载荷（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

可选的按 ID 错误：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec 集成示例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制所必需
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这样可以避免将 API 密钥和令牌放在明文配置中：

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

明文字符串值仍然可用。像 `${MCP_SERVER_API_KEY}` 这样的 env-template refs 和 SecretRef 对象会在 Gateway 网关激活期间、MCP 服务器进程启动之前完成解析。与其他 SecretRef 表面一样，只有当 `acpx` 插件实际上处于活动状态时，未解析的 refs 才会阻止激活。

## 沙箱 SSH 认证材料

核心 `ssh` 沙箱后端也支持将 SecretRef 用于 SSH 认证材料：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

运行时行为：

- OpenClaw 会在沙箱激活期间解析这些 refs，而不是在每次 SSH 调用时惰性解析。
- 解析后的值会写入具有限制性权限的临时文件，并用于生成的 SSH 配置。
- 如果生效的沙箱后端不是 `ssh`，这些 refs 将保持非活动状态，不会阻止启动。

## 支持的凭证表面

受支持与不受支持凭证的规范列表见：

- [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)

运行时签发或会轮换的凭证，以及 OAuth 刷新材料，都被有意排除在只读 SecretRef 解析之外。

## 必需行为与优先级

- 字段没有 ref：行为不变。
- 字段有 ref：在活动表面上，激活期间必须可解析。
- 如果同时存在明文和 ref，在受支持的优先级路径上，ref 优先。
- 脱敏哨兵值 `__OPENCLAW_REDACTED__` 保留供内部配置脱敏/恢复使用，作为字面量提交的配置数据时会被拒绝。

警告与审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 中的凭证优先于 `openclaw.json` refs 时的审计发现）

Google Chat 兼容性行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 当设置了同级 ref 时，明文值会被忽略。

## 激活触发器

秘密激活会在以下场景运行：

- 启动时（预检查 + 最终激活）
- 配置重载的热应用路径
- 配置重载的重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检查（`config.set` / `config.apply` / `config.patch`），用于在持久化编辑之前，针对提交配置载荷中活动表面的 SecretRef 可解析性进行检查

激活契约：

- 成功时会原子交换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败会保留上一次已知良好的快照。
- 写入 RPC 预检查失败会拒绝提交的配置，并保持磁盘配置和活动运行时快照都不变。
- 为出站辅助工具/工具调用提供显式的单次渠道令牌不会触发 SecretRef 激活；激活点仍然只有启动、重载和显式 `secrets.reload`。

## 降级与恢复信号

当健康状态下的重载时激活失败后，OpenClaw 会进入秘密降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时会保留上一次已知良好的快照。
- 恢复：在下一次成功激活后只发出一次。
- 如果已经处于降级状态时再次失败，会记录警告，但不会重复刷屏事件。
- 启动快速失败不会发出降级事件，因为运行时从未真正进入活动状态。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择加入受支持的 SecretRef 解析。

大致有两类行为：

- 严格命令路径（例如 `openclaw memory` 的远程 memory 路径，以及当 `openclaw qr --remote` 需要远程共享密钥 refs 时）会从活动快照中读取，并在必需 SecretRef 不可用时快速失败。
- 只读命令路径（例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读的 doctor/config 修复流程）同样优先使用活动快照，但当目标 SecretRef 在该命令路径中不可用时，会降级而不是中止。

只读行为：

- 当 Gateway 网关正在运行时，这些命令会优先从活动快照读取。
- 如果 Gateway 网关解析不完整，或 Gateway 网关不可用，它们会尝试针对特定命令表面的本地定向回退。
- 如果目标 SecretRef 仍然不可用，命令会继续执行，但输出为降级的只读结果，并带有明确诊断，例如“已配置，但在此命令路径中不可用”。
- 这种降级行为仅限于命令本地，不会削弱运行时启动、重载或发送/认证路径。

其他说明：

- 在后端秘密轮换后刷新快照，需要使用 `openclaw secrets reload`。
- 这些命令路径使用的 Gateway 网关 RPC 方法是：`secrets.resolve`。

## 审计与配置工作流

默认运维流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

发现项包括：

- 静态明文值（位于 `openclaw.json`、`auth-profiles.json`、`.env` 以及生成的 `agents/*/agent/models.json` 中）
- 生成的 `models.json` 条目中明文敏感提供商 header 残留
- 未解析的 refs
- 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` refs）
- 旧版残留（`auth.json`、OAuth 提醒）

Exec 说明：

- 默认情况下，审计会跳过 exec SecretRef 可解析性检查，以避免命令副作用。
- 使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 exec 提供商。

Header 残留说明：

- 敏感提供商 header 检测基于名称启发式规则（常见认证/凭证 header 名称及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

### `secrets configure`

交互式辅助工具，可执行以下操作：

- 先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/删除）
- 让你在一个智能体作用域中，选择 `openclaw.json` 和 `auth-profiles.json` 里受支持的含密字段
- 可直接在目标选择器中创建新的 `auth-profiles.json` 映射
- 捕获 SecretRef 详情（`source`、`provider`、`id`）
- 运行预检查解析
- 可立即应用

Exec 说明：

- 除非设置了 `--allow-exec`，否则预检查会跳过 exec SecretRef 检查。
- 如果你直接从 `configure --apply` 应用，并且计划中包含 exec refs/providers，则请在应用步骤中也保持设置 `--allow-exec`。

有用模式：

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` 的默认应用行为：

- 清除 `auth-profiles.json` 中目标提供商匹配的静态凭证
- 清除 `auth.json` 中旧版静态 `api_key` 条目
- 清除 `<config-dir>/.env` 中匹配的已知秘密行

### `secrets apply`

应用已保存的计划：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec 说明：

- dry run 会跳过 exec 检查，除非设置了 `--allow-exec`。
- 写入模式会拒绝包含 exec SecretRefs/providers 的计划，除非设置了 `--allow-exec`。

关于严格的目标/路径契约细节和精确的拒绝规则，请参见：

- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)

## 单向安全策略

OpenClaw 有意不会写入包含历史明文秘密值的回滚备份。

安全模型：

- 写入模式前必须通过预检查
- 提交前会验证运行时激活
- apply 会使用原子文件替换更新文件，并在失败时尽力恢复

## 旧版认证兼容性说明

对于静态凭证，运行时不再依赖明文旧版认证存储。

- 运行时凭证来源是解析后的内存快照。
- 发现旧版静态 `api_key` 条目时会进行清除。
- 与 OAuth 相关的兼容性行为仍然单独处理。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式下比在表单模式下更容易配置。

## 相关文档

- CLI 命令：[secrets](/zh-CN/cli/secrets)
- 计划契约细节：[Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)
- 凭证表面：[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)
- 认证设置：[Authentication](/zh-CN/gateway/authentication)
- 安全态势：[Security](/zh-CN/gateway/security)
- 环境变量优先级：[环境变量](/zh-CN/help/environment)
