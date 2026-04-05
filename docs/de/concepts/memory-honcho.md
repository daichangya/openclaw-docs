---
read_when:
    - Sie möchten persistente memory, die über Sitzungen und Kanäle hinweg funktioniert
    - Sie möchten KI-gestützte Erinnerung und Benutzermodellierung
summary: KI-native sitzungsübergreifende memory über das Honcho-Plugin
title: Honcho Memory
x-i18n:
    generated_at: "2026-04-05T12:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Honcho Memory

[Honcho](https://honcho.dev) fügt OpenClaw KI-native memory hinzu. Es persistiert
Konversationen in einem dedizierten Dienst und erstellt im Laufe der Zeit Benutzer- und Agentenmodelle,
wodurch Ihr Agent sitzungsübergreifenden Kontext erhält, der über Workspace-Markdown-
Dateien hinausgeht.

## Was es bereitstellt

- **Sitzungsübergreifende memory** -- Konversationen werden nach jedem Zug persistiert, sodass
  Kontext über Sitzungs-Resets, Komprimierung und Kanalwechsel hinweg erhalten bleibt.
- **Benutzermodellierung** -- Honcho pflegt für jeden Benutzer ein Profil (Präferenzen,
  Fakten, Kommunikationsstil) und für den Agenten (Persönlichkeit, gelernte
  Verhaltensweisen).
- **Semantische Suche** -- Suche über Beobachtungen aus früheren Konversationen, nicht
  nur in der aktuellen Sitzung.
- **Multi-Agent-Bewusstsein** -- Eltern-Agenten verfolgen automatisch erzeugte
  Subagenten, wobei Eltern in untergeordneten Sitzungen als Beobachter hinzugefügt werden.

## Verfügbare Tools

Honcho registriert Tools, die der Agent während der Konversation verwenden kann:

**Datenabruf (schnell, kein LLM-Aufruf):**

| Tool                        | Was es macht                                          |
| --------------------------- | ----------------------------------------------------- |
| `honcho_context`            | Vollständige Benutzerdarstellung über Sitzungen hinweg |
| `honcho_search_conclusions` | Semantische Suche über gespeicherte Schlussfolgerungen |
| `honcho_search_messages`    | Nachrichten über Sitzungen hinweg finden (nach Absender, Datum filtern) |
| `honcho_session`            | Aktuelle Sitzungshistorie und Zusammenfassung         |

**Q&A (LLM-gestützt):**

| Tool         | Was es macht                                                             |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Fragen Sie nach dem Benutzer. `depth='quick'` für Fakten, `'thorough'` für Synthese |

## Erste Schritte

Installieren Sie das Plugin und führen Sie die Einrichtung aus:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Der Einrichtungsbefehl fordert Sie zur Eingabe Ihrer API-Zugangsdaten auf, schreibt die Konfiguration und
migriert optional bestehende Workspace-memory-Dateien.

<Info>
Honcho kann vollständig lokal (selbst gehostet) oder über die verwaltete API unter
`api.honcho.dev` ausgeführt werden. Für die selbst gehostete Option sind keine externen Abhängigkeiten erforderlich.
</Info>

## Konfiguration

Die Einstellungen befinden sich unter `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // für selbst gehostet weglassen
          workspaceId: "openclaw", // memory-Isolierung
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Bei selbst gehosteten Instanzen zeigen Sie `baseUrl` auf Ihren lokalen Server (zum Beispiel
`http://localhost:8000`) und lassen den API-Schlüssel weg.

## Bestehende memory migrieren

Wenn Sie bereits bestehende Workspace-memory-Dateien haben (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), erkennt `openclaw honcho setup` diese und
bietet an, sie zu migrieren.

<Info>
Die Migration ist nicht destruktiv -- Dateien werden zu Honcho hochgeladen. Originale werden
niemals gelöscht oder verschoben.
</Info>

## So funktioniert es

Nach jedem KI-Zug wird die Konversation zu Honcho persistiert. Sowohl Benutzer- als auch
Agentennachrichten werden beobachtet, sodass Honcho seine Modelle im Laufe der Zeit aufbauen und verfeinern kann.

Während der Konversation fragen Honcho-Tools den Dienst in der Phase `before_prompt_build` ab
und fügen relevanten Kontext ein, bevor das Modell den Prompt sieht. Dies stellt
präzise Zuggrenzen und relevante Erinnerung sicher.

## Honcho vs eingebaute memory

|                   | Eingebaut / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Speicherung**   | Workspace-Markdown-Dateien    | Dedizierter Dienst (lokal oder gehostet) |
| **Sitzungsübergreifend** | Über memory-Dateien     | Automatisch, eingebaut              |
| **Benutzermodellierung** | Manuell (in `MEMORY.md` schreiben) | Automatische Profile         |
| **Suche**         | Vektor + Schlüsselwort (hybrid) | Semantisch über Beobachtungen     |
| **Multi-Agent**   | Nicht nachverfolgt            | Eltern-/Kind-Bewusstsein            |
| **Abhängigkeiten**| Keine (eingebaut) oder QMD-Binärdatei | Plugin-Installation          |

Honcho und das eingebaute memory-System können zusammenarbeiten. Wenn QMD konfiguriert ist,
werden zusätzliche Tools für die Suche in lokalen Markdown-Dateien neben Honchos sitzungsübergreifender memory verfügbar.

## CLI-Befehle

```bash
openclaw honcho setup                        # API-Schlüssel konfigurieren und Dateien migrieren
openclaw honcho status                       # Verbindungsstatus prüfen
openclaw honcho ask <question>               # Honcho nach dem Benutzer fragen
openclaw honcho search <query> [-k N] [-d D] # Semantische Suche über memory
```

## Weiterführende Informationen

- [Plugin-Quellcode](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-Dokumentation](https://docs.honcho.dev)
- [Honcho OpenClaw-Integrationsleitfaden](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- OpenClaw-memory-Überblick
- [Context Engines](/concepts/context-engine) -- wie Context Engines von Plugins funktionieren
