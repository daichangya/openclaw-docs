---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: 「エージェントごとの sandbox とツール制限、優先順位、および例」
title: マルチエージェントの sandbox とツール
x-i18n:
    generated_at: "2026-04-25T14:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# マルチエージェントの Sandbox とツール設定

マルチエージェント構成では、各エージェントがグローバルの sandbox とツールポリシーを上書きできます。このページでは、エージェントごとの設定、優先順位ルール、例を扱います。

- **Sandbox バックエンドとモード**: [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- **ブロックされたツールのデバッグ**: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) と `openclaw sandbox explain` を参照してください。
- **昇格 exec**: [Elevated Mode](/ja-JP/tools/elevated) を参照してください。

認証はエージェントごとです。各エージェントは、自身の `agentDir` 認証ストアである
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` を読み込みます。
認証情報は**エージェント間で共有されません**。`agentDir` を複数エージェントで再利用しないでください。
認証情報を共有したい場合は、`auth-profiles.json` を他のエージェントの `agentDir` にコピーしてください。

---

## 設定例

### 例 1: Personal + 制限付き Family エージェント

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

- `main` エージェント: ホスト上で動作、全ツールにアクセス可能
- `family` エージェント: Docker 内で動作（エージェントごとに 1 コンテナ）、`read` ツールのみ

---

### 例 2: 共有 Sandbox を使う Work エージェント

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

### 例 2b: グローバル coding プロファイル + messaging 専用エージェント

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
- `support` エージェントは messaging 専用（+ Slack ツール）

---

### 例 3: エージェントごとに異なる Sandbox モード

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
          "mode": "off" // 上書き: main は sandbox 化しない
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // 上書き: public は常に sandbox 化
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

グローバル（`agents.defaults.*`）とエージェント固有（`agents.list[].*`）の両方の設定が存在する場合:

### Sandbox 設定

エージェント固有の設定がグローバルを上書きします。

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注記:**

- `agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントについて `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きします（sandbox の scope が `"shared"` に解決される場合は無視されます）。

### ツール制限

フィルタリング順序は次のとおりです。

1. **ツールプロファイル**（`tools.profile` または `agents.list[].tools.profile`）
2. **Provider ツールプロファイル**（`tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`）
3. **グローバルツールポリシー**（`tools.allow` / `tools.deny`）
4. **Provider ツールポリシー**（`tools.byProvider[provider].allow/deny`）
5. **エージェント固有ツールポリシー**（`agents.list[].tools.allow/deny`）
6. **エージェント Provider ポリシー**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **Sandbox ツールポリシー**（`tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`）
8. **サブエージェントツールポリシー**（`tools.subagents.tools`、該当する場合）

各レベルはツールをさらに制限できますが、より前のレベルで拒否されたツールを戻すことはできません。
`agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントでは `tools.sandbox.tools` を置き換えます。
`agents.list[].tools.profile` が設定されている場合、そのエージェントでは `tools.profile` を上書きします。
Provider ツールキーでは、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも使えます。

このチェーン内のいずれかの明示的 allowlist により、実行時に呼び出し可能ツールが 1 つも残らない場合、OpenClaw はプロンプトをモデルへ送信する前に停止します。これは意図された動作です。
`agents.list[].tools.allow: ["query_db"]` のように、存在しないツールを指定したエージェントは、`query_db` を登録するプラグインが有効になるまで、テキスト専用エージェントとして続行せず、明示的に失敗するべきだからです。

ツールポリシーは、複数ツールに展開される `group:*` 省略記法をサポートします。完全な一覧については [Tool groups](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) を参照してください。

エージェントごとの昇格上書き（`agents.list[].tools.elevated`）は、特定のエージェントの昇格 exec をさらに制限できます。詳細は [Elevated Mode](/ja-JP/tools/elevated) を参照してください。

---

## 単一エージェントからの移行

**変更前（単一エージェント）:**

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

**変更後（異なるプロファイルを持つマルチエージェント）:**

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

レガシーの `agent.*` 設定は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を優先してください。

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

このプロファイルの `sessions_history` は、引き続き生の transcript ダンプではなく、制限付きでサニタイズされた recall ビューを返します。assistant recall は、thinking タグ、`<relevant-memories>` スキャフォールディング、プレーンテキストのツール呼び出し XML ペイロード
（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
格下げされたツール呼び出しスキャフォールディング、漏れ出した ASCII/全角のモデル制御トークン、不正な MiniMax ツール呼び出し XML を、redaction/truncation の前に取り除きます。

---

## よくある落とし穴: `non-main`

`agents.defaults.sandbox.mode: "non-main"` は、エージェント id ではなく `session.mainKey`（デフォルト `"main"`）に基づきます。
グループ/チャネルセッションは常に独自のキーを持つため、
non-main と見なされ、sandbox 化されます。あるエージェントを絶対に sandbox 化したくない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。

---

## テスト

マルチエージェントの sandbox とツールを設定した後:

1. **エージェント解決を確認する:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox コンテナを確認する:**

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

### `mode: "all"` なのにエージェントが sandbox 化されない

- 上書きしているグローバルの `agents.defaults.sandbox.mode` がないか確認してください
- エージェント固有設定が優先されるため、`agents.list[].sandbox.mode: "all"` を設定してください

### deny リストがあるのにツールがまだ利用できる

- ツールフィルタリング順序を確認してください: グローバル → エージェント → sandbox → サブエージェント
- 各レベルはさらに制限できるだけで、戻すことはできません
- ログで確認してください: `[tools] filtering tools for agent:${agentId}`

### コンテナがエージェントごとに分離されない

- エージェント固有の sandbox 設定で `scope: "agent"` を設定してください
- デフォルトは `"session"` で、セッションごとに 1 コンテナを作成します

---

## 関連

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全な sandbox リファレンス（モード、scope、バックエンド、イメージ）
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [Elevated Mode](/ja-JP/tools/elevated)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [Sandbox 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [セッション管理](/ja-JP/concepts/session)
