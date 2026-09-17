(function(){'use strict';var $=id=>document.getElementById(id);var el=(tag,text)=>{var node=document.createElement(tag);node.textContent=text;return node;};  $('contact-prepare').disabled = false;
  var preparedContact = null;
  $('contact-form').addEventListener('submit',function (e) {
    e.preventDefault();
    var name = $('contact-name').value.trim();
    if (!name) { $('contact-name').setCustomValidity('Vul uw naam in.'); $('contact-name').reportValidity(); return; }
    $('contact-name').setCustomValidity('');
    if (!$('contact-form').reportValidity()) return;
    preparedContact = {
      'Naam': name,
      'E-mailadres': $('contact-email').value.trim(),
      'Telefoonnummer': $('contact-phone').value.trim() || 'Niet ingevuld',
      'Onderwerp': $('contact-topic').value,
      'Toelichting': $('contact-message').value.trim() || 'Geen toelichting'
    };
    $('contact-review-data').replaceChildren();
    Object.keys(preparedContact).forEach(function (key) {$('contact-review-data').append(el('dt',key),el('dd',preparedContact[key]));});
    $('contact-form').hidden=true;$('contact-review').hidden=false;$('contact-status').textContent='';
    $('contact-review-title').focus({preventScroll:true});
    $('contact-review').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  $('contact-name').addEventListener('input',function () {this.setCustomValidity('');});
  $('edit-contact').addEventListener('click',function () {
    $('contact-form').hidden=false;$('contact-review').hidden=true;$('contact-name').focus();
  });
  $('download-contact').addEventListener('click',function () {
    if (!preparedContact) return;
    var text = 'VERMOGENKOMPAS\nAanvraag voor een kennismaking\n\nStatus: alleen voorbereid. Niet verzonden. Er is geen afspraak gepland.\n\n' +
      Object.keys(preparedContact).map(function (key) {return key+': '+preparedContact[key];}).join('\n\n') +
      '\n\nEen uitkomst uit de Woon & VermogenCheck is algemene oriëntatie, geen persoonlijk financieel advies.\n';
    var blob = new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='VermogenKompas-kennismaking.txt';
    document.body.append(a);a.click();a.remove();
    window.setTimeout(function () {URL.revokeObjectURL(url);},10000);
    $('contact-status').textContent='De download is gestart. Uw aanvraag is niet verstuurd.';
  });
var topics={hypotheek:'Woonadvies en hypotheek',woonwensen:'Mijn volgende woonstap',overwaarde:'Overwaarde en vermogen',beleggen:'Beleggingsadvies',aanpak:'Mijn volgende woonstap',diensten:'Ik wil mij eerst oriënteren',check:'Mijn Woon & VermogenCheck'};var choice=new URLSearchParams(location.search).get('onderwerp');if(topics[choice])$('contact-topic').value=topics[choice];})();
