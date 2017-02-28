<?php 


class rw_categories extends migrate {
    
    public $table = 'categories';



    public function init(){
        

    }
    
    
    public function artists_cats(){
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE type = 'artist' " );
        
        foreach( $results as $result ){

            $this->categories[ $result->id ] = $result;
        
        }    
        
    } 

    public function staffs_cats(){
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE type = 'staff' " );
        
        foreach( $results as $result ){

            $this->categories[ $result->id ] = $result;
        
        }    
        
    } 

    public function tour_cats(){
                
        $results = $this->wpdb->get_results( "SELECT * FROM $this->table WHERE type = 'tours' " );
        
        foreach( $results as $result ){

            $this->categories[ $result->id ] = $result;
        
        }    
        
    } 
    
    public function insert_cats( $taxonomy = 'artist-type' ){
        
        foreach( $this->categories as $id=>$cat ){

            // only insert if no migration mapped
            $check_cat = term_exists($cat->slug, $taxonomy); 
            if( $check_cat ){
                continue;
            }
                
            $cat_insert['cat_name'] = $cat->name;
            $cat_insert['taxonomy'] = $taxonomy;
            
            if( $cat->parent_id != '' ){
                // get wordpress cat id for the parent
                $arr = term_exists($this->categories[$cat->parent_id]->slug, $taxonomy);                
                if($arr){
                    $cat_insert['category_parent'] = $arr['term_id'];
                }
            }
     
            $post_id = wp_insert_category($cat_insert);
            
            
            // save in migration table
            $test = $this->wpdb->get_var( " SELET id FROM migrate_{$this->table}_wpposts WHERE {$this->table}_id = '$id' AND post_id '$post_id' " );
            if( !$test && $post_id != 0 ) {
                $this->wpdb->query( " INSERT INTO migrate_{$this->table}_wpposts ( {$this->table}_id, post_id ) VALUES ( '$id', '$post_id' ) " );
            }
            
            
        }
        
    }
    
    
    
    
}