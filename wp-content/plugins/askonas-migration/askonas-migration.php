<?php
/*
Plugin Name: AskonasHolt Migration Scripts
Plugin URI: 
Description: 
Version: 1.0
Author: Paul Reynolds
Author URI: http://www.raiserweb.com
Copyright: AskonasHolt
*/

if( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly


include( 'migrate.class.php' );
include( 'categories.php' );
include( 'artists.php' );
include( 'videos.php' );
include( 'audio.php' );
include( 'staff.php' );
include( 'posts.php' );
include( 'images.php' );
include( 'tours.php' );
include( 'events.php' );
include( 'tours-projects.php' );

function the_migrations_to_run(){

    if( strtok($_SERVER["REQUEST_URI"],'?') == '/home/' && isset($_GET['run']) ){
        
        function audio(){
            
            $migrate = new rw_audio( [ 'from'=>939, 'to'=>944 ] );
            
            $migrate->migrate_init();
            
        }
        if( $_GET['run'] == 'audio' ){
            audio();         
        }     
        
         function video(){
            
            $migrate = new rw_videos(  );
            
            $migrate->migrate_init();
            
        }
        if( $_GET['run'] == 'video' ){
            video();         
        }  
        
        function images(){
            
            $migrate = new rw_images( [ 'from'=>12743, 'to'=>12841 ] );
            
            $migrate->migrate_init();            
            
        }
        if( $_GET['run'] == 'images' ){
            images();         
        }
        
        
        
        
        
        function artist_cats(){
            
            $cats = new rw_categories;
            
            $cats->artists_cats();
            
            $cats->insert_cats( 'artist-type' );
        
        }
        if( $_GET['run'] == 'artist_cats' ){
            artist_cats();         
        }
        
        

        
        function staff_cats(){
            
            $cats = new rw_categories;
            
            $cats->staffs_cats();
            
            $cats->insert_cats( 'people-type' );
        
        }  
        if( $_GET['run'] == 'staff_cats' ){
            staff_cats();         
        }       
        
        function tour_cats(){
            
            $cats = new rw_categories;
            
            $cats->tour_cats();
            
            $cats->insert_cats( 'touring-partners-type' );
        
        }  
        if( $_GET['run'] == 'tour_cats' ){
            tour_cats();         
        }

        
        
        function events(){
            
            $migrate = new rw_events(  );
            
            $migrate->migrate_init();   

            //$migrate->delete_all_migrated_data();            
            
        }
        if( $_GET['run'] == 'events' ){
            events();         
        }         
        
        function staff(){
            
            $migrate = new rw_staffs(  );
            
            //$migrate->migrate_init();     

            $migrate->geturls();             
            
        }
        if( $_GET['run'] == 'staff' ){
            staff();         
        }    
        
        
        


        function artists(){
            
            $migrate = new rw_artists(  );
            
            //$migrate->migrate_init();   

            //$migrate->delete_all_migrated_data();  

            $migrate->geturls();            
            
        }
        if( $_GET['run'] == 'artists' ){
            artists();         
        } 


        function tours_projects(){
            
            $migrate = new rw_tours_projects(  );
            
            //$migrate->migrate_init(); 

            //$migrate->delete_all_migrated_data();    

            $migrate->geturls();             
           
            
        }
        if( $_GET['run'] == 'tours_projects' ){
            tours_projects();         
        } 

        
        
        function posts(  ){
            
            $migrate = new rw_posts( [ 'from'=>1728, 'to'=>1763 ] );
            
            $migrate->migrate_init();

            //$migrate->delete_all_migrated_data();   
                
            //$migrate->geturls(); 
            
        }
        if( $_GET['run'] == 'posts' ){
            posts();         
        }         
        
        

        

        function tours(){
            
            $migrate = new rw_tours(  );
            
            //$migrate->migrate_init(); 

            //$migrate->delete_all_migrated_data(); 

            $migrate->geturls();             
            
        }
        if( $_GET['run'] == 'tours' ){
            tours();         
        }         
         
       
        
        
        

        exit();
        
    }
}
add_action( 'wp_loaded', 'the_migrations_to_run' );
