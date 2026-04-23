---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内された場合
    - 症状ベースの安定したランブックセクションと正確なコマンドが必要な場合
summary: Gateway、channels、自動化、Node、ブラウザー向け詳細トラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-23T04:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gatewayトラブルシューティング

このページは詳細ランブックです。
まず迅速なトリアージフローを確認したい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting)から始めてください。

## コマンドラダー

最初に、次の順序で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、設定/サービスに関するブロッキングな問題なしと報告する。
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポートステータスと、対応している場合は `works` や `audit ok` などのプローブ/監査結果を表示する。

## 長いコンテキストで Anthropic 429 extra usage required が出る

ログ/エラーに次が含まれている場合に使用します:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する点:

- 選択されたAnthropic Opus/Sonnetモデルに `params.context1m: true` がある。
- 現在のAnthropic認証情報が長いコンテキスト利用の対象ではない。
- 失敗するのは、1Mベータパスが必要な長いセッション/モデル実行だけである。

対処方法:

1. そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウへフォールバックする。
2. 長いコンテキストリクエストの対象となるAnthropic認証情報を使うか、Anthropic APIキーへ切り替える。
3. Anthropicの長いコンテキストリクエストが拒否されたときでも実行が継続するよう、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/ja-JP/providers/anthropic)
- [/reference/token-use](/ja-JP/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ja-JP/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルのOpenAI互換バックエンドは直接プローブには通るが、エージェント実行は失敗する

次の場合に使用します:

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClawのモデル実行は通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認する点:

- 直接の小さな呼び出しは成功するが、OpenClawの実行はより大きなプロンプトでのみ失敗する
- `messages[].content` が文字列を期待しているというバックエンドエラー
- より大きなプロンプトトークン数や完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化されたChat Completionsのcontent partsを拒否している。対処: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定する。
- 直接の小さなリクエストは成功するが、OpenClawのエージェント実行はバックエンド/モデルクラッシュで失敗する（例: 一部の `inferrs` ビルド上のGemma）→ OpenClawのトランスポートはすでに正しく、バックエンドがより大きなエージェントランタイムのプロンプト形状で失敗している可能性が高い。
- ツールを無効にすると失敗は減るが消えない → ツールスキーマが負荷の一部だったが、残っている問題は依然として上流のモデル/サーバー容量またはバックエンドバグである。

対処方法:

1. 文字列のみのChat Completionsバックエンドには、`compat.requiresStringContent: true` を設定する。
2. OpenClawのツールスキーマサーフェスを安定して処理できないモデル/バックエンドには、`compat.supportsTools: false` を設定する。
3. 可能な範囲でプロンプト負荷を下げる: より小さいワークスペースブートストラップ、より短いセッション履歴、より軽いローカルモデル、または長いコンテキストサポートがより強いバックエンドを使う。
4. 直接の小さなリクエストが引き続き成功する一方で、OpenClawのエージェントターンがバックエンド内でまだクラッシュする場合は、それを上流サーバー/モデルの制限とみなし、受理されるペイロード形状を添えてそこで再現報告を出す。

関連:

- [/gateway/local-models](/ja-JP/gateway/local-models)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

channelsが稼働しているのに何も応答しない場合は、何かを再接続する前に、ルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認する点:

- DM送信者のペアリングが保留中になっている。
- グループメンションゲーティング（`requireMention`、`mentionPatterns`）。
- channel/group許可リストの不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/channelがポリシーによってフィルタリングされた。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control ui connectivity

Dashboard/control UIが接続できない場合は、URL、認証モード、およびセキュアコンテキスト前提を確認してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認する点:

- 正しいプローブURLとdashboard URL。
- クライアントとGateway間の認証モード/トークン不一致。
- デバイスIDが必要な場面でHTTPを使っている。

よくあるシグネチャ:

- `device identity required` → 非セキュアコンテキストまたはデバイス認証の不足。
- `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていない（または明示的な許可リストなしで非loopbackのブラウザーoriginから接続している）。
- `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名した。
- `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで1回だけ信頼済みリトライができる。
- そのキャッシュトークン再試行では、ペア済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用する。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求したスコープセットをそのまま維持する。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが先、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にbootstrapトークンである。
- 非同期のTailscale Serve Control UIパスでは、同じ `{scope, ip}` に対する失敗試行は、リミッターが失敗を記録する前に直列化される。そのため、同じクライアントからの2つの不正な同時リトライでは、2回とも単純な不一致ではなく、2回目に `retry later` が出ることがある。
- ブラウザーoriginのloopbackクライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの繰り返し失敗は一時的にロックアウトされる。別のlocalhost originは別バケットを使う。
- その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれ。必要ならトークン設定を更新し、デバイストークンを再承認/ローテーションする。
- `gateway connect failed:` → host/port/urlの接続先が間違っている。

### 認証詳細コードのクイックマップ

失敗した `connect` 応答の `error.details.code` を使って、次の対応を選んでください。

| Detail code                  | 意味                                                                                                                                                                            | 推奨アクション                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信していない。                                                                                                                              | クライアントにトークンを貼り付け/設定して再試行する。dashboard系のパスでは: `openclaw config get gateway.auth.token` を実行し、Control UI設定に貼り付ける。                                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンがGateway認証トークンと一致しなかった。                                                                                                                             | `canRetryWithDeviceToken=true` の場合は、信頼済みリトライを1回許可する。キャッシュトークン再試行では保存済み承認スコープを再利用する。明示的な `deviceToken` / `scopes` 呼び出し元は要求スコープを維持する。それでも失敗する場合は、[token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | デバイスごとのキャッシュ済みトークンが古いか失効している。                                                                                                                      | [devices CLI](/cli/devices) を使ってデバイストークンをローテーション/再承認し、その後再接続する。                                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | デバイスIDに承認が必要。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、`metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使う。 | 保留中のリクエストを承認する: `openclaw devices list` の後に `openclaw devices approve <requestId>`。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後で同じフローを使う。                                                                                                 |

Device auth v2移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログにnonce/signatureエラーが出る場合は、接続するクライアントを更新し、次を確認してください:

1. `connect.challenge` を待つ
2. challengeに束縛されたペイロードに署名する
3. 同じchallenge nonceを使って `connect.params.device.nonce` を送る

`openclaw devices rotate` / `revoke` / `remove` が想定外に拒否される場合:

- ペア済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の** デバイスしか管理できない
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持しているoperatorスコープのみ要求できる

関連:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ja-JP/gateway/configuration)（Gateway認証モード）
- [/gateway/trusted-proxy-auth](/ja-JP/gateway/trusted-proxy-auth)
- [/gateway/remote](/ja-JP/gateway/remote)
- [/cli/devices](/cli/devices)

## Gatewayサービスが実行されていない

サービスはインストール済みだが、プロセスが起動したままにならない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # システムレベルのサービスもスキャン
```

確認する点:

- 終了ヒント付きの `Runtime: stopped`。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` 使用時の余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカルGatewayモードが有効になっていないか、設定ファイルが壊れて `gateway.mode` を失っています。対処: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` または `openclaw setup` を再実行して、想定されるローカルモード設定を再適用してください。OpenClawをPodman経由で実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
- `refusing to bind gateway ... without auth` → 有効なGateway認証経路（トークン/パスワード、または設定されているtrusted-proxy）なしで非loopbackにバインドしようとしています。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
- `Other gateway-like services detected (best effort)` → 古い、または並行するlaunchd/systemd/schtasksユニットが存在します。ほとんどの構成では、1台のマシンにつき1つのGatewayにしてください。複数必要な場合は、ポート + config/state/workspace を分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)を参照してください。

関連:

- [/gateway/background-process](/ja-JP/gateway/background-process)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gatewayがlast-known-good設定を復元した

Gatewayは起動するが、ログに `openclaw.json` を復元したと表示される場合に使用します。

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
- アクティブな設定の横にある、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まるmain-agent system event

起きたこと:

- 起動時またはホットリロード時に、拒否された設定がバリデーションを通過しませんでした。
- OpenClawは拒否されたペイロードを `.clobbered.*` として保存しました。
- アクティブな設定は、最後に検証済みだったlast-known-goodのコピーから復元されました。
- 次のmain-agentターンでは、拒否された設定を無条件に書き換えないよう警告されます。

調査と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*` が存在する → 外部からの直接編集または起動時読み込みが復元された。
- `.rejected.*` が存在する → OpenClaw自身による設定書き込みが、コミット前にスキーマまたは上書き保護チェックに失敗した。
- `Config write rejected:` → その書き込みは、必要な形状を削除しようとした、ファイルサイズを大きく減らそうとした、または無効な設定を永続化しようとした。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 起動時に、last-known-goodバックアップと比べてフィールドまたはサイズが失われていたため、現在のファイルが壊れたものとして扱われた。
- `Config last-known-good promotion skipped` → 候補に `***` のようなマスク済みシークレットプレースホルダーが含まれていた。

対処方法:

1. 復元されたアクティブ設定が正しいなら、それをそのまま使う。
2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
3. 再起動前に `openclaw config validate` を実行する。
4. 手動で編集する場合は、変更したい部分オブジェクトだけでなく、完全なJSON5設定を維持する。

関連:

- [/gateway/configuration#strict-validation](/ja-JP/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ja-JP/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway probeの警告

`openclaw gateway probe` が何かには到達するが、それでも警告ブロックを表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する点:

- JSON出力の `warnings[].code` と `primaryTargetId`
- 警告がSSHフォールバック、複数Gateway、スコープ不足、未解決の認証参照のどれに関するものか

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSHセットアップは失敗したが、コマンドは引き続き設定済み/loopbackターゲットへの直接プローブを試した。
- `multiple reachable gateways detected` → 複数のターゲットが応答した。通常は、意図的なマルチGateway構成か、古い/重複したリスナーを意味する。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続自体は成功したが、詳細RPCはスコープ制限されている。デバイスIDをペアリングするか、`operator.read` を持つ認証情報を使う。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gatewayは応答しているが、このクライアントは通常のoperatorアクセス前にまだペアリング/承認が必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef警告テキスト → そのコマンド経路では、失敗したターゲット向けの認証情報が利用できなかった。

関連:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ja-JP/gateway/remote)

## channelは接続済みだがメッセージが流れない

channelの状態は接続済みだが、メッセージフローが止まっている場合は、ポリシー、権限、およびchannel固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する点:

- DMポリシー（`pairing`、`allowlist`、`open`、`disabled`）
- グループ許可リストとメンション要件
- 不足しているchannel API権限/スコープ

よくあるシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 保留中の承認トレース → 送信者が承認されていない。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → channel認証/権限の問題。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## CronとHeartbeatの配信

CronまたはHeartbeatが実行されなかった、あるいは配信されなかった場合は、まずスケジューラー状態を確認し、その後で配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する点:

- Cronが有効で、次回起動時刻がある。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）
- Heartbeatスキップ理由（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → Cronが無効。
- `cron: timer tick failed` → スケジューラーのtickに失敗。ファイル/ログ/ランタイムエラーを確認する。
- `heartbeat skipped` かつ `reason=quiet-hours` → アクティブ時間帯の外。
- `heartbeat skipped` かつ `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空行またはMarkdown見出ししか含まれていないため、OpenClawはモデル呼び出しをスキップする。
- `heartbeat skipped` かつ `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックはあるが、このtick時点で期限の来ているタスクがない。
- `heartbeat: unknown accountId` → Heartbeat配信先のaccount idが無効。
- `heartbeat skipped` かつ `reason=dm-blocked` → HeartbeatターゲットがDM形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されている。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/ja-JP/gateway/heartbeat)

## ペアリング済みNodeのツールが失敗する

Nodeはペアリング済みだがツールが失敗する場合は、フォアグラウンド、権限、および承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する点:

- Nodeがオンラインで、期待どおりの機能を持っている。
- カメラ/マイク/位置情報/画面に対するOS権限が付与されている。
- exec承認と許可リストの状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Nodeアプリをフォアグラウンドにする必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストでブロックされた。

関連:

- [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)
- [/nodes/index](/ja-JP/nodes/index)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)

## browserツールが失敗する

Gateway自体は正常でも、browserツールの操作が失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する点:

- `plugins.allow` が設定されていて、`browser` を含んでいるか
- 有効なbrowser executable path
- CDPプロファイルへの到達可能性
- `existing-session` / `user` プロファイル向けのローカルChromeが利用可能か

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → バンドルされたbrowser Pluginが `plugins.allow` によって除外されている。
- `browser.enabled=true` なのにbrowser toolが存在しない/利用できない → `plugins.allow` が `browser` を除外しているため、Pluginが読み込まれていない。
- `Failed to start Chrome CDP on port` → browserプロセスの起動に失敗した。
- `browser.executablePath not found` → 設定されたパスが無効。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定されたCDP URLが `file:` や `ftp:` のような未対応スキームを使っている。
- `browser.cdpUrl has invalid port` → 設定されたCDP URLのポートが不正または範囲外。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-sessionが、選択したbrowserデータディレクトリにまだ接続できていない。browserのinspectページを開き、remote debuggingを有効にし、browserを開いたままにして、最初のattachプロンプトを承認してから再試行する。サインイン状態が不要なら、管理された `openclaw` プロファイルを優先する。
- `No Chrome tabs found for profile="user"` → Chrome MCP attachプロファイルに、開いているローカルChromeタブがない。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモートCDPエンドポイントにGatewayホストから到達できない。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-onlyプロファイルに到達可能なターゲットがない、またはHTTPエンドポイントは応答したがCDP WebSocketをまだ開けない。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在のGatewayインストールには、バンドルbrowser Pluginの `playwright-core` ランタイム依存関係がない。`openclaw doctor --fix` を実行してからGatewayを再起動する。ARIAスナップショットと基本的なページスクリーンショットは引き続き機能するが、ナビゲーション、AIスナップショット、CSSセレクターによる要素スクリーンショット、PDFエクスポートは利用できないまま。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` を混在させている。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなくページキャプチャまたはスナップショット `--ref` を使う必要がある。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCPのアップロードフックでは、CSSセレクターではなくスナップショット参照が必要。
- `existing-session file uploads currently support one file at a time.` → Chrome MCPプロファイルでは、1回の呼び出しにつき1ファイルずつアップロードする。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCPプロファイルのdialogフックでは、timeout上書きはサポートされない。
- `response body is not supported for existing-session profiles yet.` → `responsebody` はまだmanaged browserまたはraw CDPプロファイルが必要。
- attach-onlyまたはremote CDPプロファイルでviewport / dark-mode / locale / offline上書きが古いまま残っている → `openclaw browser stop --browser-profile <name>` を実行して、アクティブな制御セッションを閉じ、Gateway全体を再起動せずにPlaywright/CDPエミュレーション状態を解放する。

関連:

- [/tools/browser-linux-troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [/tools/browser](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の大半は、設定のドリフトか、より厳格なデフォルトが適用されるようになったことが原因です。

### 1) 認証とURL上書きの挙動が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認する点:

- `gateway.mode=remote` の場合、ローカルサービスが正常でもCLI呼び出しがリモートを向いていることがあります。
- 明示的な `--url` 呼び出しは、保存済み認証情報へフォールバックしません。

よくあるシグネチャ:

- `gateway connect failed:` → URL接続先が間違っている。
- `unauthorized` → エンドポイントには到達しているが認証が誤っている。

### 2) bindと認証のガードレールがより厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認する点:

- 非loopback bind（`lan`、`tailnet`、`custom`）には、有効なGateway認証経路が必要です: 共有トークン/パスワード認証、または正しく設定された非loopbackの `trusted-proxy` デプロイメント。
- `gateway.token` のような古いキーは、`gateway.auth.token` の代わりにはなりません。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効なGateway認証経路なしで非loopbackにバインドしている。
- ランタイムは動作中なのに `Connectivity probe: failed` → Gatewayは生きているが、現在の認証/URLではアクセスできない。

### 3) ペアリングとデバイスIDの状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認する点:

- dashboard/nodes向けの保留中デバイス承認
- ポリシーまたはID変更後の、保留中DMペアリング承認

よくあるシグネチャ:

- `device identity required` → デバイス認証が満たされていない。
- `pairing required` → 送信者/デバイスの承認が必要。

確認後もサービス設定とランタイムが一致しない場合は、同じprofile/stateディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/ja-JP/gateway/pairing)
- [/gateway/authentication](/ja-JP/gateway/authentication)
- [/gateway/background-process](/ja-JP/gateway/background-process)
