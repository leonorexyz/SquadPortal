CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`ticket_replies` integer DEFAULT true NOT NULL,
	`project_updates` integer DEFAULT true NOT NULL,
	`weekly_summary` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
