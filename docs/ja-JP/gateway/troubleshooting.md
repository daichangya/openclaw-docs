---
read_when:
    - より詳細な診断のためにトラブルシューティングハブからここに案内された場合
    - 正確なコマンド付きの、安定した症状ベースのランブックセクションが必要な場合
summary: gateway、channels、automation、nodes、browser向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-05T12:46:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gatewayのトラブルシューティング

このページは詳細ランブックです。
まず素早いトリアージフローを確認したい場合は、[/help/troubleshooting](/help/troubleshooting)から始めてください。

## コマンドの段階的確認

まず次をこの順序で実行してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status`に`Runtime: running`と`RPC probe: ok`が表示される。
- `openclaw doctor`が、設定/サービスに関するブロッキングな問題なしと報告する。
- `openclaw channels status --probe`に、アカウントごとのライブ転送状態と、サポートされる場合は`works`や`audit ok`などのprobe/audit結果が表示される。

## 長いコンテキストでAnthropic 429のextra usageが必要

ログ/エラーに次が含まれる場合はこれを使用します:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認ポイント:

- 選択されたAnthropic Opus/Sonnetモデルに`params.context1m: true`がある。
- 現在のAnthropic認証情報が長いコンテキスト利用の対象になっていない。
- リクエストが失敗するのは、1Mベータパスが必要な長いセッション/モデル実行時のみ。

修正方法:

1. そのモデルの`context1m`を無効にして、通常のコンテキストウィンドウにフォールバックする。
2. 課金付きのAnthropic APIキーを使うか、Anthropic OAuth/subscriptionアカウントでAnthropic Extra Usageを有効にする。
3. Anthropicの長いコンテキストリクエストが拒否されたときに実行が継続するよう、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 応答がない

channelsは稼働しているのに何も応答しない場合、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認ポイント:

- DM送信者のペアリングが保留中。
- グループでのメンション制御（`requireMention`、`mentionPatterns`）。
- channel/group allowlistの不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションがあるまでグループメッセージは無視される。
- `pairing request` → 送信者には承認が必要。
- `blocked` / `allowlist` → 送信者/channelがポリシーでフィルタリングされた。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control ui接続

dashboard/control UIが接続しない場合、URL、認証モード、およびセキュアコンテキスト前提を検証してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認ポイント:

- 正しいprobe URLとdashboard URL。
- クライアントとgatewayの間で認証モード/トークンが一致している。
- デバイスIDが必要な場面でHTTPを使っている。

よくあるシグネチャ:

- `device identity required` → 非セキュアコンテキスト、またはデバイス認証不足。
- `origin not allowed` → ブラウザーの`Origin`が`gateway.controlUi.allowedOrigins`に入っていない
  （または、明示的なallowlistなしで非loopbackのブラウザーoriginから接続している）。
- `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名した。
- `AUTH_TOKEN_MISMATCH`と`canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済みの1回の再試行が可能。
- そのキャッシュトークン再試行では、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープ集合を再利用する。明示的な`deviceToken` / 明示的な`scopes`呼び出し元は、要求したスコープ集合を保持する。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有
  token/passwordが先、次に明示的な`deviceToken`、次に保存済みデバイストークン、次にbootstrap token。
- 非同期のTailscale Serve Control UIパスでは、同じ`{scope, ip}`に対する失敗した試行は、limiterが失敗を記録する前に直列化される。そのため、同じクライアントからの2つの不正な同時再試行では、2回とも単純な不一致ではなく、2回目で`retry later`が出ることがある。
- ブラウザーoriginのloopbackクライアントからの`too many failed authentication attempts (retry later)` → その同じ正規化された`Origin`からの繰り返し失敗は一時的にロックアウトされる。別のlocalhost originは別バケットを使う。
- その再試行後も繰り返し`unauthorized` → 共有トークン/デバイストークンのドリフト。トークン設定を更新し、必要ならデバイストークンを再承認/ローテーションする。
- `gateway connect failed:` → ホスト/ポート/urlターゲットが誤っている。

### 認証詳細コードのクイックマップ

失敗した`connect`レスポンスの`error.details.code`を使って次の対応を選んでください:

| Detail code | 意味 | 推奨対応 |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | クライアントが必要な共有トークンを送信しなかった。 | クライアントにトークンを貼り付け/設定して再試行してください。dashboardパスでは: `openclaw config get gateway.auth.token`を実行して、Control UI設定に貼り付けます。 |
| `AUTH_TOKEN_MISMATCH` | 共有トークンがgateway認証トークンと一致しなかった。 | `canRetryWithDeviceToken=true`なら、信頼済みの1回の再試行を許可してください。キャッシュトークン再試行は保存済みの承認済みスコープを再利用します。明示的な`deviceToken` / `scopes`呼び出し元は要求したスコープを保持します。まだ失敗する場合は、[token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)を実行してください。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古いか失効している。 | [devices CLI](/cli/devices)を使ってデバイストークンをローテーション/再承認し、その後再接続してください。 |
| `PAIRING_REQUIRED` | デバイスIDは認識されているが、このロールでは承認されていない。 | 保留中の要求を承認します: `openclaw devices list`の後に`openclaw devices approve <requestId>`。 |

デバイス認証v2移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログにnonce/signatureエラーが出る場合は、接続側クライアントを更新し、次を確認してください:

1. `connect.challenge`を待つ
2. チャレンジに束縛されたペイロードに署名する
3. 同じチャレンジnonceとともに`connect.params.device.nonce`を送る

`openclaw devices rotate` / `revoke` / `remove`が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が
  `operator.admin`も持っていない限り、**自分自身の**デバイスしか管理できない
- `openclaw devices rotate --scope ...`は、呼び出し元セッションがすでに保持しているoperatorスコープしか要求できない

関連:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration)（gateway認証モード）
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gatewayサービスが動作していない

サービスはインストールされているが、プロセスが起動したままにならない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # システムレベルサービスもスキャン
```

確認ポイント:

- 終了ヒント付きの`Runtime: stopped`。
- サービス設定の不一致（`Config (cli)`対`Config (service)`）。
- ポート/listener競合。
- `--deep`使用時の追加のlaunchd/systemd/schtasksインストール。
- `Other gateway-like services detected (best effort)`のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local`または`existing config is missing gateway.mode` → local gateway modeが有効でないか、設定ファイルが壊れて`gateway.mode`が失われた。修正: 設定で`gateway.mode="local"`を設定するか、`openclaw onboard --mode local` / `openclaw setup`を再実行して期待されるlocal-mode設定を書き戻す。OpenClawをPodman経由で実行している場合、デフォルトの設定パスは`~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 有効なgateway認証パス（token/password、または設定済みのtrusted-proxy）がない非loopback bind。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
- `Other gateway-like services detected (best effort)` → 古い、または並行するlaunchd/systemd/schtasksユニットが存在する。ほとんどの構成では、1台のマシンにつき1つのgatewayにするべきです。複数必要な場合は、ポート + config/state/workspaceを分離してください。[/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)を参照してください。

関連:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Gateway probe警告

`openclaw gateway probe`が何かに到達しているのに、警告ブロックも表示される場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認ポイント:

- JSON出力の`warnings[].code`と`primaryTargetId`。
- 警告がSSHフォールバック、複数gateway、スコープ不足、または未解決認証refに関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSHセットアップが失敗したが、コマンドは引き続き構成済み/loopbackターゲットへの直接probeを試した。
- `multiple reachable gateways detected` → 複数のターゲットが応答した。通常、これは意図的なマルチgateway構成か、古い/重複listenerを意味する。
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功したが、詳細RPCはスコープ制限されている。デバイスIDをペアリングするか、`operator.read`付き認証情報を使用する。
- 未解決の`gateway.auth.*` / `gateway.remote.*` SecretRef警告テキスト → 失敗したターゲットに対して、このコマンドパスでは認証情報が利用できなかった。

関連:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Channelは接続済みだがメッセージが流れない

channel状態は接続済みなのにメッセージフローが止まっている場合、ポリシー、権限、channel固有の配信ルールに集中してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認ポイント:

- DMポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループallowlistとメンション要件。
- channel APIの権限/スコープ不足。

よくあるシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視される。
- `pairing` / 保留中の承認トレース → 送信者が承認されていない。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → channel認証/権限の問題。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## Cronとheartbeatの配信

cronやheartbeatが実行されなかった、または配信されなかった場合、まずスケジューラー状態を確認し、その後配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認ポイント:

- cronが有効で、次回wakeが存在する。
- ジョブ実行履歴ステータス（`ok`、`skipped`、`error`）。
- heartbeatスキップ理由（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → cronが無効。
- `cron: timer tick failed` → スケジューラーのtick失敗。ファイル/ログ/ランタイムエラーを確認してください。
- `heartbeat skipped`で`reason=quiet-hours` → アクティブ時間帯の外。
- `heartbeat skipped`で`reason=empty-heartbeat-file` → `HEARTBEAT.md`は存在するが、空行 / markdownヘッダーしか含まれていないため、OpenClawはモデル呼び出しをスキップする。
- `heartbeat skipped`で`reason=no-tasks-due` → `HEARTBEAT.md`に`tasks:`ブロックはあるが、このtick時点ではどのタスクも期限になっていない。
- `heartbeat: unknown accountId` → heartbeat配信先のaccount idが無効。
- `heartbeat skipped`で`reason=dm-blocked` → heartbeatターゲットがDM形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはagentごとの上書き）が`block`に設定されている。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Nodeはペアリング済みだがtoolが失敗する

nodeがペアリング済みなのにtoolが失敗する場合、フォアグラウンド、権限、承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認ポイント:

- nodeがオンラインで、期待される機能を持っている。
- カメラ/マイク/位置情報/画面に対するOS権限が付与されている。
- exec承認とallowlist状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → node appはフォアグラウンドにある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS権限不足。
- `SYSTEM_RUN_DENIED: approval required` → exec承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドがallowlistでブロックされた。

関連:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Browser toolが失敗する

gateway自体は正常なのにbrowser toolの操作が失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- `plugins.allow`が設定されており、`browser`を含んでいるか。
- 有効なブラウザー実行ファイルパス。
- CDPプロファイルへの到達可能性。
- `existing-session` / `user`プロファイル向けのローカルChromeの可用性。

よくあるシグネチャ:

- `unknown command "browser"`または`unknown command 'browser'` → バンドル済みbrowser pluginが`plugins.allow`により除外されている。
- `browser.enabled=true`なのにbrowser toolがない / 利用不可 → `plugins.allow`が`browser`を除外しているため、pluginが読み込まれていない。
- `Failed to start Chrome CDP on port` → ブラウザープロセスの起動に失敗した。
- `browser.executablePath not found` → 設定されたパスが無効。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定されたCDP URLが`file:`や`ftp:`のような未対応スキームを使っている。
- `browser.cdpUrl has invalid port` → 設定されたCDP URLのポートが不正または範囲外。
- `No Chrome tabs found for profile="user"` → Chrome MCPアタッチプロファイルにローカルのChromeタブが開かれていない。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモートCDPエンドポイントにgateway hostから到達できない。
- `Browser attachOnly is enabled ... not reachable`または`Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-onlyプロファイルに到達可能なターゲットがない、またはHTTPエンドポイントは応答したがCDP WebSocketを開けなかった。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在のgatewayインストールに完全なPlaywrightパッケージがない。ARIAスナップショットと基本的なページスクリーンショットは引き続き動作するが、ナビゲーション、AIスナップショット、CSSセレクターによる要素スクリーンショット、PDFエクスポートは引き続き利用不可。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で`--full-page`と`--ref`または`--element`を混在させている。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session`のスクリーンショット呼び出しでは、CSSの`--element`ではなく、ページキャプチャまたはスナップショットの`--ref`を使う必要がある。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCPのアップロードフックにはCSSセレクターではなくスナップショットrefが必要。
- `existing-session file uploads currently support one file at a time.` → Chrome MCPプロファイルでは1回の呼び出しにつき1ファイルずつアップロードする。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCPプロファイル上のダイアログフックではtimeoutの上書きはサポートされない。
- `response body is not supported for existing-session profiles yet.` → `responsebody`には引き続き管理対象ブラウザーまたは生のCDPプロファイルが必要。
- attach-onlyまたはremote CDPプロファイルで古いviewport / dark-mode / locale / offline上書きが残っている → `openclaw browser stop --browser-profile <name>`を実行し、ゲートウェイ全体を再起動せずにアクティブな制御セッションを閉じてPlaywright/CDPエミュレーション状態を解放する。

関連:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の障害の多くは、設定ドリフトか、より厳格なデフォルトの適用です。

### 1) 認証とURL上書き動作が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認内容:

- `gateway.mode=remote`なら、ローカルサービスが正常でもCLI呼び出しはremoteを対象にしている可能性がある。
- 明示的な`--url`呼び出しは保存済み認証情報にフォールバックしない。

よくあるシグネチャ:

- `gateway connect failed:` → URLターゲットが誤っている。
- `unauthorized` → エンドポイントには到達できているが認証が誤っている。

### 2) Bindと認証のガードレールがより厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認内容:

- 非loopback bind（`lan`、`tailnet`、`custom`）には、有効なgateway認証パスが必要: 共有token/password認証、または正しく設定された非loopback `trusted-proxy`デプロイ。
- `gateway.token`のような古いキーは`gateway.auth.token`の代わりにはならない。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効なgateway認証パスがない非loopback bind。
- `RPC probe: failed`なのにruntimeはrunning → gatewayは生きているが現在の認証/urlでは到達できない。

### 3) PairingとデバイスID状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認内容:

- dashboard/nodes向けの保留中デバイス承認。
- ポリシーまたはID変更後の保留中DMペアリング承認。

よくあるシグネチャ:

- `device identity required` → デバイス認証が満たされていない。
- `pairing required` → 送信者/デバイスには承認が必要。

確認後もサービス設定とランタイムが一致しない場合は、同じprofile/state directoryからサービスメタデータを再インストールしてください:

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
