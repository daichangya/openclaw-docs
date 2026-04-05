---
read_when:
    - Sie müssen sich für Browser-Automatisierung bei Websites anmelden
    - Sie möchten Updates auf X/Twitter posten
summary: Manuelle Anmeldungen für Browser-Automatisierung + X/Twitter-Postings
title: Browser-Anmeldung
x-i18n:
    generated_at: "2026-04-05T12:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Browser-Anmeldung + X/Twitter-Postings

## Manuelle Anmeldung (empfohlen)

Wenn eine Website eine Anmeldung erfordert, **melden Sie sich manuell** im **Host**-Browserprofil an (dem openclaw browser).

Geben Sie dem Modell **nicht** Ihre Zugangsdaten. Automatisierte Anmeldungen lösen häufig Anti-Bot-Abwehrmechanismen aus und können das Konto sperren.

Zurück zur Hauptdokumentation für den Browser: [Browser](/tools/browser).

## Welches Chrome-Profil wird verwendet?

OpenClaw steuert ein **dediziertes Chrome-Profil** (mit dem Namen `openclaw`, orange getönte UI). Dieses ist vom Browserprofil für Ihren Alltag getrennt.

Für Browser-Tool-Aufrufe des Agenten gilt:

- Standardauswahl: Der Agent sollte seinen isolierten `openclaw`-Browser verwenden.
- Verwenden Sie `profile="user"` nur dann, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer am Computer sitzt, um auf eine Aufforderung zum Anhängen zu klicken/eine solche zu bestätigen.
- Wenn Sie mehrere Benutzer-Browserprofile haben, geben Sie das Profil explizit an, statt zu raten.

Zwei einfache Möglichkeiten, darauf zuzugreifen:

1. **Bitten Sie den Agenten, den Browser zu öffnen**, und melden Sie sich dann selbst an.
2. **Öffnen Sie ihn über die CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Wenn Sie mehrere Profile haben, übergeben Sie `--browser-profile <name>` (der Standard ist `openclaw`).

## X/Twitter: empfohlener Ablauf

- **Lesen/Suchen/Threads:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).
- **Updates posten:** Verwenden Sie den **Host**-Browser (manuelle Anmeldung).

## Sandboxing + Zugriff auf den Host-Browser

Browser-Sitzungen in der Sandbox lösen **eher** Bot-Erkennung aus. Für X/Twitter (und andere strenge Websites) sollten Sie den **Host**-Browser bevorzugen.

Wenn der Agent in einer Sandbox läuft, verwendet das Browser-Tool standardmäßig die Sandbox. Um Host-Steuerung zu erlauben:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Richten Sie dann das Ziel auf den Host-Browser:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oder deaktivieren Sie die Sandbox für den Agenten, der Updates postet.
