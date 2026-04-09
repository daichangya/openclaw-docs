---
read_when:
    - Discordチャネル機能に取り組んでいるとき
summary: Discordボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-09T01:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3cd2886fad941ae2129e681911309539e9a65a2352b777b538d7f4686a68f73f
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

ステータス: 公式Discord gateway経由でDMとguild channelに対応済みです。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Discord DMはデフォルトでペアリングモードです。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいapplicationをbot付きで作成し、そのbotを自分のサーバーに追加して、OpenClawにペアリングする必要があります。botは自分専用のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord applicationとbotを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications)にアクセスし、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** を、OpenClaw agentに付けている名前に設定します。

  </Step>

  <Step title="特権intentを有効にする">
    **Bot** ページのまま、**Privileged Gateway Intents** までスクロールし、以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロールallowlistと名前からIDへの照合に必要）
    - **Presence Intent**（任意。presence更新が必要な場合のみ）

  </Step>

  <Step title="bot tokenをコピーする">
    **Bot** ページの上部まで戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のtokenを生成するものであり、何かが「reset」されるわけではありません。
    </Note>

    tokenをコピーして、どこかに保存します。これが **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待URLを生成してbotをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。サーバーにbotを追加するために必要な権限を持つ招待URLを生成します。

    **OAuth2 URL Generator** までスクロールし、以下を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。以下を有効にします。

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    下部に生成されたURLをコピーし、ブラウザに貼り付けて、自分のサーバーを選び、**Continue** をクリックして接続します。これでDiscordサーバーにbotが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを集める">
    Discordアプリに戻り、内部IDをコピーできるようにDeveloper Modeを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** をBot Tokenと一緒に保存してください。次のステップで、この3つすべてをOpenClawに渡します。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでbotがあなたにDMを送れる必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（botを含む）があなたにDMを送れるようになります。OpenClawでDiscord DMを使いたい場合は、これを有効のままにしてください。guild channelのみを使う予定なら、ペアリング後にDMを無効にできます。

  </Step>

  <Step title="bot tokenを安全に設定する（chatで送信しない）">
    Discord bot tokenは秘密情報です（パスワードのようなものです）。agentにメッセージを送る前に、OpenClawを実行しているマシンで設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClawがすでにバックグラウンドサービスとして実行中なら、OpenClaw Mac app経由、または `openclaw gateway run` プロセスを停止して再起動して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="Ask your agent">
        既存の任意のチャネル（例: Telegram）でOpenClaw agentと会話し、次のように伝えます。Discordが最初のチャネルである場合は、代わりにCLI / configタブを使ってください。

        > 「Discord bot tokenはすでにconfigに設定しました。User ID `<user_id>` と Server ID `<server_id>` でDiscordのセットアップを完了してください。」
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

        デフォルトaccount用のenv fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの `token` 値もサポートされています。`channels.discord.token` では、env/file/exec provider全体でSecretRef値もサポートされています。詳しくは[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    gatewayが起動するまで待ってから、DiscordでbotにDMを送ってください。ペアリングコードが返ってきます。

    <Tabs>
      <Tab title="Ask your agent">
        既存チャネル上のagentにペアリングコードを送ります。

        > 「このDiscord pairing codeを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは1時間で期限切れになります。

    これで、DiscordのDM経由でagentと会話できるようになるはずです。

  </Step>
</Steps>

<Note>
token解決はaccount認識対応です。configのtoken値がenv fallbackより優先されます。`DISCORD_BOT_TOKEN` はdefault accountでのみ使用されます。
高度なoutbound call（message tool/channel action）では、明示的な呼び出し単位の `token` がその呼び出しに使われます。これは送信系とread/probe系のaction（たとえばread/search/fetch/thread/pins/permissions）に適用されます。account policy/retry設定は、アクティブなruntime snapshot内で選択されたaccountから引き続き取得されます。
</Note>

## 推奨: guild workspaceを設定する

DMが機能するようになったら、Discordサーバーを完全なworkspaceとして設定できます。各channelが独自のcontextを持つ独立したagent sessionになります。これは、自分と自分のbotだけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild allowlistに追加する">
    これにより、agentはDMだけでなく、サーバー上の任意のchannelで応答できるようになります。

    <Tabs>
      <Tab title="Ask your agent">
        > 「自分のDiscord Server ID `<server_id>` をguild allowlistに追加してください」
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

  <Step title="@mentionなしでも応答できるようにする">
    デフォルトでは、agentはguild channel内では@mentionされたときだけ応答します。プライベートサーバーでは、すべてのメッセージに応答させたい場合が多いでしょう。

    <Tabs>
      <Tab title="Ask your agent">
        > 「このサーバーで、自分のagentが@mentionなしでも応答できるようにしてください」
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

  <Step title="guild channelでのmemoryを計画する">
    デフォルトでは、長期memory（MEMORY.md）はDM sessionでのみ読み込まれます。guild channelではMEMORY.mdは自動読み込みされません。

    <Tabs>
      <Tab title="Ask your agent">
        > 「Discord channelで質問するとき、MEMORY.mdから長期contextが必要ならmemory_searchまたはmemory_getを使ってください。」
      </Tab>
      <Tab title="Manual">
        すべてのchannelで共有contextが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置いてください（これらはすべてのsessionに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これで、Discordサーバーにいくつかchannelを作成して会話を始められます。agentはchannel名を認識でき、各channelは独立したsessionを持つので、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## Runtime model

- GatewayがDiscord接続を管理します。
- 返信ルーティングは決定的です: Discordのinbound replyはDiscordに返されます。
- デフォルト（`session.dmScope=main`）では、direct chatはagentのmain session（`agent:main:main`）を共有します。
- Guild channelは独立したsession keyです（`agent:<agentId>:discord:channel:<channelId>`）。
- Group DMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブslash commandは独立したcommand session（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティングされた会話sessionへの `CommandTargetSessionKey` は保持されます。

## Forum channels

Discord forumとmedia channelはthread postのみ受け付けます。OpenClawはそれらを作成する2つの方法をサポートしています。

- forum親（`channel:<forumId>`）にメッセージを送信すると、自動でthreadが作成されます。thread titleには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使って直接threadを作成します。forum channelには `--message-id` を渡さないでください。

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

forum親はDiscord componentを受け付けません。componentが必要な場合は、thread自体（`channel:<threadId>`）に送信してください。

## Interactive components

OpenClawはagent message向けにDiscord components v2 containerをサポートしています。`components` payload付きでmessage toolを使ってください。interaction結果は通常のinbound messageとしてagentにルーティングされ、既存のDiscord `replyToMode` 設定に従います。

サポートされるblock:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action rowでは最大5個のbutton、または単一のselect menuを使用可能
- select type: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、componentは単回使用です。期限切れまでbutton、select、formを複数回使えるようにするには、`components.reusable=true` を設定してください。

buttonをクリックできるユーザーを制限するには、そのbuttonに `allowedUsers` を設定します（Discord user ID、tag、または `*`）。設定されている場合、一致しないユーザーにはephemeralな拒否が返されます。

`/model` と `/models` slash commandは、providerとmodelのdropdownにSubmit手順を加えたインタラクティブなmodel pickerを開きます。pickerの返信はephemeralで、起動したユーザー本人だけが使用できます。

ファイル添付:

- `file` blockはattachment参照（`attachment://<filename>`）を指している必要があります
- `media`/`path`/`filePath`（単一ファイル）でattachmentを指定します。複数ファイルには `media-gallery` を使ってください
- upload名をattachment参照に一致させたい場合は、`filename` を使って上書きします

Modal form:

- 最大5個のfieldを持つ `components.modal` を追加します
- field type: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClawがtrigger buttonを自動で追加します

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` はDMアクセスを制御します（legacy: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります。legacy: `channels.discord.dm.allowFrom`）
    - `disabled`

    DM policyがopenでない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングが促されます）。

    複数accountの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` accountにのみ適用されます。
    - 名前付きaccountは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きaccountは `channels.discord.accounts.default.allowFrom` は継承しません。

    配信用DM target format:

    - `user:<id>`
    - `<@id>` mention

    種別が明示されたuser/channel targetがない限り、数値だけのIDは曖昧なため拒否されます。

  </Tab>

  <Tab title="Guild policy">
    guild処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なbaselineは `allowlist` です。

    `allowlist` の動作:

    - guildは `channels.discord.guilds` に一致する必要があります（`id` 推奨、slugも可）
    - 任意の送信者allowlist: `users`（安定したID推奨）と `roles`（role IDのみ）。どちらかが設定されている場合、送信者は `users` または `roles` のいずれかに一致すれば許可されます
    - 直接の名前/tag一致はデフォルトで無効です。緊急互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` には名前/tagも使えますが、IDの方が安全です。名前/tagの項目が使われていると `openclaw security audit` が警告します
    - guildに `channels` が設定されている場合、一覧にないchannelは拒否されます
    - guildに `channels` blockがない場合、そのallowlist済みguild内のすべてのchannelが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定して `channels.discord` blockを作成しない場合、runtime fallbackは `groupPolicy="allowlist"` になります（ログに警告あり）。これは `channels.defaults.groupPolicy` が `open` でも同様です。

  </Tab>

  <Tab title="Mentions and group DMs">
    guild messageはデフォルトでmention gatedです。

    mention検出には以下が含まれます。

    - 明示的なbot mention
    - 設定されたmention pattern（`agents.list[].groupChat.mentionPatterns`、fallbackは `messages.groupChat.mentionPatterns`）
    - 対応ケースでの暗黙のreply-to-bot動作

    `requireMention` はguild/channelごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のuser/roleにはmentionしているがbotにはmentionしていないmessageを任意で破棄します（@everyone/@hereを除く）。

    Group DM:

    - デフォルト: 無視（`dm.groupEnabled=false`）
    - 任意のallowlistは `dm.groupChannels` 経由（channel IDまたはslug）

  </Tab>
</Tabs>

### ロールベースのagent routing

`bindings[].match.roles` を使うと、Discord guild memberをrole IDごとに別のagentへルーティングできます。ロールベースbindingはrole IDのみ受け付け、peerまたはparent-peer bindingの後、guild-only bindingの前に評価されます。bindingが他のmatch fieldも設定している場合（例: `peer` + `guildId` + `roles`）、設定されたすべてのfieldが一致する必要があります。

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
  <Accordion title="appとbotを作成する">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. bot tokenをコピー

  </Accordion>

  <Accordion title="Privileged intents">
    **Bot -> Privileged Gateway Intents** で以下を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intentは任意で、presence updateを受け取りたい場合にのみ必要です。bot presence（`setPresence`）の設定には、member向けpresence updateを有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuth scopeとbaseline permissions">
    OAuth URL generator:

    - scope: `bot`, `applications.commands`

    一般的なbaseline permission:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    明示的に必要な場合を除き、`Administrator` は避けてください。

  </Accordion>

  <Accordion title="IDをコピーする">
    Discord Developer Modeを有効にしてから、以下をコピーします。

    - server ID
    - channel ID
    - user ID

    信頼できるauditとprobeのため、OpenClaw configでは数値IDを推奨します。

  </Accordion>
</AccordionGroup>

## Native commandsとcommand auth

- `commands.native` のデフォルトは `"auto"` で、Discordでは有効です。
- チャネルごとのoverride: `channels.discord.commands.native`
- `commands.native=false` は、以前登録されたDiscord native commandを明示的に消去します。
- Native command authは、通常のmessage処理と同じDiscord allowlist/policyを使用します。
- 権限のないユーザーにもDiscord UI上ではcommandが表示される場合がありますが、実行時にはOpenClaw authが強制され、「not authorized」が返されます。

コマンドカタログと動作については[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのslash command設定:

- `ephemeral: true`

## 機能詳細

<AccordionGroup>
  <Accordion title="Reply tagとnative reply">
    Discordはagent output内のreply tagをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙のreply threadingを無効にします。明示的な `[[reply_to_*]]` tagは引き続き尊重されます。
    `first` は、そのturnの最初のoutbound Discord messageに常に暗黙のnative reply参照を付けます。
    `batched` は、inbound turnが複数messageのdebounced batchだった場合にのみ、Discordの暗黙のnative reply参照を付けます。これは、すべての単一message turnではなく、曖昧で連続的なchatに対して主にnative replyを使いたい場合に便利です。

    message IDはcontext/history内に表出されるため、agentは特定のmessageを対象にできます。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClawは一時messageを送信して、textが届くたびに編集することで、下書きreplyをstreamできます。

    - `channels.discord.streaming` はpreview streamingを制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）。
    - Discordのpreview editはすぐにrate limitに達することがあり、特に複数のbotやgatewayが同じaccountまたはguild trafficを共有している場合があるため、デフォルトは `off` のままです。
    - `progress` はチャネル間の一貫性のために受け付けられ、Discordでは `partial` にマップされます。
    - `channels.discord.streamMode` はlegacy aliasで、自動移行されます。
    - `partial` はtoken到着に合わせて単一のpreview messageを編集します。
    - `block` は下書きサイズのchunkを出力します（サイズと分割点の調整には `draftChunk` を使います）。

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

    `block` モードのchunking default（`channels.discord.textChunkLimit` に合わせてclampされます）:

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

    Preview streamingはtext専用で、media replyは通常配信にfallbackします。

    注: preview streamingはblock streamingとは別です。Discordでblock streamingが明示的に有効な場合、OpenClawは二重streamingを避けるためpreview streamをスキップします。

  </Accordion>

  <Accordion title="History、context、thread behavior">
    Guild history context:

    - `channels.discord.historyLimit` デフォルト `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` で無効

    DM history controls:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread behavior:

    - Discord threadはchannel sessionとしてルーティングされます
    - parent thread metadataはparent-session linkageに使用できます
    - thread固有のentryが存在しない限り、thread configは親channel configを継承します

    channel topicは **untrusted** contextとして注入されます（system promptとしてではありません）。
    replyとquoted-messageのcontextは現在、受信したまま保持されます。
    Discord allowlistは主に、誰がagentを起動できるかを制御するものであり、完全な補助contextのredaction boundaryではありません。

  </Accordion>

  <Accordion title="Subagent向けthread-bound session">
    Discordではthreadをsession targetにbindできるため、そのthread内の後続messageは同じsession（subagent sessionを含む）に継続してルーティングされます。

    コマンド:

    - `/focus <target>` 現在または新規threadをsubagent/session targetにbind
    - `/unfocus` 現在のthread bindingを解除
    - `/agents` アクティブなrunとbinding状態を表示
    - `/session idle <duration|off>` focused bindingの非アクティブ時自動unfocusを確認/更新
    - `/session max-age <duration|off>` focused bindingの最大有効期間を確認/更新

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

    - `session.threadBindings.*` はグローバルdefaultを設定します。
    - `channels.discord.threadBindings.*` はDiscordの動作をoverrideします。
    - `sessions_spawn({ thread: true })` 用にthreadを自動作成/自動bindするには、`spawnSubagentSessions` をtrueにする必要があります。
    - ACP用にthreadを自動作成/自動bindするには、`spawnAcpSessions` をtrueにする必要があります（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）。
    - accountでthread bindingが無効な場合、`/focus` と関連するthread binding操作は利用できません。

    詳しくは[Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、[Configuration Reference](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的なACP channel binding">
    安定した「常時稼働」ACP workspaceには、Discord conversationを対象にするトップレベルの型付きACP bindingを設定します。

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

    - `/acp spawn codex --bind here` は現在のDiscord channelまたはthreadをその場でbindし、以後のmessageを同じACP sessionにルーティングし続けます。
    - これは「新しいCodex ACP sessionを開始する」を意味することはありますが、それ自体では新しいDiscord threadは作成しません。既存のchannelがchat surfaceのまま使われます。
    - Codex自体は、ディスク上の独自の `cwd` またはbackend workspaceで動作する場合があります。そのworkspaceはruntime stateであり、Discord threadではありません。
    - Thread messageは親channel ACP bindingを継承できます。
    - bind済みchannelまたはthreadでは、`/new` と `/reset` は同じACP sessionをその場でresetします。
    - 一時的なthread bindingも引き続き機能し、有効な間はtarget解決をoverrideできます。
    - `spawnAcpSessions` は、OpenClawが `--thread auto|here` 経由で子threadを作成/bindする必要がある場合にのみ必要です。現在のchannelでの `/acp spawn ... --bind here` には不要です。

    binding動作の詳細は[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="Reaction通知">
    guildごとのreaction notification mode:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    reaction eventはsystem eventに変換され、ルーティングされたDiscord sessionに添付されます。

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` は、OpenClawがinbound messageを処理中であることを示す確認emojiを送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identityのemoji fallback（`agents.list[].identity.emoji`、なければ `"👀"`）

    注:

    - Discordはunicode emojiまたはcustom emoji名を受け付けます。
    - channelまたはaccountでreactionを無効にするには `""` を使います。

  </Accordion>

  <Accordion title="Config書き込み">
    channel起点のconfig書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します（command機能が有効な場合）。

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
    `channels.discord.proxy` を使って、Discord gateway WebSocket trafficと起動時REST lookup（application ID + allowlist解決）をHTTP(S) proxy経由にルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    accountごとのoverride:

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
    proxied messageをsystem member identityに対応付けるため、PluralKit解決を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注:

    - allowlistには `pk:<memberId>` を使用できます
    - member display nameは、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前/slugで一致判定されます
    - lookupは元message IDを使用し、時間範囲制約があります
    - lookupに失敗した場合、proxied messageはbot messageとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Presence設定">
    presence updateは、statusまたはactivity fieldを設定したとき、またはauto presenceを有効にしたときに適用されます。

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

    activity type対応表:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity textをstatus stateとして使用。emojiは任意）
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

    auto presenceはruntime availabilityをDiscord statusに対応付けます: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のtext override:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` placeholderをサポート）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのbuttonベース承認処理をサポートし、必要に応じて元のchannelに承認promptを投稿することもできます。

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能なら `commands.ownerAllowFrom` にfallback）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のどちらかから少なくとも1人のapproverを解決できる場合、Discordはnative exec approvalを自動有効化します。Discordは、channel `allowFrom`、legacy `dm.allowFrom`、またはdirect-message `defaultTo` からexec approverを推測しません。Discordをnative approval clientとして明示的に無効化するには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認promptはchannel内に表示されます。解決済みapproverだけがbuttonを使用でき、他のユーザーにはephemeralな拒否が返されます。承認promptにはcommand textが含まれるため、channel配信は信頼できるchannelでのみ有効にしてください。session keyからchannel IDを導出できない場合、OpenClawはDM配信にfallbackします。

    Discordは、他のchat channelで使用される共有承認buttonも描画します。native Discord adapterは主に、approverのDM routingとchannel fanoutを追加します。
    それらのbuttonが存在する場合、それらが主要な承認UXです。OpenClawは、tool resultがchat approvalを利用不可と示す場合、または手動承認しか手段がない場合にのみ、手動 `/approve` commandを含めるべきです。

    このhandler向けのGateway authは、他のGateway clientと同じ共有credential解決契約を使います。

    - env優先のlocal auth（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` の後に `gateway.auth.*`）
    - local modeでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をfallbackとして使えます。設定済みだが未解決のlocal SecretRefはfail closedします
    - 該当する場合は `gateway.remote.*` 経由でremote-modeもサポート
    - URL overrideはoverride-safeです: CLI overrideは暗黙credentialを再利用せず、env overrideはenv credentialのみを使います

    承認解決の動作:

    - `plugin:` 接頭辞付きIDは `plugin.approval.resolve` で解決されます。
    - それ以外のIDは `exec.approval.resolve` で解決されます。
    - Discordはここで追加のexec-to-plugin fallback hopは行いません。どのGateway methodを呼ぶかはID prefixで決まります。

    Exec approvalのデフォルト有効期限は30分です。approvalがunknown approval IDで失敗する場合は、approver解決、機能の有効化、配信されたapproval id kindが保留中リクエストと一致していることを確認してください。

    関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Toolsとaction gate

Discord message actionには、messaging、channel admin、moderation、presence、metadata actionが含まれます。

主な例:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` actionは、scheduled eventのcover imageを設定するための任意の `image` パラメータ（URLまたはlocal file path）を受け付けます。

action gateは `channels.discord.actions.*` の下にあります。

デフォルトのgate動作:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClawはexec approvalとcross-context markerにDiscord components v2を使用します。Discord message actionも、カスタムUI用の `components` を受け付けられます（高度な用途。discord tool経由でcomponent payloadを構築する必要があります）。一方、legacy `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component containerで使われるaccent colorを設定します（hex）。
- accountごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor`。
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

OpenClawはDiscord voice channelに参加し、リアルタイムで継続的な会話を行えます。これはvoice message attachmentとは別機能です。

要件:

- native command（`commands.native` または `channels.discord.commands.native`）を有効にします。
- `channels.discord.voice` を設定します。
- botには対象voice channelでのConnect + Speak権限が必要です。

sessionを制御するには、Discord専用native command `/vc join|leave|status` を使います。このcommandはaccount default agentを使用し、他のDiscord commandと同じallowlistおよびgroup policyルールに従います。

auto-joinの例:

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

- `voice.tts` はvoice playback専用で `messages.tts` をoverrideします。
- voice transcript turnはDiscord `allowFrom`（または `dm.allowFrom`）からowner statusを導出します。owner以外のspeakerはowner専用tool（たとえば `gateway` や `cron`）にアクセスできません。
- voiceはデフォルトで有効です。無効化するには `channels.discord.voice.enabled=false` を設定します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` のjoin optionにそのまま渡されます。
- `@discordjs/voice` のdefaultは、未設定時に `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClawは受信decrypt failureも監視し、短時間に繰り返しfailureが発生するとvoice channelからleave/rejoinして自動復旧します。
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合、これは上流の `@discordjs/voice` の受信バグで、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されている可能性があります。

## Voice messages

Discord voice messageはwaveform previewを表示し、OGG/Opus audioとmetadataが必要です。OpenClawはwaveformを自動生成しますが、gateway host上でaudio fileを検査および変換するために `ffmpeg` と `ffprobe` が利用可能である必要があります。

要件と制約:

- **local file path** を指定してください（URLは拒否されます）。
- text contentは省略してください（Discordは同じpayload内でtext + voice messageを許可しません）。
- 任意のaudio formatを受け付けます。必要に応じてOpenClawがOGG/Opusに変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないintentを使用した、またはbotがguild messageを見られない">

    - Message Content Intentを有効にする
    - user/member解決に依存する場合はServer Members Intentを有効にする
    - intent変更後にgatewayを再起動する

  </Accordion>

  <Accordion title="Guild messageが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のguild allowlistを確認する
    - guildの `channels` mapが存在する場合、一覧にあるchannelだけが許可される
    - `requireMention` の動作とmention patternを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention falseなのにまだブロックされる">
    よくある原因:

    - `groupPolicy="allowlist"` なのに一致するguild/channel allowlistがない
    - `requireMention` が間違った場所に設定されている（`channels.discord.guilds` またはchannel entryの下である必要があります）
    - 送信者がguild/channel `users` allowlistによってブロックされている

  </Accordion>

  <Accordion title="長時間実行handlerがタイムアウトする、またはreplyが重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener budget knob:

    - 単一account: `channels.discord.eventQueue.listenerTimeout`
    - 複数account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker run timeout knob:

    - 単一account: `channels.discord.inboundWorker.runTimeoutMs`
    - 複数account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30分）。無効化するには `0` を設定

    推奨baseline:

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

    listenerの初期化が遅い場合は `eventQueue.listenerTimeout` を使い、queueされたagent turnに別個の安全弁が欲しい場合のみ `inboundWorker.runTimeoutMs`
    を使ってください。

  </Accordion>

  <Accordion title="Permissions auditの不一致">
    `channels status --probe` のpermission checkは、数値channel IDでのみ機能します。

    slug keyを使っている場合、runtime matchingは機能することがありますが、probeではpermissionを完全には検証できません。

  </Accordion>

  <Accordion title="DMとpairingの問題">

    - DM無効: `channels.discord.dm.enabled=false`
    - DM policy無効: `channels.discord.dmPolicy="disabled"`（legacy: `channels.discord.dm.policy`）
    - `pairing` モードでpairing approval待ち

  </Accordion>

  <Accordion title="bot to bot loop">
    デフォルトではbotが作成したmessageは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、loop動作を避けるために厳格なmentionとallowlistルールを使ってください。
    botをmentionしたbot messageだけを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="Voice STTが DecryptionFailed(...) で途切れる">

    - Discord voice receive recovery logicが入っているように、OpenClawを最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流default）から始め、必要時のみ調整する
    - 以下のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動rejoin後もfailureが続く場合は、ログを収集して [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較する

  </Accordion>
</AccordionGroup>

## Configuration reference pointers

主な参照先:

- [Configuration reference - Discord](/ja-JP/gateway/configuration-reference#discord)

重要度の高いDiscord field:

- 起動/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener budget）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（legacy alias: `streamMode`）, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` はoutbound Discord uploadの上限です（デフォルト: `100MB`）
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, トップレベルの `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 安全性と運用

- bot tokenは秘密情報として扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` 推奨）。
- Discord permissionは最小権限にしてください。
- command deploy/stateが古い場合は、gatewayを再起動して `openclaw channels status --probe` で再確認してください。

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Security](/ja-JP/gateway/security)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
- [Slash commands](/ja-JP/tools/slash-commands)
