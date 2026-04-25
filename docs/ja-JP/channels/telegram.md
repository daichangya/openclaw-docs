---
read_when:
    - Telegramの機能またはWebhookの作業中
summary: Telegramボットのサポート状況、機能、および設定
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

grammY経由のボットDMおよびグループ向けに本番利用可能です。長 pollingがデフォルトモードで、Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャンネルトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでボットトークンを作成する">
    Telegramを開いて **@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、案内に従って、トークンを保存します。

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegramでは `openclaw channels login telegram` は**使用しません**。config/envでトークンを設定してから、Gatewayを起動してください。

  </Step>

  <Step title="Gatewayを起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは1時間後に失効します。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、configの値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegramボットはデフォルトで**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えた場合は、Telegramが変更を適用できるよう、各グループでボットを一度削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つBotFather設定">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `channels.telegram.allowFrom` は数値のTelegramユーザーIDを受け付けます。`telegram:` / `tg:` 接頭辞は受け付けられ、正規化されます。
    空の `allowFrom` で `dmPolicy: "allowlist"` を設定すると、すべてのDMがブロックされ、設定検証で拒否されます。
    セットアップでは数値のユーザーIDのみを求めます。
    アップグレード後にconfigに `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegramボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフローでそれらのエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    単一所有者のボットでは、アクセスポリシーを設定内で永続化するために、明示的な数値 `allowFrom` IDを使った `dmPolicy: "allowlist"` を推奨します（過去のペアリング承認に依存するのではなく）。

    よくある混乱: DMペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングはDMアクセスのみを付与します。グループ送信者の認可は、引き続き明示的なconfig許可リストから行われます。
    「一度認可されれば、DMもグループコマンドも両方使える」ようにしたい場合は、数値のTelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。

    ### TelegramユーザーIDを見つける

    より安全な方法（サードパーティボット不要）:

    1. ボットにDMを送ります。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式Bot APIの方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2つの制御が一緒に適用されます。

    1. **どのグループを許可するか** (`channels.telegram.groups`)
       - `groups` 設定がない場合:
         - `groupPolicy: "open"` の場合: 任意のグループがグループIDチェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして機能します（明示的なIDまたは `"*"`）

    2. **グループ内でどの送信者を許可するか** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使用されます。設定されていない場合、Telegramは `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値のTelegramユーザーIDである必要があります（`telegram:` / `tg:` 接頭辞は正規化されます）。
    TelegramのグループまたはスーパーグループのチャットIDを `groupAllowFrom` に入れないでください。負のチャットIDは `channels.telegram.groups` 配下に置く必要があります。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可はDMペアリングストアの承認を**継承しません**。
    ペアリングはDM専用のままです。グループについては、`groupAllowFrom` またはグループ/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegramはペアリングストアではなくconfigの `allowFrom` にフォールバックします。
    単一所有者ボットの実用的なパターン: ユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` 配下で許可します。
    実行時メモ: `channels.telegram` が完全に欠けている場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、実行時デフォルトはフェイルクローズドの `groupPolicy="allowlist"` です。

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

    例: 特定の1つのグループ内で特定のユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はTelegramグループの許可リストではありません。

      - `-1001234567890` のような負のTelegramグループまたはスーパーグループチャットIDは `channels.telegram.groups` 配下に置いてください。
      - `8734062810` のようなTelegramユーザーIDは、許可されたグループ内でどの人物がボットをトリガーできるかを制限したい場合に `groupAllowFrom` 配下へ置いてください。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ `groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信では、デフォルトでメンションが必要です。

    メンションは次のいずれかです。

    - ネイティブの `@botusername` メンション
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化するにはconfigを使用してください。

    永続的な設定例:

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

    グループチャットIDの取得方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` で `chat.id` を読む
    - または Bot API `getUpdates` を確認する

  </Tab>
</Tabs>

## 実行時の動作

- TelegramはGatewayプロセスによって管理されます。
- ルーティングは決定的です。Telegramからの受信にはTelegramへ返信します（モデルがチャンネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループIDごとに分離されます。Forumトピックは `:topic:<threadId>` を付加してトピックを分離します。
- DMメッセージは `message_thread_id` を持つ場合があり、OpenClawはそれらをスレッド対応セッションキーでルーティングし、返信用にスレッドIDを保持します。
- 長 pollingは、チャットごと/スレッドごとのシーケンス処理を行うgrammY runnerを使用します。全体のrunner sink並行性には `agents.defaults.maxConcurrent` を使用します。
- 長 pollingは各Gatewayプロセス内で保護されているため、1つのボットトークンを同時に使用できるアクティブpollerは1つだけです。それでも `getUpdates` 409競合が表示される場合、別のOpenClaw Gateway、スクリプト、または外部pollerが同じトークンを使用している可能性があります。
- 長 pollingのウォッチドッグ再起動は、デフォルトで `getUpdates` 完了のlivenessが120秒間ない場合にトリガーされます。長時間実行の作業中に誤ったpolling-stall再起動が引き続き発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。この値はミリ秒単位で、`30000` から `600000` の範囲で指定可能であり、アカウントごとの上書きにも対応しています。
- Telegram Bot APIには既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - `progress` はTelegramでは `partial` にマップされます（チャンネル横断の命名との互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - 旧来の `channels.telegram.streamMode` およびブール値の `streaming` は検出されます。`openclaw doctor --fix` を実行して、それらを `channels.telegram.streaming.mode` に移行してください

    ツール進捗プレビュー更新は、ツール実行中に表示される短い「Working...」行です。たとえばコマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegramでは、`v2026.4.22` 以降のリリース済みOpenClawの動作に合わせるため、これらはデフォルトで有効です。回答テキスト用の編集プレビューは維持しつつ、ツール進捗行を非表示にしたい場合は、次のように設定します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Telegramのプレビュー編集を完全に無効化したい場合にのみ `streaming.mode: "off"` を使用してください。ツール進捗ステータス行のみを無効にしたい場合は `streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - DM: OpenClawは同じプレビューメッセージを維持し、その場で最終編集を行います（2通目のメッセージはありません）
    - グループ/トピック: OpenClawは同じプレビューメッセージを維持し、その場で最終編集を行います（2通目のメッセージはありません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegramでブロックストリーミングが明示的に有効な場合、OpenClawは二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない、または拒否された場合、OpenClawは自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream` は生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegram `parse_mode: "HTML"` を使用します。

    - Markdown風テキストはTelegramで安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramのパース失敗を減らすためにエスケープされます。
    - Telegramがパース済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` はTelegramのネイティブコマンドを有効にします

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

    - 名前は正規化されます（先頭の `/` を削除し、小文字化）
    - 有効なパターン: `a-z`, `0-9`, `_`, 長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみで、動作は自動実装されません
    - Plugin/skillコマンドは、Telegramメニューに表示されていなくても、入力すれば動作することがあります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/Pluginコマンドは引き続き登録される場合があります。

    よくある設定失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、削減後でもTelegramメニューがまだ上限を超えています。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` で network/fetch errors が出る場合、通常は `api.telegram.org` へのDNS/HTTPS送信がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Pluginがインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending` で保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. リクエストを承認します:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中リクエストが1件だけの場合は `/pair approve`
       - 最新のものを承認する場合は `/pair approve latest`

    セットアップコードには短命なブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しでは、主要なnodeトークンは `scopes: []` のまま維持され、引き渡されたoperatorトークンは `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write` に制限されたままです。ブートストラップのスコープチェックはロール接頭辞付きであるため、このoperator許可リストはoperatorリクエストにのみ適用され、operator以外のロールは引き続き自身のロール接頭辞配下でスコープを必要とします。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストでは別の `requestId` が使用されます。承認前に `/pair pending` を再実行してください。

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

    旧来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "オプションを選択してください:",
  buttons: [
    [
      { text: "はい", callback_data: "yes" },
      { text: "いいえ", callback_data: "no" },
    ],
    [{ text: "キャンセル", callback_data: "cancel" }],
  ],
}
```

    コールバッククリックは、テキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化のためのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます:

    - `sendMessage` (`to`, `content`, 任意の `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, 任意の `iconColor`, `iconCustomEmojiId`)

    チャンネルメッセージアクションは、使いやすい別名（`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`）を公開します。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    実行時の送信では、アクティブなconfig/secretsスナップショット（起動時/リロード時）を使用するため、アクションパスは送信ごとにアドホックなSecretRef再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegramは、生成出力内の明示的な返信スレッディングタグをサポートしています。

    - `[[reply_to_current]]` はトリガーとなったメッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off` は暗黙的な返信スレッディングを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="Forumトピックとスレッド動作">
    Forumスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を付加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定（`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントへルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般トピック → mainエージェント
                "3": { agentId: "zu" },        // 開発トピック → zuエージェント
                "5": { agentId: "coder" }      // コードレビュー → coderエージェント
              }
            }
          }
        }
      }
    }
    ```

    その後、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的なACPトピックバインディング**: Forumトピックは、トップレベルの型付きACPバインディング（`bindings[]` で `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾付きID）を通じてACP harnessセッションを固定できます。現在はグループ/スーパーグループ内のforumトピックに限定されています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッドバインドACP起動**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しいACPセッションにバインドし、その後のメッセージは直接そこへルーティングされます。OpenClawは起動確認をトピック内に固定表示します。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストでは `MessageThreadId` と `IsForum` が公開されます。`message_thread_id` を持つDMチャットはDMルーティングを維持しますが、スレッド対応セッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegramはボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルとしての動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスノート送信を強制

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

    ビデオノートはキャプションをサポートしないため、指定したメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的WEBP: ダウンロードして処理します（プレースホルダー `<media:sticker>`）
    - アニメーションTGS: スキップします
    - 動画WEBM: スキップします

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは、繰り返しのvision呼び出しを減らすため、可能な場合に一度だけ説明されてキャッシュされます。

    ステッカーアクションを有効化するには:

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

    キャッシュ済みステッカーを検索するには:

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
    Telegramのリアクションは、`message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClawは次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージに対するユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントもTelegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegramはリアクション更新にスレッドIDを含めません。
      - 非forumグループはグループチャットセッションにルーティングされます
      - forumグループは、正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    polling/webhook用の `allowed_updates` には、自動的に `message_reaction` が含まれます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理中に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントアイデンティティ絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注記:

    - TelegramはUnicode絵文字を期待します（たとえば `"👀"`）。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegramイベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーによる書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` および `/config unset`（コマンド有効化が必要）

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

  <Accordion title="長 polling とWebhook">
    デフォルトは長 pollingです。Webhookモードにするには `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます（デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`）。

    ローカルリスナーは `127.0.0.1:8787` にバインドされます。公開入口にする場合は、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhookモードでは、Telegramに `200` を返す前に、リクエストガード、Telegramシークレットトークン、JSONボディを検証します。  
その後、OpenClawは更新を、長 pollingで使用されるのと同じチャットごと/トピックごとのボットレーンを通じて非同期に処理するため、エージェントの応答が遅くてもTelegramの配信ACKを保持しません。

  </Accordion>

  <Accordion title="制限、再試行、CLIターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは4000です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト100）は、受信および送信のTelegramメディアサイズ上限を設定します。
    - `channels.telegram.timeoutSeconds` はTelegram APIクライアントのタイムアウトを上書きします（未設定の場合はgrammYのデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。`30000` から `600000` の間で調整するのは、誤検知のpolling-stall再起動に対してのみです。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使用します（デフォルト50）。`0` で無効になります。
    - reply/quote/forward の補足コンテキストは、現在は受信したまま渡されます。
    - Telegramの許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信APIエラーに対してTelegram送信ヘルパー（CLI/ツール/アクション）に適用されます。

    CLI送信ターゲットには、数値チャットIDまたはユーザー名を使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramのpollは `openclaw message poll` を使用し、forumトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram専用のpollフラグ:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forumトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` で許可されている場合、インラインキーボード用の `buttons` ブロックを持つ `--presentation`
    - ボットがそのチャットで固定できる場合に固定配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像およびGIFを、圧縮された写真やアニメーションメディアアップロードではなくdocumentとして送信する `--force-document`

    アクションゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、pollを含む送信Telegramメッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにしてTelegram poll作成を無効にします

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは、承認者DM内でexec承認をサポートし、任意で元のチャットまたはトピックにプロンプトを投稿することもできます。承認者は数値のTelegramユーザーIDである必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも1人の承認者が解決可能な場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`allowFrom` / `defaultTo` の数値owner IDにフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    チャンネル配信では、コマンドテキストがチャット内に表示されます。`channel` または `both` は、信頼できるグループ/トピックでのみ有効にしてください。プロンプトがforumトピックに届いた場合、OpenClawは承認プロンプトとその後続の両方でトピックを保持します。exec承認はデフォルトで30分後に失効します。

    インライン承認ボタンも、ターゲット対象領域（`dm`, `group`, `all`）を許可するために `channels.telegram.capabilities.inlineButtons` が必要です。`plugin:` で始まる承認IDはPlugin承認経由で解決され、それ以外はまずexec承認として解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、Telegramはエラーテキストで返信することも、抑制することもできます。この動作は2つの設定キーで制御されます。

| キー                                | 値                | デフォルト | 説明                                                                                           |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信の最小間隔です。障害時のエラースパムを防ぎます。                      |

アカウントごと、グループごと、トピックごとの上書きに対応しています（他のTelegram設定キーと同じ継承）。

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
  <Accordion title="メンションなしのグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegramのプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループからボットを削除して再追加
    - `openclaw channels status` は、configがメンションなしグループメッセージを期待している場合に警告を表示します。
    - `openclaw channels status --probe` は明示的な数値グループIDを確認できます。ワイルドカード `"*"` はメンバーシップ確認できません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、グループがそこに列挙されている必要があります（または `"*"` を含める）
    - グループ内でのボットのメンバーシップを確認してください
    - スキップ理由についてはログを確認してください: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者IDを認可してください（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目が多すぎます。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` で network/fetch errors が出る場合、通常は `api.telegram.org` へのDNS/HTTPS到達性の問題です

  </Accordion>

  <Accordion title="pollingまたはネットワークの不安定性">

    - Node 22+ + カスタムfetch/proxy では、AbortSignal型の不一致があると即時中断動作を引き起こすことがあります。
    - 一部のホストでは `api.telegram.org` がまずIPv6に解決されます。壊れたIPv6送信経路により、Telegram API障害が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClawはこれらを回復可能なネットワークエラーとして再試行します。
    - ログに `Polling stall detected` が含まれる場合、OpenClawはデフォルトで、完了した長poll livenessが120秒間ないとpollingを再起動し、Telegram転送を再構築します。
    - `channels.telegram.pollingStallThresholdMs` を増やすのは、長時間実行の `getUpdates` 呼び出しが正常なのに、ホストで誤ったpolling-stall再起動が引き続き報告される場合のみです。持続的なstallは通常、ホストと `api.telegram.org` の間のproxy、DNS、IPv6、またはTLS送信経路の問題を示します。
    - 直接の送信経路/TLSが不安定なVPSホストでは、`channels.telegram.proxy` を通してTelegram API呼び出しをルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ では、デフォルトで `autoSelectFamily=true`（WSL2を除く）および `dnsResultOrder=ipv4first` です。
    - ホストがWSL2である、または明示的にIPv4専用動作のほうが良い場合は、ファミリー選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544ベンチマークレンジ応答（`198.18.0.0/15`）は、Telegramメディアダウンロードでデフォルトですでに許可されています。信頼できるfake-IPまたは透過proxyが、メディアダウンロード時に `api.telegram.org` を他のprivate/internal/special-useアドレスへ書き換える場合は、Telegram専用のバイパスを明示的に有効にできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ明示的有効化は、アカウントごとに `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - proxyがTelegramメディアホストを `198.18.x.x` に解決する場合は、まず危険フラグをオフのままにしてください。TelegramメディアはRFC 2544ベンチマークレンジをすでにデフォルトで許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` はTelegramメディアのSSRF保護を弱めます。これは、Clash、Mihomo、Surgeのfake-IPルーティングのような、RFC 2544ベンチマークレンジ外のprivateまたはspecial-use応答を合成する、信頼できるオペレーター管理proxy環境でのみ使用してください。通常の公開インターネット経由のTelegramアクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS応答を検証するには:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細: [チャンネルトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [Configuration reference - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高いTelegramフィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があり、シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`, `blockStreaming`
- 書式設定/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2つ以上のアカウントIDが設定されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか（または `channels.telegram.accounts.default` を含めて）ください。そうしない場合、OpenClawは最初に正規化されたアカウントIDにフォールバックし、`openclaw doctor` が警告を表示します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramユーザーをGatewayにペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループおよびトピックの許可リスト動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
