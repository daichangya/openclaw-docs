---
read_when:
    - Neuinstallation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-04-24T06:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Quickstart- und Fragen & Antworten zum ersten Start. Für den täglichen Betrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich stecke fest. Was ist der schnellste Weg, wieder weiterzukommen?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich stecke fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    Helfer aus der Ferne nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und dabei helfen, Probleme auf Maschinenebene
    zu beheben (PATH, Dienste, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code + die Dokumentation lesen und
    über die exakte Version nachdenken kann, die Sie ausführen. Sie können später jederzeit wieder auf Stable wechseln,
    indem Sie das Installationsprogramm ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung **zu planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter zu auditieren.

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

    - `openclaw status`: schneller Snapshot von Gateway-/Agent-Gesundheit + Basiskonfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Statusprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Gründe für das Überspringen?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Fensters für aktive Stunden
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere-/header-only-Gerüste
    - `no-tasks-due`: Task-Modus von `HEARTBEAT.md` ist aktiv, aber keines der Task-Intervalle ist bisher fällig
    - `alerts-disabled`: alle Sichtbarkeitsoptionen für Heartbeat sind deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Task-Modus werden Fälligkeitszeitstempel erst weitergeschoben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen wurde. Übersprungene Läufe markieren Tasks nicht als erledigt.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode, um OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Source-Code zu starten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann auch UI-Assets automatisch bauen. Nach dem Onboarding läuft das Gateway typischerweise auf Port **18789**.

    Aus dem Source-Code (Mitwirkende/Entwicklung):

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
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link außerdem in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn Shared-Secret-Authentifizierung abgefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generieren Sie ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bind auf loopback beibehalten, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist, erfüllen Identity-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, es sei denn, Sie verwenden absichtlich `none` für private Ingress oder HTTP-Authentifizierung über vertrauenswürdigen Proxy.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierungen sie protokolliert, sodass bereits der zweite schlechte Wiederholungsversuch `retry later` anzeigen kann.
    - **Tailnet-Bind**: `openclaw gateway --bind tailnet --token "<token>"` ausführen (oder Passwortauthentifizierung konfigurieren), `http://<tailscale-ip>:18789/` öffnen und dann das passende Shared Secret in die Dashboard-Einstellungen einfügen.
    - **Identitätsbewusster Reverse Proxy**: Das Gateway hinter einem Trusted Proxy ohne loopback halten, `gateway.auth.mode: "trusted-proxy"` konfigurieren und dann die Proxy-URL öffnen.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Details zu Bind-Modi und Authentifizierung.

  </Accordion>

  <Accordion title="Warum gibt es zwei Konfigurationen für Exec-Genehmigungen bei Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Genehmigungs-Client für Exec-Genehmigungen fungieren

    Die Host-Exec-Richtlinie ist weiterhin die eigentliche Genehmigungsschranke. Die Chat-Konfiguration steuert nur, wo Genehmigungs-
    aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Approver sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen Befehl `/approve` einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen in den ursprünglichen Raum/das ursprüngliche Topic zurückgeschrieben werden.
    - Plugin-Genehmigungen sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales Forwarding über `approvals.plugin`, und nur einige native Kanäle behalten zusätzlich native Behandlung von Plugin-Genehmigungen bei.

    Kurz gesagt: Forwarding dient dem Routing, die Konfiguration des nativen Clients dient einer reichhaltigeren kanalspezifischen UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – in der Dokumentation stehen **512 MB–1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicher als ausreichend für die persönliche Nutzung, und es wird erwähnt, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie etwas mehr Spielraum möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-OS und behalten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf merkwürdige Probleme mit Binärdateien stoßen, handelt es sich meist um ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei ‚wake up my friend‘ / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet beim ersten Schlüpfen auch automatisch
    „Wake up, my friend!“. Wenn Sie diese Zeile sehen und **keine Antwort**
    erfolgt und Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

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

    Wenn das Gateway remote ist, stellen Sie sicher, dass Tunnel/Tailscale-Verbindung aktiv sind und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace** und führen Sie dann Doctor einmal aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Kanal-
    Status), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Credentials, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus arbeiten, besitzt der Gateway-Host den Session Store und den Workspace.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder die Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#where-things-live-on-disk),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt mit **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Dokumentation/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns beim Entsperren, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, werden die Dokumente auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm-Dist-Tags**, keine getrennten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine Stable-Version zuerst auf **beta**, und dann verschiebt ein expliziter
    Promotion-Schritt genau diese Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können beta und stable nach einer Promotion auf **dieselbe Version** zeigen.

    Hier sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Für Einzeiler zur Installation und den Unterschied zwischen beta und dev siehe das Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-Dist-Tag `beta` (kann nach einer Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Head von `main` (git); wenn veröffentlicht, verwendet er das npm-Dist-Tag `dev`.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mehr Details: [Entwicklungskanäle](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Bits aus?">
    Zwei Optionen:

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dies wechselt zum Branch `main` und aktualisiert aus dem Source-Code.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und dann per Git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Update](/de/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installieren](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, abhängig davon, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich stecke fest](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Feedback?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Äquivalent (PowerShell):

    ```powershell
    # install.ps1 hat noch kein dediziertes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation steht git not found oder openclaw not recognized">
    Zwei häufige Probleme unter Windows:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH liegt.
    - Schließen Sie PowerShell und öffnen Sie es erneut, dann führen Sie den Installer erneut aus.

    **2) openclaw is not recognized nach der Installation**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut, nachdem Sie PATH aktualisiert haben.

    Wenn Sie das reibungsloseste Setup unter Windows möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Exec-Ausgabe unter Windows zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Das ist normalerweise ein Mismatch der Codepage der Konsole in nativen Windows-Shells.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Umgehung in PowerShell:

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

    Wenn Sie dies auf der neuesten OpenClaw-Version weiterhin reproduzieren können, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git-)Installation**, damit Sie den vollständigen Source-Code und die Doku lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie dem Linux-Leitfaden und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Leitfäden: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsleitfäden für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen davon und folgen Sie dem Leitfaden:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI darauf zu (oder per Tailscale/SSH). Ihr Status + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Source of Truth und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um
    auf lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, aber nicht empfohlen**. Der Aktualisierungsvorgang kann das
    Gateway neu starten (was die aktive Sitzung beendet), benötigt möglicherweise ein sauberes Git-Checkout und
    kann nach einer Bestätigung fragen. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie es unbedingt von einem Agenten aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Update](/de/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Einrichtung von Modell/Auth** (Provider-OAuth, API-Keys, Setup-Token für Anthropic sowie lokale Modelloptionen wie LM Studio)
    - Speicherort des **Workspace** + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd-User-Unit auf Linux/WSL2)
    - **Health Checks** und Auswahl von **Skills**

    Es warnt auch, wenn Ihr konfiguriertes Modell unbekannt ist oder Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das zu nutzen?">
    Nein. Sie können OpenClaw mit **API-Keys** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, sich bei diesen Providern zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic API-Key**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Authentifizierung in OpenClaw**: Mitarbeitende von Anthropic
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als zulässig, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts bleiben Anthropic-API-Keys dennoch das
    vorhersehbarere Setup. OpenAI Codex OAuth wird explizit für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete abonnementartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich Claude Max ohne API-Key verwenden?">
    Ja.

    Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher
    behandelt OpenClaw die Authentifizierung per Claude-Abonnement und die Nutzung von `claude -p` als zulässig
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    das vorhersehbarste serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic-API-Key.

  </Accordion>

  <Accordion title="Unterstützt ihr Authentifizierung per Claude-Abonnement (Claude Pro oder Max)?">
    Ja.

    Mitarbeitende von Anthropic haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als zulässig für diese Integration,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic setup-token bleibt weiterhin als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads bleibt Authentifizierung per Anthropic-API-Key die
    sicherere, besser vorhersehbare Wahl. Wenn Sie andere abonnementartige gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Rate Limit** für das aktuelle Fenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Fenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
    einen **Anthropic API-Key** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits nach Bedarf.

    Wenn die Meldung speziell lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropic's 1M-Context-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Setzen Sie ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Models](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten Provider **Amazon Bedrock (Converse)**. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Bedrock-Katalog für Streaming/Text automatisch erkennen und ihn als impliziten Provider `amazon-bedrock` zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Providereintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Model providers](/de/providers/models). Wenn Sie einen verwalteten Key-Flow bevorzugen, bleibt ein OpenAI-kompatibler Proxy vor Bedrock eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai-codex/gpt-5.5` für Codex OAuth über den Standard-PI-Runner. Verwenden Sie
    `openai/gpt-5.4` für den aktuellen direkten OpenAI-API-Key-Zugriff. Direkter
    API-Key-Zugriff auf GPT-5.5 wird unterstützt, sobald OpenAI ihn auf der öffentlichen API aktiviert; derzeit
    verwendet GPT-5.5 Abonnement/OAuth über `openai-codex/gpt-5.5` oder native Codex-
    App-Server-Läufe mit `openai/gpt-5.5` und `embeddedHarness.runtime: "codex"`.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw noch immer openai-codex?">
    `openai-codex` ist die Provider- und Auth-Profile-ID für ChatGPT/Codex OAuth.
    Es ist auch das explizite PI-Modellpräfix für Codex OAuth:

    - `openai/gpt-5.4` = aktueller direkter OpenAI-API-Key-Pfad in PI
    - `openai/gpt-5.5` = zukünftiger direkter API-Key-Pfad, sobald OpenAI GPT-5.5 auf der API aktiviert
    - `openai-codex/gpt-5.5` = Codex-OAuth-Pfad in PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = nativer Codex-App-Server-Pfad
    - `openai-codex:...` = Auth-Profile-ID, keine Modellreferenz

    Wenn Sie den direkten Abrechnungs-/Limitpfad von OpenAI Platform möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie Authentifizierung per ChatGPT/Codex-Abonnement möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an und verwenden Sie
    Modellreferenzen `openai-codex/*` für PI-Läufe.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    Codex OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der Erfahrung auf der ChatGPT-Website/-App unterscheiden, selbst wenn
    beide an dasselbe Konto gebunden sind.

    OpenClaw kann die aktuell sichtbaren Fenster für Providernutzung/Kontingente in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine Berechtigungen aus ChatGPT-Web
    in direkten API-Zugriff. Wenn Sie den direkten Abrechnungs-/Limitpfad von OpenAI Platform möchten,
    verwenden Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt vollständig **OpenAI Code (Codex) subscription OAuth**.
    OpenAI erlaubt ausdrücklich die Nutzung von subscription OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Flow für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` in `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmeldung: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten schneiden ab und leaken. Wenn Sie unbedingt möchten, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko von Prompt Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich gehosteten Modellverkehr in einer bestimmten Region?">
    Wählen Sie regionengebundene Endpunkte. OpenRouter bietet US-gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben und gleichzeitig der gewählte regionalisierte Provider eingehalten wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – einige Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Home-Server oder eine Box in Raspberry-Pi-Klasse funktioniert.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere nur auf macOS verfügbare Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich für iMessage-Unterstützung einen Mac mini?">
    Sie brauchen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein Mac mini** sein –
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Gateway auf Linux/VPS ausführen und den BlueBubbles-Server auf einem beliebigen Mac betreiben, der bei Messages angemeldet ist.
    - Alles auf dem Mac ausführen, wenn Sie das einfachste Single-Machine-Setup möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus – sie stellen zusätzliche
    Fähigkeiten bereit wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - Das MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Runtime-Bugs, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie dies auf einem nicht produktiven Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist die **Telegram-Benutzer-ID** des menschlichen Absenders (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits ältere Einträge `@username` in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie eine DM an `@userinfobot` oder `@getidsbot`.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen nutzen?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender im E.164-Format wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Session Store erhält. Antworten kommen weiterhin vom **selben WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast Chat“-Agenten und einen „Opus for coding“-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Providerkonto oder bestimmte Peers) an jeden Agenten. Eine Beispielkonfiguration finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelles Setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass PATH des Dienstes `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Aktuelle Builds stellen unter Linux-systemd-Diensten außerdem gängige Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm install">
    - **Hackbare (git-)Installation:** vollständiger Source-Checkout, editierbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen über npm-Dist-Tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Dienst auf den neuen Entry Point zeigt.
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

    Doctor erkennt einen Mismatch beim Entry Point des Gateway-Dienstes und bietet an, die Dienstkonfiguration so umzuschreiben, dass sie zur aktuellen Installation passt (`--repair` in Automatisierung verwenden).

    Tipps für Backups: siehe [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurzantwort: **Wenn Sie Zuverlässigkeit rund um die Uhr möchten, verwenden Sie einen VPS**. Wenn Sie möglichst wenig Reibung wollen und Schlafmodus/Neustarts okay sind, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, Live-Browserfenster.
    - **Nachteile:** Schlafmodus/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, Gerät muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Probleme durch Laptop-Schlafmodus, einfacher dauerhaft zu betreiben.
    - **Nachteile:** oft headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Updates müssen per SSH durchgeführt werden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren auf einem VPS alle problemlos. Der einzige echte Trade-off ist **headless browser** versus ein sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Voreinstellung:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit einem sichtbaren Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **empfohlen für Zuverlässigkeit und Isolation**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Schlafmodus/Neustarts, sauberere Berechtigungen, einfacher dauerhaft zu betreiben.
    - **Geteilter Laptop/Desktop:** völlig okay zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner schläft oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie das Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitsrichtlinien lesen Sie [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches OS wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein einfaches Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicher.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr für Spielraum (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Als OS verwenden Sie **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar und mit genug
    RAM für das Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Richtwerte:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medientools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 das einfachste Setup im Stil einer VM** und hat die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit und mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
