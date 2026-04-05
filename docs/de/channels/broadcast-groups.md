---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Antworten mehrerer Agents in WhatsApp debuggen
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agents senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-04-05T12:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# Broadcast-Gruppen

**Status:** Experimentell  
**Version:** Hinzugefügt in 2026.1.9

## Überblick

Broadcast-Gruppen ermöglichen es mehreren Agents, dieselbe Nachricht gleichzeitig zu verarbeiten und darauf zu antworten. So können Sie spezialisierte Agent-Teams erstellen, die in einer einzigen WhatsApp-Gruppe oder DM zusammenarbeiten — und dabei alle dieselbe Telefonnummer verwenden.

Aktueller Umfang: **nur WhatsApp** (Web-Kanal).

Broadcast-Gruppen werden nach Channel-Allowlisten und Gruppenaktivierungsregeln ausgewertet. In WhatsApp-Gruppen bedeutet das, dass Broadcasts dann stattfinden, wenn OpenClaw normalerweise antworten würde (zum Beispiel bei Erwähnung, abhängig von Ihren Gruppeneinstellungen).

## Anwendungsfälle

### 1. Spezialisierte Agent-Teams

Stellen Sie mehrere Agents mit atomaren, klar abgegrenzten Aufgaben bereit:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Jeder Agent verarbeitet dieselbe Nachricht und liefert seine spezialisierte Perspektive.

### 2. Mehrsprachige Unterstützung

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Qualitätssicherungs-Workflows

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Aufgabenautomatisierung

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Konfiguration

### Grundlegende Einrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Die Schlüssel sind WhatsApp-Peer-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- DMs: E.164-Telefonnummer (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, führt es alle drei Agents aus.

### Verarbeitungsstrategie

Steuern Sie, wie Agents Nachrichten verarbeiten:

#### Parallel (Standard)

Alle Agents verarbeiten gleichzeitig:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequenziell

Agents verarbeiten der Reihe nach (einer wartet, bis der vorherige fertig ist):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Vollständiges Beispiel

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## So funktioniert es

### Nachrichtenfluss

1. **Eingehende Nachricht** trifft in einer WhatsApp-Gruppe ein
2. **Broadcast-Prüfung**: Das System prüft, ob die Peer-ID in `broadcast` enthalten ist
3. **Wenn in der Broadcast-Liste**:
   - Alle aufgeführten Agents verarbeiten die Nachricht
   - Jeder Agent hat seinen eigenen Sitzungsschlüssel und isolierten Kontext
   - Agents verarbeiten parallel (Standard) oder sequenziell
4. **Wenn nicht in der Broadcast-Liste**:
   - Normales Routing wird angewendet (erste passende Bindung)

Hinweis: Broadcast-Gruppen umgehen keine Channel-Allowlisten oder Gruppenaktivierungsregeln (Erwähnungen/Befehle/etc.). Sie ändern nur, _welche Agents ausgeführt werden_, wenn eine Nachricht für die Verarbeitung infrage kommt.

### Sitzungsisolierung

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennte:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Konversationsverlauf** (der Agent sieht die Nachrichten anderer Agents nicht)
- **Workspace** (separate Sandboxes, falls konfiguriert)
- **Tool-Zugriff** (unterschiedliche Allow-/Deny-Listen)
- **Speicher/Kontext** (separate IDENTITY.md, SOUL.md usw.)
- **Gruppenkontextpuffer** (aktuelle Gruppennachrichten, die als Kontext verwendet werden) wird pro Peer gemeinsam genutzt, sodass alle Broadcast-Agents beim Auslösen denselben Kontext sehen

Dadurch kann jeder Agent Folgendes haben:

- Unterschiedliche Persönlichkeiten
- Unterschiedlichen Tool-Zugriff (z. B. schreibgeschützt vs. Lese-/Schreibzugriff)
- Unterschiedliche Modelle (z. B. opus vs. sonnet)
- Unterschiedliche installierte Skills

### Beispiel: Isolierte Sitzungen

In Gruppe `120363403215116621@g.us` mit Agents `["alfred", "baerbel"]`:

**Alfreds Kontext:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbels Kontext:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Best Practices

### 1. Agents fokussiert halten

Entwerfen Sie jeden Agent mit einer einzelnen, klaren Aufgabe:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Gut:** Jeder Agent hat genau eine Aufgabe  
❌ **Schlecht:** Ein allgemeiner „dev-helper“-Agent

### 2. Beschreibende Namen verwenden

Machen Sie klar, was jeder Agent tut:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Unterschiedlichen Tool-Zugriff konfigurieren

Geben Sie Agents nur die Tools, die sie benötigen:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Nur lesen
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Lesen und schreiben
    }
  }
}
```

### 4. Leistung überwachen

Bei vielen Agents sollten Sie Folgendes beachten:

- `"strategy": "parallel"` (Standard) für Geschwindigkeit verwenden
- Broadcast-Gruppen auf 5–10 Agents begrenzen
- Schnellere Modelle für einfachere Agents verwenden

### 5. Fehler robust behandeln

Agents schlagen unabhängig voneinander fehl. Der Fehler eines Agents blockiert die anderen nicht:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Kompatibilität

### Provider

Broadcast-Gruppen funktionieren derzeit mit:

- ✅ WhatsApp (implementiert)
- 🚧 Telegram (geplant)
- 🚧 Discord (geplant)
- 🚧 Slack (geplant)

### Routing

Broadcast-Gruppen funktionieren zusammen mit bestehendem Routing:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Nur alfred antwortet (normales Routing)
- `GROUP_B`: agent1 UND agent2 antworten (Broadcast)

**Priorität:** `broadcast` hat Vorrang vor `bindings`.

## Fehlerbehebung

### Agents antworten nicht

**Prüfen Sie:**

1. Agent-IDs existieren in `agents.list`
2. Das Peer-ID-Format ist korrekt (z. B. `120363403215116621@g.us`)
3. Agents sind nicht in Deny-Listen enthalten

**Debuggen:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Nur ein Agent antwortet

**Ursache:** Die Peer-ID befindet sich möglicherweise in `bindings`, aber nicht in `broadcast`.

**Behebung:** Zur Broadcast-Konfiguration hinzufügen oder aus `bindings` entfernen.

### Leistungsprobleme

**Wenn es mit vielen Agents langsam ist:**

- Anzahl der Agents pro Gruppe reduzieren
- Leichtere Modelle verwenden (sonnet statt opus)
- Startzeit der Sandbox prüfen

## Beispiele

### Beispiel 1: Code-Review-Team

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Benutzer sendet:** Code-Snippet  
**Antworten:**

- code-formatter: „Einrückung korrigiert und Typhinweise hinzugefügt“
- security-scanner: „⚠️ SQL-Injection-Schwachstelle in Zeile 12“
- test-coverage: „Abdeckung liegt bei 45 %, fehlende Tests für Fehlerfälle“
- docs-checker: „Fehlender Docstring für Funktion `process_data`“

### Beispiel 2: Mehrsprachige Unterstützung

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API-Referenz

### Konfigurationsschema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Felder

- `strategy` (optional): Wie Agents verarbeitet werden
  - `"parallel"` (Standard): Alle Agents verarbeiten gleichzeitig
  - `"sequential"`: Agents verarbeiten in der Reihenfolge des Arrays
- `[peerId]`: WhatsApp-Gruppen-JID, E.164-Nummer oder andere Peer-ID
  - Wert: Array von Agent-IDs, die Nachrichten verarbeiten sollen

## Einschränkungen

1. **Max. Agents:** Keine harte Obergrenze, aber 10+ Agents können langsam sein
2. **Gemeinsamer Kontext:** Agents sehen die Antworten der anderen nicht (absichtlich so)
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen
4. **Rate Limits:** Alle Agents zählen zu den WhatsApp-Rate-Limits

## Zukünftige Erweiterungen

Geplante Funktionen:

- [ ] Modus für gemeinsamen Kontext (Agents sehen die Antworten der anderen)
- [ ] Agent-Koordination (Agents können sich gegenseitig Signale senden)
- [ ] Dynamische Agent-Auswahl (Agents basierend auf dem Nachrichteninhalt auswählen)
- [ ] Agent-Prioritäten (einige Agents antworten vor anderen)

## Siehe auch

- [Multi-Agent-Konfiguration](/tools/multi-agent-sandbox-tools)
- [Routing-Konfiguration](/channels/channel-routing)
- [Sitzungsverwaltung](/concepts/session)
