---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 816238b53942b319a300843db62ec1d4bf8d84bc11094010926ac9ad457c6d3d
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

ステータス: grammY によるボット DM とグループ向けに本番利用可能です。デフォルトモードはロングポーリングで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway の設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開いて **@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、案内に従って、トークンを保存します。

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

    env のフォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間で期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、その後 `channels.telegram.groups` と `groupPolicy` をアクセスモデルに合わせて設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には config の値が env のフォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えたら、Telegram が変更を適用するよう、各グループでボットを削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効のグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つ BotFather の切り替え項目">

    - グループ追加を許可/拒否する `/setjoingroups`
    - グループ可視性の動作を設定する `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージへのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスも受け付けられ、正規化されます。
    `allowFrom` が空の `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値のユーザー ID のみを要求します。
    アップグレード済みで config に `@username` の allowlist エントリが含まれている場合は、それらを解決するために `openclaw doctor --fix` を実行してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、allowlist フローで `openclaw doctor --fix` によりエントリを `channels.telegram.allowFrom` に復旧できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    単一オーナーのボットでは、アクセスポリシーを以前のペアリング承認に依存させるのではなく、config に永続化するために、明示的な数値 `allowFrom` ID を使った `dmPolicy: "allowlist"` を推奨します。

    よくある混乱点: DM のペアリング承認は「この送信者がどこでも認可される」ことを意味しません。
    ペアリングは DM アクセスのみを付与します。グループ送信者の認可は依然として明示的な config の allowlist によって行われます。
    「一度認可されたら DM もグループコマンドも両方使える」ようにしたい場合は、自分の数値 Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボット不要）:

    1. 自分のボットに DM を送る。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を確認する。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **どのグループが許可されるか**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` を設定した場合: allowlist として機能します（明示的な ID または `"*"`）

    2. **グループ内でどの送信者が許可されるか**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使われます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` のエントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram のグループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM のペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは `groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一オーナーのボット向けの実用パターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` で許可します。
    ランタイム上の注意: `channels.telegram` が完全に欠けている場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムのデフォルトは fail-closed の `groupPolicy="allowlist"` です。

    例: 特定の 1 つのグループで任意のメンバーを許可する:

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

    例: 特定の 1 つのグループ内で特定のユーザーのみを許可する:

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
      よくある誤り: `groupAllowFrom` は Telegram グループの allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` に入れてください。
      - 許可されたグループ内でどの人がボットをトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーがボットに話しかけられるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使ってください。
    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信ではデフォルトでメンションが必要です。

    メンションは次のいずれかで行えます。

    - ネイティブの `@botusername` メンション
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化するには config を使ってください。

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

    グループチャット ID を取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` の `chat.id` を確認する
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信返信は Telegram に返されます（モデルがチャネルを選ぶことはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを持つ共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックはトピックを分離するために `:topic:<threadId>` を追加します。
- DM メッセージは `message_thread_id` を持つことができ、OpenClaw はそれをスレッド対応のセッションキーでルーティングし、返信のために thread ID を保持します。
- ロングポーリングは、チャットごと/スレッドごとのシーケンシング付きで grammY runner を使用します。ランナー sink 全体の並行性は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングの watchdog 再起動は、デフォルトで `getUpdates` の完了した生存確認が 120 秒間ない場合にトリガーされます。長時間実行の作業中にデプロイ環境で誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` の範囲で許可されます。アカウントごとのオーバーライドもサポートされます。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` が `off | partial | block | progress` のいずれかであること（デフォルト: `partial`）
    - `progress` は Telegram では `partial` にマッピングされます（チャネル横断の命名との互換性のため）
    - `streaming.preview.toolProgress` は、ツール/進捗更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: `true`）。別々のツール/進捗メッセージを保持するには `false` に設定してください。
    - 旧来の `channels.telegram.streamMode` とブール値の `streaming` は自動的にマッピングされます

    テキストのみの返信の場合:

    - DM: OpenClaw は同じプレビューメッセージを保持し、最終的な編集をその場で行います（2 つ目のメッセージはありません）
    - グループ/トピック: OpenClaw は同じプレビューメッセージを保持し、最終的な編集をその場で行います（2 つ目のメッセージはありません）

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングは block ストリーミングとは別です。Telegram で block ストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない/拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram 専用の reasoning ストリーム:

    - `/reasoning stream` は生成中に reasoning をライブプレビューへ送信します
    - 最終回答は reasoning テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram の `parse_mode: "HTML"` を使用します。

    - Markdown 風テキストは Telegram 安全な HTML にレンダリングされます。
    - 生のモデル HTML は Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニューエントリを追加する:

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

    - 名前は正規化されます（先頭の `/` を除去し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注意:

    - カスタムコマンドはメニュー項目のみであり、動作は自動実装されません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力すれば引き続き動作する場合があります

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、削減後でも Telegram メニューがまだ上限超過しています。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - `setMyCommands failed` で network/fetch エラーが出る場合、通常は `api.telegram.org` への外向き DNS/HTTPS がブロックされています。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` で保留中のリクエストを一覧表示します（role/scopes を含む）
    4. リクエストを承認します:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命の bootstrap トークンが含まれます。組み込みの bootstrap handoff では、プライマリ Node トークンは `scopes: []` のまま維持されます。引き渡された operator トークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に限定されたままになります。Bootstrap スコープチェックには role プレフィックスが付くため、その operator allowlist は operator リクエストのみを満たします。operator 以外の role では、引き続き自身の role プレフィックス配下の scopes が必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは異なる `requestId` を使います。承認前に `/pair pending` を再実行してください。

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

    アカウントごとのオーバーライド:

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

    旧来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマッピングされます。

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

    コールバッククリックはテキストとして agent に渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="agent と自動化のための Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます:

    - `sendMessage`（`to`、`content`、任意で `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意で `iconColor`、`iconCustomEmojiId`）

    チャネルメッセージアクションは使いやすいエイリアスを提供します（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注意: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな config/secrets スナップショット（起動時/再読み込み時）を使用するため、アクションパスでは送信ごとにその場で SecretRef を再解決しません。

    リアクション削除の意味論: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッディングタグ">
    Telegram は生成出力内の明示的な返信スレッディングタグをサポートします:

    - `[[reply_to_current]]` はトリガーしたメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` が処理方法を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    注意: `off` は暗黙の返信スレッディングを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はそのトピックスレッドを対象にします
    - トピック config パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。

    **トピックごとの agent ルーティング**: 各トピックは、トピック config に `agentId` を設定することで別の agent にルーティングできます。これにより、各トピックは独立した workspace、memory、session を持てます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般トピック → main agent
                "3": { agentId: "zu" },        // 開発トピック → zu agent
                "5": { agentId: "coder" }      // コードレビュー → coder agent
              }
            }
          }
        }
      }
    }
    ```

    各トピックはそれぞれ独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディングを通じて ACP harness セッションを固定できます:

    - `bindings[]` で `type: "acp"` かつ `match.channel: "telegram"`

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

    **チャットからのスレッドバインド ACP 起動**:

    - `/acp spawn <agent> --thread here|auto` で、現在の Telegram トピックを新しい ACP セッションにバインドできます。
    - 以後のトピックメッセージは、バインドされた ACP セッションへ直接ルーティングされます（`/acp steer` は不要）。
    - OpenClaw はバインド成功後、起動確認メッセージをそのトピック内に固定します。
    - `channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストには次が含まれます:

    - `MessageThreadId`
    - `IsForum`

    DM スレッド動作:

    - `message_thread_id` を持つプライベートチャットは、DM ルーティングを維持しつつ、スレッド対応のセッションキー/返信先を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイル動作
    - agent の返信にタグ `[[audio_as_voice]]` を付けると、ボイスノート送信を強制します

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

    Telegram は動画ファイルとビデオノートを区別します。

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

    受信ステッカーの処理:

    - 静的 WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップされます
    - 動画 WEBM: スキップされます

    ステッカーのコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは、繰り返しの vision 呼び出しを減らすために、一度だけ説明されて（可能な場合）キャッシュされます。

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効時、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    config:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注意:

    - `own` は、ボットが送信したメッセージに対するユーザーのリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。未認可の送信者は破棄されます。
    - Telegram はリアクション更新にスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="ACK リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji へのフォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注意:

    - Telegram は Unicode 絵文字を期待します（たとえば "👀"）。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用してください。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの config 書き込み">
    チャネル config の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram トリガーの書き込みには次が含まれます:

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

  <Accordion title="ロングポーリングと Webhook">
    デフォルト: ロングポーリング。

    Webhook モード:

    - `channels.telegram.webhookUrl` を設定
    - `channels.telegram.webhookSecret` を設定（Webhook URL 設定時は必須）
    - 任意の `channels.telegram.webhookPath`（デフォルト `/telegram-webhook`）
    - 任意の `channels.telegram.webhookHost`（デフォルト `127.0.0.1`）
    - 任意の `channels.telegram.webhookPort`（デフォルト `8787`）

    Webhook モードのデフォルトのローカルリスナーは `127.0.0.1:8787` にバインドされます。

    公開エンドポイントが異なる場合は、前段にリバースプロキシを配置し、公開 URL を `webhookUrl` に指定してください。
    意図的に外部からの受信を必要とする場合は、`webhookHost`（たとえば `0.0.0.0`）を設定してください。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信の Telegram メディアサイズの上限です。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定時は grammY のデフォルトが適用されます）。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知の polling-stall 再起動に対してのみ、`30000` から `600000` の範囲で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` を使用します（デフォルト 50）。`0` で無効化されます。
    - reply/quote/forward の補足コンテキストは現在、受信したまま渡されます。
    - Telegram の allowlist は主に、誰が agent をトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config は、回復可能な送信 API エラーに対する Telegram の送信ヘルパー（CLI/ツール/アクション）に適用されます。

    CLI の送信ターゲットには、数値のチャット ID またはユーザー名を使えます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の投票は `openclaw message poll` を使用し、フォーラムトピックもサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram の送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合のインラインキーボード用 `--buttons`
    - 送信画像および GIF を、圧縮写真やアニメーションメディアアップロードではなくドキュメントとして送る `--force-document`

    アクションのゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにしつつ Telegram の投票作成を無効にします

  </Accordion>

  <Accordion title="Telegram の exec 承認">
    Telegram は承認者 DM での exec 承認をサポートし、必要に応じて元のチャットまたはトピックにも承認プロンプトを投稿できます。

    config パス:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（任意。可能な場合は `allowFrom` と直接の `defaultTo` から推定された数値オーナー ID にフォールバックします）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`

    承認者は数値の Telegram ユーザー ID である必要があります。`enabled` が未設定または `"auto"` で、`execApprovals.approvers` またはそのアカウントの数値オーナー config（`allowFrom` とダイレクトメッセージの `defaultTo`）から少なくとも 1 人の承認者を解決できる場合、Telegram はネイティブ exec 承認を自動有効化します。Telegram をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。そうしない場合、承認リクエストは他の設定済み承認ルートまたは exec 承認フォールバックポリシーにフォールバックします。

    Telegram は、他のチャットチャネルで使われる共有承認ボタンも描画します。ネイティブ Telegram アダプターは主に、承認者 DM ルーティング、チャネル/トピック fanout、および配信前の入力中ヒントを追加します。
    それらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用不可としている場合、または手動承認のみが唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    配信ルール:

    - `target: "dm"` は、解決された承認者 DM にのみ承認プロンプトを送信します
    - `target: "channel"` は、承認プロンプトを元の Telegram チャット/トピックへ返送します
    - `target: "both"` は、承認者 DM と元のチャット/トピックの両方に送信します

    承認または拒否できるのは、解決された承認者のみです。非承認者は `/approve` を使えず、Telegram の承認ボタンも使えません。

    承認解決の動作:

    - `plugin:` プレフィックス付き ID は常に plugin 承認経由で解決されます。
    - その他の承認 ID は、まず `exec.approval.resolve` を試みます。
    - Telegram も plugin 承認に認可されており、かつ gateway がその exec 承認を不明/期限切れと返した場合、Telegram は `plugin.approval.resolve` 経由で 1 回だけ再試行します。
    - 実際の exec 承認の拒否/エラーは、黙って plugin 承認解決へフォールスルーしません。

    チャネル配信ではチャット内にコマンドテキストが表示されるため、`channel` または `both` は信頼できるグループ/トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトと承認後フォローアップの両方でそのトピックを保持します。exec 承認のデフォルト有効期限は 30 分です。

    インライン承認ボタンは、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可していることにも依存します。

    関連ドキュメント: [exec 承認](/ja-JP/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## エラー返信の制御

agent が配信エラーまたはプロバイダーエラーに遭遇した場合、Telegram はエラーテキストで返信することも、抑制することもできます。この動作は 2 つの config キーで制御されます。

| キー                                 | 値                | デフォルト | 説明                                                                                   |
| ----------------------------------- | ----------------- | ---------- | -------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信の最小間隔。障害時のエラースパムを防ぎます。                 |

アカウントごと、グループごと、トピックごとのオーバーライドがサポートされます（他の Telegram config キーと同じ継承）。

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

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性が許可されている必要があります。
      - BotFather: `/setprivacy` -> 無効化
      - その後、ボットをグループから削除して再追加
    - `openclaw channels status` は、config がメンションなしのグループメッセージを期待している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` のメンバーシップは probe できません。
    - 手早いセッションテスト: `/activation always`

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、そのグループが一覧に含まれている必要があります（または `"*"` を含める）
    - グループ内のボットの参加を確認する
    - スキップ理由について `openclaw logs --follow` のログを確認する

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者 ID を認可する（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` であっても、コマンド認可は引き続き適用されます
    - `setMyCommands failed` で `BOT_COMMANDS_TOO_MUCH` が出る場合、ネイティブメニューの項目数が多すぎます。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `setMyCommands failed` で network/fetch エラーが出る場合、通常は `api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定さ">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal の型不一致があると即時中断動作を引き起こす場合があります。
    - 一部のホストでは `api.telegram.org` がまず IPv6 に解決されます。IPv6 の外向き通信が壊れていると、Telegram API 失敗が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポーリングの生存確認が 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - 長時間実行の `getUpdates` 呼び出しが正常でも、ホストが依然として誤った polling-stall 再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。持続的な stall は通常、ホストと `api.telegram.org` 間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - VPS ホストで直接の外向き通信/TLS が不安定な場合は、`channels.telegram.proxy` 経由で Telegram API 呼び出しをルーティングしてください:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true`（WSL2 を除く）かつ `dnsResultOrder=ipv4first` です。
    - ホストが WSL2 であるか、明示的に IPv4 のみの動作の方がうまくいく場合は、family 選択を強制してください:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 のベンチマーク範囲応答（`198.18.0.0/15`）は、Telegram メディアダウンロードに対してすでにデフォルトで許可されています。信頼できる fake-IP や transparent proxy がメディアダウンロード中に `api.telegram.org` を別の private/internal/special-use アドレスへ書き換える場合は、Telegram 専用バイパスをオプトインできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウントごとにも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      で利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous フラグをオフのままにしてください。Telegram メディアはすでに RFC 2544 ベンチマーク範囲をデフォルトで許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。これは、Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼できるオペレーター管理の proxy 環境でのみ使ってください。通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境変数による上書き（一時的）:
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

詳細: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## Telegram config リファレンスへのポインター

主要リファレンス:

- `channels.telegram.enabled`: チャネル起動を有効/無効にします。
- `channels.telegram.botToken`: ボットトークン（BotFather）。
- `channels.telegram.tokenFile`: 通常のファイルパスからトークンを読み込みます。シンボリックリンクは拒否されます。
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.telegram.allowFrom`: DM の allowlist（数値の Telegram ユーザー ID）。`allowlist` では少なくとも 1 つの送信者 ID が必要です。`open` では `"*"` が必要です。`openclaw doctor --fix` は旧来の `@username` エントリを ID に解決でき、allowlist 移行フローではペアリングストアファイルから allowlist エントリを復旧することもできます。
- `channels.telegram.actions.poll`: Telegram の投票作成を有効または無効にします（デフォルト: 有効。ただし引き続き `sendMessage` が必要です）。
- `channels.telegram.defaultTo`: 明示的な `--reply-to` が指定されていない場合に、CLI の `--deliver` で使われるデフォルトの Telegram ターゲットです。
- `channels.telegram.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.telegram.groupAllowFrom`: グループ送信者の allowlist（数値の Telegram ユーザー ID）。`openclaw doctor --fix` は旧来の `@username` エントリを ID に解決できます。数値でないエントリは認証時に無視されます。グループ認証では DM のペアリングストアフォールバックは使われません（`2026.2.25+`）。
- マルチアカウントの優先順位:
  - 2 つ以上のアカウント ID が設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定するか（または `channels.telegram.accounts.default` を含めてください）。
  - どちらも設定されていない場合、OpenClaw は正規化された最初のアカウント ID にフォールバックし、`openclaw doctor` が警告します。
  - `channels.telegram.accounts.default.allowFrom` と `channels.telegram.accounts.default.groupAllowFrom` は `default` アカウントにのみ適用されます。
  - 名前付きアカウントは、アカウントレベルの値が未設定のとき `channels.telegram.allowFrom` と `channels.telegram.groupAllowFrom` を継承します。
  - 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。
- `channels.telegram.groups`: グループごとのデフォルト + allowlist（グローバルデフォルトには `"*"` を使用）。
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy のグループごとのオーバーライド（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`: デフォルトのメンションゲーティング。
  - `channels.telegram.groups.<id>.skills`: Skills フィルター（省略 = すべての Skills、空 = なし）。
  - `channels.telegram.groups.<id>.allowFrom`: グループごとの送信者 allowlist オーバーライド。
  - `channels.telegram.groups.<id>.systemPrompt`: グループ用の追加 system prompt。
  - `channels.telegram.groups.<id>.enabled`: `false` の場合、そのグループを無効化します。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: トピックごとのオーバーライド（グループフィールド + トピック専用の `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定の agent にルーティングします（グループレベルおよびバインディングルーティングを上書き）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy のトピックごとのオーバーライド（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: メンションゲーティングのトピックごとのオーバーライド。
- `match.peer.id` に正規のトピック ID `chatId:topic:topicId` を持つトップレベルの `bindings[]` と `type: "acp"`: 永続 ACP トピックバインディングフィールド（[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) を参照）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM トピックを特定の agent にルーティングします（フォーラムトピックと同じ動作）。
- `channels.telegram.execApprovals.enabled`: このアカウントで Telegram をチャットベースの exec 承認クライアントとして有効にします。
- `channels.telegram.execApprovals.approvers`: exec リクエストを承認または拒否できる Telegram ユーザー ID。`channels.telegram.allowFrom` または直接の `channels.telegram.defaultTo` がすでにオーナーを識別している場合は任意です。
- `channels.telegram.execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。`channel` と `both` は、存在する場合に元の Telegram トピックを保持します。
- `channels.telegram.execApprovals.agentFilter`: 転送される承認プロンプト用の任意の agent ID フィルター。
- `channels.telegram.execApprovals.sessionFilter`: 転送される承認プロンプト用の任意のセッションキーフィルター（部分文字列または regex）。
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec 承認ルーティングおよび承認者認可のアカウントごとのオーバーライド。
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist`（デフォルト: allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウントごとのオーバーライド。
- `channels.telegram.commands.nativeSkills`: Telegram ネイティブ Skills コマンドを有効/無効にします。
- `channels.telegram.replyToMode`: `off | first | all`（デフォルト: `off`）。
- `channels.telegram.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.telegram.chunkMode`: `length`（デフォルト）または `newline`。長さでのチャンク分割前に空行（段落境界）で分割します。
- `channels.telegram.linkPreview`: 送信メッセージのリンクプレビューを切り替えます（デフォルト: true）。
- `channels.telegram.streaming`: `off | partial | block | progress`（ライブストリームプレビュー。デフォルト: `partial`。`progress` は `partial` にマッピングされ、`block` は旧来のプレビューモード互換です）。Telegram のプレビューストリーミングでは、単一のプレビューメッセージをその場で編集します。
- `channels.telegram.streaming.preview.toolProgress`: プレビューストリーミングが有効なときに、ツール/進捗更新でライブプレビューメッセージを再利用します（デフォルト: `true`）。別々のツール/進捗メッセージを保持するには `false` に設定してください。
- `channels.telegram.mediaMaxMb`: 受信/送信 Telegram メディア上限（MB、デフォルト: 100）。
- `channels.telegram.retry`: 回復可能な送信 API エラー時の Telegram 送信ヘルパー（CLI/ツール/アクション）用の再試行ポリシー（試行回数、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`: Node の autoSelectFamily を上書きします（true=有効、false=無効）。Node 22+ ではデフォルトで有効で、WSL2 ではデフォルトで無効です。
- `channels.telegram.network.dnsResultOrder`: DNS 結果順序を上書きします（`ipv4first` または `verbatim`）。Node 22+ ではデフォルトで `ipv4first` です。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram メディアダウンロードで `api.telegram.org` がデフォルトの RFC 2544 ベンチマーク範囲許可外の private/internal/special-use アドレスに解決される、信頼できる fake-IP または transparent-proxy 環境向けの危険なオプトインです。
- `channels.telegram.proxy`: Bot API 呼び出し用の proxy URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`: Webhook モードを有効にします（`channels.telegram.webhookSecret` が必要）。
- `channels.telegram.webhookSecret`: Webhook シークレット（webhookUrl が設定されている場合は必須）。
- `channels.telegram.webhookPath`: ローカル Webhook パス（デフォルト `/telegram-webhook`）。
- `channels.telegram.webhookHost`: ローカル Webhook バインドホスト（デフォルト `127.0.0.1`）。
- `channels.telegram.webhookPort`: ローカル Webhook バインドポート（デフォルト `8787`）。
- `channels.telegram.actions.reactions`: Telegram ツールのリアクションをゲートします。
- `channels.telegram.actions.sendMessage`: Telegram ツールのメッセージ送信をゲートします。
- `channels.telegram.actions.deleteMessage`: Telegram ツールのメッセージ削除をゲートします。
- `channels.telegram.actions.sticker`: Telegram ステッカーアクション（送信および検索）をゲートします（デフォルト: false）。
- `channels.telegram.reactionNotifications`: `off | own | all` — どのリアクションがシステムイベントをトリガーするかを制御します（未設定時のデフォルト: `own`）。
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent のリアクション機能を制御します（未設定時のデフォルト: `minimal`）。
- `channels.telegram.errorPolicy`: `reply | silent` — エラー返信の動作を制御します（デフォルト: `reply`）。アカウント/グループ/トピックごとのオーバーライドに対応。
- `channels.telegram.errorCooldownMs`: 同じチャットへのエラー返信の最小間隔（ms）（デフォルト: `60000`）。障害時のエラースパムを防ぎます。

- [設定リファレンス - Telegram](/ja-JP/gateway/configuration-reference#telegram)

Telegram 固有の重要フィールド:

- 起動/認証: `enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` は通常ファイルを指している必要があり、シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッディング/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`、`blockStreaming`
- 書式設定/配信: `textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
