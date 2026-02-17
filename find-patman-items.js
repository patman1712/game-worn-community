
// Using native fetch (Node 18+)
const API_URL = 'http://localhost:3001/api';

async function run() {
  try {
    // 2. Find items (Jerseys and CollectionItems)
    const jerseysResponse = await fetch(`${API_URL}/entities/Jersey`);
    const jerseys = await jerseysResponse.json();
    
    const itemsResponse = await fetch(`${API_URL}/entities/CollectionItem`);
    const items = await itemsResponse.json();
    
    const allItems = [...jerseys, ...items];
    
    console.log(`Scanning ${allItems.length} total items for 'patman'...`);

    const patmanItems = allItems.filter(item => {
      const json = JSON.stringify(item).toLowerCase();
      return json.includes('patman');
    });
    
    if (patmanItems.length === 0) {
      console.log('No items found containing "patman".');
    } else {
      console.log(`Found ${patmanItems.length} items:`);
      patmanItems.forEach(item => {
        console.log(`ID: ${item.id} | Type: ${item.type || 'Jersey'} | Owner: ${item.owner_email} | Name: ${item.owner_name} | Title: ${item.title || item.team}`);
      });
      
      // If found, delete them? 
      // I'll wait for confirmation or just list them first.
      // But the user said "remove it", so I should probably delete if I find a clear match.
      
      if (patmanItems.length > 0) {
         console.log('Deleting items...');
         for (const item of patmanItems) {
             const entityType = item.type ? 'CollectionItem' : 'Jersey'; // Simple heuristic, might need refinement
             // Actually, if it comes from jerseys array it is Jersey, else CollectionItem
             const isJersey = jerseys.some(j => j.id === item.id);
             const endpoint = isJersey ? 'Jersey' : 'CollectionItem';
             
             console.log(`Deleting ${endpoint} ${item.id}...`);
             const delRes = await fetch(`${API_URL}/entities/${endpoint}/${item.id}`, { method: 'DELETE' });
             console.log(`Status: ${delRes.status}`);
         }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
