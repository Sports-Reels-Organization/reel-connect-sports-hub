
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Menu, X } from 'lucide-react';

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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-montserrat">
      {/* Navigation */}
      <nav className="navbar fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md">
        <div className="container nav-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="nav-wrapper flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="brand flex items-center">
              <img
                src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                alt="Sports Reels"
                className="logo w-12 h-12"
              />
            </a>
            
            {/* Desktop Navigation */}
            <nav className="nav-list-wrapper hidden md:flex">
              <div className="flex items-center space-x-8">
                <button onClick={() => scrollToSection('home')} className="nav-link-wrapper group flex items-center space-x-2 text-white hover:text-orange-500 transition-colors">
                  <span className="nav-link">Home</span>
                  <ArrowUpRight className="link-icon w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => scrollToSection('plans')} className="nav-link-wrapper group flex items-center space-x-2 text-white hover:text-orange-500 transition-colors">
                  <span className="nav-link">Plans</span>
                  <ArrowUpRight className="link-icon w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => scrollToSection('categories')} className="nav-link-wrapper group flex items-center space-x-2 text-white hover:text-orange-500 transition-colors">
                  <span className="nav-link">Categories</span>
                  <ArrowUpRight className="link-icon w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => scrollToSection('about')} className="nav-link-wrapper group flex items-center space-x-2 text-white hover:text-orange-500 transition-colors">
                  <span className="nav-link">About</span>
                  <ArrowUpRight className="link-icon w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => scrollToSection('contact')} className="nav-link-wrapper group flex items-center space-x-2 text-white hover:text-orange-500 transition-colors">
                  <span className="nav-link">Contact</span>
                  <ArrowUpRight className="link-icon w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="menu-button text-white hover:text-orange-500"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : (
                  <div className="nav-icon">
                    <div className="line w-6 h-0.5 bg-white mb-1"></div>
                    <div className="line midline w-6 h-0.5 bg-white mb-1"></div>
                    <div className="line w-6 h-0.5 bg-white"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-white hover:text-orange-500">Home</button>
              <button onClick={() => scrollToSection('plans')} className="block px-3 py-2 text-white hover:text-orange-500">Plans</button>
              <button onClick={() => scrollToSection('categories')} className="block px-3 py-2 text-white hover:text-orange-500">Categories</button>
              <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-white hover:text-orange-500">About</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-white hover:text-orange-500">Contact</button>
            </div>
          </div>
        )}
      </nav>

      {/* Social Media Sidebar - Left */}
      <div className="social-media-flex fixed left-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col space-y-4">
        <a href="https://instagram.com" target="_blank" className="text-white hover:text-orange-500 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a href="https://facebook.com" target="_blank" className="text-white hover:text-orange-500 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://tiktok.com" target="_blank" className="text-white hover:text-orange-500 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        </a>
      </div>

      {/* Social Media Sidebar - Right */}
      <div className="animated-slogan fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col items-center">
        <div className="text-white text-sm font-bold transform -rotate-90 whitespace-nowrap">
          Where Sports Shape Lives
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="relative h-screen overflow-hidden">
        {/* Background Video */}
        <div className="hero-video absolute inset-0 w-full h-full">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/lovable-uploads/Untitled design (49).png"
          >
            <source src="/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4" type="video/mp4" />
            <source src="/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Hero Content */}
        <div className="container relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="white text-6xl md:text-8xl font-bold text-white leading-tight">
            Where Sports <br/>
            Shape Lives
          </h1>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="categories py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl md:text-8xl font-bold mb-16 text-gray-900 leading-tight">
            Our <br/>
            Categories
          </h2>
          <div className="categories-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="/football" className="category-item football group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Football</h4>
            </a>
            <a href="/basketball" className="category-item basketball group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (48).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Basketball</h4>
            </a>
            <a href="/tennis" className="category-item tennis group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Tennis</h4>
            </a>
            <a href="/swimming" className="category-item swim group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (48).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Swimming</h4>
            </a>
            <a href="/volleyball" className="category-item volley group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Volleyball</h4>
            </a>
            <a href="/fitness" className="category-item fitness group relative h-80 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (48).png')"}}>
              <div className="category-overlay absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>
              <h4 className="category-title absolute bottom-6 left-6 text-2xl font-bold text-white">Fitness</h4>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-20 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="featured-title text-6xl md:text-8xl font-bold mb-16 text-gray-900 leading-tight">
            Discover Our World-Class Facilities
          </h2>
          <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="featured-item relative group">
              <div className="feature-order text-8xl font-bold text-gray-200 mb-4">01</div>
              <div className="feature-item-title text-2xl font-bold mb-6 text-gray-900">
                Flexible Membership Options
              </div>
              <div className="feature-img-wrapper h-64 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
                <div className="img-mask absolute inset-0 bg-black/20"></div>
              </div>
            </div>
            <div className="featured-item relative group">
              <div className="feature-order text-8xl font-bold text-gray-200 mb-4">02</div>
              <div className="feature-item-title text-2xl font-bold mb-6 text-gray-900">
                Daily Group Exercise Classes
              </div>
              <div className="feature-img-wrapper h-64 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (48).png')"}}>
                <div className="img-mask absolute inset-0 bg-black/20"></div>
              </div>
            </div>
            <div className="featured-item relative group">
              <div className="feature-order text-8xl font-bold text-gray-200 mb-4">03</div>
              <div className="feature-item-title text-2xl font-bold mb-6 text-gray-900">
                Flexible Outdoor Recreation Areas
              </div>
              <div className="feature-img-wrapper h-64 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
                <div className="img-mask absolute inset-0 bg-black/20"></div>
              </div>
            </div>
            <div className="featured-item relative group">
              <div className="feature-order text-8xl font-bold text-gray-200 mb-4">04</div>
              <div className="feature-item-title text-2xl font-bold mb-6 text-gray-900">
                Personal Training Services
              </div>
              <div className="feature-img-wrapper h-64 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (48).png')"}}>
                <div className="img-mask absolute inset-0 bg-black/20"></div>
              </div>
            </div>
            <div className="featured-item relative group">
              <div className="feature-order text-8xl font-bold text-gray-200 mb-4">05</div>
              <div className="feature-item-title text-2xl font-bold mb-6 text-gray-900">
                Sports Therapy and Recovery
              </div>
              <div className="feature-img-wrapper h-64 rounded-lg overflow-hidden bg-cover bg-center" style={{backgroundImage: "url('/lovable-uploads/Untitled design (49).png')"}}>
                <div className="img-mask absolute inset-0 bg-black/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="experts py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="featured-title text-6xl md:text-8xl font-bold mb-16 text-gray-900 leading-tight">
            Meet the<br/>
            Experts
          </h2>
          <div className="experts-flex flex flex-wrap gap-8 justify-center">
            {[
              { name: "Mark Johnson", title: "Football Coach", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" },
              { name: "James Parker", title: "Tennis Instructor", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" },
              { name: "Emily Collins", title: "Volleyball Coach", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" },
              { name: "Sophia Martinez", title: "Swim Instructor", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" },
              { name: "Ryan Johnson", title: "Fitness Trainer", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" },
              { name: "Chris Thompson", title: "Basketball Coach", image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" }
            ].map((expert, index) => (
              <div key={index} className="expert-item flex flex-col items-center text-center">
                <div className="mb-4">
                  <div className="expert-position text-xl font-bold text-gray-900">{expert.name}</div>
                  <div className="expert-title text-gray-600">{expert.title}</div>
                </div>
                <img src={expert.image} alt={expert.name} className="expert-img w-32 h-32 rounded-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <div className="offer-box relative py-20 bg-black text-white overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="offer-info flex-1 mb-12 lg:mb-0">
              <h2 className="offer-title text-6xl md:text-8xl font-bold mb-8 leading-tight">
                <span className="text-span">Special<br/></span>
                Offer
              </h2>
              <div className="offer-features-wrapper space-y-4 mb-8">
                {[
                  "Discounted Monthly Dues",
                  "Complimentary Personal Training Session",
                  "Free Guest Passes",
                  "Exclusive Access to Member Events",
                  "Waived Initiation Fee"
                ].map((feature, index) => (
                  <div key={index} className="offer-feature-item flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div className="white text-lg">{feature}</div>
                  </div>
                ))}
              </div>
              <div className="mb-8">
                <div className="price text-6xl font-bold text-orange-500">199$</div>
                <div className="price-note text-gray-400">For yearly subscription only</div>
              </div>
            </div>
            <div className="offer-info-2 flex flex-col items-center lg:items-start">
              <a href="#plans" className="button group flex items-center space-x-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg transition-colors mb-6">
                <div className="button-icon-box">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="button-text font-semibold">Become a member</div>
              </a>
              <p className="offer-note text-sm text-gray-400 text-center lg:text-left max-w-md">
                * This offer is available until 30/08/2024, Offer valid for new members only. Terms and conditions apply.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="testimonials py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl md:text-8xl font-bold mb-16 text-gray-900 leading-tight">
            Hear It Straight from<br/> Our Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                author: "Mark M.",
                title: "Fitness Enthusiast",
                desc: "I've been a member of several gyms and sports clubs in the past, but Sports Reels is in a league of its own. The variety of facilities and activities available is incredible, and the sense of community among members is truly special. I'm proud to be a part of the Sports Reels family!",
                image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
              },
              {
                author: "Sarah M.",
                title: "Tennis Enthusiast",
                desc: "I've been a member of Sports Reels for over a year now, and I can't imagine my tennis journey without it. The facilities are top-notch, and the variety of classes keeps me motivated.",
                image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
              },
              {
                author: "Veronica A.",
                title: "Fitness Enthusiast",
                desc: "Sports Reels has completely transformed my fitness routine. The facilities are top-notch, the trainers are knowledgeable and supportive, and the community atmosphere is unmatched. I've achieved more than I ever thought possible since joining!",
                image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
              },
              {
                author: "Jessie B.",
                title: "Basketball Enthusiast",
                desc: "Sports Reels isn't just about fitness; it's about fun and camaraderie. Whether I'm competing in a volleyball tournament, joining a group fitness class, or simply hanging out by the pool, I always leave Sports Reels with a smile on my face. It's the highlight of my day!",
                image: "/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-item relative p-8 rounded-lg bg-gray-50">
                <div className="testimonial-info">
                  <div className="testi-author text-xl font-bold mb-2">{testimonial.author}</div>
                  <div className="testi-title text-gray-600 mb-6">{testimonial.title}</div>
                  <div className="quote-1 text-4xl text-orange-500 mb-4">"</div>
                  <p className="testi-desc text-gray-700 mb-6">{testimonial.desc}</p>
                </div>
                <img src={testimonial.image} alt={testimonial.author} className="testimonial-img w-16 h-16 rounded-full object-cover" />
                <div className="quote-2 absolute bottom-4 right-4 text-4xl text-orange-500">"</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="events py-20 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="events-heading-wrapper flex justify-between items-end mb-16">
            <h2 className="text-6xl md:text-8xl font-bold text-gray-900 leading-tight">
              Join <br/>
              the Fun :)
            </h2>
            <a href="https://www.meetup.com/" target="_blank" className="button group flex items-center space-x-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-lg transition-colors">
              <div className="button-icon-box">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="button-text font-semibold">Explore all</div>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Soccer Skills Workshop",
                desc: "Learn essential soccer skills and tactics from experienced coaches.",
                date: "24 Apr",
                time: "9:40 pm",
                image: "/lovable-uploads/Untitled design (49).png"
              },
              {
                title: "Tennis Clinic with Pro Coaches",
                desc: "Elevate your tennis skills with personalized instruction from pro coaches.",
                date: "19 Apr",
                time: "11:50 pm",
                image: "/lovable-uploads/Untitled design (48).png"
              },
              {
                title: "Basketball Shootout Tour",
                desc: "Join our basketball shootout tournament for thrilling games and friendly competition.",
                date: "16 Apr",
                time: "9:21 pm",
                image: "/lovable-uploads/Untitled design (49).png"
              }
            ].map((event, index) => (
              <div key={index} className="event-item relative h-96 rounded-lg overflow-hidden bg-cover bg-center group" style={{backgroundImage: `url('${event.image}')`}}>
                <div className="overlay absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-all duration-300"></div>
                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <h5 className="event-title text-2xl font-bold text-white mb-3">{event.title}</h5>
                  <p className="event-desc text-gray-200 mb-6">{event.desc}</p>
                  <div className="event-footer flex justify-between items-center">
                    <div className="dt-wrapper">
                      <div className="date text-white font-bold">{event.date}</div>
                      <div className="date text-gray-300">{event.time}</div>
                    </div>
                    <a href="https://www.meetup.com/" target="_blank" className="button group flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                      <div className="button-icon-box">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div className="button-text text-sm font-semibold">View Event</div>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section id="contact" className="contact-cta py-20 bg-gray-900 text-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-wrapper text-center max-w-4xl mx-auto">
            <h2 className="cta-title text-6xl md:text-8xl font-bold mb-8 leading-tight">
              Have a Question?
            </h2>
            <p className="white text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Have a question about our facilities, programs, or membership options? We're here to help! Contact our friendly team today, and we'll be happy to assist you.
            </p>
            <a href="/contact" className="button group inline-flex items-center space-x-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg transition-colors">
              <div className="button-icon-box">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="button-text font-semibold">Contact Us</div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="footer bg-black text-white py-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="footer-info">
            <img src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" alt="Sports Reels" className="footer-logo w-16 h-16 mb-6" />
            <div className="footer-slogan text-2xl font-bold mb-12">Where Sports Shape Lives</div>
            <div className="footer-links flex flex-col md:flex-row justify-between">
              <div className="footer-links-wrapper flex flex-col space-y-4 mb-8 md:mb-0">
                <a href="/about" className="footer-link text-gray-400 hover:text-white transition-colors">About us</a>
                <a href="/plans" className="footer-link text-gray-400 hover:text-white transition-colors">Plans</a>
                <a href="/categories" className="footer-link text-gray-400 hover:text-white transition-colors">Categories</a>
                <a href="/contact" className="footer-link text-gray-400 hover:text-white transition-colors">Contact Us</a>
              </div>
              <div className="footer-links-wrapper flex flex-col space-y-4 mb-8 md:mb-0">
                <a href="/style-guide" className="footer-link text-gray-400 hover:text-white transition-colors">Style Guide</a>
                <a href="/licenses" className="footer-link text-gray-400 hover:text-white transition-colors">Licenses</a>
                <a href="/changelog" className="footer-link text-gray-400 hover:text-white transition-colors">Changelog</a>
                <a href="https://webflow.com/templates/designers/khaled-kazzaz" target="_blank" className="footer-link flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <span>Buy this template</span>
                </a>
              </div>
            </div>
            <div className="social-media-mobile flex justify-center space-x-6 my-12 md:hidden">
              <a href="https://instagram.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
            <div className="copy-right text-center text-gray-400 text-sm pt-8 border-t border-gray-800">
              © This is a Sports Reels Template powered by React
            </div>
          </div>
          <div className="social-media-flex hidden md:flex fixed right-6 bottom-6 flex-col space-y-4">
            <a href="https://instagram.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
          <div className="animated-slogan footer-slogan absolute bottom-6 right-1/2 transform translate-x-1/2 hidden lg:block">
            <div className="text-gray-400 text-sm">Where Sports Shape Lives</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
