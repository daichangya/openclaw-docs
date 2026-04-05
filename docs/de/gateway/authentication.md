---
read_when:
    - Beim Debuggen von Modellauthentifizierung oder OAuth-Ablauf
    - Beim Dokumentieren von Authentifizierung oder Speicherung von Anmeldeinformationen
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel und Wiederverwendung der Claude-CLI'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-05T12:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentifizierung (Modell-Provider)

<Note>
Diese Seite behandelt die Authentifizierung von **Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI). Für die Authentifizierung der **Gateway-Verbindung** (Token, Passwort, Trusted-Proxy) siehe [Konfiguration](/gateway/configuration) und [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-
Hosts sind API-Schlüssel normalerweise die am besten vorhersagbare Option. Subscription-/OAuth-
Abläufe werden ebenfalls unterstützt, wenn sie zu Ihrem Provider-Account-Modell passen.

Siehe [/concepts/oauth](/concepts/oauth) für den vollständigen OAuth-Ablauf und das Speicher-
Layout.
Für SecretRef-basierte Authentifizierung (Provider `env`/`file`/`exec`) siehe [Secrets Management](/gateway/secrets).
Für Regeln zur Berechtigung von Anmeldeinformationen/Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Auth Credential Semantics](/auth-credential-semantics).

## Empfohlenes Setup (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel der sichere Weg. Die Wiederverwendung der Claude CLI ist
der andere unterstützte Setup-Pfad im Subscription-Stil.

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Providers.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` läuft).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel bevorzugt in
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

Wenn Sie Env-Variablen nicht selbst verwalten möchten, kann das Onboarding
API-Schlüssel für die Verwendung durch den Daemon speichern: `openclaw onboard`.

Siehe [Help](/help) für Details zur Env-Vererbung (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Legacy-Token-Kompatibilität

Anthropic-Setup-Token-Authentifizierung ist in OpenClaw weiterhin als
Legacy-/manueller Pfad verfügbar. Die öffentlichen Claude Code-Dokumente von Anthropic behandeln weiterhin die direkte
Verwendung von Claude Code im Terminal unter Claude-Plänen, aber Anthropic hat OpenClaw-Benutzern separat mitgeteilt, dass der **OpenClaw**-Claude-Login-Pfad als Nutzung eines Drittanbieter-Harnesses gilt und **Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird.

Für den klarsten Setup-Pfad verwenden Sie einen Anthropic-API-Schlüssel oder migrieren auf Claude CLI
auf dem Gateway-Host.

Manuelle Token-Eingabe (beliebiger Provider; schreibt `auth-profiles.json` + aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Verweise auf Auth-Profile werden auch für statische Anmeldeinformationen unterstützt:

- Anmeldeinformationen vom Typ `api_key` können `keyRef: { source, provider, id }` verwenden
- Anmeldeinformationen vom Typ `token` können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldeinformationen; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, werden SecretRef-gestützte Eingaben `keyRef`/`tokenRef` für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Probes:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Env-Anmeldeinformationen oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe
  für dieses Profil `excluded_by_auth_order`, statt es zu versuchen.
- Wenn Auth vorhanden ist, OpenClaw aber keinen prüfbaren Modellkandidaten für
  diesen Provider auflösen kann, meldet die Probe `status: no_model`.
- Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein
  Modell im Cooldown ist, kann für ein Schwester-Modell desselben Providers weiterhin nutzbar sein.

Optionale Ops-Skripte (systemd/Termux) sind hier dokumentiert:
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Anthropic: Claude CLI-Migration

Wenn Claude CLI bereits auf dem Gateway-Host installiert und angemeldet ist, können Sie
ein vorhandenes Anthropic-Setup auf das CLI-Backend umstellen. Dies ist ein
unterstützter OpenClaw-Migrationspfad, um einen lokalen Claude-CLI-Login auf diesem
Host wiederzuverwenden.

Voraussetzungen:

- `claude` auf dem Gateway-Host installiert
- Claude CLI dort bereits angemeldet mit `claude auth login`

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Dadurch bleiben Ihre vorhandenen Anthropic-Auth-Profile für ein Rollback erhalten, aber die
Standard-Modellauswahl wird auf `claude-cli/...` geändert und passende Claude-CLI-
Allowlist-Einträge unter `agents.defaults.models` werden hinzugefügt.

Prüfen:

```bash
openclaw models status
```

Onboarding-Abkürzung:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Interaktives `openclaw onboard` und `openclaw configure` bevorzugen weiterhin Claude CLI
für Anthropic, aber Anthropic-Setup-Token ist wieder als
Legacy-/manueller Pfad verfügbar und sollte mit der Erwartung von Extra-Usage-Abrechnung verwendet werden.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei der Rotation von API-Schlüsseln (Gateway)

Einige Provider unterstützen das Wiederholen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
auf ein Provider-Rate-Limit trifft.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen zusätzlich `GOOGLE_API_KEY` als weiteren Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht den nächsten Schlüssel nur bei Rate-Limit-Fehlern erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Nicht-Rate-Limit-Fehler werden nicht mit alternativen Schlüsseln wiederholt.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldeinformationen verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um eine bestimmte Provider-Anmeldeinformation für die aktuelle Sitzung festzupinnen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für einen kompakten Picker; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Provider-Endpunktdetails, wenn konfiguriert).

### Pro Agent (CLI-Überschreibung)

Setzen Sie eine explizite Überschreibung der Auth-Profilreihenfolge für einen Agenten (gespeichert in dessen `auth-profiles.json`):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agenten zu verwenden.
Wenn Sie Probleme mit der Reihenfolge debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order` an, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, denken Sie daran, dass Rate-Limit-Cooldowns an
eine Modell-ID statt an das gesamte Provider-Profil gebunden sein können.

## Fehlerbehebung

### „No credentials found“

Wenn das Anthropic-Profil fehlt, migrieren Sie dieses Setup zu Claude CLI oder einem API-
Schlüssel auf dem **Gateway-Host** und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein Legacy-
Anthropic-Token-Profil fehlt oder abgelaufen ist, migrieren Sie dieses Setup zu Claude CLI
oder einem API-Schlüssel.

## Anforderungen für Claude CLI

Nur für den Pfad zur Wiederverwendung von Anthropic Claude CLI erforderlich:

- Claude Code CLI installiert (Befehl `claude` verfügbar)
