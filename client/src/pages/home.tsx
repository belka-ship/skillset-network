import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadModal } from "@/components/upload-modal";
import { AuthDialog } from "@/components/auth-dialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Video, Upload, Coins, User, ArrowRight, ArrowUpRight, MessageCircle, Github } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import heroVideo from "@assets/Sci_Fi_Robot_Mimic_Woman_by_Frame_Stock_Footage_Stock_Footage__1764955910584.mp4";
import howItWorksVideo from "@assets/Pov_Man_Vlog_Day_In_The_Life_by_Danil_Nevsky_Stock_Footage_Art_1764956798679.mp4";
import whitepaper from "@assets/SKILL_Protocol_Whitepaper_v1_1764365636700.pdf";
import type { Task } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [user, setUser] = useState<{ id: string; username: string; balance: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [skillPrice, setSkillPrice] = useState<number | null | undefined>(undefined);
  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    email: "",
    enquiryType: "General question",
    message: "",
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl",
      });
      return;
    }
    
    setIsSubmittingContact(true);
    try {
      await api.sendContactForm(contactForm);
      toast({
        title: "Message sent",
        description: "We'll get back to you soon!",
        className: "bg-white text-black border-none rounded-xl",
      });
      setContactForm({
        name: "",
        company: "",
        email: "",
        enquiryType: "General question",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl",
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks(),
  });

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.getSkillPrice()
      .then(data => setSkillPrice(data.price))
      .catch(() => setSkillPrice(null));
  }, []);

  const uploadMutation = useMutation({
    mutationFn: (taskId: string) => api.createUpload(taskId),
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
        className: "bg-red-500 text-white border-none rounded-xl",
      });
    },
  });

  const handleTaskClick = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  const handleUploadComplete = async (objectPath: string | null) => {
    if (selectedTask) {
      try {
        const result = await uploadMutation.mutateAsync(selectedTask.id);
        
        if (objectPath && result.upload.id) {
          await api.updateUploadFile(result.upload.id, objectPath);
        }
        
        setUser((prev) => prev ? { ...prev, balance: result.newBalance } : null);
        toast({
          title: `+${result.reward} $SKILL`,
          description: "Reward received",
          className: "bg-white text-black border-none rounded-xl",
        });
        queryClient.invalidateQueries({ queryKey: ["uploads"] });
      } catch (error) {
        console.error("Upload complete error:", error);
      }
    }
  };

  const handleAuthSuccess = (userData: { id: string; username: string; balance: number }) => {
    setUser(userData);
    toast({
      title: "Welcome",
      description: "Connected to Skillset Network",
      className: "bg-white text-black border-none rounded-xl",
    });
  };

  const handleWhitepaperDownload = () => {
    const link = document.createElement('a');
    link.href = whitepaper;
    link.download = 'SKILL_Protocol_Whitepaper.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      <div className="fixed inset-0 spotlight z-0 pointer-events-none" />

      <nav className={`fixed top-0 left-0 right-0 z-50 py-6 transition-all duration-300 ${isScrolled ? 'bg-black/70 backdrop-blur-md' : ''}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="font-bold text-lg tracking-tight">skillset</span>
          </button>
          
          <div className="hidden md:flex items-center gap-8 text-base font-medium text-white">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-gray-300 transition-colors">How It Works</a>
            <a href="#open-bounties" onClick={(e) => { e.preventDefault(); document.getElementById("open-bounties")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-gray-300 transition-colors">Open Bounties</a>
            <a href="#vision" onClick={(e) => { e.preventDefault(); document.getElementById("vision")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-gray-300 transition-colors">Vision</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-gray-300 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://www.orca.so/?tokenIn=So11111111111111111111111111111111111111112&tokenOut=BcyA4CctAFW6EkXDBxMTJjbbNSoHwFWdW4vBGXEzGqqA" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-full text-sm font-medium transition-all duration-300"
              data-testid="button-buy-skill"
            >
              Buy $SKILL
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video 
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            className="hidden md:block w-full h-full object-cover"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <img 
            src="/hero_robot_mobile.jpg"
            alt="Robot"
            className="md:hidden w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4 space-y-8 mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-2xl"
            style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)' }}
          >
            Mine crypto by training robots
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
            className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed font-light drop-shadow-lg"
            style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' }}
          >
            Skillset is building the visual layer of AI and robotics that is decentralized and community-owned
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Button 
              size="lg"
              className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 text-base font-medium transition-all duration-300"
              onClick={() => navigate("/bounties")}
              data-testid="button-start-earning"
            >
              Start Mining $SKILL
            </Button>
            <Button 
              onClick={handleWhitepaperDownload}
              className="border border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-medium backdrop-blur-sm transition-all duration-300"
              data-testid="button-whitepaper"
            >
              Read Whitepaper
            </Button>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="absolute bottom-16 left-0 right-0 z-10 text-center text-sm text-gray-400 font-mono"
        >
          <span data-testid="text-skill-price">
            $SKILL PRICE: {skillPrice === undefined ? 'Loading...' : (skillPrice !== null && skillPrice > 0 ? `$${skillPrice.toFixed(6)} USDC` : 'PRE-LAUNCH')}
          </span>
        </motion.div>
      </section>

      <section id="how-it-works" className="py-10 bg-black relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your everyday skills become robot training data
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Record what you already know how to do - clear, human POV demonstrations that help robots learn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* iPhone Mockup */}
            <div className="flex justify-center md:justify-start sticky top-32">
              <div className="relative w-96 h-[700px]">
                {/* iPhone Frame */}
                <div className="absolute inset-0 bg-black rounded-[50px] border-[14px] border-gray-900 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-7 bg-black rounded-b-3xl z-10 border border-gray-800" />
                  
                  {/* Screen */}
                  <div className="absolute inset-[6px] rounded-[44px] overflow-hidden bg-black">
                    <video 
                      src={howItWorksVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Steps - Timeline Design */}
            <div className="space-y-0">
              {[
                { step: "01", title: "Pick a Task", desc: "Browse a library of open bounties: kitchen, home, cleanup." },
                { step: "02", title: "Record POV", desc: "Set your phone or GoPro to chest/head POV. Show the full action, step-by-step." },
                { step: "03", title: "Upload & Earn", desc: "Upload and earn $SKILL." },
              ].map((item, i, arr) => (
                <div key={i}>
                  <div className="py-8">
                    <div className="flex gap-8 items-start">
                      <div className="flex-shrink-0 pt-1">
                        <span className="text-6xl font-bold text-gray-600">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-base">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                  {i !== arr.length - 1 && <div className="border-t border-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="open-bounties" className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Open Bounties</h2>
              <p className="text-gray-400">Current data collection requests from the network</p>
            </div>
            <div className="flex items-center gap-8 pr-6">
              <Badge variant="outline" className="border-white/20 text-white rounded-full px-4 py-1">
                Live Feed
              </Badge>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {tasks.slice(0, 6).map((task, index) => (
              <div 
                key={task.id}
                className="group flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer"
                onClick={() => handleTaskClick(task.id)}
                data-testid={`card-task-${task.id}`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 font-mono text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white group-hover:text-white transition-colors" data-testid={`text-task-title-${task.id}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        task.difficulty === 'Low' ? 'border-green-500/30 text-green-400' :
                        task.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                        'border-red-500/30 text-red-400'
                      }`}>
                        {task.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">Video • 30s-60s</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white" data-testid={`text-reward-${task.id}`}>
                      {task.reward} $SKILL
                    </div>
                    <div className="text-xs text-gray-500">Est. Reward</div>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={() => navigate("/bounties")}
              className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 text-base font-medium transition-all duration-300"
              data-testid="button-view-all-bounties"
            >
              See all bounties
            </Button>
          </div>
        </div>
      </section>

      <section id="vision" className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              A dataset the community owns. A future we all benefit from.
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Robots will soon cook, clean, and help in the real world. Skillset makes sure the data that teaches them comes from people - and the upside flows back to contributors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Community-owned intelligence</h3>
              <p className="text-gray-400 leading-relaxed">
                Every POV video becomes part of a growing "skill library" for embodied AI—built by everyday people, not closed labs.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Real-world skills, not synthetic demos</h3>
              <p className="text-gray-400 leading-relaxed">
                Robots learn best from messy reality: hands, tools, light changes, mistakes, corrections—what real life looks like.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Earn for your contribution</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload useful demonstrations, earn $SKILL, and help unlock better robots faster—starting with simple tasks, scaling to complex skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Who uses Skillset data
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              We're building toward a market where top robotics and AI labs license real-world skill demonstrations.
            </p>
          </div>

          <div className="mb-16">
            <div className="w-full overflow-hidden mb-12">
              <div className="logo-scroll">
                {[...Array(2)].map((_, setIdx) => (
                  <div key={setIdx} className="flex gap-8 md:gap-12 flex-shrink-0">
                    {["OpenAI", "Figure AI", "Anthropic", "1X", "Boston Dynamics", "Apptronik", "Tesla", "Google"].map((company) => (
                      <div key={`${setIdx}-${company}`} className="flex items-center justify-center px-8 py-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 whitespace-nowrap flex-shrink-0">
                        <span className="text-white/70 font-medium text-sm">{company}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">FAQ</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Do I need special equipment?</h3>
              <p className="text-gray-400">No—your phone is enough. POV mounts help but aren't required.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">How long should videos be?</h3>
              <p className="text-gray-400">Usually 5–60 seconds depending on the task.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">What gets rejected?</h3>
              <p className="text-gray-400">Blurry footage, missing key steps, not POV, heavy edits, copyrighted music.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">When do I earn $SKILL?</h3>
              <p className="text-gray-400">After upload + basic validation (instant in beta; stricter later).</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Is this available worldwide?</h3>
              <p className="text-gray-400">Yes—tasks may vary by region.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">What is $SKILL?</h3>
              <p className="text-gray-400">$SKILL is a token tracked on base chain and will soon be available for trade on major exchanges.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-gradient-to-b from-black to-white/5 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl font-bold text-white mb-8">Contact Us</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Got questions? Get in touch with the team and we'll get back to you soon.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter your full name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                      data-testid="input-name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Your company <span className="text-gray-500 font-normal">(Optional)</span></label>
                    <input 
                      type="text" 
                      placeholder="Enter your company name"
                      value={contactForm.company}
                      onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                      data-testid="input-company"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email address *</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                    data-testid="input-email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Enquiry type *</label>
                  <select 
                    value={contactForm.enquiryType}
                    onChange={(e) => setContactForm(prev => ({ ...prev, enquiryType: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20 transition-colors"
                    data-testid="select-enquiry"
                  >
                    <option value="General question">General question</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message *</label>
                  <textarea 
                    placeholder="Write your message or inquiry..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors resize-none"
                    data-testid="textarea-message"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full py-3 px-8 font-medium transition-all duration-300 cursor-pointer"
                  data-testid="button-submit-contact"
                >
                  {isSubmittingContact ? "Sending..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-bold text-lg tracking-tight">skillset</span>
          <p className="text-gray-600 text-sm">
            © 2025 Skillset Network. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      <AuthDialog 
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {selectedTask && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          taskName={selectedTask.title}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
