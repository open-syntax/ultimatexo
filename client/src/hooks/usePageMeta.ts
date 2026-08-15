import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

export function usePageMeta({
  title,
  description,
  path = "/",
  noIndex = false,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = `${title} | UltimateXO`;

    document.title = fullTitle;

    let metaDescription = document.querySelector('meta[name="description"]');

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    let ogTitle = document.querySelector('meta[property="og:title"]');

    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", fullTitle);

    let ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );

    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute("content", description);

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');

    if (!twitterTitle) {
      twitterTitle = document.createElement("meta");
      twitterTitle.setAttribute("name", "twitter:title");
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute("content", fullTitle);

    let twitterDescription = document.querySelector(
      'meta[name="twitter:description"]',
    );

    if (!twitterDescription) {
      twitterDescription = document.createElement("meta");
      twitterDescription.setAttribute("name", "twitter:description");
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute("content", description);

    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://ultimatexo.com${path}`);

    let robots = document.querySelector('meta[name="robots"]');

    if (noIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    } else if (robots) {
      robots.setAttribute(
        "content",
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      );
    }
  }, [title, description, path, noIndex]);
}
