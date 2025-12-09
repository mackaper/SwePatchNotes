import { getLatestDecisions } from '../lib/riksdagen';
import { DecisionList } from '../components/DecisionList';
import { DateFilter } from '../components/DateFilter';
import Link from 'next/link';

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const from = typeof params.from === 'string' ? params.from : undefined;
  const to = typeof params.to === 'string' ? params.to : undefined;

  const decisions = await getLatestDecisions(20, from, to);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter text-blue-900">
              Riksdags<span className="text-yellow-500">kollen</span>
            </Link>
          </div>
          <nav>
            <ul className="flex space-x-4 text-sm font-medium text-gray-600">
              <li><Link href="/sa-funkar-riksdagen" className="hover:text-blue-900">Så funkar riksdagen</Link></li>
              <li><a href="#" className="hover:text-blue-900">Om tjänsten</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Vad händer i riksdagen?
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            Vi sammanfattar besluten och visar hur partierna röstar.
          </p>
        </div>

        <DateFilter />

        <DecisionList decisions={decisions} />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 Riksdagskollen. Data från Sveriges Riksdag.</p>
        </div>
      </footer>
    </div>
  );
}
