---
read_when:
    - 更新 macOS Skills 设置 UI
    - 更改 Skills 门控或安装行为
summary: macOS Skills 设置 UI 与 Gateway 网关支持的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-04-23T20:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e396353a5bfde0a0863cb42d7da9c6b56bff72c89f1457ec4abdade999cc2467
    source_path: platforms/mac/skills.md
    workflow: 15
---

macOS 应用通过 Gateway 网关展示 OpenClaw Skills；它不会在本地解析 Skills。

## 数据来源

- `skills.status`（Gateway 网关）会返回所有 Skills，以及可用性和缺失要求
  （包括对内置 Skills 的允许列表拦截）。
- 要求来自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在 Gateway 网关主机上运行安装器。
- 内置 dangerous-code 的 `critical` 发现默认会阻止 `skills.install`；可疑发现仍然只发出警告。危险覆盖项存在于 Gateway 网关请求中，但默认应用流程保持 fail-closed。
- 如果所有安装选项都是 `download`，Gateway 网关会展示所有下载
  选项。
- 否则，Gateway 网关会根据当前
  安装偏好和主机二进制文件选择一个首选安装器：当启用了
  `skills.install.preferBrew` 且存在 `brew` 时优先 Homebrew，然后是 `uv`，然后是
  `skills.install.nodeManager` 中配置的 node 管理器，再之后
  才是 `go` 或 `download` 等回退选项。
- Node 安装标签会反映所配置的 node 管理器，包括 `yarn`。

## Env/API 密钥

- 应用会将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装 + 配置更新发生在 Gateway 网关主机上（而不是本地 Mac）。
