---
read_when:
    - 你正在将 OpenClaw 迁移到新的笔记本电脑/服务器
    - 你想保留会话、认证和渠道登录状态（WhatsApp 等）
summary: 将 OpenClaw 安装从一台机器迁移到另一台机器
title: 迁移指南
x-i18n:
    generated_at: "2026-04-27T06:05:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a92c0af8d629ef58e3d60eadb0d7e9008195732513c343108b82272870222b6
    source_path: install/migrating.md
    workflow: 15
---

# 将 OpenClaw 迁移到新机器

将 OpenClaw Gateway 网关迁移到新机器，而无需重新进行新手引导。

## 会迁移哪些内容

当你复制**状态目录**（默认是 `~/.openclaw/`）和你的**工作区**时，你会保留：

- **配置** — `openclaw.json` 和所有 Gateway 网关设置。
- **认证** — 每个智能体的 `auth-profiles.json`（API key 和 OAuth），以及 `credentials/` 下的任何渠道或提供商状态。
- **会话** — 对话历史和智能体状态。
- **渠道状态** — WhatsApp 登录、Telegram 会话以及类似内容。
- **工作区文件** — `MEMORY.md`、`USER.md`、Skills 和提示词。

<Tip>
在旧机器上运行 `openclaw status` 以确认你的状态目录路径。
自定义配置文件使用 `~/.openclaw-<profile>/`，或通过 `OPENCLAW_STATE_DIR` 设置路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 gateway 并备份">
    在**旧**机器上，停止 gateway，避免复制过程中仍有文件发生变化，然后进行归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个配置文件（例如 `~/.openclaw-work`），请分别归档每一个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/zh-CN/install) CLI（以及在需要时安装 Node）。
    如果新手引导创建了一个新的 `~/.openclaw/`，也没有问题——你接下来会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部硬盘传输归档文件，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保已包含隐藏目录，并且文件所有权与将要运行 gateway 的用户一致。

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
  <Accordion title="配置文件或状态目录不匹配">
    如果旧 gateway 使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新 gateway 没有使用，
    渠道会看起来像已退出登录，会话也会是空的。
    请使用你迁移过来的**相同**配置文件或状态目录来启动 gateway，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅有配置文件是不够的。模型认证配置文件位于
    `agents/<agentId>/agent/auth-profiles.json` 下，而渠道/提供商状态仍然
    位于 `credentials/` 下。请始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 身份复制，或切换了用户，gateway 可能无法读取凭证。
    请确保状态目录和工作区归运行 gateway 的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向的是**远程** gateway，则会话和工作区由远程主机持有。
    你需要迁移的是 gateway 主机本身，而不是本地笔记本电脑。请参见 [常见问题](/zh-CN/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含认证配置文件、渠道凭证以及其他
    提供商状态。
    请以加密方式存储备份，避免使用不安全的传输渠道；如果怀疑已泄露，请轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证清单

在新机器上，确认：

- [ ] `openclaw status` 显示 gateway 正在运行
- [ ] 渠道仍已连接（无需重新配对）
- [ ] 仪表板可以打开并显示现有会话
- [ ] 工作区文件（memory、配置）已存在

## 相关内容

- [安装概览](/zh-CN/install)
- [Matrix 迁移](/zh-CN/install/migrating-matrix)
- [卸载](/zh-CN/install/uninstall)
