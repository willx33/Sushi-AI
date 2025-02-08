"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  onNewChat: () => void;
};

export function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <div className="w-64 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full">
          + New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Placeholder for future chat session history */}
        <p className="text-sm text-muted-foreground">Chat history will appear here.</p>
      </div>
    </div>
  );
}
