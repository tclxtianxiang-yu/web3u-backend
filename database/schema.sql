-- Web3 University Database Schema
-- Using wallet address as the primary key for user identification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet address as primary key)
CREATE TABLE users (
  wallet_address VARCHAR(42) PRIMARY KEY,
  username VARCHAR(255),
  avatar_url VARCHAR(500),
  email VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('student', 'teacher', 'admin')),
  yd_token_balance DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  teacher_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  price_yd DECIMAL(20, 8) NOT NULL,
  category VARCHAR(100),
  thumbnail_url TEXT,
  video_url TEXT,
  total_lessons INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course lessons table
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, lesson_number)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_address VARCHAR(42) NOT NULL,
  to_wallet_address VARCHAR(42) NOT NULL,
  amount_yd DECIMAL(20, 8) NOT NULL,
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('course_purchase', 'teacher_payment', 'token_purchase', 'withdrawal')) NOT NULL,
  transaction_hash VARCHAR(66),
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning records table
CREATE TABLE learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  watch_time INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_wallet_address, course_id, lesson_id)
);

-- Course reviews table
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_wallet_address)
);

-- NFT certificates table (tracking on-chain NFTs)
CREATE TABLE nft_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  token_id VARCHAR(100) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  blockchain_network VARCHAR(50) DEFAULT 'ethereum',
  metadata_uri TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token_id, contract_address)
);

-- Teacher NFT badges table
CREATE TABLE teacher_nft_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  badge_type VARCHAR(100) NOT NULL,
  token_id VARCHAR(100) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  metadata_uri TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token_id, contract_address)
);

-- Junction table: User enrolled courses
CREATE TABLE user_courses (
  user_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_wallet_address, course_id)
);

-- Junction table: Course transactions
CREATE TABLE course_transactions (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, transaction_id)
);

-- Junction table: User transactions
CREATE TABLE user_transactions (
  user_wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_wallet_address, transaction_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_courses_teacher ON courses(teacher_wallet_address);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX idx_transactions_from ON transactions(from_wallet_address);
CREATE INDEX idx_transactions_to ON transactions(to_wallet_address);
CREATE INDEX idx_learning_records_user ON learning_records(user_wallet_address);
CREATE INDEX idx_learning_records_course ON learning_records(course_id);
CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_nft_certificates_user ON nft_certificates(user_wallet_address);
CREATE INDEX idx_teacher_badges_teacher ON teacher_nft_badges(teacher_wallet_address);
CREATE INDEX idx_user_courses_user ON user_courses(user_wallet_address);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
