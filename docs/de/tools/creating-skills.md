---
read_when:
    - Sie erstellen einen neuen benutzerdefinierten Skill in Ihrem Workspace
    - Sie benötigen einen kurzen Einstieg in den Workflow für Skills auf Basis von SKILL.md
summary: Eigene Workspace-Skills mit SKILL.md erstellen und testen
title: Skills erstellen
x-i18n:
    generated_at: "2026-04-05T12:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Skills erstellen

Skills bringen dem Agenten bei, wie und wann Tools verwendet werden sollen. Jeder Skill ist ein Verzeichnis,
das eine Datei `SKILL.md` mit YAML-Frontmatter und Markdown-Anweisungen enthält.

Informationen dazu, wie Skills geladen und priorisiert werden, finden Sie unter [Skills](/tools/skills).

## Erstellen Sie Ihren ersten Skill

<Steps>
  <Step title="Skill-Verzeichnis erstellen">
    Skills befinden sich in Ihrem Workspace. Erstellen Sie einen neuen Ordner:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md schreiben">
    Erstellen Sie `SKILL.md` in diesem Verzeichnis. Das Frontmatter definiert Metadaten,
    und der Markdown-Text enthält Anweisungen für den Agenten.

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
    Sie können benutzerdefinierte Tool-Schemas im Frontmatter definieren oder den Agenten
    anweisen, vorhandene System-Tools zu verwenden (wie `exec` oder `browser`). Skills können auch
    innerhalb von Plugins zusammen mit den Tools ausgeliefert werden, die sie dokumentieren.

  </Step>

  <Step title="Den Skill laden">
    Starten Sie eine neue Sitzung, damit OpenClaw den Skill übernimmt:

    ```bash
    # Aus dem Chat
    /new

    # Oder das Gateway neu starten
    openclaw gateway restart
    ```

    Prüfen Sie, ob der Skill geladen wurde:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Ihn testen">
    Senden Sie eine Nachricht, die den Skill auslösen sollte:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oder chatten Sie einfach mit dem Agenten und bitten Sie um eine Begrüßung.

  </Step>
</Steps>

## Referenz für Skill-Metadaten

Das YAML-Frontmatter unterstützt diese Felder:

| Feld                                | Erforderlich | Beschreibung                                |
| ----------------------------------- | ------------ | ------------------------------------------- |
| `name`                              | Ja           | Eindeutige Kennung (`snake_case`)           |
| `description`                       | Ja           | Einzeilige Beschreibung, die dem Agenten angezeigt wird |
| `metadata.openclaw.os`              | Nein         | OS-Filter (`["darwin"]`, `["linux"]` usw.)  |
| `metadata.openclaw.requires.bins`   | Nein         | Erforderliche Binärdateien im PATH          |
| `metadata.openclaw.requires.config` | Nein         | Erforderliche Konfigurationsschlüssel       |

## Best Practices

- **Seien Sie prägnant** — weisen Sie das Modell an, _was_ zu tun ist, nicht wie es eine KI sein soll
- **Sicherheit zuerst** — wenn Ihr Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine beliebige Befehlsinjektion aus nicht vertrauenswürdigen Eingaben zulassen
- **Lokal testen** — verwenden Sie `openclaw agent --message "..."`, um vor dem Teilen zu testen
- **ClawHub verwenden** — durchsuchen Sie Skills und tragen Sie dazu bei unter [ClawHub](https://clawhub.ai)

## Wo Skills gespeichert werden

| Speicherort                    | Priorität | Geltungsbereich         |
| ----------------------------- | --------- | ----------------------- |
| `\<workspace\>/skills/`       | Höchste   | Pro Agent               |
| `\<workspace\>/.agents/skills/` | Hoch    | Pro Workspace-Agent     |
| `~/.agents/skills/`           | Mittel    | Geteiltes Agent-Profil  |
| `~/.openclaw/skills/`         | Mittel    | Geteilt (alle Agenten)  |
| Gebündelt (mit OpenClaw ausgeliefert) | Niedrig | Global         |
| `skills.load.extraDirs`       | Niedrigste | Benutzerdefinierte geteilte Ordner |

## Verwandt

- [Skills-Referenz](/tools/skills) — Regeln für Laden, Priorität und Gating
- [Skills-Konfiguration](/tools/skills-config) — Konfigurationsschema `skills.*`
- [ClawHub](/tools/clawhub) — öffentliches Skill-Register
- [Plugins erstellen](/plugins/building-plugins) — Plugins können Skills mitliefern
