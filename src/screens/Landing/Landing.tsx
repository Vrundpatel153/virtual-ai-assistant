import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, User, Chrome } from "lucide-react";
import { authService } from "../../lib/auth";
import { useGlobalLoading } from "../../components/LoadingProvider";

export const Landing = (): JSX.Element => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    if (isLogin) {
      const result = authService.signIn(email, password);
      if (result.success) {
        navigate("/home");
      } else {
        setError(result.error || "Login failed");
      }
    } else {
      const result = authService.signUp(email, password, name);
      if (result.success) {
        navigate("/home");
      } else {
        setError(result.error || "Signup failed");
      }
    }
    setTimeout(()=> setLoading(false), 600);
  };

  const handleGoogleLogin = () => {
    const googleEmail = prompt("Enter your Google email:");
    const googleName = prompt("Enter your name:");
    
    if (googleEmail && googleName) {
      setLoading(true);
      authService.signInWithGoogle(googleEmail, googleName);
      navigate("/home");
      setTimeout(()=> setLoading(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 mb-4 shadow-lg shadow-purple-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">AI Assistant Hub</h1>
          <p className="text-gray-400">Chat • Voice • AI Tools</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isLogin
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                  : "bg-[#2a2d4a] text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                !isLogin
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                  : "bg-[#2a2d4a] text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#2a2d4a] text-white rounded-xl pl-12 pr-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#2a2d4a] text-white rounded-xl pl-12 pr-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#2a2d4a] text-white rounded-xl pl-12 pr-4 py-3 outline-none border border-white/10 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1e2139] text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-[#2a2d4a] hover:bg-[#323556] text-white py-3 rounded-xl font-semibold border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Experience the power of AI-driven conversations and tools
        </p>
      </div>
    </div>
  );
};
