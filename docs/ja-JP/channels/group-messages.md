---
read_when:
    - グループメッセージのルールやメンションを変更するとき
summary: WhatsApp グループメッセージ処理の動作と設定（mentionPatterns は各サーフェスで共有されます）
title: グループメッセージ
x-i18n:
    generated_at: "2026-04-05T12:35:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# グループメッセージ（WhatsApp web チャネル）

目的: Clawd を WhatsApp グループに参加させ、ping されたときだけ反応させ、そのスレッドを個人 DM セッションとは分離したままにすることです。

注: `agents.list[].groupChat.mentionPatterns` は現在 Telegram/Discord/Slack/iMessage でも使われています。このドキュメントは WhatsApp 固有の動作に焦点を当てています。マルチエージェント構成では、エージェントごとに `agents.list[].groupChat.mentionPatterns` を設定してください（またはグローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使ってください）。

## 現在の実装（2025-12-03）

- アクティベーションモード: `mention`（既定）または `always`。`mention` では ping が必要です（`mentionedJids` による実際の WhatsApp の @メンション、安全な正規表現パターン、またはテキスト中の任意位置にあるボットの E.164）。`always` ではすべてのメッセージでエージェントが起動しますが、意味のある価値を提供できる場合にのみ返信し、それ以外の場合は正確に無言トークン `NO_REPLY` / `no_reply` を返す必要があります。既定値は設定の `channels.whatsapp.groups` で設定でき、グループごとに `/activation` で上書きできます。`channels.whatsapp.groups` が設定されている場合、これはグループの許可リストとしても機能します（すべて許可するには `"*"` を含めます）。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け付けるかどうかを制御します（`open|disabled|allowlist`）。`allowlist` では `channels.whatsapp.groupAllowFrom` を使います（フォールバック: 明示的な `channels.whatsapp.allowFrom`）。既定は `allowlist` です（送信者を追加するまでブロックされます）。
- グループ単位のセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになるため、`/verbose on` や `/think high` のようなコマンド（単独メッセージとして送信）はそのグループに限定されます。個人 DM の状態には影響しません。heartbeat はグループスレッドではスキップされます。
- コンテキスト注入: 実行をトリガーしなかった**保留中のみ**のグループメッセージ（既定 50 件）は、`[Chat messages since your last reply - for context]` の下にプレフィックスとして追加され、トリガーとなった行は `[Current message - respond to this]` の下に追加されます。すでにセッション内にあるメッセージは再注入されません。
- 送信者表示: すべてのグループバッチの末尾に `[from: Sender Name (+E164)]` が追加されるため、Pi は誰が話しているかを把握できます。
- 一時表示/view-once: テキストやメンションを抽出する前にこれらをアンラップするため、その中の ping でもトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン時（および `/activation` でモードが変更されるたび）に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータが利用できない場合でも、グループチャットであることはエージェントに伝えます。

## 設定例（WhatsApp）

WhatsApp が本文テキスト内の視覚的な `@` を取り除く場合でも表示名による ping が機能するように、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注意:

- これらの正規表現は大文字小文字を区別せず、ほかの設定用正規表現サーフェスと同じ safe-regex ガードレールを使います。無効なパターンや安全でないネストした繰り返しは無視されます。
- WhatsApp は、連絡先をタップしたときには引き続き `mentionedJids` 経由で正規のメンションを送信するため、番号によるフォールバックが必要になることはまれですが、有用な安全策です。

### アクティベーションコマンド（オーナーのみ）

グループチャットコマンドを使います。

- `/activation mention`
- `/activation always`

これを変更できるのは、オーナーの番号（`channels.whatsapp.allowFrom` から取得し、未設定の場合はボット自身の E.164）だけです。現在のアクティベーションモードを確認するには、グループで `/status` を単独メッセージとして送信してください。

## 使い方

1. OpenClaw を実行している WhatsApp アカウントをグループに追加します。
2. `@openclaw …` と送信します（または番号を含めます）。`groupPolicy: "open"` を設定していない限り、許可リストにある送信者だけがこれをトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストと末尾の `[from: …]` マーカーが含まれるため、適切な相手に応答できます。
4. セッションレベルのディレクティブ（`/verbose on`、`/think high`、`/new` または `/reset`、`/compact`）は、そのグループのセッションにのみ適用されます。認識されるよう、単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモークテスト:
  - グループで `@openclaw` の ping を送信し、送信者名に言及した返信があることを確認します。
  - 2 回目の ping を送信し、履歴ブロックが含まれ、その次のターンでクリアされることを確認します。
- Gateway ログ（`--verbose` 付きで実行）を確認し、`from: <groupJid>` を示す `inbound web message` エントリと `[from: …]` サフィックスを確認します。

## 既知の考慮事項

- heartbeat は、ノイズの多いブロードキャストを避けるため、意図的にグループではスキップされます。
- エコー抑制は結合されたバッチ文字列を使います。同一テキストをメンションなしで 2 回送信した場合、返信されるのは最初の 1 回だけです。
- セッションストアのエントリは、セッションストア（既定では `~/.openclaw/agents/<agentId>/sessions/sessions.json`）内で `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループでの入力中インジケーターは `agents.defaults.typingMode` に従います（既定: メンションされていない場合は `message`）。
