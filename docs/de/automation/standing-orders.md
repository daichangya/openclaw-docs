---
read_when:
    - Einrichten autonomer Agenten-Workflows, die ohne taskbezogene Aufforderungen ausgeführt werden
    - Festlegen, was der Agent selbstständig tun kann und wofür eine menschliche Genehmigung erforderlich ist
    - Strukturieren von Agenten mit mehreren Programmen mit klaren Grenzen und Eskalationsregeln
summary: Definieren Sie eine permanente Betriebsbefugnis für autonome Agentenprogramme
title: Daueranweisungen
x-i18n:
    generated_at: "2026-04-24T06:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Daueranweisungen gewähren Ihrem Agenten **permanente Betriebsbefugnis** für definierte Programme. Anstatt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln — und der Agent arbeitet innerhalb dieser Grenzen autonom.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten „Sende jeden Freitag den Wochenbericht“ und der Erteilung einer Dauerbefugnis: „Du bist für den Wochenbericht verantwortlich. Erstelle ihn jeden Freitag, versende ihn und eskaliere nur, wenn etwas nicht stimmt.“

## Warum Daueranweisungen?

**Ohne Daueranweisungen:**

- Sie müssen den Agenten für jede Aufgabe auffordern
- Der Agent bleibt zwischen Anfragen untätig
- Routinearbeiten werden vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueranweisungen:**

- Der Agent arbeitet innerhalb definierter Grenzen autonom
- Routinearbeiten erfolgen planmäßig ohne Aufforderung
- Sie werden nur bei Ausnahmen und Genehmigungen eingebunden
- Der Agent nutzt Leerlaufzeit produktiv

## So funktionieren sie

Daueranweisungen werden in den Dateien Ihres [Agent-Workspace](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch eingefügt wird), damit der Agent sie immer im Kontext hat. Bei größeren Konfigurationen können Sie sie auch in eine eigene Datei wie `standing-orders.md` auslagern und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt fest:

1. **Umfang** — was der Agent tun darf
2. **Auslöser** — wann ausgeführt werden soll (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschranken** — was vor der Ausführung menschliche Freigabe erfordert
4. **Eskalationsregeln** — wann angehalten und um Hilfe gebeten werden soll

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Workspace (siehe [Agent Workspace](/de/concepts/agent-workspace) für die vollständige Liste der automatisch eingefügten Dateien) und führt sie in Kombination mit [Cron-Jobs](/de/automation/cron-jobs) zur zeitbasierten Durchsetzung aus.

<Tip>
Legen Sie Daueranweisungen in `AGENTS.md` ab, damit sie in jeder Sitzung sicher geladen werden. Der Workspace-Bootstrap fügt automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` ein — aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau einer Daueranweisung

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Daueranweisungen + Cron-Jobs

Daueranweisungen definieren, **was** der Agent tun darf. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Der Prompt des Cron-Jobs sollte auf die Daueranweisung verweisen, anstatt sie zu duplizieren:

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
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Beispiel 2: Finanzabläufe (ereignisgesteuert)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Beispiel 3: Überwachung und Warnungen (kontinuierlich)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Das Muster Ausführen–Verifizieren–Berichten

Daueranweisungen funktionieren am besten in Kombination mit strikter Ausführungsdisziplin. Jede Aufgabe in einer Daueranweisung sollte dieser Schleife folgen:

1. **Ausführen** — Die eigentliche Arbeit erledigen (nicht nur die Anweisung bestätigen)
2. **Verifizieren** — Bestätigen, dass das Ergebnis korrekt ist (Datei vorhanden, Nachricht zugestellt, Daten geparst)
3. **Berichten** — Dem Eigentümer mitteilen, was erledigt wurde und was verifiziert wurde

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Dieses Muster verhindert den häufigsten Fehlermodus von Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Architektur mit mehreren Programmen

Für Agenten, die mehrere Bereiche verwalten, sollten Daueranweisungen als separate Programme mit klaren Grenzen organisiert werden:

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Jedes Programm sollte Folgendes haben:

- Einen eigenen **Ausführungsrhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschranken** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Tun Sie Folgendes

- Beginnen Sie mit engem Handlungsspielraum und erweitern Sie ihn, wenn Vertrauen entsteht
- Definieren Sie explizite Genehmigungsschranken für risikoreiche Aktionen
- Fügen Sie Abschnitte mit „Was NICHT zu tun ist“ hinzu — Grenzen sind genauso wichtig wie Berechtigungen
- Kombinieren Sie dies mit Cron-Jobs für zuverlässige zeitbasierte Ausführung
- Überprüfen Sie die Agent-Protokolle wöchentlich, um sicherzustellen, dass die Daueranweisungen eingehalten werden
- Aktualisieren Sie Daueranweisungen, wenn sich Ihre Anforderungen ändern — sie sind lebende Dokumente

### Vermeiden Sie Folgendes

- Von Anfang an weitreichende Befugnisse zu erteilen („Mach einfach, was du für das Beste hältst“)
- Eskalationsregeln zu überspringen — jedes Programm braucht eine Klausel dafür, „wann angehalten und gefragt werden soll“
- Davon auszugehen, dass sich der Agent an mündliche Anweisungen erinnert — schreiben Sie alles in die Datei
- Themen in einem einzigen Programm zu vermischen — getrennte Programme für getrennte Bereiche
- Zu vergessen, die Ausführung mit Cron-Jobs durchzusetzen — Daueranweisungen ohne Auslöser werden zu Vorschlägen

## Verwandt

- [Automatisierung und Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — zeitliche Durchsetzung für Daueranweisungen
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte für Lebenszyklusereignisse des Agenten
- [Webhooks](/de/automation/cron-jobs#webhooks) — eingehende HTTP-Ereignisauslöser
- [Agent Workspace](/de/concepts/agent-workspace) — wo Daueranweisungen abgelegt werden, einschließlich der vollständigen Liste automatisch eingefügter Bootstrap-Dateien (AGENTS.md, SOUL.md usw.)
