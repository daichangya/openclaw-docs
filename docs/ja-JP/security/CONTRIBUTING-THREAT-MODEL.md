---
read_when:
    - セキュリティ上の発見や脅威シナリオを投稿したいとき
    - 脅威モデルをレビューまたは更新するとき
summary: OpenClaw の脅威モデルに貢献する方法
title: 脅威モデルへの貢献
x-i18n:
    generated_at: "2026-04-05T12:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# OpenClaw の脅威モデルへの貢献

OpenClaw をより安全にするためのご協力ありがとうございます。この脅威モデルは生きたドキュメントであり、どなたからの貢献も歓迎します。セキュリティの専門家である必要はありません。

## 貢献の方法

### 脅威を追加する

まだ取り上げていない攻撃ベクトルやリスクを見つけましたか？ [openclaw/trust](https://github.com/openclaw/trust/issues) で issue を開き、自分の言葉で説明してください。フレームワークを知っている必要も、すべての項目を埋める必要もありません。シナリオを説明するだけで大丈夫です。

**含まれていると役立つもの（必須ではありません）:**

- 攻撃シナリオと、それがどのように悪用されうるか
- OpenClaw のどの部分が影響を受けるか（CLI、gateway、channels、ClawHub、MCP servers など）
- 深刻度をどう考えるか（low / medium / high / critical）
- 関連する調査、CVE、実例へのリンク

ATLAS へのマッピング、脅威 ID、リスク評価はレビュー時にこちらで対応します。それらの詳細も含めたい場合は大歓迎ですが、期待されているわけではありません。

> **これは脅威モデルへの追加のためのものであり、現在悪用可能な脆弱性の報告先ではありません。** 悪用可能な脆弱性を見つけた場合は、責任ある開示の手順について [Trust page](https://trust.openclaw.ai) を参照してください。

### 緩和策を提案する

既存の脅威への対処方法についてアイデアがありますか？ その脅威を参照して issue または PR を開いてください。有用な緩和策は具体的で実行可能です。たとえば、「レート制限を実装する」よりも、「gateway で送信者ごとに 1 分あたり 10 メッセージのレート制限をかける」のほうが優れています。

### 攻撃チェーンを提案する

攻撃チェーンは、複数の脅威がどのように組み合わさって現実的な攻撃シナリオになるかを示します。危険な組み合わせが見える場合は、その手順と、攻撃者がどのようにつなげて悪用するかを説明してください。形式的なテンプレートよりも、実際に攻撃がどう進行するかの短い物語のほうが価値があります。

### 既存コンテンツを修正または改善する

誤字、説明の明確化、古い情報、よりよい例など - PR を歓迎します。issue は不要です。

## 使用しているもの

### MITRE ATLAS

この脅威モデルは、[MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）に基づいています。これは、prompt injection、tool misuse、agent exploitation のような AI/ML の脅威向けに特化して設計されたフレームワークです。貢献にあたって ATLAS を知っている必要はありません。レビュー時にこちらでフレームワークへマッピングします。

### 脅威 ID

各脅威には `T-EXEC-003` のような ID が付きます。カテゴリは次のとおりです。

| Code    | Category |
| ------- | -------- |
| RECON   | 偵察 - 情報収集 |
| ACCESS  | 初期アクセス - 侵入の獲得 |
| EXEC    | 実行 - 悪意ある動作の実行 |
| PERSIST | 永続化 - アクセスの維持 |
| EVADE   | 防御回避 - 検知の回避 |
| DISC    | 調査 - 環境の把握 |
| EXFIL   | データ持ち出し - データの窃取 |
| IMPACT  | 影響 - 損害または妨害 |

ID はレビュー時にメンテナーが割り当てます。自分で選ぶ必要はありません。

### リスクレベル

| Level        | Meaning |
| ------------ | ------- |
| **Critical** | システム全体の完全な侵害、または高い可能性 + 致命的な影響 |
| **High**     | 重大な被害の可能性が高い、または中程度の可能性 + 致命的な影響 |
| **Medium**   | 中程度のリスク、または低い可能性 + 高い影響 |
| **Low**      | 可能性が低く、影響も限定的 |

リスクレベルに自信がない場合は、影響だけ説明してください。こちらで評価します。

## レビュープロセス

1. **トリアージ** - 新しい投稿を 48 時間以内にレビューします
2. **評価** - 実現可能性を検証し、ATLAS へのマッピングと脅威 ID を割り当て、リスクレベルを確認します
3. **文書化** - すべてが適切に整形され、内容がそろっていることを確認します
4. **マージ** - 脅威モデルと可視化に追加します

## リソース

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/security/THREAT-MODEL-ATLAS)

## 連絡先

- **セキュリティ脆弱性:** 報告手順については [Trust page](https://trust.openclaw.ai) を参照してください
- **脅威モデルに関する質問:** [openclaw/trust](https://github.com/openclaw/trust/issues) で issue を開いてください
- **一般的な会話:** Discord の #security チャンネル

## 謝辞

脅威モデルへの貢献者は、脅威モデルの謝辞、リリースノート、および大きな貢献に対する OpenClaw のセキュリティ殿堂で紹介されます。
