---
read_when:
    - Vous créez une nouvelle skill personnalisée dans votre espace de travail
    - Vous avez besoin d’un flux de démarrage rapide pour des Skills basées sur `SKILL.md`
summary: Créer et tester des Skills d’espace de travail personnalisées avec `SKILL.md`
title: Créer des Skills
x-i18n:
    generated_at: "2026-04-24T07:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Les Skills apprennent à l’agent comment et quand utiliser des outils. Chaque skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions en markdown.

Pour savoir comment les Skills sont chargées et priorisées, voir [Skills](/fr/tools/skills).

## Créer votre première skill

<Steps>
  <Step title="Créer le répertoire de la skill">
    Les Skills vivent dans votre espace de travail. Créez un nouveau dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Écrire SKILL.md">
    Créez `SKILL.md` dans ce répertoire. Le frontmatter définit les métadonnées,
    et le corps markdown contient les instructions pour l’agent.

    ```markdown
    ---
    name: hello_world
    description: Une skill simple qui dit bonjour.
    ---

    # Skill Hello World

    Lorsque l’utilisateur demande une salutation, utilisez l’outil `echo` pour dire
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Ajouter des outils (facultatif)">
    Vous pouvez définir des schémas d’outils personnalisés dans le frontmatter ou indiquer à l’agent
    d’utiliser des outils système existants (comme `exec` ou `browser`). Les Skills peuvent aussi
    être livrées dans des plugins aux côtés des outils qu’elles documentent.

  </Step>

  <Step title="Charger la skill">
    Démarrez une nouvelle session pour qu’OpenClaw prenne en compte la skill :

    ```bash
    # Depuis le chat
    /new

    # Ou redémarrer le gateway
    openclaw gateway restart
    ```

    Vérifiez que la skill est chargée :

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="La tester">
    Envoyez un message qui doit déclencher la skill :

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou discutez simplement avec l’agent et demandez une salutation.

  </Step>
</Steps>

## Référence des métadonnées de skill

Le frontmatter YAML prend en charge ces champs :

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Oui      | Identifiant unique (`snake_case`)           |
| `description`                       | Oui      | Description sur une ligne affichée à l’agent |
| `metadata.openclaw.os`              | Non      | Filtre OS (`["darwin"]`, `["linux"]`, etc.) |
| `metadata.openclaw.requires.bins`   | Non      | Binaires requis dans PATH                   |
| `metadata.openclaw.requires.config` | Non      | Clés de configuration requises              |

## Bonnes pratiques

- **Soyez concis** — indiquez au modèle _quoi_ faire, pas comment être une IA
- **Sécurité avant tout** — si votre skill utilise `exec`, assurez-vous que les prompts ne permettent pas d’injection de commande arbitraire à partir d’entrées non fiables
- **Testez localement** — utilisez `openclaw agent --message "..."` pour tester avant de partager
- **Utilisez ClawHub** — parcourez et contribuez aux Skills sur [ClawHub](https://clawhub.ai)

## Où vivent les Skills

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | La plus haute    | Par agent             |
| `\<workspace\>/.agents/skills/` | Haute       | Par agent d’espace de travail   |
| `~/.agents/skills/`             | Moyenne     | Profil d’agent partagé  |
| `~/.openclaw/skills/`           | Moyenne     | Partagé (tous les agents)   |
| Incluses (livrées avec OpenClaw) | Faible        | Global                |
| `skills.load.extraDirs`         | La plus basse     | Dossiers partagés personnalisés |

## Lié

- [Référence Skills](/fr/tools/skills) — chargement, priorité et règles de filtrage
- [Configuration des Skills](/fr/tools/skills-config) — schéma de configuration `skills.*`
- [ClawHub](/fr/tools/clawhub) — registre public de Skills
- [Créer des plugins](/fr/plugins/building-plugins) — les plugins peuvent embarquer des Skills
