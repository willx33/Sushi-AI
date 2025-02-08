import { Sidebar } from "./Sidebar";
import { ApiKeyInput } from "@/components/ApiKeyInput";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar on the left */}
      <Sidebar
        onNewChat={() => {
          // For now, simply reload the page to start a new chat.
          window.location.reload();
        }}
      />
      {/* Main area: header and chat content */}
      <div className="flex-1 flex flex-col">
        <ApiKeyInput />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};
