import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Steps from "@/components/landing/Steps";
import DownloadCTA from "@/components/landing/DownloadCTA";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Steps />
      <DownloadCTA />
      <Footer />
    </div>
  );
}
