---
read_when:
    - Beantwortung häufiger Supportfragen zu Einrichtung, Installation, Onboarding oder Laufzeit
    - Triage von von Benutzern gemeldeten Problemen vor tiefergehender Fehlersuche
summary: Häufig gestellte Fragen zu OpenClaw-Einrichtung, Konfiguration und Nutzung
title: FAQ
x-i18n:
    generated_at: "2026-04-07T06:21:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bddcde55cf4bcec4913aadab4c665b235538104010e445e4c99915a1672b1148
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Kurze Antworten plus tiefergehende Fehlerbehebung für Setups aus der Praxis (lokale Entwicklung, VPS, Multi-Agent, OAuth/API keys, Modell-Failover). Für Laufzeitdiagnosen siehe [Troubleshooting](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Configuration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Gateway-/Service-Erreichbarkeit, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens redigiert).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit vs. RPC-Erreichbarkeit, die Ziel-URL des Probes und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefe Probes**

   ```bash
   openclaw status --deep
   ```

   Führt einen Live-Gateway-Health-Probe aus, einschließlich Channel-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log mitverfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, greifen Sie zurück auf:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind getrennt von Service-Logs; siehe [Logging](/de/logging) und [Troubleshooting](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Health-Checks aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

<AccordionGroup>
  <Accordion title="Ich stecke fest, schnellster Weg, um wieder weiterzukommen">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver als
    in Discord zu fragen, weil die meisten Fälle von „Ich stecke fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    Helfer aus der Ferne nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repository lesen, Befehle ausführen, Logs prüfen und bei der Reparatur Ihrer systemnahen
    Einrichtung helfen (PATH, Services, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (Git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code + die Doku lesen und
    über die genaue Version, die Sie ausführen, nachdenken kann. Sie können später jederzeit wieder auf stable wechseln,
    indem Sie das Installationsprogramm ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Reparatur **zu planen und zu beaufsichtigen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Bug oder Fix entdecken, reichen Sie bitte ein GitHub-Issue ein oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot von Gateway-/Agent-Status + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Probleme mit Konfiguration/Zustand.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdoku: [Install](/de/install), [Installer flags](/de/install/installer), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Gründe für das Überspringen von Heartbeats:

    - `quiet-hours`: außerhalb des konfigurierten active-hours-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere/header-only-Gerüste
    - `no-tasks-due`: der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber keines der Aufgabenintervalle ist bisher fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst weitergeschoben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Doku: [Heartbeat](/de/gateway/heartbeat), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zur Installation und Einrichtung von OpenClaw">
    Das Repository empfiehlt die Ausführung aus dem Quellcode und die Verwendung von Onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie das Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Lauf automatisch
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link außerdem in der Zusammenfassung aus. Lassen Sie diesen Tab offen; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner in Ihren Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost vs. remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generieren Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Binding auf loopback belassen, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist, erfüllen Identitäts-Header die Authentifizierung von Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst private-ingress `none` oder trusted-proxy-HTTP-Authentifizierung.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite schlechte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bind**: `openclaw gateway --bind tailnet --token "<token>"` ausführen (oder Passwortauthentifizierung konfigurieren), `http://<tailscale-ip>:18789/` öffnen und dann das passende Shared Secret in die Dashboard-Einstellungen einfügen.
    - **Identity-aware-Reverse-Proxy**: Das Gateway hinter einem nicht-loopback trusted proxy belassen, `gateway.auth.mode: "trusted-proxy"` konfigurieren und dann die Proxy-URL öffnen.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web surfaces](/web) für Bind-Modi und Auth-Details.

  </Accordion>

  <Accordion title="Warum gibt es zwei exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Channel als nativen Genehmigungs-Client für exec-Genehmigungen fungieren

    Die Host-exec-Richtlinie ist weiterhin das eigentliche Genehmigungsgate. Die Chat-Konfiguration steuert nur, wo Genehmigungs-
    aufforderungen erscheinen und wie Benutzer darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen zurück in den Ursprungsraum/das Ursprungsthema gepostet werden.
    - Plugin-Genehmigungen sind wiederum separat: Standardmäßig verwenden sie `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Channels behalten zusätzlich plugin-approval-native-Verhalten bei.

    Kurzfassung: Forwarding ist für Routing, die native Client-Konfiguration für eine bessere channel-spezifische UX.
    Siehe [Exec Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeit brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig - die Doku nennt **512MB-1GB RAM**, **1 Kern** und etwa **500MB**
    Festplattenspeicher als ausreichend für die private Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie zusätzlichen Spielraum möchten (Logs, Medien, andere Services), werden **2GB empfohlen**, das ist
    aber kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (Git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Beginnen Sie ohne Channels/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf merkwürdige Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitäts**-problem.

    Doku: [Linux](/de/platforms/linux), [Install](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    bei der ersten Initialisierung automatisch „Wake up, my friend!“. Wenn Sie diese Zeile mit **keiner Antwort**
    sehen und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

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
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Workspace**, und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Channel-
    Zustand), solange Sie **beide** Orte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Service neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Zugangsdaten, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus arbeiten, beachten Sie, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace auf GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrating](/de/install/migrating), [Wo Dinge auf dem Datenträger liegen](#wo-dinge-auf-dem-datenträger-liegen),
    [Agent workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote mode](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt ausgelieferte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Doku-/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kann docs.openclaw.ai nicht aufrufen (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie das oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns beim Freischalten, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Seite weiterhin nicht erreichen, sind die Dokus auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine separaten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine stable-Version zuerst auf **beta**, und dann verschiebt ein expliziter
    Promotionsschritt dieselbe Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion auf **dieselbe Version** zeigen.

    Was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Für Installations-Einzeiler und den Unterschied zwischen beta und dev siehe das Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist der npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Stand von `main` (Git); wenn veröffentlicht, verwendet er den npm-dist-tag `dev`.

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

  <Accordion title="Wie kann ich die neuesten Bits ausprobieren?">
    Zwei Optionen:

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wird auf den `main`-Branch gewechselt und aus dem Quellcode aktualisiert.

    2. **Hackbare Installation (von der Installer-Site):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repository, das Sie bearbeiten und dann per Git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Klon möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Doku: [Update](/cli/update), [Development channels](/de/install/development-channels),
    [Install](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, abhängig davon, wie viele Channels/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt](#schnellstart-und-einrichtung-beim-ersten-start)
    und die schnelle Debug-Schleife unter [Ich stecke fest](#schnellstart-und-einrichtung-beim-ersten-start).

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

    Für eine hackbare (Git-)Installation:

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

  <Accordion title="Windows-Installation sagt git not found oder openclaw not recognized">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` auf Ihrem PATH liegt.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht auf PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach der Aktualisierung des PATH erneut.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Doku: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Das ist normalerweise ein Mismatch der Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - `system.run`-/`exec`-Ausgabe stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schneller Workaround in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie dann das Gateway neu und versuchen Sie den Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies auf dem neuesten OpenClaw weiterhin reproduzieren können, verfolgen/melden Sie es unter:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Doku hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (Git-)Installation**, damit Sie den vollständigen Quellcode und die Doku lokal haben, und fragen Sie
    dann Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Install](/de/install) und [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann Onboarding aus.

    - Schneller Linux-Pfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Getting Started](/de/start/getting-started).
    - Installer + Updates: [Install & updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon aus über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Source of Truth und sichern Sie ihn.

    Sie können **nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Platforms](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung abbricht), benötigt eventuell einen sauberen Git-Checkout und
    kann eine Bestätigung verlangen. Sicherer: Updates als Operator aus einer Shell ausführen.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie von einem Agenten aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Doku: [Update](/cli/update), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API keys, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - Speicherort des **Workspace** + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Channel-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd-Benutzereinheit auf Linux/WSL2)
    - **Health-Checks** und Auswahl von **Skills**

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API keys** (Anthropic/OpenAI/andere) oder mit
    **nur lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Wege, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic API key**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Subscription-Authentifizierung in OpenClaw**: Anthropic-Mitarbeiter
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als sanktioniert, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API keys weiterhin das besser
    vorhersagbare Setup. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete Subscription-ähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Doku: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Local models](/de/gateway/local-models), [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API key nutzen?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Subscription-Authentifizierung und die Nutzung von `claude -p` als sanktioniert
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie das
    vorhersagbarste serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic API key.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Subscription-Authentifizierung (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als sanktioniert,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads ist die Authentifizierung per Anthropic API key weiterhin die
    sicherere und besser vorhersagbare Wahl. Wenn Sie andere Subscription-ähnliche gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Fenster erschöpft ist. Wenn Sie
**Claude CLI** verwenden, warten Sie, bis das Fenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
einen **Anthropic API key** verwenden, prüfen Sie die Anthropic Console
auf Nutzung/Abrechnung und erhöhen Sie bei Bedarf die Limits.

    Wenn die Meldung speziell lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropics 1M-Context-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Anmeldedaten für Long-Context-Abrechnung geeignet sind (API-key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Setzen Sie ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Models](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Model providers](/de/providers/models). Wenn Sie lieber einen verwalteten Schlüsselablauf möchten, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** per OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt das Standardmodell bei Bedarf auf `openai-codex/gpt-5.4`. Siehe [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum schaltet ChatGPT GPT-5.4 `openai/gpt-5.4` in OpenClaw nicht frei?">
    OpenClaw behandelt die beiden Pfade getrennt:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex-OAuth
    - `openai/gpt-5.4` = direkte OpenAI-Platform-API

    In OpenClaw ist die ChatGPT/Codex-Anmeldung an den Pfad `openai-codex/*` gebunden,
    nicht an den direkten Pfad `openai/*`. Wenn Sie den direkten API-Pfad in
    OpenClaw möchten, setzen Sie `OPENAI_API_KEY` (oder die entsprechende OpenAI-Provider-Konfiguration).
    Wenn Sie ChatGPT/Codex-Anmeldung in OpenClaw möchten, verwenden Sie `openai-codex/*`.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT im Web unterscheiden?">
    `openai-codex/*` verwendet den Codex-OAuth-Pfad, und seine nutzbaren Kontingentfenster werden
    von OpenAI verwaltet und hängen vom Plan ab. In der Praxis können sich diese Limits von
    der ChatGPT-Website-/App-Erfahrung unterscheiden, selbst wenn beide mit demselben Konto verknüpft sind.

    OpenClaw kann die derzeit sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine ChatGPT-Web-
    Berechtigungen in direkten API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchten, verwenden Sie `openai/*` mit einem API key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Subscription-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Subscription OAuth** vollständig.
    OpenAI erlaubt ausdrücklich die Nutzung von Subscription OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Model providers](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini-CLI-OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Ablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach dem Login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Model providers](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten werden abgeschnitten und lecken. Wenn Sie es unbedingt möchten, verwenden Sie lokal die **größte** Modell-Build, die Sie ausführen können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko für Prompt Injection - siehe [Security](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie regionengebundene Endpunkte. OpenRouter bietet US-gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben aufführen, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während Sie den ausgewählten regionalen Provider respektieren.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Homeserver oder eine Raspberry-Pi-Klasse-Box funktionieren.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) - der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere macOS-only-Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-node.

    Doku: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich für iMessage-Unterstützung einen Mac mini?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage - der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Gateway auf Linux/VPS ausführen und den BlueBubbles-Server auf einem beliebigen Mac laufen lassen, der bei Messages angemeldet ist.
    - Alles auf dem Mac ausführen, wenn Sie das einfachste Single-Machine-Setup möchten.

    Doku: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - MacBook Pro führt die macOS-App oder einen node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es anzuzeigen.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeit-Bugs, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie das auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Onboarding akzeptiert `@username`-Eingaben und löst diese in eine numerische ID auf, aber OpenClaw-Autorisierung verwendet nur numerische IDs.

    Sicherer (ohne Drittanbieter-Bot):

    - Schreiben Sie Ihrem Bot per DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Schreiben Sie Ihrem Bot per DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Schreiben Sie `@userinfobot` oder `@getidsbot` per DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, damit jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffssteuerung (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) gilt global pro WhatsApp-Konto. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für "schnellen Chat" und einen "Opus fürs Coden"-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Beispielkonfigurationen finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Models](/de/concepts/models) und [Configuration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr Brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen außerdem gängige Benutzer-bin-Verzeichnisse Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn gesetzt.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm install">
    - **Hackbare (Git-)Installation:** vollständiger Quellcode-Checkout, editierbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Doku patchen.
    - **npm install:** globale CLI-Installation, kein Repository, am besten für „einfach ausführen“.
      Updates kommen über npm-dist-tags.

    Doku: [Getting started](/de/start/getting-started), [Updating](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installation wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Service auf den neuen Entrypoint zeigt.
    Dadurch werden **Ihre Daten nicht gelöscht** - es ändert nur die OpenClaw-Code-Installation. Ihr Zustand
    (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unberührt.

    Von npm zu Git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Von Git zu npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor erkennt einen Entrypoint-Mismatch des Gateway-Service und bietet an, die Service-Konfiguration passend zur aktuellen Installation umzuschreiben (verwenden Sie `--repair` in der Automatisierung).

    Backup-Tipps: siehe [Backup-Strategie](#wo-dinge-auf-dem-datenträger-liegen).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurzantwort: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung möchten und mit Sleep/Neustarts okay sind, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Sleep/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Laptop-Sleep-Probleme, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** häufig headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Updates müssen per SSH erfolgen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Trade-off ist **headless browser** vs. sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Sleep/Neustarts, sauberere Berechtigungen, leichter am Laufen zu halten.
    - **Geteilter Laptop/Desktop:** völlig okay zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner schläft oder aktualisiert wird.

    Wenn Sie das Beste aus beiden Welten möchten, halten Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **node** für lokale Bildschirm-/Kamera-/exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitsrichtlinien lesen Sie [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Channel:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM, ~500MB Festplattenspeicher.
    - **Empfohlen:** 1-2 vCPU, 2GB RAM oder mehr für Spielraum (Logs, Medien, mehrere Channels). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Doku: [Linux](/de/platforms/linux), [VPS hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar sein und genug
    RAM für das Gateway und alle Channels haben, die Sie aktivieren.

    Grundlegende Richtwerte:

    - **Absolutes Minimum:** 1 vCPU, 1GB RAM.
    - **Empfohlen:** 2GB RAM oder mehr, wenn Sie mehrere Channels, Browser-Automatisierung oder Media-Tools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows arbeiten, ist **WSL2 das einfachste VM-artige Setup** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die always-on-Kontrollebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **local-first-Kontrollebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits nutzen, mit
    zustandsbehafteten Sitzungen, Memory und Tools - ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo immer Sie möchten (Mac, Linux, VPS), und halten Sie den
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit Routing
      und Failover pro Agent.
    - **Nur lokal als Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** Separate Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und Standardwerten.
    - **Open Source und hackbar:** Prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Doku: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was soll ich als Erstes tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Seite).
    - Eine Mobile-App prototypisieren (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen typischerweise so aus:

    - **Persönliche Briefings:** Zusammenfassungen des Posteingangs, Kalenders und der Nachrichten, die für Sie wichtig sind.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und Erstentwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** cron- oder heartbeat-gesteuerte Stupser und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und wiederkehrende Webaufgaben erledigen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, bei **Recherche, Qualifizierung und Entwürfen**. Es kann Websites prüfen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach oder Anzeigentexte schreiben.

    Für **Outreach oder Anzeigenläufe** sollten Sie einen Menschen im Loop behalten. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist:
    OpenClaw entwirft, und Sie genehmigen.

    Doku: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für die schnellste direkte Coding-Schleife in einem Repository. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Zeitplanung, Hooks)
    - **Always-on-Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repository dirty zu halten?">
    Verwenden Sie verwaltete Overrides, statt die Kopie im Repository zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie einen Ordner über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin Vorrang vor gebündelten Skills haben, ohne Git zu berühren. Wenn Sie möchten, dass der Skill global installiert ist, aber nur für einige Agents sichtbar, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die sich für Upstream eignen, sollten im Repository leben und als PRs hinausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig in `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für verschiedene Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: Isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agents**: Aufgaben an separate Agents mit unterschiedlichen Standardmodellen routen.
    - **On-Demand-Wechsel**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron jobs](/de/automation/cron-jobs), [Multi-Agent Routing](/de/concepts/multi-agent) und [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    liefern eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „für diese Aufgabe einen Sub-Agenten zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, setzen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model`.

    Doku: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren thread-gebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an ein Sub-Agent- oder Sitzungsziel binden, damit Folge-Nachrichten in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starten mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Follow-ups).
    - Oder manuell mit `/focus <target>` binden.
    - Mit `/agents` den Bindings-Zustand prüfen.
    - Mit `/session idle <duration|off>` und `/session max-age <duration|off>` Auto-Unfocus steuern.
    - Mit `/unfocus` den Thread lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-Bind beim Starten: `channels.discord.threadBindings.spawnSubagentSessions: true` setzen.

    Doku: [Sub-agents](/de/tools/subagents), [Discord](/de/channels/discord), [Configuration Reference](/de/gateway/configuration-reference), [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent wurde fertig, aber die Abschlussmeldung ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Abschlussmodus-Sub-Agent-Zustellung bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine existiert.
    - Wenn der Abschlussursprung nur einen Channel trägt, greift OpenClaw auf die gespeicherte Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) zurück, damit direkte Zustellung dennoch funktionieren kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann direkte Zustellung fehlschlagen und das Ergebnis fällt auf zugestellte Warteschlangen-Sitzung zurück, statt sofort im Chat zu posten.
    - Ungültige oder veraltete Ziele können weiterhin Queue-Fallback oder endgültiges Zustellungsversagen erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach nur Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgaben wiederzugeben.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen feuern nicht. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Sleep/keine Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` vs. Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Doku: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Channel gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Channel-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, aber Anmeldedaten dies blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch den zugestellten Queue-Fallback.

    Bei isolierten Cron-Jobs besitzt der Runner die finale Zustellung. Vom Agenten wird erwartet,
    eine Klartext-Zusammenfassung zurückzugeben, die der Runner sendet. `--no-deliver` behält
    dieses Ergebnis intern; es erlaubt dem Agenten stattdessen nicht, direkt mit dem
    Nachrichtentool zu senden.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Cron jobs](/de/automation/cron-jobs), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal neu versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, keine doppelte Terminierung.

    Isolierter Cron kann einen Laufzeit-Modell-Handoff persistieren und neu versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der Wiederholungsversuch behält den gewechselten
    Provider/das Modell bei, und wenn der Wechsel ein neues Auth-Profil-Override mitbrachte, persistiert Cron
    dies ebenfalls vor dem Wiederholungsversuch.

    Zugehörige Auswahlregeln:

    - Gmail-Hook-Modell-Override gewinnt zuerst, wenn anwendbar.
    - Dann das `model` pro Job.
    - Dann ein gespeichertes Modell-Override der Cron-Sitzung.
    - Dann die normale Agent-/Standardmodellauswahl.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen
    bricht Cron ab, statt endlos zu schleifen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Cron jobs](/de/automation/cron-jobs), [cron CLI](/cli/cron).

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

    Native `openclaw skills install` schreibt in das `skills/`-Verzeichnis des aktiven Workspace.
    Installieren Sie die separate `clawhub`-CLI nur, wenn Sie eigene Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über Agents hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agents ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben geplant oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Doku: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien eingeschränkt, und Skills erscheinen nur dann im Systemprompt, wenn sie auf dem **Gateway-Host** geeignet sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie das Gating nicht überschreiben.

    Sie haben drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien existieren, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-node verwenden (ohne SSH).**
    Führen Sie das Gateway auf Linux aus, koppeln Sie einen macOS-node (Menubar-App) und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann macOS-only-Skills als geeignet behandeln, wenn die erforderlichen Binärdateien auf dem node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Always Ask“ wählen, fügt die Genehmigung „Always Allow“ in der Aufforderung diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien per SSH proxien (fortgeschritten).**
    Belassen Sie das Gateway auf Linux, aber lassen Sie die erforderlichen CLI-Binärdateien zu SSH-Wrappern auflösen, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill so, dass Linux erlaubt ist, damit er geeignet bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host auf `PATH` (zum Beispiel `~/bin/memo`).
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

  <Accordion title="Gibt es eine Notion- oder HeyGen-Integration?">
    Heute nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Kunde behalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite am Anfang einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, eröffnen Sie eine Feature-Anfrage oder bauen Sie einen Skill
    für diese APIs.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über Agents hinweg legen Sie sie unter `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert werden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das eingebaute Browserprofil `user`, das sich über Chrome DevTools MCP verbindet:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad ist host-lokal. Wenn das Gateway anderswo läuft, führen Sie entweder einen node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Grenzen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selektor-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Doku zu Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich volle Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher
    enthält es keine Systempakete, Homebrew oder gebündelte Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Doku: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen öffentlich/in einer Sandbox machen, mit einem Agenten?">
    Ja - wenn Ihr privater Traffic **DMs** sind und Ihr öffentlicher Traffic **Gruppen**.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, sodass Gruppen-/Channel-Sitzungen (Nicht-Hauptschlüssel) in Docker laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Schränken Sie dann über `tools.sandbox.tools` ein, welche Tools in Sandbox-Sitzungen verfügbar sind.

    Setup-Anleitung + Beispielkonfiguration: [Groups: personal DMs + public groups](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway configuration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + pro-Agent-Bindings werden zusammengeführt; pro-Agent-Bindings werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Escapes über Symlink-Eltern weiterhin fail-closed abgewiesen werden, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor der Kompaktierung** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor automatisch kompaktier wird. Dies läuft nur, wenn der Workspace
    schreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie mache ich sie dauerhaft?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Das ist noch ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Memories zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin vergisst, vergewissern Sie sich, dass das Gateway bei jedem Lauf
    denselben Workspace verwendet.

    Doku: [Memory](/de/concepts/memory), [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer bestehen? Was sind die Grenzen?">
    Memory-Dateien liegen auf dem Datenträger und bleiben bestehen, bis Sie sie löschen. Die Grenze ist Ihr
    Speicher, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das
    Kontextfenster des Modells begrenzt, daher können lange Konversationen kompaktieren oder abgeschnitten werden. Deshalb
    gibt es Memory-Suche - sie zieht nur die relevanten Teile zurück in den Kontext.

    Doku: [Memory](/de/concepts/memory), [Context](/de/concepts/context).

  </Accordion>

  <Accordion title="Erfordert semantische Memory-Suche einen OpenAI API key?">
    Nur, wenn Sie **OpenAI embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf embeddings, daher hilft **eine Anmeldung mit Codex (OAuth oder dem
    Codex-CLI-Login)** nicht bei semantischer Memory-Suche. OpenAI embeddings
    benötigen weiterhin einen echten API key (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit setzen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API key auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Env-Variablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) an. Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder local** - siehe [Memory](/de/concepts/memory) für Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf dem Datenträger liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **OpenClaws Zustand ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Remote aus Notwendigkeit:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/etc.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Footprint:** Durch die Verwendung lokaler Modelle bleiben Prompts auf Ihrem Rechner, aber Channel-
      Traffic läuft weiterhin über die Server des Channels.

    Verwandt: [Agent workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Path                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei der ersten Nutzung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API keys und optionale `keyRef`/`tokenRef`)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionales dateibasiertes Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge werden bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konversationsverlauf & Zustand (pro Agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Single-Agent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Workspace** (`AGENTS.md`, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder Legacy-Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, bestätigen Sie, dass das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Im Remote-Modus wird der Workspace des **Gateway-Hosts**
    verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, es **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub private). Das erfasst Memory + AGENTS-/SOUL-/USER-
    Dateien und ermöglicht es Ihnen, den „Geist“ des Assistenten später wiederherzustellen.

    Committen Sie **nichts** unter `~/.openclaw` (`credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Doku: [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die eigene Anleitung: [Uninstall](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agents außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder Sandbox-Einstellungen pro Agent. Wenn Sie
    möchten, dass ein Repository das Standard-Arbeitsverzeichnis ist, zeigen Sie für diesen Agenten mit
    `workspace` auf das Repository-Root. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten ausdrücklich, dass der Agent darin arbeitet.

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus arbeiten, liegt der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Session management](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Konfigurationsgrundlagen

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo liegt sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, werden halbwegs sichere Standardwerte verwendet (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt lauscht nichts / die UI sagt unauthorized'>
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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Authentifizierung nicht selbstständig.
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwortauthentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback, das dies maskiert).
    - Shared-Secret-Control-UI-Setups authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Bei `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse-Proxys auf demselben Host über loopback weiterhin **nicht** die trusted-proxy-Authentifizierung. Der trusted proxy muss eine konfigurierte nicht-loopback-Quelle sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt auch auf localhost ein Token?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Authentifizierungspfad konfiguriert ist, löst der Gateway-Start in den Token-Modus auf und generiert automatisch eins, speichert es in `gateway.auth.token`, sodass **lokale WS-Clients sich authentifizieren müssen**. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Authentifizierungspfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für nicht-loopback identity-aware reverse proxies `trusted-proxy`). Wenn Sie **wirklich** offenes loopback möchten, setzen Sie explizit `gateway.auth.mode: "none"` in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach Konfigurationsänderungen neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, bei kritischen neu starten
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

    - `off`: blendet Tagline-Text aus, behält aber die Banner-Titel-/Versionszeile.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Abruf)?">
    `web_fetch` funktioniert ohne API key. `web_search` hängt vom ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-key-Einrichtung.
    - Ollama Web Search ist ohne Schlüssel, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Env-Alternativen:

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

    Provider-spezifische Web-Search-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Firecrawl-Web-Fetch-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (außer es wird explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider aus verfügbaren Anmeldedaten. Heute ist der gebündelte Provider Firecrawl.
    - Daemons lesen Env-Variablen aus `~/.openclaw/.env` (oder der Service-Umgebung).

    Doku: [Web tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das künftig?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Wiederherstellung:

    - Aus Backup wiederherstellen (Git oder eine kopierte `~/.openclaw/openclaw.json`).
    - Wenn Sie kein Backup haben, `openclaw doctor` erneut ausführen und Channels/Modelle neu konfigurieren.
    - Wenn das unerwartet war, einen Bug melden und Ihre letzte bekannte Konfiguration oder ein Backup beifügen.
    - Ein lokaler Coding-Agent kann eine funktionierende Konfiguration oft aus Logs oder Verlauf rekonstruieren.

    Vermeidung:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Änderungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem genauen Pfad oder Feldschema nicht sicher sind; es gibt einen flachen Schema-Knoten plus unmittelbare Child-Zusammenfassungen zur weiteren Navigation zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; reservieren Sie `config.apply` nur für vollständiges Ersetzen der Konfiguration.
    - Wenn Sie das owner-only-Tool `gateway` aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-Aliassen `tools.bash.*`, die zu denselben geschützten exec-Pfaden normalisiert werden).

    Doku: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern auf mehreren Geräten?">
    Das gängige Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **nodes** und **agents**:

    - **Gateway (zentral):** besitzt Channels (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** separate Gehirne/Workspaces für spezielle Rollen (z. B. „Hetzner ops“, „Personal data“).
    - **Sub-Agents:** starten Hintergrundarbeit aus einem Haupt-Agenten heraus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und Agents/Sitzungen wechseln.

    Doku: [Nodes](/de/nodes), [Remote access](/de/gateway/remote), [Multi-Agent Routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [TUI](/web/tui).

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

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meiste Automatisierung (Formulare, Klicks, Scraping, Logins). Die wichtigsten Unterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie Visuals benötigen).
    - Einige Websites sind bei Automatisierung im Headless-Modus strenger (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter Headless-Sitzungen oft.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele in [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie propagieren Befehle zwischen Telegram, dem Gateway und nodes?">
    Telegram-Nachrichten werden vom **gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann nodes über das **Gateway-WebSocket** auf, wenn ein node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurzantwort: **Koppeln Sie Ihren Computer als node**. Das Gateway läuft anderswo, aber es kann
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über das Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Das Gateway auf dem always-on-Host ausführen (VPS/Home-Server).
    2. Den Gateway-Host + Ihren Computer in dasselbe Tailnet bringen.
    3. Sicherstellen, dass das Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Die macOS-App lokal öffnen und sich im Modus **Remote over SSH** verbinden (oder direkt per Tailnet),
       damit sie sich als node registrieren kann.
    5. Den node auf dem Gateway genehmigen:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; nodes verbinden sich über das Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-node erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Security](/de/gateway/security).

    Doku: [Nodes](/de/nodes), [Gateway protocol](/de/gateway/protocol), [macOS remote mode](/de/platforms/mac/remote), [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Channel-Health: `openclaw channels status`

    Verifizieren Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Doku: [Tailscale](/de/gateway/tailscale), [Remote access](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können sie auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden und dann Bot B wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und dabei einen Chat anvisiert, in dem der andere Bot
    lauscht. Wenn sich ein Bot auf einem Remote-VPS befindet, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote access](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Guardrail hinzu, damit die beiden Bots nicht endlos schleifen (nur bei Erwähnung,
    Channel-Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Doku: [Remote access](/de/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich separate VPSes für mehrere Agents?">
    Nein. Ein Gateway kann mehrere Agents hosten, jeweils mit eigenem Workspace, Modell-Standardwerten
    und Routing. Das ist das normale Setup und viel günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht gemeinsam nutzen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agents oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, auf meinem persönlichen Laptop einen node statt SSH von einem VPS zu verwenden?">
    Ja - nodes sind der First-Class-Weg, um von einem Remote-Gateway auf Ihren Laptop zuzugreifen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows via WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Raspberry-Pi-Klasse-Box ist ausreichend; 4 GB RAM sind reichlich), daher ist ein häufiges
    Setup ein always-on-Host plus Ihr Laptop als node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Device-Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch node-Allowlists/-Genehmigungen kontrolliert.
    - **Mehr Gerätetools.** Zusätzlich zu `system.run` stellen nodes `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Lassen Sie das Gateway auf einem VPS laufen, aber Chrome lokal über einen node-Host auf dem Laptop, oder binden Sie lokales Chrome auf dem Host über Chrome MCP an.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein gateway** laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Multiple gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS/Android-nodes oder macOS-„node mode“ in der Menubar-App). Für headless node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es einen API-/RPC-Weg, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Subtree mit seinem flachen Schema-Knoten, passendem UI-Hinweis und unmittelbaren Child-Zusammenfassungen prüfen, bevor geschrieben wird
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt)
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration, dann Neustart
    - Das owner-only-Laufzeittool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliasse `tools.bash.*` werden zu denselben geschützten exec-Pfaden normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine erste Installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Damit wird Ihr Workspace gesetzt und eingeschränkt, wer den Bot auslösen darf.

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
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway-Control-UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als node.
    3. **Genehmigen Sie den node** auf dem gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Doku: [Gateway protocol](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/exec) benötigen, fügen Sie ihn als
    **node** hinzu. Damit bleibt es bei einem einzelnen Gateway, und doppelte Konfigurationen werden vermieden. Lokale node-Tools sind
    derzeit nur auf macOS verfügbar, aber wir planen, sie auf weitere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur, wenn Sie **harte Isolation** oder zwei vollständig separate Bots benötigen.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env-Variablen und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env-Variablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - ein globales Fallback-`.env` aus `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Keine der `.env`-Dateien überschreibt bestehende Env-Variablen.

    Sie können auch Inline-Env-Variablen in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

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

  <Accordion title="Ich habe das Gateway über den Service gestartet, und meine Env-Variablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann geladen werden, wenn der Service Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie Shell-Import (opt-in-Komfortfunktion):

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

    Dies führt Ihre Login-Shell aus und importiert nur fehlende erwartete Schlüssel (überschreibt nie). Env-Variablen-Äquivalente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Env-Variablen fehlen - es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das auf eine dieser Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es Ihrem Konfigurationsblock `env` hinzu (wird nur angewendet, wenn es fehlt).

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
  <Accordion title="Wie starte ich eine neue Konversation?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Session management](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber das ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie einen positiven Wert, um Idle-Ablauf zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Leerlaufzeit eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden keine Transkripte gelöscht - es startet nur eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu bilden (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Sie können einen Koordinator-
    Agenten und mehrere Worker-Agents mit eigenen Workspaces und Modellen erstellen.

    Das ist allerdings eher als **spaßiges Experiment** zu sehen. Es ist token-intensiv und oft
    weniger effizient als ein Bot mit separaten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit unterschiedlichen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Doku: [Multi-agent routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in der Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Kompaktierung oder Abschneidung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn wieder einzulesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn das oft passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw komplett zurück, behalte es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie danach das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset** an, wenn es eine bestehende Konfiguration sieht. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Dev; löscht Dev-Konfiguration + Zugangsdaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme "context too large"-Fehler - wie setze ich zurück oder kompaktiere?'>
    Verwenden Sie eine dieser Möglichkeiten:

    - **Kompaktieren** (behält die Konversation, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Zurücksetzen** (frische Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn das weiterhin passiert:

    - Aktivieren oder justieren Sie **Sitzungs-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Doku: [Compaction](/de/concepts/compaction), [Session pruning](/de/concepts/session-pruning), [Session management](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Das ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schema-Änderung).

    Lösung: Starten Sie mit `/new` (eigenständige Nachricht) eine frische Sitzung.

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
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem, und das Modell entscheidet, was zu tun ist.

    Overrides pro Agent verwenden `agents.list[].heartbeat`. Doku: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn Sie darin sind.
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

  <Accordion title="Wie bekomme ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Logs mitverfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, etwa:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Doku: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot per @mention erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert, und die Gruppe ist nicht auf der Allowlist.

    Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direktchats kollabieren standardmäßig in die Hauptsitzung. Gruppen/Channels haben eigene Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Wachstum auf dem Datenträger:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Aufwand:** Auth-Profile, Workspaces und Channel-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Entfernen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn der Speicher wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent Routing**, um mehrere isolierte Agents auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agents gebunden werden.

    Browser-Zugriff ist mächtig, aber nicht „alles, was ein Mensch kann“ - Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host,
    oder verwenden Sie CDP auf dem Rechner, der den Browser tatsächlich ausführt.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die an diese Agents gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf ein node.

    Doku: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standardwerte, Auswahl, Aliasse, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    OpenClaws Standardmodell ist das, was Sie setzen als:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und fällt erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider-/Modell zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen. Sie sollten weiterhin **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    **Für tool-aktivierte oder Agents mit nicht vertrauenswürdiger Eingabe:** priorisieren Sie Modellstärke vor Kosten.
    **Für routinemäßige/gering kritische Chats:** verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agent-Rolle.

    MiniMax hat eigene Dokus: [MiniMax](/de/providers/minimax) und
    [Local models](/de/gateway/local-models).

    Faustregel: Verwenden Sie das **beste Modell, das Sie sich leisten können**, für Aufgaben mit hohem Einsatz und ein günstigeres
    Modell für Routinechats oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Models](/de/concepts/models) und
    [Sub-agents](/de/tools/subagents).

    Starke Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt
    Injection und unsicheres Verhalten. Siehe [Security](/de/gateway/security).

    Mehr Kontext: [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modell-Befehle** oder bearbeiten Sie nur die **Modell**-Felder. Vermeiden Sie vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, es sei denn, Sie möchten absichtlich die ganze Konfiguration ersetzen.
    Für RPC-Bearbeitungen zuerst mit `config.schema.lookup` prüfen und `config.patch` bevorzugen. Das Lookup-Payload gibt Ihnen den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und unmittelbare Child-Zusammenfassungen
    für partielle Aktualisierungen.
    Wenn Sie die Konfiguration doch überschrieben haben, stellen Sie sie aus dem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Doku: [Models](/de/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellste Einrichtung:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Ziehen Sie ein lokales Modell wie `ollama pull glm-4.7-flash`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Zum manuellen Wechsel verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt
    Injection. Wir empfehlen dringend **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn Sie dennoch kleine Modelle möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlists.

    Doku: [Ollama](/de/providers/ollama), [Local models](/de/gateway/local-models),
    [Model providers](/de/concepts/model-providers), [Security](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitssensitive/tool-aktivierte Agents verwenden Sie das stärkste Modell der neuesten Generation, das verfügbar ist.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle spontan (ohne Neustart)?">
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

    Sie können verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten nummerierten Picker. Wählen Sie per Nummer:

    ```
    /model 3
    ```

    Sie können außerdem ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche `auth-profiles.json`-Datei verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Es zeigt außerdem den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich ein mit @profile gesetztes Profil wieder?**

    Führen Sie `/model` erneut **ohne** das Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn aus `/model` (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 fürs Coden verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie nach Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` fürs Coden mit Codex OAuth.
    - **Standard + Wechsel:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4` und wechseln Sie beim Coden zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agents:** Routen Sie Coding-Aufgaben an Sub-Agents mit einem anderen Standardmodell.

    Siehe [Models](/de/concepts/models) und [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich fast mode für GPT 5.4?">
    Verwenden Sie entweder einen Sitzungs-Toggle oder einen Konfigurationsstandard:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** Setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch Codex OAuth:** Wenn Sie zusätzlich `openai-codex/gpt-5.4` verwenden, setzen Sie dort dasselbe Flag.

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

    Für OpenAI wird fast mode bei unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzungs-Overrides mit `/fast` haben Vorrang vor Konfigurationsstandardwerten.

    Siehe [Thinking and fast mode](/de/tools/thinking) und [OpenAI fast mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Die Auswahl eines Modells, das nicht in dieser Liste steht, gibt zurück:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Allowlist oder wählen Sie ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf eine aktuelle OpenClaw-Version (oder führen Sie aus dem Source `main` aus), und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Authentifizierung
       in env/Auth-Profilen existiert, sodass der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (groß-/kleinschreibungssensitiv) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-key-
       Setup oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führen Sie aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste aus (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Models](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie Modelle **pro Sitzung**, wenn nötig.
    Fallbacks sind für **Fehler**, nicht für „schwierige Aufgaben“, also verwenden Sie `/model` oder einen separaten Agenten.

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

    - Agent A Standard: MiniMax
    - Agent B Standard: OpenAI
    - Nach Agent routen oder mit `/agent` wechseln

    Doku: [Models](/de/concepts/models), [Multi-Agent Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt eingebaute Kurzbefehle?">
    Ja. OpenClaw liefert einige Standard-Kürzel aus (werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

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

  <Accordion title="Wie definiere/überschreibe ich Modell-Kurzbefehle (Aliasse)?">
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

    Dann löst `/model sonnet` (oder `/<alias>`, wenn unterstützt) in diese Modell-ID auf.

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

    Wenn Sie einen Provider/ein Modell referenzieren, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Auth-Fehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Speicher hat. Authentifizierung ist pro Agent und
    wird gespeichert in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Optionen zur Behebung:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie Authentifizierung im Assistenten.
    - Oder kopieren Sie `auth-profiles.json` aus dem `agentDir` des Haupt-Agenten in das `agentDir` des neuen Agenten.

    Verwenden Sie **nicht** dasselbe `agentDir` für mehrere Agents; das verursacht Auth-/Sitzungskollisionen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und "All models failed"

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Auth-Profil-Rotation** innerhalb desselben Providers.
    2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider rate-limitiert ist oder vorübergehend fehlschlägt.

    Der Rate-Limit-Bucket umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfensterlimits (`weekly/monthly limit reached`) als Failover-würdige
    Ratenlimits.

    Einige Antworten, die wie Billing aussehen, sind nicht `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider bei
    `401` oder `403` expliziten Billing-Text zurückgibt, kann OpenClaw das weiterhin im
    Billing-Pfad halten, aber provider-spezifische Text-Matcher bleiben auf den
    jeweiligen Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Nachricht stattdessen wie ein wiederholbares Nutzungsfenster oder
    Organisations-/Workspace-Spend-Limit aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dies als
    `rate_limit`, nicht als lange Billing-Deaktivierung.

    Context-Overflow-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Pfad für Kompaktierung/Wiederholung, statt den Modell-
    Fallback vorzuschieben.

    Generischer Server-Fehlertext ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-be