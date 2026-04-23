---
read_when:
    - 在 iOS/Android 节点或 macOS 上添加或修改相机拍摄功能
    - 扩展智能体可访问的 MEDIA 临时文件工作流
summary: 供智能体使用的相机拍摄（iOS/Android 节点 + macOS 应用）：照片（jpg）和短视频片段（mp4）
title: 相机拍摄
x-i18n:
    generated_at: "2026-04-23T20:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 089d2628381c7ca8c65bc9ef19b036b5e32cb3202dfd57cb158e4cacb3b069c6
    source_path: nodes/camera.md
    workflow: 15
---

# 相机拍摄（智能体）

OpenClaw 支持用于智能体工作流的**相机拍摄**：

- **iOS 节点**（通过 Gateway 网关配对）：可通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **Android 节点**（通过 Gateway 网关配对）：可通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **macOS 应用**（作为通过 Gateway 网关连接的节点）：可通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。

所有相机访问都受**用户控制的设置**保护。

## iOS 节点

### 用户设置（默认开启）

- iOS 设置标签页 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认值：**开启**（缺失该键时视为已启用）。
  - 关闭时：`camera.*` 命令会返回 `CAMERA_DISABLED`。

### 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：由 `{ id, name, position, deviceType }` 组成的数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS 节点默认 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 负载保护：照片会被重新压缩，以确保 base64 负载小于 5 MB。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认 `3000`，最大限制为 `60000`）
    - `includeAudio`：布尔值（默认 `true`）
    - `format`：当前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前台要求

与 `canvas.*` 类似，iOS 节点只允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 助手（临时文件 + MEDIA）

获取附件最简单的方式是通过 CLI 助手，它会将解码后的媒体写入临时文件，并输出 `MEDIA:<path>`。

示例：

```bash
openclaw nodes camera snap --node <id>               # 默认：同时拍摄前置 + 后置（2 条 MEDIA）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `nodes camera snap` 默认会同时使用**两个**朝向，以便让智能体同时获得两个视角。
- 输出文件是临时文件（位于操作系统临时目录），除非你自己构建包装器。

## Android 节点

### Android 用户设置（默认开启）

- Android 设置面板 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认值：**开启**（缺失该键时视为已启用）。
  - 关闭时：`camera.*` 命令会返回 `CAMERA_DISABLED`。

### 权限

- Android 需要运行时权限：
  - `CAMERA`：用于 `camera.snap` 和 `camera.clip`。
  - `RECORD_AUDIO`：当 `camera.clip` 且 `includeAudio=true` 时需要。

如果权限缺失，应用会在可能时弹出提示；如果被拒绝，`camera.*` 请求会以
`*_PERMISSION_REQUIRED` 错误失败。

### Android 前台要求

与 `canvas.*` 类似，Android 节点只允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：由 `{ id, name, position, deviceType }` 组成的数组

### 负载保护

照片会被重新压缩，以确保 base64 负载小于 5 MB。

## macOS 应用

### 用户设置（默认关闭）

macOS 配套应用提供一个复选框：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - 默认值：**关闭**
  - 关闭时：相机请求会返回 “Camera disabled by user”。

### CLI 助手（node invoke）

使用主 `openclaw` CLI 在 macOS 节点上调用相机命令。

示例：

```bash
openclaw nodes camera list --node <id>            # 列出相机 id
openclaw nodes camera snap --node <id>            # 输出 MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # 输出 MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # 输出 MEDIA:<path>（旧版标志）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `openclaw nodes camera snap` 默认使用 `maxWidth=1600`，除非你显式覆盖。
- 在 macOS 上，`camera.snap` 会在预热/曝光稳定后等待 `delayMs`（默认 2000 ms）再拍摄。
- 照片负载会被重新压缩，以确保 base64 小于 5 MB。

## 安全性 + 实际限制

- 相机和麦克风访问会触发常见的操作系统权限提示（并需要在 `Info.plist` 中提供 usage strings）。
- 视频片段长度受限（当前 `<= 60s`），以避免节点负载过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（操作系统级）

对于**屏幕**视频（不是相机），请使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 输出 MEDIA:<path>
```

说明：

- 需要 macOS **Screen Recording** 权限（TCC）。
