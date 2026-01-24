import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiCreateSpace, apiCreateUser, apiGetSpaceByCode } from '../services/api';
import { useApp } from '../context/AppContext';
import { Button, Input, Card, Chip } from '../components/ui';
import { Heart } from 'lucide-react';
import { AVATAR_BG_CLASSES } from '../lib/colors';

const JoinPage = () => {
  const [mode, setMode] = useState('create'); // create | join
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const c = (searchParams.get('code') || '').trim();
    if (c) {
      setMode('join');
      setCode(c);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let space;
      if (mode === 'create') {
        space = await apiCreateSpace();
      } else {
        space = await apiGetSpaceByCode(code);
        if (!space) {
          alert('Space not found!');
          setLoading(false);
          return;
        }
      }

      const randomColor = AVATAR_BG_CLASSES[Math.floor(Math.random() * AVATAR_BG_CLASSES.length)];

      const user = await apiCreateUser(space.id, name, randomColor);
      login(user, space);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-pastel-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-pastel-pink/30 blur-3xl" />
        <div className="absolute top-40 -left-28 h-96 w-96 rounded-full bg-pastel-blue/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-pastel-lavender/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-left mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl inline-flex items-center gap-3 shadow-sm border border-white/60 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Couple Space</p>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Meow Mood</h1>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Private mood sync for two people. Create a space, share the code, and you’re in.
          </p>
        </div>

        <Card>
          <div className="flex gap-3 mb-6">
            <Chip active={mode === 'create'} onClick={() => setMode('create')} className="flex-1 justify-center">
              Create
            </Chip>
            <Chip active={mode === 'join'} onClick={() => setMode('join')} className="flex-1 justify-center">
              Join
            </Chip>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Your Name</label>
              <Input
                placeholder="e.g. Kitten"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Invite Code</label>
                <Input
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Meowing...' : (mode === 'create' ? 'Create & Start' : 'Join Space')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default JoinPage;
