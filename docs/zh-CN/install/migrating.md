---
read_when:
    - 你正在将 OpenClaw 迁移到新的笔记本电脑/服务器 ಮೇಲೆ
    - 你想保留会话、身份验证和渠道登录状态（WhatsApp 等）
summary: 将 OpenClaw 安装从一台机器迁移到另一台机器
title: 迁移指南
x-i18n:
    generated_at: "2026-04-23T20:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e959d559dafb92dd93f80b772591f2e7d5e5a961d85b9da5ed4eed36047592
    source_path: install/migrating.md
    workflow: 15
---

# 将 OpenClaw 迁移到新机器

本指南可将 OpenClaw gateway 迁移到新机器，而无需重新执行新手引导。

## 会迁移哪些内容

当你复制**状态目录**（默认是 `~/.openclaw/`）以及你的**工作区**时，以下内容会被保留：

- **配置** —— `openclaw.json` 以及所有 gateway 设置
- **身份验证** —— 每个智能体的 `auth-profiles.json`（API 密钥 + OAuth），以及 `credentials/` 下的所有渠道/提供商状态
- **会话** —— 对话历史和智能体状态
- **渠道状态** —— WhatsApp 登录、Telegram 会话等
- **工作区文件** —— `MEMORY.md`、`USER.md`、Skills 和提示词

<Tip>
在旧机器上运行 `openclaw status`，以确认你的状态目录路径。
自定义 profile 使用 `~/.openclaw-<profile>/`，或使用通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 gateway 并备份">
    在**旧**机器上，先停止 gateway，以避免文件在复制过程中发生变化，然后进行归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个 profile（例如 `~/.openclaw-work`），请分别归档每一个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/zh-CN/install) CLI（以及需要时安装 Node）。
    即使新手引导创建了一个新的 `~/.openclaw/` 也没关系 —— 你接下来会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部硬盘传输归档文件，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保已包含隐藏目录，并且文件所有权与将运行 gateway 的用户一致。

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
  <Accordion title="Profile 或状态目录不匹配">
    如果旧 gateway 使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新机器没有使用，
    那么渠道会看起来像是已注销，会话也会是空的。
    请使用你迁移过来的**相同** profile 或状态目录启动 gateway，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅配置文件本身并不够。模型身份验证配置文件位于
    `agents/<agentId>/agent/auth-profiles.json`，而渠道/提供商状态仍然
    位于 `credentials/` 下。请始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限与所有权">
    如果你以 root 身份复制，或切换了用户，gateway 可能无法读取凭证。
    请确保状态目录和工作区归运行 gateway 的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向的是**远程** gateway，那么会话和工作区归远程主机所有。
    你需要迁移 gateway 主机本身，而不是本地笔记本电脑。请参见 [FAQ](/zh-CN/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含身份验证配置文件、渠道凭证以及其他
    提供商状态。
    请对备份进行加密存储，避免使用不安全的传输通道，并在怀疑泄露时轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证清单

在新机器上，请确认：

- [ ] `openclaw status` 显示 gateway 正在运行
- [ ] 渠道仍然保持连接（无需重新配对）
- [ ] 控制面板可以打开，并显示现有会话
- [ ] 工作区文件（记忆、配置）存在
