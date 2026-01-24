import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { useApp } from '../context/AppContext';
import { normalizeBgClass } from '../lib/colors';
import { buildInviteLink, copyText } from '../lib/invite';

const Profile = () => {
  const navigate = useNavigate();
  const { user, space, logout } = useApp();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const avatarBg = normalizeBgClass(user?.avatar_color);
  const inviteLink = useMemo(() => buildInviteLink(space.code), [space.code]);

  const pulseCopied = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1200);
  };

  const onCopyCode = async () => {
    const ok = await copyText(space.code);
    if (ok) pulseCopied(setCopied);
    else alert('Please copy manually: ' + space.code);
  };

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meow Mood invite',
          text: 'Join my private space using this invite link:',
          url: inviteLink,
        });
        return;
      } catch {
      }
    }
    const ok = await copyText(inviteLink);
    if (ok) pulseCopied(setCopiedLink);
    else alert('Invite link: ' + inviteLink);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl ${avatarBg} border border-white/60 shadow-sm`} />
          <div>
            <p className="text-sm font-semibold text-gray-500">Profile</p>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight text-gray-900">{user?.name || 'Me'}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl flex items-center justify-center text-gray-800 hover:bg-white transition-all"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <Card className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Invite Code</p>
        <p className="mt-2 text-sm font-semibold text-gray-600 leading-relaxed">
          Share this with your partner when it feels right.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-2xl bg-white/70 border border-white/60 shadow-sm px-4 py-3 font-mono text-lg font-extrabold tracking-widest text-gray-900 text-center">
            {space.code}
          </div>
          <button
            type="button"
            onClick={onCopyCode}
            className="h-12 px-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl text-sm font-extrabold text-gray-900 hover:bg-white transition-all"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={onShare}
            className="w-full h-12 px-4 rounded-2xl bg-gray-900 text-white shadow-sm border border-white/40 text-sm font-extrabold hover:opacity-90 transition-all"
          >
            {copiedLink ? 'Link Copied' : 'Share Invite Link'}
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Account</p>
        <div className="mt-4 space-y-3">
          <Button variant="secondary" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;

