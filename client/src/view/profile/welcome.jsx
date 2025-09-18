import Header from '@components/ui/Header';
import React from 'react';
import { useSelector } from 'react-redux';

import { useLocation } from 'react-router-dom';

const Welcome = () => {
  const location = useLocation();
  const { profile, isLoading } = useSelector((state) => state.user);

  return (
    <div className="p-4">
      <Header />
      <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name || 'User'}!</h1>
      {/* More content here */}
    </div>
  );
};

export default Welcome; // ✅ This is required
