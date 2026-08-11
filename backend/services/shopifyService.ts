import axios from 'axios';

// In a real production app, you would extract the shop and accessToken from the session
// authenticated by Shopify App Bridge and Koa middleware.
// For this exercise, we will assume these are passed or configured.

export const fetchShopifyGraphQL = async (shopDomain: string, accessToken: string, query: string, variables = {}) => {
  const url = `https://${shopDomain}/admin/api/2024-04/graphql.json`;
  const response = await axios.post(
    url,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    }
  );
  return response.data;
};

export const getShopInfo = async (shopDomain: string, accessToken: string) => {
  const query = `
    {
      shop {
        id
        name
        email
        contactEmail
      }
    }
  `;
  const data = await fetchShopifyGraphQL(shopDomain, accessToken, query);
  return data?.data?.shop;
};

export const getProducts = async (shopDomain: string, accessToken: string, limit = 10) => {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            tags
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await fetchShopifyGraphQL(shopDomain, accessToken, query, { first: limit });
  return data?.data?.products?.edges?.map((e: any) => e.node) || [];
};
