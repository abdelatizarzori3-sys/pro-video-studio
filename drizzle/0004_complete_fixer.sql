CREATE TABLE `subscription_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`providerCustomerId` varchar(255) NOT NULL,
	`providerSubscriptionId` varchar(255) NOT NULL,
	`status` enum('active','cancelled','expired','past_due','unpaid') NOT NULL,
	`currentPeriodEndsAt` timestamp NOT NULL,
	`verifiedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_entitlements_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `subscription_entitlements_providerSubscriptionId_unique` UNIQUE(`providerSubscriptionId`)
);
