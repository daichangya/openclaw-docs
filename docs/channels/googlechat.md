---
read_when:
    - 正在开发 Google Chat 渠道功能
summary: Google Chat 应用支持状态、功能和配置
title: Google Chat
x-i18n:
    generated_at: "2026-04-23T20:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

状态：已可用于通过 Google Chat API webhook 支持私信和 spaces（仅限 HTTP）。

## 快速设置（新手）

1. 创建一个 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果 API 尚未启用，请先启用它。
2. 创建一个 **Service Account**：
   - 点击 **Create Credentials** > **Service Account**。
   - 随意命名（例如 `openclaw-chat`）。
   - 权限留空（点击 **Continue**）。
   - 访问主体留空（点击 **Done**）。
3. 创建并下载 **JSON Key**：
   - 在服务账号列表中，点击你刚创建的那个账号。
   - 前往 **Keys** 标签页。
   - 点击 **Add Key** > **Create new key**。
   - 选择 **JSON**，然后点击 **Create**。
4. 将下载的 JSON 文件存储到你的 gateway 主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建一个 Google Chat 应用：
   - 填写 **Application info**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers**，并将其设置为你的 Gateway 网关公共 URL 后接 `/googlechat`。
     - _提示：运行 `openclaw status` 以找到你的 Gateway 网关公共 URL。_
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in `<Your Domain>`**。
   - 在文本框中输入你的电子邮件地址（例如 `user@example.com`）。
   - 点击底部的 **Save**。
6. **启用应用状态**：
   - 保存后，**刷新页面**。
   - 找到 **App status** 部分（通常在保存后出现在顶部或底部附近）。
   - 将状态更改为 **Live - available to users**。
   - 再次点击 **Save**。
7. 使用服务账号路径 + webhook audience 配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 设置 webhook audience 类型和值（需与你的 Chat 应用配置一致）。
9. 启动 Gateway 网关。Google Chat 将向你的 webhook 路径发送 POST 请求。

## 添加到 Google Chat

一旦 Gateway 网关运行起来，并且你的电子邮件已被加入可见性列表：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3. 在搜索栏中（通常用于添加联系人），输入你在 Google Cloud Console 中配置的 **App name**。
   - **注意**：由于这是一个私有应用，该机器人**不会**出现在 “Marketplace” 浏览列表中。你必须通过名称搜索它。
4. 从结果中选择你的机器人。
5. 点击 **Add** 或 **Chat**，开始一对一会话。
6. 发送 “Hello” 来触发助手！

## 公共 URL（仅限 Webhook）

Google Chat webhook 需要一个公共 HTTPS 端点。出于安全考虑，**只将 `/googlechat` 路径暴露到互联网**。请将 OpenClaw 仪表板和其他敏感端点保留在你的私有网络中。

### 选项 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 提供私有仪表板，并使用 Funnel 提供公共 webhook 路径。这样可以保持 `/` 为私有，同时仅暴露 `/googlechat`。

1. **检查你的 Gateway 网关绑定到了哪个地址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   记下 IP 地址（例如 `127.0.0.1`、`0.0.0.0`，或你的 Tailscale IP，如 `100.x.x.x`）。

2. **仅向 tailnet 暴露仪表板（端口 8443）：**

   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **仅公开 webhook 路径：**

   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **为节点授权 Funnel 访问：**
   如果出现提示，请访问输出中显示的授权 URL，以在你的 tailnet 策略中为该节点启用 Funnel。

5. **验证配置：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公共 webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私有仪表板将保持仅 tailnet 可访问：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用该公共 URL（不带 `:8443`）。

> 注意：此配置在重启后仍会保留。若以后要移除，请运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 选项 B：反向代理（Caddy）

如果你使用 Caddy 之类的反向代理，请只代理特定路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此配置时，发往 `your-domain.com/` 的任何请求都会被忽略或返回 404，而 `your-domain.com/googlechat` 会被安全地路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel

将你的 tunnel ingress 规则配置为仅路由 webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（未找到）

## 工作原理

1. Google Chat 向 Gateway 网关发送 webhook POST 请求。每个请求都包含 `Authorization: Bearer <token>` 头。
   - 当该请求头存在时，OpenClaw 会在读取/解析完整 webhook 请求体之前先验证 bearer 身份验证。
   - 对于在请求体中携带 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 请求，则通过更严格的预身份验证请求体预算进行支持。
2. OpenClaw 会根据配置的 `audienceType` + `audience` 验证该令牌：
   - `audienceType: "app-url"` → audience 是你的 HTTPS webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 项目编号。
3. 消息按 space 路由：
   - 私信使用会话键 `agent:<agentId>:googlechat:direct:<spaceId>`。
   - spaces 使用会话键 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私信访问默认采用配对方式。未知发送者会收到一个配对码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组 spaces 默认要求 @ 提及。若提及检测需要应用的用户名，请使用 `botUser`。

## 目标标识

请使用以下标识符进行投递和 allowlist 配置：

- 私信：`users/<userId>`（推荐）。
- 原始电子邮件 `name@example.com` 是可变的，并且只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 时，才会用于私信 allowlist 精确匹配。
- 已弃用：`users/<email>` 会被视为用户 ID，而不是电子邮件 allowlist。
- spaces：`spaces/<spaceId>`。

## 配置亮点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // 或 serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 可选；有助于提及检测
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "仅简短回答。",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

说明：

- 服务账号凭证也可以通过 `serviceAccount` 内联传入（JSON 字符串）。
- 也支持 `serviceAccountRef`（env/file SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的按账户配置引用。
- 如果未设置 `webhookPath`，默认 webhook 路径为 `/googlechat`。
- `dangerouslyAllowNameMatching` 会重新启用基于可变电子邮件主体的 allowlist 匹配（用于紧急兼容模式）。
- 当启用 `actions.reactions` 时，可通过 `reactions` 工具和 `channels action` 使用表情反应。
- 消息操作公开 `send` 用于文本发送，`upload-file` 用于显式发送附件。`upload-file` 接受 `media` / `filePath` / `path`，并支持可选的 `message`、`filename` 和线程目标。
- `typingIndicator` 支持 `none`、`message`（默认）和 `reaction`（reaction 需要用户 OAuth）。
- 附件通过 Chat API 下载，并存储在媒体流水线中（大小上限由 `mediaMaxMb` 限制）。

Secrets 引用详情：[Secrets Management](/zh-CN/gateway/secrets)。

## 故障排除

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示如下错误：

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这意味着 webhook 处理程序尚未注册。常见原因包括：

1. **渠道未配置**：你的配置中缺少 `channels.googlechat` 部分。可通过以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回 “Config path not found”，请添加配置（参见[配置亮点](#配置亮点)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示 “disabled”，请在配置中添加 `plugins.entries.googlechat.enabled: true`。

3. **Gateway 网关未重启**：添加配置后，请重启 Gateway 网关：

   ```bash
   openclaw gateway restart
   ```

验证该渠道是否正在运行：

```bash
openclaw channels status
# 应显示：Google Chat default: enabled, configured, ...
```

### 其他问题

- 检查 `openclaw channels status --probe`，查看是否存在身份验证错误或缺少 audience 配置。
- 如果没有消息到达，请确认 Chat 应用的 webhook URL 和事件订阅。
- 如果提及门控阻止了回复，请将 `botUser` 设置为应用的用户资源名称，并验证 `requireMention`。
- 发送测试消息时使用 `openclaw logs --follow`，查看请求是否到达 Gateway 网关。

相关文档：

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [安全](/zh-CN/gateway/security)
- [表情反应](/zh-CN/tools/reactions)

## 相关

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固措施
