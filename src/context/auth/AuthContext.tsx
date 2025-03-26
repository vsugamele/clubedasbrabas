
import React, { createContext, useContext } from "react";
import { useAuthProvider } from "./useAuthProvider";
import { AuthContextProps } from "./types";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthProvider();
  
  // Create a properly typed object that matches the AuthContextProps interface
  const authContextValue: AuthContextProps = {
    session: auth.session,
    user: auth.user,
    profile: auth.profile,
    loading: auth.loading,
    signIn: auth.login,
    signUp: auth.signUp,
    signOut: auth.logout,
    updateProfile: auth.updateProfile,
    refreshSession: auth.refreshSession,
    attemptSessionRecovery: auth.attemptSessionRecovery
  };

  return (
    <AuthContext.Provider value={authContextValue}>
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
