import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import UserProfile from '@/components/UserProfile';

const ProfilePage = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-8 animate-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile information
          </p>
          
          <UserProfile />
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;
