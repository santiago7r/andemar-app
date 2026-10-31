-- Datos de ejemplo — los mismos 3 tours usados en los mockups.
-- Reemplaza los video_360_url por los links reales de YouTube 360 cuando los tengas.

insert into tours
  (slug, title, category, location, price_cop, rating, cover_color, video_360_url, includes, description, commission_pct)
values
  (
    'parque-tayrona-3-dias',
    'Parque Tayrona · 3 días',
    'playa',
    'Playa y selva, Magdalena',
    450000,
    4.9,
    '#0E7C90',
    'https://www.youtube.com/watch?v=REEMPLAZAR',
    array['Transporte ida y vuelta', 'Alojamiento 2 noches', 'Guía local'],
    'Tres días recorriendo playas vírgenes y senderos de selva dentro del Parque Tayrona, con noches de camping frente al mar.',
    15
  ),
  (
    'valle-de-cocora-trekking',
    'Valle de Cocora · trekking',
    'montana',
    'Montaña, Eje Cafetero',
    95000,
    4.8,
    '#1B4D3E',
    'https://www.youtube.com/watch?v=REEMPLAZAR',
    array['Transporte ida y vuelta', 'Guía bilingüe'],
    'Caminata guiada por el Valle de Cocora, entre las palmas de cera más altas del mundo.',
    15
  ),
  (
    'islas-del-rosario-dia-completo',
    'Islas del Rosario · día completo',
    'isla',
    'Isla, Cartagena',
    180000,
    4.8,
    '#D9A441',
    'https://www.youtube.com/watch?v=REEMPLAZAR',
    array['Transporte ida y vuelta', 'Almuerzo típico', 'Equipo de snorkel', 'Guía bilingüe'],
    'Un día completo navegando y haciendo snorkel en los arrecifes de coral de las Islas del Rosario.',
    12
  );
