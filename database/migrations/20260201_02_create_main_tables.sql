-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(12,2) DEFAULT 0,
  price DECIMAL(12,2) NOT NULL,
  wholesale_price DECIMAL(12,2),
  tiktok_price DECIMAL(12,2),
  shopee_price DECIMAL(12,2),
  quantity INTEGER DEFAULT 0,
  sku VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_products_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'VND',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- income, expense, nhap, xuất, etc.
  color VARCHAR(20),
  icon VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, name),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id INTEGER,
  order_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  total_amount DECIMAL(12,2),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type VARCHAR(50), -- income, expense, etc.
  amount DECIMAL(12,2) NOT NULL,
  category_id INTEGER,
  wallet_id INTEGER,
  description TEXT,
  notes TEXT,
  order_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) 
    REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_wallet FOREIGN KEY (wallet_id) 
    REFERENCES wallets(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) 
    REFERENCES orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
