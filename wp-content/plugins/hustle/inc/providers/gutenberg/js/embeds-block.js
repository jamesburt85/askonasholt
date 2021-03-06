const { registerBlockType, createBlock } = wp.blocks,
	{ createElement:el, Component, RawHTML } = wp.element,
	{ string: shortcodeToString, next } = wp.shortcode,

hustleEmbedIconEl = el(
	'svg', {
		class: "dashicon", viewBox: "0 0 24 24",  width: 20, height: 20, xmlns: "http://www.w3.org/2000/svg", preserveAspectRatio: "xMidYMid meet", "aria-hidden": "true", role: "img"
	},
	  el(
		'path', { 
			d: "M.857 20.571h22.286c.232 0 .433.085.603.255.17.17.254.37.254.603v1.714a.824.824 0 0 1-.254.603.824.824 0 0 1-.603.254H.857a.824.824 0 0 1-.603-.254.824.824 0 0 1-.254-.603v-1.714c0-.233.085-.433.254-.603.17-.17.371-.255.603-.255zM1.714 6.857h20.572c.482 0 .888.165 1.218.496.33.33.496.736.496 1.218v6.858c0 .482-.165.888-.496 1.218-.33.33-.736.496-1.218.496H1.714c-.482 0-.888-.165-1.218-.496A1.657 1.657 0 0 1 0 15.43V8.57c0-.482.165-.888.496-1.218.33-.33.736-.496 1.218-.496zm19.429 2.286c-.482 0-.889.165-1.219.495-.33.33-.495.737-.495 1.22 0 .481.165.888.495 1.218.33.33.737.495 1.219.495.482 0 .888-.165 1.219-.495.33-.33.495-.737.495-1.219 0-.482-.165-.888-.495-1.219a1.657 1.657 0 0 0-1.22-.495zM.857 0h22.286c.232 0 .433.085.603.254.17.17.254.371.254.603v1.714a.824.824 0 0 1-.254.603.824.824 0 0 1-.603.255H.857a.824.824 0 0 1-.603-.255A.824.824 0 0 1 0 2.571V.857C0 .625.085.424.254.254.424.084.625 0 .857 0z"
		}
	)
);

/**
 * Block edit class
 */
class Hustle_Embed_BlockEdit extends Component {
	/**
	 * Class constructor
	 */
	constructor() {
		super( ...arguments );

		this.update_id = this.update_id.bind( this );
		this.update_css_class = this.update_css_class.bind( this );
		this.preview = this.preview.bind( this );

		this.state = {
			loading: false,     // Set to true while loading preview markup
			markup: ''          // Preview markup
		};
		_.mixin({
			/**
			 * Checks if val is truthy
			 *
			 * @param val
			 * @returns {boolean}
			 */
			isTrue: function(val) {
				if( _.isUndefined( val ) || _.isNull( val ) || _.isNaN( val ) )
					return false;

				if( _.isNumber( val ) )
					return val !== 0;

				val = val.toString().toLowerCase();
				return ['1', "true", "on"].indexOf( val ) !== -1;
			},
			isFalse: function(val){
			  return !_.isTrue( val );
			},
			/**
			 * Returns checked=check if checked variable is equal to current state
			 *
			 *
			 * @param checked checked state
			 * @param current current state
			 * @returns {*}
			 */
			checked: function(checked, current){
				return _.control_base( checked, current, "checked" );
			},
			/**
			 * Adds selected attribute
			 *
			 * @param selected
			 * @param current
			 * @returns {*}
			 */
			selected: function(selected, current){
				return _.control_base( selected, current, "selected" );
			},
			/**
			 * Adds disabled attribute
			 *
			 * @param disabled
			 * @param current
			 * @returns {*}
			 */
			disabled: function( disabled, current ){
				return _.control_base( disabled, current, "disabled" );
			},
			/**
			 * Returns css class based on the passed in condition
			 *
			 * @param conditon
			 * @param cls
			 * @param negating_cls
			 * @returns {*}
			 */
			class: function( conditon, cls, negating_cls ){

				if( _.isTrue( conditon ) )
					return cls;

				return typeof negating_cls !== "undefined" ? negating_cls : "";
			},
			/**
			 * Returns class attribute with relevant class name
			 *
			 * @param conditon
			 * @param cls
			 * @param negating_cls
			 * @returns {string}
			 */
			add_class: function( conditon, cls, negating_cls ){
				return 'class={class}'.replace( "{class}",  _.class( conditon, cls, negating_cls ) );
			},
		});
	}

	/**
	 * Update shortcode id
	 */
	update_id( id ) {
		this.props.setAttributes( { id } );
	}

	/**
	 * Update module id
	 */
	update_module_id( module_id ) {
		this.props.setAttributes( { module_id } );
	}

	update_css_class( css_class ) {
		this.props.setAttributes( { css_class } );
	}

	/**
	 * Preview module
	 */
	preview( attributes ) {
		const { id, type } = attributes;

		// Check if we already process ajax request
		if ( this.state.loading ) {
			// Ajax request in process, skip
			return;
		}

		// Set loading to true
		this.setState({ loading: true });

		let ajax_url = '';

		if ( id ) {
			let module_type_query = 'undefined' === typeof type ? '' : '&type=' + type;
			ajax_url = ajaxurl + '?action=hustle_render_module&_wpnonce=' + hustle_embed_data.nonce + '&shortcode_id=' + id + module_type_query;

		} else {
			return;

		}
		
		window.fetch( ajax_url )
			.then( response => response.json() )
			.then( data => {
				
				let response_data = {};
				if ( data.success ) {

					let html = data.data.html;

					this.setState({
						markup: html
					});
					
					response_data = {
						module_data: data.data.data,
						style: data.data.style,
						opening_wrapper: data.data.opening_wrapper
					};

				}

				return response_data;
	
			})
			.then( ( { module_data, style, opening_wrapper } ) => {

				// Set loading to false
				this.setState({ loading: false });

				if ( ! module_data || ! style || ! opening_wrapper ) {
					return;
				}

				// Update the module id
				this.update_module_id( module_data.module_id );

				// Update the shortcode id
				if ( ! id ) {
					this.update_id( module_data.shortcode_id );
				}

				if ( 'social_sharing' === module_data.module_type ) {
					
					var template_id = 'hustle-sshare-front-tpl';

					// This is how the module's data is handled when rendering ss. No idea why. Other modules don't do this. Weird.
					// The templates are expecting this format, so make this as other modules once the templates are adapted.
					// TODO: standardize this as it's handled in other modules.
					let { content, design, settings, module_id } = module_data;
					module_data = Object.assign( {}, content, design, settings, { module_display_type: 'shortcode', module_id } );
					

				} else {
					var is_optin = _.isTrue( module_data.content.use_email_collection ),
						template_id = is_optin ? 'wpmudev-hustle-modal-with-optin-tpl' : 'wpmudev-hustle-modal-without-optin-tpl';

				}
				let template = this.do_template( template_id );
				
				module_data.is_preview = true;
				this.setState({
					// TODO: improve this after changing the way modules are rendered.
					markup: opening_wrapper + template( module_data ) + '</div>' + style,
				});
			} )
			.catch( error => {
				console.log( error );
			})

		;

	}

	do_template( id ) {
			let compiled,
	
				options = {
					evaluate:    /<#([\s\S]+?)#>/g,
					interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
					escape:      /\{\{([^\}]+?)\}\}(?!\})/g
				};
	
			return function ( data ) {
				compiled = compiled || _.template( $( '#' + id ).html(), null, options );
				return compiled( data ).replace("/*<![CDATA[*/", "").replace("/*]]>*/", "");
			};
	}

	/**
	 * React method called when block is initialized
	 */
	componentDidMount() {
		const { attributes } = this.props;

		let { id } = attributes;
		// Check if module ID set
		if ( ! id ) {
			// Fallback
			return;

		} else {
			// Load preview
			this.preview( attributes );
		}
	}

	/**
	 * React method called when block is updated
	 */
	componentDidUpdate( prevProps ) {
		const { attributes } = this.props;
		let { id } = attributes;

		if( prevProps.attributes.id === id ) {
			return;
		}

		if( ! id ) {

			// Clear the preview markup
			this.setState({ markup: '' });

			return;
		}

		// Load preview
		this.preview( attributes );
	}

	open_settings( module_id ) {

		let url = hustle_embed_data.admin_url + '?page=hustle_embedded&id=' + module_id;
		window.open( url );
	}

	/**
	 * Render
	 */
	render() {
	
		const
			{ loading, markup } = this.state,
			{ attributes, isSelected } = this.props,
			{ module_id, id, css_class } = attributes,
			update_id = ( e ) => this.update_id( e.target.value ),
			open_settings = ( e ) => this.open_settings( module_id );

		let options = hustle_embed_data.modules;

		const controls = [ isSelected && el (
			wp.editor.InspectorControls,
			{ key: "inspector" },

			el (
				wp.components.PanelBody,
				{
					title: hustle_embed_data.l10n.module,
					initialOpen: true
				},
				el (
					wp.components.PanelRow,
					null,
					el ( wp.components.SelectControl, {
						label: hustle_embed_data.l10n.name,
						value: id,
						options: options,
						onChange: this.update_id
					})
				)
			),
			el (
				wp.components.PanelBody,
				{
					title: hustle_embed_data.l10n.advanced,
					initialOpen: true
				},
				el (
					wp.components.PanelRow,
					null,
					el ( wp.components.TextControl, {
						label: hustle_embed_data.l10n.additional_css_classes,
						value: css_class,
						onChange: this.update_css_class
					})
				)
			)
		), el ( wp.editor.BlockControls,
			null,
			!! id && el ( wp.components.Toolbar,
				null,
				el ( wp.components.IconButton, {
					className: "components-toolbar__control",
					label: hustle_embed_data.l10n.customize_module,
					icon: "edit",
					onClick: open_settings
				})
			)
		)];

		// If preview is being loaded, show spinner
		if( loading ) {
			return [ controls, el ( "div",
				{ key: "loading", className: "wp-block-embed is-loading" },
				el ( wp.components.Spinner, null ),
				el ( "span",
					null,
					hustle_embed_data.l10n.rendering
				)
			)];
		}

		// If we have preview markup display it
		if( markup ) {
			return [
				controls, el ( RawHTML,
					null,
					markup
				)];
		}

		// Fallback, display the select
		return [ controls, el (
			wp.components.Placeholder,
			{
				key: "placeholder",
				className: "wp-block-embed",
				instructions: hustle_embed_data.l10n.block_description,
				icon: hustleEmbedIconEl,
				label: hustle_embed_data.l10n.block_name
			},
			el(
				"form",
				null,
				el(
					"select",
					{ value: id, onChange: update_id },
					options.map(row => el(
						"option",
						{ key: row.value, value: row.value },
						row.label
					))
				)
			)
		)];
	}
}

registerBlockType( 'hustle/embedded', {
	title: hustle_embed_data.l10n.block_name,
	description: hustle_embed_data.l10n.block_description,
    icon: hustleEmbedIconEl,
	category: 'hustle',
	keywords: [ 'Hustle', hustle_embed_data.l10n.block_name ],
	attributes: {
		module_id: {
			type: 'string'
		},
		// "shortcode_id" as identifier.
		id: {
			type: 'string'
		},
		type: {
			type: 'string'
		},
		css_class: {
			type: 'string'
		}
	},
	supports:    {
		customClassName: false,
		className:       false,
		html:            false,
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/shortcode' ],
				transform: ( { id, css_class } ) => {
					let options = {
						tag: hustle_popup_trigger_data.shortcode_tag,
						attrs: {
							id: ( id || '' ),
							type: 'embedded',
							css_class: ( css_class || '' )
						},
						type: 'single'
					},
					text = shortcodeToString( options );

					return createBlock( 'core/shortcode', {
						text,
					} );
				},
			},
		],

		from: [
			//{
			//	type: 'shortcode',
			//	// Use "isMatch" here to differentiate social shares from embeds by the shortcode's attribute.
			//	// Not possible atm as it's an open issue. https://github.com/WordPress/gutenberg/issues/10674
			//	tag: [ hustle_embed_data.shortcode_tag ],
			//	attributes: {
			//		id: {
			//			type: 'string',
			//			shortcode: ( { named: { id } } ) => {
			//				return id;
			//			} 
			//		},
			//		type: {
			//			type: 'string',
			//			shortcode: ( { named: { type } } ) => {
			//				return type;
			//			} 
			//		},
			//	}
			//},

			// Legacy shortcode.
			{
				type: 'shortcode',
				tag: [ 'wd_hustle_cc' ],
				attributes: {
					id: {
						type: 'string',
						shortcode: ( { named: { id } } ) => {
							return id;
						} 
					},
					type: {
						type: 'string',
						shortcode: ( { named: { type } } ) => {
							return type;
						} 
					},
				}
			},

			{
				type: 'block',
				blocks: [ 'core/shortcode' ],
				isMatch( { text } ) {
	
					let shortcode_tag = next( 'wd_hustle', text );

					// If it's not a Hustle shortcode, abort.
					if ( 'undefined' === typeof shortcode_tag ) {

						shortcode_tag = next( 'wd_hustle_cc', text );
						if ( 'undefined' === typeof shortcode_tag ) {
							return false;
						}
					}

					let { shortcode } = shortcode_tag;
					if ( 'embedded' !== shortcode.attrs.named.type ) {
						// The old shortcode didn't have the same attributes. Prevent a false positive.
						if ( 'wd_hustle_cc' !== shortcode.attrs.tag ) {
							return false;
						}
					}
	
					return true;
				},
				transform( { text } ) {

					let { shortcode } = next( 'wd_hustle', text );
					if ( 'undefined' === shortcode ) {
						shortcode = next( 'wd_hustle_cc', text );
					}
					let { attrs: { named: { id, type, css_class } } } = shortcode;
	
					return createBlock( 'hustle/embedded', {
						id,
						css_class,
						type
					} );
				},
			},
		]
	},
	edit: Hustle_Embed_BlockEdit,
	
	save() {

		return null;
	},

} );