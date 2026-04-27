---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关发现或认证
    - 验证各客户端之间的聊天历史一致性
summary: Android 应用（node）：连接操作手册 + Connect/Chat/Voice/Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-04-27T06:05:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ab1d9defd4606fe1408164f7f393367d01f3431a85e485dbe03b23e8ab69b14
    source_path: platforms/android.md
    workflow: 15
---

<Note>
Android 应用尚未公开发布。源代码可在 [OpenClaw repository](https://github.com/openclaw/openclaw) 的 `apps/android` 下获取。你可以使用 Java 17 和 Android SDK 自行构建（`./gradlew :app:assemblePlayDebug`）。构建说明请参见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支持概览

- 角色：配套应用节点（Android 不托管 Gateway 网关）。
- 需要 Gateway 网关：是（在 macOS、Linux 或通过 WSL2 的 Windows 上运行）。
- 安装：[入门指南](/zh-CN/start/getting-started) + [配对](/zh-CN/channels/pairing)。
- Gateway 网关：[操作手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。请参见 [Gateway 网关](/zh-CN/gateway)。

## 连接操作手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公网主机，Android 需要安全端点：

- 首选：带 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 也支持：任何其他具有真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有局域网地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前提条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备/模拟器可以访问 gateway WebSocket：
  - 位于同一局域网并使用 mDNS/NSD，**或**
  - 位于同一个 Tailscale tailnet 并使用 Wide-Area Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动指定 gateway 主机/端口（兜底方案）
- tailnet/公网移动端配对**不会**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 gateway 机器上运行 CLI（`openclaw`）（或通过 SSH）。

### 1) 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

在日志中确认你能看到类似如下内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 进行远程 Android 访问，优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供一个安全的 `wss://` / `https://` 端点。普通的 `gateway.bind: "tailnet"` 设置不足以完成首次远程 Android 配对，除非你还单独终止了 TLS。

### 2) 验证发现（可选）

在 gateway 机器上运行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明： [Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域发现域，请对比运行：

```bash
openclaw gateway discover --json
```

这会一次性显示 `local.` 和已配置的广域域名，并使用解析后的
服务端点，而不是仅依赖 TXT 提示。

#### 通过单播 DNS-SD 进行 tailnet（Vienna ⇄ London）发现

Android NSD/mDNS 发现无法跨网络工作。如果你的 Android 节点和 gateway 位于不同网络，但通过 Tailscale 相连，请改用 Wide-Area Bonjour / 单播 DNS-SD。

仅有发现并不足以完成 tailnet/公网 Android 配对。发现出的路由仍需要一个安全端点（`wss://` 或 Tailscale Serve）：

1. 在 gateway 主机上设置一个 DNS-SD 区域（例如 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为所选域配置 Tailscale split DNS，使其指向该 DNS 服务器。

详细信息和 CoreDNS 配置示例： [Bonjour](/zh-CN/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持其 gateway 连接存活。
- 打开 **Connect** 标签页。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果发现受阻，请在 **Advanced controls** 中使用手动主机/端口。对于私有局域网主机，`ws://` 仍然可用。对于 Tailscale/公网主机，请启用 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 会在启动时自动重连：

- 手动端点（如果已启用），否则
- 上次发现的 gateway（尽力而为）。

### 4) 批准配对（CLI）

在 gateway 机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情： [配对](/zh-CN/channels/pairing)。

可选：如果 Android 节点始终从严格受控的子网连接，
你可以选择通过显式 CIDR 或精确 IP 启用首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

此功能默认禁用。它仅适用于全新的 `role: node` 配对，且
没有请求作用域。操作员/浏览器配对以及任何角色、作用域、元数据或
公钥变更仍然需要手动批准。

### 5) 验证节点已连接

- 通过节点状态：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway 网关：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 历史记录

Android Chat 标签页支持选择会话（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（已按显示进行规范化；可见文本中的内联指令标签会被
  移除，纯文本工具调用 XML 负载（包括
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及
  被截断的工具调用块）和泄漏的 ASCII/全角模型控制 token
  会被移除，纯静默 token 助手行，例如完全等于 `NO_REPLY` /
  `no_reply` 的内容会被省略，过大的行可能会被占位符替换）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 相机

#### Gateway 网关 Canvas Host（推荐用于 Web 内容）

如果你希望节点显示智能体可以在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向 Gateway 网关 canvas host。

<Note>
节点从 Gateway 网关 HTTP 服务器加载 canvas（与 `gateway.port` 相同端口，默认 `18789`）。
</Note>

1. 在 gateway 主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 让节点导航到该地址（局域网）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（可选）：如果两台设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP 替代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

该服务器会将 live-reload 客户端注入到 HTML 中，并在文件更改时重新加载。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 旧版别名）

相机命令（仅前台；受权限控制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 辅助工具请参见[相机节点](/zh-CN/nodes/camera)。

### 8) Voice + 扩展的 Android 命令界面

- Voice 标签页：Android 有两种明确的捕获模式。**Mic** 是手动的 Voice 标签页会话，会将每次停顿作为一个聊天轮次发送，并在应用离开前台或用户离开 Voice 标签页时停止。**Talk** 是连续 Talk 模式，会持续监听，直到被关闭或节点断开连接。
- Talk 模式会在开始捕获前，将现有前台服务从 `dataSync` 提升为 `dataSync|microphone`，并在 Talk 模式停止时再降回。Android 14+ 要求声明 `FOREGROUND_SERVICE_MICROPHONE`、授予 `RECORD_AUDIO` 运行时权限，并在运行时设置麦克风服务类型。
- 语音回复通过已配置 gateway Talk 提供商的 `talk.speak` 播放。只有当 `talk.speak` 不可用时，才会使用本地系统 TTS。
- Android UX/运行时中仍禁用语音唤醒。
- 其他 Android 命令族（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（见下方[通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助手入口点

Android 支持通过系统助手触发器启动 OpenClaw（Google
Assistant）。配置完成后，长按主页键或说“Hey Google, ask
OpenClaw...”会打开应用，并将提示词传入聊天输入框。

这是通过应用清单中声明的 Android **App Actions** 元数据实现的。Gateway 网关侧无需额外配置——助手 intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，
以及用户是否将 OpenClaw 设置为默认助手应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 gateway。你可以通过多个控制项来限定转发哪些通知以及何时转发。

| 键                               | 类型           | 说明                                                                                   |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 仅转发来自这些包名的通知。设置后，其他所有包都会被忽略。                               |
| `notifications.denyPackages`     | string[]       | 永不转发来自这些包名的通知。在 `allowPackages` 之后应用。                              |
| `notifications.quietHours.start` | string (HH:mm) | 静默时段窗口的开始时间（设备本地时间）。在该窗口期间会抑制通知。                       |
| `notifications.quietHours.end`   | string (HH:mm) | 静默时段窗口的结束时间。                                                               |
| `notifications.rateLimit`        | number         | 每个包每分钟允许转发的最大通知数。超出的通知会被丢弃。                                 |

通知选择器对转发的通知事件也采用了更安全的行为，以防止意外转发敏感系统通知。

示例配置：

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
通知转发需要 Android Notification Listener 权限。应用会在设置期间提示你授予此权限。
</Note>

## 相关内容

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Android 节点故障排除](/zh-CN/nodes/troubleshooting)
