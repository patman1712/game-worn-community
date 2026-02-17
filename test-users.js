const testUsers = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/entities/User');
    const users = await response.json();
    
    console.log('Total users:', users.length);
    
    users.forEach(u => {
      console.log('---');
      console.log('Email:', u.email);
      console.log('Role:', u.role);
      console.log('accept_messages:', u.accept_messages, typeof u.accept_messages);
      console.log('data:', u.data, typeof u.data);
      
      const userSettings = u.data || {};
      const acceptsMessages = 
          (u.accept_messages !== false) && 
          (userSettings.accept_messages !== false);
          
      console.log('Calculated acceptsMessages:', acceptsMessages);
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

testUsers();
