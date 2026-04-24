---
read_when:
    - Entwerfen des Onboarding-Assistenten für macOS
    - Implementieren von Authentifizierung oder Identitätseinrichtung
sidebarTitle: 'Onboarding: macOS App'
summary: Ablauf der Ersteinrichtung für OpenClaw (macOS-App)
title: Onboarding (macOS-App)
x-i18n:
    generated_at: "2026-04-24T07:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Diese Dokumentation beschreibt den **aktuellen** Ablauf der Ersteinrichtung. Ziel ist eine
reibungslose „Tag 0“-Erfahrung: auswählen, wo das Gateway läuft, Auth verbinden, den
Assistenten ausführen und den Agenten sich selbst bootstrappen lassen.
Einen allgemeinen Überblick über Onboarding-Pfade finden Sie unter [Onboarding Overview](/de/start/onboarding-overview).

<Steps>
<Step title="macOS-Warnung bestätigen">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Lokale Netzwerke finden erlauben">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Willkommen und Sicherheitshinweis">
<Frame caption="Lesen Sie den angezeigten Sicherheitshinweis und entscheiden Sie entsprechend">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Sicherheits-Vertrauensmodell:

- Standardmäßig ist OpenClaw ein persönlicher Agent: eine vertrauenswürdige Operatorgrenze.
- Gemeinsam genutzte/Mehrbenutzer-Setups erfordern Härtung (Vertrauensgrenzen aufteilen, Tool-Zugriff minimal halten und [Security](/de/gateway/security) befolgen).
- Lokales Onboarding setzt neue Konfigurationen jetzt standardmäßig auf `tools.profile: "coding"`, sodass frische lokale Setups Dateisystem-/Laufzeit-Tools behalten, ohne das uneingeschränkte Profil `full` zu erzwingen.
- Wenn Hooks/Webhooks oder andere Feeds mit nicht vertrauenswürdigen Inhalten aktiviert sind, verwenden Sie eine starke moderne Modellklasse und halten Sie Tool-Richtlinie/Sandboxing strikt.

</Step>
<Step title="Lokal vs. Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo läuft das **Gateway**?

- **Dieser Mac (nur lokal):** Das Onboarding kann Auth konfigurieren und Zugangsdaten
  lokal schreiben.
- **Remote (über SSH/Tailnet):** Das Onboarding konfiguriert **keine** lokale Auth;
  Zugangsdaten müssen auf dem Gateway-Host vorhanden sein.
- **Später konfigurieren:** Setup überspringen und die App unkonfiguriert lassen.

<Tip>
**Tipp zur Gateway-Auth:**

- Der Assistent erzeugt jetzt selbst für Loopback ein **Token**, sodass lokale WS-Clients sich authentifizieren müssen.
- Wenn Sie Auth deaktivieren, kann sich jeder lokale Prozess verbinden; verwenden Sie das nur auf vollständig vertrauenswürdigen Maschinen.
- Verwenden Sie ein **Token** für Mehrmaschinenzugriff oder Binds außerhalb von Loopback.

</Tip>
</Step>
<Step title="Berechtigungen">
<Frame caption="Wählen Sie aus, welche Berechtigungen Sie OpenClaw geben möchten">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Das Onboarding fordert TCC-Berechtigungen an, die benötigt werden für:

- Automatisierung (AppleScript)
- Benachrichtigungen
- Bedienungshilfen
- Bildschirmaufzeichnung
- Mikrofon
- Spracherkennung
- Kamera
- Standort

</Step>
<Step title="CLI">
  <Info>Dieser Schritt ist optional</Info>
  Die App kann die globale CLI `openclaw` über npm, pnpm oder bun installieren.
  Sie bevorzugt zuerst npm, dann pnpm und dann bun, wenn dies der einzig erkannte
  Paketmanager ist. Für die Gateway-Laufzeit bleibt Node der empfohlene Pfad.
</Step>
<Step title="Onboarding-Chat (dedizierte Sitzung)">
  Nach dem Setup öffnet die App eine dedizierte Onboarding-Chat-Sitzung, damit der Agent
  sich vorstellen und die nächsten Schritte anleiten kann. Dadurch bleibt die Anleitung beim ersten Start
  von Ihrer normalen Unterhaltung getrennt. Siehe [Bootstrapping](/de/start/bootstrapping) für
  das, was auf dem Gateway-Host während des ersten Agent-Laufs geschieht.
</Step>
</Steps>

## Verwandt

- [Onboarding Overview](/de/start/onboarding-overview)
- [Erste Schritte](/de/start/getting-started)
