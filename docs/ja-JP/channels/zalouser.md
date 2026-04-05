---
read_when:
    - OpenClaw 用に Zalo Personal をセットアップしている
    - Zalo Personal のログインまたはメッセージフローをデバッグしている
summary: ネイティブ `zca-js`（QR ログイン）による Zalo 個人アカウントのサポート、機能、設定
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:37:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal（非公式）

ステータス: 実験的。この統合は、OpenClaw 内でネイティブ `zca-js` を使って **個人の Zalo アカウント** を自動化します。

> **警告:** これは非公式の統合であり、アカウントの停止や BAN につながる可能性があります。自己責任で使用してください。

## バンドルされたプラグイン

Zalo Personal は現在の OpenClaw リリースではバンドルされたプラグインとして同梱されているため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドまたは Zalo Personal を含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

- CLI でインストール: `openclaw plugins install @openclaw/zalouser`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugins](/tools/plugin)

外部の `zca`/`openzca` CLI バイナリは不要です。

## クイックセットアップ（初心者向け）

1. Zalo Personal プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. ログインします（Gateway マシン上で QR を使用）:
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
5. DM アクセスはデフォルトで pairing です。最初の接触時にペアリングコードを承認してください。

## これは何か

- 完全に `zca-js` を使ってインプロセスで動作します。
- ネイティブのイベントリスナーを使って受信メッセージを受け取ります。
- JS API を通じて返信を直接送信します（テキスト/メディア/リンク）。
- Zalo Bot API が利用できない「個人アカウント」用途向けに設計されています。

## 命名

チャネル ID は `zalouser` です。これは **個人の Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来の公式 Zalo API 統合のために予約されたままになっています。

## ID の見つけ方（directory）

directory CLI を使って peers/groups とその ID を確認します。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約 2000 文字ごとに分割されます（Zalo クライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy` では次をサポートします: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` にはユーザー ID または名前を指定できます。セットアップ中に、名前はプラグインのインプロセス連絡先検索を使って ID に解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（省略可）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループを許可）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- 許可リストで制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーには安定したグループ ID を使うべきです。可能な場合、名前は起動時に ID に解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内でどの送信者がボットをトリガーできるかを制御します）
- すべてのグループをブロックする: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードではグループ許可リストを尋ねることができます。
- 起動時に、OpenClaw は許可リスト内のグループ名/ユーザー名を ID に解決し、その対応をログに記録します。
- グループ許可リストの照合はデフォルトで ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、変更可能なグループ名照合を再有効化する緊急用の互換モードです。
- `groupAllowFrom` が未設定の場合、ランタイムはグループ送信者チェックに `allowFrom` へフォールバックします。
- 送信者チェックは通常のグループメッセージと制御コマンド（たとえば `/new`、`/reset`）の両方に適用されます。

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

### グループメンションゲート

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 正確なグループ id/名前 -> 正規化されたグループ slug -> `*` -> デフォルト（`true`）。
- これは許可リスト対象のグループと open グループモードの両方に適用されます。
- 認可された制御コマンド（たとえば `/new`）はメンションゲートをバイパスできます。
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

アカウントは OpenClaw の状態内の `zalouser` プロファイルに対応します。例:

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
- メッセージリアクション操作 `react` は、チャネルアクションで `zalouser` をサポートしています。
  - メッセージから特定のリアクション絵文字を削除するには `remove: true` を使用します。
  - リアクションの仕様: [Reactions](/tools/reactions)
- イベントメタデータを含む受信メッセージに対して、OpenClaw は delivered + seen の確認応答を送ります（ベストエフォート）。

## トラブルシューティング

**ログイン状態が保持されない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されなかった:**

- `allowFrom`/`groupAllowFrom`/`groups` では数値 ID を使うか、正確な友だち名/グループ名を使ってください。

**古い CLI ベースのセットアップからアップグレードした:**

- 古い外部 `zca` プロセス前提は削除してください。
- このチャネルは現在、外部 CLI バイナリなしで完全に OpenClaw 内で動作します。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
