import { Sparkles, Users, Zap, GitBranch, Key, FileText, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BentoGrid = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 auto-rows-[200px]">
          {/* Top Left Card - Effortless Prompt Perfection */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-between backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-purple flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">Effortless Prompt Perfection</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">14 days trial</p>
              <p className="text-sm text-muted-foreground">after – $5/month</p>
            </div>
          </Card>

          {/* Center Large Card - Hero */}
          <Card className="col-span-1 md:col-span-4 lg:col-span-6 row-span-4 bg-gradient-purple border-border relative overflow-hidden flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-gradient-orb opacity-90"></div>
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-accent" />
                <span className="text-lg font-semibold text-white">PromptPal</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Your AI Prompt Companion
              </h1>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-gradient-orb animate-pulse blur-3xl opacity-60"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] rounded-full border-2 border-white/20"></div>
            </div>
          </Card>

          {/* Top Right Card - Toggle */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-6 flex items-center justify-center backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <div className="w-32 h-16 rounded-full bg-secondary flex items-center px-2">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center ml-auto">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Right Stats Card - 25M */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-6 flex flex-col items-center justify-center backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <h2 className="text-5xl font-bold text-foreground mb-2">25M</h2>
            <p className="text-sm text-muted-foreground">created prompts</p>
          </Card>

          {/* Bottom Left Card - 12K Happy Users */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <h2 className="text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-3">12K</h2>
            <p className="text-lg text-muted-foreground mb-4">happy users</p>
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-purple border-2 border-card"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-card"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 border-2 border-card"></div>
            </div>
          </Card>

          {/* Bottom Left Small - Branching Paths */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-end backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-6 left-6 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Branching paths</h3>
            <p className="text-sm text-muted-foreground">Explore multiple prompt directions with branching.</p>
          </Card>

          {/* Bottom Center Small - Keyword Enhancer */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-end backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-6 left-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Keyword enhancer</h3>
            <p className="text-sm text-muted-foreground">Boost your prompt precision with keywords.</p>
          </Card>

          {/* Bottom Right Card - Templates */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 bg-card border-border p-6 flex flex-col justify-between backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Prompt templates</h3>
              <p className="text-sm text-muted-foreground mb-6">Use pre-made templates to jumpstart creativity.</p>
            </div>
            <div className="relative">
              <Button className="rounded-full border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-white transition-all duration-300">
                14 days trial
              </Button>
              <div className="absolute -right-4 -bottom-4 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs text-white">PDF</div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-white">PNG</div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs text-white">JPG</div>
              </div>
            </div>
          </Card>

          {/* Generate Button Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-card border-border p-6 flex items-center justify-center backdrop-blur-sm bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
            <Button className="w-full bg-gradient-purple text-white hover:opacity-90 transition-opacity rounded-2xl h-14 text-lg font-semibold">
              <Zap className="w-5 h-5 mr-2" />
              Generate
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
