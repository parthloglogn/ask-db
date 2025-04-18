"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";
import { GoogleSignInButton } from '../components/AuthButtons';
import { CredentialsForm } from '../components/credentialsForm';
import { useRouter } from "next/navigation";

export default function LoginPage() {
   const { data: session, status } = useSession();
  const router = useRouter();

  console.log(session, status);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg w-full sm:w-[400px] md:w-[450px]">
        <div className="flex justify-center mb-6">
          {/* Optional logo */}
          {/* <Image
            src="https://storage.googleapis.com/a1aa/image/SY4iWk_Ptx8MPZ0kuAx_ugwNVroGOUUPOi55zyiK2GI.jpg"
            alt="App logo"
            width={50}
            height={50}
            className="w-12 h-12"
          /> */}
        </div>
        
        <h1 className="text-center text-2xl font-semibold mb-2">
          Sign in to your account
        </h1>
        
        <p className="text-center text-gray-400 mb-6">
          Login to your account for a faster checkout.
        </p>       
        <GoogleSignInButton/>

        <div className="my-6 flex items-center justify-center">
          <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color/50 sm:block"></span>
          <p className="w-full px-5 text-center text-base font-medium text-body-color">
            Or, sign in with your email
          </p>
          <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color/50 sm:block"></span>
        </div>

        <CredentialsForm />

        <p className="text-center text-base font-medium text-body-color mt-4">
          Don’t you have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
