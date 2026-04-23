---
read_when:
    - 新增或修改渠道位置解析
    - 在智能体提示词或工具中使用位置上下文字段
summary: 入站渠道位置解析（Telegram/WhatsApp/Matrix）和上下文字段
title: 渠道位置解析
x-i18n:
    generated_at: "2026-04-23T20:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b486758929a3dcc7c5f0d9223891b129df353ba0b70ceaf8cfdd12735080abdc
    source_path: channels/location.md
    workflow: 15
---

OpenClaw 会将来自聊天渠道的共享位置统一规范化为：

- 追加到入站消息正文末尾的简洁坐标文本，以及
- 自动回复上下文载荷中的结构化字段。渠道提供的标签、地址和说明/评论会通过共享的非可信元数据 JSON 块渲染到提示词中，而不是直接内联到用户正文中。

当前支持：

- **Telegram**（位置标记 + 地点 + 实时位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）
- **Matrix**（带有 `geo_uri` 的 `m.location`）

## 文本格式

位置信息会被渲染为不带括号的友好文本行：

- 位置标记：
  - `📍 48.858844, 2.294351 ±12m`
- 已命名地点：
  - `📍 48.858844, 2.294351 ±12m`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含标签、地址或说明/评论，这些信息会保留在上下文载荷中，并以带围栏的非可信 JSON 形式出现在提示词中：

````text
位置（非可信元数据）：
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## 上下文字段

当存在位置信息时，会向 `ctx` 添加以下字段：

- `LocationLat`（number）
- `LocationLon`（number）
- `LocationAccuracy`（number，单位为米；可选）
- `LocationName`（string；可选）
- `LocationAddress`（string；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（boolean）
- `LocationCaption`（string；可选）

提示词渲染器会将 `LocationName`、`LocationAddress` 和 `LocationCaption` 视为非可信元数据，并通过与其他渠道上下文相同的有界 JSON 路径进行序列化。

## 渠道说明

- **Telegram**：地点会映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会填充到 `LocationCaption`。
- **Matrix**：`geo_uri` 会被解析为位置标记；海拔会被忽略，且 `LocationIsLive` 始终为 false。
