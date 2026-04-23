---
read_when:
    - 运行仓库中的脚本
    - 在 `./scripts` 下添加或修改脚本
summary: 仓库脚本：用途、范围和安全说明
title: 脚本
x-i18n:
    generated_at: "2026-04-23T20:51:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 839a6d9832988fcdb4b617935ebcfbc55c18b062b42a9480181963d07a952605
    source_path: help/scripts.md
    workflow: 15
---

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当某项任务显然与某个脚本绑定时，请使用这些脚本；否则优先使用 CLI。

## 约定

- 除非文档或发布检查清单中有引用，否则脚本都是**可选的**。
- 当已有 CLI 界面时，优先使用 CLI（例如：认证监控应使用 `openclaw models status --check`）。
- 假定脚本具有主机特定性；在新机器上运行前请先阅读它们。

## 认证监控脚本

认证监控已在[身份验证](/zh-CN/gateway/authentication)中说明。`scripts/` 下的这些脚本是 systemd / Termux 手机工作流的可选补充。

## GitHub 只读辅助脚本

当你希望 `gh` 在仓库范围内的只读调用中使用 GitHub App 安装令牌，同时又让普通 `gh` 在写操作中继续使用你的个人登录时，请使用 `scripts/gh-read`。

必需环境变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选环境变量：

- `OPENCLAW_GH_READ_INSTALLATION_ID`，当你想跳过基于仓库的安装查找时使用
- `OPENCLAW_GH_READ_PERMISSIONS`，用于以逗号分隔方式覆盖要请求的只读权限子集

仓库解析顺序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

示例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 添加脚本时

- 让脚本保持聚焦并有文档说明。
- 在相关文档中添加简短条目（如果缺失则创建）。
