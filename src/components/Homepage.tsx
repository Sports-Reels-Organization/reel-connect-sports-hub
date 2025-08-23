
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Users, Shield, Search, BarChart3, Star, Calendar, MapPin, Phone, Mail } from 'lucide-react';

const Homepage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoUrls = [
    "/sportsreelsvideos/101290-video-720.mp4",
    "/sportsreelsvideos/mixkit-baseball-player-pitching-the-ball-856-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-man-swimming-in-a-pool-3168-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-tennis-players-at-an-outdoor-court-869-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-two-men-on-a-ring-fighting-in-a-boxing-match-40974-hd-ready.mp4",
    "/sportsreelsvideos/mixkit-young-woman-getting-into-position-for-sprinting-32800-hd-ready.mp4",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [videoUrls.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }
  }, [currentVideoIndex]);

  const handleGetStarted = () => {
    // Navigate to login/signup page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white font-montserrat">
      {/* Navigation */}
      <nav className="relative z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
                alt="Sports Reels"
                className="w-12 h-12"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">Sports Reels</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-gray-900 font-medium">Home</a>
              <a href="#transfer-timeline" className="text-gray-700 hover:text-gray-900 font-medium">Transfer Timeline</a>
              <a href="#explore" className="text-gray-700 hover:text-gray-900 font-medium">Explore</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleGetStarted}
                className="text-gray-700 hover:text-gray-900"
              >
                Login
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Social Media Sidebar - Left */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col space-y-4">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        </a>
      </div>

      {/* Animated Slogan - Right */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 rotate-90 z-40 hidden lg:block">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Where Data Lives</span>
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          key={currentVideoIndex}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoUrls[currentVideoIndex]} type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Where Sports<br />Data Lives
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Streamline player transfers, scouting, and team management with comprehensive data analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Start Your Team Profile
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleGetStarted}
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg"
            >
              Join as Scout/Agent
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-80">Trusted by 500+ Teams Globally</p>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Our<br />Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Football', image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop' },
              { name: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498227?w=400&h=300&fit=crop' },
              { name: 'Tennis', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop' },
              { name: 'Swimming', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop' },
              { name: 'Volleyball', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop' },
              { name: 'Fitness', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' }
            ].map((category, index) => (
              <div
                key={category.name}
                className={`relative group cursor-pointer h-64 rounded-lg overflow-hidden ${
                  index % 2 === 0 ? 'lg:mt-12' : ''
                }`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h4 className="text-white text-2xl font-bold">{category.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Discover Our World-Class Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                number: '01',
                title: 'Comprehensive Player Profiles',
                icon: <Users className="w-12 h-12 text-blue-600" />,
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
              },
              {
                number: '02',
                title: 'Secure Transfer System',
                icon: <Shield className="w-12 h-12 text-blue-600" />,
                image: 'https://images.unsplash.com/photo-1546519638-68e109498227?w=400&h=300&fit=crop'
              },
              {
                number: '03',
                title: 'Youth Scouting Network',
                icon: <Search className="w-12 h-12 text-blue-600" />,
                image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop'
              },
              {
                number: '04',
                title: 'Data-Driven Analytics',
                icon: <BarChart3 className="w-12 h-12 text-blue-600" />,
                image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop'
              },
              {
                number: '05',
                title: 'AI-Powered Insights',
                icon: <Play className="w-12 h-12 text-blue-600" />,
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
              }
            ].map((feature) => (
              <div key={feature.number} className="group">
                <div className="text-6xl font-bold text-gray-200 mb-4">{feature.number}</div>
                <h4 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h4>
                <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    {feature.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Create & Complete Profiles',
                description: 'Teams add player data, agents set up credentials'
              },
              {
                step: '2',
                title: 'Discover & Connect',
                description: 'Browse transfer timeline, use explore feature'
              },
              {
                step: '3',
                title: 'Transfer & Succeed',
                description: 'Generate contracts, complete transfers'
              }
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Meet the<br />Experts
          </h2>
          
          <div className="flex overflow-x-auto space-x-8 pb-4">
            {[
              { name: 'Mark Johnson', role: 'Football Coach', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
              { name: 'James Parker', role: 'Tennis Instructor', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop' },
              { name: 'Emily Collins', role: 'Volleyball Coach', image: 'https://images.unsplash.com/photo-1494790108755-2616b332c11c?w=300&h=400&fit=crop' },
              { name: 'Sophia Martinez', role: 'Swim Instructor', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop' },
              { name: 'Ryan Johnson', role: 'Fitness Trainer', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop' },
              { name: 'Chris Thompson', role: 'Basketball Coach', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' }
            ].map((expert) => (
              <div key={expert.name} className="flex-shrink-0 w-64 text-center">
                <div className="relative h-80 rounded-lg overflow-hidden mb-4">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{expert.name}</h3>
                <p className="text-gray-600">{expert.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1200&h=800&fit=crop"
            alt="Sports background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-yellow-400">Special</span><br />Offer
              </h2>
              
              <div className="space-y-4 mb-8">
                {[
                  'Discounted Monthly Dues',
                  'Complimentary Personal Training Session',
                  'Free Guest Passes',
                  'Exclusive Access to Member Events',
                  'Waived Initiation Fee'
                ].map((feature) => (
                  <div key={feature} className="flex items-center">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mb-8">
                <div className="text-5xl font-bold">$199</div>
                <div className="text-lg opacity-80">For yearly subscription only</div>
              </div>
            </div>
            
            <div className="lg:w-1/3 text-center lg:text-right">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg mb-6"
              >
                Become a Member
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm opacity-80">
                * This offer is available until 30/08/2024, Offer valid for new members only. Terms and conditions apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Hear It Straight from<br />Our Community
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Mark M.',
                role: 'Team Manager',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
                quote: "Sports Reels transformed how we manage player transfers. The platform's analytics give us insights we never had before."
              },
              {
                name: 'Sarah M.',
                role: 'Scout',
                image: 'https://images.unsplash.com/photo-1494790108755-2616b332c11c?w=150&h=150&fit=crop',
                quote: "Found amazing talent in emerging markets through their scouting network. The search filters are incredibly precise."
              },
              {
                name: 'Veronica A.',
                role: 'Agent',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
                quote: "The contract generation feature saved us weeks of paperwork. Everything is streamlined and professional."
              },
              {
                name: 'Jessie B.',
                role: 'Player',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
                quote: "My transfer was seamless through their platform. The video showcase really helped scouts see my potential."
              }
            ].map((testimonial) => (
              <div key={testimonial.name} className="relative bg-gray-50 p-6 rounded-lg">
                <div className="absolute -top-4 -left-4 text-6xl text-blue-200">"</div>
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">{testimonial.quote}</p>
                <div className="absolute -bottom-4 -right-4 text-6xl text-blue-200 rotate-180">"</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Choose Your Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Basic',
                price: '$49',
                period: 'per month',
                features: [
                  'Domestic transfers only',
                  'Limited video uploads (5 per month)',
                  'Basic analytics',
                  'Email support'
                ]
              },
              {
                name: 'Professional',
                price: '$99',
                period: 'per month',
                popular: true,
                features: [
                  'Regional transfers',
                  'Advanced video features (20 per month)',
                  'Enhanced analytics',
                  'Priority support',
                  'Contract generation'
                ]
              },
              {
                name: 'International',
                price: '$199',
                period: 'per month',
                features: [
                  'Global transfers',
                  'Unlimited video uploads',
                  'AI-powered insights',
                  '24/7 phone support',
                  'Advanced contract features',
                  'Custom branding'
                ]
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-lg shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{plan.price}</div>
                  <div className="text-gray-600">{plan.period}</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-0">
              Join<br />the Fun :)
            </h2>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleGetStarted}
            >
              Explore All Events
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Soccer Skills Workshop',
                description: 'Learn essential soccer skills and tactics from experienced coaches.',
                date: '24 Apr',
                time: '9:40 pm',
                image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop'
              },
              {
                title: 'Tennis Clinic with Pro Coaches',
                description: 'Elevate your tennis skills with personalized instruction from pro coaches.',
                date: '19 Apr',
                time: '11:50 pm',
                image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop'
              },
              {
                title: 'Basketball Shootout Tournament',
                description: 'Join our basketball shootout tournament for thrilling games and friendly competition.',
                date: '16 Apr',
                time: '9:21 pm',
                image: 'https://images.unsplash.com/photo-1546519638-68e109498227?w=400&h=300&fit=crop'
              }
            ].map((event) => (
              <div key={event.title} className="relative group cursor-pointer">
                <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300" />
                </div>
                
                <div className="p-6">
                  <h5 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h5>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {event.time}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Event
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Have a Question?</h2>
              <p className="text-xl text-gray-300">
                Have a question about our platform, features, or membership options? We're here to help! 
                Contact our friendly team today, and we'll be happy to assist you.
              </p>
            </div>
            <div className="lg:w-1/3 text-center lg:text-right">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Contact Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between">
            <div className="lg:w-1/3 mb-8 lg:mb-0">
              <div className="flex items-center mb-4">
                <img
                  src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
                  alt="Sports Reels"
                  className="w-12 h-12"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">Sports Reels</span>
              </div>
              <p className="text-gray-600 mb-6">Where Sports Data Lives</p>
              
              <div className="flex space-x-4 mb-6">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="lg:w-2/3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Platform</h4>
                  <ul className="space-y-2">
                    <li><a href="#about" className="text-gray-600 hover:text-gray-900">About us</a></li>
                    <li><a href="#pricing" className="text-gray-600 hover:text-gray-900">Plans</a></li>
                    <li><a href="#categories" className="text-gray-600 hover:text-gray-900">Categories</a></li>
                    <li><a href="#contact" className="text-gray-600 hover:text-gray-900">Contact Us</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Features</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Player Profiles</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Transfer System</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Analytics</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Scouting Network</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Support</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Help Center</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">API Docs</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Contact</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      hello@sportsreels.com
                    </li>
                    <li className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      +1 (555) 123-4567
                    </li>
                    <li className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      San Francisco, CA
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-center md:text-left">
                © 2024 Sports Reels. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0">
                <p className="text-gray-600 text-center">Where Sports Data Lives</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
