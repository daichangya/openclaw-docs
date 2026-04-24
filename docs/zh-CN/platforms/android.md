---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关发现或认证
    - 验证各客户端之间的聊天记录一致性
summary: Android 应用（节点）：连接操作手册 + Connect/Chat/Voice/Canvas 命令入口面
title: Android 应用
x-i18n:
    generated_at: "2026-04-24T03:18:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **注意：** Android 应用尚未公开发布。源代码已在 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 目录中提供。你可以使用 Java 17 和 Android SDK 自行构建（`./gradlew :app:assemblePlayDebug`）。构建说明请参见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。

## 支持概览

- 角色：配套节点应用（Android 不承载 Gateway 网关）。
- 需要 Gateway 网关：是（在 macOS、Linux 或 Windows 的 WSL2 上运行）。
- 安装：[入门指南](/zh-CN/start/getting-started) + [配对](/zh-CN/channels/pairing)。
- Gateway 网关：[操作手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。参见 [Gateway 网关](/zh-CN/gateway)。

## 连接操作手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 需要安全端点：

- 首选：使用 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 同样支持：任何其他具有真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍然支持私有局域网地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前置条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备/模拟器可以访问 gateway WebSocket：
  - 通过同一局域网中的 mDNS/NSD，**或**
  - 通过同一 Tailscale tailnet 中的 Wide-Area Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动指定 gateway 主机/端口（回退方案）
- tailnet/公共网络移动端配对**不**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 gateway 机器上运行 CLI（`openclaw`）（或通过 SSH 运行）。

### 1）启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中出现类似内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 进行远程 Android 访问，优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供一个安全的 `wss://` / `https://` 端点。普通的 `gateway.bind: "tailnet"` 设置不足以支持首次远程 Android 配对，除非你另外终止 TLS。

### 2）验证发现（可选）

在 gateway 机器上运行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域发现域，请对照运行：

```bash
openclaw gateway discover --json
```

这会在一次执行中显示 `local.` 和已配置的广域域名，并使用解析后的
服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 进行 tailnet（维也纳 ⇄ 伦敦）发现

Android 的 NSD/mDNS 发现无法跨网络工作。如果你的 Android 节点和 gateway 位于不同网络，但通过 Tailscale 连接，请改用 Wide-Area Bonjour / 单播 DNS-SD。

仅靠发现不足以完成 tailnet/公共网络 Android 配对。发现出来的路由仍然需要一个安全端点（`wss://` 或 Tailscale Serve）：

1. 在 gateway 主机上设置一个 DNS-SD 区域（例如 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale split DNS，并指向该 DNS 服务器。

详细信息和 CoreDNS 配置示例请参见：[Bonjour](/zh-CN/gateway/bonjour)。

### 3）从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持与 gateway 的连接。
- 打开 **Connect** 选项卡。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果发现机制被阻止，请在 **Advanced controls** 中手动输入主机/端口。对于私有局域网主机，`ws://` 仍可使用。对于 Tailscale/公共主机，请打开 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次配对成功后，Android 会在启动时自动重连：

- 手动端点（如果已启用），否则
- 上一次发现到的 gateway（尽力而为）。

### 4）批准配对（CLI）

在 gateway 机器上运行：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/zh-CN/channels/pairing)。

### 5）验证节点已连接

- 通过节点状态：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway 网关：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6）聊天 + 历史记录

Android Chat 选项卡支持选择会话（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（显示层已规范化；内联指令标签会从可见文本中移除，纯文本工具调用 XML 载荷——包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块——和泄漏出来的 ASCII/全角模型控制 token 都会被移除，纯静默 token 的 assistant 行，例如精确的 `NO_REPLY` / `no_reply`，会被省略，超大行则可能被占位符替代）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7）Canvas + 相机

#### Gateway 网关 Canvas Host（推荐用于 Web 内容）

如果你希望节点显示智能体可以在磁盘上编辑的真实 HTML/CSS/JS，请让节点指向 Gateway 网关 canvas host。

注意：节点从 Gateway 网关 HTTP 服务器加载 canvas（与 `gateway.port` 使用同一端口，默认 `18789`）。

1. 在 gateway 主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将节点导航到该地址（局域网）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两个设备都在 Tailscale 上，可使用 MagicDNS 名称或 tailnet IP 代替 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

该服务器会向 HTML 注入 live-reload 客户端，并在文件变更时自动刷新。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 为旧别名）

相机命令（仅前台；受权限控制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 辅助命令请参见 [相机节点](/zh-CN/nodes/camera)。

### 8）Voice + 扩展的 Android 命令入口面

- Voice：Android 在 Voice 选项卡中使用单一的麦克风开/关流程，支持转录捕获和 `talk.speak` 播放。仅当 `talk.speak` 不可用时，才使用本地系统 TTS。应用离开前台时，Voice 会停止。
- Voice 唤醒/说话模式切换目前已从 Android UX/runtime 中移除。
- 其他 Android 命令家族（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（参见下方 [通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant 入口点

Android 支持从系统 Assistant 触发器启动 OpenClaw（Google
Assistant）。完成配置后，长按 Home 键或说“Hey Google, ask
OpenClaw...”会打开应用，并将提示词传入聊天输入框。

这使用在应用清单中声明的 Android **App Actions** 元数据。Gateway 网关侧不需要
额外配置——assistant intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否将 OpenClaw 设置为默认 assistant 应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 gateway。你可以使用多项控制来限定转发哪些通知以及何时转发。

| 键 | 类型 | 说明 |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 只转发来自这些包名的通知。如果设置了该项，所有其他包都会被忽略。 |
| `notifications.denyPackages`     | string[]       | 永不转发来自这些包名的通知。在 `allowPackages` 之后应用。 |
| `notifications.quietHours.start` | string (HH:mm) | 静默时段窗口开始时间（设备本地时间）。在该窗口期间会抑制通知。 |
| `notifications.quietHours.end`   | string (HH:mm) | 静默时段窗口结束时间。 |
| `notifications.rateLimit`        | number         | 每个包每分钟最多转发的通知数量。超出的通知会被丢弃。 |

通知选择器还对转发的通知事件采用了更安全的行为，以防止意外转发敏感系统通知。

配置示例：

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
通知转发需要 Android Notification Listener 权限。应用会在设置期间提示你授予该权限。
</Note>

## 相关内容

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Android 节点故障排除](/zh-CN/nodes/troubleshooting)
