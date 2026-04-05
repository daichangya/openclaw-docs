---
read_when:
    - Ajustement de la cadence ou de la messagerie Heartbeat
    - Choix entre Heartbeat et cron pour les tâches planifiées
summary: Messages de polling Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T12:42:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat ou cron ?** Voir [Automatisation et tâches](/automation) pour savoir quand utiliser chacun.

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse
faire remonter tout ce qui nécessite de l’attention sans vous spammer.

Heartbeat est un tour planifié de session principale — il ne crée **pas** d’enregistrements de [tâches en arrière-plan](/automation/tasks).
Les enregistrements de tâche sont destinés au travail détaché (exécutions ACP, sous-agents, tâches cron isolées).

Résolution des problèmes : [Tâches planifiées](/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

1. Laissez les heartbeats activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification Anthropic OAuth/par jeton, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
2. Créez une petite checklist `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent (facultatif mais recommandé).
3. Décidez où les messages heartbeat doivent aller (`target: "none"` est la valeur par défaut ; définissez `target: "last"` pour router vers le dernier contact).
4. Facultatif : activez l’envoi du raisonnement heartbeat pour plus de transparence.
5. Facultatif : utilisez un contexte de bootstrap léger si les exécutions heartbeat n’ont besoin que de `HEARTBEAT.md`.
6. Facultatif : activez les sessions isolées pour éviter d’envoyer l’historique complet de la conversation à chaque heartbeat.
7. Facultatif : limitez les heartbeats aux heures actives (heure locale).

Exemple de configuration :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque le mode d’authentification Anthropic OAuth/par jeton est le mode détecté, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps du prompt (configurable via `agents.defaults.heartbeat.prompt`) :
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Le prompt heartbeat est envoyé **textuellement** comme message utilisateur. Le prompt
  système inclut une section « Heartbeat » et l’exécution est marquée en interne.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré.
  En dehors de la fenêtre, les heartbeats sont ignorés jusqu’au prochain tick à l’intérieur de la fenêtre.

## À quoi sert le prompt heartbeat

Le prompt par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » incite l’agent à examiner les
  suivis en attente (boîte de réception, calendrier, rappels, travail en file d’attente) et à signaler tout ce qui est urgent.
- **Vérification humaine** : « Checkup sometimes on your human during day time » incite à
  un léger « tu as besoin de quelque chose ? » occasionnel, tout en évitant le spam nocturne
  grâce à votre fuseau horaire local configuré (voir [/concepts/timezone](/concepts/timezone)).

Heartbeat peut réagir à des [tâches en arrière-plan](/automation/tasks) terminées, mais une exécution heartbeat elle-même ne crée pas d’enregistrement de tâche.

Si vous voulez qu’un heartbeat fasse quelque chose de très précis (par ex. « vérifier les
statistiques Gmail PubSub » ou « vérifier la santé de la passerelle »), définissez `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) sur un corps personnalisé (envoyé textuellement).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez par **`HEARTBEAT_OK`**.
- Pendant les exécutions heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît
  au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est
  abandonnée si le contenu restant est **≤ `ackMaxChars`** (valeur par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité
  spécialement.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte de l’alerte.

En dehors des heartbeats, un `HEARTBEAT_OK` parasite au début/à la fin d’un message est supprimé
et journalisé ; un message qui n’est que `HEARTBEAT_OK` est abandonné.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global de heartbeat.
- `agents.list[].heartbeat` fusionne par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des heartbeats.
- `channels.defaults.heartbeat` définit les valeurs de visibilité par défaut pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeats par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents**
exécutent des heartbeats. Le bloc par agent fusionne par-dessus `agents.defaults.heartbeat`
(vous pouvez donc définir une fois des valeurs partagées puis les remplacer par agent).

Exemple : deux agents, seul le second agent exécute des heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
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
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

En dehors de cette fenêtre (avant 9 h ou après 22 h, heure de l’Est), les heartbeats sont ignorés. Le prochain tick planifié dans la fenêtre s’exécutera normalement.

### Configuration 24/7

Si vous voulez que les heartbeats s’exécutent toute la journée, utilisez l’un de ces modèles :

- Omettez complètement `activeHours` (aucune restriction de fenêtre horaire ; c’est le comportement par défaut).
- Définissez une fenêtre sur toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

Ne définissez pas la même heure pour `start` et `end` (par exemple `08:00` à `08:00`).
Cela est traité comme une fenêtre de largeur nulle, donc les heartbeats sont toujours ignorés.

### Exemple multi-comptes

Utilisez `accountId` pour cibler un compte spécifique sur des canaux multi-comptes comme Telegram :

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
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

- `every` : intervalle heartbeat (chaîne de durée ; unité par défaut = minutes).
- `model` : surcharge facultative du modèle pour les exécutions heartbeat (`provider/model`).
- `includeReasoning` : lorsqu’il est activé, envoie aussi le message séparé `Reasoning:` lorsqu’il est disponible (même forme que `/reasoning on`).
- `lightContext` : lorsque vrai, les exécutions heartbeat utilisent un contexte de bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers de bootstrap de l’espace de travail.
- `isolatedSession` : lorsque vrai, chaque heartbeat s’exécute dans une session fraîche sans historique de conversation préalable. Utilise le même modèle d’isolation que le cron `sessionTarget: "isolated"`. Réduit fortement le coût en jetons par heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de livraison utilise toujours le contexte de la session principale.
- `session` : clé de session facultative pour les exécutions heartbeat.
  - `main` (par défaut) : session principale de l’agent.
  - Clé de session explicite (copiez-la depuis `openclaw sessions --json` ou la [CLI sessions](/cli/sessions)).
  - Formats de clé de session : voir [Sessions](/concepts/session) et [Groups](/channels/groups).
- `target` :
  - `last` : envoie au dernier canal externe utilisé.
  - canal explicite : n’importe quel canal configuré ou identifiant de plugin, par exemple `discord`, `matrix`, `telegram`, ou `whatsapp`.
  - `none` (par défaut) : exécute le heartbeat mais **ne l’envoie pas** à l’extérieur.
- `directPolicy` : contrôle le comportement d’envoi direct/DM :
  - `allow` (par défaut) : autorise l’envoi direct/DM du heartbeat.
  - `block` : supprime l’envoi direct/DM (`reason=dm-blocked`).
- `to` : surcharge facultative du destinataire (identifiant spécifique au canal, par ex. E.164 pour WhatsApp ou un identifiant de chat Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.
- `accountId` : identifiant de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon il est ignoré. Si l’identifiant de compte ne correspond pas à un compte configuré pour le canal résolu, l’envoi est ignoré.
- `prompt` : remplace le corps du prompt par défaut (non fusionné).
- `ackMaxChars` : nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant l’envoi.
- `suppressToolErrorWarnings` : lorsque vrai, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions heartbeat.
- `activeHours` : limite les exécutions heartbeat à une fenêtre horaire. Objet avec `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif ; `24:00` autorisé pour la fin de journée), et `timezone` facultatif.
  - Omis ou `"user"` : utilise votre `agents.defaults.userTimezone` s’il est défini, sinon se rabat sur le fuseau horaire du système hôte.
  - `"local"` : utilise toujours le fuseau horaire du système hôte.
  - Tout identifiant IANA (par ex. `America/New_York`) : utilisé directement ; s’il est invalide, se rabat sur le comportement `"user"` ci-dessus.
  - `start` et `end` ne doivent pas être égaux pour une fenêtre active ; des valeurs égales sont traitées comme une largeur nulle (toujours hors fenêtre).
  - En dehors de la fenêtre active, les heartbeats sont ignorés jusqu’au prochain tick à l’intérieur de la fenêtre.

## Comportement d’envoi

- Les heartbeats s’exécutent par défaut dans la session principale de l’agent (`agent:<id>:<mainKey>`),
  ou `global` lorsque `session.scope = "global"`. Définissez `session` pour remplacer par une
  session de canal spécifique (Discord/WhatsApp/etc.).
- `session` n’affecte que le contexte d’exécution ; l’envoi est contrôlé par `target` et `to`.
- Pour envoyer à un canal/destinataire spécifique, définissez `target` + `to`. Avec
  `target: "last"`, l’envoi utilise le dernier canal externe de cette session.
- Les envois heartbeat autorisent par défaut les cibles directes/DM. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en exécutant quand même le tour heartbeat.
- Si la file principale est occupée, le heartbeat est ignoré et réessayé plus tard.
- Si `target` ne se résout vers aucune destination externe, l’exécution a quand même lieu mais aucun
  message sortant n’est envoyé.
- Si `showOk`, `showAlerts`, et `useIndicator` sont tous désactivés, l’exécution est ignorée en amont avec `reason=alerts-disabled`.
- Si seule la livraison d’alerte est désactivée, OpenClaw peut quand même exécuter le heartbeat, mettre à jour les horodatages des tâches dues, restaurer l’horodatage d’inactivité de session et supprimer la charge utile d’alerte sortante.
- Les réponses heartbeat uniquement ne maintiennent **pas** la session active ; le `updatedAt`
  précédent est restauré afin que l’expiration par inactivité se comporte normalement.
- Les [tâches en arrière-plan](/automation/tasks) détachées peuvent mettre en file un événement système et réveiller heartbeat lorsque la session principale doit remarquer rapidement quelque chose. Ce réveil ne fait pas de l’exécution heartbeat une tâche en arrière-plan.

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu d’alerte est
envoyé. Vous pouvez ajuster cela par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Ce que fait chaque indicateur

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse uniquement OK.
- `showAlerts` : envoie le contenu d’alerte lorsque le modèle renvoie une réponse non OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état UI.

Si **tous les trois** sont faux, OpenClaw ignore entièrement l’exécution heartbeat (aucun appel modèle).

### Exemples par canal vs par compte

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Modèles courants

| Objectif                                 | Configuration                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                                      |
| Entièrement silencieux (pas de messages, pas d’indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (pas de messages)  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK dans un seul canal uniquement         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut indique à l’agent
de le lire. Voyez-le comme votre « checklist heartbeat » : petit, stable et
sans danger à inclure toutes les 30 minutes.

Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes blanches et des en-têtes markdown
comme `# Heading`), OpenClaw ignore l’exécution heartbeat pour économiser des appels API.
Cet oubli est signalé comme `reason=empty-heartbeat-file`.
Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

Gardez-le minuscule (checklist courte ou rappels) pour éviter le gonflement du prompt.

Exemple de `HEARTBEAT.md` :

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend aussi en charge un petit bloc structuré `tasks:` pour les
vérifications basées sur un intervalle à l’intérieur du heartbeat lui-même.

Exemple :

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Comportement :

- OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
- Seules les tâches **dues** sont incluses dans le prompt heartbeat pour ce tick.
- Si aucune tâche n’est due, le heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d’éviter un appel modèle inutile.
- Le contenu hors tâches dans `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches dues.
- Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), de sorte que les intervalles survivent aux redémarrages normaux.
- Les horodatages de tâche ne sont avancés qu’après qu’une exécution heartbeat a terminé son chemin normal de réponse. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

Le mode tâche est utile si vous voulez qu’un seul fichier heartbeat contienne plusieurs vérifications périodiques sans payer pour toutes à chaque tick.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` n’est qu’un fichier normal dans l’espace de travail de l’agent, vous pouvez donc dire à l’agent
(dans une discussion normale) quelque chose comme :

- « Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécris `HEARTBEAT.md` pour qu’il soit plus court et axé sur les suivis de boîte de réception. »

Si vous voulez que cela arrive de façon proactive, vous pouvez aussi inclure une ligne explicite dans
votre prompt heartbeat comme : « Si la checklist devient obsolète, mets à jour HEARTBEAT.md
avec une meilleure version. »

Note de sécurité : ne mettez pas de secrets (clés API, numéros de téléphone, jetons privés) dans
`HEARTBEAT.md` — il devient partie du contexte du prompt.

## Réveil manuel (à la demande)

Vous pouvez mettre en file un événement système et déclencher un heartbeat immédiat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement les
heartbeats de chacun de ces agents.

Utilisez `--mode next-heartbeat` pour attendre le prochain tick planifié.

## Envoi du raisonnement (facultatif)

Par défaut, les heartbeats n’envoient que la charge utile finale « réponse ».

Si vous voulez de la transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsque cette option est activée, les heartbeats enverront aussi un message séparé préfixé par
`Reasoning:` (même forme que `/reasoning on`). Cela peut être utile lorsque l’agent
gère plusieurs sessions/codex et que vous voulez voir pourquoi il a décidé de vous notifier
— mais cela peut aussi révéler plus de détails internes que vous ne le souhaitez. Il vaut mieux laisser cette option
désactivée dans les discussions de groupe.

## Sensibilisation au coût

Les heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment plus de jetons. Pour réduire le coût :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de la conversation (~100K jetons ramenés à ~2-5K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers de bootstrap à `HEARTBEAT.md` uniquement.
- Définissez un `model` moins cher (par ex. `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous ne voulez que des mises à jour d’état internes.

## Lié

- [Automatisation et tâches](/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/automation/tasks) — comment le travail détaché est suivi
- [Fuseau horaire](/concepts/timezone) — comment le fuseau horaire affecte la planification heartbeat
- [Résolution des problèmes](/automation/cron-jobs#troubleshooting) — débogage des problèmes d’automatisation
