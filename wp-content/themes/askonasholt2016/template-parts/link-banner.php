<?php
/**
 * The template part for displaying a message that posts cannot be found
 *
 * Learn more: {@link https://codex.wordpress.org/Template_Hierarchy}
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<!-- Banner with links at the bottom of some pages -->

<div class="link-banner" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/red-pattern.png');">
	<div class="row">
		
<!-- 		<div class="small-12 medium-6 columns link-banner-button">
			<a href="<?php echo site_url(); ?>/contact">
				<button>
					Contact Askonas Holt
				</button>
			</a>
		</div> -->

		<div class="small-12 columns link-banner-button">
			<a data-scroll data-events="scroll" href="#top">
				<button>
					Back to top
				<!-- <a data-scroll="" data-events="scroll" href="#top">Summut</a> -->
				</button>
			</a>
		</div>

	</div>
</div>
