<?php


class rw_videos extends migrate {
    
    public $table = 'videos';

    

    
    public function init(){
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE status = 'published'  " );
        
        foreach( $results as $result ){
            
            $this->videos[ $result->id ] = $result;
            
        }
        
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->videos as $id=>$row ){
        
            // update or insert
            if( $row->title == '' ){
                $this->log_error("No title for id {$id}");              
                continue;
            }

            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            

            // insert
            $post = array(               
                'post_title'			=> trim($row->title),
                'post_status'	        => 'publish',
                'post_type'				=> 'artists',
                'post_author' 			=> 2, 
                //'post_date' 			=> date('Y-m-d H:i:s'),   
                'post_date' 			=> '2017-01-01 00:00:00',                     
            );
            
            if( $migrated_post_id ){
                // update
                $post['ID'] = $migrated_post_id;
            }     


            
            $post_id = wp_insert_post( $post );      
            if( !$post_id ){
                $this->log_error("Wordpress videos creation failed for id {$id}"); 
                continue;
            }            
            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
        
        }
        
        
        $this->show_stats();
        
        
    }
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
}