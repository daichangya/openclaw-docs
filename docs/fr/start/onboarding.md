---
read_when:
    - Concevoir l’assistant d’onboarding macOS
    - Implémenter la configuration de l’authentification ou de l’identité
sidebarTitle: 'Onboarding: macOS App'
summary: Flux de configuration de première exécution pour OpenClaw (application macOS)
title: Onboarding (application macOS)
x-i18n:
    generated_at: "2026-04-05T12:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (application macOS)

Ce document décrit le flux de configuration de **première exécution** actuel. L’objectif est une
expérience fluide au « jour 0 » : choisir où la Gateway s’exécute, connecter l’authentification, lancer l’assistant,
puis laisser l’agent s’initialiser lui-même.
Pour une vue d’ensemble générale des parcours d’onboarding, voir [Onboarding Overview](/start/onboarding-overview).

<Steps>
<Step title="Approuver l’avertissement macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approuver la recherche de réseaux locaux">
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
- Les configurations partagées / multi-utilisateurs exigent un verrouillage strict (séparez les frontières de confiance, limitez l’accès aux outils au minimum, et suivez [Security](/gateway/security)).
- L’onboarding local définit maintenant par défaut `tools.profile: "coding"` pour les nouvelles configurations, afin que les nouvelles installations locales conservent les outils de système de fichiers/runtime sans imposer le profil `full` sans restriction.
- Si des hooks/webhooks ou d’autres flux de contenu non fiables sont activés, utilisez un modèle moderne de niveau élevé et conservez une politique d’outils / un sandboxing stricts.

</Step>
<Step title="Local ou distant">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Où la **Gateway** s’exécute-t-elle ?

- **Ce Mac (local uniquement) :** l’onboarding peut configurer l’authentification et écrire les identifiants
  localement.
- **Distant (via SSH/Tailnet) :** l’onboarding ne configure **pas** l’authentification locale ;
  les identifiants doivent exister sur l’hôte gateway.
- **Configurer plus tard :** ignore la configuration et laisse l’application non configurée.

<Tip>
**Conseil sur l’authentification Gateway :**

- L’assistant génère désormais un **jeton** même pour loopback, donc les clients WS locaux doivent s’authentifier.
- Si vous désactivez l’authentification, n’importe quel processus local peut se connecter ; n’utilisez cela que sur des machines entièrement de confiance.
- Utilisez un **jeton** pour l’accès multi-machine ou les binds non loopback.

</Tip>
</Step>
<Step title="Autorisations">
<Frame caption="Choisissez les autorisations que vous souhaitez accorder à OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L’onboarding demande les autorisations TCC nécessaires pour :

- Automatisation (AppleScript)
- Notifications
- Accessibilité
- Enregistrement de l’écran
- Microphone
- Reconnaissance vocale
- Caméra
- Localisation

</Step>
<Step title="CLI">
  <Info>Cette étape est facultative</Info>
  L’application peut installer la CLI globale `openclaw` via npm, pnpm ou bun.
  Elle préfère d’abord npm, puis pnpm, puis bun si c’est le seul gestionnaire
  de paquets détecté. Pour le runtime Gateway, Node reste la voie recommandée.
</Step>
<Step title="Chat d’onboarding (session dédiée)">
  Après la configuration, l’application ouvre une session de chat d’onboarding dédiée afin que l’agent puisse
  se présenter et guider les prochaines étapes. Cela garde les indications de première exécution séparées
  de votre conversation normale. Voir [Bootstrapping](/start/bootstrapping) pour
  ce qui se passe sur l’hôte gateway lors de la première exécution de l’agent.
</Step>
</Steps>
