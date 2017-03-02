<?php


class rw_staffs extends migrate {
    
    public $table = 'staffs';
    



    
    public function init(){
        
        if( isset( $this->id ) ){
            $where = " WHERE id = '{$this->id}' ";
        } else {
            $where = '';
        }       
        
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table {$where} " );
        
        foreach( $results as $result ){
            
            $this->staffs[ $result->id ] = $result;
            
        }
        
        // add image
        $this->staff_with_image();
        
        $this->staff_with_artists();
        
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->staffs as $id=>$row ){

            // bail if no name
            if( $row->forename == '' && $row->surname == '' ){
                $this->log_error("No forenameand surname for id {$id}");              
                continue;
            }

            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            

            $post = array(               
                'post_title'			=> trim($row->forename)." ".trim($row->surname),
                'post_status'	        => 'publish',
                'post_type'				=> 'people',
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
            
            
            
            
            
            
            
            // assign staff category
            $cat_id = $this->wpdb->get_var( "SELECT post_id FROM migrate_categories_wpposts WHERE categories_id = '$row->category_id' ");
            wp_set_post_terms( $post_id, [$cat_id], 'people-type' );
            
         
            // position          
            update_field( 'field_582dbb96ec1d9', $row->jobtitle, $post_id ); 
            
            //email
            update_field( 'field_5835b5db190e7', $row->email, $post_id ); 
            //tel
            update_field( 'field_5835b5ef190e8', $row->phone, $post_id ); 
            
            
            // related artists
            if( isset($row->artists) && count($row->artists) > 0 ){
                update_field( 'field_583d707b0e444', $row->artists, $post_id ); 
            }
            
            
            // featured image
            if( isset( $row->image ) ){
                set_post_thumbnail( $post_id, $row->image );
            }
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
            //break;
        }
        
        $this->show_stats();
        
        
    }
    
    


    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    public function staff_with_image(){
        
        $images = $this->wpdb->get_results( " 
            SELECT
            migrate_images_wpposts.post_id as wp_image_id,
            staffs.id as staff_id
            FROM
            staffs
            inner JOIN migrate_images_wpposts ON staffs.image_id = migrate_images_wpposts.images_id

        " );

        foreach( $images as $image ){
            if( isset($this->staffs[ $image->staff_id ]) ){
                $this->staffs[ $image->staff_id ]->image = $image->wp_image_id;
            }
        }
        
    }
    
    
    
    public function staff_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            staffs.id,
            artist_staff.staff_id,
            migrate_artists_wpposts.post_id as wp_artist_id
            FROM
            staffs
            left JOIN artist_staff ON staffs.id = artist_staff.staff_id
            inner JOIN migrate_artists_wpposts ON artist_staff.artist_id = migrate_artists_wpposts.artists_id
        " );

        foreach( $artists as $artist ){
            
            if( isset($this->staffs[ $artist->staff_id ]) ){
                $this->staffs[ $artist->staff_id ]->artists[] = $artist->wp_artist_id;
            }
            
        }        
        
    }
    
    
    
    
    public function staff_with_new_urls(){
        
        $slugs = $this->wpdb->get_results( "
            SELECT
            migrate_staffs_wpposts.staffs_id as staff_id,
            wp_posts.post_name as slug
            FROM
            migrate_staffs_wpposts
            INNER JOIN wp_posts ON migrate_staffs_wpposts.post_id = wp_posts.ID
        " );  

        foreach( $slugs as $slug ){
            
            if( isset($this->staffs[ $slug->staff_id ]) ){
                
                $url = '/about/people/'.$slug->slug;
                
                $this->staffs[ $slug->staff_id ]->new_url = $url;
                
            }
        }        
        
        
    }        
    
    
    
    public function geturls(){
        
        $D = '/';
        
        $this->staff_with_new_urls();
                
        $urls = [];
        
        foreach( $this->staffs as $id=>$row ){
            
            $url = $D. 'about/staff' . $D;    
                     
            $url .= $id;
            
            $urls[ $url ] = $row->new_url;
            
        }
        
        $this->insert301( $urls, 6 );
   
        return $urls;
        
    }        
    
    

    
}