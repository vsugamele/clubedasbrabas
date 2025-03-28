-- Create trending_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS trending_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_likes INTEGER NOT NULL DEFAULT 10,
  min_comments INTEGER NOT NULL DEFAULT 5,
  timeframe_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to create trending_settings if it doesn't exist
CREATE OR REPLACE FUNCTION create_trending_settings_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trending_settings'
  ) THEN
    -- Create the table
    CREATE TABLE trending_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      min_likes INTEGER NOT NULL DEFAULT 10,
      min_comments INTEGER NOT NULL DEFAULT 5,
      timeframe_hours INTEGER NOT NULL DEFAULT 24,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  -- Check if there are any records
  IF NOT EXISTS (SELECT 1 FROM trending_settings LIMIT 1) THEN
    -- Insert default settings
    INSERT INTO trending_settings (min_likes, min_comments, timeframe_hours)
    VALUES (10, 5, 24);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
