---
read_when:
    - セッションのルーティングと分離を理解したい場合
    - マルチユーザー構成向けに DM スコープを設定したい場合
summary: OpenClaw が会話セッションをどのように管理するか
title: セッション管理
x-i18n:
    generated_at: "2026-04-23T04:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# セッション管理

OpenClaw は会話を **sessions** に整理します。各メッセージは、DM、グループチャット、Cron ジョブなど、どこから来たかに基づいてセッションにルーティングされます。

## メッセージのルーティング方法

| 送信元 | 動作 |
| --------------- | ------------------------- |
| ダイレクトメッセージ | デフォルトで共有セッション |
| グループチャット | グループごとに分離 |
| ルーム/チャネル | ルームごとに分離 |
| Cron ジョブ | 実行ごとに新しいセッション |
| Webhook | フックごとに分離 |

## DM の分離

デフォルトでは、継続性のためにすべての DM が 1 つのセッションを共有します。これはシングルユーザー構成では問題ありません。

<Warning>
複数の人があなたのエージェントにメッセージを送れる場合は、DM の分離を有効にしてください。これを行わないと、すべてのユーザーが同じ会話コンテキストを共有します。つまり、Alice のプライベートメッセージが Bob に見えることになります。
</Warning>

**修正方法:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // チャネル + 送信者ごとに分離
  },
}
```

その他のオプション:

- `main`（デフォルト）-- すべての DM が 1 つのセッションを共有します。
- `per-peer` -- 送信者ごとに分離します（チャネルをまたぐ）。
- `per-channel-peer` -- チャネル + 送信者ごとに分離します（推奨）。
- `per-account-channel-peer` -- アカウント + チャネル + 送信者ごとに分離します。

<Tip>
同じ人物が複数のチャネルからあなたに連絡する場合は、`session.identityLinks` を使ってその ID をリンクし、1 つのセッションを共有できるようにしてください。
</Tip>

`openclaw security audit` で設定を確認してください。

## セッションのライフサイクル

セッションは期限切れになるまで再利用されます。

- **日次リセット**（デフォルト）-- Gateway ホストのローカル時間で午前 4:00 に新しいセッションが作成されます。
- **アイドルリセット**（オプション）-- 一定期間アクティビティがないと新しいセッションになります。`session.reset.idleMinutes` を設定してください。
- **手動リセット** -- チャットで `/new` または `/reset` を入力します。`/new <model>` はモデルも切り替えます。

日次リセットとアイドルリセットの両方が設定されている場合は、先に期限切れになる方が適用されます。

アクティブなプロバイダー所有の CLI セッションを持つセッションは、暗黙の日次デフォルトでは切断されません。それらのセッションをタイマーで期限切れにしたい場合は、`/reset` を使うか、`session.reset` を明示的に設定してください。

## 状態の保存場所

すべてのセッション状態は **Gateway** が管理します。UI クライアントは Gateway に問い合わせてセッションデータを取得します。

- **ストア:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **トランスクリプト:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## セッションのメンテナンス

OpenClaw は時間の経過とともにセッションストレージを自動的に制限します。デフォルトでは `warn` モードで動作し、クリーンアップされる内容を報告します。自動クリーンアップを行うには、`session.maintenance.mode` を `"enforce"` に設定してください。

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

`openclaw sessions cleanup --dry-run` でプレビューできます。

## セッションの確認

- `openclaw status` -- セッションストアのパスと最近のアクティビティ。
- `openclaw sessions --json` -- すべてのセッション（`--active <minutes>` で絞り込み）。
- チャット内の `/status` -- コンテキスト使用量、モデル、トグル。
- `/context list` -- システムプロンプトに含まれている内容。

## さらに読む

- [セッションのプルーニング](/ja-JP/concepts/session-pruning) -- ツール結果のトリミング
- [Compaction](/ja-JP/concepts/compaction) -- 長い会話の要約
- [セッションツール](/ja-JP/concepts/session-tool) -- セッション横断作業用のエージェントツール
- [セッション管理の詳細](/ja-JP/reference/session-management-compaction) --
  ストアスキーマ、トランスクリプト、送信ポリシー、送信元メタデータ、高度な設定
- [マルチエージェント](/ja-JP/concepts/multi-agent) — エージェント間のルーティングとセッション分離
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業がセッション参照を持つタスクレコードをどのように作成するか
- [チャネルルーティング](/ja-JP/channels/channel-routing) — 受信メッセージがどのようにセッションへルーティングされるか
