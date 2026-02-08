import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AdminUpload } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Video, User, Calendar, FileText, AlertCircle, Download, Check, X, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export default function Admin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    api.getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const loginMutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: () => {
      setIsAuthenticated(true);
      setLoginError("");
      queryClient.invalidateQueries({ queryKey: ["admin-uploads"] });
    },
    onError: (error: Error) => {
      setLoginError(error.message || "Login failed");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    loginMutation.mutate();
  };

  const { data: uploads, isLoading, isError, error } = useQuery<AdminUpload[]>({
    queryKey: ["admin-uploads"],
    queryFn: () => api.getAdminUploads(),
    enabled: isAuthenticated === true,
  });

  const validateMutation = useMutation({
    mutationFn: (uploadId: string) => api.validateUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-uploads"] });
      setValidatingIds(new Set());
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (uploadId: string) => api.rejectUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-uploads"] });
      setRejectingIds(new Set());
    },
  });

  const handleValidate = (uploadId: string) => {
    setValidatingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(uploadId);
      return newSet;
    });
    validateMutation.mutate(uploadId);
  };

  const handleReject = (uploadId: string) => {
    setRejectingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(uploadId);
      return newSet;
    });
    rejectMutation.mutate(uploadId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validating":
        return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "approved":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "cancelled":
        return "bg-gray-500/10 border-gray-500/30 text-gray-400";
      case "rejected":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      default:
        return "bg-white/10 border-white/30 text-white";
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12 max-w-md">
          <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.02]">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Admin Login</h2>
            <p className="text-gray-400 text-center mb-6">Sign in to access the admin dashboard</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="bg-black border-white/20 text-white placeholder:text-gray-500"
                  data-testid="input-admin-username"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-black border-white/20 text-white placeholder:text-gray-500"
                  data-testid="input-admin-password"
                  required
                />
              </div>
              
              {loginError && (
                <div className="text-red-400 text-sm text-center" data-testid="text-login-error">
                  {loginError}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-gray-200"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Uploaded Videos</h2>
          <p className="text-gray-400">View all video submissions from contributors</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-red-400 mb-2">Failed to load uploads</h3>
            <p className="text-gray-500">{error instanceof Error ? error.message : "Please try again later."}</p>
          </div>
        ) : uploads && uploads.length > 0 ? (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video ID
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Uploaded By
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Task
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Uploaded At
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {uploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    data-testid={`row-upload-${upload.id}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-300" data-testid={`text-upload-id-${upload.id}`}>
                        {upload.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium" data-testid={`text-username-${upload.id}`}>
                        {upload.username}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300" data-testid={`text-task-${upload.id}`}>
                        {upload.taskTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm" data-testid={`text-date-${upload.id}`}>
                        {format(new Date(upload.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium border rounded-full ${getStatusColor(upload.status)}`} data-testid={`status-${upload.id}`}>
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {upload.fileUrl ? (
                        <a
                          href={upload.fileUrl}
                          download
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                          data-testid={`button-download-${upload.id}`}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No file</span>
                      )}
                      {upload.status === "validating" && (
                        <>
                          <button
                            onClick={() => handleValidate(upload.id)}
                            disabled={validatingIds.has(upload.id) || validateMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 text-green-400 rounded-lg transition-colors"
                            data-testid={`button-validate-${upload.id}`}
                          >
                            <Check className="w-4 h-4" />
                            {validatingIds.has(upload.id) ? "Validating..." : "Validate"}
                          </button>
                          <button
                            onClick={() => handleReject(upload.id)}
                            disabled={rejectingIds.has(upload.id) || rejectMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 rounded-lg transition-colors"
                            data-testid={`button-reject-${upload.id}`}
                          >
                            <X className="w-4 h-4" />
                            {rejectingIds.has(upload.id) ? "Rejecting..." : "Reject"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-white/10 rounded-2xl p-12 text-center">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">No uploads yet</h3>
            <p className="text-gray-500">Video submissions will appear here once contributors start uploading.</p>
          </div>
        )}
      </main>
    </div>
  );
}
