"use client";

import { useState, useCallback } from 'react';

export function useChatPrompt() {
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const openPrompt = useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  return {
    isPromptOpen,
    openPrompt,
    closePrompt,
  };
} 