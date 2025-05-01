import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';

const MarketplacePage = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground">
              Buy and sell recycled materials
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <ShoppingCart className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Our marketplace feature is under development. Soon you'll be able to buy and sell recycled materials directly through our platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default MarketplacePage; 