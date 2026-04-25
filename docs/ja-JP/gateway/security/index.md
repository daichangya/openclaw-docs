---
read_when:
    - アクセスや自動化を広げる機能を追加する
summary: シェルアクセスを持つAI Gatewayを実行する際のセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-04-25T13:49:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a63386bac5db060ff1edc2260aae4a192ac666fc82956c8538915a970205215c
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **個人アシスタントの信頼モデル。** このガイダンスは、Gatewayごとに1つの信頼されたオペレーター境界（単一ユーザー、個人アシスタントモデル）を前提としています。OpenClawは、1つのagentまたはGatewayを共有する複数の敵対的ユーザーに対する hostile multi-tenant なセキュリティ境界では**ありません**。混在信頼または敵対的ユーザー運用が必要な場合は、信頼境界を分割してください（別のGateway + 認証情報、理想的には別のOSユーザーまたはホスト）。
</Warning>

## まずスコープ: 個人アシスタントのセキュリティモデル

OpenClawのセキュリティガイダンスは、**個人アシスタント**のデプロイを前提としています。つまり、1つの信頼されたオペレーター境界と、必要に応じて複数のagentです。

- サポートされるセキュリティ体制: Gatewayごとに1ユーザー/信頼境界（境界ごとに1つのOSユーザー/ホスト/VPSが望ましい）。
- サポートされないセキュリティ境界: 相互に信頼されていない、または敵対的なユーザーが1つの共有Gateway/agentを使うこと。
- 敵対的ユーザー分離が必要な場合は、信頼境界ごとに分割してください（別のGateway + 認証情報、理想的には別のOSユーザー/ホスト）。
- 複数の信頼されていないユーザーが1つのツール有効agentにメッセージできる場合、そのagentに対する同じ委譲ツール権限を共有しているものとして扱ってください。

このページは、その**モデル内での**ハードニングを説明します。1つの共有Gateway上で hostile multi-tenant 分離を実現すると主張するものではありません。

## クイックチェック: `openclaw security audit`

関連: [Formal Verification (Security Models)](/ja-JP/security/formal-verification)

これは定期的に実行してください（特に設定変更後やネットワーク面を公開した後）。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に対象を絞っています。一般的なオープングループポリシーをallowlistに切り替え、`logging.redactSensitive: "tools"` を復元し、state/config/include-file の権限を厳格化し、WindowsではPOSIX `chmod` の代わりにWindows ACLリセットを使用します。

これはよくある危険な落とし穴（Gateway認証の露出、ブラウザー制御の露出、elevated allowlist、ファイルシステム権限、緩いexec承認、オープンチャンネルのツール露出）にフラグを立てます。

OpenClawは製品であると同時に実験でもあります。つまり、frontier-model の挙動を実際のメッセージ面や実際のツールに接続しています。**「完全に安全」な設定はありません。** 目標は、次の点を意識的に決めることです。

- 誰がボットと会話できるか
- ボットがどこで動作できるか
- ボットが何に触れられるか

まずは動作に必要な最小アクセスから始め、確信が持てるようになってから段階的に広げてください。

### デプロイとホスト信頼

OpenClawは、ホストと設定境界が信頼されていることを前提とします。

- 誰かがGatewayホストの状態/設定（`~/.openclaw`、`openclaw.json` を含む）を変更できるなら、その人物は信頼されたオペレーターとして扱ってください。
- 相互に信頼されていない/敵対的な複数のオペレーター向けに1つのGatewayを動かすことは、**推奨される構成ではありません**。
- 混在信頼のチームでは、別々のGateway（または最低でも別のOSユーザー/ホスト）で信頼境界を分割してください。
- 推奨デフォルト: 1マシン/ホスト（またはVPS）につき1ユーザー、そのユーザー向けに1つのGateway、そのGateway内に1つ以上のagent。
- 1つのGatewayインスタンスの中では、認証済みoperatorアクセスは信頼されたcontrol-planeロールであり、ユーザーごとのtenantロールではありません。
- セッション識別子（`sessionKey`、セッションID、ラベル）はルーティング選択子であり、認可トークンではありません。
- 複数人が1つのツール有効agentにメッセージできる場合、それぞれがその同じ権限セットを操作できます。ユーザーごとのセッション/メモリ分離はプライバシーには役立ちますが、共有agentをユーザーごとのホスト認可に変えるものではありません。

### 共有Slackワークスペース: 実際のリスク

「Slackの全員がボットにメッセージできる」場合、中心的なリスクは委譲されたツール権限です。

- 許可された任意の送信者が、そのagentのポリシー内でツール呼び出し（`exec`、browser、network/file tools）を誘発できる
- 1人の送信者からのプロンプト/コンテンツインジェクションが、共有状態、デバイス、出力に影響するアクションを引き起こせる
- 1つの共有agentが機密の認証情報/ファイルを持っている場合、許可された任意の送信者がツール使用を通じてそれらを持ち出せる可能性がある

チームワークフローでは最小ツール構成の別agent/別Gatewayを使い、個人データを扱うagentは非公開に保ってください。

### 企業共有agent: 許容可能なパターン

そのagentを使う全員が同じ信頼境界内にあり（たとえば同じ企業チーム）、そのagentが厳密に業務スコープに限定されている場合、これは許容可能です。

- 専用のマシン/VM/containerで実行する
- そのランタイム向けに専用OSユーザー + 専用browser/profile/accountsを使う
- そのランタイムで個人のApple/Googleアカウントや個人のパスワードマネージャー/browser profileにサインインしない

個人と会社のアイデンティティを同じランタイムに混在させると、分離が崩れ、個人データ露出のリスクが高まります。

## GatewayとNodeの信頼概念

GatewayとNodeは、役割の異なる1つのoperator信頼ドメインとして扱ってください。

- **Gateway** はcontrol planeおよびポリシー面です（`gateway.auth`、ツールポリシー、ルーティング）。
- **Node** は、そのGatewayにペアリングされたリモート実行面です（コマンド、デバイス操作、ホストローカル機能）。
- Gatewayに認証された呼び出し元は、Gatewayスコープで信頼されます。ペアリング後のnodeアクションは、そのnode上での信頼されたoperatorアクションです。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザーごとの認証ではありません。
- Exec承認（allowlist + ask）はoperator意図のためのガードレールであり、hostile multi-tenant 分離ではありません。
- 信頼された単一operator構成におけるOpenClawの製品デフォルトでは、`gateway`/`node` 上のhost execは承認プロンプトなしで許可されます（厳しくしない限り `security="full"`, `ask="off"`）。このデフォルトは意図されたUXであり、それ自体が脆弱性ではありません。
- Exec承認は、正確なリクエストコンテキストと、ベストエフォートの直接ローカルファイルオペランドを束縛します。あらゆるランタイム/インタープリターローダーパスを意味的にモデル化するものではありません。強い境界にはsandboxingとホスト分離を使ってください。

敵対的ユーザー分離が必要なら、OSユーザー/ホストごとに信頼境界を分割し、別々のGatewayを実行してください。

## 信頼境界マトリクス

リスクを評価するときは、これを簡易モデルとして使ってください。

| 境界または制御                                        | 意味                                          | よくある誤解                                                                |
| ----------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Gateway APIへの呼び出し元を認証する            | 「安全にするには全フレームにメッセージごとの署名が必要」                    |
| `sessionKey`                                          | コンテキスト/セッション選択のためのルーティングキー | 「session keyはユーザー認証境界である」                                     |
| プロンプト/コンテンツガードレール                    | モデル悪用リスクを減らす                       | 「プロンプトインジェクションだけで認証バイパスが証明される」                 |
| `canvas.eval` / browser evaluate                      | 有効化時の意図されたoperator機能               | 「任意のJS evalプリミティブはこの信頼モデルでは自動的に脆弱性である」       |
| ローカルTUI `!` shell                                 | 明示的なoperator起動のローカル実行             | 「ローカルshellの便利コマンドはリモートインジェクションである」             |
| NodeペアリングとNodeコマンド                          | ペアリング済みデバイス上でのoperatorレベルのリモート実行 | 「リモートデバイス制御はデフォルトで信頼されていないユーザーアクセスとして扱うべき」 |
| `gateway.nodes.pairing.autoApproveCidrs`              | 明示的に有効化する信頼ネットワーク向けNode登録ポリシー | 「デフォルト無効のallowlistは自動ペアリング脆弱性である」                  |

## 設計上の非脆弱性

<Accordion title="範囲外の一般的な指摘">

これらのパターンは頻繁に報告されますが、実際の境界バイパスが示されない限り、通常は対応不要としてクローズされます。

- ポリシー、認証、sandbox のバイパスを伴わない、プロンプトインジェクションだけのチェーン。
- 1つの共有ホストまたは設定上で hostile multi-tenant 運用を前提にした主張。
- 通常のoperator読み取り経路アクセス（たとえば `sessions.list` / `sessions.preview` / `chat.history`）を、共有Gateway構成におけるIDORとして分類する主張。
- localhost専用デプロイの指摘（たとえば loopback専用Gatewayに対するHSTS）。
- このリポジトリに存在しない受信経路に対するDiscord受信webhook署名の指摘。
- `system.run` に対して、Nodeペアリングメタデータを隠れた第2のコマンド単位承認レイヤーとして扱う報告。実際の実行境界は、依然としてGatewayのグローバルNodeコマンドポリシーとNode自身のexec承認です。
- 設定済みの `gateway.nodes.pairing.autoApproveCidrs` を、それ自体で脆弱性として扱う報告。この設定はデフォルトで無効、明示的なCIDR/IPエントリが必要で、要求スコープなしの初回 `role: node` ペアリングにのみ適用され、operator/browser/Control UI、WebChat、ロールアップグレード、スコープアップグレード、メタデータ変更、公開鍵変更、同一ホストloopback trusted-proxy header経路は自動承認しません。
- `sessionKey` を認証トークンとして扱う「ユーザーごとの認可がない」という指摘。

</Accordion>

## 60秒でできるハードニング済みベースライン

まずはこのベースラインを使い、その後、信頼されたagentごとに必要なツールだけを再有効化してください。

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

これにより、Gatewayはローカル専用になり、DMが分離され、control-plane/runtime ツールがデフォルトで無効になります。

## 共有受信箱のクイックルール

複数人がボットにDMできる場合:

- `session.dmScope: "per-channel-peer"` を設定してください（マルチアカウントチャンネルでは `"per-account-channel-peer"`）。
- `dmPolicy: "pairing"` または厳格なallowlistを維持してください。
- 共有DMと広いツールアクセスを組み合わせないでください。
- これは協調的/共有受信箱を強化しますが、ユーザーがホスト/設定の書き込みアクセスを共有する場合の hostile co-tenant 分離向けには設計されていません。

## コンテキスト可視性モデル

OpenClawは2つの概念を分離しています。

- **Trigger authorization**: 誰がagentを起動できるか（`dmPolicy`, `groupPolicy`, allowlists, mention gates）。
- **Context visibility**: どの補足コンテキストがモデル入力に注入されるか（返信本文、引用テキスト、スレッド履歴、転送メタデータ）。

allowlist はトリガーとコマンド認可を制御します。`contextVisibility` 設定は、補足コンテキスト（引用返信、スレッドルート、取得済み履歴）がどのようにフィルタリングされるかを制御します。

- `contextVisibility: "all"`（デフォルト）は補足コンテキストを受信したまま保持します。
- `contextVisibility: "allowlist"` は、補足コンテキストを、アクティブなallowlistチェックで許可された送信者にフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、1つの明示的な引用返信だけは保持します。

`contextVisibility` はチャンネルごと、またはルーム/会話ごとに設定してください。設定の詳細は [Group Chats](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

アドバイザリの評価ガイダンス:

- 「モデルがallowlistにない送信者の引用または履歴テキストを見られる」ことだけを示す指摘は、`contextVisibility` で対処できるハードニング事項であり、それ自体で認証やsandbox境界のバイパスではありません。
- セキュリティ影響ありとするには、なおも信頼境界バイパス（認証、ポリシー、sandbox、承認、またはその他の文書化された境界）の実証が必要です。

## 監査がチェックする内容（高レベル）

- **受信アクセス**（DMポリシー、グループポリシー、allowlist）: 見知らぬ人がボットを起動できるか？
- **ツールの爆発半径**（elevated tools + オープンルーム）: プロンプトインジェクションがshell/file/networkアクションに変わり得るか？
- **Exec承認の差異**（`security=full`, `autoAllowSkills`, `strictInlineEval` なしのインタープリターallowlist）: host-execのガードレールはまだ意図どおり動作しているか？
  - `security="full"` は広い姿勢に対する警告であり、バグの証明ではありません。これは信頼された個人アシスタント構成向けに選ばれたデフォルトです。承認やallowlistガードレールが脅威モデル上必要な場合にのみ厳格化してください。
- **ネットワーク露出**（Gateway bind/auth, Tailscale Serve/Funnel, 弱い/短い認証トークン）。
- **ブラウザー制御の露出**（リモートNode、relayポート、リモートCDPエンドポイント）。
- **ローカルディスク衛生**（権限、symlink、設定include、同期フォルダパス）。
- **Plugins**（明示的allowlistなしでPluginがロードされる）。
- **ポリシー差異/誤設定**（sandbox docker設定はあるがsandbox modeがオフ、`gateway.nodes.denyCommands` パターンがコマンド名の完全一致のみで動作しshellテキストを検査しないため無効、危険な `gateway.nodes.allowCommands` エントリ、グローバル `tools.profile="minimal"` がagentごとのプロファイルで上書きされる、緩いツールポリシー下でPlugin所有ツールに到達できる）。
- **ランタイム期待値の差異**（たとえば、`tools.exec.host` のデフォルトが `auto` になったのに、暗黙のexecがまだ `sandbox` を意味すると想定している、または `tools.exec.host="sandbox"` を明示設定しているのにsandbox modeがオフ）。
- **モデル衛生**（設定済みモデルが旧来に見える場合に警告。ハードブロックではありません）。

`--deep` を実行すると、OpenClawはベストエフォートのライブGatewayプローブも試みます。

## 認証情報ストレージマップ

アクセス監査やバックアップ対象を決める際にはこれを使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegramボットトークン**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）
- **Discordボットトークン**: config/env または SecretRef（env/file/exec providers）
- **Slackトークン**: config/env (`channels.slack.*`)
- **ペアリングallowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトアカウント）
- **モデルauth profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースsecretペイロード（任意）**: `~/.openclaw/secrets.json`
- **旧来OAuth import**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査が指摘を出した場合は、この優先順で扱ってください。

1. **「open」かつツール有効のもの**: まずDM/グループをロックダウンし（pairing/allowlist）、その後ツールポリシー/sandboxingを厳格化する。
2. **公開ネットワーク露出**（LAN bind、Funnel、認証なし）: 直ちに修正する。
3. **ブラウザー制御のリモート露出**: operatorアクセスと同等に扱う（tailnet専用、意図的にNodeをペアリング、公開露出を避ける）。
4. **権限**: state/config/credentials/auth が group/world readable でないことを確認する。
5. **Plugins**: 明示的に信頼するものだけをロードする。
6. **モデル選択**: ツール付きボットには、現代的で instruction-hardening されたモデルを優先する。

## セキュリティ監査用語集

各監査指摘には、構造化された `checkId`（たとえば `gateway.bind_no_auth` や `tools.exec.security_full_configured`）が付いています。一般的な重大度の高い分類:

- `fs.*` — state、config、credentials、auth profile のファイルシステム権限。
- `gateway.*` — bind mode、auth、Tailscale、Control UI、trusted-proxy 設定。
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — 面ごとのハードニング。
- `plugins.*`, `skills.*` — Plugin/skill のサプライチェーンとスキャン指摘。
- `security.exposure.*` — アクセスポリシーとツール爆発半径が交差する横断的チェック。

重大度、fixキー、自動修正対応を含む完全な一覧は [Security audit checks](/ja-JP/gateway/security/audit-checks) を参照してください。

## HTTP経由のControl UI

Control UIは、デバイスアイデンティティを生成するために**セキュアコンテキスト**（HTTPSまたはlocalhost）を必要とします。`gateway.controlUi.allowInsecureAuth` はローカル互換性のためのトグルです。

- localhostでは、ページが非セキュアなHTTPで読み込まれているとき、デバイスアイデンティティなしでControl UI認証を許可します。
- これはペアリングチェックをバイパスしません。
- リモート（non-localhost）のデバイスアイデンティティ要件を緩和しません。

HTTPS（Tailscale Serve）を優先するか、UIを `127.0.0.1` で開いてください。

非常用に限り、`gateway.controlUi.dangerouslyDisableDeviceAuth` はデバイスアイデンティティチェックを完全に無効化します。これは重大なセキュリティ低下です。積極的にデバッグしていて、すぐ元に戻せる場合を除き、オフのままにしてください。

これらの危険フラグとは別に、成功した `gateway.auth.mode: "trusted-proxy"` は、デバイスアイデンティティなしで **operator** のControl UIセッションを許可できます。これは意図されたauth-modeの挙動であり、`allowInsecureAuth` の近道ではありません。また、node-role のControl UIセッションには拡張されません。

`openclaw security audit` は、この設定が有効な場合に警告します。

## 安全でない/危険なフラグの概要

`openclaw security audit` は、既知の安全でない/危険なデバッグスイッチが有効な場合に `config.insecure_or_dangerous_flags` を報告します。本番ではこれらを未設定のままにしてください。

<AccordionGroup>
  <Accordion title="現在監査対象になっているフラグ">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="設定スキーマ内のすべての `dangerous*` / `dangerously*` キー">
    Control UIとbrowser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    チャンネル名マッチング（バンドル済みチャンネルとPluginチャンネル。該当する場合は `accounts.<accountId>` ごとにも利用可能）:

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（Pluginチャンネル）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（Pluginチャンネル）
    - `channels.zalouser.dangerouslyAllowNameMatching`（Pluginチャンネル）
    - `channels.irc.dangerouslyAllowNameMatching`（Pluginチャンネル）
    - `channels.mattermost.dangerouslyAllowNameMatching`（Pluginチャンネル）

    ネットワーク露出:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（アカウントごとも可）

    Sandbox Docker（defaults + agentごと）:

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## リバースプロキシ設定

Gatewayをリバースプロキシ（nginx、Caddy、Traefik など）の背後で動かす場合は、転送元クライアントIPを正しく扱うために `gateway.trustedProxies` を設定してください。

Gatewayが **`trustedProxies` に含まれていない** アドレスからのproxyヘッダーを検出した場合、その接続をローカルクライアントとしては扱いません。Gateway認証が無効なら、その接続は拒否されます。これにより、proxy経由接続がlocalhostから来たように見えて自動的に信頼される認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、このauth modeはさらに厳格です。

- trusted-proxy auth は **loopback-source proxy に対して fail closed** します
- 同一ホストのloopbackリバースプロキシは、ローカルクライアント検出と転送IP処理のために `gateway.trustedProxies` を使えます
- 同一ホストのloopbackリバースプロキシでは、`gateway.auth.mode: "trusted-proxy"` ではなく token/password auth を使ってください

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # 任意。デフォルトは false。
  # プロキシが X-Forwarded-For を提供できない場合のみ有効にしてください。
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies` が設定されている場合、GatewayはクライアントIPの判定に `X-Forwarded-For` を使います。`X-Real-IP` は、`gateway.allowRealIpFallback: true` が明示設定されていない限り、デフォルトでは無視されます。

Trusted proxyヘッダーによって、Nodeデバイスペアリングが自動的に信頼されることはありません。`gateway.nodes.pairing.autoApproveCidrs` は別の、デフォルト無効のoperatorポリシーです。有効化していても、loopback-source trusted-proxy header 経路はNode自動承認から除外されます。ローカル呼び出し元はそれらのヘッダーを偽装できるためです。

望ましいリバースプロキシ動作（受信転送ヘッダーを上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

望ましくないリバースプロキシ動作（信頼されていない転送ヘッダーを追記/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTSとoriginに関する注意

- OpenClaw Gatewayは、まずローカル/loopback を前提としています。TLSをリバースプロキシで終端する場合は、そこでproxy向けHTTPSドメインにHSTSを設定してください。
- Gateway自体がHTTPSを終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClawレスポンスからHSTSヘッダーを出せます。
- 詳しいデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- non-loopback のControl UIデプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必要です。
- `gateway.controlUi.allowedOrigins: ["*"]` は、明示的な全許可ブラウザーoriginポリシーであり、ハードニング済みデフォルトではありません。厳密に管理されたローカルテスト以外では避けてください。
- 一般的なloopback免除が有効でも、loopback上のbrowser-origin認証失敗にはレート制限が適用されます。ただしlockoutキーは、1つの共有localhostバケットではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` はHost-header origin fallbackモードを有効にします。危険なoperator選択ポリシーとして扱ってください。
- DNS rebinding と proxy-host header の挙動はデプロイハードニング上の懸念として扱ってください。`trustedProxies` は厳格に保ち、Gatewayを公開インターネットへ直接露出させないでください。

## ローカルセッションログはディスクに保存される

OpenClawはセッショントランスクリプトを `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 配下にディスク保存します。  
これはセッション継続性と（任意で）セッションメモリ索引付けに必要ですが、同時に**ファイルシステムアクセスを持つ任意のプロセス/ユーザーがそれらのログを読める**ことも意味します。ディスクアクセスを信頼境界として扱い、`~/.openclaw` の権限を厳格化してください（以下の監査セクション参照）。agent間でより強い分離が必要な場合は、別々のOSユーザーまたは別々のホストで実行してください。

## Node実行（system.run）

macOS Nodeがペアリングされている場合、GatewayはそのNode上で `system.run` を呼び出せます。これはそのMac上での**リモートコード実行**です:

- Nodeペアリング（承認 + トークン）が必要です。
- GatewayのNodeペアリングは、コマンドごとの承認面ではありません。Nodeのアイデンティティ/信頼とトークン発行を確立するものです。
- Gatewayは `gateway.nodes.allowCommands` / `denyCommands` による粗いグローバルNodeコマンドポリシーを適用します。
- Mac側では **Settings → Exec approvals** で制御します（security + ask + allowlist）。
- Nodeごとの `system.run` ポリシーは、そのNode自身のexec approvalsファイル（`exec.approvals.node.*`）であり、GatewayのグローバルコマンドIDポリシーより厳しくも緩くもできます。
- `security="full"` かつ `ask="off"` で動いているNodeは、デフォルトの信頼されたoperatorモデルに従っています。デプロイで明示的に、より厳しい承認またはallowlist方針が必要でない限り、これは想定どおりの挙動として扱ってください。
- 承認モードは、正確なリクエストコンテキストと、可能な場合は1つの具体的なローカルscript/fileオペランドを束縛します。OpenClawがインタープリター/ランタイムコマンドに対して、ちょうど1つの直接ローカルファイルを特定できない場合、完全な意味的カバレッジを約束する代わりに、承認ベースの実行は拒否されます。
- `host=node` では、承認ベースの実行は正規化された準備済み `systemRunPlan` も保存し、後続の承認済みforwardはその保存済みプランを再利用します。また、承認要求作成後の command/cwd/session context に対する呼び出し元編集はGateway検証で拒否されます。
- リモート実行を望まない場合は、securityを **deny** に設定し、そのMacのNodeペアリングを解除してください。

この違いは評価時に重要です。

- 再接続したペア済みNodeが異なるコマンド一覧を広告していても、それ自体は脆弱性ではありません。GatewayのグローバルポリシーとNodeのローカルexec approvalsが実際の実行境界を引き続き強制しているなら問題ありません。
- Nodeペアリングメタデータを、隠れた第2のコマンド単位承認レイヤーとして扱う報告は、通常はポリシー/UXの混乱であり、セキュリティ境界バイパスではありません。

## 動的Skills（watcher / remote nodes）

OpenClawは、セッション途中でSkills一覧を更新できます。

- **Skills watcher**: `SKILL.md` の変更により、次のagentターンでSkillsスナップショットが更新されることがあります。
- **Remote nodes**: macOS Nodeを接続すると、macOS専用Skillsが利用可能になることがあります（bin probingに基づく）。

Skillフォルダーは**信頼されたコード**として扱い、誰が変更できるかを制限してください。

## 脅威モデル

あなたのAIアシスタントは次のことができます。

- 任意のshellコマンドを実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- （WhatsAppアクセスを与えれば）誰にでもメッセージを送れる

あなたにメッセージできる人は次のことを試みます。

- AIをだまして悪いことをさせる
- データへのアクセスをソーシャルエンジニアリングする
- インフラ詳細を探る

## 中核概念: 知能より先にアクセス制御

ここでの失敗の多くは、高度な攻撃ではなく、「誰かがボットにメッセージし、ボットが頼まれたことをやった」というものです。

OpenClawの立場:

- **まずアイデンティティ:** 誰がボットと会話できるかを決める（DM pairing / allowlists / 明示的な `open`）。
- **次にスコープ:** ボットがどこで動作できるかを決める（グループallowlist + mention gating、tools、sandboxing、device permissions）。
- **最後にモデル:** モデルは操作され得ると仮定し、その操作の爆発半径が限定されるように設計する。

## コマンド認可モデル

スラッシュコマンドとディレクティブは、**認可された送信者**に対してのみ有効になります。認可は、チャンネルallowlists/pairing と `commands.useAccessGroups` から導かれます（[Configuration](/ja-JP/gateway/configuration) と [Slash commands](/ja-JP/tools/slash-commands) を参照）。チャンネルallowlist が空、または `"*"` を含む場合、そのチャンネルではコマンドは事実上オープンです。

`/exec` は認可されたoperator向けのセッション限定の便利機能です。設定を書き換えたり、他のセッションを変更したりは**しません**。

## Control planeツールのリスク

組み込みツールのうち2つは、永続的なcontrol-plane変更を行えます。

- `gateway` は `config.schema.lookup` / `config.get` で設定を検査でき、`config.apply`, `config.patch`, `update.run` で永続変更を加えられます。
- `cron` は、元のチャット/タスク終了後も動き続けるスケジュールジョブを作成できます。

owner専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` や `tools.exec.security` の書き換えを拒否します。旧来の `tools.bash.*` エイリアスは、書き込み前に同じ保護されたexecパスへ正規化されます。  
agent駆動の `gateway config.apply` および `gateway config.patch` 編集は、デフォルトで fail-closed です。agentが調整可能なのは、限定されたprompt、model、mention-gating のパスだけです。そのため、新しい機密設定ツリーは、意図的にallowlistへ追加されない限り保護されます。

信頼されていないコンテンツを扱うagent/面では、これらをデフォルトで拒否してください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` はrestartアクションだけをブロックします。`gateway` のconfig/updateアクションは無効にしません。

## Plugins

PluginsはGateway内で**インプロセス**実行されます。信頼されたコードとして扱ってください。

- 信頼するソースのPluginだけをインストールする。
- 明示的な `plugins.allow` allowlistを優先する。
- 有効化前にPlugin設定を確認する。
- Plugin変更後はGatewayを再起動する。
- Pluginをインストールまたは更新する場合（`openclaw plugins install <package>`, `openclaw plugins update <id>`）、信頼されていないコードを実行するのと同様に扱ってください:
  - インストール先は、アクティブなPluginインストールルート配下のPluginごとのディレクトリです。
  - OpenClawはインストール/更新前に組み込みの危険コードスキャンを実行します。`critical` 指摘はデフォルトでブロックされます。
  - OpenClawは `npm pack` を使い、その後そのディレクトリで `npm install --omit=dev` を実行します（npm lifecycle script はインストール中にコードを実行できます）。
  - 固定の厳密バージョン（`@scope/pkg@1.2.3`）を優先し、有効化前にディスク上へ展開されたコードを確認してください。
  - `--dangerously-force-unsafe-install` は、Pluginインストール/更新フローでの組み込みスキャンの誤検知に対する非常用です。Plugin `before_install` hook のポリシーブロックは回避せず、スキャン失敗も回避しません。
  - Gateway対応のskill依存関係インストールも同じ dangerous/suspicious 分割に従います。組み込み `critical` 指摘は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を設定しない限りブロックされますが、suspicious 指摘は警告のみです。`openclaw skills install` は引き続き別の ClawHub skill ダウンロード/インストールフローです。

詳細: [Plugins](/ja-JP/tools/plugin)

## DMアクセスモデル: pairing, allowlist, open, disabled

現在DM対応しているすべてのチャンネルは、メッセージ処理**前**に受信DMを制御するDMポリシー（`dmPolicy` または `*.dm.policy`）をサポートしています。

- `pairing`（デフォルト）: 不明な送信者には短いペアリングコードが送られ、承認されるまでボットはそのメッセージを無視します。コードは1時間で失効し、繰り返しDMしても、新しい要求が作られるまでは再送されません。保留中要求はデフォルトで**チャンネルごとに3件**までです。
- `allowlist`: 不明な送信者はブロックされます（pairing handshakeなし）。
- `open`: 誰でもDM可能にします（公開）。チャンネルallowlistに `"*"` を含めることが**必須**です（明示的オプトイン）。
- `disabled`: 受信DMを完全に無視します。

CLIで承認:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上ファイル: [Pairing](/ja-JP/channels/pairing)

## DMセッション分離（マルチユーザーモード）

デフォルトでは、OpenClawは**すべてのDMをメインセッションへルーティング**し、デバイスやチャンネルをまたいだ継続性を保ちます。**複数人**がボットにDMできる場合（オープンDMや複数人allowlist）、DMセッションを分離することを検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、グループチャット分離を維持しつつ、ユーザー間のコンテキスト漏洩を防げます。

これはメッセージングコンテキストの境界であり、ホスト管理者境界ではありません。ユーザー同士が敵対的で、同じGatewayホスト/設定を共有している場合は、信頼境界ごとに別Gatewayを動かしてください。

### セキュアDMモード（推奨）

上記のスニペットを**セキュアDMモード**として扱ってください。

- デフォルト: `session.dmScope: "main"`（すべてのDMが継続性のため1つのセッションを共有）
- ローカルCLIオンボーディングのデフォルト: 未設定の場合に `session.dmScope: "per-channel-peer"` を書き込みます（既存の明示値は維持）
- セキュアDMモード: `session.dmScope: "per-channel-peer"`（各チャンネル+送信者ペアごとに分離されたDMコンテキスト）
- チャンネル横断の送信者分離: `session.dmScope: "per-peer"`（同種のすべてのチャンネルを通じて送信者ごとに1セッション）

同一チャンネル上で複数アカウントを使う場合は、代わりに `per-account-channel-peer` を使ってください。同じ人物が複数チャンネルから連絡してくる場合は、`session.identityLinks` を使ってそれらのDMセッションを1つの正規アイデンティティへ統合してください。[Session Management](/ja-JP/concepts/session) と [Configuration](/ja-JP/gateway/configuration) を参照してください。

## DMとグループのallowlist

OpenClawには、「誰が自分を起動できるか」に関する2つの別レイヤーがあります。

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; 旧来: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`）: ダイレクトメッセージでボットと会話できる人物。
  - `dmPolicy="pairing"` の場合、承認はアカウントスコープ付きのpairing allowlistストア `~/.openclaw/credentials/` に書き込まれます（デフォルトアカウントは `<channel>-allowFrom.json`、非デフォルトアカウントは `<channel>-<accountId>-allowFrom.json`）。これがconfig allowlistとマージされます。
- **グループallowlist**（チャンネル固有）: どのグループ/チャンネル/guildからのメッセージをボットが受け入れるか。
  - よくあるパターン:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` のようなグループごとのデフォルト。設定すると、グループallowlistとしても機能します（全許可を維持するには `"*"` を含める）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: グループセッション内で誰がボットを起動できるかを制限する（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: 面ごとのallowlist + mentionデフォルト。
  - グループチェックはこの順で実行されます: まず `groupPolicy` / グループallowlist、次に mention/reply activation。
  - ボットメッセージへの返信（暗黙メンション）は、`groupAllowFrom` のような送信者allowlistを**バイパスしません**。
  - **セキュリティ注記:** `dmPolicy="open"` と `groupPolicy="open"` は最終手段として扱ってください。これらはほとんど使うべきではありません。部屋の全員を完全に信頼している場合を除き、pairing + allowlist を優先してください。

詳細: [Configuration](/ja-JP/gateway/configuration) と [Groups](/ja-JP/channels/groups)

## プロンプトインジェクション（それが何か、なぜ重要か）

プロンプトインジェクションとは、攻撃者が、モデルを操作して危険なことをさせるようなメッセージを作ることです（「指示を無視しろ」「ファイルシステムをダンプしろ」「このリンクを開いてコマンドを実行しろ」など）。

強いsystem prompt があっても、**プロンプトインジェクションは未解決**です。System prompt のガードレールはあくまで緩い指針であり、強制力はtool policy、exec approvals、sandboxing、channel allowlists から来ます（そしてoperatorは設計上これらを無効にもできます）。実際に役立つもの:

- 受信DMはロックダウンしたままにする（pairing/allowlists）。
- グループではmention gatingを優先し、公開ルームでの「常時応答」ボットは避ける。
- リンク、添付ファイル、貼り付けられた指示は、デフォルトで敵対的とみなす。
- 機密性の高いツール実行はsandboxで行い、secretはagentが到達可能なファイルシステムから外しておく。
- 注: sandboxingは明示的オプトインです。sandbox modeがオフの場合、暗黙の `host=auto` はGatewayホストに解決されます。明示的な `host=sandbox` はsandboxランタイムが利用できないため引き続き fail closed します。その挙動を設定上で明示したい場合は `host=gateway` を設定してください。
- 高リスクツール（`exec`, `browser`, `web_fetch`, `web_search`）は、信頼されたagentまたは明示的allowlistに限定する。
- インタープリター（`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`）をallowlistに入れる場合は、インラインeval形式にも明示承認が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- Shell承認解析は、**引用されていないheredoc** 内のPOSIXパラメーター展開形式（`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`）も拒否します。これにより、allowlist済みのheredoc本文が平文に見せかけてshell展開を審査からすり抜けることを防ぎます。リテラル本文セマンティクスにするには、heredoc終端を引用してください（例: `<<'EOF'`）。変数展開が発生する未引用heredocは拒否されます。
- **モデル選択は重要です:** 古い/小さい/旧来のモデルは、プロンプトインジェクションやツール誤用に対して大幅に脆弱です。ツール有効agentには、利用可能な中で最も強い最新世代の instruction-hardening 済みモデルを使ってください。

信頼しないものとして扱うべき危険信号:

- 「このファイル/URLを読んで、その指示どおりに行動しろ」
- 「system prompt や安全ルールを無視しろ」
- 「隠された指示やツール出力を明かせ」
- 「`~/.openclaw` やログの中身を全部貼れ」

## 外部コンテンツのspecial tokenサニタイズ

OpenClawは、ラップされた外部コンテンツやメタデータがモデルに届く前に、一般的なセルフホストLLMチャットテンプレートのspecial tokenリテラルを除去します。対象となるマーカーファミリーには、Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS のロール/ターントークンが含まれます。

理由:

- セルフホストモデルの前段にあるOpenAI互換バックエンドは、ユーザーテキスト内のspecial tokenをマスクせず保持することがあります。受信外部コンテンツ（取得したページ、メール本文、ファイル内容ツールの出力）を書き込める攻撃者は、そうでなければ合成された `assistant` または `system` ロール境界を注入して、wrapped-content ガードレールを抜けられる可能性があります。
- サニタイズは外部コンテンツのラッピング層で行われるため、プロバイダー単位ではなく、fetch/readツールや受信チャンネルコンテンツ全体に一様に適用されます。
- 送信モデル応答には、すでに別のサニタイザーがあり、`<tool_call>`, `<function_calls>` などの足場情報をユーザー向け返信から除去します。外部コンテンツサニタイザーはその受信側対応です。

これはこのページの他のハードニングの代わりにはなりません。`dmPolicy`、allowlists、exec approvals、sandboxing、`contextVisibility` が引き続き主要な役割を果たします。これは、special tokenをそのままユーザーテキストとして転送するセルフホストスタックに対する、トークナイザ層の特定のバイパスを塞ぐものです。

## 安全でない外部コンテンツのバイパスフラグ

OpenClawには、外部コンテンツの安全ラッピングを無効化する明示的なバイパスフラグがあります。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cronペイロードフィールド `allowUnsafeExternalContent`

ガイダンス:

- 本番ではこれらを未設定/false のままにしてください。
- 厳密にスコープを絞ったデバッグ時にのみ一時的に有効にしてください。
- 有効にする場合は、そのagentを分離してください（sandbox + minimal tools + 専用セッション名前空間）。

Hooksのリスク注記:

- Hookペイロードは、たとえ配送元が管理下のシステムでも、信頼できないコンテンツです（メール/ドキュメント/Webコンテンツにはプロンプトインジェクションが含まれ得ます）。
- 弱いモデルtierはこのリスクを高めます。hook駆動の自動化では、強力な最新モデルtierを優先し、ツールポリシーは厳格に保ってください（`tools.profile: "messaging"` またはそれ以上に厳格）、可能ならsandboxingも有効にしてください。

### プロンプトインジェクションは公開DMがなくても起こる

たとえ**自分だけ**がボットにメッセージできる場合でも、ボットが読む**信頼できないコンテンツ**（web search/fetch結果、browserページ、メール、ドキュメント、添付ファイル、貼り付けられたログ/コード）経由でプロンプトインジェクションは起こり得ます。つまり、送信者だけが脅威面なのではなく、**コンテンツ自体**が敵対的な指示を運ぶ可能性があります。

ツールが有効な場合の典型的なリスクは、コンテキストの持ち出しやツール呼び出しの誘発です。爆発半径を減らすには:

- 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の**reader agent** を使い、その要約をメインagentへ渡す。
- 必要でない限り、ツール有効agentでは `web_search` / `web_fetch` / `browser` をオフにする。
- OpenResponsesのURL入力（`input_file` / `input_image`）では、`gateway.http.endpoints.responses.files.urlAllowlist` と `gateway.http.endpoints.responses.images.urlAllowlist` を厳格に設定し、`maxUrlParts` は低く保つ。空のallowlist は未設定として扱われます。URL取得自体を完全に無効にしたい場合は `files.allowUrl: false` / `images.allowUrl: false` を使用してください。
- OpenResponsesのファイル入力では、デコードされた `input_file` テキストも引き続き**信頼できない外部コンテンツ**として注入されます。Gatewayがローカルでデコードしたからといって、そのファイルテキストを信頼しないでください。注入ブロックには、より長い `SECURITY NOTICE:` バナーは含まれないものの、明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界マーカーと `Source: External` メタデータが付与されます。
- 同じマーカーベースのラッピングは、media-understanding が添付ドキュメントからテキストを抽出し、そのテキストをメディアプロンプトへ追加する際にも適用されます。
- 信頼できない入力に触れるagentにはsandboxingと厳格なツールallowlistを有効にする。
- secretをpromptから外し、代わりにGatewayホスト上のenv/config経由で渡す。

### セルフホストLLMバックエンド

vLLM、SGLang、TGI、LM Studio、またはカスタムHugging Face tokenizerスタックのようなOpenAI互換セルフホストバックエンドは、チャットテンプレートspecial tokenの扱いがホスト型プロバイダーと異なることがあります。バックエンドが `<|im_start|>`、`<|start_header_id|>`、`<start_of_turn>` のようなリテラル文字列を、ユーザーコンテンツ内で構造的なチャットテンプレートトークンとしてトークナイズする場合、信頼できないテキストがトークナイザ層でロール境界を偽造しようとする可能性があります。

OpenClawは、一般的なモデルファミリーのspecial tokenリテラルを、モデルへ送る前のラップ済み外部コンテンツから除去します。外部コンテンツのラッピングは有効なままにし、可能であれば、ユーザー提供コンテンツ内のspecial tokenを分割またはエスケープするバックエンド設定を優先してください。OpenAIやAnthropicのようなホスト型プロバイダーは、すでに自前のリクエスト側サニタイズを適用しています。

### モデル強度（セキュリティ注記）

プロンプトインジェクション耐性は、モデルtier間で**一様ではありません**。一般に、小さくて安価なモデルほど、特に敵対的プロンプト下でのツール誤用や命令ハイジャックに弱いです。

<Warning>
ツール有効agentや信頼できないコンテンツを読むagentでは、古い/小さいモデルに対するプロンプトインジェクションリスクは高すぎることがよくあります。そのようなワークロードを弱いモデルtierで実行しないでください。
</Warning>

推奨事項:

- ツールを実行できる、またはファイル/ネットワークに触れられるボットには、**最新世代の最高tierモデル**を使用してください。
- **古い/弱い/小さいtier** を、ツール有効agentや信頼できない受信箱に使わないでください。プロンプトインジェクションリスクが高すぎます。
- やむを得ず小さいモデルを使う場合は、**爆発半径を減らしてください**（読み取り専用ツール、強いsandboxing、最小限のファイルシステムアクセス、厳格なallowlist）。
- 小さいモデルを使う場合は、**全セッションでsandboxingを有効にし**、入力が厳密に管理されていない限り **web_search/web_fetch/browser を無効化**してください。
- 信頼できる入力のみでツールなしのチャット専用個人アシスタントなら、小さいモデルでも通常は問題ありません。

## グループでのreasoningと冗長出力

`/reasoning`, `/verbose`, `/trace` は、公開チャンネル向けではない内部reasoning、ツール出力、またはPlugin診断を露出させる可能性があります。グループ設定では、これらを**デバッグ専用**として扱い、明示的に必要な場合を除いてオフのままにしてください。

ガイダンス:

- 公開ルームでは `/reasoning`, `/verbose`, `/trace` を無効に保つ。
- 有効にするなら、信頼されたDMまたは厳密に管理されたルームでのみ行う。
- verbose や trace 出力には、ツール引数、URL、Plugin診断、モデルが見たデータが含まれ得ることを忘れないでください。

## 設定ハードニング例

### ファイル権限

Gatewayホスト上のconfig + state は非公開に保ってください。

- `~/.openclaw/openclaw.json`: `600`（ユーザーのみ読み書き）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` は、これらの権限が緩い場合に警告し、厳格化を提案できます。

### ネットワーク露出（bind、port、firewall）

Gatewayは**WebSocket + HTTP** を単一ポートで多重化します。

- デフォルト: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

このHTTP面には、Control UIとcanvas hostが含まれます。

- Control UI（SPA assets）（デフォルトベースパス `/`）
- Canvas host: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意HTML/JS。信頼できないコンテンツとして扱ってください）

通常のブラウザーでcanvasコンテンツを読み込む場合は、他の信頼できないWebページと同様に扱ってください。

- canvas hostを信頼できないネットワーク/ユーザーに露出させない。
- 影響を完全に理解していない限り、canvasコンテンツを特権Web面と同じoriginで共有させない。

Bind mode はGatewayの待ち受け場所を制御します。

- `gateway.bind: "loopback"`（デフォルト）: ローカルクライアントのみ接続可能。
- 非loopback bind（`"lan"`, `"tailnet"`, `"custom"`）は攻撃面を広げます。これらは、gateway auth（共有token/password または正しく設定された non-loopback trusted proxy）と実際のfirewallがある場合にのみ使ってください。

経験則:

- LAN bindよりTailscale Serveを優先する（ServeならGatewayはloopbackのままで、アクセス制御はTailscaleが担当する）。
- どうしてもLANにbindする必要がある場合は、source IPの厳格なallowlistにfirewallで制限し、広くポートフォワードしない。
- 認証なしで `0.0.0.0` にGatewayを露出させない。

### UFW付きDockerポート公開

VPS上でDockerとともにOpenClawを動かす場合、公開されたコンテナポート（`-p HOST:CONTAINER` または Compose `ports:`）は、ホストの `INPUT` ルールだけでなく、Dockerのforwardingチェーンを通ることを忘れないでください。

Dockerトラフィックをfirewallポリシーに合わせるには、`DOCKER-USER` でルールを強制してください（このチェーンはDocker自身のacceptルールより前に評価されます）。多くの現代的なディストリでは、`iptables`/`ip6tables` は `iptables-nft` フロントエンドを使い、これらのルールは引き続きnftablesバックエンドに適用されます。

最小allowlist例（IPv4）:

```bash
# /etc/ufw/after.rules（独立した *filter セクションとして追加）
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

IPv6には別のテーブルがあります。Docker IPv6が有効なら、`/etc/ufw/after6.rules` に対応するポリシーを追加してください。

docsスニペットで `eth0` のようなインターフェース名をハードコードしないでください。インターフェース名はVPSイメージごとに異なり（`ens3`, `enp*` など）、不一致によりdenyルールが意図せずスキップされることがあります。

リロード後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

期待される外部公開ポートは、意図して公開したものだけです（ほとんどの構成では SSH + reverse proxy のポート）。

### mDNS/Bonjour discovery

Gatewayは、ローカルデバイス検出のために、mDNS（`_openclaw-gw._tcp`、ポート5353）で自身の存在をブロードキャストします。full modeでは、これに運用詳細を露出し得るTXTレコードが含まれます。

- `cliPath`: CLIバイナリの完全なファイルシステムパス（ユーザー名とインストール場所を露出）
- `sshPort`: ホスト上のSSH利用可否を広告
- `displayName`, `lanHost`: ホスト名情報

**運用上のセキュリティ上の考慮事項:** インフラ詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても偵察が容易になります。ファイルシステムパスやSSH可用性のような「無害」に見える情報でも、攻撃者が環境を把握する助けになります。

**推奨事項:**

1. **Minimal mode**（デフォルト、公開されるGatewayに推奨）: mDNSブロードキャストから機密フィールドを省略する

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス検出が不要なら**完全に無効化**する

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Full mode**（明示的オプトイン）: TXTレコードに `cliPath` + `sshPort` を含める

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替）: 設定変更なしでmDNSを無効にするには `OPENCLAW_DISABLE_BONJOUR=1` を設定する

minimal mode では、Gatewayはデバイス検出に十分な情報（`role`, `gatewayPort`, `transport`）を引き続きブロードキャストしますが、`cliPath` と `sshPort` は省略します。CLIパス情報が必要なアプリは、代わりに認証済みWebSocket接続経由で取得できます。

### Gateway WebSocketをロックダウンする（ローカル認証）

Gateway認証はデフォルトで**必須**です。有効なGateway認証経路が設定されていない場合、GatewayはWebSocket接続を拒否します（fail‑closed）。

オンボーディングはデフォルトでトークンを生成するため（loopbackでも）、ローカルクライアントも認証が必要です。

**すべて**のWSクライアントに認証を要求するには、トークンを設定してください。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

doctorで生成できます: `openclaw doctor --generate-gateway-token`。

注: `gateway.remote.token` / `.password` はクライアント認証情報ソースです。これらだけではローカルWSアクセスを保護しません。  
ローカル呼び出し経路は、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。  
`gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示設定されていて未解決の場合、解決は fail closed します（リモートフォールバックで隠蔽されません）。  
任意で、`wss://` を使う場合は `gateway.remote.tlsFingerprint` でリモートTLSを固定できます。  
平文 `ws://` はデフォルトでloopback専用です。信頼されたプライベートネットワーク経路では、クライアントプロセス上で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を非常用として設定してください。これは意図的にプロセス環境変数限定であり、`openclaw.json` の設定キーではありません。  
モバイルペアリングおよびAndroidの手動/スキャンによるGateway経路はさらに厳格です。平文はloopbackでは受け付けられますが、private-LAN、link-local、`.local`、dotless hostname では、信頼されたプライベートネットワーク平文経路に明示的オプトインしない限りTLSが必要です。

ローカルデバイスペアリング:

- 同一ホストクライアントを滑らかにするため、直接のローカル loopback 接続に対してはデバイスペアリングは自動承認されます。
- OpenClawには、信頼された共有secretヘルパーフロー向けの、狭い backend/container-local self-connect 経路もあります。
- Tailnet および LAN 接続は、同一ホストの tailnet bind を含めて、ペアリング上はリモートとして扱われ、引き続き承認が必要です。
- loopbackリクエスト上のforwarded-header証拠は、loopbackローカリティの資格を失わせます。metadata-upgrade auto-approval は厳密に狭い範囲に限定されています。両方のルールについては [Gateway pairing](/ja-JP/gateway/pairing) を参照してください。

認証モード:

- `gateway.auth.mode: "token"`: 共有bearer token（ほとんどの構成に推奨）。
- `gateway.auth.mode: "password"`: パスワード認証（env経由設定推奨: `OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware reverse proxy がユーザーを認証し、ヘッダー経由でアイデンティティを渡すことを信頼する（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。

ローテーションチェックリスト（token/password）:

1. 新しいsecretを生成/設定する（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）。
2. Gatewayを再起動する（またはGatewayを監督しているmacOSアプリを再起動する）。
3. リモートクライアントを更新する（Gatewayを呼び出すマシン上の `gateway.remote.token` / `.password`）。
4. 古い認証情報では接続できないことを確認する。

### Tailscale Serveアイデンティティヘッダー

`gateway.auth.allowTailscale` が `true` のとき（Serveではデフォルト）、OpenClawはControl UI/WebSocket認証のためにTailscale Serveのアイデンティティヘッダー（`tailscale-user-login`）を受け付けます。OpenClawは、`x-forwarded-for` アドレスをローカルTailscaleデーモン（`tailscale whois`）経由で解決し、それをヘッダーと照合してアイデンティティを検証します。これは、Tailscaleによって注入された `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` を含み、かつ loopback に到達するリクエストでのみ発動します。  
この非同期アイデンティティチェック経路では、同じ `{scope, ip}` に対する失敗した試行は、limiter が失敗を記録する前に直列化されます。そのため、1つのServeクライアントからの同時の不正再試行は、2件の単純な不一致として競合通過するのではなく、2回目を即座にロックアウトできます。

HTTP APIエンドポイント（たとえば `/v1/*`, `/tools/invoke`, `/api/channels/*`）は、Tailscaleアイデンティティヘッダー認証を**使用しません**。これらは引き続き、Gatewayで設定されたHTTP認証モードに従います。

重要な境界注記:

- Gateway HTTP bearer auth は、事実上、全権限のoperatorアクセスです。
- `/v1/chat/completions`, `/v1/responses`, `/api/channels/*` を呼び出せる認証情報は、そのGatewayに対するフルアクセスoperator secretとして扱ってください。
- OpenAI互換HTTP面では、共有secret bearer auth は、agentターンに対してフルのデフォルトoperatorスコープ（`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`）とownerセマンティクスを復元します。より狭い `x-openclaw-scopes` 値では、この共有secret経路は縮小されません。
- HTTP上のリクエスト単位スコープセマンティクスが適用されるのは、trusted proxy auth やプライベートingress上の `gateway.auth.mode="none"` のような identity-bearing mode からのリクエストの場合のみです。
- それらの identity-bearing mode では、`x-openclaw-scopes` を省略すると通常のoperatorデフォルトスコープ集合にフォールバックします。より狭いスコープ集合が必要な場合は、ヘッダーを明示送信してください。
- `/tools/invoke` も同じ共有secretルールに従います: token/password bearer auth はそこでフルoperatorアクセスとして扱われ、identity-bearing mode では引き続き宣言スコープを尊重します。
- これらの認証情報を信頼されていない呼び出し元と共有しないでください。信頼境界ごとに別Gatewayを優先してください。

**信頼前提:** tokenless Serve auth は、Gatewayホストが信頼されていることを前提とします。ホスト上の敵対的な同一ホストプロセスからの保護として扱わないでください。Gatewayホスト上で信頼できないローカルコードが動く可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、`gateway.auth.mode: "token"` または `"password"` による明示的な共有secret認証を要求してください。

**セキュリティルール:** 自前のreverse proxyからこれらのヘッダーを転送しないでください。Gatewayの前段でTLS終端やproxyを行う場合は、`gateway.auth.allowTailscale` を無効にし、代わりに共有secret認証（`gateway.auth.mode: "token"` または `"password"`）または [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を使用してください。

Trusted proxies:

- Gatewayの前段でTLS終端する場合は、proxy IP を `gateway.trustedProxies` に設定してください。
- OpenClawは、そのIPからの `x-forwarded-for`（または `x-real-ip`）を信頼し、ローカルペアリングチェックやHTTP auth/local チェックのクライアントIP判定に使います。
- proxyが `x-forwarded-for` を**上書き**し、Gatewayポートへの直接アクセスを遮断するようにしてください。

参照: [Tailscale](/ja-JP/gateway/tailscale) と [Web overview](/ja-JP/web)。

### Nodeホスト経由のブラウザー制御（推奨）

Gatewayがリモートで、browserが別マシン上で動いている場合は、そのbrowserマシン上で **node host** を実行し、Gatewayがbrowserアクションをproxyするようにしてください（[Browser tool](/ja-JP/tools/browser) を参照）。Nodeペアリングは管理者アクセスとして扱ってください。

推奨パターン:

- Gatewayとnode hostを同じtailnet（Tailscale）上に保つ。
- Nodeを意図的にペアリングし、browser proxy routing が不要なら無効にする。

避けるべきこと:

- relay/control ポートをLANや公開インターネットへ露出させること。
- browser control エンドポイントにTailscale Funnelを使うこと（公開露出）。

### ディスク上のsecret

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下のものは、secretまたは個人データを含み得ると考えてください。

- `openclaw.json`: configにはトークン（gateway、remote gateway）、provider設定、allowlist が含まれることがあります。
- `credentials/**`: チャンネル認証情報（例: WhatsApp creds）、pairing allowlist、旧来OAuth import。
- `agents/<agentId>/agent/auth-profiles.json`: APIキー、トークンプロファイル、OAuthトークン、任意の `keyRef`/`tokenRef`。
- `secrets.json`（任意）: `file` SecretRef provider が使うファイルベースsecretペイロード（`secrets.providers`）。
- `agents/<agentId>/agent/auth.json`: 旧来互換ファイル。静的 `api_key` エントリは発見時に除去されます。
- `agents/<agentId>/sessions/**`: セッショントランスクリプト（`*.jsonl`）+ ルーティングメタデータ（`sessions.json`）。個人的なメッセージやツール出力を含み得ます。
- バンドル済みPluginパッケージ: インストール済みPlugin（およびその `node_modules/`）。
- `sandboxes/**`: ツールsandboxワークスペース。sandbox内で読み書きしたファイルのコピーが蓄積し得ます。

ハードニングのヒント:

- 権限を厳格に保つ（ディレクトリは `700`、ファイルは `600`）。
- Gatewayホストではフルディスク暗号化を使う。
- ホストを共有する場合は、Gateway専用のOSユーザーアカウントを優先する。

### ワークスペース `.env` ファイル

OpenClawはagentやツール向けにワークスペースローカルの `.env` ファイルを読み込みますが、これらのファイルがGatewayランタイム制御を黙って上書きすることは許しません。

- `OPENCLAW_*` で始まるキーは、信頼されていないワークスペース `.env` ファイルからはブロックされます。
- Matrix、Mattermost、IRC、Synology Chat 向けのチャンネルendpoint設定も、ワークスペース `.env` からの上書きは禁止されます。そのため、cloneしたワークスペースが、ローカルendpoint設定経由でバンドル済みconnectorトラフィックをリダイレクトすることはできません。endpoint envキー（`MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL` など）は、ワークスペース読み込み `.env` ではなく、Gatewayプロセス環境または `env.shellEnv` から来る必要があります。
- このブロックは fail-closed です。将来のリリースで新しいランタイム制御変数が追加されても、それがチェックイン済みや攻撃者提供の `.env` から継承されることはありません。キーは無視され、Gatewayは自身の値を維持します。
- 信頼されたプロセス/OS環境変数（Gateway自身のshell、launchd/systemd unit、app bundle）は引き続き適用されます。これは `.env` ファイル読み込みのみを制限します。

理由: ワークスペース `.env` ファイルは、しばしばagentコードの隣に置かれ、誤ってコミットされたり、ツールによって書き込まれたりします。`OPENCLAW_*` 接頭辞全体をブロックすることで、後で新しい `OPENCLAW_*` フラグが追加されても、ワークスペース状態から黙って継承されることは決してありません。

### ログとトランスクリプト（マスキングと保持）

ログやトランスクリプトは、アクセス制御が正しくても機密情報を漏らし得ます。

- Gatewayログには、ツールサマリー、エラー、URLが含まれ得ます。
- セッショントランスクリプトには、貼り付けられたsecret、ファイル内容、コマンド出力、リンクが含まれ得ます。

推奨事項:

- ツールサマリーのマスキングを有効のままにする（`logging.redactSensitive: "tools"`; デフォルト）。
- `logging.redactPatterns` で環境固有のパターン（トークン、ホスト名、内部URL）を追加する。
- 診断共有時は、生ログより `openclaw status --all`（貼り付け可能、secretマスク済み）を優先する。
- 長期保持が不要なら、古いセッショントランスクリプトやログファイルは削除する。

詳細: [Logging](/ja-JP/gateway/logging)

### DM: デフォルトでpairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### グループ: どこでもmention必須

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

### 番号を分ける（WhatsApp, Signal, Telegram）

電話番号ベースのチャンネルでは、AIを個人番号とは別の電話番号で運用することを検討してください。

- 個人番号: 会話は非公開のまま
- ボット番号: AIが適切な境界付きで処理

### 読み取り専用モード（sandbox と tools 経由）

次を組み合わせることで、読み取り専用プロファイルを構築できます:

- `agents.defaults.sandbox.workspaceAccess: "ro"`（またはワークスペースアクセスなしなら `"none"`）
- `write`, `edit`, `apply_patch`, `exec`, `process` などをブロックするツールallow/denyリスト

追加のハードニングオプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandboxingがオフでも、`apply_patch` がワークスペースディレクトリ外へ書き込み/削除できないようにします。`apply_patch` に意図的にワークスペース外のファイルを触らせたい場合にのみ `false` に設定してください。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` パスと、ネイティブprompt画像の自動ロードパスをワークスペースディレクトリに制限します（現在絶対パスを許可していて、単一のガードレールが欲しい場合に有用です）。
- ファイルシステムrootは狭く保つ: agentワークスペース/sandboxワークスペースにホームディレクトリのような広いrootを使わないでください。広いrootは、ローカルの機密ファイル（たとえば `~/.openclaw` 配下のstate/config）をファイルシステムツールへ露出する可能性があります。

### セキュアなベースライン（コピー&ペースト）

Gatewayを非公開に保ち、DMでpairingを要求し、常時応答のグループボットを避ける「安全なデフォルト」設定の一例:

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

ツール実行も「より安全なデフォルト」にしたい場合は、非owner agentに対してsandbox + 危険ツール拒否を追加してください（以下の「Per-agent access profiles」の例を参照）。

チャット駆動agentターン向けの組み込みベースライン: non-owner送信者は `cron` または `gateway` ツールを使えません。

## Sandboxing（推奨）

専用ドキュメント: [Sandboxing](/ja-JP/gateway/sandboxing)

補完的な2つのアプローチ:

- **Gateway全体をDockerで実行する**（container境界）: [Docker](/ja-JP/install/docker)
- **ツールsandbox**（`agents.defaults.sandbox`、host gateway + sandbox分離ツール。デフォルトbackendはDocker）: [Sandboxing](/ja-JP/gateway/sandboxing)

注: agent間アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）または、より厳しいセッション単位分離のために `"session"` のままにしてください。`scope: "shared"` は単一のcontainer/workspaceを使用します。

sandbox内のagentワークスペースアクセスも検討してください。

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）はagentワークスペースを利用不可にし、ツールは `~/.openclaw/sandboxes` 配下のsandboxワークスペースに対して実行されます
- `agents.defaults.sandbox.workspaceAccess: "ro"` はagentワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` はagentワークスペースを `/workspace` に読み書き可能でマウントします
- 追加の `sandbox.docker.binds` は、正規化・canonicalizeされたソースパスに対して検証されます。親symlinkトリックやcanonical home aliasも、それらが `/etc`, `/var/run`, OSホーム配下のcredentialsディレクトリのようなブロックrootに解決される場合は引き続き fail closed します。

重要: `tools.elevated` は、sandbox外でexecを実行するグローバルベースラインのescape hatchです。実効hostはデフォルトで `gateway`、exec targetが `node` に設定されている場合は `node` です。`tools.elevated.allowFrom` は厳格に保ち、見知らぬ相手には有効化しないでください。さらにagentごとに `agents.list[].tools.elevated` でelevatedを制限できます。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

### サブagent委譲のガードレール

セッションツールを許可する場合、委譲されたサブagent実行も別の境界判断として扱ってください。

- agentが本当に委譲を必要としない限り `sessions_spawn` を拒否する。
- `agents.defaults.subagents.allowAgents` と、agentごとの `agents.list[].subagents.allowAgents` 上書きは、既知の安全な対象agentに限定する。
- sandboxを維持すべきワークフローでは、`sessions_spawn` を `sandbox: "require"` で呼び出す（デフォルトは `inherit`）。
- `sandbox: "require"` は、対象の子ランタイムがsandbox化されていない場合に即失敗します。

## ブラウザー制御のリスク

ブラウザー制御を有効にすると、モデルは実ブラウザーを操作できます。  
そのブラウザープロファイルにログイン済みセッションがある場合、モデルはそれらのアカウントやデータにアクセスできます。ブラウザープロファイルは**機密状態**として扱ってください。

- agent専用プロファイルを優先する（デフォルトの `openclaw` プロファイル）。
- agentに個人用の常用プロファイルを向けない。
- sandbox化されたagentでは、信頼していない限りhost browser制御は無効にする。
- スタンドアロンのloopback browser control APIは、共有secret認証（gateway token bearer auth または gateway password）のみを受け付けます。trusted-proxy や Tailscale Serve のアイデンティティヘッダーは消費しません。
- browserダウンロードは信頼できない入力として扱い、分離されたダウンロードディレクトリを優先する。
- 可能なら、agentプロファイルではbrowser sync/password managerを無効にする（爆発半径を縮小）。
- リモートGatewayでは、「browser control」は、そのプロファイルが到達できるものに対する「operator access」と同等だと考える。
- GatewayとNode hostはtailnet専用に保ち、browser controlポートをLANや公開インターネットへ露出させない。
- 不要な場合はbrowser proxy routingを無効にする（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP existing-session mode は**より安全ではありません**。そのhost Chromeプロファイルで到達可能なものに対して、あなたとして振る舞えます。

### Browser SSRFポリシー（デフォルトで厳格）

OpenClawのbrowser navigationポリシーはデフォルトで厳格です。明示的にオプトインしない限り、private/internal 宛先はブロックされたままです。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定であり、browser navigation は private/internal/special-use 宛先をブロックしたままです。
- 旧来エイリアス: `browser.ssrfPolicy.allowPrivateNetwork` も互換性のため引き続き受け付けられます。
- オプトインモード: private/internal/special-use 宛先を許可するには `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的例外として `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック対象名を含む完全一致host例外）を使用します。
- Redirectベースのpivotを減らすため、navigationはリクエスト前にチェックされ、navigation後の最終 `http(s)` URL に対してもベストエフォートで再チェックされます。

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

## Agentごとのアクセスプロファイル（マルチagent）

マルチagentルーティングでは、各agentごとに独自のsandbox + ツールポリシーを持てます。これを使って、agentごとに **フルアクセス**、**読み取り専用**、**アクセスなし** を与えてください。詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

一般的なユースケース:

- Personal agent: フルアクセス、sandboxなし
- Family/work agent: sandbox化 + 読み取り専用ツール
- Public agent: sandbox化 + ファイルシステム/shellツールなし

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

### 例: ファイルシステム/shellアクセスなし（provider messagingは許可）

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
        // セッションツールはtranscriptから機密データを露出する可能性があります。デフォルトではOpenClawはこれらのツールを
        // 現在のセッション + 生成されたサブagentセッションに制限していますが、必要ならさらに絞れます。
        // `tools.sessions.visibility` は設定リファレンスを参照してください。
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

## インシデント対応

AIが何か悪いことをした場合:

### 封じ込める

1. **止める:** macOSアプリ（Gatewayを監督している場合）を停止するか、`openclaw gateway` プロセスを終了する。
2. **露出を閉じる:** 何が起きたか理解するまで、`gateway.bind: "loopback"` に設定する（またはTailscale Funnel/Serveを無効にする）。
3. **アクセスを凍結する:** 危険なDM/グループを `dmPolicy: "disabled"` に切り替える / mention必須にする。全許可の `"*"` エントリがあるなら削除する。

### ローテーションする（secretが漏れたなら侵害されたと仮定）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションし、再起動する。
2. Gatewayを呼び出せるすべてのマシン上の remote client secret（`gateway.remote.token` / `.password`）をローテーションする。
3. provider/API認証情報（WhatsApp creds、Slack/Discordトークン、`auth-profiles.json` 内のmodel/APIキー、使用している場合は暗号化secretペイロード値）をローテーションする。

### 監査する

1. Gatewayログを確認する: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連するtranscriptを確認する: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近の設定変更を確認する（アクセスを広げ得るもの: `gateway.bind`, `gateway.auth`, dm/group policies, `tools.elevated`, Plugin変更）。
4. `openclaw security audit --deep` を再実行し、重大な指摘が解消されたことを確認する。

### 報告用に収集する

- タイムスタンプ、GatewayホストOS + OpenClawバージョン
- セッショントランスクリプト + 短いログ末尾（マスク後）
- 攻撃者が送った内容 + agentが行ったこと
- Gatewayがloopback以外へ露出していたか（LAN/Tailscale Funnel/Serve）

## detect-secrets によるsecretスキャン

CIは `secrets` ジョブで `detect-secrets` pre-commit hook を実行します。  
`main` へのpushでは常に全ファイルスキャンを実行します。Pull requestでは、base commitが利用可能なら変更ファイルのみの高速経路を使い、そうでなければ全ファイルスキャンにフォールバックします。失敗した場合、baselineにまだ入っていない新しい候補があります。

### CIが失敗した場合

1. ローカルで再現する:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ツールを理解する:
   - pre-commit内の `detect-secrets` は、リポジトリのbaselineとexcludeを使って `detect-secrets-hook` を実行します。
   - `detect-secrets audit` は対話レビューを開き、各baseline項目を実在secretか誤検知かとしてマークします。
3. 実在secretなら: ローテーション/削除し、再スキャンしてbaselineを更新する。
4. 誤検知なら: 対話auditを実行して false とマークする:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しいexcludeが必要なら、それを `.detect-secrets.cfg` に追加し、対応する `--exclude-files` / `--exclude-lines` フラグでbaselineを再生成する（設定ファイルは参照専用で、detect-secretsは自動では読みません）。

意図した状態を反映したら、更新済み `.secrets.baseline` をコミットしてください。

## セキュリティ問題の報告

OpenClawに脆弱性を見つけましたか？ 責任ある形で報告してください。

1. メール: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開しないでください
3. 希望する場合は匿名を優先しますが、そうでなければクレジットします
