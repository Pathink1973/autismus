export interface Card {
  id: string;
  name: string;
  image_url: string;
  storage_path: string;
  category_id: string;
  user_id: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // UI-specific properties
  icon?: string;
  color?: string;
  isSystem?: boolean;
  group?: string;
}
