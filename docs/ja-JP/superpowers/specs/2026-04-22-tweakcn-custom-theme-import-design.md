---
x-i18n:
    generated_at: "2026-04-25T13:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Tweakcn カスタムテーマ取り込み設計

ステータス: 2026-04-22 に terminal で承認済み

## 概要

tweakcn の共有リンクから取り込める、ブラウザローカル限定の Control UI カスタムテーマスロットを、ちょうど 1 つ追加します。既存の組み込みテーマファミリーは引き続き `claw`、`knot`、`dash` のままです。新しい `custom` ファミリーは通常の OpenClaw テーマファミリーのように振る舞い、取り込んだ tweakcn ペイロードに light と dark の両方のトークンセットが含まれている場合は、`light`、`dark`、`system` モードをサポートします。

取り込んだテーマは、他の Control UI 設定と一緒に、現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間やブラウザー間でも同期されません。

## 問題

現在の Control UI テーマシステムは、3 つのハードコードされたテーマファミリーに閉じています。

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

ユーザーは組み込みファミリーとモードバリアントを切り替えられますが、リポジトリの CSS を編集しない限り tweakcn からテーマを持ち込めません。求められている成果は、一般的なテーマシステムよりも小さいものです。3 つの組み込みテーマを維持しつつ、tweakcn リンクから置き換え可能な、ユーザー制御の取り込みスロットを 1 つ追加します。

## 目標

- 既存の組み込みテーマファミリーを変更しない。
- テーマライブラリではなく、取り込み済みカスタムスロットをちょうど 1 つ追加する。
- tweakcn の共有リンク、または直接の `https://tweakcn.com/r/themes/{id}` URL を受け付ける。
- 取り込んだテーマをブラウザーローカルストレージのみに保持する。
- 取り込み済みスロットを既存の `light`、`dark`、`system` モード制御で動作させる。
- 失敗時の動作を安全に保つ。不正な取り込みでアクティブな UI テーマが壊れないようにする。

## 非目標

- 複数テーマライブラリや、ブラウザーローカルの取り込み一覧は作らない。
- Gateway 側の永続化やデバイス間同期は行わない。
- 任意の CSS エディターや生のテーマ JSON エディターは作らない。
- tweakcn からリモートフォントアセットを自動読み込みしない。
- 片側モードしか公開していない tweakcn ペイロードのサポートは試みない。
- Control UI に必要な接合部を超える、リポジトリ全体のテーマリファクタリングは行わない。

## すでに決まっているユーザー判断

- 3 つの組み込みテーマを維持する。
- tweakcn ベースの取り込みスロットを 1 つ追加する。
- 取り込んだテーマは Gateway 設定ではなくブラウザーに保存する。
- 取り込み済みスロットで `light`、`dark`、`system` をサポートする。
- 次の取り込みで custom スロットを上書きするのが意図された動作である。

## 推奨アプローチ

Control UI テーマモデルに 4 つ目のテーマファミリー ID として `custom` を追加します。`custom` ファミリーは、有効な tweakcn 取り込みが存在する場合にのみ選択可能になります。取り込んだペイロードは OpenClaw 専用のカスタムテーマレコードに正規化され、他の UI 設定とともにブラウザーローカルストレージに保存されます。

実行時には、OpenClaw は解決済みのカスタム CSS 変数ブロックを定義する管理対象の `<style>` タグを描画します。

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

これにより、カスタムテーマ変数は `custom` ファミリーに限定され、インライン CSS 変数が組み込みファミリーへ漏れ出すのを避けられます。

## アーキテクチャ

### テーマモデル

`ui/src/ui/theme.ts` を更新します。

- `ThemeName` に `custom` を追加する。
- `ResolvedTheme` に `custom` と `custom-light` を追加する。
- `VALID_THEME_NAMES` を拡張する。
- `resolveTheme()` を更新し、`custom` が既存ファミリーの動作を反映するようにする。
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS 設定に応じて `custom` または `custom-light`

`custom` 向けのレガシーエイリアスは追加しません。

### 永続化モデル

`ui/src/ui/storage.ts` の `UiSettings` 永続化に、任意のカスタムテーマペイロードを 1 つ追加します。

- `customTheme?: ImportedCustomTheme`

推奨される保存形状:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

注記:

- `sourceUrl` には、正規化後の元のユーザー入力を保存します。
- `themeId` には、URL から抽出した tweakcn テーマ ID を保存します。
- `label` には、存在する場合は tweakcn の `name` フィールドを、なければ `Custom` を保存します。
- `light` と `dark` は、すでに正規化済みの OpenClaw トークンマップであり、生の tweakcn ペイロードではありません。
- 取り込み済みペイロードは、他のブラウザーローカル設定と並んで存在し、同じローカルストレージ文書内でシリアライズされます。
- 保存済みカスタムテーマデータがロード時に欠落または不正である場合、そのペイロードを無視し、保存されていたファミリーが `custom` なら `theme: "claw"` にフォールバックします。

### 実行時適用

Control UI 実行時に、`ui/src/ui/app-settings.ts` と `ui/src/ui/theme.ts` の近くで管理される、狭い責務のカスタムテーマスタイルシートマネージャーを追加します。

責務:

- `document.head` に、安定した `<style id="openclaw-custom-theme">` タグを 1 つ作成または更新する。
- 有効なカスタムテーマペイロードが存在する場合にのみ CSS を出力する。
- ペイロードがクリアされたら style タグの内容を削除する。
- 組み込みファミリーの CSS は `ui/src/styles/base.css` に維持し、取り込んだトークンをチェックイン済みスタイルシートへ差し込まない。

このマネージャーは、設定のロード、保存、取り込み、クリアのたびに実行されます。

### Light モードセレクター

実装では、特別に `custom-light` を扱うのではなく、ファミリー横断の light スタイル指定として `data-theme-mode="light"` を優先して使うべきです。既存のセレクターが `data-theme="light"` に固定されていて、すべての light ファミリーに適用すべき場合は、この作業の一部として広げてください。

## 取り込み UX

`Appearance` セクションの `ui/src/ui/views/config.ts` を更新します。

- `Claw`、`Knot`、`Dash` の横に `Custom` テーマカードを追加する。
- 取り込み済みカスタムテーマがない場合、カードを無効状態で表示する。
- テーマグリッドの下に、以下を含む取り込みパネルを追加する。
  - tweakcn の共有リンクまたは `/r/themes/{id}` URL 用のテキスト入力 1 つ
  - `Import` ボタン 1 つ
  - カスタムペイロードがすでに存在する場合の `Replace` 導線 1 つ
  - カスタムペイロードがすでに存在する場合の `Clear` アクション 1 つ
- ペイロードが存在する場合、取り込んだテーマのラベルとソースホストを表示する。
- アクティブテーマが `custom` の場合、置き換えの取り込みは即時適用される。
- アクティブテーマが `custom` でない場合、取り込みはユーザーが `Custom` カードを選択するまで新しいペイロードを保存するだけにする。

`ui/src/ui/views/config-quick.ts` のクイック設定テーマピッカーでも、ペイロードが存在する場合にのみ `Custom` を表示します。

## URL 解析とリモート取得

ブラウザーの取り込み経路は次を受け付けます。

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

実装では両方の形式を次へ正規化する必要があります。

- `https://tweakcn.com/r/themes/{id}`

その後、ブラウザーは正規化された `/r/themes/{id}` エンドポイントを直接取得します。

外部ペイロードには、狭いスキーマバリデーターを使用します。これは信頼できない外部境界なので、zod スキーマが推奨です。

必須のリモートフィールド:

- トップレベル `name` は任意の文字列
- `cssVars.theme` は任意のオブジェクト
- `cssVars.light` はオブジェクト
- `cssVars.dark` はオブジェクト

`cssVars.light` または `cssVars.dark` のどちらかが欠けている場合、取り込みを拒否します。これは意図的です。承認されたプロダクト動作は完全なモード対応であり、欠けている側をベストエフォートで合成することではありません。

## トークンマッピング

tweakcn の変数を無差別にそのまま写してはいけません。限定されたサブセットを OpenClaw トークンへ正規化し、残りはヘルパーで導出します。

### 直接取り込むトークン

各 tweakcn モードブロックから:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

存在する場合は共有の `cssVars.theme` から:

- `font-sans`
- `font-mono`

モードブロックが `font-sans`、`font-mono`、または `radius` を上書きしている場合は、モードローカル値を優先します。

### OpenClaw 向けに導出するトークン

インポーターは、取り込んだベースカラーから OpenClaw 専用の変数を導出します。

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

導出ルールは pure helper に置き、独立してテストできるようにします。正確な色混合式は実装詳細ですが、helper は次の 2 つの制約を満たす必要があります。

- 取り込んだテーマ意図に近い、読みやすいコントラストを保つ
- 同じ取り込みペイロードに対して安定した出力を生成する

### v1 で無視するトークン

次の tweakcn トークンは、初期バージョンでは意図的に無視します。

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

これにより、現在の Control UI が実際に必要とするトークンに範囲を絞れます。

### フォント

フォントスタック文字列は、存在する場合は取り込みますが、OpenClaw は v1 ではリモートフォントアセットを読み込みません。取り込んだスタックがブラウザーで利用できないフォントを参照している場合は、通常のフォールバック動作が適用されます。

## 失敗時の動作

不正な取り込みはクローズドフェイルしなければなりません。

- 無効な URL 形式: インライン検証エラーを表示し、取得しない。
- 未対応のホストまたはパス形状: インライン検証エラーを表示し、取得しない。
- ネットワーク障害、非 OK レスポンス、または不正な JSON: インラインエラーを表示し、現在保存されているペイロードは変更しない。
- スキーマ不一致または light/dark ブロック欠落: インラインエラーを表示し、現在保存されているペイロードは変更しない。
- Clear アクション:
  - 保存済みカスタムペイロードを削除する
  - 管理対象カスタム style タグの内容を削除する
  - `custom` がアクティブなら、テーマファミリーを `claw` に戻す
- 初回ロード時に保存済みカスタムペイロードが不正:
  - 保存済みペイロードを無視する
  - カスタム CSS を出力しない
  - 保存済みテーマファミリーが `custom` なら `claw` にフォールバックする

失敗した取り込みによって、アクティブな document にカスタム CSS 変数が部分適用された状態を残してはなりません。

## 実装で変更が想定されるファイル

主要ファイル:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

追加される可能性が高い helper:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

テスト:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 解析とペイロード正規化の新しい絞り込んだテスト

## テスト

最低限必要な実装カバレッジ:

- 共有リンク URL を tweakcn テーマ ID に解析する
- `/themes/{id}` と `/r/themes/{id}` を取得 URL に正規化する
- 未対応ホストと不正な ID を拒否する
- tweakcn ペイロード形状を検証する
- 有効な tweakcn ペイロードを正規化済み OpenClaw の light/dark トークンマップに変換する
- カスタムペイロードをブラウザーローカル設定へ読み書きする
- `light`、`dark`、`system` で `custom` を解決する
- ペイロードがないとき `Custom` 選択を無効化する
- `custom` がすでにアクティブなとき、取り込み済みテーマを即時適用する
- アクティブなカスタムテーマがクリアされたら `claw` にフォールバックする

手動検証の目標:

- Settings から既知の tweakcn テーマを取り込む
- `light`、`dark`、`system` を切り替える
- `custom` と組み込みファミリーを切り替える
- ページを再読み込みし、取り込み済みカスタムテーマがローカルに保持されることを確認する

## ロールアウトメモ

この機能は意図的に小さくしています。将来、複数の取り込み済みテーマ、名前変更、エクスポート、デバイス間同期がユーザーから求められた場合は、それを後続の設計として扱ってください。この実装でテーマライブラリ抽象化を先回りして作り込まないでください。
