import { Helmet } from "react-helmet-async";
import type { Language } from "@/lib/i18n";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  lang?: Language;
  includeHreflang?: boolean;
}

const SITE_URL = "https://project-evaluator.com";

export default function Seo({ title, description, path, lang = "es", includeHreflang = true }: SeoProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === "es" ? "es_ES" : lang === "pt" ? "pt_BR" : "en_US"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {includeHreflang && (
        <link rel="alternate" hrefLang="es" href={`${SITE_URL}/es`} />
      )}
      {includeHreflang && (
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
      )}
      {includeHreflang && (
        <link rel="alternate" hrefLang="pt" href={`${SITE_URL}/pt`} />
      )}
      {includeHreflang && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en`} />
      )}
    </Helmet>
  );
}
