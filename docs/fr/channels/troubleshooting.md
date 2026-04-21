---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous devez effectuer des vérifications propres au canal avant de consulter en profondeur la documentation du provider
summary: Dépannage rapide au niveau des canaux avec signatures de panne et correctifs propres à chaque canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-04-21T06:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Dépannage des canaux

Utilisez cette page lorsqu’un canal se connecte mais que le comportement est incorrect.

## Échelle de commandes

Exécutez d’abord celles-ci dans l’ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Référence de bon fonctionnement :

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, ou `admin-capable`
- La sonde du canal indique que le transport est connecté et, lorsque c’est pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures de panne WhatsApp

| Symptôme                          | Vérification la plus rapide                         | Correctif                                                      |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Connecté mais aucune réponse en DM | `openclaw pairing list whatsapp`                    | Approuvez l’expéditeur ou changez la politique DM/la liste d’autorisation. |
| Messages de groupe ignorés        | Vérifiez `requireMention` + les modèles de mention dans la config | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe. |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` + logs           | Reconnectez-vous et vérifiez que le répertoire d’identifiants est sain.   |

Dépannage complet : [/channels/whatsapp#troubleshooting](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures de panne Telegram

| Symptôme                            | Vérification la plus rapide                      | Correctif                                                                                                                   |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` mais aucun flux de réponse exploitable | `openclaw pairing list telegram`                 | Approuvez l’appairage ou modifiez la politique DM.                                                                         |
| Bot en ligne mais groupe silencieux | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité dans le groupe ou mentionnez le bot.                                 |
| Échecs d’envoi avec erreurs réseau  | Inspectez les logs pour les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                                |
| Le polling se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics de polling | Mettez à jour ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage | Inspectez les logs pour `BOT_COMMANDS_TOO_MUCH`  | Réduisez les commandes Telegram de Plugin/Skills/personnalisées ou désactivez les menus natifs.                           |
| Mise à niveau effectuée et la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de la config | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des ID numériques d’expéditeur.                             |

Dépannage complet : [/channels/telegram#troubleshooting](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures de panne Discord

| Symptôme                          | Vérification la plus rapide          | Correctif                                                |
| --------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| Bot en ligne mais aucune réponse sur le serveur | `openclaw channels status --probe`  | Autorisez le serveur/le canal et vérifiez l’intent de contenu des messages. |
| Messages de groupe ignorés        | Vérifiez dans les logs les rejets dus au filtrage par mention | Mentionnez le bot ou définissez `requireMention: false` pour le serveur/le canal. |
| Réponses DM absentes              | `openclaw pairing list discord`      | Approuvez l’appairage DM ou ajustez la politique DM.     |

Dépannage complet : [/channels/discord#troubleshooting](/fr/channels/discord#troubleshooting)

## Slack

### Signatures de panne Slack

| Symptôme                                 | Vérification la plus rapide                | Correctif                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode socket connecté mais aucune réponse | `openclaw channels status --probe`         | Vérifiez le jeton d’application + le jeton bot et les scopes requis ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` sur les configurations basées sur SecretRef. |
| DM bloqués                               | `openclaw pairing list slack`              | Approuvez l’appairage ou assouplissez la politique DM.                                                                                                |
| Message de canal ignoré                  | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou passez la politique à `open`.                                                                                                   |

Dépannage complet : [/channels/slack#troubleshooting](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures de panne iMessage et BlueBubbles

| Symptôme                         | Vérification la plus rapide                                      | Correctif                                              |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| Aucun événement entrant          | Vérifiez l’accessibilité du Webhook/serveur et les permissions de l’app | Corrigez l’URL du Webhook ou l’état du serveur BlueBubbles. |
| Peut envoyer mais ne reçoit pas sur macOS | Vérifiez les permissions de confidentialité macOS pour l’automatisation de Messages | Accordez à nouveau les permissions TCC et redémarrez le processus du canal. |
| Expéditeur DM bloqué             | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’appairage ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [/channels/imessage#troubleshooting](/fr/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures de panne Signal

| Symptôme                          | Vérification la plus rapide              | Correctif                                                 |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Daemon joignable mais bot silencieux | `openclaw channels status --probe`         | Vérifiez l’URL/le compte du daemon `signal-cli` et le mode de réception. |
| DM bloqué                         | `openclaw pairing list signal`             | Approuvez l’expéditeur ou ajustez la politique DM.        |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les modèles de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [/channels/signal#troubleshooting](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures de panne QQ Bot

| Symptôme                          | Vérification la plus rapide                 | Correctif                                                        |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Le bot répond « gone to Mars »    | Vérifiez `appId` et `clientSecret` dans la config | Définissez les identifiants ou redémarrez la gateway.            |
| Aucun message entrant             | `openclaw channels status --probe`          | Vérifiez les identifiants sur la plateforme ouverte QQ.          |
| La voix n’est pas transcrite      | Vérifiez la config du provider STT          | Configurez `channels.qqbot.stt` ou `tools.media.audio`.          |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [/channels/qqbot#troubleshooting](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures de panne Matrix

| Symptôme                            | Vérification la plus rapide            | Correctif                                                                  |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Connecté mais ignore les messages du salon | `openclaw channels status --probe`     | Vérifiez `groupPolicy`, la liste d’autorisation du salon et le filtrage par mention. |
| Les DM ne sont pas traités          | `openclaw pairing list matrix`         | Approuvez l’expéditeur ou ajustez la politique DM.                         |
| Les salons chiffrés échouent        | `openclaw matrix verify status`        | Vérifiez à nouveau l’appareil, puis contrôlez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/cassée | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| Le cross-signing/bootstrap semble incorrect | `openclaw matrix verify bootstrap`     | Réparez en une seule passe le stockage des secrets, le cross-signing et l’état de la sauvegarde. |

Configuration et installation complètes : [Matrix](/fr/channels/matrix)
