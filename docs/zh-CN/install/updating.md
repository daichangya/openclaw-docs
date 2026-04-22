---
read_when:
    - 更新 OpenClaw
    - 更新后出现问题
summary: 安全更新 OpenClaw（全局安装或源码安装），以及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-04-22T04:04:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# 更新

让 OpenClaw 保持最新。

## 推荐：`openclaw update`

这是最快的更新方式。它会检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 Gateway 网关。

```bash
openclaw update
```

如需切换渠道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 仅预览，不实际应用
```

`--channel beta` 会优先选择 beta，但当 beta 标签不存在或版本落后于最新稳定版时，运行时会回退到 stable/latest。如果你想在一次性包更新中使用原始 npm beta dist-tag，请使用 `--tag beta`。

有关渠道语义，请参见[开发渠道](/zh-CN/install/development-channels)。

## 备选方案：重新运行安装脚本

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。对于源码安装，请传入 `--install-method git --no-onboard`。

## 备选方案：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 由 root 拥有的全局 npm 安装

某些 Linux 的 npm 配置会将全局包安装到由 root 拥有的目录中，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持这种布局：安装后的包在运行时会被视为只读，内置插件的运行时依赖会被暂存到一个可写的运行时目录中，而不是直接修改包目录树。

对于强化过的 systemd 单元，请设置一个可写的暂存目录，并将其包含在 `ReadWritePaths` 中：

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

如果未设置 `OPENCLAW_PLUGIN_STAGE_DIR`，OpenClaw 会在 systemd 提供时使用 `$STATE_DIRECTORY`，否则回退到 `~/.openclaw/plugin-runtime-deps`。

## 自动更新器

自动更新器默认关闭。在 `~/.openclaw/openclaw.json` 中启用它：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | 行为 |
| -------- | ---- |
| `stable` | 等待 `stableDelayHours` 后应用，并在 `stableJitterHours` 范围内使用确定性抖动分散发布。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 检查一次（默认：每小时），并立即应用。 |
| `dev`    | 不会自动应用。请手动使用 `openclaw update`。 |

Gateway 网关还会在启动时记录更新提示（可通过 `update.checkOnStart: false` 禁用）。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略，并检查 Gateway 网关健康状态。详情： [Doctor](/zh-CN/gateway/doctor)

### 重启 Gateway 网关

```bash
openclaw gateway restart
```

### 验证

```bash
openclaw health
```

</Steps>

## 回滚

### 固定到某个版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

提示：`npm view openclaw version` 会显示当前已发布的版本。

### 固定到某个提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

要恢复到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor`，并仔细阅读输出内容。
- 对于源码检出中的 `openclaw update --channel dev`，更新器会在需要时自动引导安装 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排除](/zh-CN/gateway/troubleshooting)
- 在 Discord 提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [安装概览](/zh-CN/install) —— 所有安装方式
- [Doctor](/zh-CN/gateway/doctor) —— 更新后的健康检查
- [迁移](/zh-CN/install/migrating) —— 主要版本迁移指南
