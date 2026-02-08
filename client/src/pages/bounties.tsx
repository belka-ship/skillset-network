import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UploadModal } from "@/components/upload-modal";
import { AuthDialog } from "@/components/auth-dialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { User, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@shared/schema";

export default function Bounties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [user, setUser] = useState<{ id: string; username: string; balance: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks(),
  });

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => {});
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
    
    if (selectedTask) {
      setTimeout(() => {
        setIsUploadModalOpen(true);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      <div className="fixed inset-0 spotlight z-0 pointer-events-none" />

      <nav className={`fixed top-0 left-0 right-0 z-50 py-6 transition-all duration-300 ${isScrolled ? 'bg-black/70 backdrop-blur-md' : ''}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="font-bold text-lg tracking-tight">skillset</span>
          </button>
          
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

      <section className="pt-32 pb-8 bg-black">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">All Bounties</h1>
            <p className="text-gray-400">Explore all available tasks and earn $SKILL tokens</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-black">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div 
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-32 bg-gradient-to-b from-black to-white/5 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl font-bold text-white mb-8">Contact Us</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Got questions? Get in touch with the team and we'll get back to you soon.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Your company <span className="text-gray-500 font-normal">(Optional)</span></label>
                    <input 
                      type="text" 
                      placeholder="Enter your company name"
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
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Enquiry type *</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20 transition-colors"
                    data-testid="select-enquiry"
                  >
                    <option value="">General question</option>
                    <option value="partnership">Partnership</option>
                    <option value="support">Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message *</label>
                  <textarea 
                    placeholder="Write your message or inquiry..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors resize-none"
                    data-testid="textarea-message"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-3 px-8 font-medium transition-all duration-300 cursor-pointer"
                  data-testid="button-submit-contact"
                >
                  Submit
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
