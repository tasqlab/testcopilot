import { Link } from "wouter";
import { useGetChannels, useGetChatServer, useDeleteChatServer, getGetChatServersQueryKey } from "@workspace/api-client-react";
import { Hash, ChevronDown, UserPlus, Settings, Trash2, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Props {
  serverId: number;
  activeChannelId?: number;
  onCreateChannel: () => void;
  onInvite: (code: string) => void;
}

export function ChannelsSidebar({ serverId, activeChannelId, onCreateChannel, onInvite }: Props) {
  const { data: server } = useGetChatServer(serverId);
  const { data: channels } = useGetChannels(serverId);
  const { user } = useAuth();
  const { mutate: deleteServer } = useDeleteChatServer();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const isOwner = server?.ownerId === user?.id;

  const handleDeleteServer = () => {
    if (confirm("Are you sure you want to delete this server? This action cannot be undone.")) {
      deleteServer({ serverId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatServersQueryKey() });
          setLocation("/");
        }
      });
    }
  };

  return (
    <div className="w-[240px] min-w-[240px] bg-[var(--color-channels-bg)] h-full flex flex-col z-20 shadow-sm border-r border-border/50">
      {/* Header */}
      {server && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 cursor-pointer hover:bg-[var(--color-channel-hover)] transition-colors">
              <h2 className="font-display font-bold text-[15px] truncate pr-2 text-foreground">{server.name}</h2>
              <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#111214] border-0 shadow-2xl p-2 rounded-lg text-foreground mt-1">
            <DropdownMenuItem 
              onClick={() => onInvite(server.inviteCode)}
              className="text-indigo-400 focus:text-white focus:bg-indigo-500 cursor-pointer font-medium py-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite People
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateChannel} className="cursor-pointer font-medium py-2 focus:bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Channel
            </DropdownMenuItem>
            
            {isOwner && (
              <>
                <DropdownMenuSeparator className="bg-border/50 my-1" />
                <DropdownMenuItem onClick={handleDeleteServer} className="text-red-400 focus:text-white focus:bg-red-500 cursor-pointer font-medium py-2">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Server
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-[2px]">
        <div className="flex items-center justify-between group pt-4 pb-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 group-hover:text-muted-foreground transition-colors px-1">
            Text Channels
          </h3>
          <button onClick={onCreateChannel} className="text-muted-foreground/80 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all p-1">
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {channels?.map((channel) => {
          const isActive = channel.id === activeChannelId;
          return (
            <Link key={channel.id} href={`/channels/${serverId}/${channel.id}`}>
              <div className={`group flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[var(--color-channel-active)] text-foreground' : 'text-muted-foreground hover:bg-[var(--color-channel-hover)] hover:text-foreground'}`}>
                <Hash className={`w-5 h-5 mr-1.5 opacity-60 ${isActive ? 'text-foreground opacity-100' : ''}`} />
                <span className="font-medium text-[15px] truncate">{channel.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Current User Bar */}
      <div className="h-[52px] bg-[#232428] flex items-center px-2 border-t border-border/20 shrink-0">
        <div className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer w-full">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 relative">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.username ?? ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              (user?.username ?? user?.email ?? "?")[0].toUpperCase()
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#232428]" />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-[13px] font-bold text-foreground leading-tight truncate">{user?.username ?? user?.email ?? "User"}</span>
            <span className="text-[11px] text-muted-foreground leading-tight truncate">Online</span>
          </div>
          <button className="p-1.5 rounded text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
