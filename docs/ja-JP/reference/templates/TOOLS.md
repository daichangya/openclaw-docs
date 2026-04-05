---
read_when:
    - ワークスペースを手動でブートストラップするとき
summary: TOOLS.md 用のワークスペーステンプレート
title: TOOLS.md テンプレート
x-i18n:
    generated_at: "2026-04-05T12:56:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - ローカルメモ

Skills はツールが _どのように_ 動作するかを定義します。このファイルは _あなた自身の_ 詳細、つまりあなたのセットアップに固有の情報のためのものです。

## ここに書くもの

たとえば、次のようなものです。

- カメラ名と設置場所
- SSHホストとエイリアス
- TTS用の好みの音声
- スピーカー/部屋の名前
- デバイスのニックネーム
- 環境固有のあらゆる情報

## 例

```markdown
### Cameras

- living-room → メインエリア、180°の広角
- front-door → 玄関、モーション起動

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova"（暖かみがあり、ややイギリス英語風）
- Default speaker: Kitchen HomePod
```

## なぜ分けるのか

Skills は共有されます。あなたのセットアップはあなた自身のものです。これらを分けておくことで、メモを失うことなくSkillsを更新でき、インフラ情報を漏らさずにSkillsを共有できます。

---

仕事をするうえで役立つことを自由に追加してください。これはあなたのチートシートです。
