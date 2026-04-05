---
read_when:
    - Vous voulez lister les sessions stockées et voir l’activité récente
summary: Référence CLI pour `openclaw sessions` (liste des sessions stockées + utilisation)
title: sessions
x-i18n:
    generated_at: "2026-04-05T12:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Sélection de portée :

- par défaut : magasin de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : un magasin d’agent configuré
- `--all-agents` : agrège tous les magasins d’agents configurés
- `--store <path>` : chemin explicite du magasin (ne peut pas être combiné avec `--agent` ou `--all-agents`)

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte des
sessions Gateway et ACP est plus large : elle inclut aussi les magasins présents
uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store`
modélisée. Ces magasins découverts doivent se résoudre en fichiers `sessions.json`
réguliers à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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

Exécutez la maintenance maintenant (au lieu d’attendre le prochain cycle d’écriture) :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Remarque sur la portée : `openclaw sessions cleanup` maintient uniquement les magasins/transcriptions de session. Il n’élague pas les journaux d’exécution cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [Configuration cron](/automation/cron-jobs#configuration) et expliqués dans [Maintenance cron](/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualise combien d’entrées seraient élaguées/limitées sans écriture.
  - En mode texte, l’exécution à blanc affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : applique la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprime les entrées dont les fichiers de transcription sont manquants, même si elles ne devraient normalement pas encore sortir par ancienneté ou par nombre.
- `--active-key <key>` : protège une clé active spécifique contre l’éviction liée au budget disque.
- `--agent <id>` : exécute le nettoyage pour un magasin d’agent configuré.
- `--all-agents` : exécute le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécute sur un fichier `sessions.json` spécifique.
- `--json` : affiche un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

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

Lié :

- Configuration des sessions : [Référence de configuration](/gateway/configuration-reference#session)
