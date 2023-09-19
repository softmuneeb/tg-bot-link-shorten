require('dotenv').config();
const axios = require('axios');
const API_TOKEN = process.env.API_KEY_RAILWAY;
const GRAPHQL_ENDPOINT = 'https://backboard.railway.app/graphql/v2';
async function saveDomainInServer(domain) {
  const GRAPHQL_QUERY = `
  mutation customDomainCreate {
      customDomainCreate(
          input: { domain: "${domain}", environmentId: "beba5254-5c21-40e4-9520-96aa644654c0", serviceId: "945d993f-a8af-40cb-982d-2b0f37a791c4"}
      ) {
          id
          status {
            dnsRecords {
              requiredValue
            }
          }
      }
  }`;
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
  const error = response?.data?.errors?.[0]?.message;

  if (error) {
    console.error('Error saveDomainInServer', error);
    console.log('GraphQL Response:', JSON.stringify(response.data, null, 2));
    return { error };
  }

  const server =
    response?.data?.data?.customDomainCreate?.status?.dnsRecords[0]
      ?.requiredValue;

  return { server };
}
async function isRailwayAPIWorking() {
  const GRAPHQL_QUERY = `
  query me {
  me {
    projects {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}`;
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
  const error = response?.data?.errors?.[0]?.message;

  if (error) {
    console.error('Error query me', error);
    console.log('GraphQL Response:', JSON.stringify(response.data, null, 2));
    return { error };
  }

  return response.data;
}

// isRailwayAPIWorking();
// saveDomainInServer('lemon-is-json-15.sbs');
module.exports = { saveDomainInServer, isRailwayAPIWorking };
