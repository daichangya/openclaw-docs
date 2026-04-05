---
read_when:
    - リモートmac制御をセットアップまたはデバッグする場合
summary: SSH経由でリモートのOpenClaw gatewayを制御するためのmacOSアプリのフロー
title: リモート制御
x-i18n:
    generated_at: "2026-04-05T12:51:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# リモートOpenClaw（macOS ⇄ リモートホスト）

このフローでは、macOSアプリが別ホスト（デスクトップ/サーバー）上で動作するOpenClaw gatewayの完全なリモートコントロールとして機能します。これはアプリの**Remote over SSH**（remote run）機能です。ヘルスチェック、Voice Wake転送、Web Chatを含むすべての機能は、_Settings → General_の同じリモートSSH設定を再利用します。

## モード

- **Local（このMac）**: すべてがラップトップ上で実行されます。SSHは関与しません。
- **Remote over SSH（デフォルト）**: OpenClawコマンドはリモートホスト上で実行されます。macアプリは、`-o BatchMode`と選択したidentity/key、およびローカルポートフォワードを使ってSSH接続を開きます。
- **Remote direct（ws/wss）**: SSHトンネルは使いません。macアプリはgateway URLへ直接接続します（たとえばTailscale Serveや公開HTTPS reverse proxy経由）。

## リモート転送

リモートモードは2つの転送方式をサポートします:

- **SSHトンネル**（デフォルト）: `ssh -N -L ...`を使ってgatewayポートをlocalhostへ転送します。トンネルはloopbackなので、gatewayにはノードのIPが`127.0.0.1`として見えます。
- **Direct（ws/wss）**: gateway URLへ直接接続します。gatewayには実際のクライアントIPが見えます。

## リモートホスト側の前提条件

1. Node + pnpmをインストールし、OpenClaw CLIをビルド/インストールする（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルでも`openclaw`がPATH上にあることを確認する（必要に応じて`/usr/local/bin`または`/opt/homebrew/bin`へsymlinkする）。
3. キー認証でSSHを開く。LAN外でも安定して到達できるよう、**Tailscale** IPを推奨します。

## macOSアプリのセットアップ

1. _Settings → General_を開きます。
2. **OpenClaw runs**で**Remote over SSH**を選択し、次を設定します:
   - **Transport**: **SSH tunnel**または**Direct (ws/wss)**。
   - **SSH target**: `user@host`（任意で`:port`）。
     - gatewayが同じLAN上にあり、Bonjourを公開している場合は、検出リストから選んでこのフィールドを自動入力できます。
   - **Gateway URL**（Directのみ）: `wss://gateway.example.ts.net`（またはローカル/LAN用の`ws://...`）。
   - **Identity file**（高度な設定）: キーへのパス。
   - **Project root**（高度な設定）: コマンドに使うリモートcheckoutパス。
   - **CLI path**（高度な設定）: 実行可能な`openclaw`エントリポイント/バイナリへの任意のパス（公開されている場合は自動入力される）。
3. **Test remote**を押します。成功すれば、リモートの`openclaw status --json`が正しく実行されていることを意味します。失敗は通常PATH/CLIの問題です。終了コード127はCLIがリモートで見つからないことを意味します。
4. これでヘルスチェックとWeb Chatも自動的にこのSSHトンネル経由で実行されます。

## Web Chat

- **SSHトンネル**: Web Chatは転送されたWebSocket control port（デフォルト18789）経由でgatewayへ接続します。
- **Direct（ws/wss）**: Web Chatは設定済みgateway URLへ直接接続します。
- 独立したWebChat HTTPサーバーはもう存在しません。

## 権限

- リモートホストには、ローカルと同じTCC承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。そのマシンで一度オンボーディングを実行して付与してください。
- ノードは`node.list` / `node.describe`を介して自分の権限状態を公開するため、エージェントは何が利用可能か把握できます。

## セキュリティに関する注記

- リモートホストではloopback bindを優先し、SSHまたはTailscale経由で接続してください。
- SSHトンネリングは厳格なhost-key checkingを使用します。まずホストキーを信頼して、`~/.ssh/known_hosts`に存在するようにしてください。
- Gatewayを非loopbackインターフェースにbindする場合は、有効なGateway認証を必須にしてください: token、password、または`gateway.auth.mode: "trusted-proxy"`を使うID認識型reverse proxy。
- [Security](/gateway/security)と[Tailscale](/gateway/tailscale)も参照してください。

## WhatsAppログインフロー（リモート）

- **リモートホスト上で**`openclaw channels login --verbose`を実行します。スマートフォンのWhatsAppでQRをスキャンしてください。
- 認証が期限切れになった場合は、そのホスト上で再度ログインを実行してください。ヘルスチェックにはリンク問題が表示されます。

## トラブルシューティング

- **exit 127 / not found**: 非ログインシェルで`openclaw`がPATH上にありません。`/etc/paths`、シェルrc、または`/usr/local/bin`/`/opt/homebrew/bin`へのsymlinkで追加してください。
- **Health probe failed**: SSH到達性、PATH、およびBaileysがログイン済みか（`openclaw status --json`）を確認してください。
- **Web Chatが止まる**: gatewayがリモートホスト上で動作しており、転送ポートがgateway WSポートと一致していることを確認してください。UIには正常なWS接続が必要です。
- **Node IPが127.0.0.1として表示される**: SSHトンネルでは想定どおりです。gatewayに実際のクライアントIPを見せたい場合は、**Transport**を**Direct (ws/wss)**へ切り替えてください。
- **Voice Wake**: remoteモードではトリガーフレーズが自動的に転送されます。別個のforwarderは不要です。

## 通知音

スクリプトの`openclaw`と`node.invoke`から、通知ごとに音を選べます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはもうグローバルな「デフォルト音」切り替えはありません。呼び出し側がリクエストごとに音（または無音）を選択します。
