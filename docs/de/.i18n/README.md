---
x-i18n:
    generated_at: "2026-04-05T12:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: adff26fa8858af2759b231ea48bfc01f89c110cd9b3774a8f783e282c16f77fb
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw-Dokumentations-i18n-Assets

Dieser Ordner speichert die Übersetzungskonfiguration für das Quell-Dokumentations-Repo.

Generierte Locale-Bäume und der aktive Translation Memory befinden sich jetzt im Publish-Repo:

- Repo: `openclaw/docs`
- Lokaler Checkout: `~/Projects/openclaw-docs`

## Quelle der Wahrheit

- Englische Dokumentation wird in `openclaw/openclaw` verfasst.
- Der Quell-Dokumentationsbaum befindet sich unter `docs/`.
- Das Quell-Repo enthält keine festgeschriebenen generierten Locale-Bäume mehr wie `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` oder `docs/ar/**`.

## Ende-zu-Ende-Ablauf

1. Englische Dokumentation in `openclaw/openclaw` bearbeiten.
2. Nach `main` pushen.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` spiegelt den Dokumentationsbaum nach `openclaw/docs`.
4. Das Sync-Skript schreibt die Publish-`docs/docs.json` so um, dass die generierten Locale-Picker-Blöcke dort vorhanden sind, obwohl sie im Quell-Repo nicht mehr festgeschrieben sind.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` aktualisiert `docs/zh-CN/**` einmal täglich, bei Bedarf und nach Release-Dispatches aus dem Quell-Repo.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` macht dasselbe für `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml` und `translate-ar.yml` machen dasselbe für `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` und `docs/ar/**`.

## Warum diese Aufteilung existiert

- Generierte Locale-Ausgabe aus dem Haupt-Produkt-Repo heraushalten.
- Mintlify bei einem einzigen veröffentlichten Dokumentationsbaum halten.
- Den integrierten Sprachumschalter beibehalten, indem das Publish-Repo die generierten Locale-Bäume verwaltet.

## Dateien in diesem Ordner

- `glossary.<lang>.json` — bevorzugte Begriffszunordnungen, die als Prompt-Hinweise verwendet werden.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pt-BR-navigation.json`, `zh-Hans-navigation.json` — Mintlify-Locale-Picker-Blöcke, die während der Synchronisierung wieder in das Publish-Repo eingefügt werden.
- `<lang>.tm.jsonl` — Translation Memory, das nach Workflow + Modell + Texthash indiziert ist.

In diesem Repo werden generierte Locale-TM-Dateien wie `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl` und `docs/.i18n/ar.tm.jsonl` absichtlich nicht mehr festgeschrieben.

## Glossarformat

`glossary.<lang>.json` ist ein Array von Einträgen:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Felder:

- `source`: Englische (oder Quell-)Phrase, die bevorzugt werden soll.
- `target`: bevorzugte Übersetzungsausgabe.

## Übersetzungsmechanik

- `scripts/docs-i18n` ist weiterhin für die Generierung von Übersetzungen zuständig.
- Der Dokumentationsmodus schreibt `x-i18n.source_hash` in jede übersetzte Seite.
- Jeder Publish-Workflow berechnet vorab eine Liste ausstehender Dateien, indem der aktuelle englische Quell-Hash mit dem gespeicherten Locale-`x-i18n.source_hash` verglichen wird.
- Wenn die Anzahl ausstehender Dateien `0` ist, wird der aufwendige Übersetzungsschritt vollständig übersprungen.
- Wenn ausstehende Dateien vorhanden sind, übersetzt der Workflow nur diese Dateien.
- Der Publish-Workflow wiederholt transiente Modellformatfehler, aber unveränderte Dateien bleiben weiter übersprungen, weil dieselbe Hash-Prüfung bei jedem Wiederholungsversuch ausgeführt wird.
- Das Quell-Repo löst außerdem Aktualisierungen für zh-CN, ja-JP, es, pt-BR, ko, de, fr und ar nach veröffentlichten GitHub-Releases aus, damit Release-Dokumentation aufholen kann, ohne auf den täglichen Cron zu warten.

## Betriebshinweise

- Sync-Metadaten werden in `.openclaw-sync/source.json` im Publish-Repo geschrieben.
- Secret des Quell-Repos: `OPENCLAW_DOCS_SYNC_TOKEN`
- Secret des Publish-Repos: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Wenn die Locale-Ausgabe veraltet aussieht, prüfen Sie zuerst den entsprechenden Workflow `Translate <locale>` in `openclaw/docs`.
