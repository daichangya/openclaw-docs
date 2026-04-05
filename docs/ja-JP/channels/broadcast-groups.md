---
read_when:
    - ブロードキャストグループを設定している
    - WhatsApp での複数エージェントの返信をデバッグしている
status: experimental
summary: WhatsApp メッセージを複数のエージェントにブロードキャストする
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-04-05T12:35:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# ブロードキャストグループ

**ステータス:** 実験的  
**バージョン:** 2026.1.9 で追加

## 概要

ブロードキャストグループを使うと、複数のエージェントが同じメッセージを同時に処理して返信できます。これにより、1 つの電話番号だけを使って、1 つの WhatsApp グループまたは DM 内で連携する専門エージェントチームを作成できます。

現在の対象範囲: **WhatsApp のみ**（web チャネル）。

ブロードキャストグループは、チャネルの許可リストとグループ有効化ルールの後に評価されます。WhatsApp グループでは、これは OpenClaw が通常返信する場合にブロードキャストが発生することを意味します（たとえば、グループ設定に応じてメンション時など）。

## ユースケース

### 1. 専門エージェントチーム

責務が明確で集約された複数のエージェントを配置します。

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

各エージェントは同じメッセージを処理し、それぞれの専門的な観点から応答します。

### 2. 多言語サポート

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. 品質保証ワークフロー

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. タスク自動化

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## 設定

### 基本設定

最上位レベルに `broadcast` セクションを追加します（`bindings` と同じ階層）。キーには WhatsApp のピア ID を指定します。

- グループチャット: グループ JID（例: `120363403215116621@g.us`）
- DM: E.164 電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClaw がこのチャットで返信する場合、3 つのエージェントすべてを実行します。

### 処理戦略

エージェントがメッセージをどう処理するかを制御します。

#### 並列（デフォルト）

すべてのエージェントを同時に処理します。

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 逐次

エージェントを順番に処理します（前の処理が終わるまで次は待機）。

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完全な例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 仕組み

### メッセージフロー

1. **受信メッセージ** が WhatsApp グループに届く
2. **ブロードキャスト確認**: システムがピア ID が `broadcast` にあるか確認する
3. **ブロードキャスト一覧に含まれる場合**:
   - 一覧にあるすべてのエージェントがメッセージを処理する
   - 各エージェントは独自のセッションキーと分離されたコンテキストを持つ
   - エージェントは並列（デフォルト）または逐次で処理される
4. **ブロードキャスト一覧に含まれない場合**:
   - 通常のルーティングが適用される（最初に一致したバインディング）

注: ブロードキャストグループは、チャネルの許可リストやグループ有効化ルール（メンション、コマンドなど）をバイパスしません。変更されるのは、メッセージが処理対象となったときに _どのエージェントを実行するか_ だけです。

### セッション分離

ブロードキャストグループ内の各エージェントは、以下を完全に分離して維持します。

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...` など）
- **会話履歴**（エージェントは他のエージェントのメッセージを見ない）
- **ワークスペース**（設定されていれば個別のサンドボックス）
- **ツールアクセス**（異なる allow/deny リスト）
- **メモリ/コンテキスト**（個別の IDENTITY.md、SOUL.md など）
- **グループコンテキストバッファー**（コンテキスト用に使われる最近のグループメッセージ）はピアごとに共有されるため、トリガー時にはすべてのブロードキャストエージェントが同じコンテキストを見る

これにより、各エージェントに次のような違いを持たせられます。

- 異なる人格
- 異なるツールアクセス（例: 読み取り専用と読み書き可能）
- 異なるモデル（例: opus と sonnet）
- インストールされている異なる Skills

### 例: 分離されたセッション

グループ `120363403215116621@g.us` にエージェント `["alfred", "baerbel"]` がある場合:

**Alfred のコンテキスト:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel のコンテキスト:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## ベストプラクティス

### 1. エージェントの責務を絞る

各エージェントは 1 つの明確な責務で設計します。

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **良い例:** 各エージェントに 1 つの役割がある  
❌ **悪い例:** 汎用的な 1 つの「dev-helper」エージェント

### 2. 説明的な名前を使う

各エージェントが何をするかを明確にします。

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. ツールアクセスを分けて設定する

各エージェントには必要なツールだけを与えます。

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
    }
  }
}
```

### 4. パフォーマンスを監視する

多数のエージェントを使う場合は、次を検討してください。

- 速度のために `"strategy": "parallel"`（デフォルト）を使う
- 1 グループあたりのブロードキャストエージェント数を 5～10 に制限する
- 単純なエージェントにはより高速なモデルを使う

### 5. 障害を適切に扱う

エージェントは独立して失敗します。1 つのエージェントのエラーが他を妨げることはありません。

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## 互換性

### プロバイダー

ブロードキャストグループは現在、次で動作します。

- ✅ WhatsApp（実装済み）
- 🚧 Telegram（予定）
- 🚧 Discord（予定）
- 🚧 Slack（予定）

### ルーティング

ブロードキャストグループは既存のルーティングと併用できます。

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: alfred のみが応答する（通常のルーティング）
- `GROUP_B`: agent1 と agent2 の両方が応答する（ブロードキャスト）

**優先順位:** `broadcast` は `bindings` より優先されます。

## トラブルシューティング

### エージェントが応答しない

**確認事項:**

1. エージェント ID が `agents.list` に存在する
2. ピア ID の形式が正しい（例: `120363403215116621@g.us`）
3. エージェントが deny リストに入っていない

**デバッグ:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 1 つのエージェントしか応答しない

**原因:** ピア ID が `bindings` にはあるが `broadcast` にはない可能性があります。

**対処:** ブロードキャスト設定に追加するか、bindings から削除してください。

### パフォーマンスの問題

**多数のエージェントで遅い場合:**

- グループごとのエージェント数を減らす
- より軽いモデルを使う（opus ではなく sonnet）
- サンドボックスの起動時間を確認する

## 例

### 例 1: コードレビューチーム

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**ユーザー送信:** コードスニペット  
**応答:**

- code-formatter: 「インデントを修正し、型ヒントを追加しました」
- security-scanner: 「⚠️ 12 行目に SQL インジェクションの脆弱性があります」
- test-coverage: 「カバレッジは 45% です。エラーケースのテストが不足しています」
- docs-checker: 「関数 `process_data` の docstring がありません」

### 例 2: 多言語サポート

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API リファレンス

### 設定スキーマ

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### フィールド

- `strategy`（省略可）: エージェントの処理方法
  - `"parallel"`（デフォルト）: すべてのエージェントを同時に処理
  - `"sequential"`: 配列順にエージェントを処理
- `[peerId]`: WhatsApp グループ JID、E.164 番号、またはその他のピア ID
  - 値: メッセージを処理するエージェント ID の配列

## 制限事項

1. **最大エージェント数:** 厳密な上限はありませんが、10 以上のエージェントでは遅くなる場合があります
2. **共有コンテキスト:** エージェントは互いの応答を見ません（仕様です）
3. **メッセージ順序:** 並列応答はどの順番で届くか分かりません
4. **レート制限:** すべてのエージェントが WhatsApp のレート制限の対象になります

## 今後の拡張

予定されている機能:

- [ ] 共有コンテキストモード（エージェントが互いの応答を見る）
- [ ] エージェント連携（エージェント同士でシグナルを送れる）
- [ ] 動的エージェント選択（メッセージ内容に基づいてエージェントを選ぶ）
- [ ] エージェント優先順位（一部のエージェントが他より先に応答する）

## 関連

- [マルチエージェント設定](/tools/multi-agent-sandbox-tools)
- [ルーティング設定](/channels/channel-routing)
- [セッション管理](/concepts/session)
