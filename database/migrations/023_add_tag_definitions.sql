CREATE TABLE tag_definitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type varchar(50) NOT NULL,
  value varchar(200) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(type, value)
);
