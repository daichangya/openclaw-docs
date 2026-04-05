---
read_when:
    - macOS Canvas パネルを実装する場合
    - ビジュアルワークスペース向けのエージェント制御を追加する場合
    - WKWebView の canvas 読み込みをデバッグする場合
summary: WKWebView + カスタム URL スキーム経由で埋め込まれる、エージェント制御の Canvas パネル
title: Canvas
x-i18n:
    generated_at: "2026-04-05T12:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (macOS app)

macOS アプリは、`WKWebView` を使ってエージェント制御の **Canvas パネル**を埋め込みます。これは
HTML/CSS/JS、A2UI、および小規模なインタラクティブ
UI サーフェス向けの軽量なビジュアルワークスペースです。

## Canvas の配置場所

Canvas の状態は Application Support 配下に保存されます:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、**カスタム URL スキーム**経由でこれらのファイルを提供します:

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは**組み込みの scaffold ページ**を表示します。

## パネルの動作

- メニューバー（またはマウスカーソル）の近くに固定される、境界線なし・リサイズ可能なパネル。
- セッションごとにサイズ/位置を記憶します。
- ローカルの canvas ファイルが変更されると自動リロードします。
- 一度に表示される Canvas パネルは 1 つだけです（必要に応じてセッションを切り替えます）。

Canvas は Settings → **Allow Canvas** から無効化できます。無効な場合、
canvas ノードコマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

Canvas は **Gateway WebSocket** 経由で公開されるため、エージェントは次のことができます:

- パネルを表示/非表示にする
- パスまたは URL へ移動する
- JavaScript を評価する
- スナップショット画像を取得する

CLI の例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注意:

- `canvas.navigate` は、**ローカル canvas パス**、`http(s)` URL、`file://` URL を受け付けます。
- `"/"` を渡した場合、Canvas はローカルの scaffold または `index.html` を表示します。

## Canvas 内の A2UI

A2UI は Gateway canvas host によってホストされ、Canvas パネル内でレンダリングされます。
Gateway が Canvas host を通知すると、macOS アプリは最初に開いたときに
A2UI host ページへ自動で移動します。

デフォルトの A2UI host URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド（v0.8）

Canvas は現在、**A2UI v0.8** の server→client メッセージを受け付けます:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`（v0.9）はサポートされていません。

CLI の例:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

簡単なスモークテスト:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas からエージェント実行をトリガーする

Canvas は、ディープリンク経由で新しいエージェント実行をトリガーできます:

- `openclaw://agent?...`

例（JS 内）:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

有効なキーが提供されていない限り、アプリは確認を求めます。

## セキュリティに関する注意

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカル Canvas コンテンツはカスタムスキームを使います（loopback server は不要です）。
- 外部の `http(s)` URL は、明示的に移動した場合にのみ許可されます。
