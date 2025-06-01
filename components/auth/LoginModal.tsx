"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Mail, Trophy, Crown, Star } from "lucide-react";
import { LoginCredentials, RegisterData } from "@/app/models/Player";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  onRegister: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    username: "",
    password: "",
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterData>({
    username: "",
    password: "",
    displayName: "",
    email: "",
  });

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onLogin(loginForm);
      if (result.success) {
        onClose();
        setLoginForm({ username: "", password: "" });
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password || !registerForm.displayName) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate username length
    if (registerForm.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    // Validate display name length
    if (registerForm.displayName.length < 2) {
      setError("Display name must be at least 2 characters long");
      return;
    }

    // Validate password length
    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate email format if provided
    if (registerForm.email && registerForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        setError("Please enter a valid email address");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onRegister(registerForm);
      if (result.success) {
        onClose();
        setRegisterForm({ username: "", password: "", displayName: "", email: "" });
      } else {
        // Improve error messages
        let errorMessage = result.message || "Registration failed";
        if (errorMessage.toLowerCase().includes("already exists") || 
            errorMessage.toLowerCase().includes("username") && errorMessage.toLowerCase().includes("taken")) {
          errorMessage = "This username is already taken. Please choose a different one.";
        } else if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exists")) {
          errorMessage = "An account with this email already exists.";
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Enter the Arena
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-gray-700">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gray-700">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
                  {error}
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Test Account:</div>
                <Badge variant="outline" className="bg-gray-800 border-gray-700 text-gray-300">
                  Username: tugrza | Password: password123
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username *
                </Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="Choose a username (min 3 chars)"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-display-name" className="text-gray-300 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Display Name *
                </Label>
                <Input
                  id="register-display-name"
                  type="text"
                  placeholder="Your display name (min 2 chars)"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (optional)
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-gray-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password *
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Choose a password (min 6 chars)"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
                  {error}
                </div>
              )}

              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center">
                <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-blue-300 font-medium">Start Your Journey</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Begin at 1200 ELO • Climb the ranks • Become a Grandmaster
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 