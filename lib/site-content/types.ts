export interface NavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

export interface ServiceCardContent {
  label: string;
  title: string;
  description: string;
  href: string;
  image: string;
}

export interface ProcessStepContent {
  number: string;
  title: string;
  description: string;
}

export interface SiteContent {
  brand: {
    name: string;
  };
  theme: {
    applyCustom: boolean;
    sand: string;
    card: string;
    ink: string;
    inkSoft: string;
    coral: string;
    gold: string;
    dusk: string;
    dusk2: string;
    seafoam: string;
  };
  navigation: {
    items: NavItem[];
    quoteLabel: string;
    quoteHref: string;
    whatsappLabel: string;
  };
  home: {
    hero: {
      eyebrow: string;
      title: string;
      accent: string;
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      image: string;
      badgeTopLabel: string;
      badgeTopValue: string;
      badgeBottomLabel: string;
      badgeBottomValue: string;
    };
    services: {
      eyebrow: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      cards: ServiceCardContent[];
    };
    trust: {
      headline: string;
      stats: { title: string; detail: string }[];
    };
    promotions: { eyebrow: string; title: string };
    process: {
      eyebrow: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      steps: ProcessStepContent[];
    };
    categories: { eyebrow: string; title: string };
    corporate: {
      eyebrow: string;
      title: string;
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      image: string;
      imageTitle: string;
      imageDescription: string;
    };
  };
  catalog: {
    eyebrow: string;
    descriptions: Record<"promociones" | "hoteles" | "paquetes" | "guias-tours", string>;
  };
  footer: {
    eyebrow: string;
    headline: string;
    ctaLabel: string;
    description: string;
    copyright: string;
  };
}
