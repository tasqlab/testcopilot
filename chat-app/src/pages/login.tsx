import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export function Login() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-hero.png`} 
          alt="Cosmic chat app background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
      </div>

      {/* Content Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 md:p-10 bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-[15px] mb-8 leading-relaxed max-w-xs mx-auto">
          We're so excited to see you again. Join the conversation and connect with your communities.
        </p>

        <Button 
          onClick={() => login()}
          disabled={isLoading}
          size="lg"
          className="w-full h-12 text-[15px] font-bold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          {isLoading ? "Loading..." : "Log In with Replit"}
        </Button>
        
        <p className="mt-6 text-xs text-muted-foreground">
          By logging in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
