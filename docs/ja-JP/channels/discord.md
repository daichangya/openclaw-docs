---
read_when:
    - Discord channel機能に取り組んでいる場合
summary: Discordボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-05T12:36:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

ステータス: 公式Discord Gateway経由のDMおよびguild channelに対応済みです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Discord DMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="channelのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    channel横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいアプリケーションとbotを作成し、そのbotをサーバーに追加して、OpenClawとペアリングする必要があります。botは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、まず[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**を選択）。

<Steps>
  <Step title="Discordアプリケーションとbotを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications)にアクセスして、**New Application**をクリックします。「OpenClaw」のような名前を付けてください。

    サイドバーの**Bot**をクリックします。**Username**を、自分のOpenClaw agentの呼び名に設定します。

  </Step>

  <Step title="特権intentを有効にする">
    引き続き**Bot**ページで、下にスクロールして**Privileged Gateway Intents**に移動し、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。role allowlistと名前からIDへの照合に必要）
    - **Presence Intent**（任意。presence更新が必要な場合のみ）

  </Step>

  <Step title="bot tokenをコピーする">
    **Bot**ページの上部に戻り、**Reset Token**をクリックします。

    <Note>
    名前に反して、これは最初のtokenを生成します。何かが「reset」されるわけではありません。
    </Note>

    tokenをコピーして、どこかに保存してください。これが**Bot Token**で、すぐ後で必要になります。

  </Step>

  <Step title="招待URLを生成して、botをサーバーに追加する">
    サイドバーの**OAuth2**をクリックします。サーバーにbotを追加するために、適切な権限を持つ招待URLを生成します。

    下にスクロールして**OAuth2 URL Generator**で次を有効にします。

    - `bot`
    - `applications.commands`

    下に**Bot Permissions**セクションが表示されます。次を有効にしてください。

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    下部で生成されたURLをコピーしてブラウザに貼り付け、サーバーを選択し、**Continue**をクリックして接続します。これでDiscordサーバーにbotが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを収集する">
    Discordアプリに戻り、内部IDをコピーできるようにDeveloper Modeを有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode**をオンにする
    2. サイドバーの**server icon**を右クリック → **Copy Server ID**
    3. 自分の**avatar**を右クリック → **Copy User ID**

    **Server ID**と**User ID**をBot Tokenと一緒に保存してください。次の手順で、この3つすべてをOpenClawに送ります。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、Discordでbotから自分へのDMを許可する必要があります。**server icon**を右クリック → **Privacy Settings** → **Direct Messages**をオンにします。

    これにより、サーバーメンバー（botを含む）が自分にDMを送れるようになります。OpenClawでDiscord DMを使いたい場合は、これを有効のままにしてください。guild channelsだけを使う予定なら、ペアリング後にDMを無効にしてもかまいません。

  </Step>

  <Step title="bot tokenを安全に設定する（chatで送信しない）">
    Discord bot tokenはシークレットです（パスワードのようなものです）。agentにメッセージを送る前に、OpenClawを実行しているマシンで設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClawがすでにバックグラウンドサービスとして動作している場合は、OpenClaw Mac appから、または`openclaw gateway run`プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="agentに依頼する">
        既存の任意のchannel（例: Telegram）でOpenClaw agentと会話し、設定を依頼してください。Discordが最初のchannelである場合は、代わりにCLI / configタブを使用してください。

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

        デフォルトaccount用のenvフォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの`token`値もサポートされています。`channels.discord.token`では、env/file/exec provider全体でSecretRef値もサポートされます。詳細は[Secrets Management](/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    Gatewayが実行中になるまで待ってから、DiscordでbotにDMしてください。botがペアリングコードを返します。

    <Tabs>
      <Tab title="agentに依頼する">
        既存のchannel上のagentにペアリングコードを送信します。

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

    これでDiscord上でDM経由でagentと会話できるようになります。

  </Step>
</Steps>

<Note>
token解決はaccount対応です。config内のtoken値がenvフォールバックより優先されます。`DISCORD_BOT_TOKEN`はdefault accountでのみ使われます。
高度な送信呼び出し（message tool/channel action）では、呼び出しごとの明示的な`token`がその呼び出しに使用されます。これはsendおよびread/probe系action（たとえばread/search/fetch/thread/pins/permissions）に適用されます。account policy/retry設定は、アクティブなruntime snapshot内で選択されたaccountから引き続き取得されます。
</Note>

## 推奨: guild workspaceを設定する

DMが機能したら、Discordサーバーを完全なworkspaceとして設定できます。各channelが独自のコンテキストを持つ独立したagent sessionになります。これは、自分とbotだけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild allowlistに追加する">
    これにより、agentはDMだけでなく、サーバー上の任意のchannelで応答できるようになります。

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

  <Step title="@mentionなしでの応答を許可する">
    デフォルトでは、agentはguild channelsでは@mentionされたときだけ応答します。プライベートサーバーなら、おそらくすべてのメッセージに応答させたいはずです。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「このサーバーでは、@mentionしなくてもagentが応答できるようにしてください」
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

  <Step title="guild channelsでのmemory利用を計画する">
    デフォルトでは、長期memory（`MEMORY.md`）はDM sessionでのみ読み込まれます。guild channelsでは`MEMORY.md`は自動読み込みされません。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「Discord channelsで質問するとき、`MEMORY.md`の長期コンテキストが必要ならmemory_searchまたはmemory_getを使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのchannelで共有コンテキストが必要なら、安定した指示は`AGENTS.md`または`USER.md`に入れてください（これらはすべてのsessionに注入されます）。長期メモは`MEMORY.md`に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

次に、Discordサーバーにいくつかchannelsを作成して会話を始めてください。agentはchannel名を見ることができ、各channelは独立したsessionを持ちます。そのため、`#coding`、`#home`、`#research`など、ワークフローに合ったものを設定できます。

## Runtime model

- GatewayがDiscord接続を所有します。
- 返信ルーティングは決定的です。Discordからの受信への返信はDiscordに返されます。
- デフォルト（`session.dmScope=main`）では、ダイレクトchatはagentのメインsession（`agent:main:main`）を共有します。
- Guild channelsは分離されたsession key（`agent:<agentId>:discord:channel:<channelId>`）です。
- Group DMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは分離されたコマンドsession（`agent:<agentId>:discord:slash:<userId>`）で実行されつつ、ルーティング先の会話sessionには`CommandTargetSessionKey`が保持されます。

## Forum channels

Discord forumおよびmedia channelsはthread投稿のみ受け付けます。OpenClawはそれらを作成する2つの方法をサポートしています。

- forum親（`channel:<forumId>`）にメッセージを送信してthreadを自動作成します。thread titleには、メッセージ内の最初の空でない行が使われます。
- `openclaw message thread create`を使って直接threadを作成します。forum channelsでは`--message-id`を渡さないでください。

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

OpenClawは、agentメッセージ向けにDiscord components v2コンテナをサポートしています。`components`ペイロード付きでmessage toolを使用してください。interaction結果は通常の受信メッセージとしてagentに返送され、既存のDiscord `replyToMode`設定に従います。

サポートされるblock:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- action rowでは最大5個のbutton、または単一のselect menuを使用可能
- select type: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、componentsは単回使用です。`components.reusable=true`を設定すると、button、select、formを有効期限が切れるまで複数回使用できます。

buttonをクリックできるユーザーを制限するには、そのbuttonに`allowedUsers`を設定します（Discord user ID、tag、または`*`）。設定されている場合、一致しないユーザーにはephemeralの拒否応答が返されます。

`/model`および`/models`スラッシュコマンドは、providerとmodelのドロップダウン、およびSubmitステップを備えたinteractive model pickerを開きます。pickerの返信はephemeralで、呼び出したユーザーのみが使用できます。

ファイル添付:

- `file` blockは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は`media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには`media-gallery`を使用してください
- アップロード名を添付参照と一致させたい場合は、`filename`を使って上書きします

Modal form:

- 最大5フィールドの`components.modal`を追加します
- フィールドtype: `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClawが自動的にトリガーbuttonを追加します

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
    `channels.discord.dmPolicy`がDMアクセスを制御します（レガシー: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom`に`"*"`を含める必要があります。レガシー: `channels.discord.dm.allowFrom`）
    - `disabled`

    DMポリシーがopenでない場合、未知のユーザーはブロックされます（`pairing`モードではペアリングを促されます）。

    マルチaccountの優先順位:

    - `channels.discord.accounts.default.allowFrom`は`default` accountにのみ適用されます。
    - 名前付きaccountsは、自身の`allowFrom`が未設定の場合、`channels.discord.allowFrom`を継承します。
    - 名前付きaccountsは`channels.discord.accounts.default.allowFrom`を継承しません。

    配信時のDM target形式:

    - `user:<id>`
    - `<@id>` mention

    数字だけのIDは曖昧であり、明示的なuser/channel target種別が指定されていない限り拒否されます。

  </Tab>

  <Tab title="Guildポリシー">
    Guild処理は`channels.discord.groupPolicy`によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`が存在する場合の安全なベースラインは`allowlist`です。

    `allowlist`の挙動:

    - guildは`channels.discord.guilds`に一致する必要があります（`id`推奨、slugも可）
    - 任意の送信者allowlist: `users`（安定したID推奨）および`roles`（role IDのみ）。どちらかが設定されている場合、送信者は`users`または`roles`に一致すれば許可されます
    - 直接の名前/tag照合はデフォルトで無効です。`channels.discord.dangerouslyAllowNameMatching: true`は、緊急互換モードとしてのみ有効化してください
    - `users`では名前/tagもサポートされますが、IDのほうが安全です。名前/tagエントリが使われていると`openclaw security audit`が警告します
    - guildに`channels`が設定されている場合、一覧にないchannelは拒否されます
    - guildに`channels`ブロックがない場合、そのallowlist化されたguild内のすべてのchannelsが許可されます

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

    `DISCORD_BOT_TOKEN`だけを設定し、`channels.discord`ブロックを作成していない場合、runtime fallbackは`groupPolicy="allowlist"`になります（ログに警告が出ます）。`channels.defaults.groupPolicy`が`open`でも同様です。

  </Tab>

  <Tab title="mentionとgroup DM">
    Guildメッセージはデフォルトでmentionゲート付きです。

    mention検出には次が含まれます。

    - 明示的なbot mention
    - 設定されたmentionパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - サポートされるケースでの暗黙的な返信先bot動作

    `requireMention`はguild/channelごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions`は、他のuser/roleにはmentionしているがbotにはmentionしていないメッセージを任意で破棄します（@everyone/@hereは除く）。

    Group DM:

    - デフォルト: 無視（`dm.groupEnabled=false`）
    - 任意のallowlist: `dm.groupChannels`（channel IDまたはslug）

  </Tab>
</Tabs>

### roleベースのagentルーティング

`bindings[].match.roles`を使うと、Discord guild memberをrole IDごとに異なるagentへルーティングできます。roleベースのbindingはrole IDのみ受け付け、peerまたはparent-peer bindingの後、guildのみのbindingの前に評価されます。bindingに他のmatchフィールド（たとえば`peer` + `guildId` + `roles`）も設定されている場合、設定されたすべてのフィールドが一致する必要があります。

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

## Developer Portalセットアップ

<AccordionGroup>
  <Accordion title="appとbotを作成する">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. bot tokenをコピー

  </Accordion>

  <Accordion title="特権intent">
    **Bot -> Privileged Gateway Intents**で、次を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intentは任意で、presence更新を受け取りたい場合にのみ必要です。bot presence（`setPresence`）の設定自体には、メンバーのpresence更新を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuth scopeとベースライン権限">
    OAuth URL generator:

    - scope: `bot`、`applications.commands`

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

    OpenClaw configでは、信頼性の高いauditとprobeのために数値IDを推奨します。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認証

- `commands.native`のデフォルトは`"auto"`で、Discordでは有効です。
- channelごとの上書き: `channels.discord.commands.native`
- `commands.native=false`は、以前登録されたDiscordネイティブコマンドを明示的にクリアします。
- ネイティブコマンド認証は、通常のメッセージ処理と同じDiscord allowlist/policyを使用します。
- 権限のないユーザーにもDiscord UI上ではコマンドが表示されることがありますが、実行時には引き続きOpenClaw認証が適用され、「not authorized」が返されます。

コマンドカタログと挙動については、[Slash commands](/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discordはagent出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    制御するのは`channels.discord.replyToMode`です。

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off`は暗黙的な返信threadingを無効にします。明示的な`[[reply_to_*]]`タグは引き続き尊重されます。

    message IDはcontext/historyに含まれるため、agentは特定のメッセージをターゲットにできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClawは、一時メッセージを送信し、テキストの到着に応じて編集することで返信ドラフトをストリーミングできます。

    - `channels.discord.streaming`がプレビューのストリーミングを制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）。
    - Discordのプレビュー編集はすぐにレート制限に達する可能性があるため、特に複数のbotsやgatewaysが同じaccountやguildトラフィックを共有する場合、デフォルトは`off`のままです。
    - `progress`はchannel間の一貫性のために受け付けられ、Discordでは`partial`にマップされます。
    - `channels.discord.streamMode`はレガシーaliasで、自動移行されます。
    - `partial`は、token到着に合わせて単一のプレビューメッセージを編集します。
    - `block`は、ドラフトサイズのチャンクを出力します（サイズと改行位置は`draftChunk`で調整します）。

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

    `block`モードのチャンク分割デフォルト（`channels.discord.textChunkLimit`でクランプされます）:

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

    プレビューのストリーミングはテキスト専用で、メディア返信は通常の配信にフォールバックします。

    注: プレビューのストリーミングはblock streamingとは別です。Discordでblock streamingが明示的に
    有効になっている場合、OpenClawは二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、threadの挙動">
    Guild履歴コンテキスト:

    - `channels.discord.historyLimit` デフォルト `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0`で無効化

    DM履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadの挙動:

    - Discord threadsはchannel sessionとしてルーティングされます
    - 親threadメタデータは親sessionリンクに使用できます
    - thread固有のエントリがない限り、thread configは親channel configを継承します

    channel topicは**信頼されていない**コンテキストとして注入されます（system promptとしてではありません）。
    返信および引用メッセージのコンテキストは、現在のところ受信時のまま保持されます。
    Discord allowlistは主に、誰がagentをトリガーできるかを制御するものであり、完全な補助コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="subagent用のthreadバインドsession">
    Discordはthreadをsession targetにバインドできるため、そのthread内の後続メッセージは同じsession（subagent sessionを含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在または新規threadをsubagent/session targetにバインド
    - `/unfocus` 現在のthread bindingを削除
    - `/agents` アクティブな実行とbinding状態を表示
    - `/session idle <duration|off>` フォーカスされたbindingの非アクティブ時自動unfocusを確認/更新
    - `/session max-age <duration|off>` フォーカスされたbindingのハード最大期間を確認/更新

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

    - `session.threadBindings.*`がグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*`がDiscordの挙動を上書きします。
    - `sessions_spawn({ thread: true })`でthreadを自動作成/バインドするには、`spawnSubagentSessions`をtrueにする必要があります。
    - ACP（`/acp spawn ... --thread ...`または`sessions_spawn({ runtime: "acp", thread: true })`）でthreadを自動作成/バインドするには、`spawnAcpSessions`をtrueにする必要があります。
    - accountでthread bindingが無効になっている場合、`/focus`および関連するthread binding操作は利用できません。

    詳細は[Sub-agents](/tools/subagents)、[ACP Agents](/tools/acp-agents)、および[Configuration Reference](/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的なACP channel binding">
    安定した「常時稼働」ACP workspaceには、Discord会話を対象とするトップレベルの型付きACP bindingを設定します。

    Configパス:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"`

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

    - `/acp spawn codex --bind here`は、現在のDiscord channelまたはthreadをその場でバインドし、以後のメッセージを同じACP sessionにルーティングし続けます。
    - これは「新しいCodex ACP sessionを開始する」を意味することもありますが、それ自体で新しいDiscord threadを作成するわけではありません。既存のchannelがchat surfaceのままです。
    - Codexは引き続き、ディスク上の独自の`cwd`またはbackend workspaceで実行される場合があります。そのworkspaceはruntime stateであり、Discord threadではありません。
    - threadメッセージは親channel ACP bindingを継承できます。
    - バインドされたchannelまたはthreadでは、`/new`と`/reset`は同じACP sessionをその場でリセットします。
    - 一時的なthread bindingも引き続き機能し、有効な間はtarget解決を上書きできます。
    - `spawnAcpSessions`が必要なのは、OpenClawが`--thread auto|here`経由で子threadを作成/バインドする必要がある場合だけです。現在のchannelでの`/acp spawn ... --bind here`には不要です。

    binding動作の詳細は[ACP Agents](/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guildごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users`を使用）

    リアクションイベントはsystem eventに変換され、ルーティング先のDiscord sessionに付加されます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction`は、OpenClawが受信メッセージを処理している間、確認用の絵文字リアクションを送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ`"👀"`）

    注:

    - Discordはunicode絵文字またはカスタム絵文字名を受け付けます。
    - channelまたはaccountでリアクションを無効にするには`""`を使います。

  </Accordion>

  <Accordion title="Config書き込み">
    channel起点のconfig書き込みはデフォルトで有効です。

    これは`/config set|unset`フローに影響します（コマンド機能が有効な場合）。

    無効にするには:

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
    `channels.discord.proxy`を使うと、Discord GatewayのWebSocketトラフィックと、起動時REST参照（application ID + allowlist解決）をHTTP(S)プロキシ経由でルーティングできます。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    accountごとの上書き:

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
    proxied messageをsystem member identityにマッピングするPluralKit解決を有効にするには:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。プライベートsystemに必要
      },
    },
  },
}
```

    注:

    - allowlistでは`pk:<memberId>`を使用できます
    - member display nameは、`channels.discord.dangerouslyAllowNameMatching: true`の場合にのみ名前/slugで照合されます
    - lookupは元のmessage IDを使い、時間窓制約があります
    - lookupに失敗すると、proxied messageはbot messageとして扱われ、`allowBots=true`でない限り破棄されます

  </Accordion>

  <Accordion title="presence設定">
    presence更新は、statusまたはactivityフィールドを設定したとき、またはauto presenceを有効にしたときに適用されます。

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

    activity typeマップ:

    - 0: Playing
    - 1: Streaming（`activityUrl`が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activityテキストをstatus stateとして使用。絵文字は任意）
    - 5: Competing

    auto presenceの例（runtime正常性シグナル）:

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

    auto presenceはruntime可用性をDiscord statusにマッピングします: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}`プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのbuttonベース承認処理をサポートし、必要に応じて元のchannelに承認プロンプトを投稿することもできます。

    Configパス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は`commands.ownerAllowFrom`にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discordは、`enabled`が未設定または`"auto"`で、`execApprovals.approvers`または`commands.ownerAllowFrom`から少なくとも1人の承認者を解決できる場合、ネイティブexec approvalsを自動有効化します。Discordは、channel `allowFrom`、レガシー`dm.allowFrom`、またはダイレクトメッセージ`defaultTo`からexec approverを推論しません。Discordをネイティブ承認clientとして明示的に無効にするには、`enabled: false`を設定してください。

    `target`が`channel`または`both`の場合、承認プロンプトはそのchannelに表示されます。buttonを使用できるのは解決済みの承認者のみで、その他のユーザーにはephemeralの拒否応答が返されます。承認プロンプトにはコマンドテキストが含まれるため、channel配信は信頼できるchannelsでのみ有効にしてください。session keyからchannel IDを導出できない場合、OpenClawはDM配信にフォールバックします。

    Discordは、他のchat channelsで使われる共有承認buttonも描画します。ネイティブDiscord adapterは主に、承認者DMルーティングとchannel fanoutを追加します。
    それらのbuttonが存在する場合、それが主要な承認UXです。OpenClaw
    は、tool resultがchat approvalsを利用できないと示す場合、または
    手動承認しか手段がない場合にのみ、手動の`/approve`コマンドを含めるべきです。

    このハンドラーのGateway認証は、他のGateway clientsと同じ共有認証情報解決契約を使います。

    - env優先のローカル認証（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に`gateway.auth.*`）
    - ローカルモードでは、`gateway.auth.*`が未設定の場合に限り`gateway.remote.*`をフォールバックとして使用可能。設定済みだが未解決のローカルSecretRefはfail closedします
    - 該当する場合は`gateway.remote.*`経由のリモートモードサポート
    - URL overrideは安全に上書きされます。CLI overrideは暗黙的な認証情報を再利用せず、env overrideはenv認証情報のみを使用します

    承認解決の挙動:

    - `plugin:`で始まるIDは`plugin.approval.resolve`経由で解決されます。
    - それ以外のIDは`exec.approval.resolve`経由で解決されます。
    - Discordはここで追加のexec-to-pluginフォールバックを行いません。id
      のprefixが、どのgateway methodを呼ぶかを決定します。

    Exec approvalsのデフォルト有効期限は30分です。unknown approval IDで承認に失敗する場合は、承認者の解決、機能の有効化、および配信されたapproval id種別が保留中リクエストと一致していることを確認してください。

    関連ドキュメント: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Toolsとaction gate

Discord message actionsには、メッセージ送信、channel管理、モデレーション、presence、メタデータactionが含まれます。

主な例:

- messaging: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reactions: `react`、`reactions`、`emojiList`
- moderation: `timeout`、`kick`、`ban`
- presence: `setPresence`

action gateは`channels.discord.actions.*`配下にあります。

デフォルトのgate挙動:

| Action group                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled    |
| roles                                                                                                                                                                    | disabled   |
| moderation                                                                                                                                                               | disabled   |
| presence                                                                                                                                                                 | disabled   |

## Components v2 UI

OpenClawは、exec approvalsおよびクロスコンテキストマーカーにDiscord components v2を使用します。Discord message actionsは、カスタムUI用の`components`も受け付けます（高度な用途。discord tool経由でcomponent payloadを構築する必要があります）。一方、レガシー`embeds`も引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor`は、Discord componentコンテナで使用されるアクセントカラー（16進数）を設定します。
- accountごとの設定は`channels.discord.accounts.<id>.ui.components.accentColor`。
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

## Voice channels

OpenClawはDiscord voice channelsに参加して、リアルタイムで継続的な会話を行えます。これはvoice message添付とは別機能です。

要件:

- ネイティブコマンド（`commands.native`または`channels.discord.commands.native`）を有効にする
- `channels.discord.voice`を設定する
- botには対象voice channelでのConnect + Speak権限が必要

セッション制御にはDiscord専用ネイティブコマンド`/vc join|leave|status`を使用します。このコマンドはaccountのdefault agentを使用し、他のDiscordコマンドと同じallowlistおよびgroup policyルールに従います。

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

- `voice.tts`はvoice再生に限って`messages.tts`を上書きします。
- voice transcript turnはDiscord `allowFrom`（または`dm.allowFrom`）からowner statusを導出します。ownerでない話者はowner専用tool（たとえば`gateway`や`cron`）にアクセスできません。
- voiceはデフォルトで有効です。無効にするには`channels.discord.voice.enabled=false`を設定してください。
- `voice.daveEncryption`と`voice.decryptionFailureTolerance`は`@discordjs/voice`のjoin optionにそのまま渡されます。
- `@discordjs/voice`のデフォルトは、未設定時に`daveEncryption=true`および`decryptionFailureTolerance=24`です。
- OpenClawは受信時のdecrypt failureも監視し、短時間に繰り返し失敗した場合はvoice channelから離脱・再参加して自動復旧します。
- 受信ログに`DecryptionFailed(UnencryptedWhenPassthroughDisabled)`が繰り返し表示される場合、これは[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)で追跡されている上流の`@discordjs/voice`受信バグの可能性があります。

## Voice messages

Discordのvoice messageは波形プレビューを表示し、OGG/Opus音声とメタデータが必要です。OpenClawは波形を自動生成しますが、音声ファイルの検査と変換のためにGateway host上で`ffmpeg`と`ffprobe`が利用可能である必要があります。

要件と制約:

- **ローカルファイルパス**を指定してください（URLは拒否されます）。
- テキスト内容は省略してください（Discordは同一payloadでテキスト + voice messageを許可していません）。
- 任意の音声形式を受け付けます。必要に応じてOpenClawがOGG/Opusに変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないintentを使用した、またはbotがguild messageを見られない">

    - Message Content Intentを有効にする
    - user/member解決に依存する場合はServer Members Intentを有効にする
    - intent変更後はgatewayを再起動する

  </Accordion>

  <Accordion title="guild messageが予期せずブロックされる">

    - `groupPolicy`を確認する
    - `channels.discord.guilds`配下のguild allowlistを確認する
    - guildに`channels`マップがある場合、一覧にあるchannelsのみ許可される
    - `requireMention`の挙動とmentionパターンを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="require mentionをfalseにしてもまだブロックされる">
    よくある原因:

    - guild/channel allowlistに一致しないまま`groupPolicy="allowlist"`になっている
    - `requireMention`の設定場所が誤っている（`channels.discord.guilds`またはchannel entryの配下である必要があります）
    - 送信者がguild/channel `users` allowlistでブロックされている

  </Accordion>

  <Accordion title="長時間実行されるhandlerがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener予算のノブ:

    - 単一account: `channels.discord.eventQueue.listenerTimeout`
    - マルチaccount: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker実行タイムアウトのノブ:

    - 単一account: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチaccount: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    `eventQueue.listenerTimeout`はlistenerセットアップが遅い場合に使い、`inboundWorker.runTimeoutMs`
    は、キューに入ったagent turnに対する別の安全弁が必要な場合にのみ使ってください。

  </Accordion>

  <Accordion title="権限auditの不一致">
    `channels status --probe`の権限チェックは、数値channel IDでのみ機能します。

    slug keyを使っている場合でもruntime照合は動作しますが、probeでは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DM無効: `channels.discord.dm.enabled=false`
    - DMポリシー無効: `channels.discord.dmPolicy="disabled"`（レガシー: `channels.discord.dm.policy`）
    - `pairing`モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot同士のループ">
    デフォルトでは、bot作成メッセージは無視されます。

    `channels.discord.allowBots=true`を設定する場合は、ループ動作を避けるため、厳格なmentionおよびallowlistルールを使用してください。
    botをmentionしたbot messageのみ受け入れるには、`channels.discord.allowBots="mentions"`を推奨します。

  </Accordion>

  <Accordion title="Voice STTがDecryptionFailed(...)で落ちる">

    - Discord voice受信の復旧ロジックが含まれるよう、OpenClawを最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から開始し、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)と比較してください

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインタ

主要リファレンス:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

シグナルの強いDiscordフィールド:

- startup/auth: `enabled`、`token`、`accounts.*`、`allowBots`
- policy: `groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- command: `commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener予算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- delivery: `textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- streaming: `streaming`（レガシーalias: `streamMode`）、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- media/retry: `mediaMaxMb`、`retry`
  - `mediaMaxMb`は送信するDiscordアップロードの上限を設定します（デフォルト: `8MB`）
- actions: `actions.*`
- presence: `activity`、`status`、`activityType`、`activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`、トップレベル`bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全性と運用

- bot tokenはシークレットとして扱ってください（監視付き環境では`DISCORD_BOT_TOKEN`推奨）。
- Discord権限は最小権限で付与してください。
- コマンドのデプロイ/状態が古い場合は、gatewayを再起動し、`openclaw channels status --probe`で再確認してください。

## 関連

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channel routing](/channels/channel-routing)
- [Security](/gateway/security)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
