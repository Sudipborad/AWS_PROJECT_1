import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Recycle } from 'lucide-react';

const SignInPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30 h-16">
        <div className="flex h-full items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Eco Guardian</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <SignIn 
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto"
              }
            }}
          />
        </div>
      </main>
      
      <footer className="border-t py-6 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2023 Eco Guardian. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SignInPage;
