---
read_when:
    - デフォルトのメモリバックエンドを理解したい場合
    - 埋め込みプロバイダーやハイブリッド検索を設定したい場合
summary: キーワード、ベクトル、ハイブリッド検索を備えた、デフォルトの SQLite ベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-04-25T13:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

組み込みエンジンはデフォルトのメモリバックエンドです。メモリインデックスをエージェントごとの SQLite データベースに保存し、開始に追加の依存関係は不要です。

## 提供される機能

- **キーワード検索**: FTS5 全文インデックス（BM25 スコアリング）経由。
- **ベクトル検索**: 対応する任意のプロバイダーの埋め込み経由。
- **ハイブリッド検索**: 両方を組み合わせて最適な結果を得ます。
- **CJK サポート**: 中国語、日本語、韓国語向けの trigram トークナイゼーション経由。
- **sqlite-vec 高速化**: データベース内ベクトルクエリ用（オプション）。

## はじめに

OpenAI、Gemini、Voyage、または Mistral の API キーがある場合、組み込みエンジンはそれを自動検出してベクトル検索を有効にします。設定は不要です。

明示的にプロバイダーを設定するには:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

埋め込みプロバイダーがない場合、キーワード検索のみ利用できます。

組み込みのローカル埋め込みプロバイダーを強制するには、オプションの
`node-llama-cpp` ランタイムパッケージを OpenClaw の隣にインストールし、その後 `local.modelPath`
を GGUF ファイルに向けてください:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 対応する埋め込みプロバイダー

| Provider | ID | 自動検出 | 注記 |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI | `openai` | はい | デフォルト: `text-embedding-3-small` |
| Gemini | `gemini` | はい | マルチモーダル（画像 + 音声）対応 |
| Voyage | `voyage` | はい | |
| Mistral | `mistral` | はい | |
| Ollama | `ollama` | いいえ | ローカル、明示設定が必要 |
| Local | `local` | はい（最初） | オプションの `node-llama-cpp` ランタイム |

自動検出は、表示順で API キーを解決できる最初のプロバイダーを選びます。上書きするには `memorySearch.provider` を設定してください。

## インデックスの仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（約400トークン、80トークンのオーバーラップ）に分割してインデックス化し、エージェントごとの SQLite データベースに保存します。

- **インデックス場所:** `~/.openclaw/memory/<agentId>.sqlite`
- **ファイル監視:** メモリファイルの変更は、debounce 付き再インデックス（1.5秒）をトリガーします。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、またはチャンク化設定が変わると、インデックス全体が自動的に再構築されます。
- **必要時の再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使って、ワークスペース外の Markdown ファイルもインデックス化できます。詳しくは
[configuration reference](/ja-JP/reference/memory-config#additional-memory-paths) を参照してください。
</Info>

## 使うべきタイミング

組み込みエンジンは、ほとんどのユーザーにとって適切な選択です:

- 追加の依存関係なしですぐに動作します。
- キーワード検索とベクトル検索をどちらも適切に処理します。
- すべての埋め込みプロバイダーをサポートします。
- ハイブリッド検索は、両方の検索アプローチの長所を組み合わせます。

再ランキング、クエリ展開が必要な場合や、ワークスペース外のディレクトリをインデックス化したい場合は、[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動的なユーザーモデリングを伴うクロスセッションメモリが必要な場合は、[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認してから、次を実行してください:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロン CLI コマンドと Gateway は、どちらも同じ `local` プロバイダー ID を使用します。プロバイダーが `auto` に設定されている場合、ローカル埋め込みは `memorySearch.local.modelPath` が既存のローカルファイルを指しているときにのみ最初に考慮されます。

**結果が古いですか？** `openclaw memory index --force` を実行して再構築してください。まれなエッジケースでは、ウォッチャーが変更を見逃すことがあります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にインプロセスのコサイン類似度にフォールバックします。具体的な読み込みエラーはログを確認してください。

## 設定

埋め込みプロバイダー設定、ハイブリッド検索の調整（重み、MMR、時間減衰）、バッチインデックス、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての設定項目については、
[Memory configuration reference](/ja-JP/reference/memory-config) を参照してください。

## 関連

- [Memory overview](/ja-JP/concepts/memory)
- [Memory search](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)
