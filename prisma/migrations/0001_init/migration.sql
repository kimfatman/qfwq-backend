-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(128) NOT NULL,
    `unionid` VARCHAR(128) NULL,
    `sessionKey` VARCHAR(128) NOT NULL DEFAULT '',
    `nickname` VARCHAR(64) NOT NULL DEFAULT '',
    `avatarUrl` VARCHAR(512) NOT NULL DEFAULT '',
    `phone` VARCHAR(255) NOT NULL DEFAULT '',
    `companyName` VARCHAR(128) NOT NULL DEFAULT '',
    `role` ENUM('user', 'runner', 'admin') NOT NULL DEFAULT 'user',
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `runners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `realName` VARCHAR(32) NOT NULL,
    `idCard` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NOT NULL,
    `avatarUrl` VARCHAR(512) NOT NULL DEFAULT '',
    `serviceAreas` JSON NOT NULL,
    `serviceCategories` JSON NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `completionRate` DECIMAL(4, 1) NOT NULL DEFAULT 100.0,
    `avgResponseTime` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `runners_user_id_key`(`user_id`),
    INDEX `runners_status_idx`(`status`),
    INDEX `runners_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `category_name` VARCHAR(32) NOT NULL,
    `description` VARCHAR(512) NOT NULL DEFAULT '',
    `icon` VARCHAR(256) NOT NULL DEFAULT '',
    `image_url` VARCHAR(512) NOT NULL DEFAULT '',
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `time_desc` VARCHAR(128) NOT NULL DEFAULT '',
    `region` VARCHAR(128) NOT NULL DEFAULT '',
    `order_count` INTEGER NOT NULL DEFAULT 0,
    `is_hot` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `detail` JSON NOT NULL,
    `process` JSON NOT NULL,
    `materials` JSON NOT NULL,
    `faq` JSON NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `services_category_status_idx`(`category`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(32) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `service_id` BIGINT NOT NULL,
    `service_name` VARCHAR(64) NOT NULL,
    `assigned_runner_id` BIGINT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `title` VARCHAR(128) NOT NULL,
    `address_id` BIGINT NULL,
    `address_snapshot` VARCHAR(512) NOT NULL DEFAULT '',
    `contact_name` VARCHAR(32) NOT NULL DEFAULT '',
    `contact_phone` VARCHAR(255) NOT NULL DEFAULT '',
    `urgency` BOOLEAN NOT NULL DEFAULT false,
    `remark` TEXT NULL,
    `quote_count` INTEGER NOT NULL DEFAULT 0,
    `selected_quote_id` BIGINT NULL,
    `completed_at` DATETIME(0) NULL,
    `cancelled_at` DATETIME(0) NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    INDEX `orders_user_id_status_idx`(`user_id`, `status`),
    INDEX `orders_assigned_runner_id_status_idx`(`assigned_runner_id`, `status`),
    INDEX `orders_order_no_idx`(`order_no`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `runner_id` BIGINT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `time_estimate` VARCHAR(128) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `runner_intro` VARCHAR(512) NOT NULL DEFAULT '',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `selected` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `quotes_order_id_idx`(`order_id`),
    INDEX `quotes_runner_id_idx`(`runner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_progress` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `title` VARCHAR(64) NOT NULL,
    `description` VARCHAR(512) NOT NULL DEFAULT '',
    `operator_type` VARCHAR(16) NOT NULL,
    `operator_id` BIGINT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `order_progress_order_id_created_at_idx`(`order_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_materials` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `file_url` VARCHAR(512) NOT NULL,
    `file_name` VARCHAR(128) NOT NULL,
    `file_type` VARCHAR(32) NOT NULL,
    `file_size` INTEGER NOT NULL DEFAULT 0,
    `uploader_type` VARCHAR(16) NOT NULL,
    `uploader_id` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `order_materials_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `detail` VARCHAR(512) NOT NULL,
    `contact_name` VARCHAR(32) NOT NULL,
    `contact_phone` VARCHAR(255) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `province` VARCHAR(32) NOT NULL DEFAULT '',
    `city` VARCHAR(32) NOT NULL DEFAULT '',
    `district` VARCHAR(32) NOT NULL DEFAULT '',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `addresses_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `runner_id` BIGINT NOT NULL,
    `service_name` VARCHAR(64) NOT NULL,
    `rating` DECIMAL(2, 1) NOT NULL,
    `content` TEXT NOT NULL,
    `images` JSON NOT NULL,
    `reply` TEXT NULL,
    `reply_at` DATETIME(0) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `reviews_order_id_key`(`order_id`),
    INDEX `reviews_runner_id_idx`(`runner_id`),
    INDEX `reviews_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(64) NOT NULL,
    `subtitle` VARCHAR(128) NOT NULL DEFAULT '',
    `image_url` VARCHAR(512) NOT NULL,
    `link_type` VARCHAR(32) NOT NULL DEFAULT '',
    `link_value` VARCHAR(256) NOT NULL DEFAULT '',
    `gradient` VARCHAR(128) NOT NULL DEFAULT '',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `start_time` DATETIME(0) NULL,
    `end_time` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agreements` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(32) NOT NULL,
    `title` VARCHAR(64) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `version` VARCHAR(16) NOT NULL DEFAULT '1.0',
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `agreements_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `system_config_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `runners` ADD CONSTRAINT `runners_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_assigned_runner_id_fkey` FOREIGN KEY (`assigned_runner_id`) REFERENCES `runners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_runner_id_fkey` FOREIGN KEY (`runner_id`) REFERENCES `runners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_progress` ADD CONSTRAINT `order_progress_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_progress` ADD CONSTRAINT `order_progress_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_materials` ADD CONSTRAINT `order_materials_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_materials` ADD CONSTRAINT `order_materials_uploader_id_fkey` FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_runner_id_fkey` FOREIGN KEY (`runner_id`) REFERENCES `runners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

