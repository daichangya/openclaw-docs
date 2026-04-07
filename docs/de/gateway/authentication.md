---
read_when:
    - Debugging von Modellauthentifizierung oder ablaufendem OAuth
    - Dokumentation von Authentifizierung oder Speicherung von Anmeldedaten
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-07T06:14:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db0ad9eccd7e3e3ca328adaad260bc4288a8ccdbe2dc0c24d9fd049b7ab9231
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentifizierung (Modell-Provider)

<Note>
Diese Seite behandelt die **Authentifizierung von Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Informationen zur **Authentifizierung von Gateway-Verbindungen** (Token, Passwort, Trusted Proxy) finden Sie unter [Configuration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-Hosts sind API-Schlüssel normalerweise die am besten vorhersehbare Option. Abonnement-/OAuth-Abläufe werden ebenfalls unterstützt, wenn sie zu Ihrem Provider-Kontomodell passen.

Unter [/concepts/oauth](/de/concepts/oauth) finden Sie den vollständigen OAuth-Ablauf und das Speicherlayout.
Für SecretRef-basierte Authentifizierung (`env`/`file`/`exec`-Provider) siehe [Secrets Management](/de/gateway/secrets).
Zu Regeln für die Eignung von Anmeldedaten und Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Auth Credential Semantics](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die am besten vorhersehbare Server-Einrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude CLI-Anmeldung.

1. Erstellen Sie in der Konsole Ihres Providers einen API-Schlüssel.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` läuft).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel vorzugsweise in `~/.openclaw/.env` ab, damit der Daemon ihn lesen kann:

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

Siehe [Help](/de/help) für Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI und Token-Kompatibilität

Die Authentifizierung per Anthropic-Setup-Token ist in OpenClaw weiterhin als unterstützter Token-Pfad verfügbar. Mitarbeitende von Anthropic haben uns inzwischen mitgeteilt, dass die Nutzung der Claude CLI im Stil von OpenClaw wieder erlaubt ist. Deshalb behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn die Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts bleibt ein Anthropic-API-Schlüssel dennoch die am besten vorhersehbare Einrichtung. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie beim Onboarding/Konfigurieren den Anthropic-Claude-CLI-Pfad.

Manuelle Tokeneingabe (beliebiger Provider; schreibt `auth-profiles.json` + aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Verweise auf Auth-Profile werden auch für statische Anmeldedaten unterstützt:

- Anmeldedaten vom Typ `api_key` können `keyRef: { source, provider, id }` verwenden
- Anmeldedaten vom Typ `token` können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`-/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Sonden:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe für dieses Profil `excluded_by_auth_order`, statt es zu verwenden.
- Wenn Authentifizierung vorhanden ist, OpenClaw aber kein sondierbares Modellkandidat für diesen Provider auflösen kann, meldet die Probe `status: no_model`.
- Abkühlzeiten bei Rate Limits können modellspezifisch sein. Ein Profil, das für ein Modell abkühlt, kann für ein verwandtes Modell desselben Providers weiterhin nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth monitoring scripts](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-Backend `claude-cli` wird wieder unterstützt.

- Mitarbeitende von Anthropic haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für Anthropic-gestützte Läufe als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die am besten vorhersehbare Wahl für langlebige Gateway-Hosts und eine explizite serverseitige Kontrolle der Abrechnung.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei der Rotation von API-Schlüsseln (Gateway)

Einige Provider unterstützen, eine Anfrage mit alternativen Schlüsseln erneut zu versuchen, wenn ein API-Aufruf an ein Rate Limit des Providers stößt.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen zusätzlich `GOOGLE_API_KEY` als weiteren Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es mit dem nächsten Schlüssel nur bei Rate-Limit-Fehlern erneut (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Andere Fehler als Rate-Limit-Fehler werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel-Profile-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Details zu Provider-Endpunkten, falls konfiguriert).

### Pro Agent (CLI-Überschreibung)

Legen Sie eine explizite Überschreibung der Reihenfolge von Auth-Profilen für einen Agenten fest (gespeichert in dessen `auth-state.json`):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agenten zu verwenden.
Wenn Sie Probleme mit der Reihenfolge debuggen, zeigt `openclaw models status --probe` ausgelassene gespeicherte Profile als `excluded_by_auth_order` an, statt sie stillschweigend zu überspringen.
Wenn Sie Probleme mit Abkühlzeiten debuggen, beachten Sie, dass Abkühlzeiten bei Rate Limits an eine einzelne Modell-ID statt an das gesamte Provider-Profil gebunden sein können.

## Fehlerbehebung

### "No credentials found"

Wenn das Anthropic-Profil fehlt, konfigurieren Sie auf dem **Gateway-Host** einen Anthropic-API-Schlüssel oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein Anthropic-Token-Profil fehlt oder abgelaufen ist, erneuern Sie diese Einrichtung über setup-token oder migrieren Sie zu einem Anthropic-API-Schlüssel.
