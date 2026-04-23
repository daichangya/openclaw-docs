---
read_when:
    - 添加位置节点支持或权限 UI
    - 设计 Android 位置权限或前台行为
summary: 节点的位置命令（`location.get`）、权限模式和 Android 前台行为
title: 位置命令
x-i18n:
    generated_at: "2026-04-23T20:53:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f605d29e6f57d6b1351758815d17bfe62776dad8a6860885852ea0378073fbe
    source_path: nodes/location-command.md
    workflow: 15
---

# 位置命令（节点）

## TL;DR

- `location.get` 是一个节点命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用选择器：关闭 / 使用期间。
- 另有单独切换项：精确位置。

## 为什么使用选择器（而不只是开关）

OS 权限是多级的。我们可以在应用内暴露一个选择器，但实际授予的权限仍由 OS 决定。

- iOS/macOS 可能会在系统提示/设置中暴露 **使用期间** 或 **始终**。
- Android 应用当前仅支持前台位置。
- 精确位置是单独的一项授权（iOS 14+ 的“精确位置”，Android 的“fine” 与 “coarse” 区分）。

UI 中的选择器驱动我们请求的模式；实际授权则存在于 OS 设置中。

## 设置模型

按节点设备分别配置：

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 行为：

- 选择 `whileUsing` 时，请求前台权限。
- 如果 OS 拒绝所请求的级别，则回退到已授予的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点会通过权限映射报告 `location`；iOS/Android 可能不会包含它。

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

- `LOCATION_DISABLED`：选择器为关闭。
- `LOCATION_PERMISSION_REQUIRED`：请求模式所需权限缺失。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用在后台，但只允许“使用期间”。
- `LOCATION_TIMEOUT`：未能及时获得定位结果。
- `LOCATION_UNAVAILABLE`：系统故障 / 无可用 provider。

## 后台行为

- Android 应用在后台时会拒绝 `location.get`。
- 在 Android 上请求位置时，请保持 OpenClaw 处于打开状态。
- 其他节点平台的行为可能不同。

## 模型/工具集成

- 工具表面：`nodes` 工具增加 `location_get` 动作（需要节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体指南：仅当用户已启用位置功能并理解其作用范围时才调用。

## UX 文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅当 OpenClaw 打开时。”
- 精确位置：“使用精确 GPS 位置。关闭此项可共享大致位置。”
