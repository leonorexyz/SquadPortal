ALTER TABLE `knowledge_articles` ADD `file_name` text;--> statement-breakpoint
ALTER TABLE `knowledge_articles` ADD `file_url` text;--> statement-breakpoint
ALTER TABLE `knowledge_articles` ADD `mime_type` text;--> statement-breakpoint
ALTER TABLE `knowledge_articles` ADD `file_size` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `share_permissions_resource_user_unique` ON `share_permissions` (`resource_type`,`resource_id`,`user_id`);