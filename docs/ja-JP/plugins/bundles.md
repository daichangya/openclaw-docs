---
read_when:
    - Codex、Claude、またはCursor互換バンドルをインストールしたい場合
    - OpenClawがバンドル内容をネイティブ機能にどのようにマッピングするかを理解する必要がある場合
    - バンドル検出や不足している機能をデバッグしている場合
summary: Codex、Claude、CursorバンドルをOpenClaw Pluginとしてインストールして使用する
title: Pluginバンドル
x-i18n:
    generated_at: "2026-04-23T04:47:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# Pluginバンドル

OpenClawは、**Codex**、**Claude**、**Cursor**という3つの外部エコシステムからPluginをインストールできます。これらは**バンドル**と呼ばれ、OpenClawがSkills、hooks、MCP toolsのようなネイティブ機能にマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルは、ネイティブのOpenClaw Pluginと**同じではありません**。ネイティブPluginはインプロセスで実行され、あらゆる機能を登録できます。バンドルは、選択的な機能マッピングと、より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

有用なPluginの多くは、Codex、Claude、またはCursor形式で公開されています。OpenClawは、作者にネイティブなOpenClaw Pluginとして書き直すことを求める代わりに、これらの形式を検出し、サポートされているコンテンツをネイティブ機能セットにマッピングします。つまり、ClaudeのコマンドパックやCodexのSkillバンドルをインストールして、すぐに使えるということです。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、またはマーケットプレイスからインストールする">
    ```bash
    # ローカルディレクトリ
    openclaw plugins install ./my-bundle

    # アーカイブ
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="検出を確認する">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルは`Format: bundle`として表示され、サブタイプは`codex`、`claude`、または`cursor`です。

  </Step>

  <Step title="再起動して使う">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、hooks、MCP tools、LSPデフォルト）は、次のセッションで利用可能になります。

  </Step>
</Steps>

## OpenClawがバンドルからマッピングするもの

現在、すべてのバンドル機能がOpenClawで実行されるわけではありません。ここでは、動作するものと、検出はされるがまだ配線されていないものを示します。

### 現在サポートされているもの

| 機能 | マッピング方法 | 適用対象 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skillコンテンツ | バンドルのSkillルートは通常のOpenClaw Skillsとして読み込まれる | すべての形式 |
| Commands | `commands/`と`.cursor/commands/`はSkillルートとして扱われる | Claude、Cursor |
| Hookパック | OpenClaw形式の`HOOK.md` + `handler.ts`レイアウト | Codex |
| MCP tools | バンドルのMCP設定は埋め込みPi設定にマージされ、サポートされるstdioおよびHTTPサーバーが読み込まれる | すべての形式 |
| LSPサーバー | Claudeの`.lsp.json`とmanifestで宣言された`lspServers`は埋め込みPiのLSPデフォルトにマージされる | Claude |
| Settings | Claudeの`settings.json`は埋め込みPiのデフォルトとしてインポートされる | Claude |

#### Skillコンテンツ

- バンドルのSkillルートは、通常のOpenClaw Skillルートとして読み込まれます
- Claudeの`commands`ルートは、追加のSkillルートとして扱われます
- Cursorの`.cursor/commands`ルートは、追加のSkillルートとして扱われます

これは、ClaudeのMarkdownコマンドファイルが通常のOpenClaw Skillローダー経由で動作することを意味します。CursorのコマンドMarkdownも同じ経路で動作します。

#### Hookパック

- バンドルのhookルートは、通常のOpenClaw hook-packレイアウトを使っている場合に**のみ**動作します。現時点では、これは主にCodex互換ケースです:
  - `HOOK.md`
  - `handler.ts`または`handler.js`

#### Pi向けMCP

- 有効なバンドルはMCPサーバー設定を提供できます
- OpenClawは、バンドルのMCP設定を有効な埋め込みPi設定に`mcpServers`としてマージします
- OpenClawは、stdioサーバーを起動するかHTTPサーバーへ接続することで、埋め込みPi agentターン中にサポートされるバンドルMCP toolsを公開します
- `coding`および`messaging`のtool profileには、デフォルトでバンドルMCP toolsが含まれます。agentまたはGatewayに対して除外するには`tools.deny: ["bundle-mcp"]`を使ってください
- プロジェクトローカルのPi設定は、バンドルデフォルトの後でも引き続き適用されるため、必要に応じてworkspace設定でバンドルMCPエントリを上書きできます
- バンドルMCP toolカタログは登録前に決定的にソートされるため、上流の`listTools()`順序変更によってprompt-cacheのtoolブロックが揺れることはありません

##### トランスポート

MCPサーバーはstdioまたはHTTPトランスポートを使用できます。

**Stdio**は子プロセスを起動します:

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

**HTTP**は、デフォルトで`sse`、要求された場合は`streamable-http`を使って、実行中のMCPサーバーへ接続します。

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

- `transport`は`"streamable-http"`または`"sse"`に設定できます。省略した場合、OpenClawは`sse`を使用します
- 許可されるURLスキームは`http:`と`https:`のみです
- `headers`の値は`${ENV_VAR}`補間をサポートします
- `command`と`url`の両方を持つサーバーエントリは拒否されます
- URL認証情報（userinfoおよびクエリパラメーター）は、toolの説明およびログから伏せ字化されます
- `connectionTimeoutMs`は、stdioおよびHTTPトランスポートの両方に対するデフォルトの30秒接続タイムアウトを上書きします

##### tool命名

OpenClawは、バンドルMCP toolsを`serverName__toolName`形式のprovider-safe名で登録します。たとえば、`memory_search` toolを公開する`"vigil-harbor"`というキーのサーバーは、`vigil-harbor__memory_search`として登録されます。

- `A-Za-z0-9_-`以外の文字は`-`に置き換えられます
- サーバー接頭辞は30文字に制限されます
- 完全なtool名は64文字に制限されます
- 空のサーバー名は`mcp`にフォールバックします
- サニタイズ後の名前が衝突した場合は、数値サフィックスで区別されます
- 最終的に公開されるtool順序はsafe nameによって決定的になり、繰り返しのPiターンでもキャッシュ安定性が保たれます
- profileフィルタリングでは、1つのバンドルMCPサーバーのすべてのtoolsを`bundle-mcp`が所有するpluginとして扱うため、profileのallowlistおよびdeny listには、個々の公開tool名または`bundle-mcp` plugin keyのどちらも含めることができます

#### 埋め込みPi設定

- Claudeの`settings.json`は、バンドルが有効なときにデフォルトの埋め込みPi設定としてインポートされます
- OpenClawは、適用前にshell override keyをサニタイズします

サニタイズされるkey:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込みPi LSP

- 有効なClaudeバンドルはLSPサーバー設定を提供できます
- OpenClawは`.lsp.json`と、manifestで宣言された`lspServers`パスを読み込みます
- バンドルのLSP設定は、有効な埋め込みPi LSPデフォルトにマージされます
- 現在実行可能なのは、サポートされるstdioバックエンドのLSPサーバーのみです。サポートされないトランスポートも`openclaw plugins inspect <id>`には表示されます

### 検出されるが実行されないもの

これらは認識されて診断には表示されますが、OpenClawは実行しません。

- Claudeの`agents`、`hooks.json` automation、`outputStyles`
- Cursorの`.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 機能レポートを超えるCodexのinline/appメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codexバンドル">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codexバンドルは、SkillルートとOpenClaw形式のhook-packディレクトリ（`HOOK.md` + `handler.ts`）を使うと、OpenClawに最も適合します。

  </Accordion>

  <Accordion title="Claudeバンドル">
    検出モードは2つあります。

    - **manifestベース:** `.claude-plugin/plugin.json`
    - **manifestなし:** デフォルトのClaudeレイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude固有の動作:

    - `commands/`はSkillコンテンツとして扱われます
    - `settings.json`は埋め込みPi設定にインポートされます（shell override keyはサニタイズされます）
    - `.mcp.json`は、サポートされるstdio toolsを埋め込みPiに公開します
    - `.lsp.json`とmanifestで宣言された`lspServers`パスは、埋め込みPi LSPデフォルトに読み込まれます
    - `hooks/hooks.json`は検出されますが実行されません
    - manifest内のカスタムcomponentパスは加算的です（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursorバンドル">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/`はSkillコンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json`は検出専用です

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClawは、まずネイティブPlugin形式を確認します。

1. `openclaw.plugin.json`または`openclaw.extensions`を持つ有効な`package.json` — **ネイティブPlugin**として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトのClaude/Cursorレイアウト） — **バンドル**として扱われます

ディレクトリに両方が含まれている場合、OpenClawはネイティブパスを使用します。これにより、デュアル形式パッケージが部分的にバンドルとしてインストールされることを防ぎます。

## セキュリティ

バンドルは、ネイティブPluginよりも狭い信頼境界を持ちます。

- OpenClawは、任意のバンドルランタイムモジュールをインプロセスで読み込みません
- Skillsおよびhook-packパスはPluginルート内にとどまる必要があります（境界チェックあり）
- Settingsファイルは同じ境界チェックで読み込まれます
- サポートされるstdio MCPサーバーはサブプロセスとして起動される場合があります

これにより、バンドルはデフォルトでより安全になりますが、それでもサードパーティーバンドルは、公開している機能に関して信頼済みコンテンツとして扱うべきです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが機能が実行されない">
    `openclaw plugins inspect <id>`を実行してください。機能が一覧に表示されていても未配線としてマークされている場合、それはインストール不良ではなく製品上の制限です。
  </Accordion>

  <Accordion title="Claudeのコマンドファイルが表示されない">
    バンドルが有効であり、Markdownファイルが検出された`commands/`または`skills/`ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude設定が適用されない">
    `settings.json`からの埋め込みPi設定のみがサポートされています。OpenClawは、バンドル設定を生の設定patchとしては扱いません。
  </Accordion>

  <Accordion title="Claude hooksが実行されない">
    `hooks/hooks.json`は検出専用です。実行可能なhooksが必要な場合は、OpenClaw hook-packレイアウトを使うか、ネイティブPluginを提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Install and Configure Plugins](/ja-JP/tools/plugin)
- [Building Plugins](/ja-JP/plugins/building-plugins) — ネイティブPluginを作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — ネイティブmanifestスキーマ
