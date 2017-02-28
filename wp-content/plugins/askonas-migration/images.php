<?php


class rw_images extends migrate {
    
    
    public $table = 'images';


    
    public function init(){

        $where = '';
        
        if( isset( $this->id ) ){
            $where .= " AND id = '{$this->id}' ";
        }    
        
        if( isset( $this->from ) ){
            $where .= " AND id >= '{$this->from}' AND id <= '{$this->to}' ";
        }
        
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE status = 'published' AND filename != '' {$where} " );
        
        foreach( $results as $result ){
            
            $this->images[ $result->id ] = $result;
            
        }
        
        
    }
    
    
    
    
    public function migrate_init(){
        
        // save artist 
        foreach( $this->images as $id=>$row ){

            
            // check migrate table for post id
            $migrated_post_id = $this->check_migrated_id($id);
            

            
            if( $migrated_post_id ){
                // do nothing
                continue;
            }     
            





            $post_id = $this->insert_media_attachment( $row );
            if( !$post_id ){
                $this->log_error("Wordpress image creation failed for id {$id}"); 
                continue;
            }


            add_post_meta( $post_id, 'migration_created', true );// flag for migration creation
            
            
            
            // save post id in migrate table
            $this->save_postid_relation($id, $migrated_post_id, $post_id);


        }
        
        $this->show_stats();
        
    }
    
    

    public function insert_media_attachment( $row ){
        
        if( $row->filename == ''  ){
            return;
        }
 
        if( $row->title == '' ){
            $title = $row->filename;
        } else {
            $title = $row->title;
        }
        if( $row->credits == '' ){
            $credits = '';
        } else {
            $credits = 'Credits: '.$row->credits;
        }
        
        
        
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
        if( $_SERVER['REMOTE_ADDR'] == "127.0.0.1" ) {
            $current_image_file = $row->saved_to.$row->filename;
        } else {
            $current_image_file = '../httpdocs/79.170.44.26/public_html/'.$row->saved_to.$row->filename;            
        }

        
		// save to temp_images
		$wp_upload_dir = wp_upload_dir();


		$temp_img_fullpath = $wp_upload_dir['path']."/".$row->filename; 
        
        if( file_exists($temp_img_fullpath) ){
            return false;
        }
        
		file_put_contents( $temp_img_fullpath, file_get_contents( $current_image_file ));

		$filetype = wp_check_filetype( basename( $temp_img_fullpath ), null );
        
        

		// save as media
       // $upload_file = wp_upload_bits($row->filename, null, file_get_contents($temp_img_fullpath));
        //$upload_file = wp_upload_bits($row->filename, null, file_get_contents($current_image_file));
        
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $current_image_file ), 
			'post_mime_type' => $filetype['type'],
			'post_title'     => $title,
			'post_content'   => $credits,
			'post_status'    => 'inherit'
		);		
		$attach_id = wp_insert_attachment( $attachment, $temp_img_fullpath );  
        
        // Make sure that this file is included, as wp_generate_attachment_metadata() depends on it.
        require_once( ABSPATH . 'wp-admin/includes/image.php' );

        // Generate the metadata for the attachment, and update the database record.
        $attach_data = wp_generate_attachment_metadata( $attach_id, $temp_img_fullpath );
        wp_update_attachment_metadata( $attach_id, $attach_data );

        return $attach_id;          
        
        
    }
    
    
    
    
    
    
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // joins / withs etc

    
    
    
    
}