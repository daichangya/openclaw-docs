---
read_when:
    - channel accounts（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix）を追加/削除したい場合
    - channel statusを確認したい、またはchannel logsをtailしたい場合
summary: '`openclaw channels`のCLIリファレンス（accounts、status、login/logout、logs）'
title: channels
x-i18n:
    generated_at: "2026-04-05T12:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway上のchat channel accountsとそのruntime statusを管理します。

関連ドキュメント:

- Channelガイド: [Channels](/channels/index)
- Gateway設定: [Configuration](/gateway/configuration)

## よく使うコマンド

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（`--channel`指定時のみ）, `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe`はライブパスです。到達可能なgatewayに対しては、accountごとの
`probeAccount`と任意の`auditAccount`チェックを実行するため、出力にはtransport
stateに加えて、`works`、`probe failed`、`audit ok`、`audit failed`のようなprobe結果を含めることができます。
gatewayに到達できない場合、`channels status`はライブprobe出力の代わりに
configのみの要約へフォールバックします。

## accountsの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

ヒント: `openclaw channels add --help`はchannelごとのフラグ（token、private key、app token、signal-cliパスなど）を表示します。

よく使われる非対話型のaddサーフェスには次が含まれます。

- bot-token channels: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage transportフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chatフィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrixフィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostrフィールド: `--private-key`, `--relay-urls`
- Tlonフィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- サポートされている場合は、default accountのenvバック認証に`--use-env`

フラグなしで`openclaw channels add`を実行すると、対話型ウィザードで次を尋ねられる場合があります。

- 選択したchannelごとのaccount id
- それらのaccountsの任意の表示名
- `Bind configured channel accounts to agents now?`

ここで「今すぐbindする」を確認すると、ウィザードは、設定済みの各channel accountをどのagentに所有させるかを尋ね、accountスコープのルーティングbindingを書き込みます。

同じルーティングルールは、後で`openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind`でも管理できます（[agents](/cli/agents)を参照）。

single-accountのトップレベル設定をまだ使っているchannelに対してnon-default accountを追加すると、OpenClawは新しいaccountを書き込む前に、そのaccountスコープのトップレベル値をchannelのaccount mapへ昇格させます。ほとんどのchannelsでは、それらの値は`channels.<channel>.accounts.default`に配置されますが、同梱channelsでは既存の一致する昇格accountを保持する場合があります。現在の例はMatrixです。名前付きaccountがすでに1つ存在する場合、または`defaultAccount`が既存の名前付きaccountを指している場合、昇格では新しい`accounts.default`を作成せず、そのaccountを保持します。

ルーティングの挙動は一貫したままです。

- 既存のchannelのみのbinding（`accountId`なし）は、引き続きdefault accountに一致します。
- `channels add`は、非対話モードではbindingを自動作成も書き換えもしません。
- 対話型セットアップでは、任意でaccountスコープbindingを追加できます。

configがすでに混在状態（名前付きaccountsが存在し、なおかつトップレベルのsingle-account値も設定済み）になっている場合は、`openclaw doctor --fix`を実行して、そのchannel用に選ばれた昇格accountへaccountスコープ値を移動してください。ほとんどのchannelsは`accounts.default`へ昇格しますが、Matrixは既存の名前付き/default targetを保持できます。

## Login / logout（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

注:

- `channels login`は`--verbose`をサポートしています。
- `channels login` / `logout`は、サポートされるlogin targetが1つだけ設定されている場合、channelを推測できます。

## トラブルシューティング

- 広範なprobeには`openclaw status --deep`を実行してください。
- ガイド付き修正には`openclaw doctor`を使ってください。
- `openclaw channels list`が`Claude: HTTP 403 ... user:profile`を表示する場合、usage snapshotには`user:profile`スコープが必要です。`--no-usage`を使うか、claude.aiのsession key（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`）を指定するか、Claude CLIで再認証してください。
- `openclaw channels status`は、gatewayに到達できない場合、configのみの要約にフォールバックします。サポートされているchannel credentialがSecretRef経由で設定されていても、現在のコマンドパスでそのcredentialを利用できない場合、そのaccountは未設定としてではなく、degraded notes付きの設定済みとして報告されます。

## Capabilities probe

provider capabilityヒント（利用可能な場合はintents/scopes）と静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注:

- `--channel`は任意です。省略すると、すべてのchannel（extensionsを含む）を一覧表示します。
- `--account`は`--channel`と一緒の場合のみ有効です。
- `--target`は`channel:<id>`または生の数値channel idを受け付け、Discordにのみ適用されます。
- probesはprovider固有です。Discord intents + 任意のchannel権限、Slack bot + user scopes、Telegram botフラグ + webhook、Signal daemon version、Microsoft Teams app token + Graph roles/scopes（既知の場合は注記付き）を扱います。probeのないchannelsは`Probe: unavailable`を報告します。

## 名前をIDに解決する

provider directoryを使ってchannel/user名をIDに解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注:

- target typeを強制するには`--kind user|group|auto`を使用します。
- 同名のエントリが複数ある場合、解決はアクティブな一致を優先します。
- `channels resolve`は読み取り専用です。選択したaccountがSecretRef経由で設定されていても、そのcredentialが現在のコマンドパスで利用できない場合、コマンド全体を中断する代わりに、notes付きのdegraded unresolved結果を返します。
