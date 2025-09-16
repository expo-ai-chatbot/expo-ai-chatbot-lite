// Simple types for mock authentication
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

// Re-export auth types for convenience
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

// Default avatar URL generator
export const getAvatarUrl = (user: User | null): string => {
  if (user?.image) {
    return user.image;
  }
  
  if (user?.name) {
    // Generate a simple avatar based on initials
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=667eea&color=fff&size=200`;
  }
  
  if (user?.email) {
    const initial = user.email[0].toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=667eea&color=fff&size=200`;
  }
  
  return 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200';
};
