---
read_when:
    - doctor移行を追加または変更する
    - 破壊的な設定変更を導入する
summary: 'Doctorコマンド: ヘルスチェック、設定移行、修復手順'
title: Doctor
x-i18n:
    generated_at: "2026-04-09T01:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d321bd1ad0e16c29f2382e249c51edfc3a8d33b55bdceea39e7dbcd4901fce
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`は、OpenClaw向けの修復および移行ツールです。古くなった
設定や状態を修正し、ヘルスを確認し、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトなしでデフォルトを受け入れます（該当する場合は再起動 / サービス / サンドボックス修復手順も含みます）。

```bash
openclaw doctor --repair
```

推奨される修復をプロンプトなしで適用します（安全な場合は修復 + 再起動を実施）。

```bash
openclaw doctor --repair --force
```

積極的な修復も適用します（カスタムsupervisor設定を上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人の確認が必要な再起動 / サービス / サンドボックス操作はスキップします。
古い状態の移行は、検出されると自動的に実行されます。

```bash
openclaw doctor --deep
```

追加のGatewayインストールがないかシステムサービスをスキャンします（launchd/systemd/schtasks）。

書き込む前に変更を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

- gitインストール向けの任意の事前更新（対話モードのみ）。
- UIプロトコル鮮度チェック（プロトコルスキーマのほうが新しい場合はControl UIを再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skillsステータス概要（対象 / 不足 / ブロック）とプラグインステータス。
- 古い値に対する設定正規化。
- 古いフラットな`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk設定移行。
- 古いChrome拡張設定とChrome MCP準備状況に対するブラウザー移行チェック。
- OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuthシャドーイング警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuthプロファイル向けのOAuth TLS前提条件チェック。
- 古いディスク上状態の移行（sessions/agent dir/WhatsApp auth）。
- 古いプラグインマニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
- 古いcronストア移行（`jobId`, `schedule.cron`, トップレベルのdelivery/payloadフィールド、payloadの`provider`、単純な`notify: true` webhookフォールバックジョブ）。
- セッションロックファイルの検査と古いロックのクリーンアップ。
- 状態整合性と権限のチェック（sessions、transcripts、state dir）。
- ローカル実行時の設定ファイル権限チェック（chmod 600）。
- モデル認証ヘルス: OAuth有効期限を確認し、期限切れが近いトークンを更新でき、auth-profileのクールダウン / 無効状態を報告。
- 追加ワークスペースディレクトリの検出（`~/openclaw`）。
- サンドボックスが有効な場合のサンドボックスイメージ修復。
- 古いサービス移行と追加Gateway検出。
- Matrixチャネルの古い状態移行（`--fix` / `--repair`モード）。
- Gatewayランタイムチェック（サービスがインストール済みだが未実行、キャッシュされたlaunchdラベル）。
- チャネルステータス警告（実行中のGatewayからプローブ）。
- supervisor設定監査（launchd/systemd/schtasks）と任意の修復。
- Gatewayランタイムのベストプラクティスチェック（Node対Bun、バージョンマネージャーのパス）。
- Gatewayポート衝突診断（デフォルト`18789`）。
- 開いたDMポリシーに対するセキュリティ警告。
- ローカルトークンモード向けGateway認証チェック（トークンソースが存在しない場合はトークン生成を提案。token SecretRef設定は上書きしません）。
- Linuxでのsystemd lingerチェック。
- ワークスペースbootstrapファイルサイズチェック（コンテキストファイルの切り詰め / 制限近接警告）。
- シェル補完ステータスチェックと自動インストール / アップグレード。
- メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
- ソースインストールチェック（pnpm workspace不一致、UIアセット不足、tsxバイナリ不足）。
- 更新済み設定 + ウィザードメタデータを書き込み。

## Dreams UIのバックフィルとリセット

Control UIのDreamsシーンには、grounded dreamingワークフロー向けの
**Backfill**、**Reset**、**Clear Grounded**アクションがあります。これらのアクションはGatewayの
doctorスタイルRPCメソッドを使用しますが、`openclaw doctor` CLIの
修復 / 移行には**含まれません**。

これらが行うこと:

- **Backfill**は、アクティブな
  ワークスペース内の過去の`memory/YYYY-MM-DD.md`ファイルをスキャンし、
  grounded REM diaryパスを実行して、可逆なバックフィル
  エントリを`DREAMS.md`に書き込みます。
- **Reset**は、`DREAMS.md`からマークされたバックフィル日記エントリのみを削除します。
- **Clear Grounded**は、過去のリプレイ由来で、まだライブのリコールや日次
  サポートを蓄積していない段階化済みgrounded専用短期エントリのみを削除します。

これらが単独では行わないこと:

- `MEMORY.md`は編集しません
- 完全なdoctor移行は実行しません
- 明示的に段階化CLIパスを先に実行しない限り、grounded候補をライブの短期
  昇格ストアへ自動的に段階化しません

groundedな履歴リプレイを通常のDeep昇格
レーンに影響させたい場合は、代わりにCLIフローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md`をレビュー画面として維持しながら、
groundedな永続候補を短期Dreamingストアへ段階化します。

## 詳細な動作と理由

### 0) 任意の更新（gitインストール）

これがgitチェックアウトで、doctorが対話的に実行されている場合、
doctor実行前に更新（fetch/rebase/build）するか提案します。

### 1) 設定の正規化

設定に古い値の形状が含まれている場合（たとえばチャネル固有の上書きがない
`messages.ackReaction`など）、doctorはそれらを現在の
スキーマに正規化します。

これには古いTalkフラットフィールドも含まれます。現在の公開Talk設定は
`talk.provider` + `talk.providers.<provider>`です。doctorは古い
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey`の形状をプロバイダーマップへ書き換えます。

### 2) 古い設定キーの移行

設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、
`openclaw doctor`を実行するよう求めます。

Doctorは次を行います。

- 見つかった古いキーを説明する。
- 適用した移行を表示する。
- 更新されたスキーマで`~/.openclaw/openclaw.json`を書き換える。

Gatewayも、古い設定形式を検出すると起動時に自動でdoctor移行を実行するため、
古い設定は手動操作なしで修復されます。
Cronジョブストアの移行は`openclaw doctor --fix`で処理されます。

現在の移行:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベル`bindings`
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
- `accounts`という名前付きのあるチャネルで、単一アカウント用のトップレベルチャネル値が残っている場合、それらのアカウントスコープ値を、そのチャネル用に選ばれた昇格先アカウントへ移動する（ほとんどのチャネルでは`accounts.default`、Matrixでは既存の一致する名前付き / デフォルト対象を維持できる）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost`を削除（古い拡張リレー設定）

Doctorの警告には、マルチアカウントチャネル向けのデフォルトアカウント案内も含まれます。

- `channels.<channel>.accounts`のエントリが2つ以上設定されているのに`channels.<channel>.defaultAccount`または`accounts.default`がない場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があるとdoctorが警告します。
- `channels.<channel>.defaultAccount`が不明なアカウントIDに設定されている場合、doctorは警告し、設定済みのアカウントIDを一覧表示します。

### 2b) OpenCodeプロバイダーの上書き

`models.providers.opencode`、`opencode-zen`、または`opencode-go`を
手動で追加している場合、`@mariozechner/pi-ai`の組み込みOpenCodeカタログを
上書きします。
これによりモデルが誤ったAPIに強制されたり、コストがゼロになったりする可能性があります。doctorは警告を出し、上書きを削除してモデルごとのAPIルーティング + コストを復元できるようにします。

### 2c) ブラウザー移行とChrome MCP準備状況

ブラウザー設定がまだ削除済みのChrome拡張パスを指している場合、doctorは
それを現在のホストローカルChrome MCP接続モデルへ正規化します。

- `browser.profiles.*.driver: "extension"`は`"existing-session"`になります
- `browser.relayBindHost`は削除されます

また、`defaultProfile:
"user"`または設定済みの`existing-session`プロファイルを使っている場合、
doctorはホストローカルChrome MCPパスも監査します。

- デフォルトの
  自動接続プロファイル向けに、同じホストにGoogle Chromeがインストールされているか確認する
- 検出されたChromeバージョンを確認し、Chrome 144未満の場合は警告する
- ブラウザーのinspectページでリモートデバッグを有効にするよう通知する（
  たとえば`chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、
  または`edge://inspect/#remote-debugging`）

DoctorはChrome側の設定を代わりに有効化することはできません。ホストローカルChrome MCP
には引き続き次が必要です。

- Gateway / ノードホスト上のChromiumベースブラウザー 144+
- ローカルで実行中のブラウザー
- そのブラウザーで有効化されたリモートデバッグ
- ブラウザー内の最初の接続同意プロンプトを承認すること

ここでの準備状況は、ローカル接続の前提条件のみを対象としています。Existing-sessionは
現在のChrome MCPルート制限を維持します。`responsebody`、PDF
エクスポート、ダウンロード介入、バッチ操作などの高度なルートには、引き続き管理対象
ブラウザーまたは生のCDPプロファイルが必要です。

このチェックはDocker、sandbox、remote-browser、その他の
ヘッドレスフローには**適用されません**。それらは引き続き生のCDPを使用します。

### 2d) OAuth TLS前提条件

OpenAI Codex OAuthプロファイルが設定されている場合、doctorはOpenAIの
認可エンドポイントをプローブし、ローカルのNode/OpenSSL TLSスタックが
証明書チェーンを検証できることを確認します。プローブが証明書エラー（たと
えば`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）
で失敗した場合、doctorはプラットフォーム固有の修正ガイダンスを表示します。Homebrew版Nodeを使うmacOSでは、
通常の修正は`brew postinstall ca-certificates`です。`--deep`を付けると、
Gatewayが健全でもこのプローブを実行します。

### 2c) Codex OAuthプロバイダー上書き

以前に古いOpenAI転送設定を
`models.providers.openai-codex`配下へ追加していた場合、それらが
新しいリリースで自動使用される組み込みCodex OAuth
プロバイダーパスを覆い隠す可能性があります。doctorは、Codex OAuthと一緒に
それらの古い転送設定を検出すると警告し、古くなった転送上書きを削除または
書き換えて、組み込みのルーティング / フォールバック動作を
取り戻せるようにします。カスタムプロキシやヘッダーのみの上書きは引き続きサポートされ、
この警告は発生しません。

### 3) 古い状態の移行（ディスクレイアウト）

Doctorは、古いディスク上レイアウトを現在の構造へ移行できます。

- セッションストア + transcripts:
  - `~/.openclaw/sessions/`から`~/.openclaw/agents/<agentId>/sessions/`へ
- agent dir:
  - `~/.openclaw/agent/`から`~/.openclaw/agents/<agentId>/agent/`へ
- WhatsApp認証状態（Baileys）:
  - 古い`~/.openclaw/credentials/*.json`（`oauth.json`を除く）から
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`へ（デフォルトアカウントID: `default`）

これらの移行はベストエフォートかつ冪等です。バックアップとして
古いフォルダーを残した場合、doctorは警告を出します。Gateway / CLIも起動時に
古いsessions + agent dirを自動移行するため、履歴 / 認証 / モデルは
手動doctor実行なしでエージェントごとのパスに配置されます。WhatsApp認証は意図的に
`openclaw doctor`経由でのみ移行されます。Talk provider / provider-mapの正規化は
現在、構造的同値性で比較されるため、キー順序だけの差分では
無変更の`doctor --fix`が繰り返し発生しなくなりました。

### 3a) 古いプラグインマニフェスト移行

Doctorは、すべてのインストール済みプラグインマニフェストをスキャンし、非推奨のトップレベル機能
キー（`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`）を探します。見つかった場合、それらを`contracts`
オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。
`contracts`キーにすでに同じ値がある場合、データを重複させずに
古いキーは削除されます。

### 3b) 古いcronストア移行

Doctorはcronジョブストア（デフォルトでは`~/.openclaw/cron/jobs.json`、
または上書き時は`cron.store`）についても、
スケジューラーが互換性のためにまだ受け入れている古いジョブ形式を確認します。

現在のcronクリーンアップには次が含まれます。

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルpayloadフィールド（`message`, `model`, `thinking`, ...）→ `payload`
- トップレベルdeliveryフィールド（`deliver`, `channel`, `to`, `provider`, ...）→ `delivery`
- payloadの`provider` deliveryエイリアス → 明示的な`delivery.channel`
- 単純な古い`notify: true` webhookフォールバックジョブ → 明示的な`delivery.mode="webhook"`と`delivery.to=cron.webhook`

Doctorは、`notify: true`ジョブを動作を変えずに
自動移行できる場合にのみ移行します。ジョブが古いnotifyフォールバックと既存の
非webhook deliveryモードを組み合わせている場合、doctorは警告を出し、
そのジョブは手動レビュー用に残します。

### 3c) セッションロックのクリーンアップ

Doctorは、各エージェントのセッションディレクトリをスキャンして、古い書き込みロックファイルを探します。
これはセッションが異常終了した際に残されるファイルです。見つかったロックファイルごとに、
次を報告します:
パス、PID、そのPIDがまだ生きているか、ロック経過時間、および
古いと見なされるかどうか（PIDが死んでいる、または30分より古い）。`--fix` / `--repair`
モードでは古いロックファイルを自動削除します。それ以外ではメモを表示し、
`--fix`付きで再実行するよう案内します。

### 4) 状態整合性チェック（セッション永続化、ルーティング、安全性）

状態ディレクトリは運用上の中枢です。これが消えると、
セッション、認証情報、ログ、設定を失います（別の場所にバックアップがない限り）。

Doctorは次を確認します。

- **状態ディレクトリ欠落**: 壊滅的な状態損失を警告し、ディレクトリ再作成を提案し、
  失われたデータは復旧できないことを通知する。
- **状態ディレクトリ権限**: 書き込み可能かを確認し、権限修復を提案する
  （所有者 / グループ不一致を検出した場合は`chown`のヒントも表示）。
- **macOSのクラウド同期状態ディレクトリ**: 状態がiCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または
  `~/Library/CloudStorage/...`配下に解決される場合、同期ベースのパスはI/Oを遅くし、
  ロック / 同期競合を引き起こす可能性があるため警告する。
- **LinuxのSDまたはeMMC状態ディレクトリ**: 状態が`mmcblk*`
  マウントソースに解決される場合、SDまたはeMMCベースのランダムI/Oは
  セッションや認証情報の書き込みで遅くなり、摩耗も早い可能性があるため警告する。
- **セッションディレクトリ欠落**: `sessions/`およびセッションストアディレクトリは
  履歴を永続化し、`ENOENT`クラッシュを回避するために必要です。
- **transcript不一致**: 最近のセッションエントリに
  transcriptファイル欠落がある場合に警告する。
- **メインセッションの「1行JSONL」**: メインtranscriptが1行しかない場合
  （履歴が蓄積していない）に警告する。
- **複数の状態ディレクトリ**: 複数の`~/.openclaw`フォルダーが
  ホームディレクトリをまたいで存在する場合、または`OPENCLAW_STATE_DIR`が別の場所を指している場合に警告する（履歴がインストール間で分断される可能性がある）。
- **リモートモード通知**: `gateway.mode=remote`の場合、doctorは
  リモートホストで実行するよう通知する（状態はそこにあります）。
- **設定ファイル権限**: `~/.openclaw/openclaw.json`が
  グループ / 全体読み取り可能な場合に警告し、`600`への制限を提案する。

### 5) モデル認証ヘルス（OAuth有効期限）

Doctorは認証ストア内のOAuthプロファイルを検査し、トークンの
有効期限切れ / 期限切れ間近を警告し、安全な場合は更新できます。Anthropic
OAuth / tokenプロファイルが古い場合は、Anthropic APIキーまたは
Anthropic setup-tokenパスを提案します。
更新プロンプトは対話モード（TTY）で実行している場合にのみ表示されます。`--non-interactive`
では更新試行をスキップします。

OAuth更新が恒久的に失敗した場合（たとえば`refresh_token_reused`、
`invalid_grant`、または再サインインを求めるプロバイダー応答）、
doctorは再認証が必要だと報告し、実行すべき正確な`openclaw models auth login --provider ...`
コマンドを表示します。

Doctorはまた、次の理由で一時的に使用不能な認証プロファイルも報告します。

- 短いクールダウン（レート制限 / タイムアウト / 認証失敗）
- 長めの無効化（請求 / クレジット失敗）

### 6) Hooksモデル検証

`hooks.gmail.model`が設定されている場合、doctorはそのモデル参照を
カタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。

### 7) サンドボックスイメージ修復

サンドボックスが有効な場合、doctorはDockerイメージを確認し、
現在のイメージが見つからない場合はビルドまたは古い名前への切り替えを提案します。

### 7b) バンドルプラグインのランタイム依存関係

Doctorは、バンドルプラグインのランタイム依存関係（たとえば
Discordプラグインのランタイムパッケージ）がOpenClawインストールルートに
存在することを確認します。
不足しているものがあれば、doctorはパッケージを報告し、
`openclaw doctor --fix` / `openclaw doctor --repair`モードでそれらをインストールします。

### 8) Gatewayサービス移行とクリーンアップのヒント

Doctorは古いGatewayサービス（launchd/systemd/schtasks）を検出し、
それらを削除して、現在のGateway
ポートでOpenClawサービスをインストールすることを提案します。また、追加のGateway類似サービスをスキャンし、クリーンアップのヒントを表示することもできます。
プロファイル名付きのOpenClaw Gatewayサービスは正式なものとして扱われ、
「追加」としては警告されません。

### 8b) 起動時Matrix移行

Matrixチャネルアカウントに保留中または実行可能な古い状態移行がある場合、
doctor（`--fix` / `--repair`モード）は移行前スナップショットを作成してから、
ベストエフォートの移行手順を実行します: 古いMatrix状態移行と古い
暗号化状態の準備です。どちらの手順も致命的ではなく、エラーはログに記録され、
起動は続行されます。読み取り専用モード（`--fix`なしの`openclaw doctor`）では、このチェックは
完全にスキップされます。

### 9) セキュリティ警告

Doctorは、許可リストなしでDMを開放しているプロバイダーがある場合、
または危険な方法でポリシーが設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemdユーザーサービスとして実行されている場合、doctorは
ログアウト後もGatewayが生き続けるようlingerが有効かを確認します。

### 11) ワークスペース状態（Skills、プラグイン、古いディレクトリ）

Doctorは、デフォルトエージェントのワークスペース状態概要を表示します。

- **Skillsステータス**: 対象、要件不足、許可リストブロック済みSkillsの数。
- **古いワークスペースディレクトリ**: `~/openclaw`やその他の古いワークスペースディレクトリが
  現在のワークスペースと並存している場合に警告する。
- **プラグインステータス**: 読み込み済み / 無効 / エラーのプラグイン数、エラーがある場合の
  プラグインID一覧、bundleプラグイン機能の報告。
- **プラグイン互換性警告**: 現在のランタイムと互換性問題があるプラグインを警告する。
- **プラグイン診断**: プラグインレジストリが出した読み込み時警告やエラーを
  表示する。

### 11b) Bootstrapファイルサイズ

Doctorは、ワークスペースbootstrapファイル（たとえば`AGENTS.md`、
`CLAUDE.md`、その他の注入コンテキストファイル）が、設定された
文字数予算に近いか超えているかを確認します。ファイルごとの生文字数と注入後文字数、切り詰め
割合、切り詰め理由（`max/file`または`max/total`）、および総注入
文字数の総予算に対する比率を報告します。ファイルが切り詰められている、または制限に近い場合、
doctorは`agents.defaults.bootstrapMaxChars`
および`agents.defaults.bootstrapTotalMaxChars`調整のヒントを表示します。

### 11c) シェル補完

Doctorは、現在のシェル向けにタブ補完がインストールされているか確認します
（zsh、bash、fish、またはPowerShell）。

- シェルプロファイルが遅い動的補完パターン
  （`source <(openclaw completion ...)`）を使っている場合、doctorはそれを高速な
  キャッシュファイル方式へアップグレードします。
- 補完がプロファイルに設定されているがキャッシュファイルがない場合、
  doctorは自動的にキャッシュを再生成します。
- 補完がまったく設定されていない場合、doctorはインストールを提案します
  （対話モードのみ。`--non-interactive`ではスキップ）。

キャッシュを手動で再生成するには`openclaw completion --write-state`を実行してください。

### 12) Gateway認証チェック（ローカルトークン）

Doctorは、ローカルGatewayトークン認証の準備状況を確認します。

- トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctorは生成を提案します。
- `gateway.auth.token`がSecretRef管理だが利用できない場合、doctorは警告し、平文で上書きしません。
- `openclaw doctor --generate-gateway-token`は、トークンSecretRefが設定されていない場合にのみ生成を強制します。

### 12b) 読み取り専用のSecretRef対応修復

一部の修復フローでは、ランタイムの即時失敗動作を弱めずに、
設定済み認証情報を検査する必要があります。

- `openclaw doctor --fix`は現在、対象を絞った設定修復のために、status系コマンドと同じ読み取り専用SecretRefサマリーモデルを使用します。
- 例: Telegramの`allowFrom` / `groupAllowFrom` `@username`修復では、利用可能な場合に設定済みボット認証情報の使用を試みます。
- TelegramボットトークンがSecretRef経由で設定されているが現在のコマンドパスでは利用できない場合、doctorはその認証情報が「設定済みだが利用不可」であると報告し、クラッシュしたり、トークンが欠けていると誤報したりせずに自動解決をスキップします。

### 13) Gatewayヘルスチェック + 再起動

Doctorはヘルスチェックを実行し、Gatewayの状態が
不健全に見える場合は再起動を提案します。

### 13b) メモリ検索の準備状況

Doctorは、設定されたメモリ検索埋め込みプロバイダーが
デフォルトエージェント向けに準備完了しているか確認します。動作は、設定されたバックエンドとプロバイダーに依存します。

- **QMDバックエンド**: `qmd`バイナリが利用可能で起動できるかをプローブします。
  できない場合は、npmパッケージや手動バイナリパスのオプションを含む修正ガイダンスを表示します。
- **明示的なローカルプロバイダー**: ローカルモデルファイルまたは認識される
  リモート / ダウンロード可能モデルURLを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
- **明示的なリモートプロバイダー**（`openai`、`voyage`など）: APIキーが
  環境または認証ストアに存在するか確認します。見つからない場合は実行可能な修正ヒントを表示します。
- **自動プロバイダー**: まずローカルモデルの利用可能性を確認し、その後、自動選択順で各リモート
  プロバイダーを試します。

Gatewayのプローブ結果が利用可能な場合（確認時点でGatewayが健全だった場合）、
doctorはその結果をCLIから見える設定と照合し、
差異があれば指摘します。

ランタイムでの埋め込み準備状況を確認するには`openclaw memory status --deep`を使用してください。

### 14) チャネルステータス警告

Gatewayが健全であれば、doctorはチャネルステータスプローブを実行し、
修正案付きで警告を報告します。

### 15) Supervisor設定監査 + 修復

Doctorは、インストール済みsupervisor設定（launchd/systemd/schtasks）について、
不足または古いデフォルト（たとえばsystemdのnetwork-online依存関係や
再起動遅延）を確認します。不一致が見つかった場合は
更新を推奨し、サービスファイル / タスクを現在のデフォルトへ
書き換えることができます。

注意:

- `openclaw doctor`はsupervisor設定を書き換える前にプロンプトを出します。
- `openclaw doctor --yes`はデフォルトの修復プロンプトを受け入れます。
- `openclaw doctor --repair`はプロンプトなしで推奨修復を適用します。
- `openclaw doctor --repair --force`はカスタムsupervisor設定を上書きします。
- トークン認証でトークンが必要かつ`gateway.auth.token`がSecretRef管理の場合、doctorのサービスインストール / 修復はSecretRefを検証しますが、解決済みの平文トークン値をsupervisorサービス環境メタデータへ永続化しません。
- トークン認証でトークンが必要かつ設定済みトークンSecretRefが未解決の場合、doctorはインストール / 修復パスをブロックし、実行可能なガイダンスを表示します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されていて`gateway.auth.mode`が未設定の場合、doctorはモードが明示設定されるまでインストール / 修復をブロックします。
- Linux user-systemdユニットでは、doctorのトークンドリフトチェックは、サービス認証メタデータを比較する際に`Environment=`と`EnvironmentFile=`の両方を含むようになりました。
- `openclaw gateway install --force`でいつでも完全な再書き換えを強制できます。

### 16) Gatewayランタイム + ポート診断

Doctorはサービスランタイム（PID、最後の終了ステータス）を検査し、
サービスがインストール済みなのに実際には実行されていない場合に警告します。また、Gatewayポート
（デフォルト`18789`）のポート衝突も確認し、考えられる原因（Gatewayがすでに実行中、
SSHトンネル）を報告します。

### 17) Gatewayランタイムのベストプラクティス

Doctorは、GatewayサービスがBun上で動作している場合、またはバージョンマネージャーされたNodeパス
（`nvm`、`fnm`、`volta`、`asdf`など）を使っている場合に警告します。WhatsApp + TelegramチャネルはNodeを必要とし、
バージョンマネージャーのパスは、サービスがシェル初期化を
読み込まないため、アップグレード後に壊れることがあります。doctorは、
利用可能な場合はシステムNodeインストールへの移行を提案します
（Homebrew/apt/choco）。

### 18) 設定書き込み + ウィザードメタデータ

Doctorは、設定変更を永続化し、doctor実行を記録するために
ウィザードメタデータを刻印します。

### 19) ワークスペースのヒント（バックアップ + メモリシステム）

Doctorは、ワークスペースメモリシステムがない場合はそれを提案し、
ワークスペースがまだgit管理されていない場合はバックアップのヒントを表示します。

ワークスペース構造とgitバックアップ（推奨: 非公開GitHubまたはGitLab）の完全なガイドは
[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace)を参照してください。
