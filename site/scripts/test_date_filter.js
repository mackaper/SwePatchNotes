// const fetch = require('node-fetch'); // Assuming node-fetch is available or using global fetch in newer node

const API_BASE = 'https://data.riksdagen.se';

async function testDateFilter() {
  const from = '2025-11-01';
  const to = '2025-11-30';
  
  // Try without RM, just dates
  const url = `${API_BASE}/dokumentlista/?doktyp=rskr&from=${from}&tom=${to}&utformat=json&p=1`;
  console.log(`Testing URL: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        console.log('Response not ok:', response.status);
        return;
    }
    const data = await response.json();
    const hits = data.dokumentlista['@traffar'];
    console.log(`Hits: ${hits}`);
    
    if (data.dokumentlista.dokument) {
        const docs = Array.isArray(data.dokumentlista.dokument) ? data.dokumentlista.dokument : [data.dokumentlista.dokument];
        console.log(`First doc date: ${docs[0].publicerad}`);
    }
  } catch (e) {
    console.error(e);
  }
}

testDateFilter();
