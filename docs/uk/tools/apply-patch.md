---
read_when:
    - Вам потрібні структуровані редагування файлів у кількох файлах
    - Ви хочете документувати або налагоджувати редагування на основі патчів
summary: Застосування багатофайлових патчів за допомогою інструмента apply_patch
title: Інструмент apply_patch
x-i18n:
    generated_at: "2026-04-05T18:18:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# Інструмент apply_patch

Застосовуйте зміни до файлів за допомогою структурованого формату патча. Це ідеальний варіант для редагувань у кількох файлах або кількох фрагментах, де один виклик `edit` був би ненадійним.

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

- `input` (обов’язково): Повний вміст патча, включно з `*** Begin Patch` і `*** End Patch`.

## Примітки

- Шляхи в патчі підтримують відносні шляхи (від каталогу робочого простору) й абсолютні шляхи.
- Для `tools.exec.applyPatch.workspaceOnly` за замовчуванням встановлено `true` (лише в межах робочого простору). Установлюйте `false` лише якщо ви навмисно хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.
- Використовуйте `*** Move to:` у фрагменті `*** Update File:` для перейменування файлів.
- `*** End of File` позначає вставку лише в кінець файла, коли це потрібно.
- Доступно за замовчуванням для моделей OpenAI та OpenAI Codex. Установіть
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
