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
		
		<div id="loading-delay">
			<div class="loader">
				<div class="ball-scale-ripple-multiple">
					<div></div>
					<div></div>
					<div></div>
				</div>
			</div>
		</div>
		
	<?php do_action( 'foundationpress_after_body' ); ?>

	<?php //if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
	<!-- <div class="off-canvas-wrapper"> -->
		<!-- <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper> -->
		<?php //get_template_part( 'template-parts/mobile-off-canvas' ); ?>
	<?php //endif; ?>

	<?php do_action( 'foundationpress_layout_start' ); ?>

	<div id="top"></div>

	<header id="masthead" class="site-header" role="banner">
		<div class="title-bar" data-responsive-toggle="site-navigation" data-hide-for="large">
			<button class="menu-icon" type="button" data-toggle="mobile-menu"></button>
			<div class="title-bar-title">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
					<!-- <img src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-logo.png"> -->
					<svg width="225px" height="50px" viewBox="0 0 225 50" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
					    <title>Group 8</title>
					    <desc>Created with Sketch.</desc>
					    <defs>
					        <polygon id="path-1" points="162.036786 20.7066548 162.036786 0.86772619 0.298714286 0.86772619 0.298714286 20.7066548 162.036786 20.7066548"></polygon>
					    </defs>
					    <g id="Wireframes" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
					        <g id="WF-Magazine-–-Article" transform="translate(-40.000000, -43.000000)">
					            <g id="Group-8" transform="translate(40.000000, 43.000000)">
					                <path d="M24.9272857,49.855 C22.1112143,49.855 19.3369286,49.3814286 16.6819286,48.4478571 L16.4226429,48.3564286 C6.59942857,44.78 0.000142857145,35.3646429 0.000142857145,24.9275 C0.000142857145,11.1825 11.1822857,0 24.9272857,0 C38.6722857,0 49.8547857,11.1825 49.8547857,24.9275 C49.8547857,38.6725 38.6722857,49.855 24.9272857,49.855 L24.9272857,49.855 Z M18.0340714,47.1282143 C20.2669286,47.8232143 22.5858571,48.1757143 24.9272857,48.1757143 C27.2687143,48.1757143 29.588,47.8232143 31.8212143,47.1282143 L31.8212143,26.0835714 L18.0340714,26.0835714 L18.0340714,47.1282143 Z M33.4997857,46.5342857 C41.9619286,43.1696429 47.6933571,35.1664286 48.1412143,26.0835714 L33.4997857,26.0835714 L33.4997857,46.5342857 Z M7.88014286,40.7185714 C10.2283571,43.2510714 13.1544286,45.2585714 16.3547857,46.5342857 L16.3547857,28.0871429 L7.88014286,40.7185714 Z M1.71371429,26.0835714 C1.95335714,30.9735714 3.69085714,35.5721429 6.74407143,39.3978571 L15.6776429,26.0835714 L1.71371429,26.0835714 Z M48.1655,24.4046429 C47.9558571,15.1839286 42.0794286,6.73964286 33.4997857,3.32035714 L33.4997857,24.4046429 L48.1655,24.4046429 Z M31.8212143,24.4046429 L31.8212143,5.03571429 L18.8258571,24.4046429 L31.8212143,24.4046429 Z M16.3547857,24.4046429 L16.3547857,3.32035714 C7.77514286,6.73964286 1.89907143,15.1839286 1.68942857,24.4046429 L16.3547857,24.4046429 Z M18.0340714,22.5714286 L31.4305,2.60428571 C29.3244286,1.99035714 27.1369286,1.67892857 24.9272857,1.67892857 C22.5862143,1.67892857 20.2676429,2.03142857 18.0340714,2.72642857 L18.0340714,22.5714286 Z" id="Fill-1" fill="#000000"></path>
					                <g id="Group-3" transform="translate(62.500000, 13.541667)">
					                    <mask id="mask-2" fill="white">
					                        <use xlink:href="#path-1"></use>
					                    </mask>
					                    <g id="Clip-4"></g>
					                    <path d="M8.66835714,1.14344048 L0.298714286,20.4309405 L1.96157143,20.4309405 L4.51121429,14.617369 L13.9340714,14.617369 L16.4837143,20.4309405 L18.1465714,20.4309405 L9.77692857,1.14344048 L8.66835714,1.14344048 Z M9.22264286,3.73344048 L13.2412143,13.0466548 L5.17621429,13.0466548 L9.22264286,3.73344048 Z M19.2551429,18.9155833 C20.3637143,19.9352262 22.0544286,20.7066548 24.1605,20.7066548 C26.5440714,20.7066548 28.5394286,19.2737976 28.5394286,16.9316548 C28.5394286,12.5230833 21.2505,14.0109405 21.2505,11.2280833 C21.2505,9.76772619 22.7194286,9.07879762 24.0497857,9.07879762 C25.3522857,9.07879762 26.1283571,9.4095119 27.2090714,10.0984405 L28.0405,8.80344048 C27.0983571,8.1695119 25.6847857,7.59094048 23.9665714,7.59094048 C21.8326429,7.59094048 19.6708571,8.96879762 19.6708571,11.2555833 C19.6708571,15.5541548 26.9597857,13.7905833 26.9597857,17.0145119 C26.9597857,18.3370119 25.6294286,19.2187976 24.0497857,19.2187976 C22.6362143,19.2187976 21.3062143,18.612369 20.2251429,17.7030833 L19.2551429,18.9155833 Z M43.2555,20.4309405 L35.7447857,13.5152262 L42.6733571,7.86665476 L40.3176429,7.86665476 L33.8601429,13.1016548 L33.8601429,0.86772619 L32.2805,0.86772619 L32.2805,20.4309405 L33.8601429,20.4309405 L33.8601429,13.7905833 L41.0383571,20.4309405 L43.2555,20.4309405 Z M55.6712143,14.1487976 C55.6712143,16.9591548 53.5926429,19.2187976 50.738,19.2187976 C47.8833571,19.2187976 45.8047857,16.9591548 45.8047857,14.1487976 C45.8047857,11.3384405 47.8833571,9.07879762 50.738,9.07879762 C53.5926429,9.07879762 55.6712143,11.3384405 55.6712143,14.1487976 L55.6712143,14.1487976 Z M57.2508571,14.1487976 C57.2508571,10.5391548 54.5072857,7.59094048 50.738,7.59094048 C46.9690714,7.59094048 44.2251429,10.5391548 44.2251429,14.1487976 C44.2251429,17.7584405 46.9690714,20.7066548 50.738,20.7066548 C54.5072857,20.7066548 57.2508571,17.7584405 57.2508571,14.1487976 L57.2508571,14.1487976 Z M62.378,7.86665476 L60.8537143,7.86665476 L60.8537143,20.4309405 L62.4333571,20.4309405 L62.4333571,11.6966548 C63.4033571,10.0434405 64.983,9.07879762 66.8122857,9.07879762 C68.198,9.07879762 69.3897857,9.71272619 70.1101429,10.7595119 C70.5537143,11.3934405 70.8308571,12.192369 70.8308571,13.8455833 L70.8308571,20.4309405 L72.4105,20.4309405 L72.4105,13.7355833 C72.4105,11.6687976 72.0226429,10.6220119 71.3297857,9.71272619 C70.3044286,8.33486905 68.6690714,7.59094048 66.8401429,7.59094048 C65.0662143,7.59094048 63.4033571,8.27986905 62.378,9.62986905 L62.378,7.86665476 Z M88.263,20.4309405 L88.263,7.86665476 L86.7387143,7.86665476 L86.7387143,9.60236905 C85.6022857,8.33486905 83.9394286,7.59094048 82.1105,7.59094048 C80.5862143,7.59094048 79.1451429,8.1420119 78.0919286,8.99629762 C76.6508571,10.2084405 75.7362143,12.054869 75.7362143,14.1487976 C75.7362143,16.4080833 76.7615714,18.3645119 78.4244286,19.5216548 C79.6715714,20.4034405 81.0019286,20.7066548 82.1937143,20.7066548 C84.1612143,20.7066548 85.7965714,19.852369 86.7387143,18.584869 L86.7387143,20.4309405 L88.263,20.4309405 Z M86.6833571,16.4634405 C85.6855,18.1716548 84.0226429,19.2187976 82.1658571,19.2187976 C81.0851429,19.2187976 80.1151429,18.8330833 79.3112143,18.2820119 C78.0919286,17.4277262 77.3158571,15.8845119 77.3158571,14.1487976 C77.3158571,12.5230833 77.9808571,11.0627262 79.0894286,10.1534405 C79.9765714,9.4370119 81.0851429,9.07879762 82.138,9.07879762 C84.4662143,9.07879762 86.1290714,10.6770119 86.6833571,11.6137976 L86.6833571,16.4634405 Z M91.7269286,18.9155833 C92.8355,19.9352262 94.5258571,20.7066548 96.6322857,20.7066548 C99.0158571,20.7066548 101.011214,19.2737976 101.011214,16.9316548 C101.011214,12.5230833 93.7222857,14.0109405 93.7222857,11.2280833 C93.7222857,9.76772619 95.1912143,9.07879762 96.5215714,9.07879762 C97.8240714,9.07879762 98.6001429,9.4095119 99.6808571,10.0984405 L100.512286,8.80344048 C99.5701429,8.1695119 98.1565714,7.59094048 96.4383571,7.59094048 C94.3044286,7.59094048 92.1426429,8.96879762 92.1426429,11.2555833 C92.1426429,15.5541548 99.4315714,13.7905833 99.4315714,17.0145119 C99.4315714,18.3370119 98.1012143,19.2187976 96.5215714,19.2187976 C95.108,19.2187976 93.7776429,18.612369 92.6969286,17.7030833 L91.7269286,18.9155833 Z M126.507643,20.4309405 L128.1705,20.4309405 L128.1705,1.14344048 L126.507643,1.14344048 L126.507643,8.99629762 L114.036214,8.99629762 L114.036214,1.14344048 L112.373357,1.14344048 L112.373357,20.4309405 L114.036214,20.4309405 L114.036214,10.5666548 L126.507643,10.5666548 L126.507643,20.4309405 Z M143.358,14.1487976 C143.358,16.9591548 141.279071,19.2187976 138.424786,19.2187976 C135.570143,19.2187976 133.491571,16.9591548 133.491571,14.1487976 C133.491571,11.3384405 135.570143,9.07879762 138.424786,9.07879762 C141.279071,9.07879762 143.358,11.3384405 143.358,14.1487976 L143.358,14.1487976 Z M144.937643,14.1487976 C144.937643,10.5391548 142.193714,7.59094048 138.424786,7.59094048 C134.6555,7.59094048 131.911929,10.5391548 131.911929,14.1487976 C131.911929,17.7584405 134.6555,20.7066548 138.424786,20.7066548 C142.193714,20.7066548 144.937643,17.7584405 144.937643,14.1487976 L144.937643,14.1487976 Z M148.540143,20.4309405 L150.119786,20.4309405 L150.119786,0.86772619 L148.540143,0.86772619 L148.540143,20.4309405 Z M162.036929,7.86665476 L157.741214,7.86665476 L157.741214,4.44986905 L156.161571,4.44986905 L156.161571,7.86665476 L152.614071,7.86665476 L152.614071,9.3545119 L156.161571,9.3545119 L156.161571,16.1877262 C156.161571,17.6755833 156.466214,18.584869 157.0205,19.2737976 C157.879786,20.3484405 159.237643,20.7066548 160.401571,20.7066548 C160.9005,20.7066548 161.621214,20.6237976 162.036929,20.4862976 L161.759786,19.0534405 C161.288714,19.1912976 160.761929,19.2187976 160.401571,19.2187976 C159.459429,19.2187976 158.738714,18.8880833 158.2955,18.3370119 C157.963,17.9237976 157.741214,17.3727262 157.741214,16.2427262 L157.741214,9.3545119 L162.036929,9.3545119 L162.036929,7.86665476 Z" id="Fill-3" fill="#000000" mask="url(#mask-2)"></path>
					                </g>
					            </g>
					        </g>
					    </g>
					</svg>
				</a>
			</div>
		</div>

		<nav id="site-navigation" class="main-navigation top-bar" role="navigation">

			<div class="top-bar-left">
				<ul class="menu">
					<li class="home">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
							<!-- <img class="nav-logo" src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-logo.png"> -->
							<svg width="225px" height="50px" viewBox="0 0 225 50" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
							    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
							    <title>Group 8</title>
							    <desc>Created with Sketch.</desc>
							    <defs>
							        <polygon id="path-1" points="162.036786 20.7066548 162.036786 0.86772619 0.298714286 0.86772619 0.298714286 20.7066548 162.036786 20.7066548"></polygon>
							    </defs>
							    <g id="Wireframes" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
							        <g id="WF-Magazine-–-Article" transform="translate(-40.000000, -43.000000)">
							            <g id="Group-8" transform="translate(40.000000, 43.000000)">
							                <path d="M24.9272857,49.855 C22.1112143,49.855 19.3369286,49.3814286 16.6819286,48.4478571 L16.4226429,48.3564286 C6.59942857,44.78 0.000142857145,35.3646429 0.000142857145,24.9275 C0.000142857145,11.1825 11.1822857,0 24.9272857,0 C38.6722857,0 49.8547857,11.1825 49.8547857,24.9275 C49.8547857,38.6725 38.6722857,49.855 24.9272857,49.855 L24.9272857,49.855 Z M18.0340714,47.1282143 C20.2669286,47.8232143 22.5858571,48.1757143 24.9272857,48.1757143 C27.2687143,48.1757143 29.588,47.8232143 31.8212143,47.1282143 L31.8212143,26.0835714 L18.0340714,26.0835714 L18.0340714,47.1282143 Z M33.4997857,46.5342857 C41.9619286,43.1696429 47.6933571,35.1664286 48.1412143,26.0835714 L33.4997857,26.0835714 L33.4997857,46.5342857 Z M7.88014286,40.7185714 C10.2283571,43.2510714 13.1544286,45.2585714 16.3547857,46.5342857 L16.3547857,28.0871429 L7.88014286,40.7185714 Z M1.71371429,26.0835714 C1.95335714,30.9735714 3.69085714,35.5721429 6.74407143,39.3978571 L15.6776429,26.0835714 L1.71371429,26.0835714 Z M48.1655,24.4046429 C47.9558571,15.1839286 42.0794286,6.73964286 33.4997857,3.32035714 L33.4997857,24.4046429 L48.1655,24.4046429 Z M31.8212143,24.4046429 L31.8212143,5.03571429 L18.8258571,24.4046429 L31.8212143,24.4046429 Z M16.3547857,24.4046429 L16.3547857,3.32035714 C7.77514286,6.73964286 1.89907143,15.1839286 1.68942857,24.4046429 L16.3547857,24.4046429 Z M18.0340714,22.5714286 L31.4305,2.60428571 C29.3244286,1.99035714 27.1369286,1.67892857 24.9272857,1.67892857 C22.5862143,1.67892857 20.2676429,2.03142857 18.0340714,2.72642857 L18.0340714,22.5714286 Z" id="Fill-1" fill="#000000"></path>
							                <g id="Group-3" transform="translate(62.500000, 13.541667)">
							                    <mask id="mask-2" fill="white">
							                        <use xlink:href="#path-1"></use>
							                    </mask>
							                    <g id="Clip-4"></g>
							                    <path d="M8.66835714,1.14344048 L0.298714286,20.4309405 L1.96157143,20.4309405 L4.51121429,14.617369 L13.9340714,14.617369 L16.4837143,20.4309405 L18.1465714,20.4309405 L9.77692857,1.14344048 L8.66835714,1.14344048 Z M9.22264286,3.73344048 L13.2412143,13.0466548 L5.17621429,13.0466548 L9.22264286,3.73344048 Z M19.2551429,18.9155833 C20.3637143,19.9352262 22.0544286,20.7066548 24.1605,20.7066548 C26.5440714,20.7066548 28.5394286,19.2737976 28.5394286,16.9316548 C28.5394286,12.5230833 21.2505,14.0109405 21.2505,11.2280833 C21.2505,9.76772619 22.7194286,9.07879762 24.0497857,9.07879762 C25.3522857,9.07879762 26.1283571,9.4095119 27.2090714,10.0984405 L28.0405,8.80344048 C27.0983571,8.1695119 25.6847857,7.59094048 23.9665714,7.59094048 C21.8326429,7.59094048 19.6708571,8.96879762 19.6708571,11.2555833 C19.6708571,15.5541548 26.9597857,13.7905833 26.9597857,17.0145119 C26.9597857,18.3370119 25.6294286,19.2187976 24.0497857,19.2187976 C22.6362143,19.2187976 21.3062143,18.612369 20.2251429,17.7030833 L19.2551429,18.9155833 Z M43.2555,20.4309405 L35.7447857,13.5152262 L42.6733571,7.86665476 L40.3176429,7.86665476 L33.8601429,13.1016548 L33.8601429,0.86772619 L32.2805,0.86772619 L32.2805,20.4309405 L33.8601429,20.4309405 L33.8601429,13.7905833 L41.0383571,20.4309405 L43.2555,20.4309405 Z M55.6712143,14.1487976 C55.6712143,16.9591548 53.5926429,19.2187976 50.738,19.2187976 C47.8833571,19.2187976 45.8047857,16.9591548 45.8047857,14.1487976 C45.8047857,11.3384405 47.8833571,9.07879762 50.738,9.07879762 C53.5926429,9.07879762 55.6712143,11.3384405 55.6712143,14.1487976 L55.6712143,14.1487976 Z M57.2508571,14.1487976 C57.2508571,10.5391548 54.5072857,7.59094048 50.738,7.59094048 C46.9690714,7.59094048 44.2251429,10.5391548 44.2251429,14.1487976 C44.2251429,17.7584405 46.9690714,20.7066548 50.738,20.7066548 C54.5072857,20.7066548 57.2508571,17.7584405 57.2508571,14.1487976 L57.2508571,14.1487976 Z M62.378,7.86665476 L60.8537143,7.86665476 L60.8537143,20.4309405 L62.4333571,20.4309405 L62.4333571,11.6966548 C63.4033571,10.0434405 64.983,9.07879762 66.8122857,9.07879762 C68.198,9.07879762 69.3897857,9.71272619 70.1101429,10.7595119 C70.5537143,11.3934405 70.8308571,12.192369 70.8308571,13.8455833 L70.8308571,20.4309405 L72.4105,20.4309405 L72.4105,13.7355833 C72.4105,11.6687976 72.0226429,10.6220119 71.3297857,9.71272619 C70.3044286,8.33486905 68.6690714,7.59094048 66.8401429,7.59094048 C65.0662143,7.59094048 63.4033571,8.27986905 62.378,9.62986905 L62.378,7.86665476 Z M88.263,20.4309405 L88.263,7.86665476 L86.7387143,7.86665476 L86.7387143,9.60236905 C85.6022857,8.33486905 83.9394286,7.59094048 82.1105,7.59094048 C80.5862143,7.59094048 79.1451429,8.1420119 78.0919286,8.99629762 C76.6508571,10.2084405 75.7362143,12.054869 75.7362143,14.1487976 C75.7362143,16.4080833 76.7615714,18.3645119 78.4244286,19.5216548 C79.6715714,20.4034405 81.0019286,20.7066548 82.1937143,20.7066548 C84.1612143,20.7066548 85.7965714,19.852369 86.7387143,18.584869 L86.7387143,20.4309405 L88.263,20.4309405 Z M86.6833571,16.4634405 C85.6855,18.1716548 84.0226429,19.2187976 82.1658571,19.2187976 C81.0851429,19.2187976 80.1151429,18.8330833 79.3112143,18.2820119 C78.0919286,17.4277262 77.3158571,15.8845119 77.3158571,14.1487976 C77.3158571,12.5230833 77.9808571,11.0627262 79.0894286,10.1534405 C79.9765714,9.4370119 81.0851429,9.07879762 82.138,9.07879762 C84.4662143,9.07879762 86.1290714,10.6770119 86.6833571,11.6137976 L86.6833571,16.4634405 Z M91.7269286,18.9155833 C92.8355,19.9352262 94.5258571,20.7066548 96.6322857,20.7066548 C99.0158571,20.7066548 101.011214,19.2737976 101.011214,16.9316548 C101.011214,12.5230833 93.7222857,14.0109405 93.7222857,11.2280833 C93.7222857,9.76772619 95.1912143,9.07879762 96.5215714,9.07879762 C97.8240714,9.07879762 98.6001429,9.4095119 99.6808571,10.0984405 L100.512286,8.80344048 C99.5701429,8.1695119 98.1565714,7.59094048 96.4383571,7.59094048 C94.3044286,7.59094048 92.1426429,8.96879762 92.1426429,11.2555833 C92.1426429,15.5541548 99.4315714,13.7905833 99.4315714,17.0145119 C99.4315714,18.3370119 98.1012143,19.2187976 96.5215714,19.2187976 C95.108,19.2187976 93.7776429,18.612369 92.6969286,17.7030833 L91.7269286,18.9155833 Z M126.507643,20.4309405 L128.1705,20.4309405 L128.1705,1.14344048 L126.507643,1.14344048 L126.507643,8.99629762 L114.036214,8.99629762 L114.036214,1.14344048 L112.373357,1.14344048 L112.373357,20.4309405 L114.036214,20.4309405 L114.036214,10.5666548 L126.507643,10.5666548 L126.507643,20.4309405 Z M143.358,14.1487976 C143.358,16.9591548 141.279071,19.2187976 138.424786,19.2187976 C135.570143,19.2187976 133.491571,16.9591548 133.491571,14.1487976 C133.491571,11.3384405 135.570143,9.07879762 138.424786,9.07879762 C141.279071,9.07879762 143.358,11.3384405 143.358,14.1487976 L143.358,14.1487976 Z M144.937643,14.1487976 C144.937643,10.5391548 142.193714,7.59094048 138.424786,7.59094048 C134.6555,7.59094048 131.911929,10.5391548 131.911929,14.1487976 C131.911929,17.7584405 134.6555,20.7066548 138.424786,20.7066548 C142.193714,20.7066548 144.937643,17.7584405 144.937643,14.1487976 L144.937643,14.1487976 Z M148.540143,20.4309405 L150.119786,20.4309405 L150.119786,0.86772619 L148.540143,0.86772619 L148.540143,20.4309405 Z M162.036929,7.86665476 L157.741214,7.86665476 L157.741214,4.44986905 L156.161571,4.44986905 L156.161571,7.86665476 L152.614071,7.86665476 L152.614071,9.3545119 L156.161571,9.3545119 L156.161571,16.1877262 C156.161571,17.6755833 156.466214,18.584869 157.0205,19.2737976 C157.879786,20.3484405 159.237643,20.7066548 160.401571,20.7066548 C160.9005,20.7066548 161.621214,20.6237976 162.036929,20.4862976 L161.759786,19.0534405 C161.288714,19.1912976 160.761929,19.2187976 160.401571,19.2187976 C159.459429,19.2187976 158.738714,18.8880833 158.2955,18.3370119 C157.963,17.9237976 157.741214,17.3727262 157.741214,16.2427262 L157.741214,9.3545119 L162.036929,9.3545119 L162.036929,7.86665476 Z" id="Fill-3" fill="#000000" mask="url(#mask-2)"></path>
							                </g>
							            </g>
							        </g>
							    </g>
							</svg>
						</a>
					</li>
				</ul>
			</div>

			<div class="top-bar-right fd-animate">
				<?php foundationpress_top_bar_r(); ?>
				<?php //wp_nav_menu( array( 'theme_location' => 'top-bar-r' ) ); ?>

				<?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
					<?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
				<?php endif; ?>
			</div>
					

		</nav>

		<div class="header-social-area show-for-small">
				
			<a class="social-button" href="https://www.facebook.com/askonasholt/" target="_blank">
				<i class="fa fa-facebook fa-2x social-icon" aria-hidden="true"></i>
			</a>
			<a class="social-button" href="https://www.instagram.com/askonasholt/" target="_blank">
				<i class="fa fa-instagram fa-2x social-icon" aria-hidden="true"></i>
			</a>
			<a class="social-button" href="https://twitter.com/AskonasHolt?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" target="_blank">
				<i class="fa fa-twitter fa-2x social-icon" aria-hidden="true"></i>
			</a>
			<a class="social-button" href="https://www.youtube.com/user/AskonasHolt" target="_blank">
				<i class="fa fa-youtube-play fa-2x social-icon" aria-hidden="true"></i>
			</a>
			<div id="search-toggle" class="header-search-toggle button show-for-small">
				<svg width="20px" height="20px" viewBox="1377 56 23 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

				    <g id="Group-23" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(1378.000000, 57.000000)">
				        <rect id="Rectangle-Copy-5" stroke="#000000" x="3" y="0" width="18" height="18" rx="9"></rect>
				        <path d="M0,16 L5.5,21.5" id="Line" stroke="#000000" stroke-linecap="square" transform="translate(2.750000, 18.750000) scale(-1, 1) translate(-2.750000, -18.750000) "></path>
				    </g>
				</svg>
			</div>

		</div>

		<div id="searchbar" class="searchbar row" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/dark-pattern.png');">
				<?php get_search_form(); ?>
		</div>

	</header>

	
	<section class="container">
		<?php do_action( 'foundationpress_after_header' );
