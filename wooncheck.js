(function(){'use strict';var $=id=>document.getElementById(id);  var questions = [
    {id:'woning',title:'Hoe woont u op dit moment?',hint:'Kies het antwoord dat het beste bij u past.',options:[
      ['vrijstaand','Vrijstaande woning'],['tweeonderkap','Twee-onder-een-kap'],['rijwoning','Hoek- of tussenwoning'],['appartement','Appartement'],['anders','Anders']
    ]},
    {id:'reden',title:'Waarom denkt u na over verhuizen?',hint:'Kies de belangrijkste reden. Ook alleen oriënteren is prima.',options:[
      ['ruimte','Mijn woning is te groot'],['onderhoud','Onderhoud wordt meer werk'],['gelijkvloers','Ik wil gelijkvloers wonen'],['locatie','Dichter bij familie of voorzieningen'],['lasten','Ik wil lagere woonlasten'],['vermogen','Ik wil vermogen vrijmaken'],['orienteren','Ik oriënteer mij alleen']
    ]},
    {id:'twijfel',title:'Wat houdt u op dit moment vooral tegen?',hint:'Welke twijfel weegt voor u het zwaarst?',options:[
      ['duur','Andere woningen zijn te duur'],['geenappartement','Ik wil niet in een appartement wonen'],['aanbod','Het aanbod past niet bij mij'],['haalbaar','Ik weet niet wat ik financieel kan'],['overwaarde','Wat doe ik met mijn overwaarde?'],['verhuizing','Ik zie op tegen de verhuizing'],['anders','Anders']
    ]},
    {id:'gelijkvloers',title:'Hoe belangrijk is gelijkvloers wonen voor u?',hint:'Denk ook aan een woning die blijft passen als uw behoeften veranderen.',options:[
      ['belangrijk','Heel belangrijk'],['later','Misschien later'],['niet','Niet belangrijk']
    ]},
    {id:'doel',title:'Wat wilt u bereiken met eventuele overwaarde?',hint:'Kies het doel dat u op dit moment het meest aanspreekt.',options:[
      ['lasten','Lagere woonlasten'],['buffer','Een deel beschikbaar houden'],['later','Vermogen voor toekomstige uitgaven'],['familie','Kinderen of kleinkinderen helpen'],['beleggen','Mogelijk beleggen'],['onbekend','Ik weet het nog niet']
    ]},
    {id:'prioriteit',title:'Wat is voor u het belangrijkste voor later?',hint:'Uw voorkeur helpt om de gespreksonderwerpen aan te laten sluiten.',options:[
      ['zekerheid','Zekerheid'],['comfort','Comfort'],['lasten','Lage maandlasten'],['beschikbaar','Vermogen beschikbaar houden'],['locatie','Dicht bij familie of voorzieningen'],['combinatie','Een combinatie hiervan']
    ]}
  ];
  var state = {step:0, answers:new Array(questions.length).fill(null), result:null};
  function optionLabel(q, value) {
    var found = questions[q].options.find(function (o) { return o[0] === value; });
    return found ? found[1] : '';
  }
  function el(tag, text, className) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function renderQuestion(shouldFocus) {
    $('question-view').hidden = false;
    $('result-view').hidden = true;
    var q = questions[state.step];
    $('step-label').textContent = 'Vraag ' + (state.step + 1) + ' van ' + questions.length;
    $('check-progress').setAttribute('aria-valuenow', String(state.step + 1));
    $('progress-fill').style.width = String((state.step + 1) / questions.length * 100) + '%';
    $('question-title').textContent = q.title;
    $('question-hint').textContent = q.hint;
    var options = $('answer-options');
    options.replaceChildren();
    q.options.forEach(function (item) {
      var label = el('label', undefined, 'answer');
      var radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'answer'; radio.value = item[0]; radio.required = true;
      radio.checked = state.answers[state.step] === item[0];
      radio.addEventListener('change', function () {
        state.answers[state.step] = item[0];
        state.result = null;
        $('check-next').disabled = false;
      });
      label.append(radio, el('span', item[1]));
      options.append(label);
    });
    $('check-back').disabled = state.step === 0;
    $('check-next').disabled = !state.answers[state.step];
    $('check-next').replaceChildren(document.createTextNode(state.step === questions.length - 1 ? 'Bekijk mijn uitkomst' : 'Volgende vraag'));
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-arrow'); svg.append(use); $('check-next').append(svg);
    if (shouldFocus) {
      $('question-title').focus({preventScroll:true});
      $('check-card').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
  }
  function makeResult(a) {
    if (a.length !== 6 || a.some(function (v,i) { return !questions[i].options.some(function (o) { return o[0] === v; }); })) {
      throw new Error('Vul eerst alle zes vragen in met een geldig antwoord.');
    }
    var home = {'vrijstaand':'een vrijstaande woning','tweeonderkap':'een twee-onder-een-kapwoning','rijwoning':'een hoek- of tussenwoning','appartement':'een appartement','anders':'uw huidige woonvorm'}[a[0]];
    var living = {
      ruimte:'Welke ruimtes gebruikt u graag, en welke kunt u missen? Vergelijk woonvormen die passen bij uw dagelijks leven.',
      onderhoud:'Welke taken rond uw woning en tuin wilt u verminderen? Neem onderhoud mee bij het vergelijken van woonvormen.',
      gelijkvloers:'Welke dagelijkse activiteiten wilt u op één verdieping kunnen doen? Breng de eisen aan uw volgende woning in kaart.',
      locatie:'Welke familieleden en voorzieningen wilt u dichtbij hebben? Maak eerst duidelijk welke buurten of plaatsen voor u passen.',
      lasten:'Welke woonvormen sluiten aan op uw wensen? Vergelijk daarna alle terugkerende kosten, ook onderhoud en energie.',
      vermogen:'Welke woonkeuzes passen bij uw leven en kunnen financiële ruimte geven? Onderzoek wooncomfort en beschikbaar vermogen samen.',
      orienteren:'Wat bevalt u aan uw huidige woning en wat zou u later willen veranderen? Ook blijven wonen en aanpassen kunnen onderwerpen zijn.'
    }[a[1]];
    if (a[3] === 'belangrijk' && a[1] !== 'gelijkvloers') living += ' Gelijkvloers wonen is daarbij voor u een belangrijk uitgangspunt.';
    else if (a[3] === 'later') living += ' U wilt gelijkvloers wonen mogelijk later opnieuw afwegen.';
    else if (a[3] === 'niet') living += ' Gelijkvloers wonen heeft voor u nu geen prioriteit.';
    var barrier = {
      duur:['De totale kosten van uw woonstap','U twijfelt over de prijs van andere woningen. Vergelijk aankoop- en verkoopkosten, de hypotheek en terugkerende uitgaven. De aankoopprijs vertelt niet het hele verhaal.'],
      geenappartement:['Woonvormen buiten een appartement','Een appartement spreekt u niet aan. Welke compacte huizen, bungalows of aanpassingen aan uw huidige woning passen bij uw wensen en financiële mogelijkheden?'],
      aanbod:['Uw wensen en het beschikbare aanbod','Uw woonwensen sluiten nog niet aan op het aanbod. Welke eisen zijn voor u essentieel en op welke punten heeft u ruimte? Bekijk ook de gewenste locatie en uw tijdsplanning.'],
      haalbaar:['Wat financieel haalbaar is','U wilt weten welke ruimte u heeft. Daarvoor zijn uw pensioeninkomen, uitgaven, woningwaarde, hypotheek en ander vermogen nodig. Deze check rekent uw mogelijkheden niet door.'],
      overwaarde:['Wat er na uw woonstap overblijft','U vraagt zich af wat u met overwaarde kunt doen. Breng eerst de verwachte verkoopopbrengst, hypotheekaflossing, kosten en financiering van uw volgende woning in kaart.'],
      verhuizing:['Een haalbare planning','U ziet op tegen de verhuizing. Welke praktische hulp, tijd en financiële ruimte heeft u nodig? Een gefaseerde planning kan een onderwerp voor het gesprek zijn.'],
      anders:['Uw twijfel verder verkennen','Uw belangrijkste belemmering staat niet tussen de vaste antwoorden. Neem die mee in het gesprek, zodat duidelijk wordt welke informatie of ondersteuning u nodig heeft.']
    }[a[2]];
    var goals = {
      lasten:['Overwaarde en uw maandlasten','U wilt eventuele overwaarde onderzoeken in relatie tot lagere woonlasten. Wat betekenen verschillende keuzes voor uw hypotheek en het geld dat u beschikbaar houdt?'],
      buffer:['Beschikbaar vermogen voor later','U wilt een deel van uw vermogen achter de hand houden. Welke uitgaven verwacht u, en welke ruimte wilt u behouden voor onverwachte gebeurtenissen?'],
      later:['Vermogen voor toekomstige uitgaven','U wilt vermogen gebruiken voor later. Welke uitgaven verwacht u, wanneer heeft u geld nodig en hoe lang moet het vermogen meegaan?'],
      familie:['Familie helpen en zelf ruimte houden','U wilt kinderen of kleinkinderen helpen. Onderzoek eerst uw eigen toekomstige behoeften en bespreek de fiscale en juridische gevolgen van schenken.'],
      beleggen:['Of beleggen bij uw doelen past','U wilt mogelijk beleggen. Bespreek eerst uw termijn, financiële buffer, kennis, ervaring, voorkeuren en welk verlies u kunt en wilt dragen. De check zegt niet dat beleggen passend voor u is.'],
      onbekend:['Uw doelen voor de overwaarde bepalen','U weet nog niet wat u met eventuele overwaarde wilt doen. Begin met uw verwachte uitgaven, de ruimte die u wilt behouden en de plannen die voor u belangrijk zijn.']
    }[a[4]];
    var priority = {
      zekerheid:'Neem daarbij mee hoeveel financiële onzekerheid u wilt en kunt dragen.',
      comfort:'Houd ruimte voor uw wooncomfort, dat voor u vooropstaat.',
      lasten:'De invloed op uw maandlasten verdient voor u extra aandacht.',
      beschikbaar:'Bespreek nadrukkelijk welk deel van uw vermogen u direct wilt kunnen gebruiken.',
      locatie:'Houd rekening met de kosten van wonen in de buurt van familie en voorzieningen.',
      combinatie:'U wilt meerdere belangen afwegen. Maak in het gesprek duidelijk welke voor u het zwaarst wegen.'
    }[a[5]];
    return {
      title:'Uw kompas wijst richting: wonen en vermogen samen bekijken.',
      lead:(a[0]==='anders'?'Vanuit uw huidige woonvorm kijkt u vooruit.':'U woont in '+home+' en kijkt vooruit.')+' Deze drie onderwerpen sluiten aan op uw antwoorden en vormen een startpunt voor een gesprek.',
      topics:[{title:'Wooncomfort dat bij u past',text:living},{title:barrier[0],text:barrier[1]},{title:goals[0],text:goals[1]+' '+priority}],
      answers:questions.map(function (q,i) { return {question:q.title,answer:optionLabel(i,a[i])}; })
    };
  }
  function showResult(shouldFocus) {
    state.result = makeResult(state.answers);
    $('question-view').hidden = true;
    $('result-view').hidden = false;
    $('result-title').textContent = state.result.title;
    $('result-lead').textContent = state.result.lead;
    $('result-topics').replaceChildren();
    state.result.topics.forEach(function (topic,i) {
      var li = el('li', undefined, 'result-topic');
      var body = document.createElement('div');
      body.append(el('h3',topic.title),el('p',topic.text));
      li.append(el('span',String(i+1).padStart(2,'0'),'number'),body);
      $('result-topics').append(li);
    });
    $('answers-summary').replaceChildren();
    state.result.answers.forEach(function (a) {
      $('answers-summary').append(el('dt',a.question),el('dd',a.answer));
    });
    $('check-status').textContent = 'De check is afgerond. Uw drie gespreksonderwerpen staan hieronder.';
    if (shouldFocus) {
      $('result-title').focus({preventScroll:true});
      $('check-card').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
  }
  $('check-form').addEventListener('submit',function (e) {
    e.preventDefault();
    if (!state.answers[state.step]) return;
    if (state.step < questions.length-1) { state.step++; renderQuestion(true); }
    else showResult(true);
  });
  $('check-back').addEventListener('click',function () { if (state.step>0) {state.step--;renderQuestion(true);} });
  $('check-edit').addEventListener('click',function () {state.step=0;renderQuestion(true);});
  var checkSummaryText = '';
  function resultText() {
    if (!state.result) return '';
    return 'Mijn Woon & VermogenCheck\n\n' + state.result.topics.map(function (t,i) {return (i+1)+'. '+t.title+'\n'+t.text;}).join('\n\n') + '\n\nMijn antwoorden:\n' + state.result.answers.map(function (a) {return a.question+'\n'+a.answer;}).join('\n\n');
  }
  $('discuss-result').href='index.html?onderwerp=check#contact';
  renderQuestion(false);
  // Optional WebMCP support. All actions share the state of the visible check.
  // No contact details are read, saved or sent through these tools.
  if (document.modelContext && document.modelContext.registerTool) {
    var lifecycle = new AbortController();
    function register(tool) {
      try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(function () {}); } catch (_) {}
    }
    register({
      name:'read_wooncheck',title:'Lees de Woon & VermogenCheck',
      description:'Lees de zes vragen, toegestane antwoordwaarden, huidige antwoorden en eventuele uitkomst. Wijzigt niets en leest geen contactgegevens.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute:function () {return {questions:questions,currentStep:state.step,answers:state.answers.slice(),result:state.result};}
    });
    register({
      name:'complete_wooncheck',title:'Vul de Woon & VermogenCheck in',
      description:'Vul alle zes vragen in en toon dezelfde oriënterende uitkomst als de zichtbare check. Plant geen afspraak en verstuurt geen contactgegevens.',
      inputSchema:{type:'object',properties:{answers:{type:'array',items:{type:'string'},minItems:6,maxItems:6}},required:['answers'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute:function (input) {
        if (!input || typeof input !== 'object' || !Array.isArray(input.answers) || Object.keys(input).some(function (k) {return k!=='answers';})) throw new Error('Geef uitsluitend zes geldige antwoorden in answers.');
        var values=input.answers.slice();
        makeResult(values);
        state.answers=values;state.step=5;showResult(false);
        return {result:state.result,status:'orientation_only'};
      }
    });
    window.addEventListener('pagehide',function (e) {if (!e.persisted) lifecycle.abort();},{once:true});
  }
})();
