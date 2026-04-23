---
read_when:
    - reasoning leakageについて調べるために、生のmodel出力を確認する必要があります
    - 反復作業中はGatewayをwatch modeで実行したいです
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: watch mode、生のmodel stream、およびreasoning leakageの追跡'
title: デバッグ
x-i18n:
    generated_at: "2026-04-23T04:46:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# デバッグ

このページでは、特にproviderがreasoningを通常テキストに混在させる場合の、
ストリーミング出力向けデバッグヘルパーを扱います。

## Runtime debug override

チャット内で `/debug` を使うと、**runtimeのみ** のconfig overrideを設定できます（ディスクではなくメモリ）。
`/debug` はデフォルトで無効です。有効にするには `commands.debug: true` を設定してください。
これは、`openclaw.json` を編集せずに目立たない設定を切り替えたいときに便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのoverrideをクリアし、ディスク上のconfigに戻します。

## Session trace出力

1つのsessionで、完全なverbose modeを有効にせずにplugin側のtrace/debug行を見たい場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memoryのdebug summaryのようなplugin診断には `/trace` を使ってください。
通常のverbose status/tool出力には引き続き `/verbose` を使い、
runtimeのみのconfig overrideには引き続き `/debug` を使ってください。

## 一時的なCLI debug timing

OpenClawは、ローカル調査用の小さなヘルパーとして `src/cli/debug-timing.ts` を保持しています。  
これは意図的にCLI起動、コマンドルーティング、どのコマンドにもデフォルトでは組み込まれていません。遅いコマンドをデバッグしている間だけ使い、その後、動作変更を反映する前にimportとspanを削除してください。

これは、あるコマンドが遅く、CPU profilerを使うべきか、特定のsubsystemを修正すべきか判断する前に、素早くphaseの内訳を知りたい場合に使います。

### 一時的なspanを追加する

調査対象のコードの近くにヘルパーを追加します。たとえば、
`openclaw models list` をデバッグしている間、`src/commands/models/list.list-command.ts` への一時パッチは次のようになります。

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

ガイドライン:

- 一時phase名には `debug:` 接頭辞を付けてください。
- 追加するspanは、疑わしい遅い区間の周辺に数個だけにしてください。
- helper名よりも `registry`、`auth_store`、`rows` のような大まかなphaseを優先してください。
- 同期処理には `time()`、promiseには `timeAsync()` を使います。
- stdoutはきれいに保ってください。このhelperはstderrに書き込むため、コマンドのJSON出力は引き続きparse可能です。
- 最終fix PRを開く前に、一時的なimportとspanは削除してください。
- 最適化を説明するissueまたはPRには、timing出力または短い要約を含めてください。

### 読みやすい出力で実行する

ライブデバッグには読みやすいモードが最適です。

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

一時的な `models list` 調査の出力例:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

この出力からわかること:

| Phase                                    |       Time | 意味 |
| ---------------------------------------- | ---------: | ---- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile storeの読み込みが最大コストであり、最初に調査すべきです。 |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` の同期は、キャッシュやスキップ条件を調べる価値がある程度に高コストです。 |
| `debug:models:list:load_model_registry`  |       5.9s | registry構築とprovider availability処理も無視できないコストです。 |
| `debug:models:list:read_registry_models` |       2.4s | すべてのregistry modelの読み取りは無料ではなく、`--all` では影響がある可能性があります。 |
| row append phase                         | 3.2s total | 表示される5行を組み立てるだけでも数秒かかっているため、filtering経路を詳しく見る価値があります。 |
| `debug:models:list:print_model_table`    |        0ms | renderingはボトルネックではありません。 |

この結果だけでも、production pathにtimingコードを残さず次のパッチ方針を決めるには十分です。

### JSON出力で実行する

timing dataを保存または比較したい場合はJSON modeを使います。

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderrの各行は1つのJSON objectです。

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### マージ前にクリーンアップする

最終PRを開く前に:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

このコマンドは、PRが永続的なdiagnostics surfaceを明示的に追加するものでない限り、一時的なinstrumentation call siteを返さないはずです。通常のperformance修正では、動作変更、テスト、およびtiming根拠を示す短い注記だけを残してください。

より深いCPU hotspotには、timing wrapperを増やす代わりに、Node profiling（`--cpu-prof`）または外部profilerを使ってください。

## Gateway watch mode

高速に反復したい場合は、ファイルwatcherの下でgatewayを実行します。

```bash
pnpm gateway:watch
```

これは次に対応します。

```bash
node scripts/watch-node.mjs gateway --force
```

watcherは、`src/` 配下のbuild関連ファイル、extension source file、
extensionの `package.json` と `openclaw.plugin.json` metadata、`tsconfig.json`、
`package.json`、`tsdown.config.ts` の変更で再起動します。
extension metadataの変更では `tsdown` のrebuildを強制せずにgatewayを再起動し、
sourceとconfigの変更では引き続き先に `dist` をrebuildします。

`gateway:watch` の後ろにgateway CLI flagを追加すると、再起動のたびにそれらが引き継がれます。同じrepo/flagセットに対して同じwatchコマンドを再実行すると、重複したwatcher parentを残すのではなく、古いwatcherが置き換えられるようになりました。

## Dev profile + dev gateway（`--dev`）

stateを分離し、安全で使い捨て可能なデバッグ環境を立ち上げるにはdev profileを使ってください。`--dev` には**2種類**あります。

- **グローバル `--dev`（profile）:** `~/.openclaw-dev` 配下にstateを分離し、
  gateway portをデフォルトで `19001` にします（派生portもそれに合わせてずれます）。
- **`gateway --dev`:** Gatewayに対し、config + workspace がなければ自動作成するよう指示します（さらに `BOOTSTRAP.md` をスキップします）。

推奨フロー（dev profile + dev bootstrap）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルinstallしていない場合は、`pnpm openclaw ...` 経由でCLIを実行してください。

これが行うこと:

1. **profile分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvasもそれに合わせて変わります）

2. **dev bootstrap**（`gateway --dev`）
   - configがなければ最小構成を書き込みます（`gateway.mode=local`、bind loopback）。
   - `agent.workspace` をdev workspaceに設定します。
   - `agent.skipBootstrap=true` を設定します（`BOOTSTRAP.md` なし）。
   - workspace fileがなければ初期投入します:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルトidentity: **C3‑PO**（protocol droid）。
   - dev modeではchannel providerをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（初期状態からやり直す）:

```bash
pnpm gateway:dev:reset
```

注: `--dev` は**グローバル**なprofile flagであり、一部runnerでは消費されます。
明示的に書く必要がある場合は、env var形式を使ってください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` はconfig、credentials、session、およびdev workspaceを（`rm` ではなく `trash` を使って）消去し、その後デフォルトのdev setupを再作成します。

ヒント: すでに非devのgatewayが動いている場合（launchd/systemd）は、先に停止してください。

```bash
openclaw gateway stop
```

## Raw stream logging（OpenClaw）

OpenClawは、フィルタリング/整形前の**生のassistant stream**を記録できます。
これは、reasoningがプレーンなtext deltaとして到着しているのか、
あるいは別個のthinking blockとして来ているのかを確認する最良の方法です。

CLIで有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のpath上書き:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等のenv var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw chunk logging（pi-mono）

blockへparseされる前の**生のOpenAI互換chunk**を取得するには、
pi-monoは別のloggerを提供しています。

```bash
PI_RAW_STREAM=1
```

任意のpath:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは pi-mono の
> `openai-completions` provider を使っているprocessでのみ出力されます。

## 安全上の注意

- raw stream logには、完全なprompt、tool出力、user dataが含まれる場合があります。
- logはローカルに保持し、デバッグ後は削除してください。
- logを共有する場合は、先にsecretとPIIを除去してください。
