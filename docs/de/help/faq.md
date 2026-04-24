---
read_when:
    - Beantworten häufiger Fragen zu Einrichtung, Installation, Onboarding oder Runtime-Support
    - Einordnen von durch Benutzer gemeldeten Problemen vor einer tieferen Fehleranalyse
summary: Häufig gestellte Fragen zu Einrichtung, Konfiguration und Verwendung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-24T06:41:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

Schnelle Antworten plus tiefere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Keys, Model failover). Für Runtime-Diagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Gateway-/Dienst-Erreichbarkeit, Agenten/Sitzungen, Provider-Konfiguration + Runtime-Probleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher teilbar)**

   ```bash
   openclaw status --all
   ```

   Nur lesende Diagnose mit Log-Tail (Tokens redigiert).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Runtime vs. RPC-Erreichbarkeit, die Probe-Ziel-URL und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefe Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Health-Probe aus, einschließlich Kanal-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log mitverfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, verwenden Sie stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind getrennt von Dienstlogs; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/State + führt Health-Checks aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Fragen und Antworten zur Ersteinrichtung — Installation, Onboarding, Auth-Routen, Abonnements, anfängliche
Fehler — wurden auf eine eigene Seite verschoben:
[FAQ — Schnellstart und Einrichtung beim ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Kanal-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die immer aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **lokal-first-Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** betreiben können, erreichbar aus den Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Tools — ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway dort aus, wo Sie möchten (Mac, Linux, VPS), und halten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit Routing
      pro Agent und Failover.
    - **Nur lokal als Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** getrennte Agenten pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und hackbar:** ohne Vendor Lock-in prüfen, erweitern und selbst hosten.

    Dokumentation: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet — was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Seite).
    - Eine mobile App prototypen (Überblick, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tags).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agenten für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Inbox, Kalender und Nachrichten, die Ihnen wichtig sind.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** von Cron oder Heartbeat gesteuerte Anstöße und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und wiederkehrende Web-Aufgaben.
    - **Geräteübergreifende Koordination:** eine Aufgabe vom Handy senden, das Gateway sie auf einem Server ausführen lassen und das Ergebnis im Chat zurückerhalten.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    potenzielle Kunden zusammenfassen und Outreach- oder Werbetext-Entwürfe schreiben.

    Für **Outreach oder Werbekampagnen** sollten Menschen in der Schleife bleiben. Vermeiden Sie Spam, beachten Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw entwerfen zu lassen und dann von Ihnen genehmigen zu lassen.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für die Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsebene, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repositorys. Verwenden Sie OpenClaw, wenn Sie
    dauerhafte Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistente Memory + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Immer aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie kann ich Skills anpassen, ohne das Repo verschmutzt zu halten?">
    Verwenden Sie verwaltete Überschreibungen, statt die Kopie im Repo zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie einen Ordner über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin Vorrang vor gebündelten Skills haben, ohne Git anzufassen. Wenn der Skill global installiert sein soll, aber nur für einige Agenten sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die sich für Upstream eignen, sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agenten sichtbar sein soll, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für verschiedene Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agenten**: leiten Sie Aufgaben an getrennte Agenten mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie kann ich das auslagern?">
    Verwenden Sie **Sub-Agenten** für lange oder parallele Aufgaben. Sub-Agenten laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „für diese Aufgabe einen Sub-Agenten zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Hinweis: Sowohl lange Aufgaben als auch Sub-Agenten verbrauchen Tokens. Wenn Kosten wichtig sind, setzen Sie ein
    günstigeres Modell für Sub-Agenten über `agents.defaults.subagents.model`.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Sub-Agent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an ein Ziel eines Sub-Agenten oder einer Sitzung binden, sodass Folgemeldungen in diesem Thread bei derselben gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistentes Follow-up).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Binding-Status zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um das automatische Entfokussieren zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Überschreibungen: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-Binding beim Start: Setzen Sie `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent ist fertig, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gesendet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung im Completion-Modus für Sub-Agenten bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine vorhanden ist.
    - Wenn der Completion-Ursprung nur einen Kanal enthält, fällt OpenClaw auf die gespeicherte Route der Requester-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) zurück, sodass direkte Zustellung weiterhin erfolgreich sein kann.
    - Wenn weder eine gebundene Route noch eine brauchbare gespeicherte Route existiert, kann direkte Zustellung fehlschlagen und das Ergebnis fällt auf die Zustellung in die Warteschlange der Sitzung zurück, anstatt sofort im Chat zu posten.
    - Ungültige oder veraltete Ziele können weiterhin Queue-Fallback oder endgültiges Zustellungsversagen erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach nur Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies auf eine kurze Zusammenfassung des Teilfortschritts reduzieren, statt rohe Tool-Ausgabe wiederzugeben.

    Fehleranalyse:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Schlafmodus/keine Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` vs. Zeitzone des Hosts).

    Fehleranalyse:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung und Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellungsmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Runner-Fallback-Senden erwartet wird.
    - Ein fehlendes oder ungültiges Announce-Ziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, aber die Anmeldedaten dies blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Zustellung über den Queue-Fallback.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem Tool `message`
    senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den Runner-
    Fallback-Pfad für finalen Text, den der Agent nicht bereits selbst gesendet hat.

    Fehleranalyse:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, nicht eine doppelte Planung.

    Isolierter Cron kann eine Runtime-Übergabe des Modells persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der Wiederholungsversuch behält das umgeschaltete
    Provider-/Modellpaar bei, und wenn der Wechsel ein neues Auth-Profil-Override mit sich brachte, persistiert Cron dieses ebenfalls vor dem erneuten Versuch.

    Verwandte Auswahlregeln:

    - Das Modell-Override des Gmail-Hooks gewinnt zuerst, wenn es zutrifft.
    - Dann das `model` pro Job.
    - Dann ein gespeichertes Modell-Override der Cron-Sitzung.
    - Dann die normale Auswahl des Agent-/Standardmodells.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen
    bricht Cron ab, statt endlos zu schleifen.

    Fehleranalyse:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Workspace ab. Die macOS-Skills-UI ist unter Linux nicht verfügbar.
    Durchsuchen Sie Skills unter [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Native `openclaw skills install` schreibt in das aktive Workspace-Verzeichnis `skills/`.
    Installieren Sie die separate CLI `clawhub` nur, wenn Sie eigene Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über mehrere Agenten hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Scheduler des Gateway:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung und Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien begrenzt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden reine `darwin`-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie das Gating nicht überschreiben.

    Sie haben drei unterstützte Muster:

    **Option A - das Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (ohne SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App), und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann reine macOS-Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie „Always Ask“ wählen, fügt das Genehmigen von „Always Allow“ im Prompt diesen Befehl zur Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxien (fortgeschritten).**
    Behalten Sie das Gateway unter Linux, aber lassen Sie die erforderlichen CLI-Binärdateien auf SSH-Wrapper auflösen, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill, um Linux zuzulassen, damit er weiterhin zulässig bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zuzulassen:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Snapshot der Skills aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Integration für Notion oder HeyGen?">
    Heute nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion und HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite am Anfang einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, eröffnen Sie einen Feature-Request oder erstellen Sie einen Skill,
    der diese APIs anspricht.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im Verzeichnis `skills/` des aktiven Workspace. Für gemeinsame Skills über mehrere Agenten hinweg legen Sie sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Linux-FAQ-Eintrag zu Homebrew oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie nutze ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte Browser-Profil `user`, das über Chrome DevTools MCP anhängt:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den lokalen Host-Browser oder einen verbundenen Browser-Node verwenden. Wenn das Gateway anderswo läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen bei `existing-session` / `user`:

    - Aktionen sind referenzgesteuert, nicht CSS-Selektor-gesteuert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit nur eine Datei auf einmal
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Dokumentation zum Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich alle Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es
    weder Systempakete noch Homebrew oder gebündelte Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass dieser Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, aber Gruppen öffentlich/in einer Sandbox mit einem Agenten machen?">
    Ja — wenn Ihr privater Datenverkehr **DMs** und Ihr öffentlicher Datenverkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanal-Sitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Schränken Sie dann über `tools.sandbox.tools` ein, welche Tools in Sandbox-Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + agentbezogene Bindings werden zusammengeführt; agentbezogene Bindings werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin fail-closed fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und dass Prüfungen auf erlaubte Roots auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor Compaction** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen dies). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie mache ich sie dauerhaft?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Dies ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Memories zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin Dinge vergisst, verifizieren Sie, dass das Gateway bei jedem
    Lauf denselben Workspace verwendet.

    Dokumentation: [Memory](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer bestehen? Was sind die Grenzen?">
    Memory-Dateien liegen auf dem Datenträger und bleiben bestehen, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, sodass lange Unterhaltungen compacted oder abgeschnitten werden können. Deshalb
    gibt es die Memory-Suche — sie zieht nur die relevanten Teile wieder in den Kontext.

    Dokumentation: [Memory](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Memory-Suche einen OpenAI-API-Key?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder der
    Codex-CLI-Anmeldung)** nicht bei der semantischen Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Key (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit setzen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Key auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Env-Variablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Key aufgelöst werden kann, andernfalls Gemini, wenn ein Gemini-Key
    aufgelöst werden kann, dann Voyage, dann Mistral. Wenn kein Remote-Key verfügbar ist, bleibt die Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` bereit (oder
    `memorySearch.remote.apiKey`). Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder lokal** — siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf dem Datenträger liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein — **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie an sie senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Remote aus Notwendigkeit:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/etc.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Footprint:** Die Verwendung lokaler Modelle hält Prompts auf Ihrer Maschine, aber Kanal-
      Datenverkehr läuft weiterhin über die Server des Kanals.

    Verwandt: [Agent-Workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Path                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Keys und optional `keyRef`/`tokenRef`)    |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateigestützte Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge werden bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konversationsverlauf & Zustand (pro Agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für einen einzelnen Agenten: `~/.openclaw/agent/*` (wird von `openclaw doctor` migriert).

    Ihr **Workspace** (AGENTS.md, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      Kleingeschriebenes `memory.md` im Root ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann es in `MEMORY.md` zusammenführen, wenn beide Dateien vorhanden sind.
    - **State-Dir (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Der Remote-Modus verwendet den **Workspace des Gateway-Hosts**,
    nicht den Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent-Workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in ein **privates** Git-Repository und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub Private). Das erfasst Memory + AGENTS-/SOUL-/USER-
    Dateien und erlaubt es Ihnen, den „Geist“ des Assistenten später wiederherzustellen.

    Committen Sie **nichts** unter `~/.openclaw` (Credentials, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Dir
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe den dedizierten Leitfaden: [Deinstallieren](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentbezogene Sandbox-Einstellungen. Wenn Sie möchten,
    dass ein Repository das Standard-Arbeitsverzeichnis ist, zeigen Sie für diesen Agenten mit
    `workspace` auf das Root des Repositorys. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten absichtlich, dass der Agent darin arbeitet.

    Beispiel (Repository als Standard-cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote-Modus: Wo ist der Sitzungsspeicher?">
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie sich im Remote-Modus befinden, liegt der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es sichere Standardwerte (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe `gateway.bind: "lan"` (oder `"tailnet"`) gesetzt und jetzt lauscht nichts / die UI meldet unauthorized'>
    Nicht-Loopback-Binds **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Auth mit gemeinsamem Secret: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Reverse-Proxy ohne Loopback

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Hinweise:

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Auth **nicht** von selbst.
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Auth setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert sind und sich nicht auflösen lassen, schlägt die Auflösung fail-closed fehl (kein verdeckender Remote-Fallback).
    - Setups der Control UI mit gemeinsamem Secret authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie es, gemeinsame Secrets in URLs zu platzieren.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen gleichhostige Loopback-Reverse-Proxys die trusted-proxy-Auth weiterhin **nicht**. Der Trusted Proxy muss eine konfigurierte Nicht-Loopback-Quelle sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Auth: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird beim Gateway-Start in den Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird, sodass **lokale WS-Clients sich authentifizieren müssen**. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für identitätsbewusste Reverse-Proxys ohne Loopback `trusted-proxy`). Wenn Sie **wirklich** offenes loopback möchten, setzen Sie explizit `gateway.auth.mode: "none"` in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, für kritische Änderungen neu starten
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich lustige CLI-Slogans?">
    Setzen Sie `cli.banner.taglineMode` in der Konfiguration:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: blendet den Slogantext aus, behält aber die Bannerzeile mit Titel/Version bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Slogans (Standardverhalten).
    - Wenn Sie überhaupt kein Banner möchten, setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web Fetch)?">
    `web_fetch` funktioniert ohne API-Key. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Key-Einrichtung.
    - Ollama Web Search benötigt keinen Key, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Key, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist keyfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Alternativen über die Umgebung:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Provider-spezifische Web-Search-Konfiguration befindet sich jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Veraltete providerbezogene Pfade unter `tools.web.search.*` werden vorübergehend weiterhin aus Kompatibilitätsgründen geladen, sollten aber für neue Konfigurationen nicht mehr verwendet werden.
    Die Fallback-Konfiguration für Firecrawl-Web-Fetch befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht ausdrücklich deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider anhand verfügbarer Credentials. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Env-Variablen aus `~/.openclaw/.env` (oder aus der Dienstumgebung).

    Dokumentation: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie kann ich sie wiederherstellen und das vermeiden?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Das aktuelle OpenClaw schützt vor vielen unbeabsichtigten Überschreibungen:

    - Von OpenClaw verwaltete Konfigurationsschreibvorgänge validieren die vollständige Konfiguration nach der Änderung, bevor sie schreiben.
    - Ungültige oder destruktive von OpenClaw verwaltete Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung Start oder Hot-Reload beschädigt, stellt das Gateway die letzte bekannte funktionierende Konfiguration wieder her und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.
    - Der Haupt-Agent erhält nach der Wiederherstellung eine Boot-Warnung, damit er die schlechte Konfiguration nicht blind erneut schreibt.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Config auto-restored from last-known-good`, `Config write rejected:` oder `config reload restored last-known-good config`.
    - Prüfen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Behalten Sie die aktive wiederhergestellte Konfiguration bei, wenn sie funktioniert, und kopieren Sie dann nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Führen Sie `openclaw config validate` und `openclaw doctor` aus.
    - Wenn Sie weder eine letzte bekannte funktionierende noch eine abgelehnte Payload haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre letzte bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann oft eine funktionierende Konfiguration aus Logs oder Verlauf rekonstruieren.

    Vermeidung:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem genauen Pfad oder einer Feldform nicht sicher sind; es gibt einen flachen Schemaknoten plus Zusammenfassungen direkter Kindknoten für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; behalten Sie `config.apply` nur für den vollständigen Ersatz der Konfiguration.
    - Wenn Sie das nur für Eigentümer bestimmte Tool `gateway` aus einem Agentenlauf heraus verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich veralteter Aliasse `tools.bash.*`, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Config](/de/cli/config), [Configure](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripherie und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** separate Gehirne/Workspaces für Spezialrollen (z. B. „Hetzner ops“, „Persönliche Daten“).
    - **Sub-Agenten:** starten Hintergrundarbeit von einem Haupt-Agenten aus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und Agenten/Sitzungen wechseln.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless laufen?">
    Ja. Es ist eine Konfigurationsoption:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Standard ist `false` (mit Oberfläche). Headless löst auf einigen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie Visuals benötigen).
    - Einige Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für die Browser-Steuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie propagieren Befehle zwischen Telegram, dem Gateway und Nodes?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway-WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Datenverkehr; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet ist?">
    Kurz gesagt: **koppeln Sie Ihren Computer als Node**. Das Gateway läuft anderswo, aber es kann
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Führen Sie das Gateway auf dem immer aktiven Host aus (VPS/Home-Server).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Öffnen Sie lokal die macOS-App und verbinden Sie sich im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräten, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Kanal-Health: `openclaw channels status`

    Verifizieren Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Vergewissern Sie sich, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine integrierte „Bot-zu-Bot“-Bridge, aber Sie können dies auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und lassen Sie dann Bot B wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem Remote-VPS liegt, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einer Maschine ausführen, die das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hallo vom lokalen Bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Schutzmaßnahme hinzu, damit sich die beiden Bots nicht endlos gegenseitig beantworten (nur bei Erwähnung, Kanal-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent-Send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich separate VPSes für mehrere Agenten?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Workspace, Standardmodellen
    und Routing. Das ist das normale Setup und deutlich günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur dann, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht teilen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop zu verwenden statt SSH von einem VPS?">
    Ja — Nodes sind die erstklassige Möglichkeit, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder ein Gerät der Raspberry-Pi-Klasse reicht; 4 GB RAM genügen), daher ist ein übliches
    Setup ein immer aktiver Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend zum Gateway-WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch Node-Allowlists/Genehmigungen gesteuert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalten Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus, oder hängen Sie sich über Chrome MCP an lokales Chrome auf dem Host an.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie betreiben absichtlich isolierte Profile (siehe [Multiple gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node-Host-CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Subtree mit seinem flachen Schemaknoten, passendem UI-Hinweis und Zusammenfassungen direkter Kindknoten prüfen, bevor geschrieben wird
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); führt nach Möglichkeit Hot-Reload aus und startet bei Bedarf neu
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration; führt nach Möglichkeit Hot-Reload aus und startet bei Bedarf neu
    - Das nur für Eigentümer bestimmte Runtime-Tool `gateway` weigert sich weiterhin, `tools.exec.ask` / `tools.exec.security` neu zu schreiben; veraltete Aliasse `tools.bash.*` normalisieren auf dieselben geschützten Exec-Pfade

  </Accordion>

  <Accordion title="Minimale sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dadurch wird Ihr Workspace gesetzt und eingeschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Installieren + auf dem VPS anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installieren + auf Ihrem Mac anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich im selben Tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktivieren Sie in der Tailscale-Admin-Konsole MagicDNS, damit der VPS einen stabilen Namen hat.
    4. **Den Tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway-WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpoint.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch behalten Sie ein einzelnes Gateway und vermeiden doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur dann, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env-Variablen und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env-Variablen aus dem Parent-Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - ein globales Fallback-`.env` aus `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt bestehende Env-Variablen.

    Sie können Inline-Env-Variablen auch in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Siehe [/environment](/de/help/environment) für vollständige Priorität und Quellen.

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Dienst gestartet und meine Env-Variablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann übernommen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (Opt-in-Komfortfunktion):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Dadurch wird Ihre Login-Shell ausgeführt und nur fehlende erwartete Schlüssel importiert (überschreibt nie etwas). Äquivalente Env-Variablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe `COPILOT_GITHUB_TOKEN` gesetzt, aber der Modellstatus zeigt "Shell env: off." an. Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Env-Variablen fehlen — es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das mit einer dieser Methoden:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es zu Ihrem `env`-Block in der Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie dann das Gateway neu und prüfen Sie erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Tokens werden aus `COPILOT_GITHUB_TOKEN` gelesen (auch `GH_TOKEN` / `GITHUB_TOKEN`).
    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sitzungen und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie starte ich eine neue Unterhaltung?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber das ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie einen positiven Wert, um den Ablauf bei Inaktivität zu aktivieren. Wenn dies aktiviert ist, startet die **nächste**
    Nachricht nach dem Inaktivitätszeitraum eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden keine Transkripte gelöscht — es wird nur eine neue Sitzung gestartet.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu erstellen (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agenten**. Sie können einen koordinierenden
    Agenten und mehrere Worker-Agenten mit eigenen Workspaces und Modellen erstellen.

    Dennoch sollte man das eher als **unterhaltsames Experiment** sehen. Es verbraucht viele Tokens und ist
    oft weniger effizient als die Verwendung eines Bots mit getrennten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agenten starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agents-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Trunkierung auslösen.

    Hilfreich ist:

    - Bitten Sie den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Behalten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agenten für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, behalte aber die Installation?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Das Onboarding bietet auch **Reset** an, wenn es eine vorhandene Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Dir zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Dev; löscht Dev-Konfiguration + Credentials + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme Fehler wie "context too large" - wie kann ich zurücksetzen oder compacten?'>
    Verwenden Sie eine dieser Möglichkeiten:

    - **Compact** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (frische Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder optimieren Sie **session pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Das ist ein Validierungsfehler des Providers: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` erzeugt. Das bedeutet meist, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Änderung an Tool/Schema).

    Behebung: Starten Sie mit `/new` (eigenständige Nachricht) eine neue Sitzung.

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei Verwendung von OAuth-Authentifizierung). Passen Sie sie an oder deaktivieren Sie sie:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Überschreibungen pro Agent verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, daher kann OpenClaw die Gruppe sehen, wenn Sie in der Gruppe sind.
    Standardmäßig werden Gruppenantworten blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

    Wenn Sie möchten, dass nur **Sie** Gruppenantworten auslösen können:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wie bekomme ich die JID einer WhatsApp-Gruppe heraus?">
    Option 1 (am schnellsten): Logs mitverfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Achten Sie auf `chatId` (oder `from`) mit dem Suffix `@g.us`, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/allowlistet): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Erwähnungsbindung ist aktiv (Standard). Sie müssen den Bot mit @ erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkte Chats fallen standardmäßig auf die Hauptsitzung zusammen. Gruppen/Kanäle haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine harten Limits. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Anwachsenden Speicherbedarf:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Aufwand:** Auth-Profile, Workspaces und Kanal-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (löschen Sie JSONL oder Store-Einträge), wenn der Speicherbedarf wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profil-Unstimmigkeiten zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig betreiben (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann an bestimmte Agenten gebunden werden.

    Browser-Zugriff ist leistungsfähig, aber nicht „alles tun, was ein Mensch kann“ — Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, der den Browser tatsächlich ausführt.

    Best-Practice-Setup:

    - Immer aktiver Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Kanal/Kanäle, die an diese Agenten gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf einen Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Fragen und Antworten zu Modellen — Standardwerte, Auswahl, Aliasse, Umschalten, Failover, Auth-Profile —
wurden auf eine eigene Seite verschoben:
[FAQ — Modelle und Auth-Profile](/de/help/faq-models).

## Gateway: Ports, „läuft bereits“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum zeigt `openclaw gateway status` "Runtime: running", aber "Connectivity probe: failed" an?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die Connectivity-Probe ist die CLI, die sich tatsächlich mit dem Gateway-WebSocket verbindet.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die die Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Grundursache, wenn der Prozess lebt, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigen `openclaw gateway status` "Config (cli)" und "Config (service)" unterschiedlich an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere ausführt (oft eine Abweichung bei `--profile` / `OPENCLAW_STATE_DIR`).

    Behebung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie das aus derselben `--profile`-/Umgebung aus, die der Dienst verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Runtime-Sperre, indem es den WebSocket-Listener direkt beim Start bindet (Standard `ws://127.0.0.1:18789`). Wenn das Bind mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst, was anzeigt, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie mit `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie betreibe ich OpenClaw im Remote-Modus (Client verbindet sich mit einem Gateway an einem anderen Ort)?">
    Setzen Sie `gateway.mode: "remote"` und zeigen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Anmeldedaten über gemeinsames Secret:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Hinweise:

    - `openclaw gateway` startet nur, wenn `gateway.mode` `local` ist (oder Sie das Override-Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und schaltet live die Modi um, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren lokale Gateway-Authentifizierung nicht selbst.

  </Accordion>

  <Accordion title='Die Control UI sagt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Authentifizierungspfad und die Auth-Methode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI hält das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiterhin funktionieren, ohne langlebige Token-Persistenz in localStorage wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten erneuten Versuch mit einem gecachten Device-Token unternehmen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit gecachtem Token verwendet nun die gecachten genehmigten Scopes wieder, die zusammen mit dem Device-Token gespeichert wurden. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, statt gecachte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads ist die Auth-Priorität beim Connect zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Tokens sind rollenpräfixiert. Die integrierte Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Nodes oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht zu öffnen; zeigt SSH-Hinweis, wenn headless).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Modus mit gemeinsamem Secret: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und fügen Sie dann das passende Secret in die Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe loopback-/tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Nicht-Loopback-Proxy kommen, nicht über einen Loopback-Proxy auf demselben Host oder eine rohe Gateway-URL.
    - Wenn die Nichtübereinstimmung nach dem einen Retry bestehen bleibt, rotieren/genehmigen Sie das gekoppelte Device-Token erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf meldet, dass er verweigert wurde, prüfen Sie zwei Dinge:
      - Sitzungen gepaarter Geräte können nur ihr **eigenes** Gerät rotieren, es sei denn, sie haben zusätzlich `operator.admin`
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie [Fehlerbehebung](/de/gateway/troubleshooting). Siehe [Dashboard](/de/web/dashboard) für Auth-Details.

  </Accordion>

  <Accordion title="Ich habe `gateway.bind tailnet` gesetzt, aber es kann nicht binden und nichts lauscht">
    Ein Bind `tailnet` wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie ein reines Tailnet-Bind möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Üblicherweise nein — ein Gateway kann mehrere Messaging-Kanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen Folgendes isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (State pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelle Einrichtung (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile suffixieren auch Dienstnamen (`ai.openclaw.<profile>`; veraltet `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständiger Leitfaden: [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server**, und es erwartet, dass die allererste Nachricht
    ein `connect`-Frame ist. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Policy-Verletzung).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder einen Nicht-Gateway-Request gesendet.

    Schnelle Behebungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, fügen Sie Token/Passwort im `connect`-Frame ein.

    Wenn Sie CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Fehleranalyse

<AccordionGroup>
  <Accordion title="Wo sind die Logs?">
    Dateilogs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können über `logging.file` einen stabilen Pfad setzen. Das Dateilog-Level wird durch `logging.level` gesteuert. Die Konsolen-Verbosity wird durch `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellster Log-Tail:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Fehlerbehebung](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Dienst neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückerobern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, wechseln Sie in WSL und starten Sie neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Dienst nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt unter Windows.

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie es manuell ausführen (ohne Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway ist aktiv, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Durchlauf:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Auth ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Kanal-Kopplung/Allowlist blockiert Antworten (prüfen Sie die Kanalkonfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote sind, bestätigen Sie, dass Tunnel/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Kanäle](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote: Ist die Tunnel-/Tailscale-Verbindung aktiv?

    Verfolgen Sie dann die Logs mit:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/de/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Kanalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen weiterhin entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, vergewissern Sie sich, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host prüfen.

    Dokumentation: [Telegram](/de/channels/telegram), [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Kanal erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann wieder?">
    Wenn Sie den Dienst installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Dienst** gestoppt/gestartet (launchd auf macOS, systemd auf Linux).
    Verwenden Sie dies, wenn das Gateway als Daemon im Hintergrund läuft.

    Wenn Sie es im Vordergrund ausführen, stoppen Sie mit Ctrl-C und starten Sie dann mit:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminalsitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg, mehr Details zu bekommen, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie dann die Logdatei auf Kanal-Auth, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agenten müssen eine Zeile `MEDIA:<path-or-url>` enthalten (in einer eigenen Zeile). Siehe [OpenClaw assistant setup](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Zustellung per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Hier ist es" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf max. 2048 px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt das Senden lokaler Pfade auf Workspace, Temp-/Media-Store und sandboxvalidierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, hostlokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Reine Text- und secretähnliche Dateien bleiben weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs zu öffnen?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardwerte sind so ausgelegt, das Risiko zu verringern:

    - Standardverhalten auf DM-fähigen Kanälen ist **Kopplung**:
      - Unbekannte Absender erhalten einen Kopplungscode; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert ein explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur bei öffentlichen Bots ein Problem?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot DMs senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/Fetch, Browserseiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann selbst dann passieren, wenn **Sie der einzige Absender** sind.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Wirkungsradius durch:

    - Verwendung eines schreibgeschützten oder tooldeaktivierten „Reader“-Agenten, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für toolaktivierte Agenten deaktiviert halten
    - auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und die Extraktion von Medienanhängen umschließen extrahierten Text beide mit
      expliziten Markierungen für Grenzen externer Inhalte, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Den Bot mit separaten Konten und Telefonnummern zu isolieren
    reduziert den Wirkungsradius, wenn etwas schiefgeht. Dadurch wird es auch einfacher, Credentials zu rotieren
    oder Zugriff zu entziehen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Beginnen Sie klein. Geben Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir **empfehlen keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Halten Sie DMs im **Kopplungsmodus** oder in einer engen Allowlist.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn Sie möchten, dass es in Ihrem Namen Nachrichten sendet.
    - Lassen Sie es Entwürfe erstellen und **genehmigen Sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies auf einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für persönliche Assistentenaufgaben verwenden?">
    Ja, **wenn** der Agent nur für Chat verwendet wird und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Instruction Hijacking, daher sollten Sie sie für toolaktivierte Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte vermeiden. Wenn Sie dennoch ein kleineres Modell verwenden müssen, sperren Sie
    Tools und arbeiten Sie innerhalb einer Sandbox. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Kopplungscode bekommen">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot schreibt und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Prüfen Sie ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Allowlist oder setzen Sie für dieses Konto `dmPolicy: "open"`.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten schreiben? Wie funktioniert die Kopplung?">
    Nein. Die Standard-DM-Richtlinie für WhatsApp ist **Kopplung**. Unbekannte Absender erhalten nur einen Kopplungscode und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendungen, die Sie auslösen.

    Genehmigen Sie die Kopplung mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Abfrage der Telefonnummer im Assistenten: Sie wird verwendet, um Ihre **Allowlist/Eigentümer** zu setzen, damit Ihre eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie mit Ihrer persönlichen WhatsApp-Nummer arbeiten, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Sitzung aktiviert ist.

    Behebung in dem Chat, in dem Sie es sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin laut ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Vergewissern Sie sich auch, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Dokumentation: [Thinking und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie einen der folgenden Texte **als eigenständige Nachricht** (ohne Slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Dies sind Abbruch-Trigger (keine Slash-Befehle).

    Für Hintergrundprozesse (aus dem Exec-Tool) können Sie den Agenten bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht der Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Shortcuts (wie `/status`) funktionieren für allowlistete Absender auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? ("Cross-context messaging denied")'>
    OpenClaw blockiert **providerübergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf an
    Telegram gebunden ist, wird es nicht an Discord senden, sofern Sie das nicht ausdrücklich erlauben.

    Aktivieren Sie providerübergreifendes Messaging für den Agenten:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Starten Sie das Gateway nach der Bearbeitung der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - neue Nachrichten leiten die aktuelle Aufgabe um
    - `followup` - Nachrichten einzeln nacheinander ausführen
    - `collect` - Nachrichten stapeln und einmal antworten (Standard)
    - `steer-backlog` - jetzt umleiten, dann den Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und frisch starten

    Sie können Optionen wie `debounce:2s cap:25 drop:summarize` für Followup-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Verschiedenes

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Key?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Keys in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass das Gateway keine Anthropic-Anmeldedaten in der erwarteten `auth-profiles.json` für den Agenten finden konnte, der gerade läuft.
  </Accordion>
</AccordionGroup>

---

Immer noch blockiert? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandt

- [FAQ — Schnellstart und Einrichtung beim ersten Start](/de/help/faq-first-run)
- [FAQ — Modelle und Auth-Profile](/de/help/faq-models)
- [Fehlerbehebung](/de/help/troubleshooting)
