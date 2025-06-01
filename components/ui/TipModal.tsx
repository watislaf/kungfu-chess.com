"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Github, Heart, Wallet, X } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTipped?: () => void; // New callback for when user confirms they tipped
}

// Note: The addresses provided seem to be swapped, but using as provided
const WALLET_ADDRESSES = {
  solana: "0xc7e55E6a995BEf5F39171C3B6f0113cB56D63e4E", // This looks like an ETH address
  ethereum: "7BAFcjzQDH4BA3mSfLEk6n6g15XewsGARsiaWK5aL32s" // This looks like a SOL address
};

export function TipModal({ isOpen, onClose, onTipped }: TipModalProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openMetaMask = () => {
      window.open("https://portfolio.metamask.io/transfer", "_blank"); 
  };

  const openSolanaWallet = () => {
    // Check if Phantom wallet is installed
    if (typeof window !== 'undefined' && (window as any).solana && (window as any).solana.isPhantom) {
      // Phantom is installed - could implement transaction here
      window.open(`https://phantom.app/ul/v1/send?recipient=${WALLET_ADDRESSES.solana}`, '_blank');
    } else {
      // Phantom not installed, open download page
      window.open('https://phantom.app/', '_blank');
    }
  };

  const handleTipped = () => {
    if (onTipped) {
      onTipped();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Support the Project
            </DialogTitle>
           
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <Github className="h-5 w-5" />
              <span>Open Source Chess Game</span>
            </div>
            <p className="text-sm text-gray-400">
              If you enjoy playing, consider sending a tip to support development!
            </p>
          </div>

          {/* Ethereum Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Ξ</span>
              </div>
              <h3 className="text-white font-medium">Ethereum (ETH)</h3>
            </div>
            
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-gray-300 flex-1 break-all">
                  {WALLET_ADDRESSES.ethereum}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(WALLET_ADDRESSES.ethereum, 'ethereum')}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  {copiedAddress === 'ethereum' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={openMetaMask}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Open MetaMask
            </Button>
          </div>

          {/* Solana Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">◎</span>
              </div>
              <h3 className="text-white font-medium">Solana (SOL)</h3>
            </div>
            
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-gray-300 flex-1 break-all">
                  {WALLET_ADDRESSES.solana}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(WALLET_ADDRESSES.solana, 'solana')}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  {copiedAddress === 'solana' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={openSolanaWallet}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Open Phantom Wallet
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleTipped}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              ✅ I Tipped!
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              Maybe Later
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Tips help maintain servers and fund new features</p>
            <Badge variant="outline" className="bg-green-900/20 border-green-900/50 text-green-400">
              💝 Thank you for your support!
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 