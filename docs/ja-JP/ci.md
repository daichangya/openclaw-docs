---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要があります
    - 失敗しているGitHub Actionsチェックをデバッグしています
summary: CIジョブグラフ、スコープゲート、および対応するローカルコマンド
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-22T04:21:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# CIパイプライン

CIは`main`へのすべてのpushと、すべてのpull requestで実行されます。関係のない領域だけが変更された場合は高コストなジョブをスキップするよう、スマートなスコープ判定を使用しています。

## ジョブ概要

| ジョブ | 目的 | 実行タイミング |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | docsのみの変更、変更されたスコープ、変更されたbundled pluginを検出し、CIマニフェストを構築する | draftではないpushとPRで常に実行 |
| `security-scm-fast`              | `zizmor`による秘密鍵検出とworkflow監査 | draftではないpushとPRで常に実行 |
| `security-dependency-audit`      | npm advisoryに対する、依存関係不要の本番lockfile監査 | draftではないpushとPRで常に実行 |
| `security-fast`                  | 高速セキュリティジョブ用の必須aggregate | draftではないpushとPRで常に実行 |
| `build-artifacts`                | `dist/`とControl UIを一度ビルドし、下流ジョブ用の再利用可能なartifactをアップロードする | Node関連の変更時 |
| `checks-fast-core`               | bundled/plugin-contract/protocolチェックなどの高速Linux正当性レーン | Node関連の変更時 |
| `checks-fast-contracts-channels` | 安定したaggregateチェック結果を持つ、shard化されたchannel contractチェック | Node関連の変更時 |
| `checks-node-extensions`         | extension suite全体にわたる、bundled pluginの完全なテストshard | Node関連の変更時 |
| `checks-node-core-test`          | channel、bundled、contract、extensionレーンを除く、core Nodeテストshard | Node関連の変更時 |
| `extension-fast`                 | 変更されたbundled pluginだけに対する重点テスト | extensionの変更が検出されたとき |
| `check`                          | shard化された主要なローカルゲート相当: 本番types、lint、guard、test types、strict smoke | Node関連の変更時 |
| `check-additional`               | architecture、boundary、extension-surface guard、package-boundary、gateway-watch shard | Node関連の変更時 |
| `build-smoke`                    | ビルド済みCLIのsmokeテストと起動時メモリsmoke | Node関連の変更時 |
| `checks`                         | 残りのLinux Nodeレーン: channelテストと、push時のみのNode 22互換性 | Node関連の変更時 |
| `check-docs`                     | docsのformat、lint、リンク切れチェック | docs変更時 |
| `skills-python`                  | PythonベースSkills向けのRuff + pytest | Python-skill関連の変更時 |
| `checks-windows`                 | Windows固有のテストレーン | Windows関連の変更時 |
| `macos-node`                     | 共有のビルド済みartifactを使うmacOS TypeScriptテストレーン | macOS関連の変更時 |
| `macos-swift`                    | macOS app向けのSwift lint、build、tests | macOS関連の変更時 |
| `android`                        | Android buildおよびtest matrix | Android関連の変更時 |

## Fail-Fast順序

ジョブは、高コストなジョブが実行される前に安価なチェックが失敗するように順序付けされています。

1. `preflight`が、どのレーンをそもそも存在させるかを決定します。`docs-scope`と`changed-scope`のロジックは、このジョブ内のstepであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python`は、より重いartifactジョブやplatform matrixジョブを待たずに素早く失敗します。
3. `build-artifacts`は高速Linuxレーンと並行して実行されるため、共有buildの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いplatformおよびruntimeレーンが分岐します: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは`scripts/ci-changed-scope.mjs`にあり、`src/scripts/ci-changed-scope.test.ts`のunit testでカバーされています。
別の`install-smoke` workflowは、独自の`preflight`ジョブを通じて同じスコープスクリプトを再利用します。より狭いchanged-smokeシグナルから`run_install_smoke`を計算するため、Docker/install smokeはinstall、packaging、container関連の変更に対してのみ実行されます。

ローカルのchanged-laneロジックは`scripts/changed-lanes.mjs`にあり、`scripts/check-changed.mjs`によって実行されます。そのローカルゲートは、広いCI platform scopeよりもarchitecture boundaryに対して厳格です。core productionの変更ではcore prod typecheckとcore testsが実行され、core test-onlyの変更ではcore test typecheck/testsのみが実行され、extension productionの変更ではextension prod typecheckとextension testsが実行され、extension test-onlyの変更ではextension test typecheck/testsのみが実行されます。公開Plugin SDKまたはplugin-contractの変更は、extensionsがそれらのcore contractに依存しているため、extension validationに拡張されます。release metadataのみのversion bumpでは、対象を絞ったversion/config/root-dependencyチェックが実行されます。未知のroot/config変更は、安全側に倒してすべてのレーンになります。

push時には、`checks` matrixにpush専用の`compat-node22`レーンが追加されます。pull requestではそのレーンはスキップされ、matrixは通常のtest/channelレーンに集中します。

最も遅いNode testファミリーは、各ジョブを小さく保つためにinclude-file shardに分割されています。channel contractsはregistryとcore coverageをそれぞれ8つの重み付きshardに分割し、auto-reply reply command testsは4つのinclude-pattern shardに分割し、そのほかの大きなauto-reply reply prefixグループはそれぞれ2つのshardに分割されています。`check-additional`も、package-boundary compile/canary作業をruntime topology gateway/architecture作業から分離しています。

同じPRまたは`main` refに対して新しいpushが届くと、GitHubは古いジョブを`cancelled`とマークすることがあります。同じrefに対する最新のrunも失敗していない限り、これはCIノイズとして扱ってください。aggregate shardチェックでは、このキャンセルケースを明示的に示すため、テスト失敗との区別がしやすくなっています。

## Runner

| Runner | ジョブ |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux checks、docs checks、Python skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`上の`macos-node`、`macos-swift`。forkでは`macos-latest`にフォールバック |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes   # origin/main...HEADに対するローカルchanged-lane classifierを確認
pnpm check:changed   # スマートなローカルゲート: boundary laneごとの変更対象typecheck/lint/tests
pnpm check          # 高速ローカルゲート: production tsgo + shard化lint + 並列fast guard
pnpm check:test-types
pnpm check:timed    # 同じゲートを各stageの時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docsのformat + lint + broken links
pnpm build          # CIのartifact/build-smokeレーンが関係する場合にdistをbuild
```
