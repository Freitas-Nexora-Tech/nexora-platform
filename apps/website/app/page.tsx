import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Navbar from "../components/Navbar";
import Contact from "../components/Contact";
import NexoraAIDemo from "@/components/NexoraAIDemo";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
    <Navbar />
    <Hero />
    <Services />
    <NexoraAIDemo />
    <About />
    <Contact/>
    <Footer/>
  
   </>
  );
}