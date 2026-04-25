---
read_when:
    - doctor移行の追加または変更
    - 破壊的な設定変更を導入する
summary: 'doctorコマンド: ヘルスチェック、設定移行、および修復手順'
title: doctor
x-i18n:
    generated_at: "2026-04-25T13:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` は、OpenClawの修復 + 移行ツールです。古い設定/状態を修正し、ヘルスチェックを行い、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトなしでデフォルトを受け入れます（該当する場合は restart/service/sandbox 修復手順も含みます）。

```bash
openclaw doctor --repair
```

プロンプトなしで推奨修復を適用します（安全な範囲で repairs + restarts）。

```bash
openclaw doctor --repair --force
```

強力な修復も適用します（カスタム supervisor 設定を上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全な移行のみを適用します（設定正規化 + オンディスク状態の移動）。人間の確認が必要な restart/service/sandbox アクションはスキップします。  
古い状態の移行は、検出されると自動実行されます。

```bash
openclaw doctor --deep
```

追加のGatewayインストールを探すため、システムサービスをスキャンします（launchd/systemd/schtasks）。

書き込む前に変更を確認したい場合は、先に設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 何をするか（概要）

- gitインストール向けの任意の事前更新（対話時のみ）。
- UIプロトコルの鮮度チェック（プロトコルスキーマが新しい場合はControl UIを再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skills 状態サマリー（利用可能/不足/ブロック）とPlugin状態。
- 旧来値の設定正規化。
- 旧来のフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` へのTalk設定移行。
- 旧来のChrome拡張設定とChrome MCP準備状態に対するブラウザー移行チェック。
- OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth shadowing警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuthプロファイル向けOAuth TLS前提条件チェック。
- 旧来のオンディスク状態移行（sessions/agent dir/WhatsApp auth）。
- 旧来のPlugin manifest契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
- 旧来のCronストア移行（`jobId`, `schedule.cron`, トップレベルdelivery/payloadフィールド, payload `provider`, 単純な `notify: true` webhookフォールバックjob）。
- セッションロックファイル検査と古いロックのクリーンアップ。
- 状態の整合性と権限チェック（sessions, transcripts, state dir）。
- ローカル実行時の設定ファイル権限チェック（chmod 600）。
- モデル認証の健全性: OAuth期限切れチェック、期限が近いトークンの更新、auth-profileのcooldown/disabled状態の報告。
- 追加ワークスペースディレクトリの検出（`~/openclaw`）。
- sandboxing有効時のSandboxイメージ修復。
- 旧来サービス移行と追加Gateway検出。
- Matrixチャンネルの旧来状態移行（`--fix` / `--repair` モード時）。
- Gatewayランタイムチェック（サービスがインストール済みだが未実行、キャッシュ済みlaunchdラベル）。
- チャンネル状態警告（実行中のGatewayからプローブ）。
- Supervisor設定監査（launchd/systemd/schtasks）と任意修復。
- Gatewayランタイムのベストプラクティスチェック（Node vs Bun、version-manager path）。
- Gatewayポート競合診断（デフォルト `18789`）。
- オープンなDMポリシーに対するセキュリティ警告。
- ローカルトークンモード向けGateway認証チェック（トークンソースがない場合はトークン生成を提案。token SecretRef設定は上書きしません）。
- デバイスペアリング問題の検出（保留中の初回ペア要求、保留中のロール/スコープアップグレード、古いローカルdevice-tokenキャッシュの差異、paired-record認証差異）。
- Linux上のsystemd lingerチェック。
- ワークスペースbootstrapファイルサイズチェック（切り捨て/上限近接警告）。
- シェル補完状態チェックと自動インストール/アップグレード。
- メモリ検索埋め込みプロバイダーの準備状態チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
- ソースインストールチェック（pnpm workspace不一致、UIアセット欠落、tsxバイナリ欠落）。
- 更新済み設定 + wizard metadata の書き込み。

## Dreams UI のバックフィルとリセット

Control UIのDreamingシーンには、grounded dreamingワークフロー向けに **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションはGatewayのdoctor風RPCメソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

それぞれの動作:

- **Backfill** は、アクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diaryパスを実行して、可逆なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は、それらのマーク付きバックフィルdiaryエントリのみを `DREAMS.md` から削除します。
- **Clear Grounded** は、過去リプレイ由来で、まだライブ想起や日次サポートが蓄積していない、ステージ済みのgrounded専用短期エントリのみを削除します。

自動では**行わない**こと:

- `MEMORY.md` は編集しません
- 完全なdoctor移行は実行しません
- 先にステージ済みCLI経路を明示的に実行しない限り、grounded候補をライブ短期昇格ストアへ自動ステージしません

groundedな履歴リプレイを通常の深い昇格レーンに影響させたい場合は、代わりにCLIフローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビューポイントとして維持しながら、groundedな永続候補が短期Dreamingストアへステージされます。

## 詳細な動作と理由

### 0) 任意の更新（gitインストール）

git checkoutでdoctorが対話実行されている場合、doctor実行前に更新（fetch/rebase/build）を提案します。

### 1) 設定正規化

設定に旧来の値形状（たとえばチャンネル固有上書きのない `messages.ackReaction`）が含まれている場合、doctorはそれらを現在のスキーマへ正規化します。

これには旧来のTalkフラットフィールドも含まれます。現在の公開Talk設定は `talk.provider` + `talk.providers.<provider>` です。doctorは古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形状をプロバイダーマップへ書き換えます。

### 2) 旧来設定キー移行

設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

doctorは次を行います。

- 見つかった旧来キーを説明する
- 適用した移行内容を表示する
- 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換える

Gatewayも、旧来設定形式を検出すると起動時にdoctor移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron jobストア移行は `openclaw doctor --fix` で処理されます。

現在の移行:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベル `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- 旧来の `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 名前付き `accounts` を持つチャンネルで、単一アカウント用トップレベルチャンネル値が残っている場合、そのアカウントスコープ値をそのチャンネル用に選ばれた昇格アカウントへ移動します（大半のチャンネルでは `accounts.default`。Matrixでは既存の一致する名前付き/defaultターゲットを保持できる場合があります）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` の削除（旧来のextension relay設定）

doctor警告には、マルチアカウントチャンネル向けのアカウントデフォルト指針も含まれます。

- 2つ以上の `channels.<channel>.accounts` エントリが設定されているのに `channels.<channel>.defaultAccount` または `accounts.default` がない場合、doctorはフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
- `channels.<channel>.defaultAccount` が未知のアカウントIDに設定されている場合、doctorは警告し、設定済みアカウントIDを一覧表示します。

### 2b) OpenCodeプロバイダー上書き

`models.providers.opencode`, `opencode-zen`, `opencode-go` を手動追加している場合、それは `@mariozechner/pi-ai` の組み込みOpenCodeカタログを上書きします。  
その結果、モデルが誤ったAPIに向けられたり、コストがゼロ化されたりすることがあります。doctorは、上書きを削除して、モデルごとのAPIルーティング + コストを復元できるよう警告します。

### 2c) ブラウザー移行とChrome MCP準備状態

ブラウザー設定がまだ削除済みChrome拡張経路を指している場合、doctorはそれを現在のホストローカルChrome MCP attachモデルに正規化します。

- `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
- `browser.relayBindHost` は削除されます

doctorは、`defaultProfile: "user"` または設定済み `existing-session` プロファイルを使っている場合、ホストローカルChrome MCP経路も監査します。

- デフォルト自動接続プロファイル向けに、同じホストにGoogle Chromeがインストールされているか確認
- 検出されたChromeバージョンを確認し、Chrome 144未満なら警告
- ブラウザーinspectページでリモートデバッグを有効にするよう通知（例: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, `edge://inspect/#remote-debugging`）

doctorはChrome側設定を代わりに有効化することはできません。ホストローカルChrome MCPには引き続き次が必要です。

- Gateway/Nodeホスト上のChromium系ブラウザー144+
- そのブラウザーがローカルで実行中であること
- そのブラウザーでリモートデバッグが有効であること
- ブラウザー内の初回attach同意プロンプトを承認すること

ここでの準備状態は、ローカルattachの前提条件だけに関するものです。existing-sessionは現在のChrome MCPルート制限を維持します。`responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションのような高度なルートには、引き続きmanaged browserまたはraw CDPプロファイルが必要です。

このチェックはDocker、sandbox、remote-browser、その他のヘッドレスフローには**適用されません**。それらは引き続きraw CDPを使用します。

### 2d) OAuth TLS前提条件

OpenAI Codex OAuthプロファイルが設定されている場合、doctorはOpenAI認可エンドポイントをプローブし、ローカルのNode/OpenSSL TLSスタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（たとえば `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctorはプラットフォーム固有の修復ガイダンスを表示します。macOSでHomebrew版Nodeを使っている場合、通常の修復方法は `brew postinstall ca-certificates` です。`--deep` を指定すると、Gatewayが正常でもこのプローブが実行されます。

### 2c) Codex OAuthプロバイダー上書き

以前に旧来のOpenAI転送設定を `models.providers.openai-codex` 配下に追加していた場合、それらが新しいリリースで自動的に使われる組み込みのCodex OAuthプロバイダー経路を隠してしまうことがあります。doctorは、Codex OAuthと一緒にそうした古い転送設定を検出すると警告を出し、古い転送上書きを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにします。カスタムproxyやヘッダーのみの上書きは引き続きサポートされており、この警告は発生しません。

### 3) 旧来状態移行（ディスクレイアウト）

doctorは、古いオンディスクレイアウトを現在の構造へ移行できます。

- セッションストア + transcript:
  - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
- Agentディレクトリ:
  - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
- WhatsApp認証状態（Baileys）:
  - 旧来の `~/.openclaw/credentials/*.json`（`oauth.json` を除く）
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトaccount id: `default`）

これらの移行はベストエフォートかつ冪等です。バックアップとして旧来フォルダーを残した場合、doctorは警告を出します。Gateway/CLIも起動時に旧来のsessions + agent dirを自動移行するため、history/auth/modelsは手動のdoctor実行なしでagentごとのパスに配置されます。WhatsApp認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk provider/provider-map正規化は現在、構造的等価性で比較するため、キー順序だけの差分では no-op の `doctor --fix` 変更が繰り返し発生しなくなりました。

### 3a) 旧来Plugin manifest移行

doctorは、インストール済みのすべてのPlugin manifestをスキャンし、非推奨のトップレベルcapabilityキー（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、manifestファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させることなく旧来キーが削除されます。

### 3b) 旧来Cronストア移行

doctorは、Cronジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、または上書き時は `cron.store`）も確認し、スケジューラーが互換性のためにまだ受け付けている古いジョブ形状を探します。

現在のCronクリーンアップには次が含まれます。

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルpayloadフィールド（`message`, `model`, `thinking`, ...）→ `payload`
- トップレベルdeliveryフィールド（`deliver`, `channel`, `to`, `provider`, ...）→ `delivery`
- payload `provider` deliveryエイリアス → 明示的な `delivery.channel`
- 単純な旧来の `notify: true` webhookフォールバックjob → 明示的な `delivery.mode="webhook"` と `delivery.to=cron.webhook`

doctorは、動作を変えずに移行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブが旧来のnotifyフォールバックと既存の非webhook deliveryモードを組み合わせている場合、doctorは警告を出し、そのジョブは手動確認用に残します。

### 3c) セッションロックのクリーンアップ

doctorは、各agentセッションディレクトリをスキャンして、古い書き込みロックファイルを探します。これはセッションが異常終了した際に残されるファイルです。見つかったロックファイルごとに、doctorは次を報告します: パス、PID、そのPIDがまだ生きているか、ロックの経過時間、古いと見なされるかどうか（PIDが死んでいる、または30分超）。`--fix` / `--repair` モードでは古いロックファイルを自動削除します。それ以外では注記を表示し、`--fix` を付けて再実行するよう案内します。

### 4) 状態整合性チェック（セッション永続化、ルーティング、安全性）

状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います（別の場所にバックアップがない限り）。

doctorのチェック内容:

- **状態ディレクトリ欠落**: 壊滅的な状態喪失を警告し、ディレクトリ再作成を提案し、欠落データは復旧できないことを通知します。
- **状態ディレクトリ権限**: 書き込み可能かを検証し、権限修復を提案します（owner/groupの不一致が検出された場合は `chown` ヒントも出します）。
- **macOSクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期付きパスではI/Oが遅くなったり、ロック/同期競合が起きたりする可能性があるためです。
- **LinuxのSDまたはeMMC状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SDまたはeMMCベースのランダムI/Oは、セッションや認証情報の書き込みで遅くなりやすく、摩耗も早くなるためです。
- **セッションディレクトリ欠落**: `sessions/` とセッションストアディレクトリは、履歴の永続化と `ENOENT` クラッシュ回避に必要です。
- **Transcript不一致**: 最近のセッションエントリに対応するtranscriptファイルがない場合に警告します。
- **メインセッション「1行JSONL」**: メインtranscriptが1行しかない場合にフラグを立てます（履歴が蓄積していません）。
- **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーが異なるホームディレクトリに存在する場合や、`OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
- **リモートモードの注意**: `gateway.mode=remote` の場合、doctorはリモートホストで実行するよう通知します（状態はそちらにあります）。
- **設定ファイル権限**: `~/.openclaw/openclaw.json` がgroup/world読み取り可能な場合に警告し、`600` への厳格化を提案します。

### 5) モデル認証の健全性（OAuth期限切れ）

doctorはauthストア内のOAuthプロファイルを検査し、トークンが期限切れ間近/期限切れの場合に警告し、安全な場合は更新できます。AnthropicのOAuth/tokenプロファイルが古い場合、Anthropic APIキーまたはAnthropic setup-token経路を提案します。  
更新プロンプトは対話実行（TTY）の場合にのみ表示されます。`--non-interactive` では更新試行をスキップします。

OAuth更新が恒久的に失敗した場合（たとえば `refresh_token_reused`, `invalid_grant`、またはプロバイダーから再ログインを求められた場合）、doctorは再認証が必要であると報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

doctorはまた、次の理由で一時的に使用不能なauthプロファイルも報告します。

- 短いcooldown（レート制限/タイムアウト/認証失敗）
- 長めの無効化（請求/クレジット失敗）

### 6) Hooksモデル検証

`hooks.gmail.model` が設定されている場合、doctorはそのモデル参照をカタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。

### 7) Sandboxイメージ修復

sandboxingが有効な場合、doctorはDockerイメージを確認し、現在のイメージが見つからない場合はビルドまたは旧来名への切り替えを提案します。

### 7b) バンドル済みPluginランタイム依存関係

doctorは、現在の設定で有効な、またはバンドル済みmanifestのデフォルトで有効なバンドル済みPluginについてのみ、ランタイム依存関係を検証します。たとえば `plugins.entries.discord.enabled: true`、旧来の `channels.discord.enabled: true`、またはデフォルト有効のバンドル済みプロバイダーです。何か不足している場合、doctorはそのパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでインストールします。外部Pluginについては、引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctorは任意のPluginパスに対して依存関係をインストールしません。

GatewayとローカルCLIは、アクティブなバンドル済みPluginランタイム依存関係を、バンドル済みPluginのimport前に必要に応じて修復することもできます。これらのインストールはPluginランタイムのインストールルートに限定され、スクリプト無効で実行され、package lockは書き込まず、install-root lockで保護されるため、CLIやGatewayの同時起動で同じ `node_modules` ツリーが同時に変更されることはありません。

### 8) Gatewayサービス移行とクリーンアップヒント

doctorは旧来のGatewayサービス（launchd/systemd/schtasks）を検出し、それらを削除して、現在のGatewayポートを使うOpenClawサービスをインストールすることを提案します。追加のGateway風サービスをスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きのOpenClaw Gatewayサービスは第一級として扱われ、「追加」とは見なされません。

### 8b) 起動時Matrix移行

Matrixチャンネルアカウントに保留中または対処可能な旧来状態移行がある場合、doctor（`--fix` / `--repair` モード）では移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します: 旧来のMatrix状態移行と、旧来の暗号化状態準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。

### 8c) デバイスペアリングと認証差異

doctorは現在、通常のヘルスパスの一部としてデバイスペアリング状態も検査します。

報告される内容:

- 保留中の初回ペアリング要求
- すでにペア済みデバイスの保留中ロールアップグレード
- すでにペア済みデバイスの保留中スコープアップグレード
- デバイスidは一致するが、デバイスアイデンティティが承認済みレコードと一致しなくなった場合の公開鍵不一致修復
- 承認済みロールに対するアクティブトークンを持たないpairedレコード
- 承認済みペアリング基準からスコープが逸脱しているpairedトークン
- 現在のマシン向けのローカルキャッシュdevice-tokenエントリで、Gateway側トークンローテーションより前のもの、または古いスコープメタデータを持つもの

doctorはペア要求を自動承認したり、デバイストークンを自動ローテーションしたりはしません。代わりに、正確な次の手順を表示します。

- `openclaw devices list` で保留中リクエストを確認する
- `openclaw devices approve <requestId>` で正確なリクエストを承認する
- `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
- `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

これにより、「すでにペア済みなのにまだ pairing required が出る」というよくある問題が解消されます。doctorは現在、初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイスアイデンティティ差異を区別します。

### 9) セキュリティ警告

doctorは、プロバイダーが許可リストなしでDMに開放されている場合や、ポリシーが危険な形で設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemdユーザーサービスとして実行している場合、doctorはログアウト後もGatewayが生き続けるように lingering が有効か確認します。

### 11) ワークスペース状態（Skills、Plugin、旧来ディレクトリ）

doctorは、デフォルトagentのワークスペース状態のサマリーを表示します。

- **Skills 状態**: 利用可能、要件不足、許可リストブロック済みのSkills数。
- **旧来ワークスペースディレクトリ**: `~/openclaw` やその他の旧来ワークスペースディレクトリが現在のワークスペースと並存する場合に警告します。
- **Plugin状態**: 読み込み済み/無効/エラーのPlugin数。エラーがあるPlugin IDの一覧。バンドルPluginのcapabilityを報告。
- **Plugin互換性警告**: 現在のランタイムとの互換性問題を持つPluginにフラグを立てます。
- **Plugin診断**: Plugin registryが出したロード時警告やエラーを表示します。

### 11b) Bootstrapファイルサイズ

doctorは、ワークスペースのbootstrapファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入コンテキストファイル）が、設定された文字予算に近いか超えているかを確認します。ファイルごとの生文字数と注入後文字数、切り捨て率、切り捨て原因（`max/file` または `max/total`）、および総予算に対する総注入文字数の割合を報告します。ファイルが切り捨てられている、または上限に近い場合、doctorは `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整ヒントを表示します。

### 11c) シェル補完

doctorは、現在のシェル（zsh、bash、fish、またはPowerShell）向けにタブ補完がインストールされているかを確認します:

- シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、doctorはそれを高速なキャッシュファイル方式にアップグレードします。
- 補完がプロファイルに設定されているのにキャッシュファイルが存在しない場合、doctorは自動でキャッシュを再生成します。
- 補完がまったく設定されていない場合、doctorはインストールを提案します（対話モードのみ。`--non-interactive` ではスキップされます）。

キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

### 12) Gateway認証チェック（ローカルトークン）

doctorはローカルGatewayのトークン認証準備状態を確認します。

- トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctorは生成を提案します。
- `gateway.auth.token` がSecretRef管理だが利用できない場合、doctorは警告し、平文で上書きしません。
- `openclaw doctor --generate-gateway-token` は、トークンSecretRefが設定されていない場合にのみ生成を強制します。

### 12b) 読み取り専用のSecretRef対応修復

一部の修復フローでは、実行時のfail-fast動作を弱めずに、設定済み認証情報を検査する必要があります。

- `openclaw doctor --fix` は現在、対象設定修復のために、status系コマンドと同じ読み取り専用SecretRefサマリーモデルを使用します。
- 例: Telegramの `allowFrom` / `groupAllowFrom` の `@username` 修復では、利用可能であれば設定済みボット認証情報の使用を試みます。
- TelegramボットトークンがSecretRef経由で設定されているが、現在のコマンド経路では利用できない場合、doctorはその認証情報が「設定済みだが利用不可」であると報告し、自動解決をスキップします。クラッシュしたり、トークンが欠けていると誤報したりはしません。

### 13) Gatewayヘルスチェック + 再起動

doctorはヘルスチェックを実行し、Gatewayが不健全に見える場合は再起動を提案します。

### 13b) メモリ検索の準備状態

doctorは、デフォルトagent向けに設定されたメモリ検索埋め込みプロバイダーの準備状態を確認します。動作は設定されたバックエンドとプロバイダーに依存します。

- **QMDバックエンド**: `qmd` バイナリが利用可能で起動可能かをプローブします。利用できない場合は、npmパッケージや手動バイナリパスオプションを含む修復ガイダンスを表示します。
- **明示的なローカルプロバイダー**: ローカルモデルファイルまたは認識可能なリモート/ダウンロード可能モデルURLを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
- **明示的なリモートプロバイダー**（`openai`, `voyage` など）: 環境変数またはauthストアにAPIキーが存在するか確認します。ない場合は実行可能な修復ヒントを表示します。
- **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後自動選択順で各リモートプロバイダーを試します。

Gatewayプローブ結果が利用可能な場合（チェック時点でGatewayが正常だった場合）、doctorはその結果をCLIから見える設定と突き合わせ、差異があれば通知します。

実行時の埋め込み準備状態を確認するには `openclaw memory status --deep` を使用してください。

### 14) チャンネル状態警告

Gatewayが正常であれば、doctorはチャンネル状態プローブを実行し、推奨修復とともに警告を報告します。

### 15) Supervisor設定監査 + 修復

doctorは、インストール済みsupervisor設定（launchd/systemd/schtasks）について、欠落または古いデフォルト（たとえばsystemdのnetwork-online依存関係やrestart delay）を確認します。不一致を見つけた場合、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

注記:

- `openclaw doctor` はsupervisor設定を書き換える前に確認します。
- `openclaw doctor --yes` はデフォルト修復プロンプトを受け入れます。
- `openclaw doctor --repair` はプロンプトなしで推奨修復を適用します。
- `openclaw doctor --repair --force` はカスタムsupervisor設定を上書きします。
- トークン認証でトークンが必要で、`gateway.auth.token` がSecretRef管理されている場合、doctorのサービスインストール/修復はSecretRefを検証しますが、解決済み平文トークン値をsupervisorサービス環境メタデータへ永続化しません。
- トークン認証でトークンが必要なのに、設定されたトークンSecretRefが未解決の場合、doctorは実行可能なガイダンス付きでインストール/修復経路をブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、doctorはモードが明示設定されるまでインストール/修復をブロックします。
- Linuxのuser-systemd unitでは、doctorのトークン差異チェックは現在、サービス認証メタデータ比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含みます。
- いつでも `openclaw gateway install --force` で完全書き換えを強制できます。

### 16) Gatewayランタイム + ポート診断

doctorはサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストール済みなのに実際には動いていない場合に警告します。また、Gatewayポート（デフォルト `18789`）でのポート競合も確認し、考えられる原因（Gatewayがすでに実行中、SSHトンネル）を報告します。

### 17) Gatewayランタイムのベストプラクティス

doctorは、GatewayサービスがBunまたはversion-manager経由のNodeパス（`nvm`, `fnm`, `volta`, `asdf` など）で動いている場合に警告します。WhatsApp + TelegramチャンネルにはNodeが必要で、version-managerパスはサービスがシェル初期化を読み込まないため、アップグレード後に壊れることがあります。利用可能であれば、doctorはシステムNodeインストール（Homebrew/apt/choco）への移行を提案します。

### 18) 設定書き込み + wizard metadata

doctorは設定変更を永続化し、doctor実行を記録するためにwizard metadataを記録します。

### 19) ワークスペースのヒント（バックアップ + メモリシステム）

doctorは、ワークスペースメモリシステムがない場合にそれを提案し、ワークスペースがまだgit管理下にない場合はバックアップのヒントを表示します。

ワークスペース構造とgitバックアップ（推奨: 非公開GitHubまたはGitLab）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

## 関連

- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
- [Gateway runbook](/ja-JP/gateway)
