CREATE TABLE menu_options (
  id SERIAL PRIMARY KEY,
  menu_id VARCHAR(50) NOT NULL,
  option_id VARCHAR(50) NOT NULL UNIQUE,
  option_title VARCHAR(100) NOT NULL,
  option_description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);


INSERT INTO menu_options (menu_id, option_id, option_title, display_order)
VALUES
  ('main', 'registrarse', 'Registrarse en club', 1),
  ('main', 'horarios', 'Horarios de atención', 2),
  ('main', 'despachos', 'Despachos', 3),
  ('main', 'producto', 'Producto', 4);