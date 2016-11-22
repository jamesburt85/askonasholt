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
add_filter('pre_get_posts', 'query_post_type');
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

