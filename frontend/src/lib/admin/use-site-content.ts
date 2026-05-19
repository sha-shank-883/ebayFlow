import { useState, useEffect } from 'react';
import { publicApi, invalidateCache } from './public-api';
import { marketingConfig } from '@/config/marketing';

export function useSiteContent(pageSlug: string) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const data = await publicApi.sections(pageSlug);
        if (data && data.sections) {
          setContent(data);
        } else {
          setContent({ fallback: true, pageSlug });
        }
      } catch {
        setContent({ fallback: true, pageSlug });
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [pageSlug]);

  return { content, loading };
}

export function useNavigation(location: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNav() {
      try {
        const data = await publicApi.navigation(location);
        if (data && data.length > 0) {
          setItems(data);
        } else {
          if (location === 'header') {
            setItems(marketingConfig.mainNav.map((item, i) => ({ ...item, order: i })));
          } else if (location === 'footer') {
            const footerLinks = [
              ...marketingConfig.footer.links.platform.map((l: any) => ({ ...l, location: 'footer', group: 'platform' })),
              ...marketingConfig.footer.links.engine.map((l: any) => ({ ...l, location: 'footer', group: 'engine' })),
              ...marketingConfig.footer.links.company.map((l: any) => ({ ...l, location: 'footer', group: 'company' })),
              ...marketingConfig.footer.links.compliance.map((l: any) => ({ ...l, location: 'footer', group: 'compliance' })),
            ];
            setItems(footerLinks);
          } else {
            setItems([]);
          }
        }
      } catch {
        if (location === 'header') {
          setItems(marketingConfig.mainNav.map((item, i) => ({ ...item, order: i })));
        } else if (location === 'footer') {
          const footerLinks = [
            ...marketingConfig.footer.links.platform.map((l: any) => ({ ...l, location: 'footer', group: 'platform' })),
            ...marketingConfig.footer.links.engine.map((l: any) => ({ ...l, location: 'footer', group: 'engine' })),
            ...marketingConfig.footer.links.company.map((l: any) => ({ ...l, location: 'footer', group: 'company' })),
            ...marketingConfig.footer.links.compliance.map((l: any) => ({ ...l, location: 'footer', group: 'compliance' })),
          ];
          setItems(footerLinks);
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchNav();
  }, [location]);

  return { items, loading };
}

export function useTestimonials() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await publicApi.testimonials();
        if (data && data.length > 0) {
          setItems(data);
        } else {
          setItems(marketingConfig.testimonials.items.map((t, i) => ({ ...t, order: i })));
        }
      } catch {
        setItems(marketingConfig.testimonials.items.map((t, i) => ({ ...t, order: i })));
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { items, loading };
}

export function useFAQs() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await publicApi.faqs();
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(marketingConfig.faqPage.categories.map((c, i) => ({ ...c, id: `fallback-${i}`, items: c.questions.map((q, j) => ({ ...q, id: `fallback-${i}-${j}` })) })));
        }
      } catch {
        setCategories(marketingConfig.faqPage.categories.map((c, i) => ({ ...c, id: `fallback-${i}`, items: c.questions.map((q, j) => ({ ...q, id: `fallback-${i}-${j}` })) })));
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { categories, loading };
}

export function usePricing(period = 'monthly') {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await publicApi.pricing(period);
        if (data && data.length > 0) {
          setPlans(data);
        } else {
          const plans = period === 'yearly' ? marketingConfig.pricing.yearly : marketingConfig.pricing.monthly;
          setPlans(plans.map((p, i) => ({ ...p, id: `fallback-${i}` })));
        }
      } catch {
        const plans = period === 'yearly' ? marketingConfig.pricing.yearly : marketingConfig.pricing.monthly;
        setPlans(plans.map((p, i) => ({ ...p, id: `fallback-${i}` })));
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [period]);

  return { plans, loading };
}

export function useSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await publicApi.settings();
        if (data) {
          setSettings(data);
        } else {
          setSettings({
            siteName: marketingConfig.name,
            contactEmail: marketingConfig.contact.email,
            contactPhone: marketingConfig.contact.phone,
            contactAddress: `${marketingConfig.contact.address.line1}, ${marketingConfig.contact.address.city}, ${marketingConfig.contact.address.postcode}, ${marketingConfig.contact.address.country}`,
            socialLinks: marketingConfig.links,
            description: marketingConfig.footer.description,
            copyright: marketingConfig.footer.copyright,
          });
        }
      } catch {
        setSettings({
          siteName: marketingConfig.name,
          contactEmail: marketingConfig.contact.email,
          contactPhone: marketingConfig.contact.phone,
          contactAddress: `${marketingConfig.contact.address.line1}, ${marketingConfig.contact.address.city}, ${marketingConfig.contact.address.postcode}, ${marketingConfig.contact.address.country}`,
          socialLinks: marketingConfig.links,
          description: marketingConfig.footer.description,
          copyright: marketingConfig.footer.copyright,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { settings, loading };
}

export function useFeatures() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.features();
        if (result) {
          setData(result);
        } else {
          setData({
            badge: marketingConfig.featureSection.badge,
            title: marketingConfig.featureSection.title,
            titleAccent: marketingConfig.featureSection.titleAccent,
            description: marketingConfig.featureSection.description,
            bento: marketingConfig.featureSection.bento,
            services: marketingConfig.services,
          });
        }
      } catch {
        setData({
          badge: marketingConfig.featureSection.badge,
          title: marketingConfig.featureSection.title,
          titleAccent: marketingConfig.featureSection.titleAccent,
          description: marketingConfig.featureSection.description,
          bento: marketingConfig.featureSection.bento,
          services: marketingConfig.services,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useHowItWorks() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.howItWorks();
        if (result) {
          setData(result);
        } else {
          setData(marketingConfig.howItWorks);
        }
      } catch {
        setData(marketingConfig.howItWorks);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useCTASection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.ctaSection();
        if (result) {
          setData(result);
        } else {
          setData(marketingConfig.ctaSection);
        }
      } catch {
        setData(marketingConfig.ctaSection);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useAuditSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.auditSection();
        if (result) {
          setData(result);
        } else {
          setData(marketingConfig.audit);
        }
      } catch {
        setData(marketingConfig.audit);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useLogos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.logos();
        if (result && result.length > 0) {
          setItems(result);
        } else {
          setItems(marketingConfig.logos);
        }
      } catch {
        setItems(marketingConfig.logos);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { items, loading };
}

export function useTrustSignals() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.trustSignals();
        if (result && result.length > 0) {
          setItems(result);
        } else {
          setItems(marketingConfig.trustSignals);
        }
      } catch {
        setItems(marketingConfig.trustSignals);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { items, loading };
}

export function usePageMetadata(pageSlug: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.pageMetadata(pageSlug);
        if (result) {
          setData(result);
        } else {
          setData({ fallback: true, pageSlug });
        }
      } catch {
        setData({ fallback: true, pageSlug });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [pageSlug]);

  return { data, loading };
}

export function usePricingSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.pricingSection();
        if (result) {
          setData(result);
        } else {
          setData({
            section: marketingConfig.pricing.section,
            guarantees: marketingConfig.pricing.guarantees,
            faqs: marketingConfig.pricing.faqs,
          });
        }
      } catch {
        setData({
          section: marketingConfig.pricing.section,
          guarantees: marketingConfig.pricing.guarantees,
          faqs: marketingConfig.pricing.faqs,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useContactPageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.contactPage();
        if (result) {
          setData(result);
        } else {
          setData({
            ...marketingConfig.contactPage,
            fallback: true,
          });
        }
      } catch {
        setData({
          ...marketingConfig.contactPage,
          fallback: true,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useAboutPageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.aboutPage();
        if (result) {
          setData(result);
        } else {
          setData({
            mission: "To democratize enterprise-grade automation for eBay sellers worldwide. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.",
            vision: "To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.",
            values: marketingConfig.aboutPage.values,
            milestones: marketingConfig.aboutPage.milestones,
            fallback: true,
          });
        }
      } catch {
        setData({
          mission: "To democratize enterprise-grade automation for eBay sellers worldwide. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.",
          vision: "To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.",
          values: marketingConfig.aboutPage.values,
          milestones: marketingConfig.aboutPage.milestones,
          fallback: true,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export function useFeaturePageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await publicApi.featurePage();
        if (result) {
          setData(result);
        } else {
          setData({
            sections: marketingConfig.featurePage.sections,
            comparison: marketingConfig.featurePage.comparison,
            fallback: true,
          });
        }
      } catch {
        setData({
          sections: marketingConfig.featurePage.sections,
          comparison: marketingConfig.featurePage.comparison,
          fallback: true,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, loading };
}

export { invalidateCache };
