---
x-i18n:
    generated_at: "2026-04-12T23:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Leitfaden für die Dokumentation

Dieses Verzeichnis ist für die Dokumentationserstellung, Mintlify-Link-Regeln und die Dokumentations-i18n-Richtlinie zuständig.

## Mintlify-Regeln

- Die Dokumentation wird auf Mintlify gehostet (`https://docs.openclaw.ai`).
- Interne Dokumentationslinks in `docs/**/*.md` müssen root-relative bleiben und dürfen kein `.md`- oder `.mdx`-Suffix haben (Beispiel: `[Config](/configuration)`).
- Abschnittsübergreifende Verweise sollten Anker auf root-relativen Pfaden verwenden (Beispiel: `[Hooks](/configuration#hooks)`).
- Dokumentationsüberschriften sollten Gedankenstriche und Apostrophe vermeiden, da die Mintlify-Ankererzeugung dabei anfällig ist.
- README-Dateien und andere auf GitHub gerenderte Dokumente sollten absolute Dokumentations-URLs beibehalten, damit Links auch außerhalb von Mintlify funktionieren.
- Der Inhalt der Dokumentation muss allgemein bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Regeln für Dokumentationsinhalte

- Für Dokumentation, UI-Texte und Auswahllisten Dienste/Provider alphabetisch sortieren, sofern der Abschnitt nicht ausdrücklich die Laufzeitreihenfolge oder die Auto-Erkennungsreihenfolge beschreibt.
- Die Benennung gebündelter Plugins konsistent mit den repo-weiten Plugin-Terminologieregeln in der root-`AGENTS.md` halten.

## Docs i18n

- Fremdsprachige Dokumentation wird in diesem Repository nicht gepflegt. Die generierte veröffentlichte Ausgabe befindet sich im separaten Repository `openclaw/docs` (lokal oft als `../openclaw-docs` geklont).
- Fügen Sie hier keine lokalisierten Dokumente unter `docs/<locale>/**` hinzu und bearbeiten Sie sie nicht.
- Behandeln Sie die englische Dokumentation in diesem Repository zusammen mit den Glossardateien als Quelle der Wahrheit.
- Pipeline: Aktualisieren Sie hier die englische Dokumentation, aktualisieren Sie bei Bedarf `docs/.i18n/glossary.<locale>.json`, und lassen Sie dann die Synchronisierung des Veröffentlichungs-Repositorys sowie `scripts/docs-i18n` in `openclaw/docs` laufen.
- Bevor Sie `scripts/docs-i18n` erneut ausführen, fügen Sie Glossareinträge für neue Fachbegriffe, Seitentitel oder kurze Navigationsbeschriftungen hinzu, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` ist die Prüfschranke für geänderte englische Dokumentationstitel und kurze interne Dokumentationsbeschriftungen.
- Translation Memory befindet sich in den generierten `docs/.i18n/*.tm.jsonl`-Dateien im Veröffentlichungs-Repository.
- Siehe `docs/.i18n/README.md`.
