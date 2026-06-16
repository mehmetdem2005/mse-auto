// Conteúdo em português — mesmos princípios que content.en.mjs: descreve O QUE faz, não COMO;
// apenas "verifica fontes públicas da web em intervalos regulares" — sem mecânica interna nem estratégia
// no site. Apenas cenários realmente alcançáveis (nada por trás de login/captcha).
// Exemplos universais (não presos a um único país). Resposta primeiro, H2 em pergunta, páginas curtas.

// Global-first (ADR-096): EN é o idioma raiz (/) — o site não parece "específico de um país";
// PT vive sob /pt como equivalente completo. A versão juridicamente vinculativa é o texto em inglês.
export const pt = {
  lang: "pt",
  prefix: "/pt",
  useCaseBase: "/pt/casos-de-uso",
  langName: "Português",
  otherLangLabel: "English",

  nav: {
    how: "Como funciona",
    useCases: "Casos de uso",
    compare: "Comparar",
    faq: "Perguntas frequentes",
    about: "Sobre",
    openApp: "Abrir o app",
    menuLabel: "Alternar menu",
    skip: "Pular para o conteúdo",
  },

  footer: {
    tagline: "O Whenly acompanha por você a novidade que importa e avisa quando ela acontece.",
    useCases: "Casos de uso",
    product: "Produto",
    legal: "Jurídico",
    privacy: "Política de Privacidade",
    terms: "Termos de Serviço",
    contact: "Contato",
    forAi: "Para assistentes de IA: llms.txt",
    langSwitch: "Idioma",
    updated: "Conteúdo atualizado",
  },

  home: {
    metaTitle: "Whenly — Me avise quando acontecer: monitoramento e alertas",
    metaDescription:
      'Diga "me avise quando isto acontecer": o Whenly verifica fontes públicas da web em intervalos e avisa você — com alarme, se quiser — quando aparecer.',
    heroOverline: "App de monitoramento e alertas",
    heroTitle: "Me avise <em>quando.</em>",
    // Çözümü sat (copywriting skill): ürün özelliği değil, kurtulduğun iş — "yenilemeyi bırak".
    heroSub:
      "Pare de atualizar a página. Conte ao Whenly o momento que você espera — a queda de preço, a reposição, o anúncio, a publicação — em uma frase simples. Ele verifica fontes públicas da web em intervalos regulares e faz seu celular tocar quando esse momento chega.",
    heroCta: "Comece a monitorar de graça",
    heroCtaNote: "Sem cartão de crédito · Funciona na web e no celular",
    heroSecondary: "Como funciona?",
    trust: [
      "Web + Android",
      "11 idiomas de interface",
      "Plano gratuito — sem cartão",
      "Apenas web pública",
    ],
    phone: {
      watcherLabel: "MONITORANDO",
      watcherText:
        "Me avise quando o produto que eu quero voltar ao estoque abaixo de R$ 500 em uma loja oficial",
      watcherMeta: "Verifica em intervalos regulares",
      notifTitle: "Whenly · agora",
      notifText: "Voltou ao estoque: o produto está à venda de novo abaixo do seu preço-alvo.",
      notifMeta: "Notificação enviada",
    },
    howHeading: "Como funciona o Whenly?",
    how: [
      {
        icon: "messageSquare",
        t: "Descreva o que monitorar",
        d: 'Escreva uma frase simples como "me avise quando um apartamento de 2 quartos abaixo de R$ 1.500 for anunciado aqui". Sem formulários, sem sintaxe de regras para aprender.',
      },
      {
        icon: "refresh",
        t: "O Whenly fica de olho",
        d: "Ele verifica fontes públicas da web — sites, notícias, publicações — por você em intervalos regulares.",
      },
      {
        icon: "bellRing",
        t: "Receba o aviso",
        d: "Quando o que você espera aparece, você recebe uma notificação; para temas críticos, o modo alarme faz seu celular tocar.",
      },
    ],
    // Fayda-önce (copywriting skill: benefits over features) — her madde "sana ne kazandırır".
    featuresHeading: "O que você ganha",
    features: [
      {
        icon: "zap",
        t: "Uma frase é a configuração inteira",
        d: 'Regras compostas direto de palavras simples — "em estoque E abaixo de R$ 500". Sem mecanismo de regras para aprender, sem filtros para montar.',
      },
      {
        icon: "languages",
        t: "Funciona no seu idioma",
        d: "Onze idiomas de interface. Descreva o monitoramento do jeito que você falaria em voz alta.",
      },
      {
        icon: "bellRing",
        t: "Modo alarme para os críticos",
        d: "Alguns momentos não podem esperar em uma bandeja silenciosa: com o Pro, o alerta faz seu celular realmente tocar.",
      },
      {
        icon: "clock",
        t: "Horário de silêncio, nos seus termos",
        d: "Os alertas noturnos esperam até de manhã — você mantém a cobertura sem abrir mão do seu sono.",
      },
      {
        icon: "smartphone",
        t: "Na web e no celular",
        d: "Comece em qualquer navegador em um minuto; também há um app para Android. Os alertas chegam ao seu celular.",
      },
      {
        icon: "shieldCheck",
        t: "Privado por padrão",
        d: "Sem anúncios, sem vender seus dados. Exporte tudo ou apague permanentemente, a qualquer momento.",
      },
    ],
    pricingHeading: "O preço é simples",
    pricing: {
      freeName: "Gratuito",
      freeBullets: [
        "3 monitoramentos ativos",
        "Verificações regulares",
        "Notificações + horário de silêncio",
        "Web e Android",
      ],
      freeCta: "Comece de graça",
      proName: "Pro",
      proBadge: "Mais popular",
      proBullets: [
        "100 monitoramentos ativos",
        "Verificações mais frequentes",
        "Modo alarme — seu celular toca",
        "Personalização + opções extras",
      ],
      proCta: "Faça upgrade no app",
      note: "O plano gratuito não tem prazo e não pede cartão. Faça upgrade para o Pro dentro do app; cancele quando quiser.",
    },
    useCasesHeading: "Para que as pessoas usam",
    useCasesSub:
      "Nove tarefas reais que o Whenly faz na web pública — cada uma um momento que as pessoas costumavam perder.",
    useCasesAll: "Ver todos os casos de uso",
    faqHeading: "Perguntas frequentes",
    faq: [
      {
        q: "O que é o Whenly?",
        a: 'O Whenly é um app que acompanha por você uma novidade que você descreve em linguagem simples (por exemplo, "me avise quando este produto voltar ao estoque"). Ele verifica fontes públicas da web em intervalos regulares e envia uma notificação ou alarme quando o que você espera aparece.',
      },
      {
        q: "O Whenly é gratuito?",
        a: "Sim — o plano gratuito inclui 3 monitoramentos ativos, sem prazo e sem cartão. O Pro adiciona mais monitoramentos, verificações mais frequentes e o modo alarme.",
      },
      {
        q: "Quais fontes ele pode monitorar?",
        a: "Fontes públicas da web: sites, páginas de notícias e publicações, anúncios. Ele não acessa portais protegidos por login, contas pessoais nem páginas atrás de captchas (verificações de robô) — declaramos esse limite de forma explícita.",
      },
      {
        q: "Em quanto tempo ele me avisa?",
        a: "O Whenly verifica as fontes em intervalos regulares e detecta uma novidade na primeira verificação após ela ser publicada. Não prometemos alertas em segundos — as fontes podem publicar com atraso. Trate uma notificação como um sinal para você mesmo conferir.",
      },
      {
        q: "Meus dados estão seguros?",
        a: "Não vendemos seus dados nem os usamos para anúncios. Você pode baixar todos os seus dados em formato legível por máquina ou apagá-los permanentemente junto com sua conta. Os detalhes estão na Política de Privacidade.",
      },
      {
        q: "Funciona no celular ou na web?",
        a: "Nos dois. O app web roda em qualquer navegador; também há um app para Android. Os alertas chegam ao seu celular, e o Pro adiciona o modo alarme para os monitoramentos críticos.",
      },
      {
        q: "Existe um app que só me avisa quando algo acontece online?",
        a: 'É exatamente a função do Whenly. Você escreve o evento em uma frase — "me avise quando X acontecer" — e o Whenly verifica fontes públicas da web em intervalos regulares e então envia uma notificação push ou dispara um alarme quando ocorre.',
      },
      {
        q: "O Whenly é um app de IA que monitora a web por mim?",
        a: "Sim. O Whenly usa IA para transformar sua frase em linguagem simples em uma intenção de monitoramento e para avaliar se o que ele encontra é mesmo o evento que você descreveu. Ele lê apenas páginas públicas — nunca faz login em contas — e o tempo da verificação é de melhor esforço, não instantâneo.",
      },
    ],
    ctaHeading: "Solte o botão de atualizar",
    ctaText:
      "Escreva uma frase e deixe o monitoramento por nossa conta. Da próxima vez que acontecer, você fica sabendo primeiro.",
  },

  useCasesIndex: {
    slug: "casos-de-uso",
    metaTitle: "Casos de uso do Whenly — o que dá para monitorar?",
    metaDescription:
      "De preços e reposições a anúncios, licitações e regulamentação: os cenários de monitoramento que o Whenly acompanha na web aberta.",
    h1: "O que dá para monitorar?",
    intro:
      "O Whenly é baseado em temas: você não precisa saber a URL de uma página — você descreve o que espera que aconteça. Tudo abaixo pode ser acompanhado em fontes públicas da web.",
  },

  useCases: [
    {
      key: "price-drop",
      slug: "alertas-de-queda-de-preco",
      icon: "trendingDown",
      name: "Alertas de queda de preço",
      metaTitle: "App de alertas de queda de preço (produtos, voos, cripto) — Whenly",
      metaDescription:
        "Receba um aviso quando um preço cruzar o seu limite: produtos de e-commerce, voos, hotéis, cripto e moedas. O Whenly entende regras de limite em linguagem simples.",
      h1: "Receba um aviso quando o preço cruzar o seu limite",
      answer:
        'O Whenly acompanha o preço público de um produto, voo ou ativo em relação ao limite que você define; quando ele cruza, você recebe uma notificação. Uma frase configura tudo — "me avise quando isto cair abaixo de R$ 400" — e dá para monitorar tanto quedas quanto altas.',
      context: [
        "Sem um alerta, pegar descontos e promoções significa conferir na mão; boas ofertas acabam em poucas horas.",
        "Preços de voos e hotéis mudam o tempo todo; acompanhar na mão um preço perto do limite leva tempo.",
        'Em cripto e câmbio, "quando percebi já tinha passado" é comum — um alerta de limite faz essa vigilância por você.',
      ],
      examples: [
        "Me avise quando este aspirador cair abaixo de R$ 400 em qualquer grande varejista.",
        "Me alerte quando um voo São Paulo–Bangkok cair abaixo de R$ 2.500.",
        "Me notifique quando o Bitcoin subir acima de R$ 800.000.",
      ],
      faq: [
        {
          q: "Quais preços ele pode monitorar?",
          a: "Qualquer coisa com preço público: produtos de e-commerce, voos e hotéis, cotações de cripto e moedas. Você declara a regra de limite em linguagem simples.",
        },
        {
          q: "Ele verifica o tempo todo?",
          a: "Ele verifica em intervalos regulares. Para preços voláteis e perto do limite, verificações mais frequentes são um motivo típico para usar o Pro.",
        },
      ],
      related: ["alertas-de-reposicao", "alertas-de-anuncios-imoveis", "alertas-de-ingressos"],
    },
    {
      key: "restock",
      slug: "alertas-de-reposicao",
      icon: "pkg",
      name: "Alertas de reposição",
      metaTitle: "App de alertas de reposição (PS5, GPU, tênis) — Whenly",
      metaDescription:
        'Receba um aviso quando o PS5, GPU ou tênis voltarem ao estoque. O Whenly acompanha páginas públicas de venda e entende regras como "em estoque E abaixo de R$ 500".',
      h1: "Receba um aviso quando um produto for reposto",
      answer:
        'O Whenly acompanha por você páginas de venda e de publicações de produtos; quando o produto volta à venda em um varejista oficial, você recebe uma notificação. A diferença são as condições compostas: ele entende regras como "voltou ao estoque E abaixo de R$ 500" a partir de linguagem simples.',
      context: [
        "Reposições de produtos populares esgotam rápido; atualizar a página na mão quase sempre significa perder.",
        "Acompanhar vários varejistas ao mesmo tempo leva tempo; o Whenly faz isso por você.",
        "Monitorar estoque junto com uma condição de preço é algo que alertas de estoque simples não fazem.",
      ],
      examples: [
        "Me avise quando o PS5 voltar ao estoque em um varejista oficial.",
        "Me alerte quando a RTX 5090 estiver em estoque abaixo de R$ 10.000.",
        "Me notifique quando estes tênis voltarem à venda pelo preço de tabela.",
      ],
      faq: [
        {
          q: "Quais lojas ele pode monitorar?",
          a: 'Qualquer varejista com páginas públicas de produto ou de publicações. O Whenly é baseado em temas, então você não fica preso a uma única URL: diga "em um varejista oficial" e ele pondera os sinais de venda da web aberta em conjunto.',
        },
        {
          q: "Ele pode verificar uma condição de preço ao mesmo tempo?",
          a: 'Sim — as condições compostas são um recurso central: "em estoque E abaixo de R$ 500" é definido em um único monitoramento.',
        },
      ],
      related: ["alertas-de-queda-de-preco", "alertas-de-ingressos", "alertas-de-publicacoes"],
    },
    {
      key: "rental-listing",
      slug: "alertas-de-anuncios-imoveis",
      icon: "home",
      name: "Alertas de anúncios de imóveis",
      metaTitle: "Alertas de novos anúncios de aluguel e imóveis — Whenly",
      metaDescription:
        "Bons anúncios somem em horas. O Whenly acompanha novos anúncios em relação aos seus critérios de região, preço e tamanho e avisa quando há uma combinação.",
      h1: "Receba um aviso quando um anúncio combinar com seus critérios",
      answer:
        'O Whenly acompanha fontes públicas de anúncios imobiliários em relação aos seus critérios de região, preço e tamanho; quando um novo anúncio compatível é publicado, você recebe uma notificação. "Me avise quando um apartamento de 2 quartos abaixo de R$ 1.500 for anunciado aqui" — essa é a configuração inteira.',
      context: [
        "Anúncios com preço justo costumam fechar no mesmo dia; quem vê primeiro leva vantagem.",
        "Os próprios alertas dos sites de anúncios podem atrasar, e seus filtros muitas vezes são rígidos demais.",
        "Varrer várias regiões e condições na mão custa horas todos os dias.",
      ],
      examples: [
        "Me avise quando um apartamento de 2 quartos abaixo de R$ 1.500 for anunciado neste bairro.",
        "Me alerte quando um quitinete mobiliado aparecer nestes dois bairros.",
        "Me notifique quando um imóvel de 3 quartos abaixo de R$ 400 mil entrar à venda nesta região.",
      ],
      faq: [
        {
          q: "Quais sites de anúncios são monitorados?",
          a: "Fontes públicas que publicam anúncios. O Whenly é baseado em temas: em vez de prender a um único site, ele pondera em conjunto os sinais de anúncios abertos que combinam.",
        },
        {
          q: "Ele pode filtrar região e preço ao mesmo tempo?",
          a: "Sim — bairro, teto de preço e número de quartos vão em uma única frase.",
        },
      ],
      related: ["alertas-de-queda-de-preco", "alertas-de-licitacoes", "alertas-de-publicacoes"],
    },
    {
      key: "ticket",
      slug: "alertas-de-ingressos",
      icon: "ticket",
      name: "Alertas de ingressos para eventos",
      metaTitle: "App que avisa quando os ingressos entram à venda — Whenly",
      metaDescription:
        "Nunca perca uma abertura de vendas: o Whenly acompanha anúncios públicos de venda de shows, jogos e eventos, e avisa quando as vendas abrem.",
      h1: "Receba um aviso quando os ingressos entrarem à venda",
      answer:
        'O Whenly acompanha por você anúncios públicos de venda e avisos de novas datas para shows e eventos; quando as vendas são anunciadas como abertas, você recebe uma notificação — um alarme no Pro. Se a data ainda não estiver definida, diga "me avise quando entrar à venda".',
      context: [
        "Em eventos populares, perder o momento da abertura de vendas significa ficar sem ingresso.",
        "A data de abertura de vendas muitas vezes não fica clara com antecedência; ficar de olho no anúncio na mão é difícil.",
        "Novas datas e sessões extras são anunciadas em horários aleatórios.",
      ],
      examples: [
        "Me avise quando esta turnê for anunciada como à venda.",
        "Me alerte quando uma data ou sessão extra for anunciada para este evento.",
        "Me notifique quando a venda geral for anunciada para este jogo.",
      ],
      faq: [
        {
          q: "Ele compra o ingresso por mim?",
          a: "Não — o Whenly avisa você; quem compra é você. Ele nunca acessa sua conta nem entra na fila no seu lugar.",
        },
        {
          q: "Ele ajuda se a data de venda ainda não estiver definida?",
          a: 'Sim — diga "me avise quando entrar à venda" e ele acompanha os sinais do anúncio público e da página de vendas.',
        },
      ],
      related: ["alertas-de-reposicao", "alertas-de-queda-de-preco", "alertas-de-publicacoes"],
    },
    {
      key: "tender",
      slug: "alertas-de-licitacoes",
      icon: "gavel",
      name: "Alertas de licitações e propostas",
      metaTitle: "App que avisa quando licitações e propostas são publicadas — Whenly",
      metaDescription:
        "Licitações públicas, retificações, propostas privadas: o Whenly avisa quando uma licitação do seu setor é publicada, e também acompanha mudanças de prazo.",
      h1: "Receba um aviso quando uma licitação combinar com seu negócio",
      answer:
        "O Whenly acompanha por você editais públicos de compras, avisos de retificação/aditamento e solicitações de propostas do setor privado; quando um novo edital ou mudança que combina com seus critérios é publicado, você recebe uma notificação.",
      context: [
        "Encontrar o edital é fácil; o difícil é não perder a mudança que vem depois (aditamento, data).",
        "Em portais conferidos de forma passiva, novos editais são vistos com dias de atraso; quem vê cedo ganha.",
        "Perder o prazo de envio significa desclassificação direta.",
      ],
      examples: [
        "Me avise quando uma licitação de materiais de construção for publicada na minha região.",
        "Me alerte se o prazo ou um aditamento mudar em uma licitação que eu acompanho.",
        "Me lembre 48 horas antes do prazo de envio desta proposta.",
      ],
      faq: [
        {
          q: "Ele conecta à minha conta?",
          a: "Não — ele monitora páginas públicas de editais e publicações; nunca acessa telas protegidas por login. Você lê o texto oficial na fonte.",
        },
        {
          q: "Ele me lembra dos prazos?",
          a: 'Sim — dá para definir regras por tempo como "me lembre 2 dias antes do prazo".',
        },
      ],
      related: ["alertas-de-subsidios", "alertas-de-regulamentacao", "alertas-de-concorrentes"],
    },
    {
      key: "grant",
      slug: "alertas-de-subsidios",
      icon: "coins",
      name: "Alertas de subsídios e financiamento",
      metaTitle: "Alertas de editais de subsídio (Horizon Europe) — Whenly",
      metaDescription:
        "O Whenly acompanha anúncios públicos de subsídios e financiamento e avisa quando um edital abre e conforme os prazos se aproximam. Não perca a janela anual.",
      h1: "Receba um aviso quando um edital de subsídio abrir",
      answer:
        "O Whenly acompanha por você anúncios públicos de subsídios e financiamento; quando uma janela de inscrição abre — e de novo conforme o prazo se aproxima — você recebe uma notificação. Descreva em uma frase a fonte que combina com você.",
      context: [
        "Alguns editais fecham antes quando o orçamento acaba; inscrever-se assim que abre é o mais seguro.",
        "Muitos programas têm um único edital por ano; se você perde, espera muito tempo.",
        "Perder o prazo significa rejeição direta na maioria dos programas.",
      ],
      examples: [
        "Me avise quando um edital de apoio a P&D abrir.",
        "Me alerte quando um novo programa de financiamento for anunciado.",
        "Me notifique quando este edital abrir, e me lembre uma semana antes do prazo.",
      ],
      faq: [
        {
          q: "Ele me lembra dos prazos?",
          a: 'Sim — acompanhe a abertura e o prazo com um único monitoramento: "me avise quando o edital abrir" mais "me lembre uma semana antes do prazo".',
        },
        {
          q: "Quais fontes de financiamento ele pode monitorar?",
          a: "Qualquer programa com anúncios públicos: agências nacionais, apoio de ministérios, programas da UE, subsídios de fundações. Adicione seu setor e elegibilidade à frase.",
        },
      ],
      related: ["alertas-de-licitacoes", "alertas-de-regulamentacao", "alertas-de-publicacoes"],
    },
    {
      key: "regulation",
      slug: "alertas-de-regulamentacao",
      icon: "scale",
      name: "Alertas de regulamentação",
      metaTitle: "App que avisa quando a regulamentação muda (GDPR, NIS2) — Whenly",
      metaDescription:
        "Seja avisado quando uma regulamentação, diretiva ou decisão que afeta você for publicada. O Whenly acompanha diários oficiais e anúncios de órgãos reguladores.",
      h1: "Receba um aviso quando a regulamentação que afeta você mudar",
      answer:
        "O Whenly acompanha diários oficiais e anúncios de reguladores dentro do tema que você define; quando uma regulamentação, aviso ou decisão que afeta você é publicado, você recebe uma notificação.",
      context: [
        "Os diários oficiais publicam todos os dias; peneirar na mão à procura do único item relevante não escala.",
        "Notar uma mudança tarde demais arrisca multas de conformidade ou custos inesperados.",
        "Acompanhar os anúncios de vários reguladores ao mesmo tempo leva tempo.",
      ],
      examples: [
        "Me avise quando uma regulamentação que afeta meu setor for publicada no diário oficial.",
        "Me alerte quando o regulador publicar um novo aviso ou decisão.",
        "Me notifique quando uma mudança de tarifa aduaneira afetar meu grupo de produtos.",
      ],
      faq: [
        {
          q: "Isso substitui assessoria jurídica?",
          a: "Não — o Whenly é a camada de alerta antecipado: ele garante que você veja a mudança primeiro; seu assessor faz a interpretação. Você vai do alerta à fonte e lê você mesmo.",
        },
        {
          q: "Só a regulamentação de um país?",
          a: "Não — qualquer regulador com anúncios públicos pode ser monitorado: diretivas da UE, autoridades setoriais, órgãos de normas. O país e o tema na sua frase definem o monitoramento.",
        },
      ],
      related: ["alertas-de-licitacoes", "alertas-de-concorrentes", "alertas-de-subsidios"],
    },
    {
      key: "competitor",
      slug: "alertas-de-concorrentes",
      icon: "eye",
      name: "Alertas de concorrentes e marca",
      metaTitle: "Monitoramento de preço, lançamento e marca de concorrentes — Whenly",
      metaDescription:
        "Saiba quando um concorrente muda o preço, anuncia um produto ou quando sua marca é comentada publicamente. O Whenly acompanha a web aberta por você.",
      h1: "Veja o movimento do seu concorrente e o pulso da sua marca",
      answer:
        "O Whenly acompanha as páginas públicas de preços dos seus concorrentes, anúncios de produtos e de imprensa, e a conversa pública sobre a sua marca; quando algo digno de nota é publicado, você recebe uma notificação.",
      context: [
        "Notar tarde a mudança de preço de um concorrente significa que seus orçamentos e previsões rodam com dados desatualizados.",
        "Anúncios de produto e de imprensa perdidos significam descobrir um movimento de mercado tarde demais.",
        "Identificar cedo uma conversa negativa sobre sua marca dá a chance de responder antes que ela cresça.",
      ],
      examples: [
        "Me avise se algo mudar na página pública de preços do meu concorrente.",
        "Me alerte quando meu concorrente publicar um novo produto ou comunicado de imprensa.",
        "Me notifique se minha marca for comentada de forma negativa em plataformas públicas.",
      ],
      faq: [
        {
          q: "Isso é ético?",
          a: "Sim — só se monitora informação pública: a própria página de preços publicada do concorrente, comunicados de imprensa e conversas abertas. Sem dados privados, sem contas fechadas e sem rastreamento de indivíduos — isso é explicitamente proibido nos nossos termos.",
        },
        {
          q: "O que o monitoramento de marca cobre?",
          a: "Conteúdo público que menciona sua marca: notícias, fóruns, publicações públicas.",
        },
      ],
      related: ["alertas-de-regulamentacao", "alertas-de-licitacoes", "alertas-de-queda-de-preco"],
    },
    {
      key: "announcement",
      slug: "alertas-de-publicacoes",
      icon: "megaphone",
      name: "Alertas de publicações e páginas",
      metaTitle: "App que avisa quando uma página publica algo novo — Whenly",
      metaDescription:
        "Receba um aviso quando uma página que você acompanha publicar uma nova publicação, lista de resultados ou atualização. O Whenly acompanha páginas públicas por você.",
      h1: "Receba um aviso quando uma página publicar algo novo",
      answer:
        "O Whenly verifica por você uma página ou tema público que você acompanha; quando uma nova publicação, lista de resultados ou atualização relevante é publicada, você recebe uma notificação. Você para de atualizar a mesma página repetidas vezes.",
      context: [
        "Atualizar a mesma página dezenas de vezes por dia esperando uma publicação é tempo desperdiçado.",
        "Atualizações importantes costumam ser publicadas de forma discreta; elas escapam no momento em que você desvia o olhar.",
        "Acompanhar várias fontes ao mesmo tempo não é sustentável na mão.",
      ],
      examples: [
        "Me avise quando uma página que eu acompanho publicar uma nova publicação.",
        "Me alerte quando a lista de resultados que eu espero for publicada de forma pública.",
        "Me notifique quando este site atualizar seus preços ou termos.",
      ],
      faq: [
        {
          q: "Ele monitora páginas atrás de login?",
          a: "Não — apenas páginas públicas que não exigem login, senha ou captcha. Um resultado na sua conta pessoal você confere você mesmo; o Whenly ganha o tempo para você.",
        },
        {
          q: "Ele monitora uma página específica?",
          a: "Ele pode monitorar tanto uma página específica quanto um tema: informe uma URL ou apenas descreva o que você espera.",
        },
      ],
      related: ["alertas-de-regulamentacao", "alertas-de-queda-de-preco", "alertas-de-reposicao"],
    },
  ],

  compare: {
    slug: "comparativo",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — comparativo",
    metaDescription:
      "Ferramentas de monitoramento comparadas: onde Whenly, Google Alerts, Visualping e Distill se destacam — regras em linguagem natural, condições e alarmes.",
    h1: "Whenly vs as alternativas",
    answer:
      'Resposta curta: para monitorar mudanças em UMA página específica, o Visualping e o Distill são ferramentas maduras; para um resumo por e-mail de conteúdo novo, o Google Alerts é gratuito. O Whenly responde a uma pergunta diferente: "me avise quando este EVENTO acontecer" — sem precisar de URL, em linguagem simples, com condições compostas e um alarme que faz seu celular tocar.',
    intro:
      "Escrevemos isto sem inclinar a balança. A força de cada ferramenta é apresentada com clareza; se você notar algo errado, escreva para nós e corrigimos.",
    tableCaption: "Comparativo de recursos de ferramentas de monitoramento",
    colSelf: "Whenly",
    rows: [
      {
        f: "Abordagem central",
        self: 'Frase "me avise quando" (baseada em tema/evento)',
        ga: "Palavra-chave: conteúdo novo",
        vp: "Mudanças em uma URL específica",
        di: "Mudanças em uma URL específica",
      },
      {
        f: 'Condições compostas em linguagem simples ("em estoque E abaixo de R$ 500")',
        self: "Sim — recurso central",
        ga: "Não",
        vp: "Limitado",
        di: "Limitado (configuração técnica)",
      },
      {
        f: "Precisa saber a URL da página?",
        self: "Não — monitoram-se temas",
        ga: "Não",
        vp: "Sim",
        di: "Sim",
      },
      {
        f: "Modo alarme que faz o celular tocar",
        self: "Sim (Pro)",
        ga: "Não (e-mail)",
        vp: "Não",
        di: "Parcial",
      },
      {
        f: "Configuração no seu próprio idioma (11)",
        self: "Sim",
        ga: "Parcial",
        vp: "Parcial",
        di: "Parcial",
      },
      {
        f: "Plano gratuito",
        self: "3 monitoramentos",
        ga: "Totalmente gratuito",
        vp: "Cota limitada",
        di: "Limitado",
      },
      {
        f: "Melhor em",
        self: "Esperar por eventos: preços, reposições, anúncios, licitações, regulamentação",
        ga: "Conteúdo novo sobre um tema",
        vp: "Mudanças visuais em uma única página",
        di: "Diferenças de página para usuários técnicos",
      },
    ],
    afterTable:
      'Resumo: para "me avise quando esta página mudar", o Visualping/Distill são a escolha certa; para "me mande por e-mail conteúdo novo", o Google Alerts. Se a sua necessidade é "estou esperando um EVENTO e meu celular deve tocar no momento em que acontecer", o Whenly foi desenhado exatamente para isso.',
    // Rakip-bazlı derin karşılaştırmalar (GEO/ADR-097): "Whenly vs X" prompt'ları
    // için ayrı, atıflanabilir sayfalar. Dürüstlük: rakibin güçlü yanı açıkça yazılır.
    toolsHeading: "Frente a frente, uma ferramenta de cada vez",
    strengthsHeading: "Onde o {name} se destaca",
    whenHeading: "Quando o Whenly é a melhor escolha",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026): alertas vs e-mail",
        metaDescription:
          "O Google Alerts manda por e-mail conteúdo novo de uma palavra-chave; o Whenly monitora o evento que você descreve e toca no celular quando ele acontece.",
        h1: "Whenly vs Google Alerts",
        answer:
          'O Google Alerts é gratuito e envia e-mails quando conteúdo novo menciona uma palavra-chave. O Whenly responde a uma pergunta diferente: você descreve um evento com condições — "me avise quando cair abaixo de R$ 400" — e ele envia uma notificação ou dispara um alarme quando esse evento acontece. Muita gente usa os dois.',
        strengths: [
          "Totalmente gratuito, sem cotas para pensar a respeito",
          "Apoiado pelo índice do Google — ampla cobertura de notícias e da web aberta",
          "Os resumos por e-mail são fáceis de passar os olhos uma vez por dia",
        ],
        whenWhenly: [
          "Você espera um EVENTO com uma condição (preço abaixo de X, voltou ao estoque) — não um fluxo de artigos",
          "Você precisa de uma notificação push ou um alarme de verdade, não de um resumo por e-mail",
          "Você quer regras compostas em linguagem simples, em 11 idiomas de interface",
        ],
        faq: [
          {
            q: "O Whenly substitui o Google Alerts?",
            a: "Eles fazem trabalhos diferentes. O Google Alerts é ótimo para acompanhar a cobertura de um tema por e-mail. O Whenly foi feito para pegar um momento específico — ele entende limites e faz seu celular tocar. Muita gente mantém os dois.",
          },
          {
            q: "O Whenly é gratuito como o Google Alerts?",
            a: "O plano gratuito do Whenly inclui 3 monitoramentos ativos, sem prazo e sem cartão. O Pro adiciona mais monitoramentos, verificações mais frequentes e o modo alarme.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026): diffs de página vs eventos",
        metaDescription:
          "O Visualping detecta mudanças visuais em uma página que você indica. O Whenly é baseado em temas: descreva o evento e receba um alarme no celular.",
        h1: "Whenly vs Visualping",
        answer:
          "O Visualping é uma ferramenta madura de detecção de mudanças: informe uma URL e ele mostra as diferenças visuais dessa página. O Whenly parte do outro lado — você descreve o evento em linguagem simples, sem precisar de URL, e ele envia uma notificação ou dispara um alarme quando o evento aparece em fontes públicas.",
        strengths: [
          "Mecanismo forte de comparação visual de páginas, com capturas de tela e destaque das mudanças",
          "Extensão de navegador e app web polidos e amplamente usados",
          "Boa opção quando você sabe exatamente qual página monitorar",
        ],
        whenWhenly: [
          "Você prefere descrever o resultado a caçar a URL certa",
          'Você quer condições compostas em linguagem simples — "em estoque E abaixo de R$ 500"',
          "Você quer um app mobile-first com modo alarme; até meados de 2026 o Visualping não oferece um app Android na Google Play (avise-nos se isso mudar e corrigiremos)",
        ],
        faq: [
          {
            q: "O Whenly é uma alternativa ao Visualping?",
            a: 'Para diferenças visuais no nível da página, o Visualping continua sendo uma escolha forte. Se a sua necessidade é "me avise quando este evento acontecer" — com condições, no seu celular, com um alarme — é exatamente para isso que o Whenly foi feito.',
          },
          {
            q: "Preciso dar uma URL ao Whenly?",
            a: "Não. Você pode dar uma, mas uma frase simples basta; o Whenly pondera em conjunto os sinais públicos da web que combinam.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026): um comparativo honesto",
        metaDescription:
          "O Distill faz monitoramento detalhado de páginas para usuários técnicos. O Whenly troca seletores por linguagem simples, alarme e foco no celular.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "O Distill é um monitor de páginas poderoso para usuários técnicos: escolha elementos com seletores, rode verificações locais ou na nuvem, ajuste tudo. O Whenly segue o caminho oposto — uma frase simples, sem seletores, detecção de eventos na web pública com notificações e um alarme de verdade no seu celular.",
        strengths: [
          "A seleção no nível do elemento dá controle preciso sobre o que conta como mudança",
          "As opções de monitoramento local agradam a usuários técnicos preocupados com privacidade",
          "Agendamento e condições flexíveis para usuários avançados",
        ],
        whenWhenly: [
          "Você não quer manter seletores que quebram quando um site muda de layout",
          "Você prefere descrever o evento a configurá-lo",
          "Você quer modo alarme e uma experiência centrada no celular em 11 idiomas",
        ],
        faq: [
          {
            q: "O Whenly é mais fácil de configurar que o Distill?",
            a: "Sim, por design: a configuração é uma frase. A contrapartida é menos controle detalhado que ferramentas baseadas em seletores — usuários avançados ainda podem preferir o Distill para diferenças de elementos de página.",
          },
          {
            q: "O Whenly pode monitorar uma página específica como o Distill?",
            a: "Sim — informe uma URL ou apenas descreva o tema. O Whenly monitora apenas páginas públicas, e declara esse limite com clareza.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "O Whenly substitui o Google Alerts?",
        a: "Eles fazem trabalhos diferentes: o Google Alerts envia por e-mail conteúdo novo. O Whenly pede que você defina o evento e envia uma notificação ou alarme quando ele acontece. Muita gente usa os dois.",
      },
      {
        q: "Por que o Whenly em vez do Visualping ou do Distill?",
        a: 'Essas ferramentas são baseadas em páginas: você precisa encontrar a URL a monitorar. O Whenly é baseado em temas: diga "quando isto acontecer" e ele procura a novidade onde quer que ela apareça, com condições compostas e um alarme.',
      },
    ],
  },

  about: {
    slug: "sobre",
    metaTitle: "Sobre o Whenly — o que ele faz, para quem é",
    metaDescription:
      "O Whenly é um app independente que acompanha por você a novidade que importa. Dizemos com clareza o que ele faz e quais são seus limites.",
    h1: "Sobre o Whenly",
    paras: [
      "O Whenly nasceu de uma ideia simples: você não deveria ter que ficar atualizando a mesma página enquanto espera uma novidade que afeta você. O software pode manter essa vigilância.",
      "Você descreve o que quer monitorar com suas próprias palavras; o Whenly verifica por você fontes públicas da web em intervalos regulares e envia uma notificação — ou um alarme — quando o que você espera aparece.",
      'Mantemos dois princípios. Primeiro, privacidade: não vendemos seus dados nem os usamos para anúncios; você pode baixá-los ou apagá-los permanentemente quando quiser. Segundo, honestidade: não escrevemos uma garantia que não podemos cumprir — sem promessas de segundos, sem alegações de "nunca perca" — e dizemos com clareza que não acessamos páginas atrás de login ou captchas.',
      "O Whenly é construído de forma independente. Para dúvidas, correções e pedidos, você sempre pode falar conosco.",
    ],
    factsHeading: "Ficha técnica",
    facts: [
      { k: "Produto", v: "Whenly — app de monitoramento e alertas" },
      { k: "Plataformas", v: "App web + Android; os alertas chegam ao seu celular" },
      { k: "Idiomas", v: "11 idiomas de interface, incluindo inglês e turco" },
      { k: "Preço", v: "Plano gratuito (3 monitoramentos) + assinatura Pro" },
      { k: "Princípio de dados", v: "Nunca vendidos, sem anúncios; baixe ou apague quando quiser" },
      { k: "Contato", v: "__EMAIL__" },
    ],
  },

  notFound: {
    metaTitle: "Página não encontrada — Whenly",
    h1: "Esta página não existe",
    text: "A página que você procura pode ter sido movida ou nunca ter existido. Continue a partir da página inicial.",
    cta: "Voltar ao início",
  },

  legalCommon: {
    updatedLabel: "Última atualização",
    versionLabel: "Versão",
    canonicalNote:
      "Este texto é uma cópia da versão dentro do app; se houver divergência, prevalece a versão do app.",
    translatedNote: "A versão juridicamente vinculativa deste documento é o texto em inglês.",
  },

  ucStrings: {
    context: "Onde ajuda",
    examples: "É assim que você diz ao Whenly",
    exHint: "Copie uma frase e cole no app — seu monitoramento está pronto.",
    related: "Casos de uso relacionados",
    faq: "Perguntas comuns",
    copy: "Copiar",
    copied: "Copiado",
  },
};
