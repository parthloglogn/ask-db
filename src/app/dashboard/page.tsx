'use client';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Layout from '../components/dashboard/Layout';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    redirect("/signin");
  }

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <Layout />;
}


