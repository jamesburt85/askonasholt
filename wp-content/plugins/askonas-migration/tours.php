<?php


class rw_tours extends migrate {
    
    public $table = 'tours';
    public $post_type = 'tours-projects';


    
    public function init(){
        
        if( isset( $this->id ) ){
            $where = " AND id = '{$this->id}' ";
        } else {
            $where = '';
        }
             
             
        $results = $this->wpdb->get_results( "SELECT * FROM tours WHERE status = 'published' {$where} " );
        
        foreach( $results as $result ){
            
            $this->tours[ $result->id ] = $result;
                        
        }
        
        // add events
        $this->tours_with_events();
        
        // add related artists (wordpress id)
        $this->tours_with_artists();
        $this->tours_with_touring_partners();
        


        //print_r( $this->tours );exit();
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->tours as $id=>$row ){

            if( $row->name == '' ){
                $this->log_error("No title for id {$id}");              
                continue;
            }

            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            
            if( $row->country != '' ){
                $name = trim($row->name).", ".trim($row->country);
            } else {
                $name = trim($row->name);
            }
            
            $post = array(               
                'post_title'			=> $name,
                'post_status'	        => 'publish',
                'post_type'             => 'tours-projects',
                'post_author' 			=> 2, 
                'post_date' 			=> $row->created_at,   
            );
            
            if( $migrated_post_id ){
                // update
                $post['ID'] = $migrated_post_id;
            }     
            

            $post_id = wp_insert_post( $post ); 
            if( !$post_id ){
                $this->log_error("Wordpress post creation failed for id {$id}"); 
                continue;
            }            
            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            
            
  
            // assign  category
            if( $row->enddate != '' ){
                $cat_id = false;
                if( strtotime( $row->enddate ) >= strtotime( '2014-09-01' ) && strtotime( $row->enddate ) < strtotime( '2015-08-31' ) ) {
                    // 2014 / 2105
                    $cat_id = 55;  
                } elseif( strtotime( $row->enddate ) >= strtotime( '2015-09-01' ) && strtotime( $row->enddate ) < strtotime( '2016-08-31' ) ) {
                    // 2015 / 2016
                    $cat_id = 54;  
                } elseif( strtotime( $row->enddate ) >= strtotime( '2016-09-01' ) && strtotime( $row->enddate ) < strtotime( '2017-08-31' ) ) {
                    // 2016 / 2017
                    $cat_id = 53;  
                } elseif( strtotime( $row->enddate ) >= strtotime( '2017-09-01' ) && strtotime( $row->enddate ) < strtotime( '2018-08-31' ) ) {
                    // 2016 / 2017
                    $cat_id = 56;  
                }
                if( $cat_id ){
                    wp_set_post_terms( $post_id, [$cat_id], 'tour-season' );
                }
            }
            
            
            
            // end date
            update_field( 'field_5825da227bfcc', $row->enddate, $post_id );             
            // blurb
            update_field( 'field_5825ee8e308e8', $row->description, $post_id ); 
        
         
            // tour events
            if( isset($row->events) && count($row->events)>0 ){
                update_field( 'field_5825eeac308e9', $row->events, $post_id );          
            }
            
            // related artsits
            if( isset($row->artists) && count($row->artists)>0 ){
                update_field( 'field_5838523fe9535', $row->artists, $post_id );          
            }            
            
            // touring partenrs
            if( isset($row->touring_partners) && count($row->touring_partners)>0 ){
                update_field( 'field_58b028417c6d0', $row->touring_partners, $post_id );          
            }    
            
            
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
            //break;
        }
        
        $this->show_stats();        
        
        
    }
    
    


    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc


    
    public function tours_with_events(){
        
        // get all event tours
        $events = $this->wpdb->get_results( " 
            SELECT
            migrate_events_wpposts.post_id as wp_event_id,
            `events`.tour_id
            FROM
            tours
            INNER JOIN `events` ON tours.id = `events`.tour_id
            INNER JOIN migrate_events_wpposts ON `events`.id = migrate_events_wpposts.events_id 
            WHERE `events`.tour_id IS NOT NULL
        " );       
        


        foreach( $events as $event ){
            
            if( isset($this->tours[ $event->tour_id ]) ){
                $this->tours[ $event->tour_id ]->events[] = $event->wp_event_id;
            }
            
        }        
        
    }    
    
    

    

    
    // joins to new wordpress artist id
    public function tours_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            artists.type,
            migrate_artists_wpposts.post_id as wp_artist_id,
            tours.id as tour_id
            FROM
            tours
            left JOIN artist_tour ON tours.id = artist_tour.tour_id
            left JOIN migrate_artists_wpposts ON artist_tour.artist_id = migrate_artists_wpposts.artists_id
            left JOIN artists ON artist_tour.artist_id = artists.id
            where artists.type = 'artist'
            AND tours.status = 'published' 
        " );

        foreach( $artists as $artist ){
            if( isset($this->tours[ $artist->tour_id ]) ){
                $this->tours[ $artist->tour_id ]->artists[] = $artist->wp_artist_id;
            }
        }        
    }
    
    public function tours_with_touring_partners(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_touring_partners_wpposts.post_id AS wp_touring_partner_id,
            tours.id AS tour_id
            FROM
            tours
            left JOIN artist_tour ON tours.id = artist_tour.tour_id
            left JOIN migrate_touring_partners_wpposts ON artist_tour.artist_id = migrate_touring_partners_wpposts.touring_partners_id
            left JOIN artists ON artist_tour.artist_id = artists.id
            where 
            artists.type = 'tours' AND
             tours.status = 'published'
        " );

        foreach( $artists as $touring_partner ){
            if( isset($this->tours[ $touring_partner->tour_id ]) ){
                if( $touring_partner->wp_touring_partner_id != '' ) {
                    $this->tours[ $touring_partner->tour_id ]->touring_partners[] = $touring_partner->wp_touring_partner_id;
                }
            }
        }        
    }    
    
    
}