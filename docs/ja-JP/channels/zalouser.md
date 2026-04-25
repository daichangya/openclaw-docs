---
read_when:
    - OpenClaw 向け Zalo 個人アカウントの設定
    - Zalo 個人アカウントのログインまたはメッセージフローをデバッグする
summary: ネイティブ `zca-js`（QR ログイン）経由の Zalo 個人アカウントサポート、機能、および設定
title: Zalo 個人アカウント
x-i18n:
    generated_at: "2026-04-25T13:42:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

ステータス: 実験的。この統合は、OpenClaw 内でネイティブ `zca-js` を使って**個人 Zalo アカウント**を自動化します。

> **警告:** これは非公式の統合であり、アカウント停止/凍結の原因になる可能性があります。自己責任で使用してください。

## バンドル済み Plugin

Zalo Personal は現在の OpenClaw リリースではバンドル済み Plugin として同梱されているため、通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルド、または Zalo Personal を除外したカスタムインストールを使用している場合は、手動でインストールしてください。

- CLI でインストール: `openclaw plugins install @openclaw/zalouser`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

外部の `zca`/`openzca` CLI バイナリは不要です。

## クイックセットアップ（初級者向け）

1. Zalo Personal Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記コマンドで手動追加できます。
2. ログインします（QR、Gateway マシン上）:
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
3. チャネルを有効にします:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway を再起動します（またはセットアップを完了します）。
5. DM アクセスのデフォルトは pairing です。最初の接触時にペアリングコードを承認してください。

## これは何か

- `zca-js` を介して完全にインプロセスで動作します。
- ネイティブのイベントリスナーを使用して受信メッセージを受け取ります。
- JS API を通じて返信を直接送信します（テキスト/メディア/リンク）。
- Zalo Bot API が利用できない「個人アカウント」用途向けに設計されています。

## 命名

チャネル ID は `zalouser` です。これは**個人 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来の公式 Zalo API 統合のために予約しています。

## ID の見つけ方（directory）

directory CLI を使って、相手/グループとその ID を確認します:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約 2000 文字に分割されます（Zalo クライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy` は次をサポートします: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` はユーザー ID または名前を受け付けます。セットアップ時に、名前は Plugin のインプロセス連絡先検索を使って ID に解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループ許可）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- 許可リストに制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーには安定したグループ ID を使用してください。可能な場合、起動時に名前は ID に解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内でどの送信者がボットをトリガーできるかを制御します）
- すべてのグループをブロックする: `channels.zalouser.groupPolicy = "disabled"`。
- configure ウィザードでは、グループ許可リストを対話的に設定できます。
- 起動時に、OpenClaw は許可リスト内のグループ名/ユーザー名を ID に解決し、その対応をログに出力します。
- グループ許可リストの照合は、デフォルトでは ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` を有効にしない限り、認可では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、変更可能なグループ名照合を再有効化する緊急互換モードです。
- `groupAllowFrom` が未設定の場合、ランタイムはグループ送信者チェックで `allowFrom` にフォールバックします。
- 送信者チェックは、通常のグループメッセージと制御コマンド（たとえば `/new`、`/reset`）の両方に適用されます。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### グループメンションゲーティング

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 完全一致のグループ id/名前 -> 正規化されたグループ slug -> `*` -> デフォルト（`true`）。
- これは許可リスト対象のグループと open グループモードの両方に適用されます。
- ボットメッセージの引用は、グループ起動における暗黙のメンションとして扱われます。
- 認可された制御コマンド（たとえば `/new`）は、メンションゲーティングをバイパスできます。
- メンションが必要なためにグループメッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の上限はデフォルトで `messages.groupChat.historyLimit`（フォールバック `50`）です。アカウントごとに `channels.zalouser.historyLimit` で上書きできます。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## マルチアカウント

アカウントは OpenClaw の状態内で `zalouser` プロファイルに対応付けられます。例:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 入力中表示、リアクション、配信確認

- OpenClaw は返信を送信する前に入力中イベントを送ります（ベストエフォート）。
- チャネルアクションでは、`zalouser` に対してメッセージリアクションアクション `react` がサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには `remove: true` を使用します。
  - リアクションの意味論: [Reactions](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージに対して、OpenClaw は配信済み + 既読確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログイン状態が維持されない場合:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されなかった場合:**

- `allowFrom`/`groupAllowFrom`/`groups` には数値 ID または正確な友達名/グループ名を使用してください。

**古い CLI ベースのセットアップからアップグレードした場合:**

- 古い外部 `zca` プロセス前提を削除してください。
- このチャネルは現在、外部 CLI バイナリなしで完全に OpenClaw 内で動作します。

## 関連

- [Channels Overview](/ja-JP/channels) — 対応チャネル全体
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャット動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
