import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
      <h1 className="text-4xl font-black text-white">404</h1>
      <p className="text-[#71767b] text-base max-w-sm">
        Hmm...this page doesn’t exist. Try searching for something else or return to the main feed.
      </p>
      <Button onClick={() => navigate('/')} size="md">
        Back to Home
      </Button>
    </div>
  );
}
