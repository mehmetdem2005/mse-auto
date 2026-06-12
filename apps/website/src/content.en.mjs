// English content — adapted for global conversational queries (not a literal
// translation of the Turkish copy). Same GEO writing rules: answer-first opening,
// question-form H2s, honest limits, short pages, copyable example sentences.

/** @typedef {import("./content.tr.mjs").tr} _Shape */

export const en = {
  lang: "en",
  prefix: "/en",
  useCaseBase: "/en/use-cases",
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
    tagline:
      "Whenly watches the events you describe in plain language and alerts you the moment they happen.",
    useCases: "Use cases",
    product: "Product",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact",
    forAi: "For AI assistants: llms.txt",
    langSwitch: "Türkçe sürüm",
  },

  home: {
    metaTitle: "Whenly — Tell me when it happens: AI-powered event monitoring",
    metaDescription:
      'Say "tell me when this happens": Whenly scans the open web, verifies the event with AI, and sends an instant push or a real alarm. Free to start.',
    heroOverline: "AI-powered event monitoring",
    heroTitle: "Tell me <em>when.</em>",
    heroSub:
      "Describe what you are waiting for in your own words. Whenly scans public web sources on a schedule, verifies the development with AI, and pushes a notification — or rings a real alarm — the moment it happens.",
    heroCta: "Start free",
    heroCtaNote: "No credit card · Works on web and phone",
    heroSecondary: "How does it work?",
    phone: {
      watcherLabel: "WATCHING",
      watcherText: "Tell me the moment Italy Schengen visa appointments open in Istanbul",
      watcherMeta: "Frequent checks · Official sources first",
      notifTitle: "Whenly · now",
      notifText: "Appointments opened: new slots are visible on the application center calendar.",
      notifMeta: "Detected with 92% confidence",
    },
    statHeading: "Why does this need to exist?",
    stats: [
      {
        n: "50",
        unit: "real demands",
        t: "Our field research collected 50 real monitoring needs from forums and complaint platforms — from people living the problem, not people imagining an app.",
      },
      {
        n: "minutes",
        unit: "to sell out",
        t: "Visa slots, concert tickets and restocks are routinely gone within minutes; refreshing by hand means missing out.",
      },
      {
        n: "24/7",
        unit: "watch duty",
        t: "People refresh the same page dozens of times a day. That vigil is a job for software, not for you.",
      },
    ],
    howHeading: "How does Whenly work?",
    how: [
      {
        icon: "messageSquare",
        t: "Describe it in a sentence",
        d: 'Write something like "tell me when a 2-bedroom under $1,500 is listed in Brooklyn". No forms, no rule-engine syntax to learn.',
      },
      {
        icon: "search",
        t: "Whenly watches",
        d: "Public web sources — official sites, news, announcement pages — are scanned at the frequency you choose. Your personal details never leave the private zone; searches use a stripped, generalized topic.",
      },
      {
        icon: "sparkles",
        t: "AI verifies",
        d: 'A model evaluates what was found: did the event actually happen? Every detection records a confidence score and reasoning — the "why this notification" is always visible.',
      },
      {
        icon: "bellRing",
        t: "Get alerted instantly",
        d: "A push notification arrives the moment it happens; for critical topics, alarm mode makes your phone actually ring. Quiet hours and per-watcher sounds are under your control.",
      },
    ],
    featuresHeading: "What stands out",
    features: [
      {
        icon: "zap",
        t: "Compound conditions",
        d: 'Understands combined rules from plain language — "in stock AND under $600", "listed AND in this neighborhood" — the part simple alerts can\'t do.',
      },
      {
        icon: "shieldCheck",
        t: "Privacy boundary by design",
        d: "Your free-text intent stays in the personal-data zone; external search and AI services only ever receive a topic stripped of personal details.",
      },
      {
        icon: "languages",
        t: "11 languages",
        d: "Eleven interface languages including English and Turkish; write your watch sentence in your own language while sources are scanned regardless of language.",
      },
      {
        icon: "eye",
        t: "Transparent detections",
        d: "Every notification carries a confidence score and a source trail. What was searched, what was found, why it was decided — all visible.",
      },
      {
        icon: "clock",
        t: "Quiet hours",
        d: "Night-time notifications arrive silently; you catch up in the morning. Critical watchers can be granted alarm rights if you choose.",
      },
      {
        icon: "layers",
        t: "Sonar deep scan",
        d: "An optional second, deeper pass for critical topics: more sources, re-reasoning — insurance against near-miss detections.",
      },
    ],
    pricingHeading: "Pricing is simple",
    pricing: {
      freeName: "Free",
      freeBullets: [
        "3 active watchers",
        "Checks as often as hourly",
        "Push notifications + quiet hours",
        "AI-verified detections",
      ],
      freeCta: "Start free",
      proName: "Pro",
      proBullets: [
        "100 active watchers",
        "Checks as often as every minute",
        "Alarm mode — your phone actually rings",
        "100 notification sounds + personal filters",
      ],
      proCta: "Upgrade in the app",
      note: "The free plan has no time limit and asks for no card. Upgrade to Pro inside the app; cancel anytime.",
    },
    useCasesHeading: "What people use it for",
    useCasesSub:
      "Every scenario below comes from real user demand — the most frequent and most urgent cases in our field research.",
    useCasesAll: "See all use cases",
    faqHeading: "Frequently asked questions",
    faq: [
      {
        q: "What is Whenly?",
        a: 'Whenly is an app that watches an event you describe in plain language (for example, "tell me when the PS5 is back in stock at an official retailer"). It scans public web sources on a schedule, verifies the development with AI, and sends a notification or alarm the moment it happens.',
      },
      {
        q: "Is Whenly free?",
        a: "Yes — the free plan includes 3 active watchers with checks as often as hourly, with no time limit and no card required. Pro adds more watchers (100), checks down to every minute, alarm mode, and personal filters.",
      },
      {
        q: "What sources can it watch?",
        a: "Publicly available web sources: official institution sites, news, announcement and listing pages. It does not access portals behind logins, personal accounts, or pages behind captchas — we state that limit explicitly.",
      },
      {
        q: "How fast are notifications?",
        a: "It depends on your watcher's check frequency: up to hourly on the free plan and up to every minute on Pro. Detection happens on the first check after the source publishes. We do not promise second-level alerts — sources can publish late and indexes can lag; that honest limit is also written into our terms.",
      },
      {
        q: "Is my data safe?",
        a: "Your watch sentence stays in the personal-data zone; only a generalized topic stripped of personal details is sent to external search and AI services. We do not sell data or use it for ads. You can download all your data or permanently delete it with your account.",
      },
      {
        q: "Does it work on phone or web?",
        a: "Both. The web app runs in any browser; the Android app is built from the same code. Notifications arrive as push on your phone, and Pro adds alarm mode for critical watchers.",
      },
    ],
    ctaHeading: "Let Whenly take the watch",
    ctaText: "Write one sentence and let go. Be the first to know when it happens.",
  },

  ucStrings: {
    pains: "How real is the problem?",
    examples: "This is how you say it to Whenly",
    exHint: "Copy a sentence and paste it in the app — your watcher is ready.",
    related: "Related use cases",
    faq: "Common questions",
    copy: "Copy",
    copied: "Copied",
  },

  useCasesIndex: {
    slug: "use-cases",
    metaTitle: "Whenly use cases — what can you watch?",
    metaDescription:
      "From visa appointments to restocks, tenders to regulations: Whenly's AI-powered monitoring scenarios, all drawn from real user demand.",
    h1: "What can you watch?",
    intro:
      "Whenly is topic-based: you don't have to know a page URL — you describe what you expect to happen. Every scenario below comes from real demands in our field research.",
  },

  useCases: [
    {
      slug: "visa-appointment-alerts",
      icon: "calendarClock",
      name: "Visa appointment alerts",
      metaTitle: "App that alerts you when visa appointments open — Whenly",
      metaDescription:
        "Can't find a Schengen or US visa appointment? Whenly watches calendars and announcements for you and alerts you the moment a slot opens.",
      h1: "Get alerted the moment visa appointments open",
      answer:
        "Whenly watches visa appointment announcements and calendar pages for you on a schedule; when a new slot or a cancellation opening is detected, it sends an instant push notification — an alarm on Pro. Setup is one sentence: which country, which city, and what should trigger the alert.",
      pains: [
        'The sharpest demand in our field research: "I check the second the alert lands and slots are gone within two minutes."',
        "People locked out of appointments end up paying brokers and bots €100+; the 5–10 slots freed by daily cancellations are taken in seconds.",
        "Manual tracking doesn't scale: applicants refresh the same calendar dozens of times a day for weeks.",
      ],
      examples: [
        "Tell me the moment Italy Schengen visa appointments open in Istanbul.",
        "Alert me if a cancellation frees up a slot for a Germany visa appointment.",
        "Tell me when standard (non-premium) UK visa appointments become available in my city.",
      ],
      faq: [
        {
          q: "Does Whenly book the appointment for me?",
          a: "No — Whenly watches and alerts; you book it yourself. It does not log into appointment portals; it scans public announcement and calendar pages, opening news and official notices. It is a legitimate early-warning layer, not a booking bot.",
        },
        {
          q: "Will the notification arrive in time if slots vanish in seconds?",
          a: "Honest answer: not always. Whenly detects on the first check after the source publishes; on Pro that is down to every minute, and alarm mode makes your phone ring. We offer a measurable speed advantage over manual refreshing, not a guarantee.",
        },
      ],
      related: ["appointment-and-results-alerts", "concert-ticket-alerts", "restock-alerts"],
    },
    {
      slug: "appointment-and-results-alerts",
      icon: "gradCap",
      name: "Results & application alerts",
      metaTitle: "App that alerts you when results are announced — Whenly",
      metaDescription:
        "Exam results, admission lists, lottery outcomes, application windows: Whenly watches announcement pages and alerts you the moment they are published.",
      h1: "Be first to know when results are announced",
      answer:
        'Whenly watches result announcements, admission lists and application windows for you; the moment the publication is detected, you get a notification. Rules like "tell me when applications open, and remind me two days before the deadline" are set up in a single sentence.',
      pains: [
        "Waiting for results means days of compulsive refreshing — our research found people checking official portals many times a day.",
        "Application windows are short, and systems crash under last-day load; acting early wins.",
        "Supplementary admission lists fill within hours of being published.",
      ],
      examples: [
        "Tell me the moment scholarship results are announced.",
        "Alert me when the supplementary admission list is published.",
        "Tell me when applications open, and remind me 2 days before the deadline.",
      ],
      faq: [
        {
          q: "Can it see my personal result inside a portal?",
          a: "No — Whenly never accesses systems behind logins. It watches public announcements: the 'results are out' notice, the official announcement page, the published list. You check your own result in seconds; Whenly wins you the timing.",
        },
      ],
      related: ["visa-appointment-alerts", "grant-alerts", "doctor-appointment-alerts"],
    },
    {
      slug: "doctor-appointment-alerts",
      icon: "heartPulse",
      name: "Doctor appointment alerts",
      metaTitle: "App that alerts you when doctor appointments open — Whenly",
      metaDescription:
        "Whenly watches public availability announcements for clinics and health services and notifies you the moment an opening matching your specialty and area is detected.",
      h1: "Get alerted when a doctor appointment opens",
      answer:
        'Whenly watches appointment openings and cancellation announcements for you; when availability matching your specialty and area is detected, you get an instant notification. It is set up with one sentence, like "tell me when a cardiology appointment opens near me".',
      pains: [
        'From our field research: "I have been logging in every day for 8 days" — released slots fill within minutes.',
        "Cancellation slots are the fastest to disappear; only someone watching at that exact moment catches them.",
        "For chronic patients, this uncertainty is a health risk, not an inconvenience.",
      ],
      examples: [
        "Tell me the moment a cardiology appointment opens in my district.",
        "Alert me when passport appointment slots open in my city.",
        "Notify me when travel vaccines become available at clinics near me.",
      ],
      faq: [
        {
          q: "Does Whenly log into my health account?",
          a: "No. Whenly never accesses systems that require a login; it watches public announcements and availability pages. You always book through your own account — Whenly just wins you the moment.",
        },
      ],
      related: [
        "visa-appointment-alerts",
        "medicine-stock-alerts",
        "appointment-and-results-alerts",
      ],
    },
    {
      slug: "medicine-stock-alerts",
      icon: "pill",
      name: "Medicine availability alerts",
      metaTitle: "App that alerts you when a medicine is back in stock — Whenly",
      metaDescription:
        "Can't find your medication anywhere? Whenly watches supply announcements and availability signals and alerts you the moment your medicine becomes obtainable again.",
      h1: "Get alerted when your medicine is available again",
      answer:
        "Whenly watches medicine availability announcements, distributor and manufacturer statements, and supply news for you; when a development about your medication's availability in your area is detected, it sends an instant notification. One sentence to set up, watching 24/7 on your behalf.",
      pains: [
        'Among the heaviest stories in our research: "I have been searching for 6 months and visited 150 pharmacies."',
        "There is no central channel that announces restocks; patients call pharmacies one by one.",
        "Supply crises come in waves: those who catch the right moment get it, then it is gone again.",
      ],
      examples: [
        "Tell me when my medication becomes available at pharmacies on my side of the city.",
        "Alert me the moment a re-supply announcement is published for this medicine.",
        "Notify me when an equivalent (generic) of this medicine goes on sale.",
      ],
      faq: [
        {
          q: "Can Whenly see live pharmacy inventories?",
          a: "It has no access to pharmacies' internal stock systems — that is our honest limit. What it watches are public signals: supply announcements, distributor/manufacturer statements, availability news. Those signals usually let you act before the pharmacy-by-pharmacy hunt starts.",
        },
        {
          q: "Is my health data shared?",
          a: "Your watch sentence stays in the personal-data zone; external services only receive a generalized topic stripped of personal details. Your data is never sold or used for ads, and you can delete it permanently at any time.",
        },
      ],
      related: ["doctor-appointment-alerts", "restock-alerts", "price-drop-alerts"],
    },
    {
      slug: "restock-alerts",
      icon: "pkg",
      name: "Restock alerts",
      metaTitle: "App that alerts you on restocks (PS5, GPU, sneakers) — Whenly",
      metaDescription:
        'Instant alerts when the PS5, a GPU or sneakers are back in stock. Whenly verifies restocks with AI and understands rules like "in stock AND under $600".',
      h1: "Get alerted the moment a product is restocked",
      answer:
        'Whenly watches product availability and release announcements for you; when the product is back on sale at an official retailer, you get an instant notification. The difference is compound conditions: it understands rules like "back in stock AND under $600" from plain language.',
      pains: [
        'From our field research: "I added it to my cart and it sold out during checkout" — restocks vanish in minutes, sometimes seconds.',
        "Scalpers buy with bots and resell at inflated prices; an ordinary buyer's only chance is early warning.",
        'The #1 complaint about existing restock apps: "the notification came too late — stock was gone when I tapped."',
      ],
      examples: [
        "Tell me the moment the PS5 is back in stock at an official retailer.",
        "Alert me when the RTX 5090 is in stock under $2,000.",
        "Notify me when the Jordan 4 drops at retail price or a raffle opens.",
      ],
      faq: [
        {
          q: "Which stores can it watch?",
          a: 'Any retailer with public product or announcement pages. Whenly is topic-based, so you are not tied to a single page URL: say "at an official retailer" and it evaluates open-web stock signals together.',
        },
        {
          q: "What is alarm mode?",
          a: "On Pro you can grant alarm rights to critical watchers: instead of a silent banner, the notification makes your phone actually ring — built for restocks where seconds matter. Pick from 100 sounds or set quiet-hour rules.",
        },
      ],
      related: ["price-drop-alerts", "concert-ticket-alerts", "medicine-stock-alerts"],
    },
    {
      slug: "concert-ticket-alerts",
      icon: "ticket",
      name: "Ticket on-sale alerts",
      metaTitle: "App that alerts you when tickets go on sale — Whenly",
      metaDescription:
        "Never miss an on-sale again: Whenly watches concert, match and event ticket sales and resale releases, and alerts you the moment sales open.",
      h1: "Get alerted the moment tickets go on sale",
      answer:
        'Whenly watches ticket on-sales, new date announcements and returned-ticket releases for you; the moment sales open you get a notification — on Pro, an alarm that rings your phone. Timed rules like "remind me 5 minutes before the on-sale" work too.',
      pains: [
        'From our field research: "I waited two hours in the queue and it sold out before my turn."',
        "Returned and resale tickets drop at random moments; only constant watchers see them.",
        "Secondary-market prices run to multiples of face value; early warning is direct savings.",
      ],
      examples: [
        "Tell me the moment tickets for this tour go on sale.",
        "Alert me when face-value resale tickets appear for this concert.",
        "Notify me when general sale opens for the derby match.",
      ],
      faq: [
        {
          q: "Does it buy the ticket for me?",
          a: "No — Whenly alerts; you buy. It never accesses your account or queues on your behalf; it is a legitimate early-warning tool.",
        },
      ],
      related: ["restock-alerts", "price-drop-alerts", "visa-appointment-alerts"],
    },
    {
      slug: "price-drop-alerts",
      icon: "trendingDown",
      name: "Price drop alerts",
      metaTitle: "Price drop alerts app (products, flights, crypto) — Whenly",
      metaDescription:
        "Get alerted when a price crosses your threshold: e-commerce products, flights, hotels, crypto and currencies. Whenly understands threshold rules in plain language.",
      h1: "Get alerted when the price crosses your threshold",
      answer:
        'Whenly watches the price of a product, flight or asset against the threshold you set; when it crosses, you get an instant notification. One sentence sets it up — "tell me when this vacuum drops below $400" — and both drops and rises can be watched.',
      pains: [
        "Without an alert, deals slip by: discounts and error fares close within hours.",
        "If a flight's price drops after you book, a refund of the difference may be possible — but only if you notice.",
        'In crypto and FX, "by the time I noticed it had passed" is the most common complaint; threshold alerts are table stakes.',
      ],
      examples: [
        "Tell me when this vacuum drops below $400 at any major retailer.",
        "Alert me the moment an Istanbul–Bangkok flight drops below $250.",
        "Notify me when Bitcoin rises above $150,000.",
      ],
      faq: [
        {
          q: "Which prices can it watch?",
          a: "Anything with a public price: e-commerce products, flights and hotels, crypto and currency rates. You state the threshold rule in plain language; Whenly evaluates current open-web price signals.",
        },
      ],
      related: ["restock-alerts", "rental-listing-alerts", "concert-ticket-alerts"],
    },
    {
      slug: "rental-listing-alerts",
      icon: "home",
      name: "Rental listing alerts",
      metaTitle: "App that alerts you when new rental listings appear — Whenly",
      metaDescription:
        "Good rentals go in hours. Whenly watches new listings against your area, price and room criteria and alerts you the moment a match is published.",
      h1: "Get alerted when a listing matches your criteria",
      answer:
        'Whenly watches real-estate listing sources against your area, price and size criteria; when a matching new listing is published you get an instant notification. "Tell me when a 2-bedroom under $1,500 is listed in this neighborhood" — that is the whole setup.',
      pains: [
        'From our field research: "good listings go within hours" — fairly priced homes close the same day.',
        "Listing sites' own alerts can lag, and their filters are often too rigid.",
        "Manually sweeping several neighborhoods and conditions costs hours every day.",
      ],
      examples: [
        "Tell me the moment a 2-bedroom under $1,500 is listed in Brooklyn.",
        "Alert me when a furnished 1-bedroom appears in these two districts.",
        "Notify me when a 3-bedroom under €400k goes on sale in this area.",
      ],
      faq: [
        {
          q: "Can it filter area and price at the same time?",
          a: "Yes — compound conditions exist exactly for this: neighborhood + price cap + room count in a single sentence. On Pro, personal filters re-check detections on your device for an extra layer of precision.",
        },
      ],
      related: ["price-drop-alerts", "tender-alerts", "restock-alerts"],
    },
    {
      slug: "tender-alerts",
      icon: "gavel",
      name: "Tender & RFP alerts",
      metaTitle: "App that alerts you when tenders and RFPs are published — Whenly",
      metaDescription:
        "Public tenders, amendments, private RFPs: Whenly alerts you the moment a tender matching your sector and region is published, and watches deadline changes too.",
      h1: "Get alerted when a tender matches your business",
      answer:
        "Whenly watches public procurement notices, amendments and corrections, and private-sector RFP announcements for you; when a new notice or change matching your criteria is detected, you get an instant notification. It works like a 24/7 bid desk — even without a bid team.",
      pains: [
        'From our field research: "finding the tender is easy; not missing the amendment is hard" — missed amendments mean disqualification.',
        "Objection windows are strict: see the result notice late and you lose the legal window entirely.",
        "On passively checked boards, new notices are spotted days late; the early viewer wins.",
      ],
      examples: [
        "Tell me when a construction-materials tender is published in my region.",
        "Alert me instantly if the deadline or an amendment changes on a tender I follow.",
        "Remind me 48 hours before the submission deadline of this RFP.",
      ],
      faq: [
        {
          q: "Does it connect to my procurement account?",
          a: "No — it watches public notice and announcement pages; it never accesses screens behind logins. You always read the official text at the source; Whenly wins you the time.",
        },
        {
          q: "Can we use it as a team?",
          a: "Accounts are individual today; teammates watching the same topic each set up their own watcher. Team accounts are on our roadmap — we don't present unbuilt features as built.",
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
        "Whenly watches grant and funding programs — national agencies, EU/Horizon Europe, grants.gov — and alerts you the moment a call opens and as deadlines approach.",
      h1: "Get alerted the moment a grant call opens",
      answer:
        "Whenly watches grant and funding announcements for you; when an application window opens — and again as the deadline approaches — you get a notification. National agencies, development funds, EU/Horizon Europe, grants.gov: describe the source that fits you in one sentence.",
      pains: [
        'Some calls close early when budgets run out — "it closed a day before the deadline" is a real case from our research.',
        "Many regional programs run a single call per year; miss it and you wait twelve months.",
        "Most funders reject late submissions outright; a two-day slip can cost a five-figure grant.",
      ],
      examples: [
        "Tell me the moment this agency's R&D support call opens.",
        "Alert me when a new eligible call appears on grants.gov.",
        "Notify me instantly when my Horizon Europe topic moves from 'forthcoming' to 'open'.",
      ],
      faq: [
        {
          q: "Does it remind me about deadlines?",
          a: 'Yes — watch the opening and the deadline with the same logic: "tell me when the call opens" plus "remind me a week before the deadline". Against early closures, applying as soon as it opens is safest.',
        },
      ],
      related: ["tender-alerts", "regulation-alerts", "appointment-and-results-alerts"],
    },
    {
      slug: "regulation-alerts",
      icon: "scale",
      name: "Regulation alerts",
      metaTitle: "App that alerts you when regulations change (GDPR, NIS2) — Whenly",
      metaDescription:
        "Be alerted the moment a regulation, directive or ruling affecting your sector is published. Whenly watches official gazettes and regulator announcements with AI.",
      h1: "Get alerted when regulation affecting you changes",
      answer:
        'Whenly watches official gazettes and regulator announcements within the topic you define; when a regulation, communiqué or ruling affecting your sector is published, you get an instant notification. "Ignorance of the law is no excuse" becomes a managed, systematic process.',
      pains: [
        "Compliance fines are heavy — data-protection penalties reach into the millions; latecomers learn about changes from the fine.",
        "Official gazettes publish daily; manually sifting for the one relevant article does not scale.",
        "Customs tariff and import-regulation changes cause misdeclarations and unexpected costs.",
      ],
      examples: [
        "Tell me when a regulation affecting the food sector is published in the official gazette.",
        "Alert me the moment the data-protection authority publishes a new ruling.",
        "Notify me when new NIS2 implementation guidance is released.",
      ],
      faq: [
        {
          q: "Is this a substitute for legal counsel?",
          a: "No — Whenly is the early-warning layer: it makes sure you see the change first; your counsel does the interpreting. Every notification carries a source trail so you can go straight to the official text.",
        },
        {
          q: "Only one country's regulations?",
          a: "No — any regulator with public announcements can be watched: EU directives (NIS2, DORA, GDPR guidance), sector authorities, standards bodies. The country and topic in your sentence define the watch.",
        },
      ],
      related: ["tender-alerts", "competitor-alerts", "grant-alerts"],
    },
    {
      slug: "competitor-alerts",
      icon: "eye",
      name: "Competitor & brand alerts",
      metaTitle: "Competitor price, launch and brand-crisis monitoring — Whenly",
      metaDescription:
        "Know first when a competitor changes pricing, announces a product, or when negative sentiment about your brand starts building. Whenly watches the open web with AI.",
      h1: "See your competitor's move — and your brand's pulse — first",
      answer:
        "Whenly watches your competitors' pricing pages, product and press announcements, hiring signals, and public conversation about your brand; when something noteworthy is detected, you get an instant notification. An intelligence desk that works even without a marketing team.",
      pains: [
        "Noticing a competitor's price change late is direct loss: quotes and forecasts are built on stale numbers.",
        "Job postings are early signals — companies hire for a product months before announcing it.",
        "Crisis research shows most brand crises start outside business hours; the first hours decide the damage.",
      ],
      examples: [
        "Tell me if anything changes on my competitor's pricing page.",
        "Alert me when my competitor publishes a new product or press release.",
        "Notify me if negative sentiment about my brand starts concentrating on public platforms.",
      ],
      faq: [
        {
          q: "Is this ethical?",
          a: "Yes — only public information is watched: the competitor's own published pricing page, press releases, job ads and open conversations. No private data, no closed accounts, and absolutely no tracking of individuals — that is explicitly prohibited in our terms.",
        },
      ],
      related: ["regulation-alerts", "tender-alerts", "price-drop-alerts"],
    },
  ],

  compare: {
    slug: "compare",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — honest comparison",
    metaDescription:
      "Comparing event-monitoring tools: where Whenly, Google Alerts, Visualping and Distill each shine — natural-language rules, AI verification and alarms.",
    h1: "Whenly vs the alternatives, honestly",
    answer:
      'Short answer: if you want to watch ONE specific page for changes, Visualping and Distill are mature tools; if you want an email digest of new content in Google\'s index, Google Alerts is free. Whenly answers a different question: "tell me when this EVENT happens" — no page URL needed, in plain language, AI-verified, with an alarm that rings your phone.',
    intro:
      "We wrote this without tilting the table. Each tool's strength is stated plainly; if you spot something wrong, write to us and we will fix it.",
    tableCaption: "Feature comparison of event-monitoring tools (June 2026)",
    colSelf: "Whenly",
    rows: [
      {
        f: "Core approach",
        self: 'Topic/event-based: a "tell me when" sentence',
        ga: "Keyword: new content entering Google's index",
        vp: "Page-based: changes on a specific URL",
        di: "Page-based: changes on a specific URL",
      },
      {
        f: 'Compound conditions in plain language ("in stock AND under $600")',
        self: "Yes — core feature",
        ga: "No",
        vp: "Limited (area/keyword selection)",
        di: "Limited (selectors/regex, technical setup)",
      },
      {
        f: 'AI verification of "did the event happen"',
        self: "Yes — with confidence score and reasoning",
        ga: "No",
        vp: "Partial (change summaries)",
        di: "No",
      },
      {
        f: "Do you need to know the page URL?",
        self: "No — topics are watched across the open web",
        ga: "No (Google index)",
        vp: "Yes",
        di: "Yes",
      },
      {
        f: "Alarm mode that rings your phone",
        self: "Yes (Pro)",
        ga: "No (email)",
        vp: "No (email/integrations)",
        di: "Partial (in-app sound alerts)",
      },
      {
        f: "Detection transparency",
        self: "Confidence score + source trail on every alert",
        ga: "A list of links",
        vp: "Visual diff",
        di: "Text diff",
      },
      {
        f: "Free plan",
        self: "3 watchers, checks up to hourly",
        ga: "Entirely free",
        vp: "Limited free quota",
        di: "Limited local monitoring",
      },
      {
        f: "Best at",
        self: "Waiting for events: appointments, restocks, results, tenders, regulations",
        ga: "Email digests of new content about a topic",
        vp: "Visual changes on a single page",
        di: "Page diffs for technical users",
      },
    ],
    afterTable:
      'Summary: for "alert me when this page changes", Visualping/Distill are the right choice; for "email me new content", Google Alerts. If your need is "I am waiting for an EVENT and my phone should ring the moment it happens", Whenly was designed for exactly that.',
    faq: [
      {
        q: "Does Whenly replace Google Alerts?",
        a: "They do different jobs: Google Alerts emails you new content that enters Google's index; it doesn't decide whether your event happened. Whenly asks you to define the event, uses AI to evaluate whether it actually occurred, and pushes an instant notification or alarm. Many people use both.",
      },
      {
        q: "Why Whenly over Visualping or Distill?",
        a: 'Those tools are page-based: you must find the URL to watch, and "the page changed" is not always "your event happened". Whenly is topic-based: say "when standard UK visa appointments open in my city" and it looks for the event wherever it surfaces, with AI deciding whether it really opened.',
      },
    ],
  },

  about: {
    slug: "about",
    metaTitle: "About Whenly — who builds it, how it works, what we believe",
    metaDescription:
      "Whenly is an independently built event-monitoring app with a privacy boundary baked into the architecture — honest limits and principles stated openly.",
    h1: "About Whenly",
    paras: [
      "Whenly grew out of a single observation: while waiting for a development that affects their lives, people refresh the same page dozens of times a day — a visa appointment, a medicine restock, an exam result, a tender notice. Software should stand that watch.",
      "The product is shaped by field research: 50 real demands collected from forums, complaint platforms and app-store reviews — from people living the problem, not people imagining an app. The feature list is that demand list.",
      'The architecture rests on two principles. First, a privacy boundary: your free-text intent stays in the personal-data zone, and external search and AI services only ever receive a topic stripped of personal details. Second, honesty: we never write a guarantee we don\'t keep — no second-level alert promises, no "never miss" claims, no zero-false-alarm marketing; every detection is accountable with a confidence score and a source trail.',
      "Whenly is built independently — behind it is not an ad budget but a product distilled from real demand. For questions, corrections and requests, you can always reach us.",
    ],
    factsHeading: "Fact sheet",
    facts: [
      { k: "Product", v: "Whenly — AI-powered event monitoring and alerting app" },
      { k: "Platforms", v: "Web app + Android (same codebase); alerts arrive as phone push" },
      { k: "Languages", v: "11 interface languages, including English and Turkish" },
      { k: "Pricing", v: "Free plan (3 watchers) + Pro subscription" },
      {
        k: "Data principle",
        v: "PII never reaches external services; no selling, no ads, no profiling",
      },
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
      "This text is an exact copy of the canonical version inside the app; if they differ, the in-app version prevails.",
  },
};
