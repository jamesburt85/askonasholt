<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<?php wp_head(); ?>
	</head>
	<body <?php body_class(); ?>>
	<?php do_action( 'foundationpress_after_body' ); ?>

	<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
	<div class="off-canvas-wrapper">
		<div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
		<?php get_template_part( 'template-parts/mobile-off-canvas' ); ?>
	<?php endif; ?>

	<?php do_action( 'foundationpress_layout_start' ); ?>

	<header id="masthead" class="site-header" role="banner">
		<div class="title-bar" data-responsive-toggle="site-navigation">
			<button class="menu-icon" type="button" data-toggle="mobile-menu"></button>
			<div class="title-bar-title">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><img src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-logo.png"></a>
			</div>
		</div>

		<nav id="site-navigation" class="main-navigation top-bar" role="navigation">
			<div class="top-bar-left">
				<ul class="menu">
					<li class="home">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
							<img class="nav-logo" src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-logo.png">
						</a>
					</li>
				</ul>
			</div>
			<div class="top-bar-right">
				<?php //foundationpress_top_bar_r(); ?>
				<?php wp_nav_menu( array( 'theme_location' => 'top-bar-r' ) ); ?>

				<?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
					<?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
				<?php endif; ?>
			</div>
			<div class="header-social-area show-for-medium">
				<a href="https://www.facebook.com/askonasholt/" target="_blank"><i class="fa fa-facebook fa-2x social-icon" aria-hidden="true"></i></a>
				<a href="https://www.instagram.com/askonasholt/" target="_blank"><i class="fa fa-instagram fa-2x social-icon" aria-hidden="true"></i></a>
				<a href="https://twitter.com/AskonasHolt?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" target="_blank"><i class="fa fa-twitter fa-2x social-icon" aria-hidden="true"></i></a>
				<a href="https://www.youtube.com/user/AskonasHolt" target="_blank"><i class="fa fa-youtube-play fa-2x social-icon" aria-hidden="true"></i></a>
			</div>
			<div class="header-search show-for-medium">
					<!-- <i class="fa fa-search" aria-hidden="true"></i> -->
				<?php get_search_form(); ?>
			</div>
		</nav>
	</header>

	<section class="container">
		<?php do_action( 'foundationpress_after_header' );
