export type BookStatus = 'pending' | 'approved' | 'rejected';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover: string;
  content: string;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Edition {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  changes: string;
  status: BookStatus;
  timestamp: string;
}
