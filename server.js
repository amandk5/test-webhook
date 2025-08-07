// Dialogflow CX Webhook Server with Testing Capabilities
const express = require('express');
const axios = require("axios");
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // For serving test HTML page

// Port configuration
const PORT = process.env.PORT || 3000;

// Store conversation logs for debugging
const conversationLogs = [];

// Utility function to log conversations
function logConversation(type, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: type,
    data: data
  };
  conversationLogs.push(logEntry);
  console.log(`[${logEntry.timestamp}] ${type}:`, JSON.stringify(data, null, 2));
}

// Mock database for demonstration
const mockDatabase = {
  products: [
    { id: 1, name: "iPhone 14", price: 999, stock: 50 },
    { id: 2, name: "Samsung Galaxy S23", price: 899, stock: 30 },
    { id: 3, name: "Google Pixel 7", price: 699, stock: 25 }
  ],
  orders: [],
  users: [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1234567890" }
  ]
};

// Helper function to get current date/time
function getCurrentDateTime() {
  return new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to get weather (mock)
function getMockWeather(city) {
  const weatherData = {
    'new york': { temp: 72, condition: 'Sunny', humidity: 45 },
    'london': { temp: 18, condition: 'Cloudy', humidity: 70 },
    'tokyo': { temp: 25, condition: 'Rainy', humidity: 80 },
    'default': { temp: 22, condition: 'Partly Cloudy', humidity: 60 }
  };
  
  return weatherData[city.toLowerCase()] || weatherData.default;
}

// Main webhook endpoint for Dialogflow CX
// app.post('/webhook', (req, res) => {
//   try {
//     // Log incoming request
//     logConversation('INCOMING_REQUEST', {
//       headers: req.headers,
//       body: req.body
//     });

//     // Extract data from Dialogflow CX request
//     const {
//       detectIntentResponseId,
//       intentInfo,
//       pageInfo,
//       sessionInfo,
//       text,
//       languageCode
//     } = req.body;

//     const intentDisplayName = intentInfo?.displayName || 'Unknown Intent';
//     const currentPage = pageInfo?.displayName || 'Unknown Page';
//     const parameters = sessionInfo?.parameters || {};
//     const userMessage = text || '';

//     // Log extracted information
//     logConversation('EXTRACTED_DATA', {
//       intent: intentDisplayName,
//       page: currentPage,
//       parameters: parameters,
//       userMessage: userMessage
//     });

//     let fulfillmentResponse = {
//       messages: []
//     };

//     let updatedParameters = { ...parameters };

//     // Handle different intents
//     switch (intentDisplayName.toLowerCase()) {
//       case 'get.weather':
//         const city = parameters.city || parameters['geo-city'] || 'your location';
//         const weather = getMockWeather(city);
//         fulfillmentResponse.messages.push({
//           text: {
//             text: [`The weather in ${city} is ${weather.condition} with a temperature of ${weather.temp}°F and ${weather.humidity}% humidity.`]
//           }
//         });
//         updatedParameters.weather_info = weather;
//         break;

//       case 'get.time':
//       case 'current.time':
//         fulfillmentResponse.messages.push({
//           text: {
//             text: [`The current date and time is: ${getCurrentDateTime()}`]
//           }
//         });
//         break;

//       case 'product.search':
//       case 'find.product':
//         const searchTerm = parameters.product_name || parameters['any'] || '';
//         const foundProducts = mockDatabase.products.filter(product =>
//           product.name.toLowerCase().includes(searchTerm.toLowerCase())
//         );
        
//         if (foundProducts.length > 0) {
//           const productList = foundProducts.map(p => 
//             `${p.name} - $${p.price} (${p.stock} in stock)`
//           ).join('\n');
//           fulfillmentResponse.messages.push({
//             text: {
//               text: [`I found these products:\n${productList}`]
//             }
//           });
//           updatedParameters.found_products = foundProducts;
//         } else {
//           fulfillmentResponse.messages.push({
//             text: {
//               text: [`Sorry, I couldn't find any products matching "${searchTerm}". Try searching for iPhone, Samsung, or Pixel.`]
//             }
//           });
//         }
//         break;

//       case 'place.order':
//         const productId = parameters.product_id;
//         const quantity = parameters.quantity || 1;
//         const product = mockDatabase.products.find(p => p.id == productId);
        
//         if (product && product.stock >= quantity) {
//           const order = {
//             id: mockDatabase.orders.length + 1,
//             productName: product.name,
//             quantity: quantity,
//             totalPrice: product.price * quantity,
//             timestamp: new Date().toISOString()
//           };
//           mockDatabase.orders.push(order);
//           product.stock -= quantity;
          
//           fulfillmentResponse.messages.push({
//             text: {
//               text: [`Great! I've placed your order for ${quantity}x ${product.name}. Total: $${order.totalPrice}. Order ID: ${order.id}`]
//             }
//           });
//           updatedParameters.order_confirmation = order;
//         } else {
//           fulfillmentResponse.messages.push({
//             text: {
//               text: [`Sorry, we don't have enough stock for that item or the product wasn't found.`]
//             }
//           });
//         }
//         break;

//       case 'greeting':
//       case 'default.welcome.intent':
//         fulfillmentResponse.messages.push({
//           text: {
//             text: [`Hello! I'm your assistant powered by webhook integration. I can help you with weather, time, product search, and orders. What would you like to know?`]
//           }
//         });
//         break;

//       case 'test.webhook':
//         fulfillmentResponse.messages.push({
//           text: {
//             text: [`🎉 Webhook is working perfectly! Current time: ${getCurrentDateTime()}`]
//           }
//         });
//         break;

//       default:
//         // Generic response for unhandled intents
//         fulfillmentResponse.messages.push({
//           text: {
//             text: [`I received your message: "${userMessage}". This is a webhook response! I can help with weather, time, products, and orders.`]
//           }
//         });
//     }

//     // Prepare the response
//     const response = {
//       fulfillment_response: fulfillmentResponse,
//       session_info: {
//         parameters: updatedParameters
//       }
//     };

//     // Log outgoing response
//     logConversation('OUTGOING_RESPONSE', response);

//     // Send response back to Dialogflow CX
//     res.json(response);

//   } catch (error) {
//     console.error('Webhook Error:', error);
//     logConversation('ERROR', {
//       error: error.message,
//       stack: error.stack
//     });

//     // Send error response
//     res.json({
//       fulfillment_response: {
//         messages: [{
//           text: {
//             text: ['Sorry, there was an error processing your request. Please try again.']
//           }
//         }]
//       }
//     });
//   }
// });
// ... (existing code for imports, middleware, PORT, etc. remains the same)

// Mock database for the dine-in agent
const dineInMockDatabase = {
  menu: [
    { id: 1, name: "Mushroom Risotto", isSpicy: false, allergens: ['lactose'] },
    { id: 2, name: "Spicy Tacos", isSpicy: true, allergens: ['dairy'] },
    { id: 3, name: "Grilled Salmon", isSpicy: false, allergens: [] },
    { id: 4, name: "Vegetable Pasta", isSpicy: false, allergens: [] },
    { id: 5, name: "Spicy Chicken Curry", isSpicy: true, allergens: ['lactose'] }
  ],
  mostOrdered: [
    { name: "Spicy Tacos", count: 15 },
    { name: "Mushroom Risotto", count: 12 }
  ],
  pastOrders: {
    // Mock user ID 123
    "123": [{ name: "Grilled Salmon" }, { name: "Mushroom Risotto" }]
  },
  orders: []
};

// ... (existing helper functions like getCurrentDateTime, logConversation remain the same)

// A simple webhook version for testing.
// Remove all complex logic and mock database calls.

app.post('/webhook', async (req, res) => {
  try {
    const fulfillmentResponse = {
      messages: []
    };

    // Extract data from Dialogflow CX request
    const { sessionInfo, fulfillmentInfo } = req.body;
    
    // Get the tag or intent from Dialogflow.
    const tag = fulfillmentInfo?.tag || req.body.intentInfo?.displayName;
    const parameters = sessionInfo?.parameters || {};

    // This is where updatedParameters is defined. 
    // It's a copy of the existing parameters.
    let updatedParameters = { ...parameters };
    
    // Log the received tag to verify the call is reaching here.
    console.log(`[TEST WEBHOOK] Received tag: ${tag}`);

    // Simplified switch case with hardcoded responses.
    switch (tag) {
      case 'suggest_most_ordered':
        fulfillmentResponse.messages.push({
          text: {
            text: ["🎉 Webhook received 'suggest_most_ordered' tag! It's working."]
          }
        });
        break;

      case 'check_spicy_family_rule':
        fulfillmentResponse.messages.push({
          text: {
            text: ["🎉 Webhook received 'check_spicy_family_rule' tag! It's working."]
          }
        });
        break;

      case 'show_me_products':
        const url =
          "https://catalog-management-system-stage-1064026520425.us-central1.run.app/cms/product/v2/filter/product";
        const payload = {
          page: 1,
          pageSize: 2,
          query: "",
          storeLocations: ["RLC_361"],
          productTypes: ["MENU"],
          salesChannels: ["DINE_IN"],
        };
        const headers = {
          "Content-Type": "application/json",
          Authorization: "", // add your token if needed
        };
        
        try {
          const response = await axios.post(url, payload, { headers });
          console.log("✅ Success:", response.data.data.data);
          
          const productsArray = response.data.data.data;        
          // Here, you are adding the 'product_list' to updatedParameters.
          updatedParameters.product_list = productsArray;
          
          // Assuming the data is an array of objects, join them into a readable string
          const products = response.data.data.data.map(product => product.name).join(', ');
          fulfillmentResponse.messages.push({
            text: {
              text: [`Here are some of our products: ${products}${productsArray}`]
            }
          });
        } catch (error) {
          console.error("❌ Error:", error.message);
          fulfillmentResponse.messages.push({
            text: {
              text: ['Sorry, the request to get products failed.']
            }
          });
        }
        break;

    case 'get.product-info':
      const productName = parameters.product_name;
      const storedProducts = updatedParameters.product_list;
      
      if (!productName) {
          fulfillmentResponse.messages.push({
              text: {
                  text: ["Please specify which product you want to know about."]
              }
          });
      } else if (storedProducts && storedProducts.length > 0) {
          const foundProduct = storedProducts.find(p => p.name.toLowerCase() === productName.toLowerCase());
          
          if (foundProduct) {
              // Construct the response using natural language from the JSON data
              const details = `The ${foundProduct.name} is a delicious choice! It's described as: "${foundProduct.description}". It costs $100 and is part of our ${foundProduct.appCategories.categoryLevel1} menu.`;
              
              fulfillmentResponse.messages.push({
                  text: {
                      text: [details]
                  }
              });
          } else {
              // If the product is not in the stored list
              fulfillmentResponse.messages.push({
                  text: {
                      text: [`Sorry, I couldn't find "${productName}" in the current product list.`]
                  }
              });
          }
      } else {
          // If the product list is not in the session parameters, make a new API call.
          // This is a robust fallback for cases where the user asks about a product directly.
          try {
              const url = "https://catalog-management-system-stage-1064026520425.us-central1.run.app/cms/product/v2/filter/product";
              const payload = {
                  page: 1,
                  pageSize: 1,
                  query: productName,
                  storeLocations: ["RLC_361"],
                  productTypes: ["MENU"],
                  salesChannels: ["DINE_IN"]
              };
              
              const response = await axios.post(url, payload);
              const productData = response.data.data.data[0];
    
              if (productData) {
                  const details = `I found some info for you! The ${productData.name} is described as: "${productData.description}". It costs $100.`;
                  fulfillmentResponse.messages.push({
                      text: {
                          text: [details]
                      }
                  });
              } else {
                  fulfillmentResponse.messages.push({
                      text: {
                          text: [`Sorry, I couldn't find any information for "${productName}".`]
                      }
                  });
              }
          } catch (error) {
              console.error("❌ Error during direct API call:", error.message);
              fulfillmentResponse.messages.push({
                  text: {
                      text: ['I apologize, but I am unable to get that information at the moment.']
                  }
              });
          }
      }
      break;  

      case 'place_order':
        fulfillmentResponse.messages.push({
          text: {
            text: ["🎉 Webhook received 'place_order' tag! It's working."]
          }
        });
        break;

      default:
        fulfillmentResponse.messages.push({
          text: {
            text: [`🎉 Webhook received an unhandled tag or intent: ${tag}. It's still working.`]
          }
        });
    }

    const response = {
      fulfillment_response: fulfillmentResponse,
      session_info: {
        parameters: updatedParameters // This line sends the updated parameters back to Dialogflow.
      }
    };
    
    // Send the response back.
    res.json(response);
    
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({
      fulfillment_response: {
        messages: [{
          text: {
            text: ['Sorry, a test error occurred in the webhook.']
          }
        }]
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint to simulate Dialogflow requests
app.post('/test', (req, res) => {
  const testRequest = {
    detectIntentResponseId: 'test-123',
    intentInfo: {
      displayName: req.body.intent || 'test.webhook'
    },
    pageInfo: {
      displayName: 'Test Page'
    },
    sessionInfo: {
      parameters: req.body.parameters || {}
    },
    text: req.body.text || 'Test message',
    languageCode: 'en'
  };

  // Forward to webhook endpoint
  req.body = testRequest;
  app._router.handle(req, res);
});

// Get conversation logs endpoint
app.get('/logs', (req, res) => {
  res.json({
    logs: conversationLogs.slice(-50), // Return last 50 logs
    totalCount: conversationLogs.length
  });
});

// Clear logs endpoint
app.delete('/logs', (req, res) => {
  conversationLogs.length = 0;
  res.json({ message: 'Logs cleared successfully' });
});

// Mock data endpoints for testing
app.get('/data/products', (req, res) => {
  res.json(mockDatabase.products);
});

app.get('/data/orders', (req, res) => {
  res.json(mockDatabase.orders);
});

// Serve test HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dialogflow Webhook Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 10px 0; }
            .endpoint { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .test-form { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            input, select, textarea { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #45a049; }
            .response { background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .error { background: #ffe8e8; color: red; }
            pre { background: #f0f0f0; padding: 10px; overflow-x: auto; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>🤖 Dialogflow CX Webhook Tester</h1>
        
        <div class="container">
            <h2>Webhook Status: ✅ Running</h2>
            <p><strong>Webhook URL:</strong> <code>${req.protocol}://${req.get('host')}/webhook</code></p>
            <p><strong>Health Check:</strong> <a href="/health" target="_blank">${req.protocol}://${req.get('host')}/health</a></p>
        </div>

        <div class="container">
            <h2>📋 Available Endpoints</h2>
            <div class="endpoint">
                <strong>POST /webhook</strong> - Main Dialogflow CX webhook endpoint
            </div>
            <div class="endpoint">
                <strong>GET /health</strong> - Health check endpoint
            </div>
            <div class="endpoint">
                <strong>POST /test</strong> - Test webhook with custom data
            </div>
            <div class="endpoint">
                <strong>GET /logs</strong> - View conversation logs
            </div>
        </div>

        <div class="test-form">
            <h2>🧪 Test Your Webhook</h2>
            <form onsubmit="testWebhook(event)">
                <label>Intent Name:</label>
                <select id="intent">
                    <option value="test.webhook">test.webhook</option>
                    <option value="get.weather">get.weather</option>
                    <option value="get.time">get.time</option>
                    <option value="product.search">product.search</option>
                    <option value="place.order">place.order</option>
                    <option value="greeting">greeting</option>
                </select>

                <label>User Message:</label>
                <input type="text" id="message" placeholder="What's the weather in New York?" />

                <label>Parameters (JSON):</label>
                <textarea id="parameters" placeholder='{"city": "New York", "product_name": "iPhone"}'>{}</textarea>

                <button type="submit">Test Webhook</button>
            </form>

            <div id="result"></div>
        </div>

        <div class="container">
            <h2>📝 Recent Logs</h2>
            <button onclick="loadLogs()">Refresh Logs</button>
            <button onclick="clearLogs()">Clear Logs</button>
            <div id="logs"></div>
        </div>

        <script>
            async function testWebhook(event) {
                event.preventDefault();
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<p>Testing...</p>';

                try {
                    const response = await fetch('/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            intent: document.getElementById('intent').value,
                            text: document.getElementById('message').value,
                            parameters: JSON.parse(document.getElementById('parameters').value || '{}')
                        })
                    });

                    const data = await response.json();
                    resultDiv.innerHTML = \`
                        <div class="response">
                            <h3>✅ Webhook Response:</h3>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                } catch (error) {
                    resultDiv.innerHTML = \`
                        <div class="response error">
                            <h3>❌ Error:</h3>
                            <p>\${error.message}</p>
                        </div>
                    \`;
                }
            }

            async function loadLogs() {
                try {
                    const response = await fetch('/logs');
                    const data = await response.json();
                    const logsDiv = document.getElementById('logs');
                    
                    logsDiv.innerHTML = \`
                        <h3>Recent Activity (\${data.totalCount} total)</h3>
                        \${data.logs.slice(-10).reverse().map(log => \`
                            <div class="response">
                                <strong>[\${log.timestamp}] \${log.type}</strong>
                                <pre>\${JSON.stringify(log.data, null, 2)}</pre>
                            </div>
                        \`).join('')}
                    \`;
                } catch (error) {
                    console.error('Failed to load logs:', error);
                }
            }

            async function clearLogs() {
                try {
                    await fetch('/logs', { method: 'DELETE' });
                    document.getElementById('logs').innerHTML = '<p>Logs cleared!</p>';
                } catch (error) {
                    console.error('Failed to clear logs:', error);
                }
            }

            // Load logs on page load
            loadLogs();
        </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`
🚀 Dialogflow Webhook Server Started!

📊 Server Details:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Webhook URL: http://localhost:${PORT}/webhook

🧪 Testing:
   • Test Page: http://localhost:${PORT}
   • Health Check: http://localhost:${PORT}/health
   • Logs: http://localhost:${PORT}/logs

💡 Supported Intents:
   • test.webhook - Test if webhook is working
   • get.weather - Get weather information
   • get.time - Get current time
   • product.search - Search for products
   • place.order - Place an order
   • greeting - Welcome message

Ready to receive Dialogflow CX requests! 🎉
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down webhook server...');
  process.exit(0);
});

module.exports = app;







