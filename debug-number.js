
// Using native fetch (Node 18+)
const API_URL = 'http://localhost:3001/api';
const ID = '0e89122e-8001-4db2-9c58-fd88e48528e3';

async function debugItem() {
  try {
    console.log(`Checking item ${ID}...`);

    // Check CollectionItem
    const itemRes = await fetch(`${API_URL}/entities/CollectionItem/${ID}`);
    if (itemRes.ok) {
        console.log('--- FOUND IN COLLECTION_ITEM TABLE ---');
        const item = await itemRes.json();
        console.log('Top level keys:', Object.keys(item));
        console.log('Raw item:', JSON.stringify(item, null, 2));
        
        // Specifically look for number
        console.log('item.number:', item.number);
        console.log('item.player_number:', item.player_number);
        console.log('item.data type:', typeof item.data);
        
        let dataObj = item.data;
        if (typeof item.data === 'string') {
            try {
                dataObj = JSON.parse(item.data);
                console.log('Parsed data object:', JSON.stringify(dataObj, null, 2));
            } catch (e) {
                console.log('Could not parse data string');
            }
        } else {
             console.log('Data object:', JSON.stringify(dataObj, null, 2));
        }
        
        if (dataObj) {
            console.log('data.number:', dataObj.number);
            console.log('data.player_number:', dataObj.player_number);
            console.log('data.jersey_number:', dataObj.jersey_number);
        }
        
        return;
    } else {
        console.log('Not in CollectionItem');
    }

    // Check Jersey
    const jerseyRes = await fetch(`${API_URL}/entities/Jersey/${ID}`);
    if (jerseyRes.ok) {
        console.log('--- FOUND IN JERSEY TABLE ---');
        const data = await jerseyRes.json();
        console.log(JSON.stringify(data, null, 2));
        return;
    } else {
        console.log('Not in Jersey');
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
}

debugItem();
