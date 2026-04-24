---
read_when:
    - Configuration initiale à partir de zéro
    - Vous voulez le chemin le plus rapide vers un chat fonctionnel
summary: Installez OpenClaw et lancez votre premier chat en quelques minutes.
title: Prise en main
x-i18n:
    generated_at: "2026-04-24T07:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Installez OpenClaw, lancez l’onboarding, et discutez avec votre assistant IA — le tout en
environ 5 minutes. À la fin, vous aurez un Gateway en fonctionnement, une authentification configurée,
et une session de chat opérationnelle.

## Ce dont vous avez besoin

- **Node.js** — Node 24 recommandé (Node 22.14+ également pris en charge)
- **Une clé API** d’un fournisseur de modèles (Anthropic, OpenAI, Google, etc.) — l’onboarding vous la demandera

<Tip>
Vérifiez votre version de Node avec `node --version`.
**Utilisateurs Windows :** Windows natif et WSL2 sont tous deux pris en charge. WSL2 est plus
stable et recommandé pour l’expérience complète. Voir [Windows](/fr/platforms/windows).
Besoin d’installer Node ? Voir [Configuration de Node](/fr/install/node).
</Tip>

## Configuration rapide

<Steps>
  <Step title="Installer OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Processus du script d’installation"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Autres méthodes d’installation (Docker, Nix, npm) : [Installer](/fr/install).
    </Note>

  </Step>
  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide pour choisir un fournisseur de modèles, définir une clé API,
    et configurer le Gateway. Cela prend environ 2 minutes.

    Voir [Onboarding (CLI)](/fr/start/wizard) pour la référence complète.

  </Step>
  <Step title="Vérifier que le Gateway fonctionne">
    ```bash
    openclaw gateway status
    ```

    Vous devriez voir le Gateway à l’écoute sur le port 18789.

  </Step>
  <Step title="Ouvrir le tableau de bord">
    ```bash
    openclaw dashboard
    ```

    Cela ouvre la Control UI dans votre navigateur. Si elle se charge, tout fonctionne.

  </Step>
  <Step title="Envoyer votre premier message">
    Saisissez un message dans le chat de la Control UI et vous devriez obtenir une réponse IA.

    Vous voulez plutôt discuter depuis votre téléphone ? Le canal le plus rapide à configurer est
    [Telegram](/fr/channels/telegram) (juste un jeton de bot). Voir [Canaux](/fr/channels)
    pour toutes les options.

  </Step>
</Steps>

<Accordion title="Avancé : monter un build personnalisé de la Control UI">
  Si vous maintenez un build localisé ou personnalisé du tableau de bord, faites pointer
  `gateway.controlUi.root` vers un répertoire qui contient vos ressources statiques
  construites et `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copiez vos fichiers statiques construits dans ce répertoire.
```

Puis définissez :

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Redémarrez le gateway et rouvrez le tableau de bord :

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Que faire ensuite

<Columns>
  <Card title="Connecter un canal" href="/fr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et plus encore.
  </Card>
  <Card title="Appairage et sécurité" href="/fr/channels/pairing" icon="shield">
    Contrôlez qui peut envoyer des messages à votre agent.
  </Card>
  <Card title="Configurer le Gateway" href="/fr/gateway/configuration" icon="settings">
    Modèles, outils, sandbox, et paramètres avancés.
  </Card>
  <Card title="Parcourir les outils" href="/fr/tools" icon="wrench">
    Browser, exec, recherche Web, Skills, et plugins.
  </Card>
</Columns>

<Accordion title="Avancé : variables d’environnement">
  Si vous exécutez OpenClaw comme compte de service ou voulez des chemins personnalisés :

- `OPENCLAW_HOME` — répertoire home pour la résolution des chemins internes
- `OPENCLAW_STATE_DIR` — remplace le répertoire d’état
- `OPENCLAW_CONFIG_PATH` — remplace le chemin du fichier de configuration

Référence complète : [Variables d’environnement](/fr/help/environment).
</Accordion>

## Lié

- [Vue d’ensemble de l’installation](/fr/install)
- [Vue d’ensemble des canaux](/fr/channels)
- [Configuration](/fr/start/setup)
