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
// register  cron events (runs every 60 mins)
//

//new 30 min schedule
function rw_cron_schedules($schedules){
    if(!isset($schedules["60min"])){
        $schedules["60min"] = array(
            'interval' => 60*60,
            'display' => __('Once every 60 minutes'));
    }
    return $schedules;
}
add_filter('cron_schedules','rw_cron_schedules');



// set up schedule
function rw_event_schedule_activation() {

	if ( !wp_next_scheduled( 'rw_60min_event_update' ) ) {
		wp_schedule_event( time(), '60min', 'rw_60min_event_update');
	}

}
add_action( 'wp', 'rw_event_schedule_activation' );




// schedule runner
function rw_60min_event_update(){
    
    $event_api = new event_api;
    $event_api->refreshAllEvents();
     
}