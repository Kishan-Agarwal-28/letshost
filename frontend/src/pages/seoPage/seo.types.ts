// ----------- Type Definitions -----------
type Locale = "en_US" | string;
type Availability = "InStock" | "OutOfStock" | string;
type Condition = "NewCondition" | "UsedCondition" | string;
type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | string;
type OrganizationType = "Organization" | "NGO" | "Corporation" | string;
type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface QA {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface Breadcrumb {
  name: string;
  url: string;
}

interface SitemapPage {
  url: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: string;
}
interface AdsEntry {
  domain: string;
  publisherId: string;
  relationship: "DIRECT" | "RESELLER";
  certificationId: string;
}

interface HttpHeader {
  name: string;
  value: string;
}
interface SEOFormData {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  locale: Locale;

  author: string;
  publishedTime: string;
  modifiedTime: string;
  section: string;
  tags: string;

  businessName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  priceRange: string;

  productName: string;
  brand: string;
  price: string;
  currency: string;
  availability: Availability;
  condition: Condition;

  eventName: string;
  startDate: string;
  endDate: string;
  location: string;

  personName: string;
  jobTitle: string;
  company: string;

  videoUrl: string;
  duration: string;
  uploadDate: string;

  recipeName: string;
  cookTime: string;
  prepTime: string;
  servings: string;
  calories: string;
  ingredients: string;
  instructions: string;

  questions: QA[];
  howToName: string;
  totalTime: string;
  steps: HowToStep[];

  hiringOrganization: string;
  jobLocation: string;
  salary: string;
  employmentType: EmploymentType;

  breadcrumbs: Breadcrumb[];

  organizationName: string;
  organizationType: OrganizationType;

  websiteName: string;

  userAgent: string;
  disallow: string;
  allow: string;
  crawlDelay: string;
  sitemapUrl: string;

  pages: SitemapPage[];
  adsEntries: AdsEntry[];
  httpHeaders: HttpHeader[];
}

type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends unknown[] ? K : never;
}[keyof T];

type SecurityHeaderName =
  | "Cache-Control"
  | "Strict-Transport-Security"
  | "X-Frame-Options"
  | "X-Content-Type-Options"
  | "Referrer-Policy"
  | "Content-Security-Policy"
  | "X-XSS-Protection"
  | "Permissions-Policy"
  | "Cross-Origin-Embedder-Policy"
  | "Cross-Origin-Opener-Policy"
  | "Cross-Origin-Resource-Policy";

export type {
  Locale,
  Availability,
  Condition,
  EmploymentType,
  OrganizationType,
  ChangeFreq,
  QA,
  HowToStep,
  Breadcrumb,
  SitemapPage,
  AdsEntry,
  HttpHeader,
  SEOFormData,
  ArrayKeys,
  SecurityHeaderName,
};
