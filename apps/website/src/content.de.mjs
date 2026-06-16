// Deutscher Inhalt — gleiche Prinzipien wie content.tr.mjs / content.en.mjs: WAS es tut
// beschreiben, nicht WIE; nur "prüft öffentliche Webquellen in regelmäßigen Abständen" —
// keine internen Mechaniken oder Strategie auf der Website. Nur wirklich erreichbare
// Szenarien (nichts hinter Login/Passwort/Captcha). Universelle, europataugliche Beispiele
// (EUR). Antwort zuerst, Fragen als H2, kurze Seiten.

/** @typedef {{ q: string, a: string }} Faq */
/** @typedef {{ key: string, slug: string, icon: string, name: string, metaTitle: string,
 *   metaDescription: string, h1: string, answer: string, context: string[],
 *   examples: string[], faq: Faq[], related: string[] }} UseCase */

// Global-first (ADR-096): Wurzelsprache ist EN; DE lebt unter /de als vollständiges Pendant.
export const de = {
  lang: "de",
  prefix: "/de",
  useCaseBase: "/de/anwendungsfaelle",
  langName: "Deutsch",
  otherLangLabel: "English",

  nav: {
    how: "So funktioniert es",
    useCases: "Anwendungsfälle",
    compare: "Vergleich",
    faq: "FAQ",
    about: "Über",
    openApp: "App öffnen",
    menuLabel: "Menü ein-/ausblenden",
    skip: "Zum Inhalt springen",
  },

  footer: {
    tagline:
      "Whenly verfolgt für dich die Entwicklung, die dir wichtig ist, und sagt dir Bescheid, wenn sie eintritt.",
    useCases: "Anwendungsfälle",
    product: "Produkt",
    legal: "Rechtliches",
    privacy: "Datenschutzerklärung",
    terms: "Nutzungsbedingungen",
    contact: "Kontakt",
    forAi: "Für KI-Assistenten: llms.txt",
    langSwitch: "Sprache",
    updated: "Inhalt aktualisiert",
  },

  home: {
    metaTitle: "Whenly — Sag mir Bescheid, wenn es passiert: Monitoring & Alarme",
    metaDescription:
      "Whenly prüft öffentliche Webquellen in regelmäßigen Abständen und benachrichtigt dich — auf Wunsch mit echtem Alarm —, sobald es passiert. Kostenlos starten.",
    heroOverline: "Monitoring- & Alarm-App",
    heroTitle: "Sag mir <em>wann.</em>",
    // Lösung verkaufen (copywriting skill): kein Feature, sondern die Arbeit, die wegfällt — "hör auf zu aktualisieren".
    heroSub:
      "Hör auf, die Seite zu aktualisieren. Sag Whenly in einem einfachen Satz, auf welchen Moment du wartest — den Preisrückgang, den wieder verfügbaren Artikel, das Inserat, die Ankündigung. Whenly prüft öffentliche Webquellen in regelmäßigen Abständen und lässt dein Telefon klingeln, wenn dieser Moment da ist.",
    heroCta: "Kostenlos überwachen",
    heroCtaNote: "Keine Kreditkarte · Funktioniert im Web und am Telefon",
    heroSecondary: "Wie funktioniert es?",
    trust: [
      "Web + Android",
      "11 Oberflächensprachen",
      "Kostenloser Plan — keine Karte",
      "Nur öffentliches Web",
    ],
    phone: {
      watcherLabel: "WIRD ÜBERWACHT",
      watcherText:
        "Sag mir Bescheid, wenn das gewünschte Produkt bei einem offiziellen Händler unter 500 € wieder verfügbar ist",
      watcherMeta: "Prüft in regelmäßigen Abständen",
      notifTitle: "Whenly · jetzt",
      notifText: "Wieder verfügbar: Das Produkt ist erneut unter deinem Zielpreis im Angebot.",
      notifMeta: "Benachrichtigung gesendet",
    },
    howHeading: "Wie funktioniert Whenly?",
    how: [
      {
        icon: "messageSquare",
        t: "Beschreibe, was überwacht werden soll",
        d: 'Schreib einen einfachen Satz wie "Sag mir Bescheid, wenn hier eine 3-Zimmer-Wohnung unter 1.500 € inseriert wird". Keine Formulare, keine Regelsyntax zum Lernen.',
      },
      {
        icon: "refresh",
        t: "Whenly behält es im Blick",
        d: "Es prüft öffentliche Webquellen — Websites, Nachrichten, Ankündigungen — in regelmäßigen Abständen für dich.",
      },
      {
        icon: "bellRing",
        t: "Werde benachrichtigt",
        d: "Sobald das auftaucht, worauf du wartest, bekommst du eine Benachrichtigung; bei kritischen Themen lässt der Alarmmodus dein Telefon klingeln.",
      },
    ],
    // Nutzen zuerst (copywriting skill: benefits over features) — jeder Punkt "was es dir bringt".
    featuresHeading: "Was du bekommst",
    features: [
      {
        icon: "zap",
        t: "Ein Satz ist die ganze Einrichtung",
        d: 'Zusammengesetzte Regeln direkt aus einfachen Worten — "verfügbar UND unter 500 €". Keine Regel-Engine zum Lernen, keine Filter zum Aufbauen.',
      },
      {
        icon: "languages",
        t: "Funktioniert in deiner Sprache",
        d: "Elf Oberflächensprachen. Beschreibe die Überwachung so, wie du sie laut aussprechen würdest.",
      },
      {
        icon: "bellRing",
        t: "Alarmmodus für die kritischen Fälle",
        d: "Manche Momente können nicht in einer stummen Leiste warten: Mit Pro lässt die Benachrichtigung dein Telefon wirklich klingeln.",
      },
      {
        icon: "clock",
        t: "Ruhezeiten, zu deinen Bedingungen",
        d: "Nächtliche Benachrichtigungen warten bis zum Morgen — du bleibst auf dem Laufenden, ohne deinen Schlaf zu opfern.",
      },
      {
        icon: "smartphone",
        t: "Im Web und am Telefon",
        d: "Starte in jedem Browser in einer Minute; es gibt auch eine Android-App. Benachrichtigungen landen auf deinem Telefon.",
      },
      {
        icon: "shieldCheck",
        t: "Standardmäßig privat",
        d: "Keine Werbung, kein Verkauf deiner Daten. Exportiere alles oder lösche es jederzeit endgültig.",
      },
    ],
    pricingHeading: "Die Preise sind einfach",
    pricing: {
      freeName: "Kostenlos",
      freeBullets: [
        "3 aktive Überwachungen",
        "Regelmäßige Prüfungen",
        "Benachrichtigungen + Ruhezeiten",
        "Web und Android",
      ],
      freeCta: "Kostenlos starten",
      proName: "Pro",
      proBadge: "Am beliebtesten",
      proBullets: [
        "100 aktive Überwachungen",
        "Häufigere Prüfungen",
        "Alarmmodus — dein Telefon klingelt",
        "Personalisierung + zusätzliche Optionen",
      ],
      proCta: "In der App upgraden",
      note: "Der kostenlose Plan hat keine zeitliche Begrenzung und verlangt keine Karte. Upgrade auf Pro in der App; jederzeit kündbar.",
    },
    useCasesHeading: "Wofür die Leute es nutzen",
    useCasesSub:
      "Neun echte Aufgaben, die Whenly im öffentlichen Web erledigt — jede davon ein Moment, den man früher verpasst hat.",
    useCasesAll: "Alle Anwendungsfälle ansehen",
    faqHeading: "Häufig gestellte Fragen",
    faq: [
      {
        q: "Was ist Whenly?",
        a: 'Whenly ist eine App, die eine Entwicklung, die du in einfacher Sprache beschreibst (zum Beispiel "Sag mir Bescheid, wenn dieses Produkt wieder verfügbar ist"), für dich verfolgt. Sie prüft öffentliche Webquellen in regelmäßigen Abständen und sendet eine Benachrichtigung oder einen Alarm, sobald das auftaucht, worauf du wartest.',
      },
      {
        q: "Ist Whenly kostenlos?",
        a: "Ja — der kostenlose Plan umfasst 3 aktive Überwachungen ohne zeitliche Begrenzung und ohne Karte. Pro fügt mehr Überwachungen, häufigere Prüfungen und den Alarmmodus hinzu.",
      },
      {
        q: "Welche Quellen kann es überwachen?",
        a: "Öffentlich zugängliche Webquellen: Websites, Nachrichten- und Ankündigungsseiten, Inserate. Es greift nicht auf Portale hinter Logins, persönliche Konten oder Seiten hinter Captchas (Robot-Prüfungen) zu — diese Grenze nennen wir ausdrücklich.",
      },
      {
        q: "Wie schnell benachrichtigt es mich?",
        a: "Whenly prüft Quellen in regelmäßigen Abständen und erfasst eine Entwicklung bei der ersten Prüfung, nachdem sie veröffentlicht wurde. Wir versprechen keine sekundengenauen Benachrichtigungen — Quellen können verspätet veröffentlichen. Behandle eine Benachrichtigung als Signal, es selbst zu überprüfen.",
      },
      {
        q: "Sind meine Daten sicher?",
        a: "Wir verkaufen deine Daten nicht und nutzen sie nicht für Werbung. Du kannst all deine Daten in einem maschinenlesbaren Format herunterladen oder zusammen mit deinem Konto endgültig löschen. Details findest du in der Datenschutzerklärung.",
      },
      {
        q: "Funktioniert es am Telefon oder im Web?",
        a: "Beides. Die Web-App läuft in jedem Browser; es gibt auch eine Android-App. Benachrichtigungen landen auf deinem Telefon, und Pro fügt den Alarmmodus für kritische Überwachungen hinzu.",
      },
      {
        q: "Gibt es eine App, die mich einfach benachrichtigt, wenn online etwas passiert?",
        a: 'Genau das ist Whenlys Aufgabe. Du schreibst das Ereignis in einem Satz — "Sag mir Bescheid, wenn X passiert" — und Whenly prüft öffentliche Webquellen in regelmäßigen Abständen und sendet dann eine Push-Benachrichtigung oder lässt einen Alarm klingeln, sobald es eintritt.',
      },
      {
        q: "Ist Whenly eine KI-App, die das Web für mich überwacht?",
        a: "Ja. Whenly nutzt KI, um deinen Satz in einfacher Sprache in eine Überwachungsabsicht zu übersetzen und zu beurteilen, ob das Gefundene wirklich das von dir beschriebene Ereignis ist. Es liest nur öffentliche Seiten — es meldet sich nie bei Konten an — und das Prüf-Timing ist nach bestem Bemühen, nicht sofort.",
      },
    ],
    ctaHeading: "Lass den Aktualisieren-Knopf los",
    ctaText:
      "Schreib einen Satz und gib die Überwachung ab. Wenn es das nächste Mal passiert, weißt du es als Erstes.",
  },

  useCasesIndex: {
    slug: "anwendungsfaelle",
    metaTitle: "Whenly-Anwendungsfälle — was kannst du überwachen?",
    metaDescription:
      "Von Preisen und Wiederverfügbarkeit über Inserate bis zu Ausschreibungen und Regulierungen: die Monitoring-Szenarien, die Whenly im offenen Web verfolgen kann.",
    h1: "Was kannst du überwachen?",
    intro:
      "Whenly ist themenbasiert: Du musst keine Seiten-URL kennen — du beschreibst, was du erwartest. Alles unten lässt sich auf öffentlich zugänglichen Webquellen verfolgen.",
  },

  /** @type {UseCase[]} */
  useCases: [
    {
      key: "price-drop",
      slug: "preisalarme",
      icon: "trendingDown",
      name: "Preisalarme",
      metaTitle: "App für Preisalarme (Produkte, Flüge, Krypto) — Whenly",
      metaDescription:
        "Werde benachrichtigt, wenn ein Preis deine Schwelle unterschreitet: Produkte, Flüge, Hotels, Krypto und Währungen. Schwellenregeln in einfacher Sprache.",
      h1: "Werde benachrichtigt, wenn der Preis deine Schwelle überschreitet",
      answer:
        'Whenly verfolgt den öffentlichen Preis eines Produkts, Flugs oder Vermögenswerts gegen die von dir festgelegte Schwelle; wird sie überschritten, bekommst du eine Benachrichtigung. Ein Satz richtet es ein — "Sag mir Bescheid, wenn das unter 400 € fällt" — und sowohl Rückgänge als auch Anstiege lassen sich überwachen.',
      context: [
        "Ohne Alarm bedeutet das Abpassen von Rabatten und Angeboten manuelles Nachsehen; gute Angebote sind binnen Stunden vorbei.",
        "Flug- und Hotelpreise ändern sich oft; einen Preis nahe der Schwelle von Hand zu beobachten, kostet Zeit.",
        'Bei Krypto und Devisen ist "als ich es bemerkt habe, war es schon vorbei" häufig — ein Schwellenalarm übernimmt dieses Beobachten für dich.',
      ],
      examples: [
        "Sag mir Bescheid, wenn dieser Staubsauger bei einem großen Händler unter 400 € fällt.",
        "Benachrichtige mich, wenn ein Flug Berlin–Bangkok unter 250 € fällt.",
        "Sag mir Bescheid, wenn Bitcoin über 150.000 € steigt.",
      ],
      faq: [
        {
          q: "Welche Preise kann es überwachen?",
          a: "Alles mit einem öffentlichen Preis: E-Commerce-Produkte, Flüge und Hotels, Krypto- und Wechselkurse. Du gibst die Schwellenregel in einfacher Sprache an.",
        },
        {
          q: "Prüft es ständig?",
          a: "Es prüft in regelmäßigen Abständen. Bei volatilen Preisen nahe der Schwelle sind häufigere Prüfungen ein typischer Grund, Pro zu nutzen.",
        },
      ],
      related: ["wieder-verfuegbar-alarme", "immobilien-alarme", "ticket-alarme"],
    },
    {
      key: "restock",
      slug: "wieder-verfuegbar-alarme",
      icon: "pkg",
      name: "Wieder-verfügbar-Alarme",
      metaTitle: "App für Wieder-verfügbar-Alarme (PS5, GPU, Sneaker) — Whenly",
      metaDescription:
        'Werde benachrichtigt, wenn PS5, GPU oder Sneaker wieder verfügbar sind. Whenly verfolgt öffentliche Verkaufsseiten und versteht "verfügbar UND unter 500 €".',
      h1: "Werde benachrichtigt, wenn ein Produkt wieder verfügbar ist",
      answer:
        'Whenly verfolgt für dich Produkt-Verkaufs- und Ankündigungsseiten; sobald das Produkt bei einem offiziellen Händler wieder im Angebot ist, bekommst du eine Benachrichtigung. Der Unterschied sind zusammengesetzte Bedingungen: Es versteht Regeln wie "wieder verfügbar UND unter 500 €" aus einfacher Sprache.',
      context: [
        "Beliebte Produkte sind nach dem Wiederauffüllen schnell ausverkauft; die Seite von Hand zu aktualisieren bedeutet meist, es zu verpassen.",
        "Mehrere Händler gleichzeitig zu beobachten, kostet Zeit; Whenly übernimmt das für dich.",
        "Verfügbarkeit zusammen mit einer Preisbedingung zu überwachen, ist etwas, das einfache Verfügbarkeits-Alarme nicht können.",
      ],
      examples: [
        "Sag mir Bescheid, wenn die PS5 bei einem offiziellen Händler wieder verfügbar ist.",
        "Benachrichtige mich, wenn die RTX 5090 unter 2.000 € verfügbar ist.",
        "Sag mir Bescheid, wenn diese Sneaker zum Listenpreis wieder in den Verkauf gehen.",
      ],
      faq: [
        {
          q: "Welche Shops kann es überwachen?",
          a: 'Jeden Händler mit öffentlichen Produkt- oder Ankündigungsseiten. Whenly ist themenbasiert, du bist also nicht an eine URL gebunden: Sag "bei einem offiziellen Händler", und es gewichtet Verkaufssignale aus dem offenen Web gemeinsam.',
        },
        {
          q: "Kann es gleichzeitig eine Preisbedingung prüfen?",
          a: 'Ja — zusammengesetzte Bedingungen sind ein Kernmerkmal: "verfügbar UND unter 500 €" wird in einer einzigen Überwachung definiert.',
        },
      ],
      related: ["preisalarme", "ticket-alarme", "ankuendigungs-alarme"],
    },
    {
      key: "rental-listing",
      slug: "immobilien-alarme",
      icon: "home",
      name: "Immobilien-Alarme",
      metaTitle: "Alarme für neue Miet- & Immobilieninserate — Whenly",
      metaDescription:
        "Whenly verfolgt neue Miet- und Immobilieninserate nach deinen Kriterien für Gegend, Preis und Größe und benachrichtigt dich, wenn ein Treffer veröffentlicht wird.",
      h1: "Werde benachrichtigt, wenn ein Inserat deinen Kriterien entspricht",
      answer:
        'Whenly verfolgt öffentliche Immobilien-Inseratsquellen nach deinen Kriterien für Gegend, Preis und Größe; sobald ein passendes neues Inserat veröffentlicht wird, bekommst du eine Benachrichtigung. "Sag mir Bescheid, wenn hier eine 3-Zimmer-Wohnung unter 1.500 € inseriert wird" — das ist die ganze Einrichtung.',
      context: [
        "Fair bepreiste Inserate sind oft am selben Tag vergeben; wer sie zuerst sieht, ist im Vorteil.",
        "Die eigenen Benachrichtigungen der Inseratsportale können verzögert sein, und ihre Filter sind oft zu starr.",
        "Mehrere Gegenden und Bedingungen von Hand abzusuchen, kostet jeden Tag Stunden.",
      ],
      examples: [
        "Sag mir Bescheid, wenn in diesem Viertel eine 3-Zimmer-Wohnung unter 1.500 € inseriert wird.",
        "Benachrichtige mich, wenn in diesen beiden Stadtteilen eine möblierte 2-Zimmer-Wohnung erscheint.",
        "Sag mir Bescheid, wenn in dieser Gegend ein Haus mit 4 Zimmern unter 400.000 € zum Verkauf steht.",
      ],
      faq: [
        {
          q: "Welche Inseratsportale werden überwacht?",
          a: "Öffentliche Quellen, die Inserate veröffentlichen. Whenly ist themenbasiert: Statt sich an ein Portal zu binden, gewichtet es passende offene Inseratssignale gemeinsam.",
        },
        {
          q: "Kann es Gegend und Preis gleichzeitig filtern?",
          a: "Ja — Viertel, Preisobergrenze und Zimmerzahl stehen in einem einzigen Satz.",
        },
      ],
      related: ["preisalarme", "ausschreibungs-alarme", "ankuendigungs-alarme"],
    },
    {
      key: "ticket",
      slug: "ticket-alarme",
      icon: "ticket",
      name: "Veranstaltungsticket-Alarme",
      metaTitle: "Ticket-Verkaufsstart-Alarme: App benachrichtigt dich — Whenly",
      metaDescription:
        "Whenly verfolgt öffentliche Verkaufsstart-Ankündigungen für Konzerte, Spiele und Veranstaltungen und benachrichtigt dich, wenn der Verkauf öffnet.",
      h1: "Werde benachrichtigt, wenn Tickets in den Verkauf gehen",
      answer:
        'Whenly verfolgt für dich öffentliche Verkaufsstart-Ankündigungen und Hinweise auf neue Termine für Konzerte und Veranstaltungen; sobald der Verkauf als geöffnet angekündigt wird, bekommst du eine Benachrichtigung — mit Pro einen Alarm. Steht der Termin noch nicht fest, sag "Sag mir Bescheid, wenn es in den Verkauf geht".',
      context: [
        "Bei beliebten Veranstaltungen bedeutet ein verpasster Verkaufsstart: keine Tickets.",
        "Der Verkaufstermin ist oft nicht im Voraus klar; die Ankündigung von Hand abzupassen, ist schwierig.",
        "Neue Termine und Zusatztermine werden zu zufälligen Zeiten angekündigt.",
      ],
      examples: [
        "Sag mir Bescheid, wenn der Verkaufsstart für diese Tour angekündigt wird.",
        "Benachrichtige mich, wenn für diese Veranstaltung ein Zusatztermin oder eine Zusatzvorstellung angekündigt wird.",
        "Sag mir Bescheid, wenn für dieses Spiel der allgemeine Verkauf angekündigt wird.",
      ],
      faq: [
        {
          q: "Kauft es das Ticket für mich?",
          a: "Nein — Whenly benachrichtigt dich; gekauft wird von dir. Es greift nie auf dein Konto zu und stellt sich nicht für dich in die Warteschlange.",
        },
        {
          q: "Hilft es, wenn der Verkaufstermin noch nicht feststeht?",
          a: 'Ja — sag "Sag mir Bescheid, wenn es in den Verkauf geht", und es verfolgt die öffentlichen Ankündigungs- und Verkaufsseiten-Signale.',
        },
      ],
      related: ["wieder-verfuegbar-alarme", "preisalarme", "ankuendigungs-alarme"],
    },
    {
      key: "tender",
      slug: "ausschreibungs-alarme",
      icon: "gavel",
      name: "Ausschreibungs- & RFP-Alarme",
      metaTitle: "Ausschreibungs- & RFP-Alarme bei Veröffentlichung — Whenly",
      metaDescription:
        "Whenly benachrichtigt dich, wenn eine zu deiner Branche passende öffentliche Ausschreibung oder ein RFP veröffentlicht wird, und verfolgt auch Friständerungen.",
      h1: "Werde benachrichtigt, wenn eine Ausschreibung zu deinem Geschäft passt",
      answer:
        "Whenly verfolgt für dich öffentliche Vergabebekanntmachungen, Korrektur-/Änderungsbekanntmachungen und private RFP-Ankündigungen; sobald eine neue Bekanntmachung oder Änderung veröffentlicht wird, die deinen Kriterien entspricht, bekommst du eine Benachrichtigung.",
      context: [
        "Die Bekanntmachung zu finden, ist leicht; die spätere Änderung (Nachtrag, Termin) nicht zu verpassen, ist der schwierige Teil.",
        "Auf passiv geprüften Portalen werden neue Bekanntmachungen erst Tage später entdeckt; wer früh hinsieht, gewinnt.",
        "Die Abgabefrist zu verpassen, bedeutet den direkten Ausschluss.",
      ],
      examples: [
        "Sag mir Bescheid, wenn in meiner Region eine Ausschreibung für Baumaterialien veröffentlicht wird.",
        "Benachrichtige mich, wenn sich bei einer von mir verfolgten Ausschreibung die Frist oder ein Nachtrag ändert.",
        "Erinnere mich 48 Stunden vor der Abgabefrist dieses RFP.",
      ],
      faq: [
        {
          q: "Verbindet es sich mit meinem Konto?",
          a: "Nein — es überwacht öffentliche Bekanntmachungs- und Ankündigungsseiten; es greift nie auf Bildschirme hinter Logins zu. Den offiziellen Text liest du an der Quelle.",
        },
        {
          q: "Erinnert es mich an Fristen?",
          a: 'Ja — zeitbasierte Regeln wie "Erinnere mich 2 Tage vor der Frist" lassen sich definieren.',
        },
      ],
      related: ["foerderungs-alarme", "regulierungs-alarme", "wettbewerber-alarme"],
    },
    {
      key: "grant",
      slug: "foerderungs-alarme",
      icon: "coins",
      name: "Förder- & Zuschussalarme",
      metaTitle: "App für Förderaufruf-Alarme (Horizon Europe, grants.gov) — Whenly",
      metaDescription:
        "Whenly verfolgt öffentliche Förderankündigungen und benachrichtigt dich, wenn ein Aufruf öffnet und während sich Fristen nähern — auch bei Horizon Europe.",
      h1: "Werde benachrichtigt, wenn ein Förderaufruf öffnet",
      answer:
        "Whenly verfolgt für dich öffentliche Förder- und Zuschussankündigungen; sobald ein Antragsfenster öffnet — und erneut, während sich die Frist nähert — bekommst du eine Benachrichtigung. Beschreibe die für dich passende Quelle in einem Satz.",
      context: [
        "Manche Aufrufe schließen früh, wenn die Mittel aufgebraucht sind; am sichersten ist es, gleich bei Öffnung zu beantragen.",
        "Viele Programme haben nur einen Aufruf pro Jahr; wer ihn verpasst, wartet lange.",
        "Die Frist zu verpassen, bedeutet in den meisten Programmen die direkte Ablehnung.",
      ],
      examples: [
        "Sag mir Bescheid, wenn ein F&E-Förderaufruf öffnet.",
        "Benachrichtige mich, wenn ein neues Förderprogramm angekündigt wird.",
        "Sag mir Bescheid, wenn dieser Aufruf öffnet, und erinnere mich eine Woche vor der Frist.",
      ],
      faq: [
        {
          q: "Erinnert es mich an Fristen?",
          a: 'Ja — beobachte die Öffnung und die Frist mit einer Überwachung: "Sag mir Bescheid, wenn der Aufruf öffnet" plus "Erinnere mich eine Woche vor der Frist".',
        },
        {
          q: "Welche Förderquellen kann es überwachen?",
          a: "Jedes Programm mit öffentlichen Ankündigungen: nationale Agenturen, Ministeriumsförderungen, EU-Programme, Stiftungszuschüsse. Ergänze deine Branche und die Förderfähigkeit im Satz.",
        },
      ],
      related: ["ausschreibungs-alarme", "regulierungs-alarme", "ankuendigungs-alarme"],
    },
    {
      key: "regulation",
      slug: "regulierungs-alarme",
      icon: "scale",
      name: "Regulierungs-Alarme",
      metaTitle: "Regulierungs-Alarme bei Änderungen (DSGVO, NIS2) — Whenly",
      metaDescription:
        "Werde benachrichtigt, wenn eine dich betreffende Verordnung, Richtlinie oder Entscheidung erscheint. Whenly verfolgt amtliche Verkündungsblätter und Behörden.",
      h1: "Werde benachrichtigt, wenn sich eine dich betreffende Regulierung ändert",
      answer:
        "Whenly verfolgt amtliche Verkündungsblätter und Behördenankündigungen innerhalb des von dir definierten Themas; sobald eine Verordnung, Bekanntmachung oder Entscheidung veröffentlicht wird, die dich betrifft, bekommst du eine Benachrichtigung.",
      context: [
        "Amtliche Verkündungsblätter erscheinen täglich; das eine relevante Element von Hand herauszufiltern, ist nicht skalierbar.",
        "Eine Änderung spät zu bemerken, birgt das Risiko von Compliance-Strafen oder unerwarteten Kosten.",
        "Die Ankündigungen mehrerer Behörden gleichzeitig zu beobachten, kostet Zeit.",
      ],
      examples: [
        "Sag mir Bescheid, wenn im amtlichen Verkündungsblatt eine Verordnung veröffentlicht wird, die meine Branche betrifft.",
        "Benachrichtige mich, wenn die Behörde eine neue Bekanntmachung oder Entscheidung veröffentlicht.",
        "Sag mir Bescheid, wenn eine Änderung des Zolltarifs meine Produktgruppe betrifft.",
      ],
      faq: [
        {
          q: "Ist das ein Ersatz für rechtliche Beratung?",
          a: "Nein — Whenly ist die Frühwarnschicht: Es sorgt dafür, dass du die Änderung zuerst siehst; die Auslegung übernimmt deine Beraterin oder dein Berater. Du gehst von der Benachrichtigung zur Quelle und liest sie selbst.",
        },
        {
          q: "Nur die Regulierungen eines Landes?",
          a: "Nein — jede Behörde mit öffentlichen Ankündigungen lässt sich beobachten: EU-Richtlinien, Branchenbehörden, Normungsgremien. Land und Thema in deinem Satz definieren die Überwachung.",
        },
      ],
      related: ["ausschreibungs-alarme", "wettbewerber-alarme", "foerderungs-alarme"],
    },
    {
      key: "competitor",
      slug: "wettbewerber-alarme",
      icon: "eye",
      name: "Wettbewerber- & Marken-Alarme",
      metaTitle: "Monitoring von Wettbewerberpreisen, -launches und Marke — Whenly",
      metaDescription:
        "Erfahre, wenn ein Wettbewerber die Preise ändert, ein Produkt ankündigt oder über deine Marke öffentlich gesprochen wird. Whenly verfolgt das offene Web für dich.",
      h1: "Sieh den Zug deines Wettbewerbers und den Puls deiner Marke",
      answer:
        "Whenly verfolgt die öffentlichen Preisseiten deiner Wettbewerber, deren Produkt- und Pressemitteilungen sowie öffentliche Gespräche über deine Marke; sobald etwas Erwähnenswertes veröffentlicht wird, bekommst du eine Benachrichtigung.",
      context: [
        "Eine Preisänderung eines Wettbewerbers spät zu bemerken, bedeutet, dass deine Angebote und Prognosen auf veralteten Daten beruhen.",
        "Verpasste Produkt- und Pressemitteilungen bedeuten, von einem Marktschritt zu spät zu erfahren.",
        "Negative Gespräche über deine Marke früh zu erkennen, gibt dir die Chance, zu reagieren, bevor sie größer werden.",
      ],
      examples: [
        "Sag mir Bescheid, wenn sich auf der öffentlichen Preisseite meines Wettbewerbers etwas ändert.",
        "Benachrichtige mich, wenn mein Wettbewerber ein neues Produkt oder eine Pressemitteilung veröffentlicht.",
        "Sag mir Bescheid, wenn über meine Marke auf öffentlichen Plattformen negativ gesprochen wird.",
      ],
      faq: [
        {
          q: "Ist das ethisch?",
          a: "Ja — überwacht werden nur öffentliche Informationen: die selbst veröffentlichte Preisseite des Wettbewerbers, Pressemitteilungen und offene Gespräche. Keine privaten Daten, keine geschlossenen Konten und keine Verfolgung von Einzelpersonen — das ist in unseren Bedingungen ausdrücklich untersagt.",
        },
        {
          q: "Was umfasst das Markenmonitoring?",
          a: "Öffentliche Inhalte, die deine Marke erwähnen: Nachrichten, Foren, öffentliche Beiträge.",
        },
      ],
      related: ["regulierungs-alarme", "ausschreibungs-alarme", "preisalarme"],
    },
    {
      key: "announcement",
      slug: "ankuendigungs-alarme",
      icon: "megaphone",
      name: "Ankündigungs- & Seiten-Alarme",
      metaTitle: "App-Alarm, wenn eine Seite etwas Neues veröffentlicht — Whenly",
      metaDescription:
        "Werde benachrichtigt, wenn eine Seite, der du folgst, eine neue Ankündigung, Ergebnisliste oder Aktualisierung veröffentlicht. Whenly aktualisiert für dich.",
      h1: "Werde benachrichtigt, wenn eine Seite etwas Neues veröffentlicht",
      answer:
        "Whenly prüft für dich eine öffentliche Seite oder ein Thema, dem du folgst; sobald eine neue Ankündigung, Ergebnisliste oder erwähnenswerte Aktualisierung veröffentlicht wird, bekommst du eine Benachrichtigung. Du hörst auf, dieselbe Seite immer wieder zu aktualisieren.",
      context: [
        "Dieselbe Seite dutzende Male am Tag zu aktualisieren, während du auf eine Ankündigung wartest, ist verschwendete Zeit.",
        "Wichtige Aktualisierungen werden oft still veröffentlicht; sie entgehen dir in dem Moment, in dem du wegsiehst.",
        "Mehrere Quellen gleichzeitig zu beobachten, ist von Hand nicht durchzuhalten.",
      ],
      examples: [
        "Sag mir Bescheid, wenn eine Seite, der ich folge, eine neue Ankündigung veröffentlicht.",
        "Benachrichtige mich, wenn die Ergebnisliste, auf die ich warte, öffentlich veröffentlicht wird.",
        "Sag mir Bescheid, wenn diese Website ihre Preise oder Bedingungen aktualisiert.",
      ],
      faq: [
        {
          q: "Überwacht es Seiten hinter einem Login?",
          a: "Nein — nur öffentliche Seiten, die keinen Login, kein Passwort und kein Captcha erfordern. Ein Ergebnis in deinem persönlichen Konto prüfst du selbst; Whenly verschafft dir das richtige Timing.",
        },
        {
          q: "Überwacht es eine bestimmte Seite?",
          a: "Es kann sowohl eine bestimmte Seite als auch ein Thema überwachen: Gib eine URL an oder beschreibe einfach, was du erwartest.",
        },
      ],
      related: ["regulierungs-alarme", "preisalarme", "wieder-verfuegbar-alarme"],
    },
  ],

  compare: {
    slug: "vergleich",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — Vergleich",
    metaDescription:
      "Vergleich von Monitoring-Tools: wo Whenly, Google Alerts, Visualping und Distill glänzen — Regeln in natürlicher Sprache, zusammengesetzte Bedingungen und Alarme.",
    h1: "Whenly vs die Alternativen",
    answer:
      'Kurze Antwort: Um EINE bestimmte Seite auf Änderungen zu überwachen, sind Visualping und Distill ausgereifte Tools; für eine E-Mail-Zusammenfassung neuer Inhalte ist Google Alerts kostenlos. Whenly beantwortet eine andere Frage: "Sag mir Bescheid, wenn dieses EREIGNIS passiert" — ohne Seiten-URL, in einfacher Sprache, mit zusammengesetzten Bedingungen und einem Alarm, der dein Telefon klingeln lässt.',
    intro:
      "Wir haben das geschrieben, ohne den Tisch zu kippen. Die Stärke jedes Tools wird klar benannt; wenn dir etwas Falsches auffällt, schreib uns, und wir korrigieren es.",
    tableCaption: "Funktionsvergleich von Monitoring-Tools",
    colSelf: "Whenly",
    rows: [
      {
        f: "Grundansatz",
        self: '"Sag mir Bescheid, wenn"-Satz (themen-/ereignisbasiert)',
        ga: "Schlüsselwort: neue Inhalte",
        vp: "Änderungen an einer bestimmten URL",
        di: "Änderungen an einer bestimmten URL",
      },
      {
        f: 'Zusammengesetzte Bedingungen in einfacher Sprache ("verfügbar UND unter 500 €")',
        self: "Ja — Kernmerkmal",
        ga: "Nein",
        vp: "Eingeschränkt",
        di: "Eingeschränkt (technische Einrichtung)",
      },
      {
        f: "Muss man die Seiten-URL kennen?",
        self: "Nein — Themen werden überwacht",
        ga: "Nein",
        vp: "Ja",
        di: "Ja",
      },
      {
        f: "Alarmmodus, der dein Telefon klingeln lässt",
        self: "Ja (Pro)",
        ga: "Nein (E-Mail)",
        vp: "Nein",
        di: "Teilweise",
      },
      {
        f: "Einrichtung in deiner eigenen Sprache (11)",
        self: "Ja",
        ga: "Teilweise",
        vp: "Teilweise",
        di: "Teilweise",
      },
      {
        f: "Kostenloser Plan",
        self: "3 Überwachungen",
        ga: "Vollständig kostenlos",
        vp: "Begrenztes Kontingent",
        di: "Begrenzt",
      },
      {
        f: "Am besten geeignet für",
        self: "Auf Ereignisse warten: Preise, Wiederverfügbarkeit, Inserate, Ausschreibungen, Regulierungen",
        ga: "Neue Inhalte zu einem Thema",
        vp: "Visuelle Änderungen auf einer einzelnen Seite",
        di: "Seiten-Diffs für technische Nutzer",
      },
    ],
    afterTable:
      'Zusammengefasst: Für "Benachrichtige mich, wenn sich diese Seite ändert" sind Visualping/Distill die richtige Wahl; für "Schick mir neue Inhalte per E-Mail" Google Alerts. Wenn dein Bedarf "Ich warte auf ein EREIGNIS, und mein Telefon soll in dem Moment klingeln, in dem es passiert" lautet, wurde Whenly genau dafür entwickelt.',
    // Wettbewerberbasierte Tiefenvergleiche (GEO/ADR-097) — gleiche Slugs wie EN.
    toolsHeading: "Eins gegen eins, ein Tool nach dem anderen",
    strengthsHeading: "Wo {name} stark ist",
    whenHeading: "Wann Whenly besser passt",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026): Alarme statt E-Mail-Digest",
        metaDescription:
          "Google Alerts mailt neue Inhalte zu einem Schlüsselwort; Whenly wartet auf das von dir beschriebene Ereignis und lässt dein Telefon klingeln, wenn es passiert.",
        h1: "Whenly vs Google Alerts",
        answer:
          'Google Alerts ist kostenlos und mailt dir, wenn neue Inhalte ein Schlüsselwort erwähnen. Whenly beantwortet eine andere Frage: Du beschreibst ein Ereignis mit Bedingungen — "Sag mir Bescheid, wenn es unter 400 € fällt" — und es sendet eine Benachrichtigung oder lässt einen Alarm klingeln, wenn dieses Ereignis eintritt. Viele Leute nutzen beides.',
        strengths: [
          "Völlig kostenlos, ohne Kontingente, an die man denken müsste",
          "Gestützt auf Googles Index — breite Abdeckung von Nachrichten und dem offenen Web",
          "E-Mail-Zusammenfassungen lassen sich einmal am Tag leicht überfliegen",
        ],
        whenWhenly: [
          "Du wartest auf ein EREIGNIS mit einer Bedingung (Preis unter X, wieder verfügbar) — nicht auf einen Strom von Artikeln",
          "Du brauchst eine Push-Benachrichtigung oder einen echten Alarm, keine E-Mail-Zusammenfassung",
          "Du willst zusammengesetzte Regeln in einfacher Sprache, in 11 Oberflächensprachen",
        ],
        faq: [
          {
            q: "Ersetzt Whenly Google Alerts?",
            a: "Sie erledigen unterschiedliche Aufgaben. Google Alerts eignet sich gut, um die Berichterstattung zu einem Thema per E-Mail zu verfolgen. Whenly ist dafür gebaut, einen bestimmten Moment abzupassen — es versteht Schwellen und lässt dein Telefon klingeln. Viele Leute behalten beides.",
          },
          {
            q: "Ist Whenly kostenlos wie Google Alerts?",
            a: "Whenlys kostenloser Plan umfasst 3 aktive Überwachungen ohne zeitliche Begrenzung und ohne Karte. Pro fügt mehr Überwachungen, häufigere Prüfungen und den Alarmmodus hinzu.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026): Seiten-Diffs vs Ereignis-Alarme",
        metaDescription:
          "Visualping ist stark bei visueller Änderungserkennung auf einer Seite. Whenly ist themenbasiert: Beschreibe das Ereignis und bekomme einen Alarm.",
        h1: "Whenly vs Visualping",
        answer:
          "Visualping ist ein ausgereiftes Tool zur Änderungserkennung: Gib ihm eine URL, und es zeigt visuelle Diffs dieser Seite. Whenly beginnt am anderen Ende — du beschreibst das Ereignis in einfacher Sprache, ohne URL, und es sendet eine Benachrichtigung oder lässt einen Alarm klingeln, wenn das Ereignis auf öffentlichen Quellen auftaucht.",
        strengths: [
          "Starke visuelle Seiten-Diff-Engine mit Screenshots und Hervorhebung der Änderungen",
          "Ausgereifte, weit verbreitete Browser-Erweiterung und Web-App",
          "Gut geeignet, wenn du genau weißt, welche Seite du überwachen willst",
        ],
        whenWhenly: [
          "Du beschreibst lieber das Ergebnis, als nach der richtigen URL zu suchen",
          'Du willst zusammengesetzte Bedingungen in einfacher Sprache — "verfügbar UND unter 500 €"',
          "Du willst eine mobile-first App mit Alarmmodus; Stand Mitte 2026 bietet Visualping keine Android-App bei Google Play an (sag uns Bescheid, falls sich das ändert, und wir korrigieren es)",
        ],
        faq: [
          {
            q: "Ist Whenly eine Visualping-Alternative?",
            a: 'Für visuelle Diffs auf Seitenebene bleibt Visualping eine starke Wahl. Wenn dein Bedarf "Sag mir Bescheid, wenn dieses Ereignis passiert" lautet — mit Bedingungen, auf deinem Telefon, mit Alarm — ist Whenly genau dafür gebaut.',
          },
          {
            q: "Muss ich Whenly eine URL geben?",
            a: "Nein. Du kannst eine angeben, aber ein einfacher Satz genügt; Whenly gewichtet passende öffentliche Websignale gemeinsam.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026): ein ehrlicher Vergleich",
        metaDescription:
          "Distill bietet feingranulares Seiten-Monitoring für technische Nutzer. Whenly tauscht Selektoren gegen einfache Sprache, Alarmmodus und ein mobile-first Erlebnis.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "Distill ist ein leistungsstarker Seiten-Monitor für technische Nutzer: Wähle Elemente mit Selektoren aus, führe lokale oder Cloud-Prüfungen aus, justiere alles fein. Whenly geht den entgegengesetzten Weg — ein einfacher Satz, keine Selektoren, Ereigniserkennung im öffentlichen Web mit Benachrichtigungen und einem echten Alarm auf deinem Telefon.",
        strengths: [
          "Auswahl auf Elementebene gibt präzise Kontrolle darüber, was als Änderung zählt",
          "Lokale Monitoring-Optionen sprechen datenschutzbewusste technische Nutzer an",
          "Flexible Zeitplanung und Bedingungen für Power-User",
        ],
        whenWhenly: [
          "Du willst keine Selektoren pflegen, die brechen, wenn eine Website ihr Layout ändert",
          "Du beschreibst das Ereignis lieber, als es zu konfigurieren",
          "Du willst Alarmmodus und ein telefonzentriertes Erlebnis in 11 Sprachen",
        ],
        faq: [
          {
            q: "Ist Whenly einfacher einzurichten als Distill?",
            a: "Ja, ganz bewusst: Die Einrichtung ist ein Satz. Der Kompromiss ist weniger feingranulare Kontrolle als bei selektorbasierten Tools — Power-User bevorzugen für Diffs auf Seitenelement-Ebene vielleicht weiterhin Distill.",
          },
          {
            q: "Kann Whenly eine bestimmte Seite überwachen wie Distill?",
            a: "Ja — gib ihm eine URL oder beschreibe einfach das Thema. Whenly überwacht nur öffentliche Seiten und nennt diese Grenze klar.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Ersetzt Whenly Google Alerts?",
        a: "Sie erledigen unterschiedliche Aufgaben: Google Alerts mailt dir neue Inhalte. Whenly bittet dich, das Ereignis zu definieren, und sendet eine Benachrichtigung oder einen Alarm, wenn es passiert. Viele Leute nutzen beides.",
      },
      {
        q: "Warum Whenly statt Visualping oder Distill?",
        a: 'Diese Tools sind seitenbasiert: Du musst die zu überwachende URL finden. Whenly ist themenbasiert: Sag "wenn das passiert", und es sucht die Entwicklung, wo immer sie auftaucht, mit zusammengesetzten Bedingungen und einem Alarm.',
      },
    ],
  },

  about: {
    slug: "ueber",
    metaTitle: "Über Whenly — was es tut, für wen es ist",
    metaDescription:
      "Whenly ist eine unabhängige App, die die Entwicklung, die dir wichtig ist, für dich verfolgt. Wir sagen klar, was es tut und wo seine Grenzen liegen.",
    h1: "Über Whenly",
    paras: [
      "Whenly entstand aus einer einfachen Idee: Du solltest nicht ständig dieselbe Seite aktualisieren müssen, während du auf eine Entwicklung wartest, die dich betrifft. Software kann diese Wache übernehmen.",
      "Du beschreibst in deinen eigenen Worten, was du überwachen willst; Whenly prüft für dich öffentliche Webquellen in regelmäßigen Abständen und sendet eine Benachrichtigung — oder einen Alarm —, sobald das auftaucht, worauf du wartest.",
      'Wir halten an zwei Grundsätzen fest. Erstens Datenschutz: Wir verkaufen deine Daten nicht und nutzen sie nicht für Werbung; du kannst sie jederzeit herunterladen oder endgültig löschen. Zweitens Ehrlichkeit: Wir schreiben keine Garantie, die wir nicht halten können — keine sekundengenauen Versprechen, keine "verpasse nie etwas"-Aussagen — und wir sagen klar, dass wir nicht auf Seiten hinter Logins oder Captchas zugreifen.',
      "Whenly wird unabhängig entwickelt. Für Fragen, Korrekturen und Wünsche kannst du uns jederzeit erreichen.",
    ],
    factsHeading: "Datenblatt",
    facts: [
      { k: "Produkt", v: "Whenly — Monitoring- und Alarm-App" },
      { k: "Plattformen", v: "Web-App + Android; Benachrichtigungen landen auf deinem Telefon" },
      { k: "Sprachen", v: "11 Oberflächensprachen, darunter Englisch und Türkisch" },
      { k: "Preise", v: "Kostenloser Plan (3 Überwachungen) + Pro-Abonnement" },
      {
        k: "Datengrundsatz",
        v: "Nie verkauft, keine Werbung; jederzeit herunterladen oder löschen",
      },
      { k: "Kontakt", v: "__EMAIL__" },
    ],
  },

  notFound: {
    metaTitle: "Seite nicht gefunden — Whenly",
    h1: "Diese Seite existiert nicht",
    text: "Die gesuchte Seite wurde möglicherweise verschoben oder hat nie existiert. Mach von der Startseite aus weiter.",
    cta: "Zurück zur Startseite",
  },

  legalCommon: {
    updatedLabel: "Zuletzt aktualisiert",
    versionLabel: "Version",
    canonicalNote:
      "Dieser Text ist eine Kopie der Version in der App; bei Abweichungen gilt die Version in der App.",
    translatedNote: "Die rechtlich verbindliche Fassung dieses Dokuments ist der englische Text.",
  },

  /** Gemeinsame Strings der Anwendungsfall-Seiten — kein Ternary/manuelles Mapping im Render (Single Source). */
  ucStrings: {
    context: "Wo es hilft",
    examples: "So sagst du es Whenly",
    exHint: "Kopiere einen Satz und füge ihn in der App ein — deine Überwachung ist bereit.",
    related: "Verwandte Anwendungsfälle",
    faq: "Häufige Fragen",
    copy: "Kopieren",
    copied: "Kopiert",
  },
};
