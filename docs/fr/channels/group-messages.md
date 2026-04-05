---
read_when:
    - Modifier les règles des messages de groupe ou les mentions
summary: Comportement et configuration de la gestion des messages de groupe WhatsApp (mentionPatterns sont partagés entre les différentes surfaces)
title: Messages de groupe
x-i18n:
    generated_at: "2026-04-05T12:34:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Messages de groupe (canal web WhatsApp)

Objectif : permettre à Clawd de rester dans des groupes WhatsApp, de ne se réveiller que lorsqu’on le sollicite, et de garder ce fil séparé de la session DM personnelle.

Remarque : `agents.list[].groupChat.mentionPatterns` est désormais aussi utilisé par Telegram/Discord/Slack/iMessage ; cette documentation se concentre sur le comportement spécifique à WhatsApp. Pour les configurations multi-agents, définissez `agents.list[].groupChat.mentionPatterns` par agent (ou utilisez `messages.groupChat.mentionPatterns` comme solution de repli globale).

## Implémentation actuelle (2025-12-03)

- Modes d’activation : `mention` (par défaut) ou `always`. `mention` exige une sollicitation (vraies @-mentions WhatsApp via `mentionedJids`, motifs regex sûrs, ou le numéro E.164 du bot n’importe où dans le texte). `always` réveille l’agent à chaque message, mais il ne doit répondre que lorsqu’il peut apporter une valeur utile ; sinon il renvoie le jeton silencieux exact `NO_REPLY` / `no_reply`. Les valeurs par défaut peuvent être définies dans la configuration (`channels.whatsapp.groups`) et remplacées par groupe via `/activation`. Lorsque `channels.whatsapp.groups` est défini, il agit aussi comme liste d’autorisation de groupes (incluez `"*"` pour tous les autoriser).
- Politique de groupe : `channels.whatsapp.groupPolicy` contrôle si les messages de groupe sont acceptés (`open|disabled|allowlist`). `allowlist` utilise `channels.whatsapp.groupAllowFrom` (solution de repli : `channels.whatsapp.allowFrom` explicite). La valeur par défaut est `allowlist` (bloqué tant que vous n’ajoutez pas d’expéditeurs).
- Sessions par groupe : les clés de session ressemblent à `agent:<agentId>:whatsapp:group:<jid>`, donc des commandes telles que `/verbose on` ou `/think high` (envoyées comme messages autonomes) sont limitées à ce groupe ; l’état des DM personnels reste inchangé. Les heartbeats sont ignorés pour les fils de groupe.
- Injection de contexte : les messages de groupe **en attente uniquement** (50 par défaut) qui _n’ont pas_ déclenché d’exécution sont préfixés sous `[Chat messages since your last reply - for context]`, avec la ligne déclenchante sous `[Current message - respond to this]`. Les messages déjà présents dans la session ne sont pas réinjectés.
- Visibilité de l’expéditeur : chaque lot de groupe se termine désormais par `[from: Sender Name (+E164)]` afin que Pi sache qui parle.
- Éphémère / view-once : nous les déballons avant d’extraire le texte/les mentions, afin que les sollicitations qu’ils contiennent déclenchent quand même l’agent.
- Prompt système de groupe : au premier tour d’une session de groupe (et chaque fois que `/activation` change le mode), nous injectons un court texte dans le prompt système comme `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si les métadonnées ne sont pas disponibles, nous indiquons tout de même à l’agent qu’il s’agit d’une discussion de groupe.

## Exemple de configuration (WhatsApp)

Ajoutez un bloc `groupChat` à `~/.openclaw/openclaw.json` pour que les sollicitations par nom d’affichage fonctionnent même lorsque WhatsApp supprime le `@` visuel dans le corps du texte :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Remarques :

- Les regex ne sont pas sensibles à la casse et utilisent les mêmes garde-fous safe-regex que les autres surfaces regex de configuration ; les motifs invalides et les répétitions imbriquées non sûres sont ignorés.
- WhatsApp envoie toujours des mentions canoniques via `mentionedJids` lorsqu’une personne touche le contact, donc la solution de repli par numéro est rarement nécessaire, mais reste un filet de sécurité utile.

### Commande d’activation (propriétaire uniquement)

Utilisez la commande de discussion de groupe :

- `/activation mention`
- `/activation always`

Seul le numéro du propriétaire (issu de `channels.whatsapp.allowFrom`, ou du numéro E.164 du bot si non défini) peut modifier cela. Envoyez `/status` comme message autonome dans le groupe pour voir le mode d’activation actuel.

## Utilisation

1. Ajoutez votre compte WhatsApp (celui qui exécute OpenClaw) au groupe.
2. Dites `@openclaw …` (ou incluez le numéro). Seuls les expéditeurs autorisés peuvent le déclencher, sauf si vous définissez `groupPolicy: "open"`.
3. Le prompt de l’agent inclura le contexte récent du groupe ainsi que le marqueur final `[from: …]`, afin qu’il puisse s’adresser à la bonne personne.
4. Les directives au niveau de la session (`/verbose on`, `/think high`, `/new` ou `/reset`, `/compact`) s’appliquent uniquement à la session de ce groupe ; envoyez-les comme messages autonomes pour qu’elles soient prises en compte. Votre session DM personnelle reste indépendante.

## Test / vérification

- Vérification manuelle :
  - Envoyez une sollicitation `@openclaw` dans le groupe et confirmez une réponse qui fait référence au nom de l’expéditeur.
  - Envoyez une deuxième sollicitation et vérifiez que le bloc d’historique est inclus puis effacé au tour suivant.
- Vérifiez les journaux de la gateway (exécutée avec `--verbose`) pour voir les entrées `inbound web message` affichant `from: <groupJid>` et le suffixe `[from: …]`.

## Points à connaître

- Les heartbeats sont volontairement ignorés pour les groupes afin d’éviter des diffusions bruyantes.
- La suppression des échos utilise la chaîne du lot combiné ; si vous envoyez deux fois un texte identique sans mention, seule la première occurrence recevra une réponse.
- Les entrées du stockage de session apparaîtront sous la forme `agent:<agentId>:whatsapp:group:<jid>` dans le stockage de session (`~/.openclaw/agents/<agentId>/sessions/sessions.json` par défaut) ; une entrée absente signifie simplement que le groupe n’a pas encore déclenché d’exécution.
- Les indicateurs de saisie dans les groupes suivent `agents.defaults.typingMode` (par défaut : `message` lorsqu’il n’y a pas de mention).
