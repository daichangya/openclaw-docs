---
read_when:
    - Configuration de Zalo personnel pour OpenClaw
    - Débogage de la connexion ou du flux de messages Zalo personnel
summary: prise en charge des comptes personnels Zalo via `zca-js` natif (connexion par QR), capacités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-04-24T07:02:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo personnel (non officiel)

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

> **Avertissement :** Il s’agit d’une intégration non officielle et elle peut entraîner la suspension/le bannissement du compte. Utilisez-la à vos propres risques.

## Plugin intégré

Zalo personnel est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez une build plus ancienne ou une installation personnalisée qui exclut Zalo personnel,
installez-le manuellement :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Ou depuis un checkout du code source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo personnel est disponible.
   - Les versions OpenClaw empaquetées actuelles l’intègrent déjà.
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
5. L’accès DM utilise par défaut l’association ; approuvez le code d’association au premier contact.

## Ce que c’est

- S’exécute entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’usage de « compte personnel » où l’API Zalo Bot n’est pas disponible.

## Nommage

L’identifiant du canal est `zalouser` afin d’indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` pour une éventuelle future intégration officielle à l’API Zalo.

## Trouver des ID (annuaire)

Utilisez la CLI d’annuaire pour découvrir les pairs/groupes et leurs ID :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en segments d’environ 2 000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d’accès (DM)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` accepte des ID utilisateur ou des noms. Pendant la configuration, les noms sont résolus en ID à l’aide de la recherche de contacts en processus du Plugin.

Approuver via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès au groupe (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour redéfinir la valeur par défaut lorsqu’elle n’est pas définie.
- Restreignez à une liste d’autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des ID de groupe stables ; les noms sont résolus en ID au démarrage lorsque possible)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot)
- Bloquez tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L’assistant de configuration peut demander des listes d’autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupe/utilisateur dans les listes d’autorisation en ID et journalise la correspondance.
- La correspondance de la liste d’autorisation de groupes se fait par ID uniquement par défaut. Les noms non résolus sont ignorés pour l’authentification sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
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

### Filtrage des mentions dans les groupes

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe nécessitent une mention.
- Ordre de résolution : ID/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes autorisés par liste d’autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l’activation du groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le filtrage par mention.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
- La limite d’historique de groupe prend par défaut `messages.groupChat.historyLimit` (repli `50`). Vous pouvez la redéfinir par compte avec `channels.zalouser.historyLimit`.

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

Les comptes sont associés aux profils `zalouser` dans l’état d’OpenClaw. Exemple :

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

## Saisie, réactions et accusés de réception de livraison

- OpenClaw envoie un événement de saisie avant l’envoi d’une réponse (meilleur effort).
- L’action de réaction aux messages `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer un emoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés de réception livré + vu (meilleur effort).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom de la liste d’autorisation/du groupe n’a pas été résolu :**

- Utilisez des ID numériques dans `allowFrom`/`groupAllowFrom`/`groups`, ou les noms exacts des amis/groupes.

**Mise à niveau depuis l’ancienne configuration basée sur la CLI :**

- Supprimez toute hypothèse concernant un ancien processus externe `zca`.
- Le canal fonctionne désormais entièrement dans OpenClaw sans binaire CLI externe.

## Liens associés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
