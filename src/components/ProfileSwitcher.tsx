import { useEffect, useRef, useState } from 'react';
import { ChevronDown, User, UserPlus, Users } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { Button } from '../design-system/primitives/Button';
import { Input } from '../design-system/primitives/Input';

export function ProfileSwitcher() {
  const { currentUser, createUser, setCurrentUser, logout, users } = useUserStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const userList = Object.values(users);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleCreateUser = () => {
    if (!newName.trim()) return;

    createUser(newName.trim(), newEmail.trim() || undefined);
    setNewName('');
    setNewEmail('');
    setShowCreate(false);
    setOpen(false);
  };

  const switchToUser = (userId: string) => {
    const selectedUser = users[userId];
    if (!selectedUser) return;
    setCurrentUser(selectedUser);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="min-w-[132px] justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{currentUser ? currentUser.name : 'Profile'}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-hal-muted" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(90vw,340px)] rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-1 p-4 shadow-xl z-[70] space-y-4">
          {currentUser ? (
            <div>
              <p className="text-sm font-medium">Signed in as {currentUser.name}</p>
              {currentUser.email && <p className="text-xs text-hal-muted mt-0.5">{currentUser.email}</p>}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">No active profile</p>
              <p className="text-xs text-hal-muted mt-0.5">Create one to keep your dashboard and preferences.</p>
            </div>
          )}

          {userList.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-hal-muted flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Switch Profile
              </div>
              <div className="grid gap-1.5">
                {userList.map((user) => (
                  <Button
                    key={user.id}
                    type="button"
                    variant={currentUser?.id === user.id ? 'primary' : 'ghost'}
                    size="sm"
                    className="justify-start"
                    onClick={() => switchToUser(user.id)}
                  >
                    {user.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!showCreate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowCreate(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create New Profile
            </Button>
          ) : (
            <div className="space-y-3 border border-hal-border rounded-[var(--hal-radius-sm)] p-3 bg-hal-panel-soft/55">
              <Input
                label="Name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Jane Trader"
              />
              <Input
                label="Email (optional)"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="jane@fund.com"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={handleCreateUser} disabled={!newName.trim()}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreate(false);
                    setNewName('');
                    setNewEmail('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {currentUser && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              Sign Out
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
