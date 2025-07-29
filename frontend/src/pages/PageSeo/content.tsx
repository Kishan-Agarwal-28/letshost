function PageSeo({
  description,
  canonical,
  pageTitle,
  ogDescription,
  ogUrl,
  ogTitle,
  twitterTitle,
  twitterDescription,
}: {
  description: string;
  canonical: string;
  pageTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogTitle: string;
  twitterTitle: string;
  twitterDescription: string;
}) {
  return (
    <article>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:site_name" content="Letshost" />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      <meta
        property="og:image"
        content="https://letshost.imgix.net/assets/Screenshot%202025-06-28%20160149.png?fm=webp"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:site" content="@https://letshost.dpdns.org" />
      <meta name="twitter:description" content={twitterDescription} />
      <meta
        name="twitter:image"
        content="https://letshost.imgix.net/assets/Screenshot%202025-06-28%20160149.png?fm=webp"
      />
      <meta name="twitter:image:alt" content="https://letshost.dpdns.org" />
      <title>{pageTitle}</title>
    </article>
  );
}
export default PageSeo;
