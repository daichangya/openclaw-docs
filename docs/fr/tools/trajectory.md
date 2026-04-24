---
read_when:
    - Déboguer pourquoi un agent a répondu, échoué ou appelé des outils d’une certaine manière
    - Exporter un bundle de support pour une session OpenClaw
    - Examiner le contexte de l’invite, les appels d’outils, les erreurs d’exécution ou les métadonnées d’usage
    - Désactiver ou déplacer la capture de trajectoire
summary: Exporter des bundles de trajectoire expurgés pour déboguer une session d’agent OpenClaw
title: Bundles de trajectoire
x-i18n:
    generated_at: "2026-04-24T07:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

La capture de trajectoire est l’enregistreur de vol par session d’OpenClaw. Elle enregistre une
chronologie structurée pour chaque exécution d’agent, puis `/export-trajectory` empaquette la
session actuelle dans un bundle de support expurgé.

Utilisez-la lorsque vous devez répondre à des questions comme :

- Quelle invite, quelle invite système et quels outils ont été envoyés au modèle ?
- Quels messages de transcription et appels d’outils ont conduit à cette réponse ?
- L’exécution a-t-elle expiré, été interrompue, compactée ou rencontré une erreur fournisseur ?
- Quels modèle, plugins, Skills et paramètres d’exécution étaient actifs ?
- Quelles métadonnées d’usage et de prompt-cache le fournisseur a-t-il renvoyées ?

## Démarrage rapide

Envoyez ceci dans la session active :

```text
/export-trajectory
```

Alias :

```text
/trajectory
```

OpenClaw écrit le bundle dans l’espace de travail :

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Vous pouvez choisir un nom de répertoire de sortie relatif :

```text
/export-trajectory bug-1234
```

Le chemin personnalisé est résolu dans `.openclaw/trajectory-exports/`. Les chemins absolus
et les chemins `~` sont rejetés.

## Accès

L’export de trajectoire est une commande propriétaire. L’expéditeur doit passer les vérifications normales
d’autorisation de commande et les vérifications de propriétaire pour le canal.

## Ce qui est enregistré

La capture de trajectoire est activée par défaut pour les exécutions d’agent OpenClaw.

Les événements d’exécution incluent :

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Les événements de transcription sont également reconstruits depuis la branche de session active :

- messages utilisateur
- messages assistant
- appels d’outils
- résultats d’outils
- Compactions
- changements de modèle
- libellés et entrées de session personnalisées

Les événements sont écrits au format JSON Lines avec ce marqueur de schéma :

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Fichiers du bundle

Un bundle exporté peut contenir :

| Fichier               | Contenu                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Schéma du bundle, fichiers source, nombre d’événements et liste des fichiers générés            |
| `events.jsonl`        | Chronologie ordonnée d’exécution et de transcription                                             |
| `session-branch.json` | Branche de transcription active expurgée et en-tête de session                                   |
| `metadata.json`       | Version OpenClaw, OS/runtime, modèle, snapshot de config, plugins, Skills et métadonnées d’invite |
| `artifacts.json`      | Statut final, erreurs, usage, prompt cache, nombre de Compactions, texte assistant et métadonnées d’outils |
| `prompts.json`        | Invites soumises et détails sélectionnés de construction d’invite                                |
| `system-prompt.txt`   | Dernière invite système compilée, lorsqu’elle a été capturée                                     |
| `tools.json`          | Définitions d’outils envoyées au modèle, lorsqu’elles ont été capturées                          |

`manifest.json` liste les fichiers présents dans ce bundle. Certains fichiers sont omis
lorsque la session n’a pas capturé les données d’exécution correspondantes.

## Emplacement de capture

Par défaut, les événements de trajectoire d’exécution sont écrits à côté du fichier de session :

```text
<session>.trajectory.jsonl
```

OpenClaw écrit également un fichier pointeur au mieux à côté de la session :

```text
<session>.trajectory-path.json
```

Définissez `OPENCLAW_TRAJECTORY_DIR` pour stocker les sidecars de trajectoire d’exécution dans un
répertoire dédié :

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Lorsque cette variable est définie, OpenClaw écrit un fichier JSONL par identifiant de session dans ce
répertoire.

## Désactiver la capture

Définissez `OPENCLAW_TRAJECTORY=0` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY=0
```

Cela désactive la capture de trajectoire d’exécution. `/export-trajectory` peut toujours exporter
la branche de transcription, mais les fichiers réservés à l’exécution comme le contexte compilé,
les artefacts fournisseur et les métadonnées d’invite peuvent manquer.

## Confidentialité et limites

Les bundles de trajectoire sont conçus pour le support et le débogage, pas pour une publication publique.
OpenClaw expurge les valeurs sensibles avant d’écrire les fichiers d’export :

- identifiants et champs de charge utile connus de type secret
- données d’image
- chemins d’état locaux
- chemins d’espace de travail, remplacés par `$WORKSPACE_DIR`
- chemins de répertoire personnel, lorsqu’ils sont détectés

L’exporteur borne également la taille des entrées :

- fichiers sidecar d’exécution : 50 MiB
- fichiers de session : 50 MiB
- événements d’exécution : 200,000
- total des événements exportés : 250,000
- les lignes d’événement d’exécution individuelles sont tronquées au-delà de 256 KiB

Examinez les bundles avant de les partager en dehors de votre équipe. L’expurgation est réalisée au mieux
et ne peut pas connaître tous les secrets spécifiques à l’application.

## Dépannage

Si l’export ne contient aucun événement d’exécution :

- confirmez qu’OpenClaw a été démarré sans `OPENCLAW_TRAJECTORY=0`
- vérifiez si `OPENCLAW_TRAJECTORY_DIR` pointe vers un répertoire accessible en écriture
- exécutez un autre message dans la session, puis exportez de nouveau
- inspectez `manifest.json` pour `runtimeEventCount`

Si la commande rejette le chemin de sortie :

- utilisez un nom relatif comme `bug-1234`
- ne passez pas `/tmp/...` ou `~/...`
- gardez l’export dans `.openclaw/trajectory-exports/`

Si l’export échoue avec une erreur de taille, la session ou le sidecar a dépassé les
limites de sécurité de l’export. Démarrez une nouvelle session ou exportez une reproduction plus petite.

## Associé

- [Diffs](/fr/tools/diffs)
- [Gestion de session](/fr/concepts/session)
- [Outil Exec](/fr/tools/exec)
