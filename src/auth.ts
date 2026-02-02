
import NextAuth, { NextAuthConfig, User } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { headers } from "next/headers";

// Allow self-signed certificates for .NET backend in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Helper to interact with backend
async function backendRegister(user: any) {
  const apiUrl = process.env.NEXT_PRIVATE_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://localhost:7007';
  // Standardize provider
  const provider = user.provider || 'email';
  
  // Random password if not provided (e.g. Google auth)
  const password = user.password || Array(16).fill(0).map(() => Math.random().toString(36).charAt(2)).join('') + 'Aa1';

  try {
    console.log('Attempting backend registration for:', user.email, 'with provider:', provider);
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Email: user.email,
        DisplayName: user.name,
        AvatarUrl: user.image,
        Password: password,
        Provider: provider
      }),
    });
    
    if (!res.ok) {
      if (res.status === 409) {
        console.log('User already exists, continuing...');
        return null; // Already exists
      }
      const text = await res.text();
      console.error('Backend registration failed:', { status: res.status, response: text });
      return null;
    }
    
    const result = await res.json();
    console.log('Backend registration successful:', result);
    return result;
  } catch (error) {
    console.error('Backend registration error:', error);
    return null;
  }
}

async function backendLogin(credentials: any) {
  const apiUrl = process.env.NEXT_PRIVATE_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://localhost:7007';
  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Email: credentials.email,
        Password: credentials.password,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // Try to parse JSON error if possible
      let errorMessage = text;
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || json.error_description || json.title || text;
      } catch (e) {}
      
      console.error('Backend login failed:', res.status, errorMessage);
      return { success: false, error: errorMessage };
    }
    return { success: true, user: await res.json() };
  } catch (error: any) {
    console.error('Backend login error:', error);
    return { success: false, error: error.message || 'Connection error' };
  }
}

async function getBackendProfile(email: string, provider?: string) {
  const apiUrl = process.env.NEXT_PRIVATE_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://localhost:7007';
  try {
    let url = `${apiUrl}/api/profiles/email/${encodeURIComponent(email)}`;
    if (provider) {
      url += `?provider=${encodeURIComponent(provider)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// Allow self-signed certificates for .NET backend in development


export const config = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.announcements.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const result = await backendLogin(credentials);
        
        if (result.success && result.user) {
          const user = result.user;
          return {
            id: user.id || user.Id,
            name: user.displayName || user.DisplayName,
            email: user.email || user.Email,
            image: user.avatarUrl || user.AvatarUrl,
            provider: 'email', 
          };
        }
        
        // Throw specific error message if available
        if (result.error) {
           throw new Error(result.error);
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        try {
          // Check if user exists in backend specifically for this provider
          let backendUser = await getBackendProfile(email, 'google');

          if (!backendUser) {
            // Check if user exists with ANY provider (e.g. they signed up with password before)
            // We trust Google verified the email, so we can link/login to that account.
            const existingAnyProvider = await getBackendProfile(email);
            
            if (existingAnyProvider) {
               console.log('Core Auth: Found existing user with different provider, logging in.');
               backendUser = existingAnyProvider;
            } else {
              // Register user
              backendUser = await backendRegister({
                email,
                name: user.name,
                image: user.image,
                provider: 'google'
              });
              
              if (!backendUser) {
                 // Double check if it failed because it exists (race condition or pure conflict)
                 const retryUser = await getBackendProfile(email);
                 if (retryUser) {
                    backendUser = retryUser;
                 } else {
                    console.error('Core Auth: Failed to register user in backend, allowing sign-in anyway for development.');
                    // For development: allow sign-in even if backend fails
                    // Generate a temporary ID based on email
                    user.id = Buffer.from(email).toString('base64').slice(0, 16);
                    return true;
                 }
              }
            }
          }
          
          // Mutate user object to include backend ID so it propagates to JWT
          user.id = backendUser.id || backendUser.Id;
          return true;
        } catch (e) {
            console.error('Core Auth: Error in signIn callback', e);
            // For development: allow sign-in even if backend fails
            console.log('Core Auth: Allowing sign-in anyway for development mode');
            user.id = Buffer.from(user.email || '').toString('base64').slice(0, 16);
            return true;
        }
      }
      return true; // Credentials provider already validated in authorize
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
        
        // Store Google access token for Classroom API
        if (account?.provider === 'google' && account.access_token) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
        }
        
        // Double check for Google: validation to ensure we have the Backend ID
        // This handles cases where the 'signIn' mutation might have been lost
        if (account?.provider === 'google' && user.email) {
           try {
              const backendUser = await getBackendProfile(user.email, 'google');
              if (backendUser && (backendUser.id || backendUser.Id)) {
                  token.id = backendUser.id || backendUser.Id;
              }
           } catch (e) {
              console.error("Auth: Failed to resolve backend ID in JWT", e);
           }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.provider = token.provider as string;
        // @ts-ignore
        session.user.accessToken = token.accessToken as string;
        // @ts-ignore
        session.user.refreshToken = token.refreshToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Show login modal on home? Or just redirect home.
    error: '/', // Redirect to home on error for now
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
