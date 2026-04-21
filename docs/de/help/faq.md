---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von von Benutzern gemeldeten Problemen vor tiefergehendem Debugging
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-21T06:25:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bde531507540bc91bc131c3e27d72a8be76cc53ef46a5e01aaeaf02a71cc8a2
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Model Failover). Für Laufzeitdiagnosen siehe [Troubleshooting](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Configuration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agenten/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Teilbarer Bericht (sicher zum Weitergeben)**

   ```bash
   openclaw status --all
   ```

   Nur lesende Diagnose mit Log-Tail (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit vs. RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefere Prüfungen**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Gesundheitsprüfung aus, einschließlich Kanalprüfungen, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Aktuellstes Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, verwenden Sie stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind von Service-Logs getrennt; siehe [Logging](/de/logging) und [Troubleshooting](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Status + führt Gesundheitsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

<AccordionGroup>
  <Accordion title="Ich stecke fest, schnellster Weg, wieder weiterzukommen">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich stecke fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind,
    die entfernte Helfer nicht untersuchen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Werkzeuge können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, Probleme auf Maschinenebene
    zu beheben (PATH, Services, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Quellcode-Checkout** über
    die hackbare (git)-Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent Code + Docs lesen und
    über die exakte Version nachdenken kann, die Sie ausführen. Sie können jederzeit später wieder auf stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung zu **planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. Das hält Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Bug oder Fix entdecken, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot von Gateway-/Agentengesundheit + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Statusprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schneller Debug-Loop: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdokumentation: [Install](/de/install), [Installer flags](/de/install/installer), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Gründe fürs Überspringen?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Aktivstunden-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres/Header-only-Gerüst
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber keine der Aufgabenintervalle ist bereits fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle ausgeschaltet)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst weitergeschoben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zum Installieren und Einrichten von OpenClaw">
    Das Repo empfiehlt, aus dem Quellcode zu arbeiten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding läuft das Gateway typischerweise auf Port **18789**.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner in den Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie den konfigurierten Token oder das Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie einen Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie loopback bind bei, führen Sie `openclaw gateway --tailscale serve` aus und öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` auf `true` steht, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst `none` für privaten Ingress oder HTTP-Authentifizierung über einen vertrauenswürdigen Proxy.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierungen sie erfasst, sodass der zweite schlechte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bind**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in die Dashboard-Einstellungen ein.
    - **Identity-aware Reverse Proxy**: Betreiben Sie das Gateway hinter einem nicht-loopback vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; fügen Sie bei Aufforderung den konfigurierten Token oder das Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web surfaces](/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Approval-Konfigurationen für Chat-Freigaben?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Freigabeaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Kanal zu einem nativen Approval-Client für Exec-Freigaben

    Die Host-Exec-Richtlinie ist weiterhin das eigentliche Freigabe-Gate. Die Chat-Konfiguration steuert nur, wo Freigabe-
    aufforderungen erscheinen und wie Personen antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Freigebende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native Freigaben, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder auf `"auto"` steht.
    - Wenn native Freigabekarten/-schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Freigaben nicht verfügbar sind oder nur manuelle Freigabe möglich ist.
    - Verwenden Sie `approvals.exec` nur dann, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn Sie ausdrücklich möchten, dass Freigabeaufforderungen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Freigaben sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten native Plugin-Freigabe-Verarbeitung zusätzlich bei.

    Kurzfassung: Forwarding dient dem Routing, native Client-Konfiguration dem reichhaltigeren kanalspezifischen UX.
    Siehe [Exec Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – in der Dokumentation werden **512MB–1GB RAM**, **1 Kern** und etwa **500MB**
    Speicherplatz als ausreichend für den persönlichen Einsatz genannt, und es wird darauf hingewiesen, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie etwas mehr Spielraum möchten (Logs, Medien, andere Services), werden **2GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-OS und behalten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git)-Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist das meist ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Install](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei „wake up my friend“ / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet auch
    „Wake up, my friend!“ automatisch beim ersten Schlüpfen. Wenn Sie diese Zeile mit **keiner Antwort**
    sehen und Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starten Sie das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status + Authentifizierung:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es weiterhin hängt, führen Sie aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote access](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace** und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Kanal-
    status), solange Sie **beide** Orte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Service neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Credentials, Sitzungen und Memory erhalten. Wenn Sie sich im
    Remote-Modus befinden, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder die Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrating](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#where-things-live-on-disk),
    [Agent workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote mode](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt ausgelieferte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Docs-/andere Abschnitte bei Bedarf).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Zulassungsliste und versuchen Sie es erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie dies hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine separaten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet ein stable Release zuerst auf **beta**, dann verschiebt ein expliziter
    Promotionsschritt dieselbe Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Einzeiler für die Installation und den Unterschied zwischen beta und dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Head von `main` (git); wenn veröffentlicht, verwendet es das npm dist-tag `dev`.

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

  <Accordion title="Wie probiere ich die neuesten Änderungen aus?">
    Zwei Optionen:

    1. **Dev-Kanal (git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechseln Sie auf den Branch `main` und aktualisieren aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und dann per git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone bevorzugen, verwenden Sie:

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

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, je nachdem, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt](#quick-start-and-first-run-setup)
    und den schnellen Debug-Loop in [Ich stecke fest](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Feedback?">
    Führen Sie den Installer mit **ausführlicher Ausgabe** erneut aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare (git)-Installation:

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

  <Accordion title="Windows-Installation meldet git nicht gefunden oder openclaw wird nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen Sie PowerShell und öffnen Sie es erneut, dann führen Sie den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen Sie PowerShell nach der PATH-Aktualisierung und öffnen Sie es erneut.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Docs: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-Exec-Ausgabe zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Das ist normalerweise eine nicht passende Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - `system.run`-/`exec`-Ausgabe stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Zwischenlösung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie dann das Gateway neu und versuchen Sie Ihren Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies weiterhin mit der neuesten OpenClaw-Version reproduzieren, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Docs haben meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git)-Installation**, damit Sie den vollständigen Quellcode und die Docs lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, sodass er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Install](/de/install) und [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurze Antwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Schneller Linux-Pfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Getting Started](/de/start/getting-started).
    - Installer + Updates: [Install & updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir haben einen **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Status + Workspace
    liegen auf dem Server, behandeln Sie also den Host als Quelle der Wahrheit und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Platforms](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurze Antwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung verloren geht), eventuell einen sauberen git-Checkout benötigen und
    nach Bestätigung fragen. Sicherer: Führen Sie Updates als Operator in einer Shell aus.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie unbedingt von einem Agenten aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/cli/update), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-User-Unit unter Linux/WSL2)
    - **Health Checks** und **Skills**-Auswahl

    Es warnt auch, wenn Ihr konfiguriertes Modell unbekannt ist oder Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Methoden, um diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude-CLI- / Claude-Abonnement-Authentifizierung in OpenClaw**: Anthropic-Mitarbeiter
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      als für diese Integration zulässig, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die besser
    vorhersagbare Einrichtung. OpenAI-Codex-OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt auch andere gehostete abonnementartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Local models](/de/gateway/local-models), [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude-CLI-Nutzung im Stil von OpenClaw wieder erlaubt ist, daher
    behandelt OpenClaw die Claude-Abonnement-Authentifizierung und die Nutzung von `claude -p` als für diese Integration
    zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie das
    möglichst vorhersagbare serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Authentifizierung (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als für diese Integration zulässig,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Das Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads ist die Authentifizierung per Anthropic-API-Schlüssel weiterhin die
    sicherere und vorhersagbarere Wahl. Wenn Sie andere gehostete abonnementartige
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
**Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Tarif. Wenn Sie
einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
auf Nutzung/Abrechnung und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Kontext-Beta von Anthropic zu verwenden (`context1m: true`). Das funktioniert nur, wenn Ihre
    Credentials für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Setzen Sie ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider ratenlimitiert ist.
    Siehe [Models](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Model providers](/de/providers/models). Wenn Sie einen verwalteten Key-Flow bevorzugen, bleibt ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt das Standardmodell bei Bedarf auf `openai-codex/gpt-5.4`. Siehe [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum schaltet ChatGPT GPT-5.4 `openai/gpt-5.4` in OpenClaw nicht frei?">
    OpenClaw behandelt die beiden Wege getrennt:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex-OAuth
    - `openai/gpt-5.4` = direkte OpenAI-Platform-API

    In OpenClaw ist die ChatGPT/Codex-Anmeldung an den Pfad `openai-codex/*` gebunden,
    nicht an den direkten Pfad `openai/*`. Wenn Sie den direkten API-Pfad in
    OpenClaw möchten, setzen Sie `OPENAI_API_KEY` (oder die entsprechende OpenAI-Provider-Konfiguration).
    Wenn Sie ChatGPT/Codex-Anmeldung in OpenClaw möchten, verwenden Sie `openai-codex/*`.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    `openai-codex/*` verwendet den Codex-OAuth-Pfad, und seine nutzbaren Kontingentfenster werden
    von OpenAI verwaltet und hängen vom Tarif ab. In der Praxis können sich diese Limits von
    der Erfahrung auf der ChatGPT-Website/App unterscheiden, selbst wenn beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Nutzungs-/Kontingentfenster des Providers in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff um. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limitpfad möchten, verwenden Sie `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Abonnement-OAuth** vollständig.
    OpenAI erlaubt die Nutzung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID und kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` im `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Model providers](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für gelegentliche Chats okay?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen ab und lecken. Wenn Sie unbedingt müssen, führen Sie den **größten** Modell-Build lokal aus, den Sie können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko von Prompt Injection – siehe [Security](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic gehosteter Modelle in einer bestimmten Region?">
    Wählen Sie regiongebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können weiterhin Anthropic/OpenAI daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben und gleichzeitig der von Ihnen ausgewählte regiongebundene Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Homeserver oder eine Box in Raspberry-Pi-Klasse funktioniert.

    Sie benötigen nur für **nur-macOS-Tools** einen Mac. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere nur-macOS-Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich für iMessage-Unterstützung einen Mac mini?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein –
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Führen Sie das Gateway auf Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Einzelrechner-Setup möchten.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw darauf laufen zu lassen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - Das MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es anzuzeigen.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie das auf einem nicht produktiven Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits alte `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie eine DM an `@userinfobot` oder `@getidsbot`.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) gilt global pro WhatsApp-Konto. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für "schnellen Chat" und einen "Opus fürs Coding"-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Eine Beispielkonfiguration finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Models](/de/concepts/models) und [Configuration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen unter Linux-systemd-Services auch gängige Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn gesetzt.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und npm install">
    - **Hackbare (git)-Installation:** vollständiger Quellcode-Checkout, bearbeitbar, am besten für Mitwirkende.
      Sie bauen lokal und können Code/Docs patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach nur ausführen“.
      Updates kommen über npm dist-tags.

    Docs: [Getting started](/de/start/getting-started), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Service auf den neuen Einstiegspunkt zeigt.
    Dadurch werden **Ihre Daten nicht gelöscht** – es wird nur die OpenClaw-Codeinstallation geändert. Ihr Status
    (`~/.openclaw`) und Ihr Workspace (`~/.openclaw/workspace`) bleiben unberührt.

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

    Doctor erkennt einen Mismatch beim Einstiegspunkt des Gateway-Service und bietet an, die Service-Konfiguration passend zur aktuellen Installation umzuschreiben (verwenden Sie `--repair` in der Automatisierung).

    Backup-Tipps: siehe [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurz gesagt: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung möchten und Schlafmodus/Neustarts okay sind, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Schlafmodus/Netzausfälle = Verbindungsabbrüche, Betriebssystem-Updates/Neustarts unterbrechen, Rechner muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Probleme durch Laptop-Schlafmodus, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** oft headless betrieben (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen sich für Updates per SSH verbinden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos auf einem VPS. Der einzige echte Trade-off ist **headless browser** vs. sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser wollen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Schlafmodus/Neustarts, sauberere Berechtigungen, leichter dauerhaft am Laufen zu halten.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig in Ordnung zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner schläft oder Updates ausführt.

    Wenn Sie das Beste aus beiden Welten möchten, behalten Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitshinweise lesen Sie [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die minimalen VPS-Anforderungen und das empfohlene Betriebssystem?">
    OpenClaw ist leichtgewichtig. Für ein einfaches Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM, ~500MB Festplatte.
    - **Empfohlen:** 1–2 vCPU, 2GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Docs: [Linux](/de/platforms/linux), [VPS hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar und mit genug
    RAM für das Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM.
    - **Empfohlen:** 2GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medientools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows sind, ist **WSL2 das einfachste VM-artige Setup** und hat die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits nutzen (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Kanal-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die always-on Control Plane; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **local-first Control Plane**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits nutzen, mit
    zustandsbehafteten Sitzungen, Memory und Tools – ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo immer Sie möchten (Mac, Linux, VPS) und behalten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit agentenspezifischem Routing
      und Failover.
    - **Rein lokale Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie möchten.
    - **Multi-Agent Routing:** separate Agenten pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und Standardwerten.
    - **Open Source und hackbar:** prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Docs: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Website).
    - Eine Mobile-App prototypisieren (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Aufräumen, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten Alltags-Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen normalerweise so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die Sie interessieren.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Docs.
    - **Erinnerungen und Follow-ups:** Cron- oder Heartbeat-gesteuerte Nudges und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Web-Aufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead Gen, Outreach, Ads und Blogs für ein SaaS helfen?">
    Ja für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Outreach- oder Ad-Copy-Entwürfe schreiben.

    Für **Outreach oder Ad-Läufe** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es versendet wird. Das sicherste Muster ist, dass
    OpenClaw entwirft und Sie freigeben.

    Docs: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo zu verschmutzen?">
    Verwenden Sie verwaltete Überschreibungen, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin Vorrang vor gebündelten Skills haben, ohne git zu berühren. Wenn der Skill global installiert sein soll, aber nur für einige Agenten sichtbar, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die upstream-würdig sind, sollten im Repo liegen und als PRs hinausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agenten sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle für unterschiedliche Aufgaben verwenden?">
    Heute sind die unterstützten Muster:

    - **Cron-Jobs**: isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agents**: leiten Sie Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen weiter.
    - **On-demand-Wechsel**: Verwenden Sie `/model`, um das Modell der aktuellen Sitzung jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent Routing](/de/concepts/multi-agent) und [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „einen Sub-Agenten für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Problem sind, setzen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model`.

    Docs: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an einen Sub-Agenten oder ein Sitzungsziel binden, sodass Follow-up-Nachrichten in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Follow-ups).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Binding-Status zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um automatisches Unfocus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Überschreibungen: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-Bind beim Start: Setzen Sie `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Sub-agents](/de/tools/subagents), [Discord](/de/channels/discord), [Configuration Reference](/de/gateway/configuration-reference), [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent ist fertig geworden, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung von Sub-Agenten im Completion-Modus bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine existiert.
    - Wenn der Completion-Ursprung nur einen Kanal enthält, fällt OpenClaw auf die im Requester-Session gespeicherte Route zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktionieren kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann direkte Zustellung fehlschlagen und das Ergebnis fällt statt eines sofortigen Posts in den Chat auf die Zustellung über die Sitzungswarteschlange zurück.
    - Ungültige oder veraltete Ziele können weiterhin Queue-Fallback oder endgültiges Zustellungsversagen erzwingen.
    - Wenn die letzte sichtbare Assistant-Antwort des Child genau das stille Token `NO_REPLY` / `no_reply` oder genau `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach ausschließlich Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe erneut abzuspielen.

    Debugging:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Schlafmodus/keine Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` vs. Host-Zeitzone).

    Debugging:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner die Zustellung versucht hat, aber die Credentials sie blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Zustellung über den Queue-Fallback.

    Bei isolierten Cron-Jobs übernimmt der Runner die endgültige Zustellung. Vom Agenten wird erwartet,
    eine Klartext-Zusammenfassung zurückzugeben, die der Runner senden kann. `--no-deliver` hält
    dieses Ergebnis intern; es erlaubt dem Agenten nicht, stattdessen direkt mit dem
    Nachrichtentool zu senden.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Pfad für Live-Modellwechsel, nicht doppelte Planung.

    Isoliertes Cron kann eine Laufzeit-Übergabe des Modells persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und falls der Wechsel ein neues Auth-Profil-Override mitbrachte, persistiert Cron
    auch das vor dem Retry.

    Zugehörige Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn zutreffend.
    - Dann das jobbezogene `model`.
    - Dann jedes gespeicherte Modell-Override der Cron-Sitzung.
    - Dann die normale Auswahl des Agent-/Standardmodells.

    Die Retry-Schleife ist begrenzt. Nach dem initialen Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos zu schleifen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/de/automation/cron-jobs), [cron CLI](/cli/cron).

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
    Installieren Sie die separate `clawhub`-CLI nur, wenn Sie Ihre eigenen Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über mehrere Agenten legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach einem Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder in Chats zustellen.

    Docs: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binaries gesteuert, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** geeignet sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie dieses Gating nicht überschreiben.

    Sie haben drei unterstützte Muster:

    **Option A – das Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binaries vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B – einen macOS-Node verwenden (ohne SSH).**
    Führen Sie das Gateway auf Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann macOS-only-Skills als geeignet behandeln, wenn die erforderlichen Binaries auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie „Always Ask“ wählen, fügt das Bestätigen von „Always Allow“ in der Eingabeaufforderung diesen Befehl zur Zulassungsliste hinzu.

    **Option C – macOS-Binaries über SSH proxien (fortgeschritten).**
    Lassen Sie das Gateway auf Linux, aber sorgen Sie dafür, dass sich die erforderlichen CLI-Binaries zu SSH-Wrappern auflösen, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill so, dass Linux erlaubt ist, damit er geeignet bleibt.

    1. Erstellen Sie einen SSH-Wrapper für das Binary (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in den `PATH` (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI auf macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Haben Sie eine Notion- oder HeyGen-Integration?">
    Derzeit nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie den Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, öffnen Sie eine Feature-Anfrage oder bauen Sie einen Skill,
    der diese APIs anspricht.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im aktiven Workspace-Verzeichnis `skills/`. Für gemeinsame Skills über Agenten hinweg legen Sie sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binaries, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Linux-FAQ-Eintrag zu Homebrew oben). Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte Browser-Profil `user`, das sich über Chrome DevTools MCP verbindet:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den lokalen Host-Browser oder einen verbundenen Browser-Node verwenden. Wenn das Gateway woanders läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selektor-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Dokumentation zu Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifisches Setup (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an – wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es
    keine Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass dieser Pfad persistent gespeichert wird.

    Docs: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen mit einem Agenten öffentlich/in der Sandbox machen?">
    Ja – wenn Ihr privater Verkehr **DMs** und Ihr öffentlicher Verkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanal-Sitzungen (non-main-Schlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Schränken Sie dann über `tools.sandbox.tools` ein, welche Tools in sandboxed Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Groups: personal DMs + public groups](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referenz für die Schlüsselkonfiguration: [Gateway configuration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und agentenspezifische Binds werden zusammengeführt; agentenspezifische Binds werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Binds die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorgänger aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin Fail-Closed scheitern, selbst wenn das letzte Pfadsegment noch nicht existiert, und dass Prüfungen erlaubter Roots auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor der Compaction** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor automatische Compaction erfolgt. Dies läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie sorge ich dafür, dass es bleibt?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Memories zu speichern;
    es weiß dann, was zu tun ist. Wenn es trotzdem weiter vergisst, prüfen Sie, ob das Gateway bei jedem Lauf denselben
    Workspace verwendet.

    Docs: [Memory](/de/concepts/memory), [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Was sind die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Modell-
    Kontextfenster begrenzt, daher können lange Unterhaltungen komprimiert oder gekürzt werden. Deshalb
    gibt es die Memory-Suche – sie holt nur die relevanten Teile zurück in den Kontext.

    Docs: [Memory](/de/concepts/memory), [Context](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt semantische Memory-Suche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex-OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder
    dem Codex-CLI-Login)** nicht bei der semantischen Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Env-Variablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen konfigurierten und vorhandenen lokalen Modellpfad haben, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben `GEMINI_API_KEY` an (oder
    `memorySearch.remote.apiKey`). Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder local** – siehe [Memory](/de/concepts/memory) für die Setup-Details.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein – **der Status von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/etc.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Footprint:** Mit lokalen Modellen bleiben Prompts auf Ihrem Rechner, aber Kanal-
      verkehr geht weiterhin über die Server des jeweiligen Kanals.

    Verwandt: [Agent workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optionale `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateigestützte Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Status (z. B. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status pro Agent (agentDir + Sitzungen)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Unterhaltungsverlauf & Status (pro Agent)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Einzelagent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Workspace** (`AGENTS.md`, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder Legacy-Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State-Verzeichnis (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Status, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Der Remote-Modus verwendet den Workspace des **Gateway-Hosts**,
    nicht den Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, es **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in ein **privates** git-Repo und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub private). Dadurch werden Memory + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (`Credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Docs: [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die dedizierte Anleitung: [Uninstall](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repo das Standard-Arbeitsverzeichnis ist, setzen Sie den `workspace`
    dieses Agenten auf das Root des Repos. Das OpenClaw-Repo ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten ausdrücklich, dass der Agent darin arbeitet.

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

  <Accordion title="Remote-Modus: Wo ist der Sitzungsspeicher?">
    Der Sitzungsstatus gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Session management](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo liegt sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es halbwegs sichere Standardwerte (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe `gateway.bind: "lan"` (oder `"tailnet"`) gesetzt und jetzt lauscht nichts / die UI sagt unauthorized'>
    Nicht-loopback-Binds **erfordern einen gültigen Gateway-Authentifizierungspfad**. In der Praxis bedeutet das:

    - Shared-Secret-Authentifizierung: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten nicht-loopback Identity-aware Reverse Proxy

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Authentifizierung nicht von selbst.
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Authentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung Fail-Closed fehl (kein Remote-Fallback, das dies maskiert).
    - Shared-Secret-Control-UI-Setups authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie es, Shared Secrets in URLs zu platzieren.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse Proxys auf demselben Host mit loopback weiterhin **nicht** die trusted-proxy-Authentifizierung. Der Trusted Proxy muss eine konfigurierte nicht-loopback-Quelle sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt auf localhost ein Token?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Authentifizierungspfad konfiguriert ist, löst der Gateway-Start auf den Token-Modus auf und erzeugt automatisch einen Token, den es in `gateway.auth.token` speichert, sodass **lokale WS-Clients sich authentifizieren müssen**. Dadurch werden andere lokale Prozesse daran gehindert, das Gateway aufzurufen.

    Wenn Sie einen anderen Authentifizierungspfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für nicht-loopback Identity-aware Reverse Proxys `trusted-proxy`). Wenn Sie **wirklich** offenes loopback möchten, setzen Sie explizit `gateway.auth.mode: "none"` in Ihrer Konfiguration. Doctor kann jederzeit einen Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen per Hot Apply, Neustart für kritische Änderungen
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich lustige CLI-Taglines?">
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

    - `off`: blendet den Tagline-Text aus, behält aber die Titel-/Versionszeile des Banners bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie überhaupt kein Banner möchten, setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web Fetch)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search benötigt keinen Schlüssel, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Schlüssel, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
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
              provider: "firecrawl", // optional; weglassen für automatische Erkennung
            },
          },
        },
    }
    ```

    Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Alte Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend weiterhin geladen, sollten aber für neue Konfigurationen nicht mehr verwendet werden.
    Die Firecrawl-Web-Fetch-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Zulassungslisten verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider aus den verfügbaren Credentials. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Env-Variablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Docs: [Web tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    OpenClaw schützt derzeit vor vielen versehentlichen Überschreibungen:

    - Von OpenClaw selbst ausgelöste Konfigurationsschreibvorgänge validieren die vollständige Konfiguration nach der Änderung, bevor sie geschrieben wird.
    - Ungültige oder destruktive von OpenClaw ausgelöste Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot Reload kaputt macht, stellt das Gateway die letzte funktionierende Konfiguration wieder her und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.
    - Der Hauptagent erhält nach der Wiederherstellung eine Boot-Warnung, damit er die schlechte Konfiguration nicht blind erneut schreibt.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Config auto-restored from last-known-good`, `Config write rejected:` oder `config reload restored last-known-good config`.
    - Prüfen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Behalten Sie die aktive wiederhergestellte Konfiguration, wenn sie funktioniert, und kopieren Sie dann nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Führen Sie `openclaw config validate` und `openclaw doctor` aus.
    - Wenn Sie keine letzte funktionierende oder abgelehnte Payload haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Kanäle/Modelle neu.
    - Wenn das unerwartet war, melden Sie einen Bug und fügen Ihre zuletzt bekannte Konfiguration oder ein vorhandenes Backup bei.
    - Ein lokaler Coding-Agent kann oft aus Logs oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    So vermeiden Sie es:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem exakten Pfad oder der Feldform unsicher sind; es gibt einen flachen Schemaknoten plus Zusammenfassungen der direkten Kindknoten für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; reservieren Sie `config.apply` nur für vollständigen Konfigurationsersatz.
    - Wenn Sie das nur für Eigentümer gedachte Tool `gateway` aus einem Agentenlauf verwenden, lehnt es weiterhin Schreibvorgänge an `tools.exec.ask` / `tools.exec.security` ab (einschließlich alter `tools.bash.*`-Aliasse, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Docs: [Config](/cli/config), [Configure](/cli/configure), [Gateway troubleshooting](/de/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** besitzt Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** getrennte Gehirne/Workspaces für spezielle Rollen (z. B. „Hetzner ops“, „Personal data“).
    - **Sub-Agents:** starten Hintergrundarbeit von einem Hauptagenten aus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und Agenten/Sitzungen wechseln.

    Docs: [Nodes](/de/nodes), [Remote access](/de/gateway/remote), [Multi-Agent Routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [TUI](/web/tui).

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

    Standard ist `false` (headful). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **denselben Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Informationen brauchen).
    - Manche Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter Headless-Sitzungen häufig.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihr Brave-Binary (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Verkehr; sie empfangen nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Rechner zugreifen, wenn das Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Rechner als Node**. Das Gateway läuft woanders, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway WebSocket aufrufen.

    Typisches Setup:

    1. Führen Sie das Gateway auf dem always-on-Host aus (VPS/Homeserver).
    2. Bringen Sie den Gateway-Host und Ihren Rechner in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sich im Modus **Remote over SSH** (oder direkt per Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway WebSocket.

    Sicherheitserinnerung: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Security](/de/gateway/security).

    Docs: [Nodes](/de/nodes), [Gateway protocol](/de/gateway/protocol), [macOS remote mode](/de/platforms/mac/remote), [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Kanal-Health: `openclaw channels status`

    Verifizieren Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Zulassungslisten (DM oder Gruppe) Ihr Konto enthalten.

    Docs: [Tailscale](/de/gateway/tailscale), [Remote access](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können das auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots Zugriff haben (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und lassen Sie Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft, gerichtet an einen Chat, in dem der andere Bot
    zuhört. Wenn ein Bot auf einem Remote-VPS läuft, richten Sie Ihre CLI auf dieses Remote-Gateway
    per SSH/Tailscale aus (siehe [Remote access](/de/gateway/remote)).

    Beispielmuster (ausgeführt von einem Rechner, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie ein Guardrail hinzu, damit die beiden Bots nicht endlos schleifen (nur Erwähnung, Kanal-
    zulassungslisten oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Docs: [Remote access](/de/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agenten separate VPSes?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeder mit eigenem Workspace, Standardmodellen
    und Routing. Das ist das normale Setup und viel günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation benötigen (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen, die Sie nicht teilen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agenten oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, auf meinem persönlichen Laptop einen Node statt SSH von einem VPS zu verwenden?">
    Ja – Nodes sind der erstklassige Weg, um von einem Remote-Gateway aus Ihren Laptop zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Box in Raspberry-Pi-Klasse reicht aus; 4 GB RAM sind mehr als genug), daher ist ein häufiges
    Setup ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway WebSocket und verwenden Device Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch Node-Zulassungslisten/Freigaben gesteuert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalten Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder verbinden Sie sich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist in Ordnung für ad-hoc-Shell-Zugriff, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer Sie betreiben absichtlich isolierte Profile (siehe [Multiple gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es einen API-/RPC-Weg, um Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit flachem Schemaknoten, passendem UI-Hinweis und Zusammenfassungen der direkten Kindknoten vor dem Schreiben prüfen
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sicheres partielles Update (für die meisten RPC-Bearbeitungen bevorzugt); führt nach Möglichkeit Hot Reload durch und startet bei Bedarf neu
    - `config.apply`: validieren + vollständige Konfiguration ersetzen; führt nach Möglichkeit Hot Reload durch und startet bei Bedarf neu
    - Das nur für Eigentümer gedachte Laufzeit-Tool `gateway` weigert sich weiterhin, `tools.exec.ask` / `tools.exec.security` umzuschreiben; alte `tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimale sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Damit wird Ihr Workspace festgelegt und eingeschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf Ihrem Mac installieren + anmelden**
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

    Dadurch bleibt das Gateway an loopback gebunden und wird per Tailscale über HTTPS verfügbar gemacht. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway protocol](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch bleibt ein einziges Gateway erhalten und doppelte Konfiguration wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, wir planen aber, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie nur dann ein zweites Gateway, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env-Variablen und Laden von `.env`

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env-Variablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`)

    Keine `.env`-Datei überschreibt bestehende Env-Variablen.

    Sie können auch Inline-Env-Variablen in der Konfiguration definieren (werden nur angewendet, wenn sie im Prozess-Env fehlen):

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

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine Env-Variablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann erfasst werden, wenn der Service Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie Shell-Import (optionale Komfortfunktion):

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

    Dadurch wird Ihre Login-Shell ausgeführt und nur fehlende erwartete Schlüssel werden importiert (nie überschrieben). Äquivalente Env-Variablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe `COPILOT_GITHUB_TOKEN` gesetzt, aber models status zeigt "Shell env: off." an. Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Env-Variablen fehlen – es bedeutet nur, dass OpenClaw Ihre
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das auf eine dieser Arten:

    1. Legen Sie den Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie ihn Ihrem `env`-Block in der Konfiguration hinzu (wird nur angewendet, wenn er fehlt).

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
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Session management](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber dies ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie den Wert auf einen positiven Wert, um den Inaktivitätsablauf zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsperiode eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden keine Transkripte gelöscht – es beginnt nur eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team aus OpenClaw-Instanzen zu erstellen (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent Routing** und **Sub-Agents**. Sie können einen koordinierenden
    Agenten und mehrere Worker-Agenten mit eigenen Workspaces und Modellen erstellen.

    Dennoch sollte man das am besten als **spaßiges Experiment** sehen. Es verbraucht viele Tokens und ist oft
    weniger effizient, als einen Bot mit getrennten Sitzungen zu verwenden. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Docs: [Multi-agent routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Trunkierung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Status zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn das häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, aber lasse es installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset** an, wenn es eine bestehende Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Verzeichnis zurück (Standards sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Entwicklung; löscht Dev-Konfiguration + Credentials + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme "context too large"-Fehler – wie setze ich zurück oder kompaktiere?'>
    Verwenden Sie eine dieser Möglichkeiten:

    - **Compaction** (behält die Unterhaltung, fasst aber ältere Züge zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (neue Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder justieren Sie **Session Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Docs: [Compaction](/de/concepts/compaction), [Session pruning](/de/concepts/session-pruning), [Session management](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet meist, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schema-Änderung).

    Lösung: Starten Sie mit `/new` (eigenständige Nachricht) eine neue Sitzung.

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei Verwendung von OAuth-Authentifizierung). Passen Sie sie an oder deaktivieren Sie sie:

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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur leere Zeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Überschreibungen pro Agent verwenden `agents.list[].heartbeat`. Docs: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einer WhatsApp-Gruppe ein "Bot-Konto" hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn Sie in der Gruppe sind.
    Standardmäßig werden Gruppenantworten blockiert, bis Sie Absender zulassen (`groupPolicy: "allowlist"`).

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

  <Accordion title="Wie bekomme ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Logs verfolgen und eine Testnachricht in die Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Zulassungsliste): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Erwähnungssteuerung ist aktiv (Standard). Sie müssen den Bot per @mention erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Zulassungsliste.

    Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads den Kontext mit DMs?">
    Direktchats fallen standardmäßig in die Hauptsitzung zusammen. Gruppen/Kanäle haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine harten Limits. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Wachstum des Speicherplatzes:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Overhead:** agentenspezifische Auth-Profile, Workspaces und Kanal-Routing.

    Tipps:

    - Halten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn der Speicherplatz wächst.
    - Verwenden Sie `openclaw doctor`, um verirrte Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann an bestimmte Agenten gebunden werden.

    Browser-Zugriff ist leistungsfähig, aber nicht „alles, was ein Mensch kann“ – Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Kanal/-Kanäle an diese Agenten gebunden.
    - Lokaler Browser über Chrome MCP oder bei Bedarf ein Node.

    Docs: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standardwerte, Auswahl, Aliasse, Umschalten

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was Sie hier festlegen:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer eines konfigurierten Providers für genau diese Modell-ID und fällt erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen. Sie sollten dennoch **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    **Für tool-fähige Agenten oder nicht vertrauenswürdige Eingaben:** Priorisieren Sie Modellstärke vor Kosten.
    **Für Routine-/Low-Stakes-Chat:** Verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agentenrolle.

    MiniMax hat eigene Docs: [MiniMax](/de/providers/minimax) und
    [Local models](/de/gateway/local-models).

    Faustregel: Verwenden Sie für hochkritische Arbeit das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Models](/de/concepts/models) und
    [Sub-agents](/de/tools/subagents).

    Deutliche Warnung: Schwächere/zu stark quantisierte Modelle sind anfälliger für Prompt
    Injection und unsicheres Verhalten. Siehe [Security](/de/gateway/security).

    Mehr Kontext: [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modellbefehle** oder bearbeiten Sie nur die **Modell**-Felder. Vermeiden Sie vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, außer Sie möchten wirklich die ganze Konfiguration ersetzen.
    Für RPC-Bearbeitungen prüfen Sie zuerst mit `config.schema.lookup` und bevorzugen `config.patch`. Die Lookup-Payload liefert Ihnen den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und Zusammenfassungen der direkten Kindknoten
    für partielle Updates.
    Wenn Sie die Konfiguration doch überschrieben haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um zu reparieren.

    Docs: [Models](/de/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellstes Setup:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Ziehen Sie ein lokales Modell wie `ollama pull gemma4`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Für manuelles Umschalten verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt
    Injection. Wir empfehlen für jeden Bot, der Tools verwenden kann, dringend **große Modelle**.
    Wenn Sie trotzdem kleine Modelle möchten, aktivieren Sie Sandboxing und strikte Tool-Zulassungslisten.

    Docs: [Ollama](/de/providers/ollama), [Local models](/de/gateway/local-models),
    [Model providers](/de/concepts/model-providers), [Security](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitssensible/tool-fähige Agenten verwenden Sie das stärkste Modell der neuesten Generation, das verfügbar ist.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle im laufenden Betrieb (ohne Neustart)?">
    Verwenden Sie den Befehl `/model` als eigenständige Nachricht:

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

    Verfügbare Modelle können Sie mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt eine kompakte, nummerierte Auswahl. Auswahl per Nummer:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Es zeigt außerdem den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich die Fixierung eines mit @profile gesetzten Profils?**

    Führen Sie `/model` erneut **ohne** den Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn aus `/model` (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 fürs Coding verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie bei Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` fürs Coding mit Codex OAuth.
    - **Standard + Wechsel:** setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4` und wechseln Sie dann beim Coding zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agents:** Leiten Sie Coding-Aufgaben an Sub-Agents mit einem anderen Standardmodell weiter.

    Siehe [Models](/de/concepts/models) und [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den schnellen Modus für GPT 5.4?">
    Verwenden Sie entweder einen Sitzungsschalter oder einen Konfigurationsstandard:

    - **Pro Sitzung:** senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch Codex OAuth:** wenn Sie zusätzlich `openai-codex/gpt-5.4` verwenden, setzen Sie dort dasselbe Flag.

    Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Für OpenAI wird der schnelle Modus bei unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzungsschalter über `/fast` haben Vorrang vor Konfigurationsstandards.

    Siehe [Thinking and fast mode](/de/tools/thinking) und [OpenAI fast mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und danach keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Zulassungsliste** für `/model` und alle
    Sitzungsüberschreibungen. Wenn Sie ein Modell wählen, das nicht in dieser Liste steht, erhalten Sie:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Zulassungsliste oder wählen Sie ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf ein aktuelles OpenClaw-Release (oder führen Sie `main` aus dem Quellcode aus) und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Authentifizierung
       in Env/Auth-Profilen existiert, sodass der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (case-sensitive) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-Key-
       Setup, oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führen Sie aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie **pro Sitzung** das Modell, wenn nötig.
    Fallbacks sind für **Fehler**, nicht für „schwere Aufgaben“, verwenden Sie also `/model` oder einen separaten Agenten.

    **Option A: pro Sitzung wechseln**

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

    **Option B: separate Agenten**

    - Agent A Standard: MiniMax
    - Agent B Standard: OpenAI
    - Nach Agent routen oder mit `/agent` wechseln

    Docs: [Models](/de/concepts/models), [Multi-Agent Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt eingebaute Kürzel?">
    Ja. OpenClaw liefert einige Standard-Kurzformen mit (sie werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn Sie einen eigenen Alias mit demselben Namen setzen, gewinnt Ihr Wert.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Kürzel (Aliasse)?">
    Aliasse stammen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

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

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) auf diese Modell-ID aufgelöst.

  </Accordion>

  <Accordion title="Wie füge ich Modelle anderer Provider wie OpenRouter oder Z.AI hinzu?">
    OpenRouter (Bezahlung pro Token; viele Modelle):

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

    Wenn Sie auf einen Provider/ein Modell verweisen, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Authentifizierungsfehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Authentifizierung ist pro Agent und
    wird hier gespeichert:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Möglichkeiten zur Behebung:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie die Authentifizierung während des Assistenten.
    - Oder kopieren Sie `auth-profiles.json` aus dem `agentDir` des Hauptagenten in das `agentDir` des neuen Agenten.

    Verwenden Sie **nicht** dasselbe `agentDir` für mehrere Agenten; das verursacht Kollisionen bei Authentifizierung/Sitzungen.

  </Accordion>
</AccordionGroup>

## Model Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Rotation des Auth-Profils** innerhalb desselben Providers.
    2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

    Für fehlschlagende Profile gelten Cooldowns (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider ratenlimitiert ist oder vorübergehend ausfällt.

    Der Rate-Limit-Bucket umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als
    failover-würdige Rate-Limits.

    Manche Antworten, die nach Abrechnung aussehen, sind nicht `402`, und manche HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Abrechnungstext auf `401` oder `403` zurückgibt, kann OpenClaw dies dennoch in
    der Billing-Spur halten, aber provider-spezifische Textmatcher bleiben auf den
    Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Meldung stattdessen wie ein wiederholbares Nutzungsfenster oder
    ein Ausgabenlimit für Organisation/Workspace aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dies als
    `rate_limit`, nicht als lange Billing-Deaktivierung.

    Kontextüberlauf-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Pfad für Compaction/Retry, statt den Modell-
    Fallback voranzutreiben.

    Generischer Server-Fehlertext ist absichtlich enger als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-spezifische transiente Formen
    wie Anthropic ohne Zusatz `An unknown error occurred`, OpenRouter ohne Zusatz
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und provider-busy-Fehler wie `ModelNotReadyException` als
    failover-würdige Timeout-/Überlastungssignale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst für sich allein keinen Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Das bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, dafür aber im erwarteten Auth-Store keine Credentials finden konnte.

    **Checkliste zur Behebung:**

    - **Bestätigen Sie, wo Auth-Profile liegen** (neue vs. alte Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Bestätigen Sie, dass Ihre Env-Variable vom Gateway geladen wird**
      - Wenn Sie `ANTHROPIC_API_KEY` in Ihrer Shell gesetzt haben, das Gateway aber über systemd/launchd läuft, wird sie möglicherweise nicht geerbt. Legen Sie sie in `~/.openclaw/.env` ab oder aktivieren Sie `env.shellEnv`.
    - **Stellen Sie sicher, dass Sie den richtigen Agenten bearbeiten**
      - Bei Multi-Agent-Setups kann es mehrere Dateien `auth-profiles.json` geben.
    - **Prüfen Sie den Modell-/Auth-Status**
      - Verwenden Sie `openclaw models status`, um konfigurierte Modelle und den Authentifizierungsstatus der Provider anzuzeigen.

    **Checkliste zur Behebung für "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf auf ein Anthropic-Auth-Profil fixiert ist, das Gateway
    es aber in seinem Auth-Store nicht finden kann.

    - **Claude CLI verwenden**
      - Führen Sie `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn Sie stattdessen einen API-Schlüssel verwenden möchten**
      - Legen Sie `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Löschen Sie jede fixierte Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätigen Sie, dass Sie Befehle auf dem Gateway-Host ausführen**
      - Im Remote-Modus liegen Auth-Profile auf dem Gateway-Rechner, nicht auf Ihrem Laptop.

  </Accordion>

  <Accordion title="Warum hat es auch Google Gemini versucht und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie zu einem Gemini-Kürzel gewechselt haben), versucht OpenClaw es während des Modell-Fallbacks. Wenn Sie keine Google-Credentials konfiguriert haben, sehen Sie `No API key found for provider "google"`.

    Lösung: Geben Sie entweder Google-Authentifizierung an oder entfernen/vermeiden Sie Google-Modelle in `agents.defaults.model.fallbacks` / Aliassen, damit der Fallback nicht dorthin routet.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält **Thinking-Blöcke ohne Signaturen** (oft aus
    einem abgebrochenen/partiellen Stream). Google Antigravity verlangt Signaturen für Thinking-Blöcke.

    Lösung: OpenClaw entfernt jetzt unsignierte Thinking-Blöcke für Google Antigravity Claude. Wenn es weiterhin erscheint, starten Sie eine **neue Sitzung** oder setzen Sie `/thinking off` für diesen Agenten.

  </Accordion>
</AccordionGroup>

## Auth-Profile: was sie sind und wie man sie verwaltet

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Abläufe, Token-Speicherung, Multi-Account-Muster)

<AccordionGroup>
  <Accordion title="Was ist ein Auth-Profil?">
    Ein Auth-Profil ist ein benannter Credential-Eintrag (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile liegen unter:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Was sind typische Profil-IDs?">
    OpenClaw verwendet Provider-präfixierte IDs wie:

    - `anthropic:default` (üblich, wenn keine E-Mail-Identität existiert)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs Ihrer Wahl (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Auth-Profil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dadurch werden **keine** Secrets gespeichert; es ordnet IDs Provider/Modus zu und setzt die Rotationsreihenfolge.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es sich in einem kurzen **Cooldown** befindet (Rate-Limits/Timeouts/Auth-Fehler) oder in einem längeren **deaktivierten** Zustand (Abrechnung/ungenügende Credits). Um dies zu prüfen, führen Sie `openclaw models status --json` aus und prüfen `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein Modell
    im Cooldown ist, kann für ein Schwestermodell beim selben Provider weiterhin nutzbar sein,
    während Billing-/Deaktivierungsfenster weiterhin das ganze Profil blockieren.

    Sie können über die CLI auch ein **agentenspezifisches** Override der Reihenfolge setzen (gespeichert in `auth-state.json` dieses Agenten):

    ```bash
    # Standard ist der konfigurierte Standard-Agent (lassen Sie --agent weg)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil festlegen (nur dieses versuchen)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge setzen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Override löschen (zurück auf config auth.order / Round-Robin)
    openclaw models auth order clear --provider anthropic
    ```

    Um einen bestimmten Agenten anzusprechen:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu verifizieren, was tatsächlich versucht wird, verwenden Sie:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge fehlt, meldet Probe
    `excluded_by_auth_order` für dieses Profil, statt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API-Schlüssel – was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt oft, wo anwendbar, Abonnement-Zugriff.
    - **API-Schlüssel** verwenden Bezahlung pro Token.

    Der Assistent unterstützt ausdrücklich Anthropic Claude CLI, OpenAI Codex OAuth und API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Gateway: Ports, „already running“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexen Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standard 18789
    ```

  </Accordion>

  <Accordion title='Warum sagt openclaw gateway status "Runtime: running", aber "Connectivity probe: failed"?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die Connectivity Probe bedeutet, dass sich die CLI tatsächlich mit dem Gateway WebSocket verbindet.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die die Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Grundursache, wenn der Prozess lebt, der Port aber nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für "Config (cli)" und "Config (service)"?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Service eine andere ausführt (oft ein Mismatch bei `--profile` / `OPENCLAW_STATE_DIR`).

    Lösung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie das aus derselben `--profile`-/Umgebung aus, die der Service verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem es den WebSocket-Listener sofort beim Start bindet (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wirft es `GatewayLockError`, was anzeigt, dass bereits eine andere Instanz lauscht.

    Lösung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie mit `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie betreibe ich OpenClaw im Remote-Modus (Client verbindet sich mit einem Gateway an einem anderen Ort)?">
    Setzen Sie `gateway.mode: "remote"` und zeigen Sie auf eine Remote-WebSocket-URL, optional mit Shared-Secret-Remote-Credentials:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` auf `local` steht (oder Sie das Override-Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live die Modi, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Credentials; sie aktivieren lokale Gateway-Authentifizierung nicht von selbst.

  </Accordion>

  <Accordion title='Die Control UI sagt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Authentifizierungspfad und die Authentifizierungsmethode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI hält den Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne langlebige Token-Persistenz in `localStorage` wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Retry mit einem zwischengespeicherten Device-Token versuchen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit zwischengespeichertem Token verwendet jetzt die zwischengespeicherten genehmigten Scopes, die mit dem Device-Token gespeichert sind, wieder. Explizite Aufrufer mit `deviceToken` / expliziten `scopes` behalten weiterhin ihre angeforderte Scope-Menge, statt zwischengespeicherte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads ist die Priorität der Verbindungs-Authentifizierung: expliziter Shared Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
    - Prüfungen des Bootstrap-Token-Scopes sind rollenpräfixiert. Die eingebaute Bootstrap-Operator-Zulassungsliste erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Lösung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht zu öffnen; zeigt einen SSH-Hinweis an, wenn headless).
    - Wenn Sie noch keinen Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote: erst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und fügen Sie dann das passende Secret in die Control-UI-Einstellungen ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe loopback-/tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten nicht-loopback Identity-aware Proxy kommen, nicht über einen Loopback-Proxy auf demselben Host oder eine rohe Gateway-URL.
    - Wenn der Mismatch nach dem einen Retry bestehen bleibt, rotieren/genehmigen Sie den gekoppelten Device-Token erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf sagt, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, außer sie haben zusätzlich `operator.admin`
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch festgefahren? Führen Sie `openclaw status --all` aus und folgen Sie [Troubleshooting](/de/gateway/troubleshooting). Siehe [Dashboard](/web/dashboard) für Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Ich habe gateway.bind tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bind wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen aus (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden könnte.

    Lösung:

    - Starten Sie Tailscale auf diesem Host (damit es eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie einen tailnet-only-Bind möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein – ein Gateway kann mehrere Messaging-Kanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rettungs-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Status pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie einen eindeutigen `gateway.port` in jeder Profilkonfiguration (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Service pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen auch Suffixe an Servicenamen an (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet, dass die allererste Nachricht
    ein `connect`-Frame ist. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **code 1008** (policy violation).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Authentifizierungs-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Lösungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Authentifizierung aktiv ist, geben Sie Token/Passwort im `connect`-Frame mit.

    Wenn Sie CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway protocol](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Debugging

<AccordionGroup>
  <Accordion title="Wo sind die Logs?">
    Dateilogs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können einen stabilen Pfad über `logging.file` setzen. Das Dateilog-Level wird über `logging.level` gesteuert. Die Konsolen-Verbosity wird über `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellster Log-Tail:

    ```bash
    openclaw logs --follow
    ```

    Service-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Troubleshooting](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Service neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückholen. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen – wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, gehen Sie in WSL und starten Sie dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Service nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt unter Windows.

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie es manuell ausführen (kein Service), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Docs: [Windows (WSL2)](/de/platforms/windows), [Gateway service runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Durchlauf:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Authentifizierung auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Kanal-Pairing/Zulassungsliste blockiert Antworten (prüfen Sie Kanalkonfiguration + Logs).
    - WebChat/Dashboard ist ohne den richtigen Token geöffnet.

    Wenn Sie remote sind, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und der
    Gateway WebSocket erreichbar ist.

    Docs: [Channels](/de/channels), [Troubleshooting](/de/gateway/troubleshooting), [Remote access](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" – was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI den richtigen Token? `openclaw dashboard`
    4. Wenn remote: Ist die Tunnel-/Tailscale-Verbindung aktiv?

    Verfolgen Sie dann die Logs:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/web/dashboard), [Remote access](/de/gateway/remote), [Troubleshooting](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Kanalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen weiterhin entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host betrachten.

    Docs: [Telegram](/de/channels/telegram), [Channel troubleshooting](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent ausgeführt werden kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Kanal erwarten, stellen Sie sicher, dass Zustellung aktiviert ist (`/deliver on`).

    Docs: [TUI](/web/tui), [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann neu?">
    Wenn Sie den Service installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Service** gestoppt/gestartet (launchd auf macOS, systemd auf Linux).
    Verwenden Sie dies, wenn das Gateway im Hintergrund als Daemon läuft.

    Wenn Sie es im Vordergrund ausführen, stoppen Sie es mit Ctrl-C und dann:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway service runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrund-Service** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn Sie den Service installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg, mehr Details zu bekommen, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Details auf der Konsole zu erhalten. Prüfen Sie dann die Logdatei auf Kanal-Authentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agenten müssen eine Zeile `MEDIA:<path-or-url>` enthalten (in eigener Zeile). Siehe [OpenClaw assistant setup](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Hier bitte" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Zulassungslisten blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt das Senden lokaler Pfade auf Workspace, temp/media-store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, Host-lokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Klartext- und secret-ähnliche Dateien werden weiterhin blockiert.

    Siehe [Images](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardwerte sind darauf ausgelegt, das Risiko zu verringern:

    - Standardverhalten auf DM-fähigen Kanälen ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie mit `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - DMs öffentlich zu öffnen erfordert ein explizites Opt-in (`dmPolicy: "open"` und Zulassungsliste `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur ein Problem für öffentliche Bots?">
    Nein. Prompt Injection betrifft **nicht vertrauenswürdige Inhalte**, nicht nur die Frage, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/Web Fetch, Browser-Seiten, E-Mails,
    Docs, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann auch passieren, wenn **Sie der einzige Absender** sind.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Verringern Sie den Blast Radius, indem Sie:

    - einen schreibgeschützten oder tool-deaktivierten „Reader“-Agenten verwenden, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für tool-fähige Agenten deaktiviert lassen
    - auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und Medienanhang-Extraktion kapseln extrahierten Text beide in
      explizite Markierungen für externe Inhaltsgrenzen, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Zulassungslisten verwenden

    Details: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot ein eigenes E-Mail-Konto, GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolation des Bots mit separaten Konten und Telefonnummern
    verringert den Blast Radius, falls etwas schiefgeht. Außerdem ist es dadurch leichter, Credentials zu rotieren
    oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Geben Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Docs: [Security](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Behalten Sie DMs im **Pairing-Modus** oder mit einer engen Zulassungsliste.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn Sie möchten, dass es in Ihrem Namen Nachrichten sendet.
    - Lassen Sie es Entwürfe erstellen und **genehmigen Sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies auf einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für persönliche Assistentenaufgaben verwenden?">
    Ja, **wenn** der Agent nur Chat verwendet und die Eingaben vertrauenswürdig sind. Kleinere Stufen sind
    anfälliger für Instruction Hijacking, vermeiden Sie sie daher bei tool-fähigen Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie trotzdem ein kleineres Modell verwenden müssen, sperren Sie
    Tools und arbeiten Sie innerhalb einer Sandbox. Siehe [Security](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Pairing-Code bekommen">
    Pairing-Codes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot schreibt und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Prüfen Sie ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Zulassungsliste oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meine Kontakte anschreiben? Wie funktioniert Pairing?">
    Nein. Die Standard-DM-Richtlinie für WhatsApp ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es erhält, oder auf explizite Sendungen, die Sie auslösen.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Eingabeaufforderung des Assistenten für die Telefonnummer: Sie wird verwendet, um Ihre **Zulassungsliste/Ihren Eigentümer** festzulegen, sodass Ihre eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie mit Ihrer persönlichen WhatsApp-Nummer arbeiten, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Sitzung aktiviert ist.

    Lösung im Chat, in dem Sie das sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin zu laut ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Bestätigen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Docs: [Thinking and verbose](/de/tools/thinking), [Security](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine der folgenden Nachrichten **als eigenständige Nachricht** (ohne Slash):

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

    Bei Hintergrundprozessen (vom Exec-Tool) können Sie den Agenten bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht über Slash-Befehle: siehe [Slash commands](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Abkürzungen (wie `/status`) funktionieren für Absender auf der Zulassungsliste auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram aus? ("Cross-context messaging denied")'>
    OpenClaw blockiert standardmäßig **providerübergreifendes** Messaging. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet es nicht an Discord, außer Sie erlauben dies explizit.

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

    Starten Sie das Gateway nach dem Bearbeiten der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - neue Nachrichten lenken die aktuelle Aufgabe um
    - `followup` - Nachrichten nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten (Standard)
    - `steer-backlog` - jetzt umlenken, dann den Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und neu beginnen

    Sie können Optionen wie `debounce:2s cap:25 drop:summarize` für Follow-up-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Credentials und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass das Gateway im erwarteten `auth-profiles.json` für den laufenden Agenten keine Anthropic-Credentials finden konnte.
  </Accordion>
</AccordionGroup>

---

Immer noch festgefahren? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub discussion](https://github.com/openclaw/openclaw/discussions).
