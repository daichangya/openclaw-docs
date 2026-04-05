---
read_when:
    - mac appをgatewayライフサイクルと統合している場合
summary: macOS上のGatewayライフサイクル（launchd）
title: Gateway Lifecycle
x-i18n:
    generated_at: "2026-04-05T12:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS上のGatewayライフサイクル

macOS appはデフォルトで **launchd経由でGatewayを管理**し、Gatewayを子プロセスとして起動しません。まず、設定されたポート上ですでに実行中のGatewayへの接続を試みます。到達可能なものがなければ、外部の `openclaw` CLI経由でlaunchd serviceを有効化します（埋め込みランタイムは使いません）。これにより、ログイン時の確実な自動起動と、クラッシュ時の再起動が実現されます。

子プロセスモード（appがGatewayを直接起動する方式）は、現在は**使われていません**。
UIとのより密な結合が必要な場合は、terminalでGatewayを手動実行してください。

## デフォルトの挙動（launchd）

- appは、ユーザーごとのLaunchAgent `ai.openclaw.gateway` をインストールします
  （`--profile`/`OPENCLAW_PROFILE` 使用時は `ai.openclaw.<profile>`。legacyな `com.openclaw.*` もサポートされます）。
- Local modeが有効な場合、appはLaunchAgentがロードされていることを確認し、
  必要に応じてGatewayを起動します。
- ログはlaunchdのgateway log pathに書き込まれます（Debug Settingsで確認できます）。

一般的なコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きprofileを実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

## 署名なしの開発ビルド

`scripts/restart-mac.sh --no-sign` は、署名キーがないときの高速なローカルビルド用です。launchdが署名なしのrelay binaryを指さないように、次を行います。

- `~/.openclaw/disable-launchagent` を書き込む

署名ありで `scripts/restart-mac.sh` を実行すると、このマーカーが存在する場合はこの上書きを解除します。手動でリセットするには:

```bash
rm ~/.openclaw/disable-launchagent
```

## 接続専用モード

macOS appが **launchdを一切インストールも管理もしない** ようにするには、`--attach-only`（または `--no-launchd`）を付けて起動してください。これにより `~/.openclaw/disable-launchagent` が設定され、appはすでに実行中のGatewayに接続するだけになります。同じ挙動はDebug Settingsでも切り替えられます。

## Remote mode

Remote modeでは、ローカルGatewayは決して起動しません。appは
remote hostへのSSH tunnelを使い、そのtunnel経由で接続します。

## launchdを優先する理由

- ログイン時の自動起動。
- 組み込みの再起動/KeepAliveセマンティクス。
- 予測しやすいログと監督。

将来的に本当の子プロセスモードが再び必要になった場合は、別の明示的な
開発専用モードとして文書化すべきです。
