<?php


class rw_artists extends migrate {
    
    
    public $table = 'artists';
    public $post_type = 'artists';



    
    public function init(){
        
        if( isset( $this->id ) ){
            $where = " AND id = '{$this->id}' ";
        } else {
            $where = '';
        }
                
        $artists = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE type='artist' AND status = 'published' {$where} " );
        
        foreach( $artists as $artist ){
            
            $this->artists[ $artist->id ] = $artist;

            $this->artists[ $artist->id ]->details_array = unserialize( stripslashes( str_replace( '\r\n', '^^' ,$artist->details) ) );
            
            //remove ^^
            if( is_array( $this->artists[ $artist->id ]->details_array ) ){
                foreach( $this->artists[ $artist->id ]->details_array as $key=>$det){
                    $this->artists[ $artist->id ]->details_array[$key] = str_replace( '^^', '', $det );
                }
            }  
          
        }
        
        $this->artsits_with_disography();
        
        $this->artsits_with_reviews();
        
        $this->artists_with_categories();
        
        //$this->artsits_with_images();        
                
        //print_r($this->artists);exit();
        
        
        
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->artists as $id=>$row ){
            
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
                'post_type'				=> 'artists',
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
            
            // categories
            if( isset( $row->categories ) && count($row->categories) > 0 ){                
                $cat_ids = $row->categories;        
                wp_set_post_terms( $post_id, $cat_ids, 'artist-type' );
                // assign parent
                $parent = false;
                foreach( $row->categories as $category ){
                    $term = get_term( $category, 'artist-type' );
                    if( $term->parent > 0 ){
                        $parent_cat = get_term( $term->parent, 'artist-type' );
                        update_field( 'field_588637e854b37', $parent_cat->name, $post_id );  
                        $parent = true;
                    }
                }
                if( !$parent ){
                    $term = get_term( $row->categories[0], 'artist-type' );
                    update_field( 'field_588637e854b37', $term->name, $post_id );                     
                }
                
            } else {               
                $cat_ob = get_term_by('name', 'Instrumentalists', 'artist-type');
                $cat_id = intval($cat_ob->term_id);  
                wp_set_post_terms( $post_id, [$cat_id], 'artist-type' );
                
                $term = get_term( $cat_id, 'artist-type' );
                update_field( 'field_588637e854b37', $term->name, $post_id ); 
            }           
            
            

            
            
            // first name
            update_field( 'field_58a99f4a07a70', $row->forename, $post_id );                        
            // last name
            update_field( 'field_58a99f5107a71', $row->surname, $post_id );                        
            
            
            // bio 
            update_field( 'field_58244ca6cd374', htmlspecialchars_decode($row->details_array[ $row->details_array['homepage_show'] ]), $post_id );            
            // contact
            update_field( 'field_585aa7f889409', htmlspecialchars_decode($row->details_array['contact']), $post_id ); 
            
            
            // featured image - NO NEED TO MIGRATE IMAGES
            // if( isset( $row->images[0] ) ){
                // set_post_thumbnail( $post_id, $row->images[0]->wp_image_id );
            // }


            
            $this->flexible_content_row_number = 1;
            

            // Discography
            $this->discography( $row, $post_id );
            
            // review
            $this->reviews( $row, $post_id );

            // gallery NOT REQUIRED
            // if( isset( $row->images ) && count($row->images) > 1 ){
                // $this->add_gallery( $row, $post_id );
            // }

            // repetoir
            $this->repertoire( $row, $post_id );

            $this->extra_details( $row, $post_id  );
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

        
            
        }
        
        
        $this->show_stats();
        
        
    }
    
    
    

    public function extra_details( $row, $post_id ){
        
        
        if( isset($row->details_array['extra']) && $row->details_array['extra'] != '' && $row->details_array['extra'] != '&lt;p&gt;&lt;br&gt;&lt;/p&gt;' && $row->details_array['extra'] != '<p><br></p>'  ){
            
            $content = [
                'field_585abaf418fa1'       => htmlspecialchars_decode($row->details_array['extra']), // free text 
                'field_58a5ffac586d1'       => $row->details_array['extra_title'], // title
                'acf_fc_layout'             =>'free_text_area'
            ];
           
            update_row('field_5820adf0b673c', $this->flexible_content_row_number, $content, $post_id);
            $this->flexible_content_row_number++;
        }
        
        if( isset($row->details_array['extra_2']) && $row->details_array['extra_2'] != '' && $row->details_array['extra_2'] != '&lt;p&gt;&lt;br&gt;&lt;/p&gt;' && $row->details_array['extra_2'] != '<p><br></p>'  ){
            
            $content = [
                'field_585abaf418fa1'       => htmlspecialchars_decode($row->details_array['extra_2']), // free text 
                'field_58a5ffac586d1'       => $row->details_array['extra_title_2'], // title
                'acf_fc_layout'             =>'free_text_area'
            ];
            
            update_row('field_5820adf0b673c', $this->flexible_content_row_number, $content, $post_id);
            $this->flexible_content_row_number++;
        } 



    }

    
    public function discography( $row, $post_id ){
        
        if( !isset($row->albums) || count($row->albums) == 0 ){
            return;
        }
        
        // add/update a row of discography to flexible content
        update_row('field_5820adf0b673c', $this->flexible_content_row_number, ['acf_fc_layout'=>'discography', 'field_58541bfadc4a8'=>'Discography'], $post_id);
                
        // add/update the content
        $i = 1;
        foreach( $row->albums as $album ){
            
            $content = [
                'field_58835a2d0d786'       => $album->title, // title
                'field_588350536d7ac'       => $album->wp_image_id, // image
                'field_58a97b7ecf508'       => $album->label,//label
                'field_58a97b87cf509'       => $album->release,// release date
                'field_588350616d7ad'       => htmlspecialchars_decode($album->description), // details
            ];
            update_sub_row(['field_5820adf0b673c', $this->flexible_content_row_number, 'field_58541aacb00c1'], $i, $content, $post_id);
            
            // link row
            $content = [
                'field_58a5f26338095'       => $album->url, // link text
                'field_58a5f27538096'       => $album->url, // link destination
            ];
            update_sub_row(['field_5820adf0b673c', $this->flexible_content_row_number, 'field_58541aacb00c1', $i, 'field_58a5f23538094' ], 1, $content, $post_id);           
            $i++;
        }
            
        $this->flexible_content_row_number++;
        
    }
    
    public function reviews( $row, $post_id ){
        
        if( !isset($row->reviews) || count($row->reviews) == 0 ){
            return;
        }
        
        // add/update a row of discography to flexible content
        update_row('field_5820adf0b673c', $this->flexible_content_row_number, ['acf_fc_layout'=>'press', 'field_582d86e8282a9'=>'Press'], $post_id);
        
        
        // add/update the content
        $i = 1;
        foreach( $row->reviews as $review ){
            
            $content = [
                'field_58a976d4e70fa'       => $review->date,//date
                'field_582c7408af73b'       => $review->composer, // text area one
                'field_582c803bc5a06'       => $review->title, // text area two
                'field_582c8040c5a07'       => $review->venue, // location
                'field_582c8046c5a08'       => $review->the_review // article
            ];
            update_sub_row(['field_5820adf0b673c', $this->flexible_content_row_number, 'field_582c82baa26b3'], $i, $content, $post_id);
            $i++;
        }
            
        $this->flexible_content_row_number++;
        
    }    
    
    public function repertoire( $row, $post_id ){
        
        // text 
        $text = htmlspecialchars_decode($row->details_array['repertoire']);
        if( $text == '' || $text == '&lt;p&gt;&lt;br&gt;&lt;/p&gt;' || $text == '<p><br></p>' ){
            return;                 
        }
       
        $content = [
            'field_58a5ffc8586d2'       => 'Repertoire', // ftitle
            'field_58a81eb76f865'       => $text, // reportoir
            'acf_fc_layout'             =>'repertoire'
        ];
       
        update_row('field_5820adf0b673c', $this->flexible_content_row_number, $content, $post_id);
       
        $this->flexible_content_row_number++;
      
    }
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    
    
    public function artsits_with_images(){
        
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
            WHERE  artists.type='artist'
            GROUP BY wp_image_id
        " );

        foreach( $images as $image ){
            if( isset($this->artists[ $image->post_id ]) ){
                $this->artists[ $image->post_id ]->images[] = $image;
            }
        }
                
        
    }
    
    
    public function artsits_with_disography(){
        
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
            WHERE albums.status = 'published' AND artists.type='artist'
            GROUP BY album_id            
        " );

        foreach( $albums as $album ){
            
            if( isset($this->artists[ $album->artist_id ]) ){
                $this->artists[ $album->artist_id ]->albums[] = $album;
            }
        }
                
        
        
    }
    
    
    public function artsits_with_reviews(){
        
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
        
            if( isset($this->artists[ $review->artist_id ]) ){
                $this->artists[ $review->artist_id ]->reviews[] = $review;
            }  

        }
            
    }

    
    public function artists_with_categories(){
        
        $cats = $this->wpdb->get_results( "
            SELECT
            migrate_categories_wpposts.post_id as wp_category_id,
            artist_category.artist_id
            FROM
            artists
            left JOIN artist_category ON artists.id = artist_category.artist_id
            left JOIN migrate_categories_wpposts ON artist_category.category_id = migrate_categories_wpposts.categories_id
            where artists.type = 'artist'          
        " );

        foreach( $cats as $cat ){
            
            if( isset($this->artists[ $cat->artist_id ]) ){
                $this->artists[ $cat->artist_id ]->categories[] = $cat->wp_category_id;
            }
        }
                    
       
        
    }
    
    
    
}