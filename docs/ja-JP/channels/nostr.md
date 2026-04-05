---
read_when:
    - OpenClaw が Nostr 経由で DM を受信できるようにしたいとき
    - 分散型メッセージングを設定しているとき
summary: NIP-04 暗号化メッセージ経由の Nostr DM チャネル
title: Nostr
x-i18n:
    generated_at: "2026-04-05T12:36:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**ステータス:** オプションのバンドル済みプラグイン（設定されるまでデフォルトでは無効）。

Nostr はソーシャルネットワーキングのための分散型プロトコルです。このチャネルにより、OpenClaw は NIP-04 を介した暗号化ダイレクトメッセージ（DM）を受信して返信できるようになります。

## バンドル済みプラグイン

現在の OpenClaw リリースでは、Nostr はバンドル済みプラグインとして提供されているため、通常のパッケージ版ビルドでは個別のインストールは不要です。

### 古いインストール / カスタムインストール

- オンボーディング（`openclaw onboard`）と `openclaw channels add` では、共有チャネルカタログから引き続き Nostr が表示されます。
- 使用中のビルドにバンドル済み Nostr が含まれていない場合は、手動でインストールしてください。

```bash
openclaw plugins install @openclaw/nostr
```

ローカルチェックアウトを使用する場合（開発ワークフロー）:

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

プラグインをインストールまたは有効化した後は Gateway を再起動してください。

### 非対話型セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

鍵を config に保存せず環境変数に保持するには、`--use-env` を使用してください。

## クイックセットアップ

1. Nostr のキーペアを生成します（必要な場合）。

```bash
# nak を使用
nak key generate
```

2. config に追加します。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 鍵を export します。

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway を再起動します。

## 設定リファレンス

| Key          | Type     | Default                                     | Description                         |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | 必須                                        | `nsec` または hex 形式の秘密鍵      |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL（WebSocket）              |
| `dmPolicy`   | string   | `pairing`                                   | DM アクセスポリシー                 |
| `allowFrom`  | string[] | `[]`                                        | 許可する送信者 pubkey               |
| `enabled`    | boolean  | `true`                                      | チャネルの有効化 / 無効化           |
| `name`       | string   | -                                           | 表示名                              |
| `profile`    | object   | -                                           | NIP-01 profile metadata             |

## プロファイルメタデータ

プロファイルデータは NIP-01 `kind:0` イベントとして公開されます。Control UI（Channels -> Nostr -> Profile）から管理するか、config に直接設定できます。

例:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注:

- プロファイル URL には `https://` を使用する必要があります。
- relay からのインポートではフィールドがマージされ、ローカルの上書きが保持されます。

## アクセス制御

### DM ポリシー

- **pairing**（デフォルト）: 未知の送信者には pairing code が送られます。
- **allowlist**: `allowFrom` にある pubkey のみが DM を送信できます。
- **open**: 公開の受信 DM（`allowFrom: ["*"]` が必要）。
- **disabled**: 受信 DM を無視します。

適用に関する注記:

- 受信イベントの署名は、送信者ポリシーと NIP-04 復号の前に検証されるため、偽造イベントは早期に拒否されます。
- pairing の返信は、元の DM body を処理せずに送信されます。
- 受信 DM にはレート制限が適用され、サイズ超過のペイロードは復号前に破棄されます。

### allowlist の例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 鍵形式

受け入れられる形式:

- **秘密鍵:** `nsec...` または 64 文字の hex
- **Pubkey (`allowFrom`):** `npub...` または hex

## Relay

デフォルト: `relay.damus.io` と `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

ヒント:

- 冗長性のために 2〜3 個の relay を使用してください。
- relay を増やしすぎないでください（遅延、重複）。
- 有料 relay により信頼性が向上する場合があります。
- テストにはローカル relay も使えます（`ws://localhost:7777`）。

## プロトコルサポート

| NIP    | Status     | Description                        |
| ------ | ---------- | ---------------------------------- |
| NIP-01 | サポート済み | 基本イベント形式 + プロファイルメタデータ |
| NIP-04 | サポート済み | 暗号化 DM（`kind:4`）              |
| NIP-17 | 計画中     | Gift-wrapped DM                    |
| NIP-44 | 計画中     | バージョン付き暗号化               |

## テスト

### ローカル relay

```bash
# strfry を起動
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手動テスト

1. ログから bot の pubkey（npub）を確認します。
2. Nostr クライアント（Damus、Amethyst など）を開きます。
3. bot の pubkey に DM を送ります。
4. 返信を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認してください。
- relay URL に到達可能で、`wss://`（ローカルでは `ws://`）を使っていることを確認してください。
- `enabled` が `false` ではないことを確認してください。
- relay 接続エラーについて Gateway ログを確認してください。

### 返信を送信できない

- relay が書き込みを受け付けていることを確認してください。
- 外向き接続を確認してください。
- relay のレート制限に注意してください。

### 重複返信

- 複数の relay を使用している場合は想定内です。
- メッセージはイベント ID で重複排除され、最初の配信のみが返信を引き起こします。

## セキュリティ

- 秘密鍵は絶対にコミットしないでください。
- 鍵には環境変数を使用してください。
- 本番 bot では `allowlist` を検討してください。
- 署名は送信者ポリシーの前に検証され、送信者ポリシーは復号の前に適用されるため、偽造イベントは早期に拒否され、未知の送信者が完全な暗号処理を強制することはできません。

## 制限事項（MVP）

- ダイレクトメッセージのみ（グループチャットなし）。
- メディア添付なし。
- NIP-04 のみ（NIP-17 gift-wrap は計画中）。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証と pairing フロー
- [Groups](/channels/groups) — グループチャットの動作と mention ゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
