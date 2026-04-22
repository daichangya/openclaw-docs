---
read_when:
    - アクセスや自動化を拡大する機能の追加
summary: シェルアクセスを持つ AI Gateway を実行する際のセキュリティ上の考慮事項と脅威モデル
title: Security
x-i18n:
    generated_at: "2026-04-22T04:22:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4cf3b71c6c22b8c0b06855de7496265d23b4e7510e339301c85b2438ed94b3b
    source_path: gateway/security/index.md
    workflow: 15
---

# Security

<Warning>
**パーソナルアシスタントの信頼モデル:** このガイダンスは、Gateway ごとに 1 つの信頼されたオペレーター境界（単一ユーザー/パーソナルアシスタントモデル）を前提としています。  
OpenClaw は、1 つの agent/Gateway を複数の敵対的ユーザーが共有する状況における、敵対的マルチテナントのセキュリティ境界では**ありません**。  
混在信頼または敵対的ユーザー運用が必要な場合は、信頼境界を分離してください（別々の Gateway + 認証情報、理想的には別々の OS ユーザー/ホスト）。
</Warning>

**このページの内容:** [信頼モデル](#scope-first-personal-assistant-security-model) | [クイック監査](#quick-check-openclaw-security-audit) | [強化されたベースライン](#hardened-baseline-in-60-seconds) | [DM アクセスモデル](#dm-access-model-pairing-allowlist-open-disabled) | [設定のハードニング](#configuration-hardening-examples) | [インシデント対応](#incident-response)

## 最初にスコープ: パーソナルアシスタントのセキュリティモデル

OpenClaw のセキュリティガイダンスは、**パーソナルアシスタント**のデプロイを前提としています。つまり、1 つの信頼されたオペレーター境界の中に、複数の agent が存在しうる構成です。

- サポートされるセキュリティ態勢: Gateway ごとに 1 つのユーザー/信頼境界（境界ごとに 1 OS ユーザー/ホスト/VPS を推奨）
- サポート対象外のセキュリティ境界: 相互に信頼していない、または敵対的なユーザーが共有する 1 つの Gateway/agent
- 敵対的ユーザー分離が必要な場合は、信頼境界ごとに分割してください（別々の Gateway + 認証情報、理想的には別々の OS ユーザー/ホスト）
- 複数の信頼していないユーザーが 1 つの tool 有効 agent にメッセージを送れる場合、その agent に委任された同じ tool 権限を共有しているものとして扱ってください

このページでは、このモデル**内**でのハードニングについて説明します。1 つの共有 Gateway 上での敵対的マルチテナント分離を主張するものではありません。

## クイックチェック: `openclaw security audit`

参照: [Formal Verification (Security Models)](/ja-JP/security/formal-verification)

これを定期的に実行してください（特に config を変更した後やネットワーク面を公開した後）。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に対象を絞っています。一般的な open グループ policy を allowlist に切り替え、`logging.redactSensitive: "tools"` を復元し、state/config/include-file の権限を厳格化し、Windows 上では POSIX `chmod` の代わりに Windows ACL リセットを使用します。

これは一般的な落とし穴（Gateway 認証の露出、browser control の露出、権限昇格された allowlist、filesystem 権限、緩い exec 承認、open-channel の tool 露出）を検出します。

OpenClaw は製品であると同時に実験でもあります。つまり、最先端モデルの挙動を現実のメッセージング面と実際の tool に接続しているということです。**「完全に安全」なセットアップは存在しません。** 目標は、次の点を意識的に決めることです。

- 誰が bot と会話できるか
- bot がどこで動作を許可されるか
- bot が何に触れられるか

まずは、動作に必要な最小のアクセスから始めて、自信がつくにつれて広げてください。

### デプロイとホストの信頼

OpenClaw は、ホストと config 境界が信頼されていることを前提としています。

- 誰かが Gateway ホストの state/config（`openclaw.json` を含む `~/.openclaw`）を変更できるなら、その人は信頼されたオペレーターとして扱ってください。
- 複数の相互に信頼していない/敵対的なオペレーターのために 1 つの Gateway を実行する構成は、**推奨されるセットアップではありません**。
- 混在信頼のチームでは、別々の Gateway（または最低でも別々の OS ユーザー/ホスト）で信頼境界を分割してください。
- 推奨されるデフォルトは、1 マシン/ホスト（または VPS）あたり 1 ユーザー、そのユーザーのための 1 Gateway、その Gateway 内に 1 つ以上の agent です。
- 1 つの Gateway インスタンス内では、認証されたオペレーターアクセスは、ユーザー単位テナントの役割ではなく、信頼された control-plane の役割です。
- セッション識別子（`sessionKey`、session ID、label）はルーティング選択子であり、認可トークンではありません。
- 複数人が 1 つの tool 有効 agent にメッセージを送れる場合、その全員が同じ権限セットを操作できます。ユーザー単位の session/memory 分離はプライバシーには役立ちますが、共有 agent をユーザー単位ホスト認可に変えるものではありません。

### 共有 Slack workspace: 現実のリスク

「Slack の誰でも bot にメッセージできる」場合、中核となるリスクは委任された tool 権限です。

- 許可された任意の送信者が、その agent の policy 内で tool 呼び出し（`exec`、browser、network/file tool）を誘発できる
- ある送信者からのプロンプト/コンテンツインジェクションが、共有 state、デバイス、出力に影響する動作を引き起こせる
- 1 つの共有 agent が機微な認証情報/ファイルを持っている場合、許可された任意の送信者が tool 利用によってそれらを流出させうる

チームワークフローには、最小限の tool を持つ別々の agent/Gateway を使い、個人データを扱う agent は非公開にしてください。

### 会社共有 agent: 許容できるパターン

これは、その agent を使う全員が同じ信頼境界内にあり（たとえば 1 つの会社チーム）、その agent が厳密に業務スコープに限定されている場合には許容できます。

- 専用のマシン/VM/container で実行する
- その runtime 用に専用の OS ユーザー + 専用の browser/profile/account を使う
- その runtime で個人の Apple/Google アカウントや個人のパスワードマネージャー/browser profile にサインインしない

同じ runtime 上で個人アイデンティティと会社アイデンティティを混在させると、その分離は崩れ、個人データ露出リスクが高まります。

## Gateway と Node の信頼概念

Gateway と Node は、役割の異なる 1 つのオペレーター信頼ドメインとして扱ってください。

- **Gateway** は control plane および policy 面です（`gateway.auth`、tool policy、routing）
- **Node** は、その Gateway とペアリングされたリモート実行面です（command、device action、host-local capability）
- Gateway に認証された呼び出し元は、Gateway スコープで信頼されます。ペアリング後、node action はその Node 上での信頼されたオペレーター動作です。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザー単位認証ではありません。
- Exec 承認（allowlist + ask）は、オペレーター意図のためのガードレールであり、敵対的マルチテナント分離ではありません。
- 信頼された単一オペレーター構成に対する OpenClaw の製品デフォルトでは、`gateway`/`node` 上の host exec は承認プロンプトなしで許可されます（`security="full"`、締め付けない限り `ask="off"`）。このデフォルトは意図的な UX であり、それ自体は脆弱性ではありません。
- Exec 承認は、正確な要求コンテキストと、ベストエフォートの直接ローカルファイルオペランドに bind されます。あらゆる runtime/interpreter loader path を意味的にモデル化するものではありません。強い境界が必要なら sandbox 化とホスト分離を使用してください。

敵対的ユーザー分離が必要なら、OS ユーザー/ホストごとに信頼境界を分離し、別々の Gateway を実行してください。

## 信頼境界マトリクス

リスクをトリアージするときの簡易モデルとして使用してください。

| 境界または制御                                          | 意味                                            | よくある誤解                                                           |
| ------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| `gateway.auth`（token/password/trusted-proxy/device auth） | Gateway API への呼び出し元を認証する              | 「安全にするには全フレームにメッセージ単位の署名が必要」                 |
| `sessionKey`                                            | コンテキスト/session 選択のためのルーティングキー | 「session key はユーザー認証境界だ」                                    |
| プロンプト/コンテンツのガードレール                        | モデル悪用リスクを低減する                        | 「プロンプトインジェクションだけで認証バイパスが証明される」              |
| `canvas.eval` / browser evaluate                        | 有効時の意図的なオペレーター capability           | 「どんな JS eval プリミティブも、この信頼モデルでは自動的に脆弱性になる」 |
| ローカル TUI の `!` shell                               | 明示的にオペレーターが起動するローカル実行          | 「ローカル shell の便利コマンドはリモートインジェクションだ」            |
| Node のペアリングと node command                        | ペアリング済みデバイス上でのオペレーターレベルのリモート実行 | 「リモートデバイス制御はデフォルトで信頼されていないユーザーアクセスとして扱うべきだ」 |

## 設計上、脆弱性ではないもの

次のパターンはよく報告されますが、実際の境界バイパスが示されない限り、通常は対応不要としてクローズされます。

- policy/auth/sandbox のバイパスを伴わない、プロンプトインジェクションだけのチェーン
- 1 つの共有ホスト/config 上での敵対的マルチテナント運用を前提にした主張
- 共有 Gateway 構成において、通常のオペレーター読み取りパス（たとえば `sessions.list`/`sessions.preview`/`chat.history`）を IDOR と分類する主張
- localhost 限定デプロイの指摘（たとえば loopback-only Gateway に対する HSTS）
- この repo に存在しない受信経路に対する Discord inbound Webhook 署名の指摘
- `system.run` に対して、実際の実行境界が依然として Gateway のグローバルな Node command policy と Node 自身の exec 承認であるにもかかわらず、Node pairing metadata を隠れた第 2 の command 単位承認層として扱う報告
- `sessionKey` を認証トークンとみなす「ユーザー単位認可の欠如」指摘

## 研究者向けプレフライトチェックリスト

GHSA を開く前に、次のすべてを確認してください。

1. 再現が最新の `main` または最新リリースでも成立する
2. レポートに正確なコードパス（`file`、function、line range）とテストした version/commit が含まれている
3. 影響が文書化された信頼境界を越えている（単なるプロンプトインジェクションではない）
4. 主張が [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) に載っていない
5. 既存 advisory を重複確認した（該当するなら canonical GHSA を再利用する）
6. デプロイ前提が明示されている（loopback/local か公開か、信頼されたオペレーターか信頼されていないか）

## 60 秒でできる強化ベースライン

まずこのベースラインを使い、その後、信頼した agent ごとに必要な tool を選択的に再有効化してください。

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

これにより、Gateway は local-only に保たれ、DM は分離され、control-plane/runtime tool はデフォルトで無効になります。

## 共有 inbox のクイックルール

複数人が bot に DM できる場合:

- `session.dmScope: "per-channel-peer"`（またはマルチアカウント channel では `"per-account-channel-peer"`）を設定する
- `dmPolicy: "pairing"` または厳格な allowlist を維持する
- 共有 DM と広い tool アクセスを決して組み合わせない
- これは協調的な/shared inbox を強化しますが、ユーザーがホスト/config 書き込みアクセスを共有する場合の敵対的共同テナント分離向けには設計されていません

## コンテキスト可視性モデル

OpenClaw は、次の 2 つの概念を分けています。

- **トリガー認可**: 誰が agent をトリガーできるか（`dmPolicy`、`groupPolicy`、allowlist、mention gate）
- **コンテキスト可視性**: モデル入力にどの補足コンテキストが注入されるか（reply body、quoted text、thread history、forwarded metadata）

Allowlist はトリガーと command 認可を制御します。`contextVisibility` 設定は、補足コンテキスト（引用返信、スレッドルート、取得済み履歴）がどのようにフィルタされるかを制御します。

- `contextVisibility: "all"`（デフォルト）は補足コンテキストを受信したまま保持します
- `contextVisibility: "allowlist"` は補足コンテキストを、アクティブな allowlist チェックで許可された送信者に絞り込みます
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、1 件の明示的な引用返信は保持します

`contextVisibility` は channel ごと、または room/conversation ごとに設定してください。設定の詳細は [Group Chats](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

advisory トリアージの指針:

- 「モデルが allowlist されていない送信者の quoted text や履歴テキストを見られる」だけを示す主張は、それ自体では auth や sandbox 境界バイパスではなく、`contextVisibility` で対処できるハードニング上の指摘です。
- セキュリティ影響ありとするには、報告には依然として、信頼境界バイパス（auth、policy、sandbox、approval、または他の文書化された境界）の実証が必要です。

## audit がチェックする内容（高レベル）

- **受信アクセス**（DM policy、group policy、allowlist）: 見知らぬ相手が bot をトリガーできるか？
- **tool の blast radius**（elevated tool + open ルーム）: プロンプトインジェクションが shell/file/network 操作に変わりうるか？
- **Exec 承認のドリフト**（`security=full`、`autoAllowSkills`、`strictInlineEval` のない interpreter allowlist）: host-exec のガードレールは、まだ意図どおり機能しているか？
  - `security="full"` は広い態勢に対する警告であり、バグの証明ではありません。これは信頼されたパーソナルアシスタント構成向けに選ばれたデフォルトです。脅威モデル上、承認や allowlist のガードレールが必要な場合にのみ厳格化してください。
- **ネットワーク露出**（Gateway の bind/auth、Tailscale Serve/Funnel、弱い/短い認証トークン）。
- **browser control の露出**（remote node、relay port、remote CDP endpoint）。
- **ローカルディスク衛生**（権限、symlink、config include、「同期フォルダ」パス）。
- **Plugin**（明示的な allowlist なしで Plugin が読み込まれる）。
- **policy のドリフト/設定ミス**（sandbox docker 設定はあるが sandbox mode はオフ、`gateway.nodes.denyCommands` パターンが無効なのは一致が完全な command 名のみ（たとえば `system.run`）で shell テキストを検査しないため、危険な `gateway.nodes.allowCommands` エントリ、グローバルの `tools.profile="minimal"` が agent 単位 profile で上書きされる、Plugin が所有する tool が緩い tool policy で到達可能）。
- **runtime 期待値のドリフト**（たとえば、`tools.exec.host` のデフォルトが `auto` になったのに暗黙の exec がまだ `sandbox` を意味すると想定している、または sandbox mode がオフなのに `tools.exec.host="sandbox"` を明示設定している）。
- **モデル衛生**（設定されたモデルがレガシーに見える場合は警告するが、ハードブロックではない）。

`--deep` を実行すると、OpenClaw はベストエフォートで live Gateway probe も試みます。

## 認証情報ストレージマップ

アクセスを監査するときや、何をバックアップするか決めるときに使用してください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）
- **Discord bot token**: config/env または SecretRef（env/file/exec provider）
- **Slack token**: config/env（`channels.slack.*`）
- **Pairing allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証 profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベース secret payload（オプション）**: `~/.openclaw/secrets.json`
- **レガシー OAuth import**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査が検出事項を出力したら、次の優先順で対応してください。

1. **「open」かつ tool 有効なもの**: まず DM/group をロックダウンし（pairing/allowlist）、次に tool policy/sandbox 化を厳格化する。
2. **公開ネットワーク露出**（LAN bind、Funnel、auth なし）: 直ちに修正する。
3. **browser control の remote 露出**: オペレーターアクセス同様に扱う（tailnet 限定、Node は意図的にペアリングし、公開露出は避ける）。
4. **権限**: state/config/credentials/auth が group/world readable でないことを確認する。
5. **Plugin**: 明示的に信頼するものだけを読み込む。
6. **モデル選択**: tool を持つ bot には、最新の instruction-hardening されたモデルを優先する。

## セキュリティ監査用語集

実運用で特によく見かける高シグナルな `checkId` 値（網羅的ではありません）:

| `checkId`                                                     | 重大度        | 重要な理由                                                                             | 主な修正キー/パス                                                                                        | 自動修正 |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | 他のユーザー/プロセスが OpenClaw の状態全体を変更できる                               | `~/.openclaw` の filesystem 権限                                                                          | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | 同じ group のユーザーが OpenClaw の状態全体を変更できる                               | `~/.openclaw` の filesystem 権限                                                                          | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | state dir を他者が読み取れる                                                           | `~/.openclaw` の filesystem 権限                                                                          | yes      |
| `fs.state_dir.symlink`                                        | warn          | state dir のターゲットが別の信頼境界になる                                             | state dir の filesystem レイアウト                                                                        | no       |
| `fs.config.perms_writable`                                    | critical      | 他者が auth/tool policy/config を変更できる                                            | `~/.openclaw/openclaw.json` の filesystem 権限                                                           | yes      |
| `fs.config.symlink`                                           | warn          | config のターゲットが別の信頼境界になる                                                | config ファイルの filesystem レイアウト                                                                   | no       |
| `fs.config.perms_group_readable`                              | warn          | 同じ group のユーザーが config の token/設定を読み取れる                               | config ファイルの filesystem 権限                                                                         | yes      |
| `fs.config.perms_world_readable`                              | critical      | config から token/設定が露出する可能性がある                                           | config ファイルの filesystem 権限                                                                         | yes      |
| `fs.config_include.perms_writable`                            | critical      | config include ファイルを他者が変更できる                                              | `openclaw.json` から参照される include ファイルの権限                                                    | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | 同じ group のユーザーが include された secret/設定を読み取れる                         | `openclaw.json` から参照される include ファイルの権限                                                    | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | include された secret/設定が world-readable である                                     | `openclaw.json` から参照される include ファイルの権限                                                    | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | 他者が保存済みモデル認証情報を注入または置換できる                                     | `agents/<agentId>/agent/auth-profiles.json` の権限                                                       | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | 他者が API key や OAuth token を読み取れる                                             | `agents/<agentId>/agent/auth-profiles.json` の権限                                                       | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | 他者が channel の pairing/認証情報 state を変更できる                                  | `~/.openclaw/credentials` の filesystem 権限                                                             | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | 他者が channel の認証情報 state を読み取れる                                           | `~/.openclaw/credentials` の filesystem 権限                                                             | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | 他者が session transcript/metadata を読み取れる                                        | session store の権限                                                                                     | yes      |
| `fs.log_file.perms_readable`                                  | warn          | 他者が、redact 済みだが依然として機微なログを読み取れる                                | Gateway ログファイルの権限                                                                               | yes      |
| `fs.synced_dir`                                               | warn          | iCloud/Dropbox/Drive 上の state/config により token/transcript の露出範囲が広がる      | config/state を同期フォルダ外へ移動する                                                                  | no       |
| `gateway.bind_no_auth`                                        | critical      | 共有 secret なしでリモート bind されている                                             | `gateway.bind`、`gateway.auth.*`                                                                         | no       |
| `gateway.loopback_no_auth`                                    | critical      | リバースプロキシ越しの loopback が無認証になる可能性がある                             | `gateway.auth.*`、proxy 設定                                                                             | no       |
| `gateway.trusted_proxies_missing`                             | warn          | リバースプロキシのヘッダーは存在するが信頼されていない                                 | `gateway.trustedProxies`                                                                                 | no       |
| `gateway.http.no_auth`                                        | warn/critical | `auth.mode="none"` で Gateway HTTP API に到達できる                                    | `gateway.auth.mode`、`gateway.http.endpoints.*`                                                          | no       |
| `gateway.http.session_key_override_enabled`                   | info          | HTTP API 呼び出し元が `sessionKey` を上書きできる                                      | `gateway.http.allowSessionKeyOverride`                                                                   | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | HTTP API 経由で危険な tool を再有効化する                                               | `gateway.tools.allow`                                                                                    | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | 高影響の Node command（camera/screen/contacts/calendar/SMS）を有効にする               | `gateway.nodes.allowCommands`                                                                            | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | パターン風の deny エントリは shell テキストや group に一致しない                       | `gateway.nodes.denyCommands`                                                                             | no       |
| `gateway.tailscale_funnel`                                    | critical      | 公開インターネットに露出している                                                       | `gateway.tailscale.mode`                                                                                 | no       |
| `gateway.tailscale_serve`                                     | info          | Serve により tailnet への露出が有効になっている                                        | `gateway.tailscale.mode`                                                                                 | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | loopback 以外の Control UI で browser-origin allowlist が明示設定されていない          | `gateway.controlUi.allowedOrigins`                                                                       | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` により browser-origin allowlist が無効化される                  | `gateway.controlUi.allowedOrigins`                                                                       | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Host-header origin fallback を有効にすると DNS rebinding のハードニングが弱まる        | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                             | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | insecure-auth 互換トグルが有効になっている                                              | `gateway.controlUi.allowInsecureAuth`                                                                    | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | デバイス identity チェックを無効にする                                                 | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                         | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | `X-Real-IP` フォールバックを信頼すると、proxy の設定ミス経由で送信元 IP 偽装が可能になる | `gateway.allowRealIpFallback`、`gateway.trustedProxies`                                                  | no       |
| `gateway.token_too_short`                                     | warn          | 短い共有 token は総当たりされやすい                                                    | `gateway.auth.token`                                                                                     | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | 露出した auth に rate limit がないと総当たりリスクが高まる                             | `gateway.auth.rateLimit`                                                                                 | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | proxy identity が auth 境界になる                                                      | `gateway.auth.mode="trusted-proxy"`                                                                      | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy auth なのに trusted proxy IP がないのは危険                              | `gateway.trustedProxies`                                                                                 | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy auth がユーザー identity を安全に解決できない                            | `gateway.auth.trustedProxy.userHeader`                                                                   | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy auth が認証済みの任意の上流ユーザーを受け入れる                           | `gateway.auth.trustedProxy.allowUsers`                                                                   | no       |
| `checkId`                                                     | 重大度        | 重要な理由                                                                             | 主な修正キー/パス                                                                                        | 自動修正 |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | Deep probe がこのコマンド経路で auth SecretRef を解決できなかった                     | deep-probe の auth ソース / SecretRef の可用性                                                           | no       |
| `gateway.probe_failed`                                        | warn/critical | live Gateway probe が失敗した                                                          | Gateway の到達性/auth                                                                                    | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | mDNS full mode がローカルネットワーク上に `cliPath`/`sshPort` metadata を通知する     | `discovery.mdns.mode`、`gateway.bind`                                                                    | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | insecure/dangerous なデバッグフラグがいずれか有効になっている                          | 複数キー（finding detail を参照）                                                                        | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | Gateway password が config に直接保存されている                                        | `gateway.auth.password`                                                                                  | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | Hook bearer token が config に直接保存されている                                       | `hooks.token`                                                                                            | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | Hook の ingress token が Gateway auth の解除にも使えてしまう                           | `hooks.token`、`gateway.auth.token`                                                                      | no       |
| `hooks.token_too_short`                                       | warn          | Hook ingress で総当たりされやすい                                                      | `hooks.token`                                                                                            | no       |
| `hooks.default_session_key_unset`                             | warn          | Hook agent の実行が、リクエストごとに生成される session へ fan out する                | `hooks.defaultSessionKey`                                                                                | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | 認証済み Hook 呼び出し元が設定済みの任意の agent にルーティングできる                  | `hooks.allowedAgentIds`                                                                                  | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | 外部呼び出し元が `sessionKey` を選べる                                                 | `hooks.allowRequestSessionKey`                                                                           | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | 外部 session key の形式に制約がない                                                    | `hooks.allowedSessionKeyPrefixes`                                                                        | no       |
| `hooks.path_root`                                             | critical      | Hook path が `/` であり、ingress が衝突または誤ルーティングしやすい                     | `hooks.path`                                                                                             | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Hook install record が不変の npm spec に pin されていない                              | Hook install metadata                                                                                    | no       |
| `hooks.installs_missing_integrity`                            | warn          | Hook install record に integrity metadata がない                                       | Hook install metadata                                                                                    | no       |
| `hooks.installs_version_drift`                                | warn          | Hook install record がインストール済み package とずれている                            | Hook install metadata                                                                                    | no       |
| `logging.redact_off`                                          | warn          | 機微な値が log/status に漏れる                                                          | `logging.redactSensitive`                                                                                | yes      |
| `browser.control_invalid_config`                              | warn          | browser control config が runtime 前の時点で無効である                                 | `browser.*`                                                                                              | no       |
| `browser.control_no_auth`                                     | critical      | browser control が token/password auth なしで公開されている                            | `gateway.auth.*`                                                                                         | no       |
| `browser.remote_cdp_http`                                     | warn          | プレーン HTTP 上の remote CDP には転送時暗号化がない                                    | browser profile の `cdpUrl`                                                                              | no       |
| `browser.remote_cdp_private_host`                             | warn          | remote CDP がプライベート/内部ホストを対象にしている                                   | browser profile の `cdpUrl`、`browser.ssrfPolicy.*`                                                      | no       |
| `sandbox.docker_config_mode_off`                              | warn          | Sandbox Docker config は存在するがアクティブではない                                   | `agents.*.sandbox.mode`                                                                                  | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | 相対 bind mount は予測不能に解決されることがある                                       | `agents.*.sandbox.docker.binds[]`                                                                        | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | Sandbox bind mount が、ブロック対象の system・credential・Docker socket パスを指す      | `agents.*.sandbox.docker.binds[]`                                                                        | no       |
| `sandbox.dangerous_network_mode`                              | critical      | Sandbox Docker network が `host` または `container:*` の namespace-join mode を使う    | `agents.*.sandbox.docker.network`                                                                        | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | Sandbox seccomp profile が container 分離を弱める                                      | `agents.*.sandbox.docker.securityOpt`                                                                    | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | Sandbox AppArmor profile が container 分離を弱める                                     | `agents.*.sandbox.docker.securityOpt`                                                                    | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | Sandbox browser bridge が送信元レンジ制限なしで公開されている                           | `sandbox.browser.cdpSourceRange`                                                                         | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | 既存 browser container が loopback 以外のインターフェースで CDP を公開している         | browser sandbox container の publish 設定                                                                | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | 既存 browser container が現在の config-hash label より前のもの                         | `openclaw sandbox recreate --browser --all`                                                              | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | 既存 browser container が現在の browser config epoch より前のもの                      | `openclaw sandbox recreate --browser --all`                                                              | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` は sandbox がオフだと fail closed になる                           | `tools.exec.host`、`agents.defaults.sandbox.mode`                                                        | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | agent 単位の `exec host=sandbox` は sandbox がオフだと fail closed になる              | `agents.list[].tools.exec.host`、`agents.list[].sandbox.mode`                                            | no       |
| `tools.exec.security_full_configured`                         | warn/critical | host exec が `security="full"` で動作している                                           | `tools.exec.security`、`agents.list[].tools.exec.security`                                               | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Exec 承認が Skill bin を暗黙に信頼する                                                  | `~/.openclaw/exec-approvals.json`                                                                        | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | interpreter allowlist が、強制再承認なしで inline eval を許可する                       | `tools.exec.strictInlineEval`、`agents.list[].tools.exec.strictInlineEval`、exec approvals allowlist    | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | `safeBins` 内の interpreter/runtime bin に明示 profile がなく、exec リスクが広がる     | `tools.exec.safeBins`、`tools.exec.safeBinProfiles`、`agents.list[].tools.exec.*`                       | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | `safeBins` 内の broad-behavior tool が低リスク stdin-filter 信頼モデルを弱める         | `tools.exec.safeBins`、`agents.list[].tools.exec.safeBins`                                               | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` に変更可能または危険なディレクトリが含まれている                  | `tools.exec.safeBinTrustedDirs`、`agents.list[].tools.exec.safeBinTrustedDirs`                          | no       |
| `skills.workspace.symlink_escape`                             | warn          | workspace `skills/**/SKILL.md` が workspace ルート外を指している（symlink-chain drift） | workspace `skills/**` の filesystem 状態                                                                 | no       |
| `plugins.extensions_no_allowlist`                             | warn          | Plugin が明示的な Plugin allowlist なしでインストールされている                         | `plugins.allowlist`                                                                                      | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Plugin install record が不変の npm spec に pin されていない                            | Plugin install metadata                                                                                  | no       |
| `checkId`                                                     | 重大度        | 重要な理由                                                                             | 主な修正キー/パス                                                                                        | 自動修正 |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| `plugins.installs_missing_integrity`                          | warn          | Plugin install record に integrity metadata がない                                    | Plugin install metadata                                                                                  | no       |
| `plugins.installs_version_drift`                              | warn          | Plugin install record がインストール済み package とずれている                         | Plugin install metadata                                                                                  | no       |
| `plugins.code_safety`                                         | warn/critical | Plugin のコードスキャンで疑わしい、または危険なパターンが見つかった                   | Plugin コード / インストール元                                                                           | no       |
| `plugins.code_safety.entry_path`                              | warn          | Plugin のエントリパスが隠し場所または `node_modules` 配下を指している                 | Plugin manifest の `entry`                                                                               | no       |
| `plugins.code_safety.entry_escape`                            | critical      | Plugin のエントリが Plugin ディレクトリ外へエスケープしている                         | Plugin manifest の `entry`                                                                               | no       |
| `plugins.code_safety.scan_failed`                             | warn          | Plugin のコードスキャンを完了できなかった                                             | Plugin パス / スキャン環境                                                                               | no       |
| `skills.code_safety`                                          | warn/critical | Skill インストーラ metadata/コードに疑わしい、または危険なパターンが含まれている      | Skill のインストール元                                                                                   | no       |
| `skills.code_safety.scan_failed`                              | warn          | Skill のコードスキャンを完了できなかった                                              | Skill スキャン環境                                                                                       | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | 共有/公開ルームから exec 有効 agent に到達できる                                      | `channels.*.dmPolicy`、`channels.*.groupPolicy`、`tools.exec.*`、`agents.list[].tools.exec.*`           | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | open グループ + elevated tool が高影響なプロンプトインジェクション経路を作る          | `channels.*.groupPolicy`、`tools.elevated.*`                                                             | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | open グループから sandbox/workspace ガードなしで command/file tool に到達できる       | `channels.*.groupPolicy`、`tools.profile/deny`、`tools.fs.workspaceOnly`、`agents.*.sandbox.mode`       | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | Gateway の信頼モデルはパーソナルアシスタントなのに config がマルチユーザーに見える    | 信頼境界の分離、または共有ユーザー向けハードニング（`sandbox.mode`、tool deny/workspace スコープ設定） | no       |
| `tools.profile_minimal_overridden`                            | warn          | agent の上書きがグローバル minimal profile を回避している                             | `agents.list[].tools.profile`                                                                            | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | 緩い policy のコンテキストから extension tool に到達できる                            | `tools.profile` + tool allow/deny                                                                        | no       |
| `models.legacy`                                               | warn          | レガシーなモデルファミリーがまだ設定されている                                         | モデル選択                                                                                               | no       |
| `models.weak_tier`                                            | warn          | 設定されたモデルが現在推奨される tier を下回っている                                   | モデル選択                                                                                               | no       |
| `models.small_params`                                         | critical/info | 小規模モデル + 安全でない tool 面がインジェクションリスクを高める                     | モデル選択 + sandbox/tool policy                                                                         | no       |
| `summary.attack_surface`                                      | info          | auth、channel、tool、露出態勢のロールアップ要約                                       | 複数キー（finding detail を参照）                                                                        | no       |

## HTTP 経由の Control UI

Control UI がデバイス identity を生成するには、**セキュアコンテキスト**（HTTPS または localhost）が必要です。`gateway.controlUi.allowInsecureAuth` はローカル互換性用のトグルです。

- localhost 上では、ページが非セキュアな HTTP で読み込まれた場合に、デバイス identity なしで Control UI auth を許可します。
- pairing チェックをバイパスするものではありません。
- リモート（localhost 以外）のデバイス identity 要件を緩和するものでもありません。

可能なら HTTPS（Tailscale Serve）を使うか、UI を `127.0.0.1` で開いてください。

非常時専用として、`gateway.controlUi.dangerouslyDisableDeviceAuth` はデバイス identity チェックを完全に無効化します。これは重大なセキュリティ低下です。積極的にデバッグしていてすぐに元へ戻せる場合を除き、オフのままにしてください。

これらの dangerous フラグとは別に、`gateway.auth.mode: "trusted-proxy"` が成功すると、デバイス identity なしで **operator** の Control UI セッションを許可できます。これは意図された auth-mode の動作であり、`allowInsecureAuth` の近道ではありません。また、Node ロールの Control UI セッションには引き続き適用されません。

`openclaw security audit` は、この設定が有効な場合に警告を出します。

## insecure または dangerous フラグの要約

`openclaw security audit` は、既知の insecure/dangerous なデバッグスイッチが有効になっている場合に `config.insecure_or_dangerous_flags` を含めます。現在このチェックで集約されるものは次のとおりです。

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

OpenClaw の config schema で定義されている完全な `dangerous*` / `dangerously*` config key:

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
- `channels.synology-chat.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（Plugin channel）
- `channels.zalouser.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.irc.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.mattermost.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching`（Plugin channel）
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## リバースプロキシ設定

Gateway をリバースプロキシ（nginx、Caddy、Traefik など）の背後で実行する場合は、forwarded-client IP を正しく扱うために `gateway.trustedProxies` を設定してください。

Gateway が、`trustedProxies` に**含まれていない**アドレスからの proxy header を検出した場合、その接続はローカルクライアントとして**扱われません**。Gateway auth が無効なら、その接続は拒否されます。これにより、プロキシ経由接続が localhost 由来に見えて自動的に信頼されることで起こりうる認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、この auth mode はさらに厳格です。

- trusted-proxy auth は **loopback 送信元プロキシでは fail closed** します
- 同一ホストの loopback リバースプロキシでも、ローカルクライアント検出と forwarded IP 処理のために `gateway.trustedProxies` は利用できます
- 同一ホストの loopback リバースプロキシでは、`gateway.auth.mode: "trusted-proxy"` ではなく token/password auth を使用してください

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

`trustedProxies` が設定されていると、Gateway はクライアント IP の判定に `X-Forwarded-For` を使います。`X-Real-IP` は、`gateway.allowRealIpFallback: true` を明示的に設定しない限り、デフォルトでは無視されます。

適切なリバースプロキシ動作（受信した forwarding header を上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不適切なリバースプロキシ動作（信頼していない forwarding header を追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS と origin に関する注意

- OpenClaw Gateway は local/loopback 優先です。TLS をリバースプロキシで終端する場合は、そのプロキシ側の HTTPS ドメインで HSTS を設定してください。
- Gateway 自身が HTTPS を終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClaw のレスポンスから HSTS header を出せます。
- 詳細なデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- loopback 以外の Control UI デプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必要です。
- `gateway.controlUi.allowedOrigins: ["*"]` は browser-origin を全面許可する明示的な policy であり、強化されたデフォルトではありません。厳密に管理されたローカルテスト以外では避けてください。
- 一般的な loopback 例外が有効な場合でも、loopback 上の browser-origin auth 失敗には引き続き rate limit が適用されますが、lockout key は共有 localhost バケット 1 つではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header origin fallback mode を有効にします。危険で、オペレーターが選択した policy として扱ってください。
- DNS rebinding と proxy の Host header 挙動は、デプロイのハードニング課題として扱ってください。`trustedProxies` は厳しく絞り、Gateway を公開インターネットへ直接露出しないでください。

## ローカルの session log はディスク上に保存される

OpenClaw は session transcript を `~/.openclaw/agents/<agentId>/sessions/*.jsonl` にディスク保存します。  
これは session の継続性と（オプションで）session memory indexing のために必要ですが、同時に **filesystem アクセスを持つ任意の process/user がそれらの log を読める** ことも意味します。信頼境界はディスクアクセスだと考え、`~/.openclaw` の権限を厳しくしてください（下記の audit セクションを参照）。agent 間でより強い分離が必要なら、別々の OS ユーザーまたは別々のホストで実行してください。

## Node 実行（system.run）

macOS Node がペアリングされている場合、Gateway はその Node 上で `system.run` を呼び出せます。これはその Mac 上での **リモートコード実行** です。

- Node pairing（承認 + token）が必要です。
- Gateway の Node pairing は command 単位の承認面ではありません。これは Node の identity/信頼と token 発行を確立するものです。
- Gateway は `gateway.nodes.allowCommands` / `denyCommands` によって粗いグローバル Node command policy を適用します。
- Mac 側では **Settings → Exec approvals**（security + ask + allowlist）で制御されます。
- Node 単位の `system.run` policy は、その Node 自身の exec approvals ファイル（`exec.approvals.node.*`）であり、Gateway のグローバル command-ID policy より厳しいことも緩いこともあります。
- `security="full"` かつ `ask="off"` で動作する Node は、デフォルトの信頼されたオペレーターモデルに従っています。デプロイでより厳しい承認または allowlist 方針を明示的に必要としていない限り、これは想定どおりの挙動として扱ってください。
- 承認モードは、正確な要求コンテキストと、可能な場合は 1 つの具体的なローカル script/file オペランドに bind されます。interpreter/runtime command に対して OpenClaw が正確に 1 つの直接ローカルファイルを特定できない場合、完全な意味的カバレッジを約束する代わりに、承認ベースの実行は拒否されます。
- `host=node` では、承認ベース実行は準備済みの正規化 `systemRunPlan` も保存します。後続の承認済み転送ではその保存済み plan が再利用され、承認要求作成後の command/cwd/session context に対する呼び出し元の編集は Gateway 検証で拒否されます。
- リモート実行を望まない場合は、security を **deny** に設定し、その Mac の Node pairing を削除してください。

この区別はトリアージで重要です。

- 再接続したペアリング済み Node が異なる command list を通知してきても、それ自体は脆弱性ではありません。実際の実行境界を Gateway のグローバル policy と Node のローカル exec approvals が依然として強制しているなら問題ありません。
- Node pairing metadata を、隠れた第 2 の command 単位承認層として扱う報告は、通常は policy/UX の混乱であり、セキュリティ境界バイパスではありません。

## 動的 Skills（watcher / remote node）

OpenClaw は session の途中で Skills 一覧を更新できます。

- **Skills watcher**: `SKILL.md` への変更は、次の agent turn で Skills スナップショットを更新することがあります。
- **Remote node**: macOS Node を接続すると、macOS 専用 Skills が対象になることがあります（bin probing に基づく）。

Skill フォルダは **信頼されたコード** として扱い、誰が変更できるかを制限してください。

## 脅威モデル

あなたの AI アシスタントは次のことができます。

- 任意の shell command を実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- 誰にでもメッセージを送る（WhatsApp アクセスを与えていれば）

あなたにメッセージを送る人は次のことができます。

- AI をだまして悪いことをさせようとする
- あなたのデータへのアクセスをソーシャルエンジニアリングで狙う
- インフラの詳細を探ろうとする

## 中核概念: intelligence より前にアクセス制御

ここでの失敗の多くは高度な exploit ではありません。単に「誰かが bot にメッセージし、bot が頼まれたことをやった」というものです。

OpenClaw の立場:

- **Identity first:** 誰が bot と会話できるかを決める（DM pairing / allowlist / 明示的な `open`）
- **Scope next:** bot がどこで動作を許可されるかを決める（group allowlist + mention gating、tool、sandbox 化、device 権限）
- **Model last:** モデルは操作されうるものと仮定し、その操作の blast radius が限定されるよう設計する

## コマンド認可モデル

スラッシュコマンドと directive は、**認可された送信者** に対してのみ処理されます。認可は channel allowlist/pairing と `commands.useAccessGroups` から導出されます（[Configuration](/ja-JP/gateway/configuration) および [Slash commands](/ja-JP/tools/slash-commands) を参照）。channel allowlist が空、または `"*"` を含む場合、その channel の command は実質的に open です。

`/exec` は認可された operator のための session 専用の便利機能です。config を書き換えたり、他の session を変更したりは**しません**。

## control plane tool のリスク

永続的な control plane 変更を行える組み込み tool は 2 つあります。

- `gateway` は `config.schema.lookup` / `config.get` で config を調べられ、`config.apply`、`config.patch`、`update.run` で永続的変更を行えます。
- `cron` は、元の chat/task が終わった後も実行され続けるスケジュールジョブを作成できます。

owner-only の `gateway` runtime tool は、`tools.exec.ask` や `tools.exec.security` の書き換えを引き続き拒否します。レガシーな `tools.bash.*` alias は、書き込み前に同じ保護された exec path に正規化されます。

信頼していないコンテンツを扱う agent/面では、これらをデフォルトで拒否してください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` は restart action をブロックするだけです。`gateway` の config/update action は無効にしません。

## Plugin

Plugin は Gateway **プロセス内**で実行されます。信頼されたコードとして扱ってください:

- 信頼できるソースからのみ Plugin をインストールしてください。
- 明示的な `plugins.allow` allowlist を推奨します。
- 有効化する前に Plugin の config を確認してください。
- Plugin 変更後は Gateway を再起動してください。
- Plugin をインストールまたは更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、信頼していないコードを実行するのと同じように扱ってください。
  - インストール先は、アクティブな Plugin インストールルート配下の Plugin ごとのディレクトリです。
  - OpenClaw はインストール/更新前に組み込みの危険コードスキャンを実行します。`critical` の検出結果はデフォルトでブロックされます。
  - OpenClaw は `npm pack` を使用し、そのディレクトリで `npm install --omit=dev` を実行します（npm lifecycle script はインストール中にコードを実行できます）。
  - 固定された厳密な version（`@scope/pkg@1.2.3`）を推奨し、有効化前にディスク上へ展開されたコードを確認してください。
  - `--dangerously-force-unsafe-install` は、Plugin のインストール/更新フローにおける組み込みスキャンの false positive に対する非常用手段です。Plugin の `before_install` hook policy ブロックは回避せず、スキャン失敗も回避しません。
  - Gateway バックの Skill 依存関係インストールも同じ dangerous/suspicious 分離に従います。組み込みの `critical` 検出結果は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を設定しない限りブロックされます。一方、suspicious な検出結果は警告のみです。`openclaw skills install` は、引き続き別の ClawHub Skill ダウンロード/インストールフローです。

詳細: [Plugins](/ja-JP/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## DM アクセスモデル（pairing / allowlist / open / disabled）

現在のすべての DM 対応 channel は、メッセージが処理される**前**に受信 DM を制御する DM policy（`dmPolicy` または `*.dm.policy`）をサポートします。

- `pairing`（デフォルト）: 未知の送信者には短い pairing code が返され、承認されるまで bot はそのメッセージを無視します。code は 1 時間で期限切れになります。同じ送信者が DM を繰り返しても、新しいリクエストが作成されるまでは code は再送されません。保留中リクエストはデフォルトで **channel ごとに 3 件** に制限されます。
- `allowlist`: 未知の送信者はブロックされます（pairing handshake なし）。
- `open`: 誰でも DM できます（公開）。channel allowlist に `"*"` を含めることが**必須**です（明示的オプトイン）。
- `disabled`: 受信 DM を完全に無視します。

CLI で承認する:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上のファイル: [Pairing](/ja-JP/channels/pairing)

## DM セッション分離（マルチユーザーモード）

デフォルトでは、OpenClaw は **すべての DM を main session にルーティング** するため、アシスタントはデバイスや channel をまたいで継続性を持ちます。**複数人** が bot に DM できる場合（open DM または複数人 allowlist）、DM session を分離することを検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、グループチャットを分離したまま、ユーザー間のコンテキスト漏洩を防げます。

これはメッセージングコンテキスト境界であり、ホスト管理者境界ではありません。ユーザー同士が相互に敵対的で、同じ Gateway ホスト/config を共有している場合は、信頼境界ごとに別々の Gateway を実行してください。

### セキュア DM モード（推奨）

上記のスニペットを **セキュア DM モード** として扱ってください。

- デフォルト: `session.dmScope: "main"`（すべての DM が継続性のために 1 つの session を共有）
- ローカル CLI オンボーディングのデフォルト: 未設定時に `session.dmScope: "per-channel-peer"` を書き込む（既存の明示値は保持）
- セキュア DM モード: `session.dmScope: "per-channel-peer"`（各 channel+送信者ペアが分離された DM コンテキストを持つ）
- channel をまたぐ peer 分離: `session.dmScope: "per-peer"`（同じ type のすべての channel をまたいで送信者ごとに 1 session）

同じ channel 上で複数アカウントを運用する場合は、代わりに `per-account-channel-peer` を使ってください。同じ人が複数の channel から連絡してくる場合は、`session.identityLinks` を使ってそれらの DM session を 1 つの canonical identity に統合できます。[Session Management](/ja-JP/concepts/session) と [Configuration](/ja-JP/gateway/configuration) を参照してください。

## allowlist（DM + グループ）- 用語

OpenClaw には、「誰が自分をトリガーできるか」に関する 2 つの別々のレイヤーがあります。

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; レガシー: `channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）: ダイレクトメッセージで bot と会話できる相手。
  - `dmPolicy="pairing"` の場合、承認は `~/.openclaw/credentials/` 配下のアカウントスコープ付き pairing allowlist ストア（デフォルトアカウントは `<channel>-allowFrom.json`、デフォルト以外は `<channel>-<accountId>-allowFrom.json`）に書き込まれ、config allowlist とマージされます。
- **グループ allowlist**（channel 固有）: bot がそもそもどのグループ/channel/guild からのメッセージを受け入れるか。
  - よくあるパターン:
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`: `requireMention` などのグループ単位デフォルト。これが設定されると、グループ allowlist としても機能します（全許可を維持するには `"*"` を含めます）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: グループ session **内** で誰が bot をトリガーできるかを制限します（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: 面ごとの allowlist + mention デフォルト。
  - グループチェックの順序は、最初に `groupPolicy`/グループ allowlist、次に mention/reply activation です。
  - bot メッセージへの返信（暗黙のメンション）は、`groupAllowFrom` のような送信者 allowlist をバイパスしません。
  - **セキュリティ注意:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。これらの使用は最小限にすべきです。ルームの全メンバーを完全に信頼している場合を除き、pairing + allowlist を優先してください。

詳細: [Configuration](/ja-JP/gateway/configuration) および [Groups](/ja-JP/channels/groups)

## プロンプトインジェクション（何か、なぜ重要か）

プロンプトインジェクションとは、攻撃者がモデルを操作して危険なことをさせるようにメッセージを細工することです（「指示を無視しろ」「filesystem を全部吐き出せ」「このリンクを開いて command を実行しろ」など）。

強い system prompt があっても、**プロンプトインジェクションは未解決です**。system prompt のガードレールはソフトな指針にすぎず、ハードな強制は tool policy、exec 承認、sandbox 化、channel allowlist によって行われます（しかもオペレーターは設計上これらを無効にできます）。実運用で役立つこと:

- 受信 DM は lock down する（pairing/allowlist）。
- グループでは mention gating を優先し、公開ルームでの「常時応答」bot は避ける。
- リンク、添付、貼り付けられた指示はデフォルトで敵対的として扱う。
- 機微な tool 実行は sandbox 内で行い、secret は agent から到達可能な filesystem に置かない。
- 注意: sandbox 化はオプトインです。sandbox mode がオフの場合、暗黙の `host=auto` は Gateway ホストに解決されます。明示的な `host=sandbox` は、利用可能な sandbox runtime がないため引き続き fail closed します。その動作を config 上でも明示したい場合は `host=gateway` を設定してください。
- 高リスク tool（`exec`、`browser`、`web_fetch`、`web_search`）は、信頼された agent または明示的 allowlist に限定する。
- interpreter（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）を allowlist する場合は、inline eval 形式にも明示承認が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- shell 承認解析は、**引用されていない heredoc** 内の POSIX parameter-expansion 形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`）も拒否します。これにより、allowlist された heredoc body が、allowlist レビューを平文としてすり抜けて shell 展開を忍び込ませることを防ぎます。リテラルな body セマンティクスを選ぶには、heredoc terminator を引用してください（たとえば `<<'EOF'`）。変数展開が起きるはずだった引用なし heredoc は拒否されます。
- **モデル選択は重要です:** 古い/小さい/レガシーなモデルは、プロンプトインジェクションや tool 誤用に対して大幅に脆弱です。tool 有効 agent には、利用可能な中で最も強力な最新世代の instruction-hardening 済みモデルを使ってください。

信頼していないものとして扱うべき危険信号:

- 「このファイル/URL を読んで、その指示どおりに実行しろ」
- 「system prompt や安全ルールを無視しろ」
- 「隠れた指示や tool 出力を明かせ」
- 「`~/.openclaw` や log の中身を全部貼れ」

## 外部コンテンツの special-token サニタイズ

OpenClaw は、ラップされた外部コンテンツや metadata がモデルに届く前に、一般的なセルフホスト LLM の chat-template special-token リテラルを除去します。対象となる marker ファミリーには、Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS の role/turn token が含まれます。

理由:

- セルフホストモデルを前段に持つ OpenAI 互換 backend は、ユーザーテキスト中の special token をマスクせずそのまま保持してしまうことがあります。受信した外部コンテンツ（取得したページ、メール本文、ファイル内容 tool の出力）に書き込める攻撃者は、そうでなければ合成の `assistant` や `system` の role 境界を注入し、ラップ済みコンテンツのガードレールを突破できてしまいます。
- サニタイズは外部コンテンツのラッピングレイヤーで行われるため、provider ごとではなく、fetch/read tool や受信 channel コンテンツ全体に一貫して適用されます。
- 送信されるモデル応答には、`<tool_call>`、`<function_calls>`、その他類似の足場情報がユーザー向け返信に漏れるのを除去する別のサニタイザがすでにあります。外部コンテンツサニタイザはその受信側に相当します。

これはこのページの他のハードニングを置き換えるものではありません。主な役割は依然として `dmPolicy`、allowlist、exec 承認、sandbox 化、`contextVisibility` が担います。これは、special token を含んだままユーザーテキストを転送するセルフホストスタックに対する、tokenizer レイヤーの特定のバイパスを塞ぐものです。

## unsafe external content バイパスフラグ

OpenClaw には、外部コンテンツの安全ラッピングを無効にする明示的なバイパスフラグがあります。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

ガイダンス:

- 本番では未設定/false のままにしてください。
- 厳密に範囲を限定したデバッグのために一時的にのみ有効にしてください。
- 有効にする場合は、その agent を分離してください（sandbox + 最小限 tool + 専用 session namespace）。

Hook のリスクに関する注意:

- delivery が自分で管理しているシステムから来ていても、Hook payload は信頼していないコンテンツです（mail/docs/web コンテンツはプロンプトインジェクションを含みえます）。
- 弱いモデル tier はこのリスクを高めます。Hook 駆動の自動化では、強力な最新モデル tier を優先し、tool policy は厳格に保ってください（`tools.profile: "messaging"` またはそれ以上に厳格）。可能なら sandbox 化も行ってください。

### プロンプトインジェクションは公開 DM を必要としない

たとえ **自分だけ** が bot にメッセージできる場合でも、bot が読む **信頼していないコンテンツ**（web search/fetch の結果、browser ページ、メール、ドキュメント、添付ファイル、貼り付けられた log/code）を通じてプロンプトインジェクションは起こりえます。言い換えると、脅威面は送信者だけではなく、**コンテンツそのもの** も敵対的な指示を運びえます。

tool が有効な場合、典型的なリスクはコンテキスト流出または tool 呼び出しの誘発です。blast radius を減らすには:

- 信頼していないコンテンツを要約するために、読み取り専用または tool 無効の **reader agent** を使い、その要約だけを main agent に渡す。
- 必要ない限り、tool 有効 agent では `web_search` / `web_fetch` / `browser` をオフにする。
- OpenResponses の URL 入力（`input_file` / `input_image`）では、`gateway.http.endpoints.responses.files.urlAllowlist` と `gateway.http.endpoints.responses.images.urlAllowlist` を厳しく設定し、`maxUrlParts` は低く保つ。空の allowlist は未設定として扱われるため、URL 取得を完全に無効にしたい場合は `files.allowUrl: false` / `images.allowUrl: false` を使用してください。
- OpenResponses のファイル入力では、デコード済みの `input_file` テキストも依然として **信頼していない外部コンテンツ** として注入されます。Gateway がローカルでデコードしたからといって、そのファイルテキストを信頼できるものとみなさないでください。注入されるブロックには、長い `SECURITY NOTICE:` バナーが省略される経路であっても、明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界 marker と `Source: External` metadata が引き続き付きます。
- 同じ marker ベースのラッピングは、media-understanding が添付ドキュメントからテキストを抽出して media prompt に追加する場合にも適用されます。
- 信頼していない入力に触れる agent には sandbox 化と厳格な tool allowlist を有効にする。
- secret は prompt に入れず、Gateway ホスト上の env/config 経由で渡す。

### セルフホスト LLM backend

OpenAI 互換のセルフホスト backend（vLLM、SGLang、TGI、LM Studio、またはカスタム Hugging Face tokenizer stack など）は、hosted provider と比べて、chat-template special token の扱いが異なることがあります。backend が `<|im_start|>`、`<|start_header_id|>`、`<start_of_turn>` のようなリテラル文字列を、ユーザーコンテンツ内でも構造的な chat-template token として tokenize する場合、信頼していないテキストが tokenizer レイヤーで role 境界を偽造しようとする可能性があります。

OpenClaw は、モデルに送る前に、ラップされた外部コンテンツから一般的なモデルファミリーの special-token リテラルを除去します。外部コンテンツのラッピングは有効のまま維持し、可能なら、ユーザー提供コンテンツ内の special token を分割またはエスケープする backend 設定を優先してください。OpenAI や Anthropic のような hosted provider は、すでに独自のリクエスト側サニタイズを適用しています。

### モデル強度（セキュリティ注意）

プロンプトインジェクション耐性は、モデル tier 間で**均一ではありません**。一般に、小さくて安価なモデルほど、特に敵対的なプロンプト下で、tool の誤用や指示乗っ取りに弱い傾向があります。

<Warning>
tool が有効な agent や、信頼していないコンテンツを読む agent では、古い/小さいモデルによるプロンプトインジェクションリスクはしばしば高すぎます。そうしたワークロードを弱いモデル tier で実行しないでください。
</Warning>

推奨事項:

- tool を実行できる、またはファイル/ネットワークに触れられる bot には、**最新世代かつ最上位 tier のモデル** を使用する。
- tool 有効 agent や信頼していない inbox には、**古い/弱い/小さい tier を使わない**。プロンプトインジェクションリスクが高すぎる。
- やむを得ず小さいモデルを使う場合は、**blast radius を縮小する**（読み取り専用 tool、強力な sandbox 化、最小限の filesystem アクセス、厳格な allowlist）。
- 小さいモデルを動かすときは、**すべての session で sandbox 化を有効にし**、入力が厳密に制御されていない限り **web_search/web_fetch/browser を無効にする**。
- trusted input で tool を使わない chat 専用のパーソナルアシスタントであれば、小さいモデルでも通常は問題ありません。

<a id="reasoning-verbose-output-in-groups"></a>

## グループでの reasoning と verbose 出力

`/reasoning`、`/verbose`、`/trace` は、公開 channel に向いていない内部 reasoning、tool 出力、または Plugin 診断情報を露出させる可能性があります。グループ設定では、これらは **デバッグ専用** として扱い、明示的に必要な場合を除いてオフにしてください。

ガイダンス:

- 公開ルームでは `/reasoning`、`/verbose`、`/trace` を無効のままにする。
- 有効にする場合は、信頼された DM または厳密に制御されたルームでのみ行う。
- verbose と trace の出力には、tool 引数、URL、Plugin 診断、モデルが見たデータが含まれうることを忘れないでください。

## 設定のハードニング（例）

### 0) ファイル権限

Gateway ホスト上の config と state は非公開に保ってください。

- `~/.openclaw/openclaw.json`: `600`（ユーザーの読み書きのみ）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` はこれらの権限を警告し、厳格化を提案できます。

### 0.4) ネットワーク露出（bind + port + firewall）

Gateway は **WebSocket + HTTP** を単一ポートで多重化します。

- デフォルト: `18789`
- config/flag/env: `gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

この HTTP 面には Control UI と canvas host が含まれます。

- Control UI（SPA asset）（デフォルト base path `/`）
- Canvas host: `/__openclaw__/canvas/` および `/__openclaw__/a2ui/`（任意の HTML/JS。信頼していないコンテンツとして扱う）

canvas コンテンツを通常の browser で読み込む場合は、他の信頼していない web ページと同様に扱ってください。

- canvas host を信頼していないネットワーク/ユーザーに露出しない。
- 影響を完全に理解していない限り、canvas コンテンツを特権的な web 面と同じ origin にしない。

bind mode は Gateway がどこで listen するかを制御します。

- `gateway.bind: "loopback"`（デフォルト）: ローカルクライアントのみ接続可能
- loopback 以外の bind（`"lan"`、`"tailnet"`、`"custom"`）は攻撃面を広げます。これらを使うのは、Gateway auth（共有 token/password または正しく構成された loopback 以外の trusted proxy）と実際の firewall がある場合だけにしてください。

経験則:

- LAN bind より Tailscale Serve を優先する（Serve は Gateway を loopback のまま保ち、アクセス制御は Tailscale が担う）
- どうしても LAN に bind する必要がある場合は、port を厳密な送信元 IP allowlist で firewall し、広く port-forward しない
- `0.0.0.0` へ認証なしで Gateway を公開してはならない

### 0.4.1) Docker の port 公開 + UFW（`DOCKER-USER`）

VPS 上で Docker とともに OpenClaw を実行する場合、公開された container port（`-p HOST:CONTAINER` や Compose の `ports:`）は、ホストの `INPUT` ルールだけではなく Docker の forwarding chain を通ることに注意してください。

Docker トラフィックを firewall policy に合わせるには、`DOCKER-USER` にルールを適用してください（この chain は Docker 自身の accept ルールより前に評価されます）。多くの最近の distro では、`iptables`/`ip6tables` は `iptables-nft` frontend を使っており、それでもこれらのルールは nftables backend に適用されます。

最小限の allowlist 例（IPv4）:

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

IPv6 には別の table があります。Docker IPv6 が有効なら、`/etc/ufw/after6.rules` に対応する policy も追加してください。

ドキュメント例で `eth0` のようなインターフェース名をハードコードするのは避けてください。インターフェース名は VPS image ごとに異なり（`ens3`、`enp*` など）、不一致があると deny ルールが意図せずスキップされることがあります。

reload 後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

外部から見える想定ポートは、意図的に公開したものだけであるべきです（ほとんどの構成では SSH + リバースプロキシの port）。

### 0.4.2) mDNS/Bonjour discovery（情報漏えい）

Gateway はローカルデバイス discovery のために mDNS（5353 番ポートの `_openclaw-gw._tcp`）で存在をブロードキャストします。full mode では、運用上の詳細を露出しうる TXT record が含まれます。

- `cliPath`: CLI binary への完全な filesystem パス（ユーザー名とインストール場所が分かる）
- `sshPort`: ホストで SSH が利用可能であることを通知する
- `displayName`、`lanHost`: hostname 情報

**運用セキュリティ上の考慮:** インフラ詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても reconnaissance が容易になります。filesystem パスや SSH 可用性のような「無害そうな」情報でも、攻撃者の環境把握を助けます。

**推奨事項:**

1. **minimal mode**（デフォルト、露出する Gateway に推奨）: mDNS ブロードキャストから機微なフィールドを省く

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス discovery が不要なら **完全に無効化** する

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **full mode**（オプトイン）: TXT record に `cliPath` + `sshPort` を含める

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替手段）: config を変えずに mDNS を無効化するには `OPENCLAW_DISABLE_BONJOUR=1` を設定する

minimal mode でも、Gateway はデバイス discovery に十分な情報（`role`、`gatewayPort`、`transport`）はブロードキャストしますが、`cliPath` と `sshPort` は省きます。CLI パス情報が必要なアプリは、代わりに認証済み WebSocket 接続経由で取得できます。

### 0.5) Gateway WebSocket をロックダウンする（ローカル auth）

Gateway auth はデフォルトで**必須**です。有効な Gateway auth 経路が設定されていない場合、Gateway は WebSocket 接続を拒否します（fail‑closed）。

オンボーディングはデフォルトで token を生成するため（loopback でも）、ローカルクライアントも認証が必要です。

**すべて**の WS クライアントに認証を必須化するには token を設定してください。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

doctor で生成できます: `openclaw doctor --generate-gateway-token`。

注意: `gateway.remote.token` / `.password` はクライアント側の認証情報ソースです。これら**だけ**ではローカル WS アクセスは保護されません。  
ローカル呼び出し経路では、`gateway.auth.*` が未設定の場合に限って `gateway.remote.*` をフォールバックとして使えます。  
`gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示設定され、しかも未解決なら、解決は fail closed します（remote fallback で隠されることはありません）。  
オプション: `wss://` を使う場合は `gateway.remote.tlsFingerprint` で remote TLS を pin できます。  
プレーンテキストの `ws://` はデフォルトで loopback 専用です。信頼されたプライベートネットワーク経路では、非常手段としてクライアント process に `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

ローカルデバイス pairing:

- 同一ホストクライアントをスムーズにするため、直接の local loopback 接続に対するデバイス pairing は自動承認されます。
- OpenClaw には、信頼された共有 secret ヘルパーフロー向けの、限定的な backend/container-local self-connect 経路もあります。
- 同一ホストの tailnet bind を含む tailnet および LAN 接続は remote として扱われ、引き続き承認が必要です。

auth mode:

- `gateway.auth.mode: "token"`: 共有 bearer token（ほとんどの構成に推奨）
- `gateway.auth.mode: "password"`: password auth（env 経由 `OPENCLAW_GATEWAY_PASSWORD` の設定を推奨）
- `gateway.auth.mode: "trusted-proxy"`: identity-aware なリバースプロキシがユーザーを認証し、header で identity を渡すことを信頼する（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）

ローテーションチェックリスト（token/password）:

1. 新しい secret を生成/設定する（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）
2. Gateway を再起動する（または macOS app が Gateway を supervise しているならその app を再起動する）
3. すべての remote client を更新する（Gateway を呼び出すマシン上の `gateway.remote.token` / `.password`）
4. 古い認証情報ではもう接続できないことを確認する

### 0.6) Tailscale Serve の identity header

`gateway.auth.allowTailscale` が `true`（Serve ではデフォルト）だと、OpenClaw は Control UI/WebSocket 認証のために Tailscale Serve の identity header（`tailscale-user-login`）を受け入れます。OpenClaw は、`x-forwarded-for` のアドレスをローカルの Tailscale daemon (`tailscale whois`) で解決し、それを header と照合することで identity を検証します。これは、Tailscale によって挿入された `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` を含み、かつ loopback に到達したリクエストに対してのみ発動します。  
この非同期 identity チェック経路では、同じ `{scope, ip}` に対する失敗試行は、limiter が失敗を記録する前に直列化されます。そのため、1 つの Serve client からの同時並行の不正再試行は、2 件の単純な不一致として競合するのではなく、2 回目の試行が即座に lockout されることがあります。  
HTTP API endpoint（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は Tailscale identity-header auth を**使用しません**。これらは引き続き Gateway に設定された HTTP auth mode に従います。

重要な境界に関する注意:

- Gateway HTTP bearer auth は、実質的にオールオアナッシングの operator アクセスです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼び出せる認証情報は、その Gateway に対するフルアクセス operator secret として扱ってください。
- OpenAI 互換の HTTP 面では、共有 secret の bearer auth は、agent turn に対する完全なデフォルト operator scope（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）と owner セマンティクスを復元します。より狭い `x-openclaw-scopes` 値を指定しても、この共有 secret 経路は狭まりません。
- HTTP 上でのリクエスト単位 scope セマンティクスが適用されるのは、trusted proxy auth や private ingress 上の `gateway.auth.mode="none"` のような identity-bearing mode からのリクエストだけです。
- そうした identity-bearing mode では、`x-openclaw-scopes` を省略すると通常の operator デフォルト scope セットにフォールバックします。より狭い scope セットにしたい場合は header を明示的に送ってください。
- `/tools/invoke` も同じ共有 secret ルールに従います。そこでも token/password の bearer auth は完全な operator アクセスとして扱われ、identity-bearing mode のみが宣言された scope を尊重します。
- これらの認証情報を信頼していない呼び出し元と共有しないでください。信頼境界ごとに別々の Gateway を使うことを推奨します。

**信頼前提:** token なしの Serve auth は、Gateway ホストが信頼されていることを前提としています。これを、同一ホスト上の敵対的 process に対する保護だと考えないでください。Gateway ホスト上で信頼していないローカルコードが実行されうるなら、`gateway.auth.allowTailscale` を無効にし、`gateway.auth.mode: "token"` または `"password"` による明示的な共有 secret auth を必須にしてください。

**セキュリティルール:** 自前のリバースプロキシからこれらの header を転送してはいけません。Gateway の手前で TLS を終端したりプロキシしたりする場合は、`gateway.auth.allowTailscale` を無効にし、共有 secret auth（`gateway.auth.mode: "token"` または `"password"`）か、代わりに [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を使用してください。

Trusted proxy:

- Gateway の手前で TLS を終端する場合は、`gateway.trustedProxies` にプロキシの IP を設定してください。
- OpenClaw は、それらの IP からの `x-forwarded-for`（または `x-real-ip`）を信頼し、ローカル pairing チェックや HTTP auth/local チェック用のクライアント IP 判定に使います。
- プロキシが `x-forwarded-for` を**上書き**し、Gateway port への直接アクセスをブロックすることを確認してください。

[Tailscale](/ja-JP/gateway/tailscale) と [Web overview](/web) も参照してください。

### 0.6.1) Node host 経由の browser control（推奨）

Gateway が remote で、browser が別マシンで動作する場合は、browser マシン上で **node host** を実行し、Gateway に browser action をプロキシさせてください（[Browser tool](/ja-JP/tools/browser) を参照）。Node pairing は管理者アクセスと同様に扱ってください。

推奨パターン:

- Gateway と Node host を同じ tailnet（Tailscale）上に保つ。
- Node は意図的にペアリングし、browser proxy routing が不要なら無効にする。

避けるべきこと:

- relay/control port を LAN や公開インターネットに露出すること。
- browser control endpoint に Tailscale Funnel を使うこと（公開露出）。

### 0.7) ディスク上の secret（機微データ）

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下にあるものは、secret や private data を含みうると考えてください。

- `openclaw.json`: config には token（Gateway、remote Gateway）、provider 設定、allowlist が含まれうる
- `credentials/**`: channel 認証情報（例: WhatsApp creds）、pairing allowlist、レガシー OAuth import
- `agents/<agentId>/agent/auth-profiles.json`: API key、token profile、OAuth token、および任意の `keyRef`/`tokenRef`
- `secrets.json`（オプション）: `file` SecretRef provider（`secrets.providers`）で使うファイルベース secret payload
- `agents/<agentId>/agent/auth.json`: レガシー互換ファイル。静的な `api_key` エントリは発見時に scrub される
- `agents/<agentId>/sessions/**`: private message や tool 出力を含みうる session transcript（`*.jsonl`）+ routing metadata（`sessions.json`）
- 同梱 Plugin package: インストール済み Plugin（およびその `node_modules/`）
- `sandboxes/**`: tool sandbox workspace。sandbox 内で読み書きしたファイルのコピーが蓄積しうる

ハードニングのヒント:

- 権限を厳しく保つ（dir は `700`、file は `600`）
- Gateway ホストではフルディスク暗号化を使う
- ホスト共有時は Gateway 専用の OS ユーザーアカウントを推奨する

### 0.8) workspace `.env` ファイル

OpenClaw は agent と tool のために workspace-local な `.env` ファイルを読み込みますが、それらのファイルが Gateway の runtime 制御を密かに上書きすることは決して許しません。

- `OPENCLAW_*` で始まる key はすべて、信頼していない workspace `.env` ファイルからはブロックされます。
- このブロックは fail-closed です。将来のリリースで新しい runtime-control 変数が追加されても、それが commit 済みまたは攻撃者が供給した `.env` から継承されることはありません。その key は無視され、Gateway は自身の値を維持します。
- 信頼された process/OS 環境変数（Gateway 自身の shell、launchd/systemd unit、app bundle）は引き続き適用されます。これは `.env` ファイルの読み込みだけを制限します。

理由: workspace `.env` ファイルはしばしば agent code の隣にあり、誤って commit されたり、tool によって書き込まれたりします。`OPENCLAW_*` 接頭辞全体をブロックすることで、後から新しい `OPENCLAW_*` フラグが追加されても、それが workspace state から静かに継承されるような回帰は起こりません。

### 0.9) log + transcript（redaction + retention）

アクセス制御が正しくても、log と transcript は機微情報を漏らすことがあります。

- Gateway log には tool 要約、error、URL が含まれうる
- session transcript には貼り付けられた secret、ファイル内容、command 出力、リンクが含まれうる

推奨事項:

- tool 要約の redaction を有効のままにする（`logging.redactSensitive: "tools"`; デフォルト）
- `logging.redactPatterns` を使って環境固有のパターン（token、hostname、内部 URL）を追加する
- 診断を共有するときは、生 log より `openclaw status --all`（貼り付けしやすく、secret は redact 済み）を優先する
- 長期保持が不要なら、古い session transcript と log file を削除する

詳細: [Logging](/ja-JP/gateway/logging)

### 1) DM: デフォルトは pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) グループ: すべてでメンション必須

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

グループチャットでは、明示的にメンションされたときだけ応答します。

### 3) 番号を分ける（WhatsApp、Signal、Telegram）

電話番号ベースの channel では、AI を個人用番号とは別の電話番号で運用することを検討してください。

- 個人番号: あなたの会話は private に保たれる
- bot 番号: AI が適切な境界付きでこれらを処理する

### 4) 読み取り専用モード（sandbox + tool 経由）

次を組み合わせることで、読み取り専用 profile を構築できます。

- `agents.defaults.sandbox.workspaceAccess: "ro"`（または workspace アクセスなしなら `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックする tool allow/deny list

追加のハードニングオプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandbox 化がオフでも `apply_patch` が workspace ディレクトリ外へ書き込み/削除できないようにします。`apply_patch` で意図的に workspace 外のファイルに触れたい場合にのみ `false` にしてください。
- `tools.fs.workspaceOnly: true`（オプション）: `read`/`write`/`edit`/`apply_patch` のパスと、native prompt の image 自動読み込みパスを workspace ディレクトリに制限します（現在 absolute path を許可していて、単一のガードレールを追加したい場合に有用）。
- filesystem root は狭く保つ: agent workspace/sandbox workspace にホームディレクトリ全体のような広い root を使わないでください。広い root は、filesystem tool から機微なローカルファイル（たとえば `~/.openclaw` 配下の state/config）を露出することがあります。

### 5) セキュアベースライン（コピー/貼り付け用）

Gateway を private に保ち、DM pairing を必須にし、常時応答するグループ bot を避ける「安全なデフォルト」config の一例です。

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

tool 実行も「より安全なデフォルト」にしたい場合は、sandbox を追加し、owner 以外の agent には危険な tool を deny してください（例は下の「Per-agent access profiles」を参照）。

chat 駆動の agent turn に対する組み込みベースラインでは、owner 以外の送信者は `cron` または `gateway` tool を使えません。

## sandbox 化（推奨）

専用ドキュメント: [Sandboxing](/ja-JP/gateway/sandboxing)

相補的な 2 つのアプローチがあります。

- **Gateway 全体を Docker で実行する**（container 境界）: [Docker](/ja-JP/install/docker)
- **tool sandbox**（`agents.defaults.sandbox`、host Gateway + sandbox 分離された tool。デフォルト backend は Docker）: [Sandboxing](/ja-JP/gateway/sandboxing)

注意: cross-agent アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）または、より厳密な session 単位分離なら `"session"` に保ってください。`scope: "shared"` は単一の container/workspace を使用します。

sandbox 内での agent workspace アクセスについても検討してください。

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）は agent workspace をアクセス不可にし、tool は `~/.openclaw/sandboxes` 配下の sandbox workspace を対象に実行されます
- `agents.defaults.sandbox.workspaceAccess: "ro"` は agent workspace を `/agent` に読み取り専用で mount します（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` は agent workspace を `/workspace` に読み書き可能で mount します
- 追加の `sandbox.docker.binds` は、正規化および canonical 化された source path に対して検証されます。親 symlink のトリックや canonical なホーム alias も、それらが `/etc`、`/var/run`、または OS ホーム配下の認証情報ディレクトリのようなブロック root に解決されるなら、引き続き fail closed します。

重要: `tools.elevated` は、sandbox 外で exec を実行するためのグローバルベースラインの escape hatch です。実効 host はデフォルトで `gateway`、exec target が `node` に設定されている場合は `node` になります。`tools.elevated.allowFrom` は厳しく絞り、見知らぬ相手に対して有効にしないでください。agent ごとの `agents.list[].tools.elevated` でさらに制限できます。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

### sub-agent 委任のガードレール

session tool を許可する場合は、委任された sub-agent 実行も別の境界判断として扱ってください。

- agent が本当に委任を必要としない限り、`sessions_spawn` を deny する
- `agents.defaults.subagents.allowAgents` と、agent ごとの `agents.list[].subagents.allowAgents` 上書きは、既知で安全な対象 agent に限定する
- 必ず sandbox を維持したいワークフローでは、`sessions_spawn` を `sandbox: "require"` 付きで呼ぶ（デフォルトは `inherit`）
- `sandbox: "require"` は、対象の子 runtime が sandbox 化されていない場合に即座に失敗する

## browser control のリスク

browser control を有効にすると、モデルに実際の browser を操作する能力を与えることになります。  
その browser profile にすでにログイン済みセッションが含まれている場合、モデルはそれらのアカウントやデータにアクセスできます。browser profile は **機微な state** として扱ってください。

- agent には専用 profile（デフォルトの `openclaw` profile）を使う
- agent に個人用の常用 profile を向けない
- sandbox 化された agent では、信頼している場合を除き host browser control を無効にしておく
- スタンドアロンの loopback browser control API は、共有 secret auth（Gateway token bearer auth または Gateway password）のみを受け付けます。trusted-proxy や Tailscale Serve の identity header は消費しません。
- browser のダウンロードは信頼していない入力として扱い、分離されたダウンロードディレクトリを推奨する
- 可能なら agent profile では browser sync/password manager を無効にする（blast radius を減らす）
- remote Gateway では、「browser control」はその profile が到達できるものへの「operator access」と同等だと考える
- Gateway と Node host は tailnet 専用に保ち、browser control port を LAN や公開インターネットに露出しない
- browser proxy routing が不要なら無効にする（`gateway.nodes.browser.mode="off"`）
- Chrome MCP の既存セッション mode は **より安全** ではありません。そのホストの Chrome profile が到達できるものに対して、あなたとして動作できます。

### browser SSRF policy（デフォルトで厳格）

OpenClaw の browser navigation policy はデフォルトで厳格です。明示的にオプトインしない限り、プライベート/内部宛先は引き続きブロックされます。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定であり、browser navigation はプライベート/内部/特殊用途の宛先をブロックしたままです。
- レガシー alias: `browser.ssrfPolicy.allowPrivateNetwork` も互換性のため引き続き受け付けます。
- オプトインモード: プライベート/内部/特殊用途の宛先を許可するには `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的な例外に `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック名を含む正確なホスト例外）を使用します。
- redirect ベースの pivot を減らすため、navigation はリクエスト前にチェックされ、さらに navigation 後の最終 `http(s)` URL に対してもベストエフォートで再チェックされます。

厳格 policy の例:

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

## agent ごとのアクセス profile（マルチ agent）

マルチ agent ルーティングでは、各 agent が独自の sandbox + tool policy を持てます。これを使って、agent ごとに **フルアクセス**、**読み取り専用**、または **アクセスなし** を設定してください。詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

よくある用途:

- 個人用 agent: フルアクセス、sandbox なし
- 家族/仕事用 agent: sandbox 化 + 読み取り専用 tool
- 公開 agent: sandbox 化 + filesystem/shell tool なし

### 例: フルアクセス（sandbox なし）

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

### 例: 読み取り専用 tool + 読み取り専用 workspace

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

### 例: filesystem/shell アクセスなし（provider メッセージングは許可）

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

## AI に伝えるべきこと

agent の system prompt にはセキュリティガイドラインを含めてください。

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## インシデント対応

AI が何か悪いことをした場合:

### 封じ込め

1. **止める:** macOS app（Gateway を supervise している場合）を停止するか、`openclaw gateway` process を終了する。
2. **露出を閉じる:** 何が起きたか把握するまでは、`gateway.bind: "loopback"` を設定する（または Tailscale Funnel/Serve を無効にする）。
3. **アクセスを凍結する:** 危険な DM/group を `dmPolicy: "disabled"` に切り替える / メンション必須にする。また、もし `"*"` の全許可エントリがあれば削除する。

### ローテーション（secret が漏えいした場合は侵害されたとみなす）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションして再起動する。
2. Gateway を呼び出せるすべてのマシンで、remote client secret（`gateway.remote.token` / `.password`）をローテーションする。
3. provider/API 認証情報（WhatsApp creds、Slack/Discord token、`auth-profiles.json` 内の model/API key、および使用している場合は暗号化済み secret payload 値）をローテーションする。

### 監査

1. Gateway log を確認する: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連する transcript を確認する: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近の config 変更を確認する（アクセスを広げた可能性のあるもの: `gateway.bind`、`gateway.auth`、DM/group policy、`tools.elevated`、Plugin 変更）。
4. `openclaw security audit --deep` を再実行し、critical な検出事項が解消されたことを確認する。

### レポート用に収集するもの

- タイムスタンプ、Gateway ホスト OS + OpenClaw version
- session transcript + 短い log tail（redact 後）
- 攻撃者が送った内容 + agent が実行した内容
- Gateway が loopback を超えて露出していたかどうか（LAN/Tailscale Funnel/Serve）

## Secret Scanning（detect-secrets）

CI は `secrets` job で `detect-secrets` の pre-commit hook を実行します。  
`main` への push では常に全ファイルスキャンが実行されます。pull request では、base commit が利用可能なら変更ファイルだけの高速経路を使い、そうでなければ全ファイルスキャンにフォールバックします。失敗した場合、それは baseline にまだ入っていない新しい候補があることを意味します。

### CI が失敗した場合

1. ローカルで再現する:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. tool を理解する:
   - pre-commit 内の `detect-secrets` は、この repo の baseline と除外設定を使って `detect-secrets-hook` を実行します。
   - `detect-secrets audit` は対話型レビューを開き、baseline の各項目を実際の secret か false positive かとしてマークします。
3. 実際の secret だった場合: ローテーション/削除し、その後スキャンを再実行して baseline を更新する。
4. false positive の場合: 対話型 audit を実行して false としてマークする。

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しい除外が必要なら `.detect-secrets.cfg` に追加し、対応する `--exclude-files` / `--exclude-lines` フラグで baseline を再生成する（config ファイルは参照専用であり、detect-secrets は自動では読み込みません）。

更新された `.secrets.baseline` が意図した状態を反映したら、それを commit してください。

## セキュリティ問題の報告

OpenClaw に脆弱性を見つけた場合は、責任ある形で報告してください。

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開投稿しない
3. 希望する場合は匿名、それ以外はクレジットを記載します
