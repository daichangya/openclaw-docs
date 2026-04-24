---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 发送/接收
summary: 通过 `signal-cli` 提供 Signal 支持（JSON-RPC + SSE）、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-04-24T18:07:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc755f905af6c79903742e2ccdcc088666038dc78e36150f3f214e9c3245ad50
    source_path: channels/signal.md
    workflow: 15
---

状态：外部 CLI 集成。Gateway 网关通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

## 前提条件

- 你的服务器上已安装 OpenClaw（下方 Linux 流程已在 Ubuntu 24 上测试）。
- Gateway 网关运行所在主机上可用 `signal-cli`。
- 一个可以接收一次验证短信的手机号（用于短信注册路径）。
- 注册期间可通过浏览器访问 Signal 验证码页面（`signalcaptchas.org`）。

## 快速设置（新手）

1. 为机器人使用一个**单独的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（如果你使用 JVM 构建版本，则需要 Java）。
3. 选择一种设置路径：
   - **路径 A（QR 链接）：** `signal-cli link -n "OpenClaw"`，然后用 Signal 扫码。
   - **路径 B（短信注册）：** 使用验证码 + 短信验证注册一个专用号码。
4. 配置 OpenClaw 并重启 Gateway 网关。
5. 发送第一条私信并批准配对（`openclaw pairing approve signal <CODE>`）。

最小配置：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

字段说明：

| 字段 | 描述 |
| ----------- | ------------------------------------------------- |
| `account`   | 机器人电话号码，使用 E.164 格式（`+15551234567`） |
| `cliPath`   | `signal-cli` 的路径（如果在 `PATH` 中则为 `signal-cli`） |
| `dmPolicy`  | 私信访问策略（推荐使用 `pairing`） |
| `allowFrom` | 允许发送私信的电话号码或 `uuid:<id>` 值 |

## 它是什么

- 通过 `signal-cli` 提供的 Signal 渠道（不是嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- 私信共享智能体的主会话；群组彼此隔离（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

可通过以下方式禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 网关连接到一个 **Signal 设备**（即 `signal-cli` 账户）。
- 如果你在**自己的个人 Signal 账户**上运行机器人，它会忽略你自己发送的消息（循环保护）。
- 如果你想实现“我给机器人发消息，它会回复我”，请使用**单独的机器人号码**。

## 设置路径 A：链接现有 Signal 账户（QR）

1. 安装 `signal-cli`（JVM 或原生构建版本）。
2. 链接一个机器人账户：
   - 运行 `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描二维码。
3. 配置 Signal 并启动 Gateway 网关。

示例：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

多账户支持：使用 `channels.signal.accounts` 配合每个账户的配置和可选的 `name`。共享模式见 [`gateway/configuration`](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 设置路径 B：注册专用机器人号码（短信，Linux）

当你想使用专用机器人号码，而不是链接现有 Signal 应用账户时，请使用此方式。

1. 获取一个可以接收短信的号码（座机可使用语音验证）。
   - 使用专用机器人号码以避免账户/会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果你使用 JVM 构建版本（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE 25+。
请保持 `signal-cli` 为最新版本；上游说明，随着 Signal 服务器 API 变化，旧版本可能会失效。

3. 注册并验证该号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码后，从 “Open Signal” 中复制 `signalcaptcha://...` 链接目标。
3. 尽量从与浏览器会话相同的外部 IP 运行以下命令。
4. 立即再次运行注册（验证码令牌很快会过期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw、重启 Gateway 网关并验证渠道：

```bash
# 如果你将 Gateway 网关作为用户级 systemd 服务运行：
systemctl --user restart openclaw-gateway.service

# 然后验证：
openclaw doctor
openclaw channels status --probe
```

5. 配对你的私信发送者：
   - 向机器人号码发送任意消息。
   - 在服务器上批准代码：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 在你的手机上将机器人号码保存为联系人，以避免显示为 “未知联系人”。

重要：使用 `signal-cli` 注册一个电话号码账户，可能会使该号码对应的主 Signal 应用会话失去授权。建议优先使用专用机器人号码；如果你需要保留现有手机应用设置，请使用 QR 链接模式。

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果你希望自行管理 `signal-cli`（例如 JVM 冷启动慢、容器初始化或共享 CPU），可以单独运行守护进程，并让 OpenClaw 指向它：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

这会跳过 OpenClaw 内部的自动拉起和启动等待。对于自动拉起时启动较慢的情况，可设置 `channels.signal.startupTimeoutMs`。

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到一个配对代码；在批准前，其消息会被忽略（代码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认令牌交换方式。详情见：[Pairing](/zh-CN/channels/pairing)
- 仅 UUID 发送者（来自 `sourceUuid`）会以 `uuid:<id>` 形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制哪些人可以在群组中触发。
- `channels.signal.groups["<group-id>" | "*"]` 可通过 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账户设置中，使用 `channels.signal.accounts.<id>.groups` 进行按账户覆盖。
- 运行时说明：如果完全缺少 `channels.signal`，运行时在进行群组检查时会回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

## 工作原理（行为）

- `signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 入站消息会被标准化为共享的渠道信封格式。
- 回复始终路由回相同的号码或群组。

## 媒体 + 限制

- 出站文本会按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"`，以便在按长度分块前先按空行（段落边界）拆分。
- 支持附件（从 `signal-cli` 获取 base64）。
- 默认媒体大小上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 可跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），并回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。

## 正在输入 + 已读回执

- **输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入状态，并在回复运行期间持续刷新。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会为已允许的私信转发已读回执。
- Signal-cli 不提供群组的已读回执。

## 反应（message 工具）

- 使用 `message action=react` 并设置 `channel=signal`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可以）。
- `messageId` 是你要反应的那条消息的 Signal 时间戳。
- 群组反应需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用反应操作（默认 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 会禁用智能体反应（message 工具中的 `react` 将报错）。
  - `minimal`/`extensive` 会启用智能体反应，并设置指导级别。
- 按账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 投递目标（CLI/cron）

- 私信：`signal:+15551234567`（或纯 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

## 故障排除

先运行以下阶梯检查：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后根据需要确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可访问但没有回复：检查账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者仍在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了投递。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

排查流程见：[/channels/troubleshooting](/zh-CN/channels/troubleshooting)。

## 安全说明

- `signal-cli` 会在本地存储账户密钥（通常位于 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前，请备份 Signal 账户状态。
- 除非你明确希望开放更广泛的私信访问，否则请保持 `channels.signal.dmPolicy: "pairing"`。
- 短信验证只在注册或恢复流程中需要，但如果失去对该号码/账户的控制，重新注册会变得更复杂。

## 配置参考（Signal）

完整配置：[Configuration](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.account`：机器人账户的 E.164 号码。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.httpUrl`：完整的守护进程 URL（覆盖 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定地址（默认 `127.0.0.1:8080`）。
- `channels.signal.autoStart`：自动拉起守护进程（当未设置 `httpUrl` 时，默认值为 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时（毫秒，最大 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的动态消息。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信允许名单（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 不支持用户名；请使用电话号码/UUID 标识。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组发送者允许名单。
- `channels.signal.groups`：按群组覆盖，键为 Signal 群组 id（或 `"*"`）。支持的字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账户设置中 `channels.signal.groups` 的按账户版本。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（`0` 表示禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史上限。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符数）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline`，表示在按长度分块前先按空行（段落边界）拆分。
- `channels.signal.mediaMaxMb`：入站/出站媒体大小上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关内容

- [渠道概览](/zh-CN/channels) —— 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) —— 私信认证与配对流程
- [群组](/zh-CN/channels/groups) —— 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [安全](/zh-CN/gateway/security) —— 访问模型与加固措施
