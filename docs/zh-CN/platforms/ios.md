---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、canvas 和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-04-23T20:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59e95d05257ff46fda16235a8b0e5999c99ec18c2ba425e1911be97e34d3747e
    source_path: platforms/ios.md
    workflow: 15
---

# iOS 应用（节点）

可用性：内部预览。iOS 应用尚未公开发布。

## 它能做什么

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、屏幕快照、相机采集、位置、Talk mode、Voice wake。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- 另一台设备上正在运行的 Gateway 网关（macOS、Linux，或通过 WSL2 的 Windows）。
- 网络路径：
  - 同一局域网，通过 Bonjour，**或者**
  - 通过单播 DNS-SD 的 tailnet（例如域名：`openclaw.internal.`），**或者**
  - 手动填写主机/端口（回退方式）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开 Settings 并选择一个已发现的 Gateway 网关（或者启用 Manual Host 并输入主机/端口）。

3. 在 Gateway 网关主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用在认证详情（角色/作用域/公钥）发生变化后重试配对，
之前的待处理请求会被替代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方发布的 iOS 构建使用外部推送中继，而不是将原始 APNs
令牌直接发布给 Gateway 网关。

Gateway 网关侧要求：

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

流程如何工作：

- iOS 应用使用 App Attest 和应用收据向中继注册。
- 中继返回一个不透明的 relay handle，以及一个带注册作用域的发送授权。
- iOS 应用会获取已配对 Gateway 网关的身份，并将其包含在中继注册中，因此该中继注册会被委托给该特定 Gateway 网关。
- 应用通过 `push.apns.register` 将这个中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关会使用这个已存储的 relay handle 来执行 `push.test`、后台唤醒和唤醒 nudges。
- Gateway 网关的中继 base URL 必须与官方/TestFlight iOS 构建中内置的中继 URL 相匹配。
- 如果应用稍后连接到不同的 Gateway 网关，或连接到使用不同中继 base URL 的构建，它会刷新中继注册，而不是复用旧绑定。

对于这条路径，Gateway 网关**不**需要：

- 不需要整个部署级别的中继令牌。
- 对于官方/TestFlight 的中继支持发送，不需要直接 APNs 密钥。

预期的运维流程：

1. 安装官方/TestFlight iOS 构建。
2. 在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并让其完成连接。
4. 在应用获得 APNs 令牌、operator 会话已连接且中继注册成功之后，应用会自动发布 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒 nudges 就可以使用已存储的中继支持注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖项使用。

## 认证与信任流程

中继的存在是为了强制执行两个约束，而这些约束是官方 iOS 构建在直接 APNs-on-gateway 模式下无法提供的：

- 只有通过 Apple 发布的真实 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关完成配对的 iOS 设备发送中继支持推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过正常的 Gateway 网关认证流程与 Gateway 网关完成配对。
   - 这会让应用获得一个已认证的节点会话，以及一个已认证的 operator 会话。
   - operator 会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册内容包含 App Attest 证明以及应用收据。
   - 中继会验证 bundle ID、App Attest 证明和 Apple 收据，并要求
     使用官方/生产发布路径。
   - 这正是阻止本地 Xcode/dev 构建使用托管中继的机制。一个本地构建即使已签名，
     也无法满足中继所要求的官方 Apple 发布证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用会从
     `gateway.identity.get` 获取已配对 Gateway 网关的身份。
   - 应用会将该 Gateway 网关身份包含在中继注册载荷中。
   - 中继会返回一个 relay handle，以及一个被委托给该 Gateway 网关身份的注册作用域发送授权。

4. `gateway -> relay`
   - Gateway 网关会从 `push.apns.register` 中存储 relay handle 和发送授权。
   - 在执行 `push.test`、重连唤醒和唤醒 nudges 时，Gateway 网关会使用其
     自身设备身份为发送请求签名。
   - 中继会根据注册时被委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。
   - 即使另一个 Gateway 网关以某种方式拿到了该 handle，也不能复用该存储注册。

5. `relay -> APNs`
   - 中继持有官方构建所需的生产 APNs 凭证和原始 APNs 令牌。
   - 对于中继支持的官方构建，Gateway 网关绝不会存储原始 APNs 令牌。
   - 中继会代表已配对 Gateway 网关向 APNs 发送最终推送。

设计该方案的原因：

- 使生产 APNs 凭证不落到用户 Gateway 网关上。
- 避免在 Gateway 网关上存储官方构建的原始 APNs 令牌。
- 只允许官方/TestFlight OpenClaw 构建使用托管中继。
- 防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍然使用直接 APNs。如果你在无中继情况下测试这些构建，
Gateway 网关仍然需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储
App Store Connect / TestFlight 认证信息，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不会为
本地 iOS 构建配置直接 APNs 传递。

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

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的
广域 DNS-SD 发现域。同一局域网中的 Gateway 网关会自动通过 `local.` 出现；
跨网络发现则可以使用已配置的广域域名，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（自行选择域名；例如：
`openclaw.internal.`）和 Tailscale split DNS。
参见 [Bonjour](/zh-CN/gateway/bonjour) 中的 CoreDNS 示例。

### 手动主机/端口

在 Settings 中启用 **Manual Host**，然后输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas host 提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用同一端口，默认 `18789`）。
- 当广播了 canvas host URL 时，iOS 节点在连接后会自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 可返回到内置脚手架。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake 和 Talk mode 可在 Settings 中启用。
- iOS 可能会挂起后台音频；当应用不活跃时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：请将 iOS 应用切到前台（canvas/camera/screen 命令需要它处于前台）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关没有广播 canvas host URL；请检查 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `canvasHost`。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)
