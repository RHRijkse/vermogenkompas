(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const engine = window.MortgageEngine;
  const form = $('mc-form');
  const scenario = { rate: 4, fixedYears: 10, years: 30 };
  const statusLabels = {
    aow: 'AOW-leeftijd bereikt',
    soon: 'Binnen 10 jaar AOW',
    later: 'Over meer dan 10 jaar AOW'
  };
  const euros = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
  const percentage = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 });
  let last = null;

  function node(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  }

  function person(i) {
    const box = document.createElement('fieldset');
    box.className = 'mc-person';
    box.id = 'mc-person-' + i;
    box.setAttribute('aria-label', i ? 'Uw partner' : 'Uzelf');
    box.innerHTML = `
      <div class="field">
        <label for="mc-income-${i}">${i ? 'Bruto jaarinkomen partner' : 'Uw bruto jaarinkomen'} (€)</label>
        <input id="mc-income-${i}" type="number" min="0" max="1000000" step="1" required inputmode="numeric" aria-describedby="mc-income-note">
      </div>
      <div class="field">
        <label for="mc-status-${i}">${i ? 'AOW-situatie partner' : 'Uw AOW-situatie'}</label>
        <select id="mc-status-${i}" required>
          <option value="">Kies uw situatie</option>
          ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select>
      </div>
      <div class="field" id="mc-pension-field-${i}" hidden>
        <label for="mc-pension-${i}">Verwacht bruto jaarinkomen vanaf AOW${i ? ' partner' : ''} (€)</label>
        <input id="mc-pension-${i}" type="number" min="0" max="1000000" step="1" inputmode="numeric" aria-describedby="mc-income-note" disabled>
      </div>`;
    return box;
  }

  $('mc-people').append(person(0), person(1));

  function sync() {
    const household = $('mc-household').value;
    const together = household === 'together';
    $('mc-single-field').hidden = household !== 'single';
    $('mc-single-allowance').disabled = household !== 'single';
    const partner = $('mc-person-1');
    partner.hidden = !together;
    partner.disabled = !together;
    for (let i = 0; i < 2; i++) {
      const soon = $('mc-status-' + i).value === 'soon';
      const pension = $('mc-pension-' + i);
      $('mc-pension-field-' + i).hidden = !soon;
      pension.disabled = !soon;
      pension.required = soon;
    }
  }

  function invalidate() {
    last = null;
    $('mc-result').hidden = true;
    $('mc-empty').hidden = false;
    $('mc-schedule-box').hidden = true;
  }

  function validate() {
    const fields = [...form.querySelectorAll('input, select')];
    fields.forEach((field) => field.removeAttribute('aria-invalid'));
    const invalid = fields.find((field) => field.willValidate && !field.checkValidity());
    if (!invalid) return true;

    const details = invalid.closest('details');
    if (details) details.open = true;
    invalid.setAttribute('aria-invalid', 'true');
    $('mc-error').textContent = invalid.labels[0].textContent + '. ' + invalid.validationMessage;
    $('mc-error').hidden = false;
    invalid.focus();
    return false;
  }

  function readInput() {
    const value = (id) => Number($(id).value);
    const household = $('mc-household').value;
    const people = (household === 'together' ? [0, 1] : [0]).map((i) => ({
      income: value('mc-income-' + i),
      status: $('mc-status-' + i).value,
      pension: value('mc-pension-' + i)
    }));
    return {
      ...scenario,
      people,
      singleAllowance: household === 'single' && $('mc-single-allowance').checked,
      deductible: $('mc-deductible').checked,
      monthlyDebt: value('mc-debt'),
      duo: value('mc-duo'),
      alimony: value('mc-alimony'),
      propertyValue: 0,
      purchasePrice: 0,
      label: 'unknown',
      ownMoney: 0,
      equity: 0,
      costs: 0
    };
  }

  function compareAowPeriods(people, result) {
    if (result.scenarios.length === 1) return [];

    // The scenarios are ordered by transition bitmask, with applicants in form order.
    let labels;
    if (people.length === 1) {
      labels = ['Vóór AOW', 'Vanaf AOW'];
    } else if (people.every((person) => person.status === 'soon')) {
      labels = ['Vóór AOW van u beiden', 'Als u als eerste AOW krijgt', 'Als uw partner als eerste AOW krijgt', 'Vanaf AOW van u beiden'];
    } else {
      labels = people[0].status === 'soon'
        ? ['Vóór uw AOW', 'Vanaf uw AOW']
        : ['Vóór AOW van uw partner', 'Vanaf AOW van uw partner'];
    }

    return result.scenarios.map(({ income, maximum }, index) => ({
      label: labels[index],
      income: euros.format(income),
      monthly: cents.format(engine.payment(Math.floor(maximum), result.testRate, result.months))
    }));
  }

  function render() {
    const input = readInput();
    const result = engine.calculate(input);
    const schedule = engine.schedule(result.maximum, input.rate, result.months);
    const periods = compareAowPeriods(input.people, result);
    const rows = [
      ['Toetsinkomen per jaar', euros.format(result.limiting.income)],
      ['Rente', percentage.format(result.testRate) + '%'],
      ['Rentevaste periode', input.fixedYears + ' jaar'],
      ['Looptijd', input.years + ' jaar'],
      ['Renteaftrek', input.deductible ? 'Volledig' : 'Geen']
    ];
    const notes = [];
    if (result.limiting.single) notes.push('Inclusief ' + euros.format(result.limiting.single) + ' extra leenruimte voor alleenstaanden.');
    if (periods.length === 0 && input.people.some((person) => person.status === 'later')) {
      notes.push('De vergelijking vanaf AOW is beschikbaar als AOW binnen 10 jaar ingaat.');
    }
    if (result.maximum === 0) notes.push('Met deze invoer is er geen leenruimte.');
    if (new Date().getFullYear() !== 2026) notes.push('Gebaseerd op de leennormen van 2026.');
    last = { input, result, rows, notes, periods };

    $('mc-maximum').textContent = euros.format(result.maximum);
    $('mc-monthly').textContent = cents.format(result.monthly);
    $('mc-aow-comparison').hidden = periods.length === 0;
    $('mc-aow-periods').replaceChildren(...periods.map(({ label, income, monthly }) => {
      const row = document.createElement('div');
      const term = node('dt', label);
      term.append(node('small', 'Toetsinkomen: ' + income + ' per jaar'));
      row.append(term, node('dd', monthly));
      return row;
    }));
    $('mc-breakdown').replaceChildren(...rows.flatMap(([label, value]) => [node('dt', label), node('dd', value)]));
    $('mc-notes').textContent = notes.join(' ');
    $('mc-notes').hidden = notes.length === 0;
    $('mc-schedule-summary').textContent = 'Eerste maand: ' + cents.format(schedule.firstInterest)
      + ' rente en ' + cents.format(schedule.firstRepayment) + ' aflossing. Totale rente: ' + euros.format(schedule.totalInterest) + '.';
    $('mc-schedule').replaceChildren(...schedule.years.map((year) => {
      const row = document.createElement('tr');
      row.append(node('td', year.year), node('td', euros.format(year.balance)), node('td', euros.format(year.interest)));
      return row;
    }));

    $('mc-empty').hidden = true;
    $('mc-result').hidden = false;
    $('mc-schedule-box').hidden = false;
    $('mc-result-title').focus();
  }

  form.addEventListener('input', () => {
    invalidate();
    sync();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    $('mc-error').hidden = true;
    if (!validate()) return;
    try {
      render();
    } catch (error) {
      invalidate();
      $('mc-error').textContent = error.message;
      $('mc-error').hidden = false;
    }
  });

  $('mc-save').addEventListener('click', () => {
    if (!last) return;
    const { input, result, rows, notes, periods } = last;
    const lines = [
      'VERMOGENKOMPAS | HYPOTHEEKBEREKENING',
      new Date().toLocaleDateString('nl-NL') + ' | Leennormen 2026',
      '',
      ...input.people.map((p, i) => (i ? 'Partner' : 'Uzelf') + ': ' + euros.format(p.income) + ' bruto per jaar, '
        + statusLabels[p.status] + (p.status === 'soon' ? ', verwacht jaarinkomen vanaf AOW ' + euros.format(p.pension) : '')),
      '',
      'Indicatie maximale hypotheek: ' + euros.format(result.maximum),
      'Bruto maandlast bij dit leenbedrag: ' + cents.format(result.monthly),
      ...(periods.length ? [
        '',
        'Maximale bruto maandlast volgens de leennormen',
        ...periods.map(({ label, income, monthly }) => label + ': ' + monthly + ' (toetsinkomen ' + income + ' per jaar)'),
        $('mc-aow-explanation').textContent,
        ''
      ] : []),
      ...rows.map(([label, value]) => label + ': ' + value),
      'Maandelijkse kredietlasten: ' + cents.format(input.monthlyDebt),
      'Maandelijkse DUO-termijn: ' + cents.format(input.duo),
      'Maandelijkse partneralimentatie: ' + cents.format(input.alimony),
      '',
      ...notes,
      $('mc-disclaimer').textContent
    ];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VermogenKompas-hypotheekberekening.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });

  sync();
  $('mc-next').disabled = false;
})();
