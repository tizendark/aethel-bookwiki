/*
  # Aethel Platform Schema
  1. Tables:
    - profiles: User roles and metadata
    - books: The living books (approved and pending)
    - edits: Proposed changes to existing books
  2. Security:
    - RLS enabled on all tables
    - Policies for public reading of approved books
    - Policies for user-specific dashboard access
*/

-- Profiles table for roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  author_id uuid REFERENCES profiles(id),
  description text,
  cover_url text,
  content text, -- Markdown or JSON
  category text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved books are viewable by everyone" ON books
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own pending books" ON books
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Moderators can view all books" ON books
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

-- Edits table
CREATE TABLE IF NOT EXISTS edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  proposed_content text NOT NULL,
  change_summary text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own edits" ON edits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all edits" ON edits
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));