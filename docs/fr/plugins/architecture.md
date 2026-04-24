---
read_when:
    - Créer ou déboguer des Plugins OpenClaw natifs
    - Comprendre le modèle de capacités des Plugins ou les limites de propriété
    - Travailler sur le pipeline de chargement ou le registre des Plugins
    - Implémenter des hooks d’exécution de fournisseur ou des Plugins de canal
sidebarTitle: Internals
summary: 'Internes des Plugins : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Internes des Plugins
x-i18n:
    generated_at: "2026-04-24T07:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Il s’agit de la **référence d’architecture approfondie** du système de Plugins OpenClaw. Pour
des guides pratiques, commencez par l’une des pages ciblées ci-dessous.

<CardGroup cols={2}>
  <Card title="Installer et utiliser des Plugins" icon="plug" href="/fr/tools/plugin">
    Guide utilisateur final pour ajouter, activer et dépanner des Plugins.
  </Card>
  <Card title="Créer des Plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel premier Plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Créer un Plugin de canal de messagerie.
  </Card>
  <Card title="Plugins de fournisseur" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Créer un Plugin de fournisseur de modèles.
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book" href="/fr/plugins/sdk-overview">
    Carte d’import et référence de l’API d’enregistrement.
  </Card>
</CardGroup>

## Modèle public de capacités

Les capacités sont le modèle public des **Plugins natifs** à l’intérieur d’OpenClaw. Chaque
Plugin natif OpenClaw s’enregistre sur un ou plusieurs types de capacités :

| Capacité              | Méthode d’enregistrement                         | Exemples de Plugins                    |
| --------------------- | ------------------------------------------------ | -------------------------------------- |
| Inférence de texte    | `api.registerProvider(...)`                      | `openai`, `anthropic`                  |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                  |
| Parole                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`              |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voix temps réel       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                               |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                   |
| Génération d’images   | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`   |
| Génération musicale   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                    |
| Génération vidéo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                                 |
| Récupération Web      | `api.registerWebFetchProvider(...)`              | `firecrawl`                            |
| Recherche Web         | `api.registerWebSearchProvider(...)`             | `google`                               |
| Canal / messagerie    | `api.registerChannel(...)`                       | `msteams`, `matrix`                    |
| Découverte Gateway    | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                              |

Un Plugin qui enregistre zéro capacité mais fournit des hooks, des outils, des services de découverte
ou des services d’arrière-plan est un Plugin **hérité hook-only**. Ce modèle
reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les Plugins groupés/natifs,
mais la compatibilité des Plugins externes exige toujours une barre plus stricte que « c’est
exporté, donc figé ».

| Situation du Plugin                              | Recommandation                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plugins externes existants                       | Garder fonctionnelles les intégrations basées sur des hooks ; c’est la base de compatibilité.   |
| Nouveaux Plugins groupés/natifs                  | Préférer un enregistrement explicite de capacité aux intrusions spécifiques à un fournisseur ou aux nouveaux designs hook-only. |
| Plugins externes adoptant l’enregistrement par capacité | Autorisé, mais traiter les surfaces d’assistance spécifiques à une capacité comme évolutives sauf si la documentation les marque comme stables. |

L’enregistrement par capacité est la direction souhaitée. Les hooks hérités restent le
chemin le plus sûr sans rupture pour les Plugins externes pendant la transition. Les sous-chemins d’assistance exportés ne sont pas tous équivalents — préférez des contrats étroits documentés aux exports d’assistance accidentels.

### Formes de Plugin

OpenClaw classe chaque Plugin chargé selon une forme basée sur son comportement réel
d’enregistrement (et pas seulement sur des métadonnées statiques) :

- **plain-capability** : enregistre exactement un type de capacité (par exemple un
  Plugin fournisseur uniquement comme `mistral`).
- **hybrid-capability** : enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la
  génération d’images).
- **hook-only** : enregistre uniquement des hooks (typés ou personnalisés), aucune
  capacité, outil, commande ou service.
- **non-capability** : enregistre des outils, commandes, services ou routes mais aucune
  capacité.

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un Plugin et la répartition
de ses capacités. Voir [Référence CLI](/fr/cli/plugins#inspect) pour les détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les Plugins hook-only. Des Plugins réels hérités en dépendent encore.

Orientation :

- le garder fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimer qu’après diminution de l’usage réel et preuve de sécurité de migration par la couverture de fixtures

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’un de ces libellés :

| Signal                    | Signification                                                  |
| ------------------------- | -------------------------------------------------------------- |
| **config valid**          | La configuration s’analyse correctement et les Plugins se résolvent |
| **compatibility advisory** | Le Plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**        | Le Plugin utilise `before_agent_start`, qui est déprécié       |
| **hard error**            | La configuration est invalide ou le Plugin n’a pas pu se charger |

Ni `hook-only` ni `before_agent_start` ne casseront votre Plugin aujourd’hui :
`hook-only` est indicatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de Plugins OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les Plugins candidats à partir des chemins configurés, des racines
   d’espace de travail, des racines globales de Plugins et des Plugins groupés. La découverte lit d’abord les manifestes natifs
   `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le cœur décide si un Plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un slot exclusif tel que la mémoire.
3. **Chargement d’exécution**
   Les Plugins natifs OpenClaw sont chargés en processus via jiti et enregistrent
   leurs capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d’exécution.
4. **Consommation de surface**
   Le reste d’OpenClaw lit le registre pour exposer les outils, les canaux, la configuration des fournisseurs,
   les hooks, les routes HTTP, les commandes CLI et les services.

Pour la CLI Plugin en particulier, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du Plugin peut rester paresseux et s’enregistrer à la première invocation

Cela garde le code CLI possédé par le Plugin à l’intérieur du Plugin tout en permettant à OpenClaw
de réserver les noms de commande racine avant l’analyse.

La limite de conception importante :

- la découverte + la validation de configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du Plugin
- le comportement d’exécution natif provient du chemin `register(api)` du module Plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les Plugins
manquants/désactivés et de construire des indices d’interface/schéma avant que l’exécution complète ne soit active.

### Planification d’activation

La planification d’activation fait partie du plan de contrôle. Les appelants peuvent demander quels Plugins
sont pertinents pour une commande, un fournisseur, un canal, une route, un harnais d’agent ou
une capacité concrets avant de charger des registres d’exécution plus larges.

Le planificateur garde le comportement actuel du manifeste compatible :

- les champs `activation.*` sont des indices explicites pour le planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` et les hooks restent la solution de secours de propriété du manifeste
- l’API du planificateur basée uniquement sur les identifiants reste disponible pour les appelants existants
- l’API du plan signale des étiquettes de raison afin que les diagnostics puissent distinguer les indices explicites du repli de propriété

Ne traitez pas `activation` comme un hook de cycle de vie ou un remplacement de
`register(...)`. Il s’agit de métadonnées utilisées pour restreindre le chargement. Préférez les champs de propriété
lorsqu’ils décrivent déjà la relation ; utilisez `activation` uniquement pour des indices
supplémentaires du planificateur.

### Plugins de canal et outil de message partagé

Les Plugins de canal n’ont pas besoin d’enregistrer un outil séparé envoyer/éditer/réagir pour
les actions de chat normales. OpenClaw conserve un seul outil `message` partagé dans le cœur, et
les Plugins de canal possèdent la découverte et l’exécution spécifiques au canal qui se trouvent derrière.

La limite actuelle est la suivante :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage du prompt, la gestion
  des sessions/fils et le dispatch d’exécution
- les Plugins de canal possèdent la découverte d’actions ciblées, la découverte de capacités et tous les fragments de schéma spécifiques au canal
- les Plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, notamment
  la façon dont les identifiants de conversation encodent les identifiants de fil ou héritent de conversations parentes
- les Plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les Plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel unifié de découverte
permet à un Plugin de renvoyer ses actions visibles, capacités et contributions de schéma
ensemble afin que ces éléments ne divergent pas.

Lorsqu’un paramètre d’outil de message spécifique à un canal transporte une source média telle qu’un
chemin local ou une URL média distante, le Plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite pour appliquer la normalisation des chemins du sandbox et les indices d’accès média sortant sans coder en dur les noms de paramètres possédés par le Plugin.
Préférez ici des maps ciblées par action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé au profil ne soit pas normalisé pour des actions non liées comme
`send`.

Le cœur transmet la portée d’exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

Cela est important pour les Plugins sensibles au contexte. Un canal peut masquer ou exposer des
actions de message en fonction du compte actif, de la salle/du fil/du message courant, ou de
l’identité de requérant approuvée, sans coder en dur des branches spécifiques à un canal dans l’outil
`message` du cœur.

C’est pourquoi les changements de routage de l’exécuteur embarqué restent du travail de Plugin : l’exécuteur est
responsable de transmettre l’identité actuelle de chat/session à la frontière de découverte du Plugin afin que l’outil `message` partagé expose la bonne surface possédée par le canal pour le tour courant.

Pour les assistants d’exécution appartenant au canal, les Plugins groupés doivent conserver l’exécution
à l’intérieur de leurs propres modules d’extension. Le cœur ne possède plus les exécutions
d’action de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les Plugins groupés
doivent importer leur propre code d’exécution local directement depuis leurs modules possédés par l’extension.

La même limite s’applique plus généralement aux points d’extension SDK nommés par fournisseur : le cœur ne doit
pas importer des barrels utilitaires spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp, ou extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer
le propre barrel `api.ts` / `runtime-api.ts` du Plugin groupé, soit promouvoir le besoin en une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au
  modèle commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal ou des paramètres de sondage supplémentaires

Le cœur diffère désormais l’analyse partagée des sondages jusqu’à ce que l’envoi des sondages du Plugin décline
l’action, afin que les gestionnaires de sondage appartenant au Plugin puissent accepter des champs
de sondage spécifiques au canal sans être bloqués d’abord par l’analyseur générique de sondage.

Voir [Internes de l’architecture Plugin](/fr/plugins/architecture-internals) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un Plugin natif comme la frontière de propriété d’une **entreprise** ou d’une
**fonctionnalité**, pas comme un sac d’intégrations sans lien.

Cela signifie :

- un Plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw
  de cette entreprise
- un Plugin de fonctionnalité doit généralement posséder toute la surface de fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter
  de façon ad hoc le comportement du fournisseur

<Accordion title="Exemples de modèles de propriété dans les Plugins groupés">
  - **Fournisseur multi-capacités** : `openai` possède l’inférence de texte, la parole, la
    voix temps réel, la compréhension des médias et la génération d’images. `google` possède
    l’inférence de texte ainsi que la compréhension des médias, la génération d’images et la recherche Web.
    `qwen` possède l’inférence de texte ainsi que la compréhension des médias et la génération vidéo.
  - **Fournisseur mono-capacité** : `elevenlabs` et `microsoft` possèdent la parole ;
    `firecrawl` possède la récupération Web ; `minimax` / `mistral` / `moonshot` / `zai` possèdent
    les backends de compréhension des médias.
  - **Plugin de fonctionnalité** : `voice-call` possède le transport d’appel, les outils, la CLI, les routes,
    et le pont de flux média Twilio, mais consomme les capacités partagées de parole, de transcription temps réel et de voix temps réel au lieu d’importer directement des Plugins de fournisseur.
</Accordion>

L’état final visé est :

- OpenAI vit dans un seul Plugin même s’il couvre les modèles texte, la parole, les images et
  la future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du Plugin fournisseur propriétaire ; ils consomment le contrat de capacité partagé exposé par le cœur

C’est la distinction clé :

- **plugin** = frontière de propriété
- **capability** = contrat du cœur que plusieurs Plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion vidéo ? ». La première question est « quel est
le contrat de capacité vidéo du cœur ? ». Une fois ce contrat en place, les Plugins fournisseurs
peuvent s’y enregistrer et les Plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne approche est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer via l’API/l’exécution Plugin de manière typée
3. brancher les canaux/fonctionnalités sur cette capacité
4. laisser les Plugins fournisseurs enregistrer des implémentations

Cela garde une propriété explicite tout en évitant un comportement du cœur dépendant d’un
seul fournisseur ou d’un chemin de code ponctuel spécifique à un Plugin.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit aller :

- **couche de capacité du cœur** : orchestration partagée, politique, repli, règles de fusion de configuration, sémantique de livraison et contrats typés
- **couche de Plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale, génération d’images, futurs backends vidéo, endpoints d’usage
- **couche de Plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, le TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant d’exécution TTS de téléphonie

Le même modèle doit être privilégié pour les capacités futures.

### Exemple de Plugin d’entreprise multi-capacités

Un Plugin d’entreprise doit paraître cohérent de l’extérieur. Si OpenClaw possède des
contrats partagés pour les modèles, la parole, la transcription temps réel, la voix temps réel, la compréhension des médias, la génération d’images, la génération vidéo, la récupération Web et la recherche Web,
un fournisseur peut posséder toutes ses surfaces en un seul endroit :

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

Ce qui compte n’est pas le nom exact des assistants. C’est la forme qui compte :

- un seul Plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et Plugins de fonctionnalité consomment des assistants `api.runtime.*`, pas du code fournisseur
- les tests de contrat peuvent vérifier que le Plugin a enregistré les capacités qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une seule capacité partagée. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les Plugins fournisseurs enregistrent `describeImage`, `transcribeAudio`, et
   `describeVideo` selon le cas
3. les Plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu
   de se brancher directement sur le code fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un fournisseur. Le Plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération vidéo suit déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant d’exécution, et les Plugins fournisseurs enregistrent des implémentations
`api.registerVideoGenerationProvider(...)` par-dessus.

Besoin d’une checklist de déploiement concrète ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface de l’API Plugin est intentionnellement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants d’exécution sur lesquels un Plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de Plugins obtiennent une norme interne stable
- le cœur peut rejeter des propriétés dupliquées comme deux Plugins enregistrant le même
  identifiant de fournisseur
- le démarrage peut remonter des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des Plugins groupés et empêcher une dérive silencieuse

Il existe deux couches d’application :

1. **application au moment de l’enregistrement d’exécution**
   Le registre de Plugins valide les enregistrements au chargement des Plugins. Exemples :
   les identifiants de fournisseur dupliqués, les identifiants de fournisseur de parole dupliqués et les
   enregistrements mal formés produisent des diagnostics de Plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les Plugins groupés sont capturés dans des registres de contrat pendant les exécutions de test afin que
   OpenClaw puisse vérifier explicitement la propriété. Aujourd’hui cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs de parole, les fournisseurs de recherche Web et la propriété des enregistrements groupés.

L’effet pratique est qu’OpenClaw sait, en amont, quel Plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer de manière transparente, car la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui appartient à un contrat

Les bons contrats de Plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs Plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de Plugin sont :

- une politique spécifique au fournisseur cachée dans le cœur
- des échappatoires ponctuelles de Plugin qui contournent le registre
- du code de canal qui atteint directement une implémentation de fournisseur
- des objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les Plugins s’y brancher.

## Modèle d’exécution

Les Plugins natifs OpenClaw s’exécutent **en processus** avec le Gateway. Ils ne sont
pas sandboxés. Un Plugin natif chargé a la même frontière de confiance au niveau processus que le code du cœur.

Implications :

- un Plugin natif peut enregistrer des outils, gestionnaires réseau, hooks et services
- un bug de Plugin natif peut faire planter ou déstabiliser le gateway
- un Plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut, car OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills groupées.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les Plugins non groupés. Traitez
les Plugins d’espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de package d’espace de travail groupé, gardez l’identifiant du Plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox`, ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de Plugin plus étroit.

Remarque importante sur la confiance :

- `plugins.allow` fait confiance aux **identifiants de Plugin**, pas à la provenance de la source.
- Un Plugin d’espace de travail avec le même identifiant qu’un Plugin groupé masque intentionnellement
  la copie groupée lorsque ce Plugin d’espace de travail est activé/en liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctif et les correctifs rapides.
- La confiance dans les Plugins groupés est résolue à partir de l’instantané de source — le manifeste et
  le code sur disque au moment du chargement — et non à partir des métadonnées d’installation. Un enregistrement d’installation corrompu
  ou substitué ne peut pas élargir silencieusement la surface de confiance d’un Plugin groupé
  au-delà de ce que la source réelle revendique.

## Frontière d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez l’enregistrement des capacités public. Supprimez les exports d’assistants hors contrat :

- sous-chemins d’assistants spécifiques à un Plugin groupé
- sous-chemins de plomberie d’exécution non destinés à être une API publique
- assistants de commodité spécifiques à un fournisseur
- assistants de configuration/d’onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistants de Plugins groupés restent encore dans la carte d’export SDK générée pour la compatibilité et la maintenance des Plugins groupés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, ainsi que plusieurs points d’extension `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour
les nouveaux Plugins tiers.

## Internes et référence

Pour le pipeline de chargement, le modèle de registre, les hooks d’exécution de fournisseur, les routes HTTP Gateway,
les schémas de l’outil de message, la résolution des cibles de canal, les catalogues de fournisseurs,
les Plugins de moteur de contexte et le guide d’ajout d’une nouvelle capacité, voir
[Internes de l’architecture Plugin](/fr/plugins/architecture-internals).

## Voir aussi

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Manifeste Plugin](/fr/plugins/manifest)
