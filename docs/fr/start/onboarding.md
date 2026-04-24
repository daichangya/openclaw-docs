---
read_when:
    - Conception de l’assistant d’onboarding macOS
    - Implémentation de la configuration de l’authentification ou de l’identité
sidebarTitle: 'Onboarding: macOS App'
summary: Flux de configuration au premier lancement pour OpenClaw (application macOS)
title: Onboarding (application macOS)
x-i18n:
    generated_at: "2026-04-24T07:33:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Ce document décrit le flux de configuration **actuel** au premier lancement. L’objectif est une
expérience fluide de « jour 0 » : choisir où le Gateway s’exécute, connecter
l’authentification, lancer l’assistant, et laisser l’agent s’amorcer lui-même.
Pour une vue d’ensemble des chemins d’onboarding, voir [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview).

<Steps>
<Step title="Approuver l’avertissement macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approuver la recherche des réseaux locaux">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Bienvenue et avis de sécurité">
<Frame caption="Lisez l’avis de sécurité affiché et décidez en conséquence">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modèle de confiance de sécurité :

- Par défaut, OpenClaw est un agent personnel : une seule frontière d’opérateur de confiance.
- Les configurations partagées/multi-utilisateurs nécessitent un verrouillage renforcé (séparer les frontières de confiance, garder un accès minimal aux outils, et suivre [Sécurité](/fr/gateway/security)).
- L’onboarding local définit désormais par défaut les nouvelles configurations sur `tools.profile: "coding"` afin que les nouvelles configurations locales conservent les outils de système de fichiers/runtime sans imposer le profil non restreint `full`.
- Si des hooks/Webhooks ou d’autres flux de contenu non fiable sont activés, utilisez un niveau de modèle moderne solide et gardez une politique d’outils/un sandboxing stricts.

</Step>
<Step title="Local ou distant">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Où s’exécute le **Gateway** ?

- **Ce Mac (Local only) :** l’onboarding peut configurer l’authentification et écrire les identifiants
  localement.
- **Distant (via SSH/Tailnet) :** l’onboarding ne configure **pas** l’authentification locale ;
  les identifiants doivent exister sur l’hôte gateway.
- **Configurer plus tard :** ignore la configuration et laisse l’application non configurée.

<Tip>
**Conseil d’authentification Gateway :**

- L’assistant génère maintenant un **jeton** même pour loopback, donc les clients WS locaux doivent s’authentifier.
- Si vous désactivez l’authentification, n’importe quel processus local peut se connecter ; utilisez cela uniquement sur des machines entièrement de confiance.
- Utilisez un **jeton** pour l’accès multi-machine ou les binds non loopback.

</Tip>
</Step>
<Step title="Autorisations">
<Frame caption="Choisissez les autorisations que vous voulez donner à OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L’onboarding demande les autorisations TCC nécessaires pour :

- Automatisation (AppleScript)
- Notifications
- Accessibilité
- Enregistrement d’écran
- Microphone
- Reconnaissance vocale
- Caméra
- Localisation

</Step>
<Step title="CLI">
  <Info>Cette étape est facultative</Info>
  L’application peut installer le CLI global `openclaw` via npm, pnpm ou bun.
  Elle préfère d’abord npm, puis pnpm, puis bun si c’est le seul gestionnaire
  de paquets détecté. Pour le runtime Gateway, Node reste le chemin recommandé.
</Step>
<Step title="Chat d’onboarding (session dédiée)">
  Après la configuration, l’application ouvre une session de chat d’onboarding dédiée afin que l’agent puisse
  se présenter et guider les prochaines étapes. Cela garde les conseils du premier lancement séparés
  de votre conversation normale. Voir [Bootstrapping](/fr/start/bootstrapping) pour
  ce qui se passe sur l’hôte gateway lors de la première exécution de l’agent.
</Step>
</Steps>

## Lié

- [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- [Premiers pas](/fr/start/getting-started)
