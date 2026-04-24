---
read_when:
    - Sie verschieben OpenClaw auf einen neuen Laptop/Server
    - Sie möchten Sitzungen, Authentifizierung und Kanal-Logins (WhatsApp usw.) beibehalten
summary: Eine OpenClaw-Installation von einem Rechner auf einen anderen verschieben (migrieren)
title: Migrationsanleitung
x-i18n:
    generated_at: "2026-04-24T06:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw auf einen neuen Rechner migrieren

Diese Anleitung verschiebt ein OpenClaw-Gateway auf einen neuen Rechner, ohne das Onboarding erneut durchführen zu müssen.

## Was migriert wird

Wenn Sie das **Zustandsverzeichnis** (`~/.openclaw/` standardmäßig) und Ihren **Workspace** kopieren, behalten Sie Folgendes bei:

- **Konfiguration** -- `openclaw.json` und alle Gateway-Einstellungen
- **Auth** -- agentenspezifische `auth-profiles.json` (API-Schlüssel + OAuth) sowie jeder Kanal-/Provider-Zustand unter `credentials/`
- **Sitzungen** -- Gesprächsverlauf und Agentenzustand
- **Kanalzustand** -- WhatsApp-Login, Telegram-Sitzung usw.
- **Workspace-Dateien** -- `MEMORY.md`, `USER.md`, Skills und Prompts

<Tip>
Führen Sie `openclaw status` auf dem alten Rechner aus, um den Pfad Ihres Zustandsverzeichnisses zu bestätigen.
Benutzerdefinierte Profile verwenden `~/.openclaw-<profile>/` oder einen über `OPENCLAW_STATE_DIR` gesetzten Pfad.
</Tip>

## Migrationsschritte

<Steps>
  <Step title="Gateway stoppen und Backup erstellen">
    Stoppen Sie auf dem **alten** Rechner das Gateway, damit sich die Dateien während des Kopierens nicht ändern, und archivieren Sie dann:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Wenn Sie mehrere Profile verwenden (z. B. `~/.openclaw-work`), archivieren Sie jedes separat.

  </Step>

  <Step title="OpenClaw auf dem neuen Rechner installieren">
    [Installieren Sie](/de/install) die CLI (und bei Bedarf Node) auf dem neuen Rechner.
    Es ist in Ordnung, wenn das Onboarding ein frisches `~/.openclaw/` erstellt -- Sie werden es im nächsten Schritt überschreiben.
  </Step>

  <Step title="Zustandsverzeichnis und Workspace kopieren">
    Übertragen Sie das Archiv per `scp`, `rsync -a` oder externem Laufwerk und entpacken Sie es dann:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Stellen Sie sicher, dass versteckte Verzeichnisse enthalten waren und dass der Dateieigentümer mit dem Benutzer übereinstimmt, der das Gateway ausführen wird.

  </Step>

  <Step title="Doctor ausführen und verifizieren">
    Führen Sie auf dem neuen Rechner [Doctor](/de/gateway/doctor) aus, um Konfigurationsmigrationen anzuwenden und Dienste zu reparieren:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Häufige Stolperfallen

<AccordionGroup>
  <Accordion title="Nichtübereinstimmung von Profil oder Zustandsverzeichnis">
    Wenn das alte Gateway `--profile` oder `OPENCLAW_STATE_DIR` verwendet hat und das neue nicht,
    erscheinen Kanäle als ausgeloggt und Sitzungen leer.
    Starten Sie das Gateway mit demselben **Profil** oder **Zustandsverzeichnis**, das Sie migriert haben, und führen Sie dann `openclaw doctor` erneut aus.
  </Accordion>

  <Accordion title="Nur openclaw.json kopieren">
    Die Konfigurationsdatei allein reicht nicht aus. Auth-Profile für Modelle liegen unter
    `agents/<agentId>/agent/auth-profiles.json`, und Kanal-/Provider-Zustand liegt weiterhin
    unter `credentials/`. Migrieren Sie immer das **gesamte** Zustandsverzeichnis.
  </Accordion>

  <Accordion title="Berechtigungen und Eigentümer">
    Wenn Sie als Root kopiert oder den Benutzer gewechselt haben, kann das Gateway beim Lesen von Anmeldedaten fehlschlagen.
    Stellen Sie sicher, dass Zustandsverzeichnis und Workspace dem Benutzer gehören, der das Gateway ausführt.
  </Accordion>

  <Accordion title="Remote-Modus">
    Wenn Ihre UI auf ein **entferntes** Gateway zeigt, besitzt der Remote-Host Sitzungen und Workspace.
    Migrieren Sie den Gateway-Host selbst, nicht Ihren lokalen Laptop. Siehe [FAQ](/de/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in Backups">
    Das Zustandsverzeichnis enthält Auth-Profile, Kanal-Anmeldedaten und anderen
    Provider-Zustand.
    Speichern Sie Backups verschlüsselt, vermeiden Sie unsichere Übertragungskanäle und rotieren Sie Schlüssel, wenn Sie eine Offenlegung vermuten.
  </Accordion>
</AccordionGroup>

## Checkliste zur Verifizierung

Bestätigen Sie auf dem neuen Rechner:

- [ ] `openclaw status` zeigt das laufende Gateway
- [ ] Kanäle sind weiterhin verbunden (kein erneutes Pairing nötig)
- [ ] Das Dashboard öffnet sich und zeigt bestehende Sitzungen
- [ ] Workspace-Dateien (Memory, Konfigurationen) sind vorhanden

## Verwandt

- [Install overview](/de/install)
- [Matrix migration](/de/install/migrating-matrix)
- [Uninstall](/de/install/uninstall)
