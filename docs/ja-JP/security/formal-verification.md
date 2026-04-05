---
permalink: /security/formal-verification/
read_when:
    - 形式的なセキュリティモデルの保証や限界を確認するとき
    - TLA+/TLC セキュリティモデル検証を再現または更新するとき
summary: OpenClaw の最もリスクの高い経路に対する、機械検証されたセキュリティモデル。
title: 形式検証（セキュリティモデル）
x-i18n:
    generated_at: "2026-04-05T12:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# 形式検証（セキュリティモデル）

このページでは、OpenClaw の**形式的なセキュリティモデル**（現時点では TLA+/TLC、必要に応じて今後追加）を追跡します。

> 注: 古いリンクの一部は、以前のプロジェクト名を参照している場合があります。

**目標（北極星）:** 明示的な前提のもとで、OpenClaw が意図した
セキュリティポリシー（認可、セッション分離、ツールのゲーティング、
誤設定に対する安全性）を強制していることについて、機械検証された主張を提供すること。

**これが何であるか（現時点）:** 実行可能で、攻撃者主導の**セキュリティ回帰スイート**:

- 各主張には、有限状態空間に対する実行可能なモデル検査があります。
- 多くの主張には、現実的なバグ分類に対する反例トレースを生成する、対になる**ネガティブモデル**があります。

**これがまだ何ではないか:** 「OpenClaw はあらゆる点で安全である」という証明でも、完全な TypeScript 実装が正しいという証明でもありません。

## モデルの所在

モデルは別のリポジトリで管理されています: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要な注意点

- これらは完全な TypeScript 実装ではなく、**モデル**です。モデルとコードの乖離が起こる可能性があります。
- 結果は TLC が探索した状態空間に制約されます。「グリーン」であっても、モデル化された前提と境界を超えた安全性を意味するわけではありません。
- 一部の主張は、明示的な環境前提（たとえば、正しいデプロイや正しい設定入力）に依存しています。

## 結果の再現

現時点では、モデルリポジトリをローカルにクローンし、TLC を実行することで結果を再現します（詳細は下記）。将来の反復では、次のような提供も考えられます。

- 公開アーティファクト（反例トレース、実行ログ）付きの CI 実行モデル
- 小規模で境界付きの検査向けに、ホストされた「このモデルを実行する」ワークフロー

はじめに:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ が必要です（TLC は JVM 上で動作します）。
# このリポジトリには固定版の `tla2tools.jar`（TLA+ ツール）が含まれており、`bin/tlc` と Make ターゲットが提供されています。

make <target>
```

### Gateway の公開範囲と open gateway の誤設定

**主張:** 認証なしで loopback を超えてバインドすると、リモート侵害が可能になる、または公開範囲が増大する可能性があります。トークン/パスワードは未認証の攻撃者を防ぎます（モデルの前提に従う）。

- グリーン実行:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- レッド（期待される結果）:
  - `make gateway-exposure-v2-negative`

あわせて参照: モデルリポジトリ内の `docs/gateway-exposure-matrix.md`。

### ノード exec パイプライン（最も高リスクな機能）

**主張:** `exec host=node` には、(a) node コマンド許可リストと宣言済みコマンド、(b) 設定されている場合はライブ承認、が必要です。承認は再送を防ぐためにトークン化されます（モデル内）。

- グリーン実行:
  - `make nodes-pipeline`
  - `make approvals-token`
- レッド（期待される結果）:
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### ペアリングストア（DM ゲーティング）

**主張:** ペアリングリクエストは TTL と保留中リクエスト上限を尊重します。

- グリーン実行:
  - `make pairing`
  - `make pairing-cap`
- レッド（期待される結果）:
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress ゲーティング（メンション + 制御コマンドのバイパス）

**主張:** メンション必須のグループコンテキストでは、未認可の「制御コマンド」がメンションゲーティングを回避することはできません。

- グリーン:
  - `make ingress-gating`
- レッド（期待される結果）:
  - `make ingress-gating-negative`

### ルーティング/セッションキー分離

**主張:** 異なる相手からの DM は、明示的にリンクまたは設定されていない限り、同じセッションに統合されません。

- グリーン:
  - `make routing-isolation`
- レッド（期待される結果）:
  - `make routing-isolation-negative`

## v1++: 追加の境界付きモデル（並行性、リトライ、トレースの正確性）

これらは、実際の障害モード（非アトミック更新、リトライ、メッセージのファンアウト）に関する忠実度を高める後続モデルです。

### ペアリングストアの並行性 / 冪等性

**主張:** ペアリングストアは、インターリービング下でも `MaxPending` と冪等性を強制するべきです（つまり、「確認してから書き込む」はアトミックまたはロック付きでなければならず、更新で重複が作られてはなりません）。

意味すること:

- 並行リクエスト下でも、チャネルに対して `MaxPending` を超えることはできません。
- 同じ `(channel, sender)` に対する繰り返しのリクエスト/更新で、重複した有効な保留行が作られてはなりません。

- グリーン実行:
  - `make pairing-race`（アトミック/ロック付きの上限検査）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- レッド（期待される結果）:
  - `make pairing-race-negative`（非アトミックな begin/commit 上限レース）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress トレース相関 / 冪等性

**主張:** 取り込みはファンアウトをまたいでトレース相関を保持し、プロバイダーのリトライ下でも冪等であるべきです。

意味すること:

- 1 つの外部イベントが複数の内部メッセージになるとき、すべての部分が同じトレース/イベント識別子を保持します。
- リトライによって二重処理は発生しません。
- プロバイダーのイベント ID が欠けている場合、重複排除は安全なキー（たとえばトレース ID）にフォールバックし、別個のイベントを誤って落とさないようにします。

- グリーン:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- レッド（期待される結果）:
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### ルーティング dmScope 優先順位 + identityLinks

**主張:** ルーティングは、デフォルトで DM セッションを分離したまま維持し、明示的に設定されている場合にのみセッションを統合しなければなりません（チャネル優先順位 + identity links）。

意味すること:

- チャネル固有の dmScope 上書きは、グローバルデフォルトより優先されなければなりません。
- identityLinks は、明示的にリンクされたグループ内でのみ統合し、無関係な相手同士では統合してはなりません。

- グリーン:
  - `make routing-precedence`
  - `make routing-identitylinks`
- レッド（期待される結果）:
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
