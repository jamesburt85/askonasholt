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
<?php 
	$manager_email = get_field('manager_email');
?>

<!-- Banner with links at the bottom of some pages -->

<div class="link-banner" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/red-pattern.png');">
	<div class="row">
		
		<div class="small-12 medium-6 columns link-banner-button">
			
			<?php if( get_field('email_or_page_link') == 'Email' ): ?>
				<a href="mailto:<?php echo $manager_email; ?>?Subject=Enquiry">
					<button>
							Contact Manager
					</button>
				</a>
			<?php endif; ?>

			<?php if( get_field('email_or_page_link') == 'Link' ): ?>

				<?php $staff_contact = get_field('staff_contact'); ?>
				<a href="<?php echo $staff_contact ?>">
					<button>
						Contact Manager
					</button>
				</a>
			<?php endif; ?>

		</div>

		<div class="small-12 medium-6 columns link-banner-button">
			<a data-scroll data-events="scroll" href="#top">
				<button>
					Back to top
				<!-- <a data-scroll="" data-events="scroll" href="#top">Summut</a> -->
				</button>
			</a>
		</div>

	</div>
</div>
