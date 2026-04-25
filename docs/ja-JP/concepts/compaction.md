---
read_when:
    - 自動Compactionと`/compact`を理解したい場合
    - コンテキスト上限に達する長いセッションをデバッグしている場合
summary: OpenClawがモデルの制限内に収まるよう長い会話を要約する仕組み
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:45:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

すべてのモデルにはコンテキストウィンドウがあります。これは、処理できるトークン数の最大値です。
会話がその上限に近づくと、OpenClawは古いメッセージを要約して
チャットを継続できるように**Compaction**します。

## 仕組み

1. 古い会話ターンはコンパクトなエントリに要約されます。
2. その要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClawが履歴をCompactionチャンクに分割するときは、assistantのツール
呼び出しと対応する`toolResult`エントリが対になるように保持します。分割位置が
ツールブロックの途中に来た場合、OpenClawは境界を移動してそのペアを一緒に保ち、
現在の未要約の末尾を保持します。

完全な会話履歴はディスク上に残ります。Compactionが変更するのは、
次のターンでモデルが見る内容だけです。

## 自動Compaction

自動Compactionはデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、
またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（この場合、
OpenClawはCompactionして再試行します）。典型的なオーバーフローのシグネチャには、
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`があります。

<Info>
Compactionの前に、OpenClawは重要なメモを[memory](/ja-JP/concepts/memory)ファイルに保存するよう
自動的にエージェントへ通知します。これによりコンテキスト損失を防ぎます。
</Info>

Compactionの挙動（モード、対象トークン数など）を設定するには、`openclaw.json`の`agents.defaults.compaction`設定を使用してください。
Compaction要約では、デフォルトで不透明な識別子が保持されます（`identifierPolicy: "strict"`）。これは`identifierPolicy: "off"`で上書きするか、`identifierPolicy: "custom"`と`identifierInstructions`でカスタムテキストを指定できます。

必要に応じて、`agents.defaults.compaction.model`でCompaction要約用に別のモデルを指定することもできます。これは、プライマリモデルがローカルモデルや小型モデルで、より高性能なモデルでCompaction要約を生成したい場合に便利です。上書きには任意の`provider/model-id`文字列を指定できます。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

これはローカルモデルでも機能します。たとえば、要約専用の2つ目のOllamaモデルや、Compaction専用にファインチューニングしたモデルなどです。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

未設定の場合、Compactionはエージェントのプライマリモデルを使用します。

## プラガブルなCompactionプロバイダー

Pluginは、plugin APIの`registerCompactionProvider()`を通じてカスタムCompactionプロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClawは組み込みのLLMパイプラインではなく、そのプロバイダーに要約処理を委譲します。

登録済みプロバイダーを使用するには、設定でプロバイダーidを指定します。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

`provider`を設定すると、自動的に`mode: "safeguard"`が強制されます。プロバイダーは組み込み経路と同じCompaction指示および識別子保持ポリシーを受け取り、OpenClawはプロバイダー出力後も最近のターンおよび分割ターンのサフィックスコンテキストを保持します。プロバイダーが失敗した場合、または空の結果を返した場合、OpenClawは組み込みのLLM要約にフォールバックします。

## 自動Compaction（デフォルトで有効）

セッションがモデルのコンテキストウィンドウに近づくか超過すると、OpenClawは自動Compactionをトリガーし、コンパクト化されたコンテキストを使って元のリクエストを再試行する場合があります。

表示される内容:

- verboseモードで`🧹 Auto-compaction complete`
- `/status`に`🧹 Compactions: <count>`を表示

Compactionの前に、OpenClawは耐久性のあるメモをディスクへ保存するため、
サイレントな**memory flush**ターンを実行する場合があります。詳細と設定については
[Memory](/ja-JP/concepts/memory)を参照してください。

## 手動Compaction

任意のチャットで`/compact`と入力すると、Compactionを強制実行できます。要約を
誘導するには指示を追加してください。

```
/compact API設計の判断に焦点を当てる
```

`agents.defaults.compaction.keepRecentTokens`が設定されている場合、手動Compactionは
そのPiカットポイントを尊重し、再構築されたコンテキストに最近の末尾を保持します。
明示的な保持予算がない場合、手動Compactionはハードチェックポイントとして動作し、
新しい要約のみから続行します。

## 別のモデルを使う

デフォルトでは、Compactionはエージェントのプライマリモデルを使用します。より良い要約のために、
より高性能なモデルを使用できます。

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction通知

デフォルトでは、Compactionは通知なしで実行されます。Compactionの開始時と完了時に
短い通知を表示するには、`notifyUser`を有効にします。

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

有効にすると、各Compaction実行の前後に短いステータスメッセージがユーザーへ表示されます
（たとえば「Compacting context...」や「Compaction complete」）。

## Compactionとpruningの違い

|                  | Compaction                    | pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **何をするか** | 古い会話を要約する | 古いツール結果を削減する           |
| **保存されるか**       | はい（セッショントランスクリプト内）   | いいえ（メモリ内のみ、リクエストごと） |
| **範囲**        | 会話全体           | ツール結果のみ                |

[Session pruning](/ja-JP/concepts/session-pruning)は、
要約せずにツール出力を削減する、より軽量な補完機能です。

## トラブルシューティング

**Compactionの頻度が高すぎる場合:** モデルのコンテキストウィンドウが小さいか、
ツール出力が大きい可能性があります。
[session pruning](/ja-JP/concepts/session-pruning)を有効にしてみてください。

**Compaction後にコンテキストが古く感じる場合:** `/compact Focus on <topic>`を使って
要約を誘導するか、メモが残るように[memory flush](/ja-JP/concepts/memory)を
有効にしてください。

**まっさらな状態が必要な場合:** `/new`でCompactionせずに新しいセッションを開始します。

高度な設定（予約トークン、識別子保持、カスタム
コンテキストエンジン、OpenAIサーバー側Compaction）については、
[Session Management Deep Dive](/ja-JP/reference/session-management-compaction)を参照してください。

## 関連

- [Session](/ja-JP/concepts/session) — セッション管理とライフサイクル
- [Session Pruning](/ja-JP/concepts/session-pruning) — ツール結果の削減
- [Context](/ja-JP/concepts/context) — エージェントターン用コンテキストの構築方法
- [Hooks](/ja-JP/automation/hooks) — Compactionライフサイクルフック（before_compaction、after_compaction）
