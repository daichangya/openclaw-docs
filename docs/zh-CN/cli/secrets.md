---
read_when:
    - 在运行时重新解析 secret refs
    - 审计明文残留和未解析的 refs
    - 配置 SecretRef 并应用单向清理更改
summary: '`openclaw secrets` 的 CLI 参考（重新加载、审计、配置、应用）'
title: Secrets
x-i18n:
    generated_at: "2026-04-23T20:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70f5041af67e8a5efe8f45bcc94fb617fba9a79395c5fc600896c4f7e050013b
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

使用 `openclaw secrets` 来管理 SecretRef，并保持当前活动运行时快照处于健康状态。

命令角色：

- `reload`：Gateway 网关 RPC（`secrets.reload`），重新解析 refs，并且仅在完全成功时才切换运行时快照（不写入配置）。
- `audit`：对配置/认证/生成的模型存储以及旧版残留进行只读扫描，检查明文、未解析 refs 和优先级漂移（除非设置了 `--allow-exec`，否则会跳过 exec refs）。
- `configure`：用于 provider 设置、目标映射和预检的交互式规划器（需要 TTY）。
- `apply`：执行已保存的计划（`--dry-run` 仅用于验证；dry-run 默认跳过 exec 检查，而写入模式会拒绝包含 exec 的计划，除非设置了 `--allow-exec`），然后清理目标明文残留。

推荐的运维流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果你的计划包含 `exec` SecretRef/provider，请在 dry-run 和实际写入的 apply 命令中都传入 `--allow-exec`。

CI/门禁的退出码说明：

- `audit --check` 在发现问题时返回 `1`。
- 未解析 refs 返回 `2`。

相关内容：

- Secrets 指南：[Secrets 管理](/zh-CN/gateway/secrets)
- 凭证表面：[SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)
- 安全指南：[安全](/zh-CN/gateway/security)

## 重新加载运行时快照

重新解析 secret refs，并以原子方式切换运行时快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

说明：

- 使用 Gateway 网关 RPC 方法 `secrets.reload`。
- 如果解析失败，gateway 会保留最后一个已知良好的快照并返回错误（不会进行部分激活）。
- JSON 响应包含 `warningCount`。

选项：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 审计

扫描 OpenClaw 状态以检查：

- 明文 secret 存储
- 未解析 refs
- 优先级漂移（`auth-profiles.json` 中的凭证遮蔽了 `openclaw.json` 中的 refs）
- 生成的 `agents/*/agent/models.json` 残留（provider `apiKey` 值及敏感 provider headers）
- 旧版残留（旧版认证存储条目、OAuth 提醒）

Header 残留说明：

- 敏感 provider header 检测基于名称启发式规则（常见认证/凭证 header 名称及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

退出行为：

- `--check` 在发现问题时以非零状态退出。
- 未解析 refs 会以更高优先级的非零退出码退出。

报告结构要点：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 问题代码：
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 配置（交互式辅助工具）

以交互方式构建 provider 和 SecretRef 变更，执行预检，并可选择应用：

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

流程：

- 首先进行 provider 设置（对 `secrets.providers` 别名执行 `add/edit/remove`）。
- 其次进行凭证映射（选择字段并分配 `{source, provider, id}` refs）。
- 最后执行预检并可选择应用。

标志：

- `--providers-only`：仅配置 `secrets.providers`，跳过凭证映射。
- `--skip-provider-setup`：跳过 provider 设置，并将凭证映射到现有 providers。
- `--agent <id>`：将 `auth-profiles.json` 的目标发现和写入限定到单个智能体存储。
- `--allow-exec`：在预检/应用期间允许 exec SecretRef 检查（可能会执行 provider 命令）。

说明：

- 需要交互式 TTY。
- 不能同时使用 `--providers-only` 和 `--skip-provider-setup`。
- `configure` 目标包括 `openclaw.json` 中携带 secret 的字段，以及所选智能体作用域下的 `auth-profiles.json`。
- `configure` 支持直接在选择器流程中创建新的 `auth-profiles.json` 映射。
- 规范支持的表面参见：[SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)。
- 它会在应用前执行预检解析。
- 如果预检/应用包含 exec refs，请在两个步骤中都保留 `--allow-exec`。
- 生成的计划默认启用清理选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 全部启用）。
- 对于已清理的明文值，apply 路径是单向的。
- 不带 `--apply` 时，CLI 在预检后仍会提示 `Apply this plan now?`。
- 使用 `--apply`（且未加 `--yes`）时，CLI 会额外提示一次不可逆确认。
- `--json` 会打印计划 + 预检报告，但命令仍然需要交互式 TTY。

Exec provider 安全说明：

- Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。
- 仅在你确实需要受信任包管理器路径时，才设置 `allowSymlinkCommand: true`，并搭配 `trustedDirs` 使用（例如 `["/opt/homebrew"]`）。
- 在 Windows 上，如果某个 provider 路径无法进行 ACL 验证，OpenClaw 会以失败关闭方式处理。仅对受信任路径，可在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用已保存的计划

应用或预检先前生成的计划：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec 行为：

- `--dry-run` 仅验证预检，不写入文件。
- dry-run 默认跳过 exec SecretRef 检查。
- 写入模式会拒绝包含 exec SecretRef/provider 的计划，除非设置了 `--allow-exec`。
- 使用 `--allow-exec` 可在任一模式下选择启用 exec provider 检查/执行。

计划契约详情（允许的目标路径、验证规则和失败语义）：

- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)

`apply` 可能更新的内容：

- `openclaw.json`（SecretRef 目标 + provider upsert/delete）
- `auth-profiles.json`（provider 目标清理）
- 旧版 `auth.json` 残留
- `~/.openclaw/.env` 中已迁移值的已知 secret 键

## 为什么没有回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。

安全性来自严格的预检 + 接近原子的 apply，并在失败时尽最大努力执行内存内恢复。

## 示例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍然报告明文问题，请更新剩余报告中的目标路径，然后重新运行审计。
