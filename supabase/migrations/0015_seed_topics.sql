-- 0015_seed_topics.sql — seed the knowledge base with default verified topics
-- so the pipeline can produce videos without manual topic entry.
-- Topics are "az bilinen ama gerçek" (little-known but real) historical events.

insert into knowledge (id, topic, text, source_title, source_url, verified)
values
  ('seed-001', 'Ada Blackjack, Wrangel Adası''nın tek hayatta kalanı (1921-1923)',
   'Ada Blackjack, 1921-1923 yılları arasında Arktik''teki Wrangel Adası''nda hayatta kalan tek kişiydi. Ekibinin geri kalanı hayatını kaybetti veya tahliye edildi; Ada dikiş nakışı ve av becerilerini kullanarak iki yıl boyunca tek başına hayatta kaldı.',
   'History.com / National Park Service', 'https://en.wikipedia.org/wiki/Ada_Blackjack', true),

  ('seed-002', 'Tsutomu Yamaguchi — her iki atom bombasında da hayatta kalan tek kişi (1945)',
   'Tsutomu Yamaguchi, hem Hiroşima hem de Nagasaki atom bombalarından sağ kurtulan tek kişi olarak resmi olarak tanınmıştır. 6 Ağustos 1945''te Hiroşima''daydı, ardından Nagasaki''ye döndü ve 9 Ağustos''ta ikinci bombadan da kurtuldu.',
   'BBC / Wikipedia', 'https://en.wikipedia.org/wiki/Tsutomu_Yamaguchi', true),

  ('seed-003', 'CIA''nın Akustik Kedicik Operasyonu (1960''lar)',
   'Soğuk Savaş döneminde CIA, Sovyetleri dinlemek için bir kediyi canlı mikrofona dönüştürmeye çalıştı. "Akustik Kedicik" projesi milyon dolarlara mal oldu ancak pratikte hiç kullanılamadı.',
   'CIA Arşivleri / The Guardian', 'https://en.wikipedia.org/wiki/Acoustic_Kitty', true),

  ('seed-004', 'Domuz Savaşı — ABD ile İngiltere''nin neredeyse çatıştığı kriz (1859)',
   '1859''da San Juan Adası''nda bir İngiliz çiftçisine ait bir domuzu öldüren Amerikalı çiftçi, iki ülkeyi neredeyse savaşa sürükledi. "Domuz Savaşı" olarak bilinen bu tuhaf sınır anlaşmazlığında karşılıklı askerler karşı karşıya geldi ancak tek kayıp o domuz oldu.',
   'HistoryLink / Canadian Encyclopedia', 'https://en.wikipedia.org/wiki/Pig_War', true),

  ('seed-005', 'Büyük Salata Yağı Sahtekarlığı (1963)',
   '1963''te Amerikalı bir işadamı, Amerikan tarihinin en büyük mal sahtekarlığını gerçekleştirdi: tanklara salata yağı yerine su doldurarak bankacılara 175 milyon dolar kaybettirdi. Bu olay Wall Street''i sarstı.',
   'Wikipedia / MoneyWeek', 'https://en.wikipedia.org/wiki/Great_Salad_Oil_Swindle', true),

  ('seed-006', 'Portekiz Banknotları Skandalı (1925)',
   '1925''te Portekizli bir dolandırıcı, ülkenin resmi banknotlarından daha fazlasını bastırdı ve neredeyse tüm Portekiz ekonomisini çökertti. Bu, tarihin en büyük para sahtekarlığı vakalarından biridir.',
   'Wikipedia / PMG / Portugal.com', 'https://en.wikipedia.org/wiki/Portuguese_banknote_crisis', true),

  ('seed-007', 'Titan alt deniz aracı — mürettebat farkında olmadan ölüme gitti (2023)',
   'OceanGate''in Titan denizaltısı, Titanic enkazını görmek için dalmaya başladı. 96 saat sonra ortadan kaybolduğu anlaşıldı ve içindeki 5 kişi hayatını kaybetti. Çökme olayı tam bir "anlık" oldu.',
   'BBC / Reuters', 'https://en.wikipedia.org/wiki/Titan_submersible_implosion', true),

  ('seed-008', 'Antik Roma''da köpek balığı avı gladyatörleri',
   'Antik Roma''da bazı arenalar suyla dolduruluyor ve mahkumlar köpek balıklarıyla dövüşmek zorunda bırakılıyordu. Bu "naumachia" denilen su dövüşleri imparatorların düzenlediği en spektaküler gösterilerden biriydi.',
   'Smithsonian / Ancient History Encyclopedia', 'https://en.wikipedia.org/wiki/Naumachia', true),

  ('seed-009', 'Süpersonik uçuşta koç yiyen pilot — Chuck Yeager (1947)',
   '1947''de Chuck Yeager ses duvarını ilk kıran pilottu. O tarihi uçuştan iki gün önce at yarışında incittiği iki kaburga kemiğiyle kokpitten kancayla kapı kapattığı bilinmektedir. Bunu gizledi ve uçuşu gerçekleştirdi.',
   'National Air and Space Museum', 'https://en.wikipedia.org/wiki/Chuck_Yeager', true),

  ('seed-010', 'Kuzey Kore''nin gizli yıkılmayan sahtekarlık şehri (Kijong-dong)',
   'Kuzey Kore sınırına yakın "Barış Köyü" olarak bilinen Kijong-dong''da kimse yaşamamaktadır. Köy binaların içi boş, ışıklar zamanlayıcıyla açılıp kapanmaktadır — salt propaganda amaçlı inşa edilmiş bir dekor şehridir.',
   'National Geographic / BBC', 'https://en.wikipedia.org/wiki/Kijong-dong', true)

on conflict (id) do nothing;
