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




// set up schedule
function rw_event_schedule_activation() {

	if ( !wp_next_scheduled( 'rw_60min_event_update' ) ) {
		wp_schedule_event( time(), 'hourly', 'rw_60min_event_update');
	}

}
add_action( 'wp', 'rw_event_schedule_activation' );




// schedule runner
function rw_60min_event_update(){
    
    $event_api = new event_api;
    $event_api->refreshAllEvents();
     
}