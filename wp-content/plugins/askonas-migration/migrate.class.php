<?php 

class migrate {
    
    public function __construct( $args = [] ){
        
        // set large limits for scripts to run
        ini_set('max_execution_time', 1200); 
        ini_set('memory_limit', '256M');      
        
        echo "<pre>";
        
        global $wpdb;
        $this->wpdb = $wpdb;
                
        if( isset( $args['id'] ) ){
            $this->id = $args['id'];
        }
        
        if( isset( $args['from'] ) ){
            $this->from = $args['from'];
            $this->to = $args['to'];
        }        
        
        
        
        if( !isset( $this->link_table ) ){
            $this->link_table = $this->table;
        }        
        
        
        $this->install_link_tables();
        
        $this->init();
        
        $this->stats_init();
        
    }  


    // install
	public function install_link_tables() {
            
        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
     
        $charset_collate = $this->wpdb->get_charset_collate();        

        $tableName = "migrate_{$this->link_table}_wpposts";
		$this->wpdb->query("CREATE TABLE IF NOT EXISTS `$tableName` (
				`id` INT NOT NULL AUTO_INCREMENT,
                `{$this->link_table}_id` INT NOT NULL,
                `post_id` INT NOT NULL,
				`timestamp` DATETIME NOT NULL,
				PRIMARY KEY (`id`) 
			) {$charset_collate};");
      
                   
	}    
    
    public function delete_all_migrated_data(){
        
        $args = [
            'posts_per_page'   => -1,
            'post_type'     => $this->post_type,
            'post_status'	=> ['publish','draft'],
			'meta_key'		=> 'migration_created',
			'meta_value'	=> true,         
        ];
        
        // if( isset($this->id) ){
            // $args['post__in'] = [$this->id];
        // }
        
        $all = get_posts( $args );
        
        $count = 0;
        foreach( $all as $post ){
            $count++;
            wp_delete_post( $post->ID );
            
            $this->wpdb->query( " DELETE FROM migrate_{$this->link_table}_wpposts WHERE post_id = '$post->ID' " );
        }
        
        echo "Count of records currently migrated into wordpress: ".$this->records_already_inserted;
        echo "<br/>Deleted: ".$count;
        
    }
    
    


    
    public function stats_init(){
        
        $this->records_from_old = count( $this->{$this->link_table} );
        
        $this->records_already_inserted = $this->wpdb->get_var( "SELECT count(id) FROM migrate_{$this->link_table}_wpposts " );
        
        $this->records_inserted = 0;
        
        $this->records_updated = 0;
        
        $this->fails = 0;
        
        $this->error = '';
        
        $this->migrated_post_ids = $this->wpdb->get_results( "SELECT {$this->link_table}_id, post_id FROM migrate_{$this->link_table}_wpposts ", OBJECT_K );

    }
    
    public function show_stats(){
        
        ?>
        <table>
            <tr>
                <th><strong><?php echo $this->link_table;?></strong></th>
                <th></th>
            </tr>
            <tr>
                <td>Records select from old table <?php echo $this->table;?>:</td>
                <td><?php echo $this->records_from_old;?></td>
            </tr>
            <tr>
                <td>Records already inserted into wordpress at start of migration :</td>
                <td><?php echo $this->records_already_inserted;?></td>
            </tr>  
            <tr>
                <td>Records inserted into wordpress :</td>
                <td><?php echo $this->records_inserted;?></td>
            </tr>     
            <tr>
                <td>Records updated in wordpress :</td>
                <td><?php echo $this->records_updated;?></td>
            </tr>   
            <tr>
                <td>Post creation fails :</td>
                <td><?php echo $this->fails;?></td>
            </tr>       
            <tr>
                <td>Errors :</td>
                <td><?php echo $this->error;?></td>
            </tr>              
        </table>
        <?php
    }
    

    public function log_error( $error ){
        
        $this->fails++;
        $this->error .= "<br/>No title for id {$id}";   
        
    }
    
    public function check_migrated_id($id){

        if( array_key_exists( $id, $this->migrated_post_ids ) ){
            return $this->migrated_post_ids[$id]->post_id;
        }

        return false;        
        //return $this->wpdb->get_var( "SELECT post_id FROM migrate_{$this->link_table}_wpposts WHERE {$this->link_table}_id = $id  " );
    }
    
    public function save_postid_relation( $id, $migrated_post_id, $post_id ){
        
        if( !$migrated_post_id ){
            $this->records_inserted++;
            $this->wpdb->query( " INSERT INTO migrate_{$this->link_table}_wpposts ( {$this->link_table}_id, post_id ) VALUES ( '$id', '$post_id' ) " );
        } else {
            $this->records_updated++;
        }        
        
    }
    
    
    
    public function add_gallery( $row, $post_id ){
        
         // add/update a row of discography to flexible content
        update_row('field_5820adf0b673c', $this->flexible_content_row_number, ['acf_fc_layout'=>'image_gallery', 'field_5879f9b0e3214'=>'Gallery'], $post_id);
        
        $i = 0;
        foreach( $row->images as $image ){
            
            // skip first image - used in thubnail
            if( $i == 0 ){
                $i = 1;
                continue;
            }
            
            $content = [
                'field_58a6aa11d9036'       => $image->wp_image_id, // image
                'field_58a6aa2ed9037'       => $album->credits, // credit
            ];
            update_sub_row(['field_5820adf0b673c', $this->flexible_content_row_number, 'field_58a6a9efd9035'], $i, $content, $post_id);
            $i++;
        }        
        
        $this->flexible_content_row_number++;

        
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
                'field_588350616d7ad'       => $album->description, // details
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
    
    

    public function getParentCats(){
        
        $cats = $this->wpdb->get_results( "
            SELECT
            *
            FROM categories
        " );   
        
        $return = [];
        
        foreach( $cats as $cat ){
            
            $return[ $cat->id ] = $cat;
            
        }            
        
        return $return;
        
    }

    public function insert301( $urls, $group_id ){
        
        
        foreach( $urls as $url_old=>$url_new ){
            
            if( $url_new == '' || $url_old == '' ) {
                continue;
            }
            
            // check not already inserted
            $test = $this->wpdb->get_results( " SELECT * FROM {$this->wpdb->prefix}redirection_items WHERE url = '{$url_old}' " );
            
            if( $test ) {
                // UPDATE
                $this->wpdb->query( " UPDATE {$this->wpdb->prefix}redirection_items 
                                    SET
                                    group_id = '$group_id',
                                    status = 'enabled',
                                    action_type = 'url',
                                    action_code = '301',
                                    action_data = '$url_new',
                                    match_type  =  'url'                                
                                    WHERE url = '$url_old'
                " );                
            } else {
                // INSERT
                $this->wpdb->query( " INSERT INTO {$this->wpdb->prefix}redirection_items 
                                    ( 
                                        url,
                                        group_id,
                                        status,
                                        action_type,
                                        action_code,
                                        action_data,
                                        match_type                                  
                                    ) 
                                    VALUES 
                                    ( 
                                        '$url_old', 
                                        '$group_id',
                                        'enabled',
                                        'url',
                                        '301',
                                        '$url_new',
                                        'url'
                                    ) 
                " );
            }
            
            
            
        }
        
        print_r( $urls );  
        
    }    
    
}