<!-- Hero for single artists page -->

<?php 
	// get VARS
	// $artist_photo = get_field('artist_photo');
	$main_category = get_field('main_category');
	$photo_credit = get_field('photo_credit');
	$website = get_field('website');
	$contact_text_area = get_field('contact_text_area');
	$manager_email = get_field('manager_email');
	$email = get_field('artist_email');
	$email = get_field('client_email');
	$optional_text_area = get_field('optional_text_area');
?>

<div class="artist-header container">


	<div class="small-12 medium-6 columns artist-hero-image">
		<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
		<div class="artist-header-thumb" style="background-image: url('<?php echo $thumb['0'];?>')">
<!-- 			<div style="background-image: url('<?php //echo get_template_directory_uri(); ?>/assets/images/pattern.svg')">
			</div> -->
			<!-- <img src="<?php //echo get_template_directory_uri(); ?>/assets/images/pattern.svg"> -->


			<svg width="840px" height="594px" viewBox="0 0 840 594" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->
			    <title>ah-svg</title>
			    <desc>Created with Sketch.</desc>
			    <defs>
			        <path d="M1.18766958,-5.60923301e-14 L349.945312,-5.68434189e-14 L349.945312,450 L0.0235794966,450 C63.6598926,395.617871 104,314.769904 104,224.5 C104,134.781763 64.151448,54.3706549 1.18766958,-6.78568313e-13 Z" id="path-1"></path>
			    </defs>
			    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
			        <g id="Group" transform="translate(490.000000, 73.000000)">
			            <mask id="mask-2" fill="white">
			                <use xlink:href="#path-1"></use>
			            </mask>
			            <use id="Combined-Shape" fill-opacity="0.2" fill="#EBE6D6" xlink:href="#path-1"></use>
			            <g id="pattern" mask="url(#mask-2)" fill="#BD9C80">
			                <g transform="translate(-320.000000, 55.000000)">
			                    <path d="M379.512971,72.0051586 C399.820219,71.5438666 418.418401,58.6064825 425.9481,39.7133949 L379.512971,39.7133949 L379.512971,72.0051586 Z" id="Fill-1"></path>
			                    <path d="M111.264651,141.954784 C109.733254,137.036988 108.958938,131.930963 108.958938,126.775892 C108.958938,121.620822 109.733254,116.514797 111.264651,111.597 L157.613597,111.597 L157.613597,141.954784 L111.264651,141.954784 Z" id="Fill-3"></path>
			                    <path d="M2.30584581,141.954784 C0.774449162,137.036988 0.000132588455,131.930963 0.000132588455,126.775892 C0.000132588455,121.620822 0.774449162,116.514797 2.30584581,111.597 L48.6547918,111.597 L48.6547918,141.954784 L2.30584581,141.954784 Z" id="Fill-5"></path>
			                    <path d="M438.142525,322.711647 C436.611128,317.79385 435.836812,312.689151 435.836812,307.53408 C435.836812,302.377684 436.611128,297.272985 438.142525,292.355188 L484.491471,292.355188 L484.491471,322.711647 L438.142525,322.711647 Z" id="Fill-7"></path>
			                    <path d="M220.223589,322.711647 C218.692192,317.79385 217.919201,312.689151 217.919201,307.53408 C217.919201,302.377684 218.692192,297.272985 220.223589,292.355188 L266.572535,292.355188 L266.572535,322.711647 L220.223589,322.711647 Z" id="Fill-9"></path>
			                    <path d="M2.30584581,322.711647 C0.774449162,317.79385 0.000132588455,312.689151 0.000132588455,307.53408 C0.000132588455,302.377684 0.774449162,297.272985 2.30584581,292.355188 L48.6547918,292.355188 L48.6547918,322.711647 L2.30584581,322.711647 Z" id="Fill-11"></path>
			                    <path d="M488.472439,178.115833 L534.907568,178.115833 C527.376544,159.226722 508.779687,146.286687 488.472439,145.825395 L488.472439,178.115833 Z" id="Fill-13"></path>
			                    <path d="M52.6361579,178.115833 L99.0699605,178.115833 C91.5402622,159.226722 72.9434056,146.286687 52.6361579,145.825395 L52.6361579,178.115833 Z" id="Fill-15"></path>
			                    <path d="M379.512971,358.872696 L425.9481,358.872696 C418.418401,339.983585 399.820219,327.044875 379.512971,326.583583 L379.512971,358.872696 Z" id="Fill-17"></path>
			                    <path d="M161.595096,358.872696 L208.030224,358.872696 C200.4992,339.983585 181.902343,327.044875 161.595096,326.583583 L161.595096,358.872696 Z" id="Fill-19"></path>
			                    <path d="M52.6361579,358.872696 L99.0699605,358.872696 C91.5402622,339.983585 72.9434056,327.044875 52.6361579,326.583583 L52.6361579,358.872696 Z" id="Fill-21"></path>
			                    <path d="M48.6541289,214.373117 L2.21900037,214.373117 C9.75002458,195.484006 28.3468812,182.545297 48.6541289,182.084005 L48.6541289,214.373117 Z" id="Fill-23"></path>
			                    <path d="M375.532003,395.13104 L329.096874,395.13104 C336.627899,376.241929 355.224755,363.301894 375.532003,362.840602 L375.532003,395.13104 Z" id="Fill-25"></path>
			                    <path d="M266.572933,395.13104 L220.137804,395.13104 C227.667502,376.241929 246.264359,363.301894 266.572933,362.840602 L266.572933,395.13104 Z" id="Fill-27"></path>
			                    <path d="M48.6541289,395.13104 L2.21900037,395.13104 C9.75002458,376.241929 28.3468812,363.301894 48.6541289,362.840602 L48.6541289,395.13104 Z" id="Fill-29"></path>
			                    <polygon id="Fill-31" points="52.6361579 78.1025637 95.2938413 78.1025637 52.6361579 106.717247"></polygon>
			                    <polygon id="Fill-33" points="488.472572 258.860354 531.130255 258.860354 488.472572 287.473712"></polygon>
			                    <polygon id="Fill-35" points="52.6361579 258.860354 95.2938413 258.860354 52.6361579 287.473712"></polygon>
			                    <path d="M57.7835069,214.373117 L101.760445,184.876942 C103.111522,189.512396 103.79833,194.330776 103.79833,199.195551 C103.79833,204.349296 103.021362,209.455321 101.491291,214.373117 L57.7835069,214.373117 Z" id="Fill-37"></path>
			                    <path d="M493.620584,395.13104 L537.597523,365.634865 C538.948599,370.270319 539.635407,375.087374 539.635407,379.952148 C539.635407,385.107219 538.858439,390.211918 537.328368,395.13104 L493.620584,395.13104 Z" id="Fill-39"></path>
			                    <path d="M384.661381,395.13104 L428.63832,365.634865 C429.989396,370.270319 430.674878,375.087374 430.674878,379.952148 C430.674878,385.107219 429.899236,390.211918 428.369165,395.13104 L384.661381,395.13104 Z" id="Fill-41"></path>
			                    <path d="M166.743373,395.13104 L210.720311,365.634865 C212.071388,370.270319 212.75687,375.087374 212.75687,379.952148 C212.75687,385.107219 211.981228,390.211918 210.449831,395.13104 L166.743373,395.13104 Z" id="Fill-43"></path>
			                    <path d="M57.7835069,395.13104 L101.760445,365.634865 C103.111522,370.270319 103.79833,375.087374 103.79833,379.952148 C103.79833,385.107219 103.021362,390.211918 101.491291,395.13104 L57.7835069,395.13104 Z" id="Fill-45"></path>
			                    <path d="M556.234156,321.386095 C554.702759,316.468298 553.928442,311.363599 553.928442,306.208529 C553.928442,301.052133 554.702759,295.947433 556.234156,291.029637 L602.583102,291.029637 L602.583102,321.386095 L556.234156,321.386095 Z" id="Fill-47"></path>
			                    <path d="M606.564468,357.547144 L652.99827,357.547144 C645.468572,338.658033 626.871715,325.719323 606.564468,325.258031 L606.564468,357.547144 Z" id="Fill-49"></path>
			                    <path d="M602.582571,32.2907033 L556.147443,32.2907033 C563.678467,13.4015923 582.275324,0.461557085 602.582571,0.00026511033 L602.582571,32.2907033 Z" id="Fill-51"></path>
			                    <path d="M602.582571,393.805489 L556.147443,393.805489 C563.678467,374.916378 582.275324,361.976342 602.582571,361.51505 L602.582571,393.805489 Z" id="Fill-59"></path>
			                </g>
			            </g>
			        </g>
			    </g>
			</svg>

		</div>	
	</div>






	<div class="artist-details-area">
		<div class="small-12 medium-6 columns artist-details-container">
			<div class="artist-details">
				<span class="artist-category"><?php echo $main_category; ?>
				
				<?php
				/* FIRST
				 * Note: This function only returns results from the default “category” taxonomy. For custom taxonomies use get_the_terms().
				 */
				//$artist_categories = get_the_terms( $post->ID, 'artist-type' );

				//$client_categories = get_the_terms( $post->ID, 'clients-type' );

				// now you can view your category in array:
				// using var_dump( $categories );
				// or you can take all with foreach:
				//foreach( $artist_categories as $category ) {
				    //echo $category->name;
				//}
				//foreach( $client_categories as $category ) {
				    //echo $category->name;
				//} //?>
				</span>
				
				<br>
				<h2 class="artist-name hero-heading"><?php the_title(); ?></h2>
				
				<?php if( get_field('optional_text_area') ): ?>
					<p><?php echo $optional_text_area ?></p>
				<?php endif; ?>
				
				<?php if( get_field('photo_credit') ): ?>
					<div class="credit-wrapper">
						<span class="photo_credit"><?php echo $photo_credit;?></span>
					</div>
					
				<?php endif; ?>
			</div>

		</div>
	</div>

</div> <!-- Container END -->

	
<div id="sticky-anchor"></div>

<div class="single-page-nav--container" id="sticky">
	<div class="row">
	<ul class="single-page-nav show-for-medium">
	
	<li class="nav-title">
		<?php the_title(); ?>
	</li>

	<li class="single-page-nav_link active">
		<a data-scroll="" data-events="scroll" href="#introduction">Introduction</a>
	</li>

	<li class="single-page-nav_link">
		<a data-scroll href="#video-audio">Video &amp; Audio</a>
	</li>

	<li class="single-page-nav_link">
		<a data-scroll="" data-events="scroll" href="#schedule">Schedule</a>
	</li>

		
	<?php if( get_field('email_or_page_link') == 'Email' ): ?>
		<button class="enquiry-button show-for-medium">
			<a href="mailto:<?php echo $manager_email; ?>?Subject=Enquiry">
				Make enquiry
			</a>
		</button>
	<?php endif; ?>

	<?php if( get_field('email_or_page_link') == 'Link' ): ?>

		<?php $staff_contact = get_field('staff_contact'); ?>
		<button class="enquiry-button show-for-medium">
			<a href="<?php echo $staff_contact ?>">
				Make enquiry
			</a>
		</button>
	<?php endif; ?>



	<!-- getting ACF Flexible content navigation  -->
	<?php $acf_fields = get_fields(); ?>
	<?php include(locate_template('template-parts/acf-navigation.php')); ?>
		</ul>
	</div>
</div>	
