CREATE TABLE `google_project_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`document_id` text NOT NULL,
	`document_name` text NOT NULL,
	`document_type` text NOT NULL,
	`range` text DEFAULT 'Tasks!A1:G' NOT NULL,
	`sync_enabled` integer DEFAULT true NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `google_project_sources_project_idx` ON `google_project_sources` (`project_id`);--> statement-breakpoint
CREATE INDEX `google_project_sources_user_idx` ON `google_project_sources` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `google_project_sources_project_document_unique` ON `google_project_sources` (`project_id`,`document_id`);