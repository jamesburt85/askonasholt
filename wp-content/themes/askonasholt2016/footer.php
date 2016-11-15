<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

		</section>
		<div id="footer-container">
			<footer id="footer">
<!-- 				<img class="footer-logo">LOGO</h1>
				<img src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-favi.png" class="footer-logo"> -->
				<div class="footer-logo">
					<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
					 width="80.000000pt" height="80.000000pt" viewBox="0 0 512.000000 512.000000"
					 preserveAspectRatio="xMidYMid meet">
					<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
					fill="#000000" stroke="none">
					<path d="M2365 5114 c-16 -2 -73 -9 -125 -15 -298 -34 -649 -147 -915 -296
					-629 -351 -1077 -931 -1248 -1618 -58 -231 -71 -349 -71 -615 -1 -270 13 -384
					74 -626 49 -192 93 -312 186 -500 382 -782 1145 -1317 2014 -1415 230 -26 555
					-10 790 37 887 179 1630 838 1915 1699 142 427 169 913 74 1339 -105 474 -328
					889 -664 1235 -210 216 -420 370 -690 507 -295 149 -588 233 -920 264 -102 9
					-351 12 -420 4z m380 -174 c145 -13 204 -22 358 -57 71 -16 116 -31 114 -37
					-3 -6 -310 -465 -683 -1021 l-679 -1009 -3 1009 c-2 800 0 1010 10 1017 18 10
					247 64 333 78 180 28 370 35 550 20z m-1065 -1240 l0 -1080 -754 0 -754 0 5
					68 c36 571 246 1061 642 1501 143 158 387 350 595 466 55 31 253 125 264 125
					1 0 2 -486 2 -1080z m1943 994 c239 -120 406 -242 608 -443 80 -80 173 -182
					206 -226 298 -396 471 -846 500 -1302 l6 -103 -751 0 -752 0 0 1079 0 1080 38
					-16 c20 -8 86 -39 145 -69z m-363 -1089 l0 -985 -661 0 c-424 0 -659 3 -657
					10 3 11 1312 1959 1316 1960 1 0 2 -443 2 -985z m-1662 -1165 c-2 -6 -206
					-312 -453 -680 -434 -646 -450 -668 -469 -652 -38 34 -198 288 -256 406 -77
					158 -123 281 -166 443 -36 138 -74 364 -74 446 l0 47 711 0 c490 0 710 -3 707
					-10z m1662 -1069 l0 -1079 -81 -22 c-232 -62 -433 -85 -693 -77 -207 6 -312
					20 -508 68 l-128 31 0 1079 0 1079 705 0 705 0 0 -1079z m1680 1064 c0 -45
					-23 -223 -41 -315 -73 -381 -244 -748 -492 -1055 -92 -113 -294 -307 -417
					-399 -132 -98 -308 -203 -439 -261 -56 -25 -104 -45 -106 -45 -3 0 -5 470 -5
					1045 l0 1045 750 0 c669 0 750 -2 750 -15z m-3260 -1136 l0 -940 -22 6 c-13 4
					-81 35 -153 70 -218 107 -421 249 -614 432 l-85 79 435 647 c239 355 435 647
					437 647 1 0 2 -423 2 -941z"/>
					</g>
					</svg>
					
					Making Music happen
				</div>
				<?php do_action( 'foundationpress_before_footer' ); ?>
				<?php dynamic_sidebar( 'footer-widgets' ); ?>
				<?php do_action( 'foundationpress_after_footer' ); ?>
			</footer>
		</div>

		<?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) === 'offcanvas' ) : ?>
		</div><!-- Close off-canvas wrapper inner -->
	</div><!-- Close off-canvas wrapper -->
</div><!-- Close off-canvas content wrapper -->
<?php endif; ?>


<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>
</body>
</html>
