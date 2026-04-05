---
read_when:
    - Einrichten autonomer Agenten-Workflows, die ohne aufgabenspezifische Prompts ausgeführt werden
    - Definieren, was der Agent eigenständig tun kann und wofür eine menschliche Freigabe erforderlich ist
    - Strukturieren von Agenten mit mehreren Programmen und klaren Grenzen sowie Eskalationsregeln
summary: Definieren Sie dauerhafte Handlungsbefugnisse für autonome Agentenprogramme
title: Daueraufträge
x-i18n:
    generated_at: "2026-04-05T12:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81347d7a51a6ce20e6493277afee92073770f69a91a2e6b3bf87b99bb586d038
    source_path: automation/standing-orders.md
    workflow: 15
---

# Daueraufträge

Daueraufträge gewähren Ihrem Agenten **dauerhafte Handlungsbefugnisse** für festgelegte Programme. Anstatt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln — und der Agent arbeitet innerhalb dieser Grenzen autonom.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten „Sende jeden Freitag den Wochenbericht“ und der Erteilung dauerhafter Befugnisse: „Du bist für den Wochenbericht verantwortlich. Stelle ihn jeden Freitag zusammen, versende ihn und eskaliere nur, wenn etwas nicht stimmt.“

## Warum Daueraufträge?

**Ohne Daueraufträge:**

- Sie müssen den Agenten für jede Aufgabe einzeln auffordern
- Der Agent bleibt zwischen Anfragen untätig
- Routinemäßige Arbeit wird vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueraufträgen:**

- Der Agent arbeitet innerhalb definierter Grenzen autonom
- Routinemäßige Arbeit erfolgt planmäßig ohne Aufforderung
- Sie werden nur bei Ausnahmen und Freigaben einbezogen
- Der Agent nutzt Leerlaufzeit produktiv

## So funktionieren sie

Daueraufträge werden in den Dateien Ihres [Agent Workspace](/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch eingebunden wird), damit der Agent sie immer im Kontext hat. Bei größeren Konfigurationen können Sie sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und von `AGENTS.md` aus darauf verweisen.

Jedes Programm legt fest:

1. **Umfang** — was der Agent tun darf
2. **Auslöser** — wann es ausgeführt wird (Zeitplan, Ereignis oder Bedingung)
3. **Freigabeschranken** — was vor der Ausführung eine menschliche Freigabe erfordert
4. **Eskalationsregeln** — wann angehalten und um Hilfe gebeten werden soll

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Workspace (siehe [Agent Workspace](/concepts/agent-workspace) für die vollständige Liste automatisch eingebundener Dateien) und führt sie in Kombination mit [Cron-Jobs](/automation/cron-jobs) zur zeitbasierten Durchsetzung aus.

<Tip>
Legen Sie Daueraufträge in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Workspace-Bootstrap bindet `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` automatisch ein — aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau eines Dauerauftrags

```markdown
## Programm: Wöchentlicher Statusbericht

**Befugnis:** Daten zusammenstellen, Bericht erstellen, an Beteiligte senden
**Auslöser:** Jeden Freitag um 16:00 Uhr (durch Cron-Job erzwungen)
**Freigabeschranke:** Keine für Standardberichte. Auffälligkeiten zur menschlichen Prüfung markieren.
**Eskalation:** Wenn die Datenquelle nicht verfügbar ist oder Kennzahlen ungewöhnlich aussehen (>2σ vom Normalwert)

### Ausführungsschritte

1. Kennzahlen aus konfigurierten Quellen abrufen
2. Mit der Vorwoche und den Zielen vergleichen
3. Bericht unter Reports/weekly/YYYY-MM-DD.md erstellen
4. Zusammenfassung über den konfigurierten Kanal senden
5. Abschluss in Agent/Logs/ protokollieren

### Was NICHT zu tun ist

- Berichte nicht an externe Parteien senden
- Quelldaten nicht verändern
- Die Zustellung nicht auslassen, wenn Kennzahlen schlecht aussehen — korrekt berichten
```

## Daueraufträge + Cron-Jobs

Daueraufträge definieren, **was** der Agent tun darf. [Cron-Jobs](/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Dauerauftrag: „Du bist für die tägliche E-Mail-Triage verantwortlich“
    ↓
Cron-Job (täglich um 8 Uhr): „Führe die E-Mail-Triage gemäß Daueraufträgen aus“
    ↓
Agent: Liest Daueraufträge → führt Schritte aus → meldet Ergebnisse
```

Der Prompt des Cron-Jobs sollte auf den Dauerauftrag verweisen, statt ihn zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Beispiele

### Beispiel 1: Inhalte und Social Media (wöchentlicher Zyklus)

```markdown
## Programm: Inhalte und Social Media

**Befugnis:** Inhalte entwerfen, Beiträge planen, Berichte zum Engagement zusammenstellen
**Freigabeschranke:** Alle Beiträge erfordern in den ersten 30 Tagen die Prüfung durch den Eigentümer, danach dauerhafte Freigabe
**Auslöser:** Wöchentlicher Zyklus (Montagsprüfung → Entwürfe unter der Woche → Freitagsbriefing)

### Wöchentlicher Zyklus

- **Montag:** Plattformmetriken und Zielgruppeninteraktion prüfen
- **Dienstag–Donnerstag:** Social-Posts entwerfen, Blog-Inhalte erstellen
- **Freitag:** Wöchentliches Marketing-Briefing zusammenstellen → an den Eigentümer senden

### Inhaltsregeln

- Der Stil muss zur Marke passen (siehe SOUL.md oder Leitfaden zur Markenstimme)
- Sich in öffentlich sichtbaren Inhalten niemals als KI ausgeben
- Wenn verfügbar, Kennzahlen einbeziehen
- Den Fokus auf Mehrwert für die Zielgruppe legen, nicht auf Eigenwerbung
```

### Beispiel 2: Finanzabläufe (ereignisgesteuert)

```markdown
## Programm: Finanzverarbeitung

**Befugnis:** Transaktionsdaten verarbeiten, Berichte erstellen, Zusammenfassungen versenden
**Freigabeschranke:** Keine für Analysen. Empfehlungen erfordern die Freigabe des Eigentümers.
**Auslöser:** Neue Datendatei erkannt ODER geplanter monatlicher Zyklus

### Wenn neue Daten eintreffen

1. Neue Datei im vorgesehenen Eingabeverzeichnis erkennen
2. Alle Transaktionen parsen und kategorisieren
3. Mit Budgetzielen vergleichen
4. Markieren: ungewöhnliche Posten, Schwellenwertüberschreitungen, neue wiederkehrende Belastungen
5. Bericht im vorgesehenen Ausgabeverzeichnis erstellen
6. Zusammenfassung über den konfigurierten Kanal an den Eigentümer senden

### Eskalationsregeln

- Einzelposten > 500 $: sofortige Warnung
- Kategorie > Budget um 20 % überschritten: im Bericht markieren
- Nicht erkennbare Transaktion: Eigentümer nach Kategorisierung fragen
- Verarbeitung nach 2 Wiederholungen fehlgeschlagen: Fehler melden, nicht raten
```

### Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)

```markdown
## Programm: Systemüberwachung

**Befugnis:** Systemzustand prüfen, Dienste neu starten, Warnmeldungen senden
**Freigabeschranke:** Dienste automatisch neu starten. Eskalieren, wenn der Neustart zweimal fehlschlägt.
**Auslöser:** Jeder Heartbeat-Zyklus

### Prüfungen

- Health-Endpunkte der Dienste antworten
- Speicherplatz über dem Schwellenwert
- Ausstehende Aufgaben sind nicht veraltet (>24 Stunden)
- Zustellungskanäle sind betriebsbereit

### Reaktionsmatrix

| Bedingung        | Aktion                    | Eskalieren?              |
| ---------------- | ------------------------- | ------------------------ |
| Dienst ausgefallen | Automatisch neu starten | Nur wenn Neustart 2x fehlschlägt |
| Speicherplatz < 10% | Eigentümer warnen      | Ja                       |
| Veraltete Aufgabe > 24h | Eigentümer erinnern | Nein                     |
| Kanal offline    | Protokollieren und im nächsten Zyklus erneut versuchen | Wenn länger als 2 Stunden offline |
```

## Das Muster Ausführen-Verifizieren-Berichten

Daueraufträge funktionieren am besten in Kombination mit strenger Ausführungsdisziplin. Jede Aufgabe in einem Dauerauftrag sollte diesem Ablauf folgen:

1. **Ausführen** — Die eigentliche Arbeit erledigen (nicht nur die Anweisung bestätigen)
2. **Verifizieren** — Bestätigen, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** — Dem Eigentümer mitteilen, was erledigt und was verifiziert wurde

```markdown
### Ausführungsregeln

- Jede Aufgabe folgt Ausführen-Verifizieren-Berichten. Keine Ausnahmen.
- „Ich mache das“ ist keine Ausführung. Erledigen Sie es und berichten Sie dann.
- „Erledigt“ ohne Verifizierung ist nicht akzeptabel. Belegen Sie es.
- Wenn die Ausführung fehlschlägt: einmal mit angepasstem Ansatz erneut versuchen.
- Wenn es weiterhin fehlschlägt: Fehler mit Diagnose melden. Niemals stillschweigend fehlschlagen.
- Niemals unbegrenzt wiederholen — maximal 3 Versuche, dann eskalieren.
```

Dieses Muster verhindert den häufigsten Fehler bei Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Architektur mit mehreren Programmen

Für Agenten, die mehrere Aufgabenbereiche verwalten, sollten Daueraufträge als getrennte Programme mit klaren Grenzen organisiert werden:

```markdown
# Daueraufträge

## Programm 1: [Bereich A] (wöchentlich)

...

## Programm 2: [Bereich B] (monatlich + auf Abruf)

...

## Programm 3: [Bereich C] (nach Bedarf)

...

## Eskalationsregeln (alle Programme)

- [Gemeinsame Eskalationskriterien]
- [Freigabeschranken, die für alle Programme gelten]
```

Jedes Programm sollte Folgendes haben:

- Einen eigenen **Ausführungsrhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Freigabeschranken** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Tun

- Mit enger Befugnis beginnen und sie mit wachsendem Vertrauen erweitern
- Explizite Freigabeschranken für risikoreiche Aktionen definieren
- Abschnitte „Was NICHT zu tun ist“ einfügen — Grenzen sind genauso wichtig wie Berechtigungen
- Mit Cron-Jobs kombinieren, um eine verlässliche zeitbasierte Ausführung zu gewährleisten
- Agentenprotokolle wöchentlich prüfen, um zu verifizieren, dass Daueraufträge befolgt werden
- Daueraufträge aktualisieren, wenn sich Ihre Anforderungen weiterentwickeln — es sind lebende Dokumente

### Vermeiden

- Bereits am ersten Tag weitreichende Befugnisse gewähren („Mach einfach, was du für richtig hältst“)
- Eskalationsregeln auslassen — jedes Programm braucht eine Klausel „wann anhalten und nachfragen“
- Davon ausgehen, dass sich der Agent an mündliche Anweisungen erinnert — alles in die Datei schreiben
- Mehrere Themen in einem einzelnen Programm vermischen — getrennte Programme für getrennte Bereiche
- Die Durchsetzung mit Cron-Jobs vergessen — Daueraufträge ohne Auslöser werden zu Vorschlägen

## Verwandte Themen

- [Automation & Tasks](/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron Jobs](/automation/cron-jobs) — Zeitplandurchsetzung für Daueraufträge
- [Hooks](/automation/hooks) — ereignisgesteuerte Skripte für Agenten-Lebenszyklusereignisse
- [Webhooks](/automation/cron-jobs#webhooks) — eingehende HTTP-Ereignisauslöser
- [Agent Workspace](/concepts/agent-workspace) — wo Daueraufträge leben, einschließlich der vollständigen Liste automatisch eingebundener Bootstrap-Dateien (AGENTS.md, SOUL.md usw.)
