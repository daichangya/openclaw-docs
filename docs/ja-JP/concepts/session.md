---
read_when:
    - セッションのルーティングと分離を理解したい場合
    - 複数ユーザー環境向けにDMスコープを設定したい場合
summary: OpenClawが会話セッションを管理する方法
title: セッション管理
x-i18n:
    generated_at: "2026-04-05T12:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# セッション管理

OpenClawは会話を**セッション**として整理します。各メッセージは、その送信元（DM、グループチャット、cronジョブなど）に基づいてセッションへルーティングされます。

## メッセージのルーティング方法

| 送信元 | 動作 |
| --------------- | ------------------------- |
| ダイレクトメッセージ | デフォルトで共有セッション |
| グループチャット | グループごとに分離 |
| ルーム/チャンネル | ルームごとに分離 |
| cronジョブ | 実行ごとに新しいセッション |
| Webhook | フックごとに分離 |

## DM分離

デフォルトでは、すべてのDMが継続性のために1つのセッションを共有します。これは単一ユーザー環境では問題ありません。

<Warning>
複数の人があなたのエージェントにメッセージできる場合は、DM分離を有効にしてください。これを有効にしないと、すべてのユーザーが同じ会話コンテキストを共有します。つまり、AliceのプライベートメッセージがBobにも見えることになります。
</Warning>

**修正方法:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // チャンネル + 送信者ごとに分離
  },
}
```

その他のオプション:

- `main`（デフォルト） -- すべてのDMが1つのセッションを共有します。
- `per-peer` -- 送信者ごとに分離します（チャンネルをまたぐ）。
- `per-channel-peer` -- チャンネル + 送信者ごとに分離します（推奨）。
- `per-account-channel-peer` -- アカウント + チャンネル + 送信者ごとに分離します。

<Tip>
同じ人が複数のチャンネルから連絡してくる場合は、`session.identityLinks`を使ってそのIDをリンクし、1つのセッションを共有できるようにしてください。
</Tip>

`openclaw security audit`で設定を確認してください。

## セッションのライフサイクル

セッションは期限切れになるまで再利用されます:

- **日次リセット**（デフォルト） -- Gatewayホストのローカル時刻で午前4:00に新しいセッションになります。
- **アイドルリセット**（任意） -- 一定時間の非アクティブ後に新しいセッションになります。`session.reset.idleMinutes`を設定してください。
- **手動リセット** -- チャットで`/new`または`/reset`を入力します。`/new <model>`ではモデルも切り替わります。

日次リセットとアイドルリセットの両方が設定されている場合は、先に期限切れになる方が優先されます。

## 状態の保存場所

すべてのセッション状態は**Gateway**が保持します。UIクライアントはGatewayにセッションデータを問い合わせます。

- **保存先:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **トランスクリプト:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## セッションメンテナンス

OpenClawは、時間の経過に応じてセッションストレージを自動的に制限します。デフォルトでは`warn`モードで動作し（クリーンアップ対象を報告）、自動クリーンアップを行うには`session.maintenance.mode`を`"enforce"`に設定します:

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

`openclaw sessions cleanup --dry-run`でプレビューできます。

## セッションの確認

- `openclaw status` -- セッション保存先のパスと最近のアクティビティ。
- `openclaw sessions --json` -- すべてのセッション（`--active <minutes>`でフィルター）。
- チャット内の`/status` -- コンテキスト使用量、モデル、トグル。
- `/context list` -- system promptに含まれている内容。

## さらに読む

- [セッションのプルーニング](/concepts/session-pruning) -- ツール結果のトリミング
- [コンパクション](/concepts/compaction) -- 長い会話の要約
- [セッションツール](/concepts/session-tool) -- セッションをまたぐ作業のためのエージェントツール
- [セッション管理の詳細](/reference/session-management-compaction) -- ストアスキーマ、トランスクリプト、送信ポリシー、オリジンメタデータ、高度な設定
- [マルチエージェント](/concepts/multi-agent) — エージェント間のルーティングとセッション分離
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業が、セッション参照付きのタスクレコードをどのように作成するか
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — 受信メッセージがどのようにセッションへルーティングされるか
