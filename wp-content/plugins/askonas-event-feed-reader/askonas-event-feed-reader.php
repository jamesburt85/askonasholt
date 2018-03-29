<?php
/*
Plugin Name: AskonasHolt Event Feed Reader
Plugin URI: 
Description: Auto populates events based on xml
Version: 1.0
Author: Paul Reynolds
Author URI: http://www.raiserweb.com
Copyright: AskonasHolt
*/

if( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly



// api class
include( 'api.class.php' );



//
// register cron events (runs every 60 mins)
//

function event_update_run_from_server_cron(){
    
    if( strtok($_SERVER["REQUEST_URI"],'?') == '/home/' && isset( $_GET['events'] ) && $_GET['events'] == "hjk78bewrbl32iunpadsn546098wmnwern324knr" ){
		
		
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);		
		
		$event_api = new event_api;
		
		//$event_api->delete_all_feed_events();
		
		//staging.askonasholt.co.uk/home/?event=hjk78bewrbl32iunpadsn546098wmnwern324knr
		$event_api->refreshAllEvents();
		exit();
    }
}
add_action( 'init', 'event_update_run_from_server_cron' );




// set up schedule
// function rw_event_schedule_activation() {

	// if ( !wp_next_scheduled( 'rw_60min_event_update' ) ) {
		// wp_schedule_event( time(), 'hourly', 'rw_60min_event_update');
	// }

// }
// add_action( 'wp', 'rw_event_schedule_activation' );




// // schedule runner
// function rw_60min_event_update(){
    
    // $event_api = new event_api;
    // //$event_api->refreshAllEvents();
	
	// //$event_api->delete_all_feed_events();
     
// }



//add_action( 'wp', 'rw_60min_event_update' );