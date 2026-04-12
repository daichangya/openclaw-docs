---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Runtime-Support
    - Ersteinschätzung von von Nutzern gemeldeten Problemen vor einer tiefergehenden Fehlersuche
summary: Häufig gestellte Fragen zu Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-12T23:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2a78d0fea9596625cc2753e6dc8cc42c2379a3a0c91729265eee0261fe53eaa
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Runtime-Diagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agenten/Sitzungen, Provider-Konfiguration + Runtime-Probleme (wenn das Gateway erreichbar ist).

2. **Teilbarer Bericht (sicher zu teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Runtime vs. RPC-Erreichbarkeit, die Ziel-URL der Probe und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefgehende Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gesundheitsprobe des Gateway aus, einschließlich Channel-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, greifen Sie stattdessen auf Folgendes zurück:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind getrennt von Servicelogs; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

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
  <Accordion title="Ich hänge fest – was ist der schnellste Weg, wieder weiterzukommen?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind,
    die entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, Ihr Setup auf Rechner-Ebene
    zu reparieren (PATH, Services, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen ausgecheckten Quellcode**
    über die hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code + die Dokumentation lesen und
    über die exakte Version nachdenken kann, die Sie ausführen. Sie können jederzeit wieder auf stable wechseln,
    indem Sie das Installationsprogramm ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung **zu planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter zu prüfen.

    Wenn Sie einen echten Fehler oder Fix entdecken, eröffnen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot von Gateway-/Agent-Gesundheit + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Gründe für das Überspringen?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten active-hours-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres/auf Header beschränktes Gerüst
    - `no-tasks-due`: Der Task-Modus von `HEARTBEAT.md` ist aktiv, aber noch keines der Task-Intervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Task-Modus werden Fälligkeitszeitstempel erst nach einem echten Heartbeat-Lauf
    aktualisiert. Übersprungene Läufe markieren Tasks nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zum Installieren und Einrichten von OpenClaw">
    Das Repo empfiehlt, aus dem Quellcode zu arbeiten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch erstellen. Nach dem Onboarding führen Sie das Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Ausführen automatisch
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie es mit `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet Ihren Browser direkt nach dem Onboarding mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab offen; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generieren Sie ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bind auf loopback beibehalten, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` den Wert `true` hat, erfüllen Identitäts-Header die Authentifizierung von Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst private-ingress `none` oder HTTP-Authentifizierung über einen trusted-proxy.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass bereits der zweite fehlerhafte Versuch `retry later` anzeigen kann.
    - **Tailnet-Bind**: `openclaw gateway --bind tailnet --token "<token>"` ausführen (oder Passwort-Authentifizierung konfigurieren), `http://<tailscale-ip>:18789/` öffnen und dann das passende Shared Secret in die Dashboard-Einstellungen einfügen.
    - **Identity-aware Reverse Proxy**: Das Gateway hinter einem nicht-loopback trusted-proxy belassen, `gateway.auth.mode: "trusted-proxy"` konfigurieren und dann die Proxy-URL öffnen.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web-Oberflächen](/web) für Details zu Bind-Modi und Authentifizierung.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Channel zu einem nativen Genehmigungs-Client für Exec-Genehmigungen

    Die Exec-Richtlinie des Hosts ist weiterhin die eigentliche Genehmigungsschranke. Die Chat-Konfiguration steuert nur, wo Genehmigungs-
    aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beide:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Genehmigende sicher ableiten kann, aktiviert OpenClaw nun automatisch native DM-first-Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen in den ursprünglichen Raum/das ursprüngliche Thema zurückgepostet werden.
    - Plugin-Genehmigungen sind noch einmal getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Weiterleiten, und nur einige native Channels behalten darüber hinaus die native Handhabung von Plugin-Genehmigungen bei.

    Kurz gesagt: Weiterleitung ist fürs Routing, die native Client-Konfiguration für eine reichhaltigere channel-spezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – in der Dokumentation sind **512 MB–1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für den persönlichen Gebrauch angegeben, und es wird darauf hingewiesen, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie mehr Reserve möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Channels/Skills und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf merkwürdige Probleme mit Binärdateien stoßen, ist das meist ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei „wake up my friend“ / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet beim
    ersten Schlüpfen auch automatisch „Wake up, my friend!“. Wenn Sie diese Zeile sehen und **keine Antwort**
    erhalten und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Gateway neu starten:

    ```bash
    openclaw gateway restart
    ```

    2. Status + Auth prüfen:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es weiterhin hängt, ausführen:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding erneut durchzuführen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Workspace** und führen Sie dann einmal Doctor aus. So
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Channel-
    Zustand), solange Sie **beide** Speicherorte kopieren:

    1. OpenClaw auf dem neuen Rechner installieren.
    2. `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner kopieren.
    3. Ihren Workspace kopieren (Standard: `~/.openclaw/workspace`).
    4. `openclaw doctor` ausführen und den Gateway-Service neu starten.

    Das bewahrt Konfiguration, Auth-Profile, WhatsApp-Zugangsdaten, Sitzungen und Memory. Wenn Sie im
    Remote-Modus arbeiten, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#wo-dinge-auf-der-festplatte-liegen),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Einträge sind nach **Highlights**, **Änderungen** und
    **Fehlerbehebungen** gruppiert (plus Doku-/sonstige Abschnitte, falls nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es dann erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, ist die Dokumentation auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine separaten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine stable-Veröffentlichung zuerst auf **beta**, dann verschiebt ein expliziter
    Promotionsschritt genau diese Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion auf **dieselbe Version**
    zeigen.

    Sehen Sie nach, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen beta und dev finden Sie im Accordion unten.

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

    Weitere Details: [Entwicklungskanäle](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Änderungen aus?">
    Zwei Optionen:

    1. **Dev-Kanal (git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechseln Sie zum Branch `main` und aktualisieren aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und dann per git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone erstellen möchten, verwenden Sie:

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
    Grobe Richtwerte:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, abhängig davon, wie viele Channels/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt?](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife unter [Ich hänge fest](#quick-start-and-first-run-setup).

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

    Entsprechung für Windows (PowerShell):

    ```powershell
    # install.ps1 hat noch kein eigenes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation wird git not found angezeigt oder openclaw wird nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie den Installer dann erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach dem Aktualisieren von PATH erneut.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Exec-Ausgabe unter Windows zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Das ist normalerweise ein Codepage-Mismatch der Konsole in nativen Windows-Shells.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` rendert Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schneller Workaround in PowerShell:

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

    Wenn Sie dies weiterhin mit der neuesten OpenClaw-Version reproduzieren können, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git-)Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installation](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurz gesagt: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir haben einen **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie also den Host als Source of Truth und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um
    auf lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes-CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurz gesagt: **möglich, aber nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung verloren geht), benötigt möglicherweise einen sauberen git-Checkout und
    kann eine Bestätigung anfordern. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

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

    Dokumentation: [Update](/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - Speicherort des **Workspace** + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Channel-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd user unit auf Linux/WSL2)
    - **Health-Prüfungen** und Auswahl von **Skills**

    Es warnt auch, wenn Ihr konfiguriertes Modell unbekannt ist oder Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeiter
      haben uns gesagt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Verwendung von `claude -p`
      als für diese Integration zulässig, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin das
    besser vorhersagbare Setup. OpenAI Codex OAuth wird für externe
    Tools wie OpenClaw ausdrücklich unterstützt.

    OpenClaw unterstützt auch andere gehostete abonnementartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich Claude Max ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass die Claude-CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` als zulässig
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    das am besten vorhersagbare serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration
    als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.

    Das Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads ist Anthropic-API-Schlüssel-Auth weiterhin die
    sicherere, besser vorhersagbare Wahl. Wenn Sie andere gehostete abonnementartige
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 `rate_limit_error` von Anthropic?">
Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
**Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
auf Nutzung/Abrechnung und erhöhen Sie die Limits nach Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Context-Beta von Anthropic (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider ratenbegrenzt ist.
    Siehe [Modelle](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten Provider **Amazon Bedrock (Converse)**. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten Provider `amazon-bedrock` zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Auth?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt das Standardmodell bei Bedarf auf `openai-codex/gpt-5.4`. Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum schaltet ChatGPT GPT-5.4 `openai/gpt-5.4` in OpenClaw nicht frei?">
    OpenClaw behandelt die beiden Wege getrennt:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = direkte OpenAI-Platform-API

    In OpenClaw ist die ChatGPT/Codex-Anmeldung mit dem Pfad `openai-codex/*` verbunden,
    nicht mit dem direkten Pfad `openai/*`. Wenn Sie in
    OpenClaw den direkten API-Pfad möchten, setzen Sie `OPENAI_API_KEY` (oder die entsprechende OpenAI-Provider-Konfiguration).
    Wenn Sie ChatGPT/Codex-Anmeldung in OpenClaw möchten, verwenden Sie `openai-codex/*`.

  </Accordion>

  <Accordion title="Warum können sich die Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    `openai-codex/*` verwendet den Codex-OAuth-Pfad, und seine nutzbaren Kontingentfenster werden
    von OpenAI verwaltet und hängen vom Plan ab. In der Praxis können sich diese Limits von
    der Erfahrung auf der ChatGPT-Website/-App unterscheiden, selbst wenn beide an dasselbe Konto gebunden sind.

    OpenClaw kann die aktuell sichtbaren Nutzungs-/Kontingentfenster des Providers in
    `openclaw models status` anzeigen, erfindet oder normalisiert jedoch keine ChatGPT-Web-
    Berechtigungen in direkten API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchten, verwenden Sie `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Auth (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Abonnement-OAuth** vollständig.
    OpenAI erlaubt die Nutzung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Ablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Gemini CLI lokal installieren, sodass `gemini` im `PATH` ist
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin aktivieren: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    Meistens nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn Sie es dennoch müssen, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko von Prompt-Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich den Traffic gehosteter Modelle in einer bestimmten Region?">
    Wählen Sie regional festgelegte Endpunkte. OpenRouter stellt in den USA gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben aufführen, indem Sie `models.mode: "merge"` verwenden, damit Fallbacks verfügbar bleiben, während der von Ihnen gewählte regionale Provider berücksichtigt wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Homeserver oder eine Box der Raspberry-Pi-Klasse funktioniert.

    Sie brauchen einen Mac nur **für reine macOS-Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere reine macOS-Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein –
    jeder Mac funktioniert. Verwenden Sie für iMessage **[BlueBubbles](/de/channels/bluebubbles)** (empfohlen) – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Gateway auf Linux/VPS ausführen und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Alles auf dem Mac ausführen, wenn Sie das einfachste Setup auf einem einzelnen Rechner möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Runtime-Bugs, besonders bei WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie das auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in `allowFrom`?">
    `channels.telegram.allowFrom` ist **die Telegram-User-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Onboarding akzeptiert `@username` als Eingabe und löst ihn in eine numerische ID auf, aber die OpenClaw-Autorisierung verwendet nur numerische IDs.

    Sicherer (ohne Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Sender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast-Chat“-Agenten und einen „Opus für Coding“-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Eine Beispielkonfiguration finden Sie unter [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnellsetup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen außerdem gängige Benutzer-Bin-Verzeichnisse unter Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn gesetzt.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und `npm install`">
    - **Hackbare (git-)Installation:** vollständiger Quellcode-Checkout, bearbeitbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **`npm install`:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen von npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen `npm`- und git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Service auf den neuen Einstiegspunkt zeigt.
    Dabei werden **Ihre Daten nicht gelöscht** – es wird nur die OpenClaw-Code-Installation geändert. Ihr Zustand
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

    Doctor erkennt einen Gateway-Service-Einstiegspunkt-Mismatch und bietet an, die Service-Konfiguration passend zur aktuellen Installation neu zu schreiben (in der Automatisierung `--repair` verwenden).

    Tipps für Backups: siehe [Backup-Strategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurz gesagt: **Wenn Sie 24/7-Zuverlässigkeit wollen, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung wollen und mit Ruhezustand/Neustarts leben können, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster in Echtzeit.
    - **Nachteile:** Ruhezustand/Netzwerkabbrüche = Verbindungsabbrüche, Betriebssystem-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer an, stabiles Netzwerk, keine Laptop-Ruhezustandsprobleme, einfacher dauerhaft am Laufen zu halten.
    - **Nachteile:** läuft oft headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Sie müssen für Updates per SSH zugreifen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren auf einem VPS alle einwandfrei. Der einzige echte Kompromiss ist **Headless-Browser** vs. sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** immer an, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, einfacher dauerhaft am Laufen zu halten.
    - **Geteilter Laptop/Desktop:** völlig in Ordnung zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner in den Ruhezustand geht oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten wollen, lassen Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitshinweise lesen Sie [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein einfaches Gateway + einen Chat-Channel:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Channels). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar und mit genügend
    RAM für das Gateway und alle aktivierten Channels ausgestattet sein.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Channels, Browser-Automatisierung oder Medien-Tools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows arbeiten, ist **WSL2 das einfachste VM-artige Setup** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + eine Live-Canvas bereitstellen. Das **Gateway** ist die Always-on-Control-Plane; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Value Proposition">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **lokale Control Plane**, die es Ihnen ermöglicht, einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** auszuführen, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Tools – ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo immer Sie möchten (Mac, Linux, VPS), und behalten Sie den
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw., mit agentenspezifischem Routing
      und Failover.
    - **Rein lokale Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** separate Agenten pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und hackbar:** prüfen, erweitern und selbst hosten, ohne Vendor Lock-in.

    Dokumentation: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App als Prototyp entwickeln (Struktur, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agenten für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen Ihres Posteingangs, Kalenders und der für Sie wichtigen Nachrichten.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** Cron- oder Heartbeat-gesteuerte Anstöße und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Web-Aufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach oder Anzeigentexte schreiben.

    Bei **Outreach oder Anzeigenläufen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw Entwürfe erstellen zu lassen und Sie erteilen die Freigabe.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für die schnellste direkte Coding-Schleife in einem Repo. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on-Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo dauerhaft verändert zu halten?">
    Verwenden Sie verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin Vorrang vor gebündelten Skills haben, ohne git anzufassen. Wenn Sie den Skill global installiert, aber nur für bestimmte Agenten sichtbar halten möchten, legen Sie die gemeinsame Kopie in `~/.openclaw/skills` ab und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die sich für Upstream eignen, sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig in `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agenten sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für unterschiedliche Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agenten**: Leiten Sie Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agenten** für lange oder parallele Aufgaben. Sub-Agenten laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „für diese Aufgabe einen Sub-Agenten zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agenten verbrauchen beide Tokens. Wenn die Kosten ein Thema sind, setzen Sie ein
    günstigeres Modell für Sub-Agenten über `agents.defaults.subagents.model`.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Sub-Agent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an einen Sub-Agenten oder ein Sitzungsziel binden, sodass Folge-Nachrichten in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Mit `sessions_spawn` und `thread: true` starten (und optional `mode: "session"` für persistente Folge-Nachrichten).
    - Oder manuell mit `/focus <target>` binden.
    - Mit `/agents` den Bindungsstatus prüfen.
    - Mit `/session idle <duration|off>` und `/session max-age <duration|off>` das automatische Lösen des Fokus steuern.
    - Mit `/unfocus` den Thread trennen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: `channels.discord.threadBindings.spawnSubagentSessions: true` setzen.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent ist fertig geworden, aber die Abschlussmeldung ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung von Sub-Agenten im Completion-Modus bevorzugt jede gebundene Thread- oder Unterhaltungsroute, wenn eine existiert.
    - Wenn der Abschlussursprung nur einen Channel enthält, greift OpenClaw auf die gespeicherte Route der Anforderer-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung trotzdem erfolgreich sein kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt stattdessen auf die Zustellung über die Sitzungswarteschlange zurück, anstatt sofort in den Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Queue-Fallback oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistant-Antwort des Childs genau das stille Token `NO_REPLY` / `no_reply` oder genau `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn beim Child nach nur Tool-Aufrufen ein Timeout auftrat, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe erneut wiederzugeben.

    Debugging:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungs-Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Ruhezustand/keine Neustarts).
    - Überprüfen Sie die Zeitzoneneinstellungen für den Job (`--tz` vs. Host-Zeitzone).

    Debugging:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Channel gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, aber die Zugangsdaten dies blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Zustellung über den Queue-Fallback.

    Bei isolierten Cron-Jobs ist der Runner für die endgültige Zustellung zuständig. Vom Agenten wird erwartet,
    dass er eine Klartext-Zusammenfassung zurückgibt, die der Runner senden kann. `--no-deliver` hält
    dieses Ergebnis intern; es erlaubt dem Agenten stattdessen nicht, direkt mit dem
    Nachrichtentool zu senden.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, nicht doppelte Planung.

    Isolierter Cron kann eine Runtime-Modellübergabe persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und wenn der Wechsel ein neues Auth-Profil-Override mitbrachte, persistiert Cron
    dieses ebenfalls vor dem erneuten Versuch.

    Zugehörige Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn zutreffend.
    - Dann job-spezifisches `model`.
    - Dann jedes gespeicherte Cron-Sitzungsmodell-Override.
    - Dann die normale Agent-/Standardmodell-Auswahl.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos zu schleifen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Workspace ab. Die macOS-Skills-UI ist unter Linux nicht verfügbar.
    Skills durchsuchen unter [https://clawhub.ai](https://clawhub.ai).

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
    Verzeichnis des aktiven Workspace. Installieren Sie die separate `clawhub`-CLI nur, wenn Sie Ihre eigenen Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über mehrere Agenten hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg bestehen).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Tasks](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich reine Apple-macOS-Skills von Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien gesteuert, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden reine `darwin`-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, Sie überschreiben dieses Gating.

    Es gibt drei unterstützte Muster:

    **Option A – Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux aus im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B – einen macOS-Node verwenden (ohne SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann reine macOS-Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie „Always Ask“ wählen, fügt die Bestätigung von „Always Allow“ in der Aufforderung diesen Befehl zur Allowlist hinzu.

    **Option C – macOS-Binärdateien über SSH proxyen (fortgeschritten).**
    Behalten Sie das Gateway unter Linux, sorgen Sie aber dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Überschreiben Sie dann den Skill so, dass Linux erlaubt ist, damit er zulässig bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI unter macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Notion- oder HeyGen-Integration?">
    Heute nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und anfälliger.

    Wenn Sie den Kontext pro Kunde behalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, eröffnen Sie eine Feature-Anfrage oder erstellen Sie einen Skill
    für diese APIs.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über mehrere Agenten hinweg legen Sie sie unter `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

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

    Dieser Pfad ist host-lokal. Wenn das Gateway woanders läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selector-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein Roh-CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Dokumentation zum Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an – wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist auf Sicherheit ausgelegt und läuft als Benutzer `node`, daher enthält es
    keine Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistent ist.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, aber Gruppen öffentlich/sandboxed mit einem Agenten machen?">
    Ja – wenn Ihr privater Traffic **DMs** und Ihr öffentlicher Traffic **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, sodass Gruppen-/Channel-Sitzungen (Nicht-Hauptschlüssel) in Docker laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Beschränken Sie dann mit `tools.sandbox.tools`, welche Tools in sandboxed Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Zentrale Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + agentenspezifische Bindings werden zusammengeführt; agentenspezifische Bindings werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Ausbrüche über symlink-Eltern weiterhin fail-closed fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Prüfungen erlaubter Roots auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor der Pre-Compaction** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft
    nur, wenn der Workspace beschreibbar ist (schreibgeschützte Sandboxes überspringen dies). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie sorge ich dafür, dass es erhalten bleibt?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Memories zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin Dinge vergisst, prüfen Sie, ob das Gateway bei jedem
    Lauf denselben Workspace verwendet.

    Dokumentation: [Memory](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Was sind die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Modell-
    Kontextfenster begrenzt, daher können lange Unterhaltungen compaction oder gekürzt werden. Deshalb
    gibt es die Memory-Suche – sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Memory](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt semantische Memory-Suche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder die
    Codex-CLI-Anmeldung)** nicht bei semantischer Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, sonst Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) an. Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder local** – siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein – **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie an sie senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider senden (Anthropic/OpenAI/etc.), gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Footprint:** Durch die Verwendung lokaler Modelle bleiben Prompts auf Ihrem Rechner, aber Channel-
      Traffic läuft weiterhin über die Server des jeweiligen Channels.

    Verwandt: [Agent-Workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Path                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (wird bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optionale `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionaler dateibasierter Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge entfernt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agentenspezifischer Zustand (agentDir + Sitzungen)                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Unterhaltungsverlauf & Zustand (pro Agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Einzelagent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Workspace** (`AGENTS.md`, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten `AGENTS.md` / `SOUL.md` / `USER.md` / `MEMORY.md` liegen?">
    Diese Dateien gehören in den **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder Legacy-Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State-Dir (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Im Remote-Modus wird der Workspace des **Gateway-Hosts**
    verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine dauerhafte Präferenz möchten, bitten Sie den Bot, es **in
    `AGENTS.md` oder `MEMORY.md` zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent-Workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in ein **privates** git-Repo und sichern Sie ihn
    an einem privaten Ort (zum Beispiel GitHub private). Dadurch werden Memory + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (`credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die eigene Anleitung: [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repo das Standard-Arbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf das Root des Repos. Das OpenClaw-Repo ist nur Quellcode; halten Sie den
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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der relevante Sitzungsspeicher auf dem entfernten Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Konfigurationsgrundlagen

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo liegt sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, werden relativ sichere Standardwerte verwendet (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe `gateway.bind: "lan"` (oder `"tailnet"`) gesetzt und jetzt lauscht nichts / die UI zeigt unauthorized'>
    Nicht-loopback-Binds **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Auth: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten nicht-loopback identity-aware Reverse Proxy

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
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Authentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback, der das maskiert).
    - Shared-Secret-Control-UI-Setups authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in den App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen gleichhostige loopback-Reverse-Proxys die trusted-proxy-Authentifizierung weiterhin **nicht**. Der trusted proxy muss eine konfigurierte nicht-loopback-Quelle sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt auf localhost ein Token?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird beim Start des Gateway der Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird, sodass **lokale WS-Clients sich authentifizieren müssen**. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für nicht-loopback identity-aware Reverse Proxys `trusted-proxy`). Wenn Sie **wirklich** ein offenes loopback möchten, setzen Sie `gateway.auth.mode: "none"` explizit in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, bei kritischen Änderungen neu starten
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

    - `off`: blendet den Tagline-Text aus, behält aber die Banner-Titel-/Versionszeile.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Webabruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search benötigt keinen Schlüssel, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Schlüssel, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
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
              provider: "firecrawl", // optional; weglassen für automatische Erkennung
            },
          },
        },
    }
    ```

    Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-Provider-Pfade unter `tools.web.search.*` werden vorübergehend weiterhin aus Kompatibilitätsgründen geladen, sollten aber für neue Konfigurationen nicht verwendet werden.
    Die Fallback-Konfiguration für Firecrawl-Webabruf liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider anhand der verfügbaren Zugangsdaten. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder der Service-Umgebung).

    Dokumentation: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="`config.apply` hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das künftig?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Wiederherstellung:

    - Aus einem Backup wiederherstellen (git oder eine kopierte `~/.openclaw/openclaw.json`).
    - Wenn Sie kein Backup haben, führen Sie `openclaw doctor` erneut aus und konfigurieren Channels/Modelle neu.
    - Wenn das unerwartet war, melden Sie einen Bug und fügen Sie Ihre letzte bekannte Konfiguration oder ein vorhandenes Backup bei.
    - Ein lokaler Coding-Agent kann oft anhand von Logs oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    So vermeiden Sie es:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem exakten Pfad oder der Form eines Feldes nicht sicher sind; es gibt einen flachen Schema-Knoten plus Zusammenfassungen der direkten Childs für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; behalten Sie `config.apply` nur für den vollständigen Ersatz der Konfiguration.
    - Wenn Sie das nur für Eigentümer verfügbare Tool `gateway` aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibzugriffe auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-Aliase `tools.bash.*`, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Konfiguration](/cli/config), [Configure](/cli/configure), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das gängige Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** besitzt Channels (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** separate Köpfe/Workspaces für spezielle Rollen (z. B. „Hetzner ops“, „Personal data“).
    - **Sub-Agenten:** starten Hintergrundarbeit von einem Hauptagenten aus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und zwischen Agenten/Sitzungen wechseln.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/web/tui).

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

    Standard ist `false` (mit sichtbarem Browser). Headless löst auf einigen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meiste Automatisierung (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Informationen benötigen).
    - Manche Websites sind bei Automatisierung im Headless-Modus strenger (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für Browser-Steuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
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

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Gateway auf dem Always-on-Host ausführen (VPS/Home-Server).
    2. Gateway-Host und Ihren Computer in dasselbe Tailnet bringen.
    3. Sicherstellen, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Die macOS-App lokal öffnen und im Modus **Remote over SSH** verbinden (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Den Node auf dem Gateway genehmigen:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Durch das Koppeln eines macOS-Node wird `system.run` auf diesem Rechner ermöglicht. Koppeln
    Sie nur Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Channel-Health: `openclaw channels status`

    Prüfen Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine integrierte „Bot-zu-Bot“-Bridge, aber Sie können das auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden und Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und dabei einen Chat ansteuert, auf den der andere Bot
    hört. Wenn ein Bot auf einem entfernten VPS läuft, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Schutzmaßnahme hinzu, damit die beiden Bots nicht endlos in einer Schleife antworten (nur bei Erwähnung, Channel-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agenten separate VPS?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Workspace, eigenen Modell-Standards
    und eigenem Routing. Das ist das normale Setup und deutlich günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwenden Sie separate VPS nur dann, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht gemeinsam nutzen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, auf meinem persönlichen Laptop einen Node zu verwenden statt SSH von einem VPS aus?">
    Ja – Nodes sind der erstklassige Weg, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Box der Raspberry-Pi-Klasse reicht aus; 4 GB RAM sind mehr als genug), daher ist ein gängiges
    Setup ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und nutzen Device Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch Node-Allowlists/Genehmigungen gesteuert.
    - **Mehr Geräte-Tools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalten Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder verbinden Sie sich auf dem Host über Chrome MCP mit lokalem Chrome.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind einfacher für laufende Agent-Workflows und
    Geräteautomatisierung.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie betreiben absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node-Host-CLI](/cli/node).

    Ein vollständiger Neustart ist für Änderungen an `gateway`, `discovery` und `canvasHost` erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Knoten, passendem UI-Hinweis und Zusammenfassungen der direkten Childs vor dem Schreiben prüfen
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); Hot-Reload, wenn möglich, und Neustart, wenn erforderlich
    - `config.apply`: validieren + die vollständige Konfiguration ersetzen; Hot-Reload, wenn möglich, und Neustart, wenn erforderlich
    - Das nur für Eigentümer verfügbare Runtime-Tool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliase `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimale sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dadurch wird Ihr Workspace festgelegt und eingeschränkt, wer den Bot auslösen darf.

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

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Sicherstellen, dass VPS + Mac im selben Tailnet sind**.
    2. **Die macOS-App im Remote-Modus verwenden** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Den Node** auf dem Gateway genehmigen:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. So behalten Sie ein einzelnes Gateway und vermeiden doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur dann, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und `.env`-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - ein globales Fallback-`.env` aus `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt vorhandene Umgebungsvariablen.

    Sie können auch Inline-Umgebungsvariablen in der Konfiguration definieren (werden nur angewendet, wenn sie im Prozess-Env fehlen):

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

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann geladen werden, wenn der Service Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (optionale Komfortfunktion):

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Entsprechende Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe `COPILOT_GITHUB_TOKEN` gesetzt, aber `models status` zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen – es bedeutet nur, dass OpenClaw Ihre
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Lösen Sie das auf eine dieser Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es zu Ihrem Konfigurationsblock `env` hinzu (wird nur angewendet, wenn es fehlt).

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

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie `/new` sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber dies ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie einen positiven Wert, um das Ablaufverhalten bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsdauer eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden Transkripte nicht gelöscht – es wird nur eine neue Sitzung gestartet.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu erstellen (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agenten**. Sie können einen Koordinator-
    Agenten und mehrere Worker-Agenten mit eigenen Workspaces und Modellen erstellen.

    Dennoch ist das am besten als **unterhaltsames Experiment** zu sehen. Es verbraucht viele Tokens und ist oft
    weniger effizient, als einen Bot mit getrennten Sitzungen zu verwenden. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agenten starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agenten-CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut einzulesen.
    - Verwenden Sie Sub-Agenten für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, behalte es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Das Onboarding bietet ebenfalls **Reset** an, wenn es eine bestehende Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Verzeichnis zurück (Standards sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur dev; löscht Dev-Konfiguration + Zugangsdaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme Fehler wie "context too large" – wie setze ich zurück oder compakte?'>
    Verwenden Sie eines davon:

    - **Compaction** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

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

    - Aktivieren oder justieren Sie **Session Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu trimmen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Validierungsfehler des Providers: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet in der Regel, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Änderung an Tool/Schema).

    Lösung: Starten Sie mit `/new` (eigenständige Nachricht) eine neue Sitzung.

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30 Min.** (**1 Std.** bei Verwendung von OAuth-Authentifizierung). Passen Sie sie an oder deaktivieren Sie sie:

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

    Wenn `HEARTBEAT.md` existiert, aber faktisch leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Agentenspezifische Overrides verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, daher kann OpenClaw die Gruppe sehen, wenn Sie darin sind.
    Standardmäßig sind Gruppenantworten blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

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

  <Accordion title="Wie erhalte ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Logs verfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot per @mention erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht auf der Allowlist.

    Siehe [Groups](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads den Kontext mit DMs?">
    Direkte Chats werden standardmäßig auf die Hauptsitzung zusammengeführt. Gruppen/Channels haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Groups](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine festen Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf Folgendes:

    - **Wachsender Speicherverbrauch:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** agentenspezifische Auth-Profile, Workspaces und Channel-Routing.

    Tipps:

    - Behalten Sie pro Agent einen **aktiven** Workspace (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn der Speicherplatz wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agenten gebunden werden.

    Browserzugriff ist leistungsfähig, aber nicht „alles, was ein Mensch kann“ – Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die an diese Agenten gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf einen Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standards, Auswahl, Aliase, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was Sie setzen als:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und greift erst dann als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen veralteten entfernten Provider-Standard anzuzeigen. Sie sollten dennoch **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    **Für Agenten mit Tools oder nicht vertrauenswürdigen Eingaben:** Stellen Sie Modellstärke über Kosten.
    **Für routinemäßige/risikoarme Chats:** Verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agentenrolle.

    MiniMax hat eigene Dokumentation: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwenden Sie für risikoreiche Arbeit das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agenten verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Sub-Agenten](/de/tools/subagents).

    Deutliche Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt-
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modellbefehle** oder bearbeiten Sie nur die **Modell**-Felder. Vermeiden Sie vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, es sei denn, Sie möchten absichtlich die gesamte Konfiguration ersetzen.
    Für RPC-Bearbeitungen prüfen Sie zuerst mit `config.schema.lookup` und bevorzugen `config.patch`. Die Lookup-Payload liefert Ihnen den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und Zusammenfassungen der direkten Childs.
    für partielle Aktualisierungen.
    Wenn Sie die Konfiguration überschrieben haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Dokumentation: [Modelle](/de/concepts/models), [Configure](/cli/configure), [Konfiguration](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbstgehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg zu lokalen Modellen.

    Schnellstes Setup:

    1. Ollama von `https://ollama.com/download` installieren
    2. Ein lokales Modell ziehen, z. B. `ollama pull gemma4`
    3. Wenn Sie auch Cloud-Modelle möchten, `ollama signin` ausführen
    4. `openclaw onboard` ausführen und `Ollama` wählen
    5. `Local` oder `Cloud + Local` auswählen

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Für manuelles Wechseln verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt-
    Injection. Für jeden Bot, der Tools verwenden kann, empfehlen wir dringend **große Modelle**.
    Wenn Sie dennoch kleine Modelle verwenden möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlists.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Runtime-Einstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitssensible/toolfähige Agenten verwenden Sie das stärkste verfügbare Modell der neuesten Generation.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle on the fly (ohne Neustart)?">
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

    Dies sind die integrierten Aliase. Benutzerdefinierte Aliase können über `agents.defaults.models` hinzugefügt werden.

    Sie können verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten, nummerierten Picker. Auswahl nach Nummer:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Außerdem zeigt es den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich die Profilfixierung, die ich mit `@profile` gesetzt habe?**

    Führen Sie `/model` erneut **ohne** das Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn in `/model` aus (oder senden `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 für Coding verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie nach Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` für Coding mit Codex OAuth.
    - **Standard + Wechsel:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4`, dann wechseln Sie beim Coding zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agenten:** Leiten Sie Coding-Aufgaben an Sub-Agenten mit einem anderen Standardmodell weiter.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich Fast Mode für GPT 5.4?">
    Verwenden Sie entweder einen Sitzungs-Toggle oder einen Konfigurationsstandard:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** Setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch für Codex OAuth:** Wenn Sie auch `openai-codex/gpt-5.4` verwenden, setzen Sie dort dieselbe Flag.

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

    Für OpenAI wird Fast Mode auf unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzungs-Overrides über `/fast` haben Vorrang vor Konfigurationsstandards.

    Siehe [Thinking and fast mode](/de/tools/thinking) und [OpenAI fast mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Wenn Sie ein Modell wählen, das nicht in dieser Liste steht, erhalten Sie:

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

    1. Auf eine aktuelle OpenClaw-Version aktualisieren (oder aus dem Quellcode `main` ausführen) und dann das Gateway neu starten.
    2. Sicherstellen, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Auth
       in env/Auth-Profilen vorhanden ist, sodass der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Die genaue Modell-ID (Groß-/Kleinschreibung beachten) für Ihren Auth-Pfad verwenden:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-Key-
       Setup oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Ausführen:

       ```bash
       openclaw models list
       ```

       und aus der Liste wählen (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie **pro Sitzung** bei Bedarf das Modell.
    Fallbacks sind für **Fehler**, nicht für „schwierige Aufgaben“, daher verwenden Sie `/model` oder einen separaten Agenten.

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
    - Nach Agent routen oder `/agent` zum Wechseln verwenden

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind `opus` / `sonnet` / `gpt` integrierte Shortcuts?">
    Ja. OpenClaw bringt einige Standard-Kurzformen mit (sie werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn Sie einen eigenen Alias mit demselben Namen setzen, hat Ihr Wert Vorrang.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Shortcuts (Aliase)?">
    Aliase kommen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

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

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) zu dieser Modell-ID aufgelöst.

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

    Wenn Sie ein Provider-/Modellpaar referenzieren, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Runtime-Auth-Fehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Auth ist pro Agent und
    wird gespeichert in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Optionen zur Behebung:

    - `openclaw agents add <id>` ausführen und Auth während des Assistenten konfigurieren.
    - Oder `auth-profiles.json` aus dem `agentDir` des Hauptagenten in das `agentDir` des neuen Agenten kopieren.

    Verwenden Sie `agentDir` **nicht** für mehrere Agenten gemeinsam; das verursacht Auth-/Sitzungskollisionen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover geschieht in zwei Stufen:

    1. **Auth-Profil-Rotation** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentielles Backoff), sodass OpenClaw weiter antworten kann, auch wenn ein Provider ratenbegrenzt ist oder vorübergehend fehlschlägt.

    Der Ratenlimit-Bucket umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als
    failoverwürdige Ratenlimits.

    Einige Antworten, die wie Abrechnungsfehler aussehen, sind nicht `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Abrechnungstext mit `401` oder `403` zurückgibt, kann OpenClaw diesen dennoch in
    der Abrechnungsbahn behalten, aber provider-spezifische Text-Matcher bleiben auf den
    Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Nachricht stattdessen wie ein wiederholbares Nutzungsfenster oder
    ein Ausgabenlimit von Organisation/Workspace aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dies als
    `rate_limit`, nicht als langfristige Billing-Deaktivierung.

    Kontextüberlauf-Fehler sind etwas anderes: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Compaction-/Retry-Pfad, statt den Modell-
    Fallback weiterzuschalten.

    Generischer Server-Fehlertext ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-spezifische transiente Formen
    wie Anthropic nacktes `An unknown error occurred`, OpenRouter nacktes
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und Provider-busy-Fehler wie `ModelNotReadyException` als
    failoverwürdige Timeout-/Überlastungssignale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst für sich genommen keinen Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Das bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, dafür aber keine Zugangsdaten im erwarteten Auth-Store finden konnte.

    **Checkliste zur Behebung:**

    - **Prüfen, wo Auth-Profile liegen** (neue vs. Legacy-Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Prüfen, ob Ihre Umgebungsvariable vom Gateway geladen wird**
      - Wenn Sie `ANTHROPIC_API_KEY` in Ihrer Shell gesetzt haben, das Gateway aber über systemd/launchd ausführen, wird sie möglicherweise nicht geerbt. Legen Sie sie in `~/.openclaw/.env` ab oder aktivieren Sie `env.shellEnv`.
    - **Sicherstellen, dass Sie den richtigen Agenten bearbeiten**
      - Bei Multi-Agent-Setups kann es mehrere `auth-profiles.json`-Dateien geben.
    - **Modell-/Auth-Status plausibilitätsprüfen**
      - Verwenden Sie `openclaw models status`, um konfigurierte Modelle zu sehen und ob Provider authentifiziert sind.

    **Checkliste zur Behebung für "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf an ein Anthropic-Auth-Profil gebunden ist, das Gateway
    es aber in seinem Auth-Store nicht finden kann.

    - **Claude CLI verwenden**
      - Führen Sie `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn Sie stattdessen einen API-Schlüssel verwenden möchten**
      - Legen Sie `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Löschen Sie jede festgelegte Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätigen, dass Sie Befehle auf dem Gateway-Host ausführen**
      - Im Remote-Modus liegen Auth-Profile auf dem Gateway-Rechner, nicht auf Ihrem Laptop.

  </Accordion>

  <Accordion title="Warum hat es auch Google Gemini versucht und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie zu einer Gemini-Kurzform gewechselt sind), versucht OpenClaw es während des Modell-Fallbacks damit. Wenn Sie keine Google-Zugangsdaten konfiguriert haben, sehen Sie `No API key found for provider "google"`.

    Lösung: Entweder Google-Auth bereitstellen oder Google-Modelle aus `agents.defaults.model.fallbacks` / Aliasen entfernen bzw. vermeiden, damit der Fallback nicht dorthin routet.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält **Thinking-Blöcke ohne Signaturen** (oft aus
    einem abgebrochenen/teilweisen Stream). Google Antigravity erfordert Signaturen für Thinking-Blöcke.

    Lösung: OpenClaw entfernt jetzt nicht signierte Thinking-Blöcke für Google Antigravity Claude. Wenn es weiterhin auftritt, starten Sie eine **neue Sitzung** oder setzen Sie `/thinking off` für diesen Agenten.

  </Accordion>
</AccordionGroup>

## Auth-Profile: Was sie sind und wie man sie verwaltet

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Flows, Token-Speicherung, Multi-Account-Muster)

<AccordionGroup>
  <Accordion title="Was ist ein Auth-Profil?">
    Ein Auth-Profil ist ein benannter Zugangsdaten-Eintrag (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile liegen in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Wie sehen typische Profil-IDs aus?">
    OpenClaw verwendet provider-präfixierte IDs wie:

    - `anthropic:default` (häufig, wenn keine E-Mail-Identität existiert)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs, die Sie wählen (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Auth-Profil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dadurch werden **keine** Secrets gespeichert; es ordnet IDs Provider/Modus zu und legt die Rotationsreihenfolge fest.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es sich in einem kurzen **Cooldown** (Ratenlimits/Timeouts/Auth-Fehler) oder einem längeren **disabled**-Zustand (Abrechnung/ungenügende Credits) befindet. Zur Prüfung führen Sie `openclaw models status --json` aus und sehen unter `auth.unusableProfiles` nach. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns für Ratenlimits können modellspezifisch sein. Ein Profil, das sich für ein Modell im Cooldown
    befindet, kann für ein verwandtes Modell desselben Providers weiterhin nutzbar sein,
    während Billing-/Disabled-Fenster weiterhin das gesamte Profil blockieren.

    Sie können auch per CLI eine **agentenspezifische** Reihenfolge überschreiben (gespeichert in `auth-state.json` dieses Agenten):

    ```bash
    # Standardmäßig wird der konfigurierte Standard-Agent verwendet (ohne --agent)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil sperren (nur dieses versuchen)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge festlegen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Override löschen (auf config auth.order / Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic
    ```

    Um einen bestimmten Agenten anzusteuern:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu prüfen, was tatsächlich versucht wird, verwenden Sie:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge fehlt, meldet probe
    für dieses Profil `excluded_by_auth_order`, statt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API-Schlüssel – was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt oft Abonnementzugang (wo zutreffend).
    - **API-Schlüssel** verwenden Pay-per-Token-Abrechnung.

    Der Assistent unterstützt ausdrücklich Anthropic Claude CLI, OpenAI Codex OAuth und API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Gateway: Ports, „läuft bereits“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standard 18789
    ```

  </Accordion>

  <Accordion title='Warum sagt `openclaw gateway status` "Runtime: running", aber "RPC probe: failed"?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die RPC-Probe bedeutet, dass die CLI tatsächlich eine Verbindung zum Gateway-WebSocket herstellt und `status` aufruft.

    Verwenden Sie `openclaw gateway status` und vertrauen Sie diesen Zeilen:

    - `Probe target:` (die URL, die die Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich auf dem Port gebunden ist)
    - `Last gateway error:` (häufige Ursache, wenn der Prozess lebt, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt `openclaw gateway status` "Config (cli)" und "Config (service)" unterschiedlich an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Service eine andere verwendet (oft ein Mismatch bei `--profile` / `OPENCLAW_STATE_DIR`).

    Behebung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie das aus derselben `--profile`-/Umgebung aus, die der Service verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Runtime-Sperre, indem es den WebSocket-Listener sofort beim Start bindet (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wirft es `GatewayLockError`, was bedeutet, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway an einem anderen Ort)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Shared-Secret-Remote-Zugangsdaten:

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
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Zugangsdaten; sie aktivieren lokale Gateway-Authentifizierung nicht von selbst.

  </Accordion>

  <Accordion title='Die Control UI zeigt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Auth-Pfad und die Auth-Methode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiterhin funktionieren, ohne langlebige Token-Persistenz in `localStorage` wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Retry mit einem gecachten Device-Token versuchen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit gecachtem Token verwendet jetzt die gecachten genehmigten Scopes weiter, die mit dem Device-Token gespeichert wurden. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, statt gecachte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads ist die Priorität für Connect-Auth explizites Shared-Token/-Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Tokens sind rollenpräfixiert. Die integrierte Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Nodes oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht sie zu öffnen; zeigt einen SSH-Hinweis, wenn headless).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` setzen und dann das passende Secret in die Einstellungen der Control UI einfügen.
    - Tailscale-Serve-Modus: Sicherstellen, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe loopback-/tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Trusted-proxy-Modus: Sicherstellen, dass Sie über den konfigurierten nicht-loopback identity-aware Proxy kommen, nicht über einen gleichhostigen loopback-Proxy oder eine rohe Gateway-URL.
    - Wenn der Mismatch nach dem einen Retry bestehen bleibt, das gekoppelte Device-Token rotieren/erneut genehmigen:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf meldet, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, es sei denn, sie haben zusätzlich `operator.admin`
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch festgefahren? Führen Sie `openclaw status --all` aus und folgen Sie [Fehlerbehebung](/de/gateway/troubleshooting). Siehe [Dashboard](/web/dashboard) für Auth-Details.

  </Accordion>

  <Accordion title="Ich habe `gateway.bind tailnet` gesetzt, aber es kann nicht binden und nichts lauscht">
    Bei `tailnet`-Bind wird eine Tailscale-IP aus Ihren Netzwerkschnittstellen gewählt (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie einen nur auf Tailnet gebundenen Listener möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein – ein Gateway kann mehrere Messaging-Channels und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Zustand pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Pro Instanz `openclaw --profile <name> ...` verwenden (erstellt automatisch `~/.openclaw-<name>`).
    - In jeder Profilkonfiguration einen eindeutigen `gateway.port` setzen (oder `--port` für manuelle Läufe übergeben).
    - Einen profilbezogenen Service installieren: `openclaw --profile <name> gateway install`.

    Profile hängen auch Suffixe an Servicenamen an (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server**, und es erwartet, dass die allererste Nachricht
    ein `connect`-Frame ist. Wenn es stattdessen etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Policy Violation).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Behebungen:

    1. Die WS-URL verwenden: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Den WS-Port nicht in einem normalen Browser-Tab öffnen.
    3. Wenn Auth aktiviert ist, das Token/Passwort im `connect`-Frame mitgeben.

    Wenn Sie CLI oder TUI verwenden, sollte die URL so aussehen:

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

    Sie können über `logging.file` einen stabilen Pfad festlegen. Der Dateilog-Level wird über `logging.level` gesteuert. Die Konsolen-Verbosity wird über `--verbose` und `logging.consoleLevel` gesteuert.

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
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückerobern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen – wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, betreten Sie WSL und starten Sie dann neu:

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

    Wenn Sie es manuell ausführen (ohne Service), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Check:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Auth ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Channel-Pairing/Allowlist blockiert Antworten (prüfen Sie Channel-Konfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote arbeiten, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Channels](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Vom Gateway getrennt: kein Grund" – was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Falls remote: Ist die Tunnel-/Tailscale-Verbindung aktiv?

    Verfolgen Sie dann die Logs:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram `setMyCommands` schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Channel-Status:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Passen Sie den Fehler dann zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen weiterhin entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host prüfen.

    Dokumentation: [Telegram](/de/channels/telegram), [Channel-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Channel erwarten, stellen Sie sicher, dass Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann wieder?">
    Wenn Sie den Service installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Service** gestoppt/gestartet (launchd auf macOS, systemd auf Linux).
    Verwenden Sie dies, wenn das Gateway als Daemon im Hintergrund läuft.

    Wenn Sie im Vordergrund laufen, beenden Sie mit Ctrl-C und führen dann aus:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: `openclaw gateway restart` vs `openclaw gateway`">
    - `openclaw gateway restart`: startet den **Hintergrund-Service** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn Sie den Service installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg, mehr Details zu bekommen, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie dann die Logdatei auf Channel-Auth, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agenten müssen eine Zeile `MEDIA:<path-or-url>` enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistant-Einrichtung](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf max. 2048 px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt Senden lokaler Pfade auf Workspace, temp/media-store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, hostlokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Klartext- und geheimnisähnliche Dateien bleiben weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardeinstellungen sind darauf ausgelegt, das Risiko zu reduzieren:

    - Standardverhalten auf DM-fähigen Channels ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Öffentliche DMs erfordern explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur ein Problem für öffentliche Bots?">
    Nein. Prompt Injection betrifft **nicht vertrauenswürdige Inhalte**, nicht nur die Frage, wer dem Bot DMs schicken kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/-abruf, Browser-Seiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann sogar dann passieren, wenn **Sie der einzige Absender** sind.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Verringern Sie den Schadensradius durch:

    - Verwendung eines schreibgeschützten oder tool-deaktivierten „Reader“-Agenten zum Zusammenfassen nicht vertrauenswürdiger Inhalte
    - `web_search` / `web_fetch` / `browser` für toolfähige Agenten deaktiviert lassen
    - dekodierten Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und die Extraktion von Medienanhängen kapseln extrahierten Text beide in
      explizite Markierungen für externe Inhaltsgrenzen, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Den Bot mit separaten Konten und Telefonnummern zu isolieren,
    reduziert den Schadensradius, falls etwas schiefgeht. Außerdem erleichtert dies das Rotieren von
    Zugangsdaten oder das Entziehen von Zugriff, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Starten Sie klein. Geben Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - DMs im **Pairing-Modus** oder mit einer engen Allowlist belassen.
    - Eine **separate Nummer oder ein separates Konto** verwenden, wenn es in Ihrem Namen Nachrichten senden soll.
    - Entwürfe erstellen lassen, dann **vor dem Senden genehmigen**.

    Wenn Sie experimentieren möchten, tun Sie das mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Personal-Assistant-Aufgaben verwenden?">
    Ja, **wenn** der Agent nur für Chat genutzt wird und die Eingaben vertrauenswürdig sind. Kleinere Modellstufen sind
    anfälliger für Instruction Hijacking, also vermeiden Sie sie für toolfähige Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie unbedingt ein kleineres Modell verwenden müssen, sperren Sie
    Tools und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe `/start` in Telegram ausgeführt, aber keinen Pairing-Code erhalten">
    Pairing-Codes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot schreibt und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Prüfen Sie ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Allowlist oder stellen Sie für dieses Konto `dmPolicy: "open"` ein.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meine Kontakte anschreiben? Wie funktioniert Pairing?">
    Nein. Die Standardrichtlinie für WhatsApp-DMs ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendungen, die Sie auslösen.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Telefonnummern-Prompt im Assistenten: Er wird verwendet, um Ihre **Allowlist/Ihren Eigentümer** festzulegen, sodass Ihre eigenen DMs erlaubt sind. Er wird nicht für automatisches Senden verwendet. Wenn Sie Ihre persönliche WhatsApp-Nummer verwenden, nutzen Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** aktiviert ist
    für diese Sitzung.

    Behebung in dem Chat, in dem Sie das sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin zu laut ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Bestätigen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Dokumentation: [Thinking und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/storniere ich eine laufende Aufgabe?">
    Senden Sie eines davon **als eigenständige Nachricht** (ohne Slash):

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

    Überblick über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Shortcuts (wie `/status`) funktionieren für Absender auf der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? ("Cross-context messaging denied")'>
    OpenClaw blockiert **anbieterübergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf an
    Telegram gebunden ist, sendet es nicht an Discord, es sei denn, Sie erlauben das explizit.

    Aktivieren Sie anbieterübergreifendes Messaging für den Agenten:

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

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - neue Nachrichten lenken die aktuelle Aufgabe um
    - `followup` - Nachrichten werden nacheinander ausgeführt
    - `collect` - Nachrichten werden gebündelt und es wird einmal geantwortet (Standard)
    - `steer-backlog` - jetzt umleiten, dann Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und frisch starten

    Sie können Optionen wie `debounce:2s cap:25 drop:summarize` für Follow-up-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Verschiedenes

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Zugangsdaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass das Gateway keine Anthropic-Zugangsdaten in der erwarteten `auth-profiles.json` für den laufenden Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Immer noch festgefahren? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).
