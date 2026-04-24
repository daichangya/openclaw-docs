---
read_when:
    - Sie möchten Sicherheitsbefunde oder Bedrohungsszenarien beitragen
    - Das Bedrohungsmodell prüfen oder aktualisieren
summary: Wie man zum Bedrohungsmodell von OpenClaw beiträgt
title: Zum Bedrohungsmodell beitragen
x-i18n:
    generated_at: "2026-04-24T06:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Zum Bedrohungsmodell von OpenClaw beitragen

Danke, dass Sie helfen, OpenClaw sicherer zu machen. Dieses Bedrohungsmodell ist ein lebendes Dokument, und wir freuen uns über Beiträge von allen — Sie müssen kein Sicherheitsexperte sein.

## Möglichkeiten beizutragen

### Eine Bedrohung hinzufügen

Haben Sie einen Angriffsvektor oder ein Risiko entdeckt, das wir noch nicht abgedeckt haben? Eröffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreiben Sie es mit Ihren eigenen Worten. Sie müssen keine Frameworks kennen oder jedes Feld ausfüllen — beschreiben Sie einfach das Szenario.

**Hilfreich einzuschließen (aber nicht erforderlich):**

- Das Angriffsszenario und wie es ausgenutzt werden könnte
- Welche Teile von OpenClaw betroffen sind (CLI, Gateway, Kanäle, ClawHub, MCP-Server usw.)
- Wie schwerwiegend Sie es einschätzen (niedrig / mittel / hoch / kritisch)
- Links zu verwandter Forschung, CVEs oder Beispielen aus der Praxis

Wir übernehmen die ATLAS-Zuordnung, Threat-IDs und die Risikobewertung bei der Prüfung. Wenn Sie diese Details angeben möchten, umso besser — erwartet wird es aber nicht.

> **Dies dient dem Hinzufügen zum Bedrohungsmodell, nicht dem Melden aktiver Schwachstellen.** Wenn Sie eine ausnutzbare Schwachstelle gefunden haben, lesen Sie unsere [Trust-Seite](https://trust.openclaw.ai) für Anweisungen zur verantwortungsvollen Offenlegung.

### Eine Mitigation vorschlagen

Haben Sie eine Idee, wie eine bestehende Bedrohung adressiert werden kann? Eröffnen Sie ein Issue oder einen PR mit Verweis auf die Bedrohung. Nützliche Mitigations sind spezifisch und umsetzbar — zum Beispiel ist „Rate-Limiting pro Absender von 10 Nachrichten/Minute am Gateway“ besser als „Rate-Limiting implementieren“.

### Eine Angriffskette vorschlagen

Angriffsketten zeigen, wie mehrere Bedrohungen zu einem realistischen Angriffsszenario kombiniert werden. Wenn Sie eine gefährliche Kombination sehen, beschreiben Sie die Schritte und wie ein Angreifer sie miteinander verketten würde. Eine kurze Erzählung darüber, wie sich der Angriff in der Praxis entfaltet, ist wertvoller als eine formale Vorlage.

### Bestehende Inhalte korrigieren oder verbessern

Tippfehler, Klarstellungen, veraltete Informationen, bessere Beispiele — PRs sind willkommen, ein Issue ist nicht erforderlich.

## Was wir verwenden

### MITRE ATLAS

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), einem Framework, das speziell für Bedrohungen in KI/ML entwickelt wurde, wie Prompt-Injection, Tool-Missbrauch und Agenten-Ausnutzung. Sie müssen ATLAS nicht kennen, um beizutragen — wir ordnen Einreichungen bei der Prüfung dem Framework zu.

### Threat-IDs

Jede Bedrohung erhält eine ID wie `T-EXEC-003`. Die Kategorien sind:

| Code    | Kategorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance — Informationsgewinnung     |
| ACCESS  | Initial access — Zutritt erlangen          |
| EXEC    | Execution — bösartige Aktionen ausführen   |
| PERSIST | Persistence — Zugriff aufrechterhalten     |
| EVADE   | Defense evasion — Erkennung umgehen        |
| DISC    | Discovery — die Umgebung kennenlernen      |
| EXFIL   | Exfiltration — Daten stehlen               |
| IMPACT  | Impact — Schaden oder Störung              |

IDs werden bei der Prüfung von Maintainern vergeben. Sie müssen keine auswählen.

### Risikostufen

| Stufe         | Bedeutung                                                          |
| ------------- | ------------------------------------------------------------------ |
| **Kritisch**  | Vollständige Kompromittierung des Systems oder hohe Wahrscheinlichkeit + kritische Auswirkungen |
| **Hoch**      | Erheblicher Schaden wahrscheinlich oder mittlere Wahrscheinlichkeit + kritische Auswirkungen |
| **Mittel**    | Moderates Risiko oder geringe Wahrscheinlichkeit + hohe Auswirkungen |
| **Niedrig**   | Unwahrscheinlich und begrenzte Auswirkungen                        |

Wenn Sie sich bei der Risikostufe unsicher sind, beschreiben Sie einfach die Auswirkungen, und wir bewerten sie.

## Prüfprozess

1. **Triage** — Wir prüfen neue Einreichungen innerhalb von 48 Stunden
2. **Bewertung** — Wir prüfen die Machbarkeit, ordnen ATLAS zu und vergeben eine Threat-ID, validieren die Risikostufe
3. **Dokumentation** — Wir stellen sicher, dass alles formatiert und vollständig ist
4. **Zusammenführen** — Hinzufügen zum Bedrohungsmodell und zur Visualisierung

## Ressourcen

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/de/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Sicherheitslücken:** Anweisungen zum Melden finden Sie auf unserer [Trust-Seite](https://trust.openclaw.ai)
- **Fragen zum Bedrohungsmodell:** Eröffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Allgemeiner Chat:** Discord-Kanal #security

## Anerkennung

Mitwirkende am Bedrohungsmodell werden für bedeutende Beiträge in den Danksagungen des Bedrohungsmodells, in Release Notes und in der OpenClaw Security Hall of Fame genannt.

## Verwandt

- [Threat model](/de/security/THREAT-MODEL-ATLAS)
- [Formal verification](/de/security/formal-verification)
