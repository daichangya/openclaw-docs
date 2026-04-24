---
read_when:
    - Vous souhaitez lister les sessions stockées et voir l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions stockées + l’utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-04-24T07:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Lister les sessions de conversation stockées.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Sélection du périmètre :

- par défaut : magasin de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : magasin d’un agent configuré
- `--all-agents` : agréger tous les magasins d’agents configurés
- `--store <path>` : chemin explicite du magasin (ne peut pas être combiné avec `--agent` ou `--all-agents`)

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte des sessions Gateway et ACP
est plus large : elle inclut aussi les magasins présents uniquement sur disque trouvés sous
la racine `agents/` par défaut ou une racine `session.store` basée sur un modèle. Ces
magasins découverts doivent se résoudre en fichiers `sessions.json` ordinaires dans la
racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

Exemples JSON :

`openclaw sessions --all-agents --json` :

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Maintenance de nettoyage

Exécuter la maintenance maintenant (au lieu d’attendre le prochain cycle d’écriture) :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Remarque de périmètre : `openclaw sessions cleanup` maintient uniquement les magasins/transcriptions de session. Il n’élague pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans [Configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans [Maintenance Cron](/fr/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualiser combien d’entrées seraient élaguées/limitées sans écrire.
  - En mode texte, `dry-run` affiche un tableau d’action par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : appliquer la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprimer les entrées dont les fichiers de transcription sont manquants, même si elles ne dépasseraient normalement pas encore les seuils d’âge/de nombre.
- `--active-key <key>` : protéger une clé active spécifique contre l’éviction liée au budget disque.
- `--agent <id>` : exécuter le nettoyage pour le magasin d’un agent configuré.
- `--all-agents` : exécuter le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécuter sur un fichier `sessions.json` spécifique.
- `--json` : afficher un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

`openclaw sessions cleanup --all-agents --dry-run --json` :

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Associé :

- Configuration de session : [Référence de configuration](/fr/gateway/config-agents#session)

## Associé

- [Référence CLI](/fr/cli)
- [Gestion des sessions](/fr/concepts/session)
