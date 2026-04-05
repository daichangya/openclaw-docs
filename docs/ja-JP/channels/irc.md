---
read_when:
    - OpenClaw を IRC チャネルまたは DM に接続したいとき
    - IRC の許可リスト、グループポリシー、またはメンションゲートを設定しているとき
summary: IRC プラグインのセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-04-05T12:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

クラシックなチャネル（`#room`）やダイレクトメッセージで OpenClaw を使いたい場合は IRC を使用します。
IRC は拡張プラグインとして提供されますが、設定はメイン設定の `channels.irc` で行います。

## クイックスタート

1. `~/.openclaw/openclaw.json` で IRC 設定を有効にします。
2. 少なくとも次を設定します。

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

ボット連携には、プライベートな IRC サーバーを推奨します。意図的に公開 IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットや swarm のバックチャネル通信には、予測しやすい公開チャネルを避けてください。

3. Gateway を起動または再起動します。

```bash
openclaw gateway run
```

## 既定のセキュリティ設定

- `channels.irc.dmPolicy` の既定値は `"pairing"` です。
- `channels.irc.groupPolicy` の既定値は `"allowlist"` です。
- `groupPolicy="allowlist"` の場合は、許可するチャネルを定義するために `channels.irc.groups` を設定します。
- 平文転送を意図的に許可するのでない限り、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャネルには、2 つの独立した「ゲート」があります。

1. **チャネルアクセス**（`groupPolicy` + `groups`）: そのチャネルからのメッセージをボットが受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャネルごとの `groups["#channel"].allowFrom`）: そのチャネル内で誰がボットをトリガーできるか。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャネルごとの制御（チャネル + 送信者 + メンションルール）: `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` は未設定のチャネルを許可します（**それでも既定ではメンションゲートが有効です**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
ニックネームだけの一致は変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。

### よくある落とし穴: `allowFrom` は DM 用であり、チャネル用ではない

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、その送信者が**グループ/チャネル**メッセージとしては許可されていないことを意味します。次のいずれかで修正してください。

- `channels.irc.groupAllowFrom` を設定する（すべてのチャネルに対するグローバル設定）
- チャネルごとの送信者許可リストを設定する: `channels.irc.groups["#channel"].allowFrom`

例（`#tuirc-dev` 内の誰でもボットに話しかけられるようにする）:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 返信トリガー（メンション）

チャネルが許可されていて（`groupPolicy` + `groups`）、送信者も許可されていても、OpenClaw はグループコンテキストでは既定で**メンションゲート**を使います。

つまり、メッセージにボットへ一致するメンションパターンが含まれていない限り、`drop channel … (missing-mention)` のようなログが表示されることがあります。

IRC チャネルで**メンションなしで**ボットに返信させたい場合は、そのチャネルのメンションゲートを無効にします。

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

または、**すべての** IRC チャネルを許可し（チャネルごとの許可リストなし）、なおかつメンションなしで返信させるには:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## セキュリティに関する注意（公開チャネルで推奨）

公開チャネルで `allowFrom: ["*"]` を許可すると、誰でもボットをプロンプトできます。
リスクを減らすには、そのチャネルで使えるツールを制限してください。

### チャネル内の全員に同じツールを適用する

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 送信者ごとに異なるツールを適用する（オーナーにはより強い権限を付与）

`toolsBySender` を使うと、`"*"` にはより厳しいポリシーを適用し、自分のニックにはより緩いポリシーを適用できます。

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

注意:

- `toolsBySender` のキーには、IRC 送信者 ID 値として `id:` を使用してください:
  `id:eigen`、またはより強い一致には `id:eigen!~eigen@174.127.248.171` を使います。
- 従来の接頭辞なしキーも引き続き受け付けられますが、`id:` としてのみ一致します。
- 最初に一致した送信者ポリシーが優先され、`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲート（およびそれらの相互作用）の詳細は、[/channels/groups](/channels/groups)を参照してください。

## NickServ

接続後に NickServ で認証するには:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

接続時の任意の 1 回限りの登録:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

ニックネームの登録後は、`register` を無効にして、`REGISTER` の繰り返し試行を避けてください。

## 環境変数

既定のアカウントで次をサポートします。

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（カンマ区切り）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## トラブルシューティング

- ボットは接続するのにチャネルでまったく返信しない場合は、`channels.irc.groups` **と** メンションゲートによってメッセージが落とされていないか（`missing-mention`）を確認してください。ping なしで返信させたい場合は、そのチャネルに `requireMention:false` を設定します。
- ログインに失敗する場合は、ニックネームの利用可否とサーバーパスワードを確認してください。
- カスタムネットワークで TLS に失敗する場合は、ホスト/ポートと証明書設定を確認してください。

## 関連

- [チャネル概要](/channels) — サポートされているすべてのチャネル
- [ペアリング](/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/gateway/security) — アクセスモデルとハードニング
