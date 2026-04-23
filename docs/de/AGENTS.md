---
x-i18n:
    generated_at: "2026-04-23T13:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Leitfaden für die Dokumentation

Dieses Verzeichnis ist für die Dokumentationserstellung, Mintlify-Linkregeln und die Richtlinie zur Docs-i18n zuständig.

## Mintlify-Regeln

- Die Dokumentation wird auf Mintlify gehostet (`https://docs.openclaw.ai`).
- Interne Dokumentationslinks in `docs/**/*.md` müssen root-relativ ohne `.md`- oder `.mdx`-Suffix bleiben (Beispiel: `[Config](/gateway/configuration)`).
- Querverweise auf Abschnitte sollten Anker auf root-relativen Pfaden verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Überschriften in der Dokumentation sollten keine Gedankenstriche und Apostrophe enthalten, da die Anker-Generierung von Mintlify dabei fehleranfällig ist.
- README-Dateien und andere auf GitHub gerenderte Dokumente sollten absolute Docs-URLs beibehalten, damit Links außerhalb von Mintlify funktionieren.
- Dokumentationsinhalte müssen allgemein bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; Platzhalter wie `user@gateway-host` verwenden.

## Regeln für Dokumentationsinhalte

- Für Dokumentation, UI-Texte und Auswahllisten Dienste/Provider alphabetisch sortieren, sofern der Abschnitt nicht ausdrücklich die Laufzeitreihenfolge oder automatische Erkennungsreihenfolge beschreibt.
- Die Benennung gebündelter Plugin konsistent mit den repo-weiten Terminologieregeln für Plugin in der root-`AGENTS.md` halten.

## Docs i18n

- Fremdsprachige Dokumentation wird in diesem Repo nicht gepflegt. Die generierte Veröffentlichungs-Ausgabe befindet sich im separaten Repo `openclaw/docs` (oft lokal als `../openclaw-docs` geklont).
- Lokalisierte Dokumentation unter `docs/<locale>/**` hier nicht hinzufügen oder bearbeiten.
- Englische Dokumentation in diesem Repo zusammen mit den Glossardateien als Quelle der Wahrheit behandeln.
- Pipeline: Englische Dokumentation hier aktualisieren, `docs/.i18n/glossary.<locale>.json` nach Bedarf aktualisieren, dann den Sync des Veröffentlichungs-Repos und `scripts/docs-i18n` in `openclaw/docs` ausführen lassen.
- Vor dem erneuten Ausführen von `scripts/docs-i18n` Glossareinträge für neue Fachbegriffe, Seitentitel oder kurze Navigationsbeschriftungen hinzufügen, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` ist die Absicherung für geänderte englische Dokumentationstitel und kurze interne Dokumentationsbeschriftungen.
- Translation Memory befindet sich in den generierten Dateien `docs/.i18n/*.tm.jsonl` im Veröffentlichungs-Repo.
- Siehe `docs/.i18n/README.md`.
