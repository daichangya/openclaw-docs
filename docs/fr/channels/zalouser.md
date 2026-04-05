---
read_when:
    - Configurer Zalo Personal pour OpenClaw
    - Déboguer la connexion ou le flux de messages de Zalo Personal
summary: Prise en charge des comptes personnels Zalo via `zca-js` natif (connexion par QR), capacités et configuration
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:37:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (non officiel)

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

> **Avertissement :** il s’agit d’une intégration non officielle et elle peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos risques et périls.

## Plugin intégré

Zalo Personal est fourni comme plugin intégré dans les versions actuelles d’OpenClaw, donc les builds empaquetés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Zalo Personal, installez-le manuellement :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n’est nécessaire.

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Zalo Personal est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Connectez-vous (QR, sur la machine Gateway) :
   - `openclaw channels login --channel zalouser`
   - Scannez le code QR avec l’application mobile Zalo.
3. Activez le canal :

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Redémarrez la Gateway (ou terminez la configuration).
5. L’accès DM utilise par défaut l’appairage ; approuvez le code d’appairage au premier contact.

## Ce que c’est

- Fonctionne entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’usage de « compte personnel » où l’API Zalo Bot n’est pas disponible.

## Nommage

L’identifiant de canal est `zalouser` pour indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` pour une éventuelle future intégration officielle de l’API Zalo.

## Trouver des IDs (annuaire)

Utilisez la CLI d’annuaire pour découvrir les pairs/groupes et leurs IDs :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en segments d’environ 2000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d’accès (DMs)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` accepte des IDs utilisateur ou des noms. Pendant la configuration, les noms sont résolus en IDs à l’aide de la recherche de contacts en cours de processus du plugin.

Approuvez via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour surcharger la valeur par défaut lorsqu’elle n’est pas définie.
- Restreignez à une liste d’autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des IDs de groupe stables ; les noms sont résolus en IDs au démarrage lorsque c’est possible)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot)
- Bloquez tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L’assistant de configuration peut proposer des listes d’autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les listes d’autorisation en IDs et journalise la correspondance.
- Par défaut, la correspondance de la liste d’autorisation des groupes se fait uniquement par ID. Les noms non résolus sont ignorés pour l’authentification sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité de secours qui réactive la correspondance sur des noms de groupe modifiables.
- Si `groupAllowFrom` n’est pas défini, l’exécution utilise `allowFrom` comme repli pour les vérifications d’expéditeur de groupe.
- Les vérifications d’expéditeur s’appliquent à la fois aux messages de groupe normaux et aux commandes de contrôle (par exemple `/new`, `/reset`).

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Filtrage par mention dans les groupes

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe exigent une mention.
- Ordre de résolution : ID/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes en liste d’autorisation et au mode groupe ouvert.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le filtrage par mention.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
- La limite d’historique de groupe correspond par défaut à `messages.groupChat.historyLimit` (repli `50`). Vous pouvez la surcharger par compte avec `channels.zalouser.historyLimit`.

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-comptes

Les comptes correspondent à des profils `zalouser` dans l’état OpenClaw. Exemple :

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Saisie, réactions et accusés de remise

- OpenClaw envoie un événement de saisie avant d’envoyer une réponse (best effort).
- L’action de réaction de message `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer un emoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Reactions](/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés de remise + de lecture (best effort).

## Dépannage

**La connexion ne reste pas active :**

- `openclaw channels status --probe`
- Reconnectez-vous : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom de la liste d’autorisation/du groupe n’a pas été résolu :**

- Utilisez des IDs numériques dans `allowFrom`/`groupAllowFrom`/`groups`, ou les noms exacts des amis/groupes.

**Mise à niveau depuis une ancienne configuration basée sur CLI :**

- Supprimez toute hypothèse sur un ancien processus externe `zca`.
- Le canal fonctionne désormais entièrement dans OpenClaw sans binaires CLI externes.

## Voir aussi

- [Channels Overview](/channels) — tous les canaux pris en charge
- [Pairing](/channels/pairing) — authentification DM et flux d’appairage
- [Groups](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Channel Routing](/channels/channel-routing) — routage de session pour les messages
- [Security](/gateway/security) — modèle d’accès et renforcement
