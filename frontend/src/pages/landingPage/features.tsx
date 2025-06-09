import { HoverEffect } from "@/components/ui/card-hover-effect";

function Features() {
  const projects = [
    {
      title: "Simple CLI",
      description:
        "Deploy with a single command. Our CLI tool makes it easy to get your site online in seconds.",
    },
    {
      title: "CI/CD Integration",
      description:
        "Automatically deploy when you push to your repository. Integrates with GitHub, GitLab, and more.",
    },
    {
      title: "Global CDN",
      description:
        "Lightning-fast content delivery with our global CDN. Your sites load quickly everywhere in the world.",
    },
    {
      title: "Affordable Pricing",
      description:
        "Our pricing is affordable and scalable. No hidden costs, no minimums, and no contracts.",
    },
    {
      title: "Easy to Use",
      description:
        "Our user-friendly interface makes it easy to get your site up and running. No technical knowledge required.",
    },
    {
      title: "Free SSL Certificates",
      description:
        "Get free SSL certificates for your site. We handle the SSL certificate renewal process for you.",
    },
  ];
  return (
    <div className="max-w-5xl mx-auto px-8 flex flex-col items-center justify-center py-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Why choose letshost?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our platform is built with developers in mind. We make it simple to
          deploy your sites with all the features you need.
        </p>
      </div>
      <HoverEffect items={projects} />
    </div>
  );
}

export default Features;
