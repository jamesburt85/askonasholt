<?php
/*
Plugin Name: Advanced Taxonomy Terms Order
Plugin URI: http://www.nsp-code.com
Description: Taxonomies Terms Custom Order. 
Version: 2.6.5
Author: Nsp Code
Author URI: http://www.nsp-code.com
Author Email: electronice_delphi@yahoo.com
*/


    define('ATTO_PATH',    plugin_dir_path(__FILE__));
    define('ATTO_URL',     plugins_url('', __FILE__));

    define('TOVERSION', '2.6.5');
    define('TO_VERSION_CHECK_URL', 'http://www.nsp-code.com/version-check/vcheck.php?app=advanced-taxonomy-terms-order'); 

    //load language files
    add_action( 'plugins_loaded', 'atto_load_textdomain'); 
    function atto_load_textdomain() 
        {
            load_plugin_textdomain('atto', FALSE, dirname( plugin_basename( __FILE__ ) ) . '/lang');
        }
    
    include (ATTO_PATH . '/include/functions.php'); 
    include (ATTO_PATH . '/include/rest.class.php'); 
    
    register_deactivation_hook(__FILE__, 'ATTO_deactivated');
    register_activation_hook(__FILE__, 'ATTO_activated');

    function ATTO_activated($network_wide) 
        {
            global $wpdb;
                 
            // check if it is a network activation
            if ( $network_wide ) 
                {
                    $current_blog = $wpdb->blogid;
                    
                    // Get all blog ids
                    $blogids = $wpdb->get_col("SELECT blog_id FROM $wpdb->blogs");
                    foreach ($blogids as $blog_id) 
                        {
                            switch_to_blog($blog_id);
                            ATTO_activated_actions();
                        }
                    
                    switch_to_blog($current_blog);
                    
                    return;
                }
                else
                ATTO_activated_actions();
        }
        
    function ATTO_activated_actions()
        {
            global $wpdb;
                 
            //make sure the vars are set as default
            $options = get_option('tto_options');
            if (!isset($options['autosort']))
                $options['autosort'] = '1';
                
            if (!isset($options['adminsort']))
                $options['adminsort'] = '1';
                
            if (!isset($options['capability']))
                $options['capability'] = 'install_plugins';
                
            update_option('tto_options', $options);
            
            //try to create the term_order column in case is not created
            $query = "SHOW COLUMNS FROM `". $wpdb->terms ."` 
                        LIKE 'term_order'";
            $result = $wpdb->get_row($query);
            if(!$result) 
                {
                    $query = "ALTER TABLE `". $wpdb->terms ."` 
                                ADD `term_order` INT NULL DEFAULT '0'";
                    $result = $wpdb->get_results($query);   
                }            
        }
        
    add_action( 'wpmu_new_blog', 'atto_new_blog', 10, 6);       
    function atto_new_blog($blog_id, $user_id, $domain, $path, $site_id, $meta ) 
        {
            global $wpdb;
         
            if (is_plugin_active_for_network('advanced-taxonomy-terms-order/taxonomy-order.php')) 
                {
                    $current_blog = $wpdb->blogid;
                    
                    switch_to_blog($blog_id);
                    ATTO_activated_actions();
                    
                    switch_to_blog($current_blog);
                }
        }
        
    function ATTO_deactivated() 
        {
            
        }
        
    //Wp E-commerce fix, remove the term filter in case we use autosort
    add_filter('plugins_loaded', 'atto_plugins_loaded');
    function atto_plugins_loaded()
        {
            
            //prepare rest data
            new ATTO_rest();
            
            //check for free plugin de-activation
            atto_disable_category_terms_order();
            
            $options = get_option('tto_options');
            
            if (is_admin())
                {
                    if ($options['adminsort'] == "1")
                        remove_filter('get_terms','wpsc_get_terms_category_sort_filter');
                }
                else
                {
                    if ($options['autosort'] == 1)
                        remove_filter('get_terms','wpsc_get_terms_category_sort_filter');   
                }
        }
        
    add_filter('get_terms_args', 'to_get_terms_args', 99, 2);
    function to_get_terms_args($args, $taxonomies)
        {

            
            return ($args);
        }

    add_filter('get_terms_orderby', 'get_terms_orderby', 10, 2);
    function get_terms_orderby($orderby, $args)
        {
            //make sure the requested orderby follow the original args data
            if ($args['orderby'] == 'term_order')
                $orderby = 't.term_order';

            return $orderby;
        }
        
        
    add_filter('terms_clauses', 'to_terms_clauses', 99, 3);
    function to_terms_clauses($pieces, $taxonomies, $args)
        {
            //no need to order when count terms for this query
            if(isset($args['fields']) && strtolower($args['fields'])    ==  'count')
                return $pieces;    
            
            //check for sort ignore
            if(isset($args['ignore_custom_sort']) && $args['ignore_custom_sort']    === TRUE)
                return $pieces;
            
            $options = get_option('tto_options'); 

            //if admin make sure use the admin setting
            if (is_admin() && !defined('DOING_AJAX'))
                {
                    if($options['adminsort'] != "1" && (isset($args['orderby']) && $args['orderby'] != 'term_order'))
                        return $pieces;
                } 
                else 
                    {
                        if($options['autosort'] != '1' && (isset($args['orderby']) && $args['orderby'] != 'term_order'))
                            return $pieces;
                    }
            
            if (count($taxonomies) == 1)
                {
                    //check the current setting for current taxonomy
                    $taxonomy = $taxonomies[0];
                    $order_type = (isset($options['taxonomy_settings'][$taxonomy]['order_type'])) ? $options['taxonomy_settings'][$taxonomy]['order_type'] : 'manual'; 
                    
                    //if manual
                    if ($order_type == 'manual')
                        {
                
                            $taxonomy_info = get_taxonomy($taxonomy);
                            
                            //check if is hierarchical
                            if ($taxonomy_info->hierarchical !== TRUE)
                                {
                                    $pieces['orderby'] = 'ORDER BY t.term_order';
                                }
                                else
                                {
                                    //customise the order
                                    global $wpdb;
                                    
                                    $query_pieces = array( 'fields', 'join', 'where', 'orderby', 'order', 'limits' );
                                    foreach ( $query_pieces as $piece )
                                        $$piece = isset( $pieces[$piece] ) ? $pieces[$piece] : '';

                                    $pieces['orderby'] = 'ORDER BY t.term_order';     
                                    
                                    $query = "SELECT ".$pieces['fields'] ." FROM $wpdb->terms AS t ".$pieces['join'] ." WHERE ".$pieces['where'] ." ".$pieces['orderby'] ." ".$pieces['order'] ." ".$pieces['limits'];
                                    $results = $wpdb->get_results($query);
                                    
                                    $children = atto_get_term_hierarchy( $taxonomy );
                                    
                                    $parent = isset($args['parent']) && is_numeric($args['parent']) ? $args['parent'] : 0;
                                    $terms_order_raw = to_process_hierarhically($taxonomy, $results, $children, $parent);
                                    $terms_order_raw = rtrim($terms_order_raw, ",");
                                    
                                    if(!empty($terms_order_raw))                        
                                        $pieces['orderby'] = 'ORDER BY FIELD(t.term_id, '. $terms_order_raw .')';
                                        
                                }
                                             
                            //no need to continue; return original order
                            return $pieces;   
                        }
                        
                    //if auto
                    $auto_order_by = isset($options['taxonomy_settings'][$taxonomy]['auto']['order_by']) ? $options['taxonomy_settings'][$taxonomy]['auto']['order_by'] : 'name';
                    $auto_order = isset($options['taxonomy_settings'][$taxonomy]['auto']['order']) ? $options['taxonomy_settings'][$taxonomy]['auto']['order'] : 'desc';
                    
                    
                    $order_by = "";
                    switch ($auto_order_by)
                        {
                            case 'default':
                                                return $pieces;
                                                break;
                            
                            case 'id':
                                        $order_by = "t.term_id";
                                        break;
                            case 'name':
                                        $order_by = 't.name';
                                        break;
                            case 'slug':
                                        $order_by = 't.slug';
                                        break;
                            case 'count':
                                        $order_by = 'tt.count';
                                        break;
                                        
                            case 'random':
                                        $order_by = 'RAND()';
                                        break;
                        }
                    
                    $pieces['orderby']  = 'ORDER BY '. $order_by; 
                    $pieces['order']    =  strtoupper($auto_order); 
                    
                    return $pieces; 
                }
                else
                {
                    //if autosort, then force the term_order
                    if ($options['autosort'] == 1)
                        {
                            $pieces['orderby'] = 'ORDER BY t.term_order';
                    
                            return $pieces; 
                        }    
                }

        }
    
    
    function atto_wp_get_object_terms($terms, $object_ids, $taxonomies, $args = array())
        {
            if(!is_array($terms) || count($terms) < 1)
                return $terms;
                    
            global $wpdb;
           
            $options = get_option('tto_options');
           
            if (is_admin() && !defined('DOING_AJAX'))
                {
                    if ($options['adminsort'] != "1" && (!isset($args['orderby']) || $args['orderby']   !=  'term_order'))
                        return $terms;    
                }
                else
                {
                    if ($options['autosort'] != "1" && (!isset($args['orderby']) || $args['orderby']   !=  'term_order'))
                        return $terms;                        
                }
                
            //check for ignore filter
            if(apply_filters('atto/ignore_get_object_terms', $terms, $object_ids, $taxonomies, $args) === TRUE)
                return $terms; 
            
            //check for order ignore 
            if(isset($args['ignore_term_order']) && $args['ignore_term_order']    === TRUE)
                return $terms;
                
            // return $terms;
                
            if(!is_array($object_ids))
                $object_ids =   explode(",", $object_ids);
            $object_ids = array_map('trim', $object_ids);
            
            if ( !is_array($taxonomies) )
                $taxonomies = explode(",", $taxonomies);
            $taxonomies = array_map('trim', $taxonomies);

            foreach ( $taxonomies as $key   =>  $taxonomy ) 
                {
                    $taxonomies[$key]   =   trim($taxonomy, "'");
                }
    
            //no need if multiple objects
            if(count($object_ids) > 1)
                return $terms;
                
            //check if there are terms and if they belong to current taxonomies list, oterwise return as there's nothign to sort
            foreach($terms  as $term)
                {
                    if(!isset($term->taxonomy))
                        return $terms;
                        
                    if(!in_array($term->taxonomy, $taxonomies))
                        return $terms;
                }
            
            $object_id  =   $object_ids[0];
                                
            $terms = array();
                
            if(!isset($args['order']))
                $args['order']    =   '';
                
            if(!isset($args['fields']))
                $args['fields']    =   'all';
            
            extract($args, EXTR_SKIP);
            
            $select_this = '';
            if ( 'all' == $fields )
                $select_this = 't.*, tt.*';
            else if ( 'ids' == $fields )
                $select_this = 't.term_id';
            else if ( 'names' == $fields )
                $select_this = 't.name';
            else if ( 'slugs' == $fields )
                $select_this = 't.slug';
            else if ( 'all_with_object_id' == $fields )
                $select_this = 't.*, tt.*, tr.object_id';
            
            foreach ( $taxonomies as $key   =>  $taxonomy ) 
                {
                    $order_type = (isset($options['taxonomy_settings'][$taxonomy]['order_type'])) ? $options['taxonomy_settings'][$taxonomy]['order_type'] : 'manual'; 
                    
                    //if manual
                    if ($order_type == 'manual')
                        {
                            $orderby    =   't.term_order';
                            
                            // tt_ids queries can only be none or tr.term_taxonomy_id
                            if ( 'tt_ids' == $fields )
                                $orderby = 'tr.term_taxonomy_id';

                            if ( !empty($orderby) )
                                $orderby = "ORDER BY $orderby";

                            $order = strtoupper( $order );
                            if ( '' !== $order && ! in_array( $order, array( 'ASC', 'DESC' ) ) )
                                $order = 'ASC';
                        }
                        else
                        {
                            if(isset($options['taxonomy_settings'][$taxonomy])  &&  isset($options['taxonomy_settings'][$taxonomy]['auto'])  &&  isset($options['taxonomy_settings'][$taxonomy]['auto']['order_by']))
                                $orderby    =   'ORDER BY t.' . $options['taxonomy_settings'][$taxonomy]['auto']['order_by'];
                                else
                                {
                                    if(isset($args['orderby']))
                                        $orderby    =   'ORDER BY t.' . $args['orderby'];
                                        else
                                        $orderby    =   'ORDER BY t.name';
                                }
                            
                            
                            if(isset($options['taxonomy_settings'][$taxonomy])  &&  isset($options['taxonomy_settings'][$taxonomy]['auto'])  &&  isset($options['taxonomy_settings'][$taxonomy]['auto']['order']))
                                $order    =   strtoupper($options['taxonomy_settings'][$taxonomy]['auto']['order']);
                                else
                                {
                                    if(isset($args['order']))
                                        $order    =   $args['order'];
                                        else
                                        $order    =   'ASC';
                                }
                            
                            //$order      =   strtoupper($options['taxonomy_settings'][$taxonomy]['auto']['order']);
                        }
                    
                                        
                    $query = "SELECT $select_this FROM $wpdb->terms AS t INNER JOIN $wpdb->term_taxonomy AS tt ON tt.term_id = t.term_id INNER JOIN $wpdb->term_relationships AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id WHERE tt.taxonomy IN ('$taxonomy') AND tr.object_id IN ($object_id) $orderby $order";

                    if ( 'all' == $fields || 'all_with_object_id' == $fields ) 
                    {
                        $_terms = $wpdb->get_results($query);
                        foreach ( $_terms as $key => $term ) 
                            {
                                $_terms[$key] = sanitize_term( $term, $term->taxonomy, 'raw' );
                            }
                            
                        $object_id_index = array();
                        foreach ( $_terms as $key => $term ) 
                            {
                                $term = sanitize_term( $term, $taxonomy, 'raw' );
                                $_terms[ $key ] = $term;

                                if ( isset( $term->object_id ) ) 
                                    {
                                        $object_id_index[ $key ] = $term->object_id;
                                    }
                            }
                        
                        update_term_cache($_terms, $taxonomy);
                        $_terms = array_map( 'get_term', $_terms );

                        // Re-add the object_id data, which is lost when fetching terms from cache.
                        if ( 'all_with_object_id' === $fields ) 
                            {
                                foreach ( $_terms as $key => $_term ) 
                                    {
                                        if ( isset( $object_id_index[ $key ] ) ) 
                                            {
                                                $_term->object_id = $object_id_index[ $key ];
                                            }
                                    }
                            }
                        
                        $terms = array_merge($terms, $_terms);
                    } 
                    else if ( 'ids' == $fields || 'names' == $fields || 'slugs' == $fields ) 
                    {
                        $_terms = $wpdb->get_col( $query );
                        $_field = ( 'ids' == $fields ) ? 'term_id' : 'name';
                        foreach ( $_terms as $key => $term ) 
                            {
                                $_terms[$key] = $term;
                            }
                        $terms = array_merge($terms, $_terms);
                    } 
                    else if ( 'tt_ids' == $fields ) 
                    {
                        $terms = $wpdb->get_col("SELECT tr.term_taxonomy_id FROM $wpdb->term_relationships AS tr INNER JOIN $wpdb->term_taxonomy AS tt ON tr.term_taxonomy_id = tt.term_taxonomy_id WHERE tr.object_id IN ($object_id) AND tt.taxonomy IN ('$taxonomy') $orderby $order");
                        foreach ( $terms as $key => $tt_id ) 
                            {
                                $terms[$key] = $tt_id;
                            }
                    }    
                }

                
            return $terms;
        }


    //wp_get_object_terms term_order support
    add_filter('wp_get_object_terms',   'atto_wp_get_object_terms', 99,     4);
 
    add_filter('get_the_terms',         'atto_wp_get_object_terms', 999,    3);


    function to_process_hierarhically($taxonomy, $terms, &$children, $parent = 0, $level = 0 )
        {

            $output = '';
            foreach ( $terms as $key => $term ) 
                {
                    if(!isset($term->parent))
                        {
                            $output .= $term->term_id . ",";
                            
                            unset( $terms[$key] );

                            if ( isset( $children[$term->term_id] ) )
                                $output .= to_process_hierarhically( $taxonomy, $terms, $children,  $term->term_id, $level + 1 );   
                        }
                        else
                        {
                            // ignore if not search?!?
                            if ( $term->parent != $parent || empty( $_REQUEST['s'] ) )
                                continue;
                    
                            $output .= $term->term_id . ",";
                    
                            unset( $terms[$key] );

                            if ( isset( $children[$term->term_id] ) )
                                $output .= to_process_hierarhically( $taxonomy, $terms, $children,  $term->term_id, $level + 1 );
                        }
                }

            return $output;
        
        }

        
    
    function ATTO_admin_scripts()
        {
            
            wp_enqueue_script('jquery');
            
            wp_enqueue_script('jquery-ui-core');
            wp_enqueue_script('jquery-ui-sortable');
            wp_enqueue_script('jquery-ui-widget');
            wp_enqueue_script('jquery-ui-mouse');
            
            $myJavascriptFile = ATTO_URL . '/js/touch-punch.min.js';
            wp_register_script('touch-punch.min.js', $myJavascriptFile, array(), '', TRUE);
            wp_enqueue_script( 'touch-punch.min.js');
               
            $myJavascriptFile = ATTO_URL . '/js/nested-sortable.js';
            wp_register_script('nested-sortable.js', $myJavascriptFile, array(), '', TRUE);
            wp_enqueue_script( 'nested-sortable.js');
            
            $myJsFile = ATTO_URL . '/js/to-javascript.js';
            wp_register_script('to-javascript.js', $myJsFile);
            wp_enqueue_script( 'to-javascript.js');
               
        }
        
    
    function ATTO_admin_styles()
        {
            $myCssFile = ATTO_URL . '/css/to.css';
            wp_register_style('to.css', $myCssFile);
            wp_enqueue_style( 'to.css');
        }
        
    function ATTO_admin_print_general_styles()
        {
            wp_register_style('ATTO_GeneralStyleSheet', ATTO_URL . '/css/general.css');
            wp_enqueue_style( 'ATTO_GeneralStyleSheet');    
        }
        
    add_action('admin_menu', 'ATTO_PluginMenu', 99);
    add_action('wp_loaded', 'initATTO' );
    function initATTO()
        {
              
            
        }

    function ATTO_PluginMenu() 
        {
            include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
            
            include (ATTO_PATH . '/include/interface.php');
            include (ATTO_PATH . '/include/terms_walker.php');
            
            include (ATTO_PATH . '/include/options.php');
            
            add_action('admin_print_styles' , 'ATTO_admin_print_general_styles'); 
             
            add_options_page('Taxonomy Terms Order', '<img class="menu_tto" src="'. ATTO_URL .'/images/menu-icon.png" alt="" />Taxonomy Terms Order', 'manage_options', 'to-options', 'to_plugin_options');
                    
            $options = get_option('tto_options');
            
            if(isset($options['capability']) && !empty($options['capability']))
                    {
                        $capability = $options['capability'];
                    }
                else if (is_numeric($options['level']))
                    {
                        //maintain the old user level compatibility
                        $capability = atto_userdata_get_user_level();
                    }
                    else
                        {
                            $capability = 'install_plugins';  
                        }
            
            //check for new version once per day
            add_action( 'after_plugin_row','atto_check_plugin_version' );
            
            //put a menu within all custom types if apply
            $post_types = get_post_types();
            foreach( $post_types as $post_type) 
                {
                        
                    //check if there are any taxonomy for this post type
                    $post_type_taxonomies = get_object_taxonomies($post_type);
                          
                    if (count($post_type_taxonomies) == 0)
                        continue;                
                    
                    $menu_title = apply_filters('atto/admin/menu_title', 'Taxonomy Order', $post_type);
                    
                    if ($post_type == 'post')
                        $hookID =   add_submenu_page('edit.php', $menu_title, $menu_title, $capability, 'to-interface-'.$post_type, 'TOPluginInterface' );
                        elseif ($post_type == 'attachment')
                        $hookID =   add_submenu_page('upload.php', $menu_title, $menu_title, $capability, 'to-interface-'.$post_type, 'TOPluginInterface' );
                        elseif($post_type == 'shopp_product'   &&  is_plugin_active('shopp/Shopp.php'))
                        {
                            $hookID =   add_submenu_page('shopp-products', $menu_title, $menu_title, $capability, 'to-interface-'.$post_type, 'TOPluginInterface' );
                        }
                        else
                        $hookID =   add_submenu_page('edit.php?post_type='.$post_type, $menu_title, $menu_title, $capability, 'to-interface-'.$post_type, 'TOPluginInterface' );
                        
                    add_action('admin_print_styles-' . $hookID , 'ATTO_admin_styles');
                    add_action('admin_print_scripts-' . $hookID , 'ATTO_admin_scripts');
                }
        }
        
        
    add_action( 'wp_ajax_update-taxonomy-order', 'ATTO_SaveAjaxOrder' );
    function ATTO_SaveAjaxOrder()
        {
            global $wpdb; 
            
            parse_str($_POST['order'], $data);

            $taxonomy   = $_POST['taxonomy'];
            
            //retrieve the taxonomy details 
            $taxonomy_info = get_taxonomy($taxonomy);
            if($taxonomy_info->hierarchical === TRUE)    
                $is_hierarchical = TRUE;
                else
                $is_hierarchical = TRUE;
            
            //WPML fix
            if (defined('ICL_LANGUAGE_CODE'))
                {
                    global $iclTranslationManagement, $sitepress;
                    
                    remove_action('edit_term',  array($iclTranslationManagement, 'edit_term'),11, 2);
                    remove_action('edit_term',  array($sitepress, 'create_term'),1, 2);
                }
            
            
            if (is_array($data))
                {
                        
                    //prepare the var which will hold the item childs current order
                    $childs_current_order = array();
                    
                    foreach($data['item'] as $term_id => $parent_id ) 
                        {
                            if($is_hierarchical === TRUE)
                                {
                                    //$current_item_term_order = '';
                                    if($parent_id != 'null')
                                        {
                                            $childs_current_order[$parent_id] = $current_item_term_order;
                                                
                                            $current_item_term_order    = $childs_current_order[$parent_id];
                                            $term_parent                = $parent_id;
                                        }
                                        else
                                            {
                                                                                
                                                $current_item_term_order    = isset($current_item_term_order) ? $current_item_term_order : 1;
                                                $term_parent                = 0;
                                            }
                                        
                                    //update the term_order
                                    $args = array(
                                                    'term_order'    =>  $current_item_term_order,
                                                    'parent'        =>  $term_parent
                                                    );
                                    wp_update_term($term_id, $taxonomy, $args);
                                    //update the term_order as the above function can't do that !!
                                    $wpdb->update( $wpdb->terms, array('term_order' => $current_item_term_order), array('term_id' => $term_id) );
                                    
                                    do_action('atto_order_update_hierarchical', array('term_id' =>  $term_id, 'position' =>  $current_item_term_order, 'term_parent'    =>  $term_parent));
                                    
                                    $current_item_term_order++;
                                    
                                    continue;
                                }
                                
                            //update the non-hierarhical structure
                            $current_item_term_order = 1;
                                
                            //update the term_order
                            $args = array(
                                            'term_order'    =>  $current_item_term_order
                                            );
                            wp_update_term($term_id, $taxonomy, $args);
                            //update the term_order as there code can't do that !! bug - hope they will fix soon! 
                            $wpdb->update( $wpdb->terms, array('term_order' => $current_item_term_order), array('term_id' => $term_id) );
                            do_action('atto_order_update', array('term_id' =>  $term_id, 'position' =>  $current_item_term_order, 'term_parent'    =>  $term_parent));
                            
                            $current_item_term_order++;
        
                        }
        
                    if($is_hierarchical === TRUE)
                        _get_term_hierarchy($taxonomy);
                }

            die();
        }
?>