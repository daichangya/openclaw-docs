---
read_when:
    - Le transport du canal indique connecté, mais les réponses échouent
    - Vous avez besoin de vérifications spécifiques au canal avant la documentation approfondie du fournisseur
summary: Dépannage rapide au niveau des canaux avec signatures de panne et correctifs par canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-04-05T12:36:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Dépannage des canaux

Utilisez cette page lorsqu’un canal se connecte, mais que son comportement est incorrect.

## Échelle de commandes

Exécutez d’abord celles-ci dans l’ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Base de référence saine :

- `Runtime: running`
- `RPC probe: ok`
- La sonde du canal indique que le transport est connecté et, lorsque pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures de panne WhatsApp

| Symptôme                        | Vérification la plus rapide                          | Correctif                                               |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- |
| Connecté mais aucune réponse DM | `openclaw pairing list whatsapp`                     | Approuvez l’expéditeur ou changez la politique DM/la liste d’autorisation. |
| Messages de groupe ignorés     | Vérifiez `requireMention` et les motifs de mention dans la configuration | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe. |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` + journaux        | Reconnectez-vous et vérifiez que le répertoire d’identifiants est sain. |

Dépannage complet : [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Signatures de panne Telegram

| Symptôme                            | Vérification la plus rapide                   | Correctif                                                                  |
| ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `/start` mais aucun flux de réponse exploitable | `openclaw pairing list telegram`              | Approuvez l’appairage ou modifiez la politique DM.                         |
| Bot en ligne mais groupe silencieux | Vérifiez l’obligation de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité en groupe ou mentionnez le bot. |
| Échecs d’envoi avec erreurs réseau  | Inspectez les journaux pour les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                |
| `setMyCommands` rejeté au démarrage | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de plugin/Skills/personnalisées ou désactivez les menus natifs. |
| Après mise à niveau, la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de la configuration | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des identifiants numériques d’expéditeur. |

Dépannage complet : [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Signatures de panne Discord

| Symptôme                        | Vérification la plus rapide          | Correctif                                                |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------- |
| Bot en ligne mais aucune réponse dans la guilde | `openclaw channels status --probe`   | Autorisez la guilde/le canal et vérifiez l’intention de contenu des messages. |
| Messages de groupe ignorés     | Vérifiez dans les journaux les rejets dus au filtrage par mention | Mentionnez le bot ou définissez `requireMention: false` pour la guilde/le canal. |
| Réponses DM manquantes         | `openclaw pairing list discord`      | Approuvez l’appairage DM ou ajustez la politique DM.     |

Dépannage complet : [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Signatures de panne Slack

| Symptôme                               | Vérification la plus rapide              | Correctif                                                                                                                                              |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode socket connecté mais aucune réponse | `openclaw channels status --probe`       | Vérifiez le jeton d’application + le jeton de bot et les scopes requis ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` dans les configurations basées sur SecretRef. |
| DMs bloqués                            | `openclaw pairing list slack`            | Approuvez l’appairage ou assouplissez la politique DM.                                                                                                 |
| Message de canal ignoré                | Vérifiez `groupPolicy` et la liste d’autorisation des canaux | Autorisez le canal ou changez la politique en `open`.                                                                                                  |

Dépannage complet : [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures de panne iMessage et BlueBubbles

| Symptôme                         | Vérification la plus rapide                            | Correctif                                             |
| -------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Aucun événement entrant          | Vérifiez l’accessibilité du webhook/serveur et les autorisations de l’application | Corrigez l’URL du webhook ou l’état du serveur BlueBubbles. |
| Peut envoyer mais ne reçoit pas sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Réaccordez les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur DM bloqué             | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’appairage ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signatures de panne Signal

| Symptôme                        | Vérification la plus rapide             | Correctif                                                |
| ------------------------------ | --------------------------------------- | -------------------------------------------------------- |
| Daemon joignable mais bot silencieux | `openclaw channels status --probe`      | Vérifiez l’URL/le compte du daemon `signal-cli` et le mode de réception. |
| DM bloqué                      | `openclaw pairing list signal`          | Approuvez l’expéditeur ou ajustez la politique DM.       |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation des groupes et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### Signatures de panne QQ Bot

| Symptôme                        | Vérification la plus rapide                | Correctif                                                      |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| Le bot répond "gone to Mars"   | Vérifiez `appId` et `clientSecret` dans la configuration | Définissez les identifiants ou redémarrez la gateway.          |
| Aucun message entrant          | `openclaw channels status --probe`         | Vérifiez les identifiants sur la QQ Open Platform.             |
| La voix n’est pas transcrite   | Vérifiez la configuration du fournisseur STT | Configurez `channels.qqbot.stt` ou `tools.media.audio`.        |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [/channels/qqbot#troubleshooting](/channels/qqbot#troubleshooting)

## Matrix

### Signatures de panne Matrix

| Symptôme                            | Vérification la plus rapide             | Correctif                                                                  |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Connecté mais ignore les messages du salon | `openclaw channels status --probe`      | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage par mention. |
| Les DMs ne sont pas traités         | `openclaw pairing list matrix`          | Approuvez l’expéditeur ou ajustez la politique DM.                         |
| Les salons chiffrés échouent        | `openclaw matrix verify status`         | Revérifiez l’appareil, puis vérifiez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/cassée | `openclaw matrix verify backup status`  | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| La signature croisée/bootstrap semble incorrecte | `openclaw matrix verify bootstrap`      | Réparez le stockage des secrets, la signature croisée et l’état de sauvegarde en un seul passage. |

Configuration et installation complètes : [Matrix](/channels/matrix)
