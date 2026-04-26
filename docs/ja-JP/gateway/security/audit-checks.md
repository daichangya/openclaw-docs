---
read_when:
    - '`openclaw security audit` の出力で特定の `checkId` を見かけ、その意味を知りたい'
    - 特定の検出結果に対応する修正キー/パスが必要です
    - セキュリティ監査実行全体で重大度をトリアージしている
summary: '`openclaw security audit` が出力する checkId のリファレンスカタログ'
title: セキュリティ監査チェック
x-i18n:
    generated_at: "2026-04-26T11:31:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a5463bd1cec8382eb480cbbe1d8f8cceef0c15efc1f9124990df1e8f70b209a
    source_path: gateway/security/audit-checks.md
    workflow: 15
---

`openclaw security audit` は、`checkId` をキーとする構造化された検出結果を出力します。このページは、それらのIDのリファレンスカタログです。高レベルの脅威モデルとハードニングガイダンスについては、[Security](/ja-JP/gateway/security) を参照してください。

実運用で遭遇する可能性が高い高シグナルな `checkId` 値（網羅的ではありません）:

| `checkId`                                                     | 重大度 | 重要な理由 | 主な修正キー/パス | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | 他のユーザー/プロセスがOpenClawの状態全体を変更できる | `~/.openclaw` のファイルシステム権限 | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | グループユーザーがOpenClawの状態全体を変更できる | `~/.openclaw` のファイルシステム権限 | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | state dir が他者から読み取り可能 | `~/.openclaw` のファイルシステム権限 | yes      |
| `fs.state_dir.symlink`                                        | warn          | state dir のターゲットが別の信頼境界になる | state dir のファイルシステムレイアウト | no       |
| `fs.config.perms_writable`                                    | critical      | 他者が認証/ツールポリシー/config を変更できる | `~/.openclaw/openclaw.json` のファイルシステム権限 | yes      |
| `fs.config.symlink`                                           | warn          | symlink されたconfigファイルは書き込みで未対応であり、別の信頼境界を追加する | 通常のconfigファイルに置き換えるか、`OPENCLAW_CONFIG_PATH` を実ファイルに向ける | no       |
| `fs.config.perms_group_readable`                              | warn          | グループユーザーがconfigのtokens/settings を読める | configファイルのファイルシステム権限 | yes      |
| `fs.config.perms_world_readable`                              | critical      | config がtokens/settings を露出する可能性がある | configファイルのファイルシステム権限 | yes      |
| `fs.config_include.perms_writable`                            | critical      | config include ファイルを他者が変更できる | `openclaw.json` から参照されるincludeファイルの権限 | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | グループユーザーがincludeされたsecrets/settings を読める | `openclaw.json` から参照されるincludeファイルの権限 | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | includeされたsecrets/settings が全員から読み取り可能 | `openclaw.json` から参照されるincludeファイルの権限 | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | 他者が保存済みモデルcredentials を注入または置換できる | `agents/<agentId>/agent/auth-profiles.json` の権限 | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | 他者がAPI keys とOAuth tokens を読める | `agents/<agentId>/agent/auth-profiles.json` の権限 | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | 他者がチャネルのペアリング/credential 状態を変更できる | `~/.openclaw/credentials` のファイルシステム権限 | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | 他者がチャネルcredential 状態を読める | `~/.openclaw/credentials` のファイルシステム権限 | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | 他者がsession transcript/metadata を読める | session store の権限 | yes      |
| `fs.log_file.perms_readable`                                  | warn          | 他者が秘匿化済みとはいえ依然として機微性のあるログを読める | gatewayログファイルの権限 | yes      |
| `fs.synced_dir`                                               | warn          | iCloud/Dropbox/Drive 上のstate/config はtoken/transcript の露出範囲を広げる | config/state を同期フォルダーから移動する | no       |
| `gateway.bind_no_auth`                                        | critical      | shared secret なしでリモートbind している | `gateway.bind`, `gateway.auth.*` | no       |
| `gateway.loopback_no_auth`                                    | critical      | リバースプロキシ経由のloopback が無認証になる可能性がある | `gateway.auth.*`, proxy セットアップ | no       |
| `gateway.trusted_proxies_missing`                             | warn          | リバースプロキシheader は存在するが信頼されていない | `gateway.trustedProxies` | no       |
| `gateway.http.no_auth`                                        | warn/critical | `auth.mode="none"` で Gateway HTTP API に到達できる | `gateway.auth.mode`, `gateway.http.endpoints.*` | no       |
| `gateway.http.session_key_override_enabled`                   | info          | HTTP API 呼び出し元が `sessionKey` を上書きできる | `gateway.http.allowSessionKeyOverride` | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | HTTP API 経由で危険なツールを再有効化する | `gateway.tools.allow` | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | 高影響の Node コマンド（camera/screen/contacts/calendar/SMS）を有効化する | `gateway.nodes.allowCommands` | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | パターン風のdenyエントリはshellテキストやグループに一致しない | `gateway.nodes.denyCommands` | no       |
| `gateway.tailscale_funnel`                                    | critical      | パブリックインターネットに公開される | `gateway.tailscale.mode` | no       |
| `gateway.tailscale_serve`                                     | info          | Serve によりTailnet への公開が有効 | `gateway.tailscale.mode` | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | 非loopbackのControl UI が明示的なブラウザーorigin許可リストなしで動作している | `gateway.controlUi.allowedOrigins` | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` によりブラウザーorigin許可リストが無効になる | `gateway.controlUi.allowedOrigins` | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Host-header origin フォールバックを有効にし（DNS rebinding ハードニングを弱める） | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | insecure-auth 互換トグルが有効 | `gateway.controlUi.allowInsecureAuth` | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | デバイスidentityチェックを無効化する | `gateway.controlUi.dangerouslyDisableDeviceAuth` | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | `X-Real-IP` フォールバックを信頼すると、proxy の設定ミスで送信元IP詐称が可能になる | `gateway.allowRealIpFallback`, `gateway.trustedProxies` | no       |
| `gateway.token_too_short`                                     | warn          | 短いshared token は総当たりされやすい | `gateway.auth.token` | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | レート制限なしの公開認証は総当たりリスクを高める | `gateway.auth.rateLimit` | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | proxy identity が認証境界になる | `gateway.auth.mode="trusted-proxy"` | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy 認証で trusted proxy IPs がないのは危険 | `gateway.trustedProxies` | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy 認証ではユーザーidentity を安全に解決できない | `gateway.auth.trustedProxy.userHeader` | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy 認証が認証済みの上流ユーザーを誰でも受け入れる | `gateway.auth.trustedProxy.allowUsers` | no       |
| `checkId`                                                     | 重大度 | 重要な理由 | 主な修正キー/パス | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | このコマンド経路では、deep probe が認証 SecretRefs を解決できなかった | deep-probe 認証ソース / SecretRef の可用性 | no       |
| `gateway.probe_failed`                                        | warn/critical | live Gateway probe が失敗した | gateway の到達性/認証 | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | mDNS full mode がローカルネットワーク上で `cliPath`/`sshPort` メタデータを通知する | `discovery.mdns.mode`, `gateway.bind` | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | insecure/dangerous なdebug flags がいずれか有効 | 複数キー（詳細は検出結果を参照） | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | Gateway password がconfigに直接保存されている | `gateway.auth.password` | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | Hook bearer token がconfigに直接保存されている | `hooks.token` | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | Hook ingress token が Gateway 認証も解除してしまう | `hooks.token`, `gateway.auth.token` | no       |
| `hooks.token_too_short`                                       | warn          | hook ingress で総当たりされやすい | `hooks.token` | no       |
| `hooks.default_session_key_unset`                             | warn          | Hook エージェント実行が、リクエストごとに生成されるsessionへ分散する | `hooks.defaultSessionKey` | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | 認証済みhook呼び出し元が、設定済みの任意のエージェントへルーティングできる | `hooks.allowedAgentIds` | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | 外部呼び出し元が sessionKey を選べる | `hooks.allowRequestSessionKey` | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | 外部session key の形に制限がない | `hooks.allowedSessionKeyPrefixes` | no       |
| `hooks.path_root`                                             | critical      | Hook path が `/` で、ingress が衝突または誤ルーティングしやすい | `hooks.path` | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Hook インストール記録が不変なnpm specs に固定されていない | hook install metadata | no       |
| `hooks.installs_missing_integrity`                            | warn          | Hook インストール記録に integrity metadata がない | hook install metadata | no       |
| `hooks.installs_version_drift`                                | warn          | Hook インストール記録がインストール済みパッケージからずれている | hook install metadata | no       |
| `logging.redact_off`                                          | warn          | 機微な値がlogs/status に漏れる | `logging.redactSensitive` | yes      |
| `browser.control_invalid_config`                              | warn          | Browser control config が実行前に無効 | `browser.*` | no       |
| `browser.control_no_auth`                                     | critical      | Browser control がtoken/password 認証なしで公開されている | `gateway.auth.*` | no       |
| `browser.remote_cdp_http`                                     | warn          | plain HTTP 上のremote CDP には転送時の暗号化がない | browser profile `cdpUrl` | no       |
| `browser.remote_cdp_private_host`                             | warn          | remote CDP が private/internal host を対象にしている | browser profile `cdpUrl`, `browser.ssrfPolicy.*` | no       |
| `sandbox.docker_config_mode_off`                              | warn          | Sandbox Docker config は存在するが非アクティブ | `agents.*.sandbox.mode` | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | 相対bind mount は予測不能に解決されることがある | `agents.*.sandbox.docker.binds[]` | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | Sandbox bind mount が、ブロック対象のsystem、credential、またはDocker socket パスを指している | `agents.*.sandbox.docker.binds[]` | no       |
| `sandbox.dangerous_network_mode`                              | critical      | Sandbox Docker network が `host` または `container:*` のnamespace-join mode を使っている | `agents.*.sandbox.docker.network` | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | Sandbox seccomp profile がコンテナ分離を弱める | `agents.*.sandbox.docker.securityOpt` | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | Sandbox AppArmor profile がコンテナ分離を弱める | `agents.*.sandbox.docker.securityOpt` | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | Sandbox browser bridge が送信元範囲制限なしで公開されている | `sandbox.browser.cdpSourceRange` | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | 既存browser container が非loopback interface 上でCDPを公開している | browser sandbox container の公開設定 | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | 既存browser container が現在のconfig-hash labels より前のもの | `openclaw sandbox recreate --browser --all` | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | 既存browser container が現在のbrowser config epoch より前のもの | `openclaw sandbox recreate --browser --all` | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` は sandbox がオフのときフェイルクローズする | `tools.exec.host`, `agents.defaults.sandbox.mode` | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | エージェントごとの `exec host=sandbox` は sandbox がオフのときフェイルクローズする | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode` | no       |
| `tools.exec.security_full_configured`                         | warn/critical | host exec が `security="full"` で実行されている | `tools.exec.security`, `agents.list[].tools.exec.security` | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | exec approvals が skill bins を暗黙に信頼している | `~/.openclaw/exec-approvals.json` | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | interpreter の許可リストにより、強制再承認なしでinline eval が許可される | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec approvals allowlist | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | `safeBins` 内のinterpreter/runtime bins が明示的profile なしで、exec リスクを広げる | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*` | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | `safeBins` 内の広範動作ツールが、低リスクstdin-filter 信頼モデルを弱める | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins` | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` に可変または危険なディレクトリが含まれる | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs` | no       |
| `skills.workspace.symlink_escape`                             | warn          | ワークスペースの `skills/**/SKILL.md` がワークスペースroot の外へ解決される（symlink-chain drift） | ワークスペース `skills/**` のファイルシステム状態 | no       |
| `plugins.extensions_no_allowlist`                             | warn          | 明示的なplugin許可リストなしでPlugins がインストールされている | `plugins.allowlist` | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Plugin index 記録が不変なnpm specs に固定されていない | plugin install metadata | no       |
| `checkId`                                                     | 重大度 | 重要な理由 | 主な修正キー/パス | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `plugins.installs_missing_integrity`                          | warn          | Plugin index 記録に integrity metadata がない | plugin install metadata | no       |
| `plugins.installs_version_drift`                              | warn          | Plugin index 記録がインストール済みパッケージからずれている | plugin install metadata | no       |
| `plugins.code_safety`                                         | warn/critical | Plugin コードスキャンが不審または危険なパターンを検出した | plugin コード / install source | no       |
| `plugins.code_safety.entry_path`                              | warn          | Plugin のentry path が隠し場所または `node_modules` 内を指している | plugin manifest `entry` | no       |
| `plugins.code_safety.entry_escape`                            | critical      | Plugin のentry がpluginディレクトリの外へ逃げている | plugin manifest `entry` | no       |
| `plugins.code_safety.scan_failed`                             | warn          | Plugin コードスキャンを完了できなかった | plugin path / scan environment | no       |
| `skills.code_safety`                                          | warn/critical | Skill installer metadata/code に不審または危険なパターンが含まれる | skill install source | no       |
| `skills.code_safety.scan_failed`                              | warn          | Skill コードスキャンを完了できなかった | skill scan environment | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | shared/public ルームから exec 有効エージェントに到達できる | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*` | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | open groups + elevated tools は高影響のprompt-injection 経路を作る | `channels.*.groupPolicy`, `tools.elevated.*` | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | open groups がsandbox/workspace ガードなしでコマンド/ファイルツールに到達できる | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | config がmulti-user に見える一方で、gateway の信頼モデルは personal-assistant である | 信頼境界を分離する、または shared-user ハードニング（`sandbox.mode`, tool deny/workspace scoping`） | no       |
| `tools.profile_minimal_overridden`                            | warn          | エージェント上書きがグローバルminimal profile を回避する | `agents.list[].tools.profile` | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | permissive なコンテキストからextension tools に到達できる | `tools.profile` + tool allow/deny | no       |
| `models.legacy`                                               | warn          | 従来のモデルファミリーがまだ設定されている | モデル選択 | no       |
| `models.weak_tier`                                            | warn          | 設定済みモデルが現在の推奨tier を下回る | モデル選択 | no       |
| `models.small_params`                                         | critical/info | 小型モデル + 安全でないツールサーフェスはinjection リスクを高める | モデル選択 + sandbox/tool policy | no       |
| `summary.attack_surface`                                      | info          | 認証、チャネル、ツール、公開状態のロールアップ要約 | 複数キー（詳細は検出結果を参照） | no       |

## 関連

- [Security](/ja-JP/gateway/security)
- [Configuration](/ja-JP/gateway/configuration)
- [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth)
