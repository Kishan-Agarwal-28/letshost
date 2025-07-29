import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download } from "lucide-react";
import { SmartDatetimeInput } from "@/components/ui/datetime-picker";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useToast } from "@/hooks/use-toast";
import type {
  Availability,
  Condition,
  EmploymentType,
  OrganizationType,
  ChangeFreq,
  SEOFormData,
  ArrayKeys,
  SecurityHeaderName,
} from "./seo.types.ts";
dayjs.extend(duration);

const SEOTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("structured-data");
  const [structuredDataType, setStructuredDataType] =
    useState<string>("article");
  const [openGraphType, setOpenGraphType] = useState<string>("website");
  const [twitterCardType, setTwitterCardType] = useState<string>("summary");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const [formData, setFormData] = useState<SEOFormData>({
    title: "",
    description: "",
    url: "",
    image: "",
    siteName: "",
    locale: "en_US",

    author: "",
    publishedTime: "",
    modifiedTime: "",
    section: "",
    tags: "",

    businessName: "",
    address: "",
    phone: "",
    email: "",
    openingHours: "",
    priceRange: "",

    productName: "",
    brand: "",
    price: "",
    currency: "USD",
    availability: "InStock",
    condition: "NewCondition",

    eventName: "",
    startDate: "",
    endDate: "",
    location: "",

    personName: "",
    jobTitle: "",
    company: "",

    videoUrl: "",
    duration: "",
    uploadDate: "",

    recipeName: "",
    cookTime: "",
    prepTime: "",
    servings: "",
    calories: "",
    ingredients: "",
    instructions: "",

    questions: [{ question: "", answer: "" }],
    howToName: "",
    totalTime: "",
    steps: [{ name: "", text: "" }],

    hiringOrganization: "",
    jobLocation: "",
    salary: "",
    employmentType: "FULL_TIME",

    breadcrumbs: [{ name: "", url: "" }],

    organizationName: "",
    organizationType: "Organization",

    websiteName: "",

    userAgent: "*",
    disallow: "",
    allow: "",
    crawlDelay: "",
    sitemapUrl: "",

    pages: [{ url: "", lastmod: "", changefreq: "weekly", priority: "0.8" }],
    adsEntries: [
      {
        domain: "",
        publisherId: "",
        relationship: "DIRECT",
        certificationId: "",
      },
    ],
    httpHeaders: [
      { name: "Cache-Control", value: "max-age=31536000; includeSubDomains" },
      {
        name: "Strict-Transport-Security",
        value: "max-age=16070400; includeSubDomains",
      },
      { name: "X-Frame-Options", value: "DENY" },
      { name: "X-Content-Type-Options", value: "nosniff" },
      { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        name: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' ",
      },
    ],
  });

  const updateFormData = <K extends keyof SEOFormData>(
    field: K,
    value: SEOFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateArrayField = <
    K extends ArrayKeys<SEOFormData>,
    I extends keyof SEOFormData[K][number],
  >(
    field: K,
    index: number,
    key: I,
    value: SEOFormData[K][number][I]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      ) as SEOFormData[K],
    }));
  };

  const addArrayItem = <K extends ArrayKeys<SEOFormData>>(
    field: K,
    template: SEOFormData[K][number]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], template],
    }));
  };

  const removeArrayItem = <K extends ArrayKeys<SEOFormData>>(
    field: K,
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const securityHeaders: Record<SecurityHeaderName, string> = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'",
    "X-XSS-Protection": "0",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  const { toast } = useToast();

  const generateStructuredData = () => {
    let schema = {};

    switch (structuredDataType) {
      case "article":
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: formData.title,
          description: formData.description,
          image: formData.image,
          author: {
            "@type": "Person",
            name: formData.author,
          },
          publisher: {
            "@type": "Organization",
            name: formData.siteName,
            logo: {
              "@type": "ImageObject",
              url: formData.image,
            },
          },
          datePublished: formData.publishedTime,
          dateModified: formData.modifiedTime,
          articleSection: formData.section,
          keywords: formData.tags,
        };
        break;

      case "breadcrumb":
        schema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: formData.breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@id": item.url,
              name: item.name,
            },
          })),
        };
        break;

      case "event":
        schema = {
          "@context": "https://schema.org",
          "@type": "Event",
          name: formData.eventName,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: {
            "@type": "Place",
            name: formData.location,
            address: formData.address,
          },
          image: formData.image,
        };
        break;

      case "faq":
        schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: formData.questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.answer,
            },
          })),
        };
        break;

      case "howto":
        schema = {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: formData.howToName,
          description: formData.description,
          totalTime: formData.totalTime,
          step: formData.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
        };
        break;

      case "jobposting":
        schema = {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: formData.jobTitle,
          description: formData.description,
          hiringOrganization: {
            "@type": "Organization",
            name: formData.hiringOrganization,
          },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              streetAddress: formData.jobLocation,
            },
          },
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: formData.currency,
            value: formData.salary,
          },
          employmentType: formData.employmentType,
          datePosted: new Date().toISOString().split("T")[0],
        };
        break;

      case "localbusiness":
        schema = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: formData.businessName,
          description: formData.description,
          address: {
            "@type": "PostalAddress",
            streetAddress: formData.address,
            addressLocality: "", // Add fields for city, state, zip
            addressRegion: "",
            postalCode: "",
          },
          telephone: formData.phone,
          email: formData.email,
          openingHours: formData.openingHours.split(",").map((s) => s.trim()),
          priceRange: formData.priceRange,
          image: formData.image,
        };
        break;

      case "organization":
        schema = {
          "@context": "https://schema.org",
          "@type": formData.organizationType,
          name: formData.organizationName,
          description: formData.description,
          url: formData.url,
          logo: formData.image,
        };
        break;

      case "person":
        schema = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: formData.personName,
          jobTitle: formData.jobTitle,
          worksFor: {
            "@type": "Organization",
            name: formData.company,
          },
          url: formData.url,
          image: formData.image,
        };
        break;

      case "product":
        schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: formData.productName,
          description: formData.description,
          brand: {
            "@type": "Brand",
            name: formData.brand,
          },
          offers: {
            "@type": "Offer",
            price: formData.price,
            priceCurrency: formData.currency,
            availability: `https://schema.org/${formData.availability}`,
            itemCondition: `https://schema.org/${formData.condition}`,
          },
          image: formData.image,
        };
        break;

      case "recipe":
        schema = {
          "@context": "https://schema.org",
          "@type": "Recipe",
          name: formData.recipeName,
          description: formData.description,
          image: formData.image,
          cookTime: formData.cookTime,
          prepTime: formData.prepTime,
          recipeYield: formData.servings,
          nutrition: {
            "@type": "NutritionInformation",
            calories: formData.calories,
          },
          recipeIngredient: formData.ingredients
            .split("\n")
            .filter((i) => i.trim()),
          recipeInstructions: formData.instructions
            .split("\n")
            .filter((i) => i.trim())
            .map((instruction) => ({
              "@type": "HowToStep",
              text: instruction,
            })),
        };
        break;

      case "video":
        schema = {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: formData.title,
          description: formData.description,
          contentUrl: formData.videoUrl,
          duration: formData.duration,
          uploadDate: formData.uploadDate,
          thumbnailUrl: formData.image,
        };
        break;

      case "website":
        schema = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: formData.websiteName,
          url: formData.url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${formData.url}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        };
        break;
    }

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  };

  const generateOpenGraph = () => {
    const tags = [
      `<meta property="og:title" content="${formData.title}" />`,
      `<meta property="og:description" content="${formData.description}" />`,
      `<meta property="og:url" content="${formData.url}" />`,
      `<meta property="og:image" content="${formData.image}" />`,
      `<meta property="og:site_name" content="${formData.siteName}" />`,
      `<meta property="og:locale" content="${formData.locale}" />`,
    ];

    switch (openGraphType) {
      case "article":
        tags.push(
          `<meta property="og:type" content="article" />`,
          `<meta property="article:author" content="${formData.author}" />`,
          `<meta property="article:published_time" content="${formData.publishedTime}" />`,
          `<meta property="article:modified_time" content="${formData.modifiedTime}" />`,
          `<meta property="article:section" content="${formData.section}" />`,
          ...formData.tags
            .split(",")
            .map(
              (tag) => `<meta property="article:tag" content="${tag.trim()}" />`
            )
        );
        break;
      case "product":
        tags.push(
          `<meta property="og:type" content="product" />`,
          `<meta property="product:price:amount" content="${formData.price}" />`,
          `<meta property="product:price:currency" content="${formData.currency}" />`,
          `<meta property="product:availability" content="${formData.availability}" />`,
          `<meta property="product:condition" content="${formData.condition}" />`
        );
        break;
      case "video":
        tags.push(
          `<meta property="og:type" content="video.other" />`,
          `<meta property="og:video" content="${formData.videoUrl}" />`,
          `<meta property="og:video:secure_url" content="${formData.videoUrl}" />`,
          `<meta property="og:video:type" content="text/html" />`,
          `<meta property="og:video:width" content="1280" />`,
          `<meta property="og:video:height" content="720" />`,
          `<meta property="og:video:duration" content="${formData.duration}" />`
        );
        break;
      default:
        tags.push(`<meta property="og:type" content="website" />`);
    }

    return tags.join("\n");
  };

  const generateTwitterCards = () => {
    const tags = [
      `<meta name="twitter:title" content="${formData.title}" />`,
      `<meta name="twitter:description" content="${formData.description}" />`,
      `<meta name="twitter:image" content="${formData.image}" />`,
      `<meta name="twitter:url" content="${formData.url}" />`,
    ];

    switch (twitterCardType) {
      case "summary":
        tags.unshift(`<meta name="twitter:card" content="summary" />`);
        break;
      case "summary_large_image":
        tags.unshift(
          `<meta name="twitter:card" content="summary_large_image" />`
        );
        break;
      case "app":
        tags.unshift(
          `<meta name="twitter:card" content="app" />`,
          `<meta name="twitter:app:name:iphone" content="${formData.title}" />`,
          `<meta name="twitter:app:id:iphone" content="APP_ID" />`, // Placeholder
          `<meta name="twitter:app:url:iphone" content="${formData.url}" />`
        );
        break;
      case "player":
        tags.unshift(
          `<meta name="twitter:card" content="player" />`,
          `<meta name="twitter:player" content="${formData.videoUrl}" />`,
          `<meta name="twitter:player:width" content="480" />`,
          `<meta name="twitter:player:height" content="270" />`
        );
        break;
    }

    return tags.join("\n");
  };

  const generateMetaTags = () => {
    return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${formData.title}</title>
<meta name="description" content="${formData.description}" />
<meta name="keywords" content="${formData.tags}" />
<meta name="author" content="${formData.author}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${formData.url}" />`;
  };

  const generateRobotsTxt = () => {
    let robots = `User-agent: ${formData.userAgent}\n`;

    if (formData.disallow) {
      robots +=
        formData.disallow
          .split("\n")
          .map((d) => `Disallow: ${d.trim()}`)
          .join("\n") + "\n";
    }

    if (formData.allow) {
      robots +=
        formData.allow
          .split("\n")
          .map((a) => `Allow: ${a.trim()}`)
          .join("\n") + "\n";
    }

    if (formData.crawlDelay) {
      robots += `Crawl-delay: ${formData.crawlDelay}\n`;
    }

    if (formData.sitemapUrl) {
      robots += `\nSitemap: ${formData.sitemapUrl}`;
    }

    return robots;
  };

  const generateSitemap = () => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const urls = formData.pages
      .map(
        (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date(page.lastmod).toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      )
      .join("\n");

    const footer = `</urlset>`;

    return `${header}\n${urls}\n${footer}`;
  };
  const generateAdsTxt = () => {
    const entries = formData.adsEntries
      .filter((entry) => entry.domain && entry.publisherId)
      .map((entry) => {
        const cert = entry.certificationId ? `, ${entry.certificationId}` : "";
        return `${entry.domain}, ${entry.publisherId}, ${entry.relationship}${cert}`;
      });

    return entries.join("\n");
  };

  const generateHttpHeaders = () => {
    const headers = formData.httpHeaders
      .filter((header) => header.name && header.value)
      .map((header) => `${header.name}: ${header.value}`)
      .join("\n");

    const htaccessFormat = formData.httpHeaders
      .filter((header) => header.name && header.value)
      .map((header) => `Header always set ${header.name} "${header.value}"`)
      .join("\n");

    const nginxFormat = formData.httpHeaders
      .filter((header) => header.name && header.value)
      .map((header) => `add_header ${header.name} "${header.value}" always;`)
      .join("\n");

    return `# Raw Headers\n${headers}\n\n# Apache (.htaccess)\n<IfModule mod_headers.c>\n${htaccessFormat}\n</IfModule>\n\n# Nginx\n${nginxFormat}`;
  };
  const handleGenerate = () => {
    let code = "";

    switch (activeTab) {
      case "structured-data":
        code = generateStructuredData();
        break;
      case "open-graph":
        code = generateOpenGraph();
        break;
      case "twitter-cards":
        code = generateTwitterCards();
        break;
      case "meta-tags":
        code = generateMetaTags();
        break;
      case "robots":
        code = generateRobotsTxt();
        break;
      case "sitemap":
        code = generateSitemap();
        break;
      case "ads":
        code = generateAdsTxt();
        break;
      case "headers":
        code = generateHttpHeaders();
        break;
    }

    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Copied to clipboard",
      description: "Code copied to clipboard",
      duration: 5000,
      variant: "default",
    });
  };

  const downloadFile = () => {
    let filename = "";
    let mimeType = "text/plain";

    switch (activeTab) {
      case "robots":
        filename = "robots.txt";
        break;
      case "sitemap":
        filename = "sitemap.xml";
        mimeType = "application/xml";
        break;
      case "ads":
        filename = "ads.txt";
        break;
      case "headers":
        filename = "headers.conf";
        break;
      default:
        filename = `${activeTab}.html`;
        mimeType = "text/html";
    }

    const blob = new Blob([generatedCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStructuredDataForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="my-2" htmlFor="structured-type">
          Structured Data Type
        </Label>
        <Select
          value={structuredDataType}
          onValueChange={setStructuredDataType}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="breadcrumb">Breadcrumb</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="howto">How-to</SelectItem>
            <SelectItem value="jobposting">Job Posting</SelectItem>
            <SelectItem value="localbusiness">Local Business</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="recipe">Recipe</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="website">Website</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Article Schema Fields */}
      {structuredDataType === "article" && (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="title">
              Article Headline
            </Label>
            <Input
              className="w-full"
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
              placeholder="10 Tips for Better SEO"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Article Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Learn the best SEO practices to improve your website ranking..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="author">
              Author Name
            </Label>
            <Input
              className="w-full"
              id="author"
              value={formData.author}
              onChange={(e) => updateFormData("author", e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="siteName">
              Publisher/Site Name
            </Label>
            <Input
              className="w-full"
              id="siteName"
              value={formData.siteName}
              onChange={(e) => updateFormData("siteName", e.target.value)}
              placeholder="My Blog"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="image">
              Featured Image URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/article-image.jpg"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="section">
              Article Category
            </Label>
            <Input
              className="w-full"
              id="section"
              value={formData.section}
              onChange={(e) => updateFormData("section", e.target.value)}
              placeholder="Technology, Business, etc."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="publishedTime">
              Published Date
            </Label>
            <SmartDatetimeInput
              id="publishedTime"
              value={new Date(formData.publishedTime)}
              onValueChange={(e) =>
                updateFormData("publishedTime", e?.toISOString() ?? "")
              }
              placeholder="e.g. Yesterday 2pm"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="modifiedTime">
              Last Modified Date
            </Label>
            <SmartDatetimeInput
              id="modifiedTime"
              value={new Date(formData.modifiedTime)}
              onValueChange={(e) =>
                updateFormData("modifiedTime", e?.toISOString() ?? "")
              }
              placeholder="e.g. Today 9am"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="keywords">
              Article Keywords (comma-separated)
            </Label>
            <Textarea
              id="keywords"
              value={formData.tags}
              onChange={(e) => updateFormData("tags", e.target.value)}
              placeholder="SEO, web development, digital marketing"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Product Schema Fields */}
      {structuredDataType === "product" && (
        <div className="grid grid-cols-1 md:grid-cols-1  gap-4">
          <div>
            <Label className="my-2" htmlFor="productName">
              Product Name
            </Label>
            <Input
              className="w-full"
              id="productName"
              value={formData.productName}
              onChange={(e) => updateFormData("productName", e.target.value)}
              placeholder="iPhone 15 Pro Max"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Product Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Latest iPhone with advanced camera system and A17 Pro chip..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="brand">
              Brand Name
            </Label>
            <Input
              className="w-full"
              id="brand"
              value={formData.brand}
              onChange={(e) => updateFormData("brand", e.target.value)}
              placeholder="Apple"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="price">
              Price (numbers only)
            </Label>
            <Input
              className="w-full"
              id="price"
              value={formData.price}
              onChange={(e) => updateFormData("price", e.target.value)}
              placeholder="999.99"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="currency">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateFormData("currency", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="availability">
              Availability
            </Label>
            <Select
              value={formData.availability}
              onValueChange={(value) =>
                updateFormData("availability", value as Availability)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="InStock">In Stock</SelectItem>
                <SelectItem value="OutOfStock">Out of Stock</SelectItem>
                <SelectItem value="PreOrder">Pre-Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="condition">
              Product Condition
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value) =>
                updateFormData("condition", value as Condition)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NewCondition">New</SelectItem>
                <SelectItem value="UsedCondition">Used</SelectItem>
                <SelectItem value="RefurbishedCondition">
                  Refurbished
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="image">
              Product Image URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/product-image.jpg"
            />
          </div>
        </div>
      )}

      {/* Event Schema Fields */}
      {structuredDataType === "event" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="eventName">
              Event Name
            </Label>
            <Input
              className="w-full"
              id="eventName"
              value={formData.eventName}
              onChange={(e) => updateFormData("eventName", e.target.value)}
              placeholder="Web Development Conference 2025"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Event Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Join industry leaders for the latest in web development trends..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="startDate">
              Start Date & Time
            </Label>
            <SmartDatetimeInput
              id="startDate"
              value={new Date(formData.startDate)}
              onValueChange={(e) =>
                updateFormData("startDate", e?.toISOString() ?? "")
              }
              placeholder="e.g. Tomorrow 9am"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="endDate">
              End Date & Time
            </Label>
            <SmartDatetimeInput
              id="endDate"
              value={new Date(formData.endDate)}
              onValueChange={(e) =>
                updateFormData("endDate", e?.toISOString() ?? "")
              }
              placeholder="e.g. Tomorrow 5pm"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="location">
              Event Location
            </Label>
            <Input
              className="w-full"
              id="location"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              placeholder="San Francisco Convention Center"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="address">
              Event Address
            </Label>
            <Input
              className="w-full"
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              placeholder="747 Howard St, San Francisco, CA 94103"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="image">
              Event Image URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/event-banner.jpg"
            />
          </div>
        </div>
      )}

      {/* Local Business Schema Fields */}
      {structuredDataType === "localbusiness" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="businessName">
              Business Name
            </Label>
            <Input
              className="w-full"
              id="businessName"
              value={formData.businessName}
              onChange={(e) => updateFormData("businessName", e.target.value)}
              placeholder="Joe's Pizza Place"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Business Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Authentic New York style pizza made with fresh ingredients..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="address">
              Street Address
            </Label>
            <Input
              className="w-full"
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              placeholder="123 Main St, New York, NY 10001"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="phone">
              Phone Number
            </Label>
            <Input
              className="w-full"
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              placeholder="+1-555-123-4567"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="email">
              Email Address
            </Label>
            <Input
              className="w-full"
              id="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              placeholder="info@joespizza.com"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="openingHours">
              Opening Hours (comma-separated)
            </Label>
            <Input
              className="w-full"
              id="openingHours"
              value={formData.openingHours}
              onChange={(e) => updateFormData("openingHours", e.target.value)}
              placeholder="Mo-Su 11:00-22:00"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="priceRange">
              Price Range
            </Label>
            <Input
              className="w-full"
              id="priceRange"
              value={formData.priceRange}
              onChange={(e) => updateFormData("priceRange", e.target.value)}
              placeholder="$$"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="image">
              Business Image URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/business-photo.jpg"
            />
          </div>
        </div>
      )}

      {/* FAQ Schema Fields */}
      {structuredDataType === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">
              FAQ Questions & Answers
            </Label>
            <Button
              type="button"
              onClick={() =>
                addArrayItem("questions", { question: "", answer: "" })
              }
              size="sm"
            >
              Add FAQ
            </Button>
          </div>
          {formData.questions.map((qa, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">FAQ #{index + 1}</Label>
                {formData.questions.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeArrayItem("questions", index)}
                    size="sm"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div>
                <Label className="my-2" htmlFor={`question-${index}`}>
                  Question
                </Label>
                <Input
                  className="w-full"
                  id={`question-${index}`}
                  value={qa.question}
                  onChange={(e) =>
                    updateArrayField(
                      "questions",
                      index,
                      "question",
                      e.target.value
                    )
                  }
                  placeholder="What are your business hours?"
                />
              </div>
              <div>
                <Label className="my-2" htmlFor={`answer-${index}`}>
                  Answer
                </Label>
                <Textarea
                  id={`answer-${index}`}
                  value={qa.answer}
                  onChange={(e) =>
                    updateArrayField(
                      "questions",
                      index,
                      "answer",
                      e.target.value
                    )
                  }
                  placeholder="We are open Monday through Friday from 9 AM to 5 PM..."
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How-to Schema Fields */}
      {structuredDataType === "howto" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
            <div>
              <Label className="my-2" htmlFor="howToName">
                How-to Title
              </Label>
              <Input
                className="w-full"
                id="howToName"
                value={formData.howToName}
                onChange={(e) => updateFormData("howToName", e.target.value)}
                placeholder="How to Bake a Perfect Chocolate Cake"
              />
            </div>
            <div>
              <Label className="my-2" htmlFor="description">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Learn how to bake a delicious chocolate cake from scratch..."
              />
            </div>
            <div>
              <Label className="my-2" htmlFor="totalTime">
                Total Time (ISO 8601 duration)
              </Label>
              <Input
                className="w-full"
                id="totalTime"
                value={formData.totalTime}
                onChange={(e) => updateFormData("totalTime", e.target.value)}
                placeholder="PT2H30M (2 hours 30 minutes)"
              />
            </div>
            <div>
              <Label className="my-2" htmlFor="image">
                Guide Image URL
              </Label>
              <Input
                className="w-full"
                id="image"
                value={formData.image}
                onChange={(e) => updateFormData("image", e.target.value)}
                placeholder="https://example.com/howto-guide.jpg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">How-to Steps</Label>
              <Button
                type="button"
                onClick={() => addArrayItem("steps", { name: "", text: "" })}
                size="sm"
              >
                Add Step
              </Button>
            </div>
            {formData.steps.map((step, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Step {index + 1}</Label>
                  {formData.steps.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeArrayItem("steps", index)}
                      size="sm"
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div>
                  <Label className="my-2" htmlFor={`step-name-${index}`}>
                    Step Name
                  </Label>
                  <Input
                    className="w-full"
                    id={`step-name-${index}`}
                    value={step.name}
                    onChange={(e) =>
                      updateArrayField("steps", index, "name", e.target.value)
                    }
                    placeholder="Preheat the oven"
                  />
                </div>
                <div>
                  <Label className="my-2" htmlFor={`step-text-${index}`}>
                    Step Instructions
                  </Label>
                  <Textarea
                    id={`step-text-${index}`}
                    value={step.text}
                    onChange={(e) =>
                      updateArrayField("steps", index, "text", e.target.value)
                    }
                    placeholder="Preheat your oven to 350°F (175°C) and grease a 9-inch cake pan..."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Schema Fields */}
      {structuredDataType === "recipe" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="recipeName">
              Recipe Name
            </Label>
            <Input
              className="w-full"
              id="recipeName"
              value={formData.recipeName}
              onChange={(e) => updateFormData("recipeName", e.target.value)}
              placeholder="Classic Chocolate Chip Cookies"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Recipe Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Soft and chewy chocolate chip cookies that are perfect for any occasion..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="cookTime">
              Cook Time (ISO 8601)
            </Label>
            <Input
              className="w-full"
              id="cookTime"
              value={formData.cookTime}
              onChange={(e) => updateFormData("cookTime", e.target.value)}
              placeholder="PT12M (12 minutes)"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="prepTime">
              Prep Time (ISO 8601)
            </Label>
            <Input
              className="w-full"
              id="prepTime"
              value={formData.prepTime}
              onChange={(e) => updateFormData("prepTime", e.target.value)}
              placeholder="PT15M (15 minutes)"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="servings">
              Number of Servings
            </Label>
            <Input
              className="w-full"
              id="servings"
              value={formData.servings}
              onChange={(e) => updateFormData("servings", e.target.value)}
              placeholder="24 cookies"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="calories">
              Calories per Serving
            </Label>
            <Input
              className="w-full"
              id="calories"
              value={formData.calories}
              onChange={(e) => updateFormData("calories", e.target.value)}
              placeholder="150"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="image">
              Recipe Image URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/recipe-photo.jpg"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="ingredients">
              Ingredients (one per line)
            </Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => updateFormData("ingredients", e.target.value)}
              placeholder="2 cups all-purpose flour&#10;1 cup butter, softened&#10;3/4 cup brown sugar"
              rows={6}
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="instructions">
              Instructions (one step per line)
            </Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => updateFormData("instructions", e.target.value)}
              placeholder="Preheat oven to 375°F&#10;Mix butter and sugars until creamy&#10;Add eggs and vanilla"
              rows={6}
            />
          </div>
        </div>
      )}

      {/* Person Schema Fields */}
      {structuredDataType === "person" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="personName">
              Person Name
            </Label>
            <Input
              className="w-full"
              id="personName"
              value={formData.personName}
              onChange={(e) => updateFormData("personName", e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="jobTitle">
              Job Title
            </Label>
            <Input
              className="w-full"
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => updateFormData("jobTitle", e.target.value)}
              placeholder="Senior Software Engineer"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="company">
              Company/Organization
            </Label>
            <Input
              className="w-full"
              id="company"
              value={formData.company}
              onChange={(e) => updateFormData("company", e.target.value)}
              placeholder="Tech Corp Inc."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="url">
              Personal Website URL
            </Label>
            <Input
              className="w-full"
              id="url"
              value={formData.url}
              onChange={(e) => updateFormData("url", e.target.value)}
              placeholder="https://janesmith.com"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="image">
              Profile Photo URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/profile-photo.jpg"
            />
          </div>
        </div>
      )}

      {/* Organization Schema Fields */}
      {structuredDataType === "organization" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="organizationName">
              Organization Name
            </Label>
            <Input
              className="w-full"
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) =>
                updateFormData("organizationName", e.target.value)
              }
              placeholder="Tech Solutions Inc."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="organizationType">
              Organization Type
            </Label>
            <Select
              value={formData.organizationType}
              onValueChange={(value) =>
                updateFormData("organizationType", value as OrganizationType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Organization">Organization</SelectItem>
                <SelectItem value="Corporation">Corporation</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="GovernmentOrganization">
                  Government Organization
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Organization Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Leading provider of innovative technology solutions..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="url">
              Organization Website
            </Label>
            <Input
              className="w-full"
              id="url"
              value={formData.url}
              onChange={(e) => updateFormData("url", e.target.value)}
              placeholder="https://techsolutions.com"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="image">
              Organization Logo URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      )}

      {/* Job Posting Schema Fields */}
      {structuredDataType === "jobposting" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="jobTitle">
              Job Title
            </Label>
            <Input
              className="w-full"
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => updateFormData("jobTitle", e.target.value)}
              placeholder="Senior React Developer"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Job Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="We are looking for an experienced React developer to join our team..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="hiringOrganization">
              Hiring Organization
            </Label>
            <Input
              className="w-full"
              id="hiringOrganization"
              value={formData.hiringOrganization}
              onChange={(e) =>
                updateFormData("hiringOrganization", e.target.value)
              }
              placeholder="Tech Innovations LLC"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="jobLocation">
              Job Location
            </Label>
            <Input
              className="w-full"
              id="jobLocation"
              value={formData.jobLocation}
              onChange={(e) => updateFormData("jobLocation", e.target.value)}
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="salary">
              Salary (annual)
            </Label>
            <Input
              className="w-full"
              id="salary"
              value={formData.salary}
              onChange={(e) => updateFormData("salary", e.target.value)}
              placeholder="120000"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="employmentType">
              Employment Type
            </Label>
            <Select
              value={formData.employmentType}
              onValueChange={(value) =>
                updateFormData("employmentType", value as EmploymentType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                <SelectItem value="TEMPORARY">Temporary</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="currency">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateFormData("currency", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Video Schema Fields */}
      {structuredDataType === "video" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="title">
              Video Title
            </Label>
            <Input
              className="w-full"
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
              placeholder="Introduction to React Hooks"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Video Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Learn the basics of React Hooks in this comprehensive tutorial..."
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="videoUrl">
              Video URL
            </Label>
            <Input
              className="w-full"
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => updateFormData("videoUrl", e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="duration">
              Duration (ISO 8601)
            </Label>
            <Input
              className="w-full"
              id="duration"
              value={formData.duration}
              onChange={(e) => updateFormData("duration", e.target.value)}
              placeholder="PT15M30S (15 minutes 30 seconds)"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="uploadDate">
              Upload Date
            </Label>
            <SmartDatetimeInput
              id="uploadDate"
              value={new Date(formData.uploadDate)}
              onValueChange={(e) =>
                updateFormData("uploadDate", e?.toISOString() ?? "")
              }
              placeholder="e.g. Last week"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="image">
              Video Thumbnail URL
            </Label>
            <Input
              className="w-full"
              id="image"
              value={formData.image}
              onChange={(e) => updateFormData("image", e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>
        </div>
      )}

      {/* Website Schema Fields */}
      {structuredDataType === "website" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
          <div>
            <Label className="my-2" htmlFor="websiteName">
              Website Name
            </Label>
            <Input
              className="w-full"
              id="websiteName"
              value={formData.websiteName}
              onChange={(e) => updateFormData("websiteName", e.target.value)}
              placeholder="My Awesome Website"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="url">
              Website URL
            </Label>
            <Input
              className="w-full"
              id="url"
              value={formData.url}
              onChange={(e) => updateFormData("url", e.target.value)}
              placeholder="https://myawesomewebsite.com"
            />
          </div>
        </div>
      )}

      {/* Breadcrumb Schema Fields */}
      {structuredDataType === "breadcrumb" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">
              Breadcrumb Navigation
            </Label>
            <Button
              type="button"
              onClick={() => addArrayItem("breadcrumbs", { name: "", url: "" })}
              size="sm"
            >
              Add Breadcrumb
            </Button>
          </div>
          {formData.breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Breadcrumb {index + 1}</Label>
                {formData.breadcrumbs.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeArrayItem("breadcrumbs", index)}
                    size="sm"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
                <div>
                  <Label className="my-2" htmlFor={`breadcrumb-name-${index}`}>
                    Page Name
                  </Label>
                  <Input
                    className="w-full"
                    id={`breadcrumb-name-${index}`}
                    value={breadcrumb.name}
                    onChange={(e) =>
                      updateArrayField(
                        "breadcrumbs",
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Home, Products, Category, etc."
                  />
                </div>
                <div>
                  <Label className="my-2" htmlFor={`breadcrumb-url-${index}`}>
                    Page URL
                  </Label>
                  <Input
                    className="w-full"
                    id={`breadcrumb-url-${index}`}
                    value={breadcrumb.url}
                    onChange={(e) =>
                      updateArrayField(
                        "breadcrumbs",
                        index,
                        "url",
                        e.target.value
                      )
                    }
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOpenGraphForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="my-2" htmlFor="og-type">
          Open Graph Type
        </Label>
        <Select value={openGraphType} onValueChange={setOpenGraphType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
        <div>
          <Label className="my-2" htmlFor="title">
            Title
          </Label>
          <Input
            className="w-full"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            placeholder="Page Title"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            placeholder="Page description for social media sharing..."
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="url">
            URL
          </Label>
          <Input
            className="w-full"
            id="url"
            value={formData.url}
            onChange={(e) => updateFormData("url", e.target.value)}
            placeholder="https://example.com/page"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="image">
            Image URL
          </Label>
          <Input
            className="w-full"
            id="image"
            value={formData.image}
            onChange={(e) => updateFormData("image", e.target.value)}
            placeholder="https://example.com/og-image.jpg"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="siteName">
            Site Name
          </Label>
          <Input
            className="w-full"
            id="siteName"
            value={formData.siteName}
            onChange={(e) => updateFormData("siteName", e.target.value)}
            placeholder="My Website"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="locale">
            Locale
          </Label>
          <Input
            className="w-full"
            id="locale"
            value={formData.locale}
            onChange={(e) => updateFormData("locale", e.target.value)}
            placeholder="en_US"
          />
        </div>
      </div>

      {/* Article-specific fields */}
      {openGraphType === "article" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label className="my-2" htmlFor="author">
              Author
            </Label>
            <Input
              className="w-full"
              id="author"
              value={formData.author}
              onChange={(e) => updateFormData("author", e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="section">
              Section
            </Label>
            <Input
              className="w-full"
              id="section"
              value={formData.section}
              onChange={(e) => updateFormData("section", e.target.value)}
              placeholder="Technology"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="publishedTime">
              Published Time
            </Label>
            <SmartDatetimeInput
              id="publishedTime"
              value={new Date(formData.publishedTime)}
              onValueChange={(e) =>
                updateFormData("publishedTime", e?.toISOString() ?? "")
              }
              placeholder="e.g. Yesterday"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="modifiedTime">
              Modified Time
            </Label>
            <SmartDatetimeInput
              id="modifiedTime"
              value={new Date(formData.modifiedTime)}
              onValueChange={(e) =>
                updateFormData("modifiedTime", e?.toISOString() ?? "")
              }
              placeholder="e.g. Today"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label className="my-2" htmlFor="tags">
              Tags (comma-separated)
            </Label>
            <Input
              className="w-full"
              id="tags"
              value={formData.tags}
              onChange={(e) => updateFormData("tags", e.target.value)}
              placeholder="technology, web development, programming"
            />
          </div>
        </div>
      )}

      {/* Product-specific fields */}
      {openGraphType === "product" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label className="my-2" htmlFor="price">
              Price
            </Label>
            <Input
              className="w-full"
              id="price"
              value={formData.price}
              onChange={(e) => updateFormData("price", e.target.value)}
              placeholder="99.99"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="currency">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateFormData("currency", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="availability">
              Availability
            </Label>
            <Select
              value={formData.availability}
              onValueChange={(value) =>
                updateFormData("availability", value as Availability)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="InStock">In Stock</SelectItem>
                <SelectItem value="OutOfStock">Out of Stock</SelectItem>
                <SelectItem value="PreOrder">Pre-Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="my-2" htmlFor="condition">
              Condition
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value) =>
                updateFormData("condition", value as Condition)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NewCondition">New</SelectItem>
                <SelectItem value="UsedCondition">Used</SelectItem>
                <SelectItem value="RefurbishedCondition">
                  Refurbished
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Video-specific fields */}
      {openGraphType === "video" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label className="my-2" htmlFor="videoUrl">
              Video URL
            </Label>
            <Input
              className="w-full"
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => updateFormData("videoUrl", e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="duration">
              Duration (seconds)
            </Label>
            <Input
              className="w-full"
              id="duration"
              value={formData.duration}
              onChange={(e) => updateFormData("duration", e.target.value)}
              placeholder="300"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderTwitterCardsForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="my-2" htmlFor="twitter-type">
          Twitter Card Type
        </Label>
        <Select value={twitterCardType} onValueChange={setTwitterCardType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Summary</SelectItem>
            <SelectItem value="summary_large_image">
              Summary Large Image
            </SelectItem>
            <SelectItem value="app">App</SelectItem>
            <SelectItem value="player">Player</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
        <div>
          <Label className="my-2" htmlFor="title">
            Title
          </Label>
          <Input
            className="w-full"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            placeholder="Page Title"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="description">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            placeholder="Page description for Twitter sharing..."
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="image">
            Image URL
          </Label>
          <Input
            className="w-full"
            id="image"
            value={formData.image}
            onChange={(e) => updateFormData("image", e.target.value)}
            placeholder="https://example.com/twitter-image.jpg"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="url">
            URL
          </Label>
          <Input
            className="w-full"
            id="url"
            value={formData.url}
            onChange={(e) => updateFormData("url", e.target.value)}
            placeholder="https://example.com/page"
          />
        </div>
      </div>

      {/* Player card specific fields */}
      {twitterCardType === "player" && (
        <div className="grid grid-cols-1  md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label className="my-2" htmlFor="videoUrl">
              Player URL
            </Label>
            <Input
              className="w-full"
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => updateFormData("videoUrl", e.target.value)}
              placeholder="https://example.com/player"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderMetaTagsForm = () => (
    <div className="grid grid-cols-1 sm:grid-cols-1  md:grid-cols-2 gap-4">
      <div>
        <Label className="my-2" htmlFor="title">
          Page Title
        </Label>
        <Input
          className="w-full"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder="My Awesome Page"
        />
      </div>
      <div>
        <Label className="my-2" htmlFor="description">
          Meta Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder="A comprehensive description of this page content..."
        />
      </div>
      <div>
        <Label className="my-2" htmlFor="tags">
          Keywords
        </Label>
        <Input
          className="w-full"
          id="tags"
          value={formData.tags}
          onChange={(e) => updateFormData("tags", e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>
      <div>
        <Label className="my-2" htmlFor="author">
          Author
        </Label>
        <Input
          className="w-full"
          id="author"
          value={formData.author}
          onChange={(e) => updateFormData("author", e.target.value)}
          placeholder="John Doe"
        />
      </div>
      <div className="col-span-1 sm:col-span-2">
        <Label className="my-2" htmlFor="url">
          Canonical URL
        </Label>
        <Input
          className="w-full"
          id="url"
          value={formData.url}
          onChange={(e) => updateFormData("url", e.target.value)}
          placeholder="https://example.com/page"
        />
      </div>
    </div>
  );

  const renderRobotsForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
        <div>
          <Label className="my-2" htmlFor="userAgent">
            User Agent
          </Label>
          <Input
            className="w-full"
            id="userAgent"
            value={formData.userAgent}
            onChange={(e) => updateFormData("userAgent", e.target.value)}
            placeholder="*"
          />
        </div>
        <div>
          <Label className="my-2" htmlFor="crawlDelay">
            Crawl Delay (seconds)
          </Label>
          <Input
            className="w-full"
            id="crawlDelay"
            value={formData.crawlDelay}
            onChange={(e) => updateFormData("crawlDelay", e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      <div>
        <Label className="my-2" htmlFor="disallow">
          Disallow Paths (one per line)
        </Label>
        <Textarea
          id="disallow"
          value={formData.disallow}
          onChange={(e) => updateFormData("disallow", e.target.value)}
          placeholder="/admin/&#10;/private/&#10;/tmp/"
          rows={4}
        />
      </div>

      <div>
        <Label className="my-2" htmlFor="allow">
          Allow Paths (one per line)
        </Label>
        <Textarea
          id="allow"
          value={formData.allow}
          onChange={(e) => updateFormData("allow", e.target.value)}
          placeholder="/public/&#10;/images/"
          rows={4}
        />
      </div>

      <div>
        <Label className="my-2" htmlFor="sitemapUrl">
          Sitemap URL
        </Label>
        <Input
          className="w-full"
          id="sitemapUrl"
          value={formData.sitemapUrl}
          onChange={(e) => updateFormData("sitemapUrl", e.target.value)}
          placeholder="https://example.com/sitemap.xml"
        />
      </div>
    </div>
  );

  const renderSitemapForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Sitemap Pages</Label>
        <Button
          type="button"
          onClick={() =>
            addArrayItem("pages", {
              url: "",
              lastmod: new Date().toISOString().split("T")[0],
              changefreq: "weekly",
              priority: "0.8",
            })
          }
          size="sm"
        >
          Add Page
        </Button>
      </div>

      {formData.pages.map((page, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Page {index + 1}</Label>
            {formData.pages.length > 1 && (
              <Button
                type="button"
                onClick={() => removeArrayItem("pages", index)}
                size="sm"
                variant="destructive"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1  md:grid-cols-2 gap-4">
            <div>
              <Label className="my-2" htmlFor={`page-url-${index}`}>
                Page URL
              </Label>
              <Input
                className="w-full"
                id={`page-url-${index}`}
                value={page.url}
                onChange={(e) =>
                  updateArrayField("pages", index, "url", e.target.value)
                }
                placeholder="https://example.com/page"
              />
            </div>
            <div>
              <Label className="my-2" htmlFor={`page-lastmod-${index}`}>
                Last Modified
              </Label>
              <Input
                className="w-full"
                id={`page-lastmod-${index}`}
                type="date"
                value={page.lastmod}
                onChange={(e) =>
                  updateArrayField("pages", index, "lastmod", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="my-2" htmlFor={`page-changefreq-${index}`}>
                Change Frequency
              </Label>
              <Select
                value={page.changefreq}
                onValueChange={(value) =>
                  updateArrayField(
                    "pages",
                    index,
                    "changefreq",
                    value as ChangeFreq
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="my-2" htmlFor={`page-priority-${index}`}>
                Priority (0.0 - 1.0)
              </Label>
              <Input
                className="w-full"
                id={`page-priority-${index}`}
                value={page.priority}
                onChange={(e) =>
                  updateArrayField("pages", index, "priority", e.target.value)
                }
                placeholder="0.8"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  const renderAdsForm = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">About Ads.txt</h3>
        <p className="text-blue-800 text-sm">
          Ads.txt helps fight ad fraud by allowing publishers to declare which
          companies are authorized to sell their inventory. Place this file at
          the root of your domain (e.g., https://example.com/ads.txt).
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Authorized Sellers</Label>
        <Button
          type="button"
          onClick={() =>
            addArrayItem("adsEntries", {
              domain: "",
              publisherId: "",
              relationship: "DIRECT",
              certificationId: "",
            })
          }
          size="sm"
        >
          Add Entry
        </Button>
      </div>

      {formData.adsEntries.map((entry, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Entry {index + 1}</Label>
            {formData.adsEntries.length > 1 && (
              <Button
                type="button"
                onClick={() => removeArrayItem("adsEntries", index)}
                size="sm"
                variant="destructive"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
            <div>
              <Label className="my-2" htmlFor={`ads-domain-${index}`}>
                Domain
              </Label>
              <Input
                className="w-full"
                id={`ads-domain-${index}`}
                value={entry.domain}
                onChange={(e) =>
                  updateArrayField(
                    "adsEntries",
                    index,
                    "domain",
                    e.target.value
                  )
                }
                placeholder="google.com, facebook.com, etc."
              />
            </div>
            <div>
              <Label className="my-2" htmlFor={`ads-publisher-${index}`}>
                Publisher ID
              </Label>
              <Input
                className="w-full"
                id={`ads-publisher-${index}`}
                value={entry.publisherId}
                onChange={(e) =>
                  updateArrayField(
                    "adsEntries",
                    index,
                    "publisherId",
                    e.target.value
                  )
                }
                placeholder="pub-0000000000000000"
              />
            </div>
            <div>
              <Label className="my-2" htmlFor={`ads-relationship-${index}`}>
                Relationship
              </Label>
              <Select
                value={entry.relationship}
                onValueChange={(value) =>
                  updateArrayField(
                    "adsEntries",
                    index,
                    "relationship",
                    value as "DIRECT" | "RESELLER"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="RESELLER">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="my-2" htmlFor={`ads-cert-${index}`}>
                Certification Authority ID (optional)
              </Label>
              <Input
                className="w-full"
                id={`ads-cert-${index}`}
                value={entry.certificationId}
                onChange={(e) =>
                  updateArrayField(
                    "adsEntries",
                    index,
                    "certificationId",
                    e.target.value
                  )
                }
                placeholder="f08c47fec0942fa0"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">
          Common Ad Networks
        </h4>
        <div className="text-yellow-800 text-sm space-y-1">
          <p>
            <strong>Google AdSense:</strong> google.com, pub-XXXXXXXXXXXXXXXX,
            DIRECT, f08c47fec0942fa0
          </p>
          <p>
            <strong>Facebook Audience Network:</strong> facebook.com,
            XXXXXXXXXXXXXXXX, DIRECT, c3e20eee3f780d68
          </p>
          <p>
            <strong>Amazon Publisher Services:</strong> amazon-adsystem.com,
            XXXX, DIRECT
          </p>
        </div>
      </div>
    </div>
  );
  const HelpText = ({
    label,
    description,
    examples,
  }: {
    label: string;
    description: string;
    examples: string[];
  }) => (
    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
      <strong>{label}:</strong> {description}
      <br />
      <strong>Examples:</strong> {examples.join(", ")}
    </div>
  );

  const renderHeadersForm = () => (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">
          HTTP Security Headers
        </h3>
        <p className="text-green-800 text-sm">
          Security headers help protect your website from various attacks.
          Configure these headers in your web server or through your hosting
          provider.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-lg font-semibold">HTTP Headers</Label>
        <Button
          type="button"
          onClick={() => addArrayItem("httpHeaders", { name: "", value: "" })}
          size="sm"
          className="w-full sm:w-auto"
        >
          Add Header
        </Button>
      </div>

      {formData.httpHeaders.map((header, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label className="font-semibold">Header {index + 1}</Label>
            <Button
              type="button"
              onClick={() => removeArrayItem("httpHeaders", index)}
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Remove
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="my-2" htmlFor={`header-name-${index}`}>
                Header Name
              </Label>
              <Select
                value={header.name}
                onValueChange={(value) => {
                  const defaultValue =
                    securityHeaders[value as SecurityHeaderName] || "";
                  updateArrayField("httpHeaders", index, "name", value);
                  if (!header.value) {
                    updateArrayField(
                      "httpHeaders",
                      index,
                      "value",
                      defaultValue
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(securityHeaders).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label className="my-2" htmlFor={`header-value-${index}`}>
                Header Value
              </Label>
              <Input
                className="w-full"
                id={`header-value-${index}`}
                value={securityHeaders[header.name as SecurityHeaderName] ?? ""}
                onChange={(e) =>
                  updateArrayField(
                    "httpHeaders",
                    index,
                    "value",
                    e.target.value
                  )
                }
                placeholder="Header value..."
              />
            </div>
          </div>

          {/* Help Text for each Header */}
          {header.name === "Cache-Control" && (
            <HelpText
              label="Cache-Control"
              examples={[
                "no-store",
                "no-cache",
                "must-revalidate",
                "max-age=31536000",
              ]}
              description="Controls caching behavior in browsers and intermediaries."
            />
          )}
          {header.name === "Strict-Transport-Security" && (
            <HelpText
              label="Strict-Transport-Security"
              examples={["max-age=31536000; includeSubDomains; preload"]}
              description="Forces HTTPS connections for future requests."
            />
          )}
          {header.name === "X-Frame-Options" && (
            <HelpText
              label="X-Frame-Options"
              examples={[
                "DENY",
                "SAMEORIGIN",
                "ALLOW-FROM https://example.com",
              ]}
              description="Prevents clickjacking by controlling if your site can be embedded in iframes."
            />
          )}
          {header.name === "X-Content-Type-Options" && (
            <HelpText
              label="X-Content-Type-Options"
              examples={["nosniff"]}
              description="Prevents MIME-type sniffing."
            />
          )}
          {header.name === "Referrer-Policy" && (
            <HelpText
              label="Referrer-Policy"
              examples={[
                "no-referrer",
                "origin",
                "strict-origin-when-cross-origin",
                "unsafe-url",
              ]}
              description="Controls what information is included in the Referer header."
            />
          )}
          {header.name === "Content-Security-Policy" && (
            <HelpText
              label="Content-Security-Policy"
              examples={[
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self'",
              ]}
              description="Defines valid sources for content (scripts, styles, etc.). Helps prevent XSS attacks."
            />
          )}
          {header.name === "X-XSS-Protection" && (
            <HelpText
              label="X-XSS-Protection"
              examples={["0", "1; mode=block"]}
              description="Legacy header for enabling or disabling XSS filters in browsers. Modern browsers ignore it."
            />
          )}
          {header.name === "Permissions-Policy" && (
            <HelpText
              label="Permissions-Policy"
              examples={["geolocation=()", "camera=()", "microphone=()"]}
              description="Controls which browser features can be used."
            />
          )}
          {header.name === "Cross-Origin-Embedder-Policy" && (
            <HelpText
              label="Cross-Origin-Embedder-Policy"
              examples={["require-corp"]}
              description="Prevents loading cross-origin resources unless they explicitly allow it. Required for SharedArrayBuffer."
            />
          )}
          {header.name === "Cross-Origin-Opener-Policy" && (
            <HelpText
              label="Cross-Origin-Opener-Policy"
              examples={["same-origin", "same-origin-allow-popups"]}
              description="Isolates browsing contexts to prevent cross-origin attacks."
            />
          )}
          {header.name === "Cross-Origin-Resource-Policy" && (
            <HelpText
              label="Cross-Origin-Resource-Policy"
              examples={["same-origin", "same-site", "cross-origin"]}
              description="Governs who can load your resources."
            />
          )}
        </div>
      ))}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          Security Header Recommendations
        </h4>
        <div className="text-blue-800 text-sm space-y-2">
          <p>
            <strong>Strict-Transport-Security:</strong> Forces HTTPS connections
          </p>
          <p>
            <strong>X-Frame-Options:</strong> Prevents clickjacking attacks
          </p>
          <p>
            <strong>X-Content-Type-Options:</strong> Prevents MIME type sniffing
          </p>
          <p>
            <strong>Content-Security-Policy:</strong> Prevents XSS and data
            injection attacks
          </p>
          <p>
            <strong>Referrer-Policy:</strong> Controls referrer information sent
            to other sites
          </p>
          <p>
            <strong>Permissions-Policy:</strong> Controls browser feature access
            (camera, location, etc.)
          </p>
          <p>
            <strong>COEP/COOP/CORP:</strong> Strengthen isolation boundaries for
            cross-origin security
          </p>
        </div>
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (activeTab) {
      case "structured-data":
        return renderStructuredDataForm();
      case "open-graph":
        return renderOpenGraphForm();
      case "twitter-cards":
        return renderTwitterCardsForm();
      case "meta-tags":
        return renderMetaTagsForm();
      case "robots":
        return renderRobotsForm();
      case "sitemap":
        return renderSitemapForm();
      case "ads":
        return renderAdsForm();
      case "headers":
        return renderHeadersForm();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 py-4 md:px-4 md:py-6 lg:px-6 xl:max-w-6xl">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="p-4 md:p-6 space-y-2">
            <CardTitle className="text-xl md:text-2xl">
              SEO Code Generator
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Generate structured data, meta tags, Open Graph, Twitter Cards,
              robots.txt, and sitemaps for your website
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4 sm:space-y-6"
            >
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-1  md:grid-cols-2  lg:grid-cols-8 gap-1 sm:gap-2 grid-rows-8 sm:grid-rows-2 md:grid-rows-1 h-max">
                <TabsTrigger
                  className="text-xs sm:text-sm"
                  value="structured-data"
                >
                  Structured Data
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="open-graph">
                  Open Graph
                </TabsTrigger>
                <TabsTrigger
                  className="text-xs sm:text-sm"
                  value="twitter-cards"
                >
                  Twitter Cards
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="meta-tags">
                  Meta Tags
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="robots">
                  Robots.txt
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="sitemap">
                  Sitemap
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="ads">
                  Ads.txt
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="headers">
                  Security Headers
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="space-y-6 p-2 md:p-4">
                <div className="bg-card rounded-lg p-4 md:p-6">
                  {renderFormContent()}
                </div>
              </TabsContent>
              <div className="flex justify-center pt-4 md:pt-6">
                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="w-full md:w-auto px-8 py-2 text-sm md:text-base"
                >
                  Generate Code
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {generatedCode && (
          <Card className="mt-6 shadow-lg">
            <CardHeader className="p-4 md:p-6">
              <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Generated Code</CardTitle>
                  <CardDescription className="text-sm">
                    Copy this code and paste it into your website's HTML
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                    className="flex-1 md:flex-initial justify-center text-xs md:text-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadFile}
                    size="sm"
                    variant="outline"
                    className="flex-1 md:flex-initial justify-center text-xs md:text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-2 md:p-4 rounded-lg overflow-x-auto overflow-y-auto max-h-[60vh] text-xs md:text-sm bg-muted">
                <code className="block whitespace-pre-wrap">
                  {generatedCode}
                </code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SEOTool;
