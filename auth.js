import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
            // Remove token, userinfo, and issuer — let Auth.js handle these
        }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectDB();
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // Create a new user record for the Google user
                        // We generate a safe username from the name or email
                        let baseUsername = user.name?.toLowerCase().replace(/\s+/g, '_') || user.email.split('@')[0];

                        // Ensure username is unique (simplified version)
                        let username = baseUsername;
                        let counter = 1;
                        while (await User.findOne({ username })) {
                            username = `${baseUsername}${counter}`;
                            counter++;
                        }

                        await User.create({
                            email: user.email,
                            username: username,
                            avatar: user.image,
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user during Google sign-in:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token?.sub) {
                session.user.id = token.sub;

                // Fetch the actual username from the database
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: session.user.email });
                    if (dbUser) {
                        session.user.username = dbUser.username;
                        session.user.role = dbUser.role || 'user';
                    }
                } catch (error) {
                    console.error("Error fetching username for session:", error);
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/',
    },
})