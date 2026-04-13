insert into public.presets (code, name, description, temperature, grain, intensity_default, is_system)
values
  ('A16', 'Soft Chrome', 'Cool chrome palette with lifted blacks for night streets.', -8, 38, 0.84, true),
  ('M5', 'Dawn Fade', 'Warm highlights and gentle contrast for portraits.', 10, 22, 0.73, true),
  ('B2', 'Muted Cobalt', 'Matte blacks and muted blue shadows.', -2, 18, 0.62, true),
  ('S9', 'Quiet Dust', 'Editorial matte finish with dusty highlights.', 5, 31, 0.78, true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  temperature = excluded.temperature,
  grain = excluded.grain,
  intensity_default = excluded.intensity_default,
  is_system = excluded.is_system;
