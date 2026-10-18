CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`first_seen` text NOT NULL
);

CREATE INDEX `visitors_country_idx` ON `visitors` (`country`);
