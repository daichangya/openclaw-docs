---
read_when:
    - 添加位置节点支持或权限 UI
    - 设计 Android 位置权限或前台行为
summary: 节点的位置命令（location.get）、权限模式和 Android 前台行为
title: 位置命令
x-i18n:
    generated_at: "2026-04-23T22:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## TL;DR

- `location.get` 是一个节点命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用选择器：关闭 / 使用期间。
- 单独的开关：精确位置。

## 为什么使用选择器（而不只是开关）

操作系统权限是多级的。我们可以在应用内暴露一个选择器，但实际授予级别仍由操作系统决定。

- iOS/macOS 可能会在系统提示/设置中提供**使用期间**或**始终**。
- Android 应用当前仅支持前台位置。
- 精确位置是单独的授权（iOS 14+ 的“Precise”，Android 的“fine” 与 “coarse”）。

UI 中的选择器驱动我们请求的模式；实际授权存在于操作系统设置中。

## 设置模型

按节点设备分别配置：

- `location.enabledMode`：`off | whileUsing`
- `location.preciseEnabled`：布尔值

UI 行为：

- 选择 `whileUsing` 会请求前台权限。
- 如果操作系统拒绝所请求的级别，则回退到已授予的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点会通过权限映射报告 `location`；iOS/Android 可能省略它。

## 命令：`location.get`

通过 `node.invoke` 调用。

参数（建议）：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

响应负载：

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

错误（稳定代码）：

- `LOCATION_DISABLED`：选择器已关闭。
- `LOCATION_PERMISSION_REQUIRED`：缺少所请求模式所需的权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用处于后台，但仅允许“使用期间”。
- `LOCATION_TIMEOUT`：未能及时获取定位。
- `LOCATION_UNAVAILABLE`：系统失败 / 无可用提供商。

## 后台行为

- Android 应用在后台时会拒绝 `location.get`。
- 在 Android 上请求位置时，请保持 OpenClaw 处于打开状态。
- 其他节点平台可能有所不同。

## 模型/工具集成

- 工具界面：`nodes` 工具新增 `location_get` 操作（必须指定节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体指南：仅在用户已启用位置并了解其范围时调用。

## UX 文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅当 OpenClaw 处于打开状态时。”
- 精确位置：“使用精确 GPS 位置。关闭此开关可共享近似位置。”

## 相关内容

- [渠道位置解析](/zh-CN/channels/location)
- [相机采集](/zh-CN/nodes/camera)
- [通话模式](/zh-CN/nodes/talk)
