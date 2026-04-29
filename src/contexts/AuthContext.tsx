"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services";
import { AuthUser, UserProfile } from "@/types";

interface AuthContextProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  isModerator: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const userProfile = await authService.getUserProfile(uid);
      setProfile(userProfile);
    } catch (error) {
      console.error("[AuthContext] Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        await fetchProfile(authUser.uid);
      } else {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const isModerator = profile?.role === "moderator" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isModerator, 
      isAdmin, 
      isLoading,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
