---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
summary: CI ジョブグラフ、スコープゲート、およびローカルコマンドの同等物
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-21T19:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# CI パイプライン

CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。スマートなスコープ判定を使って、変更が無関係な領域に限られる場合は高コストなジョブをスキップします。

## ジョブ概要

| ジョブ                             | 目的                                                                                                 | 実行されるタイミング                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `preflight`                        | docs-only の変更、変更スコープ、変更された extension を検出し、CI マニフェストを構築する             | 下書きではないプッシュと PR で常に実行       |
| `security-scm-fast`                | `zizmor` による秘密鍵検出とワークフロー監査                                                          | 下書きではないプッシュと PR で常に実行       |
| `security-dependency-audit`        | npm advisory に対する、依存関係なしの本番 lockfile 監査                                              | 下書きではないプッシュと PR で常に実行       |
| `security-fast`                    | 高速なセキュリティジョブ向けの必須集約ジョブ                                                         | 下書きではないプッシュと PR で常に実行       |
| `build-artifacts`                  | `dist/` と Control UI を一度だけビルドし、後続ジョブ向けに再利用可能なアーティファクトをアップロード | Node 関連の変更                              |
| `checks-fast-core`                 | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                               | Node 関連の変更                              |
| `checks-fast-contracts-channels`   | 安定した集約チェック結果を持つ、シャーディングされた channel contract チェック                       | Node 関連の変更                              |
| `checks-node-extensions`           | extension スイート全体にわたる bundled-plugin の完全なテストシャード                                 | Node 関連の変更                              |
| `checks-node-core-test`            | channel、bundled、contract、extension の各レーンを除く、コア Node テストシャード                     | Node 関連の変更                              |
| `extension-fast`                   | 変更された bundled plugins のみを対象にした集中的なテスト                                            | extension の変更が検出されたとき             |
| `check`                            | シャーディングされた主要なローカルゲート相当: 本番 types、lint、guards、test types、および strict smoke | Node 関連の変更                              |
| `check-additional`                 | architecture、boundary、extension-surface guards、package-boundary、および gateway-watch のシャード  | Node 関連の変更                              |
| `build-smoke`                      | ビルド済み CLI のスモークテストと起動時メモリのスモークテスト                                        | Node 関連の変更                              |
| `checks`                           | 残りの Linux Node レーン: channel テストと、push 時のみの Node 22 互換性                             | Node 関連の変更                              |
| `check-docs`                       | docs のフォーマット、lint、およびリンク切れチェック                                                  | Docs が変更されたとき                        |
| `skills-python`                    | Python ベースの Skills 向けの Ruff + pytest                                                          | Python skill 関連の変更                      |
| `checks-windows`                   | Windows 固有のテストレーン                                                                            | Windows 関連の変更                           |
| `macos-node`                       | 共有ビルドアーティファクトを使う macOS TypeScript テストレーン                                       | macOS 関連の変更                             |
| `macos-swift`                      | macOS アプリ向けの Swift lint、ビルド、およびテスト                                                  | macOS 関連の変更                             |
| `android`                          | Android のビルドおよびテストマトリクス                                                               | Android 関連の変更                           |

## フェイルファスト順序

ジョブは、安価なチェックが高コストなジョブより先に失敗するように順序付けられています。

1. `preflight` が、そもそもどのレーンを存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは独立したジョブではなく、このジョブ内のステップです。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、および `skills-python` は、より重い artifact ジョブやプラットフォームマトリクスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが分岐します: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、および `android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。
別個の `install-smoke` ワークフローも、自身の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは、より狭い changed-smoke シグナルから `run_install_smoke` を計算するため、Docker/install smoke は install、packaging、および container 関連の変更に対してのみ実行されます。

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広い CI プラットフォームスコープよりも architecture boundary に対して厳格です: core production の変更は core prod の typecheck と core tests を実行し、core test のみの変更は core test の typecheck/tests のみを実行し、extension production の変更は extension prod の typecheck と extension tests を実行し、extension test のみの変更は extension test の typecheck/tests のみを実行します。公開 Plugin SDK または plugin-contract の変更は、extensions がそれらの core contract に依存しているため、extension validation まで拡張されます。不明な root/config の変更は、安全側に倒してすべてのレーンになります。

プッシュ時には、`checks` マトリクスに push 時のみの `compat-node22` レーンが追加されます。プルリクエストではこのレーンはスキップされ、マトリクスは通常の test/channel レーンに集中したままになります。

最も遅い Node テスト群は、各ジョブを小さく保つために include-file シャードに分割されています: channel contracts は registry と core のカバレッジをそれぞれ 8 個の重み付きシャードに分割し、auto-reply の reply command テストは 4 個の include-pattern シャードに分割され、その他の大規模な auto-reply の reply prefix グループはそれぞれ 2 個のシャードに分割されます。`check-additional` も、package-boundary の compile/canary 作業を、ランタイムトポロジーの gateway/architecture 作業から分離しています。

同じ PR または `main` ref に対して新しいプッシュが届くと、GitHub は古いジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、これを CI ノイズとして扱ってください。集約シャードチェックは、このキャンセルのケースを明示的に示すため、テスト失敗と区別しやすくなっています。

## ランナー

| ランナー                           | ジョブ                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`    | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux チェック、docs チェック、Python skills、`android` |
| `blacksmith-32vcpu-windows-2025`   | `checks-windows`                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest`   | `openclaw/openclaw` 上の `macos-node`、`macos-swift`。fork では `macos-latest` にフォールバック                                                            |

## ローカルでの同等コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカルの changed-lane 分類器を確認
pnpm check:changed   # スマートなローカルゲート: boundary レーンごとの変更済み typecheck/lint/tests
pnpm check          # 高速ローカルゲート: 本番 tsgo + シャーディングされた lint + 並列高速ガード
pnpm check:test-types
pnpm check:timed    # 同じゲートを各ステージの所要時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest テスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs の format + lint + リンク切れ
pnpm build          # CI の artifact/build-smoke レーンが重要な場合に dist をビルド
```
