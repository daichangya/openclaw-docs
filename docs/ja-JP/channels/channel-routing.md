---
read_when:
    - チャネルルーティングまたは受信トレイの動作の変更
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-04-23T04:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7d437d85d5edd3a0157fd683c6ec63d5d7e905e3e6bdce9a3ba11ddab97d3c2
    source_path: channels/channel-routing.md
    workflow: 15
---

# チャネルとルーティング

OpenClaw は返信を**メッセージが届いたチャネルに返します**。モデルがチャネルを選ぶことはありません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要な用語

- **チャネル**: `telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`、および拡張チャネル。`webchat` は内部の WebChat UI チャネルであり、設定可能な送信先チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャネルデフォルトアカウント: `channels.<channel>.defaultAccount` は、送信経路で `accountId` が指定されていない場合にどのアカウントを使うかを選択します。
  - マルチアカウント構成では、2 つ以上のアカウントが設定されている場合は明示的なデフォルト（`defaultAccount` または `accounts.default`）を設定してください。これがないと、フォールバックルーティングで最初に正規化されたアカウント ID が選ばれることがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストを保存し、並行性を制御するために使われるバケットキー。

## セッションキーの形状（例）

ダイレクトメッセージは、デフォルトでエージェントの **main** セッションに集約されます。

- `agent:<agentId>:<mainKey>`（デフォルト: `agent:main:main`）

ダイレクトメッセージの会話履歴が main と共有される場合でも、サンドボックスとツールポリシーでは、外部 DM 用に派生されたアカウント単位のダイレクトチャットランタイムキーを使います。これにより、チャネル由来のメッセージがローカルの main セッション実行として扱われないようにします。

グループとチャネルは、チャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord のスレッドは、ベースキーの末尾に `:thread:<threadId>` を追加します。
- Telegram のフォーラムトピックは、グループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つの main セッションを共有することがあります。
このセッションの `lastRoute` がオーナー以外の DM で上書きされるのを防ぐため、OpenClaw は次のすべてを満たす場合に `allowFrom` から固定オーナーを推論します。

- `allowFrom` にワイルドカードではないエントリがちょうど 1 つある。
- そのエントリを、そのチャネル用の具体的な送信者 ID に正規化できる。
- 受信した DM の送信者が、その固定オーナーと一致しない。

この不一致のケースでは、OpenClaw は受信セッションメタデータを引き続き記録しますが、main セッションの `lastRoute` の更新はスキップします。

## ルーティングルール（エージェントの選び方）

ルーティングは、各受信メッセージに対して**1 つのエージェント**を選択します。

1. **完全な peer 一致**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親 peer 一致**（スレッド継承）。
3. **Guild + roles 一致**（Discord）`guildId` + `roles` 経由。
4. **Guild 一致**（Discord）`guildId` 経由。
5. **Team 一致**（Slack）`teamId` 経由。
6. **アカウント一致**（チャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **デフォルトエージェント**（`agents.list[].default`、なければ最初のリストエントリ、フォールバックは `main`）。

binding に複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、その binding が適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、どのワークスペースとセッションストアを使うかが決まります。

## ブロードキャストグループ（複数のエージェントを実行）

ブロードキャストグループを使うと、**OpenClaw が通常返信する場合**（たとえば WhatsApp グループで、メンション/アクティベーションのゲートを通過したあと）に、同じ peer に対して**複数のエージェント**を実行できます。

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

参照: [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)。

## 設定の概要

- `agents.list`: 名前付きエージェント定義（ワークスペース、モデルなど）。
- `bindings`: 受信チャネル/アカウント/peer をエージェントにマッピングします。

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

セッションストアは状態ディレクトリ（デフォルトは `~/.openclaw`）の下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアと同じ場所に保存されます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

Gateway と ACP のセッション検出では、デフォルトの `agents/` ルート配下、およびテンプレート化された `session.store` ルート配下の、ディスクベースのエージェントストアもスキャンします。検出対象のストアは、その解決されたエージェントルート内にあり、通常の `sessions.json` ファイルを使っている必要があります。シンボリックリンクおよびルート外のパスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続され、デフォルトではそのエージェントの main セッションになります。
このため、WebChat ではそのエージェントのチャネル横断コンテキストを 1 か所で確認できます。

## 返信コンテキスト

受信した返信には次が含まれます。

- 利用可能な場合、`ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用されたコンテキストは、`[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャネル間で一貫しています。
