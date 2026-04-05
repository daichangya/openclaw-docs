---
read_when:
    - 複数の分離されたagent（workspace + routing + auth）が必要な場合
summary: '`openclaw agents`のCLIリファレンス（list/add/delete/bindings/bind/unbind/set identity）'
title: agents
x-i18n:
    generated_at: "2026-04-05T12:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

分離されたagent（workspace + auth + routing）を管理します。

関連:

- マルチagentルーティング: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)
- Skills可視性設定: [Skills config](/tools/skills-config)

## 例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## ルーティングbinding

受信channelトラフィックを特定のagentに固定するには、ルーティングbindingを使用します。

agentごとに表示されるSkillsも変えたい場合は、
`openclaw.json`で`agents.defaults.skills`と`agents.list[].skills`を
設定してください。詳細は[Skills config](/tools/skills-config)および
[Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills)を参照してください。

bindingを一覧表示するには:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

bindingを追加するには:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`（`--bind <channel>`）を省略すると、OpenClawは利用可能な場合、channelデフォルトとpluginセットアップhookからそれを解決します。

`bind`または`unbind`で`--agent`を省略すると、OpenClawは現在のdefault agentを対象にします。

### bindingスコープの挙動

- `accountId`なしのbindingは、そのchannelのdefault accountにのみ一致します。
- `accountId: "*"`はchannel全体のフォールバック（すべてのaccounts）であり、明示的なaccount bindingより具体性が低くなります。
- 同じagentに対して`accountId`なしの一致するchannel bindingがすでに存在し、後から明示的または解決済みの`accountId`でbindingした場合、OpenClawは重複を追加する代わりに既存のbindingをその場でアップグレードします。

例:

```bash
# 初期のchannelのみbinding
openclaw agents bind --agent work --bind telegram

# 後でaccountスコープbindingにアップグレード
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後、そのbindingのルーティングは`telegram:ops`にスコープされます。default accountのルーティングも必要な場合は、明示的に追加してください（たとえば`--bind telegram:default`）。

bindingを削除するには:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`は`--all`または1つ以上の`--bind`値のいずれかを受け付けます。両方は指定できません。

## コマンドサーフェス

### `agents`

サブコマンドなしで`openclaw agents`を実行することは、`openclaw agents list`と同等です。

### `agents list`

オプション:

- `--json`
- `--bindings`: agentごとの件数/要約だけでなく、完全なルーティングルールを含める

### `agents add [name]`

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し可）
- `--non-interactive`
- `--json`

注:

- 明示的なaddフラグを1つでも渡すと、コマンドは非対話パスに切り替わります。
- 非対話モードでは、agent名と`--workspace`の両方が必要です。
- `main`は予約済みで、新しいagent idとしては使用できません。

### `agents bindings`

オプション:

- `--agent <id>`
- `--json`

### `agents bind`

オプション:

- `--agent <id>`（デフォルトは現在のdefault agent）
- `--bind <channel[:accountId]>`（繰り返し可）
- `--json`

### `agents unbind`

オプション:

- `--agent <id>`（デフォルトは現在のdefault agent）
- `--bind <channel[:accountId]>`（繰り返し可）
- `--all`
- `--json`

### `agents delete <id>`

オプション:

- `--force`
- `--json`

注:

- `main`は削除できません。
- `--force`がない場合、対話的な確認が必要です。
- Workspace、agent state、およびsession transcriptディレクトリは、完全削除ではなくTrashに移動されます。

## Identityファイル

各agent workspaceには、workspaceルートに`IDENTITY.md`を含めることができます。

- 例のパス: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`はworkspaceルートから読み取ります（または明示的な`--identity-file`）

avatarパスはworkspaceルートからの相対パスとして解決されます。

## identityを設定する

`set-identity`は、`agents.list[].identity`に次のフィールドを書き込みます。

- `name`
- `theme`
- `emoji`
- `avatar`（workspace相対パス、http(s) URL、またはdata URI）

オプション:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注:

- 対象agentの選択には`--agent`または`--workspace`を使用できます。
- `--workspace`に依存していて、複数のagentsがそのworkspaceを共有している場合、コマンドは失敗し、`--agent`を渡すよう求められます。
- 明示的なidentityフィールドが指定されていない場合、コマンドは`IDENTITY.md`からidentityデータを読み取ります。

`IDENTITY.md`から読み込むには:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

フィールドを明示的に上書きするには:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Configサンプル:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
