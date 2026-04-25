---
read_when:
    - コマンドなしで openclaw を実行し、Crestodian を理解したい場合
    - OpenClaw を検査または修復するための configless-safe な方法が必要です
    - メッセージチャンネルのレスキューモードを設計または有効化しています
summary: configless-safe なセットアップおよび修復ヘルパーである Crestodian の CLI リファレンスとセキュリティモデル
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian は OpenClaw のローカルなセットアップ、修復、設定ヘルパーです。通常のエージェント経路が壊れている場合でも到達可能であり続けるよう設計されています。

コマンドなしで `openclaw` を実行すると、Crestodian がインタラクティブターミナルで起動します。`openclaw crestodian` を実行すると、同じヘルパーを明示的に起動します。

## Crestodian が表示する内容

起動時、インタラクティブな Crestodian は `openclaw tui` と同じ TUI シェルを、Crestodian のチャットバックエンドで開きます。チャットログは短い挨拶から始まります。

- Crestodian を起動すべきタイミング
- Crestodian が実際に使用しているモデルまたは決定論的プランナーパス
- config の妥当性とデフォルトエージェント
- 最初の起動プローブによる Gateway 到達性
- Crestodian が次に実行できるデバッグアクション

起動のためだけに秘密情報をダンプしたり、Plugin CLI コマンドを読み込んだりはしません。TUI は引き続き通常のヘッダー、チャットログ、ステータス行、フッター、オートコンプリート、エディター操作を提供します。

詳細なインベントリとして、config パス、docs/source パス、ローカル CLI プローブ、API キーの有無、エージェント、モデル、Gateway の詳細を確認するには `status` を使います。

Crestodian は通常のエージェントと同じ OpenClaw の参照検出を使用します。Git チェックアウトでは、ローカルの `docs/` とローカルのソースツリーを参照します。npm パッケージインストールでは、同梱されたパッケージ docs を使用し、
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) へのリンクを使います。また、docs だけでは不十分な場合はソースを確認するよう明示的に案内します。

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

Crestodian TUI 内:

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

Crestodian の起動パスは意図的に小さく保たれています。次のような場合でも実行できます。

- `openclaw.json` が存在しない
- `openclaw.json` が無効
- Gateway が停止している
- Plugin コマンド登録が利用できない
- まだエージェントが設定されていない

`openclaw --help` と `openclaw --version` は引き続き通常の高速パスを使用します。
非インタラクティブな `openclaw` はルートヘルプを表示する代わりに短いメッセージで終了します。コマンドなしプロダクトは Crestodian だからです。

## 操作と承認

Crestodian は config を場当たり的に編集するのではなく、型付き操作を使用します。

読み取り専用操作はすぐに実行できます。

- 概要を表示する
- エージェント一覧を表示する
- モデル/バックエンド状態を表示する
- status または health チェックを実行する
- Gateway 到達性を確認する
- 対話的修正なしで doctor を実行する
- config を検証する
- 監査ログパスを表示する

永続操作は、直接コマンドに `--yes` を渡さない限り、インタラクティブモードでは会話による承認が必要です。

- config を書き込む
- `config set` を実行する
- `config set-ref` を通じてサポートされる SecretRef 値を設定する
- setup/オンボーディング bootstrap を実行する
- デフォルトモデルを変更する
- Gateway を開始、停止、または再起動する
- エージェントを作成する
- config または状態を書き換える doctor 修復を実行する

適用された書き込みは次に記録されます。

```text
~/.openclaw/audit/crestodian.jsonl
```

検出は監査されません。ログに記録されるのは、適用された操作と書き込みだけです。

`openclaw onboard --modern` は、モダンなオンボーディングプレビューとして Crestodian を起動します。
通常の `openclaw onboard` は引き続きクラシックオンボーディングを実行します。

## Setup Bootstrap

`setup` はチャットファーストのオンボーディング bootstrap です。型付き config 操作だけを通じて書き込みを行い、事前に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが設定されていない場合、setup は次の順序で最初に使えるバックエンドを選び、何を選んだかを知らせます。

- 既存の明示的モデル（すでに設定済みの場合）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

どれも利用できない場合でも、setup はデフォルト workspace を書き込み、モデルは未設定のままにします。Codex/Claude Code をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup をもう一度実行してください。

## モデル支援プランナー

Crestodian は常に決定論的モードで起動します。決定論的パーサーが理解できないあいまいなコマンドに対しては、ローカル Crestodian は OpenClaw の通常ランタイムパスを通して 1 回だけ境界付きのプランナーターンを実行できます。最初に設定済みの OpenClaw モデルを使用します。設定済みモデルがまだ使えない場合は、マシン上にすでに存在するローカルランタイムにフォールバックできます。

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

モデル支援プランナーは config を直接変更できません。要求を Crestodian の型付きコマンドのいずれかに変換しなければならず、その後に通常の承認と監査ルールが適用されます。Crestodian は何かを実行する前に、使用したモデルと解釈したコマンドを表示します。configless なフォールバックプランナーターンは一時的であり、ランタイムが対応している場合は tool 無効化され、一時 workspace/session を使用します。

メッセージチャンネルのレスキューモードではモデル支援プランナーは使用しません。壊れた、または侵害された通常のエージェント経路を config エディターとして使えないようにするため、リモートレスキューは決定論的のままです。

## エージェントへの切り替え

自然言語セレクターを使って Crestodian を離れ、通常の TUI を開きます。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は引き続き通常のエージェント TUI を直接開きます。Crestodian は起動しません。

通常の TUI に切り替えた後は、`/crestodian` を使って Crestodian に戻れます。続けてリクエストを含めることもできます。

```text
/crestodian
/crestodian restart gateway
```

TUI 内でのエージェント切り替えでは、`/crestodian` が使えることを示す breadcrumb が残ります。

## メッセージレスキューモード

メッセージレスキューモードは Crestodian のメッセージチャンネル用エントリーポイントです。通常のエージェントが死んでいても、WhatsApp などの信頼できるチャンネルではまだコマンドを受け取れる、というケース向けです。

サポートされるテキストコマンド:

- `/crestodian <request>`

オペレーターフロー:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

エージェント作成は、ローカルプロンプトまたはレスキューモードからキュー投入することもできます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートレスキューモードは管理者向けサーフェスです。通常のチャットではなく、リモート config 修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- サンドボックス化が有効な場合は無効です。エージェント/セッションがサンドボックス化されている場合、Crestodian はリモートレスキューを拒否し、ローカル CLI 修復が必要だと説明しなければなりません。
- デフォルトの有効状態は `auto` です。ランタイムがすでに非サンドボックスのローカル権限を持つ、信頼された YOLO 運用でのみリモートレスキューを許可します。
- 明示的な所有者 ID を必須とします。レスキューはワイルドカード送信者ルール、open な group policy、認証されていない Webhook、匿名チャンネルを受け付けてはなりません。
- デフォルトでは所有者 DM のみです。グループ/チャンネルでのレスキューは明示的なオプトインが必要で、承認プロンプトも引き続き所有者 DM にルーティングされるべきです。
- リモートレスキューはローカル TUI を開いたり、インタラクティブなエージェントセッションに切り替えたりできません。エージェントへの引き継ぎにはローカルの `openclaw` を使ってください。
- 永続書き込みは、レスキューモードでも引き続き承認が必要です。
- 適用されたすべてのレスキュー操作を監査します。これには channel、account、sender、session key、operation、変更前 config hash、変更後 config hash を含めます。
- 秘密情報は絶対にそのまま返しません。SecretRef の検査では値ではなく可用性を報告する必要があります。
- Gateway が生きている場合は、Gateway の型付き操作を優先します。Gateway が死んでいる場合は、通常のエージェントループに依存しない最小限のローカル修復サーフェスだけを使用します。

config の形状:

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

- `"auto"`: デフォルト。実効ランタイムが YOLO で、かつサンドボックス化が off の場合にのみ許可
- `false`: メッセージチャンネルレスキューを一切許可しない
- `true`: 所有者/チャンネルチェックを通過した場合に明示的にレスキューを許可。この場合でもサンドボックス拒否を迂回してはなりません

デフォルトの `"auto"` YOLO 姿勢:

- sandbox mode は `off` に解決される
- `tools.exec.security` は `full` に解決される
- `tools.exec.ask` は `off` に解決される

リモートレスキューは Docker レーンでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

configless なローカルプランナーフォールバックは次でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

オプトインの live チャンネル command-surface スモークでは、`/crestodian status` に加えて、レスキューハンドラー経由の永続承認ラウンドトリップを確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian を通じた新規の configless セットアップは次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の状態ディレクトリから始まり、裸の `openclaw` を Crestodian にルーティングし、デフォルトモデルを設定し、追加エージェントを作成し、Plugin 有効化とトークン SecretRef で Discord を設定し、config を検証し、監査ログを確認します。QA Lab にも同じ Ring 0 フロー向けの repo-backed シナリオがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [Sandbox](/ja-JP/cli/sandbox)
- [Security](/ja-JP/cli/security)
