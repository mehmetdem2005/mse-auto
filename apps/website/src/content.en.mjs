// English content — same principles as content.tr.mjs: describe WHAT it does, not HOW;
// only "checks public sources at regular intervals" — no internal mechanics or strategy
// on the site. Only genuinely reachable scenarios (nothing behind login/captcha).
// Universal examples (not locked to one country). Answer-first, question H2s, short pages.

// Global-first (ADR-096): EN kök dildir (/) — site "yalnız bir ülkeye özel" görünmez;
// TR /tr altında tam eşlenik yaşar. x-default → EN.
export const en = {
  lang: "en",
  prefix: "",
  useCaseBase: "/use-cases",
  langName: "English",
  otherLangLabel: "Türkçe",

  nav: {
    how: "How it works",
    useCases: "Use cases",
    compare: "Compare",
    faq: "FAQ",
    about: "About",
    openApp: "Open the app",
    menuLabel: "Toggle menu",
    skip: "Skip to content",
  },

  footer: {
    tagline: "Whenly tracks the development you care about for you and tells you when it happens.",
    useCases: "Use cases",
    product: "Product",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact",
    forAi: "For AI assistants: llms.txt",
    langSwitch: "Türkçe sürüm",
    updated: "Content updated",
  },

  home: {
    metaTitle: "Whenly — Tell me when it happens: monitoring & alerts",
    metaDescription:
      'Say "tell me when this happens": Whenly checks public web sources at intervals and alerts you — with a real alarm if you want — when it appears. Free to start.',
    heroOverline: "Monitoring & alerts app",
    heroTitle: "Tell me <em>when.</em>",
    // Çözümü sat (copywriting skill): ürün özelliği değil, kurtulduğun iş — "yenilemeyi bırak".
    heroSub:
      "Stop refreshing the page. Tell Whenly the moment you are waiting for — the price drop, the restock, the listing, the announcement — in one plain sentence. It checks public web sources at regular intervals and rings your phone when that moment arrives.",
    heroCta: "Start watching free",
    heroCtaNote: "No credit card · Works on web and phone",
    heroSecondary: "How does it work?",
    trust: ["Web + Android", "11 interface languages", "Free plan — no card", "Public web only"],
    phone: {
      watcherLabel: "WATCHING",
      watcherText:
        "Tell me when the product I want is back in stock under $500 at an official store",
      watcherMeta: "Checks at regular intervals",
      notifTitle: "Whenly · now",
      notifText: "Back in stock: the product is on sale again below your target price.",
      notifMeta: "Notification sent",
    },
    howHeading: "How does Whenly work?",
    how: [
      {
        icon: "messageSquare",
        t: "Describe what to watch",
        d: 'Write a plain sentence like "tell me when a 2-bedroom under $1,500 is listed here". No forms, no rule syntax to learn.',
      },
      {
        icon: "refresh",
        t: "Whenly keeps watch",
        d: "It checks public web sources — sites, news, announcements — for you at regular intervals.",
      },
      {
        icon: "bellRing",
        t: "Get notified",
        d: "When what you are waiting for appears, you get a notification; for critical topics, alarm mode rings your phone.",
      },
    ],
    // Fayda-önce (copywriting skill: benefits over features) — her madde "sana ne kazandırır".
    featuresHeading: "What you get",
    features: [
      {
        icon: "zap",
        t: "One sentence is the whole setup",
        d: 'Compound rules straight from plain words — "in stock AND under $500". No rule engine to learn, no filters to build.',
      },
      {
        icon: "languages",
        t: "Works in your language",
        d: "Eleven interface languages. Describe the watch the way you would say it out loud.",
      },
      {
        icon: "bellRing",
        t: "Alarm mode for the critical ones",
        d: "Some moments can't wait in a silent tray: with Pro, the alert makes your phone actually ring.",
      },
      {
        icon: "clock",
        t: "Quiet hours, your terms",
        d: "Night alerts hold until morning — you keep the coverage without trading away your sleep.",
      },
      {
        icon: "smartphone",
        t: "On web and phone",
        d: "Start in any browser in a minute; there is an Android app too. Alerts land on your phone.",
      },
      {
        icon: "shieldCheck",
        t: "Private by default",
        d: "No ads, no selling your data. Export everything or delete it permanently, anytime.",
      },
    ],
    pricingHeading: "Pricing is simple",
    pricing: {
      freeName: "Free",
      freeBullets: [
        "3 active watches",
        "Regular checks",
        "Notifications + quiet hours",
        "Web and Android",
      ],
      freeCta: "Start free",
      proName: "Pro",
      proBadge: "Most popular",
      proBullets: [
        "100 active watches",
        "More frequent checks",
        "Alarm mode — your phone rings",
        "Personalization + extra options",
      ],
      proCta: "Upgrade in the app",
      note: "The free plan has no time limit and asks for no card. Upgrade to Pro inside the app; cancel anytime.",
    },
    useCasesHeading: "What people use it for",
    useCasesSub:
      "Nine real jobs Whenly does on the public web — each one a moment people used to miss.",
    useCasesAll: "See all use cases",
    faqHeading: "Frequently asked questions",
    faq: [
      {
        q: "What is Whenly?",
        a: 'Whenly is an app that tracks a development you describe in plain language (for example, "tell me when this product is back in stock") for you. It checks public web sources at regular intervals and sends a notification or alarm when what you are waiting for appears.',
      },
      {
        q: "Is Whenly free?",
        a: "Yes — the free plan includes 3 active watches with no time limit and no card required. Pro adds more watches, more frequent checks, and alarm mode.",
      },
      {
        q: "What sources can it watch?",
        a: "Publicly available web sources: sites, news and announcement pages, listings. It does not access portals behind logins, personal accounts, or pages behind captchas (robot checks) — we state that limit explicitly.",
      },
      {
        q: "How fast does it notify me?",
        a: "Whenly checks sources at regular intervals and catches a development on the first check after it is published. We do not promise second-level alerts — sources can publish late. Treat a notification as a signal to verify yourself.",
      },
      {
        q: "Is my data safe?",
        a: "We do not sell your data or use it for ads. You can download all your data in a machine-readable format or permanently delete it with your account. Details are in the Privacy Policy.",
      },
      {
        q: "Does it work on phone or web?",
        a: "Both. The web app runs in any browser; there is an Android app too. Alerts arrive on your phone, and Pro adds alarm mode for critical watches.",
      },
      {
        q: "Is there an app that just notifies me when something happens online?",
        a: 'That is Whenly\'s whole job. You write the event in one sentence — "tell me when X happens" — and Whenly checks public web sources at regular intervals, then sends a push notification or rings an alarm when it occurs.',
      },
      {
        q: "Is Whenly an AI app that monitors the web for me?",
        a: "Yes. Whenly uses AI to turn your plain-language sentence into a monitoring intent and to judge whether what it finds really is the event you described. It reads public pages only — it never logs into accounts — and check timing is best-effort, not instant.",
      },
    ],
    ctaHeading: "Let go of the refresh button",
    ctaText: "Write one sentence and hand the watch over. Next time it happens, you know first.",
  },

  useCasesIndex: {
    slug: "use-cases",
    metaTitle: "Whenly use cases — what can you watch?",
    metaDescription:
      "From prices and restocks to listings, tenders and regulations: the monitoring scenarios Whenly can track on the open web.",
    h1: "What can you watch?",
    intro:
      "Whenly is topic-based: you don't have to know a page URL — you describe what you expect to happen. Everything below can be tracked on publicly available web sources.",
  },

  useCases: [
    {
      slug: "price-drop-alerts",
      icon: "trendingDown",
      name: "Price drop alerts",
      metaTitle: "Price drop alerts app (products, flights, crypto) — Whenly",
      metaDescription:
        "Get alerted when a price crosses your threshold: e-commerce products, flights, hotels, crypto and currencies. Whenly understands threshold rules in plain language.",
      h1: "Get alerted when the price crosses your threshold",
      answer:
        'Whenly tracks the public price of a product, flight or asset against the threshold you set; when it crosses, you get a notification. One sentence sets it up — "tell me when this drops below $400" — and both drops and rises can be watched.',
      context: [
        "Without an alert, catching discounts and deals means manual checking; good deals close within hours.",
        "Flight and hotel prices change often; watching a near-threshold price by hand takes time.",
        'In crypto and FX, "by the time I noticed it had passed" is common — a threshold alert does that watching for you.',
      ],
      examples: [
        "Tell me when this vacuum drops below $400 at any major retailer.",
        "Alert me when an Istanbul–Bangkok flight drops below $250.",
        "Notify me when Bitcoin rises above $150,000.",
      ],
      faq: [
        {
          q: "Which prices can it watch?",
          a: "Anything with a public price: e-commerce products, flights and hotels, crypto and currency rates. You state the threshold rule in plain language.",
        },
        {
          q: "Does it check constantly?",
          a: "It checks at regular intervals. For volatile, near-threshold prices, more frequent checks are a typical reason to use Pro.",
        },
      ],
      related: ["restock-alerts", "rental-listing-alerts", "ticket-alerts"],
    },
    {
      slug: "restock-alerts",
      icon: "pkg",
      name: "Restock alerts",
      metaTitle: "Restock alerts app (PS5, GPU, sneakers) — Whenly",
      metaDescription:
        'Get alerted when the PS5, a GPU or sneakers are back in stock. Whenly tracks public sale pages and understands rules like "in stock AND under $500".',
      h1: "Get alerted when a product is restocked",
      answer:
        'Whenly tracks product sale and announcement pages for you; when the product is back on sale at an official retailer, you get a notification. The difference is compound conditions: it understands rules like "back in stock AND under $500" from plain language.',
      context: [
        "Restocks of popular products sell out fast; refreshing the page by hand usually means missing it.",
        "Watching several retailers at once takes time; Whenly does that for you.",
        "Watching stock plus a price condition together is something simple stock alerts can't do.",
      ],
      examples: [
        "Tell me when the PS5 is back in stock at an official retailer.",
        "Alert me when the RTX 5090 is in stock under $2,000.",
        "Notify me when these sneakers go back on sale at retail price.",
      ],
      faq: [
        {
          q: "Which stores can it watch?",
          a: 'Any retailer with public product or announcement pages. Whenly is topic-based, so you are not tied to one URL: say "at an official retailer" and it weighs open-web sale signals together.',
        },
        {
          q: "Can it check a price condition at the same time?",
          a: 'Yes — compound conditions are a core feature: "in stock AND under $500" is defined in a single watch.',
        },
      ],
      related: ["price-drop-alerts", "ticket-alerts", "announcement-alerts"],
    },
    {
      slug: "rental-listing-alerts",
      icon: "home",
      name: "Property listing alerts",
      metaTitle: "Alerts for new rental & property listings — Whenly",
      metaDescription:
        "Good listings go in hours. Whenly tracks new listings against your area, price and size criteria and alerts you when a match is published.",
      h1: "Get alerted when a listing matches your criteria",
      answer:
        'Whenly tracks public real-estate listing sources against your area, price and size criteria; when a matching new listing is published you get a notification. "Tell me when a 2-bedroom under $1,500 is listed here" — that is the whole setup.',
      context: [
        "Fairly priced listings often close the same day; whoever sees them first has the advantage.",
        "Listing sites' own alerts can lag, and their filters are often too rigid.",
        "Manually sweeping several areas and conditions costs hours every day.",
      ],
      examples: [
        "Tell me when a 2-bedroom under $1,500 is listed in this neighborhood.",
        "Alert me when a furnished 1-bedroom appears in these two districts.",
        "Notify me when a 3-bedroom under €400k goes on sale in this area.",
      ],
      faq: [
        {
          q: "Which listing sites are watched?",
          a: "Public sources that publish listings. Whenly is topic-based: rather than locking to one site, it weighs matching open listing signals together.",
        },
        {
          q: "Can it filter area and price at once?",
          a: "Yes — neighborhood, price cap and room count go in a single sentence.",
        },
      ],
      related: ["price-drop-alerts", "tender-alerts", "announcement-alerts"],
    },
    {
      slug: "ticket-alerts",
      icon: "ticket",
      name: "Event ticket alerts",
      metaTitle: "App that alerts you when tickets go on sale — Whenly",
      metaDescription:
        "Never miss an on-sale: Whenly tracks public on-sale announcements for concerts, matches and events, and alerts you when sales open.",
      h1: "Get alerted when tickets go on sale",
      answer:
        'Whenly tracks public on-sale announcements and new-date notices for concerts and events for you; when sales are announced as open, you get a notification — an alarm on Pro. If the date isn\'t set, say "tell me when it goes on sale".',
      context: [
        "For popular events, missing the on-sale moment means no tickets.",
        "The on-sale date is often not clear in advance; watching for the announcement by hand is hard.",
        "New dates and extra sessions are announced at random times.",
      ],
      examples: [
        "Tell me when this tour is announced as on sale.",
        "Alert me when an extra date or session is announced for this event.",
        "Notify me when general sale is announced for this match.",
      ],
      faq: [
        {
          q: "Does it buy the ticket for me?",
          a: "No — Whenly alerts you; you buy it. It never accesses your account or queues on your behalf.",
        },
        {
          q: "Does it help if the on-sale date isn't set?",
          a: 'Yes — say "tell me when it goes on sale" and it tracks the public announcement and sale-page signals.',
        },
      ],
      related: ["restock-alerts", "price-drop-alerts", "announcement-alerts"],
    },
    {
      slug: "tender-alerts",
      icon: "gavel",
      name: "Tender & RFP alerts",
      metaTitle: "App that alerts you when tenders and RFPs are published — Whenly",
      metaDescription:
        "Public tenders, corrections, private RFPs: Whenly alerts you when a tender matching your sector is published, and tracks deadline changes too.",
      h1: "Get alerted when a tender matches your business",
      answer:
        "Whenly tracks public procurement notices, correction/amendment notices and private-sector RFP announcements for you; when a new notice or change matching your criteria is published, you get a notification.",
      context: [
        "Finding the notice is easy; not missing the later change (amendment, date) is the hard part.",
        "On passively checked boards, new notices are spotted days late; the early viewer wins.",
        "Missing the submission deadline means direct disqualification.",
      ],
      examples: [
        "Tell me when a construction-materials tender is published in my region.",
        "Alert me if the deadline or an amendment changes on a tender I follow.",
        "Remind me 48 hours before the submission deadline of this RFP.",
      ],
      faq: [
        {
          q: "Does it connect to my account?",
          a: "No — it watches public notice and announcement pages; it never accesses screens behind logins. You read the official text at the source.",
        },
        {
          q: "Does it remind me about deadlines?",
          a: 'Yes — time-based rules like "remind me 2 days before the deadline" can be defined.',
        },
      ],
      related: ["grant-alerts", "regulation-alerts", "competitor-alerts"],
    },
    {
      slug: "grant-alerts",
      icon: "coins",
      name: "Grant & funding alerts",
      metaTitle: "Grant call alerts app (Horizon Europe, grants.gov) — Whenly",
      metaDescription:
        "Whenly tracks public grant and funding announcements and alerts you when a call opens and as deadlines approach. Don't miss the once-a-year window.",
      h1: "Get alerted when a grant call opens",
      answer:
        "Whenly tracks public grant and funding announcements for you; when an application window opens — and again as the deadline approaches — you get a notification. Describe the source that fits you in one sentence.",
      context: [
        "Some calls close early when budgets run out; applying as soon as it opens is safest.",
        "Many programs run a single call per year; miss it and you wait a long time.",
        "Missing the deadline means direct rejection in most programs.",
      ],
      examples: [
        "Tell me when an R&D support call opens.",
        "Alert me when a new funding program is announced.",
        "Notify me when this call opens, and remind me a week before the deadline.",
      ],
      faq: [
        {
          q: "Does it remind me about deadlines?",
          a: 'Yes — watch the opening and the deadline with one watch: "tell me when the call opens" plus "remind me a week before the deadline".',
        },
        {
          q: "Which funding sources can it watch?",
          a: "Any program with public announcements: national agencies, ministry support, EU programs, foundation grants. Add your sector and eligibility to the sentence.",
        },
      ],
      related: ["tender-alerts", "regulation-alerts", "announcement-alerts"],
    },
    {
      slug: "regulation-alerts",
      icon: "scale",
      name: "Regulation alerts",
      metaTitle: "App that alerts you when regulations change (GDPR, NIS2) — Whenly",
      metaDescription:
        "Be alerted when a regulation, directive or ruling that affects you is published. Whenly tracks official gazettes and regulator announcements.",
      h1: "Get alerted when regulation affecting you changes",
      answer:
        "Whenly tracks official gazettes and regulator announcements within the topic you define; when a regulation, notice or ruling that affects you is published, you get a notification.",
      context: [
        "Official gazettes publish daily; manually sifting for the one relevant item does not scale.",
        "Noticing a change late risks compliance penalties or unexpected cost.",
        "Watching several regulators' announcements at once takes time.",
      ],
      examples: [
        "Tell me when a regulation affecting my sector is published in the official gazette.",
        "Alert me when the regulator publishes a new notice or ruling.",
        "Notify me when a customs-tariff change affects my product group.",
      ],
      faq: [
        {
          q: "Is this a substitute for legal counsel?",
          a: "No — Whenly is the early-warning layer: it makes sure you see the change first; your advisor does the interpreting. You go from the alert to the source and read it yourself.",
        },
        {
          q: "Only one country's regulations?",
          a: "No — any regulator with public announcements can be watched: EU directives, sector authorities, standards bodies. The country and topic in your sentence define the watch.",
        },
      ],
      related: ["tender-alerts", "competitor-alerts", "grant-alerts"],
    },
    {
      slug: "competitor-alerts",
      icon: "eye",
      name: "Competitor & brand alerts",
      metaTitle: "Competitor price, launch and brand monitoring — Whenly",
      metaDescription:
        "Know when a competitor changes pricing, announces a product, or when your brand is discussed publicly. Whenly tracks the open web for you.",
      h1: "See your competitor's move and your brand's pulse",
      answer:
        "Whenly tracks your competitors' public pricing pages, product and press announcements, and public conversation about your brand; when something noteworthy is published, you get a notification.",
      context: [
        "Noticing a competitor's price change late means your quotes and forecasts run on stale data.",
        "Missed product and press announcements mean learning about a market move too late.",
        "Spotting negative conversation about your brand early gives you a chance to respond before it grows.",
      ],
      examples: [
        "Tell me if anything changes on my competitor's public pricing page.",
        "Alert me when my competitor publishes a new product or press release.",
        "Notify me if my brand is discussed negatively on public platforms.",
      ],
      faq: [
        {
          q: "Is this ethical?",
          a: "Yes — only public information is watched: the competitor's own published pricing page, press releases and open conversations. No private data, no closed accounts, and no tracking of individuals — that is explicitly prohibited in our terms.",
        },
        {
          q: "What does brand monitoring cover?",
          a: "Public content that mentions your brand: news, forums, public posts.",
        },
      ],
      related: ["regulation-alerts", "tender-alerts", "price-drop-alerts"],
    },
    {
      slug: "announcement-alerts",
      icon: "megaphone",
      name: "Announcement & page alerts",
      metaTitle: "App that alerts you when a page publishes something new — Whenly",
      metaDescription:
        "Get alerted when a page you follow publishes a new announcement, result list or update. Whenly tracks public pages for you instead of refreshing.",
      h1: "Get alerted when a page publishes something new",
      answer:
        "Whenly checks a public page or topic you follow for you; when a new announcement, result list or noteworthy update is published, you get a notification. You stop refreshing the same page over and over.",
      context: [
        "Refreshing the same page dozens of times a day while waiting for an announcement is wasted time.",
        "Important updates are often published quietly; they slip by the moment you look away.",
        "Watching several sources at once is not sustainable by hand.",
      ],
      examples: [
        "Tell me when a page I follow publishes a new announcement.",
        "Alert me when the result list I'm waiting for is published publicly.",
        "Notify me when this site updates its prices or terms.",
      ],
      faq: [
        {
          q: "Does it watch pages behind a login?",
          a: "No — only public pages that don't require login, password or a captcha. You check a result in your personal account yourself; Whenly wins you the timing.",
        },
        {
          q: "Does it watch a specific page?",
          a: "It can watch both a specific page and a topic: give a URL, or just describe what you expect.",
        },
      ],
      related: ["regulation-alerts", "price-drop-alerts", "restock-alerts"],
    },
  ],

  compare: {
    slug: "compare",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — comparison",
    metaDescription:
      "Comparing monitoring tools: where Whenly, Google Alerts, Visualping and Distill each shine — natural-language rules, compound conditions and alarms.",
    h1: "Whenly vs the alternatives",
    answer:
      'Short answer: to watch ONE specific page for changes, Visualping and Distill are mature tools; for an email digest of new content, Google Alerts is free. Whenly answers a different question: "tell me when this EVENT happens" — no page URL needed, in plain language, with compound conditions and an alarm that rings your phone.',
    intro:
      "We wrote this without tilting the table. Each tool's strength is stated plainly; if you spot something wrong, write to us and we will fix it.",
    tableCaption: "Feature comparison of monitoring tools",
    colSelf: "Whenly",
    rows: [
      {
        f: "Core approach",
        self: '"Tell me when" sentence (topic/event-based)',
        ga: "Keyword: new content",
        vp: "Changes on a specific URL",
        di: "Changes on a specific URL",
      },
      {
        f: 'Compound conditions in plain language ("in stock AND under $500")',
        self: "Yes — core feature",
        ga: "No",
        vp: "Limited",
        di: "Limited (technical setup)",
      },
      {
        f: "Need to know the page URL?",
        self: "No — topics are watched",
        ga: "No",
        vp: "Yes",
        di: "Yes",
      },
      {
        f: "Alarm mode that rings your phone",
        self: "Yes (Pro)",
        ga: "No (email)",
        vp: "No",
        di: "Partial",
      },
      {
        f: "Setup in your own language (11)",
        self: "Yes",
        ga: "Partial",
        vp: "Partial",
        di: "Partial",
      },
      {
        f: "Free plan",
        self: "3 watches",
        ga: "Entirely free",
        vp: "Limited quota",
        di: "Limited",
      },
      {
        f: "Best at",
        self: "Waiting for events: prices, restocks, listings, tenders, regulations",
        ga: "New content about a topic",
        vp: "Visual changes on a single page",
        di: "Page diffs for technical users",
      },
    ],
    afterTable:
      'Summary: for "alert me when this page changes", Visualping/Distill are the right choice; for "email me new content", Google Alerts. If your need is "I am waiting for an EVENT and my phone should ring the moment it happens", Whenly was designed for exactly that.',
    // Rakip-bazlı derin karşılaştırmalar (GEO/ADR-097): "Whenly vs X" prompt'ları
    // için ayrı, atıflanabilir sayfalar. Dürüstlük: rakibin güçlü yanı açıkça yazılır.
    toolsHeading: "Head-to-head, one tool at a time",
    strengthsHeading: "Where {name} shines",
    whenHeading: "When Whenly is the better fit",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026): event alerts vs email digests",
        metaDescription:
          "Google Alerts emails new content for a keyword; Whenly watches for the event you describe and rings your phone when it happens. An honest comparison.",
        h1: "Whenly vs Google Alerts",
        answer:
          'Google Alerts is free and emails you when new content mentions a keyword. Whenly answers a different question: you describe an event with conditions — "tell me when it drops below $400" — and it pushes a notification or rings an alarm when that event happens. Many people use both.',
        strengths: [
          "Completely free, with no quotas to think about",
          "Backed by Google's index — broad coverage of news and the open web",
          "Email digests are easy to skim once a day",
        ],
        whenWhenly: [
          "You wait for an EVENT with a condition (price under X, back in stock) — not a stream of articles",
          "You need a push notification or a real alarm, not an email digest",
          "You want compound rules in plain language, in 11 interface languages",
        ],
        faq: [
          {
            q: "Does Whenly replace Google Alerts?",
            a: "They do different jobs. Google Alerts is great for following coverage of a topic by email. Whenly is built for catching a specific moment — it understands thresholds and rings your phone. Many people keep both.",
          },
          {
            q: "Is Whenly free like Google Alerts?",
            a: "Whenly's free plan includes 3 active watches with no time limit and no card required. Pro adds more watches, more frequent checks and alarm mode.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026): page diffs vs plain-language events",
        metaDescription:
          "Visualping excels at visual change detection on a page you specify. Whenly is topic-based: describe the event in plain language and get an alarm on your phone.",
        h1: "Whenly vs Visualping",
        answer:
          "Visualping is a mature change-detection tool: give it a URL and it shows visual diffs of that page. Whenly starts from the other end — you describe the event in plain language, no URL required, and it pushes a notification or rings an alarm when the event appears on public sources.",
        strengths: [
          "Strong visual page-diff engine with screenshots and change highlighting",
          "Polished, widely used browser extension and web app",
          "A good fit when you know exactly which page to watch",
        ],
        whenWhenly: [
          "You'd rather describe the outcome than hunt for the right URL",
          'You want compound plain-language conditions — "in stock AND under $500"',
          "You want a mobile-first app with alarm mode; as of mid-2026 Visualping does not offer an Android app on Google Play (tell us if this changes and we will correct it)",
        ],
        faq: [
          {
            q: "Is Whenly a Visualping alternative?",
            a: 'For page-level visual diffs, Visualping remains a strong choice. If your need is "tell me when this event happens" — with conditions, on your phone, with an alarm — that is exactly what Whenly is built for.',
          },
          {
            q: "Do I need to give Whenly a URL?",
            a: "No. You can give one, but a plain sentence is enough; Whenly weighs matching public web signals together.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026): an honest comparison",
        metaDescription:
          "Distill offers fine-grained page monitoring for technical users. Whenly trades selector setup for plain language, alarm mode and a mobile-first experience.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "Distill is a powerful page monitor for technical users: pick elements with selectors, run local or cloud checks, fine-tune everything. Whenly takes the opposite path — one plain sentence, no selectors, public-web event detection with notifications and a real alarm on your phone.",
        strengths: [
          "Element-level selection gives precise control over what counts as a change",
          "Local monitoring options appeal to privacy-minded technical users",
          "Flexible scheduling and conditions for power users",
        ],
        whenWhenly: [
          "You don't want to maintain selectors that break when a site changes layout",
          "You prefer describing the event over configuring it",
          "You want alarm mode and a phone-first experience in 11 languages",
        ],
        faq: [
          {
            q: "Is Whenly easier to set up than Distill?",
            a: "Yes, by design: setup is one sentence. The trade-off is less fine-grained control than selector-based tools — power users may still prefer Distill for page-element diffs.",
          },
          {
            q: "Can Whenly watch a specific page like Distill?",
            a: "Yes — give it a URL or just describe the topic. Whenly watches public pages only, and says that limit plainly.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Does Whenly replace Google Alerts?",
        a: "They do different jobs: Google Alerts emails you new content. Whenly asks you to define the event and pushes a notification or alarm when it happens. Many people use both.",
      },
      {
        q: "Why Whenly over Visualping or Distill?",
        a: 'Those tools are page-based: you must find the URL to watch. Whenly is topic-based: say "when this happens" and it looks for the development wherever it surfaces, with compound conditions and an alarm.',
      },
    ],
  },

  about: {
    slug: "about",
    metaTitle: "About Whenly — what it does, who it's for",
    metaDescription:
      "Whenly is an independent app that tracks the development you care about for you. We state plainly what it does and its limits.",
    h1: "About Whenly",
    paras: [
      "Whenly started from a simple idea: you shouldn't have to keep refreshing the same page while waiting for a development that affects you. Software can keep that watch.",
      "You describe what you want to watch in your own words; Whenly checks public web sources for you at regular intervals and sends a notification — or an alarm — when what you are waiting for appears.",
      "We hold two principles. First, privacy: we don't sell your data or use it for ads; you can download or permanently delete it anytime. Second, honesty: we don't write a guarantee we can't keep — no second-level promises, no \"never miss\" claims — and we state plainly that we don't access pages behind logins or captchas.",
      "Whenly is built independently. For questions, corrections and requests, you can always reach us.",
    ],
    factsHeading: "Fact sheet",
    facts: [
      { k: "Product", v: "Whenly — monitoring and alerting app" },
      { k: "Platforms", v: "Web app + Android; alerts arrive on your phone" },
      { k: "Languages", v: "11 interface languages, including English and Turkish" },
      { k: "Pricing", v: "Free plan (3 watches) + Pro subscription" },
      { k: "Data principle", v: "Never sold, no ads; download or delete anytime" },
      { k: "Contact", v: "__EMAIL__" },
    ],
  },

  notFound: {
    metaTitle: "Page not found — Whenly",
    h1: "This page doesn't exist",
    text: "The page you are looking for may have moved or never existed. Continue from the home page.",
    cta: "Back to home",
  },

  legalCommon: {
    updatedLabel: "Last updated",
    versionLabel: "Version",
    canonicalNote:
      "This text is a copy of the version inside the app; if they differ, the in-app version prevails.",
  },

  ucStrings: {
    context: "Where it helps",
    examples: "This is how you say it to Whenly",
    exHint: "Copy a sentence and paste it in the app — your watch is ready.",
    related: "Related use cases",
    faq: "Common questions",
    copy: "Copy",
    copied: "Copied",
  },
};
