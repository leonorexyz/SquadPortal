ALTER TABLE `projects` ADD `due_date` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `updated_at` integer;--> statement-breakpoint
UPDATE `tasks` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;--> statement-breakpoint
CREATE INDEX `tasks_updated_at_idx` ON `tasks` (`updated_at`);
