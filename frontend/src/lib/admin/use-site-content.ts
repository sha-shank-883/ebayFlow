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
          // Fallback to hardcoded config
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
          // Fallback to hardcoded config
          if (location === 'header') {
            setItems(marketingConfig.mainNav.map((item, i) => ({ ...item, order: i })));
          } else {
            setItems([]);
          }
        }
      } catch {
        if (location === 'header') {
          setItems(marketingConfig.mainNav.map((item, i) => ({ ...item, order: i })));
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
          });
        }
      } catch {
        setSettings({
          siteName: marketingConfig.name,
          contactEmail: marketingConfig.contact.email,
          contactPhone: marketingConfig.contact.phone,
          contactAddress: `${marketingConfig.contact.address.line1}, ${marketingConfig.contact.address.city}, ${marketingConfig.contact.address.postcode}, ${marketingConfig.contact.address.country}`,
          socialLinks: marketingConfig.links,
        });
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { settings, loading };
}

export { invalidateCache };
