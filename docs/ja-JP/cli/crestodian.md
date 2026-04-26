---
read_when:
    - commandなしでopenclawを実行し、Crestodianを理解したい場合
    - OpenClawを検査または修復するための、configなしでも安全な方法が必要です
    - message-channel rescue modeを設計または有効化しています
summary: configなしでも安全なセットアップと修復を支援するヘルパー、CrestodianのCLIリファレンスとセキュリティモデル
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

CrestodianはOpenClawのローカルセットアップ、修復、設定ヘルパーです。通常のagent経路が壊れているときでも到達可能であり続けるよう設計されています。

commandなしで `openclaw` を実行すると、対話型terminalでCrestodianが起動します。`openclaw crestodian` を実行すると、同じヘルパーが明示的に起動します。

## Crestodianが表示する内容

起動時、対話型Crestodianは `openclaw tui` と同じTUI shellを開きますが、Crestodian chat backendを使用します。chat logは短い挨拶から始まります。

- Crestodianをいつ開始すべきか
- Crestodianが実際に使用しているmodelまたはdeterministic planner経路
- configの妥当性とデフォルトagent
- 最初の起動probeから見たGateway到達可能性
- Crestodianが次に取れるデバッグアクション

起動のためだけにsecretをダンプしたり、Plugin CLI commandを読み込んだりはしません。TUIには通常どおりheader、chat log、status line、footer、autocomplete、editor controlが用意されています。

詳細なinventory（config path、docs/source path、ローカルCLI probe、API keyの有無、agent、model、Gatewayの詳細を含む）を確認するには `status` を使用します。

Crestodianは通常のagentと同じOpenClaw参照検出を使用します。Git checkoutでは、ローカルの `docs/` とローカルsource treeを参照します。npm package installでは、同梱のpackage docsを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) へのリンクを示します。docsだけでは不十分な場合はsourceを確認するよう明示的に案内します。

## 例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI内:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全な起動

Crestodianの起動経路は意図的に小さく保たれています。次のような場合でも実行できます。

- `openclaw.json` が存在しない
- `openclaw.json` が不正
- Gatewayが停止している
- Plugin command登録が利用できない
- まだagentが設定されていない

`openclaw --help` と `openclaw --version` は引き続き通常の高速経路を使用します。非対話型の `openclaw` は、root helpを表示する代わりに短いメッセージで終了します。commandなし製品はCrestodianだからです。

## 操作と承認

Crestodianは、その場しのぎでconfigを編集するのではなく、型付きoperationを使用します。

読み取り専用operationは即時実行できます。

- 概要を表示する
- agentを一覧表示する
- model/backend statusを表示する
- statusまたはhealth checkを実行する
- Gateway到達可能性を確認する
- 対話的fixなしでdoctorを実行する
- configを検証する
- audit log pathを表示する

永続operationは、直接commandに `--yes` を渡さない限り、対話モードでは会話による承認が必要です。

- configを書き込む
- `config set` を実行する
- `config set-ref` を通じてサポートされるSecretRef値を設定する
- setup/onboarding bootstrapを実行する
- デフォルトmodelを変更する
- Gatewayを開始、停止、または再起動する
- agentを作成する
- configまたはstateを書き換えるdoctor修復を実行する

適用された書き込みは次に記録されます。

```text
~/.openclaw/audit/crestodian.jsonl
```

検出は監査されません。適用されたoperationと書き込みのみが記録されます。

`openclaw onboard --modern` は、modern onboarding previewとしてCrestodianを起動します。通常の `openclaw onboard` は引き続きclassic onboardingを実行します。

## Setup Bootstrap

`setup` はchat優先のonboarding bootstrapです。書き込みは型付きconfig operation経由でのみ行い、先に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

modelが設定されていない場合、setupはこの順序で最初に使えるbackendを選択し、何を選んだかを表示します。

- 既存の明示的model（すでに設定済みの場合）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

どれも利用できない場合でも、setupはデフォルトworkspaceを書き込み、modelは未設定のままにします。Codex/Claude Codeをインストールまたはログインするか、`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` を公開してから、再度setupを実行してください。

## Model-Assisted Planner

Crestodianは常にdeterministic modeで開始します。deterministic parserが理解できないあいまいなcommandに対しては、ローカルCrestodianがOpenClawの通常runtime経路を通じて、境界付きplanner turnを1回だけ実行できます。まず設定済みのOpenClaw modelを使います。まだ使用可能な設定済みmodelがない場合は、マシン上にすでに存在するローカルruntimeにフォールバックできます。

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

model-assisted plannerはconfigを直接変更できません。要求をCrestodianの型付きcommandの1つに変換する必要があり、その後に通常の承認および監査ルールが適用されます。Crestodianは、何かを実行する前に、使用したmodelと解釈したcommandを表示します。configなしフォールバックplanner turnは一時的なもので、runtimeが対応している場合はtool無効で実行され、一時workspace/sessionを使用します。

message-channel rescue modeではmodel-assisted plannerは使用されません。壊れた、または侵害された通常agent経路をconfig editorとして使えないようにするため、リモートrescueはdeterministicのままです。

## agentへの切り替え

自然言語セレクターを使ってCrestodianを離れ、通常のTUIを開きます。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は引き続き通常のagent TUIを直接開きます。Crestodianは起動しません。

通常のTUIに切り替えた後は、`/crestodian` を使ってCrestodianに戻ります。続けて要求を含めることもできます。

```text
/crestodian
/crestodian restart gateway
```

TUI内のagent切り替えでは、`/crestodian` が使えることを示すbreadcrumbが残ります。

## Message rescue mode

message rescue modeは、Crestodianのmessage-channel entrypointです。通常のagentが死んでいても、WhatsAppのような信頼済みchannelがまだcommandを受信できる場合のためのものです。

サポートされるtext command:

- `/crestodian <request>`

operator flow:

```text
あなた: 信頼済みowner DMで /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
あなた: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
あなた: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

agent作成は、ローカルpromptまたはrescue modeからキューに入れることもできます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートrescue modeは管理者向けsurfaceです。通常chatとしてではなく、リモートconfig修復として扱う必要があります。

リモートrescueのセキュリティ契約:

- sandboxingが有効な場合は無効です。agent/sessionがsandboxedの場合、Crestodianはリモートrescueを拒否し、ローカルCLI修復が必要であることを説明しなければなりません。
- デフォルトの実効状態は `auto` です。runtimeがすでにsandboxなしのローカル権限を持つ、信頼済みYOLO運用でのみリモートrescueを許可します。
- 明示的なowner identityが必要です。rescueはワイルドカード送信者ルール、openなgroup policy、未認証Webhook、匿名channelを受け付けてはなりません。
- デフォルトではowner DMのみです。group/channel rescueには明示的なopt-inが必要です。
- リモートrescueではローカルTUIを開いたり、対話型agent sessionに切り替えたりできません。agent handoffにはローカルの `openclaw` を使用してください。
- 永続的書き込みは、rescue modeでも引き続き承認が必要です。
- 適用されたrescue operationはすべて監査します。message-channel rescueではchannel、account、sender、source-address metadataを記録します。config変更operationでは、変更前後のconfig hashも記録します。
- secretを絶対にエコーしないでください。SecretRef検査では値ではなく可用性を報告する必要があります。
- Gatewayが生きている場合は、Gatewayの型付きoperationを優先します。Gatewayが死んでいる場合は、通常agent loopに依存しない最小限のローカル修復surfaceのみを使用します。

config形状:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` は次を受け付けるべきです。

- `"auto"`: デフォルト。実効runtimeがYOLOでsandboxingがoffの場合にのみ許可
- `false`: message-channel rescueを決して許可しない
- `true`: owner/channel checkが通る場合に明示的にrescueを許可。これでもsandboxing拒否を回避してはなりません

デフォルトの `"auto"` YOLO postureは次のとおりです。

- sandbox modeは `off` に解決される
- `tools.exec.security` は `full` に解決される
- `tools.exec.ask` は `off` に解決される

リモートrescueは次のDocker laneでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

configなしローカルplannerフォールバックは次でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

opt-inのlive channel command-surface smokeは、`/crestodian status` と、rescue handler経由の永続承認ラウンドトリップを確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian経由の新規configなしセットアップは次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このlaneは空のstate dirから開始し、素の `openclaw` をCrestodianにルーティングし、デフォルトmodelを設定し、追加agentを作成し、Plugin有効化とtoken SecretRefでDiscordを設定し、configを検証し、audit logを確認します。QA Labにも、同じRing 0 flowに対するrepo-backed scenarioがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [Sandbox](/ja-JP/cli/sandbox)
- [Security](/ja-JP/cli/security)
