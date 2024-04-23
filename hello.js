// Get the chatId from localStorage
const chatId = 5729797;

// Check if chatId is available
if (chatId) {
    // Hit the API
    fetch(`http://localhost:4001/login-count/${chatId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            // Handle the response data
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
} else {
    console.error('chatId not found in localStorage.');
}
