CREATE TABLE `password_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`attempted_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
