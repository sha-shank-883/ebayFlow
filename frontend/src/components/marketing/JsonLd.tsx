import React from 'react';
import { marketingConfig } from '@/config/marketing';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": marketingConfig.name,
    "url": marketingConfig.url,
    "description": marketingConfig.description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${marketingConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  return <JsonLd data={data} />;
}

export function SoftwareApplicationJsonLd() {
  const starterPlan = marketingConfig.pricing.monthly[0];
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": marketingConfig.name,
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": starterPlan.price.replace('£', ''),
      "priceCurrency": "GBP"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1250"
    }
  };
  return <JsonLd data={data} />;
}

export function FAQPageJsonLd({ faqs }: { faqs: { q: string, a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
  return <JsonLd data={data} />;
}

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": marketingConfig.name,
    "url": marketingConfig.url,
    "logo": `${marketingConfig.url}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": marketingConfig.contact.phone,
      "contactType": "customer service",
      "email": marketingConfig.contact.email,
      "areaServed": "GB",
      "availableLanguage": "en"
    },
    "sameAs": [
      marketingConfig.links.twitter,
      marketingConfig.links.github
    ]
  };
  return <JsonLd data={data} />;
}

export function ProductJsonLd() {
  const monthlyPlans = marketingConfig.pricing.monthly;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${marketingConfig.name} Platform`,
    "description": marketingConfig.description,
    "brand": {
      "@type": "Brand",
      "name": marketingConfig.name
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": monthlyPlans[0].price.replace('£', ''),
      "highPrice": monthlyPlans[1].price.replace('£', ''),
      "priceCurrency": "GBP",
      "offerCount": monthlyPlans.length.toString()
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1250"
    }
  };
  return <JsonLd data={data} />;
}
