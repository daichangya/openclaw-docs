---
read_when:
    - Du möchtest Sicherheitsbefunde oder Bedrohungsszenarien beitragen
    - Überprüfen oder Aktualisieren des Bedrohungsmodells
summary: Wie man zum Bedrohungsmodell von OpenClaw beiträgt
title: Zum Bedrohungsmodell beitragen
x-i18n:
    generated_at: "2026-04-05T12:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Zum Bedrohungsmodell von OpenClaw beitragen

Danke, dass du dabei hilfst, OpenClaw sicherer zu machen. Dieses Bedrohungsmodell ist ein lebendes Dokument, und wir freuen uns über Beiträge von allen – du musst kein Sicherheitsexperte sein.

## Möglichkeiten zum Beitragen

### Eine Bedrohung hinzufügen

Du hast einen Angriffsvektor oder ein Risiko entdeckt, das wir noch nicht abgedeckt haben? Eröffne ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreibe es in deinen eigenen Worten. Du musst keine Frameworks kennen oder jedes Feld ausfüllen – beschreibe einfach das Szenario.

**Hilfreich ist Folgendes (aber nicht erforderlich):**

- Das Angriffsszenario und wie es ausgenutzt werden könnte
- Welche Teile von OpenClaw betroffen sind (CLI, Gateway, Channels, ClawHub, MCP-Server usw.)
- Wie schwerwiegend du es einschätzt (niedrig / mittel / hoch / kritisch)
- Links zu verwandter Forschung, CVEs oder Beispielen aus der Praxis

Wir übernehmen das ATLAS-Mapping, die Bedrohungs-IDs und die Risikobewertung während der Prüfung. Wenn du diese Details angeben möchtest, großartig – erwartet wird es aber nicht.

> **Dies ist zum Ergänzen des Bedrohungsmodells gedacht, nicht zum Melden aktiver Sicherheitslücken.** Wenn du eine ausnutzbare Sicherheitslücke gefunden hast, lies auf unserer [Trust-Seite](https://trust.openclaw.ai) die Anweisungen zur verantwortungsvollen Offenlegung.

### Eine Gegenmaßnahme vorschlagen

Du hast eine Idee, wie eine bestehende Bedrohung entschärft werden kann? Eröffne ein Issue oder einen PR mit Verweis auf die Bedrohung. Nützliche Gegenmaßnahmen sind konkret und umsetzbar – zum Beispiel ist „senderbezogene Ratenbegrenzung von 10 Nachrichten/Minute am Gateway“ besser als „Ratenbegrenzung implementieren“.

### Eine Angriffskette vorschlagen

Angriffsketten zeigen, wie mehrere Bedrohungen zu einem realistischen Angriffsszenario kombiniert werden. Wenn du eine gefährliche Kombination siehst, beschreibe die Schritte und wie ein Angreifer sie miteinander verketten würde. Eine kurze Erzählung darüber, wie sich der Angriff in der Praxis entfaltet, ist wertvoller als eine formale Vorlage.

### Bestehende Inhalte korrigieren oder verbessern

Tippfehler, Klarstellungen, veraltete Informationen, bessere Beispiele – PRs sind willkommen, ein Issue ist nicht nötig.

## Was wir verwenden

### MITRE ATLAS

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), einem Framework, das speziell für KI-/ML-Bedrohungen wie Prompt Injection, Tool-Missbrauch und Agent-Ausnutzung entwickelt wurde. Du musst ATLAS nicht kennen, um beizutragen – wir ordnen Einreichungen während der Prüfung dem Framework zu.

### Bedrohungs-IDs

Jede Bedrohung erhält eine ID wie `T-EXEC-003`. Die Kategorien sind:

| Code    | Kategorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - Informationssammlung      |
| ACCESS  | Initial access - Erstzugang erlangen       |
| EXEC    | Execution - bösartige Aktionen ausführen   |
| PERSIST | Persistence - Zugriff aufrechterhalten     |
| EVADE   | Defense evasion - Erkennung vermeiden      |
| DISC    | Discovery - die Umgebung kennenlernen      |
| EXFIL   | Exfiltration - Daten stehlen               |
| IMPACT  | Impact - Schaden oder Störung verursachen  |

IDs werden von Maintainers während der Prüfung vergeben. Du musst keine auswählen.

### Risikostufen

| Stufe        | Bedeutung                                                         |
| ------------ | ----------------------------------------------------------------- |
| **Critical** | Vollständige Systemkompromittierung oder hohe Wahrscheinlichkeit + kritische Auswirkungen |
| **High**     | Wahrscheinlich erheblicher Schaden oder mittlere Wahrscheinlichkeit + kritische Auswirkungen |
| **Medium**   | Mittleres Risiko oder geringe Wahrscheinlichkeit + hohe Auswirkungen |
| **Low**      | Unwahrscheinlich und begrenzte Auswirkungen                       |

Wenn du dir bei der Risikostufe unsicher bist, beschreibe einfach die Auswirkungen, und wir bewerten sie.

## Prüfprozess

1. **Triage** – Wir prüfen neue Einreichungen innerhalb von 48 Stunden
2. **Bewertung** – Wir verifizieren die Umsetzbarkeit, weisen ATLAS-Mapping und Bedrohungs-ID zu und validieren die Risikostufe
3. **Dokumentation** – Wir stellen sicher, dass alles formatiert und vollständig ist
4. **Zusammenführen** – Wird dem Bedrohungsmodell und der Visualisierung hinzugefügt

## Ressourcen

- [ATLAS-Website](https://atlas.mitre.org/)
- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [OpenClaw-Bedrohungsmodell](/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Sicherheitslücken:** Anweisungen zum Melden findest du auf unserer [Trust-Seite](https://trust.openclaw.ai)
- **Fragen zum Bedrohungsmodell:** Eröffne ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Allgemeiner Chat:** Discord-Kanal #security

## Anerkennung

Beitragende zum Bedrohungsmodell werden für bedeutende Beiträge in den Danksagungen des Bedrohungsmodells, in Release Notes und in der OpenClaw Security Hall of Fame gewürdigt.
