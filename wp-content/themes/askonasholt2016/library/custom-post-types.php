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
    $args['rewrite']                = array('slug' => 'tours-and-projects/upcoming');
    $args['menu_icon']              = 'dashicons-format-audio';
    $args['show_in_menu']           = true;
    
    register_post_type('tours-projects', $args);

    # Add a custom taxonomy
    register_taxonomy( 'tour-season', 
        array('tours-projects'), # register taxonomy for these post types
        array('hierarchical' => true, # if this is true, it acts like categories             
            'labels' => array(
                'name' => __( 'Tour Season', 'adstyles'),
                'singular_name' => __( 'Tour Season', 'adstyles'), 
                'search_items' =>  __( 'Search Tour Season', 'adstyles'),
                'all_items' => __( 'All Tour Season', 'adstyles'), 
                'parent_item' => __( 'Parent Tour Season', 'adstyles'), 
                'parent_item_colon' => __( 'Parent Tour Season:', 'adstyles'), 
                'edit_item' => __( 'Edit Tour Season', 'adstyles'), 
                'update_item' => __( 'Update Tour Season', 'adstyles'), 
                'add_new_item' => __( 'Add New Tour Season', 'adstyles'),
                'new_item_name' => __( 'New Tour Season Name', 'adstyles'),
            ),
            'show_ui' => true,
            'query_var' => false,
            'rewrite' => false,
        )
    );


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
    $args['rewrite']                = array('slug' => 'about/people');
    $args['menu_icon']              = 'dashicons-admin-users';
    $args['show_in_menu']           = true;
    
    register_post_type('people', $args);

    # Add a custom taxonomy
    register_taxonomy( 'people-type', 
        array('people'), # register taxonomy for these post types
        array('hierarchical' => true, # if this is true, it acts like categories             
            'labels' => array(
                'name' => __( 'People Type', 'adstyles'),
                'singular_name' => __( 'People Type', 'adstyles'), 
                'search_items' =>  __( 'Search People Type', 'adstyles'),
                'all_items' => __( 'All People Type', 'adstyles'), 
                'parent_item' => __( 'Parent People Type', 'adstyles'), 
                'parent_item_colon' => __( 'Parent People Type:', 'adstyles'), 
                'edit_item' => __( 'Edit People Type', 'adstyles'), 
                'update_item' => __( 'Update People Type', 'adstyles'), 
                'add_new_item' => __( 'Add New People Type', 'adstyles'),
                'new_item_name' => __( 'New People Type Name', 'adstyles'),
            ),
            'show_ui' => true,
            'query_var' => false,
            'rewrite' => false,
        )
    );

    /* ----------------------------------------------------
    Clients
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'Clients',
        'singular_name'             => 'Clients Item',
        'add_new'                   => _x('Add New', 'Clients Item'),
        'add_new_item'              => 'Add New Clients Item',
        'edit_item'                 => 'Edit Clients Item',
        'new_item'                  => 'New Clients Item',
        'view_item'                 => 'View Clients Item',
        'search_items'              => 'Search Clients Items',
        'not_found'                 => 'No Clients Item found',
        'not_found_in_trash'        => 'No Clients Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'Clients'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail', 'excerpt');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'tours-and-projects/clients');
    $args['menu_icon']              = 'dashicons-groups';
    $args['show_in_menu']           = true;
    
    register_post_type('clients', $args);

    # Add a custom taxonomy
    register_taxonomy( 'clients-type', 
        array('clients'), # register taxonomy for these post types
        array('hierarchical' => true, # if this is true, it acts like categories             
            'labels' => array(
                'name' => __( 'Clients Type', 'adstyles'),
                'singular_name' => __( 'Clients Type', 'adstyles'), 
                'search_items' =>  __( 'Search Clients Type', 'adstyles'),
                'all_items' => __( 'All Clients Type', 'adstyles'), 
                'parent_item' => __( 'Parent Clients Type', 'adstyles'), 
                'parent_item_colon' => __( 'Parent Clients Type:', 'adstyles'), 
                'edit_item' => __( 'Edit Clients Type', 'adstyles'), 
                'update_item' => __( 'Update Clients Type', 'adstyles'), 
                'add_new_item' => __( 'Add New Clients Type', 'adstyles'),
                'new_item_name' => __( 'New Clients Type Name', 'adstyles'),
            ),
            'show_ui' => true,
            'query_var' => false,
            'rewrite' => false,
        )
    );


    /* ----------------------------------------------------
    Online Performances
    ---------------------------------------------------- */
    
    $labels = array
    (
        'name'                      => 'Online',
        'singular_name'             => 'Online Item',
        'add_new'                   => _x('Add New', 'Online Item'),
        'add_new_item'              => 'Add New Online Item',
        'edit_item'                 => 'Edit Online Item',
        'new_item'                  => 'New Online Item',
        'view_item'                 => 'View Online Item',
        'search_items'              => 'Search Online Items',
        'not_found'                 => 'No Online Item found',
        'not_found_in_trash'        => 'No Online Item found in Trash',
        'parent_item_colon'         => '',

        'menu_name'                 => 'Online'
    );
    
    $args['labels']                 = $labels;
    $args['supports']               = array('title', 'editor', 'thumbnail', 'excerpt');
    // $args['rewrite']                = array('xxx' => 'xxx');
    $args['rewrite']                = array('slug' => 'events/online');
    $args['menu_icon']              = 'dashicons-welcome-view-site';
    $args['show_in_menu']           = true;
    
    register_post_type('online', $args);

    # Add a custom taxonomy
    register_taxonomy( 'online-type', 
        array('online'), # register taxonomy for these post types
        array('hierarchical' => true, # if this is true, it acts like categories             
            'labels' => array(
                'name' => __( 'Online Type', 'adstyles'),
                'singular_name' => __( 'Online Type', 'adstyles'), 
                'search_items' =>  __( 'Search Online Type', 'adstyles'),
                'all_items' => __( 'All Online Type', 'adstyles'), 
                'parent_item' => __( 'Parent Online Type', 'adstyles'), 
                'parent_item_colon' => __( 'Parent Online Type:', 'adstyles'), 
                'edit_item' => __( 'Edit Online Type', 'adstyles'), 
                'update_item' => __( 'Update Online Type', 'adstyles'), 
                'add_new_item' => __( 'Add New Online Type', 'adstyles'),
                'new_item_name' => __( 'New Online Type Name', 'adstyles'),
            ),
            'show_ui' => true,
            'query_var' => false,
            'rewrite' => false,
        )
    );



    /* ----------------------------------------------------
    Magazine
    ---------------------------------------------------- */
    
    // $labels = array
    // (
    //     'name'                      => 'Magazine',
    //     'singular_name'             => 'Magazine Item',
    //     'add_new'                   => _x('Add New', 'Magazine Item'),
    //     'add_new_item'              => 'Add New Magazine Item',
    //     'edit_item'                 => 'Edit Magazine Item',
    //     'new_item'                  => 'New Magazine Item',
    //     'view_item'                 => 'View Magazine Item',
    //     'search_items'              => 'Search Magazine Items',
    //     'not_found'                 => 'No Magazine Item found',
    //     'not_found_in_trash'        => 'No Magazine Item found in Trash',
    //     'parent_item_colon'         => '',

    //     'menu_name'                 => 'Magazine'
    // );
    
    // $args['labels']                 = $labels;
    // $args['supports']               = array('title', 'editor', 'thumbnail', 'excerpt');
    // // $args['rewrite']                = array('xxx' => 'xxx');
    // $args['rewrite']                = array('slug' => 'magazine');
    // $args['menu_icon']              = 'dashicons-playlist-video';
    // $args['show_in_menu']           = true;
    
    // register_post_type('magazine', $args);

    // # Add a custom taxonomy
    // register_taxonomy( 'magazine-content-type', 
    //     array('magazine'), # register taxonomy for these post types
    //     array('hierarchical' => true, # if this is true, it acts like categories             
    //         'labels' => array(
    //             'name' => __( 'Magazine-Content Type', 'adstyles'),
    //             'singular_name' => __( 'Magazine-Content Type', 'adstyles'), 
    //             'search_items' =>  __( 'Search Magazine-Content Type', 'adstyles'),
    //             'all_items' => __( 'All Magazine-Content Type', 'adstyles'), 
    //             'parent_item' => __( 'Parent Magazine-Content Type', 'adstyles'), 
    //             'parent_item_colon' => __( 'Parent Magazine-Content Type:', 'adstyles'), 
    //             'edit_item' => __( 'Edit Magazine-Content Type', 'adstyles'), 
    //             'update_item' => __( 'Update Magazine-Content Type', 'adstyles'), 
    //             'add_new_item' => __( 'Add New Magazine-Content Type', 'adstyles'),
    //             'new_item_name' => __( 'New Magazine-Content Type Name', 'adstyles'),
    //         ),
    //         'show_ui' => true,
    //         'query_var' => false,
    //         'rewrite' => false,
    //     )
    // );


}


?>