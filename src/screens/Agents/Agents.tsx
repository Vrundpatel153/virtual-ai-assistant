import React from "react";
import { Navbar } from "../../components/Navbar";
import { Bot, Zap, Brain, Target, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
  icon: React.ReactNode;
  color: string;
}

export const Agents = (): JSX.Element => {
  const agents: Agent[] = [
    {
      id: "1",
      name: "Research Agent",
      description: "Gathers and analyzes information from multiple sources",
      status: "active",
      tasksCompleted: 247,
      icon: <Brain className="w-6 h-6 text-white" />,
      color: "from-purple-600 to-purple-700",
    },
    {
      id: "2",
      name: "Task Manager",
      description: "Organizes and prioritizes your daily activities",
      status: "processing",
      tasksCompleted: 189,
      icon: <Target className="w-6 h-6 text-white" />,
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "3",
      name: "Content Creator",
      description: "Generates creative content and suggestions",
      status: "active",
      tasksCompleted: 356,
      icon: <Sparkles className="w-6 h-6 text-white" />,
      color: "from-orange-600 to-orange-700",
    },
    {
      id: "4",
      name: "Analytics Agent",
      description: "Monitors performance and provides insights",
      status: "idle",
      tasksCompleted: 142,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      color: "from-green-600 to-green-700",
    },
  ];

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500 animate-pulse";
      case "idle":
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-400" />
              AI Agents
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Autonomous AI agents working on your behalf
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_48px_rgba(139,92,246,0.3)] transition-all duration-300 hover:border-white/20 rounded-[20px] md:rounded-[24px] overflow-hidden cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg`}>
                      {agent.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-gray-400 text-xs capitalize">{agent.status}</span>
                    </div>
                  </div>

                  <h3 className="text-white text-xl font-bold mb-2">{agent.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{agent.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Tasks Completed</span>
                    </div>
                    <span className="text-white font-bold text-lg">{agent.tasksCompleted}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 shadow-[0_8px_32px_rgba(139,92,246,0.2)] rounded-[20px] md:rounded-[24px] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white text-xl font-bold">Create New Agent</h3>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                Design a custom AI agent tailored to your specific needs and workflows
              </p>
              <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                <Sparkles className="w-4 h-4" />
                Create Agent
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
