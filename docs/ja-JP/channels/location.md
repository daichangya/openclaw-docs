---
read_when:
    - チャネル位置情報解析を追加または変更するとき
    - エージェントプロンプトやツールで位置情報コンテキストフィールドを使用するとき
summary: 受信チャネルの位置情報解析（Telegram/WhatsApp/Matrix）とコンテキストフィールド
title: チャネル位置情報解析
x-i18n:
    generated_at: "2026-04-05T12:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# チャネル位置情報解析

OpenClaw は、チャットチャネルから共有された位置情報を次の形式に正規化します。

- 受信本文に追加される人間が読みやすいテキスト
- 自動返信コンテキストペイロード内の構造化フィールド

現在サポートされているもの:

- **Telegram**（位置ピン + venue + live location）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）
- **Matrix**（`geo_uri` を持つ `m.location`）

## テキスト形式

位置情報は、角括弧なしの読みやすい行としてレンダリングされます。

- ピン:
  - `📍 48.858844, 2.294351 ±12m`
- 名前付きの場所:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- ライブ共有:
  - `🛰 ライブ位置情報: 48.858844, 2.294351 ±12m`

チャネルにキャプション / コメントが含まれている場合は、次の行に追加されます。

```
📍 48.858844, 2.294351 ±12m
ここで会いましょう
```

## コンテキストフィールド

位置情報がある場合、これらのフィールドが `ctx` に追加されます。

- `LocationLat`（数値）
- `LocationLon`（数値）
- `LocationAccuracy`（数値、メートル; 任意）
- `LocationName`（文字列; 任意）
- `LocationAddress`（文字列; 任意）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（真偽値）

## チャネルごとの注意点

- **Telegram**: venue は `LocationName/LocationAddress` に対応し、live location は `live_period` を使用します。
- **WhatsApp**: `locationMessage.comment` と `liveLocationMessage.caption` はキャプション行として追加されます。
- **Matrix**: `geo_uri` はピン位置情報として解析され、高度は無視され、`LocationIsLive` は常に false です。
