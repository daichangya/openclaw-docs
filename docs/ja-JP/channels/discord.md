---
read_when:
    - Discordチャンネル機能に取り組んでいます
summary: Discordボットのサポート状況、機能、および設定
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

ステータス: 公式のDiscord gateway経由でDMおよびguild channelに対応準備完了。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    DiscordのDMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブなコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいアプリケーションを作成してボットを追加し、そのボットをサーバーに追加してOpenClawにペアリングする必要があります。ボットは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**を選択）。

<Steps>
  <Step title="Discordアプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications)にアクセスし、**New Application**をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの**Bot**をクリックします。**Username**は、自分のOpenClawエージェントの呼び名に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き**Bot**ページで、**Privileged Gateway Intents**までスクロールして次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストおよび名前からIDへの照合に必須）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot**ページの上部に戻り、**Reset Token**をクリックします。

    <Note>
    名前とは異なり、これは最初のトークンを生成するもので、「reset」されるものはありません。
    </Note>

    トークンをコピーしてどこかに保存します。これが**Bot Token**で、すぐに必要になります。

  </Step>

  <Step title="招待URLを生成してボットをサーバーに追加する">
    サイドバーの**OAuth2**をクリックします。サーバーにボットを追加するために、適切な権限を持つ招待URLを生成します。

    **OAuth2 URL Generator**までスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に**Bot Permissions**セクションが表示されます。次を有効にします。

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    下部に生成されたURLをコピーしてブラウザに貼り付け、サーバーを選択して**Continue**をクリックし、接続します。これでDiscordサーバー内にボットが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを取得する">
    Discordアプリに戻り、内部IDをコピーできるようにDeveloper Modeを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）→ **Advanced** → **Developer Mode**をオンにする
    2. サイドバーの**server icon**を右クリック → **Copy Server ID**
    3. 自分の**avatar**を右クリック → **Copy User ID**

    **Server ID**と**User ID**をBot Tokenと一緒に保存してください。次の手順で、この3つすべてをOpenClawに送ります。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでボットがあなたにDMを送れる必要があります。**server icon**を右クリック → **Privacy Settings** → **Direct Messages**をオンにします。

    これにより、サーバーメンバー（ボットを含む）からDMを受け取れるようになります。OpenClawでDiscordのDMを使いたい場合は、これを有効のままにしてください。guild channelだけを使う予定なら、ペアリング後にDMを無効にできます。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しないこと）">
    Discordボットトークンは秘密情報です（パスワードのようなものです）。エージェントにメッセージを送る前に、OpenClawを実行しているマシンで設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClawがすでにバックグラウンドサービスとして実行中の場合は、OpenClaw Mac appから再起動するか、`openclaw gateway run`プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存の任意のチャンネル（例: Telegram）でOpenClawエージェントとチャットして伝えてください。Discordが最初のチャンネルであれば、代わりにCLI / configタブを使用してください。

        > 「Discord bot tokenはすでにconfigに設定しました。User ID `<user_id>` と Server ID `<server_id>` を使ってDiscordのセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースのconfigを使いたい場合は、次のように設定します。

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        デフォルトアカウント用のenvフォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの`token`値にも対応しています。`channels.discord.token`では、env/file/exec provider全体でSecretRef値もサポートされます。詳しくは[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    gatewayが起動するまで待ってから、DiscordでボットにDMを送ってください。ボットがペアリングコードを返します。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネルで、そのペアリングコードをエージェントに送信します。

        > 「このDiscordペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードの有効期限は1時間です。

    これでDM経由でDiscord上のエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。configのトークン値がenvフォールバックより優先されます。`DISCORD_BOT_TOKEN`が使われるのはデフォルトアカウントのみです。
高度な送信呼び出し（message tool/channel actions）では、呼び出しごとの明示的な`token`がその呼び出しに使用されます。これは送信および読み取り/プローブ系のアクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシーやリトライ設定は、アクティブなruntime snapshotで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: guild workspaceを設定する

DMが動作するようになったら、Discordサーバーを完全なworkspaceとして設定できます。各チャンネルはそれぞれ独自のコンテキストを持つ専用のエージェントセッションになります。これは、自分とボットだけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild許可リストに追加する">
    これにより、エージェントはDMだけでなく、サーバー上の任意のチャンネルでも応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「私のDiscord Server ID `<server_id>` をguild許可リストに追加してください」
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mentionなしでの応答を許可する">
    デフォルトでは、guild channelでは@mentionされたときだけエージェントが応答します。プライベートサーバーでは、すべてのメッセージに応答するようにしたい場合が多いはずです。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「このサーバーでは、@mentionしなくてもエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        guild configで`requireMention: false`を設定します。

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="guild channelでのメモリ利用を計画する">
    デフォルトでは、長期メモリ（MEMORY.md）はDMセッションでのみ読み込まれます。guild channelではMEMORY.mdは自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord channelで質問したとき、MEMORY.mdの長期コンテキストが必要ならmemory_searchまたはmemory_getを使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を`AGENTS.md`または`USER.md`に置いてください（これらはすべてのセッションに注入されます）。長期メモは`MEMORY.md`に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

それではDiscordサーバーにいくつかチャンネルを作成して、チャットを始めてください。エージェントはチャンネル名を認識でき、各チャンネルには独立したセッションが割り当てられます。つまり、`#coding`、`#home`、`#research`など、ワークフローに合ったものを設定できます。

## ランタイムモデル

- GatewayがDiscord接続を管理します。
- 返信ルーティングは決定的です。Discordからの受信返信はDiscordに返されます。
- デフォルト（`session.dmScope=main`）では、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- guild channelは分離されたセッションキーです（`agent:<agentId>:discord:channel:<channelId>`）。
- グループDMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションには引き続き`CommandTargetSessionKey`が渡されます。

## フォーラムチャンネル

Discordのforum channelおよびmedia channelは、thread投稿のみ受け付けます。OpenClawはそれらを作成する2つの方法に対応しています。

- forum親にメッセージを送信する（`channel:<forumId>`）と、自動的にthreadが作成されます。threadタイトルにはメッセージ内の最初の空でない行が使われます。
- `openclaw message thread create`を使って直接threadを作成できます。forum channelでは`--message-id`を渡さないでください。

例: forum親に送信してthreadを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: forum threadを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum親はDiscord componentsを受け付けません。componentsが必要な場合は、thread自体（`channel:<threadId>`）に送信してください。

## インタラクティブcomponents

OpenClawは、エージェントメッセージ向けにDiscord components v2 containerをサポートしています。`components`ペイロード付きでmessage toolを使用してください。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存のDiscord `replyToMode`設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action rowでは最大5個のボタン、または単一のselect menuを使用可能
- select type: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、componentsは単回使用です。ボタン、select、formを有効期限まで複数回使えるようにするには、`components.reusable=true`を設定してください。

誰がボタンをクリックできるかを制限するには、そのボタンに`allowedUsers`を設定します（Discord user ID、tag、または`*`）。設定されている場合、一致しないユーザーにはephemeralな拒否メッセージが表示されます。

`/model`および`/models`スラッシュコマンドは、providerとmodelのドロップダウン、およびSubmitステップを備えたインタラクティブなmodel pickerを開きます。pickerの返信はephemeralで、実行したユーザーだけが操作できます。

ファイル添付:

- `file`ブロックは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は`media`/`path`/`filePath`（単一ファイル）で指定してください。複数ファイルには`media-gallery`を使用します
- アップロード名を添付参照と一致させたい場合は、`filename`を使って上書きします

モーダルフォーム:

- 最大5フィールドの`components.modal`を追加します
- フィールド型: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClawはトリガーボタンを自動的に追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "任意のフォールバックテキスト",
  components: {
    reusable: true,
    text: "進む方法を選択",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "承認",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "却下", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "オプションを選択",
          options: [
            { label: "オプション A", value: "a" },
            { label: "オプション B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "詳細",
      triggerLabel: "フォームを開く",
      fields: [
        { type: "text", label: "依頼者" },
        {
          type: "select",
          label: "優先度",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.discord.dmPolicy`はDMアクセスを制御します（旧: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom`に`"*"`を含める必要があります。旧: `channels.discord.dm.allowFrom`）
    - `disabled`

    DMポリシーがopenでない場合、不明なユーザーはブロックされます（または`pairing`モードではペアリングを求められます）。

    複数アカウントでの優先順位:

    - `channels.discord.accounts.default.allowFrom`は`default`アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の`allowFrom`が未設定の場合に`channels.discord.allowFrom`を継承します。
    - 名前付きアカウントは`channels.discord.accounts.default.allowFrom`を継承しません。

    配信時のDMターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    数字だけのIDは曖昧であり、明示的なuser/channelターゲット種別が指定されていない限り拒否されます。

  </Tab>

  <Tab title="Guildポリシー">
    Guildの処理は`channels.discord.groupPolicy`で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`が存在する場合の安全なベースラインは`allowlist`です。

    `allowlist`の動作:

    - guildは`channels.discord.guilds`に一致する必要があります（`id`推奨、slugも可）
    - 送信者の任意の許可リスト: `users`（安定したIDを推奨）および`roles`（ロールIDのみ）。いずれかが設定されている場合、送信者は`users`または`roles`のいずれかに一致すると許可されます
    - 直接の名前/tag一致はデフォルトで無効です。緊急時の互換モードとしてのみ`channels.discord.dangerouslyAllowNameMatching: true`を有効にしてください
    - `users`では名前/tagもサポートされますが、IDのほうが安全です。名前/tagエントリが使われている場合、`openclaw security audit`が警告します
    - guildで`channels`が設定されている場合、一覧にないchannelは拒否されます
    - guildに`channels`ブロックがない場合、その許可リスト入りguild内のすべてのchannelが許可されます

    例:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN`だけを設定し、`channels.discord`ブロックを作成しない場合、たとえ`channels.defaults.groupPolicy`が`open`でも、ランタイムのフォールバックは`groupPolicy="allowlist"`になります（ログに警告が出ます）。

  </Tab>

  <Tab title="メンションとグループDM">
    Guildメッセージはデフォルトでメンション必須です。

    メンション検出には以下が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - 対応ケースにおける暗黙の返信先ボット動作

    `requireMention`はguild/channelごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions`は、別のユーザー/roleにメンションしていてボットにはメンションしていないメッセージを任意で破棄します（@everyone/@hereは除く）。

    グループDM:

    - デフォルト: 無視される（`dm.groupEnabled=false`）
    - 任意で`dm.groupChannels`による許可リストを設定可能（channel IDまたはslug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles`を使うと、Discord guild memberをrole IDによって別のエージェントにルーティングできます。ロールベースのbindingはrole IDのみ受け付け、peerまたはparent-peer bindingの後、guild-only bindingの前に評価されます。bindingに他のmatchフィールド（たとえば`peer` + `guildId` + `roles`）も設定されている場合、設定されたすべてのフィールドが一致する必要があります。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portalのセットアップ

<AccordionGroup>
  <Accordion title="アプリとボットを作成する">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. ボットトークンをコピー

  </Accordion>

  <Accordion title="特権インテント">
    **Bot -> Privileged Gateway Intents**で、次を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intentは任意で、プレゼンス更新を受け取りたい場合にのみ必要です。ボットのプレゼンス設定（`setPresence`）には、メンバー向けのプレゼンス更新を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuthスコープとベースライン権限">
    OAuth URL generator:

    - scope: `bot`, `applications.commands`

    一般的なベースライン権限:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    明示的に必要でない限り、`Administrator`は避けてください。

  </Accordion>

  <Accordion title="IDをコピーする">
    Discord Developer Modeを有効にしてから、次をコピーします。

    - server ID
    - channel ID
    - user ID

    監査とプローブの信頼性のため、OpenClaw configでは数値IDを推奨します。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認可

- `commands.native`のデフォルトは`"auto"`で、Discordでは有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`。
- `commands.native=false`を設定すると、以前登録されたDiscordネイティブコマンドが明示的にクリアされます。
- ネイティブコマンドの認可には、通常のメッセージ処理と同じDiscordの許可リスト/ポリシーが使われます。
- 認可されていないユーザーにもDiscord UI上でコマンドが見える場合がありますが、実行時には引き続きOpenClawの認可が適用され、「not authorized」が返されます。

コマンドカタログと動作については[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discordは、エージェント出力内の返信タグをサポートしています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは`channels.discord.replyToMode`で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off`は暗黙の返信スレッド化を無効にします。明示的な`[[reply_to_*]]`タグは引き続き尊重されます。
    `first`は、このターンの最初の送信Discordメッセージに常に暗黙のネイティブ返信参照を付与します。
    `batched`は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discordの暗黙のネイティブ返信参照を付与します。これは、あいまいで短時間に集中するチャットに対して主にネイティブ返信を使いたく、単一メッセージのターンすべてには使いたくない場合に便利です。

    message IDはコンテキスト/history内に公開されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClawは、一時メッセージを送信し、テキスト到着に合わせて編集することで返信ドラフトをストリーミングできます。

    - `channels.discord.streaming`がプレビューストリーミングを制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）。
    - Discordのプレビュー編集は、特に複数のボットやgatewayが同じアカウントやguildトラフィックを共有している場合、すぐにレート制限に達することがあるため、デフォルトは`off`のままです。
    - `progress`はチャンネル間の一貫性のために受け付けられ、Discordでは`partial`にマッピングされます。
    - `channels.discord.streamMode`は旧エイリアスで、自動移行されます。
    - `partial`では、トークン到着に合わせて単一のプレビューメッセージを編集します。
    - `block`では、ドラフトサイズのチャンクを出力します（サイズと区切りは`draftChunk`で調整）。
    - media、error、明示的返信の最終メッセージは、通常配信の前に一時ドラフトをフラッシュすることなく、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`は、tool/progress更新で同じドラフトプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。tool/progressメッセージを分けたい場合は`false`に設定してください。

    例:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block`モードのチャンク分割デフォルト（`channels.discord.textChunkLimit`に収まるよう制限されます）:

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    プレビューストリーミングはテキスト専用です。media返信は通常配信にフォールバックします。

    注: プレビューストリーミングはblock streamingとは別です。Discordでblock streamingが明示的に有効な場合、OpenClawは二重ストリーミングを避けるためにプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、threadの動作">
    Guild履歴コンテキスト:

    - `channels.discord.historyLimit` デフォルト `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0`で無効化

    DM履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadの動作:

    - Discord threadはchannel sessionとしてルーティングされます
    - 親thread metadataは親セッション連携に使用できます
    - thread固有のエントリが存在しない限り、thread configは親channel configを継承します

    Channel topicは**untrusted**コンテキストとして注入されます（system promptとしてではありません）。
    返信および引用メッセージのコンテキストは現在のところ受信時のまま維持されます。
    Discordの許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、追加コンテキストを完全に秘匿する境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント向けのthreadバインドセッション">
    Discordでは、threadをsession targetにバインドできるため、そのthread内の後続メッセージは同じsession（subagent sessionを含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規threadをsubagent/session targetにバインド
    - `/unfocus` 現在のthread bindingを解除
    - `/agents` アクティブな実行とbinding状態を表示
    - `/session idle <duration|off>` フォーカスされたbindingの非アクティブ時自動unfocusを確認/更新
    - `/session max-age <duration|off>` フォーカスされたbindingの最大有効期間を確認/更新

    Config:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // オプトイン
      },
    },
  },
}
```

    注意:

    - `session.threadBindings.*`はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*`はDiscordの動作を上書きします。
    - `sessions_spawn({ thread: true })`に対してthreadを自動作成/バインドするには、`spawnSubagentSessions`をtrueにする必要があります。
    - ACP（`/acp spawn ... --thread ...`または`sessions_spawn({ runtime: "acp", thread: true })`）に対してthreadを自動作成/バインドするには、`spawnAcpSessions`をtrueにする必要があります。
    - アカウントでthread bindingが無効な場合、`/focus`および関連するthread binding操作は利用できません。

    詳しくは[Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、および[Configuration Reference](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的なACPチャンネルバインディング">
    安定した「常時稼働」ACP workspaceには、Discord会話を対象にするトップレベルの型付きACP bindingを設定します。

    Configパス:

    - `bindings[]`に`type: "acp"`と`match.channel: "discord"`を設定

    例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注意:

    - `/acp spawn codex --bind here`は、現在のDiscord channelまたはthreadをその場でバインドし、以後のメッセージを同じACP sessionにルーティングし続けます。
    - これは「新しいCodex ACP sessionを開始する」という意味になる場合もありますが、それ自体では新しいDiscord threadは作成しません。既存のchannelがそのままチャット画面になります。
    - Codexは、ディスク上の独自の`cwd`またはbackend workspaceで実行される場合があります。そのworkspaceはランタイム状態であり、Discord threadではありません。
    - Threadメッセージは親channelのACP bindingを継承できます。
    - バインドされたchannelまたはthreadでは、`/new`と`/reset`は同じACP sessionをその場でリセットします。
    - 一時的なthread bindingも引き続き機能し、アクティブな間はターゲット解決を上書きできます。
    - `spawnAcpSessions`が必要なのは、OpenClawが`--thread auto|here`によって子threadを作成/バインドする必要がある場合だけです。現在のchannelでの`/acp spawn ... --bind here`には不要です。

    binding動作の詳細は[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guildごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users`を使用）

    リアクションイベントはsystem eventに変換され、ルーティングされたDiscord sessionに付加されます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction`は、OpenClawが受信メッセージを処理中であることを示す確認絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェントidentity絵文字のフォールバック（`agents.list[].identity.emoji`、なければ`"👀"`）

    注意:

    - Discordはunicode絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには`""`を使用します。

  </Accordion>

  <Accordion title="Config書き込み">
    channel起点のconfig書き込みはデフォルトで有効です。

    これは`/config set|unset`フローに影響します（コマンド機能が有効な場合）。

    無効化:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gatewayプロキシ">
    `channels.discord.proxy`を使って、Discord gatewayのWebSocketトラフィックと起動時のRESTルックアップ（application ID + allowlist解決）をHTTP(S)プロキシ経由にします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウントごとの上書き:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKitサポート">
    PluralKit解決を有効にして、プロキシされたメッセージをsystem member identityに対応付けます。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。private systemで必要
      },
    },
  },
}
```

    注意:

    - allowlistでは`pk:<memberId>`を使用できます
    - member表示名は、`channels.discord.dangerouslyAllowNameMatching: true`のときのみ名前/slugで照合されます
    - ルックアップには元のmessage IDが使われ、時間ウィンドウ制約があります
    - ルックアップに失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots=true`でない限り破棄されます

  </Accordion>

  <Accordion title="プレゼンス設定">
    ステータスまたはactivityフィールドを設定したとき、または自動プレゼンスを有効にしたときに、プレゼンス更新が適用されます。

    ステータスのみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activityの例（custom statusがデフォルトのactivity typeです）:

```json5
{
  channels: {
    discord: {
      activity: "集中中",
      activityType: 4,
    },
  },
}
```

    Streamingの例:

```json5
{
  channels: {
    discord: {
      activity: "ライブコーディング",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Activity typeの対応:

    - 0: Playing
    - 1: Streaming（`activityUrl`が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity textをstatus stateとして使用。絵文字は任意）
    - 5: Competing

    自動プレゼンスの例（ランタイム健全性シグナル）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "トークン枯渇",
      },
    },
  },
}
```

    自動プレゼンスはランタイム可用性をDiscordステータスに対応付けます: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}`プレースホルダー対応）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのボタンベース承認処理に対応しており、任意で元のchannelに承認プロンプトを投稿することもできます。

    Configパス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能であれば`commands.ownerAllowFrom`にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discordは、`enabled`が未設定または`"auto"`で、`execApprovals.approvers`または`commands.ownerAllowFrom`のいずれかから少なくとも1人の承認者を解決できる場合、ネイティブexec承認を自動有効化します。Discordは、channelの`allowFrom`、旧`dm.allowFrom`、またはダイレクトメッセージの`defaultTo`からexec承認者を推論しません。Discordをネイティブ承認クライアントとして明示的に無効にするには`enabled: false`を設定してください。

    `target`が`channel`または`both`の場合、承認プロンプトはchannel内に表示されます。解決された承認者だけがボタンを使用でき、他のユーザーにはephemeralな拒否メッセージが表示されます。承認プロンプトにはコマンドテキストが含まれるため、channel配信は信頼できるchannelでのみ有効にしてください。channel IDをsession keyから導出できない場合、OpenClawはDM配信にフォールバックします。

    Discordは、他のチャットチャンネルで使われる共有承認ボタンも描画します。ネイティブDiscord adapterが主に追加するのは、承認者DMルーティングとchannel fanoutです。
    それらのボタンが存在する場合、それが主要な承認UXです。OpenClawは、tool結果でチャット承認が利用できないと示された場合、または手動承認しか手段がない場合にのみ、手動の`/approve`コマンドを含めるべきです。

    このハンドラのGateway authは、他のGateway clientと同じ共有credential解決契約を使用します。

    - env優先のローカルauth（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`の後に`gateway.auth.*`）
    - ローカルモードでは、`gateway.auth.*`が未設定の場合に限り`gateway.remote.*`をフォールバックとして使用可能。設定されているが解決不能なローカルSecretRefはfail closed
    - 該当する場合は`gateway.remote.*`によるremote-modeサポート
    - URL上書きはoverride-safeです。CLI上書きは暗黙のcredentialを再利用せず、env上書きはenv credentialのみを使用します

    承認解決の動作:

    - `plugin:`接頭辞付きIDは`plugin.approval.resolve`経由で解決されます。
    - それ以外のIDは`exec.approval.resolve`経由で解決されます。
    - Discordはここで追加のexec-to-pluginフォールバックホップを行いません。どのgateway methodを呼ぶかはid接頭辞で決まります。

    Exec承認の有効期限はデフォルトで30分です。unknown approval IDで承認が失敗する場合は、承認者解決、機能有効化、配信された承認id種別が保留中リクエストと一致していることを確認してください。

    関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Toolsとアクションゲート

Discord message actionには、メッセージ送信、channel管理、モデレーション、プレゼンス、メタデータ操作が含まれます。

主な例:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create`アクションは、スケジュール済みイベントのカバー画像を設定するための任意の`image`パラメータ（URLまたはローカルファイルパス）を受け付けます。

アクションゲートは`channels.discord.actions.*`配下にあります。

デフォルトのゲート動作:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClawは、exec承認とクロスコンテキストマーカーのためにDiscord components v2を使用します。Discord message actionは、カスタムUI用の`components`も受け付けられます（高度な機能。discord tool経由でcomponent payloadを構築する必要があります）。一方、旧来の`embeds`も引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor`は、Discord component containerで使うアクセントカラー（hex）を設定します。
- アカウントごとには`channels.discord.accounts.<id>.ui.components.accentColor`で設定します。
- components v2が存在する場合、`embeds`は無視されます。

例:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voice channel

OpenClawは、リアルタイムで継続的な会話のためにDiscord voice channelに参加できます。これはvoice message添付とは別機能です。

要件:

- ネイティブコマンドを有効にする（`commands.native`または`channels.discord.commands.native`）。
- `channels.discord.voice`を設定する。
- ボットに対象voice channelでのConnect + Speak権限が必要です。

セッション制御にはDiscord専用のネイティブコマンド`/vc join|leave|status`を使用します。このコマンドはアカウントのデフォルトagentを使い、他のDiscordコマンドと同じallowlistおよびgroup policyルールに従います。

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

注意:

- `voice.tts`は、voice再生に限って`messages.tts`を上書きします。
- Voice transcript turnは、Discordの`allowFrom`（または`dm.allowFrom`）からownerステータスを導出します。ownerでない話者は、owner専用tool（たとえば`gateway`や`cron`）にアクセスできません。
- Voiceはデフォルトで有効です。無効にするには`channels.discord.voice.enabled=false`を設定します。
- `voice.daveEncryption`と`voice.decryptionFailureTolerance`は、`@discordjs/voice`のjoin optionにそのまま渡されます。
- 未設定の場合の`@discordjs/voice`デフォルトは`daveEncryption=true`および`decryptionFailureTolerance=24`です。
- OpenClawは受信時の復号失敗も監視しており、短時間に失敗が繰り返された場合はvoice channelから退出して再参加することで自動復旧します。
- 受信ログに`DecryptionFailed(UnencryptedWhenPassthroughDisabled)`が繰り返し表示される場合、上流の`@discordjs/voice`受信バグである可能性があります。これは[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)で追跡されています。

## Voiceメッセージ

Discordのvoice messageは波形プレビューを表示し、OGG/Opus音声とメタデータを必要とします。OpenClawは波形を自動生成しますが、音声ファイルを検査して変換するために、gateway hostで`ffmpeg`と`ffprobe`が利用可能である必要があります。

要件と制約:

- **ローカルファイルパス**を指定してください（URLは拒否されます）。
- テキストコンテンツは省略してください（Discordは同一payloadでテキスト + voice messageを許可していません）。
- 任意の音声形式を受け付けます。必要に応じてOpenClawがOGG/Opusに変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントを使用した、またはボットがguildメッセージを認識しない">

    - Message Content Intentを有効にする
    - user/member解決に依存している場合はServer Members Intentを有効にする
    - インテント変更後にgatewayを再起動する

  </Accordion>

  <Accordion title="Guildメッセージが予期せずブロックされる">

    - `groupPolicy`を確認する
    - `channels.discord.guilds`配下のguild許可リストを確認する
    - guildの`channels`マップが存在する場合、一覧にあるchannelのみが許可される
    - `requireMention`の動作とメンションパターンを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mentionをfalseにしているのにまだブロックされる">
    よくある原因:

    - 一致するguild/channel許可リストがない状態で`groupPolicy="allowlist"`になっている
    - `requireMention`が誤った場所に設定されている（`channels.discord.guilds`またはchannelエントリ配下である必要があります）
    - 送信者がguild/channelの`users`許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行ハンドラがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener予算の設定項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker実行タイムアウトの設定項目:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30分）。無効にするには`0`を設定

    推奨ベースライン:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    listenerの初期化が遅い場合は`eventQueue.listenerTimeout`を使い、キューされたagent turnに対する別個の安全弁が欲しい場合にのみ`inboundWorker.runTimeoutMs`を使ってください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe`の権限チェックは、数値channel IDでのみ機能します。

    slugキーを使用している場合でもランタイム一致は機能することがありますが、probeでは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DMが無効: `channels.discord.dm.enabled=false`
    - DMポリシーが無効: `channels.discord.dmPolicy="disabled"`（旧: `channels.discord.dm.policy`）
    - `pairing`モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot同士のループ">
    デフォルトでは、botが作成したメッセージは無視されます。

    `channels.discord.allowBots=true`を設定する場合は、ループ動作を避けるために厳格なメンションおよび許可リストルールを使用してください。
    botにメンションしたbotメッセージのみ受け付けるには、`channels.discord.allowBots="mentions"`を推奨します。

  </Accordion>

  <Accordion title="DecryptionFailed(...)によるVoice STTの欠落">

    - Discord voice受信復旧ロジックが含まれるよう、OpenClawを最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）であることを確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集して[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインタ

主なリファレンス:

- [Configuration reference - Discord](/ja-JP/gateway/configuration-reference#discord)

重要度の高いDiscordフィールド:

- 起動/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener予算）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（旧エイリアス: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb`は送信するDiscord uploadの上限です（デフォルト: `100MB`）
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベルの`bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 安全性と運用

- ボットトークンは秘密情報として扱ってください（監視付き環境では`DISCORD_BOT_TOKEN`推奨）。
- 最小権限のDiscord権限を付与してください。
- コマンドのデプロイ/状態が古い場合は、gatewayを再起動し、`openclaw channels status --probe`で再確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [セキュリティ](/ja-JP/gateway/security)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
