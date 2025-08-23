import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/?auth=true');
  };

  const handleSignUp = () => {
    navigate('/?auth=true');
  };

  return (
    <div className="min-h-screen bg-white font-montserrat">
      {/* Navigation */}
      <nav className="relative bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                alt="Sports Reels Logo"
                className="w-10 h-10"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                Home
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#" className="text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                Plans
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#categories" className="text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                Categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#" className="text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                About
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#" className="text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                Contact
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="text-gray-900 hover:text-blue-600 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Video */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/lovable-uploads/Untitled design (49).png"
        >
          <source src="/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Where Sports<br />Shape Lives
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleLogin}
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={handleSignUp}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* Social Media Sidebar - Left */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col space-y-4">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        </a>
      </div>

      {/* Animated Slogan - Right */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 rotate-90 z-40 hidden lg:block">
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="text-sm font-medium whitespace-nowrap">Where Sports Shape Lives</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
            Our<br />Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Football */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-green-600 to-green-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Football</h4>
              </div>
            </div>

            {/* Basketball */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-orange-600 to-orange-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Basketball</h4>
              </div>
            </div>

            {/* Tennis */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Tennis</h4>
              </div>
            </div>

            {/* Swimming */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Swimming</h4>
              </div>
            </div>

            {/* Volleyball */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Volleyball</h4>
              </div>
            </div>

            {/* Fitness */}
            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-red-600 to-red-800 aspect-square">
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-2xl font-bold">Fitness</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
            Discover Our World-Class Facilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { order: "01", title: "Flexible Membership Options", bg: "bg-blue-100" },
              { order: "02", title: "Daily Group Exercise Classes", bg: "bg-green-100" },
              { order: "03", title: "Flexible Outdoor Recreation Areas", bg: "bg-yellow-100" },
              { order: "04", title: "Personal Training Services", bg: "bg-purple-100" },
              { order: "05", title: "Sports Therapy and Recovery", bg: "bg-red-100" }
            ].map((feature, index) => (
              <div key={index} className={`p-8 rounded-lg ${feature.bg} relative overflow-hidden`}>
                <div className="text-6xl font-bold text-gray-200 absolute top-4 right-4 opacity-50">
                  {feature.order}
                </div>
                <h3 className="text-xl font-bold text-gray-900 relative z-10">
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
            Meet the<br />Experts
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Mark Johnson", title: "Football Coach", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" },
              { name: "James Parker", title: "Tennis Instructor", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" },
              { name: "Emily Collins", title: "Volleyball Coach", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" },
              { name: "Sophia Martinez", title: "Swim Instructor", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" },
              { name: "Ryan Johnson", title: "Fitness Trainer", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" },
              { name: "Chris Thompson", title: "Basketball Coach", image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" }
            ].map((expert, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{expert.name}</h4>
                  <p className="text-gray-600">{expert.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="text-yellow-400">Special</span><br />Offer
            </h2>
            
            <div className="space-y-4 mb-8">
              {[
                "Discounted Monthly Dues",
                "Complimentary Personal Training Session",
                "Free Guest Passes",
                "Exclusive Access to Member Events",
                "Waived Initiation Fee"
              ].map((feature, index) => (
                <div key={index} className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-yellow-400 mb-2">$199</div>
              <div className="text-gray-400">For yearly subscription only</div>
            </div>
            
            <button 
              onClick={handleSignUp}
              className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors inline-flex items-center space-x-2"
            >
              <span>Become a member</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </button>
            
            <p className="text-sm text-gray-400 mt-4">
              * This offer is available until 30/08/2024, Offer valid for new members only. Terms and conditions apply.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
            Hear It Straight from<br />Our Community
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Mark M.",
                title: "Fitness Enthusiast",
                text: "I've been a member of several gyms and sports clubs in the past, but Sportopia is in a league of its own. The variety of facilities and activities available is incredible, and the sense of community among members is truly special. I'm proud to be a part of the Sportopia family!",
                image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
              },
              {
                name: "Sarah M.",
                title: "Tennis Enthusiast",
                text: "I've been a member of Sportopia for over a year now, and I can't imagine my tennis journey without it. The facilities are top-notch, and the variety of classes keeps me motivated.",
                image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
              },
              {
                name: "Veronica A.",
                title: "Fitness Enthusiast",
                text: "Sportopia has completely transformed my fitness routine. The facilities are top-notch, the trainers are knowledgeable and supportive, and the community atmosphere is unmatched. I've achieved more than I ever thought possible since joining!",
                image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
              },
              {
                name: "Jessie B.",
                title: "Basketball Enthusiast",
                text: "Sportopia isn't just about fitness; it's about fun and camaraderie. Whether I'm competing in a volleyball tournament, joining a group fitness class, or simply hanging out by the pool, I always leave Sportopia with a smile on my face. It's the highlight of my day!",
                image: "/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-0">
              Join<br />the Fun :)
            </h2>
            <a href="#" className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center space-x-2">
              <span>Explore all</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Soccer Skills Workshop",
                description: "Learn essential soccer skills and tactics from experienced coaches.",
                date: "24 Apr",
                time: "9:40 pm",
                image: "/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4"
              },
              {
                title: "Tennis Clinic with Pro Coaches",
                description: "Elevate your tennis skills with personalized instruction from pro coaches.",
                date: "19 Apr",
                time: "11:50 pm",
                image: "/sportsreelsvideos/mixkit-tennis-players-at-an-outdoor-court-869-hd-ready.mp4"
              },
              {
                title: "Basketball Shootout Tour",
                description: "Join our basketball shootout tournament for thrilling games and friendly competition.",
                date: "16 Apr",
                time: "9:21 pm",
                image: "/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4"
              }
            ].map((event, index) => (
              <div key={index} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h5 className="text-xl font-bold mb-2">{event.title}</h5>
                  <p className="text-gray-300 text-sm mb-4">{event.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{event.date}</div>
                      <div className="text-sm text-gray-300">{event.time}</div>
                    </div>
                    <button className="bg-white text-gray-900 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
                      View Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Have a Question?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Have a question about our facilities, programs, or membership options? We're here to help! Contact our friendly team today, and we'll be happy to assist you.
          </p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2">
            <span>Contact Us</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img
                src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                alt="Sports Reels Logo"
                className="w-12 h-12 mb-4"
              />
              <p className="text-gray-600 mb-6">Where Sports Shape Lives</p>
              
              <div className="flex space-x-4 mb-6">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">About us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Plans</a></li>
                <li><a href="#categories" className="text-gray-600 hover:text-gray-900">Categories</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Style Guide</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Licenses</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Changelog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-gray-600">
              © 2024 Sports Reels. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
