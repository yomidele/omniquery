import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground font-display">
      <Helmet>
        <title>OmniQuery — AI Research Agent for Deep, Source-Backed Reports</title>
        <meta name="description" content="OmniQuery is an autonomous AI research agent. Ask any question and get comprehensive, source-backed reports with citations in seconds." />
        <link rel="canonical" href="https://omniquery.lovable.app/" />
        <meta property="og:url" content="https://omniquery.lovable.app/" />
      </Helmet>
      <Header showAuth />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;

