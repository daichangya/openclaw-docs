---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: エージェントごとのサンドボックスとツール制限、優先順位、例
title: マルチエージェントのサンドボックスとツール
x-i18n:
    generated_at: "2026-04-05T13:00:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# マルチエージェントのサンドボックスとツール設定

マルチエージェント構成では、各エージェントがグローバルのサンドボックスおよびツール
ポリシーを上書きできます。このページでは、エージェントごとの設定、優先順位のルール、
および例を説明します。

- **サンドボックスのバックエンドとモード**: [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- **ブロックされたツールのデバッグ**: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) と `openclaw sandbox explain` を参照してください。
- **昇格 exec**: [Elevated Mode](/tools/elevated) を参照してください。

認証はエージェントごとです。各エージェントは、それぞれの `agentDir` 認証ストア
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` を読み取ります。
認証情報はエージェント間で**共有されません**。エージェント間で `agentDir` を再利用しないでください。
認証情報を共有したい場合は、`auth-profiles.json` をもう一方のエージェントの `agentDir` にコピーしてください。

---

## 設定例

### 例 1: 個人用 + 制限付き家族エージェント

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**結果:**

- `main` エージェント: ホスト上で実行、フルツールアクセス
- `family` エージェント: Docker 内で実行（エージェントごとに 1 コンテナー）、`read` tool のみ

---

### 例 2: 共有サンドボックス付きの仕事用エージェント

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### 例 2b: グローバルな coding プロファイル + messaging 専用エージェント

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**結果:**

- デフォルトエージェントは coding ツールを取得
- `support` エージェントは messaging 専用（+ Slack tool）

---

### 例 3: エージェントごとに異なるサンドボックスモード

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // グローバルデフォルト
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // 上書き: main はサンドボックス化しない
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // 上書き: public は常にサンドボックス化
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## 設定の優先順位

グローバル（`agents.defaults.*`）とエージェント固有（`agents.list[].*`）の設定が両方ある場合:

### サンドボックス設定

エージェント固有の設定がグローバルを上書きします:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注意:**

- `agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントについて `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きします（サンドボックススコープが `"shared"` に解決される場合は無視されます）。

### ツール制限

フィルタリング順序は次のとおりです:

1. **ツールプロファイル**（`tools.profile` または `agents.list[].tools.profile`）
2. **プロバイダーツールプロファイル**（`tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`）
3. **グローバルツールポリシー**（`tools.allow` / `tools.deny`）
4. **プロバイダーツールポリシー**（`tools.byProvider[provider].allow/deny`）
5. **エージェント固有のツールポリシー**（`agents.list[].tools.allow/deny`）
6. **エージェントのプロバイダーポリシー**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **サンドボックスツールポリシー**（`tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`）
8. **サブエージェントツールポリシー**（該当する場合の `tools.subagents.tools`）

各レベルはさらにツールを制限できますが、前のレベルで拒否されたツールを再付与することはできません。
`agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントでは `tools.sandbox.tools` を置き換えます。
`agents.list[].tools.profile` が設定されている場合、そのエージェントでは `tools.profile` を上書きします。
プロバイダーツールキーには、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）を指定できます。

ツールポリシーは、複数のツールへ展開される `group:*` の短縮記法をサポートします。完全な一覧は [Tool groups](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) を参照してください。

エージェントごとの昇格上書き（`agents.list[].tools.elevated`）により、特定のエージェントの昇格 exec をさらに制限できます。詳細は [Elevated Mode](/tools/elevated) を参照してください。

---

## 単一エージェントからの移行

**移行前（単一エージェント）:**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**移行後（異なるプロファイルを持つマルチエージェント）:**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

旧来の `agent.*` 設定は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を使ってください。

---

## ツール制限の例

### 読み取り専用エージェント

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 安全実行エージェント（ファイル変更なし）

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 通信専用エージェント

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

このプロファイルの `sessions_history` も、生の transcript ダンプではなく、
境界付きでサニタイズされたリコールビューを返します。アシスタントのリコールでは、thinking tags、
`<relevant-memories>` の足場、プレーンテキストの tool-call XML ペイロード
（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められた tool-call ブロックを含む）、
格下げされた tool-call の足場、漏えいした ASCII/全角のモデル制御
トークン、そして不正な MiniMax tool-call XML が、redaction/truncation の前に除去されます。

---

## よくある落とし穴: 「non-main」

`agents.defaults.sandbox.mode: "non-main"` は、agent id ではなく `session.mainKey`（デフォルト `"main"`）に基づきます。
グループ/チャンネルセッションは常にそれぞれ固有のキーを持つため、
non-main として扱われ、サンドボックス化されます。あるエージェントを決して
サンドボックス化したくない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。

---

## テスト

マルチエージェントのサンドボックスとツールを設定した後:

1. **エージェント解決を確認する:**

   ```exec
   openclaw agents list --bindings
   ```

2. **サンドボックスコンテナーを確認する:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **ツール制限をテストする:**
   - 制限されたツールを必要とするメッセージを送る
   - エージェントが拒否されたツールを使えないことを確認する

4. **ログを監視する:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## トラブルシューティング

### `mode: "all"` にしているのにエージェントがサンドボックス化されない

- それを上書きしているグローバルな `agents.defaults.sandbox.mode` がないか確認してください
- エージェント固有の設定が優先されるので、`agents.list[].sandbox.mode: "all"` を設定してください

### deny リストがあるのにツールがまだ利用可能

- ツールのフィルタリング順序を確認してください: global → agent → sandbox → subagent
- 各レベルはさらに制限することしかできず、再付与はできません
- ログで確認してください: `[tools] filtering tools for agent:${agentId}`

### コンテナーがエージェントごとに分離されない

- エージェント固有の sandbox config で `scope: "agent"` を設定してください
- デフォルトは `"session"` で、セッションごとに 1 コンテナーを作成します

---

## 関連項目

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス（モード、スコープ、バックエンド、イメージ）
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [Elevated Mode](/tools/elevated)
- [Multi-Agent Routing](/ja-JP/concepts/multi-agent)
- [Sandbox Configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)
- [Session Management](/ja-JP/concepts/session)
