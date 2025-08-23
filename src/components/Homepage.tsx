
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Star, ArrowRight, Menu, X, Users, Shield, Search, BarChart3, Trophy, Target, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                alt="Sports Reels"
                className="w-10 h-10"
              />
              <div className="ml-3">
                <span className="text-xl font-bold text-blue-600">Sports Reels</span>
                <p className="text-xs text-gray-500">Where Data Lives</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</button>
                <button onClick={() => scrollToSection('transfer-timeline')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Transfer Timeline</button>
                <button onClick={() => scrollToSection('explore')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Explore</button>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</button>
                <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</button>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/auth'}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Login
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Up as Team
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Sign Up as Agent
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">Home</button>
              <button onClick={() => scrollToSection('transfer-timeline')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">Transfer Timeline</button>
              <button onClick={() => scrollToSection('explore')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">Explore</button>
              <button onClick={() => scrollToSection('pricing')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">About</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-gray-700 hover:text-blue-600">Contact</button>
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/auth'}
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign Up as Team
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Sign Up as Agent
                </Button>
              </div>
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
        <div className="absolute inset-0 bg-blue-900/70"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Where Sports
            <span className="text-orange-400 block">Data Lives</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Streamline player transfers, scouting, and team management with comprehensive data analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Start Your Team Profile
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
            >
              Join as Scout/Agent
            </Button>
          </div>
          <p className="text-blue-200 text-lg">
            ✨ Trusted by <span className="font-bold text-orange-400">500+</span> Teams Globally
          </p>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
                The Sports Transfer <span className="text-blue-600">Challenge</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: "📊", title: "Scattered player data", desc: "Information spread across multiple platforms" },
                  { icon: "👁️", title: "Limited market visibility", desc: "Hidden talent in emerging markets" },
                  { icon: "🔄", title: "Complex transfer processes", desc: "Lengthy and inefficient procedures" },
                  { icon: "🔍", title: "Missed scouting opportunities", desc: "Lack of comprehensive scouting networks" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/lovable-uploads/Untitled design (49).png"
                alt="Sports Data Complexity"
                className="rounded-lg w-full h-auto shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Our <span className="text-blue-600">Solution</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive platform connecting teams, agents, and players worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-12 w-12 text-blue-600" />,
                title: "Comprehensive Player Profiles",
                description: "Complete player data aggregation with performance metrics and transfer history"
              },
              {
                icon: <Shield className="h-12 w-12 text-green-600" />,
                title: "Secure Transfer System",
                description: "Streamlined and secure transfer processes with built-in contract generation"
              },
              {
                icon: <Search className="h-12 w-12 text-orange-600" />,
                title: "Youth Scouting Network",
                description: "Discover local talent through our extensive global scouting network"
              },
              {
                icon: <BarChart3 className="h-12 w-12 text-purple-600" />,
                title: "Data-Driven Analytics",
                description: "AI and ML powered insights for informed decision making"
              }
            ].map((solution, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">{solution.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{solution.title}</h3>
                <p className="text-gray-600">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              How It <span className="text-blue-600">Works</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create & Complete Profiles",
                description: "Teams add comprehensive player data while agents set up their professional credentials",
                icon: <Trophy className="h-16 w-16 text-blue-600" />
              },
              {
                step: "02",
                title: "Discover & Connect",
                description: "Browse the transfer timeline and use our explore feature to find perfect matches",
                icon: <Target className="h-16 w-16 text-orange-600" />
              },
              {
                step: "03",
                title: "Transfer & Succeed",
                description: "Generate contracts and complete seamless transfers with our integrated system",
                icon: <TrendingUp className="h-16 w-16 text-green-600" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-6">{step.icon}</div>
                <div className="text-4xl font-bold text-gray-300 mb-4">{step.step}</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              What Our <span className="text-blue-600">Clients Say</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Marcus Johnson",
                role: "Team Manager, Manchester United",
                content: "Sports Reels transformed how we manage player transfers. The comprehensive data analytics helped us make better decisions.",
                rating: 5,
                avatar: "👨‍💼"
              },
              {
                name: "Elena Rodriguez",
                role: "Scout, Real Madrid",
                content: "Found amazing talent in emerging markets through their platform. The scouting network is unmatched in the industry.",
                rating: 5,
                avatar: "👩‍💼"
              },
              {
                name: "James Wilson",
                role: "Professional Player",
                content: "My transfer was seamless through their platform. The entire process was transparent and efficient.",
                rating: 5,
                avatar: "⚽"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-blue-400">Plan</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Flexible pricing for teams and agents of all sizes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic",
                price: "$99",
                period: "/month",
                description: "Perfect for local teams",
                features: [
                  "Domestic transfers only",
                  "Up to 25 players",
                  "5 video uploads per month",
                  "Basic analytics",
                  "Email support"
                ],
                color: "border-gray-600"
              },
              {
                name: "Professional",
                price: "$199",
                period: "/month",
                description: "Great for growing teams",
                features: [
                  "Regional transfers",
                  "Up to 100 players",
                  "50 video uploads per month",
                  "Advanced analytics",
                  "Priority support",
                  "Contract generation"
                ],
                color: "border-blue-500",
                popular: true
              },
              {
                name: "International",
                price: "$399",
                period: "/month",
                description: "For global organizations",
                features: [
                  "Global transfers",
                  "Unlimited players",
                  "Unlimited video uploads",
                  "AI-powered insights",
                  "24/7 dedicated support",
                  "Custom integrations",
                  "FIFA Connect API"
                ],
                color: "border-orange-500"
              }
            ].map((plan, index) => (
              <div key={index} className={`bg-gray-800 p-8 rounded-lg border-2 ${plan.color} relative ${plan.popular ? 'transform scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold mb-2">
                    {plan.price}<span className="text-lg text-gray-400">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your <span className="text-orange-400">Sports Business?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams and agents already using Sports Reels to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-4 text-lg font-bold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-12 py-4 text-lg font-bold"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <img
                  src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                  alt="Sports Reels"
                  className="w-10 h-10"
                />
                <div className="ml-3">
                  <span className="text-xl font-bold text-blue-400">Sports Reels</span>
                  <p className="text-xs text-gray-400">Where Data Lives</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The ultimate sports data platform for teams and agents. Streamline player management, 
                transfers, and scouting with comprehensive data analytics and AI-powered insights.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white hover:border-white">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white hover:border-white">
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white hover:border-white">
                  LinkedIn
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-6">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-6">Company</h3>
              <ul className="space-y-3">
                <li><a href="#about" className="text-gray-400 hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2024 Sports Reels. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Status</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Help Center</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
