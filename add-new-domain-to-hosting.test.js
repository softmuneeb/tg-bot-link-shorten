const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Define your API token and GraphQL query
const API_TOKEN = process.env.API_KEY_RAILWAY;
const GRAPHQL_ENDPOINT = 'https://backboard.railway.app/graphql/v2';

// Define your GraphQL query
// beba5254-5c21-40e4-9520-96aa644654c0
const GRAPHQL_QUERY = `
mutation customDomainCreate {
    customDomainCreate(
        input: { domain: "softlemon2.sbs", environmentId: "beba5254-5c21-40e4-9520-96aa644654c0", serviceId: "945d993f-a8af-40cb-982d-2b0f37a791c4"}
    ) {
        id
    }
}
`;

// Function to send the GraphQL request
async function fetchProjectInfo() {
  try {
    const response = await axios.post(
      GRAPHQL_ENDPOINT,
      { query: GRAPHQL_QUERY },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Handle the GraphQL response data
    console.log('GraphQL Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to fetch project information
fetchProjectInfo();
