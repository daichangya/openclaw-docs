---
read_when:
    - Tlon/Urbit チャネル機能に取り組んでいる
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-04-05T12:37:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答できます。グループ返信はデフォルトで @ メンションが必要で、
許可リストによってさらに制限することもできます。

ステータス: バンドルされたプラグイン。DM、グループメンション、スレッド返信、リッチテキスト整形、
画像アップロードをサポートしています。リアクションと Polls はまだサポートされていません。

## バンドルされたプラグイン

Tlon は現在の OpenClaw リリースではバンドルされたプラグインとして同梱されているため、通常のパッケージ版
ビルドでは別途インストールは不要です。

古いビルドまたは Tlon を含まないカスタムインストールを使用している場合は、手動で
インストールしてください。

CLI でインストール（npm レジストリ）:

```bash
openclaw plugins install @openclaw/tlon
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugins](/tools/plugin)

## セットアップ

1. Tlon プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. ship URL とログインコードを用意します。
3. `channels.tlon` を設定します。
4. Gateway を再起動します。
5. ボットに DM を送るか、グループチャネルでメンションします。

最小設定（単一アカウント）:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推奨: あなたの ship。常に許可されます
    },
  },
}
```

## プライベート/LAN ship

デフォルトでは、OpenClaw は SSRF 保護のためにプライベート/内部ホスト名と IP 範囲をブロックします。
ship がプライベートネットワーク（localhost、LAN IP、または内部ホスト名）で動作している場合は、
明示的にオプトインする必要があります。

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

これは次のような URL に適用されます。

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ これはローカルネットワークを信頼している場合にのみ有効にしてください。この設定は、
ship URL へのリクエストに対する SSRF 保護を無効にします。

## グループチャネル

自動検出はデフォルトで有効です。チャネルを手動で固定することもできます。

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

自動検出を無効化:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## アクセス制御

DM 許可リスト（空 = DM は許可されません。承認フローには `ownerShip` を使用）:

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ認可（デフォルトでは制限あり）:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## オーナーと承認システム

未承認ユーザーが操作しようとしたときに承認リクエストを受け取るオーナー ship を設定します。

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナー ship は **あらゆる場所で自動的に認可** されます。DM 招待は自動承諾され、
チャネルメッセージは常に許可されます。オーナーを `dmAllowlist` や
`defaultAuthorizedShips` に追加する必要はありません。

設定すると、オーナーは次について DM 通知を受け取ります。

- 許可リストにない ship からの DM リクエスト
- 認可のないチャネルでのメンション
- グループ招待リクエスト

## 自動承諾設定

DM 招待を自動承諾（`dmAllowlist` 内の ship に対して）:

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループ招待を自動承諾:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信ターゲット（CLI/cron）

`openclaw message send` または cron 配信では、次を使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドルされた Skills

Tlon プラグインには、Tlon 操作への CLI アクセスを提供する
バンドルされた Skills（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)）が含まれています。

- **連絡先**: プロフィールの取得/更新、連絡先一覧
- **チャネル**: 一覧、作成、メッセージ投稿、履歴取得
- **グループ**: 一覧、作成、メンバー管理
- **DM**: メッセージ送信、メッセージへのリアクション
- **リアクション**: 投稿と DM への絵文字リアクションの追加/削除
- **設定**: スラッシュコマンド経由でのプラグイン権限管理

この Skills は、プラグインがインストールされると自動的に利用可能になります。

## 機能

| 機能             | ステータス                              |
| ---------------- | --------------------------------------- |
| ダイレクトメッセージ | ✅ サポート済み                         |
| グループ/チャネル | ✅ サポート済み（デフォルトでメンションゲートあり） |
| スレッド         | ✅ サポート済み（スレッド内に自動返信） |
| リッチテキスト   | ✅ Markdown を Tlon 形式に変換          |
| 画像             | ✅ Tlon ストレージにアップロード        |
| リアクション     | ✅ [バンドルされた Skills](#バンドルされた-skills) 経由 |
| Polls            | ❌ 未対応                               |
| ネイティブコマンド | ✅ サポート済み（デフォルトで owner のみ） |

## トラブルシューティング

まず次の手順を実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある失敗:

- **DM が無視される**: 送信者が `dmAllowlist` におらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャネルが検出されていないか、送信者が認可されていません。
- **接続エラー**: ship URL に到達可能か確認してください。ローカル ship の場合は `allowPrivateNetwork` を有効にしてください。
- **認証エラー**: ログインコードが現在有効であることを確認してください（コードはローテーションされます）。

## 設定リファレンス

完全な設定: [Configuration](/gateway/configuration)

プロバイダーオプション:

- `channels.tlon.enabled`: チャネル起動を有効/無効にします。
- `channels.tlon.ship`: ボットの Urbit ship 名（例: `~sampel-palnet`）。
- `channels.tlon.url`: ship URL（例: `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`: ship ログインコード。
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL を許可します（SSRF バイパス）。
- `channels.tlon.ownerShip`: 承認システム用のオーナー ship（常に認可される）。
- `channels.tlon.dmAllowlist`: DM を許可する ship（空 = なし）。
- `channels.tlon.autoAcceptDmInvites`: 許可リスト登録済みの ship からの DM を自動承諾します。
- `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動承諾します。
- `channels.tlon.autoDiscoverChannels`: グループチャネルを自動検出します（デフォルト: true）。
- `channels.tlon.groupChannels`: 手動で固定したチャネル nest。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャネルで認可される ship。
- `channels.tlon.authorization.channelRules`: チャネルごとの認可ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を付加します。

## 注意事項

- グループ返信には応答するためにメンション（例: `~your-bot-ship`）が必要です。
- スレッド返信: 受信メッセージがスレッド内にある場合、OpenClaw はスレッド内で返信します。
- リッチテキスト: Markdown の書式（太字、斜体、コード、見出し、リスト）は Tlon ネイティブ形式に変換されます。
- 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
