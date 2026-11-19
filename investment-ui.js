(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('investment-form');
  const effectiveAnnualRate = 0.04;
  const euros = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

  function calculate() {
    const start = $('investment-start').valueAsNumber;
    const deposit = $('investment-monthly').valueAsNumber;
    const months = $('investment-years').valueAsNumber * 12;
    const monthlyLogGrowth = Math.log1p(effectiveAnnualRate) / 12;
    const monthlyRate = Math.expm1(monthlyLogGrowth);
    const growth = Math.expm1(monthlyLogGrowth * months);
    const contributions = start + deposit * months;
    // Monthly contributions are added at the end of each month.
    const gain = start * growth + deposit * (growth / monthlyRate - months);
    return { endingBalance: contributions + gain, contributions, gain };
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { endingBalance, contributions, gain } = calculate();
    $('investment-balance').textContent = euros.format(endingBalance);
    $('investment-contributed').textContent = euros.format(contributions);
    $('investment-gain').textContent = euros.format(gain);
    $('investment-placeholder').hidden = true;
    $('investment-result').hidden = false;
    $('investment-result-title').focus();
  });

  form.addEventListener('input', () => {
    $('investment-result').hidden = true;
    $('investment-placeholder').hidden = false;
  });

  $('investment-submit').disabled = false;
})();
