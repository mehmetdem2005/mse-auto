// Contenu en français — mêmes principes que content.en.mjs : décrire CE qu'il fait, pas COMMENT ;
// seulement "vérifie des sources web publiques à intervalles réguliers" — pas de mécanique interne ni
// de stratégie sur le site. Uniquement des scénarios réellement atteignables (rien derrière une
// connexion/un mot de passe/un captcha). Exemples universels, adaptés à l'Europe (EUR). Réponse
// d'abord, questions en H2, pages courtes.

// Global-first (ADR-096) : EN est la langue racine (/) — le site ne paraît pas "propre à un pays" ;
// FR vit sous /fr en équivalent complet. La version juridiquement contraignante est le texte anglais.
export const fr = {
  lang: "fr",
  prefix: "/fr",
  useCaseBase: "/fr/cas-d-usage",
  langName: "Français",
  otherLangLabel: "English",

  nav: {
    how: "Comment ça marche",
    useCases: "Cas d'usage",
    compare: "Comparer",
    faq: "FAQ",
    about: "À propos",
    openApp: "Ouvrir l'application",
    menuLabel: "Afficher le menu",
    skip: "Aller au contenu",
  },
  footer: {
    tagline:
      "Whenly suit pour vous l'évolution qui vous intéresse et vous prévient au moment où elle se produit.",
    useCases: "Cas d'usage",
    product: "Produit",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    contact: "Contact",
    forAi: "Pour les assistants IA : llms.txt",
    langSwitch: "Langue",
    updated: "Contenu mis à jour",
  },
  home: {
    metaTitle: "Whenly — Préviens-moi quand ça arrive : surveillance et alertes",
    metaDescription:
      'Dites "préviens-moi quand ça arrive" : Whenly vérifie des sources web publiques à intervalles réguliers et vous alerte dès que ça apparaît. Gratuit pour démarrer.',
    heroOverline: "Application de surveillance et d'alertes",
    heroTitle: "Préviens-moi <em>quand.</em>",
    heroSub:
      "Arrêtez de rafraîchir la page. Dites à Whenly le moment que vous attendez — la baisse de prix, le réassort, l'annonce immobilière, la publication — en une phrase simple. Il vérifie des sources web publiques à intervalles réguliers et fait sonner votre téléphone dès que ce moment arrive.",
    heroCta: "Commencer à surveiller gratuitement",
    heroCtaNote: "Sans carte bancaire · Fonctionne sur le web et le téléphone",
    heroSecondary: "Comment ça marche ?",
    trust: [
      "Web + Android",
      "11 langues d'interface",
      "Forfait gratuit — sans carte",
      "Web public uniquement",
    ],
    phone: {
      watcherLabel: "SURVEILLE",
      watcherText:
        "Préviens-moi quand le produit que je veux est de nouveau disponible sous 500 € dans une boutique officielle",
      watcherMeta: "Vérifie à intervalles réguliers",
      notifTitle: "Whenly · maintenant",
      notifText: "De nouveau en stock : le produit est de nouveau en vente sous votre prix cible.",
      notifMeta: "Notification envoyée",
    },
    howHeading: "Comment fonctionne Whenly ?",
    how: [
      {
        icon: "messageSquare",
        t: "Décrivez ce qu'il faut surveiller",
        d: 'Écrivez une phrase simple comme "préviens-moi quand un deux-pièces sous 1 500 € est mis en ligne ici". Pas de formulaires, pas de syntaxe de règles à apprendre.',
      },
      {
        icon: "refresh",
        t: "Whenly monte la garde",
        d: "Il vérifie pour vous des sources web publiques — sites, actualités, annonces — à intervalles réguliers.",
      },
      {
        icon: "bellRing",
        t: "Soyez prévenu",
        d: "Quand ce que vous attendez apparaît, vous recevez une notification ; pour les sujets critiques, le mode alarme fait sonner votre téléphone.",
      },
    ],
    featuresHeading: "Ce que vous obtenez",
    features: [
      {
        icon: "zap",
        t: "Une phrase suffit à tout configurer",
        d: 'Des règles composées directement à partir de mots simples — "en stock ET sous 500 €". Aucun moteur de règles à apprendre, aucun filtre à construire.',
      },
      {
        icon: "languages",
        t: "Fonctionne dans votre langue",
        d: "Onze langues d'interface. Décrivez la surveillance comme vous la diriez à voix haute.",
      },
      {
        icon: "bellRing",
        t: "Le mode alarme pour les sujets critiques",
        d: "Certains moments ne peuvent pas attendre dans un tiroir silencieux : avec Pro, l'alerte fait vraiment sonner votre téléphone.",
      },
      {
        icon: "clock",
        t: "Heures calmes, selon vos règles",
        d: "Les alertes nocturnes patientent jusqu'au matin — vous gardez la couverture sans sacrifier votre sommeil.",
      },
      {
        icon: "smartphone",
        t: "Sur le web et le téléphone",
        d: "Démarrez dans n'importe quel navigateur en une minute ; il existe aussi une application Android. Les alertes arrivent sur votre téléphone.",
      },
      {
        icon: "shieldCheck",
        t: "Confidentiel par défaut",
        d: "Pas de publicité, pas de revente de vos données. Exportez tout ou supprimez tout définitivement, à tout moment.",
      },
    ],
    pricingHeading: "Une tarification simple",
    pricing: {
      freeName: "Gratuit",
      freeBullets: [
        "3 surveillances actives",
        "Vérifications régulières",
        "Notifications + heures calmes",
        "Web et Android",
      ],
      freeCta: "Démarrer gratuitement",
      proName: "Pro",
      proBadge: "Le plus populaire",
      proBullets: [
        "100 surveillances actives",
        "Vérifications plus fréquentes",
        "Mode alarme — votre téléphone sonne",
        "Personnalisation + options supplémentaires",
      ],
      proCta: "Passer à Pro dans l'application",
      note: "Le forfait gratuit n'a aucune limite de durée et ne demande aucune carte. Passez à Pro dans l'application ; annulez à tout moment.",
    },
    useCasesHeading: "Ce pour quoi les gens l'utilisent",
    useCasesSub:
      "Neuf usages concrets que Whenly assure sur le web public — chacun un moment que les gens manquaient autrefois.",
    useCasesAll: "Voir tous les cas d'usage",
    faqHeading: "Questions fréquentes",
    faq: [
      {
        q: "Qu'est-ce que Whenly ?",
        a: 'Whenly est une application qui suit pour vous une évolution que vous décrivez en langage simple (par exemple, "préviens-moi quand ce produit est de nouveau en stock"). Il vérifie des sources web publiques à intervalles réguliers et envoie une notification ou une alarme quand ce que vous attendez apparaît.',
      },
      {
        q: "Whenly est-il gratuit ?",
        a: "Oui — le forfait gratuit inclut 3 surveillances actives, sans limite de durée et sans carte requise. Pro ajoute davantage de surveillances, des vérifications plus fréquentes et le mode alarme.",
      },
      {
        q: "Quelles sources peut-il surveiller ?",
        a: "Des sources web publiquement accessibles : sites, pages d'actualités et d'annonces, listes d'offres. Il n'accède pas aux portails derrière une connexion, aux comptes personnels ni aux pages derrière un captcha (vérification anti-robot) — nous énonçons cette limite explicitement.",
      },
      {
        q: "À quelle vitesse me prévient-il ?",
        a: "Whenly vérifie les sources à intervalles réguliers et détecte une évolution lors de la première vérification après sa publication. Nous ne promettons pas d'alertes à la seconde — les sources peuvent publier en retard. Considérez une notification comme un signal pour vérifier par vous-même.",
      },
      {
        q: "Mes données sont-elles en sécurité ?",
        a: "Nous ne vendons pas vos données et ne les utilisons pas pour la publicité. Vous pouvez télécharger toutes vos données dans un format lisible par machine ou les supprimer définitivement avec votre compte. Les détails figurent dans la Politique de confidentialité.",
      },
      {
        q: "Fonctionne-t-il sur le téléphone ou le web ?",
        a: "Les deux. L'application web fonctionne dans n'importe quel navigateur ; il existe aussi une application Android. Les alertes arrivent sur votre téléphone, et Pro ajoute le mode alarme pour les surveillances critiques.",
      },
      {
        q: "Existe-t-il une application qui me prévient simplement quand quelque chose se passe en ligne ?",
        a: "C'est tout le rôle de Whenly. Vous écrivez l'événement en une phrase — \"préviens-moi quand X arrive\" — et Whenly vérifie des sources web publiques à intervalles réguliers, puis envoie une notification push ou déclenche une alarme quand cela se produit.",
      },
      {
        q: "Whenly est-il une application d'IA qui surveille le web pour moi ?",
        a: "Oui. Whenly utilise l'IA pour transformer votre phrase en langage simple en une intention de surveillance et pour juger si ce qu'il trouve correspond vraiment à l'événement que vous avez décrit. Il lit uniquement des pages publiques — il ne se connecte jamais à des comptes — et le moment des vérifications est au mieux possible, pas instantané.",
      },
    ],
    ctaHeading: "Lâchez le bouton actualiser",
    ctaText:
      "Écrivez une phrase et confiez-lui la surveillance. La prochaine fois que ça arrive, vous le savez en premier.",
  },
  useCasesIndex: {
    slug: "use-cases",
    metaTitle: "Cas d'usage de Whenly — que pouvez-vous surveiller ?",
    metaDescription:
      "Des prix et réassorts aux annonces, appels d'offres et réglementations : les scénarios de surveillance que Whenly peut suivre sur le web ouvert.",
    h1: "Que pouvez-vous surveiller ?",
    intro:
      "Whenly est basé sur des sujets : vous n'avez pas besoin de connaître l'URL d'une page — vous décrivez ce que vous attendez. Tout ce qui suit peut être suivi sur des sources web publiquement accessibles.",
  },
  useCases: [
    {
      key: "price-drop",
      slug: "alertes-baisse-de-prix",
      icon: "trendingDown",
      name: "Alertes de baisse de prix",
      metaTitle: "Alertes de baisse de prix (produits, vols, crypto) — Whenly",
      metaDescription:
        "Soyez alerté quand un prix franchit votre seuil : produits e-commerce, vols, hôtels, crypto et devises. Whenly comprend les règles de seuil en langage simple.",
      h1: "Soyez alerté quand le prix franchit votre seuil",
      answer:
        "Whenly suit le prix public d'un produit, d'un vol ou d'un actif par rapport au seuil que vous fixez ; quand il le franchit, vous recevez une notification. Une phrase suffit à le configurer — \"préviens-moi quand ça passe sous 400 €\" — et les baisses comme les hausses peuvent être surveillées.",
      context: [
        "Sans alerte, attraper les remises et bonnes affaires impose de vérifier à la main ; les bonnes offres se ferment en quelques heures.",
        "Les prix des vols et des hôtels changent souvent ; surveiller à la main un prix proche du seuil prend du temps.",
        'En crypto et sur les devises, "le temps que je le remarque, c\'était déjà passé" est courant — une alerte de seuil fait cette surveillance pour vous.',
      ],
      examples: [
        "Préviens-moi quand cet aspirateur passe sous 400 € chez n'importe quel grand distributeur.",
        "Alerte-moi quand un vol Paris–Bangkok passe sous 250 €.",
        "Notifie-moi quand le Bitcoin dépasse 150 000 €.",
      ],
      faq: [
        {
          q: "Quels prix peut-il surveiller ?",
          a: "Tout ce qui a un prix public : produits e-commerce, vols et hôtels, taux des cryptos et des devises. Vous énoncez la règle de seuil en langage simple.",
        },
        {
          q: "Vérifie-t-il en permanence ?",
          a: "Il vérifie à intervalles réguliers. Pour les prix volatils, proches du seuil, des vérifications plus fréquentes sont une raison typique d'opter pour Pro.",
        },
      ],
      related: ["alertes-de-reassort", "alertes-annonces-immobilieres", "alertes-billets"],
    },
    {
      key: "restock",
      slug: "alertes-de-reassort",
      icon: "pkg",
      name: "Alertes de réassort",
      metaTitle: "Application d'alertes de réassort (PS5, GPU, sneakers) — Whenly",
      metaDescription:
        'Soyez alerté quand la PS5, un GPU ou des sneakers reviennent en stock. Whenly suit les pages de vente publiques et lit des règles comme "en stock ET sous 500 €".',
      h1: "Soyez alerté quand un produit est réapprovisionné",
      answer:
        'Whenly suit pour vous les pages de vente et d\'annonce des produits ; quand le produit est de nouveau en vente chez un distributeur officiel, vous recevez une notification. La différence, ce sont les conditions composées : il comprend des règles comme "de nouveau en stock ET sous 500 €" à partir du langage simple.',
      context: [
        "Les réassorts de produits populaires partent vite ; rafraîchir la page à la main signifie en général les manquer.",
        "Surveiller plusieurs distributeurs en même temps prend du temps ; Whenly le fait pour vous.",
        "Surveiller le stock et une condition de prix ensemble est quelque chose que les simples alertes de stock ne savent pas faire.",
      ],
      examples: [
        "Préviens-moi quand la PS5 est de nouveau en stock chez un distributeur officiel.",
        "Alerte-moi quand la RTX 5090 est en stock sous 2 000 €.",
        "Notifie-moi quand ces sneakers sont de nouveau en vente au prix de détail.",
      ],
      faq: [
        {
          q: "Quelles boutiques peut-il surveiller ?",
          a: "Tout distributeur ayant des pages de produit ou d'annonce publiques. Whenly est basé sur des sujets, vous n'êtes donc pas lié à une seule URL : dites \"chez un distributeur officiel\" et il pondère ensemble les signaux de vente du web ouvert.",
        },
        {
          q: "Peut-il vérifier une condition de prix en même temps ?",
          a: 'Oui — les conditions composées sont une fonctionnalité clé : "en stock ET sous 500 €" se définit dans une seule surveillance.',
        },
      ],
      related: ["alertes-baisse-de-prix", "alertes-billets", "alertes-publications"],
    },
    {
      key: "rental-listing",
      slug: "alertes-annonces-immobilieres",
      icon: "home",
      name: "Alertes d'annonces immobilières",
      metaTitle: "Alertes sur les nouvelles annonces immobilières — Whenly",
      metaDescription:
        "Whenly suit les nouvelles annonces immobilières selon vos critères de zone, de prix et de taille, et vous alerte dès qu'une correspondance est publiée.",
      h1: "Soyez alerté quand une annonce correspond à vos critères",
      answer:
        'Whenly suit des sources d\'annonces immobilières publiques selon vos critères de zone, de prix et de taille ; quand une nouvelle annonce correspondante est publiée, vous recevez une notification. "Préviens-moi quand un deux-pièces sous 1 500 € est mis en ligne ici" — voilà toute la configuration.',
      context: [
        "Les annonces au prix juste se ferment souvent le jour même ; celui qui les voit en premier a l'avantage.",
        "Les alertes propres aux sites d'annonces peuvent être en retard, et leurs filtres sont souvent trop rigides.",
        "Balayer à la main plusieurs zones et conditions coûte des heures chaque jour.",
      ],
      examples: [
        "Préviens-moi quand un deux-pièces sous 1 500 € est mis en ligne dans ce quartier.",
        "Alerte-moi quand un studio meublé apparaît dans ces deux arrondissements.",
        "Notifie-moi quand un quatre-pièces sous 400 k€ est mis en vente dans ce secteur.",
      ],
      faq: [
        {
          q: "Quels sites d'annonces sont surveillés ?",
          a: "Des sources publiques qui publient des annonces. Whenly est basé sur des sujets : plutôt que de se verrouiller sur un seul site, il pondère ensemble les signaux d'annonces ouvertes correspondants.",
        },
        {
          q: "Peut-il filtrer la zone et le prix à la fois ?",
          a: "Oui — quartier, plafond de prix et nombre de pièces tiennent dans une seule phrase.",
        },
      ],
      related: ["alertes-baisse-de-prix", "alertes-appels-d-offres", "alertes-publications"],
    },
    {
      key: "ticket",
      slug: "alertes-billets",
      icon: "ticket",
      name: "Alertes de billets d'événements",
      metaTitle: "Alerte à la mise en vente des billets — Whenly",
      metaDescription:
        "Whenly suit les annonces publiques de mise en vente pour les concerts, matchs et événements, et vous alerte à l'ouverture des ventes.",
      h1: "Soyez alerté quand les billets sont mis en vente",
      answer:
        "Whenly suit pour vous les annonces publiques de mise en vente et les avis de nouvelles dates pour les concerts et événements ; quand les ventes sont annoncées comme ouvertes, vous recevez une notification — une alarme avec Pro. Si la date n'est pas fixée, dites \"préviens-moi quand c'est mis en vente\".",
      context: [
        "Pour les événements populaires, manquer le moment de la mise en vente signifie pas de billets.",
        "La date de mise en vente n'est souvent pas claire à l'avance ; guetter l'annonce à la main est difficile.",
        "Les nouvelles dates et les séances supplémentaires sont annoncées à des moments imprévisibles.",
      ],
      examples: [
        "Préviens-moi quand cette tournée est annoncée comme mise en vente.",
        "Alerte-moi quand une date ou une séance supplémentaire est annoncée pour cet événement.",
        "Notifie-moi quand la vente générale est annoncée pour ce match.",
      ],
      faq: [
        {
          q: "Achète-t-il le billet à ma place ?",
          a: "Non — Whenly vous alerte ; c'est vous qui achetez. Il n'accède jamais à votre compte et ne fait jamais la file à votre place.",
        },
        {
          q: "Est-ce utile si la date de mise en vente n'est pas fixée ?",
          a: "Oui — dites \"préviens-moi quand c'est mis en vente\" et il suit les signaux publics d'annonce et de page de vente.",
        },
      ],
      related: ["alertes-de-reassort", "alertes-baisse-de-prix", "alertes-publications"],
    },
    {
      key: "tender",
      slug: "alertes-appels-d-offres",
      icon: "gavel",
      name: "Alertes d'appels d'offres",
      metaTitle: "Alerte à la publication d'appels d'offres et RFP — Whenly",
      metaDescription:
        "Marchés publics, rectificatifs, appels d'offres privés : Whenly vous alerte quand un avis correspondant à votre secteur paraît, et suit les changements de date.",
      h1: "Soyez alerté quand un appel d'offres correspond à votre activité",
      answer:
        "Whenly suit pour vous les avis de marchés publics, les avis de rectificatif/modification et les annonces d'appels d'offres du secteur privé ; quand un nouvel avis ou un changement correspondant à vos critères est publié, vous recevez une notification.",
      context: [
        "Trouver l'avis est facile ; ne pas manquer le changement ultérieur (modification, date) est le plus dur.",
        "Sur les plateformes consultées passivement, les nouveaux avis sont repérés avec des jours de retard ; celui qui regarde tôt gagne.",
        "Manquer la date limite de remise signifie une disqualification directe.",
      ],
      examples: [
        "Préviens-moi quand un appel d'offres de matériaux de construction est publié dans ma région.",
        "Alerte-moi si la date limite ou une modification change sur un appel d'offres que je suis.",
        "Rappelle-moi 48 heures avant la date limite de remise de cet appel d'offres.",
      ],
      faq: [
        {
          q: "Se connecte-t-il à mon compte ?",
          a: "Non — il surveille des pages d'avis et d'annonce publiques ; il n'accède jamais aux écrans derrière une connexion. Vous lisez le texte officiel à la source.",
        },
        {
          q: "Me rappelle-t-il les dates limites ?",
          a: 'Oui — des règles temporelles comme "rappelle-moi 2 jours avant la date limite" peuvent être définies.',
        },
      ],
      related: ["alertes-subventions", "alertes-reglementation", "alertes-concurrents"],
    },
    {
      key: "grant",
      slug: "alertes-subventions",
      icon: "coins",
      name: "Alertes de subventions et de financements",
      metaTitle: "Alertes d'appels à subventions (Horizon Europe) — Whenly",
      metaDescription:
        "Whenly suit les annonces publiques de subventions et de financements et vous alerte à l'ouverture d'un appel et à l'approche des dates limites de candidature.",
      h1: "Soyez alerté quand un appel à subventions s'ouvre",
      answer:
        "Whenly suit pour vous les annonces publiques de subventions et de financements ; quand une fenêtre de candidature s'ouvre — puis à nouveau à l'approche de la date limite — vous recevez une notification. Décrivez en une phrase la source qui vous convient.",
      context: [
        "Certains appels se ferment tôt lorsque les budgets sont épuisés ; candidater dès l'ouverture est le plus sûr.",
        "Beaucoup de programmes ne lancent qu'un appel par an ; le manquer, c'est attendre longtemps.",
        "Manquer la date limite signifie un rejet direct dans la plupart des programmes.",
      ],
      examples: [
        "Préviens-moi quand un appel à soutien R&D s'ouvre.",
        "Alerte-moi quand un nouveau programme de financement est annoncé.",
        "Notifie-moi quand cet appel s'ouvre, et rappelle-moi une semaine avant la date limite.",
      ],
      faq: [
        {
          q: "Me rappelle-t-il les dates limites ?",
          a: 'Oui — surveillez l\'ouverture et la date limite avec une seule surveillance : "préviens-moi quand l\'appel s\'ouvre" plus "rappelle-moi une semaine avant la date limite".',
        },
        {
          q: "Quelles sources de financement peut-il surveiller ?",
          a: "Tout programme avec des annonces publiques : agences nationales, soutiens ministériels, programmes de l'UE, subventions de fondations. Ajoutez votre secteur et votre éligibilité à la phrase.",
        },
      ],
      related: ["alertes-appels-d-offres", "alertes-reglementation", "alertes-publications"],
    },
    {
      key: "regulation",
      slug: "alertes-reglementation",
      icon: "scale",
      name: "Alertes de réglementation",
      metaTitle: "Alerte aux changements de réglementation (RGPD, NIS2) — Whenly",
      metaDescription:
        "Soyez alerté quand une réglementation, une directive ou une décision qui vous concerne paraît. Whenly suit les journaux officiels et les annonces des régulateurs.",
      h1: "Soyez alerté quand une réglementation qui vous concerne change",
      answer:
        "Whenly suit les journaux officiels et les annonces des régulateurs dans le sujet que vous définissez ; quand une réglementation, un avis ou une décision qui vous concerne est publié, vous recevez une notification.",
      context: [
        "Les journaux officiels publient chaque jour ; trier à la main pour trouver l'unique élément pertinent ne passe pas à l'échelle.",
        "Remarquer un changement en retard expose à des pénalités de conformité ou à un coût imprévu.",
        "Surveiller en même temps les annonces de plusieurs régulateurs prend du temps.",
      ],
      examples: [
        "Préviens-moi quand une réglementation concernant mon secteur est publiée au journal officiel.",
        "Alerte-moi quand le régulateur publie un nouvel avis ou une nouvelle décision.",
        "Notifie-moi quand un changement de tarif douanier concerne ma catégorie de produits.",
      ],
      faq: [
        {
          q: "Est-ce un substitut au conseil juridique ?",
          a: "Non — Whenly est la couche d'alerte précoce : il s'assure que vous voyez le changement en premier ; votre conseiller en fait l'interprétation. Vous passez de l'alerte à la source et la lisez vous-même.",
        },
        {
          q: "Uniquement la réglementation d'un seul pays ?",
          a: "Non — tout régulateur avec des annonces publiques peut être surveillé : directives de l'UE, autorités sectorielles, organismes de normalisation. Le pays et le sujet dans votre phrase définissent la surveillance.",
        },
      ],
      related: ["alertes-appels-d-offres", "alertes-concurrents", "alertes-subventions"],
    },
    {
      key: "competitor",
      slug: "alertes-concurrents",
      icon: "eye",
      name: "Alertes concurrents et marque",
      metaTitle: "Surveillance des prix, lancements et marque des concurrents — Whenly",
      metaDescription:
        "Sachez quand un concurrent change ses prix, annonce un produit, ou quand votre marque est évoquée publiquement. Whenly surveille le web ouvert pour vous.",
      h1: "Voyez le mouvement de votre concurrent et le pouls de votre marque",
      answer:
        "Whenly suit les pages de tarifs publiques de vos concurrents, leurs annonces produits et presse, et les conversations publiques au sujet de votre marque ; quand quelque chose de notable est publié, vous recevez une notification.",
      context: [
        "Remarquer en retard un changement de prix d'un concurrent, c'est faire reposer vos devis et prévisions sur des données périmées.",
        "Manquer des annonces produits et presse, c'est apprendre trop tard un mouvement du marché.",
        "Repérer tôt une conversation négative sur votre marque vous donne une chance de réagir avant qu'elle ne s'amplifie.",
      ],
      examples: [
        "Préviens-moi si quelque chose change sur la page de tarifs publique de mon concurrent.",
        "Alerte-moi quand mon concurrent publie un nouveau produit ou un communiqué de presse.",
        "Notifie-moi si ma marque est évoquée de façon négative sur des plateformes publiques.",
      ],
      faq: [
        {
          q: "Est-ce éthique ?",
          a: "Oui — seules des informations publiques sont surveillées : la propre page de tarifs publiée du concurrent, ses communiqués de presse et les conversations ouvertes. Aucune donnée privée, aucun compte fermé, et aucun suivi d'individus — c'est explicitement interdit dans nos conditions.",
        },
        {
          q: "Que couvre la surveillance de marque ?",
          a: "Du contenu public qui mentionne votre marque : actualités, forums, publications publiques.",
        },
      ],
      related: ["alertes-reglementation", "alertes-appels-d-offres", "alertes-baisse-de-prix"],
    },
    {
      key: "announcement",
      slug: "alertes-publications",
      icon: "megaphone",
      name: "Alertes de publications et de pages",
      metaTitle: "Application qui vous alerte quand une page publie du nouveau — Whenly",
      metaDescription:
        "Soyez alerté quand une page que vous suivez publie une nouvelle annonce, une liste de résultats ou une mise à jour. Whenly suit les pages publiques à votre place.",
      h1: "Soyez alerté quand une page publie quelque chose de nouveau",
      answer:
        "Whenly vérifie pour vous une page ou un sujet public que vous suivez ; quand une nouvelle annonce, une liste de résultats ou une mise à jour notable est publiée, vous recevez une notification. Vous arrêtez de rafraîchir la même page encore et encore.",
      context: [
        "Rafraîchir la même page des dizaines de fois par jour en attendant une annonce est du temps perdu.",
        "Les mises à jour importantes sont souvent publiées discrètement ; elles passent à l'instant où vous regardez ailleurs.",
        "Surveiller plusieurs sources à la fois n'est pas tenable à la main.",
      ],
      examples: [
        "Préviens-moi quand une page que je suis publie une nouvelle annonce.",
        "Alerte-moi quand la liste de résultats que j'attends est publiée publiquement.",
        "Notifie-moi quand ce site met à jour ses prix ou ses conditions.",
      ],
      faq: [
        {
          q: "Surveille-t-il des pages derrière une connexion ?",
          a: "Non — uniquement des pages publiques qui ne requièrent ni connexion, ni mot de passe, ni captcha. Vous vérifiez vous-même un résultat dans votre compte personnel ; Whenly vous fait gagner le bon moment.",
        },
        {
          q: "Surveille-t-il une page précise ?",
          a: "Il peut surveiller à la fois une page précise et un sujet : donnez une URL, ou décrivez simplement ce que vous attendez.",
        },
      ],
      related: ["alertes-reglementation", "alertes-baisse-de-prix", "alertes-de-reassort"],
    },
  ],
  compare: {
    slug: "comparatif",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — comparatif",
    metaDescription:
      "Comparatif des outils de surveillance : où Whenly, Google Alerts, Visualping et Distill brillent chacun — règles en langage naturel, conditions composées et alarmes.",
    h1: "Whenly vs les alternatives",
    answer:
      'Réponse courte : pour surveiller les changements d\'UNE page précise, Visualping et Distill sont des outils matures ; pour un résumé par e-mail des nouveaux contenus, Google Alerts est gratuit. Whenly répond à une autre question : "préviens-moi quand cet ÉVÉNEMENT arrive" — sans URL de page, en langage simple, avec des conditions composées et une alarme qui fait sonner votre téléphone.',
    intro:
      "Nous avons rédigé ceci sans fausser la balance. La force de chaque outil est énoncée clairement ; si vous repérez une erreur, écrivez-nous et nous la corrigerons.",
    tableCaption: "Comparatif des fonctionnalités des outils de surveillance",
    colSelf: "Whenly",
    rows: [
      {
        f: "Approche centrale",
        self: 'Phrase "préviens-moi quand" (basée sur le sujet/l\'événement)',
        ga: "Mot-clé : nouveau contenu",
        vp: "Changements sur une URL précise",
        di: "Changements sur une URL précise",
      },
      {
        f: 'Conditions composées en langage simple ("en stock ET sous 500 €")',
        self: "Oui — fonctionnalité clé",
        ga: "Non",
        vp: "Limité",
        di: "Limité (configuration technique)",
      },
      {
        f: "Faut-il connaître l'URL de la page ?",
        self: "Non — ce sont des sujets qui sont surveillés",
        ga: "Non",
        vp: "Oui",
        di: "Oui",
      },
      {
        f: "Mode alarme qui fait sonner votre téléphone",
        self: "Oui (Pro)",
        ga: "Non (e-mail)",
        vp: "Non",
        di: "Partiel",
      },
      {
        f: "Configuration dans votre propre langue (11)",
        self: "Oui",
        ga: "Partiel",
        vp: "Partiel",
        di: "Partiel",
      },
      {
        f: "Forfait gratuit",
        self: "3 surveillances",
        ga: "Entièrement gratuit",
        vp: "Quota limité",
        di: "Limité",
      },
      {
        f: "Meilleur pour",
        self: "Attendre des événements : prix, réassorts, annonces, appels d'offres, réglementations",
        ga: "Nouveau contenu sur un sujet",
        vp: "Changements visuels sur une seule page",
        di: "Diffs de page pour utilisateurs techniques",
      },
    ],
    afterTable:
      'En résumé : pour "alerte-moi quand cette page change", Visualping/Distill sont le bon choix ; pour "envoie-moi par e-mail les nouveaux contenus", Google Alerts. Si votre besoin est "j\'attends un ÉVÉNEMENT et mon téléphone doit sonner à l\'instant où il se produit", Whenly a été conçu exactement pour cela.',
    toolsHeading: "Face à face, un outil à la fois",
    strengthsHeading: "Les points forts de {name}",
    whenHeading: "Quand Whenly est le meilleur choix",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026) : alertes vs e-mail",
        metaDescription:
          "Google Alerts envoie par e-mail les nouveaux contenus pour un mot-clé ; Whenly guette l'événement que vous décrivez et fait sonner votre téléphone quand il arrive.",
        h1: "Whenly vs Google Alerts",
        answer:
          'Google Alerts est gratuit et vous envoie un e-mail quand un nouveau contenu mentionne un mot-clé. Whenly répond à une autre question : vous décrivez un événement avec des conditions — "préviens-moi quand ça passe sous 400 €" — et il envoie une notification push ou déclenche une alarme quand cet événement arrive. Beaucoup de gens utilisent les deux.',
        strengths: [
          "Entièrement gratuit, sans quotas à surveiller",
          "Adossé à l'index de Google — large couverture des actualités et du web ouvert",
          "Les résumés par e-mail sont faciles à parcourir une fois par jour",
        ],
        whenWhenly: [
          "Vous attendez un ÉVÉNEMENT avec une condition (prix sous X, de nouveau en stock) — pas un flux d'articles",
          "Vous avez besoin d'une notification push ou d'une vraie alarme, pas d'un résumé par e-mail",
          "Vous voulez des règles composées en langage simple, dans 11 langues d'interface",
        ],
        faq: [
          {
            q: "Whenly remplace-t-il Google Alerts ?",
            a: "Ils font des choses différentes. Google Alerts est idéal pour suivre par e-mail la couverture d'un sujet. Whenly est conçu pour attraper un moment précis — il comprend les seuils et fait sonner votre téléphone. Beaucoup de gens gardent les deux.",
          },
          {
            q: "Whenly est-il gratuit comme Google Alerts ?",
            a: "Le forfait gratuit de Whenly inclut 3 surveillances actives, sans limite de durée et sans carte requise. Pro ajoute davantage de surveillances, des vérifications plus fréquentes et le mode alarme.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026) : diffs de page vs événements",
        metaDescription:
          "Visualping détecte les changements visuels sur une page que vous indiquez. Whenly est basé sur des sujets : décrivez l'événement et recevez une alarme dédiée.",
        h1: "Whenly vs Visualping",
        answer:
          "Visualping est un outil mature de détection de changements : donnez-lui une URL et il affiche les diffs visuels de cette page. Whenly part de l'autre bout — vous décrivez l'événement en langage simple, sans URL requise, et il envoie une notification ou déclenche une alarme quand l'événement apparaît sur des sources publiques.",
        strengths: [
          "Moteur de diff visuel de page puissant, avec captures d'écran et mise en évidence des changements",
          "Extension de navigateur et application web soignées et largement utilisées",
          "Un bon choix quand vous savez exactement quelle page surveiller",
        ],
        whenWhenly: [
          "Vous préférez décrire le résultat plutôt que chercher la bonne URL",
          'Vous voulez des conditions composées en langage simple — "en stock ET sous 500 €"',
          "Vous voulez une application pensée pour le mobile avec mode alarme ; à la mi-2026, Visualping ne propose pas d'application Android sur Google Play (dites-le-nous si cela change et nous corrigerons)",
        ],
        faq: [
          {
            q: "Whenly est-il une alternative à Visualping ?",
            a: 'Pour les diffs visuels au niveau de la page, Visualping reste un choix solide. Si votre besoin est "préviens-moi quand cet événement arrive" — avec des conditions, sur votre téléphone, avec une alarme — c\'est exactement ce pour quoi Whenly est conçu.',
          },
          {
            q: "Dois-je donner une URL à Whenly ?",
            a: "Non. Vous pouvez en donner une, mais une simple phrase suffit ; Whenly pondère ensemble les signaux du web public correspondants.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026) : un comparatif honnête",
        metaDescription:
          "Distill offre une surveillance de page fine pour les profils techniques. Whenly échange la configuration de sélecteurs contre le langage simple et le mode alarme.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "Distill est un puissant moniteur de page pour utilisateurs techniques : choisissez des éléments avec des sélecteurs, lancez des vérifications locales ou dans le cloud, réglez tout finement. Whenly prend le chemin inverse — une phrase simple, sans sélecteurs, une détection d'événements sur le web public avec notifications et une vraie alarme sur votre téléphone.",
        strengths: [
          "La sélection au niveau de l'élément donne un contrôle précis sur ce qui compte comme un changement",
          "Les options de surveillance locale séduisent les utilisateurs techniques soucieux de confidentialité",
          "Planification et conditions flexibles pour les utilisateurs avancés",
        ],
        whenWhenly: [
          "Vous ne voulez pas maintenir des sélecteurs qui cassent quand un site change de mise en page",
          "Vous préférez décrire l'événement plutôt que le configurer",
          "Vous voulez le mode alarme et une expérience pensée d'abord pour le téléphone, dans 11 langues",
        ],
        faq: [
          {
            q: "Whenly est-il plus simple à configurer que Distill ?",
            a: "Oui, par conception : la configuration tient en une phrase. La contrepartie est un contrôle moins fin que les outils basés sur des sélecteurs — les utilisateurs avancés peuvent encore préférer Distill pour les diffs d'éléments de page.",
          },
          {
            q: "Whenly peut-il surveiller une page précise comme Distill ?",
            a: "Oui — donnez-lui une URL ou décrivez simplement le sujet. Whenly surveille uniquement des pages publiques, et énonce clairement cette limite.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Whenly remplace-t-il Google Alerts ?",
        a: "Ils font des choses différentes : Google Alerts vous envoie par e-mail les nouveaux contenus. Whenly vous demande de définir l'événement et envoie une notification ou une alarme quand il arrive. Beaucoup de gens utilisent les deux.",
      },
      {
        q: "Pourquoi Whenly plutôt que Visualping ou Distill ?",
        a: "Ces outils sont basés sur la page : vous devez trouver l'URL à surveiller. Whenly est basé sur des sujets : dites \"quand ça arrive\" et il cherche l'évolution là où elle apparaît, avec des conditions composées et une alarme.",
      },
    ],
  },
  about: {
    slug: "a-propos",
    metaTitle: "À propos de Whenly — ce qu'il fait, à qui il s'adresse",
    metaDescription:
      "Whenly est une application indépendante qui suit pour vous l'évolution qui vous intéresse. Nous énonçons clairement ce qu'il fait et ses limites.",
    h1: "À propos de Whenly",
    paras: [
      "Whenly est né d'une idée simple : vous ne devriez pas avoir à rafraîchir sans cesse la même page en attendant une évolution qui vous concerne. Un logiciel peut monter cette garde.",
      "Vous décrivez avec vos propres mots ce que vous voulez surveiller ; Whenly vérifie pour vous des sources web publiques à intervalles réguliers et envoie une notification — ou une alarme — quand ce que vous attendez apparaît.",
      "Nous tenons à deux principes. D'abord, la confidentialité : nous ne vendons pas vos données et ne les utilisons pas pour la publicité ; vous pouvez les télécharger ou les supprimer définitivement à tout moment. Ensuite, l'honnêteté : nous n'écrivons pas une garantie que nous ne pouvons pas tenir — pas de promesses à la seconde, pas d'affirmations « ne ratez jamais rien » — et nous énonçons clairement que nous n'accédons pas aux pages derrière une connexion ou un captcha.",
      "Whenly est développé de façon indépendante. Pour toute question, correction ou demande, vous pouvez toujours nous joindre.",
    ],
    factsHeading: "Fiche d'information",
    facts: [
      { k: "Product", v: "Whenly — application de surveillance et d'alertes" },
      { k: "Platforms", v: "Application web + Android ; les alertes arrivent sur votre téléphone" },
      { k: "Languages", v: "11 langues d'interface, dont l'anglais et le turc" },
      { k: "Pricing", v: "Forfait gratuit (3 surveillances) + abonnement Pro" },
      {
        k: "Data principle",
        v: "Jamais revendues, pas de publicité ; à télécharger ou supprimer à tout moment",
      },
      { k: "Contact", v: "__EMAIL__" },
    ],
  },
  notFound: {
    metaTitle: "Page introuvable — Whenly",
    h1: "Cette page n'existe pas",
    text: "La page que vous cherchez a peut-être été déplacée ou n'a jamais existé. Continuez depuis la page d'accueil.",
    cta: "Retour à l'accueil",
  },
  legalCommon: {
    updatedLabel: "Dernière mise à jour",
    versionLabel: "Version",
    canonicalNote:
      "Ce texte est une copie de la version présente dans l'application ; en cas de différence, la version dans l'application prévaut.",
    translatedNote: "La version juridiquement contraignante de ce document est le texte anglais.",
  },
  ucStrings: {
    context: "Là où ça aide",
    examples: "Voici comment le dire à Whenly",
    exHint: "Copiez une phrase et collez-la dans l'application — votre surveillance est prête.",
    related: "Cas d'usage liés",
    faq: "Questions fréquentes",
    copy: "Copier",
    copied: "Copié",
  },
};
