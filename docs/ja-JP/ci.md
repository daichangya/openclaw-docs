---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要がある場合
    - 失敗しているGitHub Actionsチェックをデバッグしている場合
summary: CIジョブグラフ、スコープゲート、ローカルコマンドの対応関係
title: CI Pipeline
x-i18n:
    generated_at: "2026-04-05T12:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# CI Pipeline

CIは`main`へのすべてのpushと、すべてのpull requestで実行されます。スマートなスコープ判定を使って、変更が無関係な領域だけの場合は高コストなジョブをスキップします。

## ジョブ概要

| Job                      | 目的                                                                                 | 実行されるタイミング                      |
| ------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| `preflight`              | docsのみの変更、変更されたスコープ、変更されたextensionsを検出し、CI manifestを構築 | draftではないpushとPRで常に実行          |
| `security-fast`          | 秘密鍵検出、`zizmor`によるworkflow監査、本番依存関係の監査                          | draftではないpushとPRで常に実行          |
| `build-artifacts`        | `dist/`とControl UIを一度ビルドし、下流ジョブ向けの再利用可能artifactsをアップロード | Node関連の変更                           |
| `checks-fast-core`       | bundled/plugin-contract/protocolチェックなどの高速Linux正当性レーン                  | Node関連の変更                           |
| `checks-fast-extensions` | `checks-fast-extensions-shard`完了後にextension shardレーンを集約                    | Node関連の変更                           |
| `extension-fast`         | 変更されたbundled pluginsのみを対象にした集中テスト                                 | extensionの変更が検出された場合          |
| `check`                  | CIにおけるメインのローカルgate: `pnpm check` と `pnpm build:strict-smoke`           | Node関連の変更                           |
| `check-additional`       | アーキテクチャおよび境界ガードと、gateway watch回帰ハーネス                          | Node関連の変更                           |
| `build-smoke`            | ビルド済みCLIのスモークテストと起動時メモリスモーク                                 | Node関連の変更                           |
| `checks`                 | より重いLinux Nodeレーン: フルテスト、channelテスト、およびpush専用のNode 22互換性 | Node関連の変更                           |
| `check-docs`             | docsのフォーマット、lint、broken-linkチェック                                        | docsが変更された場合                     |
| `skills-python`          | PythonベースのSkills向けRuff + pytest                                               | Python-skill関連の変更                   |
| `checks-windows`         | Windows固有のテストレーン                                                            | Windows関連の変更                        |
| `macos-node`             | 共有のビルド済みartifactsを使用するmacOS TypeScriptテストレーン                      | macOS関連の変更                          |
| `macos-swift`            | macOS app向けのSwift lint、build、tests                                              | macOS関連の変更                          |
| `android`                | Androidのbuildおよびtest matrix                                                      | Android関連の変更                        |

## Fail-Fastの順序

ジョブは、高コストなものが走る前に低コストなチェックが失敗するように順序付けされています。

1. `preflight`が、どのレーンをそもそも存在させるかを決定します。`docs-scope`と`changed-scope`のロジックは、このジョブ内のstepであり、独立したジョブではありません。
2. `security-fast`、`check`、`check-additional`、`check-docs`、`skills-python`は、より重いartifactおよびplatform matrixジョブを待たずに素早く失敗します。
3. `build-artifacts`は高速Linuxレーンと並行して実行されるため、下流の利用側は共有buildの準備ができ次第開始できます。
4. その後、より重いplatformおよびruntimeレーンが分岐します: `checks-fast-core`、`checks-fast-extensions`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは`scripts/ci-changed-scope.mjs`にあり、`src/scripts/ci-changed-scope.test.ts`のunit testsでカバーされています。
別の`install-smoke` workflowは、独自の`preflight`ジョブを通じて同じスコープスクリプトを再利用します。これは、より狭いchanged-smokeシグナルから`run_install_smoke`を計算するため、Docker/install smokeはinstall、packaging、container関連の変更に対してのみ実行されます。

pushでは、`checks` matrixにpush専用の`compat-node22`レーンが追加されます。pull requestではこのレーンはスキップされ、matrixは通常のtest/channelレーンに集中したままになります。

## Runners

| Runner                           | Jobs                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`build-artifacts`、Linux checks、docs checks、Python skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                   |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                        |

## ローカルでの対応コマンド

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # CI artifact/build-smokeレーンが関係する場合にdistをbuild
```
