"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";

export default function SignInPage() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const router = useRouter();
  const canvasRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [leafPosition, setLeafPosition] = useState({ x: -100, y: -100 });
  const [clouds, setClouds] = useState([]);
  
  // Initialize clouds
  useEffect(() => {
    const newClouds = [];
    for (let i = 0; i < 5; i++) {
      newClouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * 200,
        width: Math.random() * 200 + 100,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.4 + 0.3
      });
    }
    setClouds(newClouds);
    
    const interval = setInterval(() => {
      setClouds(prevClouds => 
        prevClouds.map(cloud => ({
          ...cloud,
          x: cloud.x > window.innerWidth ? -cloud.width : cloud.x + cloud.speed
        }))
      );
    }, 20);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle mouse movement for dust particles
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursorPosition({ x, y });
      
      // Add new dust particle
      if (Math.random() > 0.7) {
        setParticles(prev => [
          ...prev,
          {
            x,
            y,
            size: Math.random() * 6 + 1,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            opacity: Math.random() * 0.5 + 0.5,
            life: 100
          }
        ]);
      }
      
      // Update leaf position with delay
      setTimeout(() => {
        setLeafPosition({ x: x - 20, y: y - 20 });
      }, 100);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  // Animate dust particles
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      setParticles(prev => 
        prev
          .filter(p => p.life > 0)
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            life: p.life - 0.5,
            opacity: p.life / 100
          }))
      );
      
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${p.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [particles]);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      // Add many dust particles on click
      for (let i = 0; i < 30; i++) {
        setParticles(prev => [
          ...prev,
          {
            x: cursorPosition.x,
            y: cursorPosition.y,
            size: Math.random() * 8 + 2,
            speedX: (Math.random() - 0.5) * 6,
            speedY: (Math.random() - 0.5) * 6,
            opacity: Math.random() * 0.8 + 0.2,
            life: 100
          }
        ]);
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/role-redirect`
        }
      });
      
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err) {
      setErrorMsg("An error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Background with Ghibli style gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 z-0"></div>
      
      {/* Animated clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {clouds.map((cloud, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: cloud.width + 'px',
              height: cloud.width / 2 + 'px',
              top: cloud.y + 'px',
              left: cloud.x + 'px',
              opacity: cloud.opacity,
              filter: 'blur(10px)',
              transform: 'scale(1)'
            }}
          />
        ))}
      </div>
      
      {/* Canvas for dust particles */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-20"
      />
      
      
      
      {/* Ghibli style card */}
      <div className="relative max-w-md w-full px-6 z-40">
        <div className="bg-white/90 rounded-lg shadow-xl overflow-hidden border-2 border-amber-100 transform transition-all hover:scale-[1.01]">
          {/* Top decoration */}
          <div className="h-3 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-400"></div>
          
          <div className="p-8">
            {/* Logo with Ghibli style */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-200 to-blue-200 animate-pulse opacity-50"></div>
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={120}
                  height={120}
                  className="relative object-contain"
                />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif text-gray-800">Welcome Back</h1>
              <p className="text-gray-600 mt-2 font-light">Let's continue your journey</p>
            </div>
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            )}
            
            {/* Ghibli style button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-100 to-amber-200 py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
              disabled={isLoading}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
              
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FcGoogle className="text-2xl" />
                  <span className="font-medium text-amber-800 font-serif">Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-green-300 to-transparent rounded-full blur-md opacity-40 z-30"></div>
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-blue-300 to-transparent rounded-full blur-md opacity-40 z-30"></div>
      </div>
    </div>
  );
}