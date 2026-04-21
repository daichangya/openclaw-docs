---
read_when:
    - Discordチャンネル機能の開発中
summary: Discordボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

ステータス: 公式のDiscord gateway経由でDMとguild channelに対応済みです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    DiscordのDMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブのコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネルをまたいだ診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいapplicationをbot付きで作成し、そのbotをサーバーに追加して、OpenClawにペアリングする必要があります。botは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord applicationとbotを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications)に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** は、OpenClaw agentに付けている名前に設定してください。

  </Step>

  <Step title="特権intentを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、以下を有効にします:

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。role allowlistと名前からIDへの照合に必須）
    - **Presence Intent**（任意。presence更新が必要な場合のみ）

  </Step>

  <Step title="bot tokenをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のtokenを生成します。何かが「リセット」されるわけではありません。
    </Note>

    tokenをコピーしてどこかに保存します。これが **Bot Token** で、このあとすぐに必要になります。

  </Step>

  <Step title="招待URLを生成してbotをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。サーバーにbotを追加するために、適切な権限を持つ招待URLを生成します。

    **OAuth2 URL Generator** までスクロールし、以下を有効にします:

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。以下を有効にします:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    下部に生成されたURLをコピーしてブラウザに貼り付け、サーバーを選択し、**Continue** をクリックして接続します。これでDiscordサーバー内にbotが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを取得する">
    Discordアプリに戻り、内部IDをコピーできるようにするため、Developer Modeを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存してください。次のステップで、この3つすべてをOpenClawに送ります。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでbotがあなたにDMを送れる必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（botを含む）があなたにDMを送信できるようになります。OpenClawでDiscord DMを使いたい場合は、これを有効のままにしてください。guild channelだけを使う予定なら、ペアリング後にDMを無効にしても構いません。

  </Step>

  <Step title="bot tokenを安全に設定する（チャットで送信しない）">
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
      <Tab title="agentに依頼する">
        既存の任意のチャンネル（例: Telegram）でOpenClaw agentと会話し、次のように伝えます。Discordが最初のチャンネルである場合は、代わりにCLI / configタブを使用してください。

        > 「Discord bot tokenはすでにconfigに設定しました。User ID `<user_id>` と Server ID `<server_id>` でDiscordセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースのconfigを使いたい場合は、次のように設定します:

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

        デフォルトアカウントのenv fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの `token` 値にも対応しています。`channels.discord.token` では、env/file/exec provider全体でSecretRef値も利用できます。詳しくは[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    gatewayが実行中になるまで待ってから、DiscordでbotにDMを送ってください。botがペアリングコードを返します。

    <Tabs>
      <Tab title="agentに依頼する">
        既存のチャンネルで、そのペアリングコードをagentに送ります:

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

    これでDiscordのDM経由でagentと会話できるようになります。

  </Step>
</Steps>

<Note>
token解決はアカウント認識型です。configのtoken値はenv fallbackより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使われます。
高度な送信呼び出し（message tool/channel action）では、明示的な呼び出し単位の `token` がその呼び出しに使われます。これは送信およびread/probe系のaction（たとえばread/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシーやretry設定は、アクティブなruntime snapshotで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: guild workspaceをセットアップする

DMが動作したら、Discordサーバーをフルworkspaceとしてセットアップできます。各チャンネルが独自のcontextを持つ独立したagent sessionになります。これは、あなたとbotだけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild allowlistに追加する">
    これにより、agentがDMだけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「私のDiscord Server ID `<server_id>` をguild allowlistに追加してください」
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

  <Step title="@mentionなしで応答できるようにする">
    デフォルトでは、agentはguild channelでは @mention されたときだけ応答します。プライベートサーバーなら、すべてのメッセージに応答するようにしたいはずです。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「このサーバーでは、@mentioned しなくてもagentが応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        guild configで `requireMention: false` を設定します:

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
      <Tab title="agentに依頼する">
        > 「Discord channelで質問するとき、MEMORY.md の長期contextが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有contextが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置いてください（これらはすべてのsessionに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

では、Discordサーバーにいくつかチャンネルを作成して、会話を始めてください。agentはチャンネル名を認識でき、各チャンネルは独立したsessionを持つため、`#coding`、`#home`、`#research` など、ワークフローに合う形で設定できます。

## ランタイムモデル

- GatewayがDiscord接続を管理します。
- 返信ルーティングは決定的です。Discordからの受信返信はDiscordへ返されます。
- デフォルト（`session.dmScope=main`）では、ダイレクトチャットはagentのメインsession（`agent:main:main`）を共有します。
- guild channelは独立したsession keyです（`agent:<agentId>:discord:channel:<channelId>`）。
- group DMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは独立したcommand session（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティングされた会話sessionには `CommandTargetSessionKey` が引き続き渡されます。

## Forum channels

Discordのforum channelとmedia channelはthread投稿のみ受け付けます。OpenClawはそれらを作成する2つの方法をサポートしています:

- forum親 (`channel:<forumId>`) にメッセージを送信してthreadを自動作成する。thread titleには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使って直接threadを作成する。forum channelでは `--message-id` を渡さないでください。

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

OpenClawはagent message向けにDiscord components v2コンテナをサポートしています。`components` payload付きでmessage toolを使ってください。interactionの結果は通常の受信メッセージとしてagentにルーティングされ、既存のDiscord `replyToMode` 設定に従います。

サポートされるblock:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rowでは、最大5つのbuttonまたは単一のselect menuを使用できます
- Select type: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、componentsは単回使用です。button、select、formを有効期限が切れるまで複数回使えるようにするには、`components.reusable=true` を設定してください。

buttonをクリックできるユーザーを制限するには、そのbuttonに `allowedUsers` を設定します（Discord user ID、tag、または `*`）。設定されている場合、一致しないユーザーにはephemeralな拒否メッセージが表示されます。

`/model` と `/models` のスラッシュコマンドでは、providerとmodelのドロップダウン、およびSubmitステップを備えたインタラクティブなmodel pickerが開きます。pickerの返信はephemeralで、呼び出したユーザーだけが使用できます。

ファイル添付:

- `file` blockは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で提供してください。複数ファイルには `media-gallery` を使います
- 添付参照に一致する必要がある場合は、アップロード名を上書きするために `filename` を使います

モーダルフォーム:

- 最大5つのfieldを含む `components.modal` を追加します
- Field type: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClawが自動的にトリガーbuttonを追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "任意のフォールバックテキスト",
  components: {
    reusable: true,
    text: "進むパスを選択",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "承認",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "辞退", style: "danger" },
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
    `channels.discord.dmPolicy` はDMアクセスを制御します（旧: `channels.discord.dm.policy`）:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります。旧: `channels.discord.dm.allowFrom`）
    - `disabled`

    DMポリシーがopenでない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングを促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    配信時のDMターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    種別が明示されたuser/channelターゲットがない限り、数値IDのみの指定は曖昧であり拒否されます。

  </Tab>

  <Tab title="Guildポリシー">
    Guild処理は `channels.discord.groupPolicy` によって制御されます:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guild は `channels.discord.guilds` と一致する必要があります（`id` 推奨、slugも可）
    - 任意の送信者allowlist: `users`（安定したIDを推奨）および `roles`（role IDのみ）。どちらかが設定されている場合、送信者は `users` または `roles` のいずれかに一致すれば許可されます
    - 直接の名前/tag一致はデフォルトで無効です。緊急時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - 名前/tagは `users` でサポートされますが、IDのほうが安全です。名前/tagエントリが使われていると、`openclaw security audit` が警告します
    - guild に `channels` が設定されている場合、一覧にないchannelは拒否されます
    - guild に `channels` ブロックがない場合、そのallowlist済みguild内のすべてのchannelが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、ランタイムのfallbackは `groupPolicy="allowlist"` になります（ログに警告が出ます）。`channels.defaults.groupPolicy` が `open` でも同様です。

  </Tab>

  <Tab title="メンションとgroup DM">
    guildメッセージはデフォルトでメンション必須です。

    メンション検出には以下が含まれます:

    - botへの明示的なメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、fallbackは `messages.groupChat.mentionPatterns`）
    - サポート対象ケースでのbotへの暗黙的な返信動作

    `requireMention` はguild/channelごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のuser/roleにはメンションしているがbotにはしていないメッセージを任意で破棄します（@everyone/@hereを除く）。

    Group DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - 任意のallowlistは `dm.groupChannels` 経由（channel IDまたはslug）

  </Tab>
</Tabs>

### roleベースのagentルーティング

`bindings[].match.roles` を使うと、Discord guild memberをrole IDごとに別のagentへルーティングできます。roleベースのbindingはrole IDのみ受け付け、peerまたはparent-peer bindingの後、guild-only bindingの前に評価されます。bindingに他のmatch fieldも設定されている場合（例: `peer` + `guildId` + `roles`）、設定されたすべてのfieldが一致する必要があります。

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
    3. bot tokenをコピーする

  </Accordion>

  <Accordion title="特権intent">
    **Bot -> Privileged Gateway Intents** で、以下を有効にします:

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intentは任意で、presence更新を受け取りたい場合にのみ必要です。bot presenceの設定（`setPresence`）自体には、member向けpresence更新を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuthスコープとベースライン権限">
    OAuth URL generator:

    - スコープ: `bot`, `applications.commands`

    一般的なベースライン権限:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    明示的に必要な場合を除き、`Administrator` は避けてください。

  </Accordion>

  <Accordion title="IDをコピーする">
    Discord Developer Modeを有効にしてから、以下をコピーします:

    - server ID
    - channel ID
    - user ID

    監査やprobeの信頼性のため、OpenClaw configでは数値IDを推奨します。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discordでは有効です。
- チャンネル単位の上書き: `channels.discord.commands.native`。
- `commands.native=false` を設定すると、以前に登録されたDiscordネイティブコマンドが明示的にクリアされます。
- ネイティブコマンド認証は、通常のメッセージ処理と同じDiscord allowlist/ポリシーを使用します。
- 権限のないユーザーにもDiscord UI上ではコマンドが表示される場合がありますが、実行時にはOpenClaw認証が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discordはagent出力内の返信タグをサポートします:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` によって制御されます:

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の送信Discordメッセージに常に暗黙的なネイティブ返信参照を付与します。
    `batched` は、
    受信ターンが複数メッセージのdebounced batchだった場合にのみ、Discordの暗黙的なネイティブ返信参照を付与します。これは、
    曖昧で短時間に集中するチャットで主にネイティブ返信を使いたいが、
    単一メッセージのターンすべてでは使いたくない場合に便利です。

    message IDはcontext/historyに公開されるため、agentは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClawは、一時メッセージを送信し、テキスト到着に応じて編集することで、返信ドラフトをストリーミングできます。

    - `channels.discord.streaming` はプレビューストリーミングを制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）。
    - Discordのプレビュー編集は、特に複数のbotやgatewayが同じアカウントまたはguild trafficを共有している場合に、すぐにレート制限に達する可能性があるため、デフォルトは `off` のままです。
    - `progress` はチャンネル間の一貫性のために受け付けられ、Discordでは `partial` にマップされます。
    - `channels.discord.streamMode` は旧エイリアスで、自動移行されます。
    - `partial` は、token到着に合わせて単一のプレビューメッセージを編集します。
    - `block` は、ドラフトサイズのchunkを出力します（サイズと分割位置の調整には `draftChunk` を使います）。
    - `streaming.preview.toolProgress` は、tool/progress更新で同じドラフトプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。個別のtool/progressメッセージを維持するには `false` を設定してください。

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

    `block` モードのchunkingデフォルト（`channels.discord.textChunkLimit` に収まるように制限されます）:

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

    プレビューストリーミングはテキスト専用です。media返信は通常配信にfallbackします。

    注: プレビューストリーミングはblock streamingとは別物です。Discordでblock streamingが明示的に
    有効になっている場合、OpenClawは二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、context、thread動作">
    guild履歴context:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    thread動作:

    - Discord threadはchannel sessionとしてルーティングされます
    - 親thread metadataは親sessionリンクに使えます
    - thread固有のエントリが存在しない限り、thread configは親channel configを継承します

    channel topicは **信頼されていない** contextとして注入されます（system promptとしてではありません）。
    返信および引用メッセージのcontextは、現在は受信したまま維持されます。
    Discordのallowlistは主に、誰がagentをトリガーできるかを制御するものであり、完全な補足contextのredaction境界ではありません。

  </Accordion>

  <Accordion title="subagent向けthreadバインドsession">
    Discordでは、threadをsession targetにバインドできます。これにより、そのthread内の後続メッセージは同じsession（subagent sessionを含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在または新規のthreadをsubagent/session targetにバインド
    - `/unfocus` 現在のthread bindingを削除
    - `/agents` アクティブなrunとbinding状態を表示
    - `/session idle <duration|off>` focused bindingの無操作時自動unfocusを確認/更新
    - `/session max-age <duration|off>` focused bindingのハード最大期間を確認/更新

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

    注記:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` はDiscordの動作を上書きします。
    - `sessions_spawn({ thread: true })` に対してthreadを自動作成/バインドするには、`spawnSubagentSessions` をtrueにする必要があります。
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）に対してthreadを自動作成/バインドするには、`spawnAcpSessions` をtrueにする必要があります。
    - アカウントでthread bindingが無効な場合、`/focus` および関連するthread binding操作は利用できません。

    [Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、[Configuration Reference](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的なACP channel binding">
    安定した「常時稼働」ACP workspaceには、Discord conversationを対象とするトップレベルの型付きACP bindingを設定します。

    Configパス:

- `bindings[]` で `type: "acp"` と `match.channel: "discord"` を使用

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

    注記:

    - `/acp spawn codex --bind here` は現在のDiscord channelまたはthreadをその場でバインドし、以後のメッセージを同じACP sessionへルーティングし続けます。
    - これは「新しいCodex ACP sessionを開始する」ことを意味する場合もありますが、それ自体では新しいDiscord threadは作成しません。既存のchannelがチャット画面のまま使われます。
    - Codexは引き続き、ディスク上の自身の `cwd` またはbackend workspaceで実行される場合があります。そのworkspaceはruntime stateであり、Discord threadではありません。
    - threadメッセージは親channelのACP bindingを継承できます。
    - バインドされたchannelまたはthreadでは、`/new` と `/reset` はその場で同じACP sessionをリセットします。
    - 一時的なthread bindingも引き続き機能し、有効な間はtarget解決を上書きできます。
    - `spawnAcpSessions` が必要なのは、OpenClawが `--thread auto|here` によって子threadを作成/バインドする必要がある場合のみです。現在のchannelでの `/acp spawn ... --bind here` には不要です。

    binding動作の詳細は [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guildごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはsystem eventに変換され、ルーティングされたDiscord sessionに添付されます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理中であることを示す確認用emojiを送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identityのemoji fallback（`agents.list[].identity.emoji`、なければ `"👀"`）

    注記:

    - Discordはunicode emojiまたはcustom emoji名を受け付けます。
    - channelまたはaccountでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config書き込み">
    チャンネル起点のconfig書き込みはデフォルトで有効です。

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
    `channels.discord.proxy` を使って、Discord gateway WebSocketトラフィックと起動時のREST lookup（application ID + allowlist解決）をHTTP(S) proxy経由にします。

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
    proxied messageをsystem member identityにマッピングするためのPluralKit解決を有効にします:

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

    注記:

    - allowlistでは `pk:<memberId>` を使用できます
    - member display nameは、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slugで照合されます
    - lookupは元のmessage IDを使用し、時間ウィンドウ制約があります
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
      activity: "集中時間",
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
      activity: "ライブコーディング",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Activity type対応表:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity textをstatus stateとして使用。emojiは任意）
    - 5: Competing

    Auto presenceの例（runtime health signal）:

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

    Auto presenceはruntime availabilityをDiscord statusにマッピングします: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のtext上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダー対応）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのbuttonベースの承認処理をサポートしており、必要に応じて承認プロンプトを元のchannelにも投稿できます。

    Configパス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にfallback）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discordは、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも1人のapproverを解決できる場合、ネイティブexec approvalを自動有効化します。Discordは、channelの `allowFrom`、旧 `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` からexec approverを推測しません。ネイティブ承認クライアントとしてのDiscordを明示的に無効化するには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認プロンプトはchannelに表示されます。解決済みのapproverだけがbuttonを使え、他のユーザーにはephemeralな拒否が返されます。承認プロンプトにはcommand textが含まれるため、channel配信は信頼できるchannelでのみ有効にしてください。session keyからchannel IDを導出できない場合、OpenClawはDM配信にfallbackします。

    Discordは、他のチャットチャンネルで使われる共有承認buttonもレンダリングします。ネイティブのDiscord adapterは、主にapprover DMルーティングとchannel fanoutを追加します。
    それらのbuttonが存在する場合、それが主要な承認UXになります。OpenClawは、
    tool resultでチャット承認が利用不可と示される場合、または手動承認が唯一の手段である場合にのみ、
    手動の `/approve` コマンドを含めるべきです。

    このhandlerのGateway authは、他のGateway clientと同じ共有credential解決契約を使用します:

    - env優先のlocal auth（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に `gateway.auth.*`）
    - local modeでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をfallbackとして使用できます。設定済みだが未解決のlocal SecretRefはfail closedします
    - 該当する場合は `gateway.remote.*` によるremote-modeサポート
    - URL上書きはoverride-safeです。CLI上書きでは暗黙credentialを再利用せず、env上書きではenv credentialのみを使用します

    承認解決の動作:

    - `plugin:` 接頭辞付きのIDは `plugin.approval.resolve` で解決されます。
    - それ以外のIDは `exec.approval.resolve` で解決されます。
    - Discordはここで追加のexec-to-plugin fallback hopを行いません。IDの
      接頭辞によって呼び出すgateway methodが決まります。

    Exec approvalのデフォルト有効期限は30分です。unknown approval IDで承認が失敗する場合は、
    approver解決、機能の有効化、および配信されたapproval id種別が保留中リクエストと一致していることを確認してください。

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

`event-create` actionは、scheduled eventのカバー画像を設定するための任意の `image` パラメータ（URLまたはlocal file path）を受け付けます。

action gateは `channels.discord.actions.*` 配下にあります。

デフォルトのgate動作:

| Action group                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled    |
| roles                                                                                                                                                                    | disabled   |
| moderation                                                                                                                                                               | disabled   |
| presence                                                                                                                                                                 | disabled   |

## Components v2 UI

OpenClawは、exec approvalとcross-context markerにDiscord components v2を使用します。Discord message actionもcustom UI向けに `components` を受け付けられます（高度な用途。discord tool経由でcomponent payloadを構築する必要があります）。一方、旧来の `embeds` も引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component containerで使用するアクセントカラー（hex）を設定します。
- アカウントごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor` を使います。
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

OpenClawは、リアルタイムで継続的な会話のためにDiscord voice channelへ参加できます。これはvoice message attachmentとは別機能です。

要件:

- ネイティブコマンドを有効にする（`commands.native` または `channels.discord.commands.native`）。
- `channels.discord.voice` を設定する。
- botには対象voice channelでのConnect + Speak権限が必要です。

sessionの制御にはDiscord専用のネイティブコマンド `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトagentを使用し、他のDiscordコマンドと同じallowlistおよびgroup policyルールに従います。

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

注記:

- `voice.tts` は、voice再生に限って `messages.tts` を上書きします。
- voice transcript turnは、Discordの `allowFrom`（または `dm.allowFrom`）からowner statusを導出します。ownerでない話者は、owner専用tool（たとえば `gateway` や `cron`）にアクセスできません。
- voiceはデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` のjoin optionにそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- OpenClawは受信時のdecrypt失敗も監視し、短時間に失敗が繰り返された場合はvoice channelから退出・再参加して自動復旧します。
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合、これは [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されている上流の `@discordjs/voice` 受信バグである可能性があります。

## Voice messages

Discordのvoice messageは波形プレビューを表示し、OGG/Opus音声とmetadataが必要です。OpenClawは波形を自動生成しますが、音声ファイルの検査と変換のためにgateway host上で `ffmpeg` と `ffprobe` が使用可能である必要があります。

要件と制約:

- **ローカルファイルパス** を指定してください（URLは拒否されます）。
- テキストcontentは省略してください（Discordでは同じpayload内でテキスト + voice messageは許可されません）。
- 任意の音声形式を受け付けます。必要に応じてOpenClawがOGG/Opusに変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないintentを使用した、またはbotがguild messageを認識しない">

    - Message Content Intentを有効にする
    - user/member解決に依存する場合はServer Members Intentを有効にする
    - intent変更後にgatewayを再起動する

  </Accordion>

  <Accordion title="guild messageが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のguild allowlistを確認する
    - guildの `channels` mapが存在する場合、一覧にあるchannelだけが許可されます
    - `requireMention` の動作とmention patternを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMentionがfalseなのにまだブロックされる">
    よくある原因:

    - 一致するguild/channel allowlistがない状態で `groupPolicy="allowlist"` になっている
    - `requireMention` が間違った場所に設定されている（`channels.discord.guilds` またはchannel entry配下である必要があります）
    - 送信者がguild/channelの `users` allowlistによってブロックされている

  </Accordion>

  <Accordion title="長時間実行のhandlerがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener budgetの設定項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker run timeoutの設定項目:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30分）。無効にするには `0` を設定

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

    listenerの初期化が遅い場合は `eventQueue.listenerTimeout` を使い、キューされたagent turnに対して
    別の安全弁が必要な場合にのみ `inboundWorker.runTimeoutMs`
    を使ってください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値channel IDに対してのみ機能します。

    slug keyを使用している場合、ランタイムでの一致は動作することがありますが、probeでは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DMが無効: `channels.discord.dm.enabled=false`
    - DMポリシーが無効: `channels.discord.dmPolicy="disabled"`（旧: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot同士のループ">
    デフォルトではbot作成messageは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格なmentionおよびallowlistルールを使ってください。
    botにメンションしたbot messageのみ受け付ける `channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="Voice STTが DecryptionFailed(...) で途切れる">

    - Discord voice受信の復旧ロジックが含まれるよう、OpenClawを最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）であることを確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合にのみ調整する
    - 以下のログを確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集して [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較してください

  </Accordion>
</AccordionGroup>

## Configuration referenceの参照先

主な参照先:

- [Configuration reference - Discord](/ja-JP/gateway/configuration-reference#discord)

重要なDiscord field:

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener budget）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（旧エイリアス: `streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` は送信するDiscord uploadの上限を設定します（デフォルト: `100MB`）
- action: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 安全性と運用

- bot tokenは秘密情報として扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限のDiscord permissionを付与してください。
- command deploy/stateが古い場合は、gatewayを再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Security](/ja-JP/gateway/security)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
- [Slash commands](/ja-JP/tools/slash-commands)
