---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: sandbox ランタイム、ツールの許可/拒否ポリシー、elevated exec ゲート'
title: Sandbox vs Tool Policy vs Elevated
x-i18n:
    generated_at: "2026-04-05T12:45:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw には、関連しているものの異なる 3 つの制御があります:

1. **Sandbox**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）は、**ツールがどこで実行されるか**（Docker かホストか）を決めます。
2. **Tool policy**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）は、**どのツールが利用可能/許可されるか**を決めます。
3. **Elevated**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）は、サンドボックス化されているときにサンドボックス外で実行するための **exec 専用のエスケープハッチ** です（デフォルトでは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

インスペクターを使って、OpenClaw が_実際に_何をしているかを確認します:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

表示内容:

- 実効的な sandbox モード/スコープ/ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか（main か non-main か）
- 実効的な sandbox ツール許可/拒否（およびそれが agent/global/default のどこから来たか）
- elevated ゲートと修正用キーパス

## Sandbox: ツールがどこで実行されるか

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます:

- `"off"`: すべてホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます（グループ/チャネルでよくある「想定外」の挙動）。
- `"all"`: すべてサンドボックス化されます。

完全なマトリクス（スコープ、ワークスペースマウント、イメージ）については、[Sandboxing](/gateway/sandboxing) を参照してください。

### バインドマウント（セキュリティのクイックチェック）

- `docker.binds` は sandbox ファイルシステムを_貫通_します。マウントしたものはすべて、設定したモード（`:ro` または `:rw`）でコンテナ内から見えるようになります。
- モードを省略するとデフォルトは read-write です。ソース/シークレットには `:ro` を推奨します。
- `scope: "shared"` はエージェントごとの bind を無視します（グローバル bind のみが適用されます）。
- OpenClaw は bind ソースを 2 回検証します。まず正規化されたソースパスに対して、次に最も深い既存の祖先をたどって解決した後に再度検証します。親ディレクトリの symlink によるエスケープでは、blocked-path や allowed-root チェックを回避できません。
- 存在しない leaf パスも安全にチェックされます。`/workspace/alias-out/new-file` が symlink 化された親を通って blocked path や設定済み allowed roots の外へ解決される場合、その bind は拒否されます。
- `/var/run/docker.sock` を bind すると、実質的に sandbox にホスト制御を渡すことになります。意図的な場合にのみ行ってください。
- ワークスペースアクセス（`workspaceAccess: "ro"`/`"rw"`）は bind モードとは独立しています。

## Tool policy: どのツールが存在し、呼び出せるか

重要なのは 2 層です:

- **Tool profile**: `tools.profile` と `agents.list[].tools.profile`（ベース許可リスト）
- **Provider tool profile**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとの tool policy**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider tool policy**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox tool policy**（サンドボックス化されているときのみ適用）: `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロックされたものとして扱われます。
- Tool policy が最終的な停止点です。拒否された `exec` ツールは `/exec` でも上書きできません。
- `/exec` は、認可された送信者に対してセッションデフォルトを変更するだけで、ツールアクセスを付与しません。
  Provider tool キーには、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも使用できます。

### ツールグループ（短縮記法）

Tool policy（グローバル、エージェント、sandbox）は、複数のツールに展開される `group:*` エントリをサポートしています:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

利用可能なグループ:

- `group:runtime`: `exec`, `process`, `code_execution`（`bash` は
  `exec` のエイリアスとして受け付けられます）
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: すべての組み込み OpenClaw ツール（provider plugin は除く）

## Elevated: exec 専用の「ホストで実行」

Elevated は追加のツールを付与しません。影響するのは `exec` だけです。

- サンドボックス化されている場合、`/elevated on`（または `elevated: true` を指定した `exec`）はサンドボックス外で実行されます（それでも承認が必要な場合があります）。
- セッションの exec 承認をスキップするには `/elevated full` を使います。
- すでに直接実行している場合、elevated は実質的に no-op です（それでもゲートされます）。
- Elevated は **skill スコープではなく**、tool allow/deny を上書き**しません**。
- Elevated は `host=auto` から任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションのターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は elevated とは別です。認可された送信者のセッションごとの exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled`（および必要に応じて `agents.list[].tools.elevated.enabled`）
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>`（および必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`）

[Evelated Mode](/tools/elevated) を参照してください。

## よくある「sandbox jail」修正

### 「ツール X が sandbox tool policy によってブロックされている」

修正用キー（いずれかを選択）:

- sandbox を無効化: `agents.defaults.sandbox.mode=off`（またはエージェントごとの `agents.list[].sandbox.mode=off`）
- sandbox 内でそのツールを許可:
  - `tools.sandbox.tools.deny`（またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`）から削除する
  - または `tools.sandbox.tools.allow`（またはエージェントごとの allow）に追加する

### 「これが main だと思っていたのに、なぜサンドボックス化されているのか?」

`"non-main"` モードでは、グループ/チャネルキーは _main_ ではありません。main セッションキー（`sandbox explain` に表示されます）を使うか、モードを `"off"` に切り替えてください。

## 関連項目

- [Sandboxing](/gateway/sandboxing) -- sandbox の完全リファレンス（モード、スコープ、バックエンド、イメージ）
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [Elevated Mode](/tools/elevated)
