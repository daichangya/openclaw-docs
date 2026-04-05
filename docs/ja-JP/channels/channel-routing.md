---
read_when:
    - チャネルルーティングまたは受信箱の動作を変更するとき
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-04-05T12:34:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# チャネルとルーティング

OpenClaw は、返信を**メッセージの送信元チャネルに戻して**ルーティングします。
モデルがチャネルを選ぶことはありません。ルーティングは決定的であり、ホスト設定によって制御されます。

## 主要な用語

- **チャネル**: `telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`、および拡張チャネル。`webchat` は内部 WebChat UI チャネルであり、設定可能な送信先チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャネル既定アカウント: `channels.<channel>.defaultAccount` は、送信先パスで `accountId` が指定されていない場合に使用するアカウントを選択します。
  - マルチアカウント構成では、2 つ以上のアカウントが設定されている場合、明示的な既定値（`defaultAccount` または `accounts.default`）を設定してください。これがない場合、フォールバックルーティングによって最初に正規化されたアカウント ID が選ばれることがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「頭脳」）。
- **SessionKey**: コンテキストの保存と同時実行制御に使われるバケットキー。

## SessionKey の形式（例）

ダイレクトメッセージは、エージェントの**メイン**セッションに集約されます。

- `agent:<agentId>:<mainKey>`（既定: `agent:main:main`）

グループとチャネルは、チャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord のスレッドでは、ベースキーの末尾に `:thread:<threadId>` が追加されます。
- Telegram のフォーラムトピックでは、グループキーに `:topic:<topicId>` が埋め込まれます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## メイン DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つのメインセッションを共有することがあります。
非オーナーの DM によってセッションの `lastRoute` が上書きされるのを防ぐため、OpenClaw は次のすべてが真である場合に `allowFrom` から固定オーナーを推論します。

- `allowFrom` にワイルドカードでないエントリがちょうど 1 つある。
- そのエントリを、そのチャネルの具体的な送信者 ID に正規化できる。
- 受信した DM の送信者が、その固定オーナーと一致しない。

この不一致の場合でも、OpenClaw は受信セッションメタデータを記録しますが、メインセッションの `lastRoute` の更新はスキップします。

## ルーティングルール（エージェントの選択方法）

ルーティングでは、受信メッセージごとに**1 つのエージェント**が選択されます。

1. **完全なピア一致**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親ピア一致**（スレッド継承）。
3. **Guild + ロール一致**（Discord）`guildId` + `roles` による。
4. **Guild 一致**（Discord）`guildId` による。
5. **Team 一致**（Slack）`teamId` による。
6. **アカウント一致**（チャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **既定のエージェント**（`agents.list[].default`、それ以外は最初のリスト項目、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、そのバインディングが適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、どのワークスペースとセッションストアを使うかが決まります。

## ブロードキャストグループ（複数のエージェントを実行）

ブロードキャストグループを使うと、**通常 OpenClaw が返信する状況**（たとえば WhatsApp のグループで、メンション/アクティベーションのゲートを通過した後）で、同じピアに対して**複数のエージェント**を実行できます。

設定:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参照: [ブロードキャストグループ](/channels/broadcast-groups)。

## 設定の概要

- `agents.list`: 名前付きエージェント定義（ワークスペース、モデルなど）。
- `bindings`: 受信チャネル/アカウント/ピアをエージェントに対応付けるマップ。

例:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## セッションストレージ

セッションストアは状態ディレクトリ（既定では `~/.openclaw`）の下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアと同じ場所に保存されます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

Gateway と ACP のセッション検出では、既定の `agents/` ルート配下、およびテンプレート化された `session.store` ルート配下のディスクベースのエージェントストアもスキャンします。検出されるストアは、解決されたエージェントルート内にとどまり、通常の `sessions.json` ファイルを使っている必要があります。シンボリックリンクやルート外のパスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続し、既定ではそのエージェントのメインセッションを使います。
このため、WebChat では、そのエージェントのチャネル横断コンテキストを 1 か所で確認できます。

## 返信コンテキスト

受信した返信には次が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはすべてのチャネルで一貫しています。
