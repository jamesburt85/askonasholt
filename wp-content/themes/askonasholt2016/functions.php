<?php
/**
 * Author: Ole Fredrik Lie
 * URL: http://olefredrik.com
 *
 * FoundationPress functions and definitions
 *
 * Set up the theme and provides some helper functions, which are used in the
 * theme as custom template tags. Others are attached to action and filter
 * hooks in WordPress to change core functionality.
 *
 * @link https://codex.wordpress.org/Theme_Development
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

/** Various clean up functions */
require_once( 'library/cleanup.php' );

/** Required for Foundation to work properly */
require_once( 'library/foundation.php' );

/** Register all navigation menus */
require_once( 'library/navigation.php' );

/** Add menu walkers for top-bar and off-canvas */
require_once( 'library/menu-walkers.php' );

/** Create widget areas in sidebar and footer */
require_once( 'library/widget-areas.php' );

/** Return entry meta information for posts */
require_once( 'library/entry-meta.php' );

/** Enqueue scripts */
require_once( 'library/enqueue-scripts.php' );

/** Add theme support */
require_once( 'library/theme-support.php' );

/** Add Nav Options to Customer */
require_once( 'library/custom-nav.php' );

/** Change WP's sticky post class */
require_once( 'library/sticky-posts.php' );

/** Configure responsive image sizes */
require_once( 'library/responsive-images.php' );

/** Custom Post Types */
require_once( 'library/custom-post-types.php' );

/** WIAW Ajax pages */
require_once( 'library/ajaxloadmore.php' );

/* events functions */
require_once( 'library/events-ajax.php' );

/** If your site requires protocol relative url's for theme assets, uncomment the line below */
// require_once( 'library/protocol-relative-theme-assets.php' );

// options page
if( function_exists('acf_add_options_page')) {

	$page = acf_add_options_page(array(
		'page_title' 	=> 'General Settings',
		'menu_title' 	=> 'Settings',
		'menu_slug' 	=> 'general-settings',
		'capability' 	=> 'delete_others_pages', // Editor's only
		'redirect' 	=> false
	));

}


/// add categories to CPTs
//add_filter('pre_get_posts', 'query_post_type');
function query_post_type($query) {
  if( is_category() ) {
    $post_type = get_query_var('post_type');
    if($post_type)
        $post_type = $post_type;
    else
        $post_type = array('nav_menu_item', 'artists'); // don't forget nav_menu_item to allow menus to work!
    $query->set('post_type',$post_type);
    return $query;
    }
}



// add class to categories in wp_list_categories with children
// http://wordpress.stackexchange.com/questions/93627/wp-list-categories-add-class-to-all-list-items-with-children
class Walker_Category_Find_Parents extends Walker_Category {
    function start_el( &$output, $category, $depth = 0, $args = array(), $id = 0 ) {
        extract($args);

        $cat_name = esc_attr( $category->name );
        $cat_name = apply_filters( 'list_cats', $cat_name, $category );
        $link = '<a href="' . esc_url( get_term_link($category) ) . '" ';
        if ( $use_desc_for_title == 0 || empty($category->description) )
            $link .= 'title="' . esc_attr( sprintf(__( 'View all posts filed under %s' ), $cat_name) ) . '"';
        else
            $link .= 'title="' . esc_attr( strip_tags( apply_filters( 'category_description', $category->description, $category ) ) ) . '"';
            $link .= '>';
            $link .= $cat_name . '</a>';

        if ( !empty($show_count) )
            $link .= ' (' . intval($category->count) . ')';

                if ( 'list' == $args['style'] ) {
                        $output .= "\t<li";
                        $class = 'cat-item cat-item-' . $category->term_id;

                        $termchildren = get_term_children( $category->term_id, $category->taxonomy );
                        if(count($termchildren)>0){
                            $class .=  ' i-have-kids';
                        }

                        if ( !empty($current_category) ) {
                                $_current_category = get_term( $current_category, $category->taxonomy );
                                if ( $category->term_id == $current_category )
                                        $class .=  ' current-cat';
                                elseif ( $category->term_id == $_current_category->parent )
                                        $class .=  ' current-cat-parent';
                        }
                        $output .=  ' class="' . $class . '"';
                        $output .= ">$link\n";
                } else {
                        $output .= "\t$link<br />\n";
                }
        }
    }



    /**
     * Enables the Excerpt meta box in Page edit screen.
     */
    function wpcodex_add_excerpt_support_for_pages() {
        add_post_type_support( 'page', 'excerpt' );
    }
    add_action( 'init', 'wpcodex_add_excerpt_support_for_pages' );



    /**
     * Get taxonomies terms links.
     *
     * @see get_object_taxonomies()
     */
    function wpdocs_custom_taxonomies_terms_links() {
        // Get post by post ID.
        $post = get_post( $post->ID );
     
        // Get post type by post.
        $post_type = $post->post_type;
     
        // Get post type taxonomies.
        $taxonomies = get_object_taxonomies( $post_type, 'objects' );
     
        $out = array();
     
        foreach ( $taxonomies as $taxonomy_slug => $taxonomy ){
     
            // Get the terms related to post.
            $terms = get_the_terms( $post->ID, $taxonomy_slug );
     
            if ( ! empty( $terms ) ) {
                // $out[] = "<h2>" . $taxonomy->label . "</h2>\n<ul>";
                foreach ( $terms as $term ) {
                    $out[] = sprintf( '<li>%2$s</li>',
                        esc_url( get_term_link( $term->slug, $taxonomy_slug ) ),
                        esc_html( $term->name )
                    );
                }
                $out[] = "\n</ul>\n";
            }
        }
        return implode( '', $out );
    }



    //**************************************************
    // Limit the number of words in excerpt ************
    //**************************************************

    function custom_excerpt_length( $length ) {
            return 15;
        }
        add_filter( 'excerpt_length', 'custom_excerpt_length', 999 );




    
    // add ACF Google Maps key
    function my_acf_init() {
        acf_update_setting('google_api_key', 'AIzaSyBRB0IiSoOjvO1R-3hwhjAqaEqT7bRn1Bw');
    }

    add_action('acf/init', 'my_acf_init');





    # Change the "featured image" title on custom post types
    # - sample
    function eb_change_featured_image_title()
    {
        # artists post type
        remove_meta_box( 'postimagediv', 'artists', 'side' );
        add_meta_box('postimagediv', __('Artist Image'), 'post_thumbnail_meta_box', 'artists', 'normal', 'high');

        # clients post type
        remove_meta_box( 'postimagediv', 'clients', 'side' );
        add_meta_box('postimagediv', __('Client Image'), 'post_thumbnail_meta_box', 'clients', 'normal', 'high');

        # touring-partners post type
        remove_meta_box( 'postimagediv', 'touring-partners', 'side' );
        add_meta_box('postimagediv', __('Touring Partner Image'), 'post_thumbnail_meta_box', 'touring-partners', 'normal', 'high');

    }
    add_action('do_meta_boxes', 'eb_change_featured_image_title');



    //**************************************************
    // filter homepage posts to exclude audio/video
    //**************************************************
    # 
    # // adstyles

    function exclude_categories( $query ) {
        if ( is_page('home') ) {
            $query->set( 'cat', '-'.get_cat_ID('audio').',-'.get_cat_ID('video') );
        }
    }
    add_action( 'pre_get_posts', 'exclude_category' );



    //**************************************************
    // filter the default archive tours-projects archive to just show from one cat
    //**************************************************
    # 
    # // adstyles

    function filter_tours_archive_filter_get_posts($query) {
        // only change tours-projects. if its admin, dont do it, if its a template (like PAST TOURS template) then don't do it.
        if ( !$query->is_post_type_archive('tours-projects') || is_admin() || is_page_template() )
            return $query;

        // so this should just effect the /tours-and-projects/upcoming/ which is the main archive...
        $upcomingSeason = get_field('upcoming_season', 'option');

        // echo $upcomingSeason;
        // print_r($upcomingSeason);

        $upcomingSeasonID = $upcomingSeason->term_id;

        $taxquery = array(
            array(
                'taxonomy' => 'tour-season',
                'field' => 'id',
                'terms' => array( $upcomingSeasonID ),
                'operator'=> 'IN'
            )
        );

        $query->set( 'tax_query', $taxquery );

    }
    add_action( 'pre_get_posts', 'filter_tours_archive_filter_get_posts' );



    //**************************************************
    // Order artists by last name
    //**************************************************
    # 
    # // adstyles

      function be_artists_query( $query ) {
        
        if( $query->is_main_query() && !$query->is_feed() && !is_admin() && ($query->is_post_type_archive('artists') || $query->is_tax('artist-type')) ) {
            
            $args = ( array(
            'posts_per_page'    => 4,
            'meta_key'          => 'last_name',
            'orderby'           => 'meta_value',
            'order'             => 'ASC'
             ) );

            # Taxonomy Archive
            if ( !empty( $_GET['taxonomy'])) {

                $args['tax_query'] = array(
                    array(
                        'taxonomy' => $_GET['taxonomy'],
                        'field'    => 'slug',
                        'terms'    => $_GET['term']
                    ),
                );

            } else {
                $args['post_type'] = 'artists';
            }

            query_posts($args);

        }

      }
      add_action( 'pre_get_posts', 'be_artists_query' );


    //**************************************************
    // only show events that end date is either today or in future...
    //**************************************************
    # 
    # // adstyles

      function be_event_query( $query ) {
        
        if( $query->is_main_query() && !$query->is_feed() && !is_admin() && $query->is_post_type_archive( 'events' ) ) {
            
            $current_meta = $query->get('meta_query');

            $custom_meta = array(
               'key' => 'adstyles_end_date',
               'value' => date('Ymd'),
               'compare' => '>='
            );

            $meta_query = $current_meta[] = $custom_meta;
            $query->set( 'meta_query', array($meta_query) );
        
            $query->set( 'orderby', 'meta_value_num' );
            $query->set( 'meta_key', 'date' );
            $query->set( 'order', 'ASC' );
            // $query->set( 'posts_per_page', '4' );
        }
      }
      add_action( 'pre_get_posts', 'be_event_query' );  



      //**************************************************
      // Set Cookie and if cookie count is more than 'X', redirect to homepage... 
      //**************************************************


        add_action( 'template_redirect', 'my_cookie_redirect' );

        function my_cookie_redirect() {
            // if the cookie count is greater or equal to 3 and we're on the splash page...
            if ($_COOKIE['number_of_visits'] >= 3 && is_front_page()) {
                $homeID = get_field('homepage', 'option');
                wp_redirect( get_permalink($homeID) );
                exit;
            }
        }



        add_action( 'init', 'num_visits_cookie' );

        function num_visits_cookie() {
            if( !is_admin() && !isset($_COOKIE['number_of_visits'])){
                // new visitor! set a new cookie!
                $cookieCount = 1;
                setcookie( 'number_of_visits', $cookieCount, time()+3600*24*100, COOKIEPATH, COOKIE_DOMAIN );
            } else {
                // get cookie count
                $cookieCount = $_COOKIE['number_of_visits'];
                $cookieCount++;
                // and set this new number in the cookie count...
                setcookie( 'number_of_visits', $cookieCount, time()+3600*24*100, COOKIEPATH, COOKIE_DOMAIN );
            }
        }


        //**************************************************
        // Aplhebetise People Post types by last names
        //**************************************************

        add_action('pre_get_posts','wpse56753_businesses_default_order');
        function wpse56753_businesses_default_order( $query ){
            if( 'people' == $query->get('post_type') ){
                if( $query->get('orderby') == '' )
                    $query->set('orderby','wpse_last_word');

                if( $query->get('order') == '' )
                    $query->set('order','ASC');
            }
        }

























?>