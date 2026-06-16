// Contenido en español — mismos principios que content.en.mjs: describe QUÉ hace, no CÓMO;
// solo "comprueba fuentes públicas a intervalos regulares" — sin mecánica interna ni estrategia
// en el sitio. Solo escenarios realmente alcanzables (nada tras inicio de sesión/captcha).
// Ejemplos universales (no atados a un solo país). Respuesta primero, H2 en pregunta, páginas cortas.

// Global-first (ADR-096): EN es el idioma raíz (/) — el sitio no parece "específico de un país";
// ES vive bajo /es como equivalente completo. La versión legalmente vinculante es el texto en inglés.
export const es = {
  lang: "es",
  prefix: "/es",
  useCaseBase: "/es/casos-de-uso",
  langName: "Español",
  otherLangLabel: "English",

  nav: {
    how: "Cómo funciona",
    useCases: "Casos de uso",
    compare: "Comparativa",
    faq: "Preguntas frecuentes",
    about: "Acerca de",
    openApp: "Abrir la app",
    menuLabel: "Alternar menú",
    skip: "Saltar al contenido",
  },

  footer: {
    tagline: "Whenly sigue por ti la novedad que te importa y te avisa cuando ocurre.",
    useCases: "Casos de uso",
    product: "Producto",
    legal: "Legal",
    privacy: "Política de privacidad",
    terms: "Términos del servicio",
    contact: "Contacto",
    forAi: "Para asistentes de IA: llms.txt",
    langSwitch: "Idioma",
    updated: "Contenido actualizado",
  },

  home: {
    metaTitle: "Whenly — Avísame cuando ocurra: monitorización y alertas",
    metaDescription:
      'Di "avísame cuando esto ocurra": Whenly comprueba fuentes web públicas a intervalos y te avisa —con una alarma real si quieres— en cuanto aparece. Empieza gratis.',
    heroOverline: "App de monitorización y alertas",
    heroTitle: "Avísame <em>cuándo.</em>",
    // Vende la solución (skill de copywriting): no la función del producto, sino la tarea de la que te libras — "deja de recargar".
    heroSub:
      "Deja de recargar la página. Cuéntale a Whenly el momento que esperas —la bajada de precio, la reposición, el anuncio inmobiliario, la publicación— en una sola frase sencilla. Comprueba fuentes web públicas a intervalos regulares y hace sonar tu teléfono cuando ese momento llega.",
    heroCta: "Empieza a vigilar gratis",
    heroCtaNote: "Sin tarjeta · Funciona en web y en el teléfono",
    heroSecondary: "¿Cómo funciona?",
    trust: [
      "Web + Android",
      "11 idiomas de interfaz",
      "Plan gratis — sin tarjeta",
      "Solo web pública",
    ],
    phone: {
      watcherLabel: "VIGILANDO",
      watcherText:
        "Avísame cuando el producto que quiero vuelva a estar disponible por menos de 500 € en una tienda oficial",
      watcherMeta: "Comprueba a intervalos regulares",
      notifTitle: "Whenly · ahora",
      notifText:
        "De nuevo disponible: el producto vuelve a venderse por debajo de tu precio objetivo.",
      notifMeta: "Notificación enviada",
    },
    howHeading: "¿Cómo funciona Whenly?",
    how: [
      {
        icon: "messageSquare",
        t: "Describe qué vigilar",
        d: 'Escribe una frase sencilla como "avísame cuando se publique aquí un piso de 2 habitaciones por menos de 1.500 €". Sin formularios ni sintaxis de reglas que aprender.',
      },
      {
        icon: "refresh",
        t: "Whenly se mantiene vigilando",
        d: "Comprueba por ti fuentes web públicas —sitios, noticias, publicaciones— a intervalos regulares.",
      },
      {
        icon: "bellRing",
        t: "Recibe el aviso",
        d: "Cuando aparece lo que esperabas, recibes una notificación; para temas críticos, el modo alarma hace sonar tu teléfono.",
      },
    ],
    // Beneficio primero (skill de copywriting: beneficios sobre funciones) — cada punto es "qué ganas tú".
    featuresHeading: "Lo que obtienes",
    features: [
      {
        icon: "zap",
        t: "Una frase es toda la configuración",
        d: 'Reglas compuestas directamente desde palabras sencillas — "disponible Y por menos de 500 €". Sin motor de reglas que aprender, sin filtros que construir.',
      },
      {
        icon: "languages",
        t: "Funciona en tu idioma",
        d: "Once idiomas de interfaz. Describe la vigilancia tal como lo dirías en voz alta.",
      },
      {
        icon: "bellRing",
        t: "Modo alarma para lo crítico",
        d: "Algunos momentos no pueden esperar en una bandeja silenciosa: con Pro, el aviso hace que tu teléfono suene de verdad.",
      },
      {
        icon: "clock",
        t: "Horas de silencio, según tus reglas",
        d: "Los avisos nocturnos esperan hasta la mañana — mantienes la cobertura sin renunciar a tu descanso.",
      },
      {
        icon: "smartphone",
        t: "En web y en el teléfono",
        d: "Empieza en cualquier navegador en un minuto; también hay app de Android. Los avisos llegan a tu teléfono.",
      },
      {
        icon: "shieldCheck",
        t: "Privado por defecto",
        d: "Sin anuncios, sin vender tus datos. Exporta todo o elimínalo de forma permanente, cuando quieras.",
      },
    ],
    pricingHeading: "El precio es sencillo",
    pricing: {
      freeName: "Gratis",
      freeBullets: [
        "3 vigilancias activas",
        "Comprobaciones regulares",
        "Notificaciones + horas de silencio",
        "Web y Android",
      ],
      freeCta: "Empieza gratis",
      proName: "Pro",
      proBadge: "El más popular",
      proBullets: [
        "100 vigilancias activas",
        "Comprobaciones más frecuentes",
        "Modo alarma — tu teléfono suena",
        "Personalización + opciones extra",
      ],
      proCta: "Mejora a Pro en la app",
      note: "El plan gratis no tiene límite de tiempo y no pide tarjeta. Mejora a Pro dentro de la app; cancela cuando quieras.",
    },
    useCasesHeading: "Para qué lo usa la gente",
    useCasesSub:
      "Nueve tareas reales que Whenly hace en la web pública — cada una, un momento que la gente solía perderse.",
    useCasesAll: "Ver todos los casos de uso",
    faqHeading: "Preguntas frecuentes",
    faq: [
      {
        q: "¿Qué es Whenly?",
        a: 'Whenly es una app que sigue por ti una novedad que describes en lenguaje sencillo (por ejemplo, "avísame cuando este producto vuelva a estar disponible"). Comprueba fuentes web públicas a intervalos regulares y envía una notificación o alarma cuando aparece lo que esperabas.',
      },
      {
        q: "¿Es gratis Whenly?",
        a: "Sí — el plan gratis incluye 3 vigilancias activas, sin límite de tiempo y sin tarjeta. Pro añade más vigilancias, comprobaciones más frecuentes y modo alarma.",
      },
      {
        q: "¿Qué fuentes puede vigilar?",
        a: "Fuentes web disponibles públicamente: sitios, páginas de noticias y publicaciones, anuncios. No accede a portales tras inicio de sesión, cuentas personales ni páginas tras captchas (verificaciones de robot) — lo indicamos de forma explícita.",
      },
      {
        q: "¿Con qué rapidez me avisa?",
        a: "Whenly comprueba las fuentes a intervalos regulares y detecta una novedad en la primera comprobación tras su publicación. No prometemos avisos al segundo — las fuentes pueden publicar con retraso. Toma una notificación como una señal para verificarlo tú mismo.",
      },
      {
        q: "¿Están seguros mis datos?",
        a: "No vendemos tus datos ni los usamos para anuncios. Puedes descargar todos tus datos en un formato legible por máquina o eliminarlos de forma permanente junto con tu cuenta. Los detalles están en la Política de privacidad.",
      },
      {
        q: "¿Funciona en el teléfono o en la web?",
        a: "Ambos. La app web funciona en cualquier navegador; también hay app de Android. Los avisos llegan a tu teléfono, y Pro añade el modo alarma para las vigilancias críticas.",
      },
      {
        q: "¿Existe una app que me avise cuando algo ocurre en internet?",
        a: 'Ese es justo el trabajo de Whenly. Escribes el evento en una frase — "avísame cuando ocurra X" — y Whenly comprueba fuentes web públicas a intervalos regulares y luego envía una notificación push o hace sonar una alarma cuando sucede.',
      },
      {
        q: "¿Es Whenly una app de IA que monitoriza la web por mí?",
        a: "Sí. Whenly usa IA para convertir tu frase en lenguaje sencillo en una intención de monitorización y para juzgar si lo que encuentra es realmente el evento que describiste. Solo lee páginas públicas — nunca inicia sesión en cuentas — y el momento de la comprobación es el mejor posible, no instantáneo.",
      },
    ],
    ctaHeading: "Suelta el botón de recargar",
    ctaText:
      "Escribe una frase y delega la vigilancia. La próxima vez que ocurra, lo sabrás primero.",
  },

  useCasesIndex: {
    slug: "casos-de-uso",
    metaTitle: "Casos de uso de Whenly — ¿qué puedes vigilar?",
    metaDescription:
      "Desde precios y reposiciones hasta anuncios inmobiliarios, licitaciones y normativa: los escenarios de monitorización que Whenly puede seguir en la web abierta.",
    h1: "¿Qué puedes vigilar?",
    intro:
      "Whenly se basa en temas: no necesitas conocer la URL de una página — describes lo que esperas que ocurra. Todo lo de abajo puede seguirse en fuentes web disponibles públicamente.",
  },

  useCases: [
    {
      key: "price-drop",
      slug: "alertas-de-bajada-de-precio",
      icon: "trendingDown",
      name: "Alertas de bajada de precio",
      metaTitle: "Alertas de bajada de precio (productos, vuelos, cripto) — Whenly",
      metaDescription:
        "Recibe un aviso cuando un precio cruza tu umbral: productos de e-commerce, vuelos, hoteles, cripto y divisas. Whenly entiende reglas de umbral en lenguaje sencillo.",
      h1: "Recibe un aviso cuando el precio cruza tu umbral",
      answer:
        'Whenly sigue el precio público de un producto, vuelo o activo frente al umbral que fijas; cuando lo cruza, recibes una notificación. Una sola frase lo configura — "avísame cuando esto baje de 400 €" — y se pueden vigilar tanto las bajadas como las subidas.',
      context: [
        "Sin una alerta, pillar descuentos y ofertas significa comprobar a mano; las buenas ofertas se cierran en horas.",
        "Los precios de vuelos y hoteles cambian a menudo; vigilar a mano un precio cercano al umbral lleva tiempo.",
        'En cripto y divisas, "para cuando me di cuenta, ya había pasado" es algo común — una alerta de umbral hace esa vigilancia por ti.',
      ],
      examples: [
        "Avísame cuando esta aspiradora baje de 400 € en cualquier gran tienda.",
        "Avísame cuando un vuelo Madrid–Bangkok baje de 250 €.",
        "Notifícame cuando Bitcoin suba por encima de 150.000 €.",
      ],
      faq: [
        {
          q: "¿Qué precios puede vigilar?",
          a: "Cualquier cosa con un precio público: productos de e-commerce, vuelos y hoteles, cripto y tipos de cambio. Indicas la regla de umbral en lenguaje sencillo.",
        },
        {
          q: "¿Comprueba constantemente?",
          a: "Comprueba a intervalos regulares. Para precios volátiles y cercanos al umbral, las comprobaciones más frecuentes son un motivo habitual para usar Pro.",
        },
      ],
      related: [
        "alertas-de-reposicion",
        "alertas-de-anuncios-inmobiliarios",
        "alertas-de-entradas",
      ],
    },
    {
      key: "restock",
      slug: "alertas-de-reposicion",
      icon: "pkg",
      name: "Alertas de reposición",
      metaTitle: "App de alertas de reposición (PS5, GPU, zapatillas) — Whenly",
      metaDescription:
        'Recibe un aviso cuando la PS5, una GPU o unas zapatillas se repongan. Whenly sigue páginas de venta públicas y entiende reglas como "disponible Y bajo 500 €".',
      h1: "Recibe un aviso cuando un producto se repone",
      answer:
        'Whenly sigue por ti las páginas de venta y de anuncios de productos; cuando el producto vuelve a venderse en una tienda oficial, recibes una notificación. La diferencia son las condiciones compuestas: entiende reglas como "de nuevo disponible Y por menos de 500 €" a partir de lenguaje sencillo.',
      context: [
        "Las reposiciones de productos populares se agotan rápido; recargar la página a mano suele significar perdértelo.",
        "Vigilar varias tiendas a la vez lleva tiempo; Whenly lo hace por ti.",
        "Vigilar la disponibilidad junto con una condición de precio es algo que las alertas de stock sencillas no pueden hacer.",
      ],
      examples: [
        "Avísame cuando la PS5 vuelva a estar disponible en una tienda oficial.",
        "Avísame cuando la RTX 5090 esté disponible por menos de 2.000 €.",
        "Notifícame cuando estas zapatillas vuelvan a venderse a precio de tienda.",
      ],
      faq: [
        {
          q: "¿Qué tiendas puede vigilar?",
          a: 'Cualquier tienda con páginas públicas de producto o de anuncios. Whenly se basa en temas, así que no estás atado a una URL: di "en una tienda oficial" y sopesa en conjunto las señales de venta de la web abierta.',
        },
        {
          q: "¿Puede comprobar una condición de precio al mismo tiempo?",
          a: 'Sí — las condiciones compuestas son una función central: "disponible Y por menos de 500 €" se define en una sola vigilancia.',
        },
      ],
      related: ["alertas-de-bajada-de-precio", "alertas-de-entradas", "alertas-de-publicaciones"],
    },
    {
      key: "rental-listing",
      slug: "alertas-de-anuncios-inmobiliarios",
      icon: "home",
      name: "Alertas de anuncios inmobiliarios",
      metaTitle: "Alertas de nuevos anuncios de alquiler e inmuebles — Whenly",
      metaDescription:
        "Los buenos anuncios vuelan en horas. Whenly sigue los nuevos anuncios según tus criterios de zona, precio y tamaño y te avisa cuando se publica uno que encaja.",
      h1: "Recibe un aviso cuando un anuncio encaja con tus criterios",
      answer:
        'Whenly sigue fuentes públicas de anuncios inmobiliarios según tus criterios de zona, precio y tamaño; cuando se publica un nuevo anuncio que encaja, recibes una notificación. "Avísame cuando se publique aquí un piso de 2 habitaciones por menos de 1.500 €" — esa es toda la configuración.',
      context: [
        "Los anuncios a precio justo suelen cerrarse el mismo día; quien los ve primero tiene la ventaja.",
        "Las alertas propias de los portales de anuncios pueden retrasarse, y sus filtros a menudo son demasiado rígidos.",
        "Rastrear a mano varias zonas y condiciones cuesta horas cada día.",
      ],
      examples: [
        "Avísame cuando se publique un piso de 2 habitaciones por menos de 1.500 € en este barrio.",
        "Avísame cuando aparezca un estudio amueblado en estos dos distritos.",
        "Notifícame cuando se ponga a la venta una vivienda de 3 habitaciones por menos de 400.000 € en esta zona.",
      ],
      faq: [
        {
          q: "¿Qué portales de anuncios se vigilan?",
          a: "Fuentes públicas que publican anuncios. Whenly se basa en temas: en lugar de atarse a un solo sitio, sopesa en conjunto las señales de anuncios abiertos que encajan.",
        },
        {
          q: "¿Puede filtrar zona y precio a la vez?",
          a: "Sí — el barrio, el tope de precio y el número de habitaciones van en una sola frase.",
        },
      ],
      related: [
        "alertas-de-bajada-de-precio",
        "alertas-de-licitaciones",
        "alertas-de-publicaciones",
      ],
    },
    {
      key: "ticket",
      slug: "alertas-de-entradas",
      icon: "ticket",
      name: "Alertas de entradas para eventos",
      metaTitle: "App que te avisa cuando las entradas salen a la venta — Whenly",
      metaDescription:
        "No te pierdas una salida a la venta: Whenly sigue los anuncios públicos de venta de conciertos, partidos y eventos, y te avisa cuando abre la venta.",
      h1: "Recibe un aviso cuando las entradas salen a la venta",
      answer:
        'Whenly sigue por ti los anuncios públicos de venta y los avisos de nuevas fechas de conciertos y eventos; cuando se anuncia que la venta está abierta, recibes una notificación —una alarma con Pro—. Si la fecha no está fijada, di "avísame cuando salga a la venta".',
      context: [
        "Para los eventos populares, perderte el momento de la salida a la venta significa quedarte sin entradas.",
        "La fecha de salida a la venta a menudo no está clara con antelación; vigilar el anuncio a mano es difícil.",
        "Las nuevas fechas y sesiones extra se anuncian en momentos imprevisibles.",
      ],
      examples: [
        "Avísame cuando se anuncie que esta gira sale a la venta.",
        "Avísame cuando se anuncie una fecha o sesión extra para este evento.",
        "Notifícame cuando se anuncie la venta general para este partido.",
      ],
      faq: [
        {
          q: "¿Me compra la entrada?",
          a: "No — Whenly te avisa; tú la compras. Nunca accede a tu cuenta ni hace cola en tu nombre.",
        },
        {
          q: "¿Ayuda si la fecha de salida a la venta no está fijada?",
          a: 'Sí — di "avísame cuando salga a la venta" y sigue las señales del anuncio público y de la página de venta.',
        },
      ],
      related: ["alertas-de-reposicion", "alertas-de-bajada-de-precio", "alertas-de-publicaciones"],
    },
    {
      key: "tender",
      slug: "alertas-de-licitaciones",
      icon: "gavel",
      name: "Alertas de licitaciones y RFP",
      metaTitle: "App que te avisa cuando se publican licitaciones y RFP — Whenly",
      metaDescription:
        "Licitaciones públicas, correcciones, RFP privadas: Whenly te avisa cuando se publica una licitación que encaja con tu sector, y también sigue los cambios de plazo.",
      h1: "Recibe un aviso cuando una licitación encaja con tu negocio",
      answer:
        "Whenly sigue por ti los anuncios públicos de contratación, los avisos de corrección/modificación y los anuncios de RFP del sector privado; cuando se publica un nuevo anuncio o cambio que encaja con tus criterios, recibes una notificación.",
      context: [
        "Encontrar el anuncio es fácil; lo difícil es no perderte el cambio posterior (modificación, fecha).",
        "En los tablones que se revisan de forma pasiva, los nuevos anuncios se detectan días tarde; gana quien los ve antes.",
        "Perderte el plazo de presentación significa la descalificación directa.",
      ],
      examples: [
        "Avísame cuando se publique una licitación de materiales de construcción en mi región.",
        "Avísame si cambia el plazo o una modificación en una licitación que sigo.",
        "Recuérdame 48 horas antes del plazo de presentación de esta RFP.",
      ],
      faq: [
        {
          q: "¿Se conecta a mi cuenta?",
          a: "No — vigila páginas públicas de anuncios y avisos; nunca accede a pantallas tras inicio de sesión. Tú lees el texto oficial en la fuente.",
        },
        {
          q: "¿Me recuerda los plazos?",
          a: 'Sí — se pueden definir reglas basadas en el tiempo, como "recuérdame 2 días antes del plazo".',
        },
      ],
      related: ["alertas-de-subvenciones", "alertas-de-normativa", "alertas-de-competencia"],
    },
    {
      key: "grant",
      slug: "alertas-de-subvenciones",
      icon: "coins",
      name: "Alertas de subvenciones y financiación",
      metaTitle: "Alertas de convocatorias de ayudas (Horizon Europe) — Whenly",
      metaDescription:
        "Whenly sigue los anuncios públicos de subvenciones y financiación y te avisa cuando se abre una convocatoria y se acercan los plazos. No te pierdas la ventana anual.",
      h1: "Recibe un aviso cuando se abre una convocatoria de ayudas",
      answer:
        "Whenly sigue por ti los anuncios públicos de subvenciones y financiación; cuando se abre una ventana de solicitud —y de nuevo a medida que se acerca el plazo— recibes una notificación. Describe en una frase la fuente que te encaja.",
      context: [
        "Algunas convocatorias se cierran antes cuando se agota el presupuesto; solicitar en cuanto abre es lo más seguro.",
        "Muchos programas lanzan una sola convocatoria al año; si te la pierdes, esperas mucho tiempo.",
        "Perderte el plazo significa el rechazo directo en la mayoría de los programas.",
      ],
      examples: [
        "Avísame cuando se abra una convocatoria de ayudas a I+D.",
        "Avísame cuando se anuncie un nuevo programa de financiación.",
        "Notifícame cuando se abra esta convocatoria, y recuérdame una semana antes del plazo.",
      ],
      faq: [
        {
          q: "¿Me recuerda los plazos?",
          a: 'Sí — vigila la apertura y el plazo con una sola vigilancia: "avísame cuando se abra la convocatoria" más "recuérdame una semana antes del plazo".',
        },
        {
          q: "¿Qué fuentes de financiación puede vigilar?",
          a: "Cualquier programa con anuncios públicos: agencias nacionales, ayudas ministeriales, programas de la UE, becas de fundaciones. Añade tu sector y elegibilidad a la frase.",
        },
      ],
      related: ["alertas-de-licitaciones", "alertas-de-normativa", "alertas-de-publicaciones"],
    },
    {
      key: "regulation",
      slug: "alertas-de-normativa",
      icon: "scale",
      name: "Alertas de normativa",
      metaTitle: "App que te avisa cuando cambia la normativa (RGPD, NIS2) — Whenly",
      metaDescription:
        "Recibe un aviso cuando se publica una normativa, directiva o resolución que te afecta. Whenly sigue los boletines oficiales y los anuncios de los reguladores.",
      h1: "Recibe un aviso cuando cambia una normativa que te afecta",
      answer:
        "Whenly sigue los boletines oficiales y los anuncios de los reguladores dentro del tema que defines; cuando se publica una normativa, aviso o resolución que te afecta, recibes una notificación.",
      context: [
        "Los boletines oficiales publican a diario; cribar a mano para encontrar el único punto relevante no es escalable.",
        "Detectar un cambio tarde arriesga sanciones de cumplimiento o un coste inesperado.",
        "Vigilar a la vez los anuncios de varios reguladores lleva tiempo.",
      ],
      examples: [
        "Avísame cuando se publique en el boletín oficial una normativa que afecte a mi sector.",
        "Avísame cuando el regulador publique un nuevo aviso o resolución.",
        "Notifícame cuando un cambio en los aranceles aduaneros afecte a mi grupo de productos.",
      ],
      faq: [
        {
          q: "¿Sustituye al asesoramiento jurídico?",
          a: "No — Whenly es la capa de alerta temprana: se asegura de que veas el cambio primero; tu asesor hace la interpretación. Pasas de la alerta a la fuente y lo lees tú mismo.",
        },
        {
          q: "¿Solo la normativa de un país?",
          a: "No — puede vigilarse cualquier regulador con anuncios públicos: directivas de la UE, autoridades sectoriales, organismos de normalización. El país y el tema de tu frase definen la vigilancia.",
        },
      ],
      related: ["alertas-de-licitaciones", "alertas-de-competencia", "alertas-de-subvenciones"],
    },
    {
      key: "competitor",
      slug: "alertas-de-competencia",
      icon: "eye",
      name: "Alertas de competencia y marca",
      metaTitle: "Monitoriza precios, lanzamientos y marca de la competencia — Whenly",
      metaDescription:
        "Entérate cuando un competidor cambia precios, anuncia un producto, o cuando se habla de tu marca en público. Whenly sigue la web abierta por ti.",
      h1: "Ve el movimiento de tu competidor y el pulso de tu marca",
      answer:
        "Whenly sigue las páginas públicas de precios de tus competidores, sus anuncios de producto y de prensa, y la conversación pública sobre tu marca; cuando se publica algo destacable, recibes una notificación.",
      context: [
        "Detectar tarde un cambio de precio de un competidor significa que tus presupuestos y previsiones funcionan con datos obsoletos.",
        "Perderte anuncios de producto y de prensa significa enterarte demasiado tarde de un movimiento del mercado.",
        "Detectar pronto una conversación negativa sobre tu marca te da la oportunidad de responder antes de que crezca.",
      ],
      examples: [
        "Avísame si cambia algo en la página pública de precios de mi competidor.",
        "Avísame cuando mi competidor publique un nuevo producto o nota de prensa.",
        "Notifícame si se habla de mi marca de forma negativa en plataformas públicas.",
      ],
      faq: [
        {
          q: "¿Es ético?",
          a: "Sí — solo se vigila información pública: la propia página de precios publicada del competidor, las notas de prensa y las conversaciones abiertas. Sin datos privados, sin cuentas cerradas y sin seguimiento de personas — eso está prohibido de forma explícita en nuestros términos.",
        },
        {
          q: "¿Qué cubre la monitorización de marca?",
          a: "Contenido público que menciona tu marca: noticias, foros, publicaciones públicas.",
        },
      ],
      related: ["alertas-de-normativa", "alertas-de-licitaciones", "alertas-de-bajada-de-precio"],
    },
    {
      key: "announcement",
      slug: "alertas-de-publicaciones",
      icon: "megaphone",
      name: "Alertas de publicaciones y páginas",
      metaTitle: "App que te avisa cuando una página publica algo nuevo — Whenly",
      metaDescription:
        "Recibe un aviso cuando una página que sigues publica un nuevo anuncio, resultados o actualización. Whenly sigue páginas públicas en lugar de que recargues tú.",
      h1: "Recibe un aviso cuando una página publica algo nuevo",
      answer:
        "Whenly comprueba por ti una página pública o un tema que sigues; cuando se publica un nuevo anuncio, lista de resultados o actualización destacable, recibes una notificación. Dejas de recargar la misma página una y otra vez.",
      context: [
        "Recargar la misma página decenas de veces al día mientras esperas un anuncio es tiempo perdido.",
        "Las actualizaciones importantes a menudo se publican en silencio; se te escapan en cuanto miras hacia otro lado.",
        "Vigilar varias fuentes a la vez no es sostenible a mano.",
      ],
      examples: [
        "Avísame cuando una página que sigo publique un nuevo anuncio.",
        "Avísame cuando se publique de forma pública la lista de resultados que espero.",
        "Notifícame cuando este sitio actualice sus precios o sus términos.",
      ],
      faq: [
        {
          q: "¿Vigila páginas tras un inicio de sesión?",
          a: "No — solo páginas públicas que no requieren inicio de sesión, contraseña ni un captcha. Tú compruebas un resultado en tu cuenta personal por ti mismo; Whenly te gana el momento.",
        },
        {
          q: "¿Vigila una página concreta?",
          a: "Puede vigilar tanto una página concreta como un tema: da una URL, o simplemente describe lo que esperas.",
        },
      ],
      related: ["alertas-de-normativa", "alertas-de-bajada-de-precio", "alertas-de-reposicion"],
    },
  ],

  compare: {
    slug: "comparativa",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — comparativa",
    metaDescription:
      "Comparando herramientas de monitorización: dónde destacan Whenly, Google Alerts, Visualping y Distill — reglas en lenguaje natural, condiciones compuestas y alarmas.",
    h1: "Whenly frente a las alternativas",
    answer:
      'Respuesta corta: para vigilar los cambios de UNA página concreta, Visualping y Distill son herramientas maduras; para un resumen por correo de contenido nuevo, Google Alerts es gratis. Whenly responde a una pregunta distinta: "avísame cuando ocurra este EVENTO" — sin necesidad de URL, en lenguaje sencillo, con condiciones compuestas y una alarma que hace sonar tu teléfono.',
    intro:
      "Escribimos esto sin inclinar la balanza. La fortaleza de cada herramienta se indica con claridad; si ves algo incorrecto, escríbenos y lo corregiremos.",
    tableCaption: "Comparativa de funciones de herramientas de monitorización",
    colSelf: "Whenly",
    rows: [
      {
        f: "Enfoque central",
        self: 'Frase "avísame cuándo" (basado en tema/evento)',
        ga: "Palabra clave: contenido nuevo",
        vp: "Cambios en una URL concreta",
        di: "Cambios en una URL concreta",
      },
      {
        f: 'Condiciones compuestas en lenguaje sencillo ("disponible Y por menos de 500 €")',
        self: "Sí — función central",
        ga: "No",
        vp: "Limitado",
        di: "Limitado (configuración técnica)",
      },
      {
        f: "¿Hay que conocer la URL de la página?",
        self: "No — se vigilan temas",
        ga: "No",
        vp: "Sí",
        di: "Sí",
      },
      {
        f: "Modo alarma que hace sonar tu teléfono",
        self: "Sí (Pro)",
        ga: "No (correo)",
        vp: "No",
        di: "Parcial",
      },
      {
        f: "Configuración en tu propio idioma (11)",
        self: "Sí",
        ga: "Parcial",
        vp: "Parcial",
        di: "Parcial",
      },
      {
        f: "Plan gratis",
        self: "3 vigilancias",
        ga: "Totalmente gratis",
        vp: "Cuota limitada",
        di: "Limitado",
      },
      {
        f: "Mejor en",
        self: "Esperar eventos: precios, reposiciones, anuncios, licitaciones, normativa",
        ga: "Contenido nuevo sobre un tema",
        vp: "Cambios visuales en una sola página",
        di: "Diferencias de página para usuarios técnicos",
      },
    ],
    afterTable:
      'Resumen: para "avísame cuando esta página cambie", Visualping/Distill son la opción correcta; para "envíame por correo el contenido nuevo", Google Alerts. Si tu necesidad es "estoy esperando un EVENTO y mi teléfono debería sonar en cuanto ocurra", Whenly se diseñó justo para eso.',
    // Comparativas profundas basadas en competidores (GEO/ADR-097): páginas separadas y citables
    // para los prompts "Whenly vs X". Honestidad: la fortaleza del competidor se indica con claridad.
    toolsHeading: "Cara a cara, una herramienta cada vez",
    strengthsHeading: "En qué destaca {name}",
    whenHeading: "Cuándo encaja mejor Whenly",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026): alertas vs correo",
        metaDescription:
          "Google Alerts te envía por correo contenido nuevo de una palabra clave; Whenly vigila el evento que describes y hace sonar tu teléfono cuando ocurre. Visión honesta.",
        h1: "Whenly vs Google Alerts",
        answer:
          'Google Alerts es gratis y te envía un correo cuando contenido nuevo menciona una palabra clave. Whenly responde a una pregunta distinta: describes un evento con condiciones — "avísame cuando baje de 400 €" — y envía una notificación o hace sonar una alarma cuando ese evento ocurre. Mucha gente usa ambos.',
        strengths: [
          "Totalmente gratis, sin cuotas que tener en cuenta",
          "Respaldado por el índice de Google — amplia cobertura de noticias y de la web abierta",
          "Los resúmenes por correo son fáciles de ojear una vez al día",
        ],
        whenWhenly: [
          "Esperas un EVENTO con una condición (precio por debajo de X, de nuevo disponible) — no un flujo de artículos",
          "Necesitas una notificación push o una alarma real, no un resumen por correo",
          "Quieres reglas compuestas en lenguaje sencillo, en 11 idiomas de interfaz",
        ],
        faq: [
          {
            q: "¿Whenly reemplaza a Google Alerts?",
            a: "Hacen trabajos distintos. Google Alerts es estupendo para seguir por correo la cobertura de un tema. Whenly está hecho para pillar un momento concreto — entiende umbrales y hace sonar tu teléfono. Mucha gente conserva ambos.",
          },
          {
            q: "¿Whenly es gratis como Google Alerts?",
            a: "El plan gratis de Whenly incluye 3 vigilancias activas, sin límite de tiempo y sin tarjeta. Pro añade más vigilancias, comprobaciones más frecuentes y modo alarma.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026): diffs de página vs eventos",
        metaDescription:
          "Visualping destaca detectando cambios visuales en una página que indicas. Whenly se basa en temas: describe el evento en lenguaje sencillo y suena en tu teléfono.",
        h1: "Whenly vs Visualping",
        answer:
          "Visualping es una herramienta madura de detección de cambios: le das una URL y muestra las diferencias visuales de esa página. Whenly parte del otro extremo — describes el evento en lenguaje sencillo, sin URL, y envía una notificación o hace sonar una alarma cuando el evento aparece en fuentes públicas.",
        strengths: [
          "Potente motor de diferencias visuales de página con capturas y resaltado de cambios",
          "Extensión de navegador y app web pulidas y muy usadas",
          "Encaja bien cuando sabes exactamente qué página vigilar",
        ],
        whenWhenly: [
          "Prefieres describir el resultado a buscar la URL adecuada",
          'Quieres condiciones compuestas en lenguaje sencillo — "disponible Y por menos de 500 €"',
          "Quieres una app que prioriza el móvil con modo alarma; a mediados de 2026 Visualping no ofrece una app de Android en Google Play (dínoslo si esto cambia y lo corregiremos)",
        ],
        faq: [
          {
            q: "¿Es Whenly una alternativa a Visualping?",
            a: 'Para las diferencias visuales a nivel de página, Visualping sigue siendo una opción sólida. Si tu necesidad es "avísame cuando ocurra este evento" — con condiciones, en tu teléfono, con una alarma — eso es justo para lo que está hecho Whenly.',
          },
          {
            q: "¿Tengo que dar una URL a Whenly?",
            a: "No. Puedes dar una, pero una frase sencilla es suficiente; Whenly sopesa en conjunto las señales de la web pública que encajan.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026): una comparativa honesta",
        metaDescription:
          "Distill ofrece monitorización de páginas al detalle para usuarios técnicos. Whenly cambia los selectores por lenguaje sencillo, con modo alarma y experiencia móvil.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "Distill es un potente monitor de páginas para usuarios técnicos: eliges elementos con selectores, ejecutas comprobaciones locales o en la nube, ajustas todo al detalle. Whenly toma el camino opuesto — una frase sencilla, sin selectores, detección de eventos en la web pública con notificaciones y una alarma real en tu teléfono.",
        strengths: [
          "La selección a nivel de elemento da un control preciso sobre qué cuenta como cambio",
          "Las opciones de monitorización local atraen a usuarios técnicos preocupados por la privacidad",
          "Programación y condiciones flexibles para usuarios avanzados",
        ],
        whenWhenly: [
          "No quieres mantener selectores que se rompen cuando un sitio cambia de diseño",
          "Prefieres describir el evento a configurarlo",
          "Quieres modo alarma y una experiencia que prioriza el teléfono en 11 idiomas",
        ],
        faq: [
          {
            q: "¿Es Whenly más fácil de configurar que Distill?",
            a: "Sí, por diseño: la configuración es una frase. La contrapartida es menos control al detalle que las herramientas basadas en selectores — los usuarios avanzados quizá sigan prefiriendo Distill para diferencias a nivel de elemento.",
          },
          {
            q: "¿Puede Whenly vigilar una página concreta como Distill?",
            a: "Sí — dale una URL o simplemente describe el tema. Whenly vigila solo páginas públicas, y lo dice con claridad.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "¿Whenly reemplaza a Google Alerts?",
        a: "Hacen trabajos distintos: Google Alerts te envía por correo contenido nuevo. Whenly te pide definir el evento y envía una notificación o alarma cuando ocurre. Mucha gente usa ambos.",
      },
      {
        q: "¿Por qué Whenly antes que Visualping o Distill?",
        a: 'Esas herramientas se basan en páginas: tienes que encontrar la URL a vigilar. Whenly se basa en temas: di "cuando esto ocurra" y busca la novedad donde sea que aparezca, con condiciones compuestas y una alarma.',
      },
    ],
  },

  about: {
    slug: "acerca-de",
    metaTitle: "Acerca de Whenly — qué hace, para quién es",
    metaDescription:
      "Whenly es una app independiente que sigue por ti la novedad que te importa. Indicamos con claridad qué hace y cuáles son sus límites.",
    h1: "Acerca de Whenly",
    paras: [
      "Whenly nació de una idea sencilla: no deberías tener que recargar la misma página una y otra vez mientras esperas una novedad que te afecta. El software puede mantener esa vigilancia.",
      "Describes con tus propias palabras lo que quieres vigilar; Whenly comprueba por ti fuentes web públicas a intervalos regulares y envía una notificación —o una alarma— cuando aparece lo que esperabas.",
      'Sostenemos dos principios. Primero, la privacidad: no vendemos tus datos ni los usamos para anuncios; puedes descargarlos o eliminarlos de forma permanente cuando quieras. Segundo, la honestidad: no escribimos una garantía que no podemos cumplir —sin promesas al segundo, sin afirmaciones de "nunca te lo pierdas"— y decimos con claridad que no accedemos a páginas tras inicio de sesión ni captchas.',
      "Whenly se desarrolla de forma independiente. Para preguntas, correcciones y peticiones, siempre puedes contactarnos.",
    ],
    factsHeading: "Ficha técnica",
    facts: [
      { k: "Product", v: "Whenly — app de monitorización y alertas" },
      { k: "Platforms", v: "App web + Android; los avisos llegan a tu teléfono" },
      { k: "Languages", v: "11 idiomas de interfaz, incluidos inglés y turco" },
      { k: "Pricing", v: "Plan gratis (3 vigilancias) + suscripción Pro" },
      {
        k: "Data principle",
        v: "Nunca se venden, sin anuncios; descarga o elimina cuando quieras",
      },
      { k: "Contact", v: "__EMAIL__" },
    ],
  },

  notFound: {
    metaTitle: "Página no encontrada — Whenly",
    h1: "Esta página no existe",
    text: "La página que buscas puede haberse movido o no haber existido nunca. Continúa desde la página de inicio.",
    cta: "Volver al inicio",
  },

  legalCommon: {
    updatedLabel: "Última actualización",
    versionLabel: "Versión",
    canonicalNote:
      "Este texto es una copia de la versión dentro de la app; si difieren, prevalece la versión de la app.",
    translatedNote: "La versión legalmente vinculante de este documento es el texto en inglés.",
  },

  ucStrings: {
    context: "Dónde ayuda",
    examples: "Así se lo dices a Whenly",
    exHint: "Copia una frase y pégala en la app — tu vigilancia está lista.",
    related: "Casos de uso relacionados",
    faq: "Preguntas habituales",
    copy: "Copiar",
    copied: "Copiado",
  },
};
