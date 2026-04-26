---
read_when:
    - チャネルアカウント（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）を追加または削除したい場合
    - チャネルのステータスを確認したい、またはチャネルログを追跡したい場合
summary: '`openclaw channels` のCLIリファレンス（accounts、status、login/logout、logs）'
title: チャネル
x-i18n:
    generated_at: "2026-04-26T12:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway上のチャットチャネルアカウントとそのランタイムステータスを管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels/index)
- Gateway設定: [設定](/ja-JP/gateway/configuration)

## よく使うコマンド

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## ステータス / capabilities / resolve / ログ

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（`--channel`指定時のみ）, `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` はライブパスです。到達可能なgatewayでは、アカウントごとに
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポートの
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれる場合があります。
gatewayに到達できない場合、`channels status` はライブプローブ出力ではなく、
設定のみのサマリーにフォールバックします。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

ヒント: `openclaw channels add --help` では、チャネルごとのフラグ（token、private key、app token、signal-cliのパスなど）が表示されます。

一般的な非対話型の追加方法には次のものがあります:

- bot-tokenチャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessageのトランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chatのフィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrixのフィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostrのフィールド: `--private-key`, `--relay-urls`
- Tlonのフィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- サポートされている場合、デフォルトアカウントのenvベース認証には `--use-env`

チャネルPluginをフラグ指定の追加コマンド実行中にインストールする必要がある場合、OpenClawは対話型のPluginインストールプロンプトを開かずに、そのチャネルのデフォルトのインストール元を使用します。

`openclaw channels add` をフラグなしで実行すると、対話型のウィザードで次の内容を求められることがあります:

- 選択したチャネルごとのアカウントID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

今すぐバインドすることを確認すると、ウィザードは各設定済みチャネルアカウントをどのagentが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後で `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます（[agents](/ja-JP/cli/agents) を参照）。

単一アカウントのトップレベル設定をまだ使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClawは新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格します。ほとんどのチャネルでは、それらの値は `channels.<channel>.accounts.default` に配置されますが、バンドル済みチャネルでは代わりに既存の一致する昇格済みアカウントを保持できます。現在の例はMatrixです。1つの名前付きアカウントがすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格では新しい `accounts.default` を作成せず、そのアカウントを保持します。

ルーティングの動作は一貫したままです:

- 既存のチャネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。
- `channels add` は、非対話モードではバインディングを自動作成または書き換えしません。
- 対話型セットアップでは、必要に応じてアカウントスコープのバインディングを追加できます。

設定がすでに混在状態（名前付きアカウントが存在し、なおかつトップレベルの単一アカウント値も設定されている状態）だった場合は、`openclaw doctor --fix` を実行して、そのチャネル用に選ばれた昇格先アカウントへアカウントスコープの値を移動してください。ほとんどのチャネルは `accounts.default` に昇格します。Matrixは既存の名前付き/デフォルトのターゲットを保持できます。

## login / logout（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

注意:

- `channels login` は `--verbose` をサポートします。
- `channels login` / `logout` は、サポートされているloginターゲットが1つだけ設定されている場合、そのチャネルを推測できます。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` に `Claude: HTTP 403 ... user:profile` と表示される場合、使用状況のスナップショットには `user:profile` スコープが必要です。`--no-usage` を使用するか、claude.aiのセッションキー（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`）を指定するか、Claude CLIで再認証してください。
- `openclaw channels status` は、gatewayに到達できない場合、設定のみのサマリーにフォールバックします。サポートされているチャネル認証情報がSecretRef経由で設定されていても現在のコマンドパスで利用できない場合、そのアカウントは未設定として表示されるのではなく、低下状態の注記付きで設定済みとして報告されます。

## capabilitiesプローブ

利用可能なprovider capabilityのヒント（該当する場合はintents/scopes）と静的な機能サポートを取得します:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意:

- `--channel` は任意です。省略すると、すべてのチャネル（拡張機能を含む）を一覧表示します。
- `--account` は `--channel` と一緒の場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャネルIDを受け付け、Discordにのみ適用されます。
- プローブはprovider固有です: Discordのintents + 任意のチャネル権限、Slackのbot + user scopes、Telegramのbot flags + webhook、Signal daemon version、Microsoft Teamsのapp token + Graph roles/scopes（既知の場合は注記付き）。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前をIDに解決

providerディレクトリを使用して、チャネル名/ユーザー名をIDに解決します:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意:

- ターゲットタイプを強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択したアカウントがSecretRef経由で設定されていても、その認証情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中断するのではなく、注記付きの低下した未解決結果を返します。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [チャネル概要](/ja-JP/channels)
