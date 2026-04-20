---
read_when:
    - Telegramの機能またはWebhookに取り組んでいる場合
summary: Telegramボットのサポート状況、機能、および設定
title: Telegram
x-i18n:
    generated_at: "2026-04-20T04:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY経由でのボットDMおよびグループ向けに本番運用対応済み。デフォルトモードはロングポーリングで、Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネルの診断と修復プレイブック。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでボットトークンを作成する">
    Telegramを開き、**@BotFather**とチャットします（ハンドルが正確に`@BotFather`であることを確認してください）。

    `/newbot`を実行し、案内に従って、トークンを保存します。

  </Step>

  <Step title="トークンとDMポリシーを設定する">

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

    環境変数のフォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegramでは`openclaw channels login telegram`は使用しません。config/envでトークンを設定してから、gatewayを起動してください。

  </Step>

  <Step title="gatewayを起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは1時間で期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後`channels.telegram.groups`と`groupPolicy`をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順はアカウント対応です。実際には、configの値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN`はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegramボットはデフォルトで**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy`でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えたときは、Telegramが変更を適用するよう、各グループでボットを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramのグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に便利です。

  </Accordion>

  <Accordion title="便利なBotFatherの切り替え項目">

    - グループ追加の許可/拒否を行う`/setjoingroups`
    - グループ可視性の動作を設定する`/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy`はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom`に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom`に`"*"`を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom`は数値のTelegramユーザーIDを受け付けます。`telegram:` / `tg:`プレフィックスは受け入れられ、正規化されます。
    空の`allowFrom`での`dmPolicy: "allowlist"`はすべてのDMをブロックし、config検証で拒否されます。
    セットアップでは数値のユーザーIDのみを求めます。
    アップグレード後にconfigに`@username`のallowlistエントリが含まれている場合は、`openclaw doctor --fix`を実行して解決してください（ベストエフォートです。Telegramボットトークンが必要です）。
    以前にペアリングストアのallowlistファイルに依存していた場合は、allowlistフローで`openclaw doctor --fix`によりエントリを`channels.telegram.allowFrom`へ復元できます（たとえば、`dmPolicy: "allowlist"`にまだ明示的なIDがない場合）。

    単一オーナーのボットでは、アクセスポリシーをconfig内で永続的に保つため、以前のペアリング承認に依存するのではなく、明示的な数値`allowFrom` IDを指定した`dmPolicy: "allowlist"`を推奨します。

    よくある混乱: DMペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングが付与するのはDMアクセスのみです。グループ送信者の認可は依然として明示的なconfigのallowlistから行われます。
    「一度認可されれば、DMもグループコマンドも両方使える」状態にしたい場合は、数値のTelegramユーザーIDを`channels.telegram.allowFrom`に入れてください。

    ### TelegramユーザーIDを見つける

    より安全な方法（サードパーティボット不要）:

    1. ボットにDMを送る。
    2. `openclaw logs --follow`を実行する。
    3. `from.id`を読む。

    公式Bot APIの方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーはやや低い）: `@userinfobot`または`@getidsbot`。

  </Tab>

  <Tab title="グループポリシーとallowlist">
    2つの制御が一緒に適用されます。

    1. **どのグループを許可するか**（`channels.telegram.groups`）
       - `groups` configなし:
         - `groupPolicy: "open"`の場合: どのグループでもgroup-IDチェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups`エントリ（または`"*"`）を追加するまでグループはブロックされます
       - `groups`が設定されている場合: allowlistとして機能します（明示的なIDまたは`"*"`）

    2. **グループ内でどの送信者を許可するか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom`はグループ送信者のフィルタリングに使用されます。設定されていない場合、Telegramは`allowFrom`にフォールバックします。
    `groupAllowFrom`のエントリは数値のTelegramユーザーIDである必要があります（`telegram:` / `tg:`プレフィックスは正規化されます）。
    TelegramのグループまたはスーパーグループのチャットIDを`groupAllowFrom`に入れないでください。負のチャットIDは`channels.telegram.groups`に属します。
    数値でないエントリは送信者認可で無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証はDMペアリングストアの承認を継承しません。
    ペアリングはDM専用のままです。グループ向けには、`groupAllowFrom`またはグループ単位/トピック単位の`allowFrom`を設定してください。
    `groupAllowFrom`が未設定の場合、Telegramはペアリングストアではなくconfigの`allowFrom`にフォールバックします。
    単一オーナーのボット向けの実用的なパターン: ユーザーIDを`channels.telegram.allowFrom`に設定し、`groupAllowFrom`は未設定のままにして、対象グループを`channels.telegram.groups`で許可します。
    ランタイム注記: `channels.telegram`が完全に欠けている場合、`channels.defaults.groupPolicy`が明示的に設定されていない限り、ランタイムのデフォルトはフェイルクローズの`groupPolicy="allowlist"`です。

    例: 特定の1つのグループで任意のメンバーを許可する:

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

    例: 特定の1つのグループ内で特定ユーザーのみを許可する:

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
      よくある誤り: `groupAllowFrom`はTelegramグループのallowlistではありません。

      - `-1001234567890`のような負のTelegramグループまたはスーパーグループのチャットIDは`channels.telegram.groups`に入れてください。
      - 許可されたグループ内で、どの人がボットをトリガーできるかを制限したい場合は、`8734062810`のようなTelegramユーザーIDを`groupAllowFrom`に入れてください。
      - `groupAllowFrom: ["*"]`は、許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ使用してください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションが必要です。

    メンションは次のいずれかで行えます。

    - ネイティブの`@botusername`メンション
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化にはconfigを使用してください。

    永続的なconfigの例:

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

    グループチャットIDを取得する方法:

    - グループメッセージを`@userinfobot` / `@getidsbot`に転送する
    - または`openclaw logs --follow`で`chat.id`を読む
    - またはBot APIの`getUpdates`を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegramはgatewayプロセスによって管理されます。
- ルーティングは決定的です: Telegramの受信返信はTelegramへ返信されます（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープへ正規化されます。
- グループセッションはグループIDごとに分離されます。フォーラムトピックはトピックを分離するために`:topic:<threadId>`を追加します。
- DMメッセージは`message_thread_id`を含めることができます。OpenClawはスレッド対応のセッションキーでそれらをルーティングし、返信用にスレッドIDを保持します。
- ロングポーリングは、チャット単位/スレッド単位のシーケンシングを備えたgrammY runnerを使用します。runner sink全体の並行性には`agents.defaults.maxConcurrent`を使用します。
- Telegram Bot APIには既読受信機能がありません（`sendReadReceipts`は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming`が`off | partial | block | progress`であること（デフォルト: `partial`）
    - `progress`はTelegram上では`partial`にマップされます（クロスチャネル命名との互換性のため）
    - 旧来の`channels.telegram.streamMode`と真偽値の`streaming`は自動的にマッピングされます

    テキストのみの返信の場合:

    - DM: OpenClawは同じプレビューメッセージを保持し、最後にその場で編集します（2つ目のメッセージは送信しません）
    - グループ/トピック: OpenClawは同じプレビューメッセージを保持し、最後にその場で編集します（2つ目のメッセージは送信しません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューのストリーミングはブロックストリーミングとは別です。Telegram向けにブロックストリーミングが明示的に有効になっている場合、OpenClawは二重ストリーミングを避けるためプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない、または拒否された場合、OpenClawは自動的に`sendMessage` + `editMessageText`へフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream`は生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegramの`parse_mode: "HTML"`を使用します。

    - Markdown風のテキストはTelegramで安全なHTMLへレンダリングされます。
    - 生のモデルHTMLは、Telegramの解析失敗を減らすためにエスケープされます。
    - Telegramが解析済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false`で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニューの登録は起動時に`setMyCommands`で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"`はTelegram向けのネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加するには:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Gitバックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
    },
  },
}
```

    ルール:

    - 名前は正規化されます（先頭の`/`を除去し、小文字化）
    - 有効なパターン: `a-z`, `0-9`, `_`、長さ`1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみであり、動作を自動実装するものではありません
    - plugin/skillコマンドは、Telegramメニューに表示されていなくても、入力すれば動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/pluginコマンドは引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed`で`BOT_COMMANDS_TOO_MUCH`が出る場合、削減後でもTelegramメニューがまだあふれています。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native`を無効にしてください。
    - `setMyCommands failed`でnetwork/fetchエラーが出る場合、通常は`api.telegram.org`への外向きDNS/HTTPSがブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Pluginがインストールされている場合:

    1. `/pair`でセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending`で保留中のリクエストを一覧表示します（role/scopesを含む）
    4. リクエストを承認します:
       - 明示的な承認には`/pair approve <requestId>`
       - 保留中が1件だけの場合は`/pair approve`
       - 最新のものには`/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き継ぎでは、プライマリNodeトークンは`scopes: []`のまま維持されます。引き継がれたoperatorトークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`の範囲内に制限されます。ブートストラップのスコープチェックはroleプレフィックス付きなので、そのoperator allowlistはoperatorリクエストだけを満たします。operator以外のroleでは、引き続きそれぞれのroleプレフィックス配下のscopesが必要です。

    デバイスが変更された認証詳細（たとえばrole/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは異なる`requestId`を使用します。承認前に`/pair pending`を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定します:

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

    アカウント単位の上書き:

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

    旧来の`capabilities: ["inlineButtons"]`は`inlineButtons: "all"`にマップされます。

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

    コールバッククリックはテキストとしてagentに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="agentと自動化のためのTelegramメッセージアクション">
    Telegramのツールアクションには次が含まれます:

    - `sendMessage`（`to`, `content`, 省略可能: `mediaUrl`, `replyToMessageId`, `messageThreadId`）
    - `react`（`chatId`, `messageId`, `emoji`）
    - `deleteMessage`（`chatId`, `messageId`）
    - `editMessage`（`chatId`, `messageId`, `content`）
    - `createForumTopic`（`chatId`, `name`, 省略可能: `iconColor`, `iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを公開しています（`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit`と`topic-create`は現在デフォルトで有効で、個別の`channels.telegram.actions.*`切り替えはありません。
    ランタイム送信はアクティブなconfig/secretsスナップショット（起動時/リロード時）を使用するため、アクション経路では送信ごとにSecretRefをアドホックに再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegramは生成出力内で明示的な返信スレッディングタグをサポートします:

    - `[[reply_to_current]]`はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]`は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode`が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off`は暗黙的な返信スレッディングを無効にします。明示的な`[[reply_to_*]]`タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックのセッションキーは`:topic:<threadId>`を追加します
    - 返信と入力中表示はそのトピックスレッドを対象にします
    - トピックconfigパス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では`message_thread_id`を省略します（Telegramは`sendMessage(...thread_id=1)`を拒否します）
    - 入力中アクションには引き続き`message_thread_id`を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`）。
    `agentId`はトピック専用で、グループデフォルトからは継承されません。

    **トピック単位のagentルーティング**: 各トピックは、トピックconfigで`agentId`を設定することで別々のagentにルーティングできます。これにより、各トピックは独自に分離されたworkspace、memory、sessionを持てます。例:

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

    各トピックはそれぞれ独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的なACPトピックバインディング**: フォーラムトピックは、トップレベルの型付きACPバインディングを通じてACPハーネスセッションを固定できます:

    - `bindings[]`に`type: "acp"`と`match.channel: "telegram"`を指定

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

    これは現在、グループおよびスーパーグループ内のフォーラムトピックに限定されています。

    **チャットからのスレッドバインドACP起動**:

    - `/acp spawn <agent> --thread here|auto`で、現在のTelegramトピックを新しいACPセッションにバインドできます。
    - 以降のトピックメッセージは、バインドされたACPセッションへ直接ルーティングされます（`/acp steer`は不要）。
    - OpenClawは、バインド成功後に起動確認メッセージをそのトピック内に固定します。
    - `channels.telegram.threadBindings.spawnAcpSessions=true`が必要です。

    テンプレートコンテキストには次が含まれます:

    - `MessageThreadId`
    - `IsForum`

    DMスレッド動作:

    - `message_thread_id`を持つプライベートチャットは、DMルーティングを維持しつつ、スレッド対応のセッションキー/返信先を使用します。

  </Accordion>

  <Accordion title="音声、動画、およびステッカー">
    ### 音声メッセージ

    Telegramはボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイル動作
    - agent返信内のタグ`[[audio_as_voice]]`でボイスノート送信を強制

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

    Telegramは動画ファイルとビデオノートを区別します。

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

    ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカー処理:

    - 静的WEBP: ダウンロードして処理（プレースホルダー`<media:sticker>`）
    - アニメーションTGS: スキップ
    - 動画WEBM: スキップ

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは可能な場合に一度だけ説明生成され、繰り返しのvision呼び出しを減らすためキャッシュされます。

    ステッカーアクションを有効にする:

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

    キャッシュ済みステッカーを検索する:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "手を振る猫",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegramのリアクションは`message_reaction`更新として届きます（メッセージpayloadとは別です）。

    有効時、OpenClawは次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    config:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own`は、ボットが送信したメッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントもTelegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegramはリアクション更新でスレッドIDを提供しません。
      - フォーラムでないグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhookの`allowed_updates`には自動的に`message_reaction`が含まれます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction`は、OpenClawが受信メッセージを処理中に確認用emojiを送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emojiフォールバック（`agents.list[].identity.emoji`、なければ`"👀"`）

    注:

    - Telegramはunicode emojiを想定します（たとえば`"👀"`）。
    - チャネルまたはアカウントでリアクションを無効にするには`""`を使用してください。

  </Accordion>

  <Accordion title="Telegramイベントおよびコマンドからのconfig書き込み">
    チャネルconfig書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーの書き込みには次が含まれます:

    - `channels.telegram.groups`を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set`および`/config unset`（コマンド有効化が必要）

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

  <Accordion title="ロングポーリングとWebhook">
    デフォルト: ロングポーリング。

    Webhookモード:

    - `channels.telegram.webhookUrl`を設定
    - `channels.telegram.webhookSecret`を設定（webhook URL設定時は必須）
    - 任意で`channels.telegram.webhookPath`（デフォルト`/telegram-webhook`）
    - 任意で`channels.telegram.webhookHost`（デフォルト`127.0.0.1`）
    - 任意で`channels.telegram.webhookPort`（デフォルト`8787`）

    Webhookモードのデフォルトローカルリスナーは`127.0.0.1:8787`にバインドされます。

    公開エンドポイントが異なる場合は、前段にリバースプロキシを置き、`webhookUrl`を公開URLに向けてください。
    意図的に外部からの入力を受ける必要がある場合は、`webhookHost`（たとえば`0.0.0.0`）を設定してください。

  </Accordion>

  <Accordion title="制限、リトライ、およびCLIターゲット">
    - `channels.telegram.textChunkLimit`のデフォルトは4000です。
    - `channels.telegram.chunkMode="newline"`は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト100）は、Telegramメディアの受信および送信サイズ上限を設定します。
    - `channels.telegram.timeoutSeconds`はTelegram APIクライアントのタイムアウトを上書きします（未設定の場合はgrammYのデフォルトが適用されます）。
    - グループコンテキスト履歴は`channels.telegram.historyLimit`または`messages.groupChat.historyLimit`（デフォルト50）を使用します。`0`で無効化されます。
    - reply/quote/forwardの補足コンテキストは現在、受信したまま渡されます。
    - Telegramのallowlistは主に、誰がagentをトリガーできるかを制御するものであり、補足コンテキストの完全な秘匿境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` configは、回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/tools/actions）に適用されます。

    CLIの送信ターゲットには数値のchat IDまたはusernameを指定できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramのpollは`openclaw message poll`を使用し、フォーラムトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram専用のpollフラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の`--thread-id`（または`:topic:`ターゲットを使用）

    Telegramのsendは次もサポートします:

    - `channels.telegram.capabilities.inlineButtons`が許可している場合の、インラインキーボード用`--buttons`
    - 送信画像やGIFを圧縮写真やアニメーションメディアアップロードではなく、ドキュメントとして送信する`--force-document`

    アクションのゲーティング:

    - `channels.telegram.actions.sendMessage=false`は、pollを含む送信Telegramメッセージを無効にします
    - `channels.telegram.actions.poll=false`は、通常送信を有効のままにしてTelegram poll作成を無効にします

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは承認者DM内でexec承認をサポートし、必要に応じて元のchatまたはtopicにも承認プロンプトを投稿できます。

    configパス:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（任意。可能な場合は`allowFrom`および直接の`defaultTo`から推定される数値owner IDにフォールバック）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`

    approverは数値のTelegramユーザーIDである必要があります。Telegramは、`enabled`が未設定または`"auto"`で、`execApprovals.approvers`またはアカウントの数値owner config（`allowFrom`およびダイレクトメッセージの`defaultTo`）から少なくとも1人のapproverを解決できる場合、ネイティブexec承認を自動有効化します。ネイティブ承認クライアントとしてのTelegramを明示的に無効にするには、`enabled: false`を設定してください。それ以外の場合、承認リクエストは他の設定済み承認ルートまたはexec承認のフォールバックポリシーにフォールバックします。

    Telegramは、他のチャットチャネルで使われる共有承認ボタンも表示します。ネイティブTelegramアダプターは主に、承認者DMルーティング、チャネル/topicへのファンアウト、および配信前の入力中ヒントを追加します。
    それらのボタンが存在する場合、それが主要な承認UXです。OpenClaw
    は、tool結果が
    チャット承認を利用できないと示す場合、または手動承認のみが唯一の手段である場合にのみ、手動の`/approve`コマンドを含めるべきです。

    配信ルール:

    - `target: "dm"`は、解決済みapproverのDMにのみ承認プロンプトを送信します
    - `target: "channel"`は、元のTelegram chat/topicにプロンプトを返送します
    - `target: "both"`は、approverのDMと元のchat/topicの両方に送信します

    解決済みapproverだけが承認または拒否できます。非approverは`/approve`を使えず、Telegram承認ボタンも使えません。

    承認解決の動作:

    - `plugin:`プレフィックス付きIDは常にplugin承認を通じて解決されます。
    - それ以外の承認IDは、まず`exec.approval.resolve`を試します。
    - Telegramもplugin承認用に認可されており、gatewayが
      exec承認は不明または期限切れだと返した場合、Telegramは
      `plugin.approval.resolve`を通じて一度だけ再試行します。
    - 実際のexec承認拒否/エラーは、黙ってplugin
      承認解決にフォールスルーしません。

    チャネル配信ではchatにコマンドテキストが表示されるため、`channel`または`both`は信頼できるグループ/topicでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClawは承認プロンプトと承認後フォローアップの両方でそのトピックを保持します。exec承認のデフォルト有効期限は30分です。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons`が対象サーフェス（`dm`、`group`、または`all`）を許可していることに依存します。

    関連ドキュメント: [Exec承認](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## エラー返信の制御

agentが配信エラーまたはproviderエラーに遭遇したとき、Telegramではエラーテキストで返信するか、抑制するかを選べます。この動作は2つのconfigキーで制御されます。

| Key                                 | Values            | Default | 説明                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`はchatに親しみやすいエラーメッセージを送信します。`silent`はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同じchatへのエラー返信間の最小時間。障害中のエラースパムを防ぎます。                            |

アカウント単位、グループ単位、およびトピック単位の上書きをサポートしています（他のTelegram configキーと同じ継承）。

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
  <Accordion title="ボットがメンションなしのグループメッセージに応答しない">

    - `requireMention=false`の場合、Telegramプライバシーモードで完全可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> 無効化
      - その後、グループからボットを削除して再追加
    - `openclaw channels status`は、configがメンションなしのグループメッセージを想定していると警告します。
    - `openclaw channels status --probe`は明示的な数値グループIDを確認できます。ワイルドカード`"*"`のメンバーシップはprobeできません。
    - 手早いセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups`が存在する場合、そのグループが列挙されている必要があります（または`"*"`を含める）
    - グループ内でのボットメンバーシップを確認する
    - ログを確認する: スキップ理由は`openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動かない、またはまったく動かない">

    - 送信者IDを認可する（ペアリングおよび/または数値`allowFrom`）
    - グループポリシーが`open`でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed`で`BOT_COMMANDS_TOO_MUCH`が出る場合、ネイティブメニューの項目数が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed`でnetwork/fetchエラーが出る場合、通常は`api.telegram.org`へのDNS/HTTPS到達性の問題を示します

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定さ">

    - Node 22+ + カスタムfetch/proxyでは、AbortSignal型の不一致があると即時中断動作が発生することがあります。
    - 一部のホストは`api.telegram.org`をまずIPv6に解決します。壊れたIPv6送信経路は断続的なTelegram API障害の原因になります。
    - ログに`TypeError: fetch failed`または`Network request for 'getUpdates' failed!`が含まれる場合、OpenClawはこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - 直接の送信経路/TLSが不安定なVPSホストでは、Telegram API呼び出しを`channels.telegram.proxy`経由にしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+のデフォルトは`autoSelectFamily=true`（WSL2を除く）および`dnsResultOrder=ipv4first`です。
    - ホストがWSL2である場合、または明示的にIPv4専用動作のほうが良い場合は、family選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegramメディアダウンロードに対してデフォルトで
      すでに許可されています。信頼できる偽IPまたは
      透過プロキシが、メディアダウンロード中に`api.telegram.org`を
      それ以外のプライベート/内部/特別用途アドレスへ書き換える場合は、
      Telegram専用バイパスを明示的に有効化できます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ明示的有効化はアカウント単位でも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`で利用できます。
    - プロキシがTelegramメディアホストを`198.18.x.x`に解決する場合は、まず
      dangerousフラグをオフのままにしてください。TelegramメディアはすでにRFC 2544
      ベンチマーク範囲をデフォルトで許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`はTelegram
      メディアSSRF保護を弱めます。これは、Clash、Mihomo、またはSurgeの偽IPルーティングのような、オペレーターが信頼して制御するプロキシ環境で、
      RFC 2544ベンチマーク範囲外のプライベートまたは特別用途応答を生成する場合にのみ使用してください。通常の公開インターネットでのTelegramアクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS応答を確認する:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## Telegram設定リファレンスへのポインター

主なリファレンス:

- `channels.telegram.enabled`: チャネル起動の有効/無効。
- `channels.telegram.botToken`: ボットトークン（BotFather）。
- `channels.telegram.tokenFile`: 通常ファイルパスからトークンを読み取ります。シンボリックリンクは拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM allowlist（数値のTelegramユーザーID）。`allowlist`には少なくとも1つの送信者IDが必要です。`open`には`"*"`が必要です。`openclaw doctor --fix`は旧来の`@username`エントリをIDに解決でき、allowlist移行フローではペアリングストアファイルからallowlistエントリを復元することもできます。
- `channels.telegram.actions.poll`: Telegram poll作成を有効または無効にします（デフォルト: 有効。引き続き`sendMessage`が必要です）。
- `channels.telegram.defaultTo`: 明示的な`--reply-to`が指定されていない場合にCLIの`--deliver`で使われるデフォルトのTelegramターゲット。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者allowlist（数値のTelegramユーザーID）。`openclaw doctor --fix`は旧来の`@username`エントリをIDに解決できます。数値でないエントリは認可時に無視されます。グループ認証ではDMペアリングストアのフォールバックは使用されません（`2026.2.25+`）。
- マルチアカウントの優先順位:
  - 2つ以上のアカウントIDが設定されている場合は、デフォルトルーティングを明示するために`channels.telegram.defaultAccount`を設定するか（または`channels.telegram.accounts.default`を含める）、どちらかを行ってください。
  - どちらも設定されていない場合、OpenClawは最初の正規化済みアカウントIDにフォールバックし、`openclaw doctor`が警告します。
  - `channels.telegram.accounts.default.allowFrom`と`channels.telegram.accounts.default.groupAllowFrom`は`default`アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベルの値が未設定の場合に`channels.telegram.allowFrom`と`channels.telegram.groupAllowFrom`を継承します。
  - 名前付きアカウントは`channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`を継承しません。
- `channels.telegram.groups`: グループ単位のデフォルト + allowlist（グローバルデフォルトには`"*"`を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicyのグループ単位上書き（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: メンション制御のデフォルト。
  - `channels.telegram.groups.<id>.skills`: Skillsフィルター（省略 = すべてのSkills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループ単位の送信者allowlist上書き。
  - `channels.telegram.groups.<id>.systemPrompt`: そのグループ向けの追加system prompt。
  - `channels.telegram.groups.<id>.enabled`: `false`の場合、そのグループを無効化。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピック単位の上書き（グループフィールド + トピック専用の`agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定のagentにルーティングします（グループレベルおよびbindingルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicyのトピック単位上書き（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: トピック単位のメンション制御上書き。
- `match.peer.id`に`type: "acp"`と正規のトピックID `chatId:topic:topicId`を持つトップレベルの`bindings[]`: 永続的なACPトピックバインディングフィールド（[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DMトピックを特定のagentにルーティングします（フォーラムトピックと同じ動作）。
- `channels.telegram.execApprovals.enabled`: このアカウントでTelegramをチャットベースのexec承認クライアントとして有効にします。
- `channels.telegram.execApprovals.approvers`: execリクエストの承認または拒否を許可されたTelegramユーザーID。`channels.telegram.allowFrom`または直接の`channels.telegram.defaultTo`ですでにownerが特定されている場合は任意です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel`と`both`は、存在する場合、元のTelegramトピックを保持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト用の任意のagent IDフィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト用の任意のsession keyフィルター（部分文字列またはregex）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec承認ルーティングおよび承認者認可のアカウント単位上書き。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウント単位の上書き。
- `channels.telegram.commands.nativeSkills`: TelegramネイティブSkillsコマンドの有効/無効。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または`newline`。長さチャンク分割の前に空行（段落境界）で分割します。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビューを切り替えます（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress`は`partial`にマップされます。`block`は旧来のプレビューモード互換です）。Telegramのプレビュー配信は、その場で編集される単一のプレビューメッセージを使用します。
- `channels.telegram.mediaMaxMb`: Telegramメディアの受信/送信上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/tools/actions）のリトライポリシー（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`: NodeのautoSelectFamilyを上書きします（true=有効、false=無効）。デフォルトではNode 22+で有効で、WSL2ではデフォルト無効です。
- `channels.telegram.network.dnsResultOrder`: DNS結果順を上書きします（`ipv4first`または`verbatim`）。デフォルトではNode 22+で`ipv4first`です。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: 信頼できる偽IPまたは透過プロキシ環境で、Telegramメディアダウンロード時に`api.telegram.org`がデフォルトのRFC 2544ベンチマーク範囲許可外のプライベート/内部/特別用途アドレスへ解決される場合の危険な明示的有効化。
- `channels.telegram.proxy`: Bot API呼び出し用のプロキシURL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: Webhookモードを有効にします（`channels.telegram.webhookSecret`が必要）。
- `channels.telegram.webhookSecret`: Webhookシークレット（webhookUrl設定時は必須）。
- `channels.telegram.webhookPath`: ローカルWebhookパス（デフォルト`/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカルWebhookバインドホスト（デフォルト`127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカルWebhookバインドポート（デフォルト`8787`）。
- `channels.telegram.actions.reactions`: Telegramツールリアクションのゲート。
- `channels.telegram.actions.sendMessage`: Telegramツールメッセージ送信のゲート。
- `channels.telegram.actions.deleteMessage`: Telegramツールメッセージ削除のゲート。
- `channels.telegram.actions.sticker`: Telegramステッカーアクション（送信と検索）のゲート（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントをトリガーするかを制御します（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agentのリアクション機能を制御します（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー返信動作を制御します（デフォルト: `reply`）。アカウント単位/グループ単位/トピック単位の上書きをサポートします。
- `channels.telegram.errorCooldownMs`: 同じchatへのエラー返信間の最小ミリ秒数（デフォルト: `60000`）。障害中のエラースパムを防ぎます。

- [設定リファレンス - Telegram](/ja-JP/gateway/configuration-reference#telegram)

Telegram固有の重要フィールド:

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile`は通常ファイルを指している必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの`bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`blockStreaming`
- 書式設定/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチagentルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
