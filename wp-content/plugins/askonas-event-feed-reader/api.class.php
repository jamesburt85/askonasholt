<?php


class event_api {
    
	public function __construct(){
        
        // set large limits for scripts to run
        ini_set('max_execution_time', 1200); 
        ini_set('memory_limit', '4095M');   
		ini_set("allow_url_fopen", 1);
        
        // if( $_SERVER['REMOTE_ADDR'] == "::1" ) {
            // $this->xml_file 		= '..\askonas_event\ToscaActivities.xml'; 
        // } else {
            // //$this->xml_file 		= '../httpdocs/79.170.44.26/import/ToscaActivities.XML'; // currently relative from wordpress root
            // $this->xml_file 		= 'import/ToscaActivities.XML'; // currently relative from wordpress root    	
        // }

        $this->xml_file 		= 'http://feeds.overturehq.com/feeds/7418ed17/0/3/performances.xml';   
		//$this->xml_file 		= '..\askonas_event\ToscaActivities.xml'; 
		
	}

    
    
    // main function to refresh all events
    public function refreshAllEvents(){
        
       $data = $this->xml_to_object();
              
       $events = $this->events_xml_walker( $data );
	   
	   // echo "<pre>";
	   // print_r( $events );
	   // exit();
       
       $this->save_events_into_wp( $events );
        
    }
    
    
    
    public function delete_all_feed_events(){
		
		global $wpdb;
		
        $all_events = get_posts([
			//'fields'          => 'ids',
            'posts_per_page'  => -1,
            'post_type'     => 'events',
            'post_status'	=> 'publish',
			'meta_key'		=> 'feed_created',
			'meta_value'	=> true,         
        ]);
				
		foreach( $all_events as $event ) {
			$wpdb->delete( $wpdb->posts, array( 'ID' => $event->ID ) );
			//wp_delete_post( $event, true );
		}
		
	}
    
    
    private function save_events_into_wp( $events ){
        
        // get all events previoulsy uploaded by system (feed_created = true)
        $all_events = get_posts([
            'posts_per_page'   => -1,
            'post_type'     => 'events',
            'post_status'	=> 'publish',
			'meta_key'		=> 'feed_created',
			'meta_value'	=> true,         
        ]);

        $post_ids_saved = [];
        
        foreach( $events as $event ) {
            
            
             $post = array(               
                'post_title'			=> (string)$event->wp_name,
                'post_status'	        => 'publish',
                'post_type'				=> 'events',
                'post_author' 			=> 2, // NEED TO CHANGE?
                //'post_date' 			=> date('Y-m-d H:i:s'),   
                'post_date' 			=> '2017-01-01 00:00:00',                     
            );           
                
                
            // check if event title matches
            $exists = $this->check_event_title_exists( $all_events, $event );             
            if( $exists ){
                // if yes update
                $post['ID'] = $exists->ID;                                 
            } 
            
            $post_id = wp_insert_post( $post );                
            add_post_meta( $post_id, 'feed_created', true );
                           
            $this->wp_event_acf_update( $event, $post_id );             
                      
            $post_ids_saved[] = $post_id;

        }
        
        // clean up non updated or inserted events previously inserted by the feed
        $this->remove_events_not_in_xml( $all_events, $post_ids_saved );
        
    }
    
    
    private function remove_events_not_in_xml( $all_events, $post_ids_saved ){
		
        global $wpdb;
		
        foreach( $all_events as $event ){
            
            if( !in_array( $event->ID, $post_ids_saved ) ){
                //$wpdb->delete( $wpdb->posts, array( 'ID' => $event->ID ) );
                $result = $wpdb->query( 
                    $wpdb->prepare("
                        DELETE posts,pm
                        FROM ".$wpdb->posts." posts
                        LEFT JOIN ".$wpdb->prefix."postmeta pm ON pm.post_id = posts.ID
                        WHERE posts.post_type = 'events'
                        AND posts.ID = %d
                        ",
                        $event->ID
                    ) 
                );
            }
            
        }
        
    }
    
    
    private function wp_event_acf_update( $event, $post_id ){
        
        // TIME (timepicker)
        update_field( 'field_583eeb4d8033c', (string)$event->Time, $post_id ); 
        
        // Date (datepicker)
        list($d,$m,$y) = explode('/', (string)$event->Date );
        $date = "{$y}{$m}{$d}";
        update_field( 'field_582c4525af917', $date, $post_id ); 
        
        //End date (datepicker)
        update_field( '3field_584185198caee', $date, $post_id );    

        // Venue (text)
        update_field( 'field_582c4568af918', (string)$event->Venue, $post_id );    
        
        // City (text)
        update_field( 'field_582c4579af919', (string)$event->City, $post_id );     

        // More Info (textarea)
        update_field( 'field_582c457faf91a', (string)$event->Programme, $post_id );  
        
        // related artsits (relationship)
        $artists_arr = explode( ',', substr( (string)$event->artist_ids, 1 ) );
        update_field( 'field_583c193f32f52', $artists_arr, $post_id );    
		
		// location field (field_5836bb72cd9b0)
		$location = array("address" => (string)$event->address_string, "lat" => (string)$event->Latitude, "lng" => (string)$event->Longitude);
        update_field( 'field_5836bb72cd9b0', $location, $post_id );     
		
    }
    
    
    private function check_event_title_exists( $all_events, $event ){
        
        $test = false;
        
        foreach( $all_events as $event_test ){
            if( (string)$event_test->post_title == (string)$event->wp_name ){
                $test = $event_test;
                return $test;
            }
            
        }

        return $test;        
    }
    
    
    private function events_xml_walker( $xml ){
        
        if( !isset( $xml->Activity ) ){
            return false;
        }   
        
        $events = [];
        
        $count = 0;
        foreach( $xml->Activity as $event ){
            
            // create unique event string
            $event->unique_string = $this->create_event_unique_string( $event ); 

            

            ///////////////////////////////////////////////////////////
            // set up / clean data 
            ///////////////////////////////////////////////////////////

            $event->Artist = trim( $event->Artist );
			$event->City = strtoupper( $event->City );
            
            // clean data
            if( $event->Time == 'TBA' ){ $event->Time = '00:00'; }
            
            // timestamp
            list($d,$m,$y) = explode('/', $event->Date );
            $event->timestamp = "{$y}-{$m}-{$d} ".$event->Time.':00';  

			// create address
			$event->address_string = $this->create_event_address_string( $event ); 
            
            // unique import id
            $event->count = $count;
            $count++;
            

            
            
            
            /////////////////////////////////////////////////////////
            // dupe check
            // check if duplicated (ie already in events array) (when multiple artists, the feed duplicates the event details, with differernt artists            
            /////////////////////////////////////////////////////////
            $dupe_key = $this->check_if_dupe( $events, $event );
            if( $dupe_key != -1 ){
                if( isset( $events[$dupe_key]->artist_ids ) ){
                    $event->artist_ids = $events[$dupe_key]->artist_ids;
                }
                $event->artist_names = $events[$dupe_key]->artist_names;
            }

            // artist name find
            $artist_lookup = $this->get_wp_artist( $event->Artist );           
            if( $artist_lookup !== null ){
                $event->artist_ids = $event->artist_ids .",". $artist_lookup->ID;
            }             
            
            if( isset( $event->artist_names ) ){
                $event->artist_names = $event->artist_names.", ".$event->Artist;
            } else {
                $event->artist_names = $event->Artist;
            }
            
            // create event name
            $event->wp_name = $this->create_event_wp_name( $event ); 
            
            
            ////////////////////////////////////////////////////////////
            // Save
            // add to events array, or overwrite dupe entry
            ////////////////////////////////////////////////////////////
            if( $dupe_key != -1 ){
                $events[$dupe_key] = $event;
            } else {
                $events[] = $event;
            }            
            

        }
       // echo "<pre>";
       // print_r( $events );exit;
        return $events;
        
    }
    
    private function check_if_dupe( $events, $event ){
        
        $event_key = -1;
        foreach( $events as $key=>$event_test ){

            if( (string)$event_test->unique_string == (string)$event->unique_string ){
                $event_key = $key;
                break;
            }
            
        }

        return $event_key;
        
    }
    
    
    
    private function create_event_wp_name( $event ){
        
        // format is, artist names (comma seperated), - date, time, venue, city
        $string = $event->artist_names." - ".$event->Date." ".$event->Time." - ".$event->Venue.", ".$event->City;
        
        return $string;  
        
        
    }
	
	private function create_event_address_string( $event ){
		
        $string = $event->Venue.", ".$event->City.", ".$event->Country;
        
        return $string;	
		
	}
    
    private function create_event_unique_string( $event ){
        
        $string = $event->Date." ".$event->Time." ".$event->Venue." ".$event->City." ".$event->Country;
        
        return $string;
        
    }    
    
     // lookup post_title (exact match) in post_type = artists
    private function get_wp_artist( $name ){
        global $wpdb;

        $name = sanitize_text_field( html_entity_decode( $name ) );
        
        $artist = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->posts WHERE post_title = %s AND post_type = 'artists'", $name ) );

        return $artist;   
        
    }  
    
    
    private function xml_to_object(){
		
		
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $this->xml_file);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		// get the result of http query
		$output = curl_exec($ch);
		curl_close($ch);

       
        $xml = simplexml_load_string( $output ) or die("Error: Cannot create object");   

        return $xml;
        
    }

    
}


