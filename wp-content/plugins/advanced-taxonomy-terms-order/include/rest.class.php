<?php

    class ATTO_rest
        {

                    
            /**
            * Init the instance
            * 
            */
            function __construct()
                {
                    add_filter('rest_endpoints', array( $this , 'rest_endpoints'), 999);
                }
                
            
            /**
            * append the required paramethers for orderby to endpoints
            * 
            */
            function rest_endpoints($endpoints)
                {
                    
                    //category taxonomy
                    if(isset($endpoints['/wp/v2/categories']))
                        {
                            foreach($endpoints['/wp/v2/categories'] as  $key    =>  $data)
                                {
                                    if( !isset($data['methods']))
                                        continue;
                                    
                                    if(!isset($data['args'])    ||  !isset($data['args']['orderby'])    ||  !isset($data['args']['orderby']['enum']))
                                        continue;
                                        
                                    $data['args']['orderby']['enum'][]  =   'term_order';
                                    
                                    $endpoints['/wp/v2/categories'][$key]   =   $data;
                                }
                        }
                        
                    
                    //tags
                    if(isset($endpoints['/wp/v2/tags']))
                        {
                            foreach($endpoints['/wp/v2/tags'] as  $key    =>  $data)
                                {
                                    if( !isset($data['methods']))
                                        continue;
                                    
                                    if(!isset($data['args'])    ||  !isset($data['args']['orderby'])    ||  !isset($data['args']['orderby']['enum']))
                                        continue;
                                        
                                    $data['args']['orderby']['enum'][]  =   'term_order';
                                    
                                    $endpoints['/wp/v2/tags'][$key]   =   $data;
                                }
                        }
                        
                    
                    //add custom taxonomies
                    $taxonomies =   get_taxonomies(array(), 'objects'); 
                    foreach ($taxonomies as $slug   =>  $taxonomy ) 
                        {
                            if(!isset($taxonomy->show_in_rest)  ||  $taxonomy->show_in_rest !== TRUE)
                                continue;
                            
                            $rest_base  =   isset($taxonomy->rest_base) ?   $taxonomy->rest_base    :   $slug;
                                
                            if(isset($endpoints['/wp/v2/' . $rest_base]))
                                {
                                    foreach($endpoints['/wp/v2/' . $rest_base] as  $key    =>  $data)
                                        {
                                            if( !isset($data['methods']))
                                                continue;
                                            
                                            if(!isset($data['args'])    ||  !isset($data['args']['orderby'])    ||  !isset($data['args']['orderby']['enum']))
                                                continue;
                                                
                                            $data['args']['orderby']['enum'][]  =   'term_order';
                                            
                                            $endpoints['/wp/v2/' . $rest_base][$key]   =   $data;
                                        }
                                }
                        }
                       
                    return $endpoints;   
                }
                
        }


?>