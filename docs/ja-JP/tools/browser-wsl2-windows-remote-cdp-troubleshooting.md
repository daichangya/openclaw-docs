---
read_when:
    - Chrome は Windows 上にあり、OpenClaw Gateway を WSL2 で実行しているとき
    - WSL2 と Windows をまたいで、ブラウザー/Control UI のエラーが重なって発生しているとき
    - 分離ホスト構成で、host-local Chrome MCP と生のリモート CDP のどちらを使うか判断するとき
summary: WSL2 Gateway + Windows Chrome のリモート CDP を層ごとにトラブルシュートする
title: WSL2 + Windows + リモート Chrome CDP のトラブルシューティング
x-i18n:
    generated_at: "2026-04-05T12:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# WSL2 + Windows + リモート Chrome CDP のトラブルシューティング

このガイドは、次のような一般的な分離ホスト構成を対象としています。

- OpenClaw Gateway は WSL2 内で動作する
- Chrome は Windows 上で動作する
- ブラウザー制御は WSL2/Windows の境界をまたぐ必要がある

また、[issue #39369](https://github.com/openclaw/openclaw/issues/39369) にある層状の障害パターンも扱います。複数の独立した問題が同時に発生することがあり、その結果、実際には別の層が壊れているのに、最初に見える層が壊れているように見えることがあります。

## まず正しいブラウザーモードを選ぶ

有効なパターンは 2 つあります。

### オプション 1: WSL2 から Windows への生のリモート CDP

WSL2 から Windows の Chrome CDP エンドポイントを指すリモートブラウザープロファイルを使います。

次の場合に選んでください。

- Gateway は WSL2 内に置いたままにする
- Chrome は Windows 上で動作する
- ブラウザー制御で WSL2/Windows の境界をまたぐ必要がある

### オプション 2: host-local Chrome MCP

`existing-session` / `user` は、Gateway 自体が Chrome と同じホストで動作している場合にのみ使ってください。

次の場合に選んでください。

- OpenClaw と Chrome が同じマシン上にある
- ローカルのログイン済みブラウザー状態を使いたい
- ホスト間のブラウザー転送は不要
- `responsebody`、PDF
  エクスポート、ダウンロードのインターセプト、バッチアクションのような、高度な managed/raw-CDP 専用ルートは不要

WSL2 Gateway + Windows Chrome では、生のリモート CDP を優先してください。Chrome MCP は host-local であり、WSL2 から Windows へのブリッジではありません。

## 動作アーキテクチャ

参照構成:

- WSL2 は `127.0.0.1:18789` で Gateway を動かす
- Windows は通常のブラウザーで `http://127.0.0.1:18789/` の Control UI を開く
- Windows の Chrome はポート `9222` で CDP エンドポイントを公開する
- WSL2 からその Windows CDP エンドポイントに到達できる
- OpenClaw は、WSL2 から到達可能なアドレスを指すブラウザープロファイルを使う

## この構成が分かりにくい理由

複数の障害が重なって発生することがあります。

- WSL2 から Windows の CDP エンドポイントに到達できない
- Control UI が安全でないオリジンから開かれている
- `gateway.controlUi.allowedOrigins` がページのオリジンと一致しない
- token または pairing が不足している
- ブラウザープロファイルが誤ったアドレスを指している

そのため、1 つの層を修正しても、別のエラーがまだ見えたままになることがあります。

## Control UI に関する重要なルール

UI を Windows から開く場合は、意図的に HTTPS を構成していない限り、Windows の localhost を使ってください。

使うもの:

`http://127.0.0.1:18789/`

Control UI でデフォルトとして LAN IP を使わないでください。LAN または tailnet のアドレス上での平文 HTTP は、CDP 自体とは無関係な insecure-origin/device-auth の挙動を引き起こすことがあります。[Control UI](/web/control-ui) を参照してください。

## 層ごとに検証する

上から下へ進めてください。飛ばさないでください。

### レイヤー 1: Windows 上で Chrome が CDP を提供していることを確認する

リモートデバッグを有効にして Windows 上で Chrome を起動します。

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows から、まず Chrome 自体を確認します。

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

これが Windows 上で失敗するなら、まだ OpenClaw の問題ではありません。

### レイヤー 2: WSL2 からその Windows エンドポイントに到達できることを確認する

WSL2 から、`cdpUrl` で使う予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良い結果:

- `/json/version` は Browser / Protocol-Version メタデータを含む JSON を返す
- `/json/list` は JSON を返す（ページが開かれていなければ空配列でも可）

これが失敗する場合:

- Windows がまだそのポートを WSL2 に公開していない
- WSL2 側にとってアドレスが間違っている
- firewall / port forwarding / local proxying がまだ足りない

OpenClaw の設定に触る前に、先にこれを直してください。

### レイヤー 3: 正しいブラウザープロファイルを設定する

生のリモート CDP では、WSL2 から到達可能なアドレスを OpenClaw に指定します。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

メモ:

- Windows 上でだけ動くものではなく、WSL2 から到達可能なアドレスを使ってください
- 外部管理ブラウザーでは `attachOnly: true` を維持してください
- `cdpUrl` には `http://`、`https://`、`ws://`、`wss://` を使えます
- OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使ってください
- browser provider が直接の DevTools ソケット URL を提供する場合にのみ WS(S) を使ってください
- OpenClaw の成功を期待する前に、同じ URL を `curl` でテストしてください

### レイヤー 4: Control UI 層を別個に検証する

Windows から UI を開きます。

`http://127.0.0.1:18789/`

そのうえで次を確認します。

- ページオリジンが `gateway.controlUi.allowedOrigins` の期待と一致している
- token 認証または pairing が正しく設定されている
- 実際は Control UI の認証問題なのに、ブラウザー問題としてデバッグしていない

参考ページ:

- [Control UI](/web/control-ui)

### レイヤー 5: エンドツーエンドのブラウザー制御を確認する

WSL2 から:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

良い結果:

- タブが Windows Chrome で開く
- `openclaw browser tabs` が対象を返す
- その後の操作（`snapshot`、`screenshot`、`navigate`）が同じプロファイルから動作する

## よくある誤解を招くエラー

各メッセージを、その層固有の手がかりとして扱ってください。

- `control-ui-insecure-auth`
  - UI オリジン / セキュアコンテキストの問題であり、CDP 転送の問題ではない
- `token_missing`
  - 認証設定の問題
- `pairing required`
  - デバイス承認の問題
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 から設定された `cdpUrl` に到達できない
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP エンドポイントは応答したが、DevTools WebSocket はまだ開けなかった
- リモートセッション後に viewport / dark-mode / locale / offline の上書き状態が残る
  - `openclaw browser stop --browser-profile remote` を実行する
  - これにより、Gateway や外部ブラウザーを再起動せずに、アクティブな制御セッションを閉じて Playwright/CDP のエミュレーション状態を解放します
- `gateway timeout after 1500ms`
  - 多くの場合、依然として CDP の到達性の問題か、遅い/到達不能なリモートエンドポイント
- `No Chrome tabs found for profile="user"`
  - host-local のタブが利用できないのに、ローカル Chrome MCP プロファイルが選ばれている

## 迅速なトリアージチェックリスト

1. Windows: `curl http://127.0.0.1:9222/json/version` は動きますか？
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` は動きますか？
3. OpenClaw の設定: `browser.profiles.<name>.cdpUrl` は、その正確な WSL2 到達可能アドレスを使っていますか？
4. Control UI: LAN IP ではなく `http://127.0.0.1:18789/` を開いていますか？
5. 生のリモート CDP ではなく、WSL2 と Windows をまたいで `existing-session` を使おうとしていませんか？

## 実践的な要点

この構成は、通常は成立します。難しいのは、ブラウザー転送、Control UI のオリジンセキュリティ、token/pairing のそれぞれが独立して失敗しうる一方で、ユーザー側からは似たように見えることです。

迷ったときは:

- まず Windows の Chrome エンドポイントをローカルで確認する
- 次に同じエンドポイントを WSL2 から確認する
- その後で初めて OpenClaw の設定や Control UI 認証をデバッグする
