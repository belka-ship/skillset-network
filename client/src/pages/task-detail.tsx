import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { UploadModal } from "@/components/upload-modal";
import { AuthDialog } from "@/components/auth-dialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { Task, Upload } from "@shared/schema";

export default function TaskDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/task/:taskId");
  const [user, setUser] = useState<{ id: string; username: string; balance: number } | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const taskId = (params?.taskId as string) || "";

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks(),
  });

  const { data: uploads = [], refetch: refetchUploads } = useQuery({
    queryKey: ["my-uploads"],
    queryFn: () => api.getMyUploads(),
    enabled: !!user,
  });

  const currentTask = tasks.find(t => t.id === taskId);
  const taskUpload = uploads.find((u: Upload) => u.taskId === taskId && u.status !== "cancelled" && u.status !== "rejected");

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

  const handleUploadClick = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = async (objectPath: string | null) => {
    if (currentTask) {
      try {
        const result = await uploadMutation.mutateAsync(currentTask.id);
        
        if (objectPath && result.upload.id) {
          await api.updateUploadFile(result.upload.id, objectPath);
        }
        
        setUser((prev) => prev ? { ...prev, balance: result.newBalance } : null);
        toast({
          title: "Upload submitted",
          description: "Your video is being validated",
          className: "bg-white text-black border-none rounded-xl",
        });
        queryClient.invalidateQueries({ queryKey: ["uploads"] });
        queryClient.invalidateQueries({ queryKey: ["my-uploads"] });
        refetchUploads();
        setIsUploadModalOpen(false);
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
    setTimeout(() => {
      setIsUploadModalOpen(true);
    }, 300);
  };

  if (!match || !currentTask) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Task not found</p>
          <Button 
            onClick={() => navigate("/bounties")}
            className="mt-6 bg-white text-black hover:bg-gray-200 rounded-full px-8"
          >
            Back to bounties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      <div className="fixed inset-0 spotlight z-0 pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 py-6 transition-all duration-300 bg-black/50 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate("/bounties")}
            className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-lg tracking-tight">Back</span>
          </button>
          
          {user && (
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <span className="text-white text-sm font-medium">{user.balance} $SKILL</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="pt-28 pb-16 bg-black">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <span className={`inline-block text-xs px-3 py-1 rounded-full border mb-4 ${
                currentTask.difficulty === 'Low' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                currentTask.difficulty === 'Medium' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                {currentTask.difficulty} Difficulty
              </span>
              <h1 className="text-5xl font-bold text-white mb-4">{currentTask.title}</h1>
              <div className="flex items-center gap-8 text-gray-400">
                <span>Video • 30s-60s</span>
                <span className="text-2xl font-bold text-white">{currentTask.reward} $SKILL</span>
              </div>
            </div>

            {currentTask.description && (
              <div className="mb-12 p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h2 className="text-xl font-bold text-white mb-4">Task Description</h2>
                <p className="text-gray-300 leading-relaxed">{currentTask.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Format</h3>
                <p className="text-lg font-bold text-white">POV Video</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                <p className="text-lg font-bold text-white">30s - 60s</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Reward</h3>
                <p className="text-lg font-bold text-white">{currentTask.reward} $SKILL</p>
              </div>
            </div>

            <div className="mb-12 p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white mb-6">Recording Tips</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                  <span className="text-gray-300">Record from chest or head level (POV)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                  <span className="text-gray-300">Show all steps clearly and completely</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                  <span className="text-gray-300">Ensure good lighting and clear audio</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                  <span className="text-gray-300">No heavy edits or copyrighted music</span>
                </li>
              </ul>
            </div>

            {user && (
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Your Total Earned</h3>
                  <p className="text-3xl font-bold text-white">{user.balance} $SKILL</p>
                </div>
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">This Reward</h3>
                  <p className="text-3xl font-bold text-white">{currentTask.reward} $SKILL</p>
                </div>
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  {taskUpload ? (
                    taskUpload.status === "approved" ? (
                      <p className="text-lg font-bold text-green-400" data-testid="status-validated">Validated</p>
                    ) : (
                      <p className="text-lg font-bold text-orange-400" data-testid="status-validating">Validating</p>
                    )
                  ) : (
                    <p className="text-lg font-bold text-gray-400" data-testid="status-ready">Ready to upload</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={handleUploadClick}
                disabled={!!taskUpload}
                className="flex-1 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded-full py-3 px-8 font-medium transition-all duration-300"
                data-testid="button-upload-video"
              >
                {taskUpload ? (taskUpload.status === "approved" ? "Validated" : "Validating...") : "Upload Video"}
              </Button>
              <Button 
                onClick={() => navigate("/bounties")}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full py-3 px-8 border border-white/10 font-medium transition-all duration-300"
              >
                View More Tasks
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <AuthDialog 
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {currentTask && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          taskName={currentTask.title}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
