---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous avez besoin de vérifications spécifiques au canal avant de consulter en détail la documentation du fournisseur.
summary: Dépannage rapide au niveau des canaux avec signatures d’échec et correctifs par canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-04-20T07:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aef31742cd5cc4af3fa3d3ea1acba51875ad4a1423c0e8c87372c3df31b0528
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Dépannage des canaux

Utilisez cette page lorsqu’un canal se connecte, mais que le comportement est incorrect.

## Échelle de commandes

Exécutez d’abord celles-ci dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Référence saine :

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- La sonde du canal indique que le transport est connecté et, lorsque c’est pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures d’échec WhatsApp

| Symptôme                         | Vérification la plus rapide                         | Correctif                                                     |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| Connecté mais aucune réponse en DM | `openclaw pairing list whatsapp`                    | Approuvez l’expéditeur ou modifiez la politique DM/la liste d’autorisation. |
| Messages de groupe ignorés       | Vérifiez `requireMention` + les motifs de mention dans la configuration | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe. |
| Déconnexions/boucles de reconnexion aléatoires | `openclaw channels status --probe` + journaux      | Reconnectez-vous et vérifiez que le répertoire des identifiants est sain. |

Dépannage complet : [/channels/whatsapp#troubleshooting](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures d’échec Telegram

| Symptôme                             | Vérification la plus rapide                     | Correctif                                                                   |
| ------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` mais aucun flux de réponse exploitable | `openclaw pairing list telegram`                | Approuvez l’association ou modifiez la politique DM.                        |
| Bot en ligne mais groupe silencieux  | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité du groupe ou mentionnez le bot. |
| Échecs d’envoi avec erreurs réseau   | Inspectez les journaux pour les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                 |
| `setMyCommands` rejeté au démarrage  | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de Plugin/Skills/personnalisées ou désactivez les menus natifs. |
| Mise à niveau effectuée et la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de la configuration | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des identifiants numériques d’expéditeur. |

Dépannage complet : [/channels/telegram#troubleshooting](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures d’échec Discord

| Symptôme                         | Vérification la plus rapide         | Correctif                                                     |
| -------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Bot en ligne mais aucune réponse sur le serveur | `openclaw channels status --probe`  | Autorisez le serveur/le canal et vérifiez l’intent de contenu des messages. |
| Messages de groupe ignorés       | Vérifiez dans les journaux les rejets par filtrage de mention | Mentionnez le bot ou définissez `requireMention: false` pour le serveur/le canal. |
| Réponses DM absentes             | `openclaw pairing list discord`     | Approuvez l’association DM ou ajustez la politique DM.        |

Dépannage complet : [/channels/discord#troubleshooting](/fr/channels/discord#troubleshooting)

## Slack

### Signatures d’échec Slack

| Symptôme                                | Vérification la plus rapide               | Correctif                                                                                                                                            |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connecté mais aucune réponse | `openclaw channels status --probe`        | Vérifiez le jeton d’application + le jeton du bot et les permissions requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` dans les configurations basées sur SecretRef. |
| DMs bloqués                             | `openclaw pairing list slack`             | Approuvez l’association ou assouplissez la politique DM.                                                                                             |
| Message de canal ignoré                 | Vérifiez `groupPolicy` et la liste d’autorisation des canaux | Autorisez le canal ou basculez la politique sur `open`.                                                                                              |

Dépannage complet : [/channels/slack#troubleshooting](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures d’échec iMessage et BlueBubbles

| Symptôme                          | Vérification la plus rapide                                   | Correctif                                             |
| --------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Aucun événement entrant           | Vérifiez l’accessibilité du Webhook/serveur et les autorisations de l’application | Corrigez l’URL du Webhook ou l’état du serveur BlueBubbles. |
| Peut envoyer mais ne reçoit pas sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Réaccordez les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur DM bloqué              | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’association ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [/channels/imessage#troubleshooting](/fr/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures d’échec Signal

| Symptôme                         | Vérification la plus rapide               | Correctif                                                    |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Démon accessible mais bot silencieux | `openclaw channels status --probe`         | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| DM bloqué                        | `openclaw pairing list signal`             | Approuvez l’expéditeur ou ajustez la politique DM.           |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage.  |

Dépannage complet : [/channels/signal#troubleshooting](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures d’échec QQ Bot

| Symptôme                         | Vérification la plus rapide                 | Correctif                                                     |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Le bot répond « gone to Mars »   | Vérifiez `appId` et `clientSecret` dans la configuration | Définissez les identifiants ou redémarrez la Gateway.         |
| Aucun message entrant            | `openclaw channels status --probe`          | Vérifiez les identifiants sur la QQ Open Platform.            |
| La voix n’est pas transcrite     | Vérifiez la configuration du fournisseur STT | Configurez `channels.qqbot.stt` ou `tools.media.audio`.       |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [/channels/qqbot#troubleshooting](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures d’échec Matrix

| Symptôme                             | Vérification la plus rapide            | Correctif                                                                 |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------- |
| Connecté mais ignore les messages de salon | `openclaw channels status --probe`     | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage par mention. |
| Les DMs ne sont pas traités          | `openclaw pairing list matrix`         | Approuvez l’expéditeur ou ajustez la politique DM.                        |
| Échec des salons chiffrés            | `openclaw matrix verify status`        | Revérifiez l’appareil, puis consultez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/cassée | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| L’apparence de la signature croisée/du bootstrap semble incorrecte | `openclaw matrix verify bootstrap`     | Réparez en une seule passe le stockage des secrets, la signature croisée et l’état de la sauvegarde. |

Configuration et installation complètes : [Matrix](/fr/channels/matrix)
