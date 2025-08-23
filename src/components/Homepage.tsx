
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Star, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Homepage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Video autoplay failed:", e));
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                alt="Sports Reels"
                className="w-10 h-10"
              />
              <span className="ml-3 text-xl font-bold text-rosegold font-polysans">Sports Reels</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button onClick={() => scrollToSection('home')} className="text-gray-300 hover:text-rosegold transition-colors">Home</button>
                <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-rosegold transition-colors">Features</button>
                <button onClick={() => scrollToSection('about')} className="text-gray-300 hover:text-rosegold transition-colors">About</button>
                <button onClick={() => scrollToSection('services')} className="text-gray-300 hover:text-rosegold transition-colors">Services</button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-300 hover:text-rosegold transition-colors">Contact</button>
              </div>
            </div>

            <div className="hidden md:block">
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-rosegold hover:bg-rosegold/80 text-white px-6 py-2"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-gray-300 hover:text-rosegold">Home</button>
              <button onClick={() => scrollToSection('features')} className="block px-3 py-2 text-gray-300 hover:text-rosegold">Features</button>
              <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-gray-300 hover:text-rosegold">About</button>
              <button onClick={() => scrollToSection('services')} className="block px-3 py-2 text-gray-300 hover:text-rosegold">Services</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-gray-300 hover:text-rosegold">Contact</button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full mt-4 bg-rosegold hover:bg-rosegold/80 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4" type="video/mp4" />
          <source src="/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in font-polysans">
            The Future of
            <span className="text-rosegold block">Sports Analytics</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 animate-fade-in">
            Revolutionizing sports performance with cutting-edge data analysis and AI-powered insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-rosegold hover:bg-rosegold/80 text-white px-8 py-4 text-lg"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => scrollToSection('features')}
              className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-polysans">
              Powerful <span className="text-rosegold">Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to analyze, manage, and optimize sports performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "AI Video Analysis",
                description: "Advanced AI algorithms analyze every play, movement, and strategy in real-time",
                icon: "🎥"
              },
              {
                title: "Player Management",
                description: "Comprehensive player profiles with detailed statistics and performance metrics",
                icon: "👤"
              },
              {
                title: "Real-time Insights",
                description: "Get instant insights and recommendations to improve team performance",
                icon: "📊"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-[#1a1a1a] p-8 rounded-lg hover:bg-[#2a2a2a] transition-colors animate-fade-in">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-rosegold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-polysans">
                About <span className="text-rosegold">Sports Reels</span>
              </h2>
              <p className="text-lg text-gray-400 mb-6">
                We're revolutionizing the sports industry with cutting-edge technology that provides 
                unprecedented insights into player performance, team dynamics, and game strategies.
              </p>
              <div className="space-y-4">
                {[
                  "Advanced AI-powered video analysis",
                  "Comprehensive player database",
                  "Real-time performance tracking",
                  "Professional scouting tools"
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-rosegold mr-3" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/lovable-uploads/Untitled design (49).png"
                alt="Sports Analysis"
                className="rounded-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-polysans">
              Our <span className="text-rosegold">Services</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive solutions for teams, scouts, and sports organizations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Team Management",
                description: "Complete team management platform with player tracking and performance analytics",
                price: "From $99/month"
              },
              {
                title: "Scout Network",
                description: "Connect with professional scouts and access exclusive player insights",
                price: "From $149/month"
              },
              {
                title: "Video Analysis",
                description: "AI-powered video analysis with detailed breakdowns and recommendations",
                price: "From $199/month"
              }
            ].map((service, index) => (
              <div key={index} className="bg-[#1a1a1a] p-8 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                <h3 className="text-xl font-bold mb-4 text-rosegold">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                <div className="text-2xl font-bold text-white mb-4">{service.price}</div>
                <Button className="w-full bg-rosegold hover:bg-rosegold/80 text-white">
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-polysans">
              What Our <span className="text-rosegold">Clients Say</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "John Smith",
                role: "Head Coach, FC Barcelona",
                content: "Sports Reels has completely transformed how we analyze our games. The AI insights are incredible.",
                rating: 5
              },
              {
                name: "Maria Rodriguez",
                role: "Scout, Real Madrid",
                content: "The player analysis tools are unmatched. We've discovered amazing talents using this platform.",
                rating: 5
              },
              {
                name: "David Wilson",
                role: "Team Manager, Liverpool FC",
                content: "The video analysis feature has given us a competitive edge. Absolutely revolutionary.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-[#1a1a1a] p-8 rounded-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-rosegold fill-current" />
                  ))}
                </div>
                <p className="text-gray-400 mb-6">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-polysans">
            Ready to Get <span className="text-rosegold">Started?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of teams and scouts already using Sports Reels to elevate their game
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="bg-rosegold hover:bg-rosegold/80 text-white px-12 py-4 text-lg"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                  alt="Sports Reels"
                  className="w-8 h-8"
                />
                <span className="ml-3 text-xl font-bold text-rosegold font-polysans">Sports Reels</span>
              </div>
              <p className="text-gray-400 mb-4">
                The ultimate sports data platform for teams and agents. Streamline player management, 
                transfers, and scouting with AI-powered insights.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-rosegold">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-rosegold">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-rosegold">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-rosegold">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-rosegold">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-rosegold">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2024 Sports Reels. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
