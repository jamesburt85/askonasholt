<?php 








# Archive ajax function
/*
** $_POST['page']       = (int) Page number
** $_POST['post_type']  = (string) CPT post_type name
** $_POST['taxonomy']   = (string) Taxonomy Name
** $_POST['term_id']    = (int) Taxonomy Term ID
*/
function wiaw_archive_ajax() {

    global $post;

    # What page are we on?
    $posts_per_page = get_option( 'posts_per_page');
    $offset = ($_POST['page'] - 1) * $posts_per_page;

    # Set up the initial args
    $args = array(
        'posts_per_page'    => $posts_per_page,
        'offset'            => $offset
    );


    # Is this a post type archive, or a taxonomy archive
    $data = $_POST['data'];

    # Post Type Archive
    if ( !empty( $data['post_type'])) {
        $args['post_type'] = $data['post_type'];

        if($args['post_type'] == 'artists') {
            $args['meta_key'] = 'last_name';
            $args['orderby'] = 'meta_value';
            $args['order'] = 'ASC';
        }

    # Taxonomy Archive
    } else {
        $args['tax_query'] = array(
            array(
                'taxonomy' => $data['taxonomy'],
                'field'    => 'term_id',
                'terms'    => $data['term_id'],
            ),
        );

        if($data['taxonomy'] == 'artist-type') {
            $args['meta_key'] = 'last_name';
            $args['orderby'] = 'meta_value';
            $args['order'] = 'ASC';
        }        

        $args['post_type'] = 'any';

    }

    $posts = get_posts( $args );

    if( !empty( $posts)){
        foreach ($posts as $post) {
            setup_postdata( $post );
            // include( get_template_directory() . '/includes/snippets/' . $post->post_type . '-card.php');
            include( get_template_directory() . '/template-parts/content-' . $post->post_type . '.php');
        }
        wp_reset_postdata();
    // } else {
    //     echo 'shabba, shabba ranks';
    }
    die();
}
add_action( 'wp_ajax_nopriv_archive_load_more', 'wiaw_archive_ajax' );
add_action( 'wp_ajax_archive_load_more', 'wiaw_archive_ajax' );




# Universal ajax load more for archive pages
if ( !function_exists('wiaw_universal_ajax')) {
    function wiaw_universal_ajax(){

        # Globals
        global $wp_query, $post;
        $queried_object = get_queried_object();

        # Do we need a load more?
        if ($wp_query->max_num_pages > 1) : ?>

            <div id="ajax-before-me"></div>

            <div class="ajax-spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>

            <div class="archive__load-more">
                <?php next_posts_link(
                    __('Load More', 'wiaw')
                ); ?>
            </div>


            <?php # Is this a taxonomy archive?
            if( !empty( $queried_object->term_id)): ?>
                <input type="hidden" name="taxonomy" id="wiaw_taxonomy" value="<?php echo $queried_object->taxonomy ?>">
                <input type="hidden" name="term_id" id="wiaw_term_id" value="<?php echo $queried_object->term_id ?>">
            <?php elseif( !empty( $queried_object->query_var)): // it's a post type archive ?>
                <input type="hidden" name="post_type" id="wiaw_post_type" value="<?php echo $queried_object->query_var ?>">
            <?php else: // it's the index.php page ?>
                <input type="hidden" name="post_type" id="wiaw_post_type" value="post">
            <?php endif; ?>
            
            <hr/>

        <?php endif;
    }
}





# Display page next/previous navigation links.
if (!function_exists('wiaw_content_nav')):
    function wiaw_content_nav($nav_id) {

        global $wp_query, $post;

        if ($wp_query->max_num_pages > 1) : ?>

        <nav id="<?php echo $nav_id; ?>" class="page-navigation row" role="navigation">
            <h3 class="sr-only"><?php _e('Post navigation', 'wiaw'); ?></h3>
            <div class="nav-previous col-xs-6"><?php next_posts_link(
                __('<span class="meta-nav">&larr;</span> Older posts', 'wiaw')
            ); ?></div>
            <div class="nav-next col-xs-6"><?php previous_posts_link(
                __('Newer posts <span class="meta-nav">&rarr;</span>', 'wiaw')
            ); ?></div>
        </nav>

        <?php 
        endif;
    }
endif;






# Global function to display the most advanced nav possible
if (!function_exists('wiaw_archive_nav')):
    function wiaw_archive_nav(){
        if (function_exists('wiaw_universal_ajax')) {
            wiaw_universal_ajax();
        } elseif (function_exists('wp_pagenavi')) {
            wp_pagenavi();
        } else { 
            wiaw_content_nav('nav-below');
        }
    }
endif;
