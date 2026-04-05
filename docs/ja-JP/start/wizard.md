---
read_when:
    - CLI オンボーディングを実行または設定するとき
    - 新しいマシンをセットアップするとき
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャネル、Skills のガイド付きセットアップ'
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-04-05T12:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# オンボーディング（CLI）

CLI オンボーディングは、macOS、
Linux、または Windows（WSL2 経由。強く推奨）で OpenClaw をセットアップする**推奨**の方法です。
ローカル Gateway またはリモート Gateway 接続に加えて、チャネル、Skills、
ワークスペースのデフォルトを、1 つのガイド付きフローで設定します。

```bash
openclaw onboard
```

<Info>
最速で最初のチャットを始める方法: Control UI を開いてください（チャネル設定は不要です）。`openclaw dashboard` を実行し、ブラウザーでチャットします。ドキュメント: [Dashboard](/web/dashboard)。
</Info>

後で再設定するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>

<Tip>
CLI オンボーディングには Web 検索ステップが含まれており、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG、Tavily などのプロバイダーを選択できます。一部のプロバイダーでは
API キーが必要ですが、キー不要のものもあります。これは後から
`openclaw configure --section web` で設定することもできます。ドキュメント: [Web tools](/tools/web)。
</Tip>

## クイックスタート vs Advanced

オンボーディングは **クイックスタート**（デフォルト）と **Advanced**（完全制御）から始まります。

<Tabs>
  <Tab title="クイックスタート（デフォルト）">
    - ローカル Gateway（loopback）
    - ワークスペースのデフォルト（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **Token**（loopback 上でも自動生成）
    - 新しいローカルセットアップ向けのデフォルトツールポリシー: `tools.profile: "coding"`（既存の明示的なプロファイルは保持されます）
    - DM 分離のデフォルト: 未設定の場合、ローカルオンボーディングは `session.dmScope: "per-channel-peer"` を書き込みます。詳細: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **Off**
    - Telegram と WhatsApp の DM はデフォルトで **allowlist**（電話番号の入力を求められます）
  </Tab>
  <Tab title="Advanced（完全制御）">
    - すべてのステップ（モード、ワークスペース、Gateway、チャネル、デーモン、Skills）を表示します。
  </Tab>
</Tabs>

## オンボーディングで設定されるもの

**ローカルモード（デフォルト）**では、次の手順を案内します。

1. **モデル/認証** — Custom Provider
   （OpenAI 互換、Anthropic 互換、または Unknown auto-detect）を含む、サポートされている任意のプロバイダー/認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。デフォルトモデルを選びます。
   セキュリティメモ: このエージェントがツールを実行したり webhook/hooks の内容を処理したりする場合は、利用可能な最新世代の最も強力なモデルを優先し、ツールポリシーを厳格に保ってください。弱い/古い階層はプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` を使うと、平文の API キー値ではなく、環境変数に裏打ちされた参照が auth プロファイルに保存されます。
   非対話の `ref` モードでは、プロバイダー環境変数が設定されている必要があります。その環境変数なしでインラインキーのフラグを渡すと即座に失敗します。
   対話実行では、secret reference mode を選ぶと、環境変数または設定済みのプロバイダー参照（`file` または `exec`）のいずれかを指定でき、保存前に高速な事前検証が行われます。
   Anthropic については、対話型のオンボーディング/設定ではローカルフォールバックとして **Anthropic Claude CLI**、本番用の推奨経路として **Anthropic API key** を提供します。Anthropic setup-token も、Anthropic の OpenClaw 固有の **Extra Usage** 課金要件を伴う、従来型/手動の OpenClaw 経路として再び利用可能です。
2. **ワークスペース** — エージェントファイルの場所（デフォルトは `~/.openclaw/workspace`）。ブートストラップファイルを生成します。
3. **Gateway** — ポート、バインドアドレス、認証モード、Tailscale 公開。
   対話型の token モードでは、デフォルトの平文 token 保存を選ぶか、SecretRef を使うようにするかを選択します。
   非対話の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャネル** — BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび同梱チャットチャネル。
5. **デーモン** — LaunchAgent（macOS）、systemd user unit（Linux/WSL2）、またはネイティブ Windows Scheduled Task と、ユーザーごとの Startup-folder フォールバックをインストールします。
   token 認証で token が必要かつ `gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールではそれを検証しますが、解決済み token を supervisor サービスの環境メタデータには保存しません。
   token 認証で token が必要かつ設定された token SecretRef が未解決の場合、デーモンのインストールは実行可能なガイダンス付きでブロックされます。
   `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
6. **ヘルスチェック** — Gateway を起動し、実行中であることを確認します。
7. **Skills** — 推奨される Skills とオプション依存関係をインストールします。

<Note>
オンボーディングを再実行しても、明示的に **Reset** を選ぶ（または `--reset` を渡す）までは**何も消去されません**。
CLI の `--reset` はデフォルトで config、credentials、sessions を対象にします。workspace も含めるには `--reset-scope full` を使用してください。
config が無効な場合やレガシーキーを含む場合、オンボーディングはまず `openclaw doctor` を実行するよう求めます。
</Note>

**リモートモード**は、ローカルクライアントが他の場所にある Gateway に接続するよう設定するだけです。
リモートホストには**何もインストールせず、何も変更しません**。

## 別のエージェントを追加する

`openclaw agents add <name>` を使うと、独自のワークスペース、
セッション、auth プロファイルを持つ別のエージェントを作成できます。`--workspace` なしで実行するとオンボーディングが始まります。

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

メモ:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` の形式に従います。
- 受信メッセージをルーティングするには `bindings` を追加します（オンボーディングでも可能です）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

詳しい手順ごとの内訳と config 出力については、
[CLI Setup Reference](/start/wizard-cli-reference) を参照してください。
非対話の例については [CLI Automation](/start/wizard-cli-automation) を参照してください。
RPC の詳細を含む、より深い技術リファレンスについては
[Onboarding Reference](/reference/wizard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
- オンボーディング概要: [Onboarding Overview](/start/onboarding-overview)
- macOS アプリのオンボーディング: [オンボーディング](/start/onboarding)
- エージェント初回実行の儀式: [Agent Bootstrapping](/start/bootstrapping)
