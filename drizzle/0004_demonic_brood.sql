ALTER TABLE `tickets` ADD `priority` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `category` text DEFAULT 'Question' NOT NULL;--> statement-breakpoint
CREATE INDEX `tickets_priority_idx` ON `tickets` (`priority`);--> statement-breakpoint
CREATE INDEX `tickets_category_idx` ON `tickets` (`category`);