// pages/api/auth/session.ts
import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { authConfig } from "./auth";  // Ensure the path is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the session object
  const session = await getServerSession(authConfig);

  if (session?.user) {
    // User is authenticated, send the session details
    return res.status(200).json({ user: session.user });
  } else {
    // User is not authenticated
    return res.status(401).json({ error: "Unauthorized" });
  }
}
