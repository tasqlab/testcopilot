import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateChatServer, useJoinChatServer, useCreateChannel, getGetChatServersQueryKey, getGetChannelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Hash, Compass, Plus, Server } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateServerModal({ isOpen, onClose }: ModalProps) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateChatServer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutate({ data: { name } }, {
      onSuccess: (server) => {
        queryClient.invalidateQueries({ queryKey: getGetChatServersQueryKey() });
        setName("");
        onClose();
        setLocation(`/channels/${server.id}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border/50 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Customize your server</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Give your new server a personality with a name. You can always change it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Server Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="My Awesome Server"
              className="bg-input border-0 focus-visible:ring-1 focus-visible:ring-primary h-10"
              autoFocus
            />
          </div>
          <DialogFooter className="bg-secondary/50 -mx-6 -mb-6 px-6 py-4 flex justify-between sm:justify-between items-center rounded-b-lg mt-8">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-transparent hover:underline text-muted-foreground">
              Back
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function JoinServerModal({ isOpen, onClose }: ModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Note: API requires serverId in path, which makes join by code a bit unusual if we don't know the serverId.
  // Wait, the API spec says POST /chat-servers/{serverId}/join but the body takes inviteCode.
  // Actually, if we don't know the serverId, we can't call this endpoint easily.
  // Let's assume the invite code is the server ID for now, or the API handles it differently.
  // In a real app, there's usually a global /invites/{code} endpoint. 
  // Given the current spec: /chat-servers/{serverId}/join
  // If the user pastes an invite code, how do we extract serverId? 
  // We'll parse it: if they paste "123-abc", maybe 123 is the ID.
  const { mutate, isPending } = useJoinChatServer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!inviteCode.trim()) return;

    // We'll attempt to extract a server ID if the code format is "serverId-randomString"
    // If not, we'll gracefully show an error asking for valid format.
    const parts = inviteCode.split('-');
    const serverId = parseInt(parts[0], 10);
    
    if (isNaN(serverId)) {
      setError("Invalid invite code format. Expected: {ServerID}-{Code}");
      return;
    }

    mutate({ serverId, data: { inviteCode } }, {
      onSuccess: (server) => {
        queryClient.invalidateQueries({ queryKey: getGetChatServersQueryKey() });
        setInviteCode("");
        onClose();
        setLocation(`/channels/${server.id}`);
      },
      onError: (err: any) => {
        setError(err.message || "Failed to join server.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border/50 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Join a Server</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Enter an invite below to join an existing server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="invite" className="text-xs font-bold uppercase text-muted-foreground">Invite Code</Label>
            <Input 
              id="invite" 
              value={inviteCode} 
              onChange={(e) => setInviteCode(e.target.value)} 
              placeholder="e.g. 42-abcdef"
              className="bg-input border-0 focus-visible:ring-1 focus-visible:ring-primary h-10"
              autoFocus
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
          <DialogFooter className="bg-secondary/50 -mx-6 -mb-6 px-6 py-4 flex justify-between sm:justify-between items-center rounded-b-lg mt-8">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-transparent hover:underline text-muted-foreground">
              Back
            </Button>
            <Button type="submit" disabled={isPending || !inviteCode.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
              {isPending ? "Joining..." : "Join Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateChannelModal({ isOpen, onClose, serverId }: ModalProps & { serverId: number }) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateChannel();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Convert spaces to dashes for a more Discord-like feel
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');

    mutate({ serverId, data: { name: formattedName, type: "text" } }, {
      onSuccess: (channel) => {
        queryClient.invalidateQueries({ queryKey: getGetChannelsQueryKey(serverId) });
        setName("");
        onClose();
        setLocation(`/channels/${serverId}/${channel.id}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border/50 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Channel</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            in Text Channels
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="channelName" className="text-xs font-bold uppercase text-muted-foreground">Channel Name</Label>
            <div className="relative flex items-center">
              <Hash className="absolute left-3 w-5 h-5 text-muted-foreground" />
              <Input 
                id="channelName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="new-channel"
                className="bg-input border-0 pl-10 focus-visible:ring-1 focus-visible:ring-primary h-10"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="bg-secondary/50 -mx-6 -mb-6 px-6 py-4 flex justify-between sm:justify-between items-center rounded-b-lg mt-8">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-transparent hover:underline text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
              {isPending ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InviteModal({ isOpen, onClose, inviteCode, serverId }: ModalProps & { inviteCode: string, serverId: number }) {
  const [copied, setCopied] = useState(false);
  
  // We prepend serverId to the invite code to match our join logic
  const fullCode = `${serverId}-${inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border/50 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invite friends</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share this link with others to grant access to your server.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Share this code</Label>
            <div className="flex bg-input rounded-md items-center p-1 border border-border">
              <div className="px-3 text-sm text-foreground flex-1 font-mono truncate">{fullCode}</div>
              <Button 
                onClick={copyToClipboard} 
                className={`transition-all ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90'}`}
                size="sm"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
