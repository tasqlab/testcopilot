import { Link } from "wouter";
import { useGetChatServers } from "@workspace/api-client-react";
import { Plus, Compass, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  activeServerId?: number;
  onCreateServer: () => void;
  onJoinServer: () => void;
}

export function ServersSidebar({ activeServerId, onCreateServer, onJoinServer }: Props) {
  const { data: servers, isLoading } = useGetChatServers();

  return (
    <div className="w-[72px] min-w-[72px] bg-[var(--color-servers-bg)] h-full flex flex-col items-center py-3 gap-2 z-10 relative">
      <NavButton
        icon={<Compass className="w-6 h-6" />}
        label="Explore Public Servers (Join via Code)"
        onClick={onJoinServer}
        isActive={false}
      />
      
      <div className="w-8 h-[2px] bg-border rounded-full mx-auto my-1" />

      <div className="flex-1 w-full overflow-y-auto hide-scrollbar flex flex-col items-center gap-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-[24px] bg-secondary animate-pulse" />
          ))
        ) : (
          servers?.map((server) => (
            <ServerItem 
              key={server.id} 
              server={server} 
              isActive={server.id === activeServerId} 
            />
          ))
        )}

        <NavButton
          icon={<Plus className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" />}
          label="Add a Server"
          onClick={onCreateServer}
          isActive={false}
          className="group hover:bg-green-500"
        />
      </div>
    </div>
  );
}

function ServerItem({ server, isActive }: { server: any, isActive: boolean }) {
  const initials = server.name.split(' ').map((n: string) => n[0]).join('').substring(0, 3).toUpperCase();
  
  return (
    <div className="relative group w-full flex justify-center">
      {/* Active Indicator Pill */}
      <div className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-200 ease-out ${isActive ? 'h-10 top-1/2 -translate-y-1/2' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} />
      
      <Tooltip delayDuration={50} placement="right">
        <TooltipTrigger asChild>
          <Link href={`/channels/${server.id}`}>
            <div className={`w-12 h-12 flex items-center justify-center text-foreground font-semibold text-sm transition-all duration-200 cursor-pointer overflow-hidden ${isActive ? 'rounded-[16px] bg-primary text-white' : 'rounded-[24px] bg-secondary hover:rounded-[16px] hover:bg-primary hover:text-white'}`}>
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-semibold text-sm">
          {server.name}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function NavButton({ icon, label, onClick, isActive, className = "" }: any) {
  return (
    <div className="relative group w-full flex justify-center">
      <div className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-200 ease-out ${isActive ? 'h-10 top-1/2 -translate-y-1/2' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} />
      
      <Tooltip delayDuration={50} placement="right">
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            className={`w-12 h-12 flex items-center justify-center text-green-500 transition-all duration-200 cursor-pointer ${isActive ? 'rounded-[16px] bg-green-500 text-white' : 'rounded-[24px] bg-secondary hover:rounded-[16px]'} ${className}`}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-semibold text-sm">
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
