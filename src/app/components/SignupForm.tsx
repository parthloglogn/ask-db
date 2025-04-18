"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import AlertPopup from "../Common/AlertPopupProps";

interface SignupFormProps {
  csrfToken?: string;
}

export function SignupForm(props: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>(undefined);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const showAlert = (message: string, type: "success" | "error" | "warning") => {
    setAlert({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fname = formData.get("fname") as string;
    const lname = formData.get("lname") as string;

    try {
      // Create user in database
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fname, lname}),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.error || "Something went wrong!", "error");
        // throw new Error(data.error || "Something went wrong!");
      }else{
        showAlert("Signup successful! Check your email for verification.", "success");
      }

      const signInResponse = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

    } catch (error) {
      if (error instanceof Error) {
        showAlert(error.message, "error");
      } else {
        showAlert("Something went wrong!", "error");
      }
    }
  };
  return (
    <div>
      {/* {alert && <AlertPopup message={alert.message} type={alert.type} onClose={() => setAlert(null)}/>} */}
    <form onSubmit={handleSubmit}>
     

      {props.csrfToken && (
        <input
          type="hidden"
          name="csrfToken"
          defaultValue={props.csrfToken}
        />
      )}
      <div className="mb-8">
        <label
          htmlFor="name"
          className="block text-gray-400 mb-2"
        >
          First Name
        </label>
        <input
          type="text"
          name="fname"
          placeholder="Enter your first name"
          required
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-8">
        <label
          htmlFor="name"
          className="block text-gray-400 mb-2"
        >
          Last Name
        </label>
        <input
          type="text"
          name="lname"
          placeholder="Enter your last name"
          required
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-8">
        <label
          htmlFor="email"
          className="block text-gray-400 mb-2"
        >
          Work Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your Email"
          required
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-8">
        <label
          htmlFor="password"
          className="block text-gray-400 mb-2"
        >
          Your Password
        </label>
        <input
          type="password"
          name="password"
          placeholder="Enter your Password"
          required
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-8 flex">
        <label
          htmlFor="checkboxLabel"
          className="flex cursor-pointer select-none text-sm font-medium text-body-color"
        >
          <div className="relative">
            <input
              type="checkbox"
              id="checkboxLabel"
              className="sr-only"
              required
            />
            <div className="box mr-4 mt-1 flex h-5 w-5 items-center justify-center rounded border border-body-color border-opacity-20 dark:border-white dark:border-opacity-10">
              <span className="opacity-0">
                <svg
                  width="11"
                  height="8"
                  viewBox="0 0 11 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                    fill="#3056D3"
                    stroke="#3056D3"
                    strokeWidth="0.4"
                  />
                </svg>
              </span>
            </div>
          </div>
          <span>
            By creating account means you agree to the
            <a href="/terms" className="text-primary hover:underline">
              {" "}
              Terms and Conditions{" "}
            </a>
            , and our
            <a href="/privacy-policy" className="text-primary hover:underline">
              {" "}
              Privacy Policy{" "}
            </a>
          </span>
        </label>
      </div>
      <div className="mb-6">
        <button
          type="submit"
          className="shadow-submit dark:shadow-submit-dark flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white duration-300 hover:bg-primary/90"
        >
          Sign up
        </button>
      </div>
    </form>
    </div>
  );
}
