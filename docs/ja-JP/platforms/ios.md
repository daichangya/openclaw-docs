---
read_when:
    - iOSノードをペアリングまたは再接続する場合
    - ソースからiOSアプリを実行する場合
    - gatewayの検出やcanvasコマンドをデバッグする場合
summary: 'iOSノードアプリ: Gatewayへの接続、ペアリング、canvas、トラブルシューティング'
title: iOSアプリ
x-i18n:
    generated_at: "2026-04-05T12:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# iOSアプリ（ノード）

提供状況: 内部プレビュー。iOSアプリはまだ一般公開されていません。

## できること

- WebSocket経由でGatewayに接続します（LANまたはtailnet）。
- ノードcapabilityを公開します: Canvas、画面スナップショット、カメラ撮影、位置情報、Talk mode、Voice wake。
- `node.invoke` コマンドを受信し、ノード状態イベントを報告します。

## 要件

- 別のデバイスでGatewayが動作していること（macOS、Linux、またはWSL2経由のWindows）。
- ネットワーク経路:
  - Bonjour経由の同一LAN、**または**
  - ユニキャストDNS-SD経由のtailnet（ドメイン例: `openclaw.internal.`）、**または**
  - 手動のhost/port（フォールバック）。

## クイックスタート（ペアリング + 接続）

1. Gatewayを起動します:

```bash
openclaw gateway --port 18789
```

2. iOSアプリでSettingsを開き、検出されたgatewayを選択します（またはManual Hostを有効にしてhost/portを入力します）。

3. gateway hostでペアリングリクエストを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

アプリが変更された認証詳細（role/scopes/public key）でペアリングを再試行した場合、
前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に再度 `openclaw devices list` を実行してください。

4. 接続を確認します:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 公式ビルド向けのrelayベースpush

公式に配布されるiOSビルドでは、生のAPNs
トークンをgatewayに公開する代わりに、外部push relayを使用します。

Gateway側の要件:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

フローの仕組み:

- iOSアプリは、App Attestとアプリreceiptを使用してrelayに登録します。
- relayは、不透明なrelay handleと、登録スコープのsend grantを返します。
- iOSアプリは、ペアリング済みgateway identityを取得してrelay登録に含めるため、そのrelayベース登録はその特定のgatewayに委任されます。
- アプリは、そのrelayベース登録を `push.apns.register` でペアリング済みgatewayへ転送します。
- gatewayは、その保存済みrelay handleを `push.test`、バックグラウンドwake、wake nudgeに使用します。
- gatewayのrelay base URLは、公式/TestFlight iOSビルドに焼き込まれたrelay URLと一致している必要があります。
- アプリが後で別のgatewayや異なるrelay base URLを持つビルドに接続した場合、古いbindingを再利用するのではなく、relay登録を更新します。

この経路でgatewayが**不要**なもの:

- デプロイ全体で共通のrelay tokenは不要です。
- 公式/TestFlightのrelayベース送信向けに直接のAPNs keyは不要です。

想定されるオペレーターフロー:

1. 公式/TestFlight iOSビルドをインストールします。
2. gatewayで `gateway.push.apns.relay.baseUrl` を設定します。
3. アプリをgatewayにペアリングし、接続完了まで待ちます。
4. アプリは、APNs token、operator session接続、およびrelay登録成功がそろった後、自動的に `push.apns.register` を公開します。
5. その後、`push.test`、再接続wake、wake nudgeが保存済みrelayベース登録を使えるようになります。

互換性に関する注記:

- `OPENCLAW_APNS_RELAY_BASE_URL` は、引き続きgateway用の一時的なenv overrideとして機能します。

## 認証と信頼フロー

relayが存在するのは、公式iOSビルド向けにgateway上の直接APNsでは提供できない
2つの制約を強制するためです:

- Apple経由で配布された正規のOpenClaw iOSビルドだけが、ホストされたrelayを利用できます。
- gatewayは、その特定の
  gatewayとペアリングしたiOSデバイスに対してのみrelayベースのpushを送信できます。

ホップごとの流れ:

1. `iOS app -> gateway`
   - アプリはまず通常のGateway認証フローを通じてgatewayとペアリングします。
   - これにより、アプリは認証済みノードセッションと認証済みoperator sessionを取得します。
   - operator sessionは `gateway.identity.get` の呼び出しに使われます。

2. `iOS app -> relay`
   - アプリはHTTPS経由でrelay登録エンドポイントを呼び出します。
   - 登録にはApp Attest proofとアプリreceiptが含まれます。
   - relayはbundle ID、App Attest proof、Apple receiptを検証し、
     公式/本番配布経路を要求します。
   - これにより、ローカルXcode/devビルドはホストされたrelayを利用できません。ローカルビルドは
     署名されていても、relayが要求する公式Apple配布証明を満たしません。

3. `gateway identity delegation`
   - relay登録の前に、アプリは
     `gateway.identity.get` からペアリング済みgateway identityを取得します。
   - アプリは、そのgateway identityをrelay登録ペイロードに含めます。
   - relayは、その
     gateway identityに委任されたrelay handleと登録スコープsend grantを返します。

4. `gateway -> relay`
   - gatewayは、`push.apns.register` からrelay handleとsend grantを保存します。
   - `push.test`、再接続wake、wake nudge時に、gatewayは自身のデバイスidentityでsendリクエストに署名します。
   - relayは、保存済みsend grantとgateway署名の両方を、登録時に委任された
     gateway identityに対して検証します。
   - たとえ別のgatewayがそのhandleを入手したとしても、その保存済み登録を再利用することはできません。

5. `relay -> APNs`
   - relayは、公式ビルド向けの本番APNs認証情報と生のAPNs tokenを保持します。
   - gatewayは、relayベースの公式ビルドについて生のAPNs tokenを保存しません。
   - relayは、ペアリング済みgatewayを代理して最終的なpushをAPNsへ送信します。

この設計が作られた理由:

- 本番APNs認証情報をユーザーのgatewayから分離するため。
- 公式ビルドの生のAPNs tokenをgatewayに保存しないようにするため。
- ホストされたrelay利用を公式/TestFlight OpenClawビルドのみに限定するため。
- あるgatewayが、別のgatewayに属するiOSデバイスへwake pushを送るのを防ぐため。

ローカル/手動ビルドは引き続き直接APNsを使用します。relayなしでそれらの
ビルドをテストする場合、gatewayには引き続き直接のAPNs認証情報が必要です:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## 検出経路

### Bonjour（LAN）

iOSアプリは、`local.` 上の `_openclaw-gw._tcp` と、設定されている場合は同じ
広域DNS-SD検出ドメインをブラウズします。同一LAN上のgatewayは `local.` から自動表示されます。
ネットワークをまたぐ検出では、ビーコン種別を変更せずに、設定済みの広域ドメインを使用できます。

### Tailnet（ネットワーク間）

mDNSがブロックされている場合は、ユニキャストDNS-SDゾーンを使用します（ドメインは任意。例:
`openclaw.internal.`）およびTailscale split DNS。
CoreDNSの例については [Bonjour](/gateway/bonjour) を参照してください。

### 手動host/port

Settingsで **Manual Host** を有効にし、gatewayのhost + port（デフォルト `18789`）を入力します。

## Canvas + A2UI

iOSノードはWKWebView canvasを描画します。`node.invoke` を使って操作します:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注記:

- Gateway canvas hostは `/__openclaw__/canvas/` と `/__openclaw__/a2ui/` を提供します。
- これはGateway HTTPサーバーから提供されます（`gateway.port` と同じポート。デフォルト `18789`）。
- iOSノードは、canvas host URLが通知されている場合、接続時に自動的にA2UIへ移動します。
- `canvas.navigate` と `{"url":""}` で組み込みscaffoldに戻ります。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wakeとtalk modeはSettingsで利用できます。
- iOSはバックグラウンド音声を停止することがあるため、アプリがアクティブでないときの音声機能はベストエフォートとして扱ってください。

## よくあるエラー

- `NODE_BACKGROUND_UNAVAILABLE`: iOSアプリをフォアグラウンドに戻してください（canvas/camera/screenコマンドにはこれが必要です）。
- `A2UI_HOST_NOT_CONFIGURED`: Gatewayがcanvas host URLを通知していません。[Gateway configuration](/gateway/configuration) の `canvasHost` を確認してください。
- ペアリングプロンプトが出ない: `openclaw devices list` を実行して手動で承認してください。
- 再インストール後に再接続できない: Keychainのペアリングtokenが消去されています。ノードを再ペアリングしてください。

## 関連ドキュメント

- [ペアリング](/ja-JP/channels/pairing)
- [検出](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
