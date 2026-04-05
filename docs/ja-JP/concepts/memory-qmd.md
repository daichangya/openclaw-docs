---
read_when:
    - memoryバックエンドとしてQMDを設定したい
    - 再ランキングや追加のインデックス対象パスなどの高度なmemory機能を使いたい
summary: BM25、ベクトル、再ランキング、クエリ拡張を備えたローカルファーストの検索サイドカー
title: QMD Memory Engine
x-i18n:
    generated_at: "2026-04-05T12:41:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Memory Engine

[QMD](https://github.com/tobi/qmd) はOpenClawと
並行して動作するローカルファーストの検索サイドカーです。単一の
バイナリでBM25、ベクトル検索、再ランキングを組み合わせ、ワークスペースの
memoryファイルを超えたコンテンツもインデックスできます。

## 組み込み機能に対して追加されるもの

- **再ランキングとクエリ拡張** により、より高い再現率を実現します。
- **追加ディレクトリをインデックス** -- プロジェクトのドキュメント、チームのメモ、ディスク上のあらゆるもの。
- **セッショントランスクリプトをインデックス** -- 以前の会話を再想起できます。
- **完全ローカル** -- Bun + node-llama-cpp経由で動作し、GGUFモデルを自動ダウンロードします。
- **自動フォールバック** -- QMDが利用できない場合、OpenClawはシームレスに
  組み込みengineへフォールバックします。

## はじめに

### 前提条件

- QMDをインストール: `bun install -g @tobilu/qmd`
- 拡張を許可するSQLiteビルド（macOSでは `brew install sqlite`）。
- QMDがGatewayの `PATH` 上にある必要があります。
- macOSとLinuxはそのままで動作します。WindowsはWSL2経由でのサポートが最も充実しています。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClawは
`~/.openclaw/agents/<agentId>/qmd/` 配下に自己完結型のQMDホームを作成し、
サイドカーのライフサイクルを自動的に管理します -- コレクション、更新、
埋め込み実行はすべて自動処理されます。

## サイドカーの仕組み

- OpenClawはワークスペースのmemoryファイルと、設定された
  `memory.qmd.paths` からコレクションを作成し、起動時および定期的に
  `qmd update` + `qmd embed` を実行します（デフォルトは5分ごと）。
- 起動時リフレッシュはバックグラウンドで実行されるため、チャット起動はブロックされません。
- 検索では設定された `searchMode` を使用します（デフォルト: `search`。`vsearch` と `query` もサポート）。
  あるモードが失敗した場合、OpenClawは `qmd query` で再試行します。
- QMDが完全に失敗した場合、OpenClawは組み込みのSQLite engineへフォールバックします。

<Info>
最初の検索は遅い場合があります -- QMDは最初の `qmd query` 実行時に、
再ランキングとクエリ拡張のためのGGUFモデル（約2 GB）を自動ダウンロードします。
</Info>

## 追加パスのインデックス

QMDに追加ディレクトリを指定して検索可能にします。

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

追加パスからのスニペットは、検索結果で `qmd/<collection>/<relative-path>` として表示されます。`memory_get` はこの接頭辞を理解し、正しい
コレクションルートから読み取ります。

## セッショントランスクリプトのインデックス

以前の会話を再想起するには、セッションインデックスを有効にします。

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

トランスクリプトは、サニタイズ済みのUser/Assistantターンとして、
`~/.openclaw/agents/<id>/qmd/sessions/` 配下の専用QMDコレクションにエクスポートされます。

## 検索スコープ

デフォルトでは、QMD検索結果はDMセッションでのみ表示されます
（グループやチャンネルでは表示されません）。これを変更するには `memory.qmd.scope` を設定します。

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

スコープによって検索が拒否されると、OpenClawは導出されたchannelと
chat typeを含む警告をログに記録するため、結果が空の原因をデバッグしやすくなります。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには
`Source: <path#line>` フッターが含まれます。フッターを省略しつつ内部的には
引き続きパスをエージェントへ渡したい場合は、`memory.citations = "off"` を設定します。

## 使うべき場面

次のような場合はQMDを選んでください。

- より高品質な結果のために再ランキングが必要。
- ワークスペース外のプロジェクトドキュメントやメモを検索したい。
- 過去のセッション会話を再想起したい。
- APIキー不要の完全ローカル検索が必要。

よりシンプルな構成では、追加の依存関係なしで
[組み込みengine](/concepts/memory-builtin) が有効に機能します。

## トラブルシューティング

**QMDが見つからない？** バイナリがGatewayの `PATH` 上にあることを確認してください。OpenClawが
サービスとして動作している場合は、次のシンボリックリンクを作成してください:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**最初の検索が非常に遅い？** QMDは初回使用時にGGUFモデルをダウンロードします。OpenClawと同じXDGディレクトリを使って
`qmd query "test"` で事前ウォームアップしてください。

**検索がタイムアウトする？** `memory.qmd.limits.timeoutMs` を増やしてください
（デフォルト: 4000ms）。低速なハードウェアでは `120000` に設定してください。

**グループチャットで結果が空？** `memory.qmd.scope` を確認してください -- デフォルトでは
DMセッションのみが許可されています。

**ワークスペースから見える一時repoが `ENAMETOOLONG` や壊れたインデックスの原因になる？**
QMDの走査は現在、OpenClaw組み込みのシンボリックリンクルールではなく、
基盤となるQMDスキャナーの動作に従います。一時的なmonorepoチェックアウトは、
QMDがサイクル安全な走査または明示的な除外制御を提供するまで、
`.tmp/` のような隠しディレクトリ配下、またはインデックス対象QMDルートの外に置いてください。

## 設定

完全な設定項目（`memory.qmd.*`）、検索モード、更新間隔、
スコープルール、その他すべての調整項目については、
[Memory configuration reference](/reference/memory-config)を参照してください。
