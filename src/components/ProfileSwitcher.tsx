import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { Button } from '../design-system/primitives/Button';
import { Input } from '../design-system/primitives/Input';

export function ProfileSwitcher() {
  const { currentUser, createUser, setCurrentUser, logout, users } = useUserStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const userList = Object.values(users);

  const handleCreateUser = () => {
    if (!newName.trim()) return;

    createUser(newName.trim(), newEmail.trim() || undefined);
    setNewName('');
    setNewEmail('');
    setShowCreate(false);
  };

  if (!currentUser) {
    return (
      <div className="p-4">
        <div className="mb-4 text-sm text-hal-muted">Welcome to H.A.L. Compass</div>

        {userList.length > 0 && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-widest text-hal-muted mb-2">Switch Profile</div>
            <div className="space-y-1">
              {userList.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCurrentUser(user)}
                >
                  {user.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} className="w-full">
            Create New Profile
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              label="Your Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Jane Trader"
            />
            <Input
              label="Email (optional)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="jane@fund.com"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateUser} disabled={!newName.trim()}>
                Create Profile
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">{currentUser.name}</div>
        {currentUser.email && (
          <div className="text-xs text-hal-muted">{currentUser.email}</div>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        Switch
      </Button>
    </div>
  );
}
