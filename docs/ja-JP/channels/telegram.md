---
read_when:
    - Telegram機能またはWebhookの作業中
summary: Telegram botのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY経由のbot DM + グループ向けに本番運用対応済みです。デフォルトモードはロングポーリングで、Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断および修復プレイブック。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFatherでbotトークンを作成する">
    Telegramを開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

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
    Telegramは `openclaw channels login telegram` を使いません。config/envでトークンを設定してから、Gatewayを起動してください。

  </Step>

  <Step title="Gatewayを起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードの有効期限は1時間です。

  </Step>

  <Step title="botをグループに追加する">
    botをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、configの値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegram botはデフォルトで **プライバシーモード** になっており、受信できるグループメッセージが制限されます。

    botがすべてのグループメッセージを見られる必要がある場合は、次のいずれかを行ってください。

    - `/setprivacy` でプライバシーモードを無効にする
    - botをグループ管理者にする

    プライバシーモードを切り替えた場合は、Telegramが変更を適用するよう、各グループでbotを一度削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramのグループ設定で制御されます。

    管理者botはすべてのグループメッセージを受信でき、常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つBotFatherの切り替え項目">

    - `/setjoingroups` でグループ追加を許可/拒否
    - `/setprivacy` でグループ可視性の動作を設定

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom` には数値のTelegramユーザーIDを指定します。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合、すべてのDMがブロックされ、config検証で拒否されます。
    セットアップでは数値ユーザーIDのみを受け付けます。
    アップグレード後にconfigに `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram botトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` により、allowlistフローでそのエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    1人のオーナー用botでは、アクセス方針をconfig内で持続的に保つため、以前のペアリング承認に依存するのではなく、明示的な数値 `allowFrom` IDを使った `dmPolicy: "allowlist"` を推奨します。

    よくある混乱: DMペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングが付与するのはDMアクセスのみです。グループ送信者の認可は、引き続き明示的なconfig許可リストから行われます。
    「一度認可されたら、DMもグループコマンドも両方使えるようにしたい」場合は、数値のTelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。

    ### TelegramユーザーIDを見つける

    より安全な方法（サードパーティbot不要）:

    1. botにDMを送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式Bot APIを使う方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ方式（プライバシー性は低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: どのグループでもグループIDチェックを通過可能
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定されている場合: 許可リストとして機能する（明示的なIDまたは `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使われます。未設定の場合、Telegramは `allowFrom` にフォールバックします。
    `groupAllowFrom` のエントリには数値のTelegramユーザーIDを指定してください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    TelegramのグループまたはsupergroupのチャットIDを `groupAllowFrom` に入れないでください。負のchat IDは `channels.telegram.groups` に置く必要があります。
    数値以外のエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認可はDMのペアリングストア承認を継承しません。
    ペアリングは引き続きDM専用です。グループでは、`groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegramはペアリングストアではなくconfigの `allowFrom` にフォールバックします。
    1人オーナーbot向けの実用的なパターン: 自分のユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` で許可します。
    実行時の注記: `channels.telegram` 全体が存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、実行時はフェイルクローズドの `groupPolicy="allowlist"` がデフォルトになります。

    例: 特定の1つのグループで任意のメンバーを許可する

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

    例: 特定の1つのグループ内で特定ユーザーのみ許可する

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
      よくある誤り: `groupAllowFrom` はTelegramグループ許可リストではありません。

      - `-1001234567890` のような負のTelegramグループまたはsupergroup chat IDは `channels.telegram.groups` に入れてください。
      - 許可されたグループ内でどの人がbotをトリガーできるか制限したい場合は、`8734062810` のようなTelegramユーザーIDを `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーがbotに話しかけられるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次のいずれかから取得できます。

    - ネイティブの `@botusername` メンション
    - 次に含まれるメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化にはconfigを使ってください。

    永続configの例:

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

    グループchat IDを取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` で `chat.id` を読む
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## 実行時の動作

- TelegramはGatewayプロセスによって管理されます。
- ルーティングは決定的です。Telegramの受信メッセージへの返信はTelegramに返ります（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータおよびメディアプレースホルダーを伴って共有チャネルエンベロープに正規化されます。
- グループセッションはグループIDごとに分離されます。フォーラムトピックは `:topic:<threadId>` を追加してトピックごとに分離を保ちます。
- DMメッセージは `message_thread_id` を持つことができ、OpenClawはそれをスレッド対応セッションキーでルーティングし、返信用にthread IDを保持します。
- ロングポーリングでは、チャットごと/スレッドごとの順序制御付きで grammY runner を使います。runner sink全体の並行性には `agents.defaults.maxConcurrent` を使います。
- ロングポーリングのwatchdog再起動は、デフォルトでは `getUpdates` の完了済みlivenessが120秒間ない場合に発動します。長時間実行中の作業で誤った polling-stall 再起動が引き続き発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` まで設定可能です。アカウントごとの上書きにも対応しています。
- Telegram Bot APIには既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは、部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress`（デフォルト: `partial`）
    - `progress` はTelegramでは `partial` にマップされます（チャネル横断の命名互換用）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。別個のツール/進捗メッセージを維持したい場合は `false` に設定してください。
    - レガシーの `channels.telegram.streamMode` およびブール値の `streaming` は自動マッピングされます

    テキストのみの返信では:

    - DM: OpenClawは同じプレビューメッセージを維持し、最後にその場で編集して確定します（2つ目のメッセージは送信しません）
    - グループ/トピック: OpenClawは同じプレビューメッセージを維持し、最後にその場で編集して確定します（2つ目のメッセージは送信しません）

    複雑な返信（たとえばメディアペイロード）では、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューのストリーミングはblock streamingとは別です。Telegramでblock streamingが明示的に有効になっている場合、OpenClawは二重ストリーミングを避けるためプレビューストリームをスキップします。

    ネイティブのdraft transportが利用できない、または拒否された場合、OpenClawは自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram専用のreasoningストリーム:

    - `/reasoning stream` は、生成中のreasoningをライブプレビューに送信します
    - 最終回答はreasoningテキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegramの `parse_mode: "HTML"` を使います。

    - Markdown風のテキストは、Telegram安全なHTMLに変換されます。
    - 生のモデルHTMLは、Telegramの解析失敗を減らすためエスケープされます。
    - Telegramが解析済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramのコマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

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

    - 名前は正規化されます（先頭の `/` を除去し、小文字化）
    - 有効なパターン: `a-z`, `0-9`, `_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注:

    - カスタムコマンドはメニュー項目にすぎず、動作は自動実装されません
    - plugin/skillコマンドは、Telegramメニューに表示されていなくても、入力すれば引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/pluginコマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、Telegramメニューはトリミング後もまだ上限を超えています。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` でネットワーク/fetchエラーが出る場合、通常は `api.telegram.org` への外向きDNS/HTTPSがブロックされています。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成する
    2. iOSアプリにコードを貼り付ける
    3. `/pair pending` で保留中のリクエストを一覧表示する（role/scopesを含む）
    4. リクエストを承認する:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中のリクエストが1件しかない場合は `/pair approve`
       - 最新のものを承認する場合は `/pair approve latest`

    セットアップコードには短命のbootstrapトークンが含まれます。組み込みのbootstrap handoffでは、primary Nodeトークンは `scopes: []` のまま維持され、引き渡されたoperatorトークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に限定されたままになります。Bootstrapのscopeチェックはrole接頭辞付きなので、そのoperator許可リストはoperatorリクエストにしか適用されません。非operator roleでは、引き続きそれぞれのrole接頭辞配下のscopesが必要です。

    デバイスが認証詳細（たとえばrole/scopes/public key）を変更して再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使います。承認前に `/pair pending` を再実行してください。

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

    レガシーの `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

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

  <Accordion title="エージェントおよび自動化向けTelegramメッセージアクション">
    Telegramのツールアクションには以下が含まれます。

    - `sendMessage`（`to`, `content`, オプションの `mediaUrl`, `replyToMessageId`, `messageThreadId`）
    - `react`（`chatId`, `messageId`, `emoji`）
    - `deleteMessage`（`chatId`, `messageId`）
    - `editMessage`（`chatId`, `messageId`, `content`）
    - `createForumTopic`（`chatId`, `name`, オプションの `iconColor`, `iconCustomEmojiId`）

    チャネルメッセージアクションでは、使いやすいエイリアスが公開されます（`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`）。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    実行時の送信では、アクティブなconfig/secretsスナップショット（起動時/再読み込み時）を使うため、アクション経路では送信ごとのアドホックな SecretRef 再解決は行いません。

    リアクション削除の意味論: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegramは、生成出力内の明示的な返信スレッディングタグをサポートします。

    - `[[reply_to_current]]` はトリガー元のメッセージに返信します
    - `[[reply_to:<id>]]` は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode` が処理方法を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off` は暗黙の返信スレッディングを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムsupergroup:

    - トピックのセッションキーには `:topic:<threadId>` が追加されます
    - 返信と入力中表示はそのトピックスレッドを対象にします
    - トピックのconfigパス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegramは `sendMessage(...thread_id=1)` を拒否します）
    - typingアクションでは引き続き `message_thread_id` を含めます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`）。
    `agentId` はトピック専用であり、グループデフォルトからは継承されません。

    **トピックごとのエージェントルーティング**: トピックconfigで `agentId` を設定することで、各トピックを別のエージェントにルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    その後、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続ACPトピックバインディング**: フォーラムトピックは、トップレベルの型付きACPバインディングを通じてACPハーネスセッションを固定できます。

    - `bindings[]` に `type: "acp"` と `match.channel: "telegram"` を指定

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

    これは現在、グループおよびsupergroup内のフォーラムトピックに限定されています。

    **チャットからのスレッドバインドACP起動**:

    - `/acp spawn <agent> --thread here|auto` で、現在のTelegramトピックを新しいACPセッションにバインドできます。
    - その後のトピックメッセージは、バインドされたACPセッションに直接ルーティングされます（`/acp steer` は不要）。
    - OpenClawは、バインド成功後に起動確認メッセージをそのトピック内に固定します。
    - `channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストには以下が含まれます。

    - `MessageThreadId`
    - `IsForum`

    DMスレッド動作:

    - `message_thread_id` を持つプライベートチャットは、DMルーティングを維持しつつ、スレッド対応のセッションキー/返信先を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegramはボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルとしての動作
    - エージェント返信内のタグ `[[audio_as_voice]]` で、ボイスノート送信を強制

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

    ビデオノートはキャプションをサポートしません。指定したメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
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

    ステッカーは、繰り返しのvision呼び出しを減らすため、一度だけ説明が生成され（可能な場合）、キャッシュされます。

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegramのリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効時、OpenClawは次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own` は、botが送信したメッセージに対するユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントも、Telegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）に従います。認可されていない送信者は破棄されます。
    - Telegramはリアクション更新にスレッドIDを提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、元の正確なトピックではなく、グループのgeneral topicセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook用の `allowed_updates` には、自動的に `message_reaction` が含まれます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction` は、OpenClawが受信メッセージを処理中に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントidentity絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注:

    - TelegramはUnicode絵文字を想定します（例: `"👀"`）。
    - チャネルまたはアカウントでこのリアクションを無効にするには `""` を使います。

  </Accordion>

  <Accordion title="Telegramイベントとコマンドからのconfig書き込み">
    チャネルconfigへの書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramトリガーの書き込みには以下が含まれます。

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンド有効化が必要）

    無効化:

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

  <Accordion title="ロングポーリング vs Webhook">
    デフォルト: ロングポーリング。

    Webhookモード:

    - `channels.telegram.webhookUrl` を設定
    - `channels.telegram.webhookSecret` を設定（Webhook URL設定時に必須）
    - 任意で `channels.telegram.webhookPath`（デフォルト `/telegram-webhook`）
    - 任意で `channels.telegram.webhookHost`（デフォルト `127.0.0.1`）
    - 任意で `channels.telegram.webhookPort`（デフォルト `8787`）

    Webhookモードのデフォルトのローカルリスナーは `127.0.0.1:8787` にバインドされます。

    公開エンドポイントが異なる場合は、前段にリバースプロキシを置き、`webhookUrl` を公開URLに向けてください。
    意図的に外部からの受信を必要とする場合は、`webhookHost`（たとえば `0.0.0.0`）を設定してください。

  </Accordion>

  <Accordion title="制限、再試行、CLIターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは4000です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト100）は、受信および送信のTelegramメディアサイズ上限です。
    - `channels.telegram.timeoutSeconds` はTelegram APIクライアントのタイムアウトを上書きします（未設定時は grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知の polling-stall 再起動に対してのみ、`30000` から `600000` の範囲で調整してください。
    - グループコンテキスト履歴には `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト50）を使います。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現時点では受信したまま渡されます。
    - Telegramの許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、補足コンテキスト全体の秘匿境界ではありません。
    - DM履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信APIエラーに対してTelegramの送信ヘルパー（CLI/tools/actions）に適用されます。

    CLI送信ターゲットには、数値chat IDまたはユーザー名を使えます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegramの投票には `openclaw message poll` を使い、フォーラムトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram専用の投票フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram送信では次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - botがそのchatで固定できる場合、固定付き配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像やGIFを圧縮写真やアニメーションメディアアップロードではなく、ドキュメントとして送る `--force-document`

    アクションゲート:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信Telegramメッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常送信を有効のままにしてTelegram投票作成を無効化します

  </Accordion>

  <Accordion title="Telegramでのexec承認">
    Telegramは、承認者DMでのexec承認をサポートし、必要に応じて元のchatまたはトピックにも承認プロンプトを投稿できます。

    configパス:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（任意。可能な場合、`allowFrom` とダイレクトメッセージの `defaultTo` から推定される数値オーナーIDにフォールバック）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`

    承認者は数値のTelegramユーザーIDである必要があります。`enabled` が未設定または `"auto"` で、`execApprovals.approvers` またはアカウントの数値オーナーconfig（`allowFrom` とダイレクトメッセージの `defaultTo`）から少なくとも1人の承認者を解決できる場合、Telegramはネイティブのexec承認を自動有効化します。Telegramをネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。それ以外の場合、承認リクエストは他の設定済み承認経路またはexec承認フォールバックポリシーにフォールバックします。

    Telegramは、他のチャットチャネルで使われる共有承認ボタンも表示します。ネイティブTelegramアダプターは主に、承認者DMルーティング、チャネル/トピックへのファンアウト、配信前の入力中ヒントを追加します。
    それらのボタンがある場合、それが主要な承認UXです。OpenClaw
    は、ツール結果がチャット承認を利用不可としている場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    配信ルール:

    - `target: "dm"` は、解決された承認者DMにのみ承認プロンプトを送信します
    - `target: "channel"` は、元のTelegram chat/トピックにプロンプトを送り返します
    - `target: "both"` は、承認者DMと元のchat/トピックの両方に送信します

    承認または拒否できるのは解決済み承認者のみです。非承認者は `/approve` を使えず、Telegram承認ボタンも使えません。

    承認解決の動作:

    - `plugin:` 接頭辞付きIDは常にplugin承認経由で解決されます。
    - その他の承認IDは、まず `exec.approval.resolve` を試します。
    - Telegramもplugin承認に認可されており、gatewayが
      exec承認を不明/期限切れと返した場合、Telegramは
      `plugin.approval.resolve` 経由で1回だけ再試行します。
    - 実際のexec承認拒否/エラーは、黙ってplugin
      承認解決へフォールスルーしません。

    チャネル配信ではコマンドテキストがchatに表示されるため、`channel` または `both` は信頼されたグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClawは承認プロンプトと承認後フォローアップの両方でそのトピックを維持します。exec承認の有効期限はデフォルトで30分です。

    インライン承認ボタンも、ターゲットサーフェス（`dm`, `group`, `all`）を `channels.telegram.capabilities.inlineButtons` が許可している必要があります。

    関連ドキュメント: [exec承認](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信またはプロバイダーエラーに遭遇した場合、Telegramではエラーテキストを返信することも、抑制することもできます。この動作は2つのconfigキーで制御されます。

| キー | 値 | デフォルト | 説明 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` はchatにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同じchatへのエラー返信間の最小時間。障害時のエラースパムを防ぎます。 |

アカウントごと、グループごと、トピックごとの上書きに対応しています（他のTelegram configキーと同じ継承）。

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
  <Accordion title="メンションなしのグループメッセージにbotが応答しない">

    - `requireMention=false` の場合、Telegramのプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループからbotを削除して再追加
    - `openclaw channels status` は、configがメンションなしグループメッセージを期待している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループIDを確認できます。ワイルドカード `"*"` のメンバーシップはprobeできません。
    - セッションの簡易テスト: `/activation always`。

  </Accordion>

  <Accordion title="botがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、そのグループがリストされている必要があります（または `"*"` を含める）
    - botがグループに参加していることを確認する
    - `openclaw logs --follow` でスキップ理由を確認する

  </Accordion>

  <Accordion title="コマンドが部分的にしか動かない、またはまったく動かない">

    - 自分の送信者IDを認可する（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` でネットワーク/fetchエラーが出る場合、通常は `api.telegram.org` へのDNS/HTTPS到達性の問題です

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ + カスタムfetch/proxy は、AbortSignal型の不一致があると即時中断動作を引き起こすことがあります。
    - 一部のホストでは `api.telegram.org` がまずIPv6に解決されます。IPv6外向き通信が壊れていると、Telegram APIが断続的に失敗することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClawはこれらを回復可能なネットワークエラーとして再試行します。
    - ログに `Polling stall detected` が含まれる場合、OpenClawはデフォルトで、完了済みロングポーリングlivenessが120秒ないとポーリングを再起動し、Telegram transportを再構築します。
    - `channels.telegram.pollingStallThresholdMs` を増やすのは、長時間の `getUpdates` 呼び出しが正常なのに、ホストが誤った polling-stall 再起動を報告する場合だけにしてください。持続的なstallは通常、ホストと `api.telegram.org` の間のproxy、DNS、IPv6、またはTLS外向き通信の問題を示します。
    - VPSホストで直接外向き通信/TLSが不安定な場合は、`channels.telegram.proxy` 経由でTelegram API呼び出しをルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ではデフォルトで `autoSelectFamily=true`（WSL2を除く）および `dnsResultOrder=ipv4first` です。
    - ホストがWSL2であるか、明示的にIPv4のみの動作のほうが安定する場合は、family selectionを強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 のベンチマーク範囲アドレス（`198.18.0.0/15`）は、Telegramメディアダウンロードで
      デフォルトですでに許可されています。信頼されたfake-IPまたは
      transparent proxy がメディアダウンロード中に `api.telegram.org` を別の
      private/internal/special-use アドレスに書き換える場合は、Telegram専用の
      バイパスをオプトインできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウント単位でも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      で利用できます。
    - proxyがTelegramメディアホストを `198.18.x.x` に解決する場合は、まず
      dangerousフラグをオフのままにしてください。TelegramメディアではすでにRFC 2544
      ベンチマーク範囲がデフォルトで許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` はTelegramの
      メディアSSRF保護を弱めます。Clash、Mihomo、Surgeのfake-IPルーティングのような、
      operatorが制御する信頼済みproxy環境で、それらがRFC 2544ベンチマーク
      範囲外のprivateまたはspecial-use応答を合成する場合にのみ使ってください。
      通常のパブリックインターネット経由のTelegramアクセスではオフのままにしてください。
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

詳細: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## Telegram設定リファレンスへのポインター

主要リファレンス:

- `channels.telegram.enabled`: チャネル起動を有効/無効にします。
- `channels.telegram.botToken`: botトークン（BotFather）。
- `channels.telegram.tokenFile`: 通常ファイルのパスからトークンを読み込みます。シンボリックリンクは拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM許可リスト（数値のTelegramユーザーID）。`allowlist` には少なくとも1つの送信者IDが必要です。`open` には `"*"` が必要です。`openclaw doctor --fix` は、レガシーの `@username` エントリをIDに解決でき、allowlist移行フローではペアリングストアファイルから許可リストエントリを復元することもできます。
- `channels.telegram.actions.poll`: Telegram投票作成を有効または無効にします（デフォルト: 有効。引き続き `sendMessage` が必要です）。
- `channels.telegram.defaultTo`: 明示的な `--reply-to` がない場合に、CLIの `--deliver` で使うデフォルトTelegramターゲット。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者許可リスト（数値のTelegramユーザーID）。`openclaw doctor --fix` はレガシーの `@username` エントリをIDに解決できます。数値以外のエントリは認可時に無視されます。グループ認可ではDMペアリングストアのフォールバックは使いません（`2026.2.25+`）。
- マルチアカウント優先順位:
  - 2つ以上のアカウントIDが設定されている場合、デフォルトルーティングを明示するため `channels.telegram.defaultAccount` を設定するか、`channels.telegram.accounts.default` を含めてください。
  - どちらも設定されていない場合、OpenClawは正規化後の最初のアカウントIDにフォールバックし、`openclaw doctor` が警告します。
  - `channels.telegram.accounts.default.allowFrom` と `channels.telegram.accounts.default.groupAllowFrom` は `default` アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベル値が未設定のとき `channels.telegram.allowFrom` と `channels.telegram.groupAllowFrom` を継承します。
  - 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。
- `channels.telegram.groups`: グループごとのデフォルト + 許可リスト（グローバルデフォルトには `"*"` を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicyのグループごとの上書き（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: メンションゲートのデフォルト。
  - `channels.telegram.groups.<id>.skills`: Skillsフィルター（省略 = すべてのSkills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループごとの送信者許可リスト上書き。
  - `channels.telegram.groups.<id>.systemPrompt`: そのグループ向けの追加システムプロンプト。
  - `channels.telegram.groups.<id>.enabled`: `false` の場合、そのグループを無効化。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピックごとの上書き（グループフィールド + トピック専用の `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定のエージェントにルーティングします（グループレベルおよびbindingルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicyのトピックごとの上書き（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: トピックごとのメンションゲート上書き。
- トップレベルの `bindings[]` で `type: "acp"` を使い、`match.peer.id` に正規のトピックID `chatId:topic:topicId` を指定: 永続ACPトピックbindingフィールド（[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DMトピックを特定のエージェントにルーティングします（フォーラムトピックと同じ動作）。
- `channels.telegram.execApprovals.enabled`: このアカウントに対してTelegramをチャットベースのexec承認クライアントとして有効化します。
- `channels.telegram.execApprovals.approvers`: execリクエストを承認または拒否できるTelegramユーザーID。`channels.telegram.allowFrom` またはダイレクトな `channels.telegram.defaultTo` がすでにオーナーを特定している場合は任意です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel` と `both` は、存在する場合に元のTelegramトピックを維持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト用の任意のエージェントIDフィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト用の任意のセッションキーフィルター（部分文字列または正規表現）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec承認ルーティングと承認者認可のアカウントごとの上書き。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウントごとの上書き。
- `channels.telegram.commands.nativeSkills`: TelegramネイティブSkillsコマンドを有効/無効にします。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または `newline`。長さチャンク化の前に空行（段落境界）で分割します。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビューを切り替えます（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress` は `partial` にマップされ、`block` はレガシープレビューモード互換です）。Telegramのプレビューストリーミングは、その場で編集される単一のプレビューメッセージを使います。
- `channels.telegram.streaming.preview.toolProgress`: プレビューストリーミングが有効な場合、ツール/進捗更新にライブプレビューメッセージを再利用します（デフォルト: `true`）。別個のツール/進捗メッセージを維持するには `false` に設定してください。
- `channels.telegram.mediaMaxMb`: 受信/送信Telegramメディア上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な送信APIエラーに対するTelegram送信ヘルパー（CLI/tools/actions）の再試行ポリシー（attempts, minDelayMs, maxDelayMs, jitter）。
- `channels.telegram.network.autoSelectFamily`: Nodeの autoSelectFamily を上書きします（true=有効、false=無効）。デフォルトではNode 22+で有効、WSL2ではデフォルトで無効です。
- `channels.telegram.network.dnsResultOrder`: DNS結果順序を上書きします（`ipv4first` または `verbatim`）。デフォルトではNode 22+で `ipv4first` です。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegramメディアダウンロードで `api.telegram.org` がデフォルトのRFC 2544ベンチマーク範囲許可外のprivate/internal/special-useアドレスに解決される、信頼済みfake-IPまたはtransparent-proxy環境向けの危険なオプトイン。
- `channels.telegram.proxy`: Bot API呼び出し用のproxy URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: Webhookモードを有効化します（`channels.telegram.webhookSecret` が必要）。
- `channels.telegram.webhookSecret`: Webhook secret（webhookUrl設定時に必須）。
- `channels.telegram.webhookPath`: ローカルWebhookパス（デフォルト `/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカルWebhookバインドホスト（デフォルト `127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカルWebhookバインドポート（デフォルト `8787`）。
- `channels.telegram.actions.reactions`: Telegramツールのリアクションをゲートします。
- `channels.telegram.actions.sendMessage`: Telegramツールのメッセージ送信をゲートします。
- `channels.telegram.actions.deleteMessage`: Telegramツールのメッセージ削除をゲートします。
- `channels.telegram.actions.sticker`: Telegramステッカーアクション（送信と検索）をゲートします（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントをトリガーするかを制御します（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — エージェントのリアクション機能を制御します（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー返信動作を制御します（デフォルト: `reply`）。アカウント/グループ/トピックごとの上書きをサポートします。
- `channels.telegram.errorCooldownMs`: 同じchatへのエラー返信間の最小ミリ秒数（デフォルト: `60000`）。障害時のエラースパムを防ぎます。

- [設定リファレンス - Telegram](/ja-JP/gateway/configuration-reference#telegram)

Telegram固有の重要フィールド:

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があり、シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベル `bindings[]`（`type: "acp"`）
- exec承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- 書式/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
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
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
