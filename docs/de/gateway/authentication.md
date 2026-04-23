---
read_when:
    - Debugging der Modellauthentifizierung oder des OAuth-Ablaufs
    - Dokumentation der Authentifizierung oder der Speicherung von Anmeldedaten
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-23T14:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentifizierung (Modellanbieter)

<Note>
Diese Seite behandelt die Authentifizierung von **Modellanbietern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Informationen zur Authentifizierung der **Gateway-Verbindung** (Token, Passwort, trusted-proxy) finden Sie unter [Configuration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modellanbieter. Für dauerhaft
laufende Gateway-Hosts sind API-Schlüssel in der Regel die vorhersehbarste
Option. Abonnement-/OAuth-Abläufe werden ebenfalls unterstützt, wenn sie zu
Ihrem Anbieterkonto-Modell passen.

Unter [/concepts/oauth](/de/concepts/oauth) finden Sie den vollständigen OAuth-Ablauf und das Speicherlayout.
Für SecretRef-basierte Authentifizierung (Anbieter `env`/`file`/`exec`) siehe [Secrets Management](/de/gateway/secrets).
Für Regeln zur Berechtigung von Anmeldedaten bzw. Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Semantik von Auth-Anmeldedaten](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Anbieter)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Anbieter.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die vorhersehbarste Servereinrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude CLI-Anmeldung.

1. Erstellen Sie in der Konsole Ihres Anbieters einen API-Schlüssel.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` läuft).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel
   vorzugsweise in `~/.openclaw/.env` ab, damit der Daemon ihn lesen kann:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Starten Sie dann den Daemon neu (oder starten Sie Ihren Gateway-Prozess neu) und prüfen Sie erneut:

```bash
openclaw models status
openclaw doctor
```

Wenn Sie Umgebungsvariablen nicht selbst verwalten möchten, kann das Onboarding
API-Schlüssel für die Nutzung durch den Daemon speichern: `openclaw onboard`.

Einzelheiten zur Vererbung von Umgebungsvariablen (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) finden Sie unter [Help](/de/help).

## Anthropic: Claude CLI und Token-Kompatibilität

Die Authentifizierung per Anthropic-Setup-Token ist in OpenClaw weiterhin als unterstützter
Token-Pfad verfügbar. Anthropic-Mitarbeitende haben uns inzwischen mitgeteilt, dass die Nutzung der Claude CLI im OpenClaw-Stil
wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Verwendung von `claude -p`
für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn die
Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts ist ein Anthropic-API-Schlüssel weiterhin die am besten vorhersagbare
Einrichtung. Wenn Sie eine bestehende Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie den
Anthropic-Claude-CLI-Pfad in Onboarding/Konfiguration.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Auf dem Gateway-Host ausführen
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine Einrichtung in zwei Schritten:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale Backend `claude-cli`
   umzustellen und das passende OpenClaw-Authentifizierungsprofil zu speichern.

Wenn `claude` nicht im `PATH` liegt, installieren Sie entweder zuerst Claude Code oder setzen Sie
`agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Pfad zur Binärdatei.

Manuelle Token-Eingabe (beliebiger Anbieter; schreibt `auth-profiles.json` und aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Verweise auf Auth-Profile werden auch für statische Anmeldedaten unterstützt:

- Anmeldedaten vom Typ `api_key` können `keyRef: { source, provider, id }` verwenden
- Anmeldedaten vom Typ `token` können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird eine durch SecretRef gestützte Eingabe über `keyRef`/`tokenRef` für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit-Code `1`, wenn abgelaufen/fehlend, `2`, wenn bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Sonden:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Anmeldedaten aus der Umgebung oder `models.json` stammen.
- Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe
  für dieses Profil `excluded_by_auth_order`, anstatt es zu versuchen.
- Wenn Authentifizierung vorhanden ist, OpenClaw aber kein sondierbares Modell als Kandidat für
  diesen Anbieter auflösen kann, meldet die Probe `status: no_model`.
- Cooldowns für Rate-Limits können modellspezifisch sein. Ein Profil, das für ein
  Modell im Cooldown ist, kann für ein verwandtes Modell desselben Anbieters weiterhin nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Skripte zur Auth-Überwachung](/de/help/scripts#auth-monitoring-scripts)

## Hinweis zu Anthropic

Das Backend `claude-cli` von Anthropic wird wieder unterstützt.

- Anthropic-Mitarbeitende haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Verwendung von `claude -p`
  für von Anthropic unterstützte Ausführungen als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die am besten vorhersagbare Wahl für langlebige Gateway-Hosts
  und eine explizite serverseitige Kontrolle der Abrechnung.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei der Rotation von API-Schlüsseln (Gateway)

Einige Anbieter unterstützen das erneute Versuchen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
an ein Rate-Limit des Anbieters stößt.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Anbieter enthalten außerdem `GOOGLE_API_KEY` als zusätzlichen Fallback.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht den nächsten Schlüssel nur bei Rate-Limit-Fehlern erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Anmeldedaten eines Anbieters für die aktuelle Sitzung festzulegen (Beispiel für Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Details zum Anbieter-Endpunkt, wenn konfiguriert).

### Pro Agent (CLI-Überschreibung)

Legen Sie eine explizite Überschreibung der Reihenfolge von Auth-Profilen für einen Agenten fest (gespeichert in der `auth-state.json` dieses Agenten):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agenten zu verwenden.
Beim Debuggen von Problemen mit der Reihenfolge zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order` an, anstatt sie stillschweigend zu überspringen.
Beim Debuggen von Cooldown-Problemen sollten Sie beachten, dass Cooldowns für Rate-Limits
an eine einzelne Modell-ID statt an das gesamte Anbieterprofil gebunden sein können.

## Fehlerbehebung

### „Keine Anmeldedaten gefunden“

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem
**Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein
Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie diese Einrichtung über
setup-token oder migrieren Sie zu einem Anthropic-API-Schlüssel.
