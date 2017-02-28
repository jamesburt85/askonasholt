<?php

// these are events, that have a tour_id

//make index - events: tour_id, artist_event:event_id

class rw_events extends migrate {
    
    public $table = 'events';
    


    
    public function init(){
        
        
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE tour_id != '' " );
        
        foreach( $results as $result ){
            
            $this->events[ $result->id ] = $result;
            
        }
        
  
        // add related artists (wordpress id)
        $this->events_with_artists();
        $this->events_with_touring_partners();

        //print_r( $this->events );exit();
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->events as $id=>$row ){

            if( $row->venue == '' ){
                $name = date( 'd/m/Y H:i', strtotime($row->datetime))." - ".$row->name;
            } else {
                $name = date( 'd/m/Y H:i', strtotime($row->datetime))." - ".$row->venue.", ".$row->city;
            }
            
  
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            

            $post = array(               
                'post_title'			=> $name,
                'post_status'	        => 'publish',
                'post_type'             => 'events',
                'post_author' 			=> 2, 
                'post_date' 			=> $row->created_at,   
            );
            
            if( $migrated_post_id ){
                // update
                $post['ID'] = $migrated_post_id;
            }     
            

            $post_id = wp_insert_post( $post ); 
            if( !$post_id ){
                $this->log_error("Wordpress event creation failed for id {$id}"); 
                continue;
            }            
            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            
            
  
            // TIME (timepicker)
            update_field( 'field_583eeb4d8033c', date( 'H:i', strtotime($row->datetime)), $post_id ); 
            
            // Date (datepicker)
            update_field( 'field_582c4525af917', date( 'Y-m-d', strtotime($row->datetime)), $post_id ); 
            
            //End date (datepicker)
            update_field( '3field_584185198caee', date( 'Y-m-d', strtotime($row->datetime)), $post_id );    

            // Venue (text)
            update_field( 'field_582c4568af918', $row->venue, $post_id );    
            
            // City (text)
            update_field( 'field_582c4579af919', $row->city, $post_id );     

            // More Info (textarea)
            update_field( 'field_582c457faf91a', $row->programme, $post_id );  
            
            if( isset($row->artists) && count($row->artists)>0 ){
                update_field( 'field_583c193f32f52', $row->artists, $post_id ); 
            }
            if( isset($row->touring_parnters) && count($row->touring_parnters)>0 ){
                update_field( 'field_58b0470550e4a', $row->touring_parnters, $post_id ); 
            }            
            

            
            
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
            //break;
        }
        
        $this->show_stats();        
        
        
    }
    
    


    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    

    

    
    // joins to new wordpress artist id
    public function events_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_artists_wpposts.post_id as wp_artist_id
            `events`.id as event_id
            FROM
            `events`
            left JOIN tours ON `events`.tour_id = tours.id
            left JOIN artist_tour ON tours.id = artist_tour.tour_id
            INNER JOIN migrate_artists_wpposts ON artist_tour.artist_id = migrate_artists_wpposts.artists_id
            WHERE `events`.tour_id IS NOT NULL 
        " );

        foreach( $artists as $artist ){
            
            if( isset($this->events[ $artist->event_id ]) ) {
                $this->events[ $artist->event_id ]->artists[] = $artist->wp_artist_id;
            }
            
        }        
    }
    
    public function events_with_touring_partners(){
        
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_touring_partners_wpposts.post_id as wp_touring_partners_id,
            `events`.id as event_id
            FROM
            `events`
            left JOIN tours ON `events`.tour_id = tours.id
            left JOIN artist_tour ON tours.id = artist_tour.tour_id
            INNER JOIN migrate_touring_partners_wpposts ON artist_tour.artist_id = migrate_touring_partners_wpposts.touring_partners_id
            WHERE `events`.tour_id IS NOT NULL 
        " );

        foreach( $artists as $artist ){
            
            if( isset($this->events[ $artist->event_id ]) ) {
                $this->events[ $artist->event_id ]->touring_parnters[] = $artist->wp_touring_partners_id;
            }
            
        }           
        
    }
    
    
    
    
}