<?php

if (!defined('ABSPATH')) die('No direct access allowed');

class WP_Optimize_Database_Information {

	const UNKNOWN_DB = 'unknown';
	const MARIA_DB = 'MariaDB';
	const PERCONA_DB = 'Percona';
	// for some reason coding standard parser give error here WordPress.DB.RestrictedFunctions.mysql_mysql_db
	// @codingStandardsIgnoreLine
	const MYSQL_DB = 'MysqlDB';

	const MYISAM_ENGINE = 'MyISAM';
	const MEMORY_ENGINE = 'Memory';
	const INNODB_ENGINE = 'InnoDB';
	const ARCHIVE_ENGINE = 'ARCHIVE';
	const NDB_ENGINE = 'NDB';
	const ARIA_ENGINE = 'Aria'; // MariaDB

	/**
	 * Returns server type MySQL or MariaDB if mysql database or Unknown if not mysql.
	 *
	 * @return string
	 */
	public function get_server_type() {
		global $wpdb;
		static $server_type = null;

		if (!$wpdb->is_mysql) return self::UNKNOWN_DB;

		if (null !== $server_type) return $server_type;

		$server_type = self::MYSQL_DB;

		$variables = $wpdb->get_results('SHOW SESSION VARIABLES LIKE "version%"');

		if (!empty($variables)) {
			foreach ($variables as $variable) {
				if (preg_match('/mariadb/i', $variable->Value)) {
					$server_type = self::MARIA_DB;
				}
				if (preg_match('/percona/i', $variable->Value)) {
					$server_type = self::PERCONA_DB;
				}
			}
		}

		return $server_type;
	}

	/**
	 * Returns database server version
	 *
	 * @return string|bool
	 */
	public function get_version() {
		$version = $this->get_option_value('version');

		if (!empty($version)) {
			if (preg_match('/^(\d+)(\.\d+)+/', $version, $match)) {
				return $match[0];
			}
		}

		return false;
	}

	/**
	 * Return table type by $table_name.
	 *
	 * @param String $table_name Database table name.
	 * @return String|Boolean - returns false upon failure
	 */
	public function get_table_type($table_name) {
		$table_info = $this->get_table_status($table_name);

		if ($table_info) {
			return $table_info->Engine;
		}

		return false;
	}

	/**
	 * Returns information about database table.
	 *
	 * @param string $table_name
	 * @return bool|mixed
	 */
	public function get_table_status($table_name) {
		$tables_info = $this->get_show_table_status();

		foreach ($tables_info as $table_info) {
			if ($table_name == $table_info->Name) return $table_info;
		}

		return false;
	}

	/**
	 * Returns result for query SHOW TABLE STATUS.
	 *
	 * @return array
	 */
	public function get_show_table_status() {
		global $wpdb;
		static $tables_info = array();

		if (empty($tables_info)) {
			$tables_info = $wpdb->get_results('SHOW TABLE STATUS');
		}

		return $tables_info;
	}

	/**
	 * Returns true if DDL supported.
	 *
	 * @return bool
	 */
	public function has_online_ddl() {
		if (self::MYSQL_DB == $this->get_server_type()) {
			if (version_compare($this->get_version(), '5.7', '>=')) {
				return true;
			} else {
				return false;
			}
		} elseif (self::MARIA_DB == $this->get_server_type()) {
			if (version_compare($this->get_version(), '10.0.0', '>=')) {
				return true;
			} else {
				return false;
			}
		}

		return false;
	}

	/**
	 * Returns database option variable
	 *
	 * @param string $option_name Name of database option.
	 * @return mixed|null
	 */
	public function get_option_value($option_name) {
		global $wpdb;
		static $options = array();

		if (array_key_exists($option_name, $options)) return $options[$option_name];

		$option = $wpdb->get_row(
			$wpdb->prepare('SHOW SESSION VARIABLES LIKE %s', $option_name)
		);

		if (!empty($option)) {
			$options[$option_name] = $option->Value;
			return $option->Value;
		}

		return null;
	}

	/**
	 * Returns true if database option $option_name
	 *
	 * @param string $option_name Name of database option name.
	 * @return bool
	 */
	public function is_option_enabled($option_name) {
		$option_value = $this->get_option_value($option_name);

		if ('ON' == strtoupper($option_value)) return true;
		return false;
	}

	/**
	 * Returns true if table $table_name is optimizable
	 *
	 * @param string $table_name Name of database table
	 * @return bool
	 */
	public function is_table_optimizable($table_name) {
		$server_type = $this->get_server_type();
		$server_version = $this->get_version();
		$table_type = $this->get_table_type($table_name);

		// return true if table is MyISAM.
		if (self::MYISAM_ENGINE == $table_type) return true;

		// return true if table is Archive or Aria.
		if (self::ARCHIVE_ENGINE == $table_type || self::ARIA_ENGINE == $table_type) return true;

		// if InnoDB then check if we can optimize.
		if (self::INNODB_ENGINE == $table_type) {
			// check for MysqlDB.
			if (self::MYSQL_DB == $server_type && $this->has_online_ddl()) {
				return true;
			}

			// check for MariaDB.
			if (self::MARIA_DB == $server_type) {
				// if innodb_file_per_table enabled or version not older than 10.1.1 and innodb_defragment enabled.
				if ($this->is_option_enabled('innodb_file_per_table') || (version_compare($server_version, '10.1.1', '>=') && $this->is_option_enabled('innodb_defragment'))) {
					return true;
				}
			}
		}

		// otherwise return false.
		return false;
	}

	/**
	 * Returns true if table type is supported for optimization.
	 *
	 * @param string $table_name Name of database table
	 * @return bool
	 */
	public function is_table_type_supported($table_name) {
		$table_type = $this->get_table_type($table_name);

		$supported_table_types = array(
			self::MYISAM_ENGINE,
			self::INNODB_ENGINE,
			self::ARCHIVE_ENGINE,
			self::ARIA_ENGINE,
		);

		return in_array($table_type, $supported_table_types);
	}

	/**
	 * Returns true if table needing repair.
	 *
	 * @param string $table_name Database table name.
	 */
	public function is_table_needing_repair($table_name) {
		// code it later.
	}
}