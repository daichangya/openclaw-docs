---
read_when:
    - Sie möchten den lokalen Status löschen und dabei die installierte CLI beibehalten
    - Sie möchten einen Dry-Run davon, was entfernt würde
summary: CLI-Referenz für `openclaw reset` (lokalen Status/die lokale Konfiguration zurücksetzen)
title: reset
x-i18n:
    generated_at: "2026-04-05T12:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Lokale Konfiguration/Status zurücksetzen (die CLI bleibt installiert).

Optionen:

- `--scope <scope>`: `config`, `config+creds+sessions` oder `full`
- `--yes`: Bestätigungsaufforderungen überspringen
- `--non-interactive`: Aufforderungen deaktivieren; erfordert `--scope` und `--yes`
- `--dry-run`: Aktionen ausgeben, ohne Dateien zu entfernen

Beispiele:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Hinweise:

- Führen Sie zuerst `openclaw backup create` aus, wenn Sie vor dem Entfernen des lokalen Status einen wiederherstellbaren Schnappschuss erstellen möchten.
- Wenn Sie `--scope` weglassen, verwendet `openclaw reset` eine interaktive Aufforderung, um auszuwählen, was entfernt werden soll.
- `--non-interactive` ist nur gültig, wenn sowohl `--scope` als auch `--yes` gesetzt sind.
