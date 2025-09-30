import { Sparkles, GitBranch, Key, FileCode, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import aiOrb from "@/assets/ai-orb.png";

const BentoGrid = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 auto-rows-[200px]">
          {/* Top Left Card - Effortless Prompt Perfection */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card/80 border-border/50 p-6 flex flex-col justify-between backdrop-blur-sm hover:bg-card/90 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground leading-tight">Effortless<br/>Prompt<br/>Perfection</h3>
            </div>
            <div>
              <p className="text-base text-muted-foreground mb-1 font-medium">14 days trial</p>
              <p className="text-sm text-muted-foreground/70">after – $5/month</p>
            </div>
          </Card>

          {/* Center Large Card - Hero with Orb */}
          <Card className="col-span-1 md:col-span-4 lg:col-span-6 row-span-4 bg-gradient-purple border-border/30 relative overflow-hidden flex flex-col items-center justify-start p-8">
            <div className="absolute inset-0 bg-gradient-orb opacity-40"></div>
            
            {/* Header */}
            <div className="relative z-10 text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Sparkles className="w-6 h-6 text-accent" />
                <span className="text-lg font-semibold text-white">PromptPal</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your AI Prompt<br/>Companion
              </h1>
            </div>

            {/* Orb Image */}
            <div className="relative z-10 flex items-center justify-center flex-1 w-full">
              <div className="relative w-[280px] h-[280px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px]">
                <img 
                  src={aiOrb} 
                  alt="AI Orb" 
                  className="w-full h-full object-contain drop-shadow-2xl animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
                {/* Binary code ring effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border border-white/10"></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Right Card - Toggle Switch */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card/80 border-border/50 p-6 flex items-center justify-center backdrop-blur-sm hover:bg-card/90 transition-all duration-300">
            <div className="w-36 h-20 rounded-full bg-secondary/80 flex items-center px-2 relative">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center ml-auto shadow-lg shadow-accent/50">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* Right Stats Card - 25M */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card/80 border-border/50 p-6 flex flex-col items-center justify-center backdrop-blur-sm hover:bg-card/90 transition-all duration-300">
            <h2 className="text-6xl font-bold text-foreground mb-1">25M</h2>
            <p className="text-sm text-muted-foreground font-medium">created prompts</p>
          </Card>

          {/* Bottom Left Card - 12K Happy Users */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card/80 border-border/50 p-6 flex flex-col backdrop-blur-sm hover:bg-card/90 transition-all duration-300">
            <h2 className="text-7xl font-bold text-accent mb-2">12K</h2>
            <p className="text-base text-muted-foreground mb-6 font-medium">happy users</p>
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 border-2 border-card shadow-lg"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-2 border-card shadow-lg"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-card shadow-lg"></div>
            </div>
          </Card>

          {/* Bottom Left Small - Branching Paths */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card/80 border-border/50 p-6 flex flex-col justify-end backdrop-blur-sm hover:bg-card/90 transition-all duration-300 relative overflow-hidden">
            {/* Decorative dots */}
            <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-accent/40"></div>
            <div className="absolute top-20 left-12 w-2 h-2 rounded-full bg-accent/60"></div>
            
            <div className="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-lg shadow-accent/30">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Branching paths</h3>
            <p className="text-sm text-muted-foreground">Explore multiple prompt<br/>directions with branching.</p>
          </Card>

          {/* Bottom Center Small - Keyword Enhancer */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card/80 border-border/50 p-6 flex flex-col justify-end backdrop-blur-sm hover:bg-card/90 transition-all duration-300 relative overflow-hidden">
            {/* Decorative dots */}
            <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-primary/40"></div>
            <div className="absolute top-20 right-12 w-2 h-2 rounded-full bg-primary/60"></div>
            
            <div className="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Key className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Keyword enhancer</h3>
            <p className="text-sm text-muted-foreground">Boost your prompt<br/>precision with keywords.</p>
          </Card>

          {/* Bottom Right Card - Templates */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card/80 border-border/50 p-6 flex flex-col justify-between backdrop-blur-sm hover:bg-card/90 transition-all duration-300 relative">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Prompt templates</h3>
              <p className="text-sm text-muted-foreground">Use pre-made templates<br/>to jumpstart creativity.</p>
            </div>
            <div className="relative flex items-end justify-between">
              <Button className="rounded-full border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-white transition-all duration-300 px-6">
                14 days trial
              </Button>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-xs text-muted-foreground">PDF</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-xs text-muted-foreground">PNG</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-xs text-muted-foreground">JPG</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <span className="text-xs text-muted-foreground">GIF</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Generate Button Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card/80 border-border/50 p-4 flex items-center justify-center backdrop-blur-sm hover:bg-card/90 transition-all duration-300">
            <Button className="w-full bg-gradient-purple text-white hover:opacity-90 transition-opacity rounded-full h-14 text-lg font-semibold shadow-lg shadow-primary/30">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
