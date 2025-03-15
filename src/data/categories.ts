import { Category } from '../types';
import { translations } from '../i18n/translations';

// Default system categories that match the public/images folder structure
export const categories: Category[] = [
  {
    id: 'social',
    name: translations.categories.social,
    icon: '👥',
    color: '#9333ea',
    group: 'social'
  },
  {
    id: 'actions',
    name: translations.categories.actions,
    icon: '🏃',
    color: '#3b82f6',
    group: 'actions'
  },
  {
    id: 'emotions',
    name: translations.categories.emotions,
    icon: '😊',
    color: '#eab308',
    group: 'expressions'
  },
  {
    id: 'opinion',
    name: translations.categories.opinion,
    icon: '💭',
    color: '#0ea5e9',
    group: 'communication'
  },
  {
    id: 'leisure',
    name: translations.categories.leisure,
    icon: '🎮',
    color: '#6366f1',
    group: 'activities'
  },
  {
    id: 'food',
    name: translations.categories.food,
    icon: '🍎',
    color: '#ef4444',
    group: 'daily'
  },
  {
    id: 'clothes',
    name: translations.categories.clothes,
    icon: '👕',
    color: '#818cf8',
    group: 'daily'
  },
  {
    id: 'objects',
    name: translations.categories.objects,
    icon: '📱',
    color: '#6b7280',
    group: 'things'
  },
  {
    id: 'places',
    name: translations.categories.places,
    icon: '🏠',
    color: '#22c55e',
    group: 'places'
  },
  {
    id: 'body',
    name: translations.categories.body,
    icon: '👤',
    color: '#ec4899',
    group: 'body'
  },
  {
    id: 'animals',
    name: translations.categories.animals,
    icon: '🐾',
    color: '#f59e0b',
    group: 'nature'
  },
  {
    id: 'colors',
    name: translations.categories.colors,
    icon: '🎨',
    color: '#8b5cf6',
    group: 'expressions'
  },
  {
    id: 'numbers',
    name: translations.categories.numbers,
    icon: '🔢',
    color: '#14b8a6',
    group: 'general'
  },
  {
    id: 'weather',
    name: translations.categories.weather,
    icon: '☀️',
    color: '#fbbf24',
    group: 'weather'
  }
];