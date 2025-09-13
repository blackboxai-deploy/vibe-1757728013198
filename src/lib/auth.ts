import { User } from '@/types/chat';

const STORAGE_KEY = 'chat-app-user';
const USERS_STORAGE_KEY = 'chat-app-users';

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const user = JSON.parse(stored);
    // Convert joinedAt back to Date object
    user.joinedAt = new Date(user.joinedAt);
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  
  // Also update in users list
  const users = getAllUsers();
  users[user.id] = user;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  
  const currentUser = getCurrentUser();
  if (currentUser) {
    // Update status to offline
    const users = getAllUsers();
    if (users[currentUser.id]) {
      users[currentUser.id].status = 'offline';
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

export function getAllUsers(): { [id: string]: User } {
  if (typeof window === 'undefined') return {};
  
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return {};
  
  try {
    const users = JSON.parse(stored);
    // Convert joinedAt back to Date objects
    Object.values(users).forEach((user: any) => {
      user.joinedAt = new Date(user.joinedAt);
    });
    return users;
  } catch {
    return {};
  }
}

export function createUser(username: string): User {
  const id = generateUserId();
  const avatar = generateAvatar(username);
  
  const user: User = {
    id,
    username,
    avatar,
    status: 'online',
    joinedAt: new Date()
  };
  
  setCurrentUser(user);
  return user;
}

export function updateUserStatus(userId: string, status: User['status']): void {
  const users = getAllUsers();
  if (users[userId]) {
    users[userId].status = status;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update current user if it's them
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.status = status;
      setCurrentUser(currentUser);
    }
  }
}

export function isUsernameAvailable(username: string): boolean {
  const users = getAllUsers();
  return !Object.values(users).some(user => 
    user.username.toLowerCase() === username.toLowerCase()
  );
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAvatar(username: string): string {
  // Generate a placeholder avatar based on username
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  
  const colorIndex = username.length % colors.length;
  const color = colors[colorIndex];
  const initial = username.charAt(0).toUpperCase();
  
  // Return a data URL for the avatar (simple colored circle with initial)
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" class="${color}" fill="${getColorHex(color)}"/>
      <text x="20" y="26" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">
        ${initial}
      </text>
    </svg>
  `)}`;
}

function getColorHex(className: string): string {
  const colorMap: { [key: string]: string } = {
    'bg-red-500': '#ef4444',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981',
    'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6',
    'bg-pink-500': '#ec4899',
    'bg-indigo-500': '#6366f1',
    'bg-teal-500': '#14b8a6'
  };
  return colorMap[className] || '#6b7280';
}