/* Pure calculation engine. Rates are annual percentages, amounts are euros. */
(function (root) {
  'use strict';
  const norms = typeof module !== 'undefined' && module.exports ? require('./mortgage-norms.js') : root.MortgageNorms;
  const energy = {unknown:0,G:0,F:0,E:0,D:5000,C:5000,B:10000,A:10000,'A+':20000,'A++':20000,'A+++':25000,'A++++':30000,'A++++garantie':40000};
  function number(n,name,max=10000000) {if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>max)throw Error('Controleer '+name+'.');return n;}
  function payment(principal,rate,months) {
    number(principal,'het hypotheekbedrag',100000000);number(rate,'de rente',20);
    if(!Number.isInteger(months)||months<1||months>360)throw Error('De looptijd moet 1 tot 360 maanden zijn.');
    const r=rate/1200;
    return r===0?principal/months:principal*r/(-Math.expm1(-months*Math.log1p(r)));
  }
  function quote(income,rate,aow,deductible) {
    const table=norms.tables[(deductible?0:2)+(aow?1:0)];
    let row=table[0];
    for(const candidate of table){if(candidate[0]>income)break;row=candidate;}
    let column=norms.rateUpperBounds.findIndex(limit=>rate<=limit);
    if(column===-1)column=11;
    return {percent:row[column+1],incomeBand:row[0],table:(deductible?1:3)+(aow?1:0)};
  }
  function duoFactor(rate,deductible) {
    if(!deductible)return 1;
    return rate<=2?1.05:rate<=2.5?1.1:rate<=3?1.15:rate<=4?1.2:rate<=4.5?1.25:rate<=5.5?1.3:rate<=6?1.35:1.4;
  }
  function calculate(input) {
    const x=input;
    if(!x||!Array.isArray(x.people)||x.people.length<1||x.people.length>2)throw Error('Vul één of twee aanvragers in.');
    x.people.forEach(p=>{number(p.income,'het jaarinkomen',1000000);if(!['aow','soon','later'].includes(p.status))throw Error('Kies uw AOW-situatie.');if(p.status==='soon')number(p.pension,'het verwachte pensioeninkomen',1000000);});
    for(const k of ['monthlyDebt','duo','alimony','ownMoney','equity','propertyValue','purchasePrice','costs'])number(x[k],k);
    number(x.rate,'de rente',20);
    if(!Number.isInteger(x.years)||x.years<1||x.years>30)throw Error('Kies een looptijd van 1 tot 30 jaar.');
    if(![1,5,10,15,20,30].includes(x.fixedYears))throw Error('Kies een geldige rentevaste periode.');
    if(typeof x.deductible!=='boolean'||typeof x.singleAllowance!=='boolean')throw Error('Controleer de renteaftrek en huishoudsituatie.');
    if(!Object.hasOwn(energy,x.label))throw Error('Kies een geldig energielabel.');
    const months=x.years*12;
    const testRate=x.fixedYears>=10||x.fixedYears>=x.years?x.rate:Math.max(5,x.rate);
    const factor=payment(1,testRate,months);
    const debt=x.monthlyDebt+x.duo*duoFactor(testRate,x.deductible);
    // Test current income and every transition to AOW conservatively at the original principal.
    const scenarios=[];
    const transitions=x.people.map((p,i)=>p.status==='soon'?i:-1).filter(i=>i>=0);
    for(let mask=0;mask<(1<<transitions.length);mask++){
      const people=x.people.map((p,i)=>{
        const future=transitions.includes(i)&&Boolean(mask&(1<<transitions.indexOf(i)));
        return {income:future?p.pension:p.income,aow:p.status==='aow'||future};
      });
      const income=Math.max(0,people.reduce((s,p)=>s+p.income,0)-x.alimony*12);
      const maxIncome=Math.max(...people.map(p=>p.income));
      // If equal incomes straddle AOW, use the lower of both table outcomes.
      const candidates=people.filter(p=>p.income===maxIncome).map(p=>quote(income,testRate,p.aow,x.deductible));
      const q=candidates.reduce((a,b)=>a.percent<=b.percent?a:b);
      const aow=people.length===1&&people[0].aow;
      const single=x.people.length===1&&x.singleAllowance&&income>(aow?29000:30000)?17000:0;
      const allowance=single+energy[x.label];
      const monthly=income*q.percent/1200-debt;
      const maximum=income>0?Math.max(0,monthly/factor+allowance):0;
      scenarios.push({...q,income,maximum,single,monthly,mask});
    }
    const limiting=scenarios.reduce((a,b)=>a.maximum<=b.maximum?a:b);
    const incomeMaximum=Math.floor(limiting.maximum);
    const maximum=x.propertyValue>0?Math.min(incomeMaximum,x.propertyValue):incomeMaximum;
    const funds=x.ownMoney+x.equity;
    const needed=Math.max(0,x.purchasePrice+x.costs-funds);
    const gap=x.purchasePrice>0?Math.max(0,needed-maximum):Math.max(0,x.costs-funds);
    return {maximum,incomeMaximum,needed,gap,funds,budget:Math.max(0,maximum+funds-x.costs),testRate,limiting,scenarios,energy:energy[x.label],debt,monthly:payment(maximum,x.rate,months),neededMonthly:payment(needed,x.rate,months),months};
  }
  function schedule(principal,rate,months) {
    const amount=payment(principal,rate,months);let balance=principal,totalInterest=0;const years=[];
    for(let i=1;i<=months;i++){
      const interest=balance*rate/1200;const repayment=i===months?balance:Math.min(balance,Math.max(0,amount-interest));
      balance=Math.max(0,balance-repayment);totalInterest+=interest;
      if(i%12===0||i===months)years.push({year:Math.ceil(i/12),balance,interest:totalInterest});
    }
    return {payment:amount,firstInterest:principal*rate/1200,firstRepayment:amount-principal*rate/1200,totalInterest,totalPaid:principal+totalInterest,years};
  }
  const api={calculate,payment,quote,duoFactor,schedule};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MortgageEngine=api;
})(globalThis);
