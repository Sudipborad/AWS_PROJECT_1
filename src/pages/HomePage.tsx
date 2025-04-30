import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recycle, Trash2, Award, Info, LogIn, UserPlus, ArrowRight, MapPin, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const HomePage = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30 h-16">
        <div className="container mx-auto flex h-full items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Eco Guardian</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-sm font-medium hover:text-primary"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-medium hover:text-primary"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="text-sm font-medium hover:text-primary"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('quick-actions')} 
              className="text-sm font-medium hover:text-primary"
            >
              Quick Actions
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="flex gap-2">
                <Link to="/sign-in">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Making Recycling <span className="text-primary">Simple</span> and <span className="text-primary">Effective</span></h1>
                <p className="text-xl text-muted-foreground">
                  Eco Guardian connects communities with waste management services for a cleaner, greener environment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link to="/sign-up">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/new-complaint">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Submit Complaint
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <img 
                  src="/hero-image.jpg" 
                  alt="Eco Guardian" 
                  className="rounded-lg shadow-xl max-h-[400px] object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000";
                  }}
                />
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Quick Actions Section */}
        <section id="quick-actions" className="py-8 md:py-16 bg-primary/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Take action immediately with these quick links
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/new-complaint">
                <Card className="hover:shadow-md transition-all hover:border-primary/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Submit Complaint</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/complaints">
                <Card className="hover:shadow-md transition-all hover:border-primary/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <FileImage className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">View Complaints</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/map">
                <Card className="hover:shadow-md transition-all hover:border-primary/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <MapPin className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">View Map</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/dashboard">
                <Card className="hover:shadow-md transition-all hover:border-primary/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Recycle className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Dashboard</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Eco Guardian provides a comprehensive waste management solution connecting community members, officers, and administrators.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <img 
                      src="/feature-report.jpg" 
                      alt="Report Feature" 
                      className="h-40 w-full object-cover rounded-md mb-4"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09";
                      }}
                    />
                    <h3 className="text-xl font-bold">Report Complaints</h3>
                    <p className="text-muted-foreground">
                      Easily report waste management issues with photos, location, and details for quick resolution.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <img 
                      src="/feature-track.jpg" 
                      alt="Track Feature" 
                      className="h-40 w-full object-cover rounded-md mb-4"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e";
                      }}
                    />
                    <h3 className="text-xl font-bold">Track Progress</h3>
                    <p className="text-muted-foreground">
                      Follow the status of your reported complaints and get notified when they're resolved.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <img 
                      src="/feature-impact.jpg" 
                      alt="Impact Feature" 
                      className="h-40 w-full object-cover rounded-md mb-4"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12";
                      }}
                    />
                    <h3 className="text-xl font-bold">Community Impact</h3>
                    <p className="text-muted-foreground">
                      See how your environmental concerns contribute to a cleaner, more sustainable community.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our simple 3-step process makes complaint reporting and resolution easy and efficient.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-2">Report</h3>
                <p className="text-muted-foreground">Take a photo of the issue, add details, and submit your complaint.</p>
                <img 
                  src="/step1.jpg" 
                  alt="Step 1" 
                  className="mt-4 rounded-md h-32 mx-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1608501821300-4f99e58bba77";
                  }}
                />
              </div>
              
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-2">Track</h3>
                <p className="text-muted-foreground">Officers review and update the status of your complaint.</p>
                <img 
                  src="/step2.jpg" 
                  alt="Step 2" 
                  className="mt-4 rounded-md h-32 mx-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f";
                  }}
                />
              </div>
              
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-2">Resolve</h3>
                <p className="text-muted-foreground">Your complaint is resolved and you receive notification of completion.</p>
                <img 
                  src="/step3.jpg" 
                  alt="Step 3" 
                  className="mt-4 rounded-md h-32 mx-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0";
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-primary/5">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Report an Issue?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join Eco Guardian today and help create a cleaner, more sustainable community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/sign-up">
                <Button size="lg" className="px-8">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/new-complaint">
                <Button variant="outline" size="lg" className="px-8">
                  Submit Complaint
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Recycle className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Eco Guardian</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting communities for better waste management and recycling.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link to="/new-complaint" className="text-muted-foreground hover:text-primary">Submit Complaint</Link></li>
                <li><Link to="/complaints" className="text-muted-foreground hover:text-primary">View Complaints</Link></li>
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            
            {/* <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
              </ul>
            </div> */}
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">sudipborad1@gmail.com</li>
                <li className="text-muted-foreground">(+91)9925993010</li>
                <li className="text-muted-foreground">Changa, Anand</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Eco Guardian. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
