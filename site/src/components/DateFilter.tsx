'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Default to current month if no params
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Initialize state from URL params or defaults
  const initialFrom = searchParams.get('from');
  let initialYear = currentYear;
  let initialMonth = currentMonth;

  if (initialFrom) {
      const date = new Date(initialFrom);
      if (!isNaN(date.getTime())) {
          initialYear = date.getFullYear();
          initialMonth = date.getMonth() + 1;
      }
  }
  
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [acclamation, setAcclamation] = useState(searchParams.get('acclamation') === 'true');
  const [rejected, setRejected] = useState(searchParams.get('rejected') === 'true');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFilter = () => {
    // Calculate start and end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const fromStr = startDate.toISOString().split('T')[0];
    const toStr = endDate.toISOString().split('T')[0];
    
    const params = new URLSearchParams();
    params.set('from', fromStr);
    params.set('to', toStr);
    if (acclamation) {
        params.set('acclamation', 'true');
    }
    if (rejected) {
        params.set('rejected', 'true');
    }
    
    router.push(`/?${params.toString()}`);
    setIsOpen(false);
  };

  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  return (
    <div className="mb-8 relative" ref={containerRef}>
      <div className="flex justify-end">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtrera
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-20 border border-gray-200 p-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Månad</label>
                    <select 
                    value={month} 
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    >
                    {months.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                    ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">År</label>
                    <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                    </select>
                </div>

                <div className="flex items-center">
                    <input
                        id="acclamation"
                        type="checkbox"
                        checked={acclamation}
                        onChange={(e) => setAcclamation(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acclamation" className="ml-2 block text-sm text-gray-900">
                        Visa beslut utan votering
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        id="rejected"
                        type="checkbox"
                        checked={rejected}
                        onChange={(e) => setRejected(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rejected" className="ml-2 block text-sm text-gray-900">
                        Visa avslagna förslag
                    </label>
                </div>

                <div className="pt-2 flex justify-between">
                    <button
                        onClick={() => {
                            setYear(currentYear);
                            setMonth(currentMonth);
                            setAcclamation(false);
                            setRejected(false);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Återställ
                    </button>
                    <button
                        onClick={handleFilter}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Visa resultat
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}