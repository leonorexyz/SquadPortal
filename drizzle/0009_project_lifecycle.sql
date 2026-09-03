PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`client` text,
	`status` text DEFAULT 'preparation' NOT NULL,
	`visibility` text DEFAULT 'internal' NOT NULL,
	`due_date` text,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "name", "description", "client", "status", "visibility", "due_date", "owner_id", "created_at") SELECT "id", "name", "description", NULL, CASE "status" WHEN 'ongoing' THEN 'development' WHEN 'completed' THEN 'go-live' WHEN 'onhold' THEN 'preparation' ELSE "status" END, "visibility", "due_date", "owner_id", "created_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `projects_owner_idx` ON `projects` (`owner_id`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_visibility_idx` ON `projects` (`visibility`);
