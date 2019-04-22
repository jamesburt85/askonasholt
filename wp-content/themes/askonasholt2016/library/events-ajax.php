<?php 

// default args 
function events_set_default_args( $page = '' ){
    
    // if( $page == 'home' ){
    //     return [
    //         'page_number' => 1,
    //         'per_page'  => -1,
    //         'date_type' => 'today_onwards',
    //         'date'  => date('Ymd'), 
    //         'location' => '',
    //     ];
    // }
    
    return [
        'page_number' => 1,
        'per_page'  => -1,
        'date_type' => 'today',
        'date'  => date('Ymd'), 
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
        'orderby'     => array(
            'date_clause'   => 'ASC',
            'time_clause'   => 'ASC'
        ),
      );
      
        $args['meta_query'] = array(
            'relation'      => 'AND',
        );  

        //
        // dates    
        //
        if( $event_args['date_type'] == 'today' ){
        
            $event_args['single_date'] = date('Ymd');
           
        } elseif ( $event_args['date_type'] == 'this_week' ){
            
            $event_args['start_date'] = date('Ymd', strtotime('-'.date('w').' days'));
            $event_args['end_date'] = date('Ymd', strtotime('+'.(6-date('w')).' days'));           
            
        } elseif ( $event_args['date_type'] == 'this_month' ){
            
            $event_args['start_date'] = date('Ym01');
            $event_args['end_date'] = date('Ymt');           
            
        } elseif ( $event_args['date_type'] == 'today_onwards' ){

            $event_args['single_date_onwards'] = date('Ymd');

        } elseif ( $event_args['date_type'] == 'date' ){

            $event_args['single_date'] = $event_args['date'];

        } else {
            
            $event_args['single_date'] = date('Ymd');
            
        }

        if( isset( $event_args['single_date'] ) ){

            $args['meta_query'][] =
            array(
                'relation' => 'AND',            
                'date_clause' => array(
                    'key'       => 'date',
                    'value'     => $event_args['single_date'],
                    'compare' => '=',
                    'type'    => 'DATE',
                ),
                'time_clause' => array(
                    'key'=>'time',
                    'compare'=>'EXISTS'
                ),
            );

        } elseif( isset( $event_args['single_date_onwards'] ) ){

            $args['meta_query'][] =
            array(
                'relation' => 'AND',            
                'date_clause' => array(
                    'key'       => 'date',
                    'value'     => $event_args['single_date_onwards'],
                    'compare' => '>=',
                    'type'    => 'DATE',
                ),
                'time_clause' => array(
                    'key'=>'time',
                    'compare'=>'EXISTS'
                ),
            );

        } else {

            $args['meta_query'][] =
            array(
                'relation' => 'AND',            
                'date_clause' => array(
                    'key'       => 'date',
                    'value'     => array( $event_args['start_date'], $event_args['end_date'] ),
                    'compare' => 'BETWEEN',
                    'type'    => 'DATE',
                ),
                'time_clause' => array(
                    'key'=>'time',
                    'compare'=>'EXISTS'
                ),
            );

        }

      //      
      // location query
      //
      if( isset($event_args['location']) && $event_args['location'] != '' ){
        $args['meta_query'][] =
            array(
                'relation' => 'OR',
                array(
                    'key'       => 'venue',
                    'value'     => $event_args['location'],
                    'compare'   => 'LIKE'
                ),
                array(
                    'key'       => 'city',
                    'value'     => $event_args['location'],
                    'compare'   => 'LIKE'
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