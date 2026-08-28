CREATE TABLE `timeline_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`track` enum('voice','music') NOT NULL,
	`name` varchar(255) NOT NULL,
	`startSeconds` int NOT NULL DEFAULT 0,
	`durationSeconds` int NOT NULL DEFAULT 30,
	`volume` int NOT NULL DEFAULT 80,
	`assetUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeline_clips_id` PRIMARY KEY(`id`)
);
