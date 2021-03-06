<?php

require_once ABSPATH . 'wp-admin/includes/upgrade.php';
if ( ! class_exists( 'Hustle_Db' ) ) :

	/**
	 * Class Hustle_Db
	 *
	 * Takes care of all the db initializations
	 *
	 */
	class Hustle_Db {

		const DB_VERSION_KEY = 'hustle_database_version';

		const TABLE_HUSTLE_MODULES = 'hustle_modules';

		const TABLE_HUSTLE_MODULES_META = 'hustle_modules_meta';

		public static $db;

		public function __construct() {

			$this->_create_tables();
		}

		/**
		 * Creates plugin tables
		 *
		 * @since 1.0.0
		 */
		private function _create_tables() {
			$db_version = get_site_option( self::DB_VERSION_KEY );
			// check if current version is equal to database version
			if ( version_compare( $db_version, Opt_In::VERSION, '=' ) ) { return; }
			foreach ( $this->_get_tables() as $name => $columns ) {
				$sql = $this->_create_table_sql( $name, $columns );
				dbDelta( $sql );
			}
			update_site_option( self::DB_VERSION_KEY, Opt_In::VERSION );
		}

		/**
		 * Generates CREATE TABLE sql script for provided table name and columns list.
		 *
		 * @since 1.0.0
		 *
		 * @access private
		 * @param string $name The name of a table.
		 * @param array $columns The array  of columns, indexes, constraints.
		 * @return string The sql script for table creation.
		 */
		private function _create_table_sql( $name, array $columns ) {
			global $wpdb;
			$charset = '';
			if ( ! empty( $wpdb->charset ) ) {
				$charset = ' DEFAULT CHARACTER SET ' . $wpdb->charset;
			}
			$collate = '';
			if ( ! empty( $wpdb->collate ) ) {
				$collate .= ' COLLATE ' . $wpdb->collate;
			}
			$name = $wpdb->base_prefix . $name;
			return sprintf( 'CREATE TABLE IF NOT EXISTS `%s` (%s)%s%s', $name, implode( ', ', $columns ), $charset, $collate );
		}

		/**
		 * Returns db table arrays with their "Create syntax"
		 *
		 * @since 1.0.0
		 *
		 * @return array
		 */
		private function _get_tables() {
			global $wpdb;
			$collate = '';
			if ( ! empty( $wpdb->collate ) ) {
				$collate .= ' COLLATE ' . $wpdb->collate;
			}
			return array(
				self::TABLE_HUSTLE_MODULES  => array(
					'`module_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT',
					"`blog_id` bigint(20) unsigned NOT NULL DEFAULT '0'",
					'`module_name` VARCHAR(255) NOT NULL',
					'`module_type` VARCHAR(100) NOT NULL',
					'`active` TINYINT DEFAULT 1',
					'`test_mode` TINYINT DEFAULT 0',
					'PRIMARY KEY (`module_id`)',
					'KEY `blog_id` (`blog_id`)',
					'KEY `active` (`active`)',
				),
				self::TABLE_HUSTLE_MODULES_META => array(
					'`meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT',
					"`module_id` bigint(20) unsigned NOT NULL DEFAULT '0'",
					'`meta_key` varchar(191) ' . $collate . ' DEFAULT NULL',
					'`meta_value` longtext ' . $collate,
					'PRIMARY KEY (`meta_id`)',
					'KEY `module_id` (`module_id`)',
					'KEY `meta_key` (`meta_key`(191))',
				),
			);
		}

		/**
		 * check tables
		 *
		 * @since 3.x.x
		 *
		 */
		public function check_tables() {
			global $wpdb;
			$name = $wpdb->base_prefix . self::TABLE_HUSTLE_MODULES;
			$sql = $wpdb->prepare( 'SHOW TABLES LIKE %s', $name );
			if ( $wpdb->get_var( $sql ) != $name ) {
				delete_site_option( self::DB_VERSION_KEY );
				return;
			}
			$name = $wpdb->base_prefix . self::TABLE_HUSTLE_MODULES_META;
			$sql = $wpdb->prepare( 'SHOW TABLES LIKE %s', $name );
			if ( $wpdb->get_var( $sql ) != $name ) {
				delete_site_option( self::DB_VERSION_KEY );
				return;
			}
		}
	}

endif;