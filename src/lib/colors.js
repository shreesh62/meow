export const AVATAR_BG_CLASSES = [
  'bg-pastel-pink',
  'bg-pastel-blue',
  'bg-pastel-green',
  'bg-pastel-yellow',
  'bg-pastel-lavender',
  'bg-pastel-peach',
]

export const MOOD_PRESETS = [
  { emoji: '😊', label: 'Happy', color: 'bg-pastel-yellow' },
  { emoji: '🥰', label: 'Loved', color: 'bg-pastel-pink' },
  { emoji: '😴', label: 'Tired', color: 'bg-pastel-lavender' },
  { emoji: '😤', label: 'Annoyed', color: 'bg-pastel-peach' },
  { emoji: '😢', label: 'Sad', color: 'bg-blue-100' },
  { emoji: '😎', label: 'Cool', color: 'bg-pastel-green' },
  { emoji: '🤒', label: 'Sick', color: 'bg-green-100' },
  { emoji: '🤯', label: 'Stressed', color: 'bg-red-100' },
  { emoji: '🥳', label: 'Excited', color: 'bg-purple-100' },
]

export const normalizeBgClass = (value) => {
  if (!value) return 'bg-pastel-blue'
  return value.startsWith('bg-') ? value : `bg-${value}`
}

