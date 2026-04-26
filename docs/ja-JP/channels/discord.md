---
read_when:
    - Discordチャネル機能に取り組んでいます
summary: Discordボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

公式Discord Gateway経由で、DMとguildチャネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord DMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいapplicationをbot付きで作成し、そのbotをあなたのサーバーに追加して、OpenClawとペアリングする必要があります。botは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord applicationとbotを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は「OpenClaw」のようなものにします。

    サイドバーの **Bot** をクリックします。**Username** は、OpenClaw agentを呼んでいる名前に設定します。

  </Step>

  <Step title="特権intentを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロールallowlistと名前からIDへの照合に必要）
    - **Presence Intent**（任意。presence更新が必要な場合のみ）

  </Step>

  <Step title="bot tokenをコピーする">
    **Bot** ページの上部に戻って **Reset Token** をクリックします。

    <Note>
    名前とは異なり、これは最初のtokenを生成するもので、何かが「リセット」されるわけではありません。
    </Note>

    tokenをコピーして、どこかに保存してください。これが **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待URLを生成し、botをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。botをサーバーに追加するための、適切な権限付き招待URLを生成します。

    **OAuth2 URL Generator** までスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効にしてください。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャネル向けの基本セットです。forumやmediaチャネルのワークフローを含め、Discord threadに投稿したり、threadを継続したりする予定がある場合は、**Send Messages in Threads** も有効にしてください。
    下部に生成されたURLをコピーしてブラウザに貼り付け、サーバーを選択して **Continue** をクリックし、接続します。これでDiscordサーバー内にbotが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを収集する">
    Discordアプリに戻り、内部IDをコピーできるようにDeveloper Modeを有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーで **server icon** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を、Bot Tokenと一緒に保存してください。次のステップでこの3つすべてをOpenClawに渡します。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでbotがあなたにDMを送れる必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（botを含む）があなたにDMを送れるようになります。OpenClawでDiscord DMを使いたい場合は、これを有効のままにしてください。guildチャネルだけを使う予定なら、ペアリング後にDMを無効にできます。

  </Step>

  <Step title="bot tokenを安全に設定する（チャットで送信しないでください）">
    Discord bot tokenは秘密情報です（パスワードのようなものです）。agentにメッセージを送る前に、OpenClawを実行しているマシン上で設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClawがすでにバックグラウンドサービスとして実行中の場合は、OpenClaw Mac appから再起動するか、`openclaw gateway run` プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="agentに依頼する">
        既存の任意のチャネル（例: Telegram）でOpenClaw agentとチャットして伝えてください。Discordが最初のチャネルである場合は、代わりにCLI / configタブを使ってください。

        > 「Discord bot tokenはすでにconfigに設定しました。User ID `<user_id>` と Server ID `<server_id>` でDiscordセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースのconfigを使いたい場合は、次を設定します。

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

        デフォルトアカウントのenvフォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの `token` 値もサポートされています。`channels.discord.token` では、env/file/exec provider全体でSecretRef値もサポートされています。詳しくは[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    Gatewayが動作するまで待ってから、DiscordでbotにDMを送ってください。botはペアリングコードで応答します。

    <Tabs>
      <Tab title="agentに依頼する">
        既存のチャネルでagentにペアリングコードを送信します。

        > 「このDiscordペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは1時間で期限切れになります。

    これで、DiscordでDM経由でagentとチャットできるようになるはずです。

  </Step>
</Steps>

<Note>
token解決はaccount対応です。configのtoken値がenvフォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
高度なoutbound呼び出し（message tool/channel action）では、明示的な呼び出し単位の `token` がその呼び出しに使用されます。これは送信とread/probe系のaction（たとえば read/search/fetch/thread/pins/permissions）に適用されます。accountのpolicy/retry設定は、アクティブなruntime snapshotで選択されたaccountから引き続き取得されます。
</Note>

## 推奨: guildワークスペースを設定する

DMが機能するようになったら、Discordサーバーをフルワークスペースとして設定できます。各チャネルが独自のcontextを持つ独立したagent sessionになります。これは、あなたとbotだけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild allowlistに追加する">
    これにより、agentはDMだけでなく、サーバー上の任意のチャネルで応答できるようになります。

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
    デフォルトでは、agentはguildチャネル内では@mentionされた場合にのみ応答します。プライベートサーバーでは、すべてのメッセージに応答するようにしたいことが多いでしょう。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「このサーバーでは、@mentionしなくてもagentが応答できるようにしてください」
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

  <Step title="guildチャネルでのmemoryを計画する">
    デフォルトでは、長期memory（MEMORY.md）はDM sessionでのみ読み込まれます。guildチャネルではMEMORY.mdは自動読み込みされません。

    <Tabs>
      <Tab title="agentに依頼する">
        > 「Discordチャネルで質問するとき、MEMORY.mdの長期contextが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャネルで共有contextが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れてください（これらはすべてのsessionに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてmemory toolsでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

では、Discordサーバーにいくつかチャネルを作成して、チャットを始めてください。agentはチャネル名を確認でき、各チャネルには独立したsessionが割り当てられるため、`#coding`、`#home`、`#research` など、ワークフローに合う形で設定できます。

## ランタイムモデル

- GatewayがDiscord接続を所有します。
- 返信ルーティングは決定的です。Discordからの受信への返信はDiscordに返されます。
- Discordのguild/channel metadataは、ユーザーに表示される返信プレフィックスではなく、信頼されていないcontextとしてmodel promptに追加されます。modelがそのenvelopeを返信にコピーした場合、OpenClawはそのコピーされたmetadataをoutbound返信と将来のreplay contextから除去します。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはagentのメインsession（`agent:main:main`）を共有します。
- guildチャネルは独立したsession keyです（`agent:<agentId>:discord:channel:<channelId>`）。
- Group DMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは、ルーティングされた会話sessionに `CommandTargetSessionKey` を保持しつつ、独立したcommand session（`agent:<agentId>:discord:slash:<userId>`）で実行されます。
- Discordへのテキスト専用のcron/Heartbeat通知配信では、最終的なassistant可視の回答を一度だけ使用します。agentが複数の配信可能payloadを出力した場合でも、mediaおよび構造化component payloadは複数メッセージのままです。

## Forumチャネル

Discord forumおよびmediaチャネルは、thread投稿のみ受け付けます。OpenClawはそれらを作成するために2つの方法をサポートしています。

- forum親 (`channel:<forumId>`) にメッセージを送信して、threadを自動作成する。threadタイトルには、メッセージの最初の空でない行が使用されます。
- `openclaw message thread create` を使って、threadを直接作成する。forumチャネルでは `--message-id` を渡さないでください。

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

## インタラクティブcomponent

OpenClawは、agent message向けにDiscord components v2 containerをサポートしています。`components` payloadを指定してmessage toolを使ってください。interaction結果は通常の受信メッセージとしてagentに戻ってルーティングされ、既存のDiscord `replyToMode` 設定に従います。

サポートされているblock:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action rowでは、最大5つのbuttonまたは単一のselect menuを使用可能
- select type: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、componentは単回使用です。button、select、formを期限切れになるまで複数回使えるようにするには、`components.reusable=true` を設定してください。

誰がbuttonをクリックできるかを制限するには、そのbuttonに `allowedUsers` を設定します（Discord user ID、tag、または `*`）。設定されている場合、一致しないユーザーにはephemeralな拒否メッセージが表示されます。

`/model` と `/models` のスラッシュコマンドは、provider、model、互換runtimeのドロップダウンに加えて Submit ステップを備えた、対話型のmodel pickerを開きます。`/models add` は非推奨となっており、チャットからmodelを登録する代わりに、非推奨メッセージを返すようになりました。pickerの返信はephemeralで、実行したユーザーだけが使用できます。

ファイル添付:

- `file` blockは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で提供してください。複数ファイルには `media-gallery` を使用します
- 添付参照と一致する必要がある場合は、`filename` を使ってアップロード名を上書きします

Modal form:

- `components.modal` を追加し、最大5つまでfieldを設定できます
- field type: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClawは自動的にtrigger buttonを追加します

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
    - `open`（`channels.discord.allowFrom` に `"*"` が含まれている必要があります。旧: `channels.discord.dm.allowFrom`）
    - `disabled`

    DMポリシーがopenでない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングを促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` accountにのみ適用されます。
    - 名前付きaccountは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きaccountは `channels.discord.accounts.default.allowFrom` を継承しません。

    配信用のDM target形式:

    - `user:<id>`
    - `<@id>` mention

    数字だけのIDは曖昧であり、明示的なuser/channel target kindが指定されていない限り拒否されます。

  </Tab>

  <Tab title="guildポリシー">
    guildの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guildは `channels.discord.guilds` に一致する必要があります（`id` 推奨、slugも可）
    - 任意の送信者allowlist: `users`（安定したIDを推奨）と `roles`（role IDのみ）。どちらかが設定されている場合、送信者は `users` または `roles` に一致すれば許可されます
    - 直接のname/tag照合はデフォルトで無効です。`channels.discord.dangerouslyAllowNameMatching: true` は、緊急時の互換モードとしてのみ有効にしてください
    - `users` ではname/tagもサポートされますが、IDの方が安全です。name/tagエントリが使用されている場合、`openclaw security audit` が警告します
    - guildに `channels` が設定されている場合、一覧にないチャネルは拒否されます
    - guildに `channels` blockがない場合、そのallowlist済みguild内のすべてのチャネルが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` blockを作成していない場合、ランタイムのフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。`channels.defaults.groupPolicy` が `open` であっても同様です。

  </Tab>

  <Tab title="mentionとgroup DM">
    guild messageはデフォルトでmention必須です。

    mention検出には以下が含まれます。

    - 明示的なbot mention
    - 設定されたmention pattern（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 対応ケースでの暗黙的なreply-to-bot動作

    `requireMention` はguild/channelごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のuser/roleにはmentionしているがbotにはmentionしていないmessageを任意で破棄します（@everyone/@hereを除く）。

    Group DM:

    - デフォルト: 無視される（`dm.groupEnabled=false`）
    - 任意のallowlist: `dm.groupChannels`（channel IDまたはslug）

  </Tab>
</Tabs>

### ロールベースのagentルーティング

`bindings[].match.roles` を使用すると、Discord guild memberをrole IDごとに異なるagentへルーティングできます。ロールベースのbindingはrole IDのみを受け付け、peerまたはparent-peer bindingの後、guild-only bindingの前に評価されます。bindingに他のmatch fieldも設定されている場合（たとえば `peer` + `guildId` + `roles`）、設定されたすべてのfieldが一致する必要があります。

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

## ネイティブコマンドとコマンド認可

- `commands.native` のデフォルトは `"auto"` で、Discordでは有効です。
- チャネルごとの上書き: `channels.discord.commands.native`
- `commands.native=false` は、以前登録されたDiscordネイティブコマンドを明示的にクリアします。
- ネイティブコマンド認可は、通常のmessage処理と同じDiscord allowlist/ポリシーを使用します。
- 認可されていないユーザーにもDiscord UI上ではコマンドが表示される場合がありますが、実行時には引き続きOpenClawの認可が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discordはagent出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信threadingを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのturnの最初のoutbound Discord messageに暗黙的なネイティブ返信参照を常に付与します。
    `batched` は、受信turnが複数messageのdebounced batchであった場合にのみ、Discordの暗黙的なネイティブ返信参照を付与します。これは、ネイティブ返信を曖昧な短時間連投チャット向けに主に使いたいが、すべての単一message turnでは使いたくない場合に便利です。

    Message IDはcontext/historyに含まれるため、agentは特定のmessageを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClawは、一時messageを送信し、テキスト到着に合わせて編集することで、返信draftをストリーミングできます。`channels.discord.streaming` は `off`（デフォルト）| `partial` | `block` | `progress` を取ります。`progress` はDiscord上では `partial` にマッピングされます。`streamMode` は旧aliasで、自動移行されます。

    デフォルトは引き続き `off` です。複数のbotやGatewayが1つのaccountを共有している場合、Discordのプレビュー編集はすぐにrate limitに達するためです。

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

    - `partial` は、token到着に合わせて単一のpreview messageを編集します。
    - `block` はdraftサイズのchunkを出力します（サイズや分割位置の調整には `draftChunk` を使用し、`textChunkLimit` に制限されます）。
    - media、error、明示的返信のfinalは、保留中のpreview editをキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、tool/progress更新でpreview messageを再利用するかどうかを制御します。

    Preview streamingはテキスト専用です。media返信は通常配信にフォールバックします。`block` streamingが明示的に有効な場合、OpenClawは二重ストリーミングを避けるためpreview streamをスキップします。

  </Accordion>

  <Accordion title="履歴、context、thread動作">
    guild履歴context:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効

    DM履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread動作:

    - Discord threadはchannel sessionとしてルーティングされ、上書きがない限り親channel configを継承します。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）は、新しいauto-threadで親transcriptからのseedを有効にします。accountごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - Message-tool reactionは `user:<id>` DM targetを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、reply-stage activation fallback中も保持されます。

    Channel topicは**信頼されていない**contextとして注入されます。allowlistは、誰がagentをトリガーできるかを制御するものであり、完全な補足contextのredaction境界ではありません。

  </Accordion>

  <Accordion title="subagent向けthread bound session">
    Discordでは、threadをsession targetにバインドできるため、そのthread内の後続messageが同じsession（subagent sessionを含む）へ継続してルーティングされます。

    コマンド:

    - `/focus <target>` 現在または新規threadをsubagent/session targetにバインド
    - `/unfocus` 現在のthread bindingを削除
    - `/agents` アクティブなrunとbinding状態を表示
    - `/session idle <duration|off>` フォーカスされたbindingの非アクティブ時自動unfocusを確認/更新
    - `/session max-age <duration|off>` フォーカスされたbindingのハード最大保持時間を確認/更新

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

    注意:

    - `session.threadBindings.*` はグローバルなデフォルトを設定します。
    - `channels.discord.threadBindings.*` はDiscordの動作を上書きします。
    - `spawnSubagentSessions` は、`sessions_spawn({ thread: true })` 用にthreadを自動作成/バインドするには true である必要があります。
    - `spawnAcpSessions` は、ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）用にthreadを自動作成/バインドするには true である必要があります。
    - accountでthread bindingが無効になっている場合、`/focus` および関連するthread binding操作は利用できません。

    詳しくは[Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、および[Configuration Reference](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的なACPチャネルbinding">
    安定した「常時稼働」のACPワークスペースでは、Discord会話を対象にするトップレベルの型付きACP bindingを設定します。

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

    注意:

    - `/acp spawn codex --bind here` は現在のchannelまたはthreadをその場でバインドし、以後のmessageを同じACP session上に維持します。thread messageは親channel bindingを継承します。
    - バインド済みのchannelまたはthreadでは、`/new` と `/reset` は同じACP sessionをその場でリセットします。一時的なthread bindingは、有効な間はtarget解決を上書きできます。
    - `spawnAcpSessions` は、OpenClawが `--thread auto|here` により子threadを作成/バインドする必要がある場合にのみ必要です。

    binding動作の詳細は[ACP Agents](/ja-JP/tools/acp-agents)を参照してください。

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
    `ackReaction` は、OpenClawが受信messageを処理している間、確認用emojiを送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emojiフォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注意:

    - Discordはunicode emojiまたはカスタムemoji名を受け付けます。
    - channelまたはaccountでリアクションを無効にするには `""` を使用します。

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
    `channels.discord.proxy` を使うと、Discord gateway WebSocketトラフィックと起動時REST lookup（application ID + allowlist解決）をHTTP(S) proxy経由でルーティングできます。

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
    プロキシされたmessageをsystem member identityにマップするため、PluralKit解決を有効にします。

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

    注意:

    - allowlistでは `pk:<memberId>` を使用できます
    - member display nameは、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slugで照合されます
    - lookupでは元のmessage IDを使用し、時間ウィンドウ制約があります
    - lookupに失敗した場合、プロキシされたmessageはbot messageとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Presence設定">
    statusまたはactivity fieldを設定したとき、または自動presenceを有効にしたときにPresence更新が適用されます。

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

    Activityの例（custom statusがデフォルトのactivity typeです）:

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

    Streamingの例:

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

    Activity typeの対応:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity textをstatus stateとして使用。emojiは任意）
    - 5: Competing

    自動presenceの例（runtime health signal）:

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

    自動presenceはruntime可用性をDiscord statusにマッピングします: healthy => online、degradedまたはunknown => idle、exhaustedまたはunavailable => dnd。任意のtext上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discordでの承認">
    DiscordはDMでのbuttonベース承認処理をサポートし、任意で元のchannelに承認プロンプトを投稿できます。

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discordは、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも1人のapproverを解決できる場合、ネイティブexec承認を自動有効化します。Discordはchannel `allowFrom`、旧 `dm.allowFrom`、またはダイレクトメッセージ `defaultTo` からexec approverを推測しません。Discordをネイティブ承認clientとして明示的に無効化するには、`enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認プロンプトはchannel内に表示されます。buttonを使えるのは解決済みapproverのみで、それ以外のユーザーにはephemeralな拒否が表示されます。承認プロンプトにはcommand textが含まれるため、channel配信は信頼できるchannelでのみ有効にしてください。session keyからchannel IDを導出できない場合、OpenClawはDM配信にフォールバックします。

    Discordは、他のチャットチャネルで使われる共通承認buttonも描画します。ネイティブDiscord adapterは主に、approver DMルーティングとchannel fanoutを追加します。
    それらのbuttonが存在する場合、それが主要な承認UXです。tool resultがチャット承認を利用できない、または手動承認のみが唯一の経路であることを示す場合にのみ、OpenClawは手動 `/approve` command を含めるべきです。

    Gateway認証と承認解決は、共有Gateway client契約に従います（`plugin:` IDは `plugin.approval.resolve` を通じて解決され、それ以外のIDは `exec.approval.resolve` を通じて解決されます）。承認のデフォルト有効期限は30分です。

    [Exec approvals](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## Toolsとaction gate

Discord message actionには、messaging、channel admin、moderation、presence、metadata actionが含まれます。

主な例:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` actionは、スケジュールイベントのカバー画像を設定するための任意の `image` パラメーター（URLまたはローカルファイルパス）を受け付けます。

action gateは `channels.discord.actions.*` 配下にあります。

デフォルトのgate動作:

| Action group                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClawは、exec承認とcross-context markerにDiscord components v2を使用します。Discord message actionは、カスタムUI用に `components` も受け付けられます（高度な用途。discord tool経由でcomponent payloadを構築する必要があります）。一方、旧 `embeds` も引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component containerで使用されるアクセントカラー（hex）を設定します。
- accountごとに設定するには `channels.discord.accounts.<id>.ui.components.accentColor` を使用します。
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

## Voice

Discordには2つの異なるvoice surfaceがあります: リアルタイムの**voice channel**（継続的な会話）と、**voice message attachment**（波形プレビュー形式）です。Gatewayは両方をサポートします。

### Voice channel

セットアップチェックリスト:

1. Discord Developer PortalでMessage Content Intentを有効にします。
2. role/user allowlistを使用する場合は、Server Members Intentを有効にします。
3. `bot` と `applications.commands` scopeでbotを招待します。
4. 対象voice channelで Connect、Speak、Send Messages、Read Message History を許可します。
5. ネイティブcommand（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

sessionの制御には `/vc join|leave|status` を使用します。このcommandはaccountのデフォルトagentを使用し、他のDiscord commandと同じallowlistおよびgroup policyルールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

注意:

- `voice.tts` はvoice再生に対してのみ `messages.tts` を上書きします。
- `voice.model` は、Discord voice channel応答に使用するLLMのみを上書きします。未設定の場合は、ルーティングされたagent modelを継承します。
- STTは `tools.media.audio` を使用します。`voice.model` は文字起こしには影響しません。
- voice transcript turnは、Discord `allowFrom`（または `dm.allowFrom`）からowner statusを導出します。ownerでない話者はowner専用tool（たとえば `gateway` や `cron`）にアクセスできません。
- voiceはデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定してください。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` のjoin optionにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定時に `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClawは受信復号失敗も監視し、短時間に失敗が繰り返された場合はvoice channelから退出・再参加して自動復旧します。
- 更新後も受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、dependency reportとログを収集してください。同梱の `@discordjs/voice` 系列には、discord.js PR #11449 のupstream padding修正が含まれており、これはdiscord.js issue #11419 を解決したものです。

Voice channelパイプライン:

- Discord PCM captureはWAVの一時ファイルに変換されます。
- `tools.media.audio` がSTTを処理します。たとえば `openai/gpt-4o-mini-transcribe` です。
- transcriptは通常のDiscord ingressとルーティングを通って送信されます。
- `voice.model` が設定されている場合、このvoice-channel turnの応答LLMのみを上書きします。
- `voice.tts` は `messages.tts` にマージされ、その結果のaudioが参加中のchannelで再生されます。

認証情報はcomponentごとに解決されます: `voice.model` にはLLM route auth、`tools.media.audio` にはSTT auth、`messages.tts`/`voice.tts` にはTTS authが使用されます。

### Voice message

Discord voice messageは波形プレビューを表示し、OGG/Opus audioが必要です。OpenClawは波形を自動生成しますが、検査と変換のためにgateway host上で `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス** を指定してください（URLは拒否されます）。
- テキストcontentは省略してください（Discordは同じpayload内のテキスト+voice messageを拒否します）。
- どのaudio formatでも受け付けられます。必要に応じてOpenClawがOGG/Opusに変換します。

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
    - guild `channels` mapが存在する場合、一覧にあるchannelのみが許可される
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

    - 一致するguild/channel allowlistがない `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはchannel entry配下である必要があります）
    - 送信者がguild/channel `users` allowlistによってブロックされている

  </Accordion>

  <Accordion title="長時間実行されるhandlerがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener予算の設定項目:

    - 単一account: `channels.discord.eventQueue.listenerTimeout`
    - マルチaccount: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker実行タイムアウトの設定項目:

    - 単一account: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチaccount: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    遅いlistenerセットアップには `eventQueue.listenerTimeout` を使用し、`inboundWorker.runTimeoutMs` はキューに入ったagent turn用に別の安全弁が必要な場合にのみ使用してください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは数値channel IDでのみ機能します。

    slug keyを使用している場合でも、ランタイム一致は機能することがありますが、probeでは権限を完全には検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DM無効: `channels.discord.dm.enabled=false`
    - DMポリシー無効: `channels.discord.dmPolicy="disabled"`（旧: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="bot同士のループ">
    デフォルトではbot作成messageは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格なmentionルールとallowlistルールを使用してください。
    botにmentionしたbot messageのみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="DecryptionFailed(...) でvoice STTが失われる">

    - Discord voice受信回復ロジックが含まれるよう、OpenClawを最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（upstreamデフォルト）から開始し、必要な場合にのみ調整する
    - 以下のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) および [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) のupstream DAVE受信履歴と比較してください

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [Configuration reference - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要なDiscord field">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener予算）、`eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（旧alias: `streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`（Discordへのoutbound upload上限。デフォルト `100MB`）、`retry`
- action: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents`, `Heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot tokenは秘密情報として扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord権限は最小権限で付与してください。
- commandのデプロイ/状態が古い場合は、gatewayを再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord userをgatewayにペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットとallowlistの動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信messageをagentにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチagentルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guildとchannelをagentにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブcommandの動作。
  </Card>
</CardGroup>
