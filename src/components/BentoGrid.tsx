import { Sparkles, GitBranch, Key, Settings, Wand2, FileText, Image, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import aiOrb from "@/assets/ai-orb.png";

const BentoGrid = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 auto-rows-[200px]">
          {/* Top Left Card - Effortless Prompt Perfection */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-between hover:bg-card/90 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 relative">
                <Sparkles className="w-5 h-5 text-white absolute top-2 left-2" />
                <span className="text-3xl font-bold text-white">P</span>
              </div>
              <h3 className="text-3xl font-bold text-foreground leading-tight">Effortless<br/>Prompt<br/>Perfection</h3>
            </div>
            <div>
              <p className="text-base text-foreground font-medium">14 days trial</p>
              <p className="text-sm text-muted-foreground">after – $5/month</p>
            </div>
          </Card>

          {/* Center Large Card - Hero with Orb */}
          <Card className="col-span-1 md:col-span-4 lg:col-span-6 row-span-4 bg-gradient-purple border-border/30 relative overflow-hidden flex flex-col items-center justify-start p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-600/20 to-primary/20 opacity-50"></div>
            
            {/* Header */}
            <div className="relative z-10 text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">PromptPal</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your AI Prompt<br/>Companion
              </h1>
            </div>

            {/* Orb Image with Binary Ring */}
            <div className="relative z-10 flex items-center justify-center flex-1 w-full">
              <div className="relative w-[280px] h-[280px] md:w-[350px] md:h-[350px] lg:w-[420px] lg:h-[420px]">
                {/* Binary code ring */}
                <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '60s' }}>
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text className="text-[8px] fill-white/40" style={{ fontFamily: 'monospace' }}>
                    <textPath href="#circlePath" startOffset="0%">
                      10001101110 01010101011010 10110
                    </textPath>
                  </text>
                  <defs>
                    <path id="circlePath" d="M 210,210 m -190,0 a 190,190 0 1,1 380,0 a 190,190 0 1,1 -380,0" />
                  </defs>
                </svg>
                
                <img 
                  src={aiOrb} 
                  alt="AI Orb" 
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl animate-pulse"
                  style={{ animationDuration: '4s' }}
                />
              </div>
            </div>
          </Card>

          {/* Top Right Card - Toggle Switch */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-6 flex items-center justify-center hover:bg-card/90 transition-all duration-300">
            <div className="w-40 h-20 rounded-full bg-secondary/60 flex items-center px-2 relative">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center ml-auto shadow-lg shadow-accent/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* Right Stats Card - 25M */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-6 flex flex-col items-center justify-center hover:bg-card/90 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-4xl text-muted-foreground font-light">[</span>
              <div className="text-center">
                <h2 className="text-5xl font-bold text-foreground">25M</h2>
                <p className="text-xs text-muted-foreground font-medium">created prompts</p>
              </div>
              <span className="text-4xl text-muted-foreground font-light">]</span>
            </div>
          </Card>

          {/* Bottom Left Card - 12K Happy Users */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col hover:bg-card/90 transition-all duration-300">
            <h2 className="text-7xl font-bold text-accent mb-2">12K</h2>
            <p className="text-base text-muted-foreground mb-6 font-medium">happy users</p>
            <div className="flex -space-x-3 mt-auto">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 border-2 border-card shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-amber-300 to-orange-400"></div>
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-2 border-card shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-amber-400"></div>
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-card shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
              </div>
            </div>
          </Card>

          {/* Generate Button Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-4 flex items-center justify-center hover:bg-card/90 transition-all duration-300">
            <Button className="w-full bg-gradient-purple text-white hover:opacity-90 transition-opacity rounded-full h-14 text-lg font-semibold shadow-lg shadow-primary/30">
              <Wand2 className="w-5 h-5 mr-2" />
              Generate
            </Button>
          </Card>

          {/* Bottom Left Small - Branching Paths */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-end hover:bg-card/90 transition-all duration-300 relative overflow-hidden">
            {/* Decorative dots */}
            <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-accent/40"></div>
            <div className="absolute top-20 left-12 w-2 h-2 rounded-full bg-accent/60"></div>
            <div className="absolute top-14 left-20 w-1.5 h-1.5 rounded-full bg-accent/30"></div>
            
            <div className="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Branching paths</h3>
            <p className="text-sm text-muted-foreground">Explore multiple prompt<br/>directions with branching.</p>
          </Card>

          {/* Bottom Center Small - Keyword Enhancer */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-end hover:bg-card/90 transition-all duration-300 relative overflow-hidden">
            {/* Decorative dots */}
            <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-primary/40"></div>
            <div className="absolute top-20 right-12 w-2 h-2 rounded-full bg-primary/60"></div>
            <div className="absolute top-14 right-20 w-1.5 h-1.5 rounded-full bg-primary/30"></div>
            
            <div className="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Keyword enhancer</h3>
            <p className="text-sm text-muted-foreground">Boost your prompt<br/>precision with keywords.</p>
          </Card>

          {/* Bottom Right Card - Templates */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-between hover:bg-card/90 transition-all duration-300 relative">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Prompt templates</h3>
              <p className="text-sm text-muted-foreground">Use pre-made templates<br/>to jumpstart creativity.</p>
            </div>
            <div className="relative flex items-end justify-between">
              <Button className="rounded-full border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-white transition-all duration-300 px-6">
                14 days trial
              </Button>
              <div className="flex flex-col gap-2.5 items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rewrite</span>
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">PNG</span>
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">JPG</span>
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">GIF</span>
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
