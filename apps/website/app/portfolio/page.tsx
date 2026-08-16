import Navbar from "@/components/Navbar";
import Portfolio from "@/components/Portfolio";
import Footer from "@/components/Footer";

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Portfolio />
      <Footer/>
    </main>
  );
}