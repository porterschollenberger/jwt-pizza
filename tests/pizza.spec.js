import { test, expect } from 'playwright-test-coverage';

test('purchase with login', async ({ page }) => {
  test.slow();

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const orderReq = {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 2,
          id: 23,
        },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    } else if (method === "GET") {
      const orderRes = { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 }
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: orderRes });
    }
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();

  // Verify
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Close' }).click();

  // Go to account page to see order that was made
  await page.getByRole('link', { name: 'KC' }).click();
});

test('explore about, history, and franchise while not logged in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('main')).toContainText('The secret sauce');
  await page.getByRole('link', { name: 'home' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
  await page.getByRole('link', { name: 'home' }).click();
  await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('main')).toContainText('So you want a piece of the pie?');
  await expect(page.getByRole('alert')).toContainText('If you are already a franchisee, pleaseloginusing your franchise account');
})

test('register, view diner dashboard, hit a random page, then logout', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const registerReq = { email: 'foobar@jwt.com', password: 'baz' };
      const registerRes = { user: { id: 3, name: 'Foo Bar', email: 'foobar@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().postDataJSON()).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    } else if (method === 'DELETE') {
      const logoutRes = { "message": "logout successful" };
      await route.fulfill({ json: logoutRes });
    } else {
      await route.continue();
    }
  });

  await page.route('*/**/api/order', async (route) => {
    const orderRes = { "dinerId": 3, "orders": [], "page": 1 };
    expect(route.request().method()).toBe("GET");
    await route.fulfill(orderRes);
  });

  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
  await expect(page.locator('#navbar-dark')).toContainText('Register');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Full name').fill('Foo Bar');
  await page.getByPlaceholder('Full name').press('Tab');
  await page.getByPlaceholder('Email address').fill('foobar@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('baz');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByLabel('Global')).toContainText('FB');
  await page.getByRole('link', { name: 'FB' }).click();
  await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
  await expect(page.getByRole('main')).toContainText('Foo Bar');
  await expect(page.getByRole('main')).toContainText('How have you lived this long without having a pizza? Buy one now!');
  await page.goto('/foo');
  await expect(page.getByRole('heading')).toContainText('Oops');
  await expect(page.locator('#navbar-dark')).toContainText('Logout');
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Login');
});

test('set up franchise with store and then close both', async ({ page }) => {
  test.slow();

  const USERID = 4;
  const FRANCHISEID = 14;
  const STOREID = 11;

  let franchise_exists = false;
  let admin_finished = false;
  let store_exists = false;

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      if (admin_finished == true) {
        const loginReq = { "email": "testuser@jwt.com", "password": "test" };
        const loginRes = {
          "user": {
            "id": 4,
            "name": "Test User",
            "email": "testuser@jwt.com",
            "roles": [
              {
                "role": "diner"
              },
              {
                "objectId": 14,
                "role": "franchisee"
              }
            ]
          },
          "token": "spoopy"
        };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
      } else {
        const loginReq = { "email": "a@jwt.com", "password": "admin" };
        const loginRes = {
          "user": {
            "id": 1,
            "name": "常用名字",
            "email": "a@jwt.com",
            "roles": [
              {
                "role": "admin"
              }
            ]
          },
          "token": "eepy"
        };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
      }
    } else if (method === 'DELETE') {
      if (admin_finished === true) {
        admin_finished = false;
      } else {
        admin_finished = true;
      }
      const logoutRes = { "message": "logout successful" };
      await route.fulfill({ json: logoutRes });
    } else {
      await route.continue();
    }
  });

  await page.route('*/**/api/franchise/14/store/11', async (route) => {
    const storeRes = { "message": "store deleted" };
    expect(route.request().method()).toBe("DELETE");
    await route.fulfill({ json: storeRes });
  });

  await page.route('*/**/api/franchise/14/store', async (route) => {
    const storeReq = { "name": "Test Store" };
    const storeRes = { "id": 11, "franchiseId": 14, "name": "Test Store" };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
    store_exists = true;
  });

  await page.route('*/**/api/franchise/14', async (route) => {
    const storeRes = { "message": "franchise deleted" };
    expect(route.request().method()).toBe("DELETE");
    await route.fulfill({ json: storeRes });
  });

  await page.route('*/**/api/franchise/4', async (route) => {
    let storeRes = [
      {
        "id": 14,
        "name": "Test Franchise",
        "admins": [
          {
            "id": 4,
            "name": "Test User",
            "email": "testuser@jwt.com"
          }
        ],
        "stores": []
      }
    ];
    if (store_exists === true) {
      storeRes = [
        {
          "id": 14,
          "name": "Test Franchise",
          "admins": [
            {
              "id": 4,
              "name": "Test User",
              "email": "testuser@jwt.com"
            }
          ],
          "stores": [
            {
              "id": 11,
              "name": "Test Store",
              "totalRevenue": 0
            }
          ]
        }
      ]; 
    }
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: storeRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const method = route.request().method();
    if (method == "GET") {
      if (franchise_exists) {
        const franchiseRes = [
          {
            "id": 1,
            "name": "pizzaPocket",
            "admins": [
              {
                "id": 3,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": [
              {
                "id": 1,
                "name": "SLC",
                "totalRevenue": 0
              }
            ]
          },
          {
            "id": 14,
            "name": "Test Franchise",
            "admins": [
              {
                "id": 4,
                "name": "Test User",
                "email": "testuser@jwt.com"
              }
            ],
            "stores": []
          }
        ];
        expect(route.request().method()).toBe("GET");
        await route.fulfill({ json: franchiseRes });
      } else {
        const franchiseRes = [
          {
            "id": 1,
            "name": "pizzaPocket",
            "admins": [
              {
                "id": 3,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": [
              {
                "id": 1,
                "name": "SLC",
                "totalRevenue": 0
              }
            ]
          }
        ];
        expect(route.request().method()).toBe("GET");
        await route.fulfill({ json: franchiseRes });
      }
    } else if (method == "POST") {
      franchise_exists = true;
      const franchiseReq = {
        "stores": [],
        "name": "Test Franchise",
        "admins": [
          {
            "email": "testuser@jwt.com"
          }
        ]
      };
      const franchiseRes = {
        "stores": [],
        "name": "Test Franchise",
        "admins": [
          {
            "email": "testuser@jwt.com",
            "id": 4,
            "name": "Test User"
          }
        ],
        "id": 14
      };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes }); 
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByPlaceholder('Password').press('Enter');
  await expect(page.getByLabel('Global')).toContainText('常');
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('main')).toContainText('Keep the dough rolling and the franchises signing up.');
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByPlaceholder('franchise name').click();
  await page.getByPlaceholder('franchise name').fill('Test Franchise');
  await page.getByPlaceholder('franchise name').press('Tab');
  await page.getByPlaceholder('franchisee admin email').fill('testuser@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('table')).toContainText('Test Franchise');
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('testuser@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('test');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByLabel('Global')).toContainText('TU');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('main')).toContainText('Everything you need to run an JWT Pizza franchise. Your gateway to success.');
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').click();
  await page.getByPlaceholder('store name').fill('Test Store');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('tbody')).toContainText('Test Store');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the Test Franchise store Test Store ? This cannot be restored. All outstanding revenue with not be refunded.');
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('table')).toContainText('Test Franchise');
  await page.getByRole('row', { name: 'Test Franchise Test User Close' }).getByRole('button').click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the Test Franchise franchise? This will close all associated stores and cannot be restored. All outstanding revenue with not be refunded.');
  await page.getByRole('button', { name: 'Close' }).click();
});