class ZadCommonWPAdmin {

  constructor() {
    $ = jQuery;
    this.markACFFieldsAsDisabled();
    this.disableAllFieldsForViewerRole();
    this.customizeTinymceEditor();
  }

  /**
   * Mark deprecated or disabled ACF fields as disabled to prevent send them with the form so prevent saving them in the post metadata
   */
  markACFFieldsAsDisabled() {
    const elements = document.querySelectorAll('.zad-acf-deprecated, .acf-disabled');

    elements.forEach(element => {
      // Find all input fields within the current element
      const inputs = element.querySelectorAll('input, textarea, select');

      // Loop through each input field and mark it as disabled
      inputs.forEach(input => {
        input.disabled = true;
      });
    });
  }

  disableAllFieldsForViewerRole() {
    if (!document.body.classList.contains('zad-common-wp-role-zad_common_wp_project_viewer')) {
      return;
    }

    document.querySelectorAll(
      `#poststuff :is(
          input, textarea, select
      )`
    ).forEach(
      function (element) {
        element.disabled = true;

        // If it's acf input add class to prevent remove disable attribute when change anything in the post like
        // change the terms.
        if (element.closest( '.acf-input' )) {
          element.classList.add( 'acf-disabled' );
        }
      }
    );

    $(document).on('tinymce-editor-init', function(event, editor) {
      editor.setMode('readonly');
    });
  }

  customizeTinymceEditor() {
    self = this;

    $(document).on('tinymce-editor-init', function(event, editor) {
      self.addDirAutoForListsTagsEditor(editor);

      // Run the function whenever the content changes
      editor.on('NodeChange', function() {
        self.addDirAutoForListsTagsEditor(editor);
      });
    });
  }

  addDirAutoForListsTagsEditor(editor) {
    const dom = editor.dom;
    const body = editor.getBody();

    // Select all lists elements within the editor
    const lists = dom.select('ol, ul', body);

    // Add dir="auto" to all lists elements
    lists.forEach(function(list) {
      dom.setAttrib(list, 'dir', 'auto');
    });
  }
}

// Add a DOMContentLoaded event listener to run the code when the document is loaded.
document.addEventListener("DOMContentLoaded", function () {
  new ZadCommonWPAdmin();
});

// Fixes the contrast issue when deleting terms.
jQuery(document).ready(function($) {
  $('#the-list').on('click', '.delete-tag', function() {
    var t = $(this),
        tr = t.parents('tr');

    tr.addClass('zad-is-deleting-tags');

    return false;
  });
});

/**
 * This feature adds a confirmation dialog to delete links of posts in the WordPress admin interface.
 * It aims to prevent accidental deletion of content by requiring user confirmation.
 */
document.addEventListener("DOMContentLoaded", function() {
  // Get all delete links
  let deleteLinks = document.querySelectorAll('body.edit-php .submitdelete');

  // Loop through each link and attach the event listener
  deleteLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      // Show confirmation dialog with the localized message
      let confirmation = confirm(zadCommonWPLocalizedObject.confirmation_message);

      // If user cancels, prevent the default action
      if (!confirmation) {
        event.preventDefault();
      }
    });
  });
});
