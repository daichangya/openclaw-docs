---
read_when:
    - 詳細な診断のために、トラブルシューティングハブからここに案内されました
    - 症状ベースで整理された、正確なコマンド付きの安定した手順書セクションが必要です
summary: Gateway、チャネル、自動化、Node、ブラウザ向けの詳細なトラブルシューティング手順書
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-24T08:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gatewayのトラブルシューティング

このページは詳細な手順書です。  
まずは高速なトリアージフローを使いたい場合は[/help/troubleshooting](/ja-JP/help/troubleshooting)から始めてください。

## コマンドの段階的確認

まず、次の順序で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status`に`Runtime: running`、`Connectivity probe: ok`、および`Capability: ...`行が表示される。
- `openclaw doctor`が、設定やサービスに関するブロッキングな問題なしと報告する。
- `openclaw channels status --probe`が、アカウントごとのライブなトランスポート状態と、サポートされている場合は`works`や`audit ok`のようなprobe/audit結果を表示する。

## 長いコンテキストに対してAnthropic 429で追加利用が必要

ログやエラーに次が含まれる場合に使用します:  
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認ポイント:

- 選択されたAnthropicのOpus/Sonnetモデルで`params.context1m: true`になっている。
- 現在のAnthropic認証情報が長いコンテキスト利用の対象ではない。
- 失敗するのが、1Mベータパスを必要とする長いセッションやモデル実行時だけである。

対処方法:

1. そのモデルの`context1m`を無効にして、通常のコンテキストウィンドウにフォールバックする。
2. 長いコンテキストリクエストに対応したAnthropic認証情報を使用するか、Anthropic APIキーに切り替える。
3. Anthropicの長いコンテキストリクエストが拒否されたときにも実行が継続するよう、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/ja-JP/providers/anthropic)
- [/reference/token-use](/ja-JP/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルのOpenAI互換バックエンドは直接probeでは通るが、エージェント実行は失敗する

次の場合に使用します:

- `curl ... /v1/models`は動作する
- 小さな直接の`/v1/chat/completions`呼び出しは動作する
- OpenClawのモデル実行が通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認ポイント:

- 小さな直接呼び出しは成功するが、OpenClawの実行は大きなプロンプトでのみ失敗する
- `messages[].content`が文字列であることを期待するバックエンドエラー
- より大きいプロンプトトークン数や完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化されたChat Completionsのcontent partsを拒否している。対処: `models.providers.<provider>.models[].compat.requiresStringContent: true`を設定する。
- 小さな直接リクエストは成功するが、OpenClawのエージェント実行はバックエンド/モデルのクラッシュで失敗する（例: 一部の`inferrs`ビルド上のGemma）→ OpenClawのトランスポートはすでに正しい可能性が高く、バックエンドがより大きいエージェントランタイムのプロンプト形状で失敗している。
- ツールを無効にすると失敗は減るが消えない → ツールスキーマが負荷の一部だったが、残っている問題は依然として上流のモデル/サーバー容量不足またはバックエンドバグである。

対処方法:

1. 文字列のみのChat Completionsバックエンドには`compat.requiresStringContent: true`を設定する。
2. OpenClawのツールスキーマ面を安定して処理できないモデル/バックエンドには`compat.supportsTools: false`を設定する。
3. 可能な範囲でプロンプト負荷を下げる: より小さいワークスペースブートストラップ、より短いセッション履歴、より軽量なローカルモデル、または長いコンテキスト対応がより強いバックエンドを使う。
4. 小さな直接リクエストが通り続ける一方で、OpenClawのエージェントターンが依然としてバックエンド内部でクラッシュする場合は、上流サーバー/モデルの制限として扱い、受理されたpayload shapeとともにそちらへ再現手順を報告する。

関連:

- [/gateway/local-models](/ja-JP/gateway/local-models)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャネルが起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認ポイント:

- DM送信者に対してペアリングが保留中である。
- グループでのメンション必須設定（`requireMention`、`mentionPatterns`）。
- チャネル/グループのallowlist不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションがあるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者またはチャネルがポリシーによってフィルタされた。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control UIの接続性

dashboard/control UIが接続できない場合は、URL、認証モード、セキュアコンテキスト前提を検証してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認ポイント:

- 正しいprobe URLとdashboard URL。
- クライアントとgateway間での認証モード/トークン不一致。
- デバイスIDが必要な場面でHTTPを使用している。

よくあるシグネチャ:

- `device identity required` → 非セキュアコンテキスト、またはデバイス認証がない。
- `origin not allowed` → ブラウザの`Origin`が`gateway.controlUi.allowedOrigins`に含まれていない（または、非loopbackのブラウザoriginから明示的allowlistなしで接続している）。
- `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったpayload（または古いタイムスタンプ）に署名している。
- `AUTH_TOKEN_MISMATCH`かつ`canRetryWithDeviceToken=true` → クライアントはキャッシュされたデバイストークンで1回だけ信頼済み再試行ができる。
- そのキャッシュトークン再試行では、ペア済みデバイストークンとともに保存されたキャッシュ済みスコープセットが再利用される。明示的な`deviceToken` / 明示的な`scopes`呼び出し元は、要求したスコープセットをそのまま保持する。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが先、次に明示的`deviceToken`、次に保存済みデバイストークン、最後にbootstrapトークン。
- 非同期のTailscale Serve Control UIパスでは、同じ`{scope, ip}`に対する失敗試行は、リミッターが失敗を記録する前に直列化される。したがって、同じクライアントからの不正な同時再試行2件では、2件とも通常の不一致になる代わりに、2件目で`retry later`が出ることがある。
- ブラウザoriginのloopbackクライアントからの`too many failed authentication attempts (retry later)` → 同じ正規化済み`Origin`からの繰り返し失敗は一時的にロックアウトされる。別のlocalhost originは別バケットを使う。
- その再試行後も`unauthorized`が続く → 共有トークン/デバイストークンのずれ。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションする。
- `gateway connect failed:` → host/port/urlの対象が誤っている。

### 認証詳細コードのクイック対応表

失敗した`connect`レスポンスの`error.details.code`を使って次の対応を決めてください。

| 詳細コード                   | 意味                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信していない。                                                                                                                        | クライアントにトークンを貼り付け/設定して再試行する。dashboard系では: `openclaw config get gateway.auth.token`を実行し、その値をControl UI設定に貼り付ける。                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンがgateway認証トークンと一致しなかった。                                                                                                                       | `canRetryWithDeviceToken=true`なら、信頼済み再試行を1回許可する。キャッシュトークン再試行では保存済み承認スコープが再利用される。明示的な`deviceToken` / `scopes`呼び出し元は要求スコープを保持する。それでも失敗するなら、[token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュされたデバイスごとのトークンが古いか失効している。                                                                                                               | [devices CLI](/ja-JP/cli/devices)を使ってデバイストークンをローテーション/再承認してから再接続する。                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | デバイスIDに承認が必要。`error.details.reason`で`not-paired`、`scope-upgrade`、`role-upgrade`、`metadata-upgrade`を確認し、存在する場合は`requestId` / `remediationHint`を使う。 | 保留中リクエストを承認する: `openclaw devices list`を実行し、その後`openclaw devices approve <requestId>`を実行する。スコープ/ロールのアップグレードも、要求されたアクセスを確認したうえで同じフローを使う。                                                                      |

device auth v2移行確認:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログにnonce/signatureエラーが出る場合は、接続側クライアントを更新し、次を確認してください。

1. `connect.challenge`を待機する
2. challengeに束縛されたpayloadへ署名する
3. 同じchallenge nonceで`connect.params.device.nonce`を送信する

`openclaw devices rotate` / `revoke` / `remove`が予期せず拒否される場合:

- ペア済みデバイストークンセッションは、呼び出し元が`operator.admin`も持っていない限り、**自分自身の**デバイスしか管理できない
- `openclaw devices rotate --scope ...`は、呼び出し元セッションがすでに保持しているoperatorスコープのみ要求できる

関連:

- [/web/control-ui](/ja-JP/web/control-ui)
- [/gateway/configuration](/ja-JP/gateway/configuration)（gateway認証モード）
- [/gateway/trusted-proxy-auth](/ja-JP/gateway/trusted-proxy-auth)
- [/gateway/remote](/ja-JP/gateway/remote)
- [/cli/devices](/ja-JP/cli/devices)

## Gatewayサービスが動作していない

サービスはインストールされているが、プロセスが起動し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # システムレベルのサービスもスキャン
```

確認ポイント:

- 終了のヒント付きで`Runtime: stopped`になっている。
- サービス設定の不一致（`Config (cli)`と`Config (service)`）。
- ポート/リスナー競合。
- `--deep`使用時に、余分なlaunchd/systemd/schtasksインストールがある。
- `Other gateway-like services detected (best effort)`のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカルGatewayモードが有効になっていないか、設定ファイルが壊れて`gateway.mode`が失われています。対処: 設定で`gateway.mode="local"`を設定するか、`openclaw onboard --mode local`または`openclaw setup`を再実行して、想定されるローカルモード設定を再作成してください。Podman経由でOpenClawを実行している場合、デフォルトの設定パスは`~/.openclaw/openclaw.json`です。
- `refusing to bind gateway ... without auth` → 有効なgateway認証経路（token/password、または設定済みのtrusted-proxy）がない状態で、非loopback bindを行おうとしています。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
- `Other gateway-like services detected (best effort)` → 古い、または並行するlaunchd/systemd/schtasksユニットが存在します。ほとんどの構成では、1台のマシンにつき1つのGatewayにするべきです。複数必要な場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)を参照してください。

関連:

- [/gateway/background-process](/ja-JP/gateway/background-process)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gatewayがlast-known-good設定を復元した

Gatewayは起動するものの、ログに`openclaw.json`を復元したと出る場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認ポイント:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな設定の横にタイムスタンプ付きの`openclaw.json.clobbered.*`ファイルがある
- `Config recovery warning`で始まるメインエージェントのシステムイベントがある

起きたこと:

- 拒否された設定が、起動時またはホットリロード時の検証を通らなかった。
- OpenClawは拒否されたpayloadを`.clobbered.*`として保存した。
- アクティブな設定は、最後に検証済みだったlast-known-goodのコピーから復元された。
- 次回のメインエージェントターンでは、拒否された設定を無条件に書き直さないよう警告される。

確認と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*`が存在する → 外部からの直接編集、または起動時の読み込み内容が復元された。
- `.rejected.*`が存在する → OpenClaw自身による設定書き込みが、コミット前にスキーマまたはclobberチェックに失敗した。
- `Config write rejected:` → 必須のshapeを落とす、ファイルサイズを大きく縮小する、または無効な設定を永続化しようとした。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または`size-drop-vs-last-good:*` → 起動時に、last-known-goodバックアップと比べてフィールドやサイズが失われていたため、現在のファイルを破損済みとして扱った。
- `Config last-known-good promotion skipped` → 候補に`***`のような秘匿済みシークレットプレースホルダーが含まれていた。

対処方法:

1. 復元されたアクティブ設定が正しいなら、そのまま使う。
2. `.clobbered.*`または`.rejected.*`から意図したキーだけをコピーし、`openclaw config set`または`config.patch`で適用する。
3. 再起動前に`openclaw config validate`を実行する。
4. 手動編集する場合は、変更したい部分オブジェクトだけでなく、JSON5設定全体を保つ。

関連:

- [/gateway/configuration#strict-validation](/ja-JP/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ja-JP/gateway/configuration#config-hot-reload)
- [/cli/config](/ja-JP/cli/config)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway probe警告

`openclaw gateway probe`が何かに到達しているものの、なお警告ブロックを表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認ポイント:

- JSON出力内の`warnings[].code`と`primaryTargetId`。
- 警告がSSHフォールバック、複数Gateway、不足スコープ、または未解決の認証参照に関するものかどうか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH設定に失敗したが、コマンドは設定済みまたはloopbackの対象へ直接probeを試みた。
- `multiple reachable gateways detected` → 複数の対象が応答した。通常は意図した複数Gateway構成か、古い/重複リスナーがあることを意味する。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続自体は成功したが、詳細RPCはスコープ制限を受けている。デバイスIDをペアリングするか、`operator.read`を持つ認証情報を使用する。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gatewayは応答したが、このクライアントは通常のoperatorアクセス前にまだペアリング/承認が必要。
- 未解決の`gateway.auth.*` / `gateway.remote.*` SecretRef警告文 → 失敗した対象に対するこのコマンド経路では認証情報が利用できなかった。

関連:

- [/cli/gateway](/ja-JP/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ja-JP/gateway/remote)

## チャネルは接続済みだがメッセージが流れない

チャネル状態は接続済みなのにメッセージフローが止まっている場合は、ポリシー、権限、チャネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認ポイント:

- DMポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループallowlistとメンション必須設定。
- 不足しているチャネルAPI権限/スコープ。

よくあるシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 保留中承認のトレース → 送信者が未承認。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャネル認証/権限の問題。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## CronとHeartbeatの配信

CronまたはHeartbeatが実行されなかった、または配信されなかった場合は、まずスケジューラー状態を確認し、その後配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認ポイント:

- Cronが有効で、次回起動時刻がある。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeatのスキップ理由（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → Cronが無効。
- `cron: timer tick failed` → スケジューラーのtickに失敗。ファイル/ログ/ランタイムエラーを確認する。
- `heartbeat skipped` かつ `reason=quiet-hours` → アクティブ時間帯の外。
- `heartbeat skipped` かつ `reason=empty-heartbeat-file` → `HEARTBEAT.md`は存在するが、空行またはMarkdown見出ししか含まれていないため、OpenClawがモデル呼び出しをスキップしている。
- `heartbeat skipped` かつ `reason=no-tasks-due` → `HEARTBEAT.md`に`tasks:`ブロックはあるが、このtick時点で期限が来ているタスクがない。
- `heartbeat: unknown accountId` → Heartbeat配信先のaccount idが無効。
- `heartbeat skipped` かつ `reason=dm-blocked` → Heartbeat対象がDM形式の宛先に解決された一方で、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が`block`に設定されている。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/ja-JP/gateway/heartbeat)

## Nodeのペア済みツールが失敗する

Nodeはペア済みだがツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認ポイント:

- Nodeがオンラインで、期待される機能を持っている。
- カメラ/マイク/位置情報/画面に対するOS権限が付与されている。
- exec承認とallowlist状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Nodeアプリがフォアグラウンドにある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドがallowlistでブロックされた。

関連:

- [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)
- [/nodes/index](/ja-JP/nodes/index)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)

## ブラウザツールが失敗する

Gateway自体は正常なのにブラウザツールの操作が失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- `plugins.allow`が設定されていて、`browser`を含んでいるかどうか。
- 有効なブラウザ実行ファイルパス。
- CDPプロファイルに到達可能かどうか。
- `existing-session` / `user`プロファイル用のローカルChromeが利用可能かどうか。

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → 同梱のbrowser Pluginが`plugins.allow`によって除外されています。
- `browser`ツールが見つからない / 利用不可なのに`browser.enabled=true` → `plugins.allow`が`browser`を除外しているため、Pluginが読み込まれていません。
- `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
- `browser.executablePath not found` → 設定されたパスが無効です。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定されたCDP URLが`file:`や`ftp:`のような未対応スキームを使っています。
- `browser.cdpUrl has invalid port` → 設定されたCDP URLのポートが不正、または範囲外です。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-sessionが、選択したブラウザデータディレクトリへまだ接続できません。ブラウザのinspectページを開き、remote debuggingを有効にし、ブラウザを開いたままにして、最初の接続プロンプトを承認してから再試行してください。サインイン状態が不要なら、管理対象の`openclaw`プロファイルを優先してください。
- `No Chrome tabs found for profile="user"` → Chrome MCPのattachプロファイルに、開いているローカルChromeタブがありません。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモートCDPエンドポイントへGatewayホストから到達できません。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-onlyプロファイルに到達可能な対象がないか、HTTPエンドポイントは応答してもCDP WebSocketをまだ開けませんでした。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在のGatewayインストールには、同梱browser Pluginの`playwright-core`ランタイム依存関係がありません。`openclaw doctor --fix`を実行し、その後Gatewayを再起動してください。ARIAスナップショットと基本的なページスクリーンショットは引き続き使えますが、ナビゲーション、AIスナップショット、CSSセレクターによる要素スクリーンショット、PDFエクスポートは利用できないままです。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で`--full-page`と`--ref`または`--element`を混在させています。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session`のスクリーンショット呼び出しでは、CSSの`--element`ではなく、ページキャプチャまたはスナップショットの`--ref`を使う必要があります。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCPのアップロードフックでは、CSSセレクターではなくスナップショット参照を使う必要があります。
- `existing-session file uploads currently support one file at a time.` → Chrome MCPプロファイルでは、1回の呼び出しにつき1ファイルずつアップロードしてください。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCPプロファイルのダイアログフックでは、timeout上書きはサポートされていません。
- `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-sessionプロファイルで`act:type`に対して`timeoutMs`を指定しないでください。カスタムtimeoutが必要な場合は、管理対象またはCDPブラウザプロファイルを使ってください。
- `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-sessionプロファイルで`act:evaluate`に対して`timeoutMs`を指定しないでください。カスタムtimeoutが必要な場合は、管理対象またはCDPブラウザプロファイルを使ってください。
- `response body is not supported for existing-session profiles yet.` → `responsebody`は、現時点では管理対象ブラウザまたは生のCDPプロファイルが必要です。
- attach-onlyまたはリモートCDPプロファイルでviewport / dark-mode / locale / offline上書きが古いまま残る → `openclaw browser stop --browser-profile <name>`を実行して、Gateway全体を再起動せずに、アクティブな制御セッションを閉じてPlaywright/CDPのエミュレーション状態を解放してください。

関連:

- [/tools/browser-linux-troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [/tools/browser](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、設定のずれか、より厳格になったデフォルト設定が適用されたことが原因です。

### 1) 認証とURL上書きの挙動が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認すること:

- `gateway.mode=remote`の場合、CLI呼び出しはリモートを対象にしている可能性があり、ローカルサービス自体は正常かもしれません。
- 明示的な`--url`呼び出しは、保存済み認証情報へフォールバックしません。

よくあるシグネチャ:

- `gateway connect failed:` → URLの対象が誤っている。
- `unauthorized` → エンドポイントには到達しているが認証が誤っている。

### 2) bindと認証のガードレールが厳格化された

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認すること:

- 非loopback bind（`lan`、`tailnet`、`custom`）には、有効なgateway認証経路が必要です。共有token/password認証、または正しく設定された非loopbackの`trusted-proxy`デプロイを使ってください。
- `gateway.token`のような古いキーは、`gateway.auth.token`の代わりにはなりません。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効なgateway認証経路なしで非loopback bindを行おうとしている。
- `Connectivity probe: failed`なのにruntimeは動作中 → Gatewayは生きているが、現在の認証/URLでは到達できない。

### 3) ペアリングとデバイスID状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認すること:

- dashboard/nodes向けに保留中のデバイス承認がある。
- ポリシーまたはID変更後に、DMペアリング承認が保留中になっている。

よくあるシグネチャ:

- `device identity required` → デバイス認証要件が満たされていない。
- `pairing required` → 送信者/デバイスの承認が必要。

確認後もサービス設定とruntimeの不一致が続く場合は、同じprofile/stateディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/ja-JP/gateway/pairing)
- [/gateway/authentication](/ja-JP/gateway/authentication)
- [/gateway/background-process](/ja-JP/gateway/background-process)

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
