<?php

/**
 * Custom Post Types
 * ----------------------------------------------------------------------------
 */


// add featured image support
// add_theme_support( 'post-thumbnails' ); 
// add_image_size('slide', 9999, 420, TRUE);
// add_image_size('client', 999, 41, TRUE);
// add_image_size('testimonial', 111, 113, TRUE);
// add_image_size('teamsmall', 58, 58, TRUE);
// add_image_size('teammedium', 200, 200, TRUE);
// add_image_size('teamlarge', 229, 329, TRUE);
// add_image_size('csr', 230, 163, TRUE);
// add_image_size('blog', 308, 999, TRUE);
// add_image_size('portfolio', 104, 104, TRUE);
// add_image_size('mobileslide', 320, 222, TRUE);
// add_image_size('testimonial-thumb', 110, 110, TRUE);



// CUSTOM POST TYPES //
add_action('init', 'feature_init');
function feature_init() 
{
    //Default arguments
    $args = array
    (
        'public'                => true,
        'publicly_queryable'    => true,
        'show_ui'               => true, 
        'query_var'             => true,
        'rewrite'               => true,
        'capability_type'       => 'post',
        'has_archive'           => true, 
        'hierarchical'          => false,
        'menu_position'         => NULL,
        // 'taxonomies'            => array('category'),
    );
    
    /* ----------------------------------------------------
    Events
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'Events',
        'singular_name'             => 'Events Item',
        'add_new'                   => _x('Add New', 'Events Item'),
        'add_new_item'              => 'Add New Events Item',
        'edit_item'                 => 'Edit Events Item',
        'new_item'                  => 'New Events Item',
        'view_item'                 => 'View Events Item',
        'search_items'              => 'Search Events Items',
        'not_found'                 => 'No Events Item found',
        'not_found_in_trash'        => 'No Events Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'Events'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'events');
    $args['menu_icon']              = 'dashicons-calendar-alt';
    $args['show_in_menu']           = true;
    
    register_post_type('events', $args);



    /* ----------------------------------------------------
    Artists
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'Artists',
        'singular_name'             => 'Artists Item',
        'add_new'                   => _x('Add New', 'Artists Item'),
        'add_new_item'              => 'Add New Artists Item',
        'edit_item'                 => 'Edit Artists Item',
        'new_item'                  => 'New Artists Item',
        'view_item'                 => 'View Artists Item',
        'search_items'              => 'Search Artists Items',
        'not_found'                 => 'No Artists Item found',
        'not_found_in_trash'        => 'No Artists Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'Artists'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'artists');
    $args['menu_icon']              = 'dashicons-admin-customizer';
    $args['show_in_menu']           = true;
    
    register_post_type('artists', $args);

    # Add a custom taxonomy
    register_taxonomy( 'artist-type', 
        array('artists'), # register taxonomy for these post types
        array('hierarchical' => true, # if this is true, it acts like categories             
            'labels' => array(
                'name' => __( 'Artist Type', 'adstyles'),
                'singular_name' => __( 'Artist Type', 'adstyles'), 
                'search_items' =>  __( 'Search Artist Type', 'adstyles'),
                'all_items' => __( 'All Artist Type', 'adstyles'), 
                'parent_item' => __( 'Parent Artist Type', 'adstyles'), 
                'parent_item_colon' => __( 'Parent Artist Type:', 'adstyles'), 
                'edit_item' => __( 'Edit Artist Type', 'adstyles'), 
                'update_item' => __( 'Update Artist Type', 'adstyles'), 
                'add_new_item' => __( 'Add New Artist Type', 'adstyles'),
                'new_item_name' => __( 'New Artist Type Name', 'adstyles'),
            ),
            'show_ui' => true,
            'query_var' => false,
            'rewrite' => false,
        )
    );


    /* ----------------------------------------------------
    Tours-Projects
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'Tours-Projects',
        'singular_name'             => 'Tours-Projects Item',
        'add_new'                   => _x('Add New', 'Tours-Projects Item'),
        'add_new_item'              => 'Add New Tours-Projects Item',
        'edit_item'                 => 'Edit Tours-Projects Item',
        'new_item'                  => 'New Tours-Projects Item',
        'view_item'                 => 'View Tours-Projects Item',
        'search_items'              => 'Search Tours-Projects Items',
        'not_found'                 => 'No Tours-Projects Item found',
        'not_found_in_trash'        => 'No Tours-Projects Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'Tours-Projects'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail', 'excerpt');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'tours-projects');
    $args['menu_icon']              = 'dashicons-format-audio';
    $args['show_in_menu']           = true;
    
    register_post_type('tours-projects', $args);


    /* ----------------------------------------------------
    People
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'People',
        'singular_name'             => 'People Item',
        'add_new'                   => _x('Add New', 'People Item'),
        'add_new_item'              => 'Add New People Item',
        'edit_item'                 => 'Edit People Item',
        'new_item'                  => 'New People Item',
        'view_item'                 => 'View People Item',
        'search_items'              => 'Search People Items',
        'not_found'                 => 'No People Item found',
        'not_found_in_trash'        => 'No People Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'People'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail', 'excerpt');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'people');
    $args['menu_icon']              = 'dashicons-admin-users';
    $args['show_in_menu']           = true;
    
    register_post_type('people', $args);


}


?>