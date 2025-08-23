
import React, { useState } from 'react';
import { Instagram, Facebook, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Homepage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-montserrat">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" 
                alt="Sports Reels" 
                className="h-12 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>Home</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>Transfer Timeline</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>Explore</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>Pricing</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>About</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center space-x-1 text-black hover:text-gray-600 transition-colors">
                <span>Contact</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile menu button */}
            <button 
              className="lg:hidden flex flex-col space-y-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Side Social Media */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col space-y-4">
        <a href="#" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Instagram className="w-5 h-5 text-black" />
        </a>
        <a href="#" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Facebook className="w-5 h-5 text-black" />
        </a>
        <a href="#" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </a>
      </div>

      {/* Animated Slogan */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-black transform -rotate-90 origin-center whitespace-nowrap">
            Where Data Lives
          </span>
          <div className="w-8 h-0.5 bg-black"></div>
        </div>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight">
            Where Sports<br />Data Lives
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg">
              Start Your Team Profile
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg">
              Join as Scout/Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl lg:text-6xl font-bold mb-16 text-center">
            Our<br />Sports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Football', image: '/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4' },
              { name: 'Basketball', image: '/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4' },
              { name: 'Tennis', image: '/sportsreelsvideos/mixkit-tennis-players-at-an-outdoor-court-869-hd-ready.mp4' },
              { name: 'Swimming', image: '/sportsreelsvideos/mixkit-man-swimming-in-a-pool-3168-hd-ready.mp4' },
              { name: 'Baseball', image: '/sportsreelsvideos/mixkit-baseball-player-pitching-the-ball-856-hd-ready.mp4' },
              { name: 'Boxing', image: '/sportsreelsvideos/mixkit-two-men-on-a-ring-fighting-in-a-boxing-match-40974-hd-ready.mp4' }
            ].map((sport, index) => (
              <div key={sport.name} className={`relative h-80 rounded-lg overflow-hidden group cursor-pointer ${index % 3 === 0 ? 'md:mt-16' : ''}`}>
                <video 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src={sport.image} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h4 className="text-white text-2xl font-bold">{sport.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl lg:text-6xl font-bold mb-16 text-center">
            Discover Our Data-Driven Platform
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {[
              { number: '01', title: 'Comprehensive Player Profiles', image: '/sportsreelsvideos/mixkit-portrait-of-a-confident-football-player-42566-hd-ready.mp4' },
              { number: '02', title: 'Secure Transfer System', image: '/sportsreelsvideos/mixkit-basketball-player-dribbling-then-dunking-2285-hd-ready.mp4' },
              { number: '03', title: 'Youth Scouting Network', image: '/sportsreelsvideos/mixkit-tennis-players-at-an-outdoor-court-869-hd-ready.mp4' },
              { number: '04', title: 'Performance Analytics', image: '/sportsreelsvideos/mixkit-man-swimming-in-a-pool-3168-hd-ready.mp4' },
              { number: '05', title: 'Global Market Access', image: '/sportsreelsvideos/mixkit-baseball-player-pitching-the-ball-856-hd-ready.mp4' }
            ].map((feature) => (
              <div key={feature.number} className="group">
                <div className="text-6xl font-bold text-gray-200 mb-4">{feature.number}</div>
                <h3 className="text-xl font-bold mb-6">{feature.title}</h3>
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <video 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  >
                    <source src={feature.image} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl lg:text-6xl font-bold mb-16 text-center">
            Meet the<br />Experts
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: 'Mark Johnson', role: 'Football Scout', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
              { name: 'Sarah Parker', role: 'Data Analyst', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=300&h=300&fit=crop&crop=face' },
              { name: 'Emily Collins', role: 'Transfer Specialist', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
              { name: 'James Martinez', role: 'Youth Scout', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' },
              { name: 'Ryan Johnson', role: 'Performance Analyst', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
              { name: 'Chris Thompson', role: 'Market Analyst', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face' }
            ].map((expert) => (
              <div key={expert.name} className="flex items-center space-x-4 bg-white p-6 rounded-lg shadow-sm">
                <div>
                  <div className="font-bold text-lg">{expert.name}</div>
                  <div className="text-gray-600">{expert.role}</div>
                </div>
                <img 
                  src={expert.image} 
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8">
                <span className="text-gray-400">Special</span><br />
                Offer
              </h2>
              <div className="space-y-6 mb-12">
                {[
                  'Free Team Profile Setup',
                  'Complimentary Player Data Migration',
                  'Premium Analytics for 3 Months',
                  'Exclusive Transfer Market Access',
                  'Priority Customer Support'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mb-8">
                <div className="text-5xl font-bold">$199</div>
                <div className="text-gray-400">For yearly subscription only</div>
              </div>
            </div>
            <div className="text-right">
              <Button className="bg-white text-black hover:bg-gray-100 mb-6 inline-flex items-center space-x-2">
                <span>Become a member</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <p className="text-sm text-gray-400">
                * This offer is available until 30/08/2024. Offer valid for new members only. Terms and conditions apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl lg:text-6xl font-bold mb-16 text-center">
            Hear It Straight from<br />Our Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Mark M.', role: 'Team Manager', text: 'Sports Reels transformed how we manage player transfers. The data insights are incredible!', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
              { name: 'Sarah M.', role: 'Scout', text: 'Found amazing talent in emerging markets through their comprehensive scouting network.', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=300&h=300&fit=crop&crop=face' },
              { name: 'Veronica A.', role: 'Agent', text: 'The platform streamlined our entire transfer process. Highly recommended for all agents.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
              { name: 'Jessie B.', role: 'Youth Coach', text: 'Perfect for discovering and developing young talent. The analytics are game-changing.', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' }
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-gray-50 p-8 rounded-lg">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="font-bold text-lg">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                  <p className="text-gray-700 mb-6 flex-grow">{testimonial.text}</p>
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover self-end"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-bold">
              Join<br />the Platform :)
            </h2>
            <Button className="bg-black text-white hover:bg-gray-800 inline-flex items-center space-x-2">
              <span>Explore all</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Team Registration Workshop', desc: 'Learn how to set up your team profile and optimize player data.', date: '24 Apr', time: '9:40 pm', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop' },
              { title: 'Scout Network Clinic', desc: 'Connect with scouts worldwide and expand your recruitment network.', date: '19 Apr', time: '11:50 pm', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop' },
              { title: 'Transfer Market Analytics', desc: 'Deep dive into market trends and player valuations with our experts.', date: '16 Apr', time: '9:21 pm', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop' }
            ].map((event) => (
              <div key={event.title} className="relative rounded-lg overflow-hidden group cursor-pointer">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h5 className="text-xl font-bold mb-2">{event.title}</h5>
                  <p className="text-gray-200 mb-4">{event.desc}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{event.date}</div>
                      <div className="text-sm text-gray-300">{event.time}</div>
                    </div>
                    <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">Have a Question?</h2>
          <p className="text-xl mb-12 text-gray-300">
            Have a question about our platform, features, or pricing? We're here to help! 
            Contact our friendly team today, and we'll be happy to assist you.
          </p>
          <Button className="bg-white text-black hover:bg-gray-100 inline-flex items-center space-x-2 px-8 py-4">
            <span>Contact Us</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2">
              <img 
                src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" 
                alt="Sports Reels" 
                className="h-12 w-auto mb-6"
              />
              <div className="text-2xl font-bold mb-8">Where Sports Data Lives</div>
              <div className="flex space-x-4 mb-8">
                <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">About us</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Pricing</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Sports</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Contact Us</a>
                </div>
                <div>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Privacy Policy</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Terms of Service</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Support</a>
                  <a href="#" className="block text-gray-300 hover:text-white mb-4 transition-colors">Documentation</a>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 lg:justify-end">
              <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-sm font-medium transform -rotate-90 origin-center whitespace-nowrap">
                Where Data Lives
              </span>
              <div className="w-8 h-0.5 bg-gray-400"></div>
            </div>
            <p>© 2024 Sports Reels. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-white">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6">
                <img 
                  src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" 
                  alt="Sports Reels" 
                  className="h-12 w-auto"
                />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2"
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-6 py-12">
                <div className="space-y-8">
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>Home</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>Transfer Timeline</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>Explore</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>Pricing</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>About</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                  <a href="#" className="flex items-center justify-between text-2xl font-medium">
                    <span>Contact</span>
                    <ChevronRight className="w-6 h-6" />
                  </a>
                </div>
                <div className="flex space-x-6 mt-12">
                  <a href="#" className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href="#" className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a href="#" className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
