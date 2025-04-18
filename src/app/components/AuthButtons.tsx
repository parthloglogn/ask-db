"use client";

import { signIn } from "next-auth/react";
import { FaGoogle } from 'react-icons/fa';

export function GoogleSignInButton() {
  const handleClick = () => {
    signIn("google");
  };
  return (
        <button 
        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center mb-4 transition-colors"
        onClick={handleClick}
        >
          <FaGoogle className="mr-2" />
          Login with Google
        </button>
  );
}

