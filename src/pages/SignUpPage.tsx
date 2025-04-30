import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Recycle } from 'lucide-react';

const SignUpPage = () => {
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
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              Sign up as a Community Member to report and track waste management issues.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Officer and Administrator accounts are managed internally.
              If you are an officer or admin, please use the sign-in page.
            </p>
          </div>
          <SignUp 
            initialValues={{
              publicMetadata: {
                role: "user"
              }
            }}
            afterSignUpUrl="/dashboard"
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

export default SignUpPage;
