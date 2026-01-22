import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCreateSpace, apiCreateUser, apiGetSpaceByCode } from '../services/api';
import { useApp } from '../context/AppContext';
import { Button, Input, Card } from '../components/ui';
import { Heart, Users } from 'lucide-react';

const JoinPage = () => {
  const [mode, setMode] = useState('create'); // create | join
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

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

      // Random pastel color for avatar
      const colors = ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-yellow', 'pastel-lavender', 'pastel-peach'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const user = await apiCreateUser(space.id, name, randomColor);
      login(user, space);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-pastel-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
            <Heart className="w-8 h-8 text-pastel-pink fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Meow Mood</h1>
          <p className="text-gray-500">Share your feelings with your favorite person.</p>
        </div>

        <Card>
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'create' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              Create Space
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'join' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              Join Space
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">Your Name</label>
              <Input
                placeholder="e.g. Kitten"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">Invite Code</label>
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
