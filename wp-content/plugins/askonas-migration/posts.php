<?php


class rw_posts extends migrate {
    
    
    public $table = 'posts';
    public $post_type = 'post';


    
    public function init(){
             
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE status = 'published' AND title != '' " );
        
        foreach( $results as $result ){
            
            $this->posts[ $result->id ] = $result;
            
        }
        
        // add images (wordpress id)
        $this->post_with_images();
        
        // add related artists (wordpress id)
        $this->post_with_artists();      
                
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->posts as $id=>$row ){

            // bail if no name
            if( $row->title == '' ){
                $this->log_error("No title for id {$id}");              
                continue;
            }
            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            
            
            if( $row->introduction == '' ){
                $post_content = htmlspecialchars_decode($row->content);
            } else {
                $post_content = htmlspecialchars_decode($row->introduction)."<br/><br/>".htmlspecialchars_decode($row->content);
            }

            $post = array(               
                'post_title'			=> trim($row->title),
                'post_status'	        => 'publish',
                'post_author' 			=> 2, 
                'post_date' 			=> $row->created_at,   
                'post_content'          => $post_content,
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
            $cat_id = get_cat_ID( ucfirst($row->category) ) ;
            wp_set_post_terms( $post_id, [$cat_id], 'category' );
            
         
            // related artists          
            if( isset($row->artists) && count($row->artists) > 0 ){
                update_field( 'field_586d48517a63d', $row->artists, $post_id ); 
            }
            
            
            // featured image
            if( isset( $row->images[0] ) ){
                set_post_thumbnail( $post_id, $row->images[0]->wp_image_id );
            }
            
            $this->flexible_content_row_number = 1;
            
            // gallery
            if( isset( $row->images ) && count($row->images) > 1 ){
                $this->add_gallery( $row, $post_id );
            }
            
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        

        }
        
        $this->show_stats();
        
    }
    
    
    

    
    
     
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    public function post_with_images(){
        
        $images = $this->wpdb->get_results( " 
            SELECT
            posts.id AS post_id,
            migrate_images_wpposts.post_id as wp_image_id,
            images.credits
            FROM
            posts
            LEFT JOIN image_post ON posts.id = image_post.post_id
            INNER JOIN migrate_images_wpposts ON image_post.image_id = migrate_images_wpposts.images_id
            INNER JOIN images ON migrate_images_wpposts.images_id = images.id
            WHERE posts.status = 'published' 
        " );

        foreach( $images as $image ){
            if( isset($this->posts[ $image->post_id ]) ){
                $this->posts[ $image->post_id ]->images[] = $image;
            }
        }
        
        
    }
    
    // joins to new wordpress artist id
    public function post_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_artists_wpposts.post_id as wp_artist_id,
            posts.id as post_id
            FROM
            posts
            Left JOIN artist_post ON posts.id = artist_post.post_id
            inner JOIN migrate_artists_wpposts ON artist_post.artist_id = migrate_artists_wpposts.artists_id
            WHERE posts.status = 'published'  
        " );

        foreach( $artists as $artist ){
            if( isset($this->posts[ $artist->post_id ]) ){
                $this->posts[ $artist->post_id ]->artists[] = $artist->wp_artist_id;
            }
        }        
    }
    
    
    
    
}