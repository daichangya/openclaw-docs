---
read_when:
    - Ви хочете видалити сервіс gateway та/або локальний стан
    - Спочатку ви хочете пробний запуск
summary: Довідка CLI для `openclaw uninstall` (видалення сервісу gateway + локальних даних)
title: Видалення
x-i18n:
    generated_at: "2026-04-24T04:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Видалення сервісу gateway + локальних даних (CLI залишається).

Параметри:

- `--service`: видалити сервіс gateway
- `--state`: видалити стан і конфігурацію
- `--workspace`: видалити каталоги робочого простору
- `--app`: видалити застосунок macOS
- `--all`: видалити сервіс, стан, робочий простір і застосунок
- `--yes`: пропустити запити на підтвердження
- `--non-interactive`: вимкнути запити; потребує `--yes`
- `--dry-run`: вивести дії без видалення файлів

Приклади:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Примітки:

- Спочатку виконайте `openclaw backup create`, якщо хочете мати відновлюваний знімок перед видаленням стану або робочих просторів.
- `--all` — це скорочення для одночасного видалення сервісу, стану, робочого простору й застосунку.
- `--non-interactive` потребує `--yes`.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Видалення](/uk/install/uninstall)
