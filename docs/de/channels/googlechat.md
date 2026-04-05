---
read_when:
    - Arbeiten an Google Chat-Kanalfunktionen
summary: Unterstützungsstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T12:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

Status: bereit für DMs + Spaces über Google Chat API-Webhooks (nur HTTP).

## Schnelle Einrichtung (für Einsteiger)

1. Erstellen Sie ein Google Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Gehen Sie zu: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Service Account**:
   - Klicken Sie auf **Create Credentials** > **Service Account**.
   - Geben Sie einen beliebigen Namen an (z. B. `openclaw-chat`).
   - Lassen Sie die Berechtigungen leer (klicken Sie auf **Continue**).
   - Lassen Sie die Principals mit Zugriff leer (klicken Sie auf **Done**).
3. Erstellen und laden Sie den **JSON Key** herunter:
   - Klicken Sie in der Liste der Service Accounts auf den gerade erstellten Eintrag.
   - Wechseln Sie zum Tab **Keys**.
   - Klicken Sie auf **Add Key** > **Create new key**.
   - Wählen Sie **JSON** aus und klicken Sie auf **Create**.
4. Speichern Sie die heruntergeladene JSON-Datei auf Ihrem Gateway-Host (z. B. `~/.openclaw/googlechat-service-account.json`).
5. Erstellen Sie eine Google Chat-App in der [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Füllen Sie die **Application info** aus:
     - **App name**: (z. B. `OpenClaw`)
     - **Avatar URL**: (z. B. `https://openclaw.ai/logo.png`)
     - **Description**: (z. B. `Personal AI Assistant`)
   - Aktivieren Sie **Interactive features**.
   - Aktivieren Sie unter **Functionality** die Option **Join spaces and group conversations**.
   - Wählen Sie unter **Connection settings** **HTTP endpoint URL** aus.
   - Wählen Sie unter **Triggers** **Use a common HTTP endpoint URL for all triggers** aus und setzen Sie diese auf die öffentliche URL Ihres Gateways gefolgt von `/googlechat`.
     - _Tipp: Führen Sie `openclaw status` aus, um die öffentliche URL Ihres Gateways zu finden._
   - Aktivieren Sie unter **Visibility** die Option **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Geben Sie Ihre E-Mail-Adresse (z. B. `user@example.com`) in das Textfeld ein.
   - Klicken Sie unten auf **Save**.
6. **Aktivieren Sie den App-Status**:
   - Aktualisieren Sie nach dem Speichern **die Seite**.
   - Suchen Sie nach dem Abschnitt **App status** (normalerweise nach dem Speichern oben oder unten auf der Seite).
   - Ändern Sie den Status auf **Live - available to users**.
   - Klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Pfad zum Service Account + der Webhook Audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oder config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Legen Sie Typ + Wert der Webhook Audience fest (entspricht Ihrer Chat-App-Konfiguration).
9. Starten Sie das Gateway. Google Chat sendet dann POST-Anfragen an Ihren Webhook-Pfad.

## Zu Google Chat hinzufügen

Sobald das Gateway läuft und Ihre E-Mail-Adresse zur Sichtbarkeitsliste hinzugefügt wurde:

1. Gehen Sie zu [Google Chat](https://chat.google.com/).
2. Klicken Sie auf das **+**-Symbol neben **Direct Messages**.
3. Geben Sie in der Suchleiste (wo Sie normalerweise Personen hinzufügen) den **App name** ein, den Sie in der Google Cloud Console konfiguriert haben.
   - **Hinweis**: Der Bot erscheint _nicht_ in der „Marketplace“-Übersicht, da es sich um eine private App handelt. Sie müssen ihn nach Namen suchen.
4. Wählen Sie Ihren Bot aus den Ergebnissen aus.
5. Klicken Sie auf **Add** oder **Chat**, um eine 1:1-Unterhaltung zu starten.
6. Senden Sie „Hello“, um den Assistenten auszulösen!

## Öffentliche URL (nur Webhook)

Google Chat-Webhooks benötigen einen öffentlichen HTTPS-Endpunkt. Aus Sicherheitsgründen sollten Sie **nur den Pfad `/googlechat`** für das Internet freigeben. Halten Sie das OpenClaw-Dashboard und andere sensible Endpunkte in Ihrem privaten Netzwerk.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad. So bleibt `/` privat, während nur `/googlechat` freigegeben wird.

1. **Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie sich die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder Ihre Tailscale-IP wie `100.x.x.x`).

2. **Dashboard nur im Tailnet freigeben (Port 8443):**

   ```bash
   # Wenn an localhost gebunden (127.0.0.1 oder 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Wenn nur an die Tailscale-IP gebunden (z. B. 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Nur den Webhook-Pfad öffentlich freigeben:**

   ```bash
   # Wenn an localhost gebunden (127.0.0.1 oder 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Wenn nur an die Tailscale-IP gebunden (z. B. 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisieren Sie den Node für den Funnel-Zugriff:**
   Wenn Sie dazu aufgefordert werden, öffnen Sie die in der Ausgabe angezeigte Autorisierungs-URL, um Funnel für diesen Node in Ihrer Tailnet-Richtlinie zu aktivieren.

5. **Überprüfen Sie die Konfiguration:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ihr privates Dashboard bleibt auf das Tailnet beschränkt:
`https://<node-name>.<tailnet>.ts.net:8443/`

Verwenden Sie die öffentliche URL (ohne `:8443`) in der Google Chat-App-Konfiguration.

> Hinweis: Diese Konfiguration bleibt über Neustarts hinweg bestehen. Um sie später zu entfernen, führen Sie `tailscale funnel reset` und `tailscale serve reset` aus.

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
   - OpenClaw überprüft die Bearer-Authentifizierung, bevor vollständige Webhook-Bodys gelesen oder geparst werden, wenn der Header vorhanden ist.
   - Google Workspace Add-on-Anfragen, die `authorizationEventObject.systemIdToken` im Body enthalten, werden über ein strengeres Body-Budget für die Vorabauthentifizierung unterstützt.
2. OpenClaw überprüft das Token anhand des konfigurierten `audienceType` + `audience`:
   - `audienceType: "app-url"` → Audience ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Audience ist die Nummer des Cloud-Projekts.
3. Nachrichten werden nach Space weitergeleitet:
   - DMs verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:group:<spaceId>`.
4. DM-Zugriff verwendet standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code; freigeben mit:
   - `openclaw pairing approve googlechat <code>`
5. Gruppen-Spaces erfordern standardmäßig eine @-Erwähnung. Verwenden Sie `botUser`, wenn die Erwähnungserkennung den Benutzernamen der App benötigt.

## Ziele

Verwenden Sie diese Bezeichner für Zustellung und Allowlists:

- Direct Messages: `users/<userId>` (empfohlen).
- Rohe E-Mail `name@example.com` ist veränderlich und wird nur für direkten Allowlist-Abgleich verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Allowlist.
- Spaces: `spaces/<spaceId>`.

## Wichtige Konfigurationspunkte

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
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

- Service Account-Anmeldedaten können auch inline mit `serviceAccount` (JSON-String) übergeben werden.
- `serviceAccountRef` wird ebenfalls unterstützt (env/file SecretRef), einschließlich kontoabhängiger Refs unter `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Der Standard-Webhook-Pfad ist `/googlechat`, wenn `webhookPath` nicht gesetzt ist.
- `dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Principalnamen für Allowlists erneut (Kompatibilitätsmodus für Notfälle).
- Reaktionen sind über das Tool `reactions` und `channels action` verfügbar, wenn `actions.reactions` aktiviert ist.
- Nachrichtenaktionen stellen `send` für Text und `upload-file` für explizites Senden von Anhängen bereit. `upload-file` akzeptiert `media` / `filePath` / `path` sowie optional `message`, `filename` und Thread-Zielangaben.
- `typingIndicator` unterstützt `none`, `message` (Standard) und `reaction` (`reaction` erfordert Benutzer-OAuth).
- Anhänge werden über die Chat API heruntergeladen und in der Medienpipeline gespeichert (Größenlimit durch `mediaMaxMb`).

Details zu Secret-Referenzen: [Secrets Management](/gateway/secrets).

## Fehlerbehebung

### 405 Method Not Allowed

Wenn Google Cloud Logs Explorer Fehler wie diese anzeigt:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

bedeutet dies, dass der Webhook-Handler nicht registriert ist. Häufige Ursachen:

1. **Kanal nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt in Ihrer Konfiguration. Prüfen Sie das mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn „Config path not found“ zurückgegeben wird, fügen Sie die Konfiguration hinzu (siehe [Wichtige Konfigurationspunkte](#wichtige-konfigurationspunkte)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn „disabled“ angezeigt wird, fügen Sie `plugins.entries.googlechat.enabled: true` zu Ihrer Konfiguration hinzu.

3. **Gateway nicht neu gestartet**: Starten Sie das Gateway nach dem Hinzufügen der Konfiguration neu:

   ```bash
   openclaw gateway restart
   ```

Überprüfen Sie, ob der Kanal läuft:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Weitere Probleme

- Prüfen Sie `openclaw channels status --probe` auf Auth-Fehler oder fehlende Audience-Konfiguration.
- Wenn keine Nachrichten ankommen, prüfen Sie die Webhook-URL + Ereignisabonnements der Chat-App.
- Wenn Mention-Gating Antworten blockiert, setzen Sie `botUser` auf den Benutzernamen der App-Ressource und prüfen Sie `requireMention`.
- Verwenden Sie `openclaw logs --follow`, während Sie eine Testnachricht senden, um zu sehen, ob Anfragen das Gateway erreichen.

Verwandte Dokumentation:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
