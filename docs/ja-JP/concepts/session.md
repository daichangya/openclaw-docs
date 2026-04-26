---
read_when:
    - セッションのルーティングと分離を理解したい場合
    - マルチユーザー構成向けに DM スコープを設定したい場合
    - 日次またはアイドル時のセッションリセットをデバッグしている場合
summary: OpenClaw が会話セッションをどのように管理するか
title: セッション管理
x-i18n:
    generated_at: "2026-04-26T11:28:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw は会話を **セッション** に整理します。各メッセージは、DM、グループチャット、Cron ジョブなど、どこから来たかに基づいてセッションへルーティングされます。

## メッセージのルーティング方法

| ソース           | 動作                     |
| ---------------- | ------------------------ |
| ダイレクトメッセージ | デフォルトでは共有セッション |
| グループチャット | グループごとに分離       |
| ルーム/チャンネル | ルームごとに分離         |
| Cron ジョブ      | 実行ごとに新しいセッション |
| Webhooks         | フックごとに分離         |

## DM 分離

デフォルトでは、すべての DM は継続性のために 1 つのセッションを共有します。これはシングルユーザー構成では問題ありません。

<Warning>
複数の人がエージェントにメッセージできる場合は、DM 分離を有効にしてください。これを有効にしないと、すべてのユーザーが同じ会話コンテキストを共有し、Alice のプライベートメッセージが Bob に見えるようになります。
</Warning>

**対処方法:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // チャンネル + 送信者ごとに分離
  },
}
```

その他のオプション:

- `main`（デフォルト） -- すべての DM が 1 つのセッションを共有
- `per-peer` -- 送信者ごとに分離（チャンネルをまたぐ）
- `per-channel-peer` -- チャンネル + 送信者ごとに分離（推奨）
- `per-account-channel-peer` -- アカウント + チャンネル + 送信者ごとに分離

<Tip>
同じ人が複数のチャンネルから連絡してくる場合は、
`session.identityLinks` を使ってその ID をリンクし、1 つのセッションを共有させてください。
</Tip>

`openclaw security audit` で設定を確認してください。

## セッションのライフサイクル

セッションは期限切れになるまで再利用されます。

- **日次リセット**（デフォルト） -- Gateway ホストのローカル時刻で午前 4:00 に新しいセッションになります。日次の新しさは、その後のメタデータ書き込みではなく、現在の `sessionId` が開始された時点に基づきます。
- **アイドルリセット**（任意） -- 一定期間操作がないと新しいセッションになります。`session.reset.idleMinutes` を設定してください。アイドルの新しさは、最後の実際のユーザー/チャンネル操作に基づくため、Heartbeat、Cron、exec のシステムイベントではセッションは維持されません。
- **手動リセット** -- チャットで `/new` または `/reset` を入力します。`/new <model>` はモデルも切り替えます。

日次リセットとアイドルリセットの両方が設定されている場合、先に期限切れになったほうが優先されます。Heartbeat、Cron、exec、およびその他のシステムイベントのターンはセッションメタデータを書き込むことがありますが、それらの書き込みでは日次またはアイドルリセットの新しさは延長されません。リセットによってセッションが切り替わると、古いセッション向けにキューされたシステムイベント通知は破棄されるため、新しいセッションの最初のプロンプトの先頭に古いバックグラウンド更新が追加されることはありません。

アクティブな provider 所有の CLI セッションを持つセッションは、暗黙の日次デフォルトでは切られません。そのようなセッションをタイマーで期限切れにしたい場合は、`/reset` を使うか、`session.reset` を明示的に設定してください。

## 状態の保存場所

すべてのセッション状態は **Gateway** が所有します。UI クライアントは Gateway にセッションデータを問い合わせます。

- **ストア:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **transcript:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` は、別々のライフサイクル タイムスタンプを保持します。

- `sessionStartedAt`: 現在の `sessionId` が始まった時刻。日次リセットはこれを使用します。
- `lastInteractionAt`: アイドル寿命を延ばす最後のユーザー/チャンネル操作。
- `updatedAt`: ストア行の最後の変更時刻。一覧表示や削除には便利ですが、日次/アイドルリセットの新しさに関しては決定的ではありません。

`sessionStartedAt` を持たない古い行は、可能であれば transcript JSONL セッションヘッダーから解決されます。古い行に `lastInteractionAt` もない場合、アイドルの新しさは後続の管理用書き込みではなく、そのセッション開始時刻にフォールバックします。

## セッション保守

OpenClaw は、時間経過に伴ってセッション保存量を自動的に制限します。デフォルトでは
`warn` モードで実行されます（何がクリーンアップされるかを報告）。自動クリーンアップには `session.maintenance.mode`
を `"enforce"` に設定してください。

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

- `openclaw status` -- セッションストアのパスと最近のアクティビティ
- `openclaw sessions --json` -- すべてのセッション（`--active <minutes>` で絞り込み）
- チャットで `/status` -- コンテキスト使用量、モデル、トグル
- `/context list` -- system prompt に入っている内容

## さらに読む

- [Session Pruning](/ja-JP/concepts/session-pruning) -- ツール結果のトリミング
- [Compaction](/ja-JP/concepts/compaction) -- 長い会話の要約
- [Session Tools](/ja-JP/concepts/session-tool) -- セッション間作業用のエージェントツール
- [Session Management Deep Dive](/ja-JP/reference/session-management-compaction) --
  ストアスキーマ、transcript、送信ポリシー、origin メタデータ、高度な config
- [Multi-Agent](/ja-JP/concepts/multi-agent) — エージェント間のルーティングとセッション分離
- [Background Tasks](/ja-JP/automation/tasks) — 分離された処理がセッション参照付きタスク記録をどのように作成するか
- [Channel Routing](/ja-JP/channels/channel-routing) — 受信メッセージがどのようにセッションへルーティングされるか

## 関連

- [Session pruning](/ja-JP/concepts/session-pruning)
- [Session tools](/ja-JP/concepts/session-tool)
- [Command queue](/ja-JP/concepts/queue)
