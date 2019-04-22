<!-- //Hero for single tour / project -->

<div class="center-text-hero-header">

	<header class="center-hero-text">
	<?php
		if (!is_post_type_archive( 'online' )) : ?>
			<h2 class="hero-heading no-show"><?php the_title(); ?></h2>
		<?php else : ?>
			<h2 class="hero-heading">Online Performances</h2>
		<?php endif; ?>
		<?php $description = get_field('optional_description'); ?>
		<?php if($description) : ?>
		<h3 class="hero-header-text"><p><?php echo $description; ?></p></h3>
		<?php endif; ?>
		<?php //foundationpress_entry_meta(); ?>
	</header>
</div>
