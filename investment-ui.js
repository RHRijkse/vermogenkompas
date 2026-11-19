(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const slider = $('investment-years');
  const chart = $('investment-chart');
  const endpoint = $('investment-point');
  const start = 100000;
  const monthsPerYear = 12;
  // A fictional return path, independent of market data.
  const annualReturns = [
    9, -6, 13, 5, 7, -3, 12, 4, 10, -8,
    14, 8, 3, 11, -7, 12, 6, 9, -5, 11,
    7, 4, -4, 12, 6, 8, -6, 13, 7, 5
  ];
  const balances = [start];
  const euros = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const signedEuros = new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0, signDisplay: 'exceptZero'
  });
  const percentages = new Intl.NumberFormat('nl-NL', {
    style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero'
  });
  const namespace = 'http://www.w3.org/2000/svg';

  annualReturns.forEach((yearReturn, year) => {
    const openingBalance = balances[year * monthsPerYear];
    for (let month = 1; month <= monthsPerYear; month++) {
      const fraction = month / monthsPerYear;
      const change = Math.pow(1 + yearReturn / 100, fraction);
      // Intrayear movements are illustrative and return to the annual scenario at year end.
      const variation = month === monthsPerYear ? 0
        : 0.016 * Math.sin(Math.PI * fraction) * Math.sin(month * 1.91 + year * 2.37);
      balances.push(openingBalance * change * (1 + variation));
    }
  });

  function svgElement(name, attributes, text) {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function draw(years) {
    const compact = chart.clientWidth < 460;
    const width = compact ? 360 : 680;
    const height = compact ? 244 : 300;
    const left = compact ? 64 : 75;
    const right = width - (compact ? 20 : 25);
    const top = 16;
    const bottom = height - 35;
    const months = years * monthsPerYear;
    const visible = balances.slice(0, months + 1);
    const minimum = Math.min(...visible);
    const maximum = Math.max(...visible);
    const range = Math.max(maximum - minimum, 12000);
    const step = [5000, 10000, 20000, 25000, 50000, 100000, 200000].find((value) =>
      value * (compact ? 3 : 4) >= range * 1.16
    );
    const low = Math.floor((minimum - range * 0.06) / step) * step;
    const high = Math.ceil((maximum + range * 0.06) / step) * step;
    const x = (month) => months ? left + (right - left) * month / months : (left + right) / 2;
    const y = (balance) => bottom - (bottom - top) * (balance - low) / (high - low);
    const positions = visible.map((balance, month) => [x(month).toFixed(2), y(balance).toFixed(2)]);
    const path = 'M' + positions.map((point) => point.join(' ')).join('L');
    const grid = [];
    const axis = [];

    for (let value = low; value <= high; value += step) {
      const cy = y(value);
      grid.push(svgElement('line', {
        class: 'investment-gridline', x1: left, x2: right, y1: cy, y2: cy
      }));
      axis.push(svgElement('text', {
        class: 'investment-axis-label', x: left - 9, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'middle'
      }, '€ ' + value / 1000 + 'k'));
    }

    const divisions = Math.min(years, compact ? 2 : 5);
    const tickYears = divisions
      ? Array.from({ length: divisions + 1 }, (_, index) => Math.round(index * years / divisions))
      : [0];
    tickYears.forEach((year) => {
      const anchor = !years ? 'middle' : year === 0 ? 'start' : year === years ? 'end' : 'middle';
      axis.push(svgElement('text', {
        class: 'investment-axis-label', x: x(year * monthsPerYear), y: height - 8, 'text-anchor': anchor
      }, 'Jaar ' + year));
    });

    chart.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    $('investment-grid').replaceChildren(...grid);
    $('investment-axis').replaceChildren(...axis);
    $('investment-line').setAttribute('d', path);
    $('investment-area').setAttribute('d', months ? path + 'L' + right + ' ' + bottom + 'H' + left + 'Z' : '');
    endpoint.setAttribute('cx', x(months));
    endpoint.setAttribute('cy', y(visible[months]));
  }

  function update() {
    const years = slider.valueAsNumber;
    const amount = balances[years * monthsPerYear];
    const yearLabel = years + ' jaar';
    const endValue = euros.format(amount);
    const totalReturn = percentages.format(amount / start - 1);

    slider.style.setProperty('--investment-progress', 100 * years / annualReturns.length + '%');
    slider.setAttribute('aria-valuetext', yearLabel);
    $('investment-years-label').textContent = yearLabel;
    $('investment-balance').textContent = endValue;
    $('investment-return').textContent = totalReturn;
    $('investment-gain').textContent = signedEuros.format(amount - start);
    $('investment-chart-desc').textContent = 'Fictieve waarde van ' + euros.format(start) + ' naar ' + endValue
      + ' in ' + yearLabel + ', met een totaalrendement van ' + totalReturn + '.';
    draw(years);
  }

  slider.addEventListener('input', update);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => draw(slider.valueAsNumber));
    observer.observe(chart.parentElement);
  }
  slider.disabled = false;
  update();
  endpoint.removeAttribute('hidden');
})();
