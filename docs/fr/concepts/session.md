---
read_when:
    - Vous voulez comprendre le routage et l’isolation des sessions
    - Vous voulez configurer la portée des DM pour des configurations multi-utilisateurs
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-04-05T12:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Gestion des sessions

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session selon sa provenance — DM, discussions de groupe, tâches cron, etc.

## Comment les messages sont routés

| Source          | Comportement                    |
| --------------- | ------------------------------- |
| Messages directs | Session partagée par défaut     |
| Discussions de groupe | Isolées par groupe         |
| Salles/canaux   | Isolés par salle                |
| Tâches cron     | Nouvelle session à chaque exécution |
| Webhooks        | Isolés par webhook             |

## Isolation des DM

Par défaut, tous les DM partagent une seule session pour assurer la continuité. Cela convient
aux configurations à utilisateur unique.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des DM. Sinon, tous les
utilisateurs partagent le même contexte de conversation — les messages privés d’Alice seraient
visibles par Bob.
</Warning>

**La solution :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoler par canal + expéditeur
  },
}
```

Autres options :

- `main` (par défaut) — tous les DM partagent une seule session.
- `per-peer` — isolation par expéditeur (tous canaux confondus).
- `per-channel-peer` — isolation par canal + expéditeur (recommandé).
- `per-account-channel-peer` — isolation par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une seule session.
</Tip>

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration :

- **Réinitialisation quotidienne** (par défaut) — nouvelle session à 4:00 du matin, heure locale, sur l’hôte gateway.
- **Réinitialisation après inactivité** (facultative) — nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`.
- **Réinitialisation manuelle** — saisissez `/new` ou `/reset` dans le chat. `/new <model>` change aussi
  de modèle.

Lorsque les réinitialisations quotidienne et après inactivité sont toutes deux configurées, la première à expirer l’emporte.

## Où l’état est stocké

Tout l’état des sessions appartient à la **gateway**. Les clients UI interrogent la gateway pour obtenir
les données de session.

- **Stockage :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Maintenance des sessions

OpenClaw borne automatiquement le stockage des sessions au fil du temps. Par défaut, il fonctionne
en mode `warn` (signale ce qui serait nettoyé). Définissez `session.maintenance.mode`
sur `"enforce"` pour un nettoyage automatique :

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspection des sessions

- `openclaw status` — chemin du stockage de sessions et activité récente.
- `openclaw sessions --json` — toutes les sessions (filtrez avec `--active <minutes>`).
- `/status` dans le chat — utilisation du contexte, modèle et bascules.
- `/context list` — ce qui se trouve dans le prompt système.

## Pour aller plus loin

- [Élagage des sessions](/concepts/session-pruning) — réduction des résultats d’outils
- [Compaction](/concepts/compaction) — résumé des longues conversations
- [Outils de session](/concepts/session-tool) — outils d’agent pour le travail inter-sessions
- [Analyse approfondie de la gestion des sessions](/reference/session-management-compaction) —
  schéma de stockage, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-Agent](/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches en arrière-plan](/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Routage des canaux](/channels/channel-routing) — comment les messages entrants sont routés vers les sessions
