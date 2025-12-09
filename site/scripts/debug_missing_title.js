// const fetch = require('node-fetch');

const API_BASE = 'https://data.riksdagen.se';

async function debugTitle() {
  // Search for the document
  // "Höständringsbudget för 2023"
  // Date 2023-11-29
  
  // Let's try to find the rskr or bet for this date.
  const url = `${API_BASE}/dokumentlista/?doktyp=rskr&from=2023-11-29&tom=2023-11-29&utformat=json`;
  console.log('Fetching:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const docs = data.dokumentlista.dokument;
    if (!docs) {
        console.log('No docs found');
        return;
    }
    
    const docArray = Array.isArray(docs) ? docs : [docs];
    
    for (const doc of docArray) {
        console.log('----------------');
        console.log('ID:', doc.dok_id);
        
        const statusUrl = `${API_BASE}/dokumentstatus/${doc.dok_id}.json`;
        const statusResp = await fetch(statusUrl);
        const statusData = await statusResp.json();
        
        const refs = statusData.dokumentstatus?.dokreferens?.referens;
        if (refs) {
            const refArray = Array.isArray(refs) ? refs : [refs];
            const betRef = refArray.find(r => r.ref_dok_typ === 'bet');
            if (betRef) {
                console.log('Betänkande ID:', betRef.ref_dok_id);
                console.log('Betänkande Titel (ref):', betRef.ref_dok_titel);
                
                // Fetch the betänkande document to see if it has a title
                const betUrl = `${API_BASE}/dokument/${betRef.ref_dok_id}.json`;
                const betResp = await fetch(betUrl);
                const betData = await betResp.json();
                console.log('Keys:', Object.keys(betData));
                if (betData.dokumentstatus && betData.dokumentstatus.dokument) {
                    console.log('Betänkande Titel (status.doc):', betData.dokumentstatus.dokument.titel);
                } else {
                    console.log('No dokumentstatus.dokument property');
                }
            }
        }
    }

  } catch (e) {
    console.error(e);
  }
}

debugTitle();
