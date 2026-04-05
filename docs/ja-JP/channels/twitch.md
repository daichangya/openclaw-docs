---
read_when:
    - OpenClaw向けにTwitch chat連携をセットアップする場合
summary: Twitch chat botの設定とセットアップ
title: Twitch
x-i18n:
    generated_at: "2026-04-05T12:37:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

IRC接続によるTwitch chatサポート。OpenClawはTwitchユーザー（bot account）として接続し、channelsでメッセージを受信・送信します。

## 同梱plugin

Twitchは現在のOpenClawリリースでは同梱pluginとして提供されるため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルド、またはTwitchを除外したカスタムインストールを使っている場合は、
手動でインストールしてください。

CLI経由でインストール（npm registry）:

```bash
openclaw plugins install @openclaw/twitch
```

ローカルcheckout（git repoから実行している場合）:

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

詳細: [Plugins](/tools/plugin)

## クイックセットアップ（初心者向け）

1. Twitch pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記コマンドで手動追加できます。
2. bot専用のTwitch accountを作成します（または既存のaccountを使います）。
3. 認証情報を生成します: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token**を選択
   - `chat:read`と`chat:write`のscopeが選択されていることを確認
   - **Client ID**と**Access Token**をコピー
4. Twitch user IDを調べます: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. tokenを設定します:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`（default accountのみ）
   - またはconfig: `channels.twitch.accessToken`
   - 両方設定されている場合は、configが優先されます（envフォールバックはdefault accountのみ）。
6. Gatewayを起動します。

**⚠️ 重要:** 未承認ユーザーがbotをトリガーできないように、アクセス制御（`allowFrom`または`allowedRoles`）を追加してください。`requireMention`のデフォルトは`true`です。

最小構成:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // BotのTwitch account
      accessToken: "oauth:abc123...", // OAuth Access Token（または OPENCLAW_TWITCH_ACCESS_TOKEN env var を使用）
      clientId: "xyz789...", // Token GeneratorのClient ID
      channel: "vevisk", // 参加するTwitch channelのchat（必須）
      allowFrom: ["123456789"], // （推奨）自分のTwitch user IDのみ - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ で取得
    },
  },
}
```

## 概要

- Gatewayが所有するTwitch channelです。
- 決定的ルーティング: 返信は常にTwitchへ戻ります。
- 各accountは独立したsession key `agent:<agentId>:twitch:<accountName>` に対応します。
- `username`はbotのaccount（認証する主体）、`channel`は参加するchat roomです。

## セットアップ（詳細）

### 認証情報を生成する

[Twitch Token Generator](https://twitchtokengenerator.com/)を使用します。

- **Bot Token**を選択
- `chat:read`と`chat:write`のscopeが選択されていることを確認
- **Client ID**と**Access Token**をコピー

手動のapp登録は不要です。tokenは数時間後に期限切れになります。

### botを設定する

**Env var（default accountのみ）:**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**またはconfig:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

envとconfigの両方が設定されている場合は、configが優先されます。

### アクセス制御（推奨）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // （推奨）自分のTwitch user IDのみ
    },
  },
}
```

厳格なallowlistには`allowFrom`を推奨します。roleベースのアクセスにしたい場合は、代わりに`allowedRoles`を使ってください。

**利用可能なroles:** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**なぜuser IDなのか?** usernameは変更できるため、なりすましが可能になります。user IDは恒久的です。

Twitch user IDを調べる: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（Twitch usernameをIDに変換）

## token更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/)のtokenは自動更新できません。期限切れになったら再生成してください。

tokenを自動更新したい場合は、[Twitch Developer Console](https://dev.twitch.tv/console)で独自のTwitch applicationを作成し、configに次を追加します。

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

botは有効期限前に自動でtokenを更新し、更新イベントをログに記録します。

## マルチaccountサポート

accountごとのtokenには`channels.twitch.accounts`を使用します。共有パターンについては[`gateway/configuration`](/gateway/configuration)を参照してください。

例（1つのbot accountを2つのchannelsで使用）:

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**注:** 各accountには独自のtokenが必要です（channelごとに1つのtoken）。

## アクセス制御

### roleベースの制限

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### User IDによるallowlist（最も安全）

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### roleベースのアクセス（代替）

`allowFrom`は厳格なallowlistです。設定されている場合、それらのuser IDのみが許可されます。
roleベースのアクセスにしたい場合は、`allowFrom`を未設定のままにして、代わりに`allowedRoles`を設定してください。

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @mention必須を無効にする

デフォルトでは`requireMention`は`true`です。無効にしてすべてのメッセージに応答するには:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## トラブルシューティング

まず、診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

### botがメッセージに応答しない

**アクセス制御を確認:** 自分のuser IDが`allowFrom`に含まれていることを確認するか、テストのために一時的に
`allowFrom`を外して`allowedRoles: ["all"]`を設定してください。

**botがchannelに入っていることを確認:** botは`channel`で指定されたchannelに参加している必要があります。

### tokenの問題

**「Failed to connect」または認証エラー:**

- `accessToken`がOAuth access tokenの値であることを確認してください（通常は`oauth:`プレフィックスで始まります）
- tokenに`chat:read`と`chat:write`のscopeがあることを確認してください
- token更新を使っている場合は、`clientSecret`と`refreshToken`が設定されていることを確認してください

### token更新が機能しない

**更新イベントのログを確認:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

「token refresh disabled (no refresh token)」と表示される場合:

- `clientSecret`が提供されていることを確認してください
- `refreshToken`が提供されていることを確認してください

## Config

**Account config:**

- `username` - Bot username
- `accessToken` - `chat:read`と`chat:write`を持つOAuth access token
- `clientId` - Twitch Client ID（Token Generatorまたは独自appから）
- `channel` - 参加するchannel（必須）
- `enabled` - このaccountを有効化（デフォルト: `true`）
- `clientSecret` - 任意: token自動更新用
- `refreshToken` - 任意: token自動更新用
- `expiresIn` - tokenの有効期限（秒）
- `obtainmentTimestamp` - token取得タイムスタンプ
- `allowFrom` - user ID allowlist
- `allowedRoles` - roleベースのアクセス制御（`"moderator" | "owner" | "vip" | "subscriber" | "all"`）
- `requireMention` - @mention必須（デフォルト: `true`）

**Provider options:**

- `channels.twitch.enabled` - channel起動の有効/無効
- `channels.twitch.username` - Bot username（簡略化された単一account config）
- `channels.twitch.accessToken` - OAuth access token（簡略化された単一account config）
- `channels.twitch.clientId` - Twitch Client ID（簡略化された単一account config）
- `channels.twitch.channel` - 参加するchannel（簡略化された単一account config）
- `channels.twitch.accounts.<accountName>` - マルチaccount config（上記のすべてのaccountフィールド）

完全な例:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool actions

agentは次のactionで`twitch`を呼び出せます。

- `send` - channelにメッセージを送信

例:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全性と運用

- **tokenはパスワードとして扱う** - tokenをgitにコミットしないでください
- **長時間動作するbotには自動token更新を使う**
- **アクセス制御にはusernameではなくuser ID allowlistを使う**
- **ログを監視する** - token更新イベントと接続状態を確認してください
- **tokenのscopeは最小限にする** - `chat:read`と`chat:write`のみを要求してください
- **行き詰まった場合**: 他のプロセスがsessionを所有していないことを確認してからGatewayを再起動してください

## 制限

- **1メッセージあたり500文字**（単語境界で自動分割）
- chunking前にMarkdownは除去されます
- レート制限なし（Twitch組み込みのレート制限を使用）

## 関連

- [Channels Overview](/channels) — サポートされているすべてのchannels
- [Pairing](/channels/pairing) — DM認証とペアリングフロー
- [Groups](/channels/groups) — グループchatの挙動とmentionゲート
- [Channel Routing](/channels/channel-routing) — メッセージのsessionルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
