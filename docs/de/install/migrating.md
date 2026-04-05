---
read_when:
    - Sie verschieben OpenClaw auf einen neuen Laptop/Server
    - Sie möchten Sitzungen, Authentifizierung und Kanal-Anmeldungen (WhatsApp usw.) beibehalten
summary: Eine OpenClaw-Installation von einem Rechner auf einen anderen verschieben (migrieren)
title: Migrationsanleitung
x-i18n:
    generated_at: "2026-04-05T12:47:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw auf einen neuen Rechner migrieren

Diese Anleitung verschiebt ein OpenClaw-Gateway auf einen neuen Rechner, ohne das Onboarding erneut durchführen zu müssen.

## Was migriert wird

Wenn Sie das **Zustandsverzeichnis** (`~/.openclaw/` standardmäßig) und Ihren **Workspace** kopieren, bleiben folgende Dinge erhalten:

- **Konfiguration** -- `openclaw.json` und alle Gateway-Einstellungen
- **Authentifizierung** -- `auth-profiles.json` pro Agent (API-Schlüssel + OAuth) sowie jeder Kanal-/Provider-Zustand unter `credentials/`
- **Sitzungen** -- Konversationsverlauf und Agent-Zustand
- **Kanalzustand** -- WhatsApp-Anmeldung, Telegram-Sitzung usw.
- **Workspace-Dateien** -- `MEMORY.md`, `USER.md`, Skills und Prompts

<Tip>
Führen Sie `openclaw status` auf dem alten Rechner aus, um den Pfad Ihres Zustandsverzeichnisses zu bestätigen.
Benutzerdefinierte Profile verwenden `~/.openclaw-<profile>/` oder einen Pfad, der über `OPENCLAW_STATE_DIR` gesetzt ist.
</Tip>

## Migrationsschritte

<Steps>
  <Step title="Gateway stoppen und Backup erstellen">
    Stoppen Sie auf dem **alten** Rechner das Gateway, damit sich Dateien während des Kopierens nicht ändern, und archivieren Sie dann:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Wenn Sie mehrere Profile verwenden (z. B. `~/.openclaw-work`), archivieren Sie jedes separat.

  </Step>

  <Step title="OpenClaw auf dem neuen Rechner installieren">
    [Installieren Sie](/install) die CLI (und Node, falls nötig) auf dem neuen Rechner.
    Es ist in Ordnung, wenn das Onboarding ein frisches `~/.openclaw/` erstellt -- Sie überschreiben es im nächsten Schritt.
  </Step>

  <Step title="Zustandsverzeichnis und Workspace kopieren">
    Übertragen Sie das Archiv per `scp`, `rsync -a` oder über ein externes Laufwerk und entpacken Sie es dann:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Stellen Sie sicher, dass versteckte Verzeichnisse eingeschlossen wurden und der Eigentümer der Dateien mit dem Benutzer übereinstimmt, der das Gateway ausführen wird.

  </Step>

  <Step title="Doctor ausführen und prüfen">
    Führen Sie auf dem neuen Rechner [Doctor](/gateway/doctor) aus, um Konfigurationsmigrationen anzuwenden und Services zu reparieren:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Häufige Stolperfallen

<AccordionGroup>
  <Accordion title="Profil- oder State-Dir-Mismatch">
    Wenn das alte Gateway `--profile` oder `OPENCLAW_STATE_DIR` verwendet hat und das neue nicht,
    erscheinen Kanäle als abgemeldet und Sitzungen sind leer.
    Starten Sie das Gateway mit demselben **Profil** oder **State-Dir**, das Sie migriert haben, und führen Sie dann `openclaw doctor` erneut aus.
  </Accordion>

  <Accordion title="Nur openclaw.json kopieren">
    Die Konfigurationsdatei allein reicht nicht aus. Modell-Auth-Profile befinden sich unter
    `agents/<agentId>/agent/auth-profiles.json`, und Kanal-/Provider-Zustand liegt weiterhin
    unter `credentials/`. Migrieren Sie immer das **gesamte** Zustandsverzeichnis.
  </Accordion>

  <Accordion title="Berechtigungen und Eigentümerschaft">
    Wenn Sie als Root kopiert oder Benutzer gewechselt haben, kann das Gateway die Anmeldedaten möglicherweise nicht lesen.
    Stellen Sie sicher, dass das Zustandsverzeichnis und der Workspace dem Benutzer gehören, der das Gateway ausführt.
  </Accordion>

  <Accordion title="Remote-Modus">
    Wenn Ihre UI auf ein **Remote**-Gateway zeigt, besitzt der Remote-Host Sitzungen und Workspace.
    Migrieren Sie den Gateway-Host selbst, nicht Ihren lokalen Laptop. Siehe [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in Backups">
    Das Zustandsverzeichnis enthält Auth-Profile, Kanal-Anmeldedaten und anderen
    Provider-Zustand.
    Speichern Sie Backups verschlüsselt, vermeiden Sie unsichere Übertragungskanäle und rotieren Sie Schlüssel, wenn Sie eine Offenlegung vermuten.
  </Accordion>
</AccordionGroup>

## Checkliste zur Verifizierung

Prüfen Sie auf dem neuen Rechner:

- [ ] `openclaw status` zeigt, dass das Gateway läuft
- [ ] Kanäle sind noch verbunden (kein erneutes Pairing erforderlich)
- [ ] Das Dashboard öffnet sich und zeigt vorhandene Sitzungen
- [ ] Workspace-Dateien (Speicher, Konfigurationen) sind vorhanden
