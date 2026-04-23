---
read_when:
    - Вам потрібні структуровані редагування файлів у кількох файлах
    - Ви хочете задокументувати або налагодити редагування на основі патчів
summary: Застосування багатофайлових патчів за допомогою інструмента apply_patch
title: Інструмент apply_patch
x-i18n:
    generated_at: "2026-04-23T23:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Застосовуйте зміни до файлів за допомогою структурованого формату патча. Це ідеально підходить для редагувань у кількох файлах
або кількох блоках, де один виклик `edit` був би крихким.

Інструмент приймає один рядок `input`, який обгортає одну або кілька файлових операцій:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Параметри

- `input` (обов’язково): повний вміст патча, включно з `*** Begin Patch` і `*** End Patch`.

## Примітки

- Шляхи в патчі підтримують відносні шляхи (від каталогу workspace) й абсолютні шляхи.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (лише в межах workspace). Установлюйте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом workspace.
- Використовуйте `*** Move to:` усередині блоку `*** Update File:`, щоб перейменовувати файли.
- `*** End of File` позначає вставку лише в кінець файла, коли це потрібно.
- Типово доступний для моделей OpenAI і OpenAI Codex. Задайте
  `tools.exec.applyPatch.enabled: false`, щоб вимкнути його.
- За потреби можна обмежити за моделлю через
  `tools.exec.applyPatch.allowModels`.
- Конфігурація доступна лише в `tools.exec`.

## Приклад

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Пов’язане

- [Diffs](/uk/tools/diffs)
- [Інструмент Exec](/uk/tools/exec)
- [Виконання коду](/uk/tools/code-execution)
