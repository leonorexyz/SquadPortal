INSERT OR IGNORE INTO `users` ("id", "email", "name", "role", "status") VALUES
  ('demo-user', 'sarah@squad.local', 'Sarah Anderson', 'admin', 'active'),
  ('nadia-putri', 'nadia@squad.local', 'Nadia Putri', 'editor', 'active'),
  ('raka-aditya', 'raka@squad.local', 'Raka Aditya', 'editor', 'active'),
  ('dimas-pratama', 'dimas@squad.local', 'Dimas Pratama', 'viewer', 'active'),
  ('sinta-maheswari', 'sinta@squad.local', 'Sinta Maheswari', 'viewer', 'active');
--> statement-breakpoint
INSERT OR IGNORE INTO `projects` ("id", "name", "description", "client", "status", "visibility", "due_date", "owner_id", "created_at") VALUES
  ('website-redesign', 'Website Redesign', 'A clearer, calmer home for the product and the people using it.', 'Nexa Labs', 'development', 'internal', '2026-09-12', 'nadia-putri', unixepoch() * 1000),
  ('mobile-app', 'Mobile App v2', 'Reworking the core mobile workflow around faster everyday decisions.', 'IFabula', 'sit', 'internal', '2026-09-05', 'raka-aditya', unixepoch() * 1000),
  ('q3-campaign', 'Q3 Campaign', 'A focused campaign to help more teams discover the new workspace.', NULL, 'uat', 'public', '2026-09-27', 'dimas-pratama', unixepoch() * 1000),
  ('team-ops', 'Team Operations', 'Small systems that make planning, handoffs, and collaboration easier.', 'Leonore Kingdom', 'implementation', 'internal', '2026-09-19', 'demo-user', unixepoch() * 1000),
  ('research-library', 'Research Library', 'Organizing the insights that help us make better product decisions.', 'Northstar', 'go-live', 'public', NULL, 'sinta-maheswari', unixepoch() * 1000),
  ('onboarding-refresh', 'Onboarding refresh', 'A welcoming first week for every new member joining the squad.', 'Leonore Kingdom', 'preparation', 'internal', '2026-10-02', 'demo-user', unixepoch() * 1000);
