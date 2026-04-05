---
read_when:
    - Telegram 機能または webhook に取り組むとき
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-05T12:38:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY による bot の DM とグループ向けに本番運用対応済みです。long polling がデフォルトモードで、webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Telegram のデフォルト DM ポリシーは pairing です。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather で bot トークンを作成する">
    Telegram を開いて **@BotFather** とチャットしてください（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、案内に従ってトークンを保存します。

  </Step>

  <Step title="トークンと DM ポリシーを設定する">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    env フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram では `openclaw channels login telegram` は使いません。config/env にトークンを設定してから Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    pairing コードは 1 時間で期限切れになります。

  </Step>

  <Step title="bot をグループに追加する">
    bot をグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順はアカウント認識型です。実際には、config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="Privacy Mode とグループ可視性">
    Telegram bot はデフォルトで **Privacy Mode** になっており、グループ内で受信できるメッセージが制限されます。

    bot がすべてのグループメッセージを見る必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy` で privacy mode を無効にする
    - bot をグループ管理者にする

    privacy mode を切り替えたときは、Telegram が変更を適用するよう、各グループで bot を削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で管理されます。

    管理者 bot はすべてのグループメッセージを受信でき、常時動作するグループ挙動に便利です。

  </Accordion>

  <Accordion title="便利な BotFather トグル">

    - `/setjoingroups` でグループ追加の許可/拒否
    - `/setprivacy` でグループ可視性の挙動を設定

  </Accordion>
</AccordionGroup>

## アクセス制御と activation

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom` には数値の Telegram ユーザー ID を指定します。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    空の `allowFrom` で `dmPolicy: "allowlist"` を設定すると、すべての DM がブロックされ、config 検証で拒否されます。
    オンボーディングでは `@username` 入力を受け付け、数値 ID に解決します。
    アップグレード後の config に `@username` の allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォートです。Telegram bot トークンが必要です）。
    以前に pairing-store の allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでそのエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    1 オーナー bot では、以前の pairing 承認に依存するのではなく、アクセスポリシーを config に永続的に保持するために、明示的な数値 `allowFrom` ID を持つ `dmPolicy: "allowlist"` を推奨します。

    よくある誤解: DM pairing 承認は「この送信者がどこでも認可される」ことを意味しません。
    pairing が与えるのは DM アクセスのみです。グループ送信者認可は引き続き明示的な config allowlist から行われます。
    「一度認可すれば DM とグループコマンドの両方が使える」状態にしたい場合は、自分の数値 Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティ bot なし）:

    1. bot に DM を送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシー性は低い）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    次の 2 つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` config がない:
         - `groupPolicy: "open"` の場合: どのグループも group-ID チェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定されている: allowlist として機能する（明示的な ID または `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使われます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID である必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram のグループまたは supergroup の chat ID を `groupAllowFrom` に入れないでください。負の chat ID は `channels.telegram.groups` に入れる必要があります。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可は DM pairing-store 承認を継承しません。
    pairing は DM 専用のままです。グループについては `groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram は pairing store ではなく config の `allowFrom` にフォールバックします。
    1 オーナー bot の実用パターン: あなたのユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` で許可します。
    ランタイム注記: `channels.telegram` が完全に欠けている場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズドの `groupPolicy="allowlist"` をデフォルトにします。

    例: 特定の 1 グループで任意のメンバーを許可する

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    例: 特定の 1 グループ内で特定ユーザーのみ許可する

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      よくある間違い: `groupAllowFrom` は Telegram グループ allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたは supergroup chat ID は `channels.telegram.groups` に入れてください。
      - 許可されたグループ内で、どの人が bot を起動できるかを制限したいときは、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーが bot と会話できるようにしたい場合のみ、`groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンションの挙動">
    グループ返信ではデフォルトでメンションが必要です。

    メンションは次のいずれかから得られます。

    - ネイティブの `@botusername` メンション
    - 次の場所の mention pattern:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化には config を使ってください。

    永続 config の例:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    グループ chat ID を取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` で `chat.id` を読む
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイムの挙動

- Telegram は Gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram からの受信メッセージへの返信は Telegram に返されます（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネル envelope に正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックでは、トピック分離のために `:topic:<threadId>` が付加されます。
- DM メッセージは `message_thread_id` を持てます。OpenClaw はそれを thread 認識型のセッションキーでルーティングし、返信時も thread ID を保持します。
- long polling は、チャットごと / thread ごとの順序制御を備えた grammY runner を使います。全体の runner sink concurrency には `agents.defaults.maxConcurrent` を使います。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` は Telegram では `partial` にマップされます（チャネル横断の命名互換性のため）
    - レガシーな `channels.telegram.streamMode` と boolean の `streaming` 値は自動マッピングされます

    テキストのみの返信の場合:

    - DM: OpenClaw は同じプレビューメッセージを保持し、最後にその場で編集します（2 通目のメッセージは送信しません）
    - グループ/トピック: OpenClaw は同じプレビューメッセージを保持し、最後にその場で編集します（2 通目のメッセージは送信しません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングは block streaming とは別です。Telegram で block streaming が明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

    ネイティブの draft transport が利用できないか拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram 専用の reasoning ストリーム:

    - `/reasoning stream` は、生成中の reasoning をライブプレビューに送信します
    - 最終回答は reasoning テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram の `parse_mode: "HTML"` を使います。

    - Markdown 風テキストは Telegram 安全な HTML にレンダリングされます。
    - 生のモデル HTML は Telegram の解析失敗を減らすためエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニュー登録は起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加する:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
    },
  },
}
```

    ルール:

    - 名前は正規化されます（先頭の `/` を削除し、小文字化）
    - 有効パターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。動作は自動実装されません
    - Telegram メニューに表示されなくても、plugin/skill コマンドは手入力で動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録されることがあります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、削減後でも Telegram メニューが多すぎることを意味します。plugin/skill/custom コマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` で network/fetch エラーが出る場合、通常は `api.telegram.org` への outbound DNS/HTTPS がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` で保留中リクエストを一覧表示します（role/scopes を含む）
    4. リクエストを承認します:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中リクエストが 1 件だけなら `/pair approve`
       - 最新のものなら `/pair approve latest`

    セットアップコードには短命の bootstrap トークンが含まれます。組み込みの bootstrap handoff では、主要な node トークンは `scopes: []` のまま維持されます。引き渡される operator トークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。bootstrap の scope チェックは role 接頭辞付きなので、その operator allowlist は operator リクエストにのみ有効であり、operator 以外の role では引き続き自分の role 接頭辞の下の scope が必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使います。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定します。

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    アカウントごとの上書き:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    スコープ:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（デフォルト）

    レガシーな `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    callback クリックは、次のテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化のための Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます。

    - `sendMessage`（`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`）
    - `react`（`chatId`, `messageId`, `emoji`）
    - `deleteMessage`（`chatId`, `messageId`）
    - `editMessage`（`chatId`, `messageId`, `content`）
    - `createForumTopic`（`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを公開します（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信は、アクティブな config/secrets スナップショット（起動/再読み込み時）を使うため、アクションパスでは送信ごとに ad-hoc な SecretRef 再解決は行いません。

    リアクション削除の意味論: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="返信 thread タグ">
    Telegram は生成出力内で明示的な返信 thread タグをサポートします。

    - `[[reply_to_current]]` は起動元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram message ID に返信します

    `channels.telegram.replyToMode` は処理方法を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    注記: `off` は暗黙の返信 thread 化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックと thread の挙動">
    forum supergroup では:

    - トピックのセッションキーに `:topic:<threadId>` が追加されます
    - 返信と typing はそのトピック thread を対象にします
    - トピック config パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - typing アクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` はトピック専用で、グループデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック config に `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックが独自の分離された workspace、memory、session を持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    その場合、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: forum topic は、トップレベルの型付き ACP binding を通じて ACP harness session を固定できます。

    - `type: "acp"` と `match.channel: "telegram"` を持つ `bindings[]`

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    これは現在、グループおよび supergroup 内の forum topic に限定されています。

    **チャットからの thread 固定 ACP 起動**:

    - `/acp spawn <agent> --thread here|auto` で、現在の Telegram トピックを新しい ACP session にバインドできます。
    - 後続のトピックメッセージは、バインドされた ACP session に直接ルーティングされます（`/acp steer` は不要）。
    - OpenClaw は、バインド成功後に起動確認メッセージをそのトピック内に pin します。
    - `channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストには次が含まれます。

    - `MessageThreadId`
    - `IsForum`

    DM thread の挙動:

    - `message_thread_id` を持つプライベートチャットでは、DM ルーティングを維持しつつ、thread 認識型の session key / reply target を使います。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルとしての挙動
    - エージェント返信に `[[audio_as_voice]]` タグを付けると、ボイスノート送信を強制

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 動画メッセージ

    Telegram は動画ファイルと video note を区別します。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    video note はキャプションをサポートしません。指定したメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカー処理:

    - 静的 WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップ
    - 動画 WEBM: スキップ

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは、繰り返しの vision 呼び出しを減らすため、一度説明可能な場合に説明されてキャッシュされます。

    ステッカーアクションを有効化:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    ステッカー送信アクション:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュ済みステッカーを検索:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効時、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    config:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は bot 送信メッセージへのユーザーリアクションのみを意味します（送信メッセージキャッシュを使ったベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。認可されていない送信者は破棄されます。
    - Telegram はリアクション更新に thread ID を含めません。
      - forum でないグループではグループ chat session にルーティングされます
      - forum グループでは、正確な元トピックではなく、グループ一般トピック session（`:topic:1`）にルーティングされます

    polling/webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理中であることを示す確認用絵文字を送ります。

    解決順:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント identity 絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注記:

    - Telegram は unicode 絵文字を期待します（たとえば `"👀"`）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使ってください。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの config 書き込み">
    チャネル config 書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram 起点の書き込みには次が含まれます。

    - `channels.telegram.groups` を更新するためのグループ migration イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンド有効化が必要）

    無効化するには:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling と webhook">
    デフォルト: long polling。

    webhook モード:

    - `channels.telegram.webhookUrl` を設定
    - `channels.telegram.webhookSecret` を設定（webhook URL を設定した場合は必須）
    - 任意で `channels.telegram.webhookPath`（デフォルト `/telegram-webhook`）
    - 任意で `channels.telegram.webhookHost`（デフォルト `127.0.0.1`）
    - 任意で `channels.telegram.webhookPort`（デフォルト `8787`）

    webhook モードのデフォルトのローカルリスナーは `127.0.0.1:8787` に bind します。

    公開エンドポイントが異なる場合は、その前段に reverse proxy を置き、`webhookUrl` を公開 URL に向けてください。
    意図的に外部 ingress が必要な場合は、`webhookHost`（たとえば `0.0.0.0`）を設定してください。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さ分割の前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信・送信両方の Telegram メディアサイズ上限です。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定時は grammY デフォルト）。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使います。`0` で無効化します。
    - reply/quote/forward の補助コンテキストは、現在は受信したまま渡されます。
    - Telegram の allowlist は主に誰がエージェントを起動できるかを制御するものであり、補助コンテキスト全体のマスキング境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config は、回復可能な outbound API エラーに対する Telegram 送信ヘルパー（CLI/tools/actions）に適用されます。

    CLI の送信ターゲットには数値 chat ID または username を使えます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の poll には `openclaw message poll` を使い、forum topic もサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の poll フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - forum topic 用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信では次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合の、インラインキーボード用 `--buttons`
    - 送信画像や GIF を圧縮された写真やアニメーションメディアアップロードではなく document として送る `--force-document`

    アクションゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、poll を含む outbound Telegram メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常送信は有効のまま Telegram poll 作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は approver DM 内で exec 承認をサポートし、任意で元のチャットまたはトピックに承認プロンプトを投稿できます。

    config パス:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（任意。可能な場合は `allowFrom` とダイレクトメッセージの `defaultTo` から推測される数値 owner ID にフォールバック）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`

    approver は数値の Telegram ユーザー ID である必要があります。`enabled` が未設定または `"auto"` で、`execApprovals.approvers` またはアカウントの数値 owner config（`allowFrom` とダイレクトメッセージの `defaultTo`）から少なくとも 1 人の approver を解決できる場合、Telegram はネイティブ exec 承認を自動有効化します。Telegram をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。そうでない場合、承認リクエストは他の設定済み承認ルートまたは exec 承認フォールバックポリシーにフォールバックします。

    Telegram は、他のチャットチャネルで使われる共有承認ボタンもレンダリングします。ネイティブ Telegram アダプターが主に追加するのは、approver DM へのルーティング、チャネル/トピックへのファンアウト、配信前の typing ヒントです。
    それらのボタンがある場合、それが主要な承認 UX です。OpenClaw は、ツール結果でチャット承認が利用不可と示される場合、または手動承認が唯一の手段である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    配信ルール:

    - `target: "dm"` は、解決された approver DM にのみ承認プロンプトを送信します
    - `target: "channel"` は、元の Telegram chat/topic にプロンプトを送り返します
    - `target: "both"` は、approver DM と元の chat/topic の両方に送信します

    解決された approver のみが承認または拒否できます。approver でない人は `/approve` も Telegram 承認ボタンも使えません。

    承認解決の挙動:

    - `plugin:` で始まる承認 ID は常に plugin 承認を通じて解決されます。
    - それ以外の承認 ID は最初に `exec.approval.resolve` を試します。
    - Telegram も plugin 承認用に認可されており、かつ Gateway が exec 承認を unknown/expired と返した場合、Telegram は `plugin.approval.resolve` で 1 回だけ再試行します。
    - 実際の exec 承認拒否/エラーは、黙って plugin 承認解決にフォールスルーしません。

    チャネル配信ではコマンドテキストが chat に表示されるため、`channel` または `both` は信頼できるグループ/トピックでのみ有効化してください。forum topic にプロンプトが届いた場合、OpenClaw は承認プロンプトと承認後フォローアップの両方でそのトピックを維持します。exec 承認のデフォルト有効期限は 30 分です。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。

    関連ドキュメント: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇したとき、Telegram はそのエラーテキストを返信するか、抑制するかを選べます。この挙動は 2 つの config キーで制御されます。

| キー | 値 | デフォルト | 説明 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` は chat にわかりやすいエラーメッセージを送ります。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同じ chat へのエラー返信の最小間隔。障害時のエラースパムを防ぎます。 |

アカウントごと、グループごと、トピックごとの上書きがサポートされます（他の Telegram config キーと同じ継承）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // このグループではエラーを抑制
        },
      },
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="bot がメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram privacy mode が完全可視性を許可している必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループから bot を削除して再追加
    - `openclaw channels status` は、config がメンションなしのグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` は membership probe できません。
    - 手早いセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="bot がグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、グループはそこに列挙されている必要があります（または `"*"` を含める）
    - グループ内の bot メンバーシップを確認
    - スキップ理由は `openclaw logs --follow` でログを確認

  </Accordion>

  <Accordion title="コマンドが部分的にしか動かない、またはまったく動かない">

    - 送信者 ID を認可する（pairing および/または数値 `allowFrom`）
    - グループポリシーが `open` でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目が多すぎます。plugin/skill/custom コマンドを減らすか、ネイティブメニューを無効化してください
    - `setMyCommands failed` で network/fetch エラーが出る場合、通常は `api.telegram.org` への DNS/HTTPS 到達性の問題です

  </Accordion>

  <Accordion title="polling またはネットワークの不安定さ">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型の不一致により即時 abort 挙動が発生することがあります。
    - 一部ホストでは `api.telegram.org` がまず IPv6 に解決され、IPv6 outbound が壊れていると Telegram API 障害が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれている場合、OpenClaw は現在これらを回復可能なネットワークエラーとして再試行します。
    - 直接 outbound/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由にしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ では `autoSelectFamily=true`（WSL2 を除く）と `dnsResultOrder=ipv4first` がデフォルトです。
    - ホストが WSL2 である、または明示的に IPv4-only のほうがうまく動作する場合は、family selection を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 の benchmark-range 応答（`198.18.0.0/15`）は、Telegram メディアダウンロードでデフォルト許可されています。信頼できる fake-IP または transparent proxy がメディアダウンロード中に `api.telegram.org` を別の private/internal/special-use アドレスへ書き換える場合は、Telegram 専用バイパスを opt-in できます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ opt-in はアカウントごとにも利用できます:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。Telegram メディアは RFC 2544 benchmark range をすでにデフォルト許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、信頼できる operator 管理の proxy 環境が RFC 2544 benchmark range 外の private または special-use 応答を合成する場合にのみ使ってください。通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 一時的な環境変数上書き:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を検証する:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

さらに詳しく: [チャネルのトラブルシューティング](/channels/troubleshooting)。

## Telegram config リファレンスのポイント

主なリファレンス:

- `channels.telegram.enabled`: チャネル起動の有効/無効。
- `channels.telegram.botToken`: bot トークン（BotFather）。
- `channels.telegram.tokenFile`: 通常ファイルのパスからトークンを読み取ります。symlink は拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM allowlist（数値 Telegram ユーザー ID）。`allowlist` には少なくとも 1 つの送信者 ID が必要です。`open` には `"*"` が必要です。`openclaw doctor --fix` はレガシー `@username` エントリを ID に解決し、allowlist 移行フローで pairing-store ファイルから allowlist エントリを復元できます。
- `channels.telegram.actions.poll`: Telegram poll 作成を有効化または無効化します（デフォルト: 有効。引き続き `sendMessage` が必要）。
- `channels.telegram.defaultTo`: CLI `--deliver` が明示的な `--reply-to` なしで使うデフォルトの Telegram ターゲット。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者 allowlist（数値 Telegram ユーザー ID）。`openclaw doctor --fix` はレガシー `@username` エントリを ID に解決できます。数値でないエントリは認可時に無視されます。グループ認可では DM pairing-store フォールバックを使いません（`2026.2.25+`）。
- マルチアカウントの優先順位:
  - 2 つ以上の account ID が設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか、`channels.telegram.accounts.default` を含めてください。
  - どちらも設定されていない場合、OpenClaw は最初に正規化された account ID にフォールバックし、`openclaw doctor` が警告します。
  - `channels.telegram.accounts.default.allowFrom` と `channels.telegram.accounts.default.groupAllowFrom` は `default` アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベルの値が未設定の場合、`channels.telegram.allowFrom` と `channels.telegram.groupAllowFrom` を継承します。
  - 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。
- `channels.telegram.groups`: グループごとのデフォルト + allowlist（グローバルデフォルトには `"*"` を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy のグループごとの上書き（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: メンションゲーティングのデフォルト。
  - `channels.telegram.groups.<id>.skills`: skill フィルター（省略 = すべての Skills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループごとの送信者 allowlist 上書き。
  - `channels.telegram.groups.<id>.systemPrompt`: グループ用の追加 system prompt。
  - `channels.telegram.groups.<id>.enabled`: `false` のときグループを無効化。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピックごとの上書き（グループフィールド + トピック専用 `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定のエージェントにルーティングします（グループレベルと binding ルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy のトピックごとの上書き（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: トピックごとのメンションゲーティング上書き。
- `type: "acp"` と `match.peer.id` に正規のトピック ID `chatId:topic:topicId` を持つトップレベル `bindings[]`: 永続 ACP トピック binding フィールド（[ACP Agents](/tools/acp-agents#channel-specific-settings)を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM トピックを特定のエージェントにルーティングします（forum topic と同じ挙動）。
- `channels.telegram.execApprovals.enabled`: このアカウントで Telegram をチャットベースの exec 承認クライアントとして有効化。
- `channels.telegram.execApprovals.approvers`: exec リクエストを承認または拒否できる Telegram ユーザー ID。`channels.telegram.allowFrom` またはダイレクトな `channels.telegram.defaultTo` で owner がすでに識別されている場合は任意です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel` と `both` は、存在する場合に元の Telegram トピックを維持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト向けの任意のエージェント ID フィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト向けの任意の session key フィルター（substring または regex）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec 承認ルーティングと approver 認可のアカウントごとの上書き。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウントごとの上書き。
- `channels.telegram.commands.nativeSkills`: Telegram ネイティブ skills コマンドの有効/無効。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または `newline`。length chunking の前に空行で分割します（段落境界）。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビュー切り替え（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress` は `partial` にマップ。`block` はレガシーなプレビューモード互換）。Telegram のプレビューストリーミングは、1 つのプレビューメッセージをその場で編集します。
- `channels.telegram.mediaMaxMb`: 受信/送信 Telegram メディア上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な outbound API エラーに対する Telegram 送信ヘルパー（CLI/tools/actions）の再試行ポリシー（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`: Node の autoSelectFamily を上書き（true=有効、false=無効）。デフォルトでは Node 22+ で有効、WSL2 ではデフォルトで無効。
- `channels.telegram.network.dnsResultOrder`: DNS 結果順序を上書き（`ipv4first` または `verbatim`）。デフォルトでは Node 22+ で `ipv4first`。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: 信頼できる fake-IP または transparent-proxy 環境で、Telegram メディアダウンロードがデフォルトの RFC 2544 benchmark-range 許可外の private/internal/special-use アドレスに `api.telegram.org` を解決する場合の危険な opt-in。
- `channels.telegram.proxy`: Bot API 呼び出し用の proxy URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: webhook モードを有効化（`channels.telegram.webhookSecret` が必要）。
- `channels.telegram.webhookSecret`: webhook secret（webhookUrl が設定されている場合は必須）。
- `channels.telegram.webhookPath`: ローカル webhook パス（デフォルト `/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカル webhook bind ホスト（デフォルト `127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカル webhook bind ポート（デフォルト `8787`）。
- `channels.telegram.actions.reactions`: Telegram ツールリアクションのゲート。
- `channels.telegram.actions.sendMessage`: Telegram ツールメッセージ送信のゲート。
- `channels.telegram.actions.deleteMessage`: Telegram ツールメッセージ削除のゲート。
- `channels.telegram.actions.sticker`: Telegram ステッカーアクションのゲート — 送信と検索（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントを発生させるかを制御（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — エージェントのリアクション機能を制御（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー返信挙動を制御（デフォルト: `reply`）。アカウント/グループ/トピックごとの上書き対応。
- `channels.telegram.errorCooldownMs`: 同じ chat へのエラー返信間の最小 ms（デフォルト: `60000`）。障害時のエラースパムを防ぎます。

- [Configuration reference - Telegram](/gateway/configuration-reference#telegram)

Telegram 固有の重要フィールド:

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があり、symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`blockStreaming`
- 書式設定/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## 関連

- [ペアリング](/channels/pairing)
- [グループ](/channels/groups)
- [Security](/gateway/security)
- [チャネルルーティング](/channels/channel-routing)
- [マルチエージェントルーティング](/concepts/multi-agent)
- [トラブルシューティング](/channels/troubleshooting)
