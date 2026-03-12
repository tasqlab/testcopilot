import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetChatServers, useGetChannels } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";

import { ServersSidebar } from "@/components/servers-sidebar";
import { ChannelsSidebar } from "@/components/channels-sidebar";
import { ChatArea } from "@/components/chat-area";
import { MemberSidebar } from "@/components/member-sidebar";

import { CreateServerModal, JoinServerModal, CreateChannelModal, InviteModal } from "@/components/modals";
import { useGlobalWebSocket } from "@/hooks/use-websocket";

interface Props {
  params?: {
    serverId?: string;
    channelId?: string;
  };
}

export function ChatLayout({ params }: Props) {
  const { user, isAuthenticated } = useAuth();
  
  // Modals state
  const [isCreateServerOpen, setCreateServerOpen] = useState(false);
  const [isJoinServerOpen, setJoinServerOpen] = useState(false);
  const [isCreateChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteModalData, setInviteModalData] = useState<{isOpen: boolean, code: string}>({ isOpen: false, code: "" });

  const [, setLocation] = useLocation();

  // Establish real-time connection
  useGlobalWebSocket(isAuthenticated);

  // Queries
  const { data: servers, isLoading: isServersLoading } = useGetChatServers();
  
  const serverId = params?.serverId ? parseInt(params.serverId, 10) : undefined;
  const channelId = params?.channelId ? parseInt(params.channelId, 10) : undefined;

  const { data: channels } = useGetChannels(serverId || 0, { query: { enabled: !!serverId } });

  // Routing Logic: Auto-redirects
  useEffect(() => {
    if (isServersLoading) return;
    
    // No servers -> Stay on generic page (or show empty state)
    if (!servers || servers.length === 0) return;

    // Has servers, but none selected -> Go to first server
    if (!serverId) {
      setLocation(`/channels/${servers[0].id}`);
      return;
    }

    // Has server, but no channel selected -> Go to first channel of that server
    if (serverId && !channelId && channels && channels.length > 0) {
      setLocation(`/channels/${serverId}/${channels[0].id}`);
    }
  }, [servers, serverId, channelId, channels, isServersLoading, setLocation]);

  const activeServer = servers?.find(s => s.id === serverId);
  const activeChannel = channels?.find(c => c.id === channelId);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* Servers Sidebar (Always Visible) */}
      <ServersSidebar 
        activeServerId={serverId} 
        onCreateServer={() => setCreateServerOpen(true)}
        onJoinServer={() => setJoinServerOpen(true)}
      />

      {/* Channels Sidebar (Visible if a server is selected) */}
      {serverId && activeServer && (
        <ChannelsSidebar 
          serverId={serverId} 
          activeChannelId={channelId}
          onCreateChannel={() => setCreateChannelOpen(true)}
          onInvite={(code) => setInviteModalData({ isOpen: true, code })}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-chat-bg)] relative">
        {activeChannel ? (
          <div className="flex-1 flex flex-row h-full">
            <ChatArea channel={activeChannel} />
            <MemberSidebar serverId={serverId!} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground">
            <div className="w-16 h-16 mb-4 bg-secondary rounded-2xl flex items-center justify-center transform rotate-12">
              <span className="text-3xl">W</span>
            </div>
            {servers?.length === 0 ? (
              <p className="text-lg">You are not in any servers. Create or join one!</p>
            ) : (
              <p className="text-lg font-medium">Select a channel to start chatting.</p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setCreateServerOpen(false)} />
      <JoinServerModal isOpen={isJoinServerOpen} onClose={() => setJoinServerOpen(false)} />
      
      {serverId && (
        <CreateChannelModal 
          isOpen={isCreateChannelOpen} 
          onClose={() => setCreateChannelOpen(false)} 
          serverId={serverId} 
        />
      )}
      
      {serverId && (
        <InviteModal 
          isOpen={inviteModalData.isOpen} 
          onClose={() => setInviteModalData({ isOpen: false, code: "" })}
          inviteCode={inviteModalData.code}
          serverId={serverId}
        />
      )}

    </div>
  );
}
