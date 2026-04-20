---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von von Nutzern gemeldeten Problemen vor einer tieferen Fehleranalyse
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-20T06:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bdb17fc4d8c61a36f3a9fc3ca4a20f723cfa6c9bbbc92f963d6e313181f3451
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefgehende Prüfungen**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gesundheitsprüfung des Gateways aus, einschließlich Channel-Prüfungen, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Gesundheit](/de/gateway/health).

5. **Dem neuesten Log folgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind von Service-Logs getrennt; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Gesundheitsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Schnappschuss**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Schnappschuss (nur WS). Siehe [Gesundheit](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

<AccordionGroup>
  <Accordion title="Ich hänge fest, was ist der schnellste Weg, wieder weiterzukommen?">
    Verwende einen lokalen KI-Agenten, der **deinen Rechner sehen** kann. Das ist deutlich effektiver als in Discord zu fragen,
    weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, deine Einrichtung auf Rechner-Ebene
    (PATH, Services, Berechtigungen, Auth-Dateien) zu reparieren. Gib ihnen den **vollständigen Quellcode-Checkout** über
    die hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code + die Dokumentation lesen und
    über die genaue Version nachdenken kann, die du verwendest. Du kannst später jederzeit wieder auf die stabile Version wechseln,
    indem du das Installationsprogramm ohne `--install-method git` erneut ausführst.

    Tipp: Bitte den Agenten, die Reparatur **zu planen und zu überwachen** (Schritt für Schritt), und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter zu prüfen.

    Wenn du einen echten Fehler oder Fix entdeckst, erstelle bitte ein GitHub-Issue oder sende einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginne mit diesen Befehlen (teile die Ausgaben, wenn du um Hilfe bittest):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Schnappschuss von Gateway-/Agent-Gesundheit + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Probleme mit Konfiguration/Zustand.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Gründe für das Überspringen?">
    Häufige Gründe dafür, dass Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten active-hours-Zeitfensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres/header-only Grundgerüst
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber keines der Aufgabenintervalle ist schon fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach einem echten Heartbeat-Durchlauf
    vorgerückt. Übersprungene Durchläufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zum Installieren und Einrichten von OpenClaw">
    Das Repo empfiehlt, aus dem Quellcode zu starten und das Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding betreibst du das Gateway normalerweise auf Port **18789**.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Wenn du noch keine globale Installation hast, führe es über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding deinen Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lass diesen Tab geöffnet; wenn er nicht gestartet wurde, kopiere die ausgegebene URL auf demselben Rechner in den Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffne `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, füge das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generiere ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bind auf loopback lassen, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, es sei denn, du verwendest bewusst private-ingress `none` oder trusted-proxy-HTTP-Authentifizierung.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, daher kann der zweite schlechte Wiederholungsversuch bereits `retry later` anzeigen.
    - **Tailnet-Bind**: Führe `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfiguriere Passwort-Authentifizierung), öffne `http://<tailscale-ip>:18789/` und füge dann das passende Shared Secret in die Dashboard-Einstellungen ein.
    - **Identity-aware Reverse Proxy**: Halte das Gateway hinter einem trusted proxy ohne loopback, konfiguriere `gateway.auth.mode: "trusted-proxy"` und öffne dann die Proxy-URL.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; füge bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web-Oberflächen](/web) für Details zu Bind-Modi und Authentifizierung.

  </Accordion>

  <Accordion title="Warum gibt es zwei exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Channel als nativen Genehmigungsclient für exec-Genehmigungen fungieren

    Die Exec-Policy des Hosts ist weiterhin das eigentliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wo Genehmigungs-
    aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigst du **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native-Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis besagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwende `approvals.exec` nur dann, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwende `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn du ausdrücklich möchtest, dass Genehmigungsaufforderungen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Genehmigungen sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Weiterleiten, und nur einige native Channels behalten zusätzlich native Behandlung von Plugin-Genehmigungen bei.

    Kurz gesagt: Weiterleitung ist für das Routing, die Konfiguration des nativen Clients ist für eine umfassendere channelspezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – in der Dokumentation werden **512 MB bis 1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung genannt, und es wird darauf hingewiesen, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn du etwas mehr Spielraum möchtest (Logs, Medien, andere Services), werden **2 GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und du kannst **Nodes** auf deinem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechne mit Ecken und Kanten.

    - Verwende ein **64-Bit**-Betriebssystem und halte Node auf >= 22.
    - Bevorzuge die **hackbare (git-)Installation**, damit du Logs sehen und schnell aktualisieren kannst.
    - Starte ohne Channels/Skills und füge sie dann einzeln hinzu.
    - Wenn du auf seltsame Binärprobleme stößt, ist das meist ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei 'wake up my friend' / das Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    „Wake up, my friend!“ beim ersten Schlüpfen automatisch. Wenn du diese Zeile mit **keiner Antwort**
    siehst und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starte das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfe Status + Authentifizierung:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es immer noch hängt, führe aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stelle sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding erneut durchzuführen?">
    Ja. Kopiere das **Zustandsverzeichnis** und den **Workspace**, und führe dann Doctor einmal aus. Dadurch
    bleibt dein Bot „genau gleich“ (Speicher, Sitzungsverlauf, Authentifizierung und Channel-
    Zustand), solange du **beide** Speicherorte kopierst:

    1. Installiere OpenClaw auf dem neuen Rechner.
    2. Kopiere `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopiere deinen Workspace (Standard: `~/.openclaw/workspace`).
    4. Führe `openclaw doctor` aus und starte den Gateway-Service neu.

    Das bewahrt Konfiguration, Auth-Profile, WhatsApp-Zugangsdaten, Sitzungen und Speicher. Wenn du im
    Remote-Modus bist, gehört der Sitzungsspeicher und Workspace dem Gateway-Host.

    **Wichtig:** Wenn du nur deinen Workspace in GitHub committest/pushst, sicherst du
    **Speicher + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#wo-dinge-auf-der-festplatte-liegen),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Schau in das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt mit **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Die Einträge sind nach **Highlights**, **Änderungen** und
    **Fehlerbehebungen** gruppiert (plus Doku-/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Ich kann docs.openclaw.ai nicht aufrufen (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktiviere es oder setze `docs.openclaw.ai` auf die Allowlist und versuche es dann erneut.
    Bitte hilf uns, die Sperre aufzuheben, indem du es hier meldest: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn du die Seite immer noch nicht erreichen kannst, ist die Dokumentation auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm-dist-tags**, keine getrennten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine stabile Veröffentlichung zuerst auf **beta**, danach verschiebt ein expliziter
    Promotionsschritt genau diese Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der
    Promotion auf **dieselbe Version** zeigen.

    Sieh dir an, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Einzeilige Installationsbefehle und den Unterschied zwischen beta und dev findest du im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Kopf von `main` (git); wenn veröffentlicht, verwendet es das npm-dist-tag `dev`.

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
    Zwei Möglichkeiten:

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechselst du auf den Branch `main` und aktualisierst aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Seite):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhältst du ein lokales Repo, das du bearbeiten und dann über git aktualisieren kannst.

    Wenn du lieber manuell einen sauberen Clone erstellen möchtest, verwende:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Update](/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installation](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Ungefähre Orientierung:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, je nachdem, wie viele Channels/Modelle du konfigurierst

    Wenn es hängen bleibt, verwende [Installer hängt?](#schnellstart-und-einrichtung-beim-ersten-start)
    und die schnelle Debug-Schleife in [Ich hänge fest](#schnellstart-und-einrichtung-beim-ersten-start).

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

    Für eine hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Entsprechung (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation steht git not found oder openclaw not recognized">
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

    - Füge dieses Verzeichnis zu deinem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließe PowerShell nach dem Aktualisieren von PATH und öffne sie erneut.

    Wenn du das reibungsloseste Windows-Setup möchtest, verwende **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Das ist normalerweise ein Mismatch der Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - `system.run`/`exec`-Ausgabe stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Behelfslösung in PowerShell:

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

    Wenn du das in der neuesten Version von OpenClaw weiterhin reproduzieren kannst, verfolge/melde es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwende die **hackbare (git-)Installation**, damit du den vollständigen Quellcode und die Dokumentation lokal hast, und frage dann
    deinen Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installation](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folge der Linux-Anleitung und führe dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installiere es auf dem Server und verwende dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir haben einen **Hosting-Hub** mit den gängigen Anbietern. Wähle einen aus und folge der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und du greifst
    von deinem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Dein Zustand + Workspace
    liegen auf dem Server, also betrachte den Host als Quelle der Wahrheit und sichere ihn entsprechend.

    Du kannst **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf deinem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, aber nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung verloren geht), möglicherweise einen sauberen Git-Checkout benötigen und
    eine Bestätigung anfordern. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

    Verwende die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn du es unbedingt von einem Agenten automatisieren musst:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Update](/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es dich durch:

    - **Modell-/Authentifizierungseinrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Channel-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd-Benutzereinheit auf Linux/WSL2)
    - **Gesundheitsprüfungen** und Auswahl von **Skills**

    Es warnt außerdem, wenn dein konfiguriertes Modell unbekannt ist oder die Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Du kannst OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **nur lokalen Modellen** ausführen, sodass deine Daten auf deinem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw sieht die praktische Aufteilung so aus:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Authentifizierung in OpenClaw**: Mitarbeitende von Anthropic
      haben uns gesagt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als zulässig, solange Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    vorhersehbarere Einrichtung. OpenAI-Codex-OAuth wird für externe
    Tools wie OpenClaw ausdrücklich unterstützt.

    OpenClaw unterstützt auch andere gehostete abonnementähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Mitarbeitende von Anthropic haben uns gesagt, dass die OpenClaw-artige Nutzung von Claude CLI wieder erlaubt ist, daher
    behandelt OpenClaw die Claude-Abonnement-Authentifizierung und die Nutzung von `claude -p` als zulässig
    für diese Integration, solange Anthropic keine neue Richtlinie veröffentlicht. Wenn du die
    vorhersehbarste serverseitige Einrichtung möchtest, verwende stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abonnement-Authentifizierung (Claude Pro oder Max)?">
    Ja.

    Mitarbeitende von Anthropic haben uns gesagt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als zulässig für diese Integration,
    solange Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads ist die Authentifizierung mit einem Anthropic-API-Schlüssel weiterhin die
    sicherere, besser vorhersagbare Wahl. Wenn du andere gehostete abonnementähnliche
    Optionen in OpenClaw möchtest, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass dein **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn du
**Claude CLI** verwendest, warte, bis das Zeitfenster zurückgesetzt wird, oder upgrade deinen Plan. Wenn du
einen **Anthropic-API-Schlüssel** verwendest, prüfe die Anthropic Console
auf Nutzung/Abrechnung und erhöhe die Limits bei Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Kontext-Beta von Anthropic zu verwenden (`context1m: true`). Das funktioniert nur, wenn deine
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Setze ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider ratenlimitiert ist.
    Siehe [Models](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Bedrock-Streaming-/Text-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls kannst du `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn du einen verwalteten Schlüsselablauf bevorzugst, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt das Standardmodell bei Bedarf auf `openai-codex/gpt-5.4`. Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum schaltet ChatGPT GPT-5.4 `openai/gpt-5.4` in OpenClaw nicht frei?">
    OpenClaw behandelt die beiden Wege getrennt:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex-OAuth
    - `openai/gpt-5.4` = direkte OpenAI-Platform-API

    In OpenClaw ist die ChatGPT/Codex-Anmeldung mit dem Pfad `openai-codex/*` verknüpft,
    nicht mit dem direkten Pfad `openai/*`. Wenn du den direkten API-Pfad in
    OpenClaw möchtest, setze `OPENAI_API_KEY` (oder die entsprechende Konfiguration des OpenAI-Providers).
    Wenn du die ChatGPT/Codex-Anmeldung in OpenClaw möchtest, verwende `openai-codex/*`.

  </Accordion>

  <Accordion title="Warum können sich die Codex-OAuth-Limits von ChatGPT im Web unterscheiden?">
    `openai-codex/*` verwendet den Codex-OAuth-Pfad, und seine nutzbaren Kontingentfenster werden
    von OpenAI verwaltet und hängen vom Plan ab. In der Praxis können sich diese Limits von
    der Erfahrung auf der ChatGPT-Website/-App unterscheiden, auch wenn beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Nutzungs-/Kontingentfenster des Providers in
    `openclaw models status` anzeigen, aber es erfindet oder normalisiert keine Berechtigungen aus ChatGPT-Web
    in direkten API-Zugriff um. Wenn du den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchtest, verwende `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Abonnement-OAuth** vollständig.
    OpenAI erlaubt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Ablauf für dich ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installiere Gemini CLI lokal, sodass `gemini` im `PATH` ist
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktiviere das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setze `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Normalerweise nein. OpenClaw braucht großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn es unbedingt sein muss, führe lokal den **größten** Modell-Build aus, den du kannst (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko für Prompt-Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich den Traffic gehosteter Modelle in einer bestimmten Region?">
    Wähle an die Region gebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wähle die in den USA gehostete Variante, um Daten in der Region zu halten. Du kannst Anthropic/OpenAI weiterhin daneben auflisten, indem du `models.mode: "merge"` verwendest, sodass Fallbacks verfügbar bleiben und gleichzeitig der von dir ausgewählte regionale Provider beachtet wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Heimserver oder eine Box in Raspberry-Pi-Klasse funktioniert.

    Du brauchst nur für **nur-macOS-Tools** einen Mac. Für iMessage verwende [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn du andere nur-macOS-Tools möchtest, führe das Gateway auf einem Mac aus oder kopple einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Du brauchst **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein –
    jeder Mac funktioniert. **Verwende [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Führe das Gateway auf Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Führe alles auf dem Mac aus, wenn du das einfachste Setup auf einem einzigen Rechner möchtest.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und dein MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen nicht das Gateway aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwende `openclaw nodes status` / `openclaw nodes list`, um es zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwende **Node** für stabile Gateways.

    Wenn du trotzdem mit Bun experimentieren möchtest, dann auf einem Nicht-Produktiv-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn du bereits veraltete `@username`-Einträge in der Konfiguration hast, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (ohne Drittanbieter-Bot):

    - Schreibe deinem Bot per DM, führe dann `openclaw logs --follow` aus und lies `from.id`.

    Offizielle Bot API:

    - Schreibe deinem Bot per DM und rufe dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lies `message.from.id`.

    Drittanbieter (weniger privat):

    - Schreibe `@userinfobot` oder `@getidsbot` per DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binde die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffssteuerung (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "Fast-Chat"-Agenten und einen "Opus für Coding"-Agenten betreiben?'>
    Ja. Verwende Multi-Agent-Routing: Gib jedem Agenten sein eigenes Standardmodell und binde dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Beispielkonfiguration findest du unter [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew auf Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn du OpenClaw über systemd ausführst, stelle sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder dein brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen außerdem gängige Benutzer-Bin-Verzeichnisse Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und npm install">
    - **Hackbare (git-)Installation:** vollständiger Quellcode-Checkout, editierbar, am besten für Mitwirkende.
      Du führst Builds lokal aus und kannst Code/Dokumentation patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach nur ausführen“.
      Updates kommen über npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installiere die andere Variante und führe dann Doctor aus, damit der Gateway-Service auf den neuen Einstiegspunkt zeigt.
    Dadurch werden deine Daten **nicht gelöscht** – es ändert nur die OpenClaw-Codeinstallation. Dein Zustand
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

    Doctor erkennt einen Mismatch beim Gateway-Service-Einstiegspunkt und bietet an, die Service-Konfiguration so umzuschreiben, dass sie zur aktuellen Installation passt (verwende `--repair` in der Automatisierung).

    Backup-Tipps: siehe [Backup-Strategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS betreiben?">
    Kurz gesagt: **Wenn du 24/7-Zuverlässigkeit möchtest, nimm einen VPS**. Wenn du die
    geringste Reibung möchtest und mit Ruhezustand/Neustarts leben kannst, betreibe es lokal.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer aktiv, stabiles Netzwerk, keine Laptop-Ruhezustandsprobleme, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** läuft oft headless (verwende Screenshots), nur entfernter Dateizugriff, du musst dich für Updates per SSH verbinden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos auf einem VPS. Der einzige echte Trade-off ist **headless browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardwahl:** VPS, wenn du zuvor Gateway-Verbindungsabbrüche hattest. Lokal ist großartig, wenn du den Mac aktiv nutzt und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchtest.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** immer aktiv, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, leichter dauerhaft am Laufen zu halten.
    - **Geteilter Laptop/Desktop:** völlig in Ordnung zum Testen und für aktive Nutzung, aber rechne mit Pausen, wenn der Rechner in den Ruhezustand geht oder Updates installiert.

    Wenn du das Beste aus beiden Welten willst, halte das Gateway auf einem dedizierten Host und kopple deinen Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitshinweise lies [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Channel:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr für Spielraum (Logs, Medien, mehrere Channels). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwende **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandle eine VM wie einen VPS: Sie muss immer aktiv, erreichbar und mit genug
    RAM für das Gateway und alle aktivierten Channels ausgestattet sein.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn du mehrere Channels, Browser-Automatisierung oder Medien-Tools ausführst.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn du Windows verwendest, ist **WSL2 das einfachste VM-ähnliche Setup** und hat die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn du macOS in einer VM ausführst, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den du auf deinen eigenen Geräten ausführst. Er antwortet auf den Messaging-Oberflächen, die du bereits verwendest (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen außerdem Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die Always-on-Kontrollebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **lokal-zuerst Kontrollebene**, mit der du einen
    leistungsfähigen Assistenten auf **deiner eigenen Hardware** ausführen kannst, erreichbar über die Chat-Apps, die du bereits nutzt, mit
    zustandsbehafteten Sitzungen, Speicher und Tools – ohne die Kontrolle über deine Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Deine Geräte, deine Daten:** Führe das Gateway aus, wo immer du willst (Mac, Linux, VPS) und halte den
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwende Anthropic, OpenAI, MiniMax, OpenRouter usw. mit agent-spezifischem Routing
      und Failover.
    - **Nur-lokal-Option:** Führe lokale Modelle aus, sodass **alle Daten auf deinem Gerät bleiben können**, wenn du möchtest.
    - **Multi-Agent-Routing:** getrennte Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und hackbar:** prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Dokumentation: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App prototypen (Umriss, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, aber es funktioniert am besten, wenn du sie in Phasen aufteilst und
    Sub-Agents für parallele Arbeit verwendest.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meistens so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die dir wichtig sind.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** durch Cron oder Heartbeat gesteuerte Stupser und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Web-Aufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Sende eine Aufgabe von deinem Telefon, lass das Gateway sie auf einem Server ausführen und erhalte das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    potenzielle Kundschaft zusammenfassen und Outreach- oder Anzeigen-Texte entwerfen.

    Für **Outreach oder Anzeigenkampagnen** sollte ein Mensch in der Schleife bleiben. Vermeide Spam, halte lokale Gesetze und
    Plattformrichtlinien ein und prüfe alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw entwerfen zu lassen und du genehmigst.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwende
    Claude Code oder Codex für die schnellste direkte Coding-Schleife innerhalb eines Repos. Verwende OpenClaw, wenn du
    dauerhaften Speicher, geräteübergreifenden Zugriff und Tool-Orchestrierung möchtest.

    Vorteile:

    - **Persistenter Speicher + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo dauerhaft verändert zu halten?">
    Verwende verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Lege deine Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder füge über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin vor gebündelten Skills gewinnen, ohne git anzufassen. Wenn der Skill global installiert sein soll, aber nur für einige Agents sichtbar, halte die gemeinsame Kopie in `~/.openclaw/skills` und steuere die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die sich für Upstream eignen, sollten im Repo leben und als PRs herausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Füge zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombiniere das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich für verschiedene Aufgaben unterschiedliche Modelle verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agents**: leite Aufgaben an getrennte Agents mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: Verwende `/model`, um das Modell der aktuellen Sitzung jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwende **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten deinen Hauptchat reaktionsfähig.

    Bitte deinen Bot, „für diese Aufgabe einen Sub-Agent zu starten“, oder verwende `/subagents`.
    Verwende `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, setze ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model`.

    Dokumentation: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren thread-gebundene Subagent-Sitzungen auf Discord?">
    Verwende Thread-Bindings. Du kannst einen Discord-Thread an einen Sub-Agenten oder ein Sitzungsziel binden, sodass Folge-Nachrichten in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starte mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Folgeaktionen).
    - Oder binde manuell mit `/focus <target>`.
    - Verwende `/agents`, um den Binding-Status zu prüfen.
    - Verwende `/session idle <duration|off>` und `/session max-age <duration|off>`, um automatisches Entfokussieren zu steuern.
    - Verwende `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: setze `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentation: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent ist fertig geworden, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfe zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung von Sub-Agenten im Abschlussmodus bevorzugt jede gebundene Thread- oder Konversationsroute, wenn eine existiert.
    - Wenn der Abschlussursprung nur einen Channel enthält, greift OpenClaw auf die gespeicherte Route der Anforderer-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin funktionieren kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt stattdessen auf zugestellte Sitzungs-Queue-Zustellung zurück, anstatt sofort im Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Queue-Fallback oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs genau das stille Token `NO_REPLY` / `no_reply` oder genau `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, anstatt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach nur Tool-Aufrufen ein Timeout hatte, kann die Ankündigung das in eine kurze Zusammenfassung des Teilfortschritts verdichten, anstatt rohe Tool-Ausgabe erneut abzuspielen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätige, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfe, dass das Gateway 24/7 läuft (kein Ruhezustand/keine Neustarts).
    - Verifiziere die Zeitzoneneinstellungen für den Job (`--tz` im Vergleich zur Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Channel gesendet. Warum?">
    Prüfe zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, die Zugangsdaten dies aber blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die zugestellte Fallback-Zustellung.

    Bei isolierten Cron-Jobs ist der Runner für die endgültige Zustellung verantwortlich. Vom Agenten wird erwartet,
    dass er eine Klartextzusammenfassung zurückgibt, die der Runner senden kann. `--no-deliver` hält
    dieses Ergebnis intern; es erlaubt dem Agenten stattdessen nicht, direkt mit dem
    Message-Tool zu senden.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, keine doppelte Planung.

    Isolierter Cron kann eine Laufzeit-Weitergabe des Modells beibehalten und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und wenn der Wechsel ein neues Auth-Profil-Override mitbrachte, behält Cron
    auch dieses vor dem erneuten Versuch bei.

    Zugehörige Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn anwendbar.
    - Dann job-spezifisches `model`.
    - Dann ein gespeichertes Modell-Override der Cron-Sitzung.
    - Dann die normale Auswahl des Agent-/Standardmodells.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos zu schleifen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwende native `openclaw skills`-Befehle oder lege Skills in deinen Workspace ab. Die macOS-Skills-UI ist unter Linux nicht verfügbar.
    Durchsuche Skills unter [https://clawhub.ai](https://clawhub.ai).

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
    Verzeichnis des aktiven Workspace. Installiere die separate `clawhub`-CLI nur, wenn du deine eigenen Skills veröffentlichen oder
    synchronisieren möchtest. Für gemeinsame Installationen über Agents hinweg lege den Skill unter
    `~/.openclaw/skills` ab und verwende `agents.defaults.skills` oder
    `agents.list[].skills`, wenn du einschränken möchtest, welche Agents ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwende den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien gesteuert, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden nur-`darwin`-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, du überschreibst diese Steuerung.

    Du hast drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führe das Gateway dort aus, wo die macOS-Binärdateien existieren, und verbinde dich dann von Linux aus im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (ohne SSH).**
    Führe das Gateway unter Linux aus, kopple einen macOS-Node (Menüleisten-App), und setze **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann nur-macOS-Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node existieren. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn du „Always Ask“ wählst, fügt das Bestätigen von „Always Allow“ in der Eingabeaufforderung diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxien (fortgeschritten).**
    Lasse das Gateway unter Linux laufen, aber sorge dafür, dass die erforderlichen CLI-Binärdateien auf SSH-Wrapper aufgelöst werden, die auf einem Mac ausgeführt werden. Überschreibe dann den Skill so, dass Linux erlaubt wird, damit er zulässig bleibt.

    1. Erstelle einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Platziere den Wrapper auf dem `PATH` des Linux-Hosts (zum Beispiel `~/bin/memo`).
    3. Überschreibe die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI auf macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starte eine neue Sitzung, damit der Skill-Schnappschuss aktualisiert wird.

  </Accordion>

  <Accordion title="Habt ihr eine Notion- oder HeyGen-Integration?">
    Heute nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn du den Kontext pro Kunde behalten möchtest (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitte den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn du eine native Integration möchtest, eröffne einen Feature-Request oder baue einen Skill,
    der auf diese APIs abzielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über Agents hinweg lege sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfiguriere `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert werden; unter Linux bedeutet das Linuxbrew (siehe den FAQ-Eintrag zu Homebrew unter Linux oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwende das eingebaute Browser-Profil `user`, das sich über Chrome DevTools MCP verbindet:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn du einen benutzerdefinierten Namen möchtest, erstelle ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den Browser des lokalen Hosts oder einen verbundenen Browser-Node verwenden. Wenn das Gateway woanders läuft, führe entweder einen Node-Host auf dem Browser-Rechner aus oder verwende stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-gesteuert, nicht CSS-Selektor-gesteuert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Dokumentation zu Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an – wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist auf Sicherheit zuerst ausgelegt und läuft als Benutzer `node`, daher
    enthält es keine Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistiere `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Baue Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installiere Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setze `PLAYWRIGHT_BROWSERS_PATH` und stelle sicher, dass der Pfad persistent ist.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen öffentlich/gesandboxed mit einem Agenten machen?">
    Ja – wenn dein privater Traffic **DMs** sind und dein öffentlicher Traffic **Gruppen**.

    Verwende `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Channel-Sitzungen (Nicht-Hauptschlüssel) in Docker laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Schränke dann mit `tools.sandbox.tools` ein, welche Tools in gesandboxten Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setze `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + agent-spezifische Bindings werden zusammengeführt; agent-spezifische Bindings werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwende `:ro` für alles Sensible und denke daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Escapes über Symlink-Elternteile weiterhin fail-closed fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und dass Allowed-Root-Prüfungen auch nach der Symlink-Auflösung weiter gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool Policy vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Speicher?">
    OpenClaw-Speicher sind einfach Markdown-Dateien im Agent-Workspace:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem vor der Compaction einen **stillen Speicher-Flush** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Das läuft nur, wenn der Workspace
    schreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst ständig Dinge. Wie sorge ich dafür, dass es bleibt?">
    Bitte den Bot, **die Information in den Speicher zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin Dinge vergisst, prüfe, ob das Gateway bei jedem Lauf denselben
    Workspace verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Speicher für immer erhalten? Was sind die Grenzen?">
    Speicherdateien liegen auf der Festplatte und bleiben bestehen, bis du sie löschst. Die Grenze ist dein
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Unterhaltungen kompaktifiziert oder abgeschnitten werden. Deshalb
    gibt es die Speichersuche – sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Erfordert semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn du **OpenAI-Embeddings** verwendest. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder die
    Codex-CLI-Anmeldung)** nicht bei der semantischen Speichersuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn du keinen Provider explizit setzt, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst werden kann, sonst Gemini, wenn ein Gemini-Schlüssel
    aufgelöst werden kann, dann Voyage, dann Mistral. Wenn kein entfernter Schlüssel verfügbar ist, bleibt die Speichersuche
    deaktiviert, bis du sie konfigurierst. Wenn du einen lokalen Modellpfad
    konfiguriert hast und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn du explizit
    `memorySearch.provider = "ollama"` setzt.

    Wenn du lieber lokal bleiben möchtest, setze `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn du Gemini-Embeddings möchtest, setze
    `memorySearch.provider = "gemini"` und gib `GEMINI_API_KEY` an (oder
    `memorySearch.remote.apiKey`). Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder local** – siehe [Speicher](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein – **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was du an sie sendest**.

    - **Standardmäßig lokal:** Sitzungen, Speicherdateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + dein Workspace-Verzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die du an Modell-Provider (Anthropic/OpenAI/etc.) sendest, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Du kontrollierst den Umfang:** Durch die Verwendung lokaler Modelle bleiben Prompts auf deinem Rechner, aber Channel-
      Traffic läuft weiterhin über die Server des jeweiligen Channels.

    Verwandt: [Agent-Workspace](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Path                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Veralteter OAuth-Import (wird bei der ersten Nutzung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optionale `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateibasierte Secret-Nutzlast für `file` SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Veraltete Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent-spezifischer Zustand (agentDir + Sitzungen)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Unterhaltungsverlauf & Zustand (pro Agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Veralteter Einzel-Agent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Dein **Workspace** (`AGENTS.md`, Speicherdateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder der veraltete Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State-Dir (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sitzungen, Logs,
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, stelle sicher, dass das Gateway bei jedem Start denselben
    Workspace verwendet (und denke daran: Der Remote-Modus verwendet den Workspace des **Gateway-Hosts**,
    nicht den deines lokalen Laptops).

    Tipp: Wenn du ein dauerhaftes Verhalten oder eine Präferenz möchtest, bitte den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent-Workspace](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Lege deinen **Agent-Workspace** in ein **privates** Git-Repo und sichere ihn an einem
    privaten Ort (zum Beispiel GitHub privat). Das erfasst Speicher + AGENTS-/SOUL-/USER-
    Dateien und ermöglicht es dir, den „Geist“ des Assistenten später wiederherzustellen.

    Committe **nichts** unter `~/.openclaw` (`credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Nutzlasten).
    Wenn du eine vollständige Wiederherstellung brauchst, sichere sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die dedizierte Anleitung: [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agents außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-CWD** und der Speicheranker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn du Isolation benötigst, verwende
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agent-spezifische Sandbox-Einstellungen. Wenn du
    möchtest, dass ein Repo das Standard-Arbeitsverzeichnis ist, setze `workspace`
    dieses Agenten auf das Repo-Root. Das OpenClaw-Repo ist nur Quellcode; halte den
    Workspace getrennt, es sei denn, du möchtest ausdrücklich, dass der Agent darin arbeitet.

    Beispiel (Repo als Standard-CWD):

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn du im Remote-Modus bist, ist der Sitzungsspeicher, der dich interessiert, auf dem entfernten Rechner, nicht auf deinem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo liegt sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, werden relativ sichere Standardwerte verwendet (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe `gateway.bind: "lan"` (oder `"tailnet"`) gesetzt und jetzt lauscht nichts / die UI sagt unauthorized'>
    Nicht-loopback-Bindings **erfordern einen gültigen Gateway-Authentifizierungspfad**. In der Praxis bedeutet das:

    - Shared-Secret-Authentifizierung: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten nicht-loopback identity-aware reverse proxy

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
    - Für Passwort-Authentifizierung setze stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (keine Maskierung durch Remote-Fallback).
    - Shared-Secret-Control-UI-Setups authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätsbasierte Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeide es, Shared Secrets in URLs abzulegen.
    - Bei `gateway.auth.mode: "trusted-proxy"` erfüllen gleichhostige loopback-Reverse-Proxys trotzdem **nicht** die trusted-proxy-Authentifizierung. Der trusted proxy muss eine konfigurierte Quelle ohne loopback sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt auf localhost ein Token?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Authentifizierungspfad konfiguriert ist, wird beim Gateway-Start der Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird, sodass **lokale WS-Clients sich authentifizieren müssen**. Das blockiert andere lokale Prozesse daran, das Gateway aufzurufen.

    Wenn du einen anderen Authentifizierungspfad bevorzugst, kannst du explizit den Passwortmodus wählen (oder bei identity-aware reverse proxies ohne loopback `trusted-proxy`). Wenn du **wirklich** offenes loopback möchtest, setze `gateway.auth.mode: "none"` explizit in deiner Konfiguration. Doctor kann jederzeit ein Token für dich generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen direkt anwenden, für kritische Änderungen neu starten
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

    - `off`: blendet den Slogantext aus, behält aber die Titel-/Versionszeile des Banners bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Slogans (Standardverhalten).
    - Wenn du gar kein Banner möchtest, setze die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Abruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von deinem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search ist schlüsselfrei, verwendet aber deinen konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/selbst gehostet; konfiguriere `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führe `openclaw configure --section web` aus und wähle einen Provider.
    Alternativen über Umgebungsvariablen:

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

    Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Veraltete Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber in neuen Konfigurationen nicht mehr verwendet werden.
    Die Firecrawl-Web-Fetch-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn du Allowlists verwendest, füge `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht ausdrücklich deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten Fetch-Fallback-Provider anhand der verfügbaren Zugangsdaten. Heute ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Dokumentation: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie kann ich sie wiederherstellen und das künftig vermeiden?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn du ein partielles Objekt sendest, wird alles
    andere entfernt.

    Wiederherstellung:

    - Stelle sie aus einem Backup wieder her (git oder eine kopierte `~/.openclaw/openclaw.json`).
    - Wenn du kein Backup hast, führe `openclaw doctor` erneut aus und konfiguriere Channels/Modelle neu.
    - Wenn das unerwartet war, melde einen Bug und füge deine zuletzt bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann oft eine funktionierende Konfiguration aus Logs oder Verlauf rekonstruieren.

    Vermeidung:

    - Verwende `openclaw config set` für kleine Änderungen.
    - Verwende `openclaw configure` für interaktive Änderungen.
    - Verwende zuerst `config.schema.lookup`, wenn du dir über einen genauen Pfad oder die Form eines Feldes nicht sicher bist; es gibt einen flachen Schema-Knoten plus unmittelbare Zusammenfassungen der Kindknoten für das Drill-down zurück.
    - Verwende `config.patch` für partielle RPC-Bearbeitungen; behalte `config.apply` nur für vollständigen Konfigurationsersatz.
    - Wenn du das nur für Eigentümer verfügbare `gateway`-Tool aus einem Agent-Lauf verwendest, lehnt es weiterhin Schreibzugriffe auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich veralteter `tools.bash.*`-Aliasse, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Konfiguration](/cli/config), [Configure](/cli/configure), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern auf mehreren Geräten?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agents**:

    - **Gateway (zentral):** besitzt Channels (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** getrennte Gehirne/Workspaces für besondere Rollen (z. B. „Hetzner Ops“, „Persönliche Daten“).
    - **Sub-Agents:** starten Hintergrundarbeit von einem Haupt-Agenten aus, wenn du Parallelität möchtest.
    - **TUI:** mit dem Gateway verbinden und zwischen Agents/Sitzungen wechseln.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless laufen?">
    Ja. Das ist eine Konfigurationsoption:

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

    Standard ist `false` (mit sichtbarem Browserfenster). Headless löst auf einigen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwende Screenshots, wenn du visuelle Rückmeldung brauchst).
    - Einige Websites sind bei Automatisierung im Headless-Modus strenger (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browser-Steuerung?">
    Setze `browser.executablePath` auf deine Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starte das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway-WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie empfangen nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet ist?">
    Kurz gesagt: **kopple deinen Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf deinem lokalen Rechner über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Führe das Gateway auf dem Always-on-Host aus (VPS/Home-Server).
    2. Bringe den Gateway-Host und deinen Computer in dasselbe Tailnet.
    3. Stelle sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Öffne lokal die macOS-App und verbinde dich im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmige den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Kopple nur
    Geräte, denen du vertraust, und lies [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfe die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Gesundheit: `openclaw status`
    - Channel-Gesundheit: `openclaw channels status`

    Prüfe dann Authentifizierung und Routing:

    - Wenn du Tailscale Serve verwendest, stelle sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn du dich per SSH-Tunnel verbindest, bestätige, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätige, dass deine Allowlists (DM oder Gruppe) dein Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber du kannst das auf einige
    zuverlässige Arten einrichten:

    **Am einfachsten:** Verwende einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lass Bot A eine Nachricht an Bot B senden und lass dann Bot B wie gewohnt antworten.

    **CLI-Bridge (allgemein):** Führe ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem entfernten VPS läuft, richte deine CLI auf dieses entfernte Gateway
    über SSH/Tailscale aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Füge eine Leitplanke hinzu, damit die beiden Bots nicht endlos schleifen (nur bei Erwähnung, Channel-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich separate VPS für mehrere Agents?">
    Nein. Ein Gateway kann mehrere Agents hosten, jeder mit eigenem Workspace, eigenen Modell-Standards
    und eigenem Routing. Das ist das normale Setup und deutlich günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwende separate VPS nur dann, wenn du harte Isolation brauchst (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen hast, die du nicht teilen möchtest. Andernfalls behalte ein Gateway und
    verwende mehrere Agents oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop statt SSH von einem VPS aus zu verwenden?">
    Ja – Nodes sind der erstklassige Weg, deinen Laptop von einem entfernten Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Box in Raspberry-Pi-Klasse reicht aus; 4 GB RAM sind reichlich), daher ist ein häufiges
    Setup ein Always-on-Host plus dein Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Geräte-Kopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch Node-Allowlists/-Genehmigungen gesteuert.
    - **Mehr Geräte-Tools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Halte das Gateway auf einem VPS, führe Chrome aber lokal über einen Node-Host auf dem Laptop aus oder verbinde dich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, du betreibst absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/cli/node).

    Ein vollständiger Neustart ist für Änderungen an `gateway`, `discovery` und `canvasHost` erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Knoten, passendem UI-Hinweis und unmittelbaren Zusammenfassungen der Kindknoten prüfen, bevor geschrieben wird
    - `config.get`: den aktuellen Schnappschuss + Hash abrufen
    - `config.patch`: sicheres partielles Update (bevorzugt für die meisten RPC-Bearbeitungen); Hot-Reload, wenn möglich, und Neustart, wenn erforderlich
    - `config.apply`: validieren + die vollständige Konfiguration ersetzen; Hot-Reload, wenn möglich, und Neustart, wenn erforderlich
    - Das nur für Eigentümer verfügbare Runtime-Tool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; veraltete `tools.bash.*`-Aliasse normalisieren auf dieselben geschützten Exec-Pfade

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Damit legst du deinen Workspace fest und schränkst ein, wer den Bot auslösen kann.

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
    4. **Den Tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway-WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn du die Control UI ohne SSH möchtest, verwende Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und wird über Tailscale per HTTPS bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stelle sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwende die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmige den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn du auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) brauchst, füge ihn als
    **Node** hinzu. Dadurch behältst du ein einzelnes Gateway und vermeidest doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur unter macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installiere ein zweites Gateway nur dann, wenn du **harte Isolation** oder zwei vollständig getrennte Bots brauchst.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem Elternprozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - ein globales Fallback-`.env` aus `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt vorhandene Umgebungsvariablen.

    Du kannst auch Inline-Umgebungsvariablen in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Siehe [/environment](/de/help/environment) für die vollständige Priorität und die Quellen.

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Lege die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann erfasst werden, wenn der Service deine Shell-Umgebung nicht übernimmt.
    2. Aktiviere Shell-Import (bequeme Opt-in-Funktion):

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

    Dadurch wird deine Login-Shell ausgeführt und nur fehlende erwartete Schlüssel werden importiert (nie überschrieben). Entsprechende Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe `COPILOT_GITHUB_TOKEN` gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` zeigt an, ob **Shell-Umgebungsimport** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass deine Umgebungsvariablen fehlen – es bedeutet nur, dass OpenClaw deine
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), übernimmt es deine Shell-
    Umgebung nicht. Behebe das auf eine dieser Arten:

    1. Lege das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktiviere Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder füge es deinem `env`-Block in der Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starte dann das Gateway neu und prüfe erneut:

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
    Sende `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber das ist **standardmäßig deaktiviert** (Standard **0**).
    Setze einen positiven Wert, um den Leerlauf-Ablauf zu aktivieren. Wenn er aktiviert ist, startet die **nächste**
    Nachricht nach dem Leerlaufzeitraum eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Das löscht keine Transkripte – es startet nur eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu bilden (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Du kannst einen koordinierenden
    Agenten und mehrere Worker-Agents mit eigenen Workspaces und Modellen erstellen.

    Allerdings ist das eher als **unterhaltsames Experiment** zu sehen. Es verbraucht viele Tokens und ist oft
    weniger effizient als ein Bot mit getrennten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem du sprichst, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie kann ich das verhindern?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Abschneiden auslösen.

    Was hilft:

    - Bitte den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwende `/compact` vor langen Aufgaben und `/new`, wenn du das Thema wechselst.
    - Halte wichtigen Kontext im Workspace und bitte den Bot, ihn wieder einzulesen.
    - Verwende Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wähle ein Modell mit größerem Kontextfenster, wenn das häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, behalte es aber installiert?">
    Verwende den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führe dann die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Das Onboarding bietet ebenfalls **Reset** an, wenn es eine bestehende Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn du Profile verwendet hast (`--profile` / `OPENCLAW_PROFILE`), setze jedes State-Verzeichnis zurück (Standard ist `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Entwicklung; löscht Dev-Konfiguration + Zugangsdaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme Fehler wie "context too large" – wie kann ich zurücksetzen oder kompaktifizieren?'>
    Verwende eine dieser Möglichkeiten:

    - **Compact** (behält die Unterhaltung, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (neue Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn das weiterhin passiert:

    - Aktiviere oder passe **Session Pruning** (`agents.defaults.contextPruning`) an, um alte Tool-Ausgaben zu kürzen.
    - Verwende ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Das ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne die erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schema-Änderung).

    Lösung: Starte mit `/new` (eigenständige Nachricht) eine neue Sitzung.

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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Durchlauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Agent-spezifische Overrides verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **deinem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn du darin bist.
    Standardmäßig sind Gruppenantworten blockiert, bis du Absender zulässt (`groupPolicy: "allowlist"`).

    Wenn du möchtest, dass nur **du** Gruppenantworten auslösen kannst:

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
    Option 1 (am schnellsten): Folge den Logs und sende eine Testnachricht in der Gruppe:

    ```bash
    openclaw logs --follow --json
    ```

    Suche nach `chatId` (oder `from`) mit dem Suffix `@g.us`, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Du musst den Bot mit @ erwähnen (oder `mentionPatterns` treffen).
    - Du hast `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkte Chats werden standardmäßig in die Hauptsitzung zusammengeführt. Gruppen/Channels haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achte auf:

    - **Wachstum des Speicherplatzbedarfs:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Aufwand:** agent-spezifische Auth-Profile, Workspaces und Channel-Routing.

    Tipps:

    - Behalte pro Agent einen **aktiven** Workspace (`agents.defaults.workspace`).
    - Bereinige alte Sitzungen (lösche JSONL- oder Store-Einträge), wenn der Speicherplatzbedarf wächst.
    - Verwende `openclaw doctor`, um verwaiste Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwende **Multi-Agent-Routing**, um mehrere isolierte Agents auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agents gebunden werden.

    Browser-Zugriff ist mächtig, aber nicht „alles tun, was ein Mensch kann“ – Anti-Bot-Mechanismen, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwende lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die an diese Agents gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf ein Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standards, Auswahl, Aliasse, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was du festlegst als:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn du den Provider weglässt, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Match eines konfigurierten Providers für genau diese Modell-ID und greift erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen. Du solltest trotzdem **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlt ihr?">
    **Empfohlener Standard:** Verwende das stärkste Modell der neuesten Generation, das in deinem Provider-Stack verfügbar ist.
    **Für Agents mit Tools oder nicht vertrauenswürdigen Eingaben:** Priorisiere Modellstärke vor Kosten.
    **Für routinemäßigen/wenig riskanten Chat:** Verwende günstigere Fallback-Modelle und route nach Agent-Rolle.

    MiniMax hat eigene Dokumentation: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwende für Aufgaben mit hohem Einsatz das **beste Modell, das du dir leisten kannst**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Du kannst Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Sub-Agents](/de/tools/subagents).

    Deutliche Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt-
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwende **Modell-Befehle** oder bearbeite nur die Felder für das **Modell**. Vermeide vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - Bearbeite `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Vermeide `config.apply` mit einem partiellen Objekt, es sei denn, du willst die gesamte Konfiguration ersetzen.
    Für RPC-Bearbeitungen prüfe zuerst mit `config.schema.lookup` und bevorzuge `config.patch`. Die Lookup-Nutzlast gibt dir den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und unmittelbare Zusammenfassungen der Kindknoten
    für partielle Updates.
    Wenn du die Konfiguration überschrieben hast, stelle sie aus einem Backup wieder her oder führe `openclaw doctor` erneut aus, um sie zu reparieren.

    Dokumentation: [Modelle](/de/concepts/models), [Configure](/cli/configure), [Konfiguration](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellste Einrichtung:

    1. Installiere Ollama von `https://ollama.com/download`
    2. Lade ein lokales Modell wie `ollama pull gemma4`
    3. Wenn du auch Cloud-Modelle willst, führe `ollama signin` aus
    4. Führe `openclaw onboard` aus und wähle `Ollama`
    5. Wähle `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt dir Cloud-Modelle plus deine lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Für manuelles Wechseln verwende `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt-
    Injection. Wir empfehlen dringend **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn du trotzdem kleine Modelle willst, aktiviere Sandboxing und strikte Tool-Allowlists.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfe die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Verwende für sicherheitssensible/tool-fähige Agents das stärkste verfügbare Modell der neuesten Generation.
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

    Das sind die eingebauten Aliasse. Benutzerdefinierte Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Du kannst verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten nummerierten Picker. Wähle per Nummer:

    ```
    /model 3
    ```

    Du kannst auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Es zeigt außerdem den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich die Bindung eines Profils, das ich mit @profile gesetzt habe?**

    Führe `/model` **ohne** das Suffix `@profile` erneut aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn du zum Standard zurückkehren möchtest, wähle ihn in `/model` aus (oder sende `/model <default provider/model>`).
    Verwende `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 für Coding verwenden?">
    Ja. Setze eines als Standard und wechsle bei Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` für Coding mit Codex OAuth.
    - **Standard + Wechsel:** setze `agents.defaults.model.primary` auf `openai/gpt-5.4`, wechsle dann beim Coding zu `openai-codex/gpt-5.4` (oder andersherum).
    - **Sub-Agents:** route Coding-Aufgaben an Sub-Agents mit einem anderen Standardmodell.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den Fast Mode für GPT 5.4?">
    Verwende entweder einen Sitzungs-Toggle oder einen Konfigurationsstandard:

    - **Pro Sitzung:** sende `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** setze `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch für Codex OAuth:** wenn du zusätzlich `openai-codex/gpt-5.4` verwendest, setze dort denselben Schalter.

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

    Für OpenAI wird Fast Mode bei unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzung-Overrides über `/fast` stechen Konfigurationsstandards aus.

    Siehe [Thinking und Fast Mode](/de/tools/thinking) und [OpenAI Fast Mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und danach keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Die Auswahl eines Modells, das nicht in dieser Liste steht, gibt zurück:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Füge das Modell zu
    `agents.defaults.models` hinzu, entferne die Allowlist oder wähle ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisiere auf eine aktuelle OpenClaw-Version (oder führe `main` aus dem Quellcode aus) und starte dann das Gateway neu.
    2. Stelle sicher, dass MiniMax konfiguriert ist (Wizard oder JSON) oder dass MiniMax-Authentifizierung
       in env/Auth-Profilen vorhanden ist, sodass der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwende die exakte Modell-ID (Groß-/Kleinschreibung beachten) für deinen Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-Key-
       Setup oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führe aus:

       ```bash
       openclaw models list
       ```

       und wähle aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwende **MiniMax als Standard** und wechsle **pro Sitzung** das Modell, wenn nötig.
    Fallbacks sind für **Fehler**, nicht für „schwierige Aufgaben“, also verwende `/model` oder einen separaten Agenten.

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

    **Option B: separate Agents**

    - Standard von Agent A: MiniMax
    - Standard von Agent B: OpenAI
    - Route nach Agent oder verwende `/agent`, um zu wechseln

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt eingebaute Kurzbefehle?">
    Ja. OpenClaw bringt einige Standard-Kurzformen mit (sie werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

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

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) in diese Modell-ID aufgelöst.

  </Accordion>

  <Accordion title="Wie füge ich Modelle von anderen Providern wie OpenRouter oder Z.AI hinzu?">
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

    Wenn du auf ein Provider-/Modellpaar verweist, aber der erforderliche Provider-Schlüssel fehlt, bekommst du einen Laufzeit-Authentifizierungsfehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Auth ist pro Agent und
    wird hier gespeichert:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Möglichkeiten zur Behebung:

    - Führe `openclaw agents add <id>` aus und konfiguriere die Authentifizierung im Wizard.
    - Oder kopiere `auth-profiles.json` aus dem `agentDir` des Haupt-Agenten in den `agentDir` des neuen Agenten.

    Verwende `agentDir` **nicht** für mehrere Agents gemeinsam; das verursacht Kollisionen bei Auth/Sitzungen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Rotation des Auth-Profils** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider ratenlimitiert ist oder vorübergehend fehlschlägt.

    Der Rate-Limit-Bucket umfasst mehr als einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als
    Failover-würdige Rate Limits.

    Einige nach Abrechnung aussehende Antworten sind nicht `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Abrechnungstext bei `401` oder `403` zurückgibt, kann OpenClaw das weiterhin in
    der Billing-Spur halten, aber provider-spezifische Textmatcher bleiben auf den
    Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Meldung stattdessen wie ein wiederholbares Nutzungsfenster oder
    ein Ausgabenlimit für Organisation/Workspace aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw das als
    `rate_limit`, nicht als langfristige Abrechnungsdeaktivierung.

    Kontext-Overflow-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Compaction-/Retry-Pfad, statt das Modell-
    Fallback weiterzuschalten.

    Generischer Serverfehlertext ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-spezifische transiente Muster
    wie Anthropic pures `An unknown error occurred`, OpenRouter pures
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und Provider-überlastete Fehler wie `ModelNotReadyException` als
    Failover-würdige Timeout-/Überlastungssignale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst für sich allein kein Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Das bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, dafür aber im erwarteten Auth-Store keine Zugangsdaten gefunden hat.

    **Checkliste zur Behebung:**

    - **Bestätige, wo Auth-Profile liegen** (neue vs. veraltete Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Veraltet: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Bestätige, dass deine Umgebungsvariable vom Gateway geladen wird**
      - Wenn du `ANTHROPIC_API_KEY` in deiner Shell gesetzt hast, das Gateway aber über systemd/launchd betreibst, wird es möglicherweise nicht übernommen. Lege ihn in `~/.openclaw/.env` ab oder aktiviere `env.shellEnv`.
    - **Stelle sicher, dass du den richtigen Agenten bearbeitest**
      - In Multi-Agent-Setups kann es mehrere `auth-profiles.json`-Dateien geben.
    - **Prüfe grob Modell-/Auth-Status**
      - Verwende `openclaw models status`, um konfigurierte Modelle und die Authentifizierung der Provider zu sehen.

    **Checkliste zur Behebung von "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf an ein Anthropic-Auth-Profil gebunden ist, das Gateway
    es aber in seinem Auth-Store nicht finden kann.

    - **Claude CLI verwenden**
      - Führe `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn du stattdessen einen API-Schlüssel verwenden möchtest**
      - Lege `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Lösche jede angeheftete Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätige, dass du Befehle auf dem Gateway-Host ausführst**
      - Im Remote-Modus liegen Auth-Profile auf dem Gateway-Rechner, nicht auf deinem Laptop.

  </Accordion>

  <Accordion title="Warum hat es auch Google Gemini versucht und ist fehlgeschlagen?">
    Wenn deine Modellkonfiguration Google Gemini als Fallback enthält (oder du zu einem Gemini-Kurzbefehl gewechselt hast), versucht OpenClaw es während des Modell-Fallbacks. Wenn du keine Google-Zugangsdaten konfiguriert hast, siehst du `No API key found for provider "google"`.

    Lösung: Stelle entweder Google-Auth bereit oder entferne/vermeide Google-Modelle in `agents.defaults.model.fallbacks` / Aliasen, damit Fallback nicht dorthin routet.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält **Thinking-Blöcke ohne Signaturen** (oft aus
    einem abgebrochenen/partiellen Stream). Google Antigravity erfordert Signaturen für Thinking-Blöcke.

    Lösung: OpenClaw entfernt jetzt unsignierte Thinking-Blöcke für Google Antigravity Claude. Wenn es weiterhin erscheint, starte eine **neue Sitzung** oder setze `/thinking off` für diesen Agenten.

  </Accordion>
</AccordionGroup>

## Auth-Profile: was sie sind und wie man sie verwaltet

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Flows, Token-Speicherung, Multi-Account-Muster)

<AccordionGroup>
  <Accordion title="Was ist ein Auth-Profil?">
    Ein Auth-Profil ist ein benannter Zugangsdaten-Datensatz (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile liegen in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Wie sehen typische Profil-IDs aus?">
    OpenClaw verwendet Provider-präfixierte IDs wie:

    - `anthropic:default` (häufig, wenn keine E-Mail-Identität existiert)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs, die du wählst (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Auth-Profil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dadurch werden **keine** Secrets gespeichert; es ordnet IDs Provider/Modus zu und legt die Rotationsreihenfolge fest.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es in einem kurzen **Cooldown** (Rate Limits/Timeouts/Auth-Fehler) oder einem längeren **disabled**-Zustand (Abrechnung/zu wenig Guthaben) ist. Um das zu prüfen, führe `openclaw models status --json` aus und prüfe `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein Modell
    im Cooldown ist, kann für ein verwandtes Modell auf demselben Provider weiterhin nutzbar sein,
    während Billing-/Disabled-Fenster trotzdem das ganze Profil blockieren.

    Du kannst auch über die CLI ein **pro Agent**-Reihenfolge-Override setzen (gespeichert in `auth-state.json` dieses Agenten):

    ```bash
    # Standardmäßig der konfigurierte Standard-Agent (ohne --agent)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil festlegen (nur dieses versuchen)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge setzen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Override löschen (auf config auth.order / Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic
    ```

    Um einen bestimmten Agenten anzusprechen:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu prüfen, was tatsächlich versucht wird, verwende:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge ausgelassen wird, meldet probe
    für dieses Profil `excluded_by_auth_order`, statt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API key – was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt oft Abonnement-Zugriff (wo anwendbar).
    - **API keys** verwenden Pay-per-Token-Abrechnung.

    Der Wizard unterstützt ausdrücklich Anthropic Claude CLI, OpenAI Codex OAuth und API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Gateway: Ports, „läuft bereits“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexen Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum sagt `openclaw gateway status` "Runtime: running", aber "RPC probe: failed"?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die RPC-Probe ist die CLI, die sich tatsächlich mit dem Gateway-WebSocket verbindet und `status` aufruft.

    Verwende `openclaw gateway status` und vertraue diesen Zeilen:

    - `Probe target:` (die URL, die die Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich auf dem Port gebunden ist)
    - `Last gateway error:` (häufige Ursache, wenn der Prozess lebt, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt `openclaw gateway status` unterschiedliche Werte für "Config (cli)" und "Config (service)" an?'>
    Du bearbeitest eine Konfigurationsdatei, während der Service eine andere verwendet (oft ein Mismatch bei `--profile` / `OPENCLAW_STATE_DIR`).

    Lösung:

    ```bash
    openclaw gateway install --force
    ```

    Führe das mit demselben `--profile` / derselben Umgebung aus, die der Service verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem es den WebSocket-Listener sofort beim Start bindet (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst, was darauf hinweist, dass bereits eine andere Instanz lauscht.

    Lösung: Stoppe die andere Instanz, gib den Port frei oder starte mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie betreibe ich OpenClaw im Remote-Modus (Client verbindet sich mit einem Gateway anderswo)?">
    Setze `gateway.mode: "remote"` und verweise auf eine entfernte WebSocket-URL, optional mit Remote-Zugangsdaten per Shared Secret:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` `local` ist (oder du das Override-Flag übergibst).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Zugangsdaten; sie aktivieren lokale Gateway-Authentifizierung nicht von selbst.

  </Accordion>

  <Accordion title='Die Control UI sagt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Der Authentifizierungspfad deines Gateways und die Authentifizierungsmethode der UI passen nicht zusammen.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL in `sessionStorage`, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne langlebige Token-Persistenz in `localStorage` wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken unternehmen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit zwischengespeichertem Token verwendet jetzt die zwischengespeicherten genehmigten Scopes erneut, die mit dem Gerätetoken gespeichert wurden. Explizite Aufrufer mit `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, statt zwischengespeicherte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads ist die Priorität der Verbindungs-Authentifizierung: zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Tokens sind rollenpräfixiert. Die eingebaute Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Lösung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus, kopiert sie und versucht, sie zu öffnen; zeigt bei headless einen SSH-Hinweis).
    - Wenn du noch kein Token hast: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: setze `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und füge dann das passende Secret in den Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stelle sicher, dass `gateway.auth.allowTailscale` aktiviert ist und du die Serve-URL öffnest, nicht eine rohe loopback-/tailnet-URL, die Tailscale-Identitätsheader umgeht.
    - Trusted-Proxy-Modus: Stelle sicher, dass du über den konfigurierten nicht-loopback identity-aware proxy kommst, nicht über einen gleichhostigen loopback-Proxy oder eine rohe Gateway-URL.
    - Wenn der Mismatch nach dem einen Retry bestehen bleibt, rotiere/genehmige das gekoppelte Gerätetoken erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf sagt, dass er abgelehnt wurde, prüfe zwei Dinge:
      - gekoppelte Geräte-Sitzungen können nur ihr **eigenes** Gerät rotieren, es sei denn, sie haben zusätzlich `operator.admin`
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch festgefahren? Führe `openclaw status --all` aus und folge [Fehlerbehebung](/de/gateway/troubleshooting). Siehe [Dashboard](/web/dashboard) für Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Ich habe gateway.bind tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    Das Binden an `tailnet` wählt eine Tailscale-IP aus deinen Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden könnte.

    Lösung:

    - Starte Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - wechsle zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwende `gateway.bind: "tailnet"`, wenn du nur an Tailnet binden möchtest.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein – ein Gateway kann mehrere Messaging-Channels und Agents ausführen. Verwende mehrere Gateways nur dann, wenn du Redundanz (z. B. Rescue-Bot) oder harte Isolation brauchst.

    Ja, aber du musst isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Zustand pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Verwende `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setze in jeder Profil-Konfiguration einen eindeutigen `gateway.port` (oder übergib `--port` für manuelle Läufe).
    - Installiere einen Service pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen auch Suffixe an Servicenamen an (`ai.openclaw.<profile>`; veraltet `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als allererste Nachricht
    einen `connect`-Frame. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Policy-Verletzung).

    Häufige Ursachen:

    - Du hast die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Du hast den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Lösungen:

    1. Verwende die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffne den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Authentifizierung aktiviert ist, übergib das Token/Passwort im `connect`-Frame.

    Wenn du die CLI oder TUI verwendest, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Debugging

<AccordionGroup>
  <Accordion title="Wo sind die Logs?">
    Dateilogs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Du kannst über `logging.file` einen stabilen Pfad setzen. Das Dateilog-Level wird durch `logging.level` gesteuert. Die Konsolen-Verbosity wird durch `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellstes Log-Tailing:

    ```bash
    openclaw logs --follow
    ```

    Service-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Fehlerbehebung](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Service neu?">
    Verwende die Gateway-Hilfsbefehle:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn du das Gateway manuell ausführst, kann `openclaw gateway --force` den Port zurückerobern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen – wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffne PowerShell, gehe in WSL und starte dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn du den Service nie installiert hast, starte ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt unter Windows.

    Öffne PowerShell und führe aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn du es manuell ausführst (ohne Service), verwende:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginne mit einer schnellen Gesundheitsprüfung:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Authentifizierung wurde auf dem **Gateway-Host** nicht geladen (prüfe `models status`).
    - Channel-Pairing/Allowlist blockiert Antworten (prüfe Channel-Konfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn du remote bist, stelle sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Channels](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Vom Gateway getrennt: kein Grund" – was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfe:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote, ist der Tunnel-/Tailscale-Link aktiv?

    Folge dann den Logs:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginne mit Logs und Channel-Status:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Vergleiche dann den Fehler:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem noch entfernt werden. Reduziere Plugin-/Skill-/benutzerdefinierte Befehle oder deaktiviere `channels.telegram.commands.native`, wenn du das Menü nicht brauchst.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn du auf einem VPS oder hinter einem Proxy bist, bestätige, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stelle sicher, dass du auf die Logs des Gateway-Hosts schaust.

    Dokumentation: [Telegram](/de/channels/telegram), [Channel-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätige zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwende in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn du Antworten in einem Chat-
    Channel erwartest, stelle sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann wieder?">
    Wenn du den Service installiert hast:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Das stoppt/startet den **überwachten Service** (launchd unter macOS, systemd unter Linux).
    Verwende dies, wenn das Gateway als Daemon im Hintergrund läuft.

    Wenn du im Vordergrund ausführst, stoppe mit Strg-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs. openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrundservice** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn du den Service installiert hast, verwende die Gateway-Befehle. Verwende `openclaw gateway`, wenn
    du einen einmaligen Lauf im Vordergrund möchtest.

  </Accordion>

  <Accordion title="Schnellster Weg, um mehr Details zu bekommen, wenn etwas fehlschlägt">
    Starte das Gateway mit `--verbose`, um mehr Details in der Konsole zu erhalten. Prüfe dann die Log-Datei auf Channel-Authentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agenten müssen eine Zeile `MEDIA:<path-or-url>` enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistenten-Setup](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Senden über CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfe außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048 px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt das Senden lokaler Pfade auf Workspace, temp/media-store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, Host-lokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Klartext- und Secret-ähnliche Dateien werden weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandle eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardwerte sind darauf ausgelegt, das Risiko zu reduzieren:

    - Das Standardverhalten auf DM-fähigen Channels ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfe `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führe `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt-Injection nur für öffentliche Bots ein Problem?">
    Nein. Bei Prompt-Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM schicken kann.
    Wenn dein Assistent externe Inhalte liest (Websuche/-abruf, Browser-Seiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann passieren, selbst wenn **du der einzige Absender** bist.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder in deinem Namen Tools aufzurufen. Verringere den Schadensradius durch:

    - Verwendung eines schreibgeschützten oder Tool-deaktivierten „Leser“-Agenten zum Zusammenfassen nicht vertrauenswürdiger Inhalte
    - Deaktivieren von `web_search` / `web_fetch` / `browser` für Tool-fähige Agents
    - Behandeln von dekodiertem Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig: OpenResponses
      `input_file` und die Extraktion aus Medienanhängen umschließen extrahierten Text beide mit
      expliziten Grenzmarkierungen für externe Inhalte, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot ein eigenes E-Mail-Konto, GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolation des Bots mit separaten Konten und Telefonnummern
    verringert den Schadensradius, falls etwas schiefgeht. Dadurch wird es auch einfacher, Zugangsdaten zu rotieren
    oder Zugriff zu widerrufen, ohne deine persönlichen Konten zu beeinträchtigen.

    Starte klein. Gib nur Zugriff auf die Tools und Konten, die du tatsächlich brauchst, und erweitere
    später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über deine persönlichen Nachrichten. Das sicherste Muster ist:

    - Halte DMs im **Pairing-Modus** oder auf einer engen Allowlist.
    - Verwende eine **separate Nummer oder ein separates Konto**, wenn du möchtest, dass es in deinem Namen Nachrichten sendet.
    - Lass es Entwürfe erstellen und **genehmige vor dem Senden**.

    Wenn du experimentieren möchtest, tu das mit einem dedizierten Konto und halte es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent nur Chat macht und die Eingaben vertrauenswürdig sind. Kleinere Stufen sind
    anfälliger für Instruction Hijacking, also vermeide sie für Tool-fähige Agents
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn du unbedingt ein kleineres Modell verwenden musst, schränke
    Tools stark ein und führe es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Pairing-Code bekommen">
    Pairing-Codes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot schreibt und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Prüfe ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn du sofortigen Zugriff möchtest, setze deine Absender-ID auf die Allowlist oder setze `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten schreiben? Wie funktioniert Pairing?">
    Nein. Die Standard-DM-Richtlinie von WhatsApp ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendevorgänge, die du auslöst.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Eingabeaufforderung für Telefonnummer im Wizard: Sie wird verwendet, um deine **Allowlist/deinen Eigentümer** festzulegen, damit deine eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn du es mit deiner persönlichen WhatsApp-Nummer betreibst, verwende diese Nummer und aktiviere `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Sitzung
    aktiviert ist.

    Behebung im Chat, in dem du das siehst:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es immer noch zu laut ist, prüfe die Sitzungseinstellungen in der Control UI und setze verbose
    auf **inherit**. Bestätige außerdem, dass du kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwendest.

    Dokumentation: [Thinking und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Sende eine dieser Angaben **als eigenständige Nachricht** (ohne Slash):

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

    Das sind Abbruch-Trigger (keine Slash-Befehle).

    Für Hintergrundprozesse (vom Exec-Tool) kannst du den Agenten bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Überblick über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber ein paar Kurzbefehle (wie `/status`) funktionieren für Absender auf der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? ("Cross-context messaging denied")'>
    OpenClaw blockiert **providerübergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, wird er nicht an Discord senden, es sei denn, du erlaubst es explizit.

    Aktiviere providerübergreifendes Messaging für den Agenten:

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

    Starte das Gateway nach dem Bearbeiten der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwende `/queue`, um die Modi zu ändern:

    - `steer` - neue Nachrichten lenken die aktuelle Aufgabe um
    - `followup` - Nachrichten nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten (Standard)
    - `steer-backlog` - jetzt umlenken, dann den Rückstand verarbeiten
    - `interrupt` - aktuellen Run abbrechen und neu starten

    Du kannst Optionen wie `debounce:2s cap:25 drop:summarize` für Follow-up-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Zugangsdaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was du in `agents.defaults.model.primary` konfigurierst (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn du `No credentials found for profile "anthropic:default"` siehst, bedeutet das, dass das Gateway keine Anthropic-Zugangsdaten in der erwarteten `auth-profiles.json` für den laufenden Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Immer noch festgefahren? Frag in [Discord](https://discord.com/invite/clawd) oder eröffne eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).
