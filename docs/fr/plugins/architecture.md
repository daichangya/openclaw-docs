---
read_when:
    - Création ou débogage des Plugin OpenClaw natifs
    - Comprendre le modèle de capacités des Plugin ou les limites de propriété
    - Travaille sur le pipeline de chargement des Plugin ou le registre
    - Implémenter des hooks d’exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Internes des Plugin : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Internes des Plugin
x-i18n:
    generated_at: "2026-04-21T07:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05b612f75189ba32f8c92e5a261241abdf9ad8d4a685c1d8da0cf9605d7158b7
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes des Plugin

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour les guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Premiers pas](/fr/plugins/building-plugins) — premier tutoriel de Plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — carte d’import et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de Plugin OpenClaw.

## Modèle public de capacités

Les capacités sont le modèle public de **Plugin natif** à l’intérieur d’OpenClaw. Chaque
Plugin OpenClaw natif s’enregistre sur un ou plusieurs types de capacités :

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d’inférence CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Parole                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d’image       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un Plugin qui n’enregistre aucune capacité mais fournit des hooks, des outils ou
des services est un Plugin **hérité hook-only**. Ce modèle reste pleinement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les Plugins
natifs/fournis, mais la compatibilité des Plugins externes exige encore un niveau
plus strict que « c’est exporté, donc c’est figé ».

Conseils actuels :

- **plugins externes existants :** maintenir le fonctionnement des intégrations basées sur hooks ; considérez
  cela comme la base de compatibilité
- **nouveaux plugins natifs/fournis :** préférer l’enregistrement explicite de capacités aux
  intrusions spécifiques à un fournisseur ou aux nouveaux modèles uniquement basés sur hooks
- **plugins externes adoptant l’enregistrement de capacités :** autorisé, mais traitez les surfaces d’assistance
  spécifiques aux capacités comme évolutives, sauf si la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction voulue
- les hooks hérités restent le chemin le plus sûr sans rupture
  pour les Plugins externes pendant la transition
- tous les sous-chemins d’assistance exportés ne se valent pas ; préférez le contrat
  documenté étroit, pas les exports d’assistance accessoires

### Formes de Plugin

OpenClaw classe chaque Plugin chargé dans une forme en fonction de son comportement
réel d’enregistrement (pas seulement des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  Plugin fournisseur uniquement comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la génération
  d’image)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans
  capacités, outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un Plugin et le détail
de ses capacités. Voir [Référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les plugins hook-only. Des Plugins hérités réels en dépendent encore.

Orientation :

- le garder fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de surcharge de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimer qu’après baisse de l’usage réel et après que la couverture par fixtures ait prouvé la sécurité de migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’un de ces libellés :

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **configuration valide**           | La configuration est bien analysée et les Plugins sont résolus                       |
| **avis de compatibilité** | Le Plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **avertissement hérité**         | Le Plugin utilise `before_agent_start`, qui est obsolète        |
| **erreur bloquante**             | La configuration est invalide ou le Plugin n’a pas pu se charger                   |

Ni `hook-only` ni `before_agent_start` ne casseront votre Plugin aujourd’hui --
`hook-only` est consultatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de Plugin d’OpenClaw a quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les Plugins candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines globales d’extension et des extensions fournies. La découverte lit d’abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le cœur décide si un Plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement à l’exécution**
   Les Plugins OpenClaw natifs sont chargés in-process via jiti et enregistrent
   leurs capacités dans un registre central. Les bundles compatibles sont normalisés dans
   des enregistrements du registre sans importer le code d’exécution.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration
   de fournisseur, hooks, routes HTTP, commandes CLI et services.

Pour le CLI des Plugins en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l’analyse viennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du Plugin peut rester paresseux et s’enregistrer lors de la première invocation

Cela permet de garder le code CLI appartenant au Plugin à l’intérieur du Plugin tout en laissant OpenClaw
réserver les noms de commande racine avant l’analyse.

La limite de conception importante :

- la découverte + validation de la configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du Plugin
- le comportement natif à l’exécution vient du chemin `register(api)` du module Plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les Plugins manquants/désactivés et
de construire les indices d’UI/schéma avant que le runtime complet ne soit actif.

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé send/edit/react pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et
les plugins de canal gèrent la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage du prompt, la tenue des comptes
  de session/fil et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions à portée, la découverte de capacités
  et tous les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur,
  par exemple la manière dont les ID de conversation encodent les ID de fil ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié
permet à un Plugin de renvoyer ensemble ses actions visibles, ses capacités et ses contributions
de schéma afin d’éviter que ces éléments ne divergent.

Lorsqu’un paramètre d’outil de message spécifique à un canal transporte une source média telle qu’un
chemin local ou une URL de média distante, le Plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite
pour appliquer la normalisation des chemins sandbox et les indices d’accès aux médias sortants
sans coder en dur des noms de paramètres appartenant au Plugin.
Préférez ici des cartes à portée d’action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé au profil ne soit pas normalisé sur des actions sans rapport comme
`send`.

Le cœur transmet la portée d’exécution dans cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

Cela compte pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des
actions de message en fonction du compte actif, de la salle/du fil/du message en cours, ou de l’identité
de l’émetteur approuvée, sans coder en dur des branches spécifiques au canal dans l’outil `message`
du cœur.

C’est pourquoi les changements de routage de l’embedded-runner restent du travail de Plugin : le runner est
responsable de transmettre l’identité du chat/de la session en cours à la limite de découverte du Plugin afin que l’outil `message` partagé expose la bonne surface appartenant au canal pour le tour en cours.

Pour les assistants d’exécution appartenant au canal, les plugins fournis doivent conserver le runtime
d’exécution dans leurs propres modules d’extension. Le cœur ne possède plus les runtimes
d’actions de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les plugins fournis
doivent importer directement leur propre code de runtime local depuis leurs modules
appartenant à l’extension.

La même limite s’applique en général aux jointures SDK nommées par fournisseur : le cœur ne doit
pas importer de barrels de commodité spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer
le propre barrel `api.ts` / `runtime-api.ts` du Plugin fourni, soit promouvoir ce besoin
en capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle
  commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal
  ou les paramètres de sondage supplémentaires

Le cœur reporte désormais l’analyse partagée des sondages jusqu’à ce que la répartition des sondages du Plugin
refuse l’action, afin que les gestionnaires de sondage appartenant au Plugin puissent accepter des
champs de sondage spécifiques au canal sans être bloqués d’abord par l’analyseur de sondage générique.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un Plugin natif comme la limite de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un fourre-tout d’intégrations sans rapport.

Cela signifie :

- un Plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw-facing
  de cette entreprise
- un Plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter un comportement de fournisseur de manière ad hoc

Exemples :

- le Plugin fourni `openai` possède le comportement de fournisseur de modèles OpenAI et le comportement OpenAI
  de parole + voix en temps réel + compréhension des médias + génération d’image
- le Plugin fourni `elevenlabs` possède le comportement de parole ElevenLabs
- le Plugin fourni `microsoft` possède le comportement de parole Microsoft
- le Plugin fourni `google` possède le comportement de fournisseur de modèles Google ainsi que le comportement Google
  de compréhension des médias + génération d’image + recherche web
- le Plugin fourni `firecrawl` possède le comportement de récupération web Firecrawl
- les plugins fournis `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le Plugin fourni `qwen` possède le comportement de fournisseur de texte Qwen ainsi que
  le comportement de compréhension des médias et de génération de vidéo
- le Plugin `voice-call` est un Plugin de fonctionnalité : il possède le transport d’appel, les outils,
  le CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées
  de parole ainsi que de transcription en temps réel et de voix en temps réel au lieu
  d’importer directement les plugins de fournisseurs

L’état final visé est :

- OpenAI vit dans un seul Plugin même s’il couvre les modèles de texte, la parole, les images et
  la future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas de savoir quel Plugin fournisseur possède le fournisseur ; ils consomment le
  contrat de capacité partagé exposé par le cœur

Voici la distinction clé :

- **plugin** = limite de propriété
- **capability** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat central de capacité vidéo ? » Une fois ce contrat créé, les plugins de fournisseurs
peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne marche à suivre est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer via l’API/le runtime du Plugin de manière typée
3. raccorder les canaux/fonctionnalités à cette capacité
4. laisser les plugins de fournisseurs enregistrer des implémentations

Cela garde une propriété explicite tout en évitant un comportement du cœur dépendant d’un
seul fournisseur ou d’un chemin de code spécifique à un Plugin isolé.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit aller :

- **couche de capacité du cœur** : orchestration partagée, politique, repli, règles de fusion
  de configuration, sémantique de livraison et contrats typés
- **couche Plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse
  vocale, génération d’image, futurs backends vidéo, points de terminaison d’usage
- **couche Plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, la TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant runtime TTS de téléphonie

Ce même modèle doit être préféré pour les capacités futures.

### Exemple de Plugin d’entreprise multi-capacités

Un Plugin d’entreprise doit paraître cohérent de l’extérieur. Si OpenClaw dispose de
contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias,
la génération d’image, la génération de vidéo, la récupération web et la recherche web,
un fournisseur peut posséder toutes ses surfaces au même endroit :

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Ce qui compte, ce ne sont pas les noms exacts des assistants. C’est la forme qui compte :

- un Plugin possède la surface fournisseur
- le cœur possède toujours les contrats de capacité
- les plugins de canal et de fonctionnalité consomment les assistants `api.runtime.*`, pas le code fournisseur
- les tests de contrat peuvent affirmer que le Plugin a enregistré les capacités qu’il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une capacité
partagée unique. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins de fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu
   de se raccorder directement au code fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un seul fournisseur. Le Plugin possède
la surface fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération de vidéo suit déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant runtime, et les plugins de fournisseurs enregistrent
des implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface API des Plugin est intentionnellement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants runtime sur lesquels un Plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de Plugin obtiennent une norme interne stable unique
- le cœur peut rejeter une propriété dupliquée, par exemple deux plugins enregistrant le même
  ID fournisseur
- le démarrage peut exposer des diagnostics exploitables pour un enregistrement malformé
- les tests de contrat peuvent imposer la propriété des plugins fournis et empêcher une dérive silencieuse

Il existe deux couches d’application :

1. **application à l’enregistrement runtime**
   Le registre de plugins valide les enregistrements à mesure que les Plugins se chargent. Exemples :
   les ID fournisseur dupliqués, les ID de fournisseur de parole dupliqués et les enregistrements
   malformés produisent des diagnostics de Plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins fournis sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse affirmer explicitement la propriété. Aujourd’hui, cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs de parole, les fournisseurs de recherche web et la propriété
   d’enregistrement des plugins fournis.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel Plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer sans friction parce que la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui a sa place dans un contrat

Les bons contrats de Plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par des canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de Plugin sont :

- une politique spécifique à un fournisseur cachée dans le cœur
- des échappatoires ponctuelles spécifiques à un Plugin qui contournent le registre
- du code de canal accédant directement à une implémentation fournisseur
- des objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les Plugins OpenClaw natifs s’exécutent **dans le processus** avec Gateway. Ils ne sont
pas sandboxés. Un Plugin natif chargé a la même limite de confiance au niveau du processus que
le code du cœur.

Implications :

- un Plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un Plugin natif peut faire planter ou déstabiliser la Gateway
- un Plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills fournis.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les Plugins non fournis. Traitez
les plugins d’espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de paquet d’espace de travail fournis, gardez l’ID Plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé comme
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le paquet expose intentionnellement un rôle de Plugin plus étroit.

Remarque importante sur la confiance :

- `plugins.allow` fait confiance aux **ID Plugin**, pas à la provenance de la source.
- Un Plugin d’espace de travail avec le même ID qu’un Plugin fourni masque intentionnellement
  la copie fournie lorsque ce Plugin d’espace de travail est activé/sur liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctifs et les correctifs urgents.

## Limite d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez l’enregistrement de capacités public. Réduisez les exports d’assistance hors contrat :

- sous-chemins d’assistance spécifiques à un Plugin fourni
- sous-chemins de plomberie runtime non destinés à l’API publique
- assistants de commodité spécifiques à un fournisseur
- assistants de configuration/onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistance de plugins fournis restent encore dans la carte d’export du SDK générée
pour des raisons de compatibilité et de maintenance des plugins fournis. Les exemples actuels incluent
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, ainsi que plusieurs jonctions `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour
les nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement ceci :

1. découvre les racines candidates de Plugin
2. lit les manifestes natifs ou de bundle compatible ainsi que les métadonnées de paquet
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — un alias hérité) et collecte les enregistrements dans le registre de plugins
8. expose le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même moment. Tous les plugins fournis utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les garde-fous de sécurité se produisent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque l’entrée s’échappe de la racine du Plugin, lorsque le chemin est inscriptible par tout le monde, ou lorsque
la propriété du chemin semble suspecte pour les Plugins non fournis.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/Skills/schémas de configuration ou capacités de bundle déclarés
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs de configuration et d’activation peu coûteux sans charger le runtime du Plugin

Pour les Plugins natifs, le module runtime est la partie plan de données. Il enregistre le
comportement réel tel que hooks, outils, commandes ou flux fournisseur.

Les blocs de manifeste optionnels `activation` et `setup` restent sur le plan de contrôle.
Ce sont des descripteurs uniquement de métadonnées pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)` ou `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indices de manifeste de commandes, canaux et fournisseurs
pour réduire le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI est réduit aux plugins qui possèdent la commande primaire demandée
- la résolution de Plugin/configuration de canal est réduite aux plugins qui possèdent l’ID de canal demandé
- la résolution explicite de configuration/runtime de fournisseur est réduite aux plugins qui possèdent l’ID de fournisseur demandé

La découverte de configuration préfère désormais les ID appartenant aux descripteurs comme `setup.providers` et
`setup.cliBackends` pour réduire les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Si plus
d’un Plugin découvert revendique le même ID normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en mémoire de processus pour :

- les résultats de découverte
- les données du registre de manifestes
- les registres de plugins chargés

Ces caches réduisent les surcharges de démarrage en rafale et de commandes répétées. Il est sûr
de les considérer comme des caches de performance à courte durée de vie, et non comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne mutent pas directement des globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de Plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et typés
- les canaux
- les fournisseurs
- les gestionnaires RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes appartenant aux plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de parler directement aux modules
Plugin. Cela maintient un chargement unidirectionnel :

- module Plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Cela signifie que la plupart des surfaces du cœur n’ont
besoin que d’un seul point d’intégration : « lire le registre », pas « gérer spécialement chaque module
Plugin ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une requête de liaison
a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les requêtes approuvées
- `request` : le résumé de la requête d’origine, l’indice de détachement, l’ID de l’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks runtime de fournisseur

Les plugins de fournisseurs ont maintenant deux couches :

- métadonnées de manifeste : `providerAuthEnvVars` pour une recherche peu coûteuse d’authentification fournisseur via variables d’environnement
  avant le chargement runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche peu coûteuse d’environnement/configuration de canal avant le chargement
  runtime, ainsi que `providerAuthChoices` pour des libellés peu coûteux d’onboarding/choix d’authentification et des
  métadonnées de drapeaux CLI avant le chargement runtime
- hooks au moment de la configuration : `catalog` / ancien `discovery` plus `applyConfigDefaults`
- hooks runtime : `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`,
  `supportsMaxThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle d’agent générique, le basculement, la gestion des transcriptions et la
politique des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique au fournisseur sans
nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur a des identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans charger le runtime du Plugin. Utilisez le manifeste `providerAuthAliases` lorsqu’un ID fournisseur doit réutiliser
les variables d’environnement, profils d’authentification, authentification adossée à la configuration et choix d’onboarding par clé API d’un autre ID fournisseur. Utilisez le manifeste `providerAuthChoices` lorsque les surfaces CLI d’onboarding/choix d’authentification
doivent connaître l’ID de choix du fournisseur, les libellés de groupe et le câblage simple
d’authentification à un drapeau sans charger le runtime du fournisseur. Gardez le runtime fournisseur
`envVars` pour les indices orientés opérateur tels que les libellés d’onboarding ou les variables de
configuration client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal a une authentification ou une configuration pilotée par l’environnement que
le repli générique sur l’environnement shell, les vérifications config/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre des hooks et usage

Pour les plugins de modèles/fournisseurs, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.

| #   | Hook                              | Ce qu’il fait                                                                                                   | Quand l’utiliser                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`                                | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                                                |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales appartenant au fournisseur pendant la matérialisation de la configuration                                      | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur                                                                       |
| --  | _(recherche de modèle intégrée)_         | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                          | _(pas un hook de Plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalise les alias hérités ou de préversion d’ID de modèle avant la recherche                                                     | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                                               |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille du fournisseur avant l’assemblage générique du modèle                                      | Le fournisseur possède le nettoyage du transport pour les ID fournisseur personnalisés dans la même famille de transport                                                        |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/fournisseur                                           | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le Plugin ; les assistants fournis de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux fournisseurs de configuration                                               | Le fournisseur a besoin de corrections de métadonnées d’usage du streaming natif pilotées par le point de terminaison                                                                        |
| 7   | `resolveConfigApiKey`             | Résout l’authentification à marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification runtime                                       | Le fournisseur possède la résolution de clé API à marqueur d’environnement ; `amazon-bedrock` a aussi ici un résolveur intégré de marqueur d’environnement AWS                |
| 8   | `resolveSyntheticAuth`            | Expose l’authentification locale/autohébergée ou adossée à la configuration sans persister du texte en clair                                   | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes appartenant au fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par CLI/app | Le fournisseur réutilise des identifiants d’authentification externes sans persister les refresh tokens copiés                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | Fait passer les espaces réservés stockés de profils synthétiques derrière l’authentification adossée à l’environnement/la configuration                                      | Le fournisseur stocke des profils synthétiques de substitution qui ne doivent pas avoir la priorité                                                               |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les ID de modèle appartenant au fournisseur qui ne sont pas encore dans le registre local                                       | Le fournisseur accepte des ID de modèle arbitraires en amont                                                                                               |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                                           | Le fournisseur a besoin de métadonnées réseau avant de résoudre les ID inconnus                                                                                |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’embedded-runner n’utilise le modèle résolu                                               | Le fournisseur a besoin de réécritures de transport mais utilise toujours un transport du cœur                                                                           |
| 14  | `contributeResolvedModelCompat`   | Contribue des drapeaux de compatibilité pour les modèles fournisseur derrière un autre transport compatible                                  | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                                     |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage appartenant au fournisseur utilisées par la logique partagée du cœur                                           | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                                                            |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que l’embedded-runner ne les voie                                                    | Le fournisseur a besoin d’un nettoyage de schéma de famille de transport                                                                                              |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au fournisseur après normalisation                                                  | Le fournisseur veut des avertissements de mots-clés sans apprendre au cœur des règles spécifiques au fournisseur                                                               |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                              | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                                       |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                                              | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage des paramètres par fournisseur                                                                         |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                                   | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                                                   |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                              | Le fournisseur a besoin de wrappers d’en-têtes/corps/compatibilité de modèle sans transport personnalisé                                                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour de transport                                                           | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de délai entre sessions                                                    | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                             |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne runtime `apiKey`                                     | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée                                                                  |
| 25  | `refreshOAuth`                    | Surcharge de rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement                                  | Le fournisseur n’entre pas dans les rafraîchisseurs partagés `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsqu’un rafraîchissement OAuth échoue                                                                  | Le fournisseur a besoin d’une consigne de réparation d’authentification qui lui appartient après un échec de rafraîchissement                                                                    |
| 27  | `matchesContextOverflowError`     | Détecteur appartenant au fournisseur pour les dépassements de fenêtre de contexte                                                                 | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques ne verraient pas                                                                              |
| 28  | `classifyFailoverReason`          | Classification appartenant au fournisseur des raisons de basculement                                                                  | Le fournisseur peut mapper les erreurs brutes d’API/transport à rate-limit/surcharge/etc.                                                                        |
| 29  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                                               | Le fournisseur a besoin d’un contrôle TTL de cache spécifique au proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération en cas d’authentification manquante                                                      | Le fournisseur a besoin d’un indice de récupération spécifique au fournisseur en cas d’authentification manquante                                                                               |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes plus indice d’erreur optionnel orienté utilisateur                                          | Le fournisseur a besoin de masquer des lignes amont obsolètes ou de les remplacer par un indice fournisseur                                                               |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                                                   |
| 33  | `isBinaryThinking`                | Bascule de raisonnement on/off pour les fournisseurs à raisonnement binaire                                                          | Le fournisseur n’expose qu’un raisonnement binaire activé/désactivé                                                                                                |
| 34  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour les modèles sélectionnés                                                                  | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                                           |
| 35  | `supportsAdaptiveThinking`        | Prise en charge du raisonnement `adaptive` pour les modèles sélectionnés                                                                | Le fournisseur veut que `adaptive` ne soit affiché que pour les modèles avec raisonnement adaptatif géré par le fournisseur                                                     |
| 36  | `supportsMaxThinking`             | Prise en charge du raisonnement `max` pour les modèles sélectionnés                                                                    | Le fournisseur veut que `max` ne soit affiché que pour les modèles avec raisonnement max du fournisseur                                                                       |
| 37  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille de modèles spécifique                                                             | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                                    |
| 38  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils live et la sélection smoke                                              | Le fournisseur possède la correspondance des modèles préférés live/smoke                                                                                           |
| 39  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                       | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                                           |
| 40  | `resolveUsageAuth`                | Résout les identifiants d’usage/facturation pour `/usage` et les surfaces de statut associées                                     | Le fournisseur a besoin d’une analyse personnalisée de jeton d’usage/quota ou d’un identifiant d’usage différent                                                             |
| 41  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/quota spécifiques au fournisseur après résolution de l’authentification                             | Le fournisseur a besoin d’un point de terminaison d’usage spécifique ou d’un analyseur de charge utile                                                                         |
| 42  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding appartenant au fournisseur pour la mémoire/la recherche                                                     | Le comportement d’embedding de mémoire appartient au Plugin fournisseur                                                                                  |
| 43  | `buildReplayPolicy`               | Renvoie une politique de replay contrôlant la gestion de la transcription pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, suppression de blocs de raisonnement)                                                             |
| 44  | `sanitizeReplayHistory`           | Réécrit l’historique de replay après le nettoyage générique de la transcription                                                        | Le fournisseur a besoin de réécritures de replay spécifiques au fournisseur au-delà des assistants partagés de Compaction                                                           |
| 45  | `validateReplayTurns`             | Validation finale ou remodelage des tours de replay avant l’embedded-runner                                           | Le transport du fournisseur a besoin d’une validation de tour plus stricte après l’assainissement générique                                                                  |
| 46  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’état appartenant au fournisseur lorsqu’un modèle devient actif                                                                |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin fournisseur correspondant, puis passent aux autres plugins fournisseurs capables de hooks
jusqu’à ce que l’un d’eux modifie réellement l’ID du modèle ou le transport/la configuration. Cela permet aux shims
de fournisseur alias/compat de continuer à fonctionner sans obliger l’appelant à savoir quel
Plugin fourni possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur de configuration Google fourni applique quand même
ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requête personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks servent aux comportements fournisseurs qui
s’exécutent toujours sur la boucle d’inférence normale d’OpenClaw.

### Exemple de fournisseur

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemples intégrés

- Anthropic utilise `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `supportsAdaptiveThinking`, `supportsMaxThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  et `wrapStreamFn` parce qu’il possède la compatibilité anticipée Claude 4.6,
  les indices de famille de fournisseur, les consignes de réparation d’authentification, l’intégration du point de terminaison d’usage,
  l’éligibilité au cache de prompt, les valeurs par défaut de configuration sensibles à l’authentification, la
  politique de pensée par défaut/adaptative de Claude et la mise en forme de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier` et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour l’instant dans la propre
  jonction publique `api.ts` / `contract-api.ts` du Plugin fourni. Cette surface de paquet
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-tête bêta d’un seul
  fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel` et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` et `isModernModelRef`
  parce qu’il possède la compatibilité anticipée GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indices d’authentification sensibles à Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI et la politique GPT-5 de pensée /
  de modèle live ; la famille de flux `openai-responses-defaults` possède les wrappers natifs partagés OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité texte, la recherche web native Codex,
  la mise en forme de charge utile compatible raisonnement et la gestion de contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est pass-through et peut exposer de nouveaux
  ID de modèle avant les mises à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn` et `isCacheTtlEligible` pour garder hors du cœur
  les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et la
  politique de cache de prompt. Sa politique de replay vient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection de raisonnement proxy et les exclusions de modèle non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel` et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion appareil appartenant au fournisseur, du comportement de repli de modèle, des
  particularités de transcription Claude, d’un échange jeton GitHub -> jeton Copilot et d’un
  point de terminaison d’usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il
  fonctionne toujours sur les transports OpenAI du cœur mais possède sa normalisation
  transport/base URL, sa politique de repli de rafraîchissement OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et l’intégration du point de terminaison d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` qu’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le repli de compatibilité anticipée Gemini 3.1,
  la validation native de replay Gemini, l’assainissement du bootstrap replay, le mode de sortie
  de raisonnement balisé et la correspondance de modèle moderne, tandis que la
  famille de flux `google-thinking` possède la normalisation de charge utile de pensée Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth` et
  `fetchUsageSnapshot` pour la mise en forme de jeton, l’analyse de jeton et le
  câblage du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage de replay spécifique à Claude reste
  limité aux ID Claude au lieu de tous les transports `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` et `resolveDefaultThinkingLevel` parce qu’il possède
  la classification spécifique à Bedrock des erreurs throttle/not-ready/context-overflow
  pour le trafic Anthropic-on-Bedrock ; sa politique de replay partage toujours la même
  garde `anthropic-by-model` limitée à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu’ils proxifient des modèles Gemini
  via des transports compatibles OpenAI et ont besoin de
  l’assainissement de signature de pensée Gemini sans validation native de replay Gemini ni réécritures
  de bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu’un seul fournisseur possède à la fois
  la sémantique de messages Anthropic et la sémantique compatible OpenAI ; il conserve la suppression des blocs
  de pensée limités à Claude côté Anthropic tout en surchargeant le mode de sortie de raisonnement
  vers natif, et la famille de flux `minimax-fast-mode` possède les réécritures de modèle fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog` ainsi que `wrapStreamFn` parce qu’il utilise toujours le transport partagé
  OpenAI mais a besoin d’une normalisation de charge utile de pensée appartenant au fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration ainsi que l’état `/think` vers sa
  charge utile native de pensée binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn` et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête appartenant au fournisseur,
  d’une normalisation de charge utile de raisonnement, d’indices de transcription Gemini et d’un contrôle TTL de cache
  Anthropic ; la famille de flux `kilocode-thinking` garde l’injection de pensée Kilo
  sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et d’autres ID de modèle proxy
  qui ne prennent pas en charge les charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il possède le repli GLM-5,
  les valeurs par défaut de `tool_stream`, l’UX de pensée binaire, la correspondance de modèle moderne et à la fois
  l’authentification d’usage + la récupération de quota ; la famille de flux `tool-stream-default-on` garde
  le wrapper `tool_stream` activé par défaut hors de la glue manuscrite par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures d’alias
  fast-mode Grok, la valeur par défaut `tool_stream`, le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation d’authentification de repli pour les outils appartenant au Plugin, la résolution de modèle Grok
  compatible futur, ainsi que les correctifs de compatibilité appartenant au fournisseur comme le profil de schéma d’outils xAI,
  les mots-clés de schéma non pris en charge, `web_search` natif et le décodage des arguments d’appel d’outil avec entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent uniquement `capabilities` afin de garder
  hors du cœur les particularités de transcription/outillage.
- Les fournisseurs fournis uniquement catalogue comme `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que des enregistrements partagés de compréhension des médias et
  de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d’usage parce que leur comportement `/usage`
  appartient au Plugin même si l’inférence passe toujours par les transports partagés.

## Assistants runtime

Les plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour la TTS :

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Remarques :

- `textToSpeech` renvoie la charge utile normale de sortie TTS du cœur pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un tampon audio PCM + fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est optionnel selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la langue, le genre et les tags de personnalité pour des sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Remarques :

- Gardez la politique TTS, le repli et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée héritée Microsoft `edge` est normalisée vers l’ID fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un seul Plugin fournisseur peut posséder
  le texte, la parole, l’image et les futurs fournisseurs de médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un fournisseur typé unique de
compréhension des médias au lieu d’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Gardez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement fournisseur dans le Plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes optionnelles, nouveaux champs de résultat
  optionnels, nouvelles capacités optionnelles.
- La génération de vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant runtime
  - les plugins de fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants runtime de compréhension des médias, les plugins peuvent appeler :

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de
compréhension des médias, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio du cœur pour la compréhension des médias (`tools.media.audio`) et l’ordre de repli du fournisseur.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des surcharges optionnelles par exécution, pas des changements de session persistants.
- OpenClaw n’honore ces champs de surcharge que pour les appelants de confiance.
- Pour les exécutions de repli appartenant au Plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non approuvés fonctionnent toujours, mais les requêtes de surcharge sont rejetées au lieu de retomber silencieusement.

Pour la recherche web, les plugins peuvent consommer l’assistant runtime partagé au lieu
d’accéder au câblage de l’outil d’agent :

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Les plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Gardez la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes dans le cœur.
- Utilisez les fournisseurs de recherche web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil d’agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)` : génère une image en utilisant la chaîne de fournisseurs de génération d’image configurée.
- `listProviders(...)` : liste les fournisseurs de génération d’image disponibles et leurs capacités.

## Routes HTTP Gateway

Les plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Champs de route :

- `path` : chemin de route sous le serveur HTTP Gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification Gateway normale, ou `"plugin"` pour l’authentification/la vérification de Webhook gérée par le Plugin.
- `match` : optionnel. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : optionnel. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du Plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de Plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un Plugin ne peut pas remplacer la route d’un autre Plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles sont destinées aux Webhook/vérifications de signature gérés par le Plugin, pas aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées runtime de route Plugin fixées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance avec identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route Plugin avec identité, la portée runtime retombe à `operator.write`
- Règle pratique : ne supposez pas qu’une route de Plugin avec authentification Gateway est une surface d’administration implicite. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification avec identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK Plugin

Utilisez les sous-chemins SDK au lieu de l’import monolithique `openclaw/plugin-sdk` lors
de l’écriture de plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de Plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté Plugin.
- `openclaw/plugin-sdk/config-schema` pour l’export du schéma Zod racine `openclaw.json`
  (`OpenClawSchema`).
- Primitives de canal stables telles que `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de configuration/authentification/réponse/Webhook.
  `channel-inbound` est la maison partagée pour le debounce, la correspondance de mentions,
  les assistants de politique de mention entrante, le formatage d’enveloppe et les assistants de contexte d’enveloppe entrante.
  `channel-setup` est la jonction étroite de configuration d’installation optionnelle.
  `setup-runtime` est la surface de configuration sûre à l’exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l’import.
  `setup-adapter-runtime` est la jonction d’adaptateur de configuration de compte sensible à l’environnement.
  `setup-tools` est la petite jonction d’assistants CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sous-chemins de domaine tels que `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, et
  `openclaw/plugin-sdk/directory-runtime` pour les assistants partagés runtime/configuration.
  `telegram-command-config` est la jonction publique étroite pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram fournie est temporairement indisponible.
  `text-runtime` est la jonction partagée texte/markdown/journalisation, y compris
  la suppression du texte visible par l’assistant, les assistants de rendu/découpage Markdown, les assistants de masquage,
  les assistants de balises de directive et les utilitaires de texte sûr.
- Les jonctions de canal spécifiques aux approbations doivent préférer un seul contrat `approvalCapability`
  sur le Plugin. Le cœur lit alors l’authentification, la livraison, le rendu,
  le routage natif et le comportement du gestionnaire natif paresseux via cette unique capacité
  au lieu de mélanger le comportement d’approbation à des champs de Plugin sans rapport.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et reste seulement comme
  shim de compatibilité pour les anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports du
  shim.
- Les internes des extensions fournies restent privés. Les plugins externes ne doivent utiliser que les sous-chemins `openclaw/plugin-sdk/*`. Le code cœur/test d’OpenClaw peut utiliser les points d’entrée publics du dépôt sous une racine de paquet Plugin comme `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, et des fichiers à portée étroite comme
  `login-qr-api.js`. N’importez jamais `src/*` d’un paquet Plugin depuis le cœur ou depuis
  une autre extension.
- Découpage du point d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel d’assistants/types,
  `<plugin-package-root>/runtime-api.js` est le barrel runtime-only,
  `<plugin-package-root>/index.js` est l’entrée du Plugin fourni,
  et `<plugin-package-root>/setup-entry.js` est l’entrée du Plugin de configuration.
- Exemples actuels de fournisseurs fournis :
  - Anthropic utilise `api.js` / `contract-api.js` pour des assistants de flux Claude tels
    que `wrapAnthropicProviderStream`, les assistants d’en-tête bêta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les assistants de modèle par défaut et
    les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que des assistants
    d’onboarding/configuration, tandis que `register.runtime.js` peut toujours réexporter des assistants génériques
    `plugin-sdk/provider-stream` pour usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané de configuration runtime actif
  lorsqu’il existe, puis retombent sur le fichier de configuration résolu sur disque lorsque
  OpenClaw ne sert pas encore d’instantané runtime.
- Les primitives génériques partagées restent le contrat public SDK préféré. Un petit ensemble réservé
  de jonctions d’assistance marquées au nom de canaux fournis existe encore. Traitez-les comme des jonctions de maintenance/compatibilité des plugins fournis, pas comme de nouvelles cibles d’import tierces ; les nouveaux contrats inter-canaux doivent toujours arriver sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux au Plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables étroites. Les nouveaux sous-chemins setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat visé pour le nouveau
  travail sur les plugins fournis et externes.
  L’analyse/la correspondance des cibles doit aller sur `openclaw/plugin-sdk/channel-targets`.
  Les limitations d’actions de message et les assistants d’ID de message de réaction doivent aller sur
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d’assistance spécifiques aux extensions fournies ne sont pas stables par défaut. Si un
  assistant n’est nécessaire que pour une extension fournie, gardez-le derrière la
  jonction locale `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles jonctions d’assistance partagées doivent être génériques, non marquées au nom d’un canal. L’analyse partagée
  des cibles doit aller sur `openclaw/plugin-sdk/channel-targets` ; les internes spécifiques au canal
  restent derrière la jonction locale `api.js` ou `runtime-api.js` du Plugin propriétaire.
- Les sous-chemins spécifiques à une capacité tels que `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins natifs/fournis les utilisent
  aujourd’hui. Leur présence ne signifie pas, à elle seule, que chaque assistant exporté constitue un
  contrat externe figé à long terme.

## Schémas de l’outil message

Les plugins doivent posséder les contributions de schéma spécifiques au canal de `describeMessageTool(...)`.
Gardez les champs spécifiques au fournisseur dans le Plugin, pas dans le cœur partagé.

Pour les fragments de schéma partagés et portables, réutilisez les assistants génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles de carte structurée

Si une forme de schéma n’a de sens que pour un seul fournisseur, définissez-la dans la propre
source de ce Plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution de cible de canal

Les plugins de canal doivent posséder la sémantique spécifique au canal des cibles. Gardez l’hôte
sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type ID au lieu d’une recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du Plugin lorsque le
  cœur a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après un
  échec de recherche dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  spécifique au fournisseur une fois la cible résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent intervenir avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un ID de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour une
  large recherche de répertoire.
- Gardez les ID natifs fournisseur comme ID de chat, ID de fil, JID, identifiants et ID de salle
  à l’intérieur des valeurs `target` ou de paramètres spécifiques au fournisseur, pas dans des champs SDK génériques.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire depuis la configuration doivent garder cette logique dans le
Plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration comme :

- des pairs DM pilotés par liste d’autorisation
- des cartes canal/groupe configurées
- des replis statiques de répertoire à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application de limite
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ID doivent rester dans
l’implémentation du Plugin.

## Catalogues de fournisseurs

Les plugins de fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le Plugin possède des ID de modèle spécifiques au fournisseur, des valeurs par défaut de base URL
ou des métadonnées de modèle limitées par authentification.

`catalog.order` contrôle quand le catalogue d’un Plugin fusionne par rapport aux fournisseurs
implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs plus tardifs l’emportent en cas de collision de clé, donc les plugins peuvent volontairement
remplacer une entrée de fournisseur intégrée avec le même ID fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre Plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis manquent.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation de configuration
  ne doivent pas avoir besoin de matérialiser les identifiants runtime simplement pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyer uniquement l’état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs source/statut d’identifiant lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler la disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule d’indiquer « configuré mais indisponible dans ce chemin de commande » au lieu de planter ou de signaler à tort le compte comme non configuré.

## Package packs

Un répertoire de Plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un Plugin. Si le pack liste plusieurs extensions, l’ID du Plugin
devient `name/<fileBase>`.

Si votre Plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du Plugin
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du paquet sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances des plugins avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l’exécution). Gardez les arbres de dépendances des plugins en
« pur JS/TS » et évitez les paquets qui nécessitent des builds `postinstall`.

Optionnel : `openclaw.setupEntry` peut pointer vers un module léger uniquement pour la configuration.
Lorsque OpenClaw a besoin des surfaces de configuration pour un Plugin de canal désactivé, ou
lorsqu’un Plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l’entrée complète du Plugin. Cela garde le démarrage et la configuration plus légers
lorsque l’entrée principale du Plugin câble aussi des outils, hooks ou autre code
runtime-only.

Optionnel : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire entrer un Plugin de canal dans le même chemin `setupEntry` durant la phase de
démarrage pré-écoute de la Gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la Gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, par exemple :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la Gateway ne commence à écouter
- toutes méthodes Gateway, outils ou services qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le Plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux fournis peuvent aussi publier des assistants de surface de contrat uniquement pour la configuration que le cœur
peut consulter avant le chargement du runtime complet du canal. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal à compte unique dans
`channels.<id>.accounts.*` sans charger l’entrée complète du Plugin.
Matrix est l’exemple fourni actuel : il déplace uniquement les clés d’authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent la découverte de surface de contrat fournie paresseuse. Le temps d’import reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de réentrer dans le démarrage du canal fourni lors de l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, gardez-les sur un
préfixe spécifique au Plugin. Les espaces de noms admin du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un Plugin demande une portée plus étroite.

Exemple :

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Métadonnées de catalogue de canal

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indices d’installation via `openclaw.install`. Cela permet de garder les données de catalogue du cœur vides.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat auto-hébergé via des bots Webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Champs utiles de `openclaw.channel` au-delà de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : ID de Plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie de surface de sélection
- `markdownCapable` : marque le canal comme compatible markdown pour les décisions de mise en forme sortante
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il est défini à `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il est défini à `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait entrer le canal dans le flux quickstart standard `allowFrom`
- `forceAccountBinding` : exige une liaison explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre MPM
). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre Plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre Plugin doit remplacer ou étendre le pipeline de contexte par défaut plutôt que simplement ajouter une recherche mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un Plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de Plugin avec un accès privé interne. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez du comportement partagé que le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique orientée canal et forme de l’assistant runtime.
2. ajouter des surfaces typées d’enregistrement/runtime de Plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de capacité utile
   et typée.
3. raccorder le cœur + les consommateurs canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   pas en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins de fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites au fil du temps.

C’est ainsi qu’OpenClaw reste structuré sans devenir codé en dur selon la vision du monde d’un
seul fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple complet.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- runner/assistant runtime du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API Plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition runtime du Plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/Plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore complètement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Motif de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins de fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants runtime
- les tests de contrat gardent la propriété explicite
