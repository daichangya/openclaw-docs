---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von gemeldeten Nutzerproblemen vor tiefergehender Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-05T12:55:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Troubleshooting](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Configuration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agents/Sessions, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Bericht zum Teilen per Copy/Paste (sicher teilbar)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens geschwärzt).

3. **Daemon- und Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeitstatus vs. RPC-Erreichbarkeit, die Ziel-URL des Probes und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefe Probes**

   ```bash
   openclaw status --deep
   ```

   Führt einen Live-Gateway-Health-Probe aus, einschließlich Channel-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, greife stattdessen darauf zurück:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind getrennt von Servicelogs; siehe [Logging](/de/logging) und [Troubleshooting](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Gesundheitsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Ersteinrichtung

<AccordionGroup>
  <Accordion title="Ich hänge fest. Was ist der schnellste Weg, wieder weiterzukommen?">
    Verwende einen lokalen AI-Agenten, der **deinen Rechner sehen kann**. Das ist weit effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind,
    die entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und dir helfen, Probleme bei der Einrichtung
    auf Maschinenebene zu beheben (PATH, Services, Berechtigungen, Auth-Dateien). Gib ihnen den **vollständigen Source-Checkout** über
    die hackbare Installation (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent den Code + die Docs lesen und
    über die genaue Version, die du verwendest, nachdenken kann. Du kannst jederzeit später wieder auf stable umsteigen,
    indem du das Installationsprogramm ohne `--install-method git` erneut ausführst.

    Tipp: Bitte den Agenten, die Behebung **zu planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter zu prüfen.

    Wenn du einen echten Bug oder Fix entdeckst, erstelle bitte ein GitHub-Issue oder sende einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginne mit diesen Befehlen (teile die Ausgaben, wenn du um Hilfe bittest):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot des Gesundheitszustands von Gateway/Agent + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdokumentation: [Install](/de/install), [Installer flags](/de/install/installer), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Gründe fürs Überspringen?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten active-hours-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere/Header-only-Vorlage
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keine Aufgabenintervalle sind fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel nur nach einem echten abgeschlossenen
    Heartbeat-Durchlauf weitergeschrieben. Übersprungene Läufe markieren Aufgaben nicht als erledigt.

    Docs: [Heartbeat](/de/gateway/heartbeat), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode, OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Source zu laufen und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding betreibst du das Gateway typischerweise auf Port **18789**.

    Aus dem Source (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Lauf automatisch
    openclaw onboard
    ```

    Wenn du noch keine globale Installation hast, führe es über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding deinen Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link außerdem in der Zusammenfassung aus. Lass diesen Tab offen; wenn er nicht gestartet wurde, kopiere die ausgegebene URL auf demselben Rechner in den Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffne `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, füge den konfigurierten Token oder das Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generiere einen Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bindung auf loopback beibehalten, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` auf `true` steht, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer du verwendest bewusst private-ingress `none` oder HTTP-Authentifizierung über einen trusted proxy.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, daher kann schon der zweite schlechte Wiederholungsversuch `retry later` anzeigen.
    - **Tailnet-Bindung**: `openclaw gateway --bind tailnet --token "<token>"` ausführen (oder Passwortauth konfigurieren), `http://<tailscale-ip>:18789/` öffnen und dann das passende Shared Secret in die Dashboard-Einstellungen einfügen.
    - **Identity-aware Reverse Proxy**: Das Gateway hinter einem trusted proxy ohne loopback betreiben, `gateway.auth.mode: "trusted-proxy"` konfigurieren und dann die Proxy-URL öffnen.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; füge den konfigurierten Token oder das Passwort ein, falls du dazu aufgefordert wirst.

    Siehe [Dashboard](/web/dashboard) und [Web surfaces](/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Channel zu einem nativen Genehmigungsclient für exec-Genehmigungen

    Die Host-exec-Richtlinie ist weiterhin das eigentliche Genehmigungsgate. Die Chat-Konfiguration steuert nur,
    wo Genehmigungsaufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups brauchst du **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native-Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwende `approvals.exec` nur dann, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwende `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn du ausdrücklich möchtest, dass Genehmigungsaufforderungen zurück in den ursprünglichen Raum/Thread gepostet werden.
    - Plugin-Genehmigungen sind noch einmal getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Channels behalten darüber hinaus native Plugin-Genehmigungshandhabung bei.

    Kurz gesagt: Forwarding ist fürs Routing, native Client-Konfiguration für eine reichhaltigere channel-spezifische UX.
    Siehe [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun ist für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – die Docs nennen **512MB-1GB RAM**, **1 Kern** und etwa **500MB**
    Speicherplatz als ausreichend für die persönliche Nutzung und weisen darauf hin, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn du etwas mehr Reserve willst (Logs, Medien, andere Services), werden **2GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und du kannst **nodes** auf deinem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechne mit Ecken und Kanten.

    - Verwende ein **64-Bit**-Betriebssystem und halte Node auf >= 22.
    - Bevorzuge die **hackbare Installation (git)**, damit du Logs sehen und schnell aktualisieren kannst.
    - Starte ohne Channels/Skills und füge sie dann nacheinander hinzu.
    - Wenn du auf seltsame Binärprobleme stößt, ist das meist ein **ARM-Kompatibilitäts**problem.

    Docs: [Linux](/de/platforms/linux), [Install](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    „Wake up, my friend!“ beim ersten Schlüpfen automatisch. Wenn du diese Zeile **ohne Antwort**
    siehst und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starte das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfe Status + Auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es weiterhin hängt, führe Folgendes aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stelle sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und die UI
    auf das richtige Gateway zeigt. Siehe [Remote access](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopiere das **State-Verzeichnis** und den **Workspace**, und führe dann einmal Doctor aus. So
    bleibt dein Bot „genau gleich“ (Erinnerungen, Sitzungsverlauf, Authentifizierung und Channel-Zustand),
    solange du **beide** Orte kopierst:

    1. Installiere OpenClaw auf dem neuen Rechner.
    2. Kopiere `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopiere deinen Workspace (Standard: `~/.openclaw/workspace`).
    4. Führe `openclaw doctor` aus und starte den Gateway-Service neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Credentials, Sessions und Erinnerungen erhalten. Wenn du im
    Remote-Modus bist, denke daran: Der Gateway-Host besitzt den Session-Store und den Workspace.

    **Wichtig:** Wenn du nur deinen Workspace nach GitHub committest/pusht, sicherst du
    **Erinnerungen + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrating](/de/install/migrating), [Wo Dinge auf dem Datenträger liegen](#wo-dinge-auf-dem-datenträger-liegen),
    [Agent workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote mode](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfe das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Docs/andere Abschnitte bei Bedarf).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktiviere dies oder setze `docs.openclaw.ai` auf die Allowlist und versuche es dann erneut.
    Bitte hilf uns beim Entsperren, indem du es hier meldest: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn du die Seite weiterhin nicht erreichen kannst, sind die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm-dist-tags**, keine getrennten Code-Linien:

    - `latest` = stable
    - `beta` = frühes Build zum Testen

    Üblicherweise landet eine stabile Veröffentlichung zuerst auf **beta**, und dann verschiebt ein expliziter
    Promotionsschritt genau diese Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion auf
    **dieselbe Version** zeigen.

    Sieh nach, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Für Installations-Einzeiler und den Unterschied zwischen beta und dev siehe das Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Stand von `main` (git); wenn veröffentlicht, verwendet es das npm-dist-tag `dev`.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mehr Details: [Development channels](/de/install/development-channels) und [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Bits aus?">
    Es gibt zwei Optionen:

    1. **Dev-Channel (git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechselst du auf den Branch `main` und aktualisierst aus dem Source.

    2. **Hackbare Installation (von der Installer-Seite):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhältst du ein lokales Repo, das du bearbeiten und dann per git aktualisieren kannst.

    Wenn du lieber manuell einen sauberen Klon möchtest, verwende:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/cli/update), [Development channels](/de/install/development-channels),
    [Install](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, je nachdem, wie viele Channels/Modelle du konfigurierst

    Wenn es hängt, verwende [Installer hängt](#schnellstart-und-ersteinrichtung)
    und die schnelle Debug-Schleife in [Ich hänge fest](#schnellstart-und-ersteinrichtung).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Rückmeldung?">
    Führe den Installer mit **ausführlicher Ausgabe** erneut aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare Installation (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Äquivalent (PowerShell):

    ```powershell
    # install.ps1 hat noch kein eigenes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Windows-Installation meldet git not found oder openclaw not recognized">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installiere **Git for Windows** und stelle sicher, dass `git` in deinem PATH ist.
    - Schließe PowerShell und öffne sie erneut, dann führe den Installer erneut aus.

    **2) openclaw is not recognized nach der Installation**

    - Dein globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfe den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Füge dieses Verzeichnis zu deinem Benutzer-PATH hinzu (unter Windows ist kein `\bin`-Suffix nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließe PowerShell und öffne sie erneut, nachdem du PATH aktualisiert hast.

    Wenn du das reibungsloseste Windows-Setup willst, verwende **WSL2** statt nativem Windows.
    Docs: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Das ist normalerweise eine nicht passende Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - `system.run`-/`exec`-Ausgabe rendert Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Umgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starte dann das Gateway neu und versuche deinen Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn du das auf der neuesten OpenClaw-Version weiterhin reproduzieren kannst, verfolge/melde es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Docs haben meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwende die **hackbare Installation (git)**, damit du den vollständigen Source und die Docs lokal hast, und frage dann
    deinen Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Install](/de/install) und [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf Linux?">
    Kurze Antwort: Folge der Linux-Anleitung und führe dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Getting Started](/de/start/getting-started).
    - Installer + Updates: [Install & updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installiere auf dem Server und verwende dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen ein **Hosting-Hub** mit den gängigen Anbietern. Wähle einen aus und folge der Anleitung:

    - [VPS hosting](/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und du greifst
    von deinem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Dein Zustand + Workspace
    liegen auf dem Server, also behandle den Host als Source of Truth und sichere ihn.

    Du kannst **nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf deinem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Platforms](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurze Antwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Session unterbrochen wird), könnte ein sauberes git-Checkout benötigen und
    kann nach einer Bestätigung fragen. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

    Verwende die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn du es von einem Agenten aus automatisieren musst:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/cli/update), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es dich durch:

    - **Modell-/Authentifizierungs-Setup** (Provider-OAuth, Claude-CLI-Wiederverwendung und API-Schlüssel werden unterstützt, plus lokale Modelloptionen wie LM Studio)
    - **Workspace**-Ort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bindung/Port/Auth/Tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Channel-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd user unit auf Linux/WSL2)
    - **Gesundheitsprüfungen** und **Skills**-Auswahl

    Es warnt außerdem, wenn dein konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Du kannst OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** betreiben, sodass deine Daten auf deinem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Wege, um diese Provider zu authentifizieren.

    Wir gehen davon aus, dass Claude Code CLI fallback wahrscheinlich für lokale,
    benutzerverwaltete Automatisierung auf Basis der öffentlichen CLI-Dokumentation von Anthropic erlaubt ist. Dennoch
    erzeugt Anthropics Richtlinie für Third-Party-Harnesses genug Unklarheit rund um
    abonnementsbasierte Nutzung in externen Produkten, dass wir es nicht für Produktion empfehlen.
    Anthropic hat OpenClaw-Nutzer außerdem am **4. April 2026
    um 12:00 PM PT / 8:00 PM BST** darüber informiert, dass der **OpenClaw**-Claude-Login-Pfad
    als Nutzung eines Third-Party-Harnesses zählt und nun **Extra Usage**
    erfordert, die getrennt vom Abonnement abgerechnet wird. OpenAI-Codex-OAuth wird ausdrücklich
    für externe Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete abonnementsartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [GLM Models](/providers/glm),
    [Local models](/de/gateway/local-models), [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja, über einen lokalen **Claude CLI**-Login auf dem Gateway-Host.

    Claude-Pro/Max-Abonnements **enthalten keinen API-Schlüssel**, daher ist die
    Wiederverwendung von Claude CLI der lokale fallback-Pfad in OpenClaw. Wir gehen davon aus, dass Claude Code CLI
    fallback wahrscheinlich für lokale, benutzerverwaltete Automatisierung auf Basis von
    Anthropics öffentlicher CLI-Dokumentation erlaubt ist. Dennoch erzeugt Anthropics Third-Party-Harness-
    Richtlinie genug Unklarheit rund um abonnementsbasierte Nutzung in externen
    Produkten, dass wir es nicht für Produktion empfehlen. Wir empfehlen stattdessen
    Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abo-Authentifizierung (Claude Pro oder Max)?">
    Ja. Verwende einen lokalen **Claude CLI**-Login auf dem Gateway-Host wieder mit `openclaw models auth login --provider anthropic --method cli --set-default`.

    Anthropic-Setup-Token ist ebenfalls wieder als Legacy-/manueller OpenClaw-Pfad verfügbar. Anthropics OpenClaw-spezifischer Abrechnungshinweis gilt dort weiterhin, daher solltest du ihn in der Erwartung verwenden, dass Anthropic **Extra Usage** verlangt. Siehe [Anthropic](/providers/anthropic) und [OAuth](/de/concepts/oauth).

    Wichtig: Wir gehen davon aus, dass Claude Code CLI fallback wahrscheinlich für lokale,
    benutzerverwaltete Automatisierung auf Basis von Anthropics öffentlicher CLI-Dokumentation erlaubt ist. Dennoch
    erzeugt Anthropics Richtlinie für Third-Party-Harnesses genug Unklarheit rund um
    abonnementsbasierte Nutzung in externen Produkten, dass wir es nicht für Produktion empfehlen.
    Anthropic teilte OpenClaw-Nutzern außerdem am **4. April 2026 um
    12:00 PM PT / 8:00 PM BST** mit, dass der **OpenClaw**-Claude-Login-Pfad
    **Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird.

    Für Produktions- oder Multi-User-Workloads ist Anthropic-API-Key-Authentifizierung die
    sicherere, empfohlene Wahl. Wenn du andere abonnementsartige gehostete
    Optionen in OpenClaw möchtest, siehe [OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax) und
    [GLM Models](/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass dein **Anthropic-Kontingent/Ratenlimit** im aktuellen Fenster ausgeschöpft ist. Wenn du
**Claude CLI** verwendest, warte, bis das Fenster zurückgesetzt wird, oder
upgrade deinen Plan. Wenn du einen **Anthropic API-Schlüssel** verwendest, prüfe die Anthropic Console
auf Nutzung/Abrechnung und erhöhe die Limits nach Bedarf.

    Wenn die Meldung speziell lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropics 1M-Context-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn deine
    Credentials für Long-Context-Abrechnung freigeschaltet sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Setze ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider ratenbegrenzt ist.
    Siehe [Models](/cli/models), [OAuth](/de/concepts/oauth), und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-env-Marker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls kannst du `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Providereintrag hinzufügen. Siehe [Amazon Bedrock](/providers/bedrock) und [Model providers](/providers/models). Wenn du einen verwalteten Key-Flow bevorzugst, bleibt ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Flow ausführen und setzt das Standardmodell gegebenenfalls auf `openai-codex/gpt-5.4`. Siehe [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abo-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Subscription OAuth** vollständig.
    OpenAI erlaubt die Nutzung von Subscription OAuth ausdrücklich in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Flow für dich ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Flow**, keine client id oder secret in `openclaw.json`.

    Schritte:

    1. Installiere Gemini CLI lokal, sodass `gemini` im `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktiviere das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach dem Login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Wenn Anfragen fehlschlagen, setze `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Model providers](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Meistens nein. OpenClaw braucht großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn du musst, führe das **größte** Modell-Build aus, das du lokal betreiben kannst (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko – siehe [Security](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wähle Endpunkte mit fester Region. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wähle die in den USA gehostete Variante, um Daten in der Region zu halten. Du kannst Anthropic/OpenAI weiterhin daneben aufführen, indem du `models.mode: "merge"` verwendest, damit Fallbacks verfügbar bleiben und gleichzeitig der von dir gewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Homeserver oder eine Raspberry-Pi-Klasse-Box funktioniert.

    Du brauchst einen Mac nur **für macOS-only-Tools**. Für iMessage verwende [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn du andere macOS-only-Tools möchtest, betreibe das Gateway auf einem Mac oder kopple einen macOS-Node.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Du brauchst **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein Mac mini** sein –
    jeder Mac funktioniert. **Verwende [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Betreibe das Gateway auf Linux/VPS und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Betreibe alles auf dem Mac, wenn du das einfachste Ein-Rechner-Setup willst.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und dein MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen nicht das Gateway aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - Das MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Mit `openclaw nodes status` / `openclaw nodes list` kannst du es sehen.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun ist **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwende **Node** für stabile Gateways.

    Wenn du trotzdem mit Bun experimentieren willst, dann auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was kommt in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Senders** (numerisch). Das ist nicht der Bot-Benutzername.

    Das Onboarding akzeptiert `@username` als Eingabe und löst es in eine numerische ID auf, aber die OpenClaw-Autorisierung verwendet nur numerische IDs.

    Sicherer (kein Drittanbieter-Bot):

    - Schreibe deinem Bot per DM und führe dann `openclaw logs --follow` aus; lies `from.id`.

    Offizielle Bot API:

    - Schreibe deinem Bot per DM und rufe dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf; lies `message.from.id`.

    Drittanbieter (weniger privat):

    - Schreibe `@userinfobot` oder `@getidsbot` per DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binde die WhatsApp-**DM** jedes Senders (Peer `kind: "direct"`, Sender-E.164 wie `+15551234567`) an eine andere `agentId`, damit jede Person ihren eigenen Workspace und Session-Store erhält. Antworten kommen weiterhin vom **selben WhatsApp-Konto**, und die DM-Zugriffssteuerung (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) gilt global pro WhatsApp-Konto. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "Fast-Chat"-Agenten und einen "Opus fürs Coden"-Agenten ausführen?'>
    Ja. Verwende Multi-Agent-Routing: Gib jedem Agenten sein eigenes Standardmodell und binde dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Beispielkonfigurationen stehen unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Models](/de/concepts/models) und [Configuration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew auf Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn du OpenClaw über systemd betreibst, stelle sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder deinen brew-Prefix) enthält, damit mit `brew` installierte Tools in Non-Login-Shells aufgelöst werden.
    Neuere Builds stellen unter Linux-systemd-Services außerdem übliche Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und npm install">
    - **Hackbare Installation (git):** vollständiger Source-Checkout, editierbar, am besten für Mitwirkende.
      Du führst Builds lokal aus und kannst Code/Docs patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach laufen lassen“.
      Updates kommen von npm-dist-tags.

    Docs: [Getting started](/de/start/getting-started), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installiere die andere Variante und führe dann Doctor aus, damit der Gateway-Service auf den neuen Entrypoint zeigt.
    Das **löscht deine Daten nicht** – es ändert nur die OpenClaw-Codeinstallation. Dein State
    (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unberührt.

    Von npm zu git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Von git zu npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor erkennt einen Mismatch beim Gateway-Service-Entrypoint und bietet an, die Service-Konfiguration passend zur aktuellen Installation umzuschreiben (verwende `--repair` für Automatisierung).

    Backup-Tipps: siehe [Backup-Strategie](#wo-dinge-auf-dem-datenträger-liegen).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder einem VPS betreiben?">
    Kurze Antwort: **Wenn du 24/7-Zuverlässigkeit willst, nimm einen VPS**. Wenn du
    den geringsten Aufwand willst und Schlafmodus/Neustarts okay sind, betreibe es lokal.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Schlafmodus/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Laptop-Schlafprobleme, einfacher dauerhaft zu betreiben.
    - **Nachteile:** oft headless (verwende Screenshots), nur Remote-Dateizugriff, du musst für Updates per SSH verbinden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren problemlos auf einem VPS. Der einzige echte Trade-off ist **headless browser** vs. sichtbares Fenster. Siehe [Browser](/tools/browser).

    **Empfohlener Standard:** VPS, wenn du zuvor Gateway-Verbindungsabbrüche hattest. Lokal ist großartig, wenn du den Mac aktiv nutzt und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser willst.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner zu betreiben?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolierung empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Schlafmodus/Neustarts, sauberere Berechtigungen, leichter dauerhaft zu betreiben.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig okay zum Testen und für aktive Nutzung, aber rechne mit Pausen, wenn der Rechner schläft oder Updates installiert.

    Wenn du das Beste aus beiden Welten willst, behalte das Gateway auf einem dedizierten Host und kopple deinen Laptop als **Node** für lokale Bildschirm-/Kamera-/exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitsrichtlinien lies [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches OS wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Channel:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM, ~500MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2GB RAM oder mehr Reserve (Logs, Medien, mehrere Channels). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    OS: Verwende **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Docs: [Linux](/de/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandle eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar und mit ausreichend
    RAM für das Gateway und alle aktivierten Channels ausgestattet sein.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM.
    - **Empfohlen:** 2GB RAM oder mehr, wenn du mehrere Channels, Browser-Automatisierung oder Media-Tools verwendest.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn du unter Windows bist, ist **WSL2 das einfachste VM-artige Setup** und hat die beste Tooling-
    Kompatibilität. Siehe [Windows](/platforms/windows), [VPS hosting](/vps).
    Wenn du macOS in einer VM ausführst, siehe [macOS VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher AI-Assistent, den du auf deinen eigenen Geräten ausführst. Er antwortet auf den Messaging-Oberflächen, die du bereits verwendest (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein live Canvas bereitstellen. Das **Gateway** ist die always-on-Kontrollinstanz; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **lokal-first Control Plane**, mit der du einen
    leistungsfähigen Assistenten auf **deiner eigenen Hardware** betreiben kannst, erreichbar aus den Chat-Apps, die du bereits nutzt, mit
    zustandsbehafteten Sessions, Erinnerungen und Tools – ohne die Kontrolle über deine Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Deine Geräte, deine Daten:** betreibe das Gateway, wo immer du willst (Mac, Linux, VPS), und behalte den
      Workspace + Session-Verlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** nutze Anthropic, OpenAI, MiniMax, OpenRouter usw. mit agentenbezogenem Routing
      und Failover.
    - **Rein lokale Option:** betreibe lokale Modelle, sodass **alle Daten auf deinem Gerät bleiben können**, wenn du das möchtest.
    - **Multi-Agent-Routing:** getrennte Agenten pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und Standardwerten.
    - **Open Source und hackbar:** prüfen, erweitern und selbst hosten ohne Vendor-Lock-in.

    Docs: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Site).
    - Eine mobile App prototypen (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Aufräumen, Benennung, Tags).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn du sie in Phasen aufteilst und
    Sub-Agents für parallele Arbeit verwendest.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten Alltagsanwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die dich interessieren.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Docs.
    - **Erinnerungen und Follow-ups:** durch Cron oder Heartbeat gesteuerte Anstöße und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Web-Aufgaben wiederholen.
    - **Geräteübergreifende Koordination:** eine Aufgabe vom Telefon senden, das Gateway sie auf einem Server ausführen lassen und das Ergebnis im Chat zurückbekommen.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Gen, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach oder Anzeigentexte schreiben.

    Bei **Outreach oder Anzeigenläufen** sollte ein Mensch eingebunden bleiben. Vermeide Spam, halte lokale Gesetze und
    Plattformrichtlinien ein und prüfe alles, bevor es gesendet wird. Das sicherste Muster ist, OpenClaw
    entwerfen zu lassen und du genehmigst.

    Docs: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile hat es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwende
    Claude Code oder Codex für die schnellste direkte Coding-Schleife innerhalb eines Repos. Verwende OpenClaw, wenn du
    dauerhafte Erinnerungen, geräteübergreifenden Zugriff und Tool-Orchestrierung möchtest.

    Vorteile:

    - **Persistente Erinnerungen + Workspace** über Sessions hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on-Gateway** (auf einem VPS betreiben, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo in einen schmutzigen Zustand zu versetzen?">
    Verwende verwaltete Overrides statt die Kopie im Repo zu bearbeiten. Lege deine Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder füge über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides gegenüber gebündelten Skills weiterhin gewinnen, ohne git anzufassen. Wenn du den Skill global installiert brauchst, aber er nur für einige Agenten sichtbar sein soll, belasse die gemeinsame Kopie in `~/.openclaw/skills` und steuere die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die es wert sind, upstream zu gehen, sollten im Repo leben und als PRs hinausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Füge zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standard-Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig in `./skills`, was OpenClaw in der nächsten Session als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agenten sichtbar sein soll, kombiniere das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für verschiedene Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: isolierte Jobs können pro Job einen `model`-Override setzen.
    - **Sub-Agents**: leite Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: verwende `/model`, um das aktuelle Session-Modell jederzeit zu wechseln.

    Siehe [Cron jobs](/de/automation/cron-jobs), [Multi-Agent Routing](/de/concepts/multi-agent) und [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwende **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Session,
    liefern eine Zusammenfassung zurück und halten deinen Hauptchat responsiv.

    Bitte deinen Bot, „einen Sub-Agenten für diese Aufgabe zu starten“, oder verwende `/subagents`.
    Mit `/status` im Chat kannst du sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, setze ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model`.

    Docs: [Sub-agents](/tools/subagents), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sessions auf Discord?">
    Verwende Thread-Bindungen. Du kannst einen Discord-Thread an ein Subagent- oder Session-Ziel binden, sodass Folge-Nachrichten in diesem Thread auf dieser gebundenen Session bleiben.

    Grundablauf:

    - Starte mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistentes Follow-up).
    - Oder binde manuell mit `/focus <target>`.
    - Verwende `/agents`, um den Bindungszustand zu prüfen.
    - Verwende `/session idle <duration|off>` und `/session max-age <duration|off>`, um automatisches Entfokussieren zu steuern.
    - Verwende `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: setze `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Sub-agents](/tools/subagents), [Discord](/de/channels/discord), [Configuration Reference](/de/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent wurde fertig, aber das Abschluss-Update ging an den falschen Ort oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfe zuerst die aufgelöste Requester-Route:

    - Die Zustellung eines completion-mode-Subagenten bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine vorhanden ist.
    - Wenn der Abschluss-Ursprung nur einen Channel enthält, greift OpenClaw auf die gespeicherte Route der Requester-Session (`lastChannel` / `lastTo` / `lastAccountId`) zurück, sodass direkte Zustellung weiterhin gelingen kann.
    - Wenn weder eine gebundene Route noch eine verwendbare gespeicherte Route existiert, kann direkte Zustellung scheitern und das Ergebnis fällt statt eines sofortigen Chat-Posts auf zugestellte Session-Queue zurück.
    - Ungültige oder veraltete Ziele können weiterhin Queue-Fallback oder endgültiges Zustellungsversagen erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs genau dem stillen Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` entspricht, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach reinen Tool-Aufrufen in ein Timeout lief, kann die Ankündigung das in eine kurze Zusammenfassung des Teilfortschritts zusammenfassen, statt rohe Tool-Ausgabe erneut abzuspielen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-agents](/tools/subagents), [Background Tasks](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätige, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfe, dass das Gateway 24/7 läuft (kein Schlafmodus/keine Neustarts).
    - Verifiziere die Zeitzoneneinstellungen für den Job (`--tz` vs. Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Channel gesendet. Warum?">
    Prüfe zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Fehler bei der Channel-Authentifizierung (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, aber Credentials dies blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch den Queue-Fallback.

    Bei isolierten Cron-Jobs gehört die endgültige Zustellung dem Runner. Vom Agenten wird erwartet,
    eine Klartext-Zusammenfassung zurückzugeben, die der Runner senden kann. `--no-deliver` hält
    dieses Ergebnis intern; es erlaubt dem Agenten nicht, stattdessen direkt mit dem
    Message-Tool zu senden.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, keine doppelte Planung.

    Isolierter Cron kann eine Modellübergabe zur Laufzeit persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der Wiederholungsversuch behält den gewechselten
    Provider/das Modell, und wenn der Wechsel einen neuen Auth-Profil-Override enthielt, persistiert Cron
    auch diesen vor dem erneuten Versuch.

    Verwandte Auswahllogik:

    - Gmail-Hook-Modell-Override gewinnt zuerst, wenn anwendbar.
    - Dann jobbezogenes `model`.
    - Dann jeder gespeicherte Cron-Session-Modell-Override.
    - Dann die normale Auswahl von Agent-/Standardmodell.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos zu schleifen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills auf Linux?">
    Verwende native `openclaw skills`-Befehle oder lege Skills in deinen Workspace. Die macOS-Skills-UI ist auf Linux nicht verfügbar.
    Skills durchsuchen auf [https://clawhub.ai](https://clawhub.ai).

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

    Native `openclaw skills install` schreibt in das `skills/`-
    Verzeichnis des aktiven Workspace. Installiere die separate `clawhub`-CLI nur, wenn du eigene Skills veröffentlichen oder
    synchronisieren möchtest. Für gemeinsame Installationen über mehrere Agenten lege den Skill unter
    `~/.openclaw/skills` ab und verwende `agents.defaults.skills` oder
    `agents.list[].skills`, wenn du einschränken möchtest, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwende den Gateway-Scheduler:

    - **Cron jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Main Session“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Docs: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binaries begrenzt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, außer du überschreibst das Gating.

    Es gibt drei unterstützte Muster:

    **Option A - das Gateway auf einem Mac ausführen (am einfachsten).**
    Führe das Gateway dort aus, wo die macOS-Binaries existieren, und verbinde dich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills laden normal, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (ohne SSH).**
    Führe das Gateway auf Linux aus, kopple einen macOS-Node (Menüleisten-App) und setze **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann macOS-only-Skills als zulässig behandeln, wenn die erforderlichen Binaries auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn du „Always Ask“ wählst, fügt das Genehmigen von „Always Allow“ in der Aufforderung diesen Befehl zur Allowlist hinzu.

    **Option C - macOS-Binaries über SSH proxyen (fortgeschritten).**
    Behalte das Gateway auf Linux, sorge aber dafür, dass die erforderlichen CLI-Binaries zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Überschreibe dann den Skill so, dass Linux erlaubt wird, damit er zulässig bleibt.

    1. Erstelle einen SSH-Wrapper für die Binary (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Lege den Wrapper im `PATH` des Linux-Hosts ab (zum Beispiel `~/bin/memo`).
    3. Überschreibe die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI auf macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starte eine neue Session, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Habt ihr eine Notion- oder HeyGen-Integration?">
    Aktuell nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn du den Kontext pro Kunde beibehalten willst (Agency-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitte den Agenten, diese Seite zu Beginn einer Session abzurufen.

    Wenn du eine native Integration möchtest, eröffne einen Feature-Request oder baue einen Skill,
    der auf diese APIs zielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über mehrere Agenten hinweg lege sie unter `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfiguriere `agents.defaults.skills` oder `agents.list[].skills`. Manche Skills erwarten Binaries, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/tools/skills), [Skills config](/tools/skills-config) und [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwende das eingebaute Browser-Profil `user`, das über Chrome DevTools MCP angebunden wird:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn du einen eigenen Namen möchtest, erstelle ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad ist host-lokal. Wenn das Gateway anderswo läuft, betreibe entweder einen Node-Host auf dem Browser-Rechner oder verwende stattdessen Remote-CDP.

    Aktuelle Einschränkungen bei `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selector-basiert
    - Uploads benötigen `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Abfang und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Erinnerungen

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Doku zu Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifisches Setup (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es keine
    Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Mache `/home/node` über `OPENCLAW_HOME_VOLUME` persistent, damit Caches erhalten bleiben.
    - Baue Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installiere Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setze `PLAYWRIGHT_BROWSERS_PATH` und stelle sicher, dass der Pfad persistent ist.

    Docs: [Docker](/de/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen öffentlich/sandboxed machen, mit nur einem Agenten?">
    Ja – wenn dein privater Traffic **DMs** sind und dein öffentlicher Traffic **Gruppen**.

    Verwende `agents.defaults.sandbox.mode: "non-main"`, sodass Gruppen-/Channel-Sessions (non-main-Keys) in Docker laufen, während die Haupt-DM-Session auf dem Host bleibt. Begrenze dann über `tools.sandbox.tools`, welche Tools in sandboxed Sessions verfügbar sind.

    Setup-Anleitung + Beispielkonfiguration: [Groups: private DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway configuration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setze `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + agentenbezogene Bindings werden zusammengeführt; agentenspezifische Bindings werden ignoriert, wenn `scope: "shared"` ist. Verwende `:ro` für alles Sensible und denke daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Escapes über Symlink-Eltern auch dann fail-closed bleiben, wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktionieren Erinnerungen?">
    OpenClaw-Erinnerungen sind einfach Markdown-Dateien im Agent-Workspace:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur main/private Sessions)

    OpenClaw führt außerdem einen **stillen Erinnerungsschreibvorgang vor der Kompaktierung** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor automatisch kompaktiert wird. Das läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Die Erinnerung vergisst ständig Dinge. Wie sorge ich dafür, dass etwas bleibt?">
    Bitte den Bot, **die Tatsache in die Erinnerung zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin vergisst, prüfe, ob das Gateway bei jedem Lauf
    denselben Workspace verwendet.

    Docs: [Memory](/de/concepts/memory), [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleiben Erinnerungen für immer erhalten? Was sind die Grenzen?">
    Erinnerungsdateien liegen auf dem Datenträger und bleiben bestehen, bis du sie löschst. Die Grenze ist dein
    Speicherplatz, nicht das Modell. Der **Session-Kontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Gespräche komprimiert oder abgeschnitten werden. Deshalb gibt es
    Erinnerungssuche – sie holt nur die relevanten Teile zurück in den Kontext.

    Docs: [Memory](/de/concepts/memory), [Context](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Erinnerungssuche einen OpenAI API-Schlüssel?">
    Nur wenn du **OpenAI-Embeddings** verwendest. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **das Anmelden mit Codex (OAuth oder dem
    Codex CLI-Login)** nicht bei der semantischen Erinnerungssuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn du keinen Provider explizit festlegst, wählt OpenClaw automatisch einen Provider aus, sobald es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder env vars).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, sonst Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die
    Erinnerungssuche deaktiviert, bis du sie konfigurierst. Wenn du einen lokalen Modellpfad
    konfiguriert und vorhanden hast, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn du explizit
    `memorySearch.provider = "ollama"` setzt.

    Wenn du lieber lokal bleiben möchtest, setze `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn du Gemini-Embeddings möchtest, setze
    `memorySearch.provider = "gemini"` und gib `GEMINI_API_KEY` an (oder
    `memorySearch.remote.apiKey`). Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder local** – siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf dem Datenträger liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein – **der OpenClaw-Zustand ist lokal**, aber **externe Services sehen weiterhin, was du an sie sendest**.

    - **Standardmäßig lokal:** Sessions, Erinnerungsdateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + dein Workspace-Verzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die du an Modell-Provider (Anthropic/OpenAI/etc.) sendest, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Du kontrollierst den Umfang:** Lokale Modelle halten Prompts auf deinem Rechner, aber Channel-
      Traffic läuft weiterhin über die Server des jeweiligen Channels.

    Verwandt: [Agent workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (beim ersten Gebrauch in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optionale `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionaler dateibasierter Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agentenbezogener Zustand (agentDir + Sessions)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gesprächsverlauf & Zustand (pro Agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session-Metadaten (pro Agent)                                      |

    Legacy-Einzel-Agent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Dein **Workspace** (`AGENTS.md`, Erinnerungsdateien, Skills usw.) ist getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder Legacy-Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State-Verzeichnis (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sessions, Logs,
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfe, ob das Gateway bei jedem Start
    denselben Workspace verwendet (und denke daran: Im Remote-Modus wird der Workspace des **Gateway-Hosts**
    verwendet, nicht der deines lokalen Laptops).

    Tipp: Wenn du ein dauerhaftes Verhalten oder eine dauerhafte Präferenz möchtest, bitte den Bot, es **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Lege deinen **Agent-Workspace** in ein **privates** git-Repo und sichere ihn an einem
    privaten Ort (zum Beispiel GitHub private). Das erfasst Erinnerungen + AGENTS/SOUL/USER-
    Dateien und ermöglicht dir, später den „Geist“ des Assistenten wiederherzustellen.

    Committe **nicht** irgendetwas unter `~/.openclaw` (Credentials, Sessions, Tokens oder verschlüsselte Secret-Payloads).
    Wenn du eine vollständige Wiederherstellung brauchst, sichere Workspace und State-Verzeichnis
    getrennt (siehe die Migrationsfrage oben).

    Docs: [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die eigene Anleitung: [Uninstall](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Anker für Erinnerungen, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn du Isolierung brauchst, verwende
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn du
    möchtest, dass ein Repo das Standard-Arbeitsverzeichnis ist, zeige den
    `workspace` dieses Agenten auf das Repo-Root. Das OpenClaw-Repo ist nur Source-Code; halte den
    Workspace getrennt, außer du möchtest ausdrücklich, dass der Agent darin arbeitet.

    Beispiel (Repo als Standard-cwd):

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

  <Accordion title="Remote-Modus: Wo ist der Session-Store?">
    Der Session-Zustand gehört dem **Gateway-Host**. Wenn du im Remote-Modus bist, liegt der Session-Store, der dich interessiert, auf dem entfernten Rechner, nicht auf deinem lokalen Laptop. Siehe [Session management](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Konfigurationsgrundlagen

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo liegt sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, werden einigermaßen sichere Standardwerte verwendet (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt hört nichts zu / die UI sagt unauthorized'>
    Bindungen außerhalb von loopback **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Authentifizierung: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identity-aware reverse proxy ohne loopback

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Authentifizierung **nicht** von selbst.
    - Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwortauth setze stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung fail-closed fehl (kein verschleiernder Remote-Fallback).
    - Shared-Secret-Control-UI-Setups authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätsbasierte Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeide es, Shared Secrets in URLs zu platzieren.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse Proxys auf loopback desselben Hosts die trusted-proxy-Authentifizierung weiterhin **nicht**. Der trusted proxy muss eine konfigurierte Quelle ohne loopback sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt auf localhost einen Token?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Auth-Pfad konfiguriert ist, löst der Gateway-Start in den Token-Modus auf und generiert automatisch einen, speichert ihn unter `gateway.auth.token`, sodass **lokale WS-Clients sich authentifizieren müssen**. Das blockiert andere lokale Prozesse beim Aufruf des Gateways.

    Wenn du einen anderen Auth-Pfad bevorzugst, kannst du explizit den Passwortmodus wählen (oder für identity-aware reverse proxies ohne loopback `trusted-proxy`). Wenn du **wirklich** offenes loopback willst, setze `gateway.auth.mode: "none"` explizit in deiner Konfiguration. Doctor kann jederzeit einen Token für dich generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach Konfigurationsänderungen neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, für kritische Änderungen neu starten
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich lustige CLI-Slogans?">
    Setze `cli.banner.taglineMode` in der Konfiguration:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: blendet den Slogantext aus, behält aber die Banner-Titel-/Versionszeile.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Slogans (Standardverhalten).
    - Wenn du überhaupt kein Banner willst, setze die env var `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Webabruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von deinem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihr normales API-Schlüssel-Setup.
    - Ollama Web Search benötigt keinen Schlüssel, verwendet aber deinen konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Schlüssel, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfiguriere `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führe `openclaw configure --section web` aus und wähle einen Provider.
    Umgebungsalternativen:

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
              provider: "firecrawl", // optional; weglassen für Auto-Erkennung
            },
          },
        },
    }
    ```

    Provider-spezifische Websuch-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-Providerpfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Die Fallback-Konfiguration für Firecrawl-Webabruf liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn du Allowlists verwendest, füge `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (es sei denn, es wurde explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Abruf-Fallback-Provider anhand verfügbarer Credentials. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen env vars aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Docs: [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das künftig?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn du ein partielles Objekt sendest, wird alles
    andere entfernt.

    Wiederherstellung:

    - Aus Backup wiederherstellen (git oder eine kopierte `~/.openclaw/openclaw.json`).
    - Wenn du kein Backup hast, führe `openclaw doctor` erneut aus und konfiguriere Channels/Modelle neu.
    - Wenn das unerwartet war, melde einen Bug und füge deine letzte bekannte Konfiguration oder ein vorhandenes Backup bei.
    - Ein lokaler Coding-Agent kann oft aus Logs oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    So vermeidest du es:

    - Verwende `openclaw config set` für kleine Änderungen.
    - Verwende `openclaw configure` für interaktive Bearbeitungen.
    - Verwende zuerst `config.schema.lookup`, wenn du bei einem exakten Pfad oder der Form eines Felds unsicher bist; es gibt einen flachen Schema-Knoten plus direkte Child-Zusammenfassungen für Drill-down zurück.
    - Verwende `config.patch` für partielle RPC-Bearbeitungen; behalte `config.apply` nur für vollständiges Ersetzen der Konfiguration.
    - Wenn du das owner-only-`gateway`-Tool aus einem Agent-Lauf verwendest, lehnt es Schreibzugriffe auf `tools.exec.ask` / `tools.exec.security` weiterhin ab (einschließlich Legacy-Aliasse `tools.bash.*`, die auf dieselben geschützten exec-Pfade normalisiert werden).

    Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **nodes** und **agents**:

    - **Gateway (zentral):** besitzt Channels (Signal/WhatsApp), Routing und Sessions.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripherie und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** separate Gehirne/Workspaces für Spezialrollen (z. B. „Hetzner ops“, „Personal data“).
    - **Sub-Agents:** starten Hintergrundarbeit aus einem Hauptagenten heraus, wenn du Parallelität willst.
    - **TUI:** mit dem Gateway verbinden und zwischen Agents/Sessions wechseln.

    Docs: [Nodes](/de/nodes), [Remote access](/de/gateway/remote), [Multi-Agent Routing](/de/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

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

    Standard ist `false` (headful). Headless löst auf manchen Sites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meiste Automatisierung (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwende Screenshots, wenn du visuelle Rückmeldung brauchst).
    - Manche Sites sind bei Automatisierung im headless-Modus strenger (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter oft headless Sessions.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für Browser-Steuerung?">
    Setze `browser.executablePath` auf dein Brave-Binary (oder einen anderen Chromium-basierten Browser) und starte das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Nodes über das **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurze Antwort: **kopple deinen Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf deinem lokalen Rechner über das Gateway WebSocket aufrufen.

    Typisches Setup:

    1. Betreibe das Gateway auf dem always-on-Host (VPS/Home-Server).
    2. Verbinde Gateway-Host + deinen Computer mit demselben Tailnet.
    3. Stelle sicher, dass das Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffne die macOS-App lokal und verbinde im Modus **Remote over SSH** (oder direkt per Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmige den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Keine separate TCP-Bridge erforderlich; Nodes verbinden sich über das Gateway WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Kople
    nur Geräte, denen du vertraust, und lies [Security](/de/gateway/security).

    Docs: [Nodes](/de/nodes), [Gateway protocol](/de/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfe die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Gesundheit: `openclaw status`
    - Channel-Gesundheit: `openclaw channels status`

    Verifiziere dann Authentifizierung und Routing:

    - Wenn du Tailscale Serve verwendest, stelle sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn du dich per SSH-Tunnel verbindest, bestätige, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätige, dass deine Allowlists (DM oder Gruppe) dein Konto enthalten.

    Docs: [Tailscale](/de/gateway/tailscale), [Remote access](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander kommunizieren (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber du kannst es auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwende einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lass Bot A eine Nachricht an Bot B senden und Bot B dann wie üblich antworten.

    **CLI-Bridge (generisch):** führe ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und dabei einen Chat anspricht, auf den der andere Bot
    hört. Wenn ein Bot auf einem entfernten VPS läuft, richte deine CLI auf dieses entfernte Gateway aus
    über SSH/Tailscale (siehe [Remote access](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hallo vom lokalen Bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Füge eine Schutzmaßnahme hinzu, damit die beiden Bots nicht endlos in Schleifen geraten (nur bei Erwähnung,
    Channel-Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Docs: [Remote access](/de/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agenten separate VPSes?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Workspace, Modell-Standards
    und Routing. Das ist das normale Setup und deutlich günstiger und einfacher als
    ein VPS pro Agent.

    Verwende separate VPSes nur dann, wenn du harte Isolierung (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen brauchst, die du nicht teilen möchtest. Andernfalls behalte ein Gateway und
    verwende mehrere Agenten oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop zu verwenden statt SSH von einem VPS?">
    Ja – Nodes sind der erstklassige Weg, deinen Laptop von einem entfernten Gateway aus zu erreichen, und sie
    ermöglichen mehr als Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Raspberry-Pi-Klasse-Box reicht; 4 GB RAM sind reichlich), daher ist ein typisches
    Setup ein always-on-Host plus dein Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlists/Genehmigungen auf diesem Laptop abgesichert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalte das Gateway auf einem VPS, aber führe Chrome lokal über einen Node-Host auf dem Laptop aus, oder binde lokales Chrome auf dem Host über Chrome MCP an.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind einfacher für laufende Agent-Workflows und
    Geräteautomatisierung.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer du betreibst absichtlich isolierte Profile (siehe [Multiple gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS/Android-Nodes oder der macOS-„Node mode“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: eine Konfigurations-Teilstruktur mit ihrem flachen Schema-Knoten, passendem UI-Hinweis und direkten Child-Zusammenfassungen vor dem Schreiben prüfen
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt)
    - `config.apply`: validieren + die vollständige Konfiguration ersetzen, dann neu starten
    - Das owner-only-Laufzeittool `gateway` weigert sich weiterhin, `tools.exec.ask` / `tools.exec.security` umzuschreiben; Legacy-Aliasse `tools.bash.*` normalisieren auf dieselben geschützten exec-Pfade

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Das setzt deinen Workspace und begrenzt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf deinem Mac installieren + anmelden**
       - Verwende die Tailscale-App und melde dich im selben Tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktiviere in der Tailscale-Admin-Konsole MagicDNS, damit der VPS einen stabilen Namen hat.
    4. **Den Tailnet-Hostname verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn du die Control UI ohne SSH möchtest, verwende Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und wird per Tailscale über HTTPS bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stelle sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwende die macOS-App im Remote-Modus** (SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmige den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway protocol](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn du auf dem zweiten Laptop nur **lokale Tools** (screen/camera/exec) brauchst, füge ihn als
    **Node** hinzu. Das hält ein einziges Gateway und vermeidet doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur auf macOS verfügbar, aber wir planen, sie auf weitere Betriebssysteme auszudehnen.

    Installiere ein zweites Gateway nur dann, wenn du **harte Isolierung** oder zwei vollständig getrennte Bots brauchst.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest env vars aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt vorhandene env vars.

    Du kannst auch Inline-env-vars in der Konfiguration definieren (werden nur angewendet, wenn sie im Prozess-Env fehlen):

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

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine env vars sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Lege die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann geladen werden, wenn der Service dein Shell-Env nicht erbt.
    2. Aktiviere Shell-Import (opt-in convenience):

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

    Dadurch wird deine Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Env-var-Äquivalente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass deine env vars fehlen – es bedeutet nur, dass OpenClaw deine
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es deine Shell-
    Umgebung nicht. Behebe das auf eine dieser Arten:

    1. Lege den Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktiviere Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder füge ihn zum `env`-Block deiner Konfiguration hinzu (wird nur angewendet, wenn er fehlt).

    Starte dann das Gateway neu und prüfe erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Tokens werden aus `COPILOT_GITHUB_TOKEN` gelesen (auch `GH_TOKEN` / `GITHUB_TOKEN`).
    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie starte ich ein neues Gespräch?">
    Sende `/new` oder `/reset` als eigenständige Nachricht. Siehe [Session management](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sessions automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sessions können nach `session.idleMinutes` ablaufen, aber das ist **standardmäßig deaktiviert** (Standard **0**).
    Setze einen positiven Wert, um den Leerlaufablauf zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach dem Leerlaufzeitraum eine neue Session-ID für diesen Chat-Key.
    Das löscht keine Transkripte – es startet nur eine neue Session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu bilden (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Du kannst einen koordinierenden
    Agenten und mehrere Worker-Agenten mit eigenen Workspaces und Modellen erstellen.

    Dennoch sollte das eher als **unterhaltsames Experiment** gesehen werden. Es verbraucht viele Tokens und ist oft
    weniger effizient als ein Bot mit getrennten Sessions. Das typische Modell, das wir
    vor Augen haben, ist ein Bot, mit dem du sprichst, mit unterschiedlichen Sessions für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Docs: [Multi-agent routing](/de/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Session-Kontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Kompaktierung oder Abschneidung auslösen.

    Was hilft:

    - Bitte den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwende `/compact` vor langen Aufgaben und `/new`, wenn du das Thema wechselst.
    - Halte wichtigen Kontext im Workspace und bitte den Bot, ihn erneut zu lesen.
    - Verwende Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wähle ein Modell mit größerem Kontextfenster, wenn das häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, aber lasse es installiert?">
    Verwende den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nichtinteraktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führe danach das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Das Onboarding bietet ebenfalls **Reset** an, wenn es eine bestehende Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn du Profile verwendet hast (`--profile` / `OPENCLAW_PROFILE`), setze jedes State-Verzeichnis zurück (Standards sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur dev; löscht Dev-Konfiguration + Credentials + Sessions + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme "context too large"-Fehler - wie setze ich zurück oder kompaktiere?'>
    Verwende eine dieser Möglichkeiten:

    - **Kompaktieren** (behält das Gespräch, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu lenken.

    - **Zurücksetzen** (neue Session-ID für denselben Chat-Key):

      ```
      /new
      /reset
      ```

    Wenn das weiterhin passiert:

    - Aktiviere oder tune **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwende ein Modell mit größerem Kontextfenster.

    Docs: [Compaction](/de/concepts/compaction), [Session pruning](/de/concepts/session-pruning), [Session management](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Das ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Session-Verlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starte mit `/new` eine neue Session (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei Verwendung von OAuth-Authentifizierung). Passe sie an oder deaktiviere sie:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // oder "0m" zum Deaktivieren
          },
        },
      },
    }
    ```

    Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur leere Zeilen und Markdown-
    Header wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Pro-Agent-Overrides verwenden `agents.list[].heartbeat`. Docs: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **deinem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn du darin bist.
    Standardmäßig sind Gruppenantworten blockiert, bis du Sender erlaubst (`groupPolicy: "allowlist"`).

    Wenn du willst, dass nur **du** Gruppenantworten auslösen kannst:

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

  <Accordion title="Wie bekomme ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Logs verfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suche nach `chatId` (oder `from`), das mit `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/allowlisted): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiv (Standard). Du musst den Bot mit @ erwähnen (oder `mentionPatterns` treffen).
    - Du hast `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht auf der Allowlist.

    Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads den Kontext mit DMs?">
    Direkte Chats werden standardmäßig in die Main Session zusammengeführt. Gruppen/Channels haben ihre eigenen Session-Keys, und Telegram-Themen / Discord-Threads sind getrennte Sessions. Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achte auf:

    - **Speicherwachstum:** Sessions + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Aufwand:** agentenspezifische Auth-Profile, Workspaces und Channel-Routing.

    Tipps:

    - Behalte einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Räume alte Sessions auf (JSONL oder Store-Einträge löschen), wenn der Speicher wächst.
    - Verwende `openclaw doctor`, um verirrte Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack) und wie sollte ich das einrichten?">
    Ja. Verwende **Multi-Agent Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agenten gebunden werden.

    Browser-Zugriff ist mächtig, aber nicht „alles, was ein Mensch kann“ – Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwende lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die an diese Agenten gebunden sind.
    - Lokaler Browser per Chrome MCP oder ein Node bei Bedarf.

    Docs: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standardwerte, Auswahl, Aliasse, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was du setzt als:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn du den Provider weglässt, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für diese exakte Modell-ID und greift erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider-/Modell zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen. Du solltest dennoch **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlt ihr?">
    **Empfohlenes Standardmodell:** Verwende das stärkste verfügbare Modell der neuesten Generation in deinem Provider-Stack.
    **Für Agenten mit Tools oder nicht vertrauenswürdigen Eingaben:** priorisiere Modellstärke vor Kosten.
    **Für routinemäßigen/risikoarmen Chat:** verwende günstigere Fallback-Modelle und route nach Agentenrolle.

    MiniMax hat eigene Docs: [MiniMax](/providers/minimax) und
    [Local models](/de/gateway/local-models).

    Faustregel: Verwende für wichtige Arbeit das **beste Modell, das du dir leisten kannst**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Du kannst Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Models](/de/concepts/models) und
    [Sub-agents](/tools/subagents).

    Starke Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt-
    Injection und unsicheres Verhalten. Siehe [Security](/de/gateway/security).

    Mehr Kontext: [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwende **Modellbefehle** oder bearbeite nur die **Modell**-Felder. Vermeide vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Session)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - bearbeite `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Vermeide `config.apply` mit einem partiellen Objekt, es sei denn, du möchtest die gesamte Konfiguration ersetzen.
    Für RPC-Bearbeitungen prüfe zuerst mit `config.schema.lookup` und bevorzuge `config.patch`. Der Lookup-Payload liefert dir den normalisierten Pfad, flache Schema-Dokumentation/Constraints und unmittelbare Child-Zusammenfassungen
    für partielle Aktualisierungen.
    Wenn du die Konfiguration doch überschrieben hast, stelle sie aus einem Backup wieder her oder führe `openclaw doctor` erneut aus, um sie zu reparieren.

    Docs: [Models](/de/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich self-hosted Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Pfad für lokale Modelle.

    Schnellstes Setup:

    1. Installiere Ollama von `https://ollama.com/download`
    2. Ziehe ein lokales Modell wie `ollama pull glm-4.7-flash`
    3. Wenn du auch Cloud-Modelle möchtest, führe `ollama signin` aus
    4. Führe `openclaw onboard` aus und wähle `Ollama`
    5. Wähle `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt dir Cloud-Modelle plus deine lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - für manuelles Wechseln verwende `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt-
    Injection. Wir empfehlen dringend **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn du trotzdem kleine Modelle möchtest, aktiviere Sandboxing und strikte Tool-Allowlists.

    Docs: [Ollama](/providers/ollama), [Local models](/de/gateway/local-models),
    [Model providers](/de/concepts/model-providers), [Security](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfe die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitssensible/tool-aktivierte Agenten verwende das stärkste verfügbare Modell der neuesten Generation.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle im laufenden Betrieb (ohne Neustart)?">
    Verwende den Befehl `/model` als eigenständige Nachricht:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Dies sind die eingebauten Aliasse. Benutzerdefinierte Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Verfügbare Modelle kannst du mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten, nummerierten Picker. Wähle per Nummer:

    ```
    /model 3
    ```

    Du kannst außerdem ein bestimmtes Auth-Profil für den Provider erzwingen (pro Session):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche `auth-profiles.json`-Datei verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Es zeigt außerdem, wenn verfügbar, den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`).

    **Wie entferne ich die Profilbindung, die ich mit @profile gesetzt habe?**

    Führe `/model` erneut **ohne** das Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn du zum Standard zurückkehren möchtest, wähle ihn über `/model` (oder sende `/model <default provider/model>`).
    Verwende `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für Alltagsaufgaben und Codex 5.3 fürs Coden verwenden?">
    Ja. Setze eines als Standard und wechsle bei Bedarf:

    - **Schneller Wechsel (pro Session):** `/model gpt-5.4` für Alltagsaufgaben, `/model openai-codex/gpt-5.4` fürs Coden mit Codex OAuth.
    - **Standard + Wechsel:** setze `agents.defaults.model.primary` auf `openai/gpt-5.4` und wechsle dann beim Coden zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agents:** route Coding-Aufgaben an Sub-Agents mit einem anderen Standardmodell.

    Siehe [Models](/de/concepts/models) und [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird dies zur **Allowlist** für `/model` und alle
    Session-Overrides. Wenn du ein Modell wählst, das nicht in dieser Liste steht, erhältst du:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Füge das Modell zu
    `agents.defaults.models` hinzu, entferne die Allowlist oder wähle ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), daher kann das Modell nicht aufgelöst werden.

    Fehlerbehebungs-Checkliste:

    1. Upgrade auf eine aktuelle OpenClaw-Version (oder aus `main`-Source laufen lassen), dann das Gateway neu starten.
    2. Stelle sicher, dass MiniMax konfiguriert ist (Assistent oder JSON), oder dass MiniMax-Authentifizierung
       in env/Auth-Profilen existiert, damit der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeicherter MiniMax-
       OAuth für `minimax-portal`).
    3. Verwende die exakte Modell-ID (Groß-/Kleinschreibung beachten) für deinen Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-Key-
       Setup, oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führe aus:

       ```bash
       openclaw models list
       ```

       und wähle aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/providers/minimax) und [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwende **MiniMax als Standard** und wechsle **pro Session** das Modell, wenn nötig.
    Fallbacks sind für **Fehler**, nicht für „schwierige Aufgaben“, daher verwende `/model` oder einen separaten Agenten.

    **Option A: pro Session wechseln**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Dann:

    ```
    /model gpt
    ```

    **Option B: getrennte Agenten**

    - Agent A Standard: MiniMax
    - Agent B Standard: OpenAI
    - Per Agent routen oder mit `/agent` wechseln

    Docs: [Models](/de/concepts/models), [Multi-Agent Routing](/de/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt eingebaute Kurzbefehle?">
    Ja. OpenClaw liefert einige Standard-Kurzschreibweisen mit (werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn du einen eigenen Alias mit demselben Namen setzt, gewinnt dein Wert.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Kurzbefehle (Aliasse)?">
    Aliasse kommen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Dann löst `/model sonnet` (oder `/<alias>`, wenn unterstützt) zu dieser Modell-ID auf.

  </Accordion>

  <Accordion title="Wie füge ich Modelle anderer Provider wie OpenRouter oder Z.AI hinzu?">
    OpenRouter (Pay-per-Token; viele Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM-Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Wenn du einen Provider/ein Modell referenzierst, aber der erforderliche Provider-Schlüssel fehlt, erhältst du einen Laufzeit-Auth-Fehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Authentifizierung ist pro Agent
    und wird gespeichert in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Optionen zur Behebung:

    - Führe `openclaw agents add <id>` aus und konfiguriere Authentifizierung im Assistenten.
    - Oder kopiere `auth-profiles.json` aus dem `agentDir` des Hauptagenten in das `agentDir` des neuen Agenten.

    Verwende **nicht** dasselbe `agentDir` für mehrere Agenten; das verursacht Kollisionen bei Authentifizierung/Sessions.

  </Accordion>
</AccordionGroup>

## Modell-Failover und "All models failed"

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover geschieht in zwei Stufen:

    1. **Auth-Profil-Rotation** innerhalb desselben Providers.
    2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider ratenbegrenzt ist oder vorübergehend fehlschlägt.

    Der Rate-Limit-Bucket umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als
    Failover-würdige Ratenlimits.

    Einige Antworten, die wie Billing wirken, sind nicht `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider bei
    `401` oder `403` expliziten Billing-Text zurückgibt, kann OpenClaw diesen
    weiterhin in der Billing-Spur behalten, aber provider-spezifische Text-Matcher bleiben auf den
    Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Nachricht stattdessen wie ein retry-fähiges Nutzungsfenster oder
    Spend-Limit einer Organisation/eines Workspaces aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw sie als
    `rate_limit`, nicht als langfristige Billing-Deaktivierung.

    Kontextüberlauffehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Kompaktierungs-/Retry-Pfad, statt den Modell-
    Fallback voranzutreiben.

    Generischer Server-Fehlertext ist bewusst enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-spezifische transiente Formen
    wie Anthropic bloßes `An unknown error occurred`, OpenRouter bloßes
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und Provider-busy-Fehler wie `ModelNotReadyException` als
    Failover-würdige Timeout-/Overload-Signale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst für sich allein kein Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Das bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, aber dafür im erwarteten Auth-Store keine Credentials finden konnte.

    **Checkliste zur Behebung:**

    - **Bestätige, wo Auth-Profile liegen** (neue vs. Legacy-Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Bestätige, dass deine env var vom Gateway geladen wird**
      - Wenn du `ANTHROPIC_API_KEY` in deiner Shell gesetzt hast, das Gateway aber über systemd/launchd betreibst, wird es möglicherweise nicht geerbt. Lege es in `~/.openclaw/.env` ab oder aktiviere `env.shellEnv`.
    - **Stelle sicher, dass du den richtigen Agenten bearbeitest**
      - In Multi-Agent-Setups kann es mehrere `auth-profiles.json`-Dateien geben.
    - **Prüfe Modell-/Auth-Status grob**
      - Verwende `openclaw models status`, um konfigurierte Modelle und den Authentifizierungsstatus der Provider zu sehen.

    **Checkliste zur Behebung von "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf an ein Anthropic-Auth-Profil gebunden ist, das Gateway
    es aber in seinem Auth-Store nicht finden kann.

    - **Claude CLI verwenden**
      - Führe `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn du stattdessen einen API-Schlüssel verwenden möchtest**
      - Lege `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Entferne jede festgelegte Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash