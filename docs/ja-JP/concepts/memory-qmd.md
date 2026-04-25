---
read_when:
    - QMD をメモリバックエンドとして設定したい場合
    - リランキングや追加のインデックス対象パスなど、高度なメモリ機能を使いたい場合
summary: BM25、ベクトル、リランキング、クエリ拡張を備えたローカルファーストの検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-04-25T13:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。BM25、ベクトル検索、リランキングを単一バイナリに統合し、workspace の memory ファイルを超えるコンテンツもインデックスできます。

## 組み込み機能に対して追加されるもの

- **リランキングとクエリ拡張** により、再現率を向上。
- **追加ディレクトリをインデックス** -- プロジェクト docs、チームノート、ディスク上の任意のもの。
- **セッショントランスクリプトをインデックス** -- 過去の会話を想起。
- **完全ローカル** -- オプションの node-llama-cpp ランタイムパッケージで動作し、GGUF モデルを自動ダウンロード。
- **自動フォールバック** -- QMD が利用できない場合、OpenClaw はシームレスに組み込みエンジンへフォールバックします。

## はじめに

### 前提条件

- QMD をインストール: `npm install -g @tobilu/qmd` または `bun install -g @tobilu/qmd`
- 拡張を許可する SQLite ビルド（macOS では `brew install sqlite`）。
- QMD が Gateway の `PATH` 上にある必要があります。
- macOS と Linux はそのままで動作します。Windows は WSL2 経由でのサポートが最も良好です。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw は `~/.openclaw/agents/<agentId>/qmd/` 配下に自己完結型の QMD ホームを作成し、サイドカーのライフサイクルを自動管理します -- コレクション、更新、埋め込み実行はすべて自動で処理されます。
現在の QMD コレクションおよび MCP クエリ形式を優先しますが、必要に応じて旧式の `--mask` コレクションフラグや古い MCP tool 名にもフォールバックします。
起動時の整合処理では、同名の古い QMD コレクションが残っている場合でも、古くなった管理対象コレクションを正規パターンへ再作成します。

## サイドカーの動作

- OpenClaw は workspace の memory ファイルと、設定された `memory.qmd.paths` からコレクションを作成し、起動時および定期的に（デフォルトでは 5 分ごと）`qmd update` + `qmd embed` を実行します。
- デフォルトの workspace コレクションは `MEMORY.md` と `memory/` ツリーを追跡します。小文字の `memory.md` はルート memory ファイルとしてはインデックスされません。
- 起動時のリフレッシュはバックグラウンドで実行されるため、チャット起動はブロックされません。
- 検索は設定された `searchMode` を使用します（デフォルト: `search`。`vsearch` と `query` もサポート）。あるモードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- QMD が完全に失敗した場合、OpenClaw は組み込み SQLite エンジンへフォールバックします。

<Info>
最初の検索は遅い場合があります -- QMD は最初の `qmd query` 実行時に、
リランキングとクエリ拡張のための GGUF モデル（約 2 GB）を自動ダウンロードします。
</Info>

## モデル上書き

QMD のモデル環境変数は Gateway プロセスからそのまま渡されるため、新しい OpenClaw config を追加せずにグローバルに QMD を調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、新しいベクトル空間にインデックスを一致させるため、埋め込みを再実行してください。

## 追加パスのインデックス

QMD に追加ディレクトリを指定して検索可能にします。

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

追加パスのスニペットは検索結果で `qmd/<collection>/<relative-path>` として表示されます。`memory_get` はこのプレフィックスを理解し、正しいコレクションルートから読み取ります。

## セッショントランスクリプトのインデックス

過去の会話を想起できるよう、セッションインデックスを有効にします。

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

トランスクリプトは、サニタイズされた User/Assistant ターンとして、`~/.openclaw/agents/<id>/qmd/sessions/` 配下の専用 QMD コレクションにエクスポートされます。

## 検索スコープ

デフォルトでは、QMD の検索結果はダイレクトセッションおよびチャンネルセッションで表示されます（グループを除く）。これを変更するには `memory.qmd.scope` を設定します。

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

scope が検索を拒否した場合、OpenClaw は導出された channel と chat type を含む警告をログに出すため、空結果のデバッグが容易になります。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには
`Source: <path#line>` のフッターが含まれます。フッターを省略しつつ、内部的には引き続きパスをエージェントへ渡すには、`memory.citations = "off"` を設定します。

## 使いどころ

次のような場合は QMD を選んでください。

- より高品質な結果のためにリランキングが必要。
- workspace 外のプロジェクト docs やノートを検索したい。
- 過去のセッション会話を想起したい。
- API キー不要の完全ローカル検索が必要。

より単純なセットアップでは、追加依存なしで [組み込みエンジン](/ja-JP/concepts/memory-builtin) がうまく機能します。

## トラブルシューティング

**QMD が見つからない?** バイナリが Gateway の `PATH` 上にあることを確認してください。OpenClaw がサービスとして動作している場合は、次のようにシンボリックリンクを作成してください:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**最初の検索が非常に遅い?** QMD は初回使用時に GGUF モデルをダウンロードします。OpenClaw が使うのと同じ XDG ディレクトリで `qmd query "test"` を使って事前ウォームアップしてください。

**検索がタイムアウトする?** `memory.qmd.limits.timeoutMs`（デフォルト: 4000ms）を増やしてください。低速なハードウェアでは `120000` に設定してください。

**グループチャットで結果が空?** `memory.qmd.scope` を確認してください -- デフォルトではダイレクトセッションとチャンネルセッションのみ許可されます。

**ルート memory 検索が突然広すぎるようになった?** Gateway を再起動するか、次の起動時整合処理を待ってください。OpenClaw は、同名競合を検出した場合、古くなった管理対象コレクションを正規の `MEMORY.md` および `memory/` パターンへ再作成します。

**workspace から見える一時 repo により `ENAMETOOLONG` やインデックス破損が起きる?**
QMD の走査は現在、OpenClaw 組み込みの symlink ルールではなく、基盤となる QMD スキャナーの動作に従います。QMD がサイクル安全な走査または明示的な除外制御を公開するまでは、一時的な monorepo チェックアウトを `.tmp/` のような隠しディレクトリ配下、またはインデックス対象 QMD ルートの外に置いてください。

## 設定

完全な config サーフェス（`memory.qmd.*`）、検索モード、更新間隔、
scope ルール、そのほかすべてのノブについては、
[Memory configuration reference](/ja-JP/reference/memory-config) を参照してください。

## 関連

- [Memory overview](/ja-JP/concepts/memory)
- [Builtin memory engine](/ja-JP/concepts/memory-builtin)
- [Honcho memory](/ja-JP/concepts/memory-honcho)
