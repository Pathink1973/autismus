export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Hex color code
  isSystem: boolean;
  isTemporary?: boolean;
  group?: string;
}

export interface CloudinaryMetadata {
  public_id: string;
}

export interface Card {
  id: string;
  name: string;
  image_url: string;
  category_id: string;
  user_id: string;
  order: number;
  storage_path?: string;
  display_name?: string;
  isSystem?: boolean;
  cloudinary_metadata?: CloudinaryMetadata;
}

export interface PictureCard {
  id: string;
  categoryId: string;
  imageUrl: string;
  label: string;
  voiceLabel: string;
  isSystem?: boolean;
  order?: number;
  createdAt?: string;
  cloudinary_metadata?: CloudinaryMetadata;
}

export interface CardManagementStore {
  cards: PictureCard[];
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  addCustomCard: (card: Omit<PictureCard, 'id' | 'isSystem'>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  reorderCards: (categoryId: string, startIndex: number, endIndex: number) => Promise<void>;
  clearCustomCards: () => Promise<void>;
}

export interface CommunicationStore {
  selectedCards: PictureCard[];
  addCard: (card: PictureCard) => void;
  removeCard: (cardId: string) => void;
  clearCards: () => void;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  error?: string;
}