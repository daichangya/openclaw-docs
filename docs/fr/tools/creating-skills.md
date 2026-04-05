---
read_when:
    - Vous créez une nouvelle Skill personnalisée dans votre workspace
    - Vous avez besoin d'un flux de démarrage rapide pour les Skills basées sur SKILL.md
summary: Créer et tester des Skills de workspace personnalisées avec SKILL.md
title: Créer des Skills
x-i18n:
    generated_at: "2026-04-05T12:55:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Créer des Skills

Les Skills apprennent à l'agent comment et quand utiliser les outils. Chaque Skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions en markdown.

Pour savoir comment les Skills sont chargées et priorisées, voir [Skills](/tools/skills).

## Créez votre première Skill

<Steps>
  <Step title="Créer le répertoire de la Skill">
    Les Skills vivent dans votre workspace. Créez un nouveau dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Écrire SKILL.md">
    Créez `SKILL.md` dans ce répertoire. Le frontmatter définit les métadonnées,
    et le corps markdown contient les instructions pour l'agent.

    ```markdown
    ---
    name: hello_world
    description: Une Skill simple qui dit bonjour.
    ---

    # Hello World Skill

    Quand l'utilisateur demande une salutation, utilisez l'outil `echo` pour dire
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Ajouter des outils (facultatif)">
    Vous pouvez définir des schémas d'outils personnalisés dans le frontmatter ou demander à l'agent
    d'utiliser des outils système existants (comme `exec` ou `browser`). Les Skills peuvent aussi
    être fournies dans des plugins à côté des outils qu'elles documentent.

  </Step>

  <Step title="Charger la Skill">
    Démarrez une nouvelle session pour qu'OpenClaw prenne en compte la Skill :

    ```bash
    # Depuis le chat
    /new

    # Ou redémarrer la gateway
    openclaw gateway restart
    ```

    Vérifiez que la Skill a été chargée :

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="La tester">
    Envoyez un message qui doit déclencher la Skill :

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou discutez simplement avec l'agent et demandez une salutation.

  </Step>
</Steps>

## Référence des métadonnées de Skill

Le frontmatter YAML prend en charge ces champs :

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Oui      | Identifiant unique (snake_case)             |
| `description`                       | Oui      | Description sur une ligne affichée à l'agent |
| `metadata.openclaw.os`              | Non      | Filtre d'OS (`["darwin"]`, `["linux"]`, etc.) |
| `metadata.openclaw.requires.bins`   | Non      | Binaires requis dans le PATH                |
| `metadata.openclaw.requires.config` | Non      | Clés de configuration requises              |

## Bonnes pratiques

- **Soyez concis** — indiquez au modèle _quoi_ faire, pas comment être une IA
- **La sécurité avant tout** — si votre Skill utilise `exec`, assurez-vous que les prompts n'autorisent pas l'injection de commandes arbitraires à partir d'entrées non fiables
- **Testez localement** — utilisez `openclaw agent --message "..."` pour tester avant de partager
- **Utilisez ClawHub** — parcourez et contribuez des Skills sur [ClawHub](https://clawhub.ai)

## Où vivent les Skills

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | La plus haute | Par agent          |
| `\<workspace\>/.agents/skills/` | Haute      | Par agent du workspace |
| `~/.agents/skills/`             | Moyenne    | Profil d'agent partagé |
| `~/.openclaw/skills/`           | Moyenne    | Partagé (tous les agents) |
| Bundled (shipped with OpenClaw) | Basse      | Global                |
| `skills.load.extraDirs`         | La plus basse | Dossiers partagés personnalisés |

## Lié

- [Référence Skills](/tools/skills) — chargement, priorité et règles de contrôle
- [Configuration des Skills](/tools/skills-config) — schéma de configuration `skills.*`
- [ClawHub](/tools/clawhub) — registre public de Skills
- [Building Plugins](/fr/plugins/building-plugins) — les plugins peuvent fournir des Skills
