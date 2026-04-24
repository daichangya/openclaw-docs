---
read_when:
    - Sie erstellen eine neue benutzerdefinierte Skill in Ihrem Workspace
    - Sie benötigen einen schnellen Starter-Workflow für SKILL.md-basierte Skills
summary: Benutzerdefinierte Workspace-Skills mit SKILL.md erstellen und testen
title: Skills erstellen
x-i18n:
    generated_at: "2026-04-24T07:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills bringen dem Agenten bei, wie und wann Tools verwendet werden sollen. Jede Skill ist ein Verzeichnis,
das eine Datei `SKILL.md` mit YAML-Frontmatter und Markdown-Anweisungen enthält.

Wie Skills geladen und priorisiert werden, finden Sie unter [Skills](/de/tools/skills).

## Ihre erste Skill erstellen

<Steps>
  <Step title="Das Skill-Verzeichnis erstellen">
    Skills liegen in Ihrem Workspace. Erstellen Sie einen neuen Ordner:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md schreiben">
    Erstellen Sie `SKILL.md` in diesem Verzeichnis. Das Frontmatter definiert Metadaten,
    und der Markdown-Body enthält Anweisungen für den Agenten.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Tools hinzufügen (optional)">
    Sie können benutzerdefinierte Tool-Schemas im Frontmatter definieren oder den Agenten anweisen,
    vorhandene System-Tools (wie `exec` oder `browser`) zu verwenden. Skills können auch
    innerhalb von Plugins mit den Tools ausgeliefert werden, die sie dokumentieren.

  </Step>

  <Step title="Die Skill laden">
    Starten Sie eine neue Sitzung, damit OpenClaw die Skill übernimmt:

    ```bash
    # Aus dem Chat heraus
    /new

    # Oder das Gateway neu starten
    openclaw gateway restart
    ```

    Prüfen Sie, dass die Skill geladen wurde:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Sie testen">
    Senden Sie eine Nachricht, die die Skill auslösen sollte:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oder chatten Sie einfach mit dem Agenten und bitten Sie um eine Begrüßung.

  </Step>
</Steps>

## Referenz für Skill-Metadaten

Das YAML-Frontmatter unterstützt diese Felder:

| Feld                                | Erforderlich | Beschreibung                                 |
| ----------------------------------- | ------------ | -------------------------------------------- |
| `name`                              | Ja           | Eindeutiger Bezeichner (`snake_case`)        |
| `description`                       | Ja           | Einzeilige Beschreibung, die dem Agenten angezeigt wird |
| `metadata.openclaw.os`              | Nein         | OS-Filter (`["darwin"]`, `["linux"]` usw.)   |
| `metadata.openclaw.requires.bins`   | Nein         | Erforderliche Binärdateien auf PATH          |
| `metadata.openclaw.requires.config` | Nein         | Erforderliche Konfigurationsschlüssel        |

## Best Practices

- **Prägnant sein** — weisen Sie das Modell an, _was_ es tun soll, nicht wie es eine KI sein soll
- **Sicherheit zuerst** — wenn Ihre Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine beliebige Befehlsinjektion aus nicht vertrauenswürdigen Eingaben erlauben
- **Lokal testen** — verwenden Sie `openclaw agent --message "..."`, um vor dem Teilen zu testen
- **ClawHub verwenden** — Skills unter [ClawHub](https://clawhub.ai) durchsuchen und beitragen

## Wo Skills liegen

| Ort                              | Priorität | Geltungsbereich         |
| -------------------------------- | --------- | ----------------------- |
| `\<workspace\>/skills/`          | Höchste   | Pro Agent               |
| `\<workspace\>/.agents/skills/`  | Hoch      | Pro Workspace-Agent     |
| `~/.agents/skills/`              | Mittel    | Gemeinsames Agentenprofil |
| `~/.openclaw/skills/`            | Mittel    | Gemeinsam (alle Agenten) |
| Gebündelt (mit OpenClaw ausgeliefert) | Niedrig | Global                  |
| `skills.load.extraDirs`          | Niedrigste| Benutzerdefinierte gemeinsame Ordner |

## Verwandt

- [Skills reference](/de/tools/skills) — Regeln zum Laden, zur Priorität und zum Gating
- [Skills config](/de/tools/skills-config) — Konfigurationsschema `skills.*`
- [ClawHub](/de/tools/clawhub) — öffentliche Skill-Registry
- [Building Plugins](/de/plugins/building-plugins) — Plugins können Skills ausliefern
