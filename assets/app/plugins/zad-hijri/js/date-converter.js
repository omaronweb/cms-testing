function debounce(cb, delay = 250) {
  let timeout

  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      cb(...args)
    }, delay)
  }
}

jQuery(document).ready(function ($) {
  class DateConverter {

    constructor() {
      
      const dateElementsTypes = ['wp-fields', 'acf-fields'];

      dateElementsTypes.forEach((type) => {
        let wrapperElements;
        switch (type) {
          case 'wp-fields':
            wrapperElements = $('#timestampdiv .timestamp-wrap');
            break;
          case 'acf-fields':
            wrapperElements = $('.acf-field.acf-field-date-picker .acf-date-picker.acf-input-wrap');
            break;
          default:
            return;
        }

        wrapperElements.each(async (i, ele) => {
          const element = $(ele);
          this.renderHijriInputs(element);
          this.validateHijriInputs(element);

          // Get the hijri date from already exist value of gregorian inputs
          await this.convertGregorianToHijri(type, element);

          // Set events to convert the dates from/to hijri
          this.events(type, element);
        });
      });
    }

    events(fieldType, wrapperElement) {
      let gregorianInputs;
      if (fieldType === 'wp-fields') {
        gregorianInputs = wrapperElement.find('#aa, #mm, #jj');
      }
      else /*if (fieldType === 'acf-fields')*/ {
        gregorianInputs = wrapperElement.find('.input.hasDatepicker');
      }

      gregorianInputs.on('change input', debounce(e => {
          this.convertGregorianToHijri(fieldType, wrapperElement);
        }, 250)
      );
      wrapperElement.find('.input.hijri-date-input').on('input', debounce(e => {
          this.convertHijriToGregorian(fieldType, wrapperElement);
        }, 250)
      );
    }

    renderHijriInputs(wrapperElement) {
      const html = `
        <div class="hijri-date-inputs-wrapper">
          <input type="number" min="1" max="30" maxlength="2" class="input hijri-date-input hijri-day" data-type="day" value="" placeholder="${zadDateConverter.hijriDayPlaceholder}">
          <input type="number" min="1" max="12" maxlength="2" class="input hijri-date-input hijri-month" data-type="month" value="" placeholder="${zadDateConverter.hijriMonthPlaceholder}">
          <input type="number" min="1" max="9999" maxlength="4" class="input hijri-date-input hijri-year" data-type="year" value="" placeholder="${zadDateConverter.hijriYearPlaceholder}">
        </div>
      `;

      wrapperElement.append(html);
    }

    validateHijriInputs(wrapperElement) {
      wrapperElement
        .find('.input.hijri-date-input')
        .unbind('keyup change input paste')
        .bind('keyup change input paste', (e) => {
          // Validates input maxlength when the user (keyup, change, input, or paste)
          const valLength = e.target.value.length;
          const maxCount = parseInt(e.target.getAttribute('maxlength'));
          if (valLength > maxCount) {
            e.target.value = e.target.value.substring(0, maxCount);
          }
        });
    }

    async convertGregorianToHijri(fieldType, wrapperElement) {
      let year, month, day;
      if (fieldType === 'wp-fields') {
        year = wrapperElement.find('#aa').val();
        month = wrapperElement.find('#mm').val();
        day = wrapperElement.find('#jj').val();
      }
      else /*if (fieldType === 'acf-fields')*/ {
        const regex = /\/|-/g;
        const format = wrapperElement.data('date_format');
        const formats = format.split(regex); // ['yy' 'mm' 'dd']
        const dateParts = wrapperElement.find('.input.hasDatepicker').val().split(regex);

        formats.forEach((format, index) => {
          if (format.indexOf('y') !== -1) {
            year = dateParts[index];
          } else if (format.indexOf('m') !== -1) {
            month = dateParts[index];
          } else if (format.indexOf('d') !== -1) {
            day = dateParts[index];
          }
        });
      }

      if (
        !day
        || !month
        || !year
      ) {
        return;
      }

      const { year: rYear, month: rMonth, day: rDay } = await this.gregorianToHijri(year, month, day);
      wrapperElement.find('.hijri-year').val(rYear);
      wrapperElement.find('.hijri-month').val(rMonth);
      wrapperElement.find('.hijri-day').val(rDay);
    }

    async convertHijriToGregorian(fieldType, wrapperElement) {
      const year = wrapperElement.find('.hijri-year').val();
      const month = wrapperElement.find('.hijri-month').val();
      const day = wrapperElement.find('.hijri-day').val();

      if (
        !day
        || !month
        || !year
      ) {
        return;
      }

      const { year: rYear, month: rMonth, day: rDay } = await this.hijriToGregorian(year, month, day);

      if (fieldType === 'wp-fields') {
        wrapperElement.find('#aa').val(rYear);
        wrapperElement.find('#mm').val((rMonth + '').padStart(2, '0'));// this is select, so we must use same value of the options
        wrapperElement.find('#jj').val(rDay);
      }
      else /*if (fieldType === 'acf-fields')*/ {
        const date = new Date(rYear, rMonth - 1, rDay);
        wrapperElement.find('.input.hasDatepicker').datepicker('setDate', date);
      }
    }

    gregorianToHijri(year, month, day) {
      return fetch(`${zadDateConverter.siteurl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query getHijriDate($year: Int, $month: Int, $day: Int) {
              hijriDate(year: $year, month: $month, day: $day) {
                year
                month
                day
              }
            }
          `,
          variables: {
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
          }
        })
      })
      .then(res => res.json())
      .then(result => {
        return result.data.hijriDate;
      })
      .catch(error => console.log(error))
    }

    hijriToGregorian(year, month, day) {
      return fetch(`${zadDateConverter.siteurl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query getGregorianDate($year: Int, $month: Int, $day: Int) {
              gregorianDate(year: $year, month: $month, day: $day) {
                year
                month
                day
              }
            }
          `,
          variables: {
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
          }
        })
      })
      .then(res => res.json())
      .then(result => {
        return result.data.gregorianDate;
      })
      .catch(error => console.log(error))
    }
  }

  new DateConverter();
});
