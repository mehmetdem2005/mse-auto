// Expo Router web HTML kabuğu — YALNIZ web build'inde kullanılır (native'de yok sayılır).
// SEO/erişilebilirlik: lang, meta description, viewport. Native kaynağı etkilemez.
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren, ReactElement } from "react";

const DESCRIPTION =
  "Watcher — istediğin konuyu yapay zekâ ile sürekli izle; gelişme olduğunda anında bildirim al. Akıllı izleyici uygulaması.";

export default function Root({ children }: PropsWithChildren): ReactElement {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content={DESCRIPTION} />
        <meta name="theme-color" content="#F5F7FB" />
        <meta property="og:title" content="Watcher — akıllı izleyici" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        {/* RN-web kaydırma sıfırlaması (Expo önerisi) */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
