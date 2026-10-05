/**
 * A class representing a taxonomy filter input.
 */
class ZadTaxFilter {
  /**
   * Constructs a new ZadTaxFilter object.
   */
  constructor() {
    // Renders the tax filter input.
    this.renderTaxFilterInput();
  }

  /**
   * Renders the tax filter input.
   */
  renderTaxFilterInput() {
    // Get all categorydiv elements.
    var categoryDivs = document.getElementsByClassName('categorydiv');

    // Loop through each categorydiv element.
    for (var i = 0; i < categoryDivs.length; i++) {      
      // Create a new input element for the tax filter.
      const filterInput = document.createElement('input');
      filterInput.placeholder = translations.filter;
      filterInput.className = 'zad-tax-filter';
      
      // Prepend the filter input element to the current categorydiv element.
      categoryDivs[i].prepend(filterInput);

      // Get all label.selectit elements within the current categorydiv element.
      const labels = categoryDivs[i].querySelectorAll('label.selectit');

      // Add an input event listener to the filter input element.
      filterInput.addEventListener("input", () =>
        // Loop through each label element and set its display style based on whether it includes the filter input value.
        Array.from(labels).forEach((element) => element.style.display = element.innerText.includes(filterInput.value.toLowerCase()) ? "inline" : "none")
      );
    }
  }
}

// Add a DOMContentLoaded event listener to create a new ZadTaxFilter object when the document is loaded.
document.addEventListener("DOMContentLoaded", function (event) {
  new ZadTaxFilter();
});
