---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、canvas 和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-04-23T22:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

可用性：内部预览。iOS 应用尚未公开分发。

## 它的作用

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、屏幕快照、相机捕获、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- 另一台设备上正在运行的 Gateway 网关（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 在同一 LAN 内，**或**
  - 通过单播 DNS-SD 在 tailnet 上（示例域名：`openclaw.internal.`），**或**
  - 手动填写 host/port（回退方式）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开“设置”并选择一个已发现的 Gateway 网关（或启用“手动主机”并输入 host/port）。

3. 在 Gateway 网关主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用在身份验证详情（角色/作用域/公钥）发生变化后重试配对，之前待处理的请求会被替换，并创建新的 `requestId`。
请在批准前再次运行 `openclaw devices list`。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的 relay 支持 push

官方分发的 iOS 构建使用外部 push relay，而不是将原始 APNs
token 直接发布给 Gateway 网关。

Gateway 网关端要求：

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

流程工作方式：

- iOS 应用使用 App Attest 和应用回执向 relay 注册。
- relay 返回一个不透明的 relay handle，以及一个按注册作用域划分的发送授权。
- iOS 应用会获取已配对 Gateway 网关的身份，并将其包含在 relay 注册中，因此该 relay 支持的注册会被委托给该特定 Gateway 网关。
- 应用通过 `push.apns.register` 将该 relay 支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关会将该已存储的 relay handle 用于 `push.test`、后台唤醒和唤醒提示。
- Gateway 网关的 relay base URL 必须与官方/TestFlight iOS 构建中内置的 relay URL 一致。
- 如果应用之后连接到另一个 Gateway 网关，或连接到一个使用不同 relay base URL 的构建，它会刷新 relay 注册，而不是重用旧绑定。

对于这一路径，Gateway 网关**不**需要的内容：

- 不需要部署级 relay token。
- 对于官方/TestFlight relay 支持的发送，不需要直接 APNs key。

预期的操作员流程：

1. 安装官方/TestFlight iOS 构建。
2. 在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并等待其完成连接。
4. 在应用拿到 APNs token、操作员会话已连接且 relay 注册成功后，应用会自动发布 `push.apns.register`。
5. 此后，`push.test`、重新连接唤醒和唤醒提示就可以使用已存储的 relay 支持注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖项。

## 身份验证与信任流程

relay 的存在，是为了强制执行两个约束，而这两个约束是官方 iOS 构建直接在 Gateway 网关上使用 APNs 无法提供的：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建才能使用托管 relay。
- Gateway 网关只能为已与该特定 Gateway 网关配对的 iOS 设备发送 relay 支持的 push。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过正常的 Gateway 网关身份验证流程与 Gateway 网关配对。
   - 这样应用会获得一个已认证的节点会话以及一个已认证的操作员会话。
   - 操作员会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用 relay 注册端点。
   - 注册包含 App Attest 证明以及应用回执。
   - relay 会验证 bundle ID、App Attest 证明和 Apple 回执，并要求使用官方/生产分发路径。
   - 这就是为什么本地 Xcode/dev 构建无法使用托管 relay。虽然本地构建也可能已签名，但它不满足 relay 所要求的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在 relay 注册之前，应用会通过 `gateway.identity.get` 获取已配对 Gateway 网关的身份。
   - 应用会将该 Gateway 网关身份包含在 relay 注册负载中。
   - relay 返回一个 relay handle 和一个按注册作用域划分的发送授权，并将其委托给该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关会存储来自 `push.apns.register` 的 relay handle 和发送授权。
   - 在执行 `push.test`、重新连接唤醒和唤醒提示时，Gateway 网关会使用自己的设备身份对发送请求签名。
   - relay 会根据注册时委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。
   - 即使其他 Gateway 网关设法获得了该 handle，也无法重用该已存储注册。

5. `relay -> APNs`
   - relay 持有生产 APNs 凭证，以及官方构建的原始 APNs token。
   - 对于 relay 支持的官方构建，Gateway 网关永远不会存储原始 APNs token。
   - relay 代表已配对 Gateway 网关，向 APNs 发送最终 push。

创建这种设计的原因：

- 将生产 APNs 凭证留在用户 Gateway 网关之外。
- 避免在 Gateway 网关上存储官方构建的原始 APNs token。
- 只允许官方/TestFlight OpenClaw 构建使用托管 relay。
- 防止某个 Gateway 网关向属于另一 Gateway 网关的 iOS 设备发送唤醒 push。

本地/手动构建仍使用直连 APNs。如果你在没有 relay 的情况下测试这些构建，
Gateway 网关仍然需要直连 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 仅存储
App Store Connect / TestFlight 身份验证，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不配置
本地 iOS 构建的直连 APNs 投递。

推荐的 Gateway 网关主机存储方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要将其放在仓库检出目录下。

## 发现路径

### Bonjour（LAN）

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在已配置时浏览相同的广域 DNS-SD 发现域。同一 LAN 上的 Gateway 网关会自动从 `local.` 出现；跨网络发现则可使用已配置的广域域名，而无需改变信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用一个单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）和 Tailscale 拆分 DNS。
CoreDNS 示例请参见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动 host/port

在“设置”中启用**手动主机**，并输入 Gateway 网关 host + port（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas host 提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 相同端口，默认 `18789`）。
- 当广播了 canvas host URL 时，iOS 节点会在连接后自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 可返回内置脚手架。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在“设置”中使用。
- iOS 可能会挂起后台音频；当应用不处于活动状态时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（canvas/相机/屏幕命令需要它）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关未广播 canvas host URL；请检查 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `canvasHost`。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- 重装后重新连接失败：Keychain 配对 token 已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)
