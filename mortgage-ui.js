(function(){
  'use strict';
  const $=id=>document.getElementById(id), engine=window.MortgageEngine;
  const euro=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const cents=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
  const pct=n=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:3}).format(n)+'%';
  let step=0,last=null;
  function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
  function person(i){
    const box=document.createElement('div');box.className='mc-person';box.id='mc-person-'+i;
    box.innerHTML='<h4>'+(i?'Uw partner':'Uzelf')+'</h4><div class="field"><label for="mc-income-'+i+'">'+(i?'Bruto jaarinkomen partner (€)':'Uw bruto jaarinkomen (€)')+'</label><input id="mc-income-'+i+'" type="number" min="0" max="1000000" step="1" required inputmode="numeric"></div><div class="field"><label for="mc-status-'+i+'">'+(i?'AOW-situatie partner':'Uw AOW-situatie')+'</label><select id="mc-status-'+i+'" required><option value="">Maak een keuze</option><option value="aow">AOW-leeftijd al bereikt</option><option value="soon">AOW-leeftijd binnen 10 jaar</option><option value="later">AOW-leeftijd over meer dan 10 jaar</option></select></div><div class="field" id="mc-pension-field-'+i+'" hidden><label for="mc-pension-'+i+'">Verwacht bruto jaarinkomen vanaf AOW'+(i?' partner':'')+' (€)</label><input id="mc-pension-'+i+'" type="number" min="0" max="1000000" step="1" inputmode="numeric" disabled><small>Tel AOW en aanvullend pensioen op, inclusief vakantiegeld. Gebruik bijvoorbeeld uw pensioenoverzicht. We toetsen ook met dit inkomen.</small></div>';
    return box;
  }
  $('mc-people').append(person(0),person(1));
  function sync(){
    const together=$('mc-household').value==='together';
    $('mc-person-1').hidden=!together;$('mc-single-field').hidden=together;
    for(let i=0;i<2;i++){
      const active=i===0||together,soon=$('mc-status-'+i).value==='soon';
      $('mc-income-'+i).disabled=!active;$('mc-status-'+i).disabled=!active;
      $('mc-pension-field-'+i).hidden=!soon;$('mc-pension-'+i).disabled=!active||!soon;$('mc-pension-'+i).required=active&&soon;
    }
  }
  function invalidate(){last=null;$('mc-result').hidden=true;$('mc-empty').hidden=false;$('mc-schedule-box').hidden=true;}
  function showStep(focus){
    for(let i=0;i<2;i++){$('mc-step-'+i).hidden=i!==step;const li=document.querySelectorAll('.mc-steps li')[i];if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');}
    $('mc-back').hidden=step===0;
    $('mc-next').textContent=['Verder naar hypotheek →','Bereken mijn hypotheek →'][step];
    $('mc-error').hidden=true;
    if(focus)$('mc-step-'+step).querySelector('legend').focus();
  }
  function validate(current){
    const fields=[...$('mc-step-'+current).querySelectorAll('input,select')].filter(n=>!n.disabled);
    const invalid=fields.find(n=>!n.checkValidity());
    fields.forEach(n=>n.removeAttribute('aria-invalid'));
    if(invalid){step=current;showStep(false);invalid.setAttribute('aria-invalid','true');$('mc-error').textContent='Controleer '+(document.querySelector('label[for="'+invalid.id+'"]').textContent||'uw invoer')+'. Vul een geldig bedrag of een keuze in.';$('mc-error').hidden=false;invalid.focus();return false;}
    return true;
  }
  function input(){
    const value=id=>Number($(id).value);
    return {people:[0,...($('mc-household').value==='together'?[1]:[])].map(i=>({income:value('mc-income-'+i),status:$('mc-status-'+i).value,pension:value('mc-pension-'+i)})),singleAllowance:$('mc-single').checked,rate:value('mc-rate'),years:value('mc-years'),fixedYears:value('mc-fixed'),deductible:$('mc-deductible').value==='yes',monthlyDebt:value('mc-debt'),duo:value('mc-duo'),alimony:value('mc-alimony'),propertyValue:0,purchasePrice:0,label:'unknown',ownMoney:0,equity:0,costs:0};
  }
  function render(){
    const x=input(),r=engine.calculate(x),s=engine.schedule(r.maximum,x.rate,r.months);last={x,r,s};
    $('mc-empty').hidden=true;$('mc-result').hidden=false;$('mc-schedule-box').hidden=false;
    $('mc-maximum').textContent=euro(r.maximum);$('mc-monthly').textContent=cents(r.monthly);
    $('mc-basis').textContent='Op basis van uw inkomen en maandelijkse verplichtingen. De waarde van een latere woning moet de lening ook toelaten.';
    const rows=[['Toetsinkomen per jaar',euro(r.limiting.income)],['Toegestaan deel voor woonlasten',pct(r.limiting.percent)],['Maximale hypotheeklast per maand',cents(Math.max(0,r.limiting.monthly))],['Toetsrente / rentevast',pct(r.testRate)+' / '+x.fixedYears+' jaar'],['Looptijd',x.years+' jaar']];
    $('mc-breakdown').replaceChildren(...rows.flatMap(([k,v])=>[node('dt',k),node('dd',v)]));
    const notes=['Toetsinkomen: '+euro(r.limiting.income)+' per jaar. Woonquote: '+pct(r.limiting.percent)+'. Toetsrente: '+pct(r.testRate)+'.'];
    if(r.limiting.single)notes.push('Inclusief '+euro(r.limiting.single)+' alleenstaandenruimte.');
    if(r.energy)notes.push('Inclusief '+euro(r.energy)+' energielabelruimte.');
    if(r.scenarios.length>1)notes.push('Huidig inkomen en pensioen zijn voorzichtig getoetst; de laagste leencapaciteit bepaalt de indicatie.');
    notes.push('Koopprijs, woningwaarde, energielabel, eigen geld en aankoopkosten zijn nog niet meegenomen.');
    if(!x.deductible)notes.push('Gerekend zonder fiscale renteaftrek.');
    if(r.maximum===0)notes.push('Op basis van deze invoer is er geen leenruimte.');
    if(new Date().getFullYear()!==2026)notes.push('Let op: deze berekening gebruikt de normen van 2026. Laat de actuele leencapaciteit controleren.');
    $('mc-notes').textContent=notes.join(' ');
    $('mc-schedule-summary').textContent='Eerste maand: '+cents(s.firstInterest)+' rente en '+cents(s.firstRepayment)+' aflossing. Totale rente bij een gelijkblijvend tarief: '+euro(s.totalInterest)+'.';
    $('mc-schedule').replaceChildren(...s.years.map(y=>{const tr=document.createElement('tr');tr.append(node('td',y.year),node('td',euro(y.balance)),node('td',euro(y.interest)));return tr;}));
    $('mc-result-title').focus();
  }
  $('mc-form').addEventListener('input',()=>{invalidate();sync();});
  $('mc-form').addEventListener('change',()=>{invalidate();sync();});
  $('mc-back').addEventListener('click',()=>{step=Math.max(0,step-1);showStep(true);});
  $('mc-form').addEventListener('submit',e=>{
    e.preventDefault();if(!validate(step))return;
    if(step<1){step++;showStep(true);return;}
    for(let i=0;i<2;i++)if(!validate(i))return;
    try{render();$('mc-error').hidden=true;}catch(error){invalidate();$('mc-error').textContent=error.message;$('mc-error').hidden=false;}
  });
  function summary(){const {x,r}=last;return 'VERMOGENKOMPAS - HYPOTHEEKBEREKENING\n'+new Date().toLocaleDateString('nl-NL')+' • Normen 2026\n\n'+x.people.map((p,i)=>(i?'Partner':'Uzelf')+': bruto jaarinkomen '+euro(p.income)+', '+({aow:'AOW bereikt',soon:'AOW binnen 10 jaar',later:'AOW over meer dan 10 jaar'}[p.status])+(p.status==='soon'?', verwacht pensioen '+euro(p.pension):'')).join('\n')+'\n\nIndicatie maximale hypotheek: '+euro(r.maximum)+'\nBruto maandlast: '+cents(r.monthly)+'\n'+$('mc-breakdown').innerText+'\n\nOverige kredietlasten per maand: '+euro(x.monthlyDebt)+'\nDUO-termijn per maand: '+euro(x.duo)+'\nPartneralimentatie per maand: '+euro(x.alimony)+'\n\n'+$('mc-notes').textContent+'\n\n'+$('mc-method').innerText+'\n\nIndicatie, geen hypotheekaanbod of persoonlijk financieel advies. De waarde van een latere woning en de aankoopkosten zijn nog niet getoetst. Bruto maandlasten zijn exclusief overige woonkosten. Er zijn geen gegevens verstuurd.';}
  $('mc-save').addEventListener('click',()=>{if(!last)return;const url=URL.createObjectURL(new Blob(['\ufeff'+summary()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='VermogenKompas-hypotheekberekening.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);});
  $('mc-discuss').addEventListener('click',()=>{if(!last)return;$('contact-form').hidden=false;$('contact-review').hidden=true;$('contact-topic').value='Woonadvies en hypotheek';const text='Mijn hypotheekindicatie: '+euro(last.r.maximum)+', bruto maandlast '+cents(last.r.monthly)+' bij '+pct(last.x.rate)+' rente en '+last.x.years+' jaar looptijd. Ik wil mijn mogelijkheden bespreken.';if(!$('contact-message').value.trim())$('contact-message').value=text;});
  sync();showStep(false);
})();
