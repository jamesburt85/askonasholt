<?php


class rw_tours_projects extends migrate {
    
    
    public $table = 'artists';
    public $post_type = 'touring-partners';
    public $link_table = 'touring_partners';


    
    public function init(){
        
        if( isset( $this->id ) ){
            $where = " AND id = '{$this->id}' ";
        } else {
            $where = '';
        }
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE type='tours' AND status = 'published' {$where} " );
        
        foreach( $results as $result ){
            
            $this->touring_partners[ $result->id ] = $result;

            $this->touring_partners[ $result->id ]->details_array = unserialize( stripslashes( str_replace( '\r\n', '^^' ,$result->details) ) );
            
            //remove ^^
            if( is_array( $this->touring_partners[ $result->id ]->details_array ) ){
                foreach( $this->touring_partners[ $result->id ]->details_array as $key=>$det){
                    $this->touring_partners[ $result->id ]->details_array[$key] = str_replace( '^^', '', $det );
                }
            }  
          
        }
        
        $this->tour_with_disography();
        
        $this->tour_with_reviews();
        
        $this->tour_with_images();    

        $this->tour_with_staff();          
                
        //print_r($this->artists);exit();
      
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->touring_partners as $id=>$row ){
            
            // bail if no name
            if( $row->name == '' ){
                $this->log_error("No title for id {$id}");              
                continue;
            }
            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            

            $post = array(               
                'post_title'			=> trim($row->name),
                'post_status'	        => ( $row->status == 'published' ? 'publish' : 'draft' ),
                'post_type'				=> 'touring-partners',
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
            
            
 
            // assign artist category
            $cat_id = $this->wpdb->get_var( "SELECT post_id FROM migrate_categories_wpposts WHERE categories_id = '$row->category_id' ");
            if( !$cat_id ){
                $cat_ob = get_term_by('name', 'Orchestras', 'touring-partners-type');
                $cat_id = intval($cat_ob->term_id);
            }
            if( $cat_id ){
                wp_set_post_terms( $post_id, [$cat_id], 'touring-partners-type' );
            }
            
            // assign category name to ACF main cateogry
            $term = get_term( $cat_id, 'touring-partners-type' );
            if( $term ){
                if( $term->parent > 0 ){
                    $parent_cat = get_term( $term->parent, 'touring-partners-type' );
                    wp_set_post_terms( $post_id, [$cat_id, $parent_cat->term_id], 'touring-partners-type' );
                    update_field( 'field_58863877f0277', $parent_cat->name, $post_id ); 
                } else {
                    update_field( 'field_58863877f0277', $term->name, $post_id );   
                }
            }
            
                       
            
            
            // bio 
            update_field( 'field_588258ef09551', htmlspecialchars_decode($row->details_array[ $row->details_array['homepage_show'] ]), $post_id );            
            // contact
            update_field( 'field_588258ef0958c', htmlspecialchars_decode($row->details_array['contact']), $post_id ); 
            
            
            // related staff
            if( isset($row->staffs) && count($row->staffs) > 0 ){
                update_field( 'field_588258ef095a2', $row->staffs, $post_id );       
            }
            
            // featured image - NO NEED TO MIGRATE IMAGES
            if( isset( $row->images[0] ) ){
                set_post_thumbnail( $post_id, $row->images[0]->wp_image_id );
            }


            
            $this->flexible_content_row_number = 1;
            

            // Discography
            $this->discography( $row, $post_id );
            
            // review
            $this->reviews( $row, $post_id );

            // gallery 
             if( isset( $row->images ) && count($row->images) > 1 ){
                 $this->add_gallery( $row, $post_id );
             }

            // repetoir
            $this->repertoire( $row, $post_id );

            $this->extra_details( $row, $post_id  );
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
            
        }
        
        
        $this->show_stats();
        
        
    }
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    
    
    public function tour_with_images(){
        
        $images = $this->wpdb->get_results( " 
            SELECT
            artists.id,
            migrate_images_wpposts.post_id as wp_image_id,
            images.credits
            FROM
            artists
            left JOIN artist_image ON artists.id = artist_image.artist_id
            INNER JOIN migrate_images_wpposts ON artist_image.image_id = migrate_images_wpposts.images_id
            inner JOIN images ON migrate_images_wpposts.images_id = images.id
            WHERE artists.type='tours'
            GROUP BY wp_image_id
        " );

        foreach( $images as $image ){
            if( isset($this->touring_partners[ $image->post_id ]) ){
                $this->touring_partners[ $image->post_id ]->images[] = $image;
            }
        }
                
        
    }
    
    
    public function tour_with_disography(){
        
        $albums = $this->wpdb->get_results( "
            SELECT
            artists.id,
            albums.id as album_id,
            albums.*,
            migrate_images_wpposts.post_id as wp_image_id
            FROM
            artists
            inner JOIN albums ON artists.id = albums.artist_id
            left JOIN migrate_images_wpposts ON albums.image_id = migrate_images_wpposts.images_id
            WHERE albums.status = 'published' AND artists.type='tours'
            GROUP BY album_id            
        " );

        foreach( $albums as $album ){
            
            if( isset($this->touring_partners[ $album->artist_id ]) ){
                $this->touring_partners[ $album->artist_id ]->albums[] = $album;
            }
        }
                
        
        
    }
    
    
    public function tour_with_reviews(){
        
        $reviews = $this->wpdb->get_results( "
            SELECT
            pressreviews.id,
            pressreviews.artist_id,
            pressreviews.composer,
            pressreviews.title,
            pressreviews.venue,
            pressreviews.date,
            pressreviews.`status`,
            pressreviews.created_at,
            pressreviews.updated_at,
            reviews.review,
            reviews.citation,
            reviews.url
            FROM
            pressreviews
            Left JOIN reviews ON pressreviews.id = reviews.pressreview_id
            WHERE pressreviews.status = 'published'
        " );
        
        $collapsed_reviews = [];
        
        // condense reviews
        foreach( $reviews as $review ){

            if( ! isset($collapsed_reviews[$review->id]) ){
                $collapsed_reviews[$review->id] = $review;
            }
            
            if( $review->url != '' ){
                $url = "&nbsp;<a href='{$review->url}'>{$review->url}</a>";
            } else {
                $url = '';
            }
            
            if( ! isset($collapsed_reviews[$review->id]->the_review) ){
                $collapsed_reviews[$review->id]->the_review = htmlspecialchars_decode($review->review)."<br/>".$review->citation.$url;                
            } else {
                $collapsed_reviews[$review->id]->the_review .= "<br/><br/>".htmlspecialchars_decode($review->review)."<br/>".$review->citation.$url; 
            }
            

        }
        
        // put into master artsits array
        foreach( $collapsed_reviews as $review ){
        
            if( isset($this->touring_partners[ $review->artist_id ]) ){
                $this->touring_partners[ $review->artist_id ]->reviews[] = $review;
            }  

        }
            
    }

    public function tour_with_staff(){
        
        $staffs = $this->wpdb->get_results( " 
            SELECT
            migrate_staffs_wpposts.post_id as wp_staff_id,
            artists.id
            FROM
            artists
            left JOIN artist_staff ON artists.id = artist_staff.artist_id
            INNER JOIN migrate_staffs_wpposts ON artist_staff.staff_id = migrate_staffs_wpposts.staffs_id
            WHERE artists.type='tours'
            GROUP BY wp_staff_id    
        " );

        foreach( $staffs as $staff ){
            if( isset($this->touring_partners[ $staff->id ]) ){
                $this->touring_partners[ $staff->id ]->staffs[] = $staff->wp_staff_id;
            }
        }        
        
    }
        

        
        
        

    public function tour_partners_with_new_urls(){
        
        $slugs = $this->wpdb->get_results( "
            SELECT
            migrate_touring_partners_wpposts.touring_partners_id as id,
            wp_posts.post_name as slug
            FROM
            migrate_touring_partners_wpposts
            INNER JOIN wp_posts ON migrate_touring_partners_wpposts.post_id = wp_posts.ID
        " );  

        foreach( $slugs as $slug ){
            
            if( isset($this->touring_partners[ $slug->id ]) ){
                
                $url = '/tours-and-projects/touring-partner/'.$slug->slug;
                
                $this->touring_partners[ $slug->id ]->new_url = $url;
                
            }
        }        
        
        
    }        
    
    public function tours_projects_with_old_categories(){
        
        $cats = $this->wpdb->get_results( "
            SELECT
            categories.*,
            artists.id as artist_id
            FROM
            artists
            INNER JOIN artist_category ON artists.id = artist_category.artist_id
            INNER JOIN categories ON artist_category.category_id = categories.id   
            WHERE artists.status = 'published' 
        " );

        foreach( $cats as $cat ){
            
            if( isset($this->touring_partners[ $cat->artist_id ]) ){
                $this->touring_partners[ $cat->artist_id ]->categories_old[] = $cat;
            }
        }
                    
 
    }    
    
    public function geturls(){
        
        $D = '/';
        
        $this->tours_projects_with_old_categories();
        
        $this->tour_partners_with_new_urls();
                
        $urls = [];
        
        foreach( $this->touring_partners as $id=>$row ){
            
            $url = $D. 'tours-and-projects' . $D;  
            
            if( isset( $row->categories_old[0] ) ){
                $url .= $row->categories_old[0]->slug . $D; 
            }           
                       
            $url .= $row->slug;
            
            $urls[ $url ] = $row->new_url;
            
        }

        $this->insert301( $urls, 8 );

        return $urls;
        
    }         
    
}