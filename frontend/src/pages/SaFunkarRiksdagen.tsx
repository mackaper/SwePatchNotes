import { Link } from 'react-router-dom'

export default function SaFunkarRiksdagen() {
  return (
    <div className="max-w-2xl">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-8">
        ← Tillbaka
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Så funkar riksdagen</h1>

      <p className="text-lg text-gray-600 mb-8">
        Riksdagens beslutsprocess kan verka krånglig, men den följer en tydlig kedja från förslag till beslut. Här är en enkel genomgång av hur det går till.
      </p>

      <div className="space-y-4">
        {[
          {
            title: 'Förslag kommer in',
            body: <><span className="font-semibold text-blue-600">Propositioner</span> (förslag från regeringen) och <span className="font-semibold text-blue-600">Motioner</span> (förslag från ledamöter) lämnas in till riksdagen.</>,
          },
          {
            title: 'Utskottet förbereder',
            body: <>Förslagen skickas till ett av riksdagens 15 <span className="font-semibold text-blue-600">utskott</span> (t.ex. Finansutskottet) som är specialiserade på olika områden.</>,
          },
          {
            title: 'Betänkandet skrivs',
            body: <>Utskottet går igenom förslagen och skriver ett <span className="font-semibold text-blue-600">Betänkande</span>. Där föreslår de hur riksdagen ska rösta (t.ex. "Ja till regeringens förslag, Nej till motionerna").</>,
          },
          {
            title: 'Beslut i kammaren',
            body: <>Riksdagen debatterar och röstar på <span className="font-semibold text-blue-600">Betänkandet</span>. Det är detta beslut som avgör om det blir en ny lag eller inte.</>,
          },
        ].map((step, i) => (
          <div key={i} className="bg-white border border-gray-100 shadow rounded-xl p-5 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-1">{step.title}</div>
              <div className="text-gray-500 text-sm leading-relaxed">{step.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
