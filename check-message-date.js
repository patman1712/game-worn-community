// check-message-date.js
const checkMessages = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/entities/Message');
    const messages = await response.json();
    
    if (messages.length > 0) {
      console.log('Message sample:', messages[0]);
    } else {
      console.log('No messages found.');
    }
    
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};

checkMessages();
