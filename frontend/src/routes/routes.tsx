import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { lazy } from "react";
import Layout from "../Layout";
import LandingPage from "../pages/landingPage/main.tsx";
const Auth = lazy(() => import("@/pages/AuthPages/Auth.tsx"));
const EmailSent = lazy(() => import("@/pages/AuthPages/EmailSent.tsx"));
const Error = lazy(() => import("@/pages/errorPages/error.tsx"));
const EmailVerify = lazy(() => import("@/pages/AuthPages/EmailVerify.tsx"));
const ChangePassword = lazy(
  () => import("@/pages/AuthPages/changePassword.tsx")
);
import ProtectedRoute from "./ProtectedLayout.tsx";
import TokenizedRoute from "./TokenizedLayout.tsx";
import VerifiedRoute from "./VerifiedLayout.tsx";
import ProgramaticRoutesLayout from "./ProgramaticRoutesLayout.tsx";
const Contact = lazy(() => import("@/pages/contactPages/contact.tsx"));
const Pay = lazy(() => import("@/pages/pricingPages/payment.tsx"));
const Pricing = lazy(() => import("@/pages/landingPage/pricing.tsx"));
const Tools = lazy(() => import("@/pages/toolsPage/tools.tsx"));
const TermsAndConditions = lazy(() => import("@/pages/termsPage/tnc.tsx"));

const DashboardLayout = lazy(() => import("@/pages/dashboardPages/main.tsx"));
const CreatorDashboard = lazy(
  () => import("@/pages/creatorpages/creatordashboard.tsx")
);
const Gallery = lazy(() => import("@/pages/galleryPage/gallery.tsx"));
const Docs = lazy(() => import("@/pages/docs/docs.tsx"));
const TwoFA = lazy(() => import("@/pages/AuthPages/2fa.tsx"));
const ConfirmPayment = lazy(() => import("@/pages/pricingPages/confirmPayment.tsx"));
const SEOTool = lazy(() => import("@/pages/seoPage/seo.tsx"));
import SemiProtectedRoute from "./semiProtectedRoutes";
import SuspenseWrapper from "../../suspense.tsx";
import PageSeo from "@/pages/PageSeo/content.tsx";
import Game from "@/pages/funPage/game.tsx";
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path=""
        element={
          <SuspenseWrapper>
            <Layout />
          </SuspenseWrapper>
        }
      >
        <Route
          path="/"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Letshost : Get it deployed"
  description="Deploy any website with Letshost’s all-in-one platform. Enjoy fast hosting, unlimited image tools, global CDN, and simple pricing. Try it free and see why developers trust us."
  canonical="https://letshost.dpdns.org"
  ogTitle="Letshost : Get it deployed"
  ogDescription="Your all-in-one platform for Hosting, Media, and AI tools. Host any site. Optimize with AI. Deliver lightning-fast performance with our global CDN and creative tools."
  ogUrl="https://letshost.dpdns.org"
  twitterTitle="Get It Deployed"
  twitterDescription="Your all-in-one platform for Hosting, Media, and AI tools. Host any site. Optimize with AI. Deliver lightning-fast performance with our global CDN and creative tools."
/>

              <LandingPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/contact-us"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Contact Us – Letshost"
  description="Need help or have questions? Reach out to the Letshost team — we're here to assist you."
  canonical="https://letshost.dpdns.org/contact-us"
  ogTitle="Contact Letshost"
  ogDescription="Support, partnerships, and technical help — contact the Letshost team anytime."
  ogUrl="https://letshost.dpdns.org/contact-us"
  twitterTitle="Letshost Support"
  twitterDescription="Reach out to Letshost support for quick assistance or questions."
/>

              <Contact />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/payment"
          element={
            <VerifiedRoute>
              <ProgramaticRoutesLayout>
                <SuspenseWrapper>
                  {" "}
                  <Pay />
                </SuspenseWrapper>
              </ProgramaticRoutesLayout>
            </VerifiedRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Authentication – Letshost"
  description="Secure authentication for developers to access the Letshost dashboard and tools."
  canonical="https://letshost.dpdns.org/auth"
  ogTitle="Letshost Login"
  ogDescription="Create your your Letshost account to manage deployments and tools."
  ogUrl="https://letshost.dpdns.org/auth"
  twitterTitle="Login – Letshost"
  twitterDescription="Access your Letshost account and start deploying your projects today."
/>

              <Auth />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/tools"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Developer Tools – Letshost"
  description="Access free developer tools for media optimization, SEO, and AI-powered content generation — built into Letshost."
  canonical="https://letshost.dpdns.org/tools"
  ogTitle="Letshost Tools for Developers"
  ogDescription="Media, SEO, and AI tools for developers. Use them directly in the browser, all hosted on Letshost."
  ogUrl="https://letshost.dpdns.org/tools"
  twitterTitle="Letshost Developer Tools"
  twitterDescription="Use in-browser tools for content creation and optimization. No install needed. Hosted by Letshost."
/>

              <Tools />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/pricing"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Pricing – Letshost"
  description="Simple, transparent pricing for fast and secure hosting with built-in CDN and AI tools."
  canonical="https://letshost.dpdns.org/pricing"
  ogTitle="Letshost Pricing"
  ogDescription="Affordable pricing for developers, creators, and businesses. Scale as you grow."
  ogUrl="https://letshost.dpdns.org/pricing"
  twitterTitle="Letshost Pricing Plans"
  twitterDescription="Transparent pricing. No hidden fees. Pay only for what you use."
/>

              <Pricing />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/auth/email-sent"
          element={
            <ProgramaticRoutesLayout>
              <SuspenseWrapper>
                {" "}
                <EmailSent />
              </SuspenseWrapper>
            </ProgramaticRoutesLayout>
          }
        />
        <Route
          path="/auth/verify"
          element={
            <TokenizedRoute>
              <SuspenseWrapper>
                <EmailVerify />
              </SuspenseWrapper>
            </TokenizedRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <TokenizedRoute>
              <SuspenseWrapper>
                <ChangePassword />
              </SuspenseWrapper>
            </TokenizedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <VerifiedRoute>
                <SuspenseWrapper>
                  {" "}
                  <DashboardLayout />
                </SuspenseWrapper>
              </VerifiedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Media Gallery – Letshost"
  description="Explore AI-generated images, media uploads, and CDN-optimized content built with Letshost’s tools."
  canonical="https://letshost.dpdns.org/gallery"
  ogTitle="Letshost Gallery"
  ogDescription="Explore image and video content hosted on Letshost. Discover AI tools in action and see how our CDN delivers media lightning-fast."
  ogUrl="https://letshost.dpdns.org/gallery"
  twitterTitle="Letshost Gallery"
  twitterDescription="Explore developer-generated content and optimized media powered by Letshost."
/>

              <Gallery />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/terms"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Terms & Conditions – Letshost"
  description="Review the terms and conditions of using Letshost’s platform, including legal usage, limitations, and responsibilities."
  canonical="https://letshost.dpdns.org/terms"
  ogTitle="Letshost Terms & Conditions"
  ogDescription="Understand the legal agreement between you and Letshost. Read our terms and conditions to learn about acceptable use, responsibilities, and more."
  ogUrl="https://letshost.dpdns.org/terms"
  twitterTitle="Terms & Conditions – Letshost"
  twitterDescription="Read Letshost’s terms of service and usage agreement to understand your rights and obligations when using our platform."
/>

              <TermsAndConditions />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/creator/:creatorId"
          element={
            <SuspenseWrapper>
              <CreatorDashboard />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/docs"
          element={
            <SuspenseWrapper>
              <PageSeo
  pageTitle="Letshost Docs – Deploy with Confidence"
  description="Full documentation for deploying, managing, and optimizing your sites on Letshost. Learn how to use our hosting, CDN, and AI tools effectively."
  canonical="https://letshost.dpdns.org/docs"
  ogTitle="Letshost Documentation"
  ogDescription="Step-by-step documentation for deploying and managing your site with Letshost. Learn about tools, integrations, and best practices."
  ogUrl="https://letshost.dpdns.org/docs"
  twitterTitle="Letshost Docs"
  twitterDescription="Read documentation and best practices for hosting and deploying on Letshost. Get the most out of our platform."
/>

              <Docs />
            </SuspenseWrapper>
          }
        />
        <Route
      path="/payment/checkout/return"
      element={
        <SuspenseWrapper>
          <ProtectedRoute>
            <VerifiedRoute>
             
                  <ConfirmPayment />

            </VerifiedRoute>
          </ProtectedRoute>
        </SuspenseWrapper>
      }
    />
    <Route
      path="/user/auth/additional-safety/2fa"
      element={
        <SuspenseWrapper>
          <SemiProtectedRoute>
           
             
                <SuspenseWrapper>
                  <TwoFA />
                </SuspenseWrapper>
             
          </SemiProtectedRoute>
        </SuspenseWrapper>
      }
    />
    <Route
    path="/seo-generator"
    element={
      <SuspenseWrapper>
        <PageSeo
  pageTitle="SEO Meta Tag Generator – Letshost"
  description="Generate SEO meta tags and Open Graph data easily. Letshost's in-browser SEO toolkit."
  canonical="https://letshost.dpdns.org/seo-generator"
  ogTitle="SEO Meta Generator by Letshost"
  ogDescription="Easily generate SEO-friendly metadata for your websites. Perfect for developers and marketers alike."
  ogUrl="https://letshost.dpdns.org/seo-generator"
  twitterTitle="SEO Generator – Letshost"
  twitterDescription="Build SEO-optimized meta tags for your site quickly and easily with Letshost tools."
/>

        <SEOTool />
      </SuspenseWrapper>
    }
  />
  <Route
  path="/offline/game"
  element={
    <Game/>
  }
  />
      </Route>
      
      <Route
        path="*"
        element={
          <SuspenseWrapper>
             <PageSeo
        pageTitle="Page Not Found – Letshost"
        description="The page you're looking for doesn’t exist or has been moved. Letshost helps developers deploy sites quickly — try going back to the homepage."
        canonical="https://letshost.dpdns.org/404"
        ogTitle="404 – Page Not Found"
        ogDescription="You’ve hit a missing page. But the Letshost platform is still here to help you deploy and host your projects with ease."
        ogUrl="https://letshost.dpdns.org/404"
        twitterTitle="404 Error – Letshost"
        twitterDescription="Oops! This page doesn’t exist. Letshost helps developers launch projects — try heading home."
      />
            <Error />
          </SuspenseWrapper>
        }
      />
    </>
  )
);
