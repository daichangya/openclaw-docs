---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 正確なコマンド付きの、安定した症状ベースの runbook セクションが必要な場合
summary: Gateway、channels、自動化、nodes、および browser 向けの詳細なトラブルシューティング runbook
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-25T13:49:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway のトラブルシューティング

このページは詳細な runbook です。  
まず高速なトリアージフローを使いたい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドラダー

まず次のコマンドを、この順番で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

想定される正常シグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、ブロッキングな config/service 問題を報告しない。
- `openclaw channels status --probe` が、アカウントごとのライブな transport status と、
  対応している場合は `works` や `audit ok` のような probe/audit 結果を表示する。

## 長いコンテキストで Anthropic 429 の extra usage required が出る

ログ/エラーに
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`
が含まれる場合は、これを使用してください。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する点:

- 選択されている Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic credential が、long-context usage の対象ではない。
- リクエストが失敗するのが、1M beta パスを必要とする長いセッション/モデル実行のときだけである。

修正方法:

1. そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウへ戻す。
2. long-context request の対象となる Anthropic credential を使うか、Anthropic API key に切り替える。
3. Anthropic の long-context request が拒否されたときでも実行が継続するように、fallback model を設定する。

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [Token use and costs](/ja-JP/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI-compatible backend は直接 probe では通るが、agent 実行は失敗する

次のような場合に使用します。

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClaw の model 実行が、通常の agent turn でのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認する点:

- 直接の小さな呼び出しは成功するが、OpenClaw の実行は大きいプロンプトでのみ失敗する
- backend エラーに、`messages[].content` が文字列を期待しているという内容がある
- backend クラッシュが、大きい prompt-token 数や完全な agent
  runtime prompt でのみ発生する

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → backend が
  構造化された Chat Completions content parts を拒否している。修正:  
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定する。
- 直接の小さなリクエストは成功するが、OpenClaw の agent 実行が backend/model
  クラッシュで失敗する（例: 一部の `inferrs` ビルド上の Gemma）→ OpenClaw の transport は
  すでに正しい可能性が高い。backend 側が、より大きい agent-runtime
  prompt shape で失敗している。
- tools を無効にすると失敗は減るが消えない → tool schema が
  負荷の一部だったが、残る問題は依然として upstream の model/server
  capacity または backend bug である。

修正方法:

1. 文字列のみの Chat Completions backend には `compat.requiresStringContent: true` を設定する。
2. OpenClaw の tool schema surface を確実に扱えない
   model/backend には `compat.supportsTools: false` を設定する。
3. 可能な範囲で prompt の負荷を下げる: より小さい workspace bootstrap、より短い
   session history、より軽い local model、またはより強い long-context
   support を持つ backend を使う。
4. 直接の小さなリクエストは通るのに OpenClaw の agent turn が backend 内で依然としてクラッシュする場合、
   upstream の server/model 制限として扱い、受理される payload shape を添えて
   そちらに repro を報告する。

関連:

- [Local models](/ja-JP/gateway/local-models)
- [Configuration](/ja-JP/gateway/configuration)
- [OpenAI-compatible endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

channels が稼働していても何も応答しない場合、何かを再接続する前に、ルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認する点:

- DM 送信者に対して pairing が pending になっている。
- グループの mention gating（`requireMention`、`mentionPatterns`）。
- channel/group allowlist の不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → mention されるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/channel がポリシーによりフィルタされた。

関連:

- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)

## Dashboard control ui の接続性

dashboard/control UI が接続できない場合、URL、auth mode、および secure context 前提を検証してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認する点:

- 正しい probe URL と dashboard URL。
- client と gateway の間で auth mode/token が一致している。
- device identity が必要な場面で HTTP を使っている。

よくあるシグネチャ:

- `device identity required` → non-secure context または device auth の欠落。
- `origin not allowed` → browser の `Origin` が `gateway.controlUi.allowedOrigins`
  に含まれていない（または、明示的な allowlist なしで non-loopback の browser origin から接続している）。
- `device nonce required` / `device nonce mismatch` → client が
  チャレンジベースの device auth フロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → client が現在の handshake に対して
  誤った payload（または古い timestamp）に署名している。
- `AUTH_TOKEN_MISMATCH` で `canRetryWithDeviceToken=true` → client はキャッシュ済み device token で 1 回だけ trusted retry できる。
- その cached-token retry では、承認済み device token とともに保存された
  cached scope set を再利用する。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求した scope set を維持する。
- その retry path の外では、connect auth の優先順位は、明示的な shared
  token/password が最優先で、その次が明示的な `deviceToken`、その次が保存済み device token、
  最後が bootstrap token。
- 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、
  limiter が失敗を記録する前に直列化される。そのため、同じ client からの 2 回の不正な同時 retry では、
  2 回とも単純な mismatch ではなく、2 回目で `retry later` が出ることがある。
- browser-origin の loopback client からの `too many failed authentication attempts (retry later)` → 同じ正規化された `Origin` からの繰り返し失敗は一時的にロックアウトされる。別の localhost origin は別バケットを使う。
- その retry 後も繰り返し `unauthorized` → shared token/device token の不整合。token config を更新し、必要なら device token を再承認/ローテーションする。
- `gateway connect failed:` → host/port/url target が誤っている。

### Auth detail code クイックマップ

失敗した `connect` レスポンスの `error.details.code` を使って、次のアクションを選んでください。

| Detail code                  | 意味                                                                                                                                                                                         | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | client が必須の shared token を送信していない。                                                                                                                                            | client に token を貼り付け/設定して再試行する。dashboard パスでは: `openclaw config get gateway.auth.token` を実行し、Control UI settings に貼り付ける。                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | shared token が gateway auth token と一致しなかった。                                                                                                                                       | `canRetryWithDeviceToken=true` なら、trusted retry を 1 回許可する。cached-token retry は保存済みの承認スコープを再利用し、明示的な `deviceToken` / `scopes` 呼び出し元は要求した scope を維持する。それでも失敗する場合は [token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist) を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | デバイスごとのキャッシュ済み token が古いか失効している。                                                                                                                                   | [devices CLI](/ja-JP/cli/devices) を使って device token をローテーション/再承認し、その後再接続する。                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | device identity に承認が必要。`error.details.reason` の `not-paired`、`scope-upgrade`、`role-upgrade`、`metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使う。 | pending request を承認する: `openclaw devices list`、次に `openclaw devices approve <requestId>`。scope/role upgrade も、要求されたアクセスを確認した後は同じフローを使う。                                                                                                   |

Device auth v2 の移行確認:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/signature エラーが出る場合は、接続側 client を更新し、次を確認してください。

1. `connect.challenge` を待機する
2. challenge に結び付いた payload に署名する
3. 同じ challenge nonce を使って `connect.params.device.nonce` を送信する

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- paired-device token session は、呼び出し元が
  `operator.admin` も持っていない限り、**自分自身の** device しか管理できない
- `openclaw devices rotate --scope ...` は、呼び出し元 session が
  すでに保持している operator scope しか要求できない

関連:

- [Control UI](/ja-JP/web/control-ui)
- [Configuration](/ja-JP/gateway/configuration)（gateway auth mode）
- [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth)
- [Remote access](/ja-JP/gateway/remote)
- [Devices](/ja-JP/cli/devices)

## Gateway service が動作していない

service はインストールされているが、process が稼働し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # system-level service もスキャン
```

確認する点:

- `Runtime: stopped` と exit hint が表示される。
- service config の不一致（`Config (cli)` と `Config (service)`）。
- port/listener の競合。
- `--deep` 使用時の、追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` の cleanup hint。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → local gateway mode が有効ではない、または config file が壊れて `gateway.mode` を失っています。修正: config に `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待される local-mode config を再スタンプしてください。OpenClaw を Podman 経由で実行している場合、デフォルトの config path は `~/.openclaw/openclaw.json` です。
- `refusing to bind gateway ... without auth` → 有効な gateway auth 経路（token/password、または設定済みの trusted-proxy）がない状態で non-loopback bind をしようとしている。
- `another gateway instance is already listening` / `EADDRINUSE` → port 競合。
- `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks unit が存在する。多くの構成では 1 台のマシンにつき 1 つの gateway にすべきです。複数必要な場合は、port + config/state/workspace を分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

関連:

- [Background exec and process tool](/ja-JP/gateway/background-process)
- [Configuration](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が last-known-good config を復元した

Gateway は起動するが、ログに `openclaw.json` を復元したとある場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認する点:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな config の横に、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイルがある
- `Config recovery warning` で始まる main-agent system event がある

何が起きたか:

- 拒否された config が、起動時またはホットリロード時の検証に通らなかった。
- OpenClaw は、その拒否された payload を `.clobbered.*` として保存した。
- アクティブな config は、最後に検証済みだった last-known-good コピーから復元された。
- 次の main-agent turn には、拒否された config を無造作に再書き込みしないよう警告が出る。
- 検証問題がすべて `plugins.entries.<id>...` 配下だけだった場合、OpenClaw は
  ファイル全体を復元しない。Plugin ローカルの失敗は目立つままにしつつ、無関係な
  ユーザー設定はアクティブな config に残す。

確認と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*` が存在する → 外部からの直接編集または起動時読み込みが復元された。
- `.rejected.*` が存在する → OpenClaw 管理の config 書き込みが、コミット前に schema または clobber チェックに失敗した。
- `Config write rejected:` → 書き込みが、必須 shape を欠落させる、ファイルサイズを急激に縮小させる、または無効な config を永続化しようとした。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 現在のファイルが、last-known-good backup と比較してフィールドやサイズを失っていたため、起動時に clobbered と判定された。
- `Config last-known-good promotion skipped` → 候補に `***` のような redact 済み secret placeholder が含まれていた。

修正方法:

1. 復元されたアクティブ config が正しければ、それをそのまま維持する。
2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
3. 再起動前に `openclaw config validate` を実行する。
4. 手作業で編集する場合は、変更したい部分の部分オブジェクトだけではなく、完全な JSON5 config を維持する。

関連:

- [Configuration: strict validation](/ja-JP/gateway/configuration#strict-validation)
- [Configuration: hot reload](/ja-JP/gateway/configuration#config-hot-reload)
- [Config](/ja-JP/cli/config)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway probe warnings

`openclaw gateway probe` が何かには到達するが、それでも warning block を表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する点:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- warning が SSH fallback、複数 gateway、scope 欠落、または未解決 auth ref に関するものかどうか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップが失敗したが、コマンドは引き続き、設定済み/loopback target への direct probe を試した。
- `multiple reachable gateways detected` → 複数の target が応答した。通常は、意図的な multi-gateway 構成か、古い/重複 listener を意味する。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect は成功したが、detail RPC は scope により制限されている。device identity を pair するか、`operator.read` を持つ credential を使用する。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → gateway は応答しているが、この client は通常の operator access 前に pairing/approval が必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef warning text → このコマンド経路で、その失敗 target 向けの auth material が利用できなかった。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [Multiple gateways on the same host](/ja-JP/gateway#multiple-gateways-same-host)
- [Remote access](/ja-JP/gateway/remote)

## Channel は接続されているがメッセージが流れない

channel の状態は connected なのに message flow が止まっている場合は、policy、permission、および channel 固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する点:

- DM policy（`pairing`、`allowlist`、`open`、`disabled`）。
- Group allowlist と mention requirement。
- channel API permission/scope の欠落。

よくあるシグネチャ:

- `mention required` → グループ mention ポリシーによりメッセージが無視された。
- `pairing` / pending approval traces → 送信者が未承認。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → channel auth/permission の問題。

関連:

- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
- [WhatsApp](/ja-JP/channels/whatsapp)
- [Telegram](/ja-JP/channels/telegram)
- [Discord](/ja-JP/channels/discord)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まず scheduler の状態を確認し、その後で配信 target を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する点:

- Cron が有効で、次の wake が存在する。
- Job run history の status（`ok`、`skipped`、`error`）。
- Heartbeat skip reason（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → cron が無効。
- `cron: timer tick failed` → scheduler tick が失敗。file/log/runtime error を確認する。
- `heartbeat skipped` で `reason=quiet-hours` → アクティブ時間帯の外側。
- `heartbeat skipped` で `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空行または markdown header しか含まれていないため、OpenClaw が model call をスキップした。
- `heartbeat skipped` で `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` block はあるが、この tick では期限到来タスクがない。
- `heartbeat: unknown accountId` → Heartbeat 配信 target の account id が無効。
- `heartbeat skipped` で `reason=dm-blocked` → Heartbeat target が DM 形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの override）が `block` に設定されている。

関連:

- [Scheduled tasks: troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [Scheduled tasks](/ja-JP/automation/cron-jobs)
- [Heartbeat](/ja-JP/gateway/heartbeat)

## ペアリング済み Node でツールが失敗する

node はペアリング済みだがツールが失敗する場合は、foreground、permission、および approval state を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する点:

- 期待した capability を持つ node が online である。
- camera/mic/location/screen に対する OS permission が付与されている。
- Exec approval と allowlist の状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → node app が foreground である必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS permission が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec approval が pending。
- `SYSTEM_RUN_DENIED: allowlist miss` → command が allowlist によりブロックされた。

関連:

- [Node troubleshooting](/ja-JP/nodes/troubleshooting)
- [Nodes](/ja-JP/nodes/index)
- [Exec approvals](/ja-JP/tools/exec-approvals)

## Browser tool が失敗する

gateway 自体は正常なのに browser tool のアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する点:

- `plugins.allow` が設定されていて、`browser` を含んでいるか。
- browser executable path が有効か。
- CDP profile に到達できるか。
- `existing-session` / `user` profile 用のローカル Chrome が利用可能か。

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → バンドル済み browser Plugin が `plugins.allow` によって除外されている。
- `browser` ツールが見つからない / 利用不可なのに `browser.enabled=true` → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
- `Failed to start Chrome CDP on port` → browser process の起動に失敗した。
- `browser.executablePath not found` → 設定されたパスが無効。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` のような未対応スキームを使っている。
- `browser.cdpUrl has invalid port` → 設定された CDP URL の port が不正または範囲外。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session が、選択された browser data dir にまだアタッチできていない。browser の inspect page を開き、remote debugging を有効にし、browser を開いたままにして、最初の attach prompt を承認してから再試行する。サインイン状態が不要なら、管理対象の `openclaw` profile を優先する。
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profile に、ローカルの開いている Chrome タブがない。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP endpoint に gateway host から到達できない。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile に到達可能な target がない、または HTTP endpoint は応答したが CDP WebSocket を開けなかった。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の gateway install には、バンドル済み browser Plugin の `playwright-core` ランタイム依存関係がない。`openclaw doctor --fix` を実行し、その後 gateway を再起動する。ARIA snapshot と基本的な page screenshot は引き続き動作するが、navigation、AI snapshot、CSS selector による element screenshot、PDF export は引き続き利用できない。
- `fullPage is not supported for element screenshots` → screenshot request で `--full-page` と `--ref` または `--element` を混在させている。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` の screenshot 呼び出しでは、CSS `--element` ではなく page capture または snapshot `--ref` を使う必要がある。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP の upload hook には CSS selector ではなく snapshot ref が必要。
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profile では、1 回の呼び出しにつき 1 ファイルずつ upload する。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profile の dialog hook は timeout override をサポートしない。
- `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profile での `act:type` では `timeoutMs` を省略するか、カスタム timeout が必要なら管理対象/CDP browser profile を使用する。
- `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profile での `act:evaluate` では `timeoutMs` を省略するか、カスタム timeout が必要なら管理対象/CDP browser profile を使用する。
- `response body is not supported for existing-session profiles yet.` → `responsebody` は依然として管理対象 browser または生の CDP profile を必要とする。
- attach-only または remote CDP profile で viewport / dark-mode / locale / offline override が古いまま残る → `openclaw browser stop --browser-profile <name>` を実行して、gateway 全体を再起動せずに、アクティブな control session を閉じて Playwright/CDP のエミュレーション状態を解放する。

関連:

- [Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser (OpenClaw-managed)](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の大半は、config drift または、より厳格になったデフォルトが適用されるようになったことが原因です。

### 1) Auth と URL override の動作が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認すること:

- `gateway.mode=remote` の場合、ローカル service は正常でも、CLI 呼び出しが remote を対象にしている可能性がある。
- 明示的な `--url` 呼び出しは、保存済み credential にフォールバックしない。

よくあるシグネチャ:

- `gateway connect failed:` → URL target が誤っている。
- `unauthorized` → endpoint には到達しているが auth が誤っている。

### 2) Bind と auth のガードレールがより厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認すること:

- non-loopback bind（`lan`、`tailnet`、`custom`）には、有効な gateway auth 経路が必要: shared token/password auth、または正しく設定された non-loopback の `trusted-proxy` デプロイメント。
- `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはならない。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効な gateway auth 経路なしで non-loopback bind している。
- runtime は動作中なのに `Connectivity probe: failed` → gateway 自体は生きているが、現在の auth/url では到達できない。

### 3) Pairing と device identity の状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認すること:

- dashboard/nodes 向けに pending の device approval がある。
- policy または identity 変更後に、DM pairing approval が pending になっている。

よくあるシグネチャ:

- `device identity required` → device auth が満たされていない。
- `pairing required` → sender/device の承認が必要。

確認後も service config と runtime の不一致が続く場合は、同じ profile/state directory から service metadata を再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [Gateway-owned pairing](/ja-JP/gateway/pairing)
- [Authentication](/ja-JP/gateway/authentication)
- [Background exec and process tool](/ja-JP/gateway/background-process)

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
