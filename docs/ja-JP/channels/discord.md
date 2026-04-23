---
read_when:
    - Discordチャンネル機能に取り組む
summary: Discordボットのサポート状況、機能、および設定
title: Discord
x-i18n:
    generated_at: "2026-04-23T04:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a500da6a2aa080f1c38efd3510bef000abc61059fdc0ff3cb14a62ad292cf9a
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

ステータス: 公式のDiscord gateway経由でDMおよびguildチャンネルに対応済みです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord DMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネルをまたいだ診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいapplicationをbot付きで作成し、そのbotをサーバーに追加して、OpenClawにペアリングする必要があります。botは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord applicationとbotを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications)にアクセスし、**New Application** をクリックします。「OpenClaw」のような名前を付けてください。

    サイドバーで **Bot** をクリックします。**Username** は、自分のOpenClaw agentの呼び名に設定してください。

  </Step>

  <Step title="特権intentを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストおよび名前からIDへの照合に必須）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="bot tokenをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のtokenを生成します。何かが「reset」されるわけではありません。
    </Note>

    tokenをコピーして、どこかに保存してください。これが **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待URLを生成して、botをサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。botをサーバーに追加するための、適切な権限付き招待URLを生成します。

    **OAuth2 URL Generator** までスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。最低でも次を有効にしてください。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネル向けの基本セットです。Discordスレッドに投稿する予定がある場合、forumやmedia channelのワークフローでスレッドを作成または継続するケースも含めて、**Send Messages in Threads** も有効にしてください。
    下部に生成されるURLをコピーし、ブラウザに貼り付けて、サーバーを選択し、**Continue** をクリックして接続します。これでDiscordサーバー内にbotが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを集める">
    Discordアプリに戻り、内部IDをコピーできるようにDeveloper Modeを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **own avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** をBot Tokenと一緒に保存してください。次のステップで、この3つすべてをOpenClawに渡します。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでbotがあなたにDMを送れるようにする必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（botを含む）があなたにDMを送れるようになります。OpenClawでDiscord DMを使いたい場合は、これを有効のままにしてください。guildチャンネルだけを使う予定なら、ペアリング後にDMを無効にしてもかまいません。

  </Step>

  <Step title="bot tokenを安全に設定する（チャットに送信しないでください）">
    Discord bot tokenは秘密情報です（パスワードのようなものです）。agentにメッセージを送る前に、OpenClawを実行しているマシン上で設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClawがすでにバックグラウンドサービスとして動作している場合は、OpenClaw Macアプリから再起動するか、`openclaw gateway run` プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="agentに頼む">
        既存の任意のチャンネル（例: Telegram）でOpenClaw agentとチャットし、次のように伝えます。Discordが最初のチャンネルである場合は、代わりにCLI / configタブを使ってください。

        > 「Discord bot tokenはすでにconfigに設定してあります。User ID `<user_id>` と Server ID `<server_id>` を使ってDiscordセットアップを完了してください。」
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

        平文の `token` 値もサポートされています。`channels.discord.token` では env/file/exec provider 全体でSecretRef値もサポートされています。詳細は[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    gatewayが起動した状態になるまで待ってから、DiscordでbotにDMを送ってください。botはペアリングコードを返します。

    <Tabs>
      <Tab title="agentに頼む">
        既存のチャンネルで、そのペアリングコードをagentに送ります。

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

    これで、Discord上でDM経由でagentとチャットできるようになるはずです。

  </Step>
</Steps>

<Note>
token解決はアカウント対応です。config内のtoken値がenvフォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントでのみ使われます。
高度な送信呼び出し（message tool/channel actions）では、呼び出しごとに明示的な `token` がその呼び出しに使われます。これは送信およびread/probe系アクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシーや再試行設定は、引き続きアクティブなruntime snapshotで選択されたアカウントから取得されます。
</Note>

## 推奨: guildワークスペースを設定する

DMが動作したら、Discordサーバーを完全なワークスペースとして設定できます。各チャンネルが、それぞれ独自のコンテキストを持つ独立したagent sessionになります。あなたとbotだけのプライベートサーバーでは、これをおすすめします。

<Steps>
  <Step title="サーバーをguild許可リストに追加する">
    これにより、agentはDMだけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="agentに頼む">
        > 「自分のDiscord Server ID `<server_id>` をguild許可リストに追加して」
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
    デフォルトでは、agentはguildチャンネル内では @mention されたときだけ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答するようにしたいはずです。

    <Tabs>
      <Tab title="agentに頼む">
        > 「このサーバーでは、@mentioned しなくてもagentが応答できるようにして」
      </Tab>
      <Tab title="Config">
        guild configで `requireMention: false` を設定します。

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

  <Step title="guildチャンネルでのメモリ利用を計画する">
    デフォルトでは、長期メモリ（MEMORY.md）はDM sessionでのみ読み込まれます。guildチャンネルではMEMORY.mdは自動読み込みされません。

    <Tabs>
      <Tab title="agentに頼む">
        > 「Discordチャンネルで質問するとき、MEMORY.mdの長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="Manual">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に書いてください（これらはすべてのsessionに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これでDiscordサーバーにいくつかチャンネルを作成して、チャットを始められます。agentはチャンネル名を認識でき、各チャンネルには独立したsessionが割り当てられるため、`#coding`、`#home`、`#research` など、ワークフローに合った形で設定できます。

## Runtime model

- GatewayがDiscord接続を管理します。
- 返信ルーティングは決定的です。Discordからの受信返信はDiscordに返されます。
- デフォルト（`session.dmScope=main`）では、ダイレクトチャットはagentのmain session（`agent:main:main`）を共有します。
- guildチャンネルは独立したsession keyです（`agent:<agentId>:discord:channel:<channelId>`）。
- Group DMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは独立したcommand session（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、同時にルーティング先の会話sessionへ `CommandTargetSessionKey` も保持します。

## Forum channels

Discordのforumおよびmedia channelは、thread投稿のみ受け付けます。OpenClawはこれを作成する2つの方法をサポートしています。

- forum親 (`channel:<forumId>`) にメッセージを送ってthreadを自動作成する。thread titleには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使ってthreadを直接作成する。forum channelでは `--message-id` を渡さないでください。

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

## Interactive components

OpenClawはagent message向けにDiscord components v2 containerをサポートしています。message toolで `components` payloadを使ってください。interaction結果は通常の受信メッセージとしてagentにルーティングされ、既存のDiscord `replyToMode` 設定に従います。

サポートされるblock:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action rowでは最大5個のbutton、または1つのselect menuを使用可能
- selectの種類: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、componentsは単回使用です。button、select、formを有効期限が切れるまで複数回使えるようにするには、`components.reusable=true` を設定してください。

buttonをクリックできる人を制限するには、そのbuttonに `allowedUsers` を設定します（Discord user ID、tag、または `*`）。設定されている場合、一致しないユーザーにはephemeralの拒否メッセージが返されます。

`/model` および `/models` スラッシュコマンドは、providerとmodelのdropdownに加えてSubmitステップを備えた対話型model pickerを開きます。`commands.modelsWrite=false` でない限り、`/models add` はチャットから新しいprovider/modelエントリの追加もサポートしており、新しく追加したmodelはgatewayの再起動なしで表示されます。pickerの返信はephemeralで、その実行ユーザーだけが利用できます。

ファイル添付:

- `file` blockは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は `media` / `path` / `filePath`（単一ファイル）経由で指定してください。複数ファイルには `media-gallery` を使います
- 添付参照に合わせてアップロード名を変更したい場合は `filename` を使います

モーダルフォーム:

- 最大5個のfieldを持つ `components.modal` を追加
- field type: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClawは自動でtrigger buttonを追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
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
    `channels.discord.dmPolicy` はDMアクセスを制御します（旧: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります。旧: `channels.discord.dm.allowFrom`）
    - `disabled`

    DMポリシーがopenでない場合、不明なユーザーはブロックされます（`pairing` モードではペアリングが促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    配信用のDM target形式:

    - `user:<id>`
    - `<@id>` mention

    数字だけのIDは曖昧であり、明示的なuser/channel target種別が指定されていない限り拒否されます。

  </Tab>

  <Tab title="Guildポリシー">
    guildの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guildは `channels.discord.guilds` に一致している必要があります（`id` を推奨、slugも可）
    - 任意の送信者許可リスト: `users`（安定したIDを推奨）と `roles`（role IDのみ）。どちらかが設定されている場合、送信者は `users` または `roles` のいずれかに一致すれば許可されます
    - 直接の名前/tag照合はデフォルトで無効です。緊急時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/tagもサポートされますが、IDの方が安全です。名前/tagエントリが使われている場合、`openclaw security audit` が警告します
    - guildに `channels` が設定されている場合、一覧にないchannelは拒否されます
    - guildに `channels` ブロックがない場合、その許可リスト済みguild内のすべてのchannelが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、ランタイムのフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。これは `channels.defaults.groupPolicy` が `open` でも同様です。

  </Tab>

  <Tab title="MentionとGroup DM">
    guildメッセージはデフォルトでmention必須です。

    mention検出には次が含まれます。

    - 明示的なbot mention
    - 設定されたmention pattern（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 対応ケースにおける暗黙のreply-to-bot動作

    `requireMention` はguild/channelごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、botではなく別のuser/roleにmentionしているメッセージを任意で破棄します（@everyone/@hereは除く）。

    Group DM:

    - デフォルト: 無視（`dm.groupEnabled=false`）
    - 任意で `dm.groupChannels` による許可リスト指定が可能（channel IDまたはslug）

  </Tab>
</Tabs>

### ロールベースのagentルーティング

`bindings[].match.roles` を使うと、Discord guild memberをrole IDごとに異なるagentへルーティングできます。ロールベースbindingはrole IDのみを受け付け、peerまたはparent-peer bindingの後、guild-only bindingの前に評価されます。bindingに他のmatch field（たとえば `peer` + `guildId` + `roles`）も設定されている場合は、設定されたすべてのfieldが一致する必要があります。

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

## Developer Portalの設定

<AccordionGroup>
  <Accordion title="appとbotを作成する">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. bot tokenをコピーする

  </Accordion>

  <Accordion title="特権intent">
    **Bot -> Privileged Gateway Intents** で次を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intentは任意で、プレゼンス更新を受け取りたい場合にのみ必要です。bot presence（`setPresence`）の設定には、メンバーのプレゼンス更新を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuth scopeと基本権限">
    OAuth URL generator:

    - scope: `bot`, `applications.commands`

    一般的な基本権限:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネル向けの基本セットです。Discordスレッドに投稿する予定がある場合、forumやmedia channelのワークフローでスレッドを作成または継続するケースも含めて、**Send Messages in Threads** も有効にしてください。
    明示的に必要な場合を除き、`Administrator` は避けてください。

  </Accordion>

  <Accordion title="IDをコピーする">
    Discord Developer Modeを有効にしてから、次をコピーします。

    - server ID
    - channel ID
    - user ID

    監査やprobeを確実に行うため、OpenClaw configでは数値IDを推奨します。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discordでは有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`
- `commands.native=false` を指定すると、以前に登録されたDiscordネイティブコマンドを明示的に削除します。
- ネイティブコマンドの認証には、通常のメッセージ処理と同じDiscord許可リスト/ポリシーが使われます。
- 権限のないユーザーにもDiscord UI上でコマンドが見える場合がありますが、実行時には引き続きOpenClawの認証が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discordはagent出力内の返信タグをサポートしています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    制御するのは `channels.discord.replyToMode` です。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのturnにおける最初の送信Discord messageに、暗黙のネイティブ返信参照を常に付与します。
    `batched` は、受信turnが複数メッセージのdebounced batchだった場合にのみ、Discordの暗黙ネイティブ返信参照を付与します。これは、曖昧な短時間連投チャットに対して主にネイティブ返信を使いたく、すべての単一メッセージturnでは使いたくない場合に有用です。

    message IDはcontext/history内に現れるため、agentは特定のmessageを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClawは、一時メッセージを送ってテキスト到着に応じてそれを編集することで、返信ドラフトをストリーミングできます。

    - `channels.discord.streaming` はプレビューのストリーミングを制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）。
    - Discordのプレビュー編集は、特に複数のbotまたはgatewayが同じアカウントやguildトラフィックを共有していると、すぐにレート制限に達する可能性があるため、デフォルトは `off` のままです。
    - `progress` はチャンネル間の一貫性のために受け付けられ、Discordでは `partial` にマップされます。
    - `channels.discord.streamMode` は旧エイリアスで、自動移行されます。
    - `partial` は、token到着に合わせて単一のプレビューメッセージを編集します。
    - `block` はドラフトサイズのchunkを出力します（サイズや区切り方の調整には `draftChunk` を使います）。
    - media、error、明示的返信の最終送信では、通常配信前に一時ドラフトをフラッシュせず、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` は、tool/progress更新でも同じドラフトプレビューメッセージを再利用するかを制御します（デフォルト: `true`）。別個のtool/progressメッセージを維持したい場合は `false` にしてください。

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

    `block` モードのchunkingデフォルト（`channels.discord.textChunkLimit` に収まるよう制限）:

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

    注: プレビューストリーミングはblock streamingとは別です。Discordでblock streamingが明示的に有効になっている場合、OpenClawは二重ストリーミングを避けるためにプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、threadの動作">
    guildの履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    threadの動作:

    - Discord threadはchannel sessionとしてルーティングされます
    - 親thread metadataは親session連携に使用できます
    - thread固有のエントリがない限り、thread configは親channel configを継承します

    channel topicは**信頼されていない**コンテキストとして注入されます（system promptではありません）。
    replyおよびquoted-messageのコンテキストは、現在は受信したまま保持されます。
    Discord許可リストは主に、誰がagentを起動できるかを制御するものであり、完全な補助コンテキスト秘匿境界ではありません。

  </Accordion>

  <Accordion title="subagent向けのthreadバインドsession">
    Discordでは、threadをsession targetにバインドできるため、そのthread内の後続メッセージは同じsession（subagent sessionを含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規threadをsubagent/session targetにバインド
    - `/unfocus` 現在のthread bindingを削除
    - `/agents` アクティブなrunとbinding状態を表示
    - `/session idle <duration|off>` フォーカスされたbindingに対する非アクティブ時の自動unfocusを確認/更新
    - `/session max-age <duration|off>` フォーカスされたbindingに対する最大有効期間を確認/更新

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    注:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` はDiscordの動作を上書きします。
    - `sessions_spawn({ thread: true })` に対してthreadを自動作成/バインドするには、`spawnSubagentSessions` をtrueにする必要があります。
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）に対してthreadを自動作成/バインドするには、`spawnAcpSessions` をtrueにする必要があります。
    - あるアカウントでthread bindingが無効な場合、`/focus` および関連するthread binding操作は利用できません。

    詳細は [Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、および [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的なACPチャンネルbinding">
    安定した「常時稼働」ACPワークスペースには、Discord会話を対象とするトップレベルの型付きACP bindingを設定します。

    Config path:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"` を設定

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

    注:

    - `/acp spawn codex --bind here` は現在のDiscord channelまたはthreadをその場でバインドし、以後のメッセージを同じACP sessionへルーティングし続けます。
    - これは「新しいCodex ACP sessionを開始する」ことを意味する場合がありますが、それ自体では新しいDiscord threadは作成しません。既存のchannelがチャット画面のまま使われます。
    - Codexは引き続き独自の `cwd` またはディスク上のbackend workspaceで動作する場合があります。そのworkspaceはruntime stateであり、Discord threadではありません。
    - threadメッセージは親channelのACP bindingを継承できます。
    - バインド済みchannelまたはthreadでは、`/new` と `/reset` は同じACP sessionをその場でリセットします。
    - 一時的なthread bindingも引き続き機能し、有効な間はtarget解決を上書きできます。
    - `spawnAcpSessions` は、OpenClawが `--thread auto|here` で子threadを作成/バインドする必要がある場合にのみ必要です。現在のchannelでの `/acp spawn ... --bind here` には不要です。

    binding動作の詳細は [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guildごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはsystem eventに変換され、ルーティング先のDiscord sessionに添付されます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理している間、確認用の絵文字を送ります。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注:

    - Discordはunicode絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使ってください。

  </Accordion>

  <Accordion title="Config書き込み">
    チャンネル起点のconfig書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します（コマンド機能が有効な場合）。

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

  <Accordion title="Gateway proxy">
    `channels.discord.proxy` を使うと、Discord gatewayのWebSocketトラフィックと起動時のREST参照（application ID + allowlist解決）をHTTP(S) proxy経由にできます。

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
    proxied messageをsystem member identityにマッピングするPluralKit解決を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。プライベートsystemで必要
      },
    },
  },
}
```

    注:

    - allowlistでは `pk:<memberId>` を使用できます
    - member display nameは `channels.discord.dangerouslyAllowNameMatching: true` のときのみ名前/slugで一致します
    - lookupは元のmessage IDを使い、時間ウィンドウ制約があります
    - lookupに失敗した場合、proxied messageはbot messageとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Presence設定">
    statusまたはactivity fieldを設定したとき、またはauto presenceを有効にしたときに、presence更新が適用されます。

    statusのみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    activityの例（custom statusがデフォルトのactivity typeです）:

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    streamingの例:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    activity typeの対応:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity textをstatus stateとして使用。絵文字は任意）
    - 5: Competing

    auto presenceの例（runtime health signal）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    auto presenceはruntime availabilityをDiscord statusにマッピングします: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のtext上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのbuttonベース承認処理をサポートしており、必要に応じて元のchannelに承認プロンプトを投稿することもできます。

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能なら `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも1人の承認者を解決できる場合、Discordはネイティブexec approvalsを自動有効化します。Discordは、channel `allowFrom`、旧 `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` からexec approverを推論しません。Discordをネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認プロンプトはchannel内に表示されます。buttonを使えるのは解決済みの承認者だけで、その他のユーザーにはephemeralの拒否が返されます。承認プロンプトにはコマンド本文が含まれるため、channel配信は信頼できるchannelでのみ有効にしてください。session keyからchannel IDを導出できない場合、OpenClawはDM配信にフォールバックします。

    Discordは、他のチャットチャンネルで使われる共通の承認buttonもレンダリングします。ネイティブDiscord adapterが主に追加するのは、承認者DMルーティングとchannel fanoutです。
    それらのbuttonが存在する場合、それが主要な承認UXになります。OpenClaw
    は、tool resultでチャット承認が利用不可と示された場合、または手動承認が唯一の手段である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    このhandlerのGateway authは、他のGateway clientと同じ共有credential解決契約を使います。

    - env優先のローカルauth（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` の後に `gateway.auth.*`）
    - ローカルモードでは、`gateway.auth.*` が未設定のときのみ `gateway.remote.*` をフォールバックとして使用可能。設定済みだが未解決のローカルSecretRefはfail closedになります
    - 該当する場合は `gateway.remote.*` によるremote-modeサポート
    - URL overrideはoverride-safeです。CLI overrideは暗黙credentialを再利用せず、env overrideはenv credentialのみを使います

    承認解決の動作:

    - `plugin:` 接頭辞付きIDは `plugin.approval.resolve` 経由で解決されます。
    - それ以外のIDは `exec.approval.resolve` 経由で解決されます。
    - Discordはここで追加のexec-to-pluginフォールバックは行いません。どのgateway methodを呼ぶかはid
      接頭辞で決まります。

    Exec approvalのデフォルト有効期限は30分です。未知のapproval IDで承認に失敗する場合は、approver解決、機能有効化、および配信されたapproval id種別が保留中リクエストと一致していることを確認してください。

    関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Toolsとaction gate

Discord message actionには、メッセージ送信、channel管理、モデレーション、presence、metadata actionが含まれます。

主な例:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` actionは、予定イベントのカバー画像を設定するための任意の `image` パラメータ（URLまたはローカルファイルパス）を受け付けます。

action gateは `channels.discord.actions.*` 配下にあります。

デフォルトのgate動作:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClawは、exec approvalsとクロスコンテキストマーカーにDiscord components v2を使います。Discord message actionは、カスタムUI用に `components` も受け付けます（高度な用途。discord tool経由でcomponent payloadを構築する必要があります）。一方、旧来の `embeds` も引き続き使えますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component containerで使うaccent color（hex）を設定します。
- アカウントごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor` で行います。
- components v2が存在する場合、`embeds` は無視されます。

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

## Voice channels

OpenClawは、リアルタイムで継続的な会話のためにDiscord voice channelに参加できます。これはvoice message attachmentとは別機能です。

要件:

- ネイティブコマンドを有効にします（`commands.native` または `channels.discord.commands.native`）。
- `channels.discord.voice` を設定します。
- botには対象voice channelで Connect + Speak 権限が必要です。

Discord専用のネイティブコマンド `/vc join|leave|status` を使ってsessionを制御します。このコマンドはアカウントのデフォルトagentを使い、他のDiscordコマンドと同じ許可リストおよびgroup policyルールに従います。

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

注:

- `voice.tts` は、voice playbackに限って `messages.tts` を上書きします。
- voice transcript turnは、Discord `allowFrom`（または `dm.allowFrom`）からowner statusを導出します。ownerでない話者はowner専用tool（たとえば `gateway` や `cron`）にアクセスできません。
- voiceはデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定してください。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` のjoin optionにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定時に `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- OpenClawは受信復号失敗も監視しており、短時間に失敗が繰り返された場合はvoice channelから退出して再参加することで自動復旧します。
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合、これは [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されている上流の `@discordjs/voice` 受信バグの可能性があります。

## Voice messages

Discordのvoice messageは波形プレビューを表示し、OGG/Opus音声とmetadataを必要とします。OpenClawは波形を自動生成しますが、音声ファイルを検査・変換するためにgateway hostで `ffmpeg` と `ffprobe` が利用可能である必要があります。

要件と制約:

- **ローカルファイルパス** を指定してください（URLは拒否されます）。
- テキスト内容は省略してください（Discordでは同一payloadでテキスト + voice message は許可されません）。
- どの音声形式でも受け付けます。必要に応じてOpenClawがOGG/Opusへ変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないintentを使っている、またはbotがguild messageを認識しない">

    - Message Content Intent を有効にする
    - user/member解決に依存する場合は Server Members Intent を有効にする
    - intent変更後にgatewayを再起動する

  </Accordion>

  <Accordion title="Guild messageが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のguild許可リストを確認する
    - guildの `channels` mapが存在する場合、一覧にあるchannelだけが許可される
    - `requireMention` の動作とmention patternを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mentionがfalseなのにまだブロックされる">
    よくある原因:

    - 一致するguild/channel許可リストがない状態で `groupPolicy="allowlist"` になっている
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはchannel entry配下である必要があります）
    - 送信者がguild/channelの `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行handlerがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener budgetノブ:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker実行タイムアウトノブ:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30分）。無効化するには `0` を設定

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

    `eventQueue.listenerTimeout` は遅いlistenerセットアップに使い、`inboundWorker.runTimeoutMs`
    は、キュー済みagent turnに別の安全弁を設けたい場合にのみ使ってください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは数値channel IDでのみ機能します。

    slug keyを使っている場合、runtimeでの一致は機能しても、probeでは権限を完全に検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DM無効: `channels.discord.dm.enabled=false`
    - DMポリシー無効: `channels.discord.dmPolicy="disabled"`（旧: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="Bot同士のループ">
    デフォルトではbot作成messageは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格なmentionおよびallowlistルールを使ってください。
    botにmentionしたbot messageのみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="Voice STTが DecryptionFailed(...) で途切れる">

    - Discord voice受信の復旧ロジックが含まれるよう、OpenClawを最新に保ってください（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true` を確認する（デフォルト）
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合のみ調整する
    - 次のログを確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集して [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較してください

  </Accordion>
</AccordionGroup>

## Configuration Referenceの参照先

主要な参照先:

- [Configuration reference - Discord](/ja-JP/gateway/configuration-reference#discord)

重要なDiscord field:

- 起動/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener budget）、`eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（旧エイリアス: `streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` はDiscordへの送信upload上限を設定します（デフォルト: `100MB`）
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 安全性と運用

- bot tokenは秘密情報として扱ってください（監視環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限のDiscord permissionを付与してください。
- コマンド配備/状態が古い場合は、gatewayを再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Security](/ja-JP/gateway/security)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
- [Slash commands](/ja-JP/tools/slash-commands)
