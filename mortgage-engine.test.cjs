const {test}=require('node:test');
const assert=require('node:assert/strict');
const e=require('./mortgage-engine.js');
const base={people:[{income:40000,status:'later'},{income:0,status:'later'}],singleAllowance:false,rate:4.33,years:30,fixedYears:10,deductible:true,monthlyDebt:0,duo:0,alimony:0,ownMoney:0,equity:0,propertyValue:0,purchasePrice:0,costs:0,label:'A'};
const calc=x=>e.calculate({...base,...x});
const near=(a,b,epsilon=0.01)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
test('Independent ABN AMRO UI reference, 12 September 2026: 40k jointly, A, 4.33%, 30 years',()=>{const r=calc({});assert.equal(r.maximum,168399);near(r.monthly,836.33);});
test('Published annuity: 300k / 4% / 360 months',()=>near(e.payment(300000,4,360),1432.25));
test('Zero interest and small positive interest remain stable',()=>{near(e.payment(300000,0,360),833.333333);near(e.payment(300000,0.000001,360),833.333333);});
test('All four official first-income table rows and rate boundaries',()=>{
  assert.equal(e.quote(30000,4,false,true).percent,20.1);assert.equal(e.quote(30000,4.001,false,true).percent,20.9);
  assert.equal(e.quote(29000,4,true,true).percent,20.4);assert.equal(e.quote(30000,4,false,false).percent,15.1);assert.equal(e.quote(29000,4,true,false).percent,19.3);
  assert.equal(e.quote(40999,4.33,false,true).incomeBand,40000);assert.equal(e.quote(1000000,7,false,true).percent,32.2);
});
test('AOW table follows highest individual income, regardless of order',()=>{const people=[{income:40000,status:'aow'},{income:30000,status:'later'}];assert.equal(calc({people}).limiting.table,2);assert.equal(calc({people:people.toReversed()}).maximum,calc({people}).maximum);});
test('Equal-income mixed AOW chooses conservative quote',()=>{const people=[{income:30000,status:'aow'},{income:30000,status:'later'}];const r=calc({people});assert.equal(r.limiting.percent,Math.min(e.quote(60000,4.33,true,true).percent,e.quote(60000,4.33,false,true).percent));});
test('Single threshold is strictly over 30k before AOW, over 29k after AOW',()=>{for(const [status,limit] of [['later',30000],['aow',29000]]){assert.equal(calc({people:[{income:limit,status}],singleAllowance:true}).limiting.single,0);assert.equal(calc({people:[{income:limit+1,status}],singleAllowance:true}).limiting.single,17000);}assert.equal(calc({people:[{income:40000,status:'aow'}]}).limiting.single,0);});
test('Energy exemptions 2026; A+++ is 25k and A++++ is 30k',()=>{const zero=calc({label:'E'}).maximum;for(const [label,extra] of Object.entries({unknown:0,D:5000,A:10000,'A++':20000,'A+++':25000,'A++++':30000,'A++++garantie':40000})){assert.equal(calc({label}).maximum-zero,extra);}});
test('Short fixed period uses AFM floor unless loan ends within fixed period',()=>{assert.equal(calc({rate:3,fixedYears:5}).testRate,5);assert.equal(calc({rate:6,fixedYears:5}).testRate,6);assert.equal(calc({rate:3,fixedYears:5,years:5}).testRate,3);});
test('DUO is grossed up only with deductible interest',()=>{near(calc({duo:100}).debt,125);near(calc({duo:100,deductible:false}).debt,100);assert.equal(e.duoFactor(6,true),1.35);assert.equal(e.duoFactor(6.001,true),1.4);});
test('Credit commitments lower capacity and excessive commitments give zero',()=>{assert.ok(calc({monthlyDebt:100}).maximum<calc({}).maximum);assert.equal(calc({monthlyDebt:100000}).maximum,0);});
test('Paid partner alimony reduces annual test income',()=>assert.equal(calc({alimony:100}).limiting.income,38800));
test('No income produces no loan even with energy exemption',()=>assert.equal(calc({people:[{income:0,status:'aow'}],label:'A++++garantie'}).maximum,0));
test('Property value caps loan; own funds change budget not income capacity',()=>{const r=calc({propertyValue:100000,ownMoney:20000,equity:50000,costs:10000,purchasePrice:200000});assert.equal(r.maximum,100000);assert.equal(r.budget,160000);assert.equal(r.needed,140000);assert.equal(r.gap,40000);assert.equal(r.incomeMaximum,calc({}).incomeMaximum);});
test('Own funds can fully cover purchase and costs',()=>{const r=calc({ownMoney:400000,purchasePrice:300000,costs:10000});assert.equal(r.needed,0);assert.equal(r.neededMonthly,0);assert.equal(r.gap,0);});
test('Upcoming pensions test every transition and use lowest capacity',()=>{const r=calc({people:[{income:40000,status:'soon',pension:20000},{income:30000,status:'soon',pension:15000}]});assert.equal(r.scenarios.length,4);assert.equal(r.incomeMaximum,Math.floor(Math.min(...r.scenarios.map(s=>s.maximum))));assert.ok(r.incomeMaximum<calc({people:[{income:40000,status:'later'},{income:30000,status:'later'}]}).incomeMaximum);});
test('Schedule pays off principal and cashflow agrees with total interest',()=>{for(const rate of [0,0.001,4,20]){const s=e.schedule(300000,rate,360);assert.equal(s.years.at(-1).balance,0);near(s.totalPaid,s.payment*360);near(s.firstInterest+s.firstRepayment,s.payment);assert.ok(s.years.every((y,i,all)=>i===0||y.balance<=all[i-1].balance));}});
test('Invalid inputs cannot yield misleading financial results',()=>{for(const rate of [NaN,Infinity,-1,21,'4'])assert.throws(()=>calc({rate}));assert.throws(()=>calc({years:0}));assert.throws(()=>calc({years:3.2}));assert.throws(()=>calc({label:'invalid'}));assert.throws(()=>calc({people:[{income:40000,status:'soon'}]}));assert.throws(()=>calc({ownMoney:-1}));});

