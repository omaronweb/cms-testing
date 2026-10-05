/*
 * Admin Columns Pro ships a few strings hardcoded inside its compiled Svelte bundles
 * (assets/filtering/js/table.js, assets/search/js/table.bundle.js), so they never pass through
 * gettext and cannot be fixed in codepress-admin-columns-ar.po alone.
 *
 * The replacements come from wp_localize_script(), keyed by the English source string, so the
 * Arabic still lives in the .po file and only the lookup happens here.
 */
( function () {
	var strings = window.zadCommonWPAdminColumnsStrings || {};

	/**
	 * Replace placeholder attributes. svelte-select renders its placeholder as an <input>
	 * attribute, which no amount of text-node patching can reach.
	 */
	function patchPlaceholders( root ) {
		root.querySelectorAll( 'input[placeholder]' ).forEach( function ( input ) {
			var replacement = strings[ input.placeholder ];

			if ( replacement ) {
				input.placeholder = replacement;
			}
		} );
	}

	/**
	 * Replace label text, but only inside a svelte-select. Sweeping the whole document would
	 * rewrite any element in wp-admin that happens to carry the same text.
	 */
	function patchSelectLabels( select ) {
		select.querySelectorAll( '*' ).forEach( function ( element ) {
			if ( element.children.length > 0 ) {
				return;
			}

			var replacement = strings[ element.textContent.trim() ];

			if ( replacement ) {
				element.textContent = replacement;
			}
		} );
	}

	function patch( root ) {
		if ( ! root || ! root.querySelectorAll ) {
			return;
		}

		patchPlaceholders( root );

		if ( root.matches && root.matches( '.svelte-select' ) ) {
			patchSelectLabels( root );
		}

		root.querySelectorAll( '.svelte-select' ).forEach( patchSelectLabels );
	}

	function run() {
		patch( document.body );

		// The filter bar mounts after page load and re-renders on every filter change.
		new MutationObserver( function ( mutations ) {
			mutations.forEach( function ( mutation ) {
				mutation.addedNodes.forEach( function ( node ) {
					if ( node.nodeType === Node.ELEMENT_NODE ) {
						patch( node );
					}
				} );
			} );
		} ).observe( document.body, { childList: true, subtree: true } );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', run );
	} else {
		run();
	}
}() );
