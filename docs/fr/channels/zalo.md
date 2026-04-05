---
read_when:
    - Travail sur les fonctionnalités ou webhooks Zalo
summary: Statut de prise en charge, capacités et configuration du bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-05T12:37:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (API Bot)

Statut : expérimental. Les messages privés sont pris en charge. La section [Capacités](#capabilities) ci-dessous reflète le comportement actuel des bots Marketplace.

## Plugin intégré

Zalo est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc les builds packagés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Zalo, installez-le manuellement :

- Installation via la CLI : `openclaw plugins install @openclaw/zalo`
- Ou depuis une extraction source : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Zalo est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Définissez le jeton :
   - Env : `ZALO_BOT_TOKEN=...`
   - Ou config : `channels.zalo.accounts.default.botToken: "..."`.
3. Redémarrez la passerelle (ou terminez la configuration).
4. L’accès aux messages privés utilise l’appairage par défaut ; approuvez le code d’appairage au premier contact.

Configuration minimale :

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Ce que c’est

Zalo est une application de messagerie axée sur le Vietnam ; son API Bot permet à la passerelle d’exécuter un bot pour des conversations 1:1.
C’est un bon choix pour le support ou les notifications lorsque vous souhaitez un routage déterministe vers Zalo.

Cette page reflète le comportement actuel d’OpenClaw pour les **bots Zalo Bot Creator / Marketplace**.
Les **bots Zalo Official Account (OA)** constituent une autre surface produit Zalo et peuvent se comporter différemment.

- Un canal Zalo Bot API détenu par la passerelle.
- Routage déterministe : les réponses reviennent vers Zalo ; le modèle ne choisit jamais les canaux.
- Les messages privés partagent la session principale de l’agent.
- La section [Capacités](#capabilities) ci-dessous montre la prise en charge actuelle des bots Marketplace.

## Configuration (voie rapide)

### 1) Créer un jeton de bot (plateforme Zalo Bot)

1. Accédez à [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) et connectez-vous.
2. Créez un nouveau bot et configurez ses paramètres.
3. Copiez le jeton complet du bot (généralement `numeric_id:secret`). Pour les bots Marketplace, le jeton d’exécution utilisable peut apparaître dans le message de bienvenue du bot après sa création.

### 2) Configurer le jeton (env ou config)

Exemple :

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Si vous passez plus tard à une surface bot Zalo où les groupes sont disponibles, vous pouvez ajouter explicitement une configuration spécifique aux groupes, comme `groupPolicy` et `groupAllowFrom`. Pour le comportement actuel des bots Marketplace, consultez [Capacités](#capabilities).

Option env : `ZALO_BOT_TOKEN=...` (fonctionne uniquement pour le compte par défaut).

Prise en charge multi-comptes : utilisez `channels.zalo.accounts` avec des jetons par compte et un `name` facultatif.

3. Redémarrez la passerelle. Zalo démarre lorsqu’un jeton est résolu (env ou config).
4. L’accès aux messages privés utilise l’appairage par défaut. Approuvez le code lorsque le bot est contacté pour la première fois.

## Fonctionnement (comportement)

- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des espaces réservés pour les médias.
- Les réponses reviennent toujours vers la même discussion Zalo.
- Long-polling par défaut ; mode webhook disponible avec `channels.zalo.webhookUrl`.

## Limites

- Le texte sortant est découpé en segments de 2000 caractères (limite de l’API Zalo).
- Les téléchargements/envois de médias sont limités par `channels.zalo.mediaMaxMb` (5 par défaut).
- Le streaming est bloqué par défaut car la limite de 2000 caractères le rend moins utile.

## Contrôle d’accès (messages privés)

### Accès aux messages privés

- Par défaut : `channels.zalo.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuvez via :
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/channels/pairing)
- `channels.zalo.allowFrom` accepte des identifiants utilisateur numériques (aucune résolution de nom d’utilisateur disponible).

## Contrôle d’accès (groupes)

Pour les **bots Zalo Bot Creator / Marketplace**, la prise en charge des groupes n’était pas disponible en pratique, car le bot ne pouvait pas du tout être ajouté à un groupe.

Cela signifie que les clés de configuration liées aux groupes ci-dessous existent dans le schéma, mais n’étaient pas utilisables pour les bots Marketplace :

- `channels.zalo.groupPolicy` contrôle la gestion des entrées de groupe : `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restreint quels identifiants d’expéditeur peuvent déclencher le bot dans les groupes.
- Si `groupAllowFrom` n’est pas défini, Zalo retombe sur `allowFrom` pour les vérifications d’expéditeur.
- Remarque d’exécution : si `channels.zalo` est totalement absent, l’exécution retombe tout de même sur `groupPolicy="allowlist"` par sécurité.

Les valeurs de politique de groupe (lorsque l’accès aux groupes est disponible sur votre surface bot) sont :

- `groupPolicy: "disabled"` — bloque tous les messages de groupe.
- `groupPolicy: "open"` — autorise n’importe quel membre du groupe (avec filtrage par mention).
- `groupPolicy: "allowlist"` — valeur par défaut en échec fermé ; seuls les expéditeurs autorisés sont acceptés.

Si vous utilisez une autre surface produit de bot Zalo et avez vérifié un fonctionnement des groupes, documentez-le séparément au lieu de supposer qu’il correspond au flux des bots Marketplace.

## Long-polling vs webhook

- Par défaut : long-polling (aucune URL publique requise).
- Mode webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - Le secret du webhook doit contenir entre 8 et 256 caractères.
  - L’URL du webhook doit utiliser HTTPS.
  - Zalo envoie les événements avec l’en-tête `X-Bot-Api-Secret-Token` pour la vérification.
  - La passerelle HTTP gère les requêtes de webhook à `channels.zalo.webhookPath` (par défaut, le chemin de l’URL du webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou des types de média `+json`).
  - Les événements en double (`event_name + message_id`) sont ignorés pendant une courte fenêtre de rejeu.
  - Le trafic en rafale est limité par débit par chemin/source et peut renvoyer HTTP 429.

**Remarque :** `getUpdates` (polling) et webhook s’excluent mutuellement selon la documentation de l’API Zalo.

## Types de messages pris en charge

Pour un aperçu rapide de la prise en charge, consultez [Capacités](#capabilities). Les remarques ci-dessous ajoutent des détails lorsque le comportement nécessite un contexte supplémentaire.

- **Messages texte** : prise en charge complète avec découpage en segments de 2000 caractères.
- **URL simples dans le texte** : se comportent comme une entrée texte normale.
- **Aperçus de liens / cartes de liens enrichis** : consultez le statut des bots Marketplace dans [Capacités](#capabilities) ; ils ne déclenchaient pas de réponse de manière fiable.
- **Messages image** : consultez le statut des bots Marketplace dans [Capacités](#capabilities) ; la gestion des images entrantes n’était pas fiable (indicateur de saisie sans réponse finale).
- **Autocollants** : consultez le statut des bots Marketplace dans [Capacités](#capabilities).
- **Notes vocales / fichiers audio / vidéo / pièces jointes génériques** : consultez le statut des bots Marketplace dans [Capacités](#capabilities).
- **Types non pris en charge** : consignés dans les journaux (par exemple, messages d’utilisateurs protégés).

## Capacités

Ce tableau résume le comportement actuel des **bots Zalo Bot Creator / Marketplace** dans OpenClaw.

| Fonctionnalité              | Statut                                  |
| --------------------------- | --------------------------------------- |
| Messages privés             | ✅ Pris en charge                       |
| Groupes                     | ❌ Non disponibles pour les bots Marketplace |
| Médias (images entrantes)   | ⚠️ Limité / à vérifier dans votre environnement |
| Médias (images sortantes)   | ⚠️ Non re-testés pour les bots Marketplace |
| URL simples dans le texte   | ✅ Pris en charge                       |
| Aperçus de liens            | ⚠️ Peu fiables pour les bots Marketplace |
| Réactions                   | ❌ Non prises en charge                 |
| Autocollants                | ⚠️ Pas de réponse d’agent pour les bots Marketplace |
| Notes vocales / audio / vidéo | ⚠️ Pas de réponse d’agent pour les bots Marketplace |
| Pièces jointes de fichier   | ⚠️ Pas de réponse d’agent pour les bots Marketplace |
| Fils                        | ❌ Non pris en charge                   |
| Sondages                    | ❌ Non pris en charge                   |
| Commandes natives           | ❌ Non prises en charge                 |
| Streaming                   | ⚠️ Bloqué (limite de 2000 caractères)  |

## Cibles de distribution (CLI/cron)

- Utilisez un identifiant de discussion comme cible.
- Exemple : `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Dépannage

**Le bot ne répond pas :**

- Vérifiez que le jeton est valide : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (appairage ou allowFrom)
- Consultez les journaux de la passerelle : `openclaw logs --follow`

**Le webhook ne reçoit pas d’événements :**

- Assurez-vous que l’URL du webhook utilise HTTPS
- Vérifiez que le jeton secret contient entre 8 et 256 caractères
- Confirmez que le point de terminaison HTTP de la passerelle est joignable sur le chemin configuré
- Vérifiez que le polling `getUpdates` n’est pas en cours d’exécution (ils s’excluent mutuellement)

## Référence de configuration (Zalo)

Configuration complète : [Configuration](/gateway/configuration)

Les clés plates de niveau supérieur (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, etc.) sont une forme abrégée historique à compte unique. Préférez `channels.zalo.accounts.<id>.*` pour les nouvelles configurations. Les deux formes sont toujours documentées ici car elles existent dans le schéma.

Options du fournisseur :

- `channels.zalo.enabled` : activer/désactiver le démarrage du canal.
- `channels.zalo.botToken` : jeton du bot issu de la plateforme Zalo Bot.
- `channels.zalo.tokenFile` : lire le jeton depuis un chemin de fichier normal. Les liens symboliques sont rejetés.
- `channels.zalo.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.zalo.allowFrom` : liste d’autorisation des messages privés (identifiants utilisateur). `open` nécessite `"*"`. L’assistant demandera des identifiants numériques.
- `channels.zalo.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist). Présent dans la configuration ; consultez [Capacités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe (identifiants utilisateur). Retombe sur `allowFrom` lorsqu’elle n’est pas définie.
- `channels.zalo.mediaMaxMb` : limite de médias entrants/sortants (Mo, 5 par défaut).
- `channels.zalo.webhookUrl` : activer le mode webhook (HTTPS requis).
- `channels.zalo.webhookSecret` : secret du webhook (8-256 caractères).
- `channels.zalo.webhookPath` : chemin du webhook sur le serveur HTTP de la passerelle.
- `channels.zalo.proxy` : URL de proxy pour les requêtes API.

Options multi-comptes :

- `channels.zalo.accounts.<id>.botToken` : jeton par compte.
- `channels.zalo.accounts.<id>.tokenFile` : fichier de jeton normal par compte. Les liens symboliques sont rejetés.
- `channels.zalo.accounts.<id>.name` : nom d’affichage.
- `channels.zalo.accounts.<id>.enabled` : activer/désactiver le compte.
- `channels.zalo.accounts.<id>.dmPolicy` : politique de messages privés par compte.
- `channels.zalo.accounts.<id>.allowFrom` : liste d’autorisation par compte.
- `channels.zalo.accounts.<id>.groupPolicy` : politique de groupe par compte. Présent dans la configuration ; consultez [Capacités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe par compte.
- `channels.zalo.accounts.<id>.webhookUrl` : URL de webhook par compte.
- `channels.zalo.accounts.<id>.webhookSecret` : secret de webhook par compte.
- `channels.zalo.accounts.<id>.webhookPath` : chemin de webhook par compte.
- `channels.zalo.accounts.<id>.proxy` : URL de proxy par compte.

## Lié

- [Vue d’ensemble des canaux](/channels) — tous les canaux pris en charge
- [Appairage](/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/gateway/security) — modèle d’accès et durcissement
