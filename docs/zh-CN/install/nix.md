---
read_when:
    - 你希望安装过程可复现，并且能够回滚
    - 你已经在使用 Nix/NixOS/Home Manager
    - 你希望将所有内容固定版本并以声明式方式管理
summary: 使用 Nix 以声明式方式安装 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-04-25T06:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 以声明式方式安装 OpenClaw —— 这是一个开箱即用的 Home Manager 模块。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 仓库是 Nix 安装方式的权威来源。本页仅提供快速概览。
</Info>

## 你将获得

- Gateway 网关 + macOS 应用 + 工具（whisper、spotify、cameras）—— 全部固定版本
- 可在重启后继续运行的 Launchd 服务
- 具备声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

## 快速开始

<Steps>
  <Step title="安装 Determinate Nix">
    如果尚未安装 Nix，请按照 [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) 的说明操作。
  </Step>
  <Step title="创建本地 flake">
    使用来自 nix-openclaw 仓库的 agent-first 模板：
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="配置密钥">
    设置你的消息机器人令牌和模型提供商 API 密钥。将明文文件放在 `~/.secrets/` 中即可正常使用。
  </Step>
  <Step title="填写模板占位符并切换">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="验证">
    确认 launchd 服务正在运行，并且你的机器人能够响应消息。
  </Step>
</Steps>

有关完整的模块选项和示例，请参阅 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)。

## Nix 模式运行时行为

当设置 `OPENCLAW_NIX_MODE=1` 时（在 nix-openclaw 中会自动设置），OpenClaw 会进入确定性模式，并禁用自动安装流程。

你也可以手动设置：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。请改用 defaults 启用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式下的变化

- 自动安装和自修改流程将被禁用
- 缺失依赖项时，会显示 Nix 专用的修复提示信息
- UI 会显示只读的 Nix 模式横幅

### 配置和状态路径

OpenClaw 会从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。在 Nix 环境下运行时，请将这些路径显式设置为由 Nix 管理的位置，以便让运行时状态和配置保留在不可变 store 之外。

| Variable               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服务 PATH 发现

launchd/systemd 的 Gateway 网关服务会自动发现 Nix profile 中的二进制文件，因此需要通过 shell 调用 `nix` 安装的可执行文件的插件和工具，无需手动设置 PATH 即可工作：

- 当设置了 `NIX_PROFILES` 时，其中的每个条目都会按从右到左的优先级加入服务 PATH 中（与 Nix shell 的优先级一致 —— 最右侧优先）。
- 当未设置 `NIX_PROFILES` 时，会回退添加 `~/.nix-profile/bin`。

这同时适用于 macOS launchd 和 Linux systemd 的服务环境。

## 相关内容

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) —— 完整设置指南
- [Wizard](/zh-CN/start/wizard) —— 非 Nix 的 CLI 设置
- [Docker](/zh-CN/install/docker) —— 容器化设置
