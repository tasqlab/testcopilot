import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMessagesQueryKey, getGetServerMembersQueryKey } from "@workspace/api-client-react";

type WSMessage = 
  | { type: 'message:new'; data: any }
  | { type: 'message:delete'; data: { id: number; channelId: number } }
  | { type: 'member:online'; data: { userId: string; channelId?: number } }
  | { type: 'member:offline'; data: { userId: string; channelId?: number } };

export function useGlobalWebSocket(isAuthenticated: boolean) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated) return;
    
    // In production, Replit automatically proxies wss://. 
    // We construct the URL relative to current location.
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("[WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const payload: WSMessage = JSON.parse(event.data);
        handleWebSocketMessage(payload, queryClient);
      } catch (err) {
        console.error("[WS] Parse error", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("[WS] Disconnected");
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error", err);
    };
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}

// Global handler for WS events to update React Query cache automatically
function handleWebSocketMessage(payload: WSMessage, queryClient: ReturnType<typeof useQueryClient>) {
  switch (payload.type) {
    case 'message:new': {
      const msg = payload.data;
      const queryKey = getGetMessagesQueryKey(msg.channelId);
      
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return [msg];
        // Prevent duplicates
        if (oldData.some((m: any) => m.id === msg.id)) return oldData;
        return [...oldData, msg];
      });
      break;
    }
    case 'message:delete': {
      const { id, channelId } = payload.data;
      const queryKey = getGetMessagesQueryKey(channelId);
      
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((m: any) => m.id !== id);
      });
      break;
    }
    case 'member:online':
    case 'member:offline': {
      // Invalidate all member queries to keep it simple, 
      // or optionally selectively update if we had serverId.
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === '/api/chat-servers' && query.queryKey[2] === 'members'
      });
      // Fallback blanket invalidation just in case the key structure varies
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/members')
      });
      break;
    }
  }
}
