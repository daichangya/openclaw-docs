---
read_when:
    - Vous souhaitez qu’OpenClaw soit isolé de votre environnement macOS principal
    - Vous souhaitez une intégration iMessage (BlueBubbles) dans une sandbox
    - Vous souhaitez un environnement macOS réinitialisable que vous pouvez cloner
    - Vous souhaitez comparer les options de VM macOS locales et hébergées
summary: Exécuter OpenClaw dans une VM macOS en sandbox (locale ou hébergée) lorsque vous avez besoin d’isolation ou d’iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-04-05T12:46:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw sur VM macOS (sandboxing)

## Recommandation par défaut (la plupart des utilisateurs)

- **Petit VPS Linux** pour une passerelle toujours active et à faible coût. Voir [hébergement VPS](/vps).
- **Matériel dédié** (Mac mini ou boîtier Linux) si vous voulez un contrôle total et une **IP résidentielle** pour l’automatisation browser. De nombreux sites bloquent les IP de centres de données, donc la navigation locale fonctionne souvent mieux.
- **Hybride :** gardez la passerelle sur un VPS peu coûteux, et connectez votre Mac comme **nœud** lorsque vous avez besoin d’automatisation browser/UI. Voir [Nodes](/nodes) et [Gateway remote](/gateway/remote).

Utilisez une VM macOS lorsque vous avez spécifiquement besoin de capacités macOS uniquement (iMessage/BlueBubbles) ou que vous souhaitez une isolation stricte par rapport à votre Mac du quotidien.

## Options de VM macOS

### VM locale sur votre Mac Apple Silicon (Lume)

Exécutez OpenClaw dans une VM macOS en sandbox sur votre Mac Apple Silicon existant à l’aide de [Lume](https://cua.ai/docs/lume).

Cela vous offre :

- Un environnement macOS complet et isolé (votre hôte reste propre)
- La prise en charge d’iMessage via BlueBubbles (impossible sur Linux/Windows)
- Une réinitialisation instantanée par clonage des VM
- Aucun matériel supplémentaire ni coût cloud

### Fournisseurs Mac hébergés (cloud)

Si vous voulez macOS dans le cloud, les fournisseurs Mac hébergés fonctionnent aussi :

- [MacStadium](https://www.macstadium.com/) (Mac hébergés)
- D’autres fournisseurs Mac hébergés fonctionnent également ; suivez leur documentation VM + SSH

Une fois que vous avez un accès SSH à une VM macOS, passez à l’étape 6 ci-dessous.

---

## Parcours rapide (Lume, utilisateurs expérimentés)

1. Installer Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Terminer l’assistant de configuration, activer Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Se connecter en SSH, installer OpenClaw, configurer les canaux
6. Terminé

---

## Ce dont vous avez besoin (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou version ultérieure sur l’hôte
- ~60 Go d’espace disque libre par VM
- ~20 minutes

---

## 1) Installer Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Si `~/.local/bin` n’est pas dans votre PATH :

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Vérifiez :

```bash
lume --version
```

Documentation : [Installation de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Créer la VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Cela télécharge macOS et crée la VM. Une fenêtre VNC s’ouvre automatiquement.

Remarque : le téléchargement peut prendre du temps selon votre connexion.

---

## 3) Terminer l’assistant de configuration

Dans la fenêtre VNC :

1. Sélectionnez la langue et la région
2. Ignorez l’identifiant Apple (ou connectez-vous si vous souhaitez iMessage plus tard)
3. Créez un compte utilisateur (retenez le nom d’utilisateur et le mot de passe)
4. Ignorez toutes les fonctionnalités facultatives

Une fois la configuration terminée, activez SSH :

1. Ouvrez Réglages Système → Général → Partage
2. Activez « Remote Login »

---

## 4) Obtenir l’adresse IP de la VM

```bash
lume get openclaw
```

Recherchez l’adresse IP (généralement `192.168.64.x`).

---

## 5) Se connecter en SSH à la VM

```bash
ssh youruser@192.168.64.X
```

Remplacez `youruser` par le compte que vous avez créé, et l’IP par celle de votre VM.

---

## 6) Installer OpenClaw

Dans la VM :

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Suivez les invites d’intégration guidée pour configurer votre fournisseur de modèles (Anthropic, OpenAI, etc.).

---

## 7) Configurer les canaux

Modifiez le fichier de configuration :

```bash
nano ~/.openclaw/openclaw.json
```

Ajoutez vos canaux :

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Puis connectez-vous à WhatsApp (scanner le QR) :

```bash
openclaw channels login
```

---

## 8) Exécuter la VM en mode headless

Arrêtez la VM puis redémarrez-la sans affichage :

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM s’exécute en arrière-plan. Le daemon d’OpenClaw maintient la passerelle active.

Pour vérifier l’état :

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus : intégration iMessage

C’est la fonctionnalité phare d’une exécution sur macOS. Utilisez [BlueBubbles](https://bluebubbles.app) pour ajouter iMessage à OpenClaw.

Dans la VM :

1. Téléchargez BlueBubbles depuis bluebubbles.app
2. Connectez-vous avec votre identifiant Apple
3. Activez l’API Web et définissez un mot de passe
4. Pointez les webhooks BlueBubbles vers votre passerelle (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Ajoutez à votre configuration OpenClaw :

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Redémarrez la passerelle. Votre agent peut désormais envoyer et recevoir des iMessages.

Détails complets de configuration : [canal BlueBubbles](/channels/bluebubbles)

---

## Enregistrer une image de référence

Avant d’aller plus loin dans la personnalisation, capturez un instantané de votre état propre :

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Réinitialiser à tout moment :

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Exécution 24/7

Gardez la VM active en :

- laissant votre Mac branché
- désactivant la veille dans Réglages Système → Économiseur d’énergie
- utilisant `caffeinate` si nécessaire

Pour un vrai fonctionnement permanent, envisagez un Mac mini dédié ou un petit VPS. Voir [hébergement VPS](/vps).

---

## Dépannage

| Problème                 | Solution                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Impossible de se connecter en SSH à la VM | Vérifiez que "Remote Login" est activé dans les Réglages Système de la VM |
| L’IP de la VM ne s’affiche pas | Attendez que la VM ait complètement démarré, puis exécutez à nouveau `lume get openclaw` |
| Commande Lume introuvable | Ajoutez `~/.local/bin` à votre PATH                                               |
| Le QR WhatsApp ne se scanne pas | Assurez-vous d’être connecté à la VM (et non à l’hôte) lorsque vous exécutez `openclaw channels login` |

---

## Documentation associée

- [hébergement VPS](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [canal BlueBubbles](/channels/bluebubbles)
- [Démarrage rapide Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Référence CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuration de VM sans assistance](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avancé)
- [Sandboxing Docker](/install/docker) (approche d’isolation alternative)
