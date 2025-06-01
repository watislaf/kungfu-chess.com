"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Github, Heart, Send, User, Mail } from "lucide-react";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate sending message (in a real app, this would make an API call)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setMessage("");
      setEmail("");
      setName("");
      
      // Auto-close after showing success
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    }, 1000);
  };

  const openGitHub = () => {
    window.open("https://github.com/your-username/rapid-chess-online", "_blank");
  };

  const handleClose = () => {
    setSubmitted(false);
    setMessage("");
    setEmail("");
    setName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            Contact & Feedback
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="text-green-400 text-lg">✓ Message Sent!</div>
            <p className="text-gray-400 text-sm">
              Thank you for your feedback. We'll get back to you soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Github className="h-5 w-5" />
                <span>Open Source Chess Game</span>
              </div>
              <p className="text-sm text-gray-400">
                Got feedback, suggestions, or found a bug? Let us know!
              </p>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name (optional)
                </label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (optional)
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message *
                </label>
                <textarea
                  placeholder="Share your thoughts, report bugs, or suggest features..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[100px] p-3 bg-gray-800 border border-gray-700 text-white rounded-md resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center space-y-3">
              <Button
                onClick={openGitHub}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <Github className="h-4 w-4 mr-2" />
                View Source Code
              </Button>
              
              <div className="text-center text-xs text-gray-500">
                <Badge variant="outline" className="bg-blue-900/20 border-blue-900/50 text-blue-400">
                  💡 Your feedback helps improve the game
                </Badge>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 