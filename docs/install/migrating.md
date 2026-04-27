---
read_when:
    - 你正在将 OpenClaw 迁移到新的笔记本/服务器上
    - 你希望保留会话、认证和渠道登录状态（WhatsApp 等）
summary: 将 OpenClaw 安装从一台机器迁移到另一台机器
title: 迁移指南
x-i18n:
    generated_at: "2026-04-24T03:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# 将 OpenClaw 迁移到新机器

本指南可将 OpenClaw Gateway 网关迁移到一台新机器，而无需重新进行新手引导。

## 会迁移哪些内容

当你复制**状态目录**（默认为 `~/.openclaw/`）以及你的**工作区**时，你会保留下列内容：

- **配置** -- `openclaw.json` 和所有 Gateway 网关设置
- **认证** -- 每个智能体的 `auth-profiles.json`（API key + OAuth），以及 `credentials/` 下的任何渠道/提供商状态
- **会话** -- 对话历史和智能体状态
- **渠道状态** -- WhatsApp 登录、Telegram 会话等
- **工作区文件** -- `MEMORY.md`、`USER.md`、Skills 和 prompts

<Tip>
在旧机器上运行 `openclaw status` 以确认你的状态目录路径。
自定义 profile 会使用 `~/.openclaw-<profile>/` 或通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 Gateway 网关并备份">
    在**旧**机器上，先停止 Gateway 网关，以免复制时文件仍在变化，然后进行归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个 profile（例如 `~/.openclaw-work`），请分别归档每一个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/zh-CN/install) CLI（以及 Node，如有需要）。
    即使新手引导创建了一个新的 `~/.openclaw/` 也没关系——接下来你会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部硬盘传输归档文件，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保已包含隐藏目录，并且文件所有权与将运行 Gateway 网关的用户一致。

  </Step>

  <Step title="运行 Doctor 并验证">
    在新机器上，运行 [Doctor](/zh-CN/gateway/doctor) 以应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## 常见陷阱

<AccordionGroup>
  <Accordion title="profile 或状态目录不匹配">
    如果旧 Gateway 网关使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新的没有使用，
    渠道会显示为已登出，会话也会为空。
    请使用**相同**的 profile 或你迁移过来的状态目录来启动 Gateway 网关，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅配置文件本身是不够的。模型认证配置文件位于
    `agents/<agentId>/agent/auth-profiles.json`，而渠道/提供商状态仍然
    位于 `credentials/` 下。请务必迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 身份复制，或者切换了用户，Gateway 网关可能无法读取凭证。
    请确保状态目录和工作区归运行 Gateway 网关的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向的是一个**远程** Gateway 网关，则远程主机拥有会话和工作区。
    你应迁移 Gateway 网关主机本身，而不是你的本地笔记本。参见 [FAQ](/zh-CN/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的 secret">
    状态目录包含认证配置文件、渠道凭证以及其他
    提供商状态。
    请对备份进行加密存储，避免使用不安全的传输渠道，并在怀疑泄露时轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证清单

在新机器上，确认：

- [ ] `openclaw status` 显示 Gateway 网关正在运行
- [ ] 渠道仍保持连接（无需重新配对）
- [ ] 仪表板可以打开，并显示现有会话
- [ ] 工作区文件（memory、配置）都存在

## 相关内容

- [安装概览](/zh-CN/install)
- [Matrix 迁移](/zh-CN/install/migrating-matrix)
- [卸载](/zh-CN/install/uninstall)
