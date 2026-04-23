---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关发现或认证
    - 验证各客户端之间的聊天记录一致性
summary: Android 应用（节点）：连接操作手册 + Connect / Chat / Voice / Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-04-23T22:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 386aafd0d23a5c1c1a9e67236b222527e7860cd855474d187354567c6c80f50e
    source_path: platforms/android.md
    workflow: 15
---

> **说明：** Android 应用尚未公开发布。源代码可在 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 目录中获取。你可以使用 Java 17 和 Android SDK 自行构建（`./gradlew :app:assemblePlayDebug`）。构建说明请参见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。

## 支持概览

- 角色：配套节点应用（Android 不托管 Gateway 网关）。
- 是否需要 Gateway 网关：需要（在 macOS、Linux 或通过 WSL2 的 Windows 上运行）。
- 安装： [入门指南](/zh-CN/start/getting-started) + [配对](/zh-CN/channels/pairing)。
- Gateway 网关： [操作手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议： [Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。请参见 [Gateway 网关](/zh-CN/gateway)。

## 连接操作手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 需要安全端点：

- 首选：使用 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 同样支持：任何其他具有真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有 LAN 地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前置条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备 / 模拟器可以访问 Gateway 网关 WebSocket：
  - 位于同一 LAN，并支持 mDNS/NSD，**或**
  - 位于同一 Tailscale tailnet，并使用 Wide-Area Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动指定 Gateway 网关主机 / 端口（回退方式）
- tailnet / 公网移动设备配对 **不会** 使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 Gateway 网关机器上运行 CLI（`openclaw`）（或通过 SSH 运行）。

### 1) 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中出现如下内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 远程访问 Android，优先使用 Serve / Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。单纯的 `gateway.bind: "tailnet"` 设置不足以支持首次远程 Android 配对，除非你另外终止 TLS。

### 2) 验证设备发现（可选）

在 Gateway 网关机器上执行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明： [Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域发现域，请对比执行：

```bash
openclaw gateway discover --json
```

这会在一次执行中显示 `local.` 和已配置的广域域，并使用解析出的
服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 在 tailnet 中发现（维也纳 ⇄ 伦敦）

Android 的 NSD/mDNS 发现不会跨网络工作。如果你的 Android 节点和 Gateway 网关位于不同网络，但都连接到了 Tailscale，请改用 Wide-Area Bonjour / 单播 DNS-SD。

仅有设备发现并不足以支持 tailnet / 公网 Android 配对。发现得到的路由仍然需要一个安全端点（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 网关主机上设置一个 DNS-SD 区域（例如 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale split DNS，并指向该 DNS 服务器。

详细信息和 CoreDNS 配置示例： [Bonjour](/zh-CN/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持其 Gateway 网关连接存活。
- 打开 **Connect** 选项卡。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果设备发现被阻止，请在 **Advanced controls** 中手动输入主机 / 端口。对于私有 LAN 主机，`ws://` 仍然可用。对于 Tailscale / 公网主机，请启用 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次配对成功后，Android 会在启动时自动重新连接：

- 如果已启用，则使用手动端点，否则
- 使用上次发现的 Gateway 网关（尽力而为）。

### 4) 批准配对（CLI）

在 Gateway 网关机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情： [配对](/zh-CN/channels/pairing)。

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

Android Chat 选项卡支持选择会话（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（已做显示规范化；可见文本中的内联指令标签会被移除，纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄露的 ASCII / 全角模型控制 token 会被移除，纯静默 token 的助手记录（例如精确的 `NO_REPLY` / `no_reply`）会被省略，超大记录可被占位符替换）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 相机

#### Gateway 网关 Canvas Host（推荐用于 Web 内容）

如果你希望节点显示智能体可以在磁盘上编辑的真实 HTML / CSS / JS，请将节点指向 Gateway 网关 canvas host。

说明：节点从 Gateway 网关 HTTP 服务器加载 canvas（与 `gateway.port` 使用相同端口，默认 `18789`）。

1. 在 Gateway 网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将节点导航到该页面（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（可选）：如果两个设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP，而不是 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

该服务器会向 HTML 注入实时重载客户端，并在文件变更时重新加载。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 为旧版别名）

相机命令（仅前台；受权限控制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 帮助请参见 [相机节点](/zh-CN/nodes/camera)。

### 8) 语音 + 扩展 Android 命令界面

- 语音：Android 在 Voice 选项卡中使用单一的麦克风开 / 关流程，支持转录捕获和 `talk.speak` 播放。仅当 `talk.speak` 不可用时才使用本地系统 TTS。应用离开前台时，语音会停止。
- 语音唤醒 / 对讲模式开关目前已从 Android UX / 运行时中移除。
- 其他 Android 命令族（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（请参见下方 [通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助手入口点

Android 支持通过系统助手触发器启动 OpenClaw（Google
Assistant）。配置完成后，长按 Home 键或说出 “Hey Google, ask
OpenClaw...” 会打开应用，并将提示词传递到聊天输入框中。

这使用的是在应用清单中声明的 Android **App Actions** 元数据。Gateway 网关侧无需额外配置——助手 intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否将 OpenClaw 设为默认助手应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 Gateway 网关。你可以通过多个控制项限定转发哪些通知以及何时转发。

| 键                               | 类型           | 描述                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | 仅转发来自这些包名的通知。如果设置了该项，其他所有包都会被忽略。                           |
| `notifications.denyPackages`     | string[]       | 绝不转发来自这些包名的通知。在 `allowPackages` 之后应用。                                  |
| `notifications.quietHours.start` | string (HH:mm) | 静默时段窗口开始时间（设备本地时间）。在此时间窗口内会抑制通知转发。                       |
| `notifications.quietHours.end`   | string (HH:mm) | 静默时段结束时间。                                                                         |
| `notifications.rateLimit`        | number         | 每个包每分钟允许转发的通知上限。超出的通知会被丢弃。                                       |

通知选择器还会对转发的通知事件采用更安全的行为，以防止敏感系统通知被意外转发。

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
通知转发需要 Android Notification Listener 权限。应用会在设置过程中提示你授予此权限。
</Note>
