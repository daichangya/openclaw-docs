---
read_when:
    - Codex、Claude、またはCursor互換バンドルをインストールしたい場合
    - OpenClawがバンドル内容をネイティブ機能へどうマッピングするかを理解する必要がある場合
    - バンドル検出や不足しているcapabilityをデバッグしている場合
summary: Codex、Claude、CursorバンドルをOpenClawプラグインとしてインストールして使用する
title: プラグインバンドル
x-i18n:
    generated_at: "2026-04-05T12:51:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# プラグインバンドル

OpenClawは、3つの外部エコシステムである **Codex**、**Claude**、
**Cursor** からプラグインをインストールできます。これらは **バンドル** と呼ばれます。これは、OpenClawがSkills、hooks、MCP toolsのようなネイティブ機能へマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルはネイティブなOpenClawプラグインと**同じものではありません**。ネイティブプラグインは
  プロセス内で実行され、任意のcapabilityを登録できます。バンドルは、選択的な機能マッピングと、
  より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

便利なプラグインの多くは、Codex、Claude、またはCursor形式で公開されています。作者にそれらをネイティブなOpenClawプラグインとして書き直してもらう代わりに、OpenClawはこれらの形式を検出し、サポートされるコンテンツをネイティブ機能セットへマッピングします。これにより、ClaudeコマンドパックやCodex Skillsバンドルをインストールして、すぐに使い始めることができます。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、またはマーケットプレイスからインストールする">
    ```bash
    # ローカルディレクトリ
    openclaw plugins install ./my-bundle

    # アーカイブ
    openclaw plugins install ./my-bundle.tgz

    # Claudeマーケットプレイス
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="検出を確認する">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルは `Format: bundle` と、`codex`、`claude`、または `cursor` のサブタイプ付きで表示されます。

  </Step>

  <Step title="再起動して使用する">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、hooks、MCP tools、LSPデフォルト）は次のセッションで利用可能になります。

  </Step>
</Steps>

## OpenClawがバンドルからマッピングするもの

現在、すべてのバンドル機能がOpenClawで実行されるわけではありません。ここでは、何が動作し、何が検出されるがまだ接続されていないかを示します。

### 現在サポートされているもの

| Feature       | マッピング方法                                                                                | 適用対象       |
| ------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Skillsコンテンツ | バンドルのSkillsルートが通常のOpenClaw Skillsとして読み込まれる                              | すべての形式   |
| コマンド      | `commands/` と `.cursor/commands/` をSkillsルートとして扱う                                   | Claude、Cursor |
| Hookパック    | OpenClawスタイルの `HOOK.md` + `handler.ts` レイアウト                                        | Codex          |
| MCP tools     | バンドルのMCP設定を組み込みPi設定にマージし、サポートされるstdio/HTTPサーバーを読み込む      | すべての形式   |
| LSPサーバー   | Claudeの `.lsp.json` とmanifest宣言の `lspServers` を組み込みPiのLSPデフォルトにマージする   | Claude         |
| 設定          | Claudeの `settings.json` を組み込みPiデフォルトとして取り込む                                 | Claude         |

#### Skillsコンテンツ

- バンドルのSkillsルートは通常のOpenClaw Skillsルートとして読み込まれます
- Claudeの `commands` ルートは追加のSkillsルートとして扱われます
- Cursorの `.cursor/commands` ルートは追加のSkillsルートとして扱われます

これは、ClaudeのMarkdownコマンドファイルが通常のOpenClaw Skills
ローダーを通じて動作することを意味します。CursorのコマンドMarkdownも同じ経路で動作します。

#### Hookパック

- バンドルのhookルートは、通常のOpenClaw hook-pack
  レイアウトを使っている場合にのみ動作します。現在、これは主にCodex互換ケースです:
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### Pi向けMCP

- 有効なバンドルはMCPサーバー設定を提供できます
- OpenClawはバンドルのMCP設定を、有効な組み込みPi設定に
  `mcpServers` としてマージします
- OpenClawは、stdioサーバーを起動するかHTTPサーバーへ接続することで、
  組み込みPiエージェントターン中にサポートされるバンドルMCP toolsを公開します
- プロジェクトローカルのPi設定はバンドルデフォルトの後にも適用されるため、
  必要に応じてワークスペース設定でバンドルMCPエントリーを上書きできます
- バンドルMCP toolカタログは登録前に決定論的にソートされるため、
  上流の `listTools()` 順序変更でprompt-cacheのtoolブロックが揺れません

##### トランスポート

MCPサーバーはstdioまたはHTTPトランスポートを使用できます:

**Stdio** は子プロセスを起動します:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** は、デフォルトで `sse`、指定された場合は `streamable-http` で実行中のMCPサーバーへ接続します:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` には `"streamable-http"` または `"sse"` を設定できます。省略時はOpenClawが `sse` を使用します
- 許可されるURLスキームは `http:` と `https:` のみです
- `headers` の値は `${ENV_VAR}` 補間をサポートします
- `command` と `url` の両方を持つサーバーエントリーは拒否されます
- URL認証情報（userinfoとquery params）はtoolの
  説明とログからマスクされます
- `connectionTimeoutMs` は、
  stdioとHTTPトランスポート両方のデフォルト30秒接続タイムアウトを上書きします

##### ツール名

OpenClawは、バンドルMCP toolsをprovider安全な名前形式
`serverName__toolName` で登録します。たとえば、`memory_search`
toolを公開する `"vigil-harbor"` というキーのサーバーは `vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます
- サーバープレフィックスは30文字に制限されます
- 完全なtool名は64文字に制限されます
- 空のサーバー名は `mcp` にフォールバックします
- サニタイズ後の名前が衝突した場合は数値サフィックスで区別されます
- 最終的な公開tool順序は、安全な名前で決定論的に整列され、繰り返されるPi
  ターンでキャッシュが安定するようになっています

#### 組み込みPi設定

- Claudeの `settings.json` は、その
  バンドルが有効なときにデフォルトの組み込みPi設定として取り込まれます
- OpenClawは、適用前にシェル上書きキーをサニタイズします

サニタイズされるキー:

- `shellPath`
- `shellCommandPrefix`

#### 組み込みPi LSP

- 有効なClaudeバンドルはLSPサーバー設定を提供できます
- OpenClawは `.lsp.json` とmanifest宣言の `lspServers` パスを読み込みます
- バンドルLSP設定は、有効な組み込みPi LSPデフォルトにマージされます
- 現在実行可能なのは、サポートされるstdioベースのLSPサーバーのみです。未対応の
  トランスポートも `openclaw plugins inspect <id>` には表示されます

### 検出されるが実行されないもの

これらは認識され、診断には表示されますが、OpenClawは実行しません:

- Claudeの `agents`、`hooks.json` 自動化、`outputStyles`
- Cursorの `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- capabilityレポート以外のCodexインライン/アプリメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codexバンドル">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codexバンドルは、SkillsルートとOpenClawスタイルの
    hook-packディレクトリ（`HOOK.md` + `handler.ts`）を使う場合に、OpenClawに最もよく適合します。

  </Accordion>

  <Accordion title="Claudeバンドル">
    検出モードは2つあります:

    - **manifestベース:** `.claude-plugin/plugin.json`
    - **manifestなし:** デフォルトのClaudeレイアウト（`skills/`、`commands/`、`agents/`、`hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`）

    Claude固有の動作:

    - `commands/` はSkillsコンテンツとして扱われます
    - `settings.json` は組み込みPi設定に取り込まれます（シェル上書きキーはサニタイズされます）
    - `.mcp.json` は、サポートされるstdio toolsを組み込みPiに公開します
    - `.lsp.json` とmanifest宣言の `lspServers` パスは組み込みPiのLSPデフォルトに読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - manifest内のカスタムコンポーネントパスは加算的です（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursorバンドル">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` はSkillsコンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出専用です

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClawは、まずネイティブプラグイン形式を確認します:

1. `openclaw.plugin.json` または `openclaw.extensions` を持つ有効な `package.json` — **ネイティブプラグイン**として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトのClaude/Cursorレイアウト） — **バンドル**として扱われます

ディレクトリに両方が含まれている場合、OpenClawはネイティブ経路を使用します。これにより、
デュアル形式パッケージが部分的にバンドルとしてインストールされることを防ぎます。

## セキュリティ

バンドルは、ネイティブプラグインより狭い信頼境界を持ちます:

- OpenClawは任意のバンドルランタイムモジュールをプロセス内で**読み込みません**
- Skillsとhook-packのパスはプラグインルート内にとどまる必要があります（境界チェックあり）
- 設定ファイルも同じ境界チェックで読み込まれます
- サポートされるstdio MCPサーバーはサブプロセスとして起動されることがあります

これにより、バンドルはデフォルトでより安全になりますが、それでも公開している機能についてはサードパーティーバンドルを信頼済みコンテンツとして扱うべきです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるがcapabilityが実行されない">
    `openclaw plugins inspect <id>` を実行してください。capabilityが一覧にあっても
    未接続としてマークされている場合、それはインストール不良ではなく製品上の制限です。
  </Accordion>

  <Accordion title="Claudeコマンドファイルが表示されない">
    バンドルが有効であり、Markdownファイルが検出された
    `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude設定が適用されない">
    `settings.json` からの組み込みPi設定のみがサポートされます。OpenClawは
    バンドル設定を生の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claude hooksが実行されない">
    `hooks/hooks.json` は検出専用です。実行可能なhooksが必要な場合は、
    OpenClaw hook-packレイアウトを使うか、ネイティブプラグインとして提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Install and Configure Plugins](/tools/plugin)
- [Building Plugins](/plugins/building-plugins) — ネイティブプラグインを作成する
- [Plugin Manifest](/plugins/manifest) — ネイティブmanifestスキーマ
