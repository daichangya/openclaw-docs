---
read_when:
    - エージェントの話し方をもっと没個性的でなくしたい場合
    - SOUL.mdを編集している場合
    - 安全性や簡潔さを損なわずに、より強い個性を持たせたい場合
summary: SOUL.mdを使って、ありきたりなアシスタント臭ではなく、あなたのOpenClawエージェントに本当の声を与える方法
title: SOUL.md Personality Guide
x-i18n:
    generated_at: "2026-04-05T12:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# SOUL.md Personality Guide

`SOUL.md` は、エージェントの声が宿る場所です。

OpenClawは通常のセッションでこれを注入するため、実際に強い効力があります。エージェントの話し方が
味気ない、煮え切らない、あるいは妙に企業っぽいなら、たいてい修正すべきファイルはこれです。

## SOUL.mdに入れるべきもの

エージェントと話したときの感触を変えるものを入れてください。

- トーン
- 意見
- 簡潔さ
- ユーモア
- 境界
- デフォルトの率直さの度合い

次のようなものには**しないでください**。

- 生い立ちの話
- 変更履歴
- セキュリティポリシーの羅列
- 振る舞いに何の影響も与えない、雰囲気だけの巨大な文章の壁

長いより短い方がいい。曖昧より鋭い方がいい。

## これが機能する理由

これはOpenAIのプロンプトガイダンスと一致しています。

- prompt engineeringガイドでは、高レベルの振る舞い、トーン、目標、例は
  ユーザーターンに埋もれさせるのではなく、高優先度の指示レイヤーに置くべきだとしています。
- 同じガイドでは、プロンプトは一度書いて忘れる魔法の文章ではなく、
  反復改善し、固定し、評価するものとして扱うことを勧めています。

OpenClawにとって、`SOUL.md` がそのレイヤーです。

より良い個性が欲しいなら、より強い指示を書いてください。安定した
個性が欲しいなら、簡潔にしてバージョン管理してください。

OpenAI参考資料:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Moltyプロンプト

これをエージェントに貼り付けて、`SOUL.md` を書き直させてください。

OpenClawワークスペース用にパスは固定です: `http://SOUL.md` ではなく `SOUL.md` を使ってください。

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 良い状態の例

良い `SOUL.md` のルールは、こんなふうに聞こえます。

- 自分の見解を持つ
- 無駄な前置きを省く
- 合うときは面白くする
- 悪いアイデアは早めに指摘する
- 本当に深さが役立つ場合を除いて簡潔に保つ

悪い `SOUL.md` のルールは、こんなふうに聞こえます。

- 常にプロフェッショナリズムを維持する
- 包括的で思慮深い支援を提供する
- 前向きで支援的な体験を確保する

後者のリストが、どっちつかずのぼやけた応答を生みます。

## ひとつ注意

個性は、雑になっていいという許可ではありません。

運用ルールは `AGENTS.md` に置いてください。声、スタンス、スタイルは `SOUL.md` に置いてください。
エージェントが共有チャンネル、公開返信、または顧客向けの場で動作するなら、
そのトーンがその場に合っていることを確認してください。

鋭さはいいことです。うっとうしさは違います。

## 関連ドキュメント

- [Agent Workspace](/concepts/agent-workspace)
- [System prompt](/concepts/system-prompt)
- [SOUL.md template](/reference/templates/SOUL)
