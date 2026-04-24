---
read_when:
    - Arbeiten an Google-Chat-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T06:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Status: bereit für DMs + Spaces über Google Chat API-Webhooks (nur HTTP).

## Schnelle Einrichtung (für Einsteiger)

1. Erstellen Sie ein Google-Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Gehen Sie zu: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Service Account**:
   - Klicken Sie auf **Create Credentials** > **Service Account**.
   - Geben Sie einen beliebigen Namen ein (z. B. `openclaw-chat`).
   - Lassen Sie die Berechtigungen leer (klicken Sie auf **Continue**).
   - Lassen Sie die Principals mit Zugriff leer (klicken Sie auf **Done**).
3. Erstellen und laden Sie den **JSON-Schlüssel** herunter:
   - Klicken Sie in der Liste der Service Accounts auf den soeben erstellten Eintrag.
   - Wechseln Sie zur Registerkarte **Keys**.
   - Klicken Sie auf **Add Key** > **Create new key**.
   - Wählen Sie **JSON** und klicken Sie auf **Create**.
4. Speichern Sie die heruntergeladene JSON-Datei auf Ihrem Gateway-Host (z. B. `~/.openclaw/googlechat-service-account.json`).
5. Erstellen Sie eine Google-Chat-App in der [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Füllen Sie die **Application info** aus:
     - **App name**: (z. B. `OpenClaw`)
     - **Avatar URL**: (z. B. `https://openclaw.ai/logo.png`)
     - **Description**: (z. B. `Persönlicher KI-Assistent`)
   - Aktivieren Sie **Interactive features**.
   - Aktivieren Sie unter **Functionality** die Option **Join spaces and group conversations**.
   - Wählen Sie unter **Connection settings** **HTTP endpoint URL**.
   - Wählen Sie unter **Triggers** **Use a common HTTP endpoint URL for all triggers** und setzen Sie diese auf die öffentliche URL Ihres Gateways gefolgt von `/googlechat`.
     - _Tipp: Führen Sie `openclaw status` aus, um die öffentliche URL Ihres Gateways zu finden._
   - Aktivieren Sie unter **Visibility** **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Geben Sie Ihre E-Mail-Adresse (z. B. `user@example.com`) in das Textfeld ein.
   - Klicken Sie unten auf **Save**.
6. **Aktivieren Sie den App-Status**:
   - Laden Sie die Seite nach dem Speichern **neu**.
   - Suchen Sie nach dem Abschnitt **App status** (normalerweise nach dem Speichern oben oder unten).
   - Ändern Sie den Status auf **Live - available to users**.
   - Klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Pfad zum Service Account + der Webhook-Audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oder Konfiguration: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Setzen Sie den Webhook-Audience-Typ + -Wert (entspricht Ihrer Chat-App-Konfiguration).
9. Starten Sie das Gateway. Google Chat sendet dann POST-Anfragen an Ihren Webhook-Pfad.

## Zu Google Chat hinzufügen

Sobald das Gateway läuft und Ihre E-Mail-Adresse zur Sichtbarkeitsliste hinzugefügt wurde:

1. Öffnen Sie [Google Chat](https://chat.google.com/).
2. Klicken Sie auf das Symbol **+** (Plus) neben **Direct Messages**.
3. Geben Sie in der Suchleiste (wo Sie normalerweise Personen hinzufügen) den **App name** ein, den Sie in der Google Cloud Console konfiguriert haben.
   - **Hinweis**: Der Bot erscheint _nicht_ in der Browse-Liste des „Marketplace“, da es sich um eine private App handelt. Sie müssen ihn nach Namen suchen.
4. Wählen Sie Ihren Bot aus den Ergebnissen aus.
5. Klicken Sie auf **Add** oder **Chat**, um eine 1:1-Unterhaltung zu starten.
6. Senden Sie „Hello“, um den Assistenten auszulösen!

## Öffentliche URL (nur Webhook)

Google-Chat-Webhooks erfordern einen öffentlichen HTTPS-Endpunkt. Aus Sicherheitsgründen sollten Sie **nur den Pfad `/googlechat`** ins Internet freigeben. Behalten Sie das OpenClaw-Dashboard und andere sensible Endpunkte in Ihrem privaten Netzwerk.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad. Dadurch bleibt `/` privat, während nur `/googlechat` freigegeben wird.

1. **Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder Ihre Tailscale-IP wie `100.x.x.x`).

2. **Geben Sie das Dashboard nur für das Tailnet frei (Port 8443):**

   ```bash
   # Wenn an localhost gebunden (127.0.0.1 oder 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Wenn nur an die Tailscale-IP gebunden (z. B. 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Geben Sie nur den Webhook-Pfad öffentlich frei:**

   ```bash
   # Wenn an localhost gebunden (127.0.0.1 oder 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Wenn nur an die Tailscale-IP gebunden (z. B. 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisieren Sie den Node für den Funnel-Zugriff:**
   Falls Sie dazu aufgefordert werden, öffnen Sie die in der Ausgabe angezeigte Autorisierungs-URL, um Funnel für diesen Node in Ihrer Tailnet-Richtlinie zu aktivieren.

5. **Überprüfen Sie die Konfiguration:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ihr privates Dashboard bleibt nur im Tailnet erreichbar:
`https://<node-name>.<tailnet>.ts.net:8443/`

Verwenden Sie die öffentliche URL (ohne `:8443`) in der Google-Chat-App-Konfiguration.

> Hinweis: Diese Konfiguration bleibt über Neustarts hinweg erhalten. Um sie später zu entfernen, führen Sie `tailscale funnel reset` und `tailscale serve reset` aus.

### Option B: Reverse Proxy (Caddy)

Wenn Sie einen Reverse Proxy wie Caddy verwenden, leiten Sie nur den spezifischen Pfad weiter:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Mit dieser Konfiguration wird jede Anfrage an `your-domain.com/` ignoriert oder mit 404 beantwortet, während `your-domain.com/googlechat` sicher an OpenClaw weitergeleitet wird.

### Option C: Cloudflare Tunnel

Konfigurieren Sie die Ingress-Regeln Ihres Tunnels so, dass nur der Webhook-Pfad weitergeleitet wird:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## So funktioniert es

1. Google Chat sendet Webhook-POSTs an das Gateway. Jede Anfrage enthält einen Header `Authorization: Bearer <token>`.
   - OpenClaw prüft die Bearer-Authentifizierung, bevor vollständige Webhook-Bodys gelesen/geparst werden, wenn der Header vorhanden ist.
   - Anfragen von Google Workspace Add-on, die `authorizationEventObject.systemIdToken` im Body enthalten, werden über ein strengeres Pre-Auth-Body-Budget unterstützt.
2. OpenClaw überprüft das Token anhand des konfigurierten `audienceType` + `audience`:
   - `audienceType: "app-url"` → Audience ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Audience ist die Cloud-Projektnummer.
3. Nachrichten werden nach Space geroutet:
   - DMs verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:group:<spaceId>`.
4. DM-Zugriff verwendet standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code; genehmigen Sie ihn mit:
   - `openclaw pairing approve googlechat <code>`
5. Gruppen-Spaces erfordern standardmäßig eine @-Erwähnung. Verwenden Sie `botUser`, wenn die Erwähnungserkennung den Benutzernamen der App benötigt.

## Ziele

Verwenden Sie diese Bezeichner für Zustellung und Allowlists:

- Direktnachrichten: `users/<userId>` (empfohlen).
- Reine E-Mail `name@example.com` ist veränderlich und wird nur für direkte Allowlist-Abgleiche verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Allowlist.
- Spaces: `spaces/<spaceId>`.

## Konfigurations-Highlights

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // oder serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; hilft bei der Erwähnungserkennung
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Nur kurze Antworten.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Hinweise:

- Service-Account-Anmeldedaten können auch inline mit `serviceAccount` (JSON-String) übergeben werden.
- `serviceAccountRef` wird ebenfalls unterstützt (env/file SecretRef), einschließlich kontoabhängiger Refs unter `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Der Standard-Webhook-Pfad ist `/googlechat`, wenn `webhookPath` nicht gesetzt ist.
- `dangerouslyAllowNameMatching` aktiviert veränderliches E-Mail-Principal-Matching für Allowlists wieder (Break-Glass-Kompatibilitätsmodus).
- Reactions sind über das Tool `reactions` und `channels action` verfügbar, wenn `actions.reactions` aktiviert ist.
- Nachrichtenaktionen stellen `send` für Text und `upload-file` für explizites Senden von Anhängen bereit. `upload-file` akzeptiert `media` / `filePath` / `path` sowie optional `message`, `filename` und Thread-Zielangaben.
- `typingIndicator` unterstützt `none`, `message` (Standard) und `reaction` (für Reaktionen ist Benutzer-OAuth erforderlich).
- Anhänge werden über die Chat API heruntergeladen und in der Medienpipeline gespeichert (Größe begrenzt durch `mediaMaxMb`).

Details zu Secrets-Referenzen: [Secrets Management](/de/gateway/secrets).

## Fehlerbehebung

### 405 Method Not Allowed

Wenn Google Cloud Logs Explorer Fehler wie diese anzeigt:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

bedeutet dies, dass der Webhook-Handler nicht registriert ist. Häufige Ursachen:

1. **Kanal nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt in Ihrer Konfiguration. Prüfen Sie dies mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn „Config path not found“ zurückgegeben wird, fügen Sie die Konfiguration hinzu (siehe [Konfigurations-Highlights](#konfigurations-highlights)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn „disabled“ angezeigt wird, fügen Sie `plugins.entries.googlechat.enabled: true` zu Ihrer Konfiguration hinzu.

3. **Gateway nicht neu gestartet**: Starten Sie das Gateway nach dem Hinzufügen der Konfiguration neu:

   ```bash
   openclaw gateway restart
   ```

Prüfen Sie, ob der Kanal läuft:

```bash
openclaw channels status
# Sollte anzeigen: Google Chat default: enabled, configured, ...
```

### Weitere Probleme

- Prüfen Sie `openclaw channels status --probe` auf Auth-Fehler oder fehlende Audience-Konfiguration.
- Wenn keine Nachrichten ankommen, bestätigen Sie die Webhook-URL + Ereignisabonnements der Chat-App.
- Wenn Mention-Gating Antworten blockiert, setzen Sie `botUser` auf den User-Ressourcennamen der App und prüfen Sie `requireMention`.
- Verwenden Sie `openclaw logs --follow`, während Sie eine Testnachricht senden, um zu sehen, ob Anfragen das Gateway erreichen.

Verwandte Dokumentation:

- [Gateway-Konfiguration](/de/gateway/configuration)
- [Sicherheit](/de/gateway/security)
- [Reactions](/de/tools/reactions)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
