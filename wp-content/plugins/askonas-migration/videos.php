<?php


class rw_videos extends migrate {
    
    public $table = 'videos';

    

    
    public function init(){
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE status = 'published'  " );
        
        foreach( $results as $result ){
            
            $this->videos[ $result->id ] = $result;
            
        }
        
        $this->video_with_artists();        
        
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
            

            
            $post = array(               
                
                'post_status'	        => 'publish',
                'post_type'				=> 'post',
                'post_author' 			=> 2, 
                
                'post_date' 			=> $row->created_at,                   
                'post_title'			=> trim($row->title),
                'post_content'          => htmlspecialchars_decode($row->description),
                
            );
            
            if( $migrated_post_id ){
                // update
                $post['ID'] = $migrated_post_id;
            }   
            
            $post_id = wp_insert_post( $post );                  
            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            // category
            wp_set_post_categories( $post_id, [41] ); // video category            
   
            // FORMAT
            set_post_format( $post_id , 'video' );
                    
            
            // video type
            $embed = htmlspecialchars_decode( $row->embed );
            if (strpos($embed, '<') !== false) { // EMBED
                update_field( 'field_58b59593c7735', 'Embed', $post_id ); // video type
                update_field( 'field_58b595bbbd0f4', $embed, $post_id ); // embed script 
            } else {
                
                if( $row->type == 'vimeo' ){
                    update_field( 'field_58b59593c7735', 'Vimeo', $post_id ); // video type
                    update_field( 'field_58b595eecbe7f', $embed, $post_id ); // vimeo script                   
                } else {
                    update_field( 'field_58b59593c7735', 'Youtube', $post_id ); // video type
                    update_field( 'field_58b595d27c5fb', $embed, $post_id ); // youtube script                  
                }
                
            }

            // related artists          
            if( isset($row->artists) && count($row->artists) > 0 ){
                update_field( 'field_583d9cfceebf9', $row->artists, $post_id ); 
            }          
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
        
        }
        
        
        $this->show_stats();
        
        
    }
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    public function video_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_artists_wpposts.post_id as wp_artist_id,
            videos.id as video_id
            FROM
            videos
            left JOIN artist_video ON videos.id = artist_video.video_id
            INNER JOIN migrate_artists_wpposts ON artist_video.artist_id = migrate_artists_wpposts.artists_id
            WHERE videos.status = 'published'
        " );

        foreach( $artists as $artist ){
            if( isset($this->videos[ $artist->video_id ]) ){
                $this->videos[ $artist->video_id ]->artists[] = $artist->wp_artist_id;
            }
        }            
        
    }
        
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
}