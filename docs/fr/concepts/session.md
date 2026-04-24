---
read_when:
    - Vous souhaitez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer le périmètre des messages privés pour des configurations multi-utilisateurs
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-04-24T07:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organise les conversations en **sessions**. Chaque message est acheminé vers une
session selon son origine — messages privés, discussions de groupe, tâches Cron, etc.

## Comment les messages sont acheminés

| Source          | Comportement               |
| --------------- | -------------------------- |
| Messages privés | Session partagée par défaut |
| Discussions de groupe     | Isolées par groupe        |
| Salons/canaux  | Isolés par salon         |
| Tâches Cron       | Nouvelle session à chaque exécution     |
| Webhooks        | Isolés par hook         |

## Isolation des messages privés

Par défaut, tous les messages privés partagent une seule session pour assurer la continuité. Cela convient pour
les configurations mono-utilisateur.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des messages privés. Sans cela, tous
les utilisateurs partagent le même contexte de conversation — les messages privés d’Alice seraient
visibles par Bob.
</Warning>

**Le correctif :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoler par canal + expéditeur
  },
}
```

Autres options :

- `main` (par défaut) — tous les messages privés partagent une seule session.
- `per-peer` — isolation par expéditeur (tous canaux confondus).
- `per-channel-peer` — isolation par canal + expéditeur (recommandé).
- `per-account-channel-peer` — isolation par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une même session.
</Tip>

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration :

- **Réinitialisation quotidienne** (par défaut) — nouvelle session à 4:00 du matin, heure locale, sur l’hôte
  du Gateway.
- **Réinitialisation sur inactivité** (facultative) — nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`.
- **Réinitialisation manuelle** — tapez `/new` ou `/reset` dans la discussion. `/new <model>` change aussi
  le modèle.

Lorsque les réinitialisations quotidiennes et sur inactivité sont toutes deux configurées, celle qui expire en premier l’emporte.

Les sessions avec une session CLI active détenue par le fournisseur ne sont pas coupées par la valeur par défaut implicite
de réinitialisation quotidienne. Utilisez `/reset` ou configurez `session.reset` explicitement lorsque ces
sessions doivent expirer selon un minuteur.

## Où l’état est stocké

Tout l’état des sessions appartient au **Gateway**. Les clients d’interface interrogent le Gateway pour
obtenir les données de session.

- **Magasin :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Maintenance des sessions

OpenClaw limite automatiquement le stockage des sessions au fil du temps. Par défaut, il fonctionne
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

- `openclaw status` — chemin du magasin de sessions et activité récente.
- `openclaw sessions --json` — toutes les sessions (filtrez avec `--active <minutes>`).
- `/status` dans la discussion — utilisation du contexte, modèle et bascules.
- `/context list` — ce qui se trouve dans l’invite système.

## Pour aller plus loin

- [Élagage de session](/fr/concepts/session-pruning) — troncature des résultats d’outils
- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) — outils d’agent pour le travail inter-sessions
- [Présentation approfondie de la gestion de session](/fr/reference/session-management-compaction) —
  schéma du magasin, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-Agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages entrants sont acheminés vers les sessions

## Associé

- [Élagage de session](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File de commandes](/fr/concepts/queue)
