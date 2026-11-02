import copy
import decimal
import json
from pathlib import Path

decimal.getcontext().prec = 45
D = lambda value: decimal.Decimal(str(value))
repo = Path(__file__).resolve().parents[1]
# Read only the table already published in the repository. No workbook is read here.
text = (repo / 'mortgage-norms.js').read_text()
norms = json.loads(text.split('const data=', 1)[1].split(';if(', 1)[0])
labels = {'G':(0,20000),'F':(0,20000),'E':(0,20000),'D':(5000,15000),'C':(5000,15000),'B':(10000,10000),'A':(10000,10000),'A+':(20000,10000),'A++':(20000,10000),'A+++':(25000,0),'A++++':(30000,0),'A++++garantie':(40000,0),'unknown':(0,0)}
base = dict(people=[dict(income=65000,status='later'),dict(income=45000,status='later')],singleAllowance=True,rate=4.2,years=30,fixedYears=5,deductible=True,monthlyDebt=45,creditLimit=7500,energyMeasures=7000,duo=0,alimony=0,ownMoney=0,equity=0,propertyValue=0,purchasePrice=0,costs=0,label='C')
cases = [('Baseline',{}),('Form inputs without energy',dict(label='unknown',energyMeasures=0)),('Twenty year term',dict(years=20)),('No measures',dict(energyMeasures=0)),('Partial measures budget',dict(energyMeasures=1750)),('Measures capped',dict(energyMeasures=40000)),('Negative monthly room before exemptions',dict(monthlyDebt=2400)),('No room after exemptions',dict(monthlyDebt=90000)),('Single at threshold',dict(people=[dict(income=30000,status='later')])),('Single above threshold',dict(people=[dict(income=30007,status='later')])),('Single twenty years',dict(people=[dict(income=65000,status='later')],years=20)),('Offer above AFM',dict(rate=6.2)),('Short loan fully fixed',dict(rate=3.2,years=5,fixedYears=5)),('No credit',dict(creditLimit=0)),('Additional monthly debt',dict(monthlyDebt=175)),('Income above final band',dict(people=[dict(income=180000,status='later')])),('Below rounded boundary',dict(rate=4.0004,fixedYears=10)),('Exact rounding midpoint',dict(rate=4.0005,fixedYears=10)),('Above rounded boundary',dict(rate=4.0006,fixedYears=10)),('Low positive income',dict(people=[dict(income=12000,status='later')],creditLimit=0,monthlyDebt=0))]
for label in list(labels)[:-1]:
    for years in [20,30]:
        cases.append((f'Label {label}, {years} years',dict(label=label,years=years,energyMeasures=40000)))

def expected(x):
    income = sum(D(p['income']) for p in x['people'])
    rate = D(x['rate']) if x['fixedYears'] >= 10 or x['fixedYears'] >= x['years'] else max(D(5),D(x['rate']))
    table_rate = rate.quantize(D('0.001'),rounding=decimal.ROUND_HALF_UP)
    column = next((i for i,v in enumerate(norms['rateUpperBounds']) if table_rate <= D(v)),11)
    row = next(r for r in reversed(norms['tables'][0]) if income >= r[0])
    percent = D(row[column+1])
    monthly = income*percent/1200-D(x['monthlyDebt'])-D(x['creditLimit'])*D('.02')
    r = rate/1200
    factor = lambda months: (1-(1+r)**(-months))/r if r else D(months)
    a, a30 = factor(x['years']*12),factor(360)
    single = 17000 if len(x['people']) == 1 and x['singleAllowance'] and income > 30000 else 0
    energy, cap = labels[x['label']]
    measures = min(x['energyMeasures'],cap)
    principal = lambda extra: max(D(0),(monthly+D(extra)/a30)*a)
    floor = lambda amount: int(amount.to_integral_value(rounding=decimal.ROUND_FLOOR))
    maximum = floor(principal(single+energy+measures))
    without = floor(principal(single+energy))
    offer = D(x['rate'])/1200
    payment = D(maximum)*offer/(1-(1+offer)**(-x['years']*12)) if offer else D(maximum)/(x['years']*12)
    return dict(income=float(income),incomeBand=row[0],testRate=float(rate),percent=float(percent),monthly=float(monthly),annuityFactor=float(a),thirtyYearFactor=float(a30),baseMaximum=float(principal(single)),single=single,energy=energy,measuresAllowance=measures,incomeMaximum=maximum,extraForMeasures=maximum-without,withoutMeasures=without,payment=float(payment))

fixtures = []
for name,changes in cases:
    x = copy.deepcopy(base)
    x.update(changes)
    fixtures.append(dict(name=name,input=x,expected=expected(x)))
target = repo / 'test/fixtures/lti-2026-synthetic.json'
target.write_text(json.dumps(dict(source='Invented test inputs only. No workbook case data.',method='Independent Python Decimal reference at 45 digit precision, using the already public TRHK table.',cases=fixtures),indent=2)+'\n')
print(f'Created {len(fixtures)} synthetic cases from invented inputs and the public norms table.')
