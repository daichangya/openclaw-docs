---
read_when:
    - Discord チャンネル機能に取り組んでいます
summary: Discordボットのサポート状況、機能、および設定
title: Discord
x-i18n:
    generated_at: "2026-04-25T13:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

公式のDiscord Gateway経由で、DM と guild チャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord のDMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブのコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいアプリケーションとボットを作成し、そのボットをあなたのサーバーに追加して、OpenClaw とペアリングする必要があります。ボットは自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** は、OpenClaw エージェントの呼び名に合わせて設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必須）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページを上に戻り、**Reset Token** をクリックします。

    <Note>
    名前とは違い、これで最初のトークンが生成されます。何かが「リセット」されるわけではありません。
    </Note>

    トークンをコピーしてどこかに保存します。これが **Bot Token** で、すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、ボットをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。サーバーにボットを追加するための、適切な権限付き招待 URL を生成します。

    **OAuth2 URL Generator** までスクロールし、以下を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも以下を有効にしてください。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネル向けの基本セットです。Discord スレッドに投稿する予定がある場合、フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続するケースを含め、**Send Messages in Threads** も有効にしてください。
    下部の生成された URL をコピーしてブラウザに貼り付け、サーバーを選んで **Continue** をクリックして接続します。これで Discord サーバー内にボットが表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を取得する">
    Discord アプリに戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存してください。次のステップでこの 3 つすべてを OpenClaw に渡します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord でボットがあなたに DM を送れる必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これでサーバーメンバー（ボットを含む）があなたに DM を送れるようになります。OpenClaw と Discord DM を使いたい場合は、この設定を有効のままにしてください。guild チャンネルだけを使う予定であれば、ペアリング後に DM を無効化してもかまいません。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しないでください）">
    Discord のボットトークンは秘密情報です（パスワードのようなものです）。エージェントにメッセージを送る前に、OpenClaw を実行しているマシン上で設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw がすでにバックグラウンドサービスとして動作している場合は、OpenClaw Mac アプリから再起動するか、`openclaw gateway run` プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、これを伝えてください。Discord が最初のチャンネルである場合は、代わりに CLI / config タブを使用してください。

        > 「Discord のボットトークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` を使って Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの設定を使いたい場合は、以下を設定します。

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

        デフォルトアカウント用の env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの `token` 値もサポートされています。`channels.discord.token` では、env/file/exec プロバイダー全体で SecretRef 値もサポートされます。詳細は [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初の DM ペアリングを承認する">
    Gateway が起動するまで待ってから、Discord でボットに DM を送ります。ペアリングコードが返信されます。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネルでそのペアリングコードをエージェントに送ってください。

        > 「この Discord ペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間で期限切れになります。

    これで Discord の DM 経由でエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。config のトークン値が env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントでのみ使用されます。
高度な送信呼び出し（message tool/channel actions）では、明示的な呼び出しごとの `token` がその呼び出しに使われます。これは send と read/probe 系アクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントのポリシー/再試行設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: guild ワークスペースを設定する

DM が機能したら、Discord サーバーを完全なワークスペースとして設定できます。ここでは各チャンネルが独自のコンテキストを持つ個別のエージェントセッションになります。これは、あなたとボットだけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーを guild 許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「私の Discord Server ID `<server_id>` を guild 許可リストに追加してください」
      </Tab>
      <Tab title="設定">

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

  <Step title="@mention なしの応答を許可する">
    デフォルトでは、エージェントは guild チャンネル内では @mention されたときだけ応答します。プライベートサーバーでは、すべてのメッセージに応答するようにしたい場合が多いでしょう。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「このサーバーでは、@mentioned しなくてもエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="設定">
        guild 設定で `requireMention: false` を設定します。

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

  <Step title="guild チャンネルでのメモリ運用を計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。guild チャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord チャンネルで質問するとき、MEMORY.md から長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れてください（これらはすべてのセッションに注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

では、Discord サーバーにいくつかチャンネルを作成してチャットを始めましょう。エージェントはチャンネル名を見ることができ、各チャンネルはそれぞれ独立したセッションになります。したがって、`#coding`、`#home`、`#research` など、ワークフローに合う形で設定できます。

## ランタイムモデル

- Gateway が Discord 接続を管理します。
- 返信ルーティングは決定的です。Discord からの受信返信は Discord に返されます。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- guild チャンネルは独立したセッションキーです（`agent:<agentId>:discord:channel:<channelId>`）。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは独立したコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティングされた会話セッションには引き続き `CommandTargetSessionKey` が渡されます。
- Discord へのテキストのみの cron/Heartbeat 通知配信では、
  エージェントに見える最終回答が一度だけ使用されます。メディアおよび構造化コンポーネントのペイロードは、
  エージェントが複数の配信可能ペイロードを出力した場合、引き続き複数メッセージになります。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルは、スレッド投稿のみ受け付けます。OpenClaw はそれらを作成するために 2 つの方法をサポートしています。

- フォーラム親 (`channel:<forumId>`) にメッセージを送信して、スレッドを自動作成する。スレッドタイトルには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使ってスレッドを直接作成する。フォーラムチャンネルでは `--message-id` を渡さないでください。

例: フォーラム親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラム親は Discord components を受け付けません。components が必要な場合は、スレッド自体 (`channel:<threadId>`) に送信してください。

## インタラクティブコンポーネント

OpenClaw はエージェントメッセージ向けに Discord components v2 コンテナをサポートしています。`components` ペイロード付きで message tool を使ってください。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では、最大 5 個のボタンまたは単一のセレクトメニューを使用できます
- セレクトタイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、components は単回使用です。ボタン、セレクト、フォームを期限切れまで複数回使用できるようにするには、`components.reusable=true` を設定します。

誰がボタンをクリックできるかを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーにはエフェメラルの拒否メッセージが表示されます。

`/model` と `/models` のスラッシュコマンドは、プロバイダー、モデル、互換ランタイムのドロップダウンに加えて Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨で、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。ピッカーの返信はエフェメラルで、実行したユーザーだけが利用できます。

ファイル添付:

- `file` ブロックは添付参照（`attachment://<filename>`）を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で提供してください。複数ファイルには `media-gallery` を使います
- 添付参照名に一致させる必要がある場合は、`filename` を使ってアップロード名を上書きします

モーダルフォーム:

- 最大 5 フィールドまでの `components.modal` を追加します
- フィールドタイプ: `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw がトリガーボタンを自動追加します

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
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します（旧式: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` が含まれている必要があります。旧式: `channels.discord.dm.allowFrom`）
    - `disabled`

    DM ポリシーが open でない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングが促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` mention

    数字だけの ID は曖昧であり、明示的な user/channel ターゲット種別が指定されない限り拒否されます。

  </Tab>

  <Tab title="Guild ポリシー">
    guild の処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guild は `channels.discord.guilds` と一致する必要があります（`id` 推奨、slug も可）
    - 送信者許可リストは任意です: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。いずれかが設定されている場合、送信者は `users` または `roles` のどちらかに一致すれば許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。緊急時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグもサポートされますが、ID のほうが安全です。名前/タグのエントリが使われている場合、`openclaw security audit` が警告します
    - guild に `channels` が設定されている場合、一覧にないチャンネルは拒否されます
    - guild に `channels` ブロックがない場合、その許可リスト済み guild 内のすべてのチャンネルが許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、ランタイムフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。これは `channels.defaults.groupPolicy` が `open` であっても同じです。

  </Tab>

  <Tab title="メンションとグループ DM">
    guild メッセージはデフォルトでメンション必須です。

    メンション検出に含まれるもの:

    - 明示的なボットメンション
    - 設定済みのメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 対応ケースにおける暗黙の reply-to-bot 動作

    `requireMention` は guild/channel ごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` を設定すると、別のユーザー/ロールにはメンションしているがボットにはメンションしていないメッセージを任意で破棄できます（@everyone/@here は除く）。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - 任意の許可リスト: `dm.groupChannels`（チャンネル ID または slug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使うと、Discord guild メンバーをロール ID ごとに異なるエージェントへルーティングできます。ロールベースのバインディングはロール ID のみを受け付け、peer または parent-peer バインディングの後、guild のみのバインディングの前に評価されます。バインディングに他の match フィールドも設定されている場合（例: `peer` + `guildId` + `roles`）、設定されたすべてのフィールドが一致する必要があります。

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

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`
- `commands.native=false` は、以前に登録された Discord ネイティブコマンドを明示的にクリアします。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使います。
- Discord UI 上では権限のないユーザーにもコマンドが見える場合がありますが、実行時には OpenClaw の認証が引き続き適用され、「not authorized」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートしています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き有効です。
    `first` は、そのターンの最初の Discord 送信メッセージに暗黙のネイティブ返信参照を常に付加します。
    `batched` は、
    受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙のネイティブ返信参照を付加します。これは、
    ネイティブ返信をあいまいな短時間連投チャット向けに主に使いたいが、
    単一メッセージのすべてのターンでは使いたくない場合に便利です。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキスト到着に応じてそれを編集することで下書き返信をストリーミングできます。`channels.discord.streaming` は `off`（デフォルト） | `partial` | `block` | `progress` を取ります。`progress` は Discord では `partial` にマッピングされます。`streamMode` は旧式の別名で、自動移行されます。

    デフォルトは `off` のままです。複数のボットまたは Gateway が同一アカウントを共有している場合、Discord のプレビュー編集はすぐにレート制限に達するためです。

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

    - `partial` は、トークン到着に応じて 1 つのプレビューメッセージを編集します。
    - `block` は、下書きサイズのチャンクを出力します（サイズと区切り位置は `draftChunk` で調整でき、`textChunkLimit` にクランプされます）。
    - メディア、エラー、明示的返信の最終送信は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、tool/progress 更新がプレビューメッセージを再利用するかどうかを制御します。

    プレビューのストリーミングはテキスト専用です。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    guild 履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）を有効にすると、新しい自動スレッドが親トランスクリプトから初期化されます。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - メッセージツールのリアクションは `user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは **untrusted** コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制御するものであり、補助コンテキスト全体の完全な秘匿境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッド固定セッション">
    Discord では、スレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション（サブエージェントセッションを含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在または新規のスレッドをサブエージェント/セッションターゲットにバインドする
    - `/unfocus` 現在のスレッドバインディングを削除する
    - `/agents` アクティブな実行とバインディング状態を表示する
    - `/session idle <duration|off>` フォーカス済みバインディングの非アクティブ時自動 unfocus を確認/更新する
    - `/session max-age <duration|off>` フォーカス済みバインディングのハード最大期間を確認/更新する

    設定:

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

    注記:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `sessions_spawn({ thread: true })` 用にスレッドを自動作成/バインドするには、`spawnSubagentSessions` を true にする必要があります。
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）用にスレッドを自動作成/バインドするには、`spawnAcpSessions` を true にする必要があります。
    - アカウントでスレッドバインディングが無効な場合、`/focus` と関連するスレッドバインディング操作は利用できません。

    [Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、および [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP チャンネルバインディング">
    安定した「常時稼働」ACP ワークスペースには、Discord 会話を対象とするトップレベルの型付き ACP バインディングを設定します。

    設定パス:

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

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッション上に維持します。スレッドメッセージは親チャンネルのバインディングを継承します。
    - バインド済みのチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインディングは、有効な間はターゲット解決を上書きできます。
    - `spawnAcpSessions` が必要になるのは、OpenClaw が `--thread auto|here` 経由で子スレッドを作成/バインドする必要がある場合だけです。

    バインディング動作の詳細は [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guild ごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理中に確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント識別絵文字へのフォールバック（`agents.list[].identity.emoji`、未設定なら `"👀"`）

    注記:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使います。

  </Accordion>

  <Accordion title="設定の書き込み">
    チャンネル起点の設定書き込みはデフォルトで有効です。

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

  <Accordion title="Gateway プロキシ">
    `channels.discord.proxy` を使うと、Discord Gateway WebSocket トラフィックと起動時の REST 参照（application ID + allowlist 解決）を HTTP(S) プロキシ経由でルーティングできます。

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

  <Accordion title="PluralKit サポート">
    プロキシされたメッセージをシステムメンバーの ID にマッピングする PluralKit 解決を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。プライベートシステムに必要
      },
    },
  },
}
```

    注記:

    - 許可リストには `pk:<memberId>` を使用できます
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slug で照合されます
    - 参照は元の message ID を使用し、時間ウィンドウ制約があります
    - 参照に失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="プレゼンス設定">
    ステータスまたはアクティビティフィールドを設定したとき、または auto presence を有効にしたときに、プレゼンス更新が適用されます。

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

    アクティビティの例（カスタムステータスがデフォルトのアクティビティタイプです）:

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

    ストリーミングの例:

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

    アクティビティタイプ対応表:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（アクティビティテキストをステータス状態として使用。絵文字は任意）
    - 5: Competing

    auto presence の例（ランタイム健全性シグナル）:

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

    auto presence はランタイム可用性を Discord ステータスにマッピングします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダー対応）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM 内でのボタンベース承認処理をサポートし、必要に応じて元のチャンネルに承認プロンプトを投稿することもできます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも 1 人の承認者を解決できる場合、Discord はネイティブ exec 承認を自動有効化します。Discord は、チャンネルの `allowFrom`、旧式の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推論しません。Discord をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネル内に表示されます。ボタンを使えるのは解決済み承認者だけで、他のユーザーにはエフェメラルの拒否が表示されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼できるチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他のチャットチャンネルで使われる共有承認ボタンも描画します。ネイティブ Discord アダプターは主に、承認者 DM ルーティングとチャンネルファンアウトを追加します。
    それらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw
    は、tool の結果でチャット承認が利用不可と示された場合、または
    手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    Gateway 認証と承認解決は共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` で解決され、それ以外の ID は `exec.approval.resolve` で解決されます）。承認のデフォルト有効期限は 30 分です。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord のメッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータ操作が含まれます。

コア例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` 配下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                         | デフォルト |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled    |
| roles                                                                                                                                                                      | disabled   |
| moderation                                                                                                                                                                 | disabled   |
| presence                                                                                                                                                                   | disabled   |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord のメッセージアクションは、カスタム UI 用に `components` も受け付けられます（高度な用途。discord tool 経由で component payload を構築する必要があります）。一方、旧式の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component コンテナで使われるアクセントカラー（hex）を設定します。
- アカウントごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor` です。
- components v2 が存在する場合、`embeds` は無視されます。

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

## 音声

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの **voice channels**（継続的な会話）と、**voice message attachments**（波形プレビュー形式）です。Gateway はその両方をサポートします。

### Voice channels

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザー許可リストを使う場合は Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

`/vc join|leave|status` を使ってセッションを制御します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよび group policy ルールに従います。

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

注記:

- `voice.tts` は音声再生に限り `messages.tts` を上書きします。
- `voice.model` は Discord voice channel 応答専用で使われる LLM を上書きします。未設定の場合はルーティングされたエージェントモデルを継承します。
- STT は `tools.media.audio` を使用します。`voice.model` は文字起こしには影響しません。
- 音声文字起こしターンは Discord `allowFrom`（または `dm.allowFrom`）から所有者ステータスを導出します。所有者でない話者は所有者専用ツール（たとえば `gateway` や `cron`）にアクセスできません。
- 音声はデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定時に `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- OpenClaw は受信復号失敗も監視し、短時間に繰り返し失敗した場合はボイスチャンネルから離脱/再参加して自動回復します。
- 更新後に受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱の `@discordjs/voice` 系列には、discord.js PR #11449 の上流パディング修正が含まれており、これは discord.js issue #11419 を解決したものです。

Voice channel パイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` が STT を処理します。たとえば `openai/gpt-4o-mini-transcribe` です。
- 文字起こしは通常の Discord 受信およびルーティングを通ります。
- `voice.model` が設定されている場合、この voice-channel ターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` の上にマージされ、結果の音声が参加中チャンネルで再生されます。

認証情報はコンポーネントごとに解決されます: `voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証が使われます。

### Voice messages

Discord の voice message は波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上で `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス** を指定してください（URL は拒否されます）。
- テキスト内容は省略してください（Discord は同一ペイロード内のテキスト + voice message を拒否します）。
- 音声形式は任意です。OpenClaw が必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、またはボットが guild メッセージを見られない">

    - Message Content Intent を有効にする
    - user/member 解決に依存している場合は Server Members Intent を有効にする
    - intent を変更した後は gateway を再起動する

  </Accordion>

  <Accordion title="guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下の guild 許可リストを確認する
    - guild の `channels` マップが存在する場合、一覧にあるチャンネルだけが許可される
    - `requireMention` の動作と mention パターンを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false なのにまだブロックされる">
    よくある原因:

    - 一致する guild/channel 許可リストがないまま `groupPolicy="allowlist"` になっている
    - `requireMention` が間違った場所に設定されている（`channels.discord.guilds` または channel エントリ配下である必要があります）
    - 送信者が guild/channel の `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行ハンドラーがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    リスナーバジェットのノブ:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    worker 実行タイムアウトのノブ:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30 分）。無効にするには `0` を設定

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

    `eventQueue.listenerTimeout` は低速なリスナーセットアップ用に使い、`inboundWorker.runTimeoutMs` は
    キューに入ったエージェントターンに別の安全弁を設けたい場合にのみ使ってください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID に対してのみ機能します。

    slug キーを使っている場合でもランタイム照合は機能することがありますが、probe では権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"`（旧式: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="Bot 間ループ">
    デフォルトでは bot 作成メッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格な mention と許可リストのルールを使ってください。
    ボットにメンションした bot メッセージだけを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="DecryptionFailed(...) で音声 STT が落ちる">

    - Discord 音声受信の回復ロジックが含まれるよう、OpenClaw を最新に保ってください（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、上流の DAVE 受信履歴である [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) および [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) と比較してください

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [Configuration reference - Discord](/ja-JP/gateway/config-channels#discord).

<Accordion title="高シグナルな Discord フィールド">

- 起動/認証: `enabled`、`token`、`accounts.*`、`allowBots`
- ポリシー: `groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- コマンド: `commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナーバジェット）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- 返信/履歴: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- ストリーミング: `streaming`（旧式の別名: `streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb`（Discord 送信アップロードを制限。デフォルト `100MB`）、`retry`
- アクション: `actions.*`
- プレゼンス: `activity`、`status`、`activityType`、`activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`、トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンは秘密情報として扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限の Discord 権限を付与してください。
- コマンド配備/状態が古い場合は gateway を再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild とチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
