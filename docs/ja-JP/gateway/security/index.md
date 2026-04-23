---
read_when:
    - アクセス範囲や自動化を拡大する機能を追加すること
summary: シェルアクセスを持つAI Gatewayを実行する際のセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-04-23T04:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47f524e57500faff35363f656c199e60bf51364f6aeb94114e1a0885ce04b128
    source_path: gateway/security/index.md
    workflow: 15
---

# セキュリティ

<Warning>
**パーソナルアシスタントの信頼モデル:** このガイダンスは、Gatewayごとに1つの信頼されたオペレーター境界（単一ユーザー/パーソナルアシスタントモデル）を前提としています。
OpenClaw は、1つのagent/Gatewayを複数の敵対的ユーザーが共有するような、敵対的マルチテナントのセキュリティ境界では**ありません**。
信頼が混在する運用や敵対的ユーザーを扱う必要がある場合は、信頼境界を分離してください（Gateway + 認証情報を分け、できればOSユーザー/ホストも分離します）。
</Warning>

**このページの内容:** [信頼モデル](#scope-first-personal-assistant-security-model) | [クイック監査](#quick-check-openclaw-security-audit) | [強化済みベースライン](#hardened-baseline-in-60-seconds) | [DMアクセスモデル](#dm-access-model-pairing-allowlist-open-disabled) | [設定の強化](#configuration-hardening-examples) | [インシデント対応](#incident-response)

## まずスコープから: パーソナルアシスタントのセキュリティモデル

OpenClaw のセキュリティガイダンスは、**パーソナルアシスタント**としてのデプロイを前提としています。つまり、信頼された1つのオペレーター境界があり、その中に複数のagentが存在しうるというモデルです。

- サポートされるセキュリティ姿勢: Gatewayごとに1ユーザー/1信頼境界（各境界に対して1 OSユーザー/1ホスト/1 VPSを推奨）。
- サポートされないセキュリティ境界: 相互に信頼していない、または敵対的なユーザーが1つの共有Gateway/agentを使うこと。
- 敵対的ユーザーの分離が必要な場合は、信頼境界ごとに分離してください（Gateway + 認証情報を別にし、できればOSユーザー/ホストも分離）。
- 複数の信頼されていないユーザーが1つのツール有効agentにメッセージできる場合、それらのユーザーはそのagentに委任された同じツール権限を共有しているものとして扱ってください。

このページでは、**このモデルの中での**強化方法を説明します。1つの共有Gateway上での敵対的マルチテナント分離を主張するものではありません。

## クイックチェック: `openclaw security audit`

参照: [Formal Verification (Security Models)](/ja-JP/security/formal-verification)

これを定期的に実行してください（特にconfigを変更した後や、ネットワーク面を公開した後）。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に対象を絞っています。よくある open group ポリシーを allowlist に切り替え、`logging.redactSensitive: "tools"` を復元し、state/config/include-file の権限を強化し、Windows上で実行している場合は POSIX `chmod` の代わりに Windows ACL リセットを使用します。

これは、よくある危険ポイント（Gateway認証の露出、ブラウザ制御の露出、昇格された allowlist、ファイルシステム権限、緩い exec 承認、open-channel のツール露出）を検出します。

OpenClaw は製品であると同時に実験でもあります。最先端モデルの振る舞いを、実際のメッセージング面と実際のツールへ接続しているのです。**「完全に安全な」セットアップは存在しません。** 目標は、以下について意図的であることです。

- 誰があなたのbotと会話できるか
- botがどこで動作してよいか
- botが何に触れてよいか

まずは、動作に必要な最小のアクセスから始めて、自信がつくにつれて段階的に広げてください。

### デプロイとホストの信頼

OpenClaw は、ホストとconfig境界が信頼されていることを前提とします。

- 誰かがGatewayホストのstate/config（`openclaw.json` を含む `~/.openclaw`）を変更できるなら、その人は信頼されたオペレーターとして扱ってください。
- 相互に信頼していない/敵対的な複数のオペレーターのために1つのGatewayを実行するのは、**推奨される構成ではありません**。
- 信頼が混在するチームでは、別々のGatewayで信頼境界を分離してください（少なくともOSユーザー/ホストは分離）。
- 推奨されるデフォルト: マシン/ホスト（またはVPS）ごとに1ユーザー、そのユーザー用に1 Gateway、そのGateway内に1つ以上のagent。
- 1つのGatewayインスタンス内では、認証済みオペレーターアクセスは信頼されたコントロールプレーン役割であり、ユーザーごとのテナント役割ではありません。
- セッション識別子（`sessionKey`、セッションID、ラベル）はルーティングセレクターであり、認可トークンではありません。
- 複数人が1つのツール有効agentにメッセージできる場合、それぞれが同じ権限セットを操作できます。ユーザーごとのセッション/メモリ分離はプライバシーには役立ちますが、共有agentをユーザーごとのホスト認可に変えるものではありません。

### 共有Slackワークスペース: 実際のリスク

「Slackの全員がbotにメッセージできる」場合、中核的なリスクは委任されたツール権限です。

- 許可された送信者なら誰でも、agentのポリシー内でツール呼び出し（`exec`、ブラウザ、ネットワーク/ファイルツール）を誘発できます。
- 1人の送信者によるプロンプト/コンテンツインジェクションが、共有state、デバイス、出力に影響するアクションを引き起こす可能性があります。
- 1つの共有agentが機密認証情報/ファイルを持っている場合、許可された送信者は誰でも、ツール使用を通じてその流出を引き起こせる可能性があります。

チームワークフローには最小限のツールを備えた別々のagent/Gatewayを使用し、個人データを扱うagentは非公開に保ってください。

### 会社共有のagent: 許容されるパターン

これは、そのagentを使う全員が同じ信頼境界内にあり（たとえば1つの会社チーム）、かつagentが厳密に業務範囲に限定されている場合には許容されます。

- 専用のマシン/VM/コンテナ上で実行する。
- そのランタイム専用のOSユーザー + 専用のブラウザ/プロファイル/アカウントを使う。
- そのランタイムで個人のApple/Googleアカウントや、個人のパスワードマネージャ/ブラウザプロファイルにサインインしない。

同じランタイム上で個人IDと会社IDを混在させると、分離が崩れ、個人データ露出リスクが高まります。

## GatewayとNodeの信頼コンセプト

GatewayとNodeは、役割が異なる1つのオペレーター信頼ドメインとして扱ってください。

- **Gateway** はコントロールプレーンであり、ポリシー面です（`gateway.auth`、ツールポリシー、ルーティング）。
- **Node** は、そのGatewayとペアリングされたリモート実行面です（コマンド、デバイス操作、ホストローカル機能）。
- Gatewayに対して認証された呼び出し元は、Gatewayスコープで信頼されます。ペアリング後のNode操作は、そのNode上での信頼されたオペレーター操作です。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザーごとの認証ではありません。
- Exec承認（allowlist + ask）はオペレーター意図のガードレールであり、敵対的マルチテナント分離ではありません。
- 信頼された単一オペレーター構成に対するOpenClawの製品デフォルトは、`gateway`/`node` 上のホスト exec を承認プロンプトなしで許可することです（`security="full"`、引き締めない限り `ask="off"`）。このデフォルトは意図されたUXであり、それ自体が脆弱性ではありません。
- Exec承認は、正確なリクエストコンテキストと、ベストエフォートの直接的なローカルファイルオペランドに紐づきます。すべてのランタイム/インタープリタローダーパスを意味的にモデル化するものではありません。強い境界が必要なら、サンドボックス化とホスト分離を使ってください。

敵対的ユーザーの分離が必要な場合は、OSユーザー/ホスト単位で信頼境界を分け、別々のGatewayを実行してください。

## 信頼境界マトリクス

リスクをトリアージするときのクイックモデルとしてこれを使ってください。

| 境界または制御                                          | 意味                                              | よくある誤解                                                                  |
| ------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（token/password/trusted-proxy/device auth） | Gateway APIに対する呼び出し元を認証する           | 「安全であるには、すべてのフレームにメッセージごとの署名が必要」              |
| `sessionKey`                                            | コンテキスト/セッション選択のためのルーティングキー | 「セッションキーはユーザー認証境界である」                                   |
| プロンプト/コンテンツのガードレール                    | モデル悪用リスクを低減する                        | 「プロンプトインジェクションだけで認証バイパスが証明される」                  |
| `canvas.eval` / browser evaluate                        | 有効化されているときの意図的なオペレーター機能    | 「どんなJS eval プリミティブも、この信頼モデルでは自動的に脆弱性になる」      |
| ローカルTUIの `!` shell                                 | 明示的にオペレーターが起動するローカル実行         | 「ローカルshellの便利コマンドはリモートインジェクションである」               |
| NodeペアリングとNodeコマンド                            | ペアリング済みデバイス上でのオペレーターレベルのリモート実行 | 「リモートデバイス制御は、デフォルトで信頼されていないユーザーアクセスとして扱うべき」 |

## 設計上、脆弱性ではないもの

これらのパターンはよく報告されますが、実際の境界バイパスが示されない限り、通常は no-action でクローズされます。

- ポリシー/auth/サンドボックスバイパスなしの、プロンプトインジェクションだけのチェーン。
- 1つの共有ホスト/config 上での敵対的マルチテナント運用を前提とした主張。
- 共有Gateway構成で、通常のオペレーター読み取りパスアクセス（たとえば `sessions.list`/`sessions.preview`/`chat.history`）をIDORとして分類する主張。
- localhost限定デプロイに関する指摘（たとえば loopback-only Gateway での HSTS）。
- このリポジトリに存在しない受信パスに対するDiscord inbound Webhook署名の指摘。
- `system.run` に対して、実際の実行境界が依然としてGatewayのグローバルなNodeコマンドポリシー + Node自身の exec 承認であるにもかかわらず、Nodeペアリングメタデータを隠れた第2のコマンド単位承認レイヤーとして扱う報告。
- `sessionKey` を認証トークンとして扱う「ユーザーごとの認可がない」という指摘。

## 研究者向け事前チェックリスト

GHSAを開く前に、以下をすべて確認してください。

1. 再現が最新の `main` または最新リリースで依然として成立する。
2. 報告に、正確なコードパス（`file`、関数、行範囲）と、検証したバージョン/コミットが含まれている。
3. 影響が、文書化された信頼境界をまたいでいる（単なるプロンプトインジェクションではない）。
4. 主張が [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) に含まれていない。
5. 既存のアドバイザリに重複がないか確認済みである（該当する場合は正規のGHSAを再利用）。
6. デプロイ前提が明示されている（loopback/local か公開か、信頼されたオペレーターか信頼されていないオペレーターか）。

## 60秒でできる強化済みベースライン

まずこのベースラインを使い、その後、信頼されたagentごとにツールを選択的に再有効化してください。

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

これにより、Gatewayはローカル専用に保たれ、DMは分離され、コントロールプレーン/ランタイムツールはデフォルトで無効になります。

## 共有受信箱のクイックルール

複数人があなたのbotにDMできる場合:

- `session.dmScope: "per-channel-peer"`（または複数アカウントのチャネルでは `"per-account-channel-peer"`）を設定します。
- `dmPolicy: "pairing"` または厳格な allowlist を維持します。
- 共有DMと広範なツールアクセスを絶対に組み合わせないでください。
- これは協調的/共有の受信箱を強化しますが、ユーザーがホスト/config への書き込みアクセスを共有している場合の敵対的共同テナント分離を目的としたものではありません。

## コンテキスト可視性モデル

OpenClaw は2つの概念を分離しています。

- **トリガー認可**: 誰がagentを起動できるか（`dmPolicy`、`groupPolicy`、allowlist、メンションゲート）。
- **コンテキスト可視性**: どの補足コンテキストがモデル入力に注入されるか（返信本文、引用テキスト、スレッド履歴、転送メタデータ）。

Allowlists はトリガーとコマンド認可を制御します。`contextVisibility` 設定は、補足コンテキスト（引用返信、スレッドルート、取得履歴）をどのようにフィルタするかを制御します。

- `contextVisibility: "all"`（デフォルト）は、受信した補足コンテキストをそのまま保持します。
- `contextVisibility: "allowlist"` は、補足コンテキストを、現在有効な allowlist チェックで許可された送信者に絞ってフィルタします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、明示的な引用返信を1件だけ保持します。

`contextVisibility` はチャネルごと、またはルーム/会話ごとに設定できます。設定の詳細は [Group Chats](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

アドバイザリのトリアージ指針:

- 「モデルが allowlist にない送信者の引用テキストや履歴テキストを見られる」ことだけを示す主張は、`contextVisibility` で対処できる強化項目であり、それ自体ではauthやサンドボックス境界のバイパスではありません。
- セキュリティ影響があると見なされるには、報告は依然として、信頼境界のバイパス（auth、policy、sandbox、approval、または他の文書化された境界）を実証する必要があります。

## 監査がチェックする内容（概要）

- **受信アクセス**（DMポリシー、グループポリシー、allowlist）: 見知らぬ相手がbotを起動できますか？
- **ツールの影響範囲**（昇格ツール + open room）: プロンプトインジェクションがshell/ファイル/ネットワーク操作に変わる可能性はありますか？
- **Exec承認のドリフト**（`security=full`、`autoAllowSkills`、`strictInlineEval` なしのインタープリタ allowlist）: ホストexecのガードレールは、まだ意図どおりに機能していますか？
  - `security="full"` は広い姿勢に対する警告であり、バグの証明ではありません。これは信頼されたパーソナルアシスタント構成向けに選ばれたデフォルトです。脅威モデル上、承認やallowlistのガードレールが必要な場合にのみ引き締めてください。
- **ネットワーク露出**（Gateway bind/auth、Tailscale Serve/Funnel、弱い/短い認証トークン）。
- **ブラウザ制御の露出**（リモートNode、relay port、リモートCDPエンドポイント）。
- **ローカルディスク衛生**（権限、symlink、config include、「同期フォルダ」パス）。
- **Plugins**（明示的なallowlistなしでPluginがロードされる）。
- **ポリシードリフト/設定ミス**（sandbox docker設定はあるがsandbox modeがoff、`gateway.nodes.denyCommands` のパターンが無効になるケース。これは一致が正確なコマンド名のみ（たとえば `system.run`）に対して行われ、shellテキストは検査しないためです。また、危険な `gateway.nodes.allowCommands` エントリ、グローバルな `tools.profile="minimal"` がagentごとのプロファイルで上書きされるケース、緩いツールポリシー下で到達可能なPlugin所有ツールなど）。
- **ランタイム期待値のドリフト**（たとえば `tools.exec.host` のデフォルトが `auto` になったあとでも、暗黙のexecが `sandbox` を意味すると想定しているケース、またはsandbox modeがoffなのに明示的に `tools.exec.host="sandbox"` を設定しているケース）。
- **モデル衛生**（設定されたモデルがレガシーに見える場合に警告します。強制的なブロックではありません）。

`--deep` を実行すると、OpenClaw はベストエフォートでライブGatewayプローブも試みます。

## 認証情報保存マップ

アクセス監査やバックアップ対象の判断時には、これを使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否されます）
- **Discord bot token**: config/env または SecretRef（env/file/exec providers）
- **Slack tokens**: config/env（`channels.slack.*`）
- **ペアリング allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースの秘密情報ペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシーOAuthインポート**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査が検出結果を表示した場合は、以下の優先順位で扱ってください。

1. **「open」なもの + ツール有効**: まずDM/グループをロックダウンし（pairing/allowlist）、次にツールポリシー/サンドボックス化を強化します。
2. **公開ネットワーク露出**（LAN bind、Funnel、authなし）: ただちに修正してください。
3. **ブラウザ制御のリモート露出**: オペレーターアクセスと同等に扱ってください（tailnet限定、Nodeは意図的にペアリングし、公開露出を避ける）。
4. **権限**: state/config/認証情報/auth が group/world-readable でないことを確認してください。
5. **Plugins**: 明示的に信頼するものだけをロードしてください。
6. **モデル選択**: ツールを持つbotには、現代的で命令耐性の高いモデルを優先してください。

## セキュリティ監査用語集

実際のデプロイで目にする可能性が高い、高シグナルな `checkId` 値（網羅的ではありません）:

| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | 他のユーザー/プロセスがOpenClawの状態全体を変更できる                               | `~/.openclaw` のファイルシステム権限                                                                  | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | グループユーザーがOpenClawの状態全体を変更できる                                    | `~/.openclaw` のファイルシステム権限                                                                  | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | stateディレクトリが他者から読み取り可能                                              | `~/.openclaw` のファイルシステム権限                                                                  | yes      |
| `fs.state_dir.symlink`                                        | warn          | stateディレクトリの参照先が別の信頼境界になる                                        | stateディレクトリのファイルシステム構成                                                               | no       |
| `fs.config.perms_writable`                                    | critical      | 他者がauth/ツールポリシー/configを変更できる                                         | `~/.openclaw/openclaw.json` のファイルシステム権限                                                    | yes      |
| `fs.config.symlink`                                           | warn          | symlinkされたconfigファイルは書き込みで未サポートであり、別の信頼境界も追加される    | 通常のconfigファイルに置き換えるか、`OPENCLAW_CONFIG_PATH` を実ファイルに向ける                      | no       |
| `fs.config.perms_group_readable`                              | warn          | グループユーザーがconfigのトークン/設定を読める                                      | configファイルのファイルシステム権限                                                                  | yes      |
| `fs.config.perms_world_readable`                              | critical      | configからトークン/設定が露出する可能性がある                                        | configファイルのファイルシステム権限                                                                  | yes      |
| `fs.config_include.perms_writable`                            | critical      | config include ファイルを他者が変更できる                                            | `openclaw.json` から参照される include-file の権限                                                    | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | グループユーザーが include された秘密情報/設定を読める                               | `openclaw.json` から参照される include-file の権限                                                    | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | include された秘密情報/設定が world-readable になっている                            | `openclaw.json` から参照される include-file の権限                                                    | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | 他者が保存済みモデル認証情報を注入または置き換えできる                               | `agents/<agentId>/agent/auth-profiles.json` の権限                                                    | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | 他者がAPIキーとOAuthトークンを読める                                                 | `agents/<agentId>/agent/auth-profiles.json` の権限                                                    | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | 他者がチャネルのペアリング/認証情報の状態を変更できる                                | `~/.openclaw/credentials` のファイルシステム権限                                                      | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | 他者がチャネル認証情報の状態を読める                                                 | `~/.openclaw/credentials` のファイルシステム権限                                                      | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | 他者がセッショントランスクリプト/メタデータを読める                                  | セッションストアの権限                                                                                | yes      |
| `fs.log_file.perms_readable`                                  | warn          | 他者が、マスク済みではあっても依然として機微なログを読める                           | Gatewayログファイルの権限                                                                             | yes      |
| `fs.synced_dir`                                               | warn          | iCloud/Dropbox/Drive 上のstate/configはトークン/トランスクリプトの露出を広げる       | config/state を同期フォルダ外へ移動                                                                   | no       |
| `gateway.bind_no_auth`                                        | critical      | 共有秘密情報なしのリモートbind                                                       | `gateway.bind`、`gateway.auth.*`                                                                      | no       |
| `gateway.loopback_no_auth`                                    | critical      | リバースプロキシ経由のloopbackが未認証になる可能性がある                             | `gateway.auth.*`、プロキシ設定                                                                        | no       |
| `gateway.trusted_proxies_missing`                             | warn          | リバースプロキシヘッダーが存在するが信頼されていない                                 | `gateway.trustedProxies`                                                                              | no       |
| `gateway.http.no_auth`                                        | warn/critical | `auth.mode="none"` でGateway HTTP APIに到達できる                                    | `gateway.auth.mode`、`gateway.http.endpoints.*`                                                       | no       |
| `gateway.http.session_key_override_enabled`                   | info          | HTTP API呼び出し元が `sessionKey` を上書きできる                                     | `gateway.http.allowSessionKeyOverride`                                                                | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | HTTP API経由で危険なツールを再有効化する                                              | `gateway.tools.allow`                                                                                 | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | 影響の大きいNodeコマンド（camera/screen/contacts/calendar/SMS）を有効化する           | `gateway.nodes.allowCommands`                                                                         | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | パターン風のdenyエントリはshellテキストやグループに一致しない                         | `gateway.nodes.denyCommands`                                                                          | no       |
| `gateway.tailscale_funnel`                                    | critical      | 公開インターネットへの露出                                                            | `gateway.tailscale.mode`                                                                              | no       |
| `gateway.tailscale_serve`                                     | info          | Serve によりtailnet露出が有効になっている                                             | `gateway.tailscale.mode`                                                                              | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | loopback以外のControl UIで、明示的なブラウザオリジンallowlistがない                   | `gateway.controlUi.allowedOrigins`                                                                    | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` によりブラウザオリジンallowlistが無効になる                    | `gateway.controlUi.allowedOrigins`                                                                    | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Hostヘッダーのorigin fallback を有効にすると、DNS rebinding 強化が弱くなる            | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                          | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | insecure-auth 互換トグルが有効                                                        | `gateway.controlUi.allowInsecureAuth`                                                                 | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | デバイスIDチェックを無効化する                                                        | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                      | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | `X-Real-IP` fallback を信頼すると、プロキシ設定ミス経由で送信元IP偽装を許す可能性がある | `gateway.allowRealIpFallback`、`gateway.trustedProxies`                                               | no       |
| `gateway.token_too_short`                                     | warn          | 短い共有トークンはブルートフォースされやすい                                          | `gateway.auth.token`                                                                                  | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | レート制限なしの公開authはブルートフォースリスクを高める                              | `gateway.auth.rateLimit`                                                                              | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | プロキシIDがauth境界になる                                                            | `gateway.auth.mode="trusted-proxy"`                                                                   | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy auth に trusted proxy IP がないのは危険                                 | `gateway.trustedProxies`                                                                              | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy auth がユーザーIDを安全に解決できない                                   | `gateway.auth.trustedProxy.userHeader`                                                                | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy auth が認証済み上流ユーザーを誰でも受け入れる                           | `gateway.auth.trustedProxy.allowUsers`                                                                | no       |
| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | このコマンド経路では詳細プローブが auth SecretRef を解決できませんでした             | 詳細プローブの auth ソース / SecretRef の可用性                                                       | no       |
| `gateway.probe_failed`                                        | warn/critical | ライブGatewayプローブが失敗した                                                      | Gateway到達性/auth                                                                                    | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | mDNS full mode はローカルネットワーク上に `cliPath`/`sshPort` メタデータを広告する   | `discovery.mdns.mode`、`gateway.bind`                                                                 | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | いずれかの insecure/dangerous デバッグフラグが有効                                   | 複数キー（詳細は検出内容を参照）                                                                      | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | Gatewayパスワードがconfigに直接保存されている                                        | `gateway.auth.password`                                                                               | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | Hook bearer token がconfigに直接保存されている                                       | `hooks.token`                                                                                         | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | Hook受信トークンがGateway authの解除にも使われる                                     | `hooks.token`、`gateway.auth.token`                                                                   | no       |
| `hooks.token_too_short`                                       | warn          | Hook受信でブルートフォースされやすくなる                                             | `hooks.token`                                                                                         | no       |
| `hooks.default_session_key_unset`                             | warn          | Hook agent の実行が、生成されたリクエストごとのセッションにファンアウトする           | `hooks.defaultSessionKey`                                                                             | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | 認証済みHook呼び出し元が、設定済みの任意のagentへルーティングできる                  | `hooks.allowedAgentIds`                                                                               | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | 外部呼び出し元が sessionKey を選択できる                                             | `hooks.allowRequestSessionKey`                                                                        | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | 外部 session key の形に制限がない                                                    | `hooks.allowedSessionKeyPrefixes`                                                                     | no       |
| `hooks.path_root`                                             | critical      | Hookパスが `/` であり、受信の衝突や誤ルーティングが起きやすい                         | `hooks.path`                                                                                          | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Hookインストール記録が不変のnpm specに固定されていない                               | Hookインストールメタデータ                                                                            | no       |
| `hooks.installs_missing_integrity`                            | warn          | Hookインストール記録に integrity メタデータがない                                     | Hookインストールメタデータ                                                                            | no       |
| `hooks.installs_version_drift`                                | warn          | Hookインストール記録がインストール済みパッケージとずれている                          | Hookインストールメタデータ                                                                            | no       |
| `logging.redact_off`                                          | warn          | 機微な値がログ/status に漏れる                                                        | `logging.redactSensitive`                                                                             | yes      |
| `browser.control_invalid_config`                              | warn          | ブラウザ制御configが実行前の時点で不正                                                | `browser.*`                                                                                           | no       |
| `browser.control_no_auth`                                     | critical      | ブラウザ制御が token/password auth なしで公開されている                              | `gateway.auth.*`                                                                                      | no       |
| `browser.remote_cdp_http`                                     | warn          | 平文HTTP上のリモートCDPには通信暗号化がない                                           | ブラウザプロファイル `cdpUrl`                                                                         | no       |
| `browser.remote_cdp_private_host`                             | warn          | リモートCDPが private/internal ホストを対象にしている                                | ブラウザプロファイル `cdpUrl`、`browser.ssrfPolicy.*`                                                 | no       |
| `sandbox.docker_config_mode_off`                              | warn          | Sandbox Docker設定はあるが無効                                                        | `agents.*.sandbox.mode`                                                                               | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | 相対bind mount は予測しにくい形で解決される可能性がある                              | `agents.*.sandbox.docker.binds[]`                                                                     | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | Sandbox bind mount の対象が、ブロック対象のシステム、認証情報、またはDocker socketパス | `agents.*.sandbox.docker.binds[]`                                                                     | no       |
| `sandbox.dangerous_network_mode`                              | critical      | Sandbox Dockerネットワークが `host` または `container:*` のnamespace-join modeを使う | `agents.*.sandbox.docker.network`                                                                     | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | Sandbox seccomp profile がコンテナ分離を弱める                                        | `agents.*.sandbox.docker.securityOpt`                                                                 | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | Sandbox AppArmor profile がコンテナ分離を弱める                                       | `agents.*.sandbox.docker.securityOpt`                                                                 | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | Sandbox browser bridge が送信元範囲制限なしで公開されている                           | `sandbox.browser.cdpSourceRange`                                                                      | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | 既存のブラウザコンテナが、loopback以外のインターフェイスでCDPを公開している           | ブラウザsandboxコンテナの公開設定                                                                     | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | 既存のブラウザコンテナが現在のconfig-hashラベルより前のもの                          | `openclaw sandbox recreate --browser --all`                                                           | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | 既存のブラウザコンテナが現在のブラウザconfig epoch より前のもの                      | `openclaw sandbox recreate --browser --all`                                                           | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` はsandboxがoffだと fail closed する                               | `tools.exec.host`、`agents.defaults.sandbox.mode`                                                     | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | agentごとの `exec host=sandbox` はsandboxがoffだと fail closed する                   | `agents.list[].tools.exec.host`、`agents.list[].sandbox.mode`                                         | no       |
| `tools.exec.security_full_configured`                         | warn/critical | ホストexecが `security="full"` で動作している                                         | `tools.exec.security`、`agents.list[].tools.exec.security`                                            | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Exec承認が skill bin を暗黙に信頼する                                                 | `~/.openclaw/exec-approvals.json`                                                                     | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | インタープリタ allowlist が、再承認強制なしで inline eval を許可する                  | `tools.exec.strictInlineEval`、`agents.list[].tools.exec.strictInlineEval`、exec approvals allowlist | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | `safeBins` 内のインタープリタ/ランタイムbinに明示的プロファイルがなく、execリスクが広がる | `tools.exec.safeBins`、`tools.exec.safeBinProfiles`、`agents.list[].tools.exec.*`                    | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | `safeBins` 内の広範な挙動を持つツールが、低リスクstdin-filter信頼モデルを弱める        | `tools.exec.safeBins`、`agents.list[].tools.exec.safeBins`                                            | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` に変更可能または危険なディレクトリが含まれている                 | `tools.exec.safeBinTrustedDirs`、`agents.list[].tools.exec.safeBinTrustedDirs`                        | no       |
| `skills.workspace.symlink_escape`                             | warn          | workspace `skills/**/SKILL.md` がworkspace root外へ解決される（symlink-chain drift）  | workspace `skills/**` のファイルシステム状態                                                          | no       |
| `plugins.extensions_no_allowlist`                             | warn          | 明示的なPlugin allowlist なしでPluginsがインストールされている                        | `plugins.allowlist`                                                                                   | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Pluginインストール記録が不変のnpm specに固定されていない                              | Pluginインストールメタデータ                                                                          | no       |
| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `plugins.installs_missing_integrity`                          | warn          | Pluginインストール記録に integrity メタデータがない                                  | Pluginインストールメタデータ                                                                          | no       |
| `plugins.installs_version_drift`                              | warn          | Pluginインストール記録がインストール済みパッケージとずれている                       | Pluginインストールメタデータ                                                                          | no       |
| `plugins.code_safety`                                         | warn/critical | Plugincodeスキャンで不審または危険なパターンが見つかった                             | Plugincode / インストール元                                                                           | no       |
| `plugins.code_safety.entry_path`                              | warn          | Pluginエントリパスが hidden または `node_modules` 配下を指している                   | Pluginマニフェスト `entry`                                                                            | no       |
| `plugins.code_safety.entry_escape`                            | critical      | PluginエントリがPluginディレクトリを逸脱している                                     | Pluginマニフェスト `entry`                                                                            | no       |
| `plugins.code_safety.scan_failed`                             | warn          | Plugincodeスキャンを完了できなかった                                                  | Pluginパス / スキャン環境                                                                             | no       |
| `skills.code_safety`                                          | warn/critical | Skillインストーラのメタデータ/code に不審または危険なパターンが含まれる              | Skillインストール元                                                                                   | no       |
| `skills.code_safety.scan_failed`                              | warn          | Skillコードスキャンを完了できなかった                                                 | Skillスキャン環境                                                                                     | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | 共有/公開ルームから exec 有効agent に到達できる                                      | `channels.*.dmPolicy`、`channels.*.groupPolicy`、`tools.exec.*`、`agents.list[].tools.exec.*`       | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | open group + 昇格ツールにより、影響の大きいプロンプトインジェクション経路が生まれる   | `channels.*.groupPolicy`、`tools.elevated.*`                                                          | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | open group から、sandbox/workspace ガードなしでコマンド/ファイルツールに到達できる   | `channels.*.groupPolicy`、`tools.profile/deny`、`tools.fs.workspaceOnly`、`agents.*.sandbox.mode`   | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | Gatewayの信頼モデルはパーソナルアシスタントなのに、config がマルチユーザーに見える    | 信頼境界を分離するか、共有ユーザー向けの強化（`sandbox.mode`、tool deny/workspace スコープ）         | no       |
| `tools.profile_minimal_overridden`                            | warn          | agent の上書きがグローバル minimal プロファイルを迂回する                             | `agents.list[].tools.profile`                                                                         | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | 拡張機能ツールが緩いコンテキストで到達可能                                            | `tools.profile` + tool allow/deny                                                                     | no       |
| `models.legacy`                                               | warn          | レガシーモデルファミリーが依然として設定されている                                    | モデル選択                                                                                            | no       |
| `models.weak_tier`                                            | warn          | 設定されたモデルが、現在推奨されるティアより下にある                                  | モデル選択                                                                                            | no       |
| `models.small_params`                                         | critical/info | 小規模モデル + 安全でないツール面はインジェクションリスクを高める                     | モデル選択 + sandbox/ツールポリシー                                                                   | no       |
| `summary.attack_surface`                                      | info          | auth、チャネル、ツール、露出姿勢の集約要約                                            | 複数キー（詳細は検出内容を参照）                                                                      | no       |

## HTTP経由のControl UI

Control UI がデバイスIDを生成するには、**安全なコンテキスト**（HTTPS または localhost）が必要です。`gateway.controlUi.allowInsecureAuth` はローカル互換性のためのトグルです。

- localhost では、ページが安全でないHTTP経由で読み込まれた場合でも、デバイスIDなしでControl UI auth を許可します。
- これはペアリングチェックをバイパスしません。
- これはリモート（localhost以外）のデバイスID要件を緩和しません。

HTTPS（Tailscale Serve）を使うか、`127.0.0.1` でUIを開くことを推奨します。

緊急時専用の手段として、`gateway.controlUi.dangerouslyDisableDeviceAuth` はデバイスIDチェックを完全に無効化します。これは深刻なセキュリティ低下です。積極的にデバッグしていて、すぐ元に戻せる場合を除き、off のままにしてください。

これらの dangerous フラグとは別に、`gateway.auth.mode: "trusted-proxy"` が成功した場合、デバイスIDなしで**オペレーター**のControl UIセッションを受け入れることがあります。これは意図された auth-mode の挙動であり、`allowInsecureAuth` の近道ではありません。また、node-role のControl UIセッションには拡張されません。

この設定が有効な場合、`openclaw security audit` は警告を出します。

## insecure または dangerous フラグの要約

`openclaw security audit` は、既知の insecure/dangerous なデバッグスイッチが有効なときに `config.insecure_or_dangerous_flags` を含めます。このチェックは現在、以下を集約します。

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

OpenClaw config schema で定義されている完全な `dangerous*` / `dangerously*` configキー:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (Pluginチャネル)
- `channels.zalouser.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.irc.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.mattermost.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (Pluginチャネル)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## リバースプロキシ設定

Gateway をリバースプロキシ（nginx、Caddy、Traefik など）の背後で動かす場合は、転送されたクライアントIPを正しく扱うために `gateway.trustedProxies` を設定してください。

Gateway は、`trustedProxies` に**含まれていない**アドレスからのプロキシヘッダーを検出した場合、その接続をローカルクライアントとは見なしません。Gateway auth が無効なら、その接続は拒否されます。これにより、プロキシ経由の接続が localhost 由来に見えて自動的に信頼されてしまう認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、この auth mode はより厳格です。

- trusted-proxy auth は **loopback送信元プロキシでは fail closed** します
- 同一ホスト上の loopback リバースプロキシでも、ローカルクライアント判定と転送IP処理のために `gateway.trustedProxies` は使用できます
- 同一ホスト上の loopback リバースプロキシでは、`gateway.auth.mode: "trusted-proxy"` ではなく token/password auth を使ってください

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies` が設定されると、Gateway は `X-Forwarded-For` を使ってクライアントIPを判断します。`gateway.allowRealIpFallback: true` を明示的に設定しない限り、`X-Real-IP` はデフォルトで無視されます。

適切なリバースプロキシ動作（受信した転送ヘッダーを上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不適切なリバースプロキシ動作（信頼されていない転送ヘッダーを追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS と origin に関する注意

- OpenClaw Gateway は local/loopback first です。TLS をリバースプロキシで終端する場合は、そのプロキシ前面のHTTPSドメイン側で HSTS を設定してください。
- Gateway 自体がHTTPSを終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClaw のレスポンスから HSTS ヘッダーを出せます。
- 詳細なデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- loopback以外のControl UIデプロイでは、`gateway.controlUi.allowedOrigins` がデフォルトで必須です。
- `gateway.controlUi.allowedOrigins: ["*"]` は、ブラウザoriginをすべて許可する明示的なポリシーであり、強化されたデフォルトではありません。厳密に制御されたローカルテスト以外では避けてください。
- 一般的な loopback 免除が有効でも、loopback 上のブラウザorigin認証失敗には引き続きレート制限が適用されます。ただし、ロックアウトキーは1つの共有localhostバケットではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Hostヘッダー origin fallback mode を有効にします。危険な、オペレーターが選択したポリシーとして扱ってください。
- DNS rebinding とプロキシのHostヘッダー挙動は、デプロイ強化上の懸念として扱ってください。`trustedProxies` は厳密に絞り、Gatewayを直接パブリックインターネットへ公開しないでください。

## ローカルセッションログはディスク上に存在します

OpenClaw はセッショントランスクリプトを `~/.openclaw/agents/<agentId>/sessions/*.jsonl` に保存します。
これはセッション継続性と（任意で）セッションメモリインデックスのために必要ですが、同時に **ファイルシステムアクセス権を持つ任意のプロセス/ユーザーがそれらのログを読める** ことも意味します。ディスクアクセスを信頼境界として扱い、`~/.openclaw` の権限を厳格にしてください（下の監査セクションを参照）。agent間でより強い分離が必要なら、別々のOSユーザーまたは別々のホストで実行してください。

## Node実行（`system.run`）

macOS Node がペアリングされている場合、Gateway はそのNode上で `system.run` を呼び出せます。これは Mac 上での**リモートコード実行**です。

- Nodeペアリング（承認 + token）が必要です。
- GatewayのNodeペアリングは、コマンドごとの承認面ではありません。これはNodeのID/信頼と token 発行を確立します。
- Gateway は `gateway.nodes.allowCommands` / `denyCommands` による粗いグローバルNodeコマンドポリシーを適用します。
- Mac側では **Settings → Exec approvals** で制御します（security + ask + allowlist）。
- Nodeごとの `system.run` ポリシーは、そのNode自身の exec approvals ファイル（`exec.approvals.node.*`）であり、GatewayのグローバルなコマンドIDポリシーより厳しいことも緩いこともあります。
- `security="full"` かつ `ask="off"` で動作するNodeは、信頼されたオペレーターモデルのデフォルトに従っています。デプロイでより厳しい承認やallowlistの姿勢を明示的に必要としていない限り、これを想定どおりの挙動として扱ってください。
- 承認モードは、正確なリクエストコンテキストと、可能な場合は1つの具体的なローカルscript/file オペランドに紐づきます。インタープリタ/ランタイムコマンドに対して、OpenClaw が正確に1つの直接ローカルファイルを特定できない場合、承認ベースの実行は、完全な意味的カバレッジを約束するのではなく拒否されます。
- `host=node` の場合、承認ベース実行では正規化された準備済み `systemRunPlan` も保存されます。後続の承認済み転送ではその保存済みプランが再利用され、Gatewayの検証は、承認リクエスト作成後の呼び出し元による command/cwd/session context の編集を拒否します。
- リモート実行を望まないなら、security を **deny** に設定し、そのMacのNodeペアリングを解除してください。

この区別はトリアージで重要です。

- 再接続したペアリング済みNodeが異なるコマンド一覧を広告していても、それだけで脆弱性にはなりません。実際の実行境界が、GatewayのグローバルポリシーとNodeのローカル exec approvals によって引き続き強制されているなら問題ありません。
- Nodeペアリングメタデータを、隠れた第2のコマンド単位承認レイヤーとして扱う報告は、通常はポリシー/UXの混同であり、セキュリティ境界のバイパスではありません。

## 動的Skills（watcher / リモートNode）

OpenClaw はセッションの途中で Skills 一覧を更新できます。

- **Skills watcher**: `SKILL.md` への変更は、次のagentターンで Skills スナップショットを更新できます。
- **リモートNode**: macOS Node が接続されると、macOS限定のSkillsが使用可能になることがあります（bin probe に基づく）。

Skillフォルダは**信頼されたコード**として扱い、誰が変更できるかを制限してください。

## 脅威モデル

AIアシスタントは次のことができます。

- 任意のシェルコマンドを実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- （WhatsAppアクセスを与えれば）誰にでもメッセージを送れる

あなたにメッセージを送る人は次のことを試みる可能性があります。

- AIをだまして悪いことをさせる
- あなたのデータへのアクセスをソーシャルエンジニアリングする
- インフラの詳細を探る

## コア概念: 知能より前にアクセス制御

ここでの多くの失敗は高度なエクスプロイトではなく、「誰かがbotにメッセージし、botがその依頼どおりに動いた」というものです。

OpenClaw の立場:

- **まずID:** 誰がbotと会話できるかを決める（DM pairing / allowlist / 明示的な「open」）。
- **次にスコープ:** botがどこで動作してよいかを決める（グループ allowlist + メンションゲート、ツール、サンドボックス化、デバイス権限）。
- **最後にモデル:** モデルは操作されうると仮定し、操作されても影響範囲が限定されるように設計する。

## コマンド認可モデル

スラッシュコマンドとディレクティブは、**認可された送信者**に対してのみ処理されます。認可は、チャネル allowlist/pairing と `commands.useAccessGroups` から導出されます（[Configuration](/ja-JP/gateway/configuration) および [Slash commands](/ja-JP/tools/slash-commands) を参照）。チャネル allowlist が空、または `"*"` を含む場合、そのチャネルではコマンドは事実上 open になります。

`/exec` は認可済みオペレーター向けの、セッション専用の利便コマンドです。これはconfigを書き換えたり、他のセッションを変更したりはしません。

## コントロールプレーンツールのリスク

2つの組み込みツールは、永続的なコントロールプレーン変更を行えます。

- `gateway` は `config.schema.lookup` / `config.get` でconfigを調べられ、`config.apply`、`config.patch`、`update.run` で永続的変更を行えます。
- `cron` は、元のチャット/タスクが終わった後も動作し続けるスケジュールジョブを作成できます。

owner-only の `gateway` ランタイムツールは、依然として `tools.exec.ask` や `tools.exec.security` の書き換えを拒否します。レガシーな `tools.bash.*` エイリアスは、書き込み前に同じ保護された exec パスへ正規化されます。

信頼されていないコンテンツを扱うagent/サーフェスでは、これらをデフォルトで拒否してください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` は再起動アクションをブロックするだけです。`gateway` の config/update アクションは無効化しません。

## Plugins

Plugins はGatewayと**同一プロセス内**で実行されます。信頼されたコードとして扱ってください:

- 信頼できるソースからのみPluginをインストールしてください。
- 明示的な `plugins.allow` allowlist を優先してください。
- 有効化前にPlugin config を確認してください。
- Plugin変更後はGatewayを再起動してください。
- Plugins をインストールまたは更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、信頼されていないコードを実行するのと同様に扱ってください:
  - インストール先は、アクティブなPluginインストールルート配下の、Pluginごとのディレクトリです。
  - OpenClaw は install/update 前に組み込みの危険コードスキャンを実行します。`critical` 検出はデフォルトでブロックされます。
  - OpenClaw は `npm pack` を使い、そのディレクトリで `npm install --omit=dev` を実行します（npm lifecycle script は install 中にコードを実行する可能性があります）。
  - 固定された正確なバージョン（`@scope/pkg@1.2.3`）を優先し、有効化前に展開済みコードをディスク上で確認してください。
  - `--dangerously-force-unsafe-install` は、Pluginの install/update フローにおける組み込みスキャンの誤検知に対する緊急用手段です。これは Plugin の `before_install` hook ポリシーブロックをバイパスせず、スキャン失敗もバイパスしません。
  - Gatewayバックの Skill依存関係インストールも同じ危険/不審の区別に従います。組み込みの `critical` 検出は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を設定しない限りブロックされます。一方、不審な検出は警告のみです。`openclaw skills install` は引き続き、ClawHub の Skillダウンロード/インストール用の別フローです。

詳細: [Plugins](/ja-JP/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## DMアクセスモデル（pairing / allowlist / open / disabled）

現在DM対応しているすべてのチャネルは、メッセージが処理される**前に**受信DMを制御する DMポリシー（`dmPolicy` または `*.dm.policy`）をサポートしています。

- `pairing`（デフォルト）: 未知の送信者には短いペアリングコードが送られ、承認されるまでbotはそのメッセージを無視します。コードの有効期限は1時間です。繰り返しDMしても、新しいリクエストが作られるまでは再送されません。保留中リクエストはデフォルトで**チャネルごとに3件**までです。
- `allowlist`: 未知の送信者はブロックされます（ペアリングハンドシェイクなし）。
- `open`: 誰でもDM可能にします（公開）。チャネルallowlist に `"*"` を含めることが**必要**です（明示的オプトイン）。
- `disabled`: 受信DMを完全に無視します。

CLIで承認:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上のファイル: [Pairing](/ja-JP/channels/pairing)

## DMセッション分離（マルチユーザーモード）

デフォルトでは、OpenClaw は**すべてのDMをメインセッションにルーティング**し、デバイスやチャネルをまたいだ継続性をアシスタントに持たせます。**複数人**がbotにDMできる場合（open DMs または複数人 allowlist）、DMセッションの分離を検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、グループチャットを分離したまま、ユーザー間のコンテキスト漏えいを防げます。

これはメッセージングコンテキストの境界であり、ホスト管理者の境界ではありません。ユーザー同士が敵対的で、同じGatewayホスト/config を共有している場合は、信頼境界ごとに別々のGatewayを実行してください。

### セキュアDMモード（推奨）

上のスニペットを**セキュアDMモード**として扱ってください。

- デフォルト: `session.dmScope: "main"`（すべてのDMが継続性のために1つのセッションを共有）
- ローカルCLIオンボーディングのデフォルト: 未設定時に `session.dmScope: "per-channel-peer"` を書き込みます（既存の明示値は保持）
- セキュアDMモード: `session.dmScope: "per-channel-peer"`（各チャネル+送信者ペアに分離されたDMコンテキスト）
- チャネル横断のpeer分離: `session.dmScope: "per-peer"`（各送信者が同じ種類のすべてのチャネルで1つのセッションを持つ）

同じチャネルで複数アカウントを運用している場合は、代わりに `per-account-channel-peer` を使ってください。同じ人物が複数チャネルから連絡してくる場合は、`session.identityLinks` を使ってそれらのDMセッションを1つの正規IDに統合します。詳しくは [Session Management](/ja-JP/concepts/session) と [Configuration](/ja-JP/gateway/configuration) を参照してください。

## Allowlists（DM + グループ）- 用語

OpenClaw には、「誰が自分を起動できるか」を決める別々の2層があります。

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`。旧形式: `channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）: ダイレクトメッセージでbotと会話することを許可される相手。
  - `dmPolicy="pairing"` のとき、承認は `~/.openclaw/credentials/` 配下のアカウントスコープ付き pairing allowlist ストアに書き込まれます（デフォルトアカウントは `<channel>-allowFrom.json`、デフォルト以外は `<channel>-<accountId>-allowFrom.json`）。これはconfig allowlist とマージされます。
- **グループ allowlist**（チャネル固有）: botがそもそもどのグループ/チャネル/guild からのメッセージを受け付けるか。
  - 一般的なパターン:
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`: `requireMention` のようなグループごとのデフォルト。設定するとグループ allowlist としても機能します（全許可動作を維持するには `"*"` を含めます）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: グループセッション内でbotを起動できる相手を制限します（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: サーフェスごとの allowlist + メンションデフォルト。
  - グループチェックの順序は次のとおりです: まず `groupPolicy`/グループ allowlist、次にメンション/返信アクティベーション。
  - botメッセージへの返信（暗黙のメンション）は、`groupAllowFrom` のような送信者 allowlist をバイパスしません。
  - **セキュリティ注意:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。これらはほとんど使うべきではなく、room の全メンバーを完全に信頼している場合を除き、pairing + allowlists を優先してください。

詳細: [Configuration](/ja-JP/gateway/configuration) と [Groups](/ja-JP/channels/groups)

## プロンプトインジェクション（何か、なぜ重要か）

プロンプトインジェクションとは、攻撃者がメッセージを細工して、モデルに安全でないことをさせようとすることです（「指示を無視しろ」「ファイルシステムを全部出力しろ」「このリンクを開いてコマンドを実行しろ」など）。

強力なシステムプロンプトがあっても、**プロンプトインジェクションは未解決です**。システムプロンプトのガードレールはあくまでソフトなガイダンスにすぎず、ハードな強制はツールポリシー、exec 承認、サンドボックス化、チャネル allowlist から来ます（しかもオペレーターは設計上これらを無効化できます）。実運用で役立つもの:

- 受信DMはロックダウンしておく（pairing/allowlists）。
- グループではメンションゲートを優先し、公開roomでの「常時待機」botを避ける。
- リンク、添付ファイル、貼り付けられた指示は、デフォルトで敵対的なものとして扱う。
- 機微なツール実行はサンドボックスで行い、秘密情報をagentから到達可能なファイルシステム外に置く。
- 注: サンドボックス化はオプトインです。sandbox mode がoff の場合、暗黙の `host=auto` は gatewayホストに解決されます。明示的な `host=sandbox` は、利用可能なsandboxランタイムがないため fail closed します。この挙動をconfig上で明示したい場合は `host=gateway` を設定してください。
- 高リスクツール（`exec`、`browser`、`web_fetch`、`web_search`）は、信頼されたagentまたは明示的な allowlist に限定する。
- インタープリタ（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）をallowlistに入れる場合は、inline eval 形式にも明示的な承認が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- Shell承認分析は、**クォートされていない heredoc** 内のPOSIXパラメータ展開形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`）も拒否します。これにより、allowlist に入った heredoc 本文が、平文として allowlist 審査をすり抜けて shell展開を持ち込むことを防ぎます。リテラル本文セマンティクスを選ぶには、heredoc 終端をクォートしてください（例: `<<'EOF'`）。変数展開されるはずの未クォート heredoc は拒否されます。
- **モデル選択は重要です:** 古い/小さい/レガシーモデルは、プロンプトインジェクションやツール誤用に対して著しく脆弱です。ツール有効agentには、利用可能な中で最も強力な最新世代の命令耐性モデルを使ってください。

信頼してはいけない危険信号:

- 「このファイル/URLを読んで、その指示どおりに正確に実行して」
- 「システムプロンプトや安全ルールを無視して」
- 「隠し指示やツール出力を見せて」
- 「`~/.openclaw` やログの内容を全部貼って」

## 外部コンテンツの special-token サニタイズ

OpenClaw は、ラップされた外部コンテンツとメタデータがモデルに到達する前に、一般的なセルフホストLLMのチャットテンプレート special-token リテラルを除去します。対象となるマーカーファミリーには、Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS の role/turn token が含まれます。

理由:

- セルフホストモデルを前段に置いた OpenAI互換バックエンドは、ユーザーテキストに現れた special tokens をマスクせず、そのまま保持することがあります。受信外部コンテンツ（取得ページ、メール本文、ファイル内容ツール出力など）に攻撃者が書き込める場合、合成された `assistant` や `system` の role boundary を注入し、ラップされたコンテンツのガードレールを突破できてしまいます。
- サニタイズは外部コンテンツのラップ層で行われるため、プロバイダごとではなく、fetch/read ツールや受信チャネルコンテンツ全体に一様に適用されます。
- モデルの出力応答には、すでに `<tool_call>`、`<function_calls>`、その他の同種の足場をユーザー向け返信から除去する別のサニタイザがあります。外部コンテンツサニタイザはその受信側に相当します。

これは、このページの他の強化策を置き換えるものではありません。`dmPolicy`、allowlists、exec 承認、サンドボックス化、`contextVisibility` が依然として主な役割を果たします。これは、special tokens を保持したままユーザーテキストを転送するセルフホストスタックに対する、トークナイザ層の特定のバイパスを塞ぐものです。

## unsafe external content バイパスフラグ

OpenClaw には、外部コンテンツの安全ラップを無効化する明示的なバイパスフラグがあります。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cronペイロードフィールド `allowUnsafeExternalContent`

ガイダンス:

- 本番では未設定/false のままにしてください。
- 一時的かつ対象を絞ったデバッグのときだけ有効にしてください。
- 有効にする場合は、そのagentを分離してください（sandbox + 最小限のツール + 専用セッション名前空間）。

Hooks のリスク注意:

- Hookペイロードは、配信元が自分で管理しているシステムでも、信頼されていないコンテンツです（メール/ドキュメント/Webコンテンツはプロンプトインジェクションを含みえます）。
- 弱いモデルティアはこのリスクを高めます。Hook駆動の自動化では、強力で現代的なモデルティアを優先し、ツールポリシーを厳格に保ってください（`tools.profile: "messaging"` またはそれより厳格）。可能ならサンドボックス化も行ってください。

### プロンプトインジェクションに公開DMは不要

**自分だけ**がbotにメッセージできる場合でも、botが読む**信頼されていないコンテンツ**（Web検索/取得結果、ブラウザページ、メール、ドキュメント、添付ファイル、貼り付けられたログ/コード）経由でプロンプトインジェクションは起こりえます。つまり、脅威面は送信者だけではなく、**コンテンツそのもの**も敵対的な指示を含みえます。

ツールが有効な場合、典型的なリスクはコンテキスト流出やツール呼び出しの誘発です。影響範囲を減らすには:

- 信頼されていないコンテンツを要約するために、読み取り専用またはツール無効の**reader agent** を使い、その要約をメインagentに渡す。
- `web_search` / `web_fetch` / `browser` は、必要でない限りツール有効agentでoffにしておく。
- OpenResponses のURL入力（`input_file` / `input_image`）では、`gateway.http.endpoints.responses.files.urlAllowlist` と `gateway.http.endpoints.responses.images.urlAllowlist` を厳格に設定し、`maxUrlParts` は低く保つ。
  空の allowlist は未設定として扱われます。URL取得自体を完全に無効にしたいなら、`files.allowUrl: false` / `images.allowUrl: false` を使ってください。
- OpenResponses のファイル入力では、デコードされた `input_file` テキストも依然として**信頼されていない外部コンテンツ**として注入されます。Gateway がローカルでデコードしたからといって、そのファイルテキストを信頼済みと見なさないでください。注入ブロックには、長い `SECURITY NOTICE:` バナーこそ付かないものの、明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界マーカーと `Source: External` メタデータが引き続き付きます。
- 同じマーカーベースのラップは、media-understanding が添付ドキュメントからテキストを抽出して、そのテキストをメディアプロンプトへ追加するときにも適用されます。
- 信頼されていない入力に触れるagentには、サンドボックス化と厳格なツール allowlist を有効にする。
- 秘密情報をプロンプトに入れない。Gatewayホスト上の env/config 経由で渡す。

### セルフホストLLMバックエンド

OpenAI互換のセルフホストバックエンド（vLLM、SGLang、TGI、LM Studio、
またはカスタム Hugging Face tokenizer スタックなど）は、チャットテンプレートの special tokens をどう扱うかについて、ホスト型プロバイダと異なる場合があります。バックエンドが `<|im_start|>`、`<|start_header_id|>`、`<start_of_turn>` のようなリテラル文字列を、ユーザーコンテンツ内で構造的なチャットテンプレートトークンとしてトークナイズする場合、信頼されていないテキストはトークナイザ層で role boundary を偽装しようとする可能性があります。

OpenClaw は、ラップされた外部コンテンツをモデルへ送る前に、一般的なモデルファミリーの special-token リテラルを除去します。外部コンテンツラップは有効のままにし、利用可能であれば、ユーザー提供コンテンツ中の special tokens を分割またはエスケープするバックエンド設定を優先してください。OpenAI や Anthropic のようなホスト型プロバイダは、すでにリクエスト側で独自のサニタイズを適用しています。

### モデル強度（セキュリティ注意）

プロンプトインジェクションへの耐性は、モデルティア間で**一様ではありません**。より小さく安価なモデルほど、特に敵対的プロンプト下では、一般にツール誤用や指示乗っ取りに弱くなります。

<Warning>
ツール有効agent、または信頼されていないコンテンツを読むagentでは、古い/小さいモデルによるプロンプトインジェクションリスクはしばしば高すぎます。そのようなワークロードを弱いモデルティアで実行しないでください。
</Warning>

推奨事項:

- ツールを実行できる、またはファイル/ネットワークに触れられるbotには、**最新世代の最上位ティアモデル**を使ってください。
- ツール有効agentや信頼されていない受信箱には、**古い/弱い/小さいティアを使わないでください**。プロンプトインジェクションリスクが高すぎます。
- やむを得ず小さいモデルを使う場合は、**影響範囲を縮小**してください（読み取り専用ツール、強力なサンドボックス化、最小限のファイルシステムアクセス、厳格な allowlist）。
- 小さいモデルを動かす場合は、**すべてのセッションでサンドボックス化を有効化**し、入力が厳密に制御されていない限り **web_search/web_fetch/browser を無効化**してください。
- 信頼された入力のみでツールを使わないチャット専用のパーソナルアシスタントであれば、小さいモデルでも通常は問題ありません。

<a id="reasoning-verbose-output-in-groups"></a>

## グループでの reasoning と verbose 出力

`/reasoning`、`/verbose`、`/trace` は、内部 reasoning、ツール出力、または公開チャネル向けではないPlugin診断情報を露出する可能性があります。グループ環境では、これらを**デバッグ専用**として扱い、明示的に必要な場合を除いてoffのままにしてください。

ガイダンス:

- 公開roomでは `/reasoning`、`/verbose`、`/trace` を無効にしておいてください。
- 有効にする場合は、信頼されたDMまたは厳密に管理されたroomでのみ有効にしてください。
- 注意: verbose と trace の出力には、ツール引数、URL、Plugin診断情報、モデルが見たデータが含まれる可能性があります。

## 設定の強化（例）

### 0) ファイル権限

Gatewayホスト上では config + state を非公開に保ってください。

- `~/.openclaw/openclaw.json`: `600`（ユーザーの読み書きのみ）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` は、これらの権限が緩い場合に警告し、強化を提案できます。

### 0.4) ネットワーク露出（bind + port + firewall）

Gateway は、**WebSocket + HTTP** を1つのポートで多重化します。

- デフォルト: `18789`
- Config/flags/env: `gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

このHTTPサーフェスには、Control UI と canvas host が含まれます。

- Control UI（SPAアセット）（デフォルトベースパス `/`）
- Canvas host: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意のHTML/JS。信頼されていないコンテンツとして扱ってください）

通常のブラウザで canvas コンテンツを読み込む場合は、他の信頼されていないWebページと同様に扱ってください。

- canvas host を信頼されていないネットワーク/ユーザーへ公開しない。
- 影響を完全に理解していない限り、canvas コンテンツを特権的Webサーフェスと同じ origin で共有させない。

bind mode は、Gateway がどこで待ち受けるかを制御します。

- `gateway.bind: "loopback"`（デフォルト）: ローカルクライアントのみ接続可能です。
- loopback以外のbind（`"lan"`、`"tailnet"`、`"custom"`）は攻撃面を広げます。これらを使うのは、gateway auth（共有 token/password、または正しく構成された loopback以外の trusted proxy）と、実際の firewall がある場合だけにしてください。

経験則:

- LAN bind より Tailscale Serve を優先してください（Serve はGatewayを loopback 上に保ち、アクセス処理は Tailscale が担当します）。
- どうしても LAN に bind するなら、ポートを送信元IPの厳格な allowlist に firewall してください。広くポートフォワードしないでください。
- Gatewayを `0.0.0.0` で未認証公開しないでください。

### 0.4.1) Docker のポート公開 + UFW（`DOCKER-USER`）

VPS 上で Docker により OpenClaw を実行する場合、公開されたコンテナポート（`-p HOST:CONTAINER` または Compose の `ports:`）は、ホストの `INPUT` ルールだけでなく、Docker の転送チェーンを通ることを忘れないでください。

Dockerトラフィックを firewall ポリシーに合わせるには、`DOCKER-USER` でルールを強制してください（このチェーンは Docker 自身の accept ルールより前に評価されます）。
多くの現代的なディストリビューションでは、`iptables`/`ip6tables` は `iptables-nft` フロントエンドを使っており、これらのルールは nftables バックエンドにも適用されます。

最小限の allowlist 例（IPv4）:

```bash
# /etc/ufw/after.rules (独立した *filter セクションとして追記)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 には別のテーブルがあります。Docker IPv6 が有効なら、`/etc/ufw/after6.rules` に対応するポリシーを追加してください。

ドキュメントのスニペットで `eth0` のようなインターフェイス名をハードコードしないでください。インターフェイス名は VPS イメージごとに異なり（`ens3`、`enp*` など）、一致しないと deny ルールが意図せず適用されないことがあります。

リロード後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

外部から見えるポートは、意図して公開したものだけであるべきです（ほとんどの構成では: SSH + リバースプロキシのポート）。

### 0.4.2) mDNS/Bonjour discovery（情報漏えい）

Gateway は、ローカルデバイス検出のために mDNS（ポート 5353 の `_openclaw-gw._tcp`）で自身の存在をブロードキャストします。full mode では、運用詳細を露出しうる TXT レコードが含まれます。

- `cliPath`: CLIバイナリへの完全なファイルシステムパス（ユーザー名とインストール場所を露出）
- `sshPort`: ホスト上のSSH可用性を広告
- `displayName`、`lanHost`: ホスト名情報

**運用セキュリティ上の考慮:** インフラ詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても偵察が容易になります。ファイルシステムパスやSSH可用性のような「無害」に見える情報でも、攻撃者が環境を把握する助けになります。

**推奨事項:**

1. **minimal mode**（デフォルト、公開Gatewayに推奨）: mDNSブロードキャストから機微なフィールドを省略します。

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス検出が不要なら**完全に無効化**します:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **full mode**（オプトイン）: TXTレコードに `cliPath` + `sshPort` を含めます:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替手段）: config変更なしでmDNSを無効にするには `OPENCLAW_DISABLE_BONJOUR=1` を設定します。

minimal mode でも、Gateway はデバイス検出に十分な情報（`role`、`gatewayPort`、`transport`）を引き続きブロードキャストしますが、`cliPath` と `sshPort` は省略します。CLIパス情報が必要なアプリは、代わりに認証済みWebSocket接続経由で取得できます。

### 0.5) Gateway WebSocket をロックダウンする（ローカルauth）

Gateway auth はデフォルトで**必須**です。有効なgateway auth 経路が設定されていない場合、Gateway は WebSocket 接続を拒否します（fail‑closed）。

オンボーディングでは、ローカルクライアントにも認証を要求するため、デフォルトで token が生成されます（loopback でも同様）。

**すべての**WSクライアントに認証を要求するには、token を設定してください。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor で生成できます: `openclaw doctor --generate-gateway-token`。

注意: `gateway.remote.token` / `.password` はクライアント認証情報ソースです。これら自体はローカルWSアクセスを保護しません。
ローカル呼び出し経路では、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
`gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、解決は fail closed します（remote フォールバックで隠蔽されることはありません）。
任意: `wss://` を使う場合は、`gateway.remote.tlsFingerprint` でリモートTLSをピン留めできます。
平文 `ws://` はデフォルトで loopback 専用です。信頼されたプライベートネットワーク経路では、緊急用としてクライアントプロセスに `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

ローカルデバイスペアリング:

- 直接のローカル loopback 接続では、同一ホストクライアントを円滑にするためにデバイスペアリングは自動承認されます。
- OpenClaw には、信頼された共有秘密ヘルパーフロー向けに、狭い範囲の backend/container-local self-connect 経路もあります。
- Tailnet と LAN 接続は、同一ホストの tailnet bind を含めて、ペアリング上はリモートとして扱われ、依然として承認が必要です。

Auth modes:

- `gateway.auth.mode: "token"`: 共有 bearer token（ほとんどの構成で推奨）。
- `gateway.auth.mode: "password"`: password auth（env 経由の設定を推奨: `OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`: ID認識型リバースプロキシに、ユーザー認証とヘッダー経由のID受け渡しを委ねます（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。

ローテーションチェックリスト（token/password）:

1. 新しい秘密情報を生成/設定する（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）。
2. Gateway を再起動する（または、macOSアプリがGatewayを監督している場合はそのアプリを再起動する）。
3. リモートクライアントを更新する（Gateway を呼び出すマシン上の `gateway.remote.token` / `.password`）。
4. 古い認証情報ではもう接続できないことを確認する。

### 0.6) Tailscale Serve のIDヘッダー

`gateway.auth.allowTailscale` が `true`（Serve のデフォルト）のとき、OpenClaw は Tailscale Serve のIDヘッダー（`tailscale-user-login`）を Control UI/WebSocket 認証用に受け入れます。OpenClaw は、`x-forwarded-for` アドレスをローカル Tailscale デーモン経由（`tailscale whois`）で解決し、それをヘッダーと照合することでIDを検証します。これは、Tailscale によって注入された `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` を含み、かつ loopback に到達するリクエストでのみ発動します。
この非同期IDチェック経路では、同じ `{scope, ip}` に対する失敗試行は、リミッターが失敗を記録する前に直列化されます。そのため、1つの Serve クライアントからの並行した不正リトライは、単なる2件のミスマッチとして競合通過するのではなく、2回目の試行を即座にロックアウトできます。
HTTP API エンドポイント（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）では、Tailscale の IDヘッダーauth は使いません。これらは引き続き、Gateway で設定された HTTP auth mode に従います。

重要な境界に関する注意:

- Gateway HTTP bearer auth は、実質的にオールオアナッシングのオペレーターアクセスです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼び出せる認証情報は、そのGatewayに対するフルアクセスのオペレーター秘密情報として扱ってください。
- OpenAI互換HTTPサーフェスでは、共有秘密 bearer auth は、完全なデフォルトのオペレータースコープ（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）と、agentターンに対する owner セマンティクスを復元します。より狭い `x-openclaw-scopes` 値では、この共有秘密経路は縮小されません。
- HTTP上のリクエスト単位スコープセマンティクスは、trusted proxy auth や、プライベート受信での `gateway.auth.mode="none"` のような、IDを持つ mode からのリクエストにのみ適用されます。
- これらの IDを持つ mode では、`x-openclaw-scopes` を省略すると通常のデフォルトオペレータースコープセットにフォールバックします。より狭いスコープセットにしたい場合は、このヘッダーを明示的に送ってください。
- `/tools/invoke` も同じ共有秘密ルールに従います: token/password bearer auth は、ここでもフルオペレーターアクセスとして扱われます。一方、IDを持つ mode では引き続き宣言されたスコープが尊重されます。
- これらの認証情報を信頼されていない呼び出し元と共有しないでください。信頼境界ごとに別々のGatewayを使うことを推奨します。

**信頼前提:** tokenなしの Serve auth は、gatewayホストが信頼されていることを前提とします。
これを、同一ホスト上の敵対的プロセスに対する保護と見なしてはいけません。信頼されていないローカルコードが gatewayホスト上で実行されうる場合は、`gateway.auth.allowTailscale` を無効化し、`gateway.auth.mode: "token"` または `"password"` による明示的な共有秘密authを必須にしてください。

**セキュリティルール:** 自分のリバースプロキシからこれらのヘッダーを転送しないでください。Gateway の前段でTLS終端またはプロキシを行う場合は、`gateway.auth.allowTailscale` を無効化し、代わりに共有秘密auth（`gateway.auth.mode: "token"` または `"password"`）か [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を使用してください。

信頼されたプロキシ:

- Gateway の前段でTLSを終端する場合は、`gateway.trustedProxies` にプロキシIPを設定してください。
- OpenClaw は、それらのIPから来る `x-forwarded-for`（または `x-real-ip`）を信頼し、ローカルペアリング判定と HTTP auth/ローカル判定のためのクライアントIP決定に使います。
- プロキシが `x-forwarded-for` を**上書き**し、Gatewayポートへの直接アクセスをブロックしていることを確認してください。

参照: [Tailscale](/ja-JP/gateway/tailscale) と [Web overview](/web)

### 0.6.1) Node host 経由のブラウザ制御（推奨）

Gateway がリモートにあり、ブラウザが別マシンで動作する場合は、そのブラウザマシン上で **node host** を動かし、Gateway にブラウザ操作をプロキシさせてください（[Browser tool](/ja-JP/tools/browser) を参照）。
Nodeペアリングは管理者アクセスとして扱ってください。

推奨パターン:

- Gateway と node host は同じ tailnet（Tailscale）上に保つ。
- Node は意図的にペアリングし、不要ならブラウザプロキシルーティングを無効にする。

避けるべきこと:

- relay/control port を LAN やパブリックインターネットに公開すること。
- ブラウザ制御エンドポイントに Tailscale Funnel を使うこと（公開露出）。

### 0.7) ディスク上の秘密情報（機微データ）

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下のものには、秘密情報または非公開データが含まれうると考えてください。

- `openclaw.json`: config にトークン（gateway、remote gateway）、provider設定、allowlist が含まれる可能性があります。
- `credentials/**`: チャネル認証情報（例: WhatsApp creds）、pairing allowlist、レガシーOAuthインポート。
- `agents/<agentId>/agent/auth-profiles.json`: APIキー、トークンプロファイル、OAuthトークン、および任意の `keyRef`/`tokenRef`。
- `secrets.json`（任意）: `file` SecretRef providers（`secrets.providers`）で使うファイルベースの秘密情報ペイロード。
- `agents/<agentId>/agent/auth.json`: レガシー互換ファイル。静的な `api_key` エントリは、発見時に除去されます。
- `agents/<agentId>/sessions/**`: セッショントランスクリプト（`*.jsonl`）+ ルーティングメタデータ（`sessions.json`）。非公開メッセージやツール出力を含むことがあります。
- バンドル済みPluginパッケージ: インストール済みPlugins（およびその `node_modules/`）。
- `sandboxes/**`: ツールsandboxワークスペース。sandbox内で読み書きしたファイルのコピーが蓄積することがあります。

強化のヒント:

- 権限を厳格に保つ（ディレクトリは `700`、ファイルは `600`）。
- gatewayホストでフルディスク暗号化を使う。
- ホストを共有する場合は、Gateway 用の専用OSユーザーアカウントを使う。

### 0.8) ワークスペース `.env` ファイル

OpenClaw は agent とツールのためにワークスペースローカルの `.env` ファイルを読み込みますが、それらのファイルが gateway ランタイム制御を黙って上書きすることは決して許しません。

- `OPENCLAW_*` で始まるキーは、信頼されていないワークスペース `.env` ファイルではすべてブロックされます。
- このブロックは fail-closed です。将来のリリースで新しいランタイム制御変数が追加されても、チェックイン済みまたは攻撃者が供給した `.env` から継承されることはありません。キーは無視され、gateway は自身の値を維持します。
- 信頼されたプロセス/OS環境変数（gateway自身のshell、launchd/systemd unit、app bundle）は引き続き適用されます。これは `.env` ファイル読み込みだけを制約します。

理由: ワークスペース `.env` ファイルはしばしば agentコードの隣にあり、誤ってコミットされたり、ツールによって書き込まれたりします。`OPENCLAW_*` プレフィックス全体をブロックすることで、後から新しい `OPENCLAW_*` フラグが追加されても、ワークスペース状態から黙って継承されるような後退が起こらないようにしています。

### 0.9) ログ + トランスクリプト（マスキング + 保持）

アクセス制御が正しくても、ログとトランスクリプトは機微情報を漏らす可能性があります。

- Gatewayログには、ツール要約、エラー、URLが含まれる可能性があります。
- セッショントランスクリプトには、貼り付けられた秘密情報、ファイル内容、コマンド出力、リンクが含まれる可能性があります。

推奨事項:

- ツール要約のマスキングを有効のままにする（`logging.redactSensitive: "tools"`; デフォルト）。
- `logging.redactPatterns` で、環境固有のカスタムパターン（トークン、ホスト名、内部URL）を追加する。
- 診断を共有するときは、生ログより `openclaw status --all`（貼り付け可能、秘密情報はマスク済み）を優先する。
- 長期保持が不要なら、古いセッショントランスクリプトとログファイルを整理する。

詳細: [Logging](/ja-JP/gateway/logging)

### 1) DM: デフォルトで pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) グループ: どこでもメンション必須

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

グループチャットでは、明示的にメンションされたときだけ応答してください。

### 3) 番号を分ける（WhatsApp、Signal、Telegram）

電話番号ベースのチャネルでは、AIを個人用番号とは別の電話番号で動かすことを検討してください。

- 個人番号: あなたの会話は非公開のまま
- bot番号: AI が適切な境界のもとでこれらを処理

### 4) 読み取り専用モード（sandbox + ツール経由）

以下を組み合わせることで、読み取り専用プロファイルを構築できます。

- `agents.defaults.sandbox.workspaceAccess: "ro"`（またはワークスペースアクセスをなくす `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックする tool allow/deny リスト

追加の強化オプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandbox化がoffでも、`apply_patch` がワークスペースディレクトリ外に書き込み/削除できないようにします。`apply_patch` にワークスペース外のファイルを意図的に触らせたい場合にのみ `false` にしてください。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` のパスと、ネイティブプロンプト画像の自動ロードパスをワークスペースディレクトリに制限します（現在絶対パスを許可していて、単一のガードレールを追加したい場合に有用）。
- ファイルシステムのrootは狭く保つ: agentワークスペース/sandboxワークスペースに homeディレクトリのような広いrootを使わないでください。広いrootは、ファイルシステムツールに機微なローカルファイル（たとえば `~/.openclaw` 配下の state/config）を露出しうます。

### 5) セキュアベースライン（コピー/ペースト用）

Gateway を非公開に保ち、DM pairing を必須にし、常時待機のグループbotを避ける「安全なデフォルト」config の一例です。

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

ツール実行も「より安全なデフォルト」にしたい場合は、sandbox を追加し、owner以外のagentでは危険なツールを拒否してください（下の「agentごとのアクセスプロファイル」の例を参照）。

チャット駆動のagentターン向け組み込みベースライン: owner以外の送信者は `cron` または `gateway` ツールを使えません。

## サンドボックス化（推奨）

専用ドキュメント: [Sandboxing](/ja-JP/gateway/sandboxing)

相補的な2つのアプローチがあります。

- **Gateway全体を Docker で実行する**（コンテナ境界）: [Docker](/ja-JP/install/docker)
- **ツールsandbox**（`agents.defaults.sandbox`、host Gateway + sandbox分離されたツール。Docker がデフォルトバックエンド）: [Sandboxing](/ja-JP/gateway/sandboxing)

注: agent間アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）または、より厳格なセッション単位分離として `"session"` に保ってください。`scope: "shared"` は単一のコンテナ/ワークスペースを使います。

また、sandbox 内での agentワークスペースアクセスも検討してください。

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）は agentワークスペースを非公開に保ちます。ツールは `~/.openclaw/sandboxes` 配下のsandboxワークスペースに対して動作します
- `agents.defaults.sandbox.workspaceAccess: "ro"` は agentワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` は agentワークスペースを `/workspace` に読み書き可能でマウントします
- 追加の `sandbox.docker.binds` は、正規化および実体解決されたソースパスに対して検証されます。親 symlink トリックや正規化された homeエイリアスでも、`/etc`、`/var/run`、またはOS home配下の認証情報ディレクトリのようなブロック対象rootへ解決される場合は fail closed します。

重要: `tools.elevated` は、sandbox外で exec を実行するグローバルなベースライン escape hatch です。有効な host は、デフォルトでは `gateway`、exec target が `node` に設定されている場合は `node` です。`tools.elevated.allowFrom` は厳格に保ち、見知らぬ相手には有効にしないでください。agentごとの `agents.list[].tools.elevated` で、さらに昇格を制限できます。参照: [Elevated Mode](/ja-JP/tools/elevated)

### サブagent委任のガードレール

セッションツールを許可する場合、委任されたサブagent実行も別の境界判断として扱ってください。

- agent が本当に委任を必要としない限り、`sessions_spawn` を拒否する。
- `agents.defaults.subagents.allowAgents` と、agentごとの `agents.list[].subagents.allowAgents` 上書きは、既知の安全な対象agentに限定する。
- sandboxを維持しなければならないワークフローでは、`sessions_spawn` を `sandbox: "require"` で呼び出す（デフォルトは `inherit`）。
- `sandbox: "require"` は、対象の子ランタイムがsandbox化されていない場合に即座に失敗します。

## ブラウザ制御のリスク

ブラウザ制御を有効にすると、モデルに実ブラウザを操作する能力を与えることになります。
そのブラウザプロファイルがすでにログイン済みセッションを持っている場合、モデルはそれらのアカウントやデータにアクセスできます。ブラウザプロファイルは**機微な状態**として扱ってください。

- agent専用のプロファイルを優先してください（デフォルトの `openclaw` プロファイル）。
- agent に個人用の日常ブラウザプロファイルを向けないでください。
- sandbox化されたagentでは、それらを信頼していない限り hostブラウザ制御を無効のままにしてください。
- スタンドアロンの loopback ブラウザ制御APIは、共有秘密auth（gateway token bearer auth または gateway password）のみを受け付けます。trusted-proxy や Tailscale Serve の IDヘッダーは使用しません。
- ブラウザダウンロードは信頼されていない入力として扱い、分離されたダウンロードディレクトリを優先してください。
- 可能であれば、agentプロファイルではブラウザ同期/パスワードマネージャを無効化してください（影響範囲を縮小できます）。
- リモートGatewayでは、「ブラウザ制御」は、そのプロファイルが到達できる範囲への「オペレーターアクセス」と同等だと考えてください。
- Gateway と node host は tailnet専用に保ち、ブラウザ制御ポートを LAN やパブリックインターネットに公開しないでください。
- 不要ならブラウザプロキシルーティングを無効化してください（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP の既存セッションモードは**より安全ではありません**。そのホストの Chromeプロファイルが到達できるものに対して、あなたとして動作できます。

### ブラウザ SSRF ポリシー（デフォルトで厳格）

OpenClaw のブラウザナビゲーションポリシーは、デフォルトで厳格です。private/internal 宛先は、明示的にオプトインしない限りブロックされたままです。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定であり、ブラウザナビゲーションは private/internal/special-use 宛先を引き続きブロックします。
- レガシーエイリアス: `browser.ssrfPolicy.allowPrivateNetwork` も互換性のため引き続き受け付けます。
- オプトインモード: private/internal/special-use 宛先を許可するには `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的な例外のために `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック対象名も含めた正確なホスト例外）を使います。
- ナビゲーションは、リクエスト前にチェックされ、リダイレクトによる pivot を減らすために、ナビゲーション後の最終 `http(s)` URL に対してもベストエフォートで再チェックされます。

厳格ポリシーの例:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## agentごとのアクセスプロファイル（マルチagent）

マルチagentルーティングでは、各agentが独自のsandbox + ツールポリシーを持てます。これを使って、agentごとに**フルアクセス**、**読み取り専用**、**アクセスなし**を与えてください。
詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

一般的なユースケース:

- 個人agent: フルアクセス、sandboxなし
- 家族/業務agent: sandbox化 + 読み取り専用ツール
- 公開agent: sandbox化 + ファイルシステム/shellツールなし

### 例: フルアクセス（sandboxなし）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 例: 読み取り専用ツール + 読み取り専用ワークスペース

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 例: ファイルシステム/shellアクセスなし（provider messaging は許可）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## AIに伝えるべきこと

agent のシステムプロンプトにセキュリティガイドラインを含めてください。

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## インシデント対応

AIが何か問題を起こした場合:

### 封じ込め

1. **停止する:** macOSアプリ（Gatewayを監督している場合）を停止するか、`openclaw gateway` プロセスを終了します。
2. **露出を閉じる:** 何が起きたか理解するまで、`gateway.bind: "loopback"` に設定するか、Tailscale Funnel/Serve を無効化します。
3. **アクセスを凍結する:** リスクのあるDM/グループを `dmPolicy: "disabled"` / メンション必須に切り替え、もし `"*"` の全許可エントリがあれば削除します。

### ローテーション（秘密情報が漏れた場合は侵害を前提にする）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションして再起動します。
2. Gateway を呼び出せるすべてのマシンで、リモートクライアントの秘密情報（`gateway.remote.token` / `.password`）をローテーションします。
3. provider/API認証情報（WhatsApp creds、Slack/Discord トークン、`auth-profiles.json` 内の model/APIキー、および使用している場合は暗号化された秘密情報ペイロード値）をローテーションします。

### 監査

1. Gatewayログを確認する: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連するトランスクリプトを確認する: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近のconfig変更を確認する（アクセスを広げた可能性のあるもの: `gateway.bind`、`gateway.auth`、DM/グループポリシー、`tools.elevated`、Plugin変更）。
4. `openclaw security audit --deep` を再実行し、critical な検出が解消されたことを確認します。

### 報告用に収集するもの

- タイムスタンプ、gatewayホストOS + OpenClaw バージョン
- セッショントランスクリプト + 短いログtail（マスク後）
- 攻撃者が送った内容 + agent が行ったこと
- Gateway が loopback を超えて公開されていたか（LAN/Tailscale Funnel/Serve）

## Secret Scanning（detect-secrets）

CI は `secrets` ジョブで `detect-secrets` pre-commit hook を実行します。
`main` への push では常に全ファイルスキャンを実行します。プルリクエストでは、ベースコミットが利用可能なら変更ファイルのみの高速経路を使い、そうでなければ全ファイルスキャンにフォールバックします。失敗した場合、それはベースラインにまだ含まれていない新しい候補があることを意味します。

### CIが失敗した場合

1. ローカルで再現します:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ツールを理解します:
   - pre-commit 内の `detect-secrets` は、リポジトリのベースラインと除外設定を使って `detect-secrets-hook` を実行します。
   - `detect-secrets audit` は対話的レビューを開き、ベースライン内の各項目を実際の秘密情報か誤検知かとしてマークできます。
3. 実際の秘密情報なら: ローテーション/削除し、その後スキャンを再実行してベースラインを更新します。
4. 誤検知なら: 対話的監査を実行し、誤検知としてマークします。

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しい除外が必要な場合は、それを `.detect-secrets.cfg` に追加し、対応する `--exclude-files` / `--exclude-lines` フラグでベースラインを再生成します（configファイルは参照用のみで、detect-secrets は自動では読み込みません）。

更新された `.secrets.baseline` が意図した状態を反映したら、それをコミットしてください。

## セキュリティ問題の報告

OpenClaw に脆弱性を見つけた場合は、責任ある方法で報告してください。

1. メール: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開しないでください
3. 希望される場合を除き、クレジットを掲載します
