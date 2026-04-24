---
read_when:
    - Modell-Authentifizierung oder OAuth-Ablauf debuggen
    - Authentifizierung oder Speicherung von Anmeldedaten dokumentieren
summary: 'Modell-Authentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-24T06:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentifizierung (Modell-Provider)

<Note>
Diese Seite behandelt die **Authentifizierung von Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Für die **Authentifizierung der Gateway-Verbindung** (Token, Passwort, trusted-proxy) siehe [Konfiguration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-
Hosts sind API-Schlüssel in der Regel die am besten vorhersehbare Option. Subscription-/OAuth-
Flows werden ebenfalls unterstützt, wenn sie zu Ihrem Provider-Kontomodell passen.

Siehe [/concepts/oauth](/de/concepts/oauth) für den vollständigen OAuth-Flow und das Speicher-
Layout.
Für SecretRef-basierte Authentifizierung (`env`-/`file`-/`exec`-Provider) siehe [Secrets Management](/de/gateway/secrets).
Für Regeln zur Berechtigungsfähigkeit von Anmeldedaten/Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Semantik von Authentifizierungs-Anmeldedaten](/de/auth-credential-semantics).

## Empfohlenes Setup (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Provider.
Speziell für Anthropic ist API-Schlüssel-Authentifizierung weiterhin das am besten vorhersehbare Server-
Setup, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude-CLI-Anmeldung.

1. Erstellen Sie in der Konsole Ihres Providers einen API-Schlüssel.
2. Hinterlegen Sie ihn auf dem **Gateway-Host** (dem Rechner, auf dem `openclaw gateway` läuft).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel vorzugsweise in
   `~/.openclaw/.env` ab, damit der Daemon ihn lesen kann:

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

Wenn Sie Umgebungsvariablen nicht selbst verwalten möchten, kann Onboarding
API-Schlüssel für die Daemon-Nutzung speichern: `openclaw onboard`.

Siehe [Hilfe](/de/help) für Details zur Env-Vererbung (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI und Token-Kompatibilität

Anthropic-Setup-Token-Authentifizierung ist in OpenClaw weiterhin als unterstützter Token-
Pfad verfügbar. Anthropic-Mitarbeiter haben uns inzwischen mitgeteilt, dass eine OpenClaw-artige Nutzung der Claude CLI
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p`
für diese Integration als zulässig, solange Anthropic keine neue Richtlinie veröffentlicht. Wenn die
Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies nun der bevorzugte Pfad.

Für langlebige Gateway-Hosts ist ein Anthropic-API-Schlüssel weiterhin das am besten vorhersehbare
Setup. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie im Onboarding/in der Konfiguration den Anthropic-Claude-CLI-Pfad.

Empfohlenes Host-Setup für die Wiederverwendung der Claude CLI:

```bash
# Auf dem Gateway-Host ausführen
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist ein Setup in zwei Schritten:

1. Claude Code selbst auf dem Gateway-Host bei Anthropic anmelden.
2. OpenClaw mitteilen, die Auswahl von Anthropic-Modellen auf das lokale `claude-cli`-
   Backend umzustellen und das passende OpenClaw-Authentifizierungsprofil zu speichern.

Wenn `claude` nicht auf `PATH` liegt, installieren Sie entweder zuerst Claude Code oder setzen Sie
`agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Pfad der Binärdatei.

Manuelle Token-Eingabe (beliebiger Provider; schreibt `auth-profiles.json` + aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Auth-Profil-Refs werden auch für statische Anmeldedaten unterstützt:

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, werden SecretRef-gestützte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Probes:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet Probe
  `excluded_by_auth_order` für dieses Profil, statt es zu versuchen.
- Wenn Auth existiert, OpenClaw für diesen
  Provider aber kein prüfbares Modell als Kandidaten auflösen kann, meldet Probe `status: no_model`.
- Ratenlimit-Cooldowns können modellbezogen sein. Ein Profil, das für ein
  Modell im Cooldown ist, kann für ein Geschwistermodell beim selben Provider weiterhin verwendbar sein.

Optionale Ops-Skripte (systemd/Termux) sind hier dokumentiert:
[Skripte zur Auth-Überwachung](/de/help/scripts#auth-monitoring-scripts)

## Hinweis zu Anthropic

Das Anthropic-Backend `claude-cli` wird wieder unterstützt.

- Anthropic-Mitarbeiter haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als zulässig
  für Anthropic-gestützte Läufe, solange Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die am besten vorhersehbare Wahl für langlebige Gateway-
  Hosts und explizite serverseitige Abrechnungskontrolle.

## Status der Modell-Authentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Rotationsverhalten von API-Schlüsseln (Gateway)

Einige Provider unterstützen den erneuten Versuch einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
ein Provider-Ratenlimit trifft.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelnes Override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen auch `GOOGLE_API_KEY` als zusätzlichen Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht den nächsten Schlüssel nur bei Ratenlimitfehlern erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Nicht-Ratenlimitfehler werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der finale Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Authentifizierungsprofil sowie Details zu Provider-Endpunkten, wenn konfiguriert).

### Pro Agent (CLI-Override)

Legen Sie ein explizites Override für die Reihenfolge von Authentifizierungsprofilen für einen Agenten fest (gespeichert in dessen `auth-state.json`):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agenten zu verwenden.
Wenn Sie Probleme mit der Reihenfolge debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order` an, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, denken Sie daran, dass Ratenlimit-Cooldowns an
eine Modell-ID statt an das gesamte Provider-Profil gebunden sein können.

## Fehlerbehebung

### "No credentials found"

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem
**Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein
Anthropic-Token-Profil fehlt oder abgelaufen ist, erneuern Sie dieses Setup über
Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandt

- [Secrets Management](/de/gateway/secrets)
- [Remote-Zugriff](/de/gateway/remote)
- [Auth-Speicherung](/de/concepts/oauth)
