<?php
/**
 * Entry meta information for posts
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

if ( ! function_exists( 'foundationpress_entry_meta' ) ) :
	function foundationpress_entry_meta() {
		echo '<time class="updated" datetime="' . get_the_time( 'c' ) . '">' . sprintf( __( '%1$s at %2$s', 'foundationpress' ), get_the_date(), get_the_time() ) . '</time>';
		echo '<p class="byline author">' . __( 'Author:', 'foundationpress' ) . ' <a href="' . get_author_posts_url( get_the_author_meta( 'ID' ) ) . '" rel="author" class="fn">' . get_the_author() . '</a></p>';
	}
endif;
