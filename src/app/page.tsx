'use client'
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to AI Agent</h1>
      <p className="text-lg text-gray-400 mb-8">Your AI-powered assistant</p>
      
      <Link
        href="/signin"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-all"
      >
        signin
      </Link>
        <Link
        href="/signup"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-all"
      >
        signup
      </Link>
    </div>
  );
}
