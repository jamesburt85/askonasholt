<?php 

// default args 
function events_set_default_args( $page = '' ){
    
    if( $page == 'home' ){
        return [
            'page_number' => 1,
            'per_page'  => 4,
            'date_type' => 'today',
            'date'  => date('Y-m-d'), 
            'location' => '',
        ];
            
    }
    
    return [
        'page_number' => 1,
        'per_page'  => 20,
        'date_type' => 'today',
        'date'  => date('Y-m-d'), 
        'location' => '',
    ];
    
}




// run events query based on args
function events_do_query( $event_args ){
    
    // if not set, call default values
    if( !isset( $event_args['date'] ) ){
        $event_args = events_set_default_args();
    }
    

    $post_per_page = ( isset($event_args['per_page']) ? $event_args['per_page'] : 20 );
    $offset = $post_per_page * ( $event_args['page_number'] - 1 );
    
     
    // Query Args
      $args = array(
        'post_type'   => 'events',
        'posts_per_page' => $post_per_page,
        'offset'        => $offset,
        'meta_key'      => 'date',
        'orderby'     => 'meta_value',
        'order'       => 'ASC',
      );
      
		$args['meta_query'] = array(
			'relation'		=> 'AND',
		);	

        //
        // dates    
        //
        if( $event_args['date_type'] == 'today' ){
        
            $event_args['start_date'] = date('Y-m-d');
            $event_args['end_date'] = date('Y-m-d');
           
        } elseif ( $event_args['date_type'] == 'this_week' ){
            
            $event_args['start_date'] = date('Y-m-d', strtotime('-'.date('w').' days'));
            $event_args['end_date'] = date('Y-m-d', strtotime('+'.(6-date('w')).' days'));           
            
        } elseif ( $event_args['date_type'] == 'this_month' ){
            
            $event_args['start_date'] = date('Y-m-01');
            $event_args['end_date'] = date('Y-m-t');           
            
        } elseif ( $event_args['date_type'] == 'date' ){
            
            $event_args['start_date'] = $event_args['date'];
            $event_args['end_date'] = $event_args['date'];
            
        } else {
            
            $event_args['start_date'] = date('Y-m-d');
            $event_args['end_date'] = date('Y-m-d');   
            
        }
        
        $args['meta_query'][] =
        array(
            'relation' => 'AND',            
            array(
                'key' => 'date',
                'value' => $event_args['start_date'],
                'compare' => '>='
            ),
            array(
                'key' => 'date',
                'value' => $event_args['end_date'],
                'compare' => '<='
            ),
        );



      //      
      // location query
      //
      if( isset($event_args['location']) && $event_args['location'] != '' ){
        $args['meta_query'][] =
            array(
                'relation' => 'OR',
                array(
                    'key'		=> 'venue',
                    'value'		=> $event_args['location'],
                    'compare'	=> 'LIKE'
                ),
                array(
                    'key'		=> 'city',
                    'value'		=> $event_args['location'],
                    'compare'	=> 'LIKE'
                ),            
           );
      }

    // The Query
    return new WP_Query( $args ); 

    
}





// gets the events based on ajax params
function get_events(){
     
     global $event_args;
     
     $data = $_POST['data'];
	 $event_args = array();
	 foreach( $data as $d ){	
	 	$event_args[$d['name']] = $d['value'];		
	 }
        
     get_template_part( 'template-parts/content-events-home'); 
         
     die();
         
}
add_action( 'wp_ajax_nopriv_events_ajax_get_events', 'get_events' );
add_action( 'wp_ajax_events_ajax_get_events', 'get_events' );