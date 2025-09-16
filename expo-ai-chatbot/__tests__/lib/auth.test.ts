import { getAvatarUrl, User } from '@/lib/auth';

describe('auth utilities', () => {
  describe('getAvatarUrl', () => {
    it('should return user image if provided', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://example.com/avatar.jpg');
    });

    it('should generate avatar from name initials if no image', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://ui-avatars.com/api/?name=JD&background=667eea&color=fff&size=200');
    });

    it('should generate avatar from email initial if no name or image', () => {
      const user: User = {
        id: '1',
        name: '',
        email: 'john@example.com',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://ui-avatars.com/api/?name=J&background=667eea&color=fff&size=200');
    });

    it('should return default avatar if no user provided', () => {
      const result = getAvatarUrl(null);
      expect(result).toBe('https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200');
    });

    it('should return default avatar if user has no name or email', () => {
      const user: User = {
        id: '1',
        name: '',
        email: '',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200');
    });

    it('should handle user with multiple names', () => {
      const user: User = {
        id: '1',
        name: 'John Michael Doe',
        email: 'john@example.com',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://ui-avatars.com/api/?name=JMD&background=667eea&color=fff&size=200');
    });

    it('should handle special characters in name', () => {
      const user: User = {
        id: '1',
        name: 'José María',
        email: 'jose@example.com',
      };

      const result = getAvatarUrl(user);
      expect(result).toBe('https://ui-avatars.com/api/?name=JM&background=667eea&color=fff&size=200');
    });
  });
});