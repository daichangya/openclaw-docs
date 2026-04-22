---
read_when:
    - Ajuster la cadence du Heartbeat ou la messagerie
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
summary: Messages d’interrogation Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T06:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat ou Cron ?** Consultez [Automation & Tasks](/fr/automation) pour savoir quand utiliser l’un ou l’autre.

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse faire remonter tout ce qui nécessite de l’attention sans vous spammer.

Heartbeat est un tour planifié de la session principale — il **ne** crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
Les enregistrements de tâche sont destinés au travail détaché (exécutions ACP, sous-agents, tâches cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

1. Laissez les heartbeats activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification Anthropic OAuth/par jeton, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
2. Créez une petite liste de contrôle `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent (facultatif mais recommandé).
3. Décidez où les messages Heartbeat doivent être envoyés (`target: "none"` est la valeur par défaut ; définissez `target: "last"` pour acheminer vers le dernier contact).
4. Facultatif : activez la livraison du raisonnement Heartbeat pour plus de transparence.
5. Facultatif : utilisez un contexte d’amorçage léger si les exécutions Heartbeat n’ont besoin que de `HEARTBEAT.md`.
6. Facultatif : activez les sessions isolées pour éviter d’envoyer l’historique complet de la conversation à chaque Heartbeat.
7. Facultatif : limitez les heartbeats aux heures actives (heure locale).

Exemple de configuration :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
        directPolicy: "allow", // valeur par défaut : autoriser les cibles directes/DM ; définissez "block" pour supprimer
        lightContext: true, // facultatif : n’injecter que HEARTBEAT.md à partir des fichiers d’amorçage
        isolatedSession: true, // facultatif : nouvelle session à chaque exécution (sans historique de conversation)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facultatif : envoyer aussi un message `Reasoning:` séparé
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque le mode d’authentification détecté est Anthropic OAuth/par jeton, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps du prompt (configurable via `agents.defaults.heartbeat.prompt`) :
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Le prompt Heartbeat est envoyé **textuellement** comme message utilisateur. Le prompt système inclut une section « Heartbeat » uniquement lorsque les heartbeats sont activés pour l’agent par défaut et que l’exécution est signalée en interne.
- Lorsque les heartbeats sont désactivés avec `0m`, les exécutions normales omettent aussi `HEARTBEAT.md` du contexte d’amorçage afin que le modèle ne voie pas d’instructions réservées au Heartbeat.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré.
  En dehors de cette plage, les heartbeats sont ignorés jusqu’au prochain tick dans la plage.

## À quoi sert le prompt Heartbeat

Le prompt par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » incite l’agent à examiner les suivis en attente
  (boîte de réception, calendrier, rappels, travail en file d’attente) et à faire remonter tout ce qui est urgent.
- **Vérification humaine** : « Checkup sometimes on your human during day time » incite à envoyer occasionnellement un message léger du type « avez-vous besoin de quelque chose ? », tout en évitant le spam nocturne grâce à votre fuseau horaire local configuré (voir [/concepts/timezone](/fr/concepts/timezone)).

Heartbeat peut réagir à des [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution Heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous voulez qu’un Heartbeat fasse quelque chose de très précis (par exemple « vérifier les statistiques Gmail PubSub » ou « vérifier l’état du Gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) avec un corps personnalisé (envoyé textuellement).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez par **`HEARTBEAT_OK`**.
- Pendant les exécutions Heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est ignorée si le contenu restant est **≤ `ackMaxChars`** (valeur par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité de manière spéciale.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte d’alerte.

En dehors des heartbeats, tout `HEARTBEAT_OK` parasite au début ou à la fin d’un message est supprimé et journalisé ; un message qui n’est que `HEARTBEAT_OK` est ignoré.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // valeur par défaut : 30m (0m désactive)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // valeur par défaut : false (livre un message Reasoning: séparé lorsqu’il est disponible)
        lightContext: false, // valeur par défaut : false ; true conserve seulement HEARTBEAT.md parmi les fichiers d’amorçage de l’espace de travail
        isolatedSession: false, // valeur par défaut : false ; true exécute chaque Heartbeat dans une session fraîche (sans historique de conversation)
        target: "last", // valeur par défaut : none | options : last | none | <channel id> (core ou Plugin, par ex. "bluebubbles")
        to: "+15551234567", // remplacement facultatif propre au canal
        accountId: "ops-bot", // identifiant facultatif de canal multi-compte
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // nombre maximal de caractères autorisés après HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global de Heartbeat.
- `agents.list[].heartbeat` fusionne par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des heartbeats.
- `channels.defaults.heartbeat` définit les valeurs de visibilité par défaut pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeats par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents**
exécutent des heartbeats. Le bloc par agent fusionne par-dessus `agents.defaults.heartbeat`
(vous pouvez ainsi définir des valeurs partagées une seule fois puis les remplacer par agent).

Exemple : deux agents, seul le deuxième agent exécute des heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemple d’heures actives

Limitez les heartbeats aux heures ouvrées dans un fuseau horaire spécifique :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // facultatif ; utilise votre userTimezone s’il est défini, sinon le fuseau de l’hôte
        },
      },
    },
  },
}
```

En dehors de cette plage (avant 9 h ou après 22 h, heure de l’Est), les heartbeats sont ignorés. Le prochain tick planifié à l’intérieur de la plage s’exécutera normalement.

### Configuration 24 h/24, 7 j/7

Si vous voulez que les heartbeats s’exécutent toute la journée, utilisez l’un de ces schémas :

- Omettez entièrement `activeHours` (aucune restriction de plage horaire ; c’est le comportement par défaut).
- Définissez une plage d’une journée entière : `activeHours: { start: "00:00", end: "24:00" }`.

Ne définissez pas la même heure pour `start` et `end` (par exemple `08:00` à `08:00`).
Cela est traité comme une plage de largeur nulle, donc les heartbeats sont toujours ignorés.

### Exemple multi-compte

Utilisez `accountId` pour cibler un compte précis sur des canaux multi-comptes comme Telegram :

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // facultatif : acheminer vers un sujet/thread spécifique
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Notes sur les champs

- `every` : intervalle Heartbeat (chaîne de durée ; unité par défaut = minutes).
- `model` : remplacement facultatif du modèle pour les exécutions Heartbeat (`provider/model`).
- `includeReasoning` : lorsqu’il est activé, livre aussi le message séparé `Reasoning:` lorsqu’il est disponible (même format que `/reasoning on`).
- `lightContext` : lorsque la valeur est true, les exécutions Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsque la valeur est true, chaque Heartbeat s’exécute dans une session fraîche sans historique de conversation antérieur. Utilise le même schéma d’isolation que Cron `sessionTarget: "isolated"`. Réduit fortement le coût en jetons par Heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de livraison utilise toujours le contexte de la session principale.
- `session` : clé de session facultative pour les exécutions Heartbeat.
  - `main` (valeur par défaut) : session principale de l’agent.
  - Clé de session explicite (copiez depuis `openclaw sessions --json` ou le [CLI des sessions](/cli/sessions)).
  - Formats de clé de session : voir [Sessions](/fr/concepts/session) et [Groups](/fr/channels/groups).
- `target` :
  - `last` : livrer au dernier canal externe utilisé.
  - canal explicite : tout canal configuré ou identifiant de Plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (valeur par défaut) : exécuter le Heartbeat mais **ne pas livrer** à l’extérieur.
- `directPolicy` : contrôle le comportement de livraison directe/DM :
  - `allow` (valeur par défaut) : autoriser la livraison directe/DM des heartbeats.
  - `block` : supprimer la livraison directe/DM (`reason=dm-blocked`).
- `to` : remplacement facultatif du destinataire (identifiant propre au canal, par ex. E.164 pour WhatsApp ou un identifiant de discussion Telegram). Pour les sujets/threads Telegram, utilisez `<chatId>:topic:<messageThreadId>`.
- `accountId` : identifiant de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon il est ignoré. Si l’identifiant de compte ne correspond pas à un compte configuré pour le canal résolu, la livraison est ignorée.
- `prompt` : remplace le corps du prompt par défaut (sans fusion).
- `ackMaxChars` : nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant livraison.
- `suppressToolErrorWarnings` : lorsque la valeur est true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `activeHours` : limite les exécutions Heartbeat à une plage horaire. Objet avec `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif ; `24:00` autorisé pour la fin de journée) et `timezone` facultatif.
  - Omis ou `"user"` : utilise votre `agents.defaults.userTimezone` s’il est défini, sinon revient au fuseau horaire du système hôte.
  - `"local"` : utilise toujours le fuseau horaire du système hôte.
  - Tout identifiant IANA (par ex. `America/New_York`) : utilisé directement ; s’il est invalide, revient au comportement `"user"` ci-dessus.
  - `start` et `end` ne doivent pas être égaux pour une fenêtre active ; des valeurs égales sont traitées comme une largeur nulle (toujours hors de la fenêtre).
  - En dehors de la fenêtre active, les heartbeats sont ignorés jusqu’au prochain tick à l’intérieur de la fenêtre.

## Comportement de livraison

- Les heartbeats s’exécutent par défaut dans la session principale de l’agent (`agent:<id>:<mainKey>`),
  ou `global` lorsque `session.scope = "global"`. Définissez `session` pour la remplacer par une
  session de canal spécifique (Discord/WhatsApp/etc.).
- `session` n’affecte que le contexte d’exécution ; la livraison est contrôlée par `target` et `to`.
- Pour livrer à un canal/destinataire spécifique, définissez `target` + `to`. Avec
  `target: "last"`, la livraison utilise le dernier canal externe de cette session.
- Les livraisons Heartbeat autorisent par défaut les cibles directes/DM. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en exécutant quand même le tour Heartbeat.
- Si la file principale est occupée, le Heartbeat est ignoré puis réessayé plus tard.
- Si `target` ne correspond à aucune destination externe, l’exécution a tout de même lieu mais aucun
  message sortant n’est envoyé.
- Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l’exécution est ignorée d’emblée avec `reason=alerts-disabled`.
- Si seule la livraison des alertes est désactivée, OpenClaw peut quand même exécuter le Heartbeat, mettre à jour les horodatages des tâches arrivées à échéance, restaurer l’horodatage d’inactivité de la session et supprimer la charge utile de l’alerte sortante.
- Si la cible Heartbeat résolue prend en charge l’indicateur de saisie, OpenClaw affiche cet indicateur pendant
  que l’exécution Heartbeat est active. Cela utilise la même cible que celle vers laquelle le Heartbeat
  enverrait la sortie de chat, et cela est désactivé par `typingMode: "never"`.
- Les réponses uniquement Heartbeat ne maintiennent **pas** la session active ; le dernier `updatedAt`
  est restauré afin que l’expiration par inactivité se comporte normalement.
- Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file un événement système et réveiller Heartbeat lorsque la session principale doit remarquer quelque chose rapidement. Ce réveil ne fait pas de l’exécution Heartbeat une tâche en arrière-plan.

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu des alertes est
livré. Vous pouvez ajuster cela par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Masquer HEARTBEAT_OK (par défaut)
      showAlerts: true # Afficher les messages d’alerte (par défaut)
      useIndicator: true # Émettre des événements d’indicateur (par défaut)
  telegram:
    heartbeat:
      showOk: true # Afficher les accusés OK sur Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Supprimer la livraison des alertes pour ce compte
```

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs intégrées par défaut.

### Ce que fait chaque indicateur

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse contenant uniquement un OK.
- `showAlerts` : envoie le contenu de l’alerte lorsque le modèle renvoie une réponse autre qu’un OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état de l’interface.

Si **les trois** sont à false, OpenClaw ignore entièrement l’exécution Heartbeat (aucun appel au modèle).

### Exemples par canal et par compte

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tous les comptes Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # supprimer les alertes pour le compte ops uniquement
  telegram:
    heartbeat:
      showOk: true
```

### Modèles courants

| Objectif                                 | Configuration                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                            |
| Entièrement silencieux (aucun message, aucun indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal                    | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut indique à l’agent de le
lire. Voyez-le comme votre « liste de contrôle Heartbeat » : petite, stable et
sûre à inclure toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` n’est injecté que lorsque les consignes Heartbeat sont
activées pour l’agent par défaut. Désactiver la cadence Heartbeat avec `0m` ou
définir `includeSystemPromptSection: false` l’omet du contexte d’amorçage
normal.

Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides et des en-têtes
Markdown comme `# Heading`), OpenClaw ignore l’exécution Heartbeat pour économiser des appels API.
Cette omission est signalée comme `reason=empty-heartbeat-file`.
Si le fichier est absent, le Heartbeat s’exécute quand même et le modèle décide quoi faire.

Gardez-le petit (courte liste de contrôle ou rappels) pour éviter d’alourdir le prompt.

Exemple de `HEARTBEAT.md` :

```md
# Liste de contrôle Heartbeat

- Analyse rapide : y a-t-il quelque chose d’urgent dans les boîtes de réception ?
- Si c’est la journée, fais une vérification légère si rien d’autre n’est en attente.
- Si une tâche est bloquée, note _ce qui manque_ et demande à Peter la prochaine fois.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend aussi en charge un petit bloc structuré `tasks:` pour des
vérifications basées sur des intervalles au sein même de Heartbeat.

Exemple :

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Vérifie les e-mails non lus urgents et signale tout ce qui est sensible au temps."
- name: calendar-scan
  interval: 2h
  prompt: "Vérifie les réunions à venir qui nécessitent une préparation ou un suivi."

# Instructions supplémentaires

- Garde les alertes courtes.
- Si rien ne nécessite d’attention après toutes les tâches arrivées à échéance, réponds HEARTBEAT_OK.
```

Comportement :

- OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
- Seules les tâches **arrivées à échéance** sont incluses dans le prompt Heartbeat pour ce tick.
- Si aucune tâche n’est arrivée à échéance, le Heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d’éviter un appel inutile au modèle.
- Le contenu hors tâche dans `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches arrivées à échéance.
- Les horodatages de dernière exécution des tâches sont stockés dans l’état de la session (`heartbeatTaskState`), de sorte que les intervalles survivent aux redémarrages normaux.
- Les horodatages des tâches ne sont avancés qu’après qu’une exécution Heartbeat a terminé son chemin de réponse normal. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

Le mode tâche est utile si vous voulez qu’un seul fichier Heartbeat contienne plusieurs vérifications périodiques sans payer pour toutes à chaque tick.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal dans l’espace de travail de l’agent, vous pouvez donc dire à l’agent (dans un chat normal) quelque chose comme :

- « Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécris `HEARTBEAT.md` pour qu’il soit plus court et axé sur les suivis de boîte de réception. »

Si vous voulez que cela se produise de manière proactive, vous pouvez aussi inclure une ligne explicite dans
votre prompt Heartbeat, comme : « Si la liste de contrôle devient obsolète, mets à jour HEARTBEAT.md
avec une meilleure version. »

Note de sécurité : ne mettez pas de secrets (clés API, numéros de téléphone, jetons privés) dans
`HEARTBEAT.md` — il fait partie du contexte du prompt.

## Réveil manuel (à la demande)

Vous pouvez mettre en file un événement système et déclencher un Heartbeat immédiat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement le
Heartbeat de chacun de ces agents.

Utilisez `--mode next-heartbeat` pour attendre le prochain tick planifié.

## Livraison du raisonnement (facultatif)

Par défaut, les heartbeats ne livrent que la charge utile finale de « réponse ».

Si vous voulez plus de transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsque cette option est activée, les heartbeats livrent aussi un message séparé préfixé par
`Reasoning:` (même format que `/reasoning on`). Cela peut être utile lorsque l’agent
gère plusieurs sessions/codex et que vous voulez voir pourquoi il a décidé de vous envoyer
un message — mais cela peut aussi divulguer plus de détails internes que vous ne le souhaitez. Préférez le laisser
désactivé dans les discussions de groupe.

## Attention au coût

Les heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment davantage de jetons. Pour réduire le coût :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de la conversation (~100K jetons réduits à ~2-5K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers d’amorçage à `HEARTBEAT.md` uniquement.
- Définissez un `model` moins coûteux (par ex. `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous ne voulez que des mises à jour d’état internes.

## Liens associés

- [Automation & Tasks](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché est suivi
- [Fuseau horaire](/fr/concepts/timezone) — comment le fuseau horaire affecte la planification Heartbeat
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) — débogage des problèmes d’automatisation
