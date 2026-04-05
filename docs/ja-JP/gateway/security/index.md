---
read_when:
    - アクセスや自動化を広げる機能を追加している場合
summary: シェルアクセスを持つAI Gatewayを運用するためのセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-04-05T12:49:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 223deb798774952f8d0208e761e163708a322045cf4ca3df181689442ef6fcfb
    source_path: gateway/security/index.md
    workflow: 15
---

# セキュリティ

<Warning>
**個人アシスタントの信頼モデル:** このガイダンスは、gatewayごとに1つの信頼されたオペレーター境界があることを前提としています（単一ユーザー/個人アシスタントモデル）。
OpenClawは、複数の敵対的ユーザーが1つのagent/gatewayを共有するための、敵対的マルチテナント向けセキュリティ境界では**ありません**。
信頼度が混在する、または敵対的ユーザーを含む運用が必要な場合は、信頼境界を分離してください（gatewayと認証情報を分け、可能ならOSユーザー/ホストも分離してください）。
</Warning>

**このページの内容:** [信頼モデル](#scope-first-personal-assistant-security-model) | [クイック監査](#quick-check-openclaw-security-audit) | [60秒でできる強化ベースライン](#hardened-baseline-in-60-seconds) | [DMアクセスモデル](#dm-access-model-pairing--allowlist--open--disabled) | [設定の強化](#configuration-hardening-examples) | [インシデント対応](#incident-response)

## まず前提から: 個人アシスタントのセキュリティモデル

OpenClawのセキュリティガイダンスは、**個人アシスタント**としてのデプロイを前提にしています。つまり、1つの信頼されたオペレーター境界があり、その中に複数のagentが存在する形です。

- サポートされるセキュリティ姿勢: gatewayごとに1つのユーザー/信頼境界（できれば境界ごとに1つのOSユーザー/ホスト/VPS）。
- サポート対象外のセキュリティ境界: 相互に信頼していない、または敵対的なユーザーが1つの共有gateway/agentを使うこと。
- 敵対的ユーザー間の分離が必要なら、信頼境界ごとに分けてください（gateway + 認証情報を分離し、理想的にはOSユーザー/ホストも分離）。
- 複数の信頼できないユーザーが1つのツール有効agentにメッセージできるなら、そのagentに委譲された同じツール権限を共有しているものとして扱ってください。

このページは、**そのモデルの範囲内**での強化方法を説明します。1つの共有gateway上で敵対的マルチテナント分離ができるとは主張しません。

## クイックチェック: `openclaw security audit`

関連項目: [Formal Verification (Security Models)](/security/formal-verification)

これを定期的に実行してください（特に設定変更後やネットワーク公開面を増やした後）。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に対象を絞っています。一般的なオープングループポリシーをallowlistへ切り替え、`logging.redactSensitive: "tools"` を復元し、state/config/include-fileの権限を強化し、WindowsではPOSIXの `chmod` の代わりにACLリセットを使います。

これは、よくある危険な設定（Gateway認証の露出、browser制御の露出、elevated allowlist、ファイルシステム権限、緩いexec承認、オープンチャンネルからのツール露出）を検出します。

OpenClawは製品であると同時に実験でもあります。あなたは最先端モデルの振る舞いを、実際のメッセージング面と実際のツールに接続しています。**「完全に安全な」構成はありません。** 目標は、次の点を意識的に決めることです。

- 誰があなたのbotに話しかけられるか
- botがどこで行動できるか
- botが何に触れられるか

まず、動作に必要な最小限のアクセスから始め、確信が持てるようになってから徐々に広げてください。

### デプロイとホスト信頼

OpenClawは、ホストと設定境界が信頼されていることを前提にしています。

- 誰かがGatewayホストのstate/config（`~/.openclaw`、`openclaw.json` を含む）を変更できるなら、その人は信頼されたオペレーターとして扱ってください。
- 相互に信頼していない/敵対的な複数のオペレーターのために1つのGatewayを動かすのは、**推奨される構成ではありません**。
- 信頼度が混在するチームでは、別々のGatewayで信頼境界を分けてください（少なくともOSユーザー/ホストは分けてください）。
- 推奨デフォルト: マシン/ホスト（またはVPS）ごとに1ユーザー、そのユーザーに1 gateway、そのgateway内に1つ以上のagent。
- 1つのGatewayインスタンス内では、認証済みoperatorアクセスは、ユーザーごとのテナントロールではなく、信頼されたcontrol-planeロールです。
- セッション識別子（`sessionKey`、session ID、label）はルーティング選択子であり、認可トークンではありません。
- 複数人が1つのツール有効agentにメッセージできるなら、それぞれが同じ権限セットを操縦できます。ユーザーごとのsession/memory分離はプライバシーには役立ちますが、共有agentをユーザーごとのホスト認可境界には変えません。

### 共有Slackワークスペース: 実際のリスク

「Slackの全員がbotにメッセージできる」場合の中心的リスクは、委譲されたツール権限です。

- 許可された任意の送信者が、agentポリシー内でのツール呼び出し（`exec`、browser、network/file tools）を誘発できる
- 1人の送信者からのprompt/content injectionが、共有state、デバイス、出力に影響するアクションを引き起こせる
- 1つの共有agentが機密認証情報/ファイルを持っている場合、許可された任意の送信者がツール使用を通じて流出を引き起こせる可能性がある

チームワークフローには最小限のツールを持つ別agent/gatewayを使い、個人データを扱うagentは非公開に保ってください。

### 会社共有agent: 許容できるパターン

そのagentを使う全員が同じ信頼境界にいて（たとえば同じ会社チーム）、agentの対象範囲が厳密に業務に限定されているなら、これは許容できます。

- 専用のマシン/VM/containerで実行する
- そのランタイム専用のOSユーザー + 専用のbrowser/profile/accountを使う
- そのランタイムを個人のApple/Googleアカウントや、個人のpassword manager/browser profileにサインインさせない

同じランタイムで個人アイデンティティと会社アイデンティティを混在させると、分離が崩れ、個人データ流出リスクが高まります。

## Gatewayとnodeの信頼概念

Gatewayとnodeは、役割が異なる1つのオペレーター信頼ドメインとして扱ってください。

- **Gateway** はcontrol planeとpolicy surfaceです（`gateway.auth`、tool policy、routing）。
- **Node** は、そのGatewayにペアリングされたリモート実行面です（コマンド、デバイス操作、ホストローカル機能）。
- Gatewayに認証された呼び出し元は、Gatewayスコープで信頼されます。ペアリング後、node操作はそのnode上での信頼されたoperatorアクションになります。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザーごとの認証ではありません。
- Exec承認（allowlist + ask）は、operator意図のためのガードレールであり、敵対的マルチテナント分離ではありません。
- 信頼された単一オペレーター構成におけるOpenClawの製品デフォルトは、`gateway`/`node` でのhost execを承認プロンプトなしで許可することです（`security="full"`、厳しくしない限り `ask="off"`）。このデフォルトは意図されたUXであり、それ自体が脆弱性ではありません。
- Exec承認は、正確なリクエストコンテキストと、ベストエフォートな直接ローカルファイルオペランドに結び付きます。すべてのランタイム/インタープリターのローダーパスを意味的にモデル化するわけではありません。強い境界が必要ならsandboxingとホスト分離を使ってください。

敵対的ユーザー分離が必要なら、OSユーザー/ホストごとに信頼境界を分割し、別々のgatewayを実行してください。

## 信頼境界マトリクス

リスクを判断するときは、これをクイックモデルとして使ってください。

| 境界または制御                                             | 意味                                              | よくある誤解                                                                  |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | gateway APIへの呼び出し元を認証する               | 「安全にするには各フレームごとにメッセージ署名が必要」                        |
| `sessionKey`                                              | コンテキスト/session選択のためのルーティングキー  | 「session keyはユーザー認証境界」                                             |
| Prompt/content guardrails                                 | モデル悪用リスクを下げる                          | 「prompt injectionだけで認証バイパスが証明される」                            |
| `canvas.eval` / browser evaluate                          | 有効化時の意図的なoperator機能                    | 「どんなJS evalプリミティブもこの信頼モデルでは自動的に脆弱性になる」         |
| ローカルTUI `!` shell                                     | 明示的なoperatorトリガーのローカル実行            | 「ローカルshell用の便利コマンドはリモート注入だ」                             |
| Node pairingとnode command                                | ペア済みデバイス上でのoperatorレベルの遠隔実行    | 「リモートデバイス制御はデフォルトで信頼できないユーザーアクセス扱いにすべき」 |

## 設計上、脆弱性ではないもの

以下のパターンはよく報告されますが、実際の境界バイパスが示されない限り、通常は対応不要としてクローズされます。

- ポリシー/auth/sandboxバイパスを伴わない、prompt injectionのみの連鎖。
- 1つの共有host/configで敵対的マルチテナント運用を前提にした主張。
- 共有gateway構成で、通常のoperator読み取り経路アクセス（たとえば `sessions.list`/`sessions.preview`/`chat.history`）をIDORとみなす主張。
- localhost専用デプロイの指摘（たとえばloopback専用gatewayへのHSTS）。
- このrepoに存在しない受信パスに対するDiscord inbound webhook署名の指摘。
- `system.run` に対して、node pairing metadataを隠れた第2のコマンド単位承認層として扱う報告。実際の実行境界は依然としてgatewayのグローバルnode command policyとnode自身のexec approvalsです。
- `sessionKey` を認証トークンとして扱う「ユーザーごとの認可欠如」の指摘。

## 研究者向け事前チェックリスト

GHSAを開く前に、次をすべて確認してください。

1. 再現が最新の `main` または最新リリースでも成立する。
2. 報告に、正確なコードパス（`file`、function、line range）と検証したversion/commitが含まれている。
3. 影響が文書化された信頼境界をまたいでいる（単なるprompt injectionではない）。
4. 主張が [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) に載っていない。
5. 既存のadvisoryに重複がないか確認済みである（該当時は既存GHSAを再利用する）。
6. デプロイ前提（loopback/localか、公開か、trusted operatorかuntrustedか）が明示されている。

## 60秒でできる強化ベースライン

まずこのベースラインを使い、その後で信頼するagentごとに必要なツールだけ再有効化してください。

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

これにより、Gatewayはローカル専用のまま、DMは分離され、control-plane/runtime toolsはデフォルトで無効になります。

## 共有受信箱のクイックルール

複数人があなたのbotにDMできるなら:

- `session.dmScope: "per-channel-peer"` を設定してください（マルチアカウントchannelなら `"per-account-channel-peer"`）。
- `dmPolicy: "pairing"` または厳格なallowlistを維持してください。
- 共有DMと広いツールアクセスを組み合わせないでください。
- これは協調/共有受信箱の強化にはなりますが、ユーザーがhost/config書き込みアクセスを共有する場合の敵対的共同テナント分離として設計されたものではありません。

## コンテキスト可視性モデル

OpenClawは、次の2つを分けています。

- **トリガー認可**: 誰がagentを起動できるか（`dmPolicy`、`groupPolicy`、allowlist、mention gate）。
- **コンテキスト可視性**: どの補足コンテキストがモデル入力に注入されるか（返信本文、引用テキスト、スレッド履歴、転送メタデータ）。

Allowlistsはトリガーとコマンド認可を制御します。`contextVisibility` は、補足コンテキスト（引用返信、スレッドルート、取得履歴）をどうフィルタするかを制御します。

- `contextVisibility: "all"`（デフォルト）は、補足コンテキストを受信したまま保持します。
- `contextVisibility: "allowlist"` は、補足コンテキストを現在有効なallowlistチェックで許可された送信者に絞ります。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、1つの明示的な引用返信だけは保持します。

`contextVisibility` はchannel単位またはroom/conversation単位で設定してください。設定方法は [Group Chats](/ja-JP/channels/groups#context-visibility) を参照してください。

Advisoryトリアージの指針:

- 「モデルがallowlist外送信者の引用や履歴テキストを見られる」だけを示す主張は、`contextVisibility` で対応する強化事項であり、それ単体ではauthやsandbox境界バイパスではありません。
- セキュリティ影響ありとするには、依然として信頼境界のバイパス（auth、policy、sandbox、approval、または他の文書化された境界）の実証が必要です。

## 監査がチェックするもの（高レベル）

- **受信アクセス**（DM policy、group policy、allowlist）: 見知らぬ相手がbotを起動できるか。
- **ツールの影響範囲**（elevated tools + オープンルーム）: prompt injectionがshell/file/network操作に繋がるか。
- **Exec承認のドリフト**（`security=full`、`autoAllowSkills`、`strictInlineEval` なしのinterpreter allowlist）: host-execガードレールがまだ想定どおり機能しているか。
  - `security="full"` は広い姿勢への警告であり、バグの証明ではありません。これは信頼された個人アシスタント構成で選ばれたデフォルトです。脅威モデルが承認やallowlistガードレールを必要とするときだけ厳しくしてください。
- **ネットワーク露出**（Gateway bind/auth、Tailscale Serve/Funnel、弱い/短いauth token）。
- **Browser制御の露出**（remote nodes、relay ports、remote CDP endpoints）。
- **ローカルディスク衛生**（権限、symlink、config includes、「同期フォルダー」パス）。
- **Plugins**（明示的allowlistなしで拡張が存在する）。
- **ポリシードリフト/誤設定**（sandbox docker設定があるのにsandbox modeがoff、`gateway.nodes.denyCommands` のパターンが実際には正確なコマンド名にしか一致せずshell textを見ないため効かない、危険な `gateway.nodes.allowCommands`、グローバル `tools.profile="minimal"` がagent単位profileで上書きされている、緩いtool policyでextension plugin toolsに到達できる）。
- **ランタイム期待値のドリフト**（たとえば `tools.exec.host` のデフォルトが `auto` になった後も暗黙のexecが `sandbox` だと思い込んでいる、または `tools.exec.host="sandbox"` を明示しているのにsandbox modeがoff）。
- **モデル衛生**（設定モデルがlegacyっぽい場合に警告。ハードブロックではない）。

`--deep` を使うと、OpenClawはベストエフォートのライブGateway probeも試みます。

## 認証情報保存マップ

アクセス監査やバックアップ対象の判断にはこれを使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）
- **Discord bot token**: config/env または SecretRef（env/file/exec providers）
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトaccount）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトaccount）
- **Model auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースsecret payload（任意）**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査が検出を出したら、次の優先順で扱ってください。

1. **「open」かつtools有効**のもの: まずDM/groupsを絞り（pairing/allowlists）、次にtool policy/sandboxingを厳しくする。
2. **公開ネットワーク露出**（LAN bind、Funnel、authなし）: 直ちに修正する。
3. **Browser controlのリモート露出**: operator accessと同等として扱う（tailnet専用、意図的なnode pairing、公開しない）。
4. **権限**: state/config/credentials/authがgroup/world readableでないことを確認する。
5. **Plugins/extensions**: 明示的に信頼するものだけを読み込む。
6. **モデル選択**: toolsを持つbotには、現行の堅牢なinstruction-hardenedモデルを優先する。

## セキュリティ監査用語集

実運用でよく見る、シグナルの強い `checkId` 値を示します（網羅的ではありません）。

| `checkId`                                                     | 重大度        | なぜ重要か                                                                           | 主な修正キー/パス                                                                                   | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | 他ユーザー/プロセスがOpenClaw state全体を変更できる                                 | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | グループユーザーがOpenClaw state全体を変更できる                                    | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | state dirが他者に読める                                                              | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.symlink`                                        | warn          | state dirの実体が別の信頼境界になる                                                  | state dirのファイルシステムレイアウト                                                                | no       |
| `fs.config.perms_writable`                                    | critical      | 他者がauth/tool policy/configを変更できる                                            | `~/.openclaw/openclaw.json` のファイルシステム権限                                                   | yes      |
| `fs.config.symlink`                                           | warn          | configの実体が別の信頼境界になる                                                     | config fileのファイルシステムレイアウト                                                              | no       |
| `fs.config.perms_group_readable`                              | warn          | グループユーザーがconfig token/settingsを読める                                      | config fileのファイルシステム権限                                                                    | yes      |
| `fs.config.perms_world_readable`                              | critical      | configからtoken/settingsが漏れる可能性がある                                         | config fileのファイルシステム権限                                                                    | yes      |
| `fs.config_include.perms_writable`                            | critical      | config include fileを他者が変更できる                                                | `openclaw.json` から参照されるinclude-fileの権限                                                     | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | グループユーザーがincludeされたsecret/settingsを読める                               | `openclaw.json` から参照されるinclude-fileの権限                                                     | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | includeされたsecret/settingsがworld-readable                                         | `openclaw.json` から参照されるinclude-fileの権限                                                     | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | 他者が保存済みmodel credentialを注入/置換できる                                      | `agents/<agentId>/agent/auth-profiles.json` の権限                                                   | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | 他者がAPI keysとOAuth tokensを読める                                                 | `agents/<agentId>/agent/auth-profiles.json` の権限                                                   | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | 他者がchannel pairing/credential stateを変更できる                                  | `~/.openclaw/credentials` のファイルシステム権限                                                     | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | 他者がchannel credential stateを読める                                               | `~/.openclaw/credentials` のファイルシステム権限                                                     | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | 他者がsession transcript/metadataを読める                                            | session storeの権限                                                                                  | yes      |
| `fs.log_file.perms_readable`                                  | warn          | 他者が、redact済みでも機微なlogを読める                                              | gateway log fileの権限                                                                               | yes      |
| `fs.synced_dir`                                               | warn          | state/configをiCloud/Dropbox/Driveに置くとtoken/transcript露出が広がる              | config/stateを同期フォルダーから外す                                                                 | no       |
| `gateway.bind_no_auth`                                        | critical      | リモートbindなのに共有secretがない                                                   | `gateway.bind`, `gateway.auth.*`                                                                     | no       |
| `gateway.loopback_no_auth`                                    | critical      | reverse proxy越しのloopbackが未認証になる可能性がある                                | `gateway.auth.*`, proxy setup                                                                        | no       |
| `gateway.trusted_proxies_missing`                             | warn          | reverse-proxyヘッダーがあるのにtrustedではない                                      | `gateway.trustedProxies`                                                                             | no       |
| `gateway.http.no_auth`                                        | warn/critical | `auth.mode="none"` でGateway HTTP APIへ到達できる                                    | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                      | no       |
| `gateway.http.session_key_override_enabled`                   | info          | HTTP API呼び出し元が `sessionKey` を上書きできる                                     | `gateway.http.allowSessionKeyOverride`                                                               | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | HTTP API経由で危険なtoolsを再有効化している                                          | `gateway.tools.allow`                                                                                | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | 高影響なnode commands（camera/screen/contacts/calendar/SMS）を有効にする             | `gateway.nodes.allowCommands`                                                                        | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | パターン風deny項目がshell textやgroupに一致しない                                    | `gateway.nodes.denyCommands`                                                                         | no       |
| `gateway.tailscale_funnel`                                    | critical      | パブリックインターネット露出                                                         | `gateway.tailscale.mode`                                                                             | no       |
| `gateway.tailscale_serve`                                     | info          | Serve経由のtailnet露出が有効                                                         | `gateway.tailscale.mode`                                                                             | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | 非loopbackのControl UIなのにbrowser-origin allowlistがない                           | `gateway.controlUi.allowedOrigins`                                                                   | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` でbrowser-origin allowlistingを無効化                         | `gateway.controlUi.allowedOrigins`                                                                   | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Host-header origin fallbackを有効にしている（DNS rebinding対策の低下）               | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                         | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | insecure-auth互換トグルが有効                                                        | `gateway.controlUi.allowInsecureAuth`                                                                | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | device identity checkを無効化している                                                | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                     | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | `X-Real-IP` フォールバックを信頼するとproxy誤設定時にsource-IP偽装が可能             | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                              | no       |
| `gateway.token_too_short`                                     | warn          | 共有tokenが短く総当たりされやすい                                                   | `gateway.auth.token`                                                                                 | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | 公開authなのにrate limitがなく、総当たりリスクが高い                                | `gateway.auth.rateLimit`                                                                             | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | proxy identityがauth境界になる                                                       | `gateway.auth.mode="trusted-proxy"`                                                                  | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy authなのにtrusted proxy IPがない                                       | `gateway.trustedProxies`                                                                             | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy authがユーザーidentityを安全に解決できない                             | `gateway.auth.trustedProxy.userHeader`                                                               | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy authが認証済み上流ユーザーを誰でも受け入れる                           | `gateway.auth.trustedProxy.allowUsers`                                                               | no       |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | deep probeがこのコマンド経路でauth SecretRefを解決できなかった                       | deep-probe auth source / SecretRef availability                                                      | no       |
| `gateway.probe_failed`                                        | warn/critical | ライブGateway probeに失敗した                                                        | gateway reachability/auth                                                                            | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | mDNS full modeが `cliPath`/`sshPort` をローカルネットワークに公開する                | `discovery.mdns.mode`, `gateway.bind`                                                                | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | insecure/dangerousなdebug flagsが有効                                                | 複数キー（詳細参照）                                                                                 | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | Gateway passwordをconfigに直接保存している                                           | `gateway.auth.password`                                                                              | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | hook bearer tokenをconfigに直接保存している                                          | `hooks.token`                                                                                        | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | hook ingress tokenがGateway authも解除できる                                         | `hooks.token`, `gateway.auth.token`                                                                  | no       |
| `hooks.token_too_short`                                       | warn          | hook ingressが総当たりされやすい                                                     | `hooks.token`                                                                                        | no       |
| `hooks.default_session_key_unset`                             | warn          | hook agent runがリクエストごとの生成sessionへ分散する                                | `hooks.defaultSessionKey`                                                                            | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | 認証済みhook呼び出し元が任意のconfigured agentへルーティングできる                   | `hooks.allowedAgentIds`                                                                              | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | 外部呼び出し元がsessionKeyを選べる                                                   | `hooks.allowRequestSessionKey`                                                                       | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | 外部session key形式への制約がない                                                    | `hooks.allowedSessionKeyPrefixes`                                                                    | no       |
| `hooks.path_root`                                             | critical      | hook pathが `/` で、衝突や誤ルーティングが起きやすい                                 | `hooks.path`                                                                                         | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | hook install recordが不変なnpm specに固定されていない                               | hook install metadata                                                                                | no       |
| `hooks.installs_missing_integrity`                            | warn          | hook install recordにintegrity metadataがない                                        | hook install metadata                                                                                | no       |
| `hooks.installs_version_drift`                                | warn          | hook install recordとインストール済みpackageがずれている                             | hook install metadata                                                                                | no       |
| `logging.redact_off`                                          | warn          | 機微値がlogs/statusに漏れる                                                          | `logging.redactSensitive`                                                                            | yes      |
| `browser.control_invalid_config`                              | warn          | browser control configが実行前から無効                                               | `browser.*`                                                                                          | no       |
| `browser.control_no_auth`                                     | critical      | browser controlがtoken/password authなしで露出                                       | `gateway.auth.*`                                                                                     | no       |
| `browser.remote_cdp_http`                                     | warn          | plain HTTP上のremote CDPはtransport encryptionがない                                 | browser profile `cdpUrl`                                                                             | no       |
| `browser.remote_cdp_private_host`                             | warn          | remote CDPがprivate/internal hostを向いている                                        | browser profile `cdpUrl`, `browser.ssrfPolicy.*`                                                     | no       |
| `sandbox.docker_config_mode_off`                              | warn          | sandbox Docker configがあるのに無効                                                  | `agents.*.sandbox.mode`                                                                              | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | 相対bind mountは予測不能に解決される可能性がある                                     | `agents.*.sandbox.docker.binds[]`                                                                    | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | sandbox bind mount先が禁止system/credential/Docker socket path                       | `agents.*.sandbox.docker.binds[]`                                                                    | no       |
| `sandbox.dangerous_network_mode`                              | critical      | sandbox Docker networkが `host` または `container:*` 名前空間共有モード             | `agents.*.sandbox.docker.network`                                                                    | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | sandbox seccomp profileがcontainer isolationを弱める                                 | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | sandbox AppArmor profileがcontainer isolationを弱める                                | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | sandbox browser bridgeが送信元制限なしで露出                                         | `sandbox.browser.cdpSourceRange`                                                                     | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | 既存browser containerが非loopback interfaceでCDPを公開している                       | browser sandbox container publish config                                                             | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | 既存browser containerが現行config-hash label以前のもの                               | `openclaw sandbox recreate --browser --all`                                                          | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | 既存browser containerが現行browser config epoch以前のもの                            | `openclaw sandbox recreate --browser --all`                                                          | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` はsandbox off時にfail-closedする                                 | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | agent単位の `exec host=sandbox` はsandbox off時にfail-closedする                     | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | no       |
| `tools.exec.security_full_configured`                         | warn/critical | Host execが `security="full"` で動作している                                         | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Exec approvalsがskill binを暗黙に信頼している                                        | `~/.openclaw/exec-approvals.json`                                                                    | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | Interpreter allowlistでinline evalが再承認なしに通る                                 | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec approvals allowlist | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | `safeBins` のinterpreter/runtime binsが明示profileなしでexecリスクを広げる           | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                    | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | 広い振る舞いのtoolsを `safeBins` に入れると低リスクstdin-filter信頼モデルが弱まる    | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                           | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` に変更可能または危険なディレクトリが含まれる                    | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                       | no       |
| `skills.workspace.symlink_escape`                             | warn          | workspaceの `skills/**/SKILL.md` がworkspace root外へ解決される                      | workspace `skills/**` のファイルシステム状態                                                         | no       |
| `plugins.extensions_no_allowlist`                             | warn          | 明示plugin allowlistなしでextensionsがインストールされている                         | `plugins.allowlist`                                                                                  | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | plugin install recordが不変なnpm specに固定されていない                              | plugin install metadata                                                                              | no       |
| `plugins.installs_missing_integrity`                          | warn          | plugin install recordにintegrity metadataがない                                      | plugin install metadata                                                                              | no       |
| `plugins.installs_version_drift`                              | warn          | plugin install recordとインストール済みpackageがずれている                           | plugin install metadata                                                                              | no       |
| `plugins.code_safety`                                         | warn/critical | plugin code scanで疑わしい/危険なパターンが見つかった                                | plugin code / install source                                                                         | no       |
| `plugins.code_safety.entry_path`                              | warn          | plugin entry pathが隠し場所や `node_modules` を指している                            | plugin manifest `entry`                                                                              | no       |
| `plugins.code_safety.entry_escape`                            | critical      | plugin entryがplugin directoryを逸脱している                                         | plugin manifest `entry`                                                                              | no       |
| `plugins.code_safety.scan_failed`                             | warn          | plugin code scanを完了できなかった                                                   | plugin extension path / scan environment                                                             | no       |
| `skills.code_safety`                                          | warn/critical | skill installer metadata/codeに疑わしい/危険なパターンがある                         | skill install source                                                                                 | no       |
| `skills.code_safety.scan_failed`                              | warn          | skill code scanを完了できなかった                                                    | skill scan environment                                                                               | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | 共有/公開roomからexec有効agentに到達できる                                           | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`        | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | オープングループ + elevated toolsで高影響なprompt injection経路ができる              | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | オープングループからsandbox/workspace guardなしでcommand/file toolsに到達できる      | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`    | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | configがmulti-userに見えるがgateway trust modelは個人アシスタント前提                | 信頼境界を分割、または共有ユーザー強化（`sandbox.mode`、tool deny/workspace scoping）               | no       |
| `tools.profile_minimal_overridden`                            | warn          | agent overrideがグローバルminimal profileを迂回している                              | `agents.list[].tools.profile`                                                                        | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | permissive policy下でextension toolsに到達できる                                     | `tools.profile` + tool allow/deny                                                                    | no       |
| `models.legacy`                                               | warn          | legacy model familyがまだ設定されている                                              | model selection                                                                                      | no       |
| `models.weak_tier`                                            | warn          | 設定モデルが現在の推奨tierより弱い                                                   | model selection                                                                                      | no       |
| `models.small_params`                                         | critical/info | 小さいモデル + 危険なtool surfaceでinjectionリスクが上がる                           | model choice + sandbox/tool policy                                                                   | no       |
| `summary.attack_surface`                                      | info          | auth、channel、tool、exposure姿勢の集約サマリー                                      | 複数キー（詳細参照）                                                                                 | no       |

## HTTP経由のControl UI

Control UIはdevice identityを生成するために**安全なコンテキスト**（HTTPSまたはlocalhost）を必要とします。`gateway.controlUi.allowInsecureAuth` はローカル互換トグルです。

- localhostでは、ページが非安全HTTPで読み込まれた場合に、device identityなしでControl UI authを許可します。
- これはpairing checksを回避しません。
- リモート（non-localhost）のdevice identity要件を緩めることもありません。

HTTPS（Tailscale Serve）を優先するか、UIを `127.0.0.1` で開いてください。

緊急時専用として、`gateway.controlUi.dangerouslyDisableDeviceAuth` はdevice identity checksを完全に無効化します。これは重大なセキュリティ低下です。積極的にデバッグしていて、すぐに元へ戻せる場合以外はoffのままにしてください。

それらのdangerous flagsとは別に、成功した `gateway.auth.mode: "trusted-proxy"` は、device identityなしで**operator**のControl UI sessionを受け入れられます。これは意図されたauth-mode挙動であり、`allowInsecureAuth` の近道ではありません。また、node-roleのControl UI sessionには広がりません。

`openclaw security audit` は、この設定が有効なとき警告します。

## insecureまたはdangerous flagsの要約

`openclaw security audit` は、既知の insecure/dangerous debug switchesが有効だと `config.insecure_or_dangerous_flags` を含めます。現在このチェックが集約しているのは次です。

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

OpenClaw config schemaで定義されている完全な `dangerous*` / `dangerously*` キー:

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
- `channels.synology-chat.dangerouslyAllowNameMatching` (extension channel)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (extension channel)
- `channels.zalouser.dangerouslyAllowNameMatching` (extension channel)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Reverse Proxy設定

Gatewayをreverse proxy（nginx、Caddy、Traefikなど）の背後で動かす場合、forwarded-client IPを正しく扱うために `gateway.trustedProxies` を設定してください。

Gatewayが、`trustedProxies` に入っていないアドレスから来たproxy headersを検出すると、その接続を**ローカルクライアントとして扱いません**。gateway authが無効なら、その接続は拒否されます。これにより、proxy越しの接続がlocalhost由来に見えて自動信頼される認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、このauth modeはさらに厳格です。

- trusted-proxy authは**loopback-source proxyに対してfail-closed**する
- 同一host上のloopback reverse proxyでも、`gateway.trustedProxies` はlocal-client判定とforwarded IP処理に使える
- 同一hostのloopback reverse proxyでは、`gateway.auth.mode: "trusted-proxy"` ではなくtoken/password authを使う

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

`trustedProxies` が設定されていると、Gatewayは `X-Forwarded-For` を使ってclient IPを決定します。`X-Real-IP` は、`gateway.allowRealIpFallback: true` を明示しない限りデフォルトでは無視されます。

良いreverse proxy挙動（受信したforwarding headersを上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

悪いreverse proxy挙動（信頼できないforwarding headersを追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTSとoriginに関する注意

- OpenClaw gatewayはまずlocal/loopback前提です。TLSをreverse proxyで終端する場合、HSTSはそのproxy側HTTPSドメインで設定してください。
- gateway自体がHTTPSを終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClawレスポンスからHSTS headerを出せます。
- 詳しいデプロイ指針は [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- non-loopbackのControl UIデプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必須です。
- `gateway.controlUi.allowedOrigins: ["*"]` は、強化されたデフォルトではなく、明示的なbrowser-origin全許可ポリシーです。厳密に管理されたローカルテスト以外では避けてください。
- loopback上のbrowser-origin auth失敗も、一般のloopback免除が有効でもrate-limitedされます。ただしlockout keyは共有localhostバケットではなく、正規化された `Origin` 値ごとに分かれます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` はHost-header origin fallback modeを有効にします。これはdangerousなoperator選択ポリシーとして扱ってください。
- DNS rebindingとproxy host header挙動は、デプロイ強化の問題として扱ってください。`trustedProxies` は厳密に保ち、gatewayをパブリックインターネットへ直接公開しないでください。

## ローカルsession logsはディスク上にある

OpenClawはsession transcriptsを `~/.openclaw/agents/<agentId>/sessions/*.jsonl` にディスク保存します。
これはsession continuityや（任意で）session memory indexingに必要ですが、同時に
**ファイルシステムアクセスできる任意のprocess/userがそれらのlogを読める**ことも意味します。信頼境界はディスクアクセスだと考え、`~/.openclaw` の権限を厳しくしてください（下の監査セクション参照）。agent間でより強い分離が必要なら、別々のOSユーザーまたは別々のホストで動かしてください。

## Node実行 (`system.run`)

macOS nodeがペアリングされていると、Gatewayはそのnode上で `system.run` を呼び出せます。これはMac上での**リモートコード実行**です。

- node pairing（承認 + token）が必要です。
- Gateway node pairingはコマンドごとの承認面ではありません。これはnode identity/trustとtoken発行を確立するものです。
- Gatewayは `gateway.nodes.allowCommands` / `denyCommands` を使って大まかなグローバルnode command policyを適用します。
- Mac側では **Settings → Exec approvals**（security + ask + allowlist）で制御されます。
- ノードごとの `system.run` policyは、node自身のexec approvals file（`exec.approvals.node.*`）で、gatewayのグローバルcommand-ID policyより厳しいことも緩いこともあります。
- `security="full"` と `ask="off"` で動くnodeは、デフォルトのtrusted-operator modelに従っています。あなたのデプロイがより厳しい承認またはallowlist姿勢を明示的に必要としない限り、これは想定された動作として扱ってください。
- 承認モードは、正確なリクエストコンテキストと、可能なら1つの具体的なローカルscript/fileオペランドに結び付きます。OpenClawがinterpreter/runtime commandに対して正確に1つの直接ローカルファイルを特定できない場合、承認付き実行は拒否されます。完全な意味的カバレッジを約束することはしません。
- `host=node` では、承認付き実行は正規化済みの `systemRunPlan` も保存します。後続の承認済みforwardではその保存済みplanを再利用し、gateway validationは承認リクエスト作成後のcommand/cwd/session context変更を拒否します。
- リモート実行が不要なら、securityを **deny** にして、そのMacのnode pairingを削除してください。

これはトリアージ上重要です。

- 再接続したpaired nodeが異なるcommand listを広告していても、それだけで脆弱性ではありません。実際の実行境界は依然としてGateway global policyとnode local exec approvalsが強制します。
- Node pairing metadataを第2の隠れたコマンド単位承認層として扱う報告は、通常はポリシー/UXの混乱であり、セキュリティ境界バイパスではありません。

## 動的Skills（watcher / remote nodes）

OpenClawはsession途中でskills listを更新できます。

- **Skills watcher**: `SKILL.md` の変更は、次のagent turnでskills snapshotを更新できます。
- **Remote nodes**: macOS nodeを接続すると、macOS専用Skillsが有効候補になることがあります（bin probingに基づく）。

skill folderは**信頼されたコード**として扱い、誰が変更できるかを制限してください。

## 脅威モデル

あなたのAI assistantは次ができます。

- 任意のshell commandを実行する
- ファイルを読み書きする
- network serviceへアクセスする
- 誰にでもメッセージを送る（WhatsAppアクセスを与えていれば）

あなたにメッセージする人は次を試せます。

- AIを騙して危険なことをさせる
- データへのアクセスをソーシャルエンジニアリングする
- インフラ詳細を探る

## 中核概念: 知能の前にアクセス制御

ここで起きる失敗の大半は高度な攻撃ではなく、「誰かがbotにメッセージし、botが言われたとおりにした」です。

OpenClawの立場:

- **Identity first:** まず誰がbotに話しかけられるかを決める（DM pairing / allowlists / 明示的な「open」）。
- **Scope next:** 次に、botがどこで行動できるかを決める（group allowlists + mention gating、tools、sandboxing、device permissions）。
- **Model last:** モデルは操作されうると仮定し、操作されても影響範囲が限られるように設計する。

## コマンド認可モデル

Slash commandsとdirectiveは、**認可された送信者**に対してのみ有効です。認可は
channel allowlists/pairingと `commands.useAccessGroups` から導かれます（[Configuration](/gateway/configuration) と [Slash commands](/tools/slash-commands) を参照）。channel allowlistが空、または `"*"` を含む場合、commandsはそのchannelで実質的にopenです。

`/exec` は認可済みoperator向けのsession専用便利機能です。これはconfigを書き換えたり、他sessionを変更したりはしません。

## Control plane toolsのリスク

永続的なcontrol-plane変更を行える組み込みtoolが2つあります。

- `gateway` は `config.schema.lookup` / `config.get` でconfigを調べられ、`config.apply`、`config.patch`、`update.run` で永続変更もできます。
- `cron` は、元のchat/task終了後も動き続けるscheduled jobを作成できます。

owner専用の `gateway` runtime toolは、今も `tools.exec.ask` や `tools.exec.security` の書き換えを拒否します。legacyな `tools.bash.*` aliasは、書き込み前に同じ保護されたexec pathへ正規化されます。

信頼できないコンテンツを扱うagent/surfaceでは、デフォルトでこれらをdenyしてください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` はrestart actionだけをブロックします。`gateway` のconfig/update actionsは無効化しません。

## Plugins/extensions

PluginsはGateway内で**インプロセス**実行されます。信頼されたコードとして扱ってください。

- 信頼するソースからのみpluginをインストールする
- 明示的な `plugins.allow` allowlistを優先する
- 有効化前にplugin configを確認する
- plugin変更後はGatewayを再起動する
- pluginをインストール/更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、未信頼コードを実行するのと同じものとして扱う:
  - インストール先は、アクティブなplugin install root配下のpluginごとのディレクトリ
  - OpenClawはinstall/update前に組み込みの危険コードスキャンを実行する。`critical` 検出はデフォルトでブロックされる
  - OpenClawは `npm pack` を使い、そのディレクトリで `npm install --omit=dev` を実行する（npm lifecycle scriptsはinstall中にコードを実行できる）
  - 固定された正確なversion（`@scope/pkg@1.2.3`）を優先し、有効化前にディスク上へ展開されたコードを確認する
  - `--dangerously-force-unsafe-install` は、plugin install/updateフローでの組み込みスキャン誤検知に対する緊急回避専用です。plugin `before_install` hookのpolicy blockやscan failureは回避しません
  - Gateway-backedなskill dependency installも同じ dangerous/suspicious 分類に従います。組み込みの `critical` 検出は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を指定しない限りブロックされ、suspicious検出は警告のみです。`openclaw skills install` は別のClawHub skill download/installフローのままです。

詳細: [Plugins](/tools/plugin)

## DMアクセスモデル（pairing / allowlist / open / disabled）

現在のDM対応channelはすべて、メッセージ処理**前**に受信DMを制御するDM policy（`dmPolicy` または `*.dm.policy`）を持ちます。

- `pairing`（デフォルト）: 未知の送信者には短いpairing codeが送られ、承認されるまでbotはそのメッセージを無視します。codeは1時間で期限切れになります。繰り返しDMしても、新しいリクエストが作られるまで再送されません。保留リクエストはデフォルトで**channelごとに3件**までです。
- `allowlist`: 未知の送信者はブロックされます（pairing handshakeなし）。
- `open`: 誰でもDM可（公開）。**channel allowlistに `"*"` が必要**です（明示的オプトイン）。
- `disabled`: 受信DMを完全に無視します。

CLIで承認:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上ファイル: [Pairing](/ja-JP/channels/pairing)

## DM session分離（multi-user mode）

デフォルトでは、OpenClawは**すべてのDMをmain sessionへルーティング**するため、assistantはデバイスやchannelをまたいで連続性を持てます。**複数人**がbotにDMできるなら（open DMsや複数人allowlist）、DM sessionsを分離することを検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、group chatsを分離したまま、ユーザー間コンテキスト漏れを防げます。

これはメッセージングコンテキスト境界であって、host-admin境界ではありません。ユーザー同士が敵対的で、同じGateway host/configを共有するなら、信頼境界ごとに別Gatewayを実行してください。

### Secure DM mode（推奨）

上のスニペットを**secure DM mode**として扱ってください。

- デフォルト: `session.dmScope: "main"`（すべてのDMが1つのsessionを共有し連続性を持つ）
- ローカルCLI onboardingデフォルト: 未設定なら `session.dmScope: "per-channel-peer"` を書き込む（既存の明示設定は保持）
- Secure DM mode: `session.dmScope: "per-channel-peer"`（channel+senderごとに独立したDM context）
- Cross-channel peer isolation: `session.dmScope: "per-peer"`（同じtypeの全channelsをまたいでsenderごとに1つのsession）

同じchannel上で複数accountを動かすなら、代わりに `per-account-channel-peer` を使ってください。同じ人物が複数channelから連絡してくるなら、`session.identityLinks` を使ってそれらのDM sessionsを1つのcanonical identityに統合してください。[Session Management](/concepts/session) と [Configuration](/gateway/configuration) を参照してください。

## Allowlists（DM + groups）- 用語

OpenClawには、「誰が私を起動できるか」を決める別々のレイヤーが2つあります。

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`）: direct messagesでbotに話しかけられる相手。
  - `dmPolicy="pairing"` のとき、承認は `~/.openclaw/credentials/` 配下のaccount-scoped pairing allowlist storeへ書かれます（デフォルトaccountは `<channel>-allowFrom.json`、非デフォルトaccountは `<channel>-<accountId>-allowFrom.json`）。それがconfig allowlistsとマージされます。
- **Group allowlist**（channel固有）: botがどのgroups/channels/guildsからのメッセージを受け付けるか。
  - 一般的なパターン:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` のようなgroupごとのデフォルト。設定するとgroup allowlistとしても機能する（全許可を維持するなら `"*"` を含める）
    - `groupPolicy="allowlist"` + `groupAllowFrom`: group session内で誰がbotを起動できるかを制限する（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）
    - `channels.discord.guilds` / `channels.slack.channels`: surfaceごとのallowlists + mention defaults
  - Group checksはこの順で実行されます: 先に `groupPolicy`/group allowlists、その後mention/reply activation。
  - bot messageへの返信（暗黙mention）は、`groupAllowFrom` のようなsender allowlistsをバイパスしません。
  - **セキュリティ注意:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。極力使わず、room全員を完全に信頼しない限りpairing + allowlistsを優先してください。

詳細: [Configuration](/gateway/configuration) と [Groups](/ja-JP/channels/groups)

## Prompt injection（それが何か、なぜ重要か）

Prompt injectionとは、攻撃者がモデルを操作して危険なことをさせるメッセージを作ることです（「指示を無視しろ」「ファイルシステムを吐き出せ」「このリンクを開いてコマンドを実行しろ」など）。

強いsystem promptがあっても、**prompt injectionは未解決**です。System prompt guardrailsはあくまでソフトな指針であり、ハードな強制はtool policy、exec approvals、sandboxing、channel allowlistsから来ます（そしてoperatorは設計上それらを無効化できます）。実際に役立つのは次です。

- 受信DMを厳しく絞る（pairing/allowlists）。
- groupsではmention gatingを優先し、公開roomで「常時反応する」botを避ける。
- links、attachments、貼り付けられた指示はデフォルトで敵対的とみなす。
- 機微なtool executionはsandboxで実行し、secretはagentが到達できるfilesystem外に置く。
- 注意: sandboxingはオプトインです。sandbox modeがoffなら、暗黙の `host=auto` はgateway hostへ解決されます。明示的な `host=sandbox` はsandbox runtimeがないためfail-closedします。その挙動をconfigで明示したいなら `host=gateway` を設定してください。
- 高リスクtools（`exec`、`browser`、`web_fetch`、`web_search`）は、trusted agentsまたは明示allowlistsに限定する。
- インタープリター（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）をallowlistするなら、inline eval形式にも明示承認が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- **モデル選択は重要です:** 古い/小さい/legacyモデルは、prompt injectionやtool misuseに対して明らかに脆弱です。tools有効agentには、現行世代で最も強いinstruction-hardenedモデルを使ってください。

信頼してはいけない危険信号:

- 「このファイル/URLを読んで、その通りに行動して」
- 「system promptや安全ルールを無視して」
- 「隠れた指示やtool outputを明かして」
- 「`~/.openclaw` やlogsの中身を全部貼って」

## Unsafe external contentバイパスフラグ

OpenClawには、external-content safety wrappingを無効にする明示的バイパスフラグがあります。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

指針:

- 本番では未設定/falseに保つ。
- 一時的な限定デバッグでのみ有効化する。
- 有効化するなら、そのagentを隔離する（sandbox + minimal tools + 専用session namespace）。

Hooksリスク注意:

- 配送元が自分で管理するシステムでも、hook payloadsは未信頼コンテンツです（mail/docs/web contentはprompt injectionを含み得る）。
- 弱いモデルtierはこのリスクを高めます。hook-driven automationでは、強い最新model tierを使い、tool policyは厳しく保ってください（`tools.profile: "messaging"` 以上に厳しく）。可能ならsandboxingも使ってください。

### Prompt injectionは公開DMがなくても起こる

botにDMできるのが**自分だけ**でも、botが読む**未信頼コンテンツ**（web search/fetch結果、browser pages、emails、docs、attachments、貼り付けられたlogs/code）を通じてprompt injectionは起こりえます。つまり、脅威面は送信者だけではなく、**コンテンツ自体**です。

toolsが有効だと、典型的なリスクはコンテキスト流出やtool call誘発です。影響範囲を減らすには:

- read-onlyまたはtool無効の**reader agent**を使って未信頼コンテンツを要約し、その要約をmain agentへ渡す。
- `web_search` / `web_fetch` / `browser` は、必要な場合を除き、tools有効agentではoffにする。
- OpenResponsesのURL入力（`input_file` / `input_image`）では、`gateway.http.endpoints.responses.files.urlAllowlist` と `gateway.http.endpoints.responses.images.urlAllowlist` を厳しくし、`maxUrlParts` は低く保つ。空allowlistsは未設定扱いです。URL fetchを完全に無効化したいなら `files.allowUrl: false` / `images.allowUrl: false` を使ってください。
- OpenResponses file inputsでは、デコードされた `input_file` テキストも依然として**未信頼な外部コンテンツ**として注入されます。Gatewayがローカルでデコードしたからといって信頼できると思わないでください。長い `SECURITY NOTICE:` バナーは省略されても、注入ブロックには明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界マーカーと `Source: External` メタデータが付きます。
- 同じマーカーベースのラッピングは、media-understandingが添付文書からテキストを抽出してmedia promptへ追加するときにも適用されます。
- 未信頼入力に触れるagentにはsandboxingと厳格なtool allowlistsを有効にする。
- secretはpromptへ入れず、gateway host上のenv/config経由で渡す。

### モデル強度（セキュリティ注意）

Prompt injection耐性は、model tierごとに**均一ではありません**。小さい/安価なモデルほど、特に敵対的prompt下でtool misuseやinstruction hijackingに弱い傾向があります。

<Warning>
tools有効agentや未信頼コンテンツを読むagentでは、古い/小さいモデルによるprompt injectionリスクは高すぎることが多いです。その種のワークロードを弱いmodel tiersで動かさないでください。
</Warning>

推奨:

- tools実行やfiles/networksに触れられるbotには、**最新世代の最上位モデル**を使う。
- **古い/弱い/小さいtier** は、tools有効agentや未信頼受信箱には使わない。prompt injectionリスクが高すぎる。
- どうしても小さいモデルを使うなら、**影響範囲を縮小**する（read-only tools、強いsandboxing、最小のfilesystem access、厳格allowlists）。
- 小さいモデルを動かすときは、**全sessionsでsandboxingを有効化**し、入力が厳密管理されていない限り **web_search/web_fetch/browserを無効化**する。
- toolsなしでtrusted inputだけを扱うchat-only personal assistantなら、小さいモデルでもたいてい問題ありません。

<a id="reasoning-verbose-output-in-groups"></a>

## groupsでのReasoningとverbose output

`/reasoning` と `/verbose` は、公開channel向けではない内部reasoningやtool outputを露出する可能性があります。group設定では、これらは**デバッグ専用**として扱い、明示的に必要な場合以外はoffにしてください。

指針:

- 公開roomでは `/reasoning` と `/verbose` をoffに保つ。
- 有効化するなら、trusted DMsまたは厳密に管理されたroomだけにする。
- 忘れないでください: verbose outputには、tool args、URLs、モデルが見たデータが含まれうる。

## 設定の強化（例）

### 0) ファイル権限

gateway host上のconfig + stateは非公開に保ってください。

- `~/.openclaw/openclaw.json`: `600`（ユーザーの読み書きのみ）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` は、これらの権限を警告し、厳しくする提案をできます。

### 0.4) ネットワーク露出（bind + port + firewall）

Gatewayは単一ポートで **WebSocket + HTTP** を多重化します。

- デフォルト: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

このHTTP surfaceには、Control UIとcanvas hostが含まれます。

- Control UI（SPA assets）（デフォルトbase path `/`）
- Canvas host: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意HTML/JS。未信頼コンテンツとして扱う）

普通のbrowserでcanvas contentを読み込むなら、他の未信頼web pageと同様に扱ってください。

- canvas hostを信頼できないネットワーク/ユーザーへ公開しない
- 権限の高いweb surfaceと同じoriginをcanvas contentに共有させない。影響を完全に理解している場合を除く

Bind modeは、Gatewayがどこでlistenするかを決めます。

- `gateway.bind: "loopback"`（デフォルト）: ローカルクライアントだけが接続可能
- non-loopback bind（`"lan"`、`"tailnet"`、`"custom"`）は攻撃面を広げる。gateway auth（shared token/passwordまたは正しく設定されたnon-loopback trusted proxy）と実際のfirewallがある場合にのみ使う

経験則:

- LAN bindよりTailscale Serveを優先する（ServeならGatewayはloopbackのまま、アクセスはTailscaleが処理する）
- LANへbindする必要があるなら、portは厳しい送信元IP allowlistでfirewallし、広くport-forwardしない
- `0.0.0.0` へ未認証でGatewayを公開しない

### 0.4.1) Docker port publishing + UFW (`DOCKER-USER`)

VPS上でDockerと一緒にOpenClawを動かす場合、公開container port
（`-p HOST:CONTAINER` またはCompose `ports:`）は、ホストの `INPUT` ルールだけでなくDockerのforwarding chainsも通ることに注意してください。

Dockerトラフィックをfirewall policyと一致させるには、
`DOCKER-USER` でルールを強制してください（このchainはDocker自身のaccept rulesより先に評価されます）。
多くの最近のdistroでは、`iptables`/`ip6tables` は `iptables-nft` frontendを使い、これらのルールは引き続きnftables backendに適用されます。

最小allowlist例（IPv4）:

```bash
# /etc/ufw/after.rules (append as its own *filter section)
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

IPv6には別テーブルがあります。Docker IPv6を有効にしているなら、
`/etc/ufw/after6.rules` にも対応するpolicyを追加してください。

docsの例に `eth0` のようなinterface名を固定で書かないでください。interface名はVPS imageごとに異なり（`ens3`、`enp*` など）、不一致だとdeny ruleが意図せず効かないことがあります。

reload後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

外部から見えるportは、意図して公開したものだけであるべきです（多くの構成では SSH + reverse proxy ports）。

### 0.4.2) mDNS/Bonjour discovery（情報漏えい）

Gatewayはローカルデバイス発見のために、mDNS（port 5353上の `_openclaw-gw._tcp`）で自身の存在をブロードキャストします。full modeでは、運用詳細を漏らす可能性のあるTXT recordsを含みます。

- `cliPath`: CLI binaryの完全filesystem path（usernameとinstall locationを露出）
- `sshPort`: host上でSSHが使えることを広告する
- `displayName`, `lanHost`: hostname情報

**運用セキュリティ上の考慮:** インフラ詳細をブロードキャストすると、ローカルネットワーク上の誰に対しても偵察が容易になります。filesystem pathsやSSH可用性のような「無害に見える」情報でも、攻撃者が環境を把握する助けになります。

**推奨:**

1. **minimal mode**（デフォルト、公開gatewayでは推奨）: mDNS broadcastから機微なフィールドを省く

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス発見が不要なら**完全に無効化**する

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **full mode**（オプトイン）: TXT recordsに `cliPath` + `sshPort` を含める

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替）: config変更なしでmDNSを無効にするには `OPENCLAW_DISABLE_BONJOUR=1` を設定する

minimal modeでは、Gatewayはデバイス発見に十分な情報（`role`, `gatewayPort`, `transport`）はbroadcastしますが、`cliPath` と `sshPort` は省きます。CLI path情報が必要なappsは、認証済みWebSocket接続経由でそれを取得できます。

### 0.5) Gateway WebSocketをロックダウンする（local auth）

Gateway authはデフォルトで**必須**です。正しいgateway auth pathが設定されていないと、
GatewayはWebSocket接続を拒否します（fail-closed）。

Onboardingはデフォルトでtokenを生成するため（loopbackでも）、
ローカルクライアントも認証が必要です。

tokenを設定して、**すべての**WS clientsが認証されるようにします。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctorは生成できます: `openclaw doctor --generate-gateway-token`

注意: `gateway.remote.token` / `.password` はclient credential sourceです。
それ自体ではローカルWS accessを保護しません。
ローカル呼び出し経路は、`gateway.auth.*` が未設定のときのみ `gateway.remote.*` をfallbackとして使えます。
`gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示設定されていて未解決の場合、解決はfail-closedします（remote fallbackで隠されません）。
任意: `wss://` 使用時は `gateway.remote.tlsFingerprint` でremote TLSをpinできます。
平文 `ws://` はデフォルトでloopback専用です。信頼されたprivate-network path向けには、緊急回避としてclient processで `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

ローカルdevice pairing:

- 同一host上のdirect local loopback connectは、same-host clientsを滑らかにするため自動承認されます。
- OpenClawには、信頼されたshared-secret helper flows向けの、狭いbackend/container-local self-connect pathもあります。
- TailnetとLAN接続は、same-host tailnet bindを含め、pairing上はremoteとして扱われ、引き続き承認が必要です。

Auth modes:

- `gateway.auth.mode: "token"`: shared bearer token（多くの構成で推奨）
- `gateway.auth.mode: "password"`: password auth（`OPENCLAW_GATEWAY_PASSWORD` をenvで設定するのを推奨）
- `gateway.auth.mode: "trusted-proxy"`: identity-aware reverse proxyがユーザー認証し、headersでidentityを渡すことを信頼する（[Trusted Proxy Auth](/gateway/trusted-proxy-auth) 参照）

ローテーション手順（token/password）:

1. 新しいsecretを生成/設定する（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）。
2. Gatewayを再起動する（またはmacOS appがGatewayを監督しているならそのappを再起動する）。
3. remote clientsを更新する（Gatewayを呼ぶ各マシンの `gateway.remote.token` / `.password`）。
4. 古いcredentialでは接続できなくなったことを確認する。

### 0.6) Tailscale Serve identity headers

`gateway.auth.allowTailscale` が `true` のとき（Serveではデフォルト）、OpenClawは
Control UI/WebSocket認証にTailscale Serve identity headers（`tailscale-user-login`）を受け入れます。OpenClawは、`x-forwarded-for` アドレスをローカルTailscale daemon経由（`tailscale whois`）で解決し、その結果をheaderと照合することでidentityを検証します。これは、リクエストがloopbackへ到達し、かつ `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` をTailscaleにより注入されている場合にのみ発動します。
この非同期identity check pathでは、同じ `{scope, ip}` に対する失敗試行はlimiterが失敗を記録する前に直列化されます。そのため1つのServe clientからの悪い並行再試行は、2つの単なる不一致としてすり抜けるのではなく、2回目が即座にlock outされることがあります。
HTTP API endpoints（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）はTailscale identity-header authを使いません。これらは引き続きgatewayで設定されたHTTP auth modeに従います。

重要な境界メモ:

- Gateway HTTP bearer authは、実質的にall-or-nothingのoperator accessです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼べるcredentialは、そのgatewayに対する完全アクセスoperator secretとして扱ってください。
- OpenAI互換HTTP surfaceでは、shared-secret bearer authは完全なデフォルトoperator scopes（`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`）と、agent turnsに対するowner semanticsを復元します。より狭い `x-openclaw-scopes` 値では、このshared-secret pathは狭まりません。
- HTTPでのper-request scope semanticsは、trusted proxy authやprivate ingress上の `gateway.auth.mode="none"` のようなidentity-bearing modeから来たリクエストにのみ適用されます。
- それらのidentity-bearing modesでは、`x-openclaw-scopes` を省略すると通常のoperatorデフォルトscope setにフォールバックします。より狭いscope setが欲しいなら、そのheaderを明示的に送ってください。
- `/tools/invoke` も同じshared-secret ruleに従います: token/password bearer authはそこでも完全operator accessとして扱われ、identity-bearing modesでは引き続き宣言scopeを尊重します。
- これらのcredentialを信頼できない呼び出し元と共有しないでください。信頼境界ごとに別gatewayを使う方がよいです。

**信頼前提:** tokenless Serve authはgateway hostが信頼されている前提です。敵対的なsame-host processからの保護だと考えないでください。gateway host上で未信頼のローカルコードが動く可能性があるなら、`gateway.auth.allowTailscale` を無効にし、`gateway.auth.mode: "token"` または `"password"` による明示shared-secret authを必須にしてください。

**セキュリティルール:** 自分のreverse proxyからこれらのheadersをforwardしないでください。TLSをgateway手前で終端したりproxyしたりするなら、`gateway.auth.allowTailscale` を無効にし、shared-secret auth（`gateway.auth.mode: "token"` または `"password"`）または [Trusted Proxy Auth](/gateway/trusted-proxy-auth) を使ってください。

Trusted proxies:

- Gateway手前でTLS終端するなら、proxy IPを `gateway.trustedProxies` に設定してください。
- OpenClawは、それらのIPから来た `x-forwarded-for`（または `x-real-ip`）を信頼し、local pairing checksやHTTP auth/local checksのためのclient IP決定に使います。
- proxyが `x-forwarded-for` を**上書き**し、Gateway portへの直接アクセスを遮断することを確認してください。

[ Tailscale ](/gateway/tailscale) と [Web overview](/web) も参照してください。

### 0.6.1) node host経由のbrowser control（推奨）

Gatewayがremoteでもbrowserが別マシン上で動くなら、そのbrowserマシンで **node host** を動かし、Gatewayにbrowser actionsをproxyさせてください（[Browser tool](/tools/browser) 参照）。
node pairingはadmin accessとして扱ってください。

推奨パターン:

- Gatewayとnode hostを同じtailnet（Tailscale）上に保つ。
- 意図的にnodeをpairし、不要ならbrowser proxy routingを無効化する。

避けるべきこと:

- relay/control portsをLANや公開Internetへ露出すること。
- browser control endpointsに対するTailscale Funnel（公開露出）。

### 0.7) ディスク上のsecret（機密データ）

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下のものは、secretやprivate dataを含みうると考えてください。

- `openclaw.json`: configにはtokens（gateway、remote gateway）、provider settings、allowlistsが入りうる
- `credentials/**`: channel credentials（例: WhatsApp creds）、pairing allowlists、legacy OAuth imports
- `agents/<agentId>/agent/auth-profiles.json`: API keys、token profiles、OAuth tokens、任意の `keyRef`/`tokenRef`
- `secrets.json`（任意）: `file` SecretRef providersで使うファイルベースsecret payload（`secrets.providers`）
- `agents/<agentId>/agent/auth.json`: legacy互換ファイル。静的な `api_key` entriesは検出時にscrubされる
- `agents/<agentId>/sessions/**`: session transcripts（`*.jsonl`）+ routing metadata（`sessions.json`）。private messagesやtool outputを含みうる
- bundled plugin packages: インストール済みplugins（およびそれらの `node_modules/`）
- `sandboxes/**`: tool sandbox workspaces。sandbox内で読んだ/書いたファイルのコピーが蓄積しうる

強化のヒント:

- 権限は厳しくする（dirは `700`、fileは `600`）
- gateway hostではfull-disk encryptionを使う
- host共有時はGateway専用のOS user accountを優先する

### 0.8) Logs + transcripts（redaction + retention）

アクセス制御が正しくても、logsやtranscriptsは機微情報を漏らしえます。

- Gateway logsにはtool summary、errors、URLsが含まれうる
- Session transcriptsには貼り付けられたsecret、file contents、command output、linksが含まれうる

推奨:

- tool summary redactionを有効に保つ（`logging.redactSensitive: "tools"`; デフォルト）
- 環境固有のパターン（tokens、hostnames、internal URLs）を `logging.redactPatterns` で追加する
- 診断を共有するときは、生logsより `openclaw status --all`（貼り付け向け、secrets redacted）を優先する
- 長期保持が不要なら、古いsession transcriptsとlog filesを整理する

詳細: [Logging](/gateway/logging)

### 1) DMs: デフォルトでpairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Groups: どこでもmention必須

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

group chatsでは、明示的にmentionされたときだけ応答してください。

### 3) 別番号を使う（WhatsApp、Signal、Telegram）

電話番号ベースchannelでは、AI用に個人番号とは別の電話番号を使うことを検討してください。

- 個人番号: あなたの会話を非公開に保てる
- bot番号: AIが適切な境界付きで処理する

### 4) 読み取り専用モード（sandbox + tools経由）

以下を組み合わせることで、読み取り専用profileを作れます。

- `agents.defaults.sandbox.workspaceAccess: "ro"`（またはworkspace accessなしなら `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックするtool allow/deny lists

追加の強化オプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandboxingがoffでも `apply_patch` がworkspace directory外を書き換え/削除できないようにする。workspace外へ触れさせたい意図がある場合だけ `false` にする。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` のパスと、ネイティブprompt image auto-load pathsをworkspace directoryに制限する（今は絶対パスを許していて、1つのガードレールが欲しい場合に有用）。
- Filesystem rootsは狭く保つ: agent workspaces/sandbox workspacesにhome directory全体のような広いrootを使わない。広いrootは、`~/.openclaw` 配下のstate/configのような機微ファイルをfilesystem toolsへ露出し得る。

### 5) 安全なベースライン（そのまま使える）

Gatewayを非公開に保ち、DM pairingを要求し、常時反応するgroup botを避ける「安全側のデフォルト」設定例です。

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

tool executionも「より安全側」にしたいなら、sandboxを有効にし、owner以外のagentではdangerous toolsをdenyしてください（下の「agentごとのアクセスプロファイル」の例参照）。

chat-drivenなagent turnsに対する組み込みベースラインでは、owner以外の送信者は `cron` や `gateway` toolsを使えません。

## Sandboxing（推奨）

専用ドキュメント: [Sandboxing](/gateway/sandboxing)

補完し合う2つの方法があります。

- **Gateway全体をDockerで実行する**（container boundary）: [Docker](/install/docker)
- **Tool sandbox**（`agents.defaults.sandbox`、gateway hostはそのまま + toolsだけDocker隔離）: [Sandboxing](/gateway/sandboxing)

注意: cross-agent accessを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）に保つか、より厳格な `"session"` にしてください。`scope: "shared"` は単一container/workspaceを共有します。

sandbox内のagent workspace accessも検討してください。

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）はagent workspaceを見せず、toolsは `~/.openclaw/sandboxes` 配下のsandbox workspaceで動く
- `agents.defaults.sandbox.workspaceAccess: "ro"` はagent workspaceを `/agent` にread-only mountする（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` はagent workspaceを `/workspace` にread/write mountする
- 追加の `sandbox.docker.binds` は、正規化・canonical化されたsource pathsに対して検証される。親symlink tricksやcanonical home aliasesも、`/etc`、`/var/run`、OS home配下のcredential directoriesなど禁止rootへ解決される場合はfail-closedする。

重要: `tools.elevated` は、sandbox外でexecを実行するグローバルbaseline escape hatchです。実効hostはデフォルトで `gateway`、exec targetが `node` に設定されていれば `node` になります。`tools.elevated.allowFrom` は厳しく保ち、見知らぬ相手には有効にしないでください。agentごとに `agents.list[].tools.elevated` でもさらに制限できます。[Elevated Mode](/tools/elevated) を参照してください。

### Sub-agent delegation guardrail

session toolsを許可するなら、委譲されたsub-agent runsも別の境界判断として扱ってください。

- agentが本当にdelegationを必要としない限り、`sessions_spawn` をdenyする。
- `agents.defaults.subagents.allowAgents` と、agentごとの `agents.list[].subagents.allowAgents` overridesは、既知の安全なtarget agentsに限定する。
- sandbox内に留まる必要があるワークフローでは、`sessions_spawn` を `sandbox: "require"` で呼ぶ（デフォルトは `inherit`）。
- `sandbox: "require"` は、target child runtimeがsandboxedでない場合に即失敗する。

## Browser controlのリスク

browser controlを有効にすると、モデルに実browserを操作する力を与えます。
そのbrowser profileにログイン済みsessionが入っていれば、モデルはそれらのaccountやdataへアクセスできます。browser profilesは**機微なstate**として扱ってください。

- agent専用profileを優先する（デフォルトの `openclaw` profile）
- agentをあなたの個人用daily-driver profileに向けない
- sandboxed agentsでは、信頼していない限りhost browser controlを無効にする
- standaloneなloopback browser control APIはshared-secret auth（gateway token bearer authまたはgateway password）だけを受け入れる。trusted-proxyやTailscale Serve identity headersは使わない
- browser downloadsは未信頼入力として扱い、できれば隔離downloads directoryを使う
- agent profileではbrowser sync/password managersを無効にできるなら無効にする（影響範囲縮小）
- remote gatewaysでは、「browser control」はそのprofileが到達できる範囲への「operator access」と同等だと考える
- Gatewayとnode hostsはtailnet専用に保ち、browser control portsをLANや公開Internetへ露出しない
- browser proxy routingは不要なら無効にする（`gateway.nodes.browser.mode="off"`）
- Chrome MCP existing-session modeは**より安全ではありません**。そのhostのChrome profileが到達できるものに対して、あなた本人として動けます。

### Browser SSRF policy（trusted-networkデフォルト）

OpenClawのbrowser network policyは、デフォルトでtrusted-operator modelです。明示的に無効化しない限り、private/internal destinationsが許可されます。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`（未設定時も暗黙的にtrue）
- Legacy alias: `browser.ssrfPolicy.allowPrivateNetwork` も互換のため受け付ける
- Strict mode: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定すると、private/internal/special-use destinationsをデフォルトでブロックする
- strict modeでは、明示例外に `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなblocked namesを含む正確なhost例外）を使う
- redirect-based pivotsを減らすため、navigationはrequest前にチェックされ、navigation後の最終 `http(s)` URLでもベストエフォートで再チェックされる

strict policy例:

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

## agentごとのアクセスプロファイル（multi-agent）

multi-agent routingでは、各agentが独自のsandbox + tool policyを持てます:
これを使って、agentごとに **full access**、**read-only**、**no access** を与えてください。
詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

一般的な用途:

- 個人agent: full access、sandboxなし
- family/work agent: sandboxed + read-only tools
- 公開agent: sandboxed + filesystem/shell toolsなし

### 例: full access（sandboxなし）

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

### 例: read-only tools + read-only workspace

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

### 例: filesystem/shell accessなし（provider messagingは許可）

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

agentのsystem promptにセキュリティ指針を含めてください。

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## インシデント対応

AIが何かまずいことをしたら:

### 封じ込める

1. **止める:** macOS app（Gatewayを監督している場合）を止めるか、`openclaw gateway` processを終了する。
2. **露出を閉じる:** 何が起きたか理解するまで、`gateway.bind: "loopback"` にする（またはTailscale Funnel/Serveを無効にする）。
3. **アクセスを凍結する:** 危険なDM/groupsは `dmPolicy: "disabled"` にする / mention必須にする / `"*"` の全許可エントリがあれば削除する。

### ローテーションする（secretが漏れたなら侵害前提で動く）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションし、再起動する。
2. remote client secrets（Gatewayを呼べる各マシンの `gateway.remote.token` / `.password`）をローテーションする。
3. provider/API credentials（WhatsApp creds、Slack/Discord tokens、`auth-profiles.json` 内のmodel/API keys、暗号化secret payload values）をローテーションする。

### 監査する

1. Gateway logsを確認する: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連transcript(s)を確認する: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近のconfig changesを確認する（アクセスを広げた可能性があるもの: `gateway.bind`、`gateway.auth`、dm/group policies、`tools.elevated`、plugin changes）。
4. `openclaw security audit --deep` を再実行し、critical findingsが解消されたことを確認する。

### 報告用に集めるもの

- タイムスタンプ、gateway host OS + OpenClaw version
- session transcript(s) + 短いlog tail（redact後）
- 攻撃者が送ったもの + agentがしたこと
- Gatewayがloopbackを超えて露出していたか（LAN/Tailscale Funnel/Serve）

## Secret Scanning (`detect-secrets`)

CIは `secrets` jobで `detect-secrets` pre-commit hookを実行します。
`main` へのpushでは常に全ファイルスキャンを行います。pull requestでは、base commitがあると変更ファイルだけの高速経路を使い、なければ全ファイルスキャンへフォールバックします。失敗した場合、baselineにまだ入っていない新しい候補があります。

### CIが失敗したら

1. ローカルで再現する:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ツールを理解する:
   - pre-commit内の `detect-secrets` は、repoのbaselineとexcludeを使って `detect-secrets-hook` を実行する。
   - `detect-secrets audit` は対話的レビューを開き、baselineの各項目を本物か誤検知かに印付けする。
3. 本物のsecretなら: rotate/removeし、その後スキャンを再実行してbaselineを更新する。
4. 誤検知なら: 対話監査を実行し、falseとしてマークする:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しいexcludeが必要なら、`.detect-secrets.cfg` に追加し、対応する `--exclude-files` / `--exclude-lines` フラグ付きでbaselineを再生成する（config fileは参照用であり、detect-secretsは自動では読まない）。

意図した状態を反映した `.secrets.baseline` をコミットしてください。

## セキュリティ問題の報告

OpenClawで脆弱性を見つけた場合は、責任ある方法で報告してください。

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開しない
3. 希望しない場合を除き、クレジットします
