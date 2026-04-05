---
read_when:
    - エージェントにコードや markdown の編集を diff として表示させたいとき
    - canvas 対応のビューアー URL またはレンダリング済み diff ファイルがほしいとき
    - 安全なデフォルト設定で制御された一時的な diff アーティファクトが必要なとき
summary: エージェント向けの読み取り専用 diff ビューアーおよびファイルレンダラー（任意の plugin ツール）
title: Diffs
x-i18n:
    generated_at: "2026-04-05T12:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` は任意の plugin ツールで、短い組み込みのシステムガイダンスと、変更内容をエージェント向けの読み取り専用 diff アーティファクトに変換する companion skill を備えています。

受け付ける入力は次のいずれかです。

- `before` と `after` のテキスト
- unified `patch`

返せる出力は次のとおりです。

- canvas 表示用の Gateway ビューアー URL
- メッセージ配信用のレンダリング済みファイルパス（PNG または PDF）
- 1回の呼び出しで両方の出力

有効化されると、この plugin は簡潔な使用ガイダンスを system-prompt 空間に前置し、さらにエージェントがより詳細な指示を必要とする場合に備えて詳細な skill も公開します。

## クイックスタート

1. plugin を有効化します。
2. canvas 優先のフローでは `mode: "view"` で `diffs` を呼び出します。
3. チャットへのファイル配信フローでは `mode: "file"` で `diffs` を呼び出します。
4. 両方のアーティファクトが必要な場合は `mode: "both"` で `diffs` を呼び出します。

## plugin を有効化する

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 組み込みのシステムガイダンスを無効化する

`diffs` ツールは有効のまま、組み込みの system-prompt ガイダンスだけを無効にしたい場合は、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定してください。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

これにより、plugin、ツール、companion skill は利用可能なまま、diffs plugin の `before_prompt_build` hook がブロックされます。

ガイダンスとツールの両方を無効にしたい場合は、代わりに plugin を無効化してください。

## 一般的なエージェントのワークフロー

1. エージェントが `diffs` を呼び出す。
2. エージェントが `details` フィールドを読む。
3. エージェントは次のいずれかを行う。
   - `canvas present` で `details.viewerUrl` を開く
   - `path` または `filePath` を使って `message` で `details.filePath` を送る
   - 両方を行う

## 入力例

Before と after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## ツール入力リファレンス

特記がない限り、すべてのフィールドは任意です。

- `before` (`string`): 元のテキスト。`patch` を省略する場合、`after` と組で必須です。
- `after` (`string`): 更新後のテキスト。`patch` を省略する場合、`before` と組で必須です。
- `patch` (`string`): unified diff テキスト。`before` および `after` とは排他的です。
- `path` (`string`): before/after モード向けの表示用ファイル名。
- `lang` (`string`): before/after モード向けの言語上書きヒント。不明な値は plain text にフォールバックします。
- `title` (`string`): ビューアーのタイトル上書き。
- `mode` (`"view" | "file" | "both"`): 出力モード。デフォルトは plugin 既定値 `defaults.mode`。
  非推奨エイリアス: `"image"` は `"file"` と同様に動作し、後方互換性のため引き続き受け付けられます。
- `theme` (`"light" | "dark"`): ビューアーテーマ。デフォルトは plugin 既定値 `defaults.theme`。
- `layout` (`"unified" | "split"`): diff レイアウト。デフォルトは plugin 既定値 `defaults.layout`。
- `expandUnchanged` (`boolean`): 完全な文脈が利用可能なときに未変更セクションを展開します。呼び出し単位のオプションのみで、plugin 既定値キーではありません。
- `fileFormat` (`"png" | "pdf"`): レンダリングするファイル形式。デフォルトは plugin 既定値 `defaults.fileFormat`。
- `fileQuality` (`"standard" | "hq" | "print"`): PNG または PDF レンダリングの品質プリセット。
- `fileScale` (`number`): デバイススケール上書き（`1`-`4`）。
- `fileMaxWidth` (`number`): 最大レンダリング幅（CSS ピクセル、`640`-`2400`）。
- `ttlSeconds` (`number`): ビューアーおよび単独ファイル出力のアーティファクト TTL（秒）。デフォルトは 1800、最大は 21600。
- `baseUrl` (`string`): ビューアー URL origin の上書き。plugin の `viewerBaseUrl` を上書きします。`http` または `https` でなければならず、query/hash は不可です。

後方互換性のため、従来の入力エイリアスも引き続き受け付けます。

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

検証と制限:

- `before` と `after` はそれぞれ最大 512 KiB。
- `patch` は最大 2 MiB。
- `path` は最大 2048 バイト。
- `lang` は最大 128 バイト。
- `title` は最大 1024 バイト。
- Patch 複雑度上限: 最大 128 ファイル、合計 120000 行。
- `patch` と `before` または `after` の同時指定は拒否されます。
- レンダリング済みファイルの安全制限（PNG と PDF の両方に適用）:
  - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
  - `fileQuality: "hq"`: 最大 14 MP（14,000,000 レンダリングピクセル）。
  - `fileQuality: "print"`: 最大 24 MP（24,000,000 レンダリングピクセル）。
  - PDF にはさらに最大 50 ページの制限があります。

## 出力 details の契約

ツールは構造化されたメタデータを `details` の下に返します。

ビューアーを作成するモードで共通のフィールド:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context`（利用可能な場合は `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

PNG または PDF がレンダリングされた場合のファイルフィールド:

- `artifactId`
- `expiresAt`
- `filePath`
- `path`（`filePath` と同じ値。message ツール互換用）
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

既存の呼び出し元向けに、互換エイリアスも返されます。

- `format`（`fileFormat` と同じ値）
- `imagePath`（`filePath` と同じ値）
- `imageBytes`（`fileBytes` と同じ値）
- `imageQuality`（`fileQuality` と同じ値）
- `imageScale`（`fileScale` と同じ値）
- `imageMaxWidth`（`fileMaxWidth` と同じ値）

モード動作の要約:

- `mode: "view"`: ビューアーフィールドのみ。
- `mode: "file"`: ファイルフィールドのみ。ビューアーアーティファクトなし。
- `mode: "both"`: ビューアーフィールドに加えてファイルフィールドも返します。ファイルレンダリングに失敗しても、`fileError` と互換エイリアス `imageError` を付けてビューアーは返されます。

## 折りたたまれた未変更セクション

- ビューアーには `N unmodified lines` のような行が表示される場合があります。
- それらの行の展開コントロールは条件付きであり、すべての入力種別で保証されるわけではありません。
- 展開コントロールは、レンダリングされた diff に展開可能な文脈データがある場合に表示されます。これは before/after 入力で一般的です。
- 多くの unified patch 入力では、省略された文脈本文は解析済み patch hunk に存在しないため、その行は展開コントロールなしで表示されることがあります。これは想定された動作です。
- `expandUnchanged` は、展開可能な文脈が存在する場合にのみ適用されます。

## plugin の既定値

plugin 全体の既定値は `~/.openclaw/openclaw.json` で設定します。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

対応している既定値:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

明示的なツールパラメータは、これらの既定値を上書きします。

永続的なビューアー URL 設定:

- `viewerBaseUrl` (`string`, optional)
  - ツール呼び出しで `baseUrl` が渡されなかった場合に、返却されるビューアーリンクに使われる plugin 所有のフォールバック。
  - `http` または `https` でなければならず、query/hash は不可です。

例:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## セキュリティ設定

- `security.allowRemoteViewer` (`boolean`, デフォルト `false`)
  - `false`: ビューアールートへの non-loopback リクエストは拒否されます。
  - `true`: トークン付きパスが有効であれば、リモートビューアーが許可されます。

例:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## アーティファクトのライフサイクルと保存先

- アーティファクトは temp のサブフォルダ `$TMPDIR/openclaw-diffs` に保存されます。
- ビューアーアーティファクトのメタデータには次が含まれます。
  - ランダムなアーティファクト ID（20 hex chars）
  - ランダムなトークン（48 hex chars）
  - `createdAt` と `expiresAt`
  - 保存された `viewer.html` パス
- アーティファクト TTL は、指定されない場合デフォルトで 30 分です。
- 受け付けるビューアー TTL の最大値は 6 時間です。
- クリーンアップはアーティファクト作成後に日和見的に実行されます。
- 期限切れアーティファクトは削除されます。
- メタデータがない場合、フォールバックのクリーンアップにより 24 時間より古い stale フォルダが削除されます。

## ビューアー URL とネットワーク動作

ビューアールート:

- `/plugins/diffs/view/{artifactId}/{token}`

ビューアーアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

ビューアードキュメントは、これらのアセットをビューアー URL からの相対パスで解決するため、任意の `baseUrl` パス接頭辞はアセットリクエストでも保持されます。

URL 構築動作:

- ツール呼び出しの `baseUrl` が指定されている場合、厳格な検証のうえでそれが使われます。
- そうでなければ、plugin の `viewerBaseUrl` が設定されていればそれが使われます。
- どちらの上書きもない場合、ビューアー URL のデフォルトは loopback `127.0.0.1` です。
- Gateway の bind mode が `custom` で、`gateway.customBindHost` が設定されている場合は、その host が使われます。

`baseUrl` のルール:

- `http://` または `https://` でなければなりません。
- Query と hash は拒否されます。
- Origin と任意の base path は許可されます。

## セキュリティモデル

ビューアーの強化:

- デフォルトで loopback のみ。
- 厳格な ID および token 検証を伴うトークン化ビューアーパス。
- ビューアー応答の CSP:
  - `default-src 'none'`
  - scripts と assets は self のみ
  - 外向きの `connect-src` なし
- リモートアクセスが有効な場合のリモート miss スロットリング:
  - 60 秒あたり 40 回の失敗
  - 60 秒のロックアウト（`429 Too Many Requests`）

ファイルレンダリングの強化:

- スクリーンショットブラウザーのリクエストルーティングは deny-by-default です。
- `http://127.0.0.1/plugins/diffs/assets/*` からのローカルビューアーアセットのみ許可されます。
- 外部ネットワークリクエストはブロックされます。

## file モードのブラウザー要件

`mode: "file"` と `mode: "both"` には Chromium 互換ブラウザーが必要です。

解決順序:

1. OpenClaw config の `browser.executablePath`。
2. 環境変数:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. プラットフォームごとのコマンド/パス探索フォールバック。

よくある失敗メッセージ:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、または Brave をインストールするか、上記の executable path オプションのいずれかを設定して修正してください。

## トラブルシューティング

入力検証エラー:

- `Provide patch or both before and after text.`
  - `before` と `after` の両方を含めるか、`patch` を指定してください。
- `Provide either patch or before/after input, not both.`
  - 入力モードを混在させないでください。
- `Invalid baseUrl: ...`
  - query/hash のない、任意パス付き `http(s)` origin を使ってください。
- `{field} exceeds maximum size (...)`
  - ペイロードサイズを減らしてください。
- 大きな patch の拒否
  - patch のファイル数または合計行数を減らしてください。

ビューアーのアクセス性の問題:

- ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
- リモートアクセスのシナリオでは、次のいずれかを行ってください。
  - plugin の `viewerBaseUrl` を設定する
  - ツール呼び出しごとに `baseUrl` を渡す
  - `gateway.bind=custom` と `gateway.customBindHost` を使う
- `gateway.trustedProxies` に、同一ホスト proxy（たとえば Tailscale Serve）向けの loopback が含まれている場合、forwarded client-IP headers のない生の loopback ビューアーリクエストは、設計上 fail closed になります。
- その proxy トポロジでは:
  - 添付ファイルだけが必要なら `mode: "file"` または `mode: "both"` を優先する、または
  - 共有可能なビューアー URL が必要なら、意図的に `security.allowRemoteViewer` を有効にし、plugin の `viewerBaseUrl` を設定するか、proxy/public な `baseUrl` を渡してください
- `security.allowRemoteViewer` は、外部ビューアーアクセスを意図している場合にのみ有効にしてください。

未変更行の行に展開ボタンがない:

- patch 入力で、patch が展開可能な文脈を含んでいない場合に発生することがあります。
- これは想定された動作であり、ビューアー障害を示すものではありません。

アーティファクトが見つからない:

- TTL によりアーティファクトが期限切れになった。
- token または path が変更された。
- クリーンアップで stale データが削除された。

## 運用ガイダンス

- canvas でのローカル対話レビューには `mode: "view"` を優先してください。
- 添付ファイルが必要な外向きチャットチャネルには `mode: "file"` を優先してください。
- デプロイでリモートビューアー URL が必要でない限り、`allowRemoteViewer` は無効のままにしてください。
- 機微な diff には明示的に短い `ttlSeconds` を設定してください。
- 必要ない場合は diff 入力に秘密情報を含めないでください。
- あなたのチャネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）は、PDF 出力（`fileFormat: "pdf"`）を優先してください。

Diff レンダリングエンジン:

- [Diffs](https://diffs.com) を使用しています。

## 関連ドキュメント

- [ツール概要](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
