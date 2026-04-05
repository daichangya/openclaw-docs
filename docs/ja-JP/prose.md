---
read_when:
    - '`.prose` ワークフローを実行または作成したい場合'
    - OpenProse plugin を有効にしたい場合
    - 状態保存を理解する必要がある場合
summary: 'OpenProse: OpenClaw における `.prose` ワークフロー、スラッシュコマンド、状態管理'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T12:53:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse は、AI セッションをオーケストレーションするための、移植可能で Markdown first のワークフローフォーマットです。OpenClaw では、OpenProse skill pack と `/prose` スラッシュコマンドをインストールする plugin として提供されます。プログラムは `.prose` ファイルに記述され、明示的な制御フローで複数の sub-agent を起動できます。

公式サイト: [https://www.prose.md](https://www.prose.md)

## できること

- 明示的な並列性を伴うマルチエージェントの調査 + 統合。
- 再現可能で承認に安全なワークフロー（コードレビュー、インシデントトリアージ、コンテンツパイプライン）。
- 対応する agent runtime 間で実行できる再利用可能な `.prose` プログラム。

## インストール + 有効化

bundled plugin はデフォルトで無効です。OpenProse を有効にします:

```bash
openclaw plugins enable open-prose
```

plugin を有効にした後、Gateway を再起動してください。

開発 / ローカル checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

関連ドキュメント: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## スラッシュコマンド

OpenProse は、ユーザーが呼び出せる skill コマンドとして `/prose` を登録します。これは OpenProse VM 命令にルーティングされ、内部で OpenClaw tools を使用します。

一般的なコマンド:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 例: シンプルな `.prose` ファイル

```prose
# 2 つの agent を並列実行する調査 + 統合。

input topic: "何を調査すべきですか？"

agent researcher:
  model: sonnet
  prompt: "徹底的に調査し、出典を示してください。"

agent writer:
  model: opus
  prompt: "簡潔な要約を書いてください。"

parallel:
  findings = session: researcher
    prompt: "「{topic}」を調査してください。"
  draft = session: writer
    prompt: "「{topic}」を要約してください。"

session "調査結果と草案を統合して最終回答を作成してください。"
context: { findings, draft }
```

## ファイルの場所

OpenProse は、workspace 内の `.prose/` 配下に状態を保持します:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

ユーザーレベルの永続 agent は次の場所にあります:

```
~/.prose/agents/
```

## 状態モード

OpenProse は複数の状態バックエンドをサポートします:

- **filesystem**（デフォルト）: `.prose/runs/...`
- **in-context**: 小規模なプログラム向けの一時的な方式
- **sqlite**（実験的）: `sqlite3` バイナリが必要
- **postgres**（実験的）: `psql` と接続文字列が必要

注意:

- sqlite / postgres はオプトインで、実験的です。
- postgres 認証情報は subagent ログに流れ込みます。専用で最小権限の DB を使用してください。

## リモートプログラム

`/prose run <handle/slug>` は `https://p.prose.md/<handle>/<slug>` に解決されます。
直接 URL はそのまま取得されます。これは `web_fetch` tool（または POST の場合は `exec`）を使用します。

## OpenClaw runtime への対応付け

OpenProse プログラムは OpenClaw のプリミティブに対応付けられます:

| OpenProse concept         | OpenClaw tool    |
| ------------------------- | ---------------- |
| セッション起動 / Task tool | `sessions_spawn` |
| ファイル読み書き           | `read` / `write` |
| Web 取得                 | `web_fetch`      |

tool allowlist がこれらの tools をブロックしている場合、OpenProse プログラムは失敗します。[Skills config](/tools/skills-config) を参照してください。

## セキュリティ + 承認

`.prose` ファイルはコードとして扱ってください。実行前にレビューしてください。副作用を制御するには、OpenClaw の tool allowlist と承認ゲートを使用してください。

決定的で承認ゲート付きのワークフローについては、[Lobster](/tools/lobster) と比較してください。
