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
import SuspenseWrapper from "../../suspense.tsx";
import ConfirmPayment from "@/pages/pricingPages/confirmPayment.tsx";
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
              <LandingPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/contact-us"
          element={
            <SuspenseWrapper>
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
              <Auth />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/tools"
          element={
            <SuspenseWrapper>
              <Tools />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/pricing"
          element={
            <SuspenseWrapper>
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
              <Gallery />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/terms"
          element={
            <SuspenseWrapper>
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
              <Docs />
            </SuspenseWrapper>
          }
        />
      </Route>
      <Route
      path="/payment/checkout"
      element={
        <SuspenseWrapper>
          <ProtectedRoute>
            <VerifiedRoute>
              <ProgramaticRoutesLayout>
                  <ConfirmPayment />
              </ProgramaticRoutesLayout>
            </VerifiedRoute>
          </ProtectedRoute>
        </SuspenseWrapper>
      }
    />
      <Route
        path="*"
        element={
          <SuspenseWrapper>
            <Error />
          </SuspenseWrapper>
        }
      />
    </>
  )
);
