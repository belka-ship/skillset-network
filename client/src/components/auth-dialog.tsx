import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; username: string; balance: number }) => void;
}

export function AuthDialog({ isOpen, onClose, onSuccess }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Authentication failed");
      }

      const user = await res.json();
      onSuccess(user);
      onClose();
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-white/10 text-white sm:max-w-[400px] backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-medium tracking-tight text-center text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 text-sm">
            {mode === "login" ? "Sign in to your account" : "Register to start earning $SKILL"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-white/80">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
              placeholder="Enter username"
              required
              data-testid="input-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-white/80">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
              placeholder="Enter password"
              required
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200 rounded-xl h-11"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="button-toggle-mode"
            >
              {mode === "login" 
                ? "Don't have an account? Register" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
