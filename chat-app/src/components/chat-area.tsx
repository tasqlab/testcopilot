import { useState, useRef, useEffect } from "react";
import { useGetMessages, useCreateMessage, useDeleteMessage } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Hash, PlusCircle, Smile, Send, Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  channel: any;
}

export function ChatArea({ channel }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useGetMessages(channel.id);
  const { mutate: sendMessage, isPending } = useCreateMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { user } = useAuth();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    
    sendMessage({ channelId: channel.id, data: { content: input } }, {
      onSuccess: () => setInput("")
    });
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
    return format(d, 'MM/dd/yyyy');
  };

  if (isLoading) {
    return <div className="flex-1 bg-[var(--color-chat-bg)] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-chat-bg)] h-full overflow-hidden relative">
      {/* Header */}
      <div className="h-12 border-b border-border/50 flex items-center px-4 shrink-0 shadow-sm z-10 bg-[var(--color-chat-bg)]">
        <Hash className="w-6 h-6 text-muted-foreground mr-2 opacity-70" />
        <h2 className="font-bold text-[15px] text-foreground">{channel.name}</h2>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 flex flex-col"
      >
        {/* Channel Welcome Message */}
        <div className="mt-auto mb-6 pt-10">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Hash className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome to #{channel.name}!
          </h1>
          <p className="text-muted-foreground">
            This is the start of the #{channel.name} channel.
          </p>
        </div>

        <div className="space-y-[2px]">
          <AnimatePresence initial={false}>
            {messages?.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const isGrouped = prevMsg && 
                                prevMsg.authorId === msg.authorId &&
                                (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000);

              const isOwnMessage = user?.id === msg.authorId;

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group flex px-4 hover:bg-[var(--color-message-hover)] -mx-4 ${isGrouped ? 'py-0.5' : 'py-1 mt-4'}`}
                >
                  {/* Left Column (Avatar or Timestamp) */}
                  <div className="w-10 shrink-0 mr-4 flex justify-center">
                    {isGrouped ? (
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 mt-1 select-none w-10 text-center">
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity">
                        {msg.authorProfileImage ? (
                          <img src={msg.authorProfileImage} alt={msg.authorUsername} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          msg.authorUsername[0].toUpperCase()
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column (Message Content) */}
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-medium text-foreground hover:underline cursor-pointer text-[15px]">
                          {msg.authorUsername}
                        </span>
                        <span className="text-[12px] text-muted-foreground ml-1">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <p className="text-foreground/90 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {/* Actions (Hover) */}
                  <div className="w-14 shrink-0 flex items-start justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwnMessage && (
                      <button 
                        onClick={() => deleteMessage({ messageId: msg.id })}
                        className="p-1.5 bg-background border border-border rounded hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors text-muted-foreground"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSend} className="bg-[var(--color-secondary)] rounded-lg flex items-center px-4 overflow-hidden relative border border-border/50 focus-within:border-primary/50 transition-colors">
          <button type="button" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <PlusCircle className="w-6 h-6" />
          </button>
          
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground py-3.5 px-2 text-[15px]"
            autoComplete="off"
          />
          
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Smile className="w-6 h-6" />
            </button>
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="p-1.5 text-primary hover:text-primary/80 disabled:opacity-50 disabled:hover:text-primary transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
