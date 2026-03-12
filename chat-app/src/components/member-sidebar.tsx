import { useGetServerMembers } from "@workspace/api-client-react";

interface Props {
  serverId: number;
}

export function MemberSidebar({ serverId }: Props) {
  const { data: members, isLoading } = useGetServerMembers(serverId);

  if (isLoading) {
    return <div className="w-[240px] bg-[var(--color-channels-bg)] hidden lg:flex flex-col" />;
  }

  const onlineMembers = members?.filter(m => m.isOnline) || [];
  const offlineMembers = members?.filter(m => !m.isOnline) || [];

  return (
    <div className="w-[240px] min-w-[240px] bg-[var(--color-channels-bg)] h-full hidden lg:flex flex-col z-10 border-l border-border/50">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {onlineMembers.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 px-2">
              Online — {onlineMembers.length}
            </h3>
            <div className="space-y-[2px]">
              {onlineMembers.map(member => (
                <MemberItem key={member.userId} member={member} status="online" />
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 px-2">
              Offline — {offlineMembers.length}
            </h3>
            <div className="space-y-[2px]">
              {offlineMembers.map(member => (
                <MemberItem key={member.userId} member={member} status="offline" />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function MemberItem({ member, status }: { member: any, status: 'online' | 'offline' }) {
  const initials = member.username[0].toUpperCase();
  const isOnline = status === 'online';

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--color-channel-hover)] transition-colors group">
      <div className="relative w-8 h-8 shrink-0">
        <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white ${isOnline ? 'bg-primary' : 'bg-muted opacity-60'}`}>
          {member.profileImage ? (
            <img src={member.profileImage} alt={member.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-channels-bg)] group-hover:border-[var(--color-channel-hover)] transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className={`font-medium text-[15px] truncate leading-tight ${isOnline ? 'text-foreground' : 'text-muted-foreground'}`}>
          {member.username}
        </div>
      </div>
    </div>
  );
}
