
// Using native fetch (Node 18+)
const API_URL = 'http://localhost:3001/api';
const ID = '0e89122e-8001-4db2-9c58-fd88e48528e3';

async function debugItem() {
  try {
    console.log(`Searching for item ${ID}...`);
    
    // 1. Check Jersey
    const jerseyRes = await fetch(`${API_URL}/entities/Jersey/${ID}`);
    if (jerseyRes.ok) {
        console.log('--- FOUND IN JERSEY TABLE ---');
        const data = await jerseyRes.json();
        console.log(JSON.stringify(data, null, 2));
        return;
    }

    // 2. Check CollectionItem
    const itemRes = await fetch(`${API_URL}/entities/CollectionItem/${ID}`);
    if (itemRes.ok) {
        console.log('--- FOUND IN COLLECTION_ITEM TABLE ---');
        const data = await itemRes.json();
        console.log(JSON.stringify(data, null, 2));
        return;
    }
    
    console.log('Item NOT found in either table.');
  } catch (e) {
    console.error('Error:', e);
  }
}

debugItem();
