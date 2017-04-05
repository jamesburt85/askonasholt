<?php


class rw_audio extends migrate  {
    
    public $table = 'audio';



    
    public function init(){
        
        $where = '';
        
        if( isset( $this->id ) ){
            $where .= " AND id = '{$this->id}' ";
        }    
        
        if( isset( $this->from ) ){
            $where .= " AND id >= '{$this->from}' AND id <= '{$this->to}' ";
        }
                           
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE status = 'published' {$where} " );
        
        foreach( $results as $result ){
            
            $this->audios[ $result->id ] = $result;
            
        }
        
        $this->audio_with_artists();
        
        
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->audios as $id=>$row ){
        
            // bail if no name
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
                'post_content'          => $row->description,
                
            );
            
            if( $migrated_post_id ){
                // update
                $post['ID'] = $migrated_post_id;
            }            
            
            $post_id = wp_insert_post( $post );                  
            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            // category
            wp_set_post_categories( $post_id, [35] ); // audio category
        

            // ACF fields
            if( !$migrated_post_id ){ // if already done, don't re-upload
            
            
                // FORMAT
                set_post_format( $post_id , 'audio' );        
            
                // Audio file
                $attach_id = $this->audio_attach($row);
                update_field( 'field_5835a1d04b791', $attach_id, $post_id ); 
              
                // track name
                update_field( 'field_5835a2754b795', $row->title, $post_id ); 
                
                // date
                update_field( 'field_5835a23f4b793', $row->created_at, $post_id );
            }          
            
            // related artists          
            if( isset($row->artists) && count($row->artists) > 0 ){
                update_field( 'field_5835a2104b792', $row->artists, $post_id ); 
            }            
            
                
                
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);

            
            //break;
        
        }
        
        $this->show_stats();
        
        
    }
    
    
    
    
    
    

    
    public function audio_attach($row){
        
        // check if attachment exists with name $row->filename;
        $args = array(
            'post_per_page' => 1,
            'post_type'     => 'attachment',
            'name'          => $row->filename,
        );              
        $attachment = get_posts( $args );
        if( $attachment ){
            return $attachment[0]->ID;
        }
        
        
        
        // upload
        
        if( $_SERVER['REMOTE_ADDR'] == "::1" ) {
            $current_audio_file = $row->saved_to.$row->filename;
        } else {
            $current_audio_file = '../httpdocs/79.170.44.26/public_html/'.$row->saved_to.$row->filename;            
        }
        
		// save to temp_images
		$wp_upload_dir = wp_upload_dir();


		$temp_img_fullpath = $wp_upload_dir['path']."/".$row->filename;       
		file_put_contents( $temp_img_fullpath, file_get_contents( $current_audio_file ));

		$filetype = wp_check_filetype( basename( $temp_img_fullpath ), null );

		// save as media
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $temp_img_fullpath ), 
			'post_mime_type' => $filetype['type'],
			'post_title'     => $row->filename,
			'post_content'   => '',
			'post_status'    => 'inherit'
		);		
		$attach_id = wp_insert_attachment( $attachment, $temp_img_fullpath );  

        return $attach_id;        
        
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    public function audio_with_artists(){
        
        $artists = $this->wpdb->get_results( " 
            SELECT
            migrate_artists_wpposts.post_id as wp_artist_id,
            audio.id as audio_id
            FROM
            audio
            left JOIN artist_audio ON audio.id = artist_audio.audio_id
            INNER JOIN migrate_artists_wpposts ON artist_audio.artist_id = migrate_artists_wpposts.artists_id
            WHERE audio.status = 'published'
        " );

        foreach( $artists as $artist ){
            if( isset($this->audios[ $artist->audio_id ]) ){
                $this->audios[ $artist->audio_id ]->artists[] = $artist->wp_artist_id;
            }
        }            
        
    }
    
    
    

    
    
    
    
}