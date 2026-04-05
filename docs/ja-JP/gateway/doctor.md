---
read_when:
    - doctorの移行処理を追加または変更する場合
    - 破壊的な設定変更を導入する場合
summary: 'Doctorコマンド: ヘルスチェック、設定移行、修復手順'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T12:44:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`は、OpenClawの修復 + 移行ツールです。古い設定/状態を修正し、ヘルスチェックを行い、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトなしでデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックス修復手順を含む）。

```bash
openclaw doctor --repair
```

推奨される修復をプロンプトなしで適用します（安全な範囲で修復 + 再起動）。

```bash
openclaw doctor --repair --force
```

積極的な修復も適用します（カスタムsupervisor設定を上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態の移動）。人による確認が必要な再起動/サービス/サンドボックス操作はスキップします。
古い状態の移行は、検出されると自動的に実行されます。

```bash
openclaw doctor --deep
```

追加のgatewayインストールがないかシステムサービスをスキャンします（launchd/systemd/schtasks）。

書き込む前に変更を確認したい場合は、まず設定ファイルを開いてください:

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

- gitインストール向けの任意の事前更新（対話モードのみ）。
- UIプロトコル鮮度チェック（プロトコルスキーマが新しい場合はControl UIを再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skills状態サマリー（対象/不足/ブロック）とプラグイン状態。
- 古い値に対する設定の正規化。
- 古いフラットな`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk設定移行。
- 古いChrome拡張機能設定とChrome MCP準備状況に対するブラウザー移行チェック。
- OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- OpenAI Codex OAuthプロファイル向けOAuth TLS前提条件チェック。
- 古いディスク上状態の移行（セッション/agent dir/WhatsApp認証）。
- 古いプラグインマニフェスト契約キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 古いcronストア移行（`jobId`、`schedule.cron`、トップレベルdelivery/payloadフィールド、payloadの`provider`、単純な`notify: true`のWebhookフォールバックジョブ）。
- セッションロックファイルの検査と古いロックのクリーンアップ。
- 状態の整合性と権限チェック（sessions、transcripts、state dir）。
- ローカル実行時の設定ファイル権限チェック（chmod 600）。
- モデル認証ヘルス: OAuth期限切れをチェックし、期限切れ間近のトークンを更新でき、認証プロファイルのクールダウン/無効化状態を報告します。
- 追加のworkspace dir検出（`~/openclaw`）。
- サンドボックス有効時のサンドボックスイメージ修復。
- 古いサービス移行と追加gateway検出。
- Matrixチャンネルの古い状態移行（`--fix` / `--repair`モード）。
- Gatewayランタイムチェック（サービスはインストール済みだが未実行、キャッシュされたlaunchdラベル）。
- チャンネル状態警告（実行中のgatewayからプローブ）。
- Supervisor設定監査（launchd/systemd/schtasks）と任意の修復。
- Gatewayランタイムのベストプラクティスチェック（Node対Bun、バージョンマネージャーパス）。
- Gatewayポート競合診断（デフォルト`18789`）。
- 開いたDMポリシーに対するセキュリティ警告。
- ローカルトークンモード向けGateway認証チェック（トークンソースが存在しない場合はトークン生成を提案。トークンSecretRef設定は上書きしません）。
- Linuxでのsystemd lingerチェック。
- Workspace bootstrapファイルサイズチェック（コンテキストファイルの切り詰め/上限近接警告）。
- シェル補完状態チェックと自動インストール/アップグレード。
- メモリ検索の埋め込みプロバイダー準備状況チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
- ソースインストールチェック（pnpm workspace不一致、欠落したUIアセット、欠落したtsxバイナリ）。
- 更新済み設定 + wizardメタデータを書き込み。

## 詳細な動作と根拠

### 0) 任意の更新（gitインストール）

これがgitチェックアウトで、doctorが対話モードで実行されている場合、doctor実行前に更新（fetch/rebase/build）を提案します。

### 1) 設定の正規化

設定に古い値の形状が含まれている場合（たとえばチャンネル別オーバーライドのない`messages.ackReaction`）、doctorはそれを現在のスキーマに正規化します。

これには古いTalkフラットフィールドも含まれます。現在の公開Talk設定は`talk.provider` + `talk.providers.<provider>`です。doctorは古い`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey`の形状をプロバイダーマップへ書き換えます。

### 2) 古い設定キーの移行

設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor`の実行を求めます。

Doctorは次を行います:

- 見つかった古いキーを説明する。
- 適用した移行を表示する。
- 更新されたスキーマで`~/.openclaw/openclaw.json`を書き換える。

Gatewayも、古い設定形式を検出すると起動時にdoctor移行を自動実行するため、古い設定は手動介入なしで修復されます。
cronジョブストアの移行は`openclaw doctor --fix`で処理されます。

現在の移行:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベルの`bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- 古い`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 名前付き`accounts`を持つチャンネルで、なおも単一アカウント用のトップレベルチャンネル値が残っている場合、そのアカウントスコープ値を、そのチャンネル向けに昇格されたアカウントへ移動する（大半のチャンネルでは`accounts.default`、Matrixでは既存の一致する名前付き/デフォルト対象を保持できる）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost`を削除（古い拡張機能relay設定）

Doctorの警告には、マルチアカウントチャンネル向けのデフォルトアカウント案内も含まれます:

- `channels.<channel>.defaultAccount`または`accounts.default`なしで`channels.<channel>.accounts`エントリが2つ以上設定されている場合、doctorはフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
- `channels.<channel>.defaultAccount`が未知のアカウントIDに設定されている場合、doctorは警告し、設定済みアカウントIDを一覧表示します。

### 2b) OpenCodeプロバイダー上書き

`models.providers.opencode`、`opencode-zen`、または`opencode-go`を手動で追加すると、`@mariozechner/pi-ai`の組み込みOpenCodeカタログを上書きします。
これにより、モデルが誤ったAPIへ強制されたり、コストがゼロ化されたりする可能性があります。doctorは、上書きを削除してモデルごとのAPIルーティング + コストを復元できるよう警告します。

### 2c) ブラウザー移行とChrome MCP準備状況

ブラウザー設定がまだ削除済みのChrome拡張機能パスを指している場合、doctorはそれを現在のホストローカルChrome MCPアタッチモデルに正規化します:

- `browser.profiles.*.driver: "extension"`は`"existing-session"`になります
- `browser.relayBindHost`は削除されます

また、`defaultProfile: "user"`または設定済みの`existing-session`プロファイルを使用している場合、doctorはホストローカルChrome MCPパスを監査します:

- デフォルトの自動接続プロファイル向けに、同じホストにGoogle Chromeがインストールされているか確認する
- 検出されたChromeバージョンを確認し、Chrome 144未満の場合は警告する
- ブラウザーinspectページでリモートデバッグを有効にするよう案内する
  （たとえば`chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、
  または`edge://inspect/#remote-debugging`）

DoctorはChrome側設定を代わりに有効化することはできません。ホストローカルChrome MCPには引き続き次が必要です:

- gateway/node host上の144+のChromium系ブラウザー
- ブラウザーがローカルで実行中であること
- そのブラウザーでリモートデバッグが有効であること
- ブラウザー内の最初のアタッチ同意プロンプトを承認すること

ここでの準備状況はローカルアタッチ前提条件に限られます。existing-sessionは現在のChrome MCPルート制限を維持します。`responsebody`、PDFエクスポート、ダウンロード傍受、バッチ操作のような高度なルートには、引き続き管理対象ブラウザーまたは生のCDPプロファイルが必要です。

このチェックは、Docker、sandbox、remote-browser、その他のヘッドレスフローには**適用されません**。それらは引き続き生のCDPを使用します。

### 2d) OAuth TLS前提条件

OpenAI Codex OAuthプロファイルが設定されている場合、doctorはOpenAI認証エンドポイントをプローブし、ローカルのNode/OpenSSL TLSスタックが証明書チェーンを検証できることを確認します。証明書エラー（たとえば`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）でプローブが失敗した場合、doctorはプラットフォーム別の修正案内を表示します。macOSでHomebrew版Nodeを使っている場合、通常の修正は`brew postinstall ca-certificates`です。`--deep`では、gatewayが健全でもこのプローブを実行します。

### 3) 古い状態の移行（ディスクレイアウト）

Doctorは、古いディスク上レイアウトを現在の構造へ移行できます:

- セッションストア + トランスクリプト:
  - `~/.openclaw/sessions/`から`~/.openclaw/agents/<agentId>/sessions/`へ
- Agent dir:
  - `~/.openclaw/agent/`から`~/.openclaw/agents/<agentId>/agent/`へ
- WhatsApp認証状態（Baileys）:
  - 古い`~/.openclaw/credentials/*.json`（`oauth.json`を除く）から
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`へ（デフォルトアカウントid: `default`）

これらの移行はベストエフォートかつ冪等です。doctorは、バックアップとして古いフォルダーが残っている場合に警告を出します。Gateway/CLIも、起動時に古いsessions + agent dirを自動移行するため、履歴/認証/モデルは手動doctor実行なしでエージェントごとのパスへ配置されます。WhatsApp認証は意図的に`openclaw doctor`経由でのみ移行されます。Talk provider/provider-map正規化は現在、構造的等価性で比較するため、キー順のみの差分では無操作の`doctor --fix`変更が繰り返し発生しなくなりました。

### 3a) 古いプラグインマニフェスト移行

Doctorは、インストール済みのすべてのプラグインマニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を検出します。見つかった場合、それらを`contracts`オブジェクトへ移動し、その場でマニフェストファイルを書き換えることを提案します。この移行は冪等であり、`contracts`キーにすでに同じ値がある場合は、データを重複させずに古いキーを削除します。

### 3b) 古いcronストア移行

Doctorは、cronジョブストア（デフォルトでは`~/.openclaw/cron/jobs.json`、または上書き時は`cron.store`）についても、スケジューラーが互換性のためにまだ受け入れている古いジョブ形状を確認します。

現在のcronクリーンアップ内容:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルpayloadフィールド（`message`、`model`、`thinking`、...）→ `payload`
- トップレベルdeliveryフィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payloadの`provider` deliveryエイリアス → 明示的な`delivery.channel`
- 単純な古い`notify: true`のWebhookフォールバックジョブ → 明示的な`delivery.mode="webhook"`と`delivery.to=cron.webhook`

Doctorは、動作を変えずに移行できる場合にのみ、`notify: true`ジョブを自動移行します。ジョブが古いnotifyフォールバックと既存の非Webhook配信モードを組み合わせている場合、doctorは警告し、そのジョブは手動レビュー用に残します。

### 3c) セッションロックのクリーンアップ

Doctorは、各agentセッションディレクトリをスキャンして、古い書き込みロックファイルを探します。これらはセッションが異常終了したときに残されるファイルです。見つかった各ロックファイルについて、次を報告します:
パス、PID、そのPIDがまだ生きているか、ロックの経過時間、および古いと見なされるかどうか（PIDが死んでいる、または30分超）。`--fix` / `--repair`モードでは、古いロックファイルを自動削除します。それ以外では、注記を表示し、`--fix`付きで再実行するよう案内します。

### 4) 状態の整合性チェック（セッション永続化、ルーティング、安全性）

state dirは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います（別の場所にバックアップがない限り）。

Doctorは次を確認します:

- **State dirがない**: 破滅的な状態喪失について警告し、ディレクトリ再作成を促し、失われたデータは復旧できないことを通知します。
- **State dir権限**: 書き込み可能か確認し、権限修復を提案します
  （所有者/グループ不一致が検出された場合は`chown`ヒントも出します）。
- **macOSのクラウド同期state dir**: stateがiCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または
  `~/Library/CloudStorage/...`配下に解決される場合に警告します。同期バックアップされたパスはI/O低下やロック/同期競合の原因になるためです。
- **LinuxのSDまたはeMMC state dir**: stateが`mmcblk*`
  マウントソース上に解決される場合に警告します。SDまたはeMMCベースのランダムI/Oは、セッションや認証情報の書き込みで遅くなり、摩耗も早くなるためです。
- **セッションディレクトリがない**: `sessions/`とセッションストアディレクトリは、履歴永続化と`ENOENT`クラッシュ回避に必要です。
- **トランスクリプト不一致**: 最近のセッションエントリに欠落したトランスクリプトファイルがある場合に警告します。
- **メインセッションの「1行JSONL」**: メイントランスクリプトが1行しかない場合に検出します（履歴が蓄積していません）。
- **複数state dir**: 複数のホームディレクトリに`~/.openclaw`フォルダーが存在する場合、または`OPENCLAW_STATE_DIR`が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
- **リモートモードの注意**: `gateway.mode=remote`の場合、doctorはリモートホスト上で実行するよう通知します（stateはそこにあります）。
- **設定ファイル権限**: `~/.openclaw/openclaw.json`が
  グループ/全体読み取り可能な場合に警告し、`600`への厳格化を提案します。

### 5) モデル認証ヘルス（OAuth期限切れ）

Doctorは認証ストア内のOAuthプロファイルを検査し、トークンの期限切れ間近/期限切れを警告し、安全な場合は更新できます。Anthropic
OAuth/トークンプロファイルが古い場合は、Claude CLIまたはAnthropic APIキーへの移行を提案します。
更新プロンプトは対話モード（TTY）で実行した場合にのみ表示されます。`--non-interactive`では更新試行をスキップします。

Doctorはまた、次の理由で一時的に使用不可になっている認証プロファイルも報告します:

- 短いクールダウン（レート制限/タイムアウト/認証失敗）
- 長めの無効化（請求/クレジット失敗）

### 6) フックモデル検証

`hooks.gmail.model`が設定されている場合、doctorはモデル参照をカタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。

### 7) サンドボックスイメージ修復

サンドボックスが有効な場合、doctorはDockerイメージを確認し、現在のイメージが見つからない場合はビルドまたは古い名前への切り替えを提案します。

### 7b) バンドル済みプラグインのランタイム依存関係

Doctorは、バンドル済みプラグインのランタイム依存関係（たとえば
Discordプラグインのランタイムパッケージ）がOpenClawインストールルートに存在することを確認します。
不足しているものがあれば、doctorはそのパッケージを報告し、
`openclaw doctor --fix` / `openclaw doctor --repair`モードでそれらをインストールします。

### 8) Gatewayサービス移行とクリーンアップヒント

Doctorは古いgatewayサービス（launchd/systemd/schtasks）を検出し、
それらを削除して現在のgatewayポートでOpenClawサービスをインストールすることを提案します。追加のgateway風サービスをスキャンし、クリーンアップヒントを表示することもできます。
プロファイル名付きのOpenClaw gatewayサービスは第一級として扱われ、「追加」としては扱われません。

### 8b) 起動時Matrix移行

Matrixチャンネルアカウントに保留中または対応可能な古い状態移行がある場合、doctor（`--fix` / `--repair`モード）は移行前スナップショットを作成し、その後ベストエフォート移行手順を実行します: 古いMatrix状態移行と古い暗号化状態準備。どちらの手順も致命的ではなく、エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix`なしの`openclaw doctor`）では、このチェックは完全にスキップされます。

### 9) セキュリティ警告

Doctorは、許可リストなしでDMに開かれているプロバイダーがある場合、またはポリシーが危険な形で設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemdユーザーサービスとして実行されている場合、doctorはlogout後もgatewayが生き続けるようにlingeringが有効であることを確認します。

### 11) Workspace状態（Skills、プラグイン、古いディレクトリ）

Doctorは、デフォルトagentのworkspace状態サマリーを表示します:

- **Skills状態**: 対象、必要条件不足、許可リストでブロックされたSkillsの数。
- **古いworkspace dir**: `~/openclaw`やその他の古いworkspaceディレクトリが現在のworkspaceと並存している場合に警告します。
- **プラグイン状態**: 読み込み済み/無効化/エラーのプラグイン数、エラーがあるプラグインID、バンドルプラグイン機能を報告します。
- **プラグイン互換性警告**: 現在のランタイムと互換性問題があるプラグインを検出します。
- **プラグインdiagnostics**: プラグインレジストリが出した読み込み時警告やエラーを表示します。

### 11b) Bootstrapファイルサイズ

Doctorは、workspace bootstrapファイル（たとえば`AGENTS.md`、
`CLAUDE.md`、その他の注入コンテキストファイル）が、設定された文字数予算に近いか超過していないか確認します。ファイルごとの生文字数と注入文字数、切り詰め率、切り詰め原因（`max/file`または`max/total`）、および総予算に対する総注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctorは`agents.defaults.bootstrapMaxChars`と`agents.defaults.bootstrapTotalMaxChars`の調整ヒントを表示します。

### 11c) シェル補完

Doctorは、現在のシェル
（zsh、bash、fish、またはPowerShell）に対してタブ補完がインストールされているか確認します:

- シェルプロファイルが遅い動的補完パターン
  （`source <(openclaw completion ...)`）を使っている場合、doctorはそれを高速なキャッシュファイル方式へアップグレードします。
- 補完がプロファイルに設定されているがキャッシュファイルがない場合、doctorは自動的にキャッシュを再生成します。
- 補完がまったく設定されていない場合、doctorはインストールを提案します
  （対話モードのみ。`--non-interactive`ではスキップ）。

キャッシュを手動で再生成するには`openclaw completion --write-state`を実行してください。

### 12) Gateway認証チェック（ローカルトークン）

Doctorはローカルgatewayトークン認証の準備状況を確認します。

- トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctorは生成を提案します。
- `gateway.auth.token`がSecretRef管理されているが利用できない場合、doctorは警告し、平文で上書きしません。
- `openclaw doctor --generate-gateway-token`は、トークンSecretRefが設定されていない場合にのみ生成を強制します。

### 12b) 読み取り専用のSecretRef対応修復

一部の修復フローでは、ランタイムのfail-fast動作を弱めずに設定済み認証情報を検査する必要があります。

- `openclaw doctor --fix`は、現在、status系コマンドと同じ読み取り専用SecretRefサマリーモデルを使って、対象を絞った設定修復を行います。
- 例: Telegramの`allowFrom` / `groupAllowFrom`の`@username`修復では、利用可能なら設定済みbot認証情報を使おうとします。
- Telegram botトークンがSecretRef経由で設定されているが現在のコマンドパスで利用できない場合、doctorはその認証情報が「設定済みだが利用不可」であると報告し、クラッシュしたり、トークンが欠落していると誤報したりせずに自動解決をスキップします。

### 13) Gatewayヘルスチェック + 再起動

Doctorはヘルスチェックを実行し、gatewayが不健全に見える場合は再起動を提案します。

### 13b) メモリ検索の準備状況

Doctorは、デフォルトagent向けに設定されたメモリ検索埋め込みプロバイダーが準備できているか確認します。動作は設定されたバックエンドとプロバイダーに依存します:

- **QMDバックエンド**: `qmd`バイナリが利用可能で起動可能かをプローブします。
  そうでない場合、npmパッケージや手動バイナリパスオプションを含む修正案内を表示します。
- **明示的なローカルプロバイダー**: ローカルモデルファイルまたは認識可能なリモート/ダウンロード可能モデルURLを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
- **明示的なリモートプロバイダー**（`openai`、`voyage`など）: 環境変数または認証ストアにAPIキーが存在するか確認します。なければ実行可能な修正ヒントを表示します。
- **自動プロバイダー**: 最初にローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

gatewayプローブ結果が利用可能な場合（チェック時にgatewayが健全だった場合）、doctorはその結果をCLIから見える設定と照合し、不一致があれば注記します。

ランタイム時の埋め込み準備状況を確認するには`openclaw memory status --deep`を使用してください。

### 14) チャンネル状態警告

gatewayが健全なら、doctorはチャンネル状態プローブを実行し、修正案付きの警告を報告します。

### 15) Supervisor設定監査 + 修復

Doctorは、インストール済みsupervisor設定（launchd/systemd/schtasks）に不足または古いデフォルト
（例: systemdのnetwork-online依存関係や再起動遅延）がないか確認します。不一致を見つけた場合、更新を推奨し、現在のデフォルトにサービスファイル/タスクを書き換えることができます。

注記:

- `openclaw doctor`は、supervisor設定を書き換える前に確認します。
- `openclaw doctor --yes`は、デフォルトの修復プロンプトを受け入れます。
- `openclaw doctor --repair`は、推奨修正をプロンプトなしで適用します。
- `openclaw doctor --repair --force`は、カスタムsupervisor設定を上書きします。
- トークン認証でトークンが必要かつ`gateway.auth.token`がSecretRef管理されている場合、doctorのサービスインストール/修復はそのSecretRefを検証しますが、解決済みの平文トークン値をsupervisorサービス環境メタデータへ永続化しません。
- トークン認証でトークンが必要なのに設定済みトークンSecretRefが未解決の場合、doctorは実行可能な案内付きでインストール/修復パスをブロックします。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されていて`gateway.auth.mode`が未設定の場合、doctorはモードが明示設定されるまでインストール/修復をブロックします。
- Linux user-systemdユニットでは、doctorのトークンドリフトチェックに、サービス認証メタデータ比較時の`Environment=`と`EnvironmentFile=`の両ソースが含まれるようになりました。
- `openclaw gateway install --force`でいつでも完全書き換えを強制できます。

### 16) Gatewayランタイム + ポート診断

Doctorはサービスランタイム（PID、最後の終了状態）を検査し、
サービスがインストール済みなのに実際には動作していない場合に警告します。また、gatewayポート（デフォルト`18789`）でのポート競合も確認し、考えられる原因（gatewayがすでに実行中、SSHトンネル）を報告します。

### 17) Gatewayランタイムのベストプラクティス

Doctorは、gatewayサービスがBun上で動いている場合や、バージョンマネージャーのNodeパス
（`nvm`、`fnm`、`volta`、`asdf`など）で動いている場合に警告します。WhatsApp + TelegramチャンネルにはNodeが必要であり、バージョンマネージャーパスはサービスがシェル初期化を読み込まないため、アップグレード後に壊れることがあります。doctorは、利用可能ならシステムNodeインストール
（Homebrew/apt/choco）への移行を提案します。

### 18) 設定書き込み + wizardメタデータ

Doctorは設定変更を永続化し、doctor実行を記録するためにwizardメタデータを付与します。

### 19) Workspaceヒント（バックアップ + メモリシステム）

Doctorは、存在しない場合はworkspaceメモリシステムを提案し、workspaceがまだgit管理下でなければバックアップのヒントを表示します。

workspace構造とgitバックアップ（推奨: 非公開のGitHubまたはGitLab）の完全ガイドについては、[/concepts/agent-workspace](/concepts/agent-workspace)を参照してください。
