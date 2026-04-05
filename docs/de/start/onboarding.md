---
read_when:
    - Entwerfen des Onboarding-Assistenten für macOS
    - Implementieren von Authentifizierung oder Identitäts-Setup
sidebarTitle: 'Onboarding: macOS App'
summary: Einrichtungsablauf beim ersten Start für OpenClaw (macOS-App)
title: Onboarding (macOS-App)
x-i18n:
    generated_at: "2026-04-05T12:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (macOS-App)

Diese Doku beschreibt den **aktuellen** Einrichtungsablauf beim ersten Start. Das Ziel ist eine
reibungslose „Day-0“-Erfahrung: auswählen, wo das Gateway läuft, Authentifizierung verbinden, den
Assistenten ausführen und den Agenten sich selbst initialisieren lassen.
Für einen allgemeinen Überblick über Onboarding-Pfade siehe [Onboarding Overview](/start/onboarding-overview).

<Steps>
<Step title="macOS-Warnung bestätigen">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Zugriff auf lokale Netzwerke erlauben">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Willkommen und Sicherheitshinweis">
<Frame caption="Lies den angezeigten Sicherheitshinweis und entscheide entsprechend">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Vertrauensmodell für Sicherheit:

- Standardmäßig ist OpenClaw ein persönlicher Agent: eine vertrauenswürdige Operator-Grenze.
- Gemeinsame/Multi-User-Setups erfordern Härtung (Vertrauensgrenzen trennen, Tool-Zugriff minimal halten und [Security](/de/gateway/security) befolgen).
- Lokales Onboarding setzt neue Konfigurationen jetzt standardmäßig auf `tools.profile: "coding"`, damit frische lokale Setups Dateisystem-/Laufzeit-Tools behalten, ohne das uneingeschränkte Profil `full` zu erzwingen.
- Wenn Hooks/Webhooks oder andere Feeds mit nicht vertrauenswürdigen Inhalten aktiviert sind, verwende ein starkes modernes Modell-Tier und halte strikte Tool-Richtlinien/Sandboxing ein.

</Step>
<Step title="Lokal vs. Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo läuft das **Gateway**?

- **Dieser Mac (nur lokal):** Das Onboarding kann Authentifizierung konfigurieren und Credentials
  lokal schreiben.
- **Remote (über SSH/Tailnet):** Das Onboarding konfiguriert **keine** lokale Authentifizierung;
  Credentials müssen auf dem Gateway-Host vorhanden sein.
- **Später konfigurieren:** Einrichtung überspringen und die App unkonfiguriert lassen.

<Tip>
**Tipp zur Gateway-Authentifizierung:**

- Der Assistent generiert jetzt selbst für loopback einen **Token**, sodass lokale WS-Clients sich authentifizieren müssen.
- Wenn du die Authentifizierung deaktivierst, kann sich jeder lokale Prozess verbinden; verwende das nur auf vollständig vertrauenswürdigen Rechnern.
- Verwende einen **Token** für den Zugriff über mehrere Rechner oder für Bindings ohne loopback.

</Tip>
</Step>
<Step title="Berechtigungen">
<Frame caption="Wähle aus, welche Berechtigungen du OpenClaw geben möchtest">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Das Onboarding fordert die für Folgendes benötigten TCC-Berechtigungen an:

- Automatisierung (AppleScript)
- Mitteilungen
- Bedienungshilfen
- Bildschirmaufnahme
- Mikrofon
- Spracherkennung
- Kamera
- Standort

</Step>
<Step title="CLI">
  <Info>Dieser Schritt ist optional</Info>
  Die App kann die globale `openclaw`-CLI über npm, pnpm oder bun installieren.
  Sie bevorzugt zuerst npm, dann pnpm und dann bun, wenn dies der einzige erkannte
  Paketmanager ist. Für die Gateway-Laufzeit bleibt Node der empfohlene Pfad.
</Step>
<Step title="Onboarding-Chat (dedizierte Session)">
  Nach der Einrichtung öffnet die App eine dedizierte Onboarding-Chat-Session, damit der Agent sich
  vorstellen und die nächsten Schritte anleiten kann. So bleibt die Anleitung beim ersten Start getrennt
  von deinem normalen Gespräch. Siehe [Bootstrapping](/start/bootstrapping), um zu erfahren,
  was auf dem Gateway-Host beim ersten Lauf des Agenten passiert.
</Step>
</Steps>
