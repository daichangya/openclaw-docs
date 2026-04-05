---
read_when:
    - 任意のチャンネルでリアクションに取り組んでいる
    - 絵文字リアクションがプラットフォームごとにどう異なるかを理解したい
summary: サポートされているすべてのチャンネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-04-05T13:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# リアクション

エージェントは、`message`
ツールの `react` アクションを使って、メッセージに絵文字リアクションを追加および削除できます。リアクションの動作はチャンネルごとに異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合、`emoji` は必須です。
- ボットのリアクションを削除するには、`emoji` を空文字列（`""`）に設定します。
- 特定の絵文字を削除するには `remove: true` を設定します（空でない `emoji` が必要です）。

## チャンネルごとの動作

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空の `emoji` は、そのメッセージ上のボットのすべてのリアクションを削除します。
    - `remove: true` は、指定した絵文字だけを削除します。
  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、そのメッセージ上のアプリのリアクションを削除します。
    - `remove: true` は、指定した絵文字だけを削除します。
  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツールのバリデーション上は引き続き空でない `emoji` が必要です。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字にマップされます（それでもツール呼び出しでは `emoji` が必要です）。
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`、`remove`、`list` アクションを持つ `feishu_reaction` ツールを使います。
    - 追加/削除には `emoji_type` が必要で、削除にはさらに `reaction_id` も必要です。
  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます: `"off"` で無効、`"own"`（デフォルト）でユーザーがボットメッセージにリアクションしたときにイベントを発行、`"all"` ですべてのリアクションに対してイベントを発行します。
  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの `reactionLevel` 設定は、エージェントがどの程度広くリアクションを使うかを制御します。値は通常 `off`、`ack`、`minimal`、または `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

各チャンネルで `reactionLevel` を設定して、各プラットフォームでエージェントがどの程度積極的にメッセージへリアクションするかを調整してください。

## 関連

- [エージェント送信](/tools/agent-send) — `react` を含む `message` ツール
- [チャンネル](/ja-JP/channels) — チャンネル固有の設定
