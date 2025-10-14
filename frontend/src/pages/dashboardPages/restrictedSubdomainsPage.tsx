import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// List of restricted subdomains (synced with backend)
const restrictedSubdomains = [
  "www",
  "api",
  "admin",
  "blog",
  "dashboard",
  "support",
  "help",
  "contact",
  "about",
  "terms",
  "privacy",
  "legal",
  "status",
  "docs",
  "forum",
  "login",
  "register",
  "signin",
  "signup",
  "logout",
  "home",
  "index",
  "store",
  "shop",
  "cart",
  "assets",
  "static",
  "public",
  "images",
  "files",
  "media",
  "uploads",
  "temp",
  "resources",
  "http",
  "https",
  "localhost",
  "example",
  "demo",
  "test",
  "staging",
  "dev",
  "testbed",
  "preview",
  "internal",
  "secure",
  "cms",
  "panel",
  "adminpanel",
  "control",
  "auth",
  "oauth",
  "identity",
  "loginpage",
  "logoutpage",
  "error",
  "maintenance",
  "billing",
  "checkout",
  "payments",
  "order",
  "user",
  "profile",
  "account",
  "newsletter",
  "cartpage",
  "cdn",
  "download",
  "server",
  "monitoring",
  "data",
  "platform",
  "api-v1",
  "api-v2",
  "api-v3",
  "api-beta",
  "adminapi",
  "authapi",
  "secureapi",
  "hooks",
  "ping",
  "verify",
  "robots",
  "sitemap",
  "notifications",
  "messaging",
  "imageserver",
  "content",
  "mediafiles",
  "downloadfiles",
  "testing",
  "console",
  "cli",
  "toolbox",
  "tool",
  "scripts",
  "cloud",
  "supportcenter",
  "feedback",
  "tickets",
  "audit",
  "logs",
  "alert",
  "statuspage",
  "incident",
  "release",
  "updates",
  "live",
  "supportchat",
];

const RestrictedSubdomainsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h1 className="text-3xl font-bold mb-2">Restricted Subdomains</h1>
            <p className="text-muted-foreground text-lg">
              These subdomains are reserved for system use and cannot be registered for your projects.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reserved Subdomain List</h2>
          <span className="text-sm text-muted-foreground">
            Total: <strong>{restrictedSubdomains.length}</strong> subdomains
          </span>
        </div>
        
        <div className="mb-4 p-4 bg-secondary/30 rounded-md">
          <p className="text-sm">
            <strong>Why are these restricted?</strong> These subdomains are reserved to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 ml-2">
            <li>Protect system routes and administrative functions</li>
            <li>Prevent conflicts with platform infrastructure</li>
            <li>Ensure security and proper service operation</li>
            <li>Reserve common paths for future platform features</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {restrictedSubdomains.map((subdomain, index) => (
            <div
              key={`${subdomain}-${index}`}
              className="px-3 py-2 bg-secondary/50 rounded-md text-sm font-mono text-center hover:bg-secondary transition-colors border"
            >
              {subdomain}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          Need a subdomain?
        </h3>
        <p className="text-muted-foreground mb-4">
          Choose any unique subdomain name that's not in the restricted list above. 
          We recommend using descriptive names that represent your project.
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex-1 p-3 bg-green-500/10 border border-green-500/20 rounded">
            <p className="font-semibold text-green-500 mb-1">✓ Good examples:</p>
            <p className="font-mono text-xs">my-app, portfolio, john-blog</p>
          </div>
          <div className="flex-1 p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="font-semibold text-red-500 mb-1">✗ Restricted:</p>
            <p className="font-mono text-xs">admin, api, dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictedSubdomainsPage;
