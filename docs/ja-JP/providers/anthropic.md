---
read_when:
    - OpenClawでAnthropic modelを使いたい
    - Gateway host上でClaude CLIのsubscription認証を再利用したい
summary: OpenClawでAPI keyまたはClaude CLI経由でAnthropic Claudeを使う
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T12:53:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropicは**Claude** modelファミリーを開発しており、API経由でアクセスを提供しています。
OpenClawでは、新しいAnthropicセットアップにはAPI keyまたはローカルのClaude CLI
backendを使うべきです。既存のlegacy Anthropic token profileは、すでに設定済みであれば
引き続き実行時に尊重されます。

<Warning>
Anthropicの公開Claude Codeドキュメントには、`claude -p` のような非対話CLI
利用が明示的に記載されています。これらのドキュメントに基づき、ローカルで
ユーザー管理されるClaude Code CLI fallbackはおそらく許可されていると私たちは考えています。

一方で、Anthropicは**2026年4月4日 午後12:00 PT / 午後8:00 BST** にOpenClawユーザーへ対し、
**OpenClawはサードパーティharnessとして扱われる**と通知しました。彼らが示した
ポリシーでは、OpenClaw駆動のClaude-loginトラフィックは、同梱されたClaude subscription枠を
もう使用せず、代わりに**Extra Usage**
（subscriptionとは別請求の従量課金）が必要です。

このポリシー上の区別は、**OpenClaw駆動のClaude CLI再利用**に関するものであり、
自分のterminalで `claude` を直接実行することに関するものではありません。とはいえ、
Anthropicのサードパーティharnessポリシーには、外部製品における
subscriptionベース利用について依然として十分な曖昧さがあるため、この経路を本番用途には推奨しません。

Anthropicの現在の公開ドキュメント:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

最も明確な課金経路を望む場合は、代わりにAnthropic API keyを使ってください。
OpenClawは、[OpenAI
Codex](/providers/openai)、[Qwen Cloud Coding Plan](/providers/qwen)、
[MiniMax Coding Plan](/providers/minimax)、[Z.AI / GLM Coding
Plan](/providers/glm) を含む、他のsubscription型オプションもサポートしています。
</Warning>

## Option A: Anthropic API key

**最適な用途:** 標準的なAPIアクセスと従量課金。
Anthropic ConsoleでAPI keyを作成してください。

### CLIセットアップ

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Claude CLI configスニペット

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinkingのデフォルト（Claude 4.6）

- Anthropic Claude 4.6 modelは、明示的なthinking levelが設定されていない場合、OpenClawでデフォルトで `adaptive` thinkingを使用します。
- メッセージごと（`/think:<level>`）またはmodel paramsで上書きできます:
  `agents.defaults.models["anthropic/<model>"].params.thinking`。
- 関連するAnthropicドキュメント:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast mode（Anthropic API）

OpenClaw共通の `/fast` トグルは、`api.anthropic.com` に送られるAPI-key認証およびOAuth認証リクエストを含む、公開Anthropicへの直接トラフィックもサポートしています。

- `/fast on` は `service_tier: "auto"` にマップされます
- `/fast off` は `service_tier: "standard_only"` にマップされます
- Configデフォルト:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

重要な制限:

- OpenClawは、Anthropic service tierを直接の `api.anthropic.com` リクエストに対してのみ注入します。`anthropic/*` をproxyまたはGateway経由でルーティングしている場合、`/fast` は `service_tier` に触れません。
- 明示的なAnthropic `serviceTier` または `service_tier` model paramsが設定されている場合、両方が存在するときは `/fast` のデフォルトよりそちらが優先されます。
- Anthropicは実効tierをresponseの `usage.service_tier` で返します。Priority Tier capacityがないaccountでは、`service_tier: "auto"` でも `standard` に解決されることがあります。

## Prompt caching（Anthropic API）

OpenClawはAnthropicのprompt caching機能をサポートしています。これは**API専用**であり、legacy Anthropic token認証ではcache設定は尊重されません。

### 設定

model config内で `cacheRetention` parameterを使います。

| Value   | Cache Duration | 説明                     |
| ------- | -------------- | ------------------------ |
| `none`  | キャッシュなし | prompt cachingを無効化   |
| `short` | 5分            | API Key認証のデフォルト  |
| `long`  | 1時間          | 拡張キャッシュ           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### デフォルト

Anthropic API Key認証を使っている場合、OpenClawはすべてのAnthropic modelに対して自動的に `cacheRetention: "short"`（5分キャッシュ）を適用します。configで `cacheRetention` を明示設定すれば、これを上書きできます。

### AgentごとのcacheRetention override

modelレベルparamsをベースラインとして使い、特定agentは `agents.list[].params` で上書きしてください。

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // 多くのagent向けベースライン
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // このagentだけ上書き
    ],
  },
}
```

cache関連paramsのconfigマージ順序:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（一致する `id`、キー単位で上書き）

これにより、同じmodel上でも、あるagentは長寿命cacheを維持しつつ、別のagentはバースト的で再利用の少ないトラフィックにおけるwriteコストを避けるためcachingを無効化できます。

### Bedrock Claudeに関する注意

- Bedrock上のAnthropic Claude model（`amazon-bedrock/*anthropic.claude*`）は、設定されていれば `cacheRetention` のパススルーを受け付けます。
- Anthropic以外のBedrock modelは、実行時に `cacheRetention: "none"` へ強制されます。
- Anthropic API-keyのsmart defaultは、明示値がない場合、Claude-on-Bedrock model refにも `cacheRetention: "short"` を設定します。

## 1M context window（Anthropic beta）

Anthropicの1M context windowはbeta gate付きです。OpenClawでは、対応するOpus/Sonnet modelごとに
`params.context1m: true` を設定して有効化します。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClawはこれをAnthropic
request上で `anthropic-beta: context-1m-2025-08-07` にマップします。

これは、そのmodelに対して `params.context1m` が明示的に `true` に設定されている場合にのみ有効になります。

要件: Anthropicが、その資格情報でlong-context利用を許可している必要があります
（通常はAPI key課金、またはOpenClawのClaude-login経路 / Extra Usageが有効なlegacy token auth）。
そうでない場合、Anthropicは次を返します:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意: Anthropicは現在、
legacy Anthropic token auth（`sk-ant-oat-*`）を使うと `context-1m-*` beta requestを拒否します。
そのlegacy auth modeで
`context1m: true` を設定した場合、OpenClawは警告を記録し、
必要なOAuth betaは維持しつつ、context1m beta
headerをスキップして標準context windowへフォールバックします。

## Option B: メッセージproviderとしてClaude CLIを使う

**最適な用途:** すでにClaude CLIがインストールされてサインイン済みの単一ユーザーGateway hostで、推奨される本番経路ではなくローカルfallbackとして使う場合。

課金に関する注意: Anthropicの公開CLI docsに基づき、ローカルで
ユーザー管理される自動化におけるClaude Code CLI fallbackはおそらく許可されていると私たちは考えています。とはいえ、
Anthropicのサードパーティharnessポリシーは、外部製品における
subscriptionベース利用について十分な曖昧さを生むため、本番用途には推奨しません。
AnthropicはまたOpenClawユーザーに対し、**OpenClaw駆動の** Claude
CLI利用はサードパーティharnessトラフィックとして扱われ、**2026年4月4日
午後12:00 PT / 午後8:00 BST** 以降は、
同梱subscription上限ではなく**Extra Usage** が必要になると伝えています。

この経路では、Anthropic APIを直接呼ぶ代わりに、ローカルの `claude` binaryをmodel推論に使います。OpenClawはこれを**CLI backend provider**
として扱い、次のようなmodel refを使用します。

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

仕組み:

1. OpenClawは**Gateway host上で** `claude -p --output-format stream-json --include-partial-messages ...`
   を起動し、stdin経由でpromptを送ります。
2. 最初のturnでは `--session-id <uuid>` を送ります。
3. 後続turnでは、保存されたClaude sessionを `--resume <sessionId>` で再利用します。
4. chatメッセージ自体は通常のOpenClaw message pipelineを通りますが、
   実際のmodel replyはClaude CLIによって生成されます。

### 要件

- Gateway hostにClaude CLIがインストールされていてPATH上にあること、または
  absolute command pathで設定されていること。
- 同じhost上でClaude CLIがすでに認証済みであること:

```bash
claude auth status
```

- OpenClawは、configで
  `claude-cli/...` または `claude-cli` backend configが明示的に参照されている場合、
  Gateway起動時にbundled Anthropic pluginを自動読み込みします。

### Configスニペット

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

`claude` binaryがGateway hostのPATH上にない場合:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### 得られるもの

- ローカルCLIから再利用されるClaude subscription認証（実行時に読み取られ、永続化されない）
- 通常のOpenClaw message/session routing
- turnをまたいだClaude CLI session継続性（auth変更時に無効化）
- loopback MCP bridge経由でClaude CLIへ公開されるGateway tools
- live partial-message progressを伴うJSONL streaming

### Anthropic authからClaude CLIへ移行する

現在 `anthropic/...` をlegacy token profileまたはAPI keyで使っていて、同じGateway hostをClaude CLIへ切り替えたい場合、
OpenClawはこれを通常のprovider-auth migration経路としてサポートしています。

前提条件:

- OpenClawを実行している**同じGateway host** にClaude CLIがインストールされていること
- そのhost上でClaude CLIがすでにサインイン済みであること: `claude auth login`

その後、次を実行します:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

またはonboardingでは:

```bash
openclaw onboard --auth-choice anthropic-cli
```

対話型の `openclaw onboard` と `openclaw configure` は現在、
最初に **Anthropic Claude CLI**、次に **Anthropic API key** を優先します。

この処理で行われること:

- Claude CLIがGateway host上ですでにサインイン済みか検証する
- デフォルトmodelを `claude-cli/...` へ切り替える
- `anthropic/claude-opus-4-6` のようなAnthropic default-model fallbackを
  `claude-cli/claude-opus-4-6` に書き換える
- `agents.defaults.models` に対応する `claude-cli/...` エントリーを追加する

簡単な確認:

```bash
openclaw models status
```

解決されたprimary modelが `claude-cli/...` の下に表示されるはずです。

この処理で**行われない**こと:

- 既存のAnthropic auth profileを削除すること
- メインのdefault
  model/allowlist経路以外にある古い `anthropic/...` config参照をすべて削除すること

そのためロールバックは簡単です。必要ならデフォルトmodelを `anthropic/...` に戻してください。

### 重要な制限

- これは**Anthropic API providerではありません**。ローカルCLI runtimeです。
- OpenClawはtool callを直接注入しません。Claude CLIはGateway
  toolsをloopback MCP bridge経由で受け取ります（`bundleMcp: true`、デフォルト）。
- Claude CLIはJSONL（`stream-json` と
  `--include-partial-messages`）でreplyをstreamします。promptはargvではなくstdin経由で送られます。
- Authは、実行時に有効なClaude CLI資格情報から読み取られ、OpenClaw profileへは永続化されません。非対話コンテキストではkeychain promptは抑制されます。
- Session再利用は `cliSessionBinding` metadataで追跡されます。Claude CLI
  login状態が変わると（再ログイン、token rotation）、保存済みsessionは
  無効化され、新しいsessionが開始されます。
- 共有されたmulti-user課金構成ではなく、個人用Gateway hostに最適です。

詳細: [/gateway/cli-backends](/gateway/cli-backends)

## 注意

- Anthropicの公開Claude Code docsには、引き続き
  `claude -p` のような直接CLI利用が記載されています。ローカルで
  ユーザー管理されるfallbackはおそらく許可されていると私たちは考えていますが、
  AnthropicがOpenClawユーザーへ出した別通知では、**OpenClaw**
  Claude-login経路はサードパーティharness利用であり、**Extra Usage**
  が必要だとされています（subscriptionとは別請求の従量課金）。本番用途では、
  代わりにAnthropic API keyを推奨します。
- Anthropic setup-tokenは、legacy/manual経路としてOpenClawで再び利用可能です。AnthropicのOpenClaw固有課金通知は引き続き適用されるため、この経路ではAnthropicが**Extra Usage** を要求する前提で使ってください。
- Auth詳細と再利用ルールは [/concepts/oauth](/concepts/oauth) にあります。

## トラブルシューティング

**401 error / tokenが突然無効になった**

- Legacy Anthropic token authは期限切れになったり、取り消されたりすることがあります。
- 新しいセットアップでは、Anthropic API keyまたはGateway host上のローカルClaude CLI経路へ移行してください。

**No API key found for provider "anthropic"**

- Authは**agentごと**です。新しいagentはメインagentのkeyを継承しません。
- そのagent向けにonboardingを再実行するか、Gateway
  host上でAPI keyを設定し、その後 `openclaw models status` で確認してください。

**No credentials found for profile `anthropic:default`**

- どのauth profileがアクティブか確認するには `openclaw models status` を実行してください。
- onboardingを再実行するか、そのprofile経路向けにAPI keyまたはClaude CLIを設定してください。

**No available auth profile (all in cooldown/unavailable)**

- `auth.unusableProfiles` を確認するには `openclaw models status --json` を使ってください。
- Anthropicのrate-limit cooldownはmodelスコープであることがあるため、現在のものがcooldown中でも、別のAnthropic
  modelは使える場合があります。
- 別のAnthropic profileを追加するか、cooldownが明けるまで待ってください。

詳細: [/gateway/troubleshooting](/gateway/troubleshooting) と [/help/faq](/help/faq)。
