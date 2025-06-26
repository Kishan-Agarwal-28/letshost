import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Layout from "../Layout";
import LandingPage from "../pages/landingPage/main.tsx";
import Auth from "@/pages/AuthPages/Auth.tsx";
import EmailSent from "@/pages/AuthPages/EmailSent.tsx";
import Error from "@/pages/errorPages/error.tsx";
import EmailVerify from "@/pages/AuthPages/EmailVerify.tsx";
import ProtectedRoute from "./ProtectedLayout.tsx";
import ChangePassword from "@/pages/AuthPages/changePassword.tsx";
import TokenizedRoute from "./TokenizedLayout.tsx";
import VerifiedRoute from "./VerifiedLayout.tsx";
import ProgramaticRoutesLayout from "./ProgramaticRoutesLayout.tsx";
import Contact from "@/pages/contactPages/contact.tsx";
import Pay from "@/pages/pricingPages/payment.tsx";
import Pricing from "@/pages/landingPage/pricing.tsx";
import Tools from "@/pages/toolsPage/tools.tsx";
import TermsAndConditions from "@/pages/termsPage/tnc.tsx";

import DashboardLayout from "@/pages/dashboardPages/main.tsx";
import  Gallery  from "@/pages/galleryPage/gallery.tsx";
import CreatorDashboard from "@/pages/creatorpages/creatordashboard.tsx";


export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="" element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact-us" element={<Contact />} />
        <Route
          path="/payment"
          element={
            <VerifiedRoute>
              <ProgramaticRoutesLayout>
                <Pay />
              </ProgramaticRoutesLayout>
            </VerifiedRoute>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/auth/email-sent"
          element={
            <ProgramaticRoutesLayout>
              <EmailSent />
            </ProgramaticRoutesLayout>
          }
        />
        <Route
          path="/auth/verify"
          element={
            <TokenizedRoute>
              <EmailVerify />
            </TokenizedRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <TokenizedRoute>
              <ChangePassword />
            </TokenizedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <VerifiedRoute>
                <DashboardLayout />
              </VerifiedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <Gallery />
          }
          />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route
                path="/creator/:creatorId"
                element={
                  <CreatorDashboard/>
                }
                />
      </Route>

      <Route path="*" element={<Error />} />
    </>,
  ),
);
