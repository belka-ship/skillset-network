import type { User, Task, Upload } from "@shared/schema";

export interface AuthResponse {
  id: string;
  username: string;
  balance: number;
}

export interface UploadResponse {
  upload: Upload;
  reward: number;
  newBalance: number;
}

export const api = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }
    
    return res.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }
    
    return res.json();
  },

  async logout(): Promise<void> {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });
    
    if (!res.ok) {
      throw new Error("Logout failed");
    }
  },

  async getMe(): Promise<AuthResponse> {
    const res = await fetch("/api/auth/me");
    
    if (!res.ok) {
      throw new Error("Not authenticated");
    }
    
    return res.json();
  },

  async getTasks(): Promise<Task[]> {
    const res = await fetch("/api/tasks");
    
    if (!res.ok) {
      throw new Error("Failed to fetch tasks");
    }
    
    return res.json();
  },

  async createUpload(taskId: string): Promise<UploadResponse> {
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Upload failed");
    }
    
    return res.json();
  },

  async getMyUploads(): Promise<Upload[]> {
    const res = await fetch("/api/uploads/me");
    
    if (!res.ok) {
      throw new Error("Failed to fetch uploads");
    }
    
    return res.json();
  },

  async getAdminUploads(): Promise<AdminUpload[]> {
    const res = await fetch("/api/admin/uploads");
    
    if (!res.ok) {
      throw new Error("Failed to fetch uploads");
    }
    
    return res.json();
  },

  async getUploadUrl(): Promise<{ uploadURL: string; objectPath: string }> {
    const res = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      throw new Error("Failed to get upload URL");
    }
    
    return res.json();
  },

  async updateUploadFile(uploadId: string, objectPath: string): Promise<{ objectPath: string }> {
    const res = await fetch(`/api/uploads/${uploadId}/file`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectPath }),
    });
    
    if (!res.ok) {
      throw new Error("Failed to update upload file");
    }
    
    return res.json();
  },

  async validateUpload(uploadId: string): Promise<{ status: string; reward: number; newBalance: number }> {
    const res = await fetch(`/api/uploads/${uploadId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to validate upload");
    }
    
    return res.json();
  },

  async cancelUpload(uploadId: string): Promise<{ status: string }> {
    const res = await fetch(`/api/uploads/${uploadId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to cancel upload");
    }
    
    return res.json();
  },

  async rejectUpload(uploadId: string): Promise<{ status: string }> {
    const res = await fetch(`/api/uploads/${uploadId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to reject upload");
    }
    
    return res.json();
  },

  async sendContactForm(data: {
    name: string;
    company?: string;
    email: string;
    enquiryType: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to send message");
    }
    
    return res.json();
  },

  async getSkillPrice(): Promise<{ price: number | null }> {
    const res = await fetch("/api/skill-price");
    
    if (!res.ok) {
      return { price: null };
    }
    
    return res.json();
  },
};

export interface AdminUpload {
  id: string;
  uploadedAt: string;
  username: string;
  taskTitle: string;
  fileUrl: string | null;
  status: string;
}
