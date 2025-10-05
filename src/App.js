import React, { useState, createContext, useContext } from 'react';
import './App.css';

const AppContext = createContext();

const LOCATIONS = [
  { id: 1, name: 'Birdies DIFC', address: 'Gate Village 10, DIFC', hours: '7:00 AM - 10:00 PM', distance: 1.2 },
  { id: 2, name: 'Birdies JBR', address: 'The Walk, Jumeirah Beach Residence', hours: '7:00 AM - 11:00 PM', distance: 3.5 },
  { id: 3, name: 'Birdies Downtown', address: 'Boulevard Plaza, Downtown Dubai', hours: '6:30 AM - 10:00 PM', distance: 4.8 },
];

const MENU_ITEMS = {
  coffee: [
    { id: 1, name: 'Flat White', description: 'Rich espresso with silky steamed milk', price: 18 },
    { id: 2, name: 'Cappuccino', description: 'Classic espresso topped with foam', price: 16 },
    { id: 3, name: 'Latte', description: 'Smooth espresso with steamed milk', price: 17 },
    { id: 4, name: 'Mocha', description: 'Chocolate, espresso, and steamed milk', price: 20 },
    { id: 5, name: 'Americano', description: 'Bold espresso with hot water', price: 14 },
  ],
  coldDrinks: [
    { id: 6, name: 'Iced Latte', description: 'Cold espresso with milk over ice', price: 18 },
    { id: 7, name: 'Cold Brew', description: 'Smooth cold-steeped coffee', price: 16 },
  ],
  food: [
    { id: 8, name: 'Avocado Toast', description: 'Smashed avocado on sourdough', price: 28 },
    { id: 9, name: 'Shakshuka', description: 'Eggs poached in tomato sauce', price: 32 },
  ],
  pastries: [
    { id: 10, name: 'Croissant', description: 'Plain butter croissant', price: 12 },
    { id: 11, name: 'Chocolate Muffin', description: 'Rich chocolate muffin', price: 15 },
  ],
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [preferredLocation, setPreferredLocation] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [stars, setStars] = useState(47);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [preferences, setPreferences] = useState({ milkPreference: '', dietaryStyle: '', allergies: [] });

  const contextValue = {
    currentScreen, setCurrentScreen, user, setUser, selectedLocation, setSelectedLocation,
    preferredLocation, setPreferredLocation, cart, setCart, favorites, setFavorites,
    orders, setOrders, currentOrder, setCurrentOrder, stars, setStars,
    hasCompletedOnboarding, setHasCompletedOnboarding, preferences, setPreferences,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app">
        {currentScreen === 'login' && <LoginScreen />}
        {currentScreen === 'onboarding' && <OnboardingScreen />}
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'location' && <LocationScreen />}
        {currentScreen === 'menu' && <MenuScreen />}
        {currentScreen === 'itemDetail' && <ItemDetailScreen />}
        {currentScreen === 'cart' && <CartScreen />}
        {currentScreen === 'checkout' && <CheckoutScreen />}
        {currentScreen === 'confirmation' && <ConfirmationScreen />}
        {currentScreen === 'tracking' && <TrackingScreen />}
      </div>
    </AppContext.Provider>
  );
}

function StatusBar() {
  return <div className="status-bar"><span>9:41</span><span>●●●●</span></div>;
}

function LoginScreen() {
  const { setCurrentScreen, setUser, hasCompletedOnboarding } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    setUser({ name: 'Sarah', email });
    setCurrentScreen(hasCompletedOnboarding ? 'home' : 'onboarding');
  };

  return (
    <div className="screen">
      <StatusBar />
      <div className="login-container">
        <div className="logo">🐦</div>
        <h1 className="login-title">Birdies</h1>
        <p className="login-subtitle">Your favorite cafe, now at your fingertips</p>
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        <button onClick={handleLogin} className="btn-primary">Sign In</button>
        <p className="signup-text">Don't have an account? <span className="signup-link">Sign Up</span></p>
      </div>
    </div>
  );
}

function OnboardingScreen() {
  const { setCurrentScreen, setHasCompletedOnboarding, setPreferences } = useContext(AppContext);
  const [step, setStep] = useState(1);
  const [tempPrefs, setTempPrefs] = useState({ milkPreference: '', dietaryStyle: '', allergies: [] });

  const milkOptions = ['Oat', 'Almond', 'Soy', 'Regular', 'Coconut'];
  const dietaryOptions = ['None', 'Vegan', 'Vegetarian'];
  const allergyOptions = ['Dairy', 'Nuts', 'Gluten', 'Soy', 'Eggs'];

  const handleComplete = () => {
    setPreferences(tempPrefs);
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const toggleAllergy = (allergy) => {
    setTempPrefs({
      ...tempPrefs,
      allergies: tempPrefs.allergies.includes(allergy) 
        ? tempPrefs.allergies.filter(a => a !== allergy)
        : [...tempPrefs.allergies, allergy]
    });
  };

  return (
    <div className="screen">
      <StatusBar />
      <div className="onboarding-container">
        <div className="onboarding-progress">
          <div className={step >= 1 ? "progress-dot-active" : "progress-dot"}></div>
          <div className={step >= 2 ? "progress-dot-active" : "progress-dot"}></div>
          <div className={step >= 3 ? "progress-dot-active" : "progress-dot"}></div>
        </div>
        {step === 1 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">🥛</div>
            <h2 className="onboarding-title">What's your go-to milk?</h2>
            <p className="onboarding-subtitle">We'll remember this for faster ordering</p>
            <div className="onboarding-options">
              {milkOptions.map(milk => (
                <div key={milk} className={tempPrefs.milkPreference === milk ? "onboarding-option-active" : "onboarding-option"}
                  onClick={() => setTempPrefs({ ...tempPrefs, milkPreference: milk })}>{milk}</div>
              ))}
            </div>
            <button className={tempPrefs.milkPreference ? "btn-primary" : "btn-disabled"}
              disabled={!tempPrefs.milkPreference} onClick={() => setStep(2)}>Continue</button>
          </div>
        )}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">🌱</div>
            <h2 className="onboarding-title">Any dietary preferences?</h2>
            <p className="onboarding-subtitle">We'll highlight suitable options for you</p>
            <div className="onboarding-options">
              {dietaryOptions.map(diet => (
                <div key={diet} className={tempPrefs.dietaryStyle === diet ? "onboarding-option-active" : "onboarding-option"}
                  onClick={() => setTempPrefs({ ...tempPrefs, dietaryStyle: diet })}>{diet}</div>
              ))}
            </div>
            <div className="onboarding-buttons">
              <button className="btn-outline-small" onClick={() => setStep(1)}>Back</button>
              <button className={tempPrefs.dietaryStyle ? "btn-primary-small" : "btn-disabled-small"}
                disabled={!tempPrefs.dietaryStyle} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">⚠️</div>
            <h2 className="onboarding-title">Any allergies we should know about?</h2>
            <p className="onboarding-subtitle">Select all that apply - we'll flag these items</p>
            <div className="onboarding-options">
              {allergyOptions.map(allergy => (
                <div key={allergy} className={tempPrefs.allergies.includes(allergy) ? "onboarding-option-active" : "onboarding-option"}
                  onClick={() => toggleAllergy(allergy)}>{allergy}</div>
              ))}
            </div>
            <div className="onboarding-buttons">
              <button className="btn-outline-small" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary-small" onClick={handleComplete}>Get Started</button>
            </div>
            <p className="skip-text" onClick={handleComplete}>Skip for now</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeScreen() {
  const { setCurrentScreen, user, stars, favorites, currentOrder, preferredLocation, setSelectedLocation } = useContext(AppContext);

  const handleOrderNow = () => {
    if (preferredLocation) {
      setSelectedLocation(preferredLocation);
      setCurrentScreen('menu');
    } else {
      setCurrentScreen('location');
    }
  };

  return (
    <div className="screen">
      <StatusBar />
      <div className="content">
        <div className="welcome-card">
          <h2 className="welcome-title">Welcome back, {user?.name}!</h2>
          <p className="welcome-subtitle">Ready for your daily coffee fix?</p>
          <div className="stars-display">
            <div><div className="stars-label">Your Stars</div><div className="stars-value">⭐ {stars}</div></div>
            <button className="btn-secondary">View Rewards</button>
          </div>
        </div>
        {currentOrder && (
          <div className="active-order-card">
            <div className="active-order-header">
              <div><h3 className="active-order-title">Active Order</h3><p className="active-order-number">#{currentOrder.id}</p></div>
              <div className="order-status-badge">Preparing</div>
            </div>
            <div className="order-progress-bar"><div className="order-progress-fill"></div></div>
            <p className="order-progress-text">Your order is being prepared...</p>
            <div className="active-order-buttons">
              <button className="btn-track-order" onClick={() => setCurrentScreen('tracking')}>Track Order</button>
              <button className="btn-view-receipt">View Receipt</button>
            </div>
          </div>
        )}
        <div className="quick-actions">
          <div className="action-card" onClick={handleOrderNow}><div className="action-icon">☕</div><h3 className="action-title">Order Now</h3></div>
          <div className="action-card" onClick={() => setCurrentScreen('location')}><div className="action-icon">📍</div><h3 className="action-title">Find Location</h3></div>
          <div className="action-card"><div className="action-icon">🎉</div><h3 className="action-title">Events</h3></div>
        </div>
        <h3 className="section-title">Your Favourites</h3>
        {favorites.length === 0 ? (
          <div className="empty-favorites">
            <div className="empty-icon">⭐</div>
            <p className="empty-text">You have added no favourites!</p>
            <button className="btn-primary" onClick={handleOrderNow}>Click here to add some!</button>
          </div>
        ) : (
          <div>
            {Object.values(MENU_ITEMS).flat().filter(item => favorites.includes(item.id)).map(item => (
              <MenuItem key={item.id} item={item} showFavorite={false} />
            ))}
          </div>
        )}
        <h3 className="section-title">Recent Orders</h3>
        <MenuItem item={{ name: 'Flat White', description: 'With oat milk • Yesterday at 9:30 AM', price: 18 }} showFavorite={false} />
      </div>
      <FloatingCartButton />
      <BottomNav active="home" />
    </div>
  );
}

function LocationScreen() {
  const { setCurrentScreen, setSelectedLocation, preferredLocation, setPreferredLocation } = useContext(AppContext);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setPreferredLocation(location);
    setCurrentScreen('menu');
  };

  return (
    <div className="screen">
      <StatusBar />
      <NavHeader title="Choose Location" onBack={() => setCurrentScreen('home')} />
      <div className="scroll-content">
        <div className="map-container"><div className="map-pin"></div></div>
        <div className="location-list">
          <button className="btn-primary">📍 Find Closest Location</button>
          <h3 className="location-list-title">All Locations</h3>
          {LOCATIONS.map(location => (
            <div key={location.id} className={preferredLocation?.id === location.id ? "location-item location-item-preferred" : "location-item"}
              onClick={() => handleSelectLocation(location)}>
              <div className="location-item-header">
                <h3 className="location-name">{location.name}</h3>
                {preferredLocation?.id === location.id && <div className="preferred-badge">Last Ordered</div>}
              </div>
              <p className="location-address">{location.address}</p>
              <p className="location-hours">Open: {location.hours}</p>
              <p className="location-distance">📍 {location.distance} km away</p>
            </div>
          ))}
        </div>
      </div>
      <FloatingCartButton />
      <BottomNav active="order" />
    </div>
  );
}

function MenuScreen() {
  const { setCurrentScreen, selectedLocation } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('coffee');

  const categories = [
    { id: 'coffee', name: '☕ Coffee', items: MENU_ITEMS.coffee },
    { id: 'coldDrinks', name: '🥤 Cold Drinks', items: MENU_ITEMS.coldDrinks },
    { id: 'food', name: '🍳 Food', items: MENU_ITEMS.food },
    { id: 'pastries', name: '🥐 Pastries', items: MENU_ITEMS.pastries },
  ];

  const whatsNew = [
    { id: 20, name: 'Pistachio Latte', description: 'New seasonal favorite', price: 22 },
    { id: 21, name: 'Cardamom Coffee', description: 'Middle Eastern twist', price: 19 },
    { id: 22, name: 'Rose Matcha', description: 'Floral & earthy', price: 24 },
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="screen">
      <StatusBar />
      <div className="menu-header">
        <div className="menu-location-bar">
          <div><div className="menu-location-label">Ordering from</div><div className="menu-location-name">{selectedLocation?.name || 'Select location'}</div></div>
          <div className="change-location-btn" onClick={() => setCurrentScreen('location')}>Change</div>
        </div>
      </div>
      <div className="scroll-content">
        <div className="whats-new-section">
          <h3 className="whats-new-title">What's New ✨</h3>
          <div className="whats-new-scroll">
            {whatsNew.map(item => (
              <div key={item.id} className="whats-new-card">
                <div className="whats-new-image"></div>
                <div className="whats-new-info">
                  <h4 className="whats-new-item-name">{item.name}</h4>
                  <p className="whats-new-item-desc">{item.description}</p>
                  <div className="whats-new-price">AED {item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="category-tabs">
          {categories.map(cat => (
            <div key={cat.id} className={selectedCategory === cat.id ? "category-tab-active" : "category-tab"}
              onClick={() => setSelectedCategory(cat.id)}>{cat.name}</div>
          ))}
        </div>
        <div className="menu-items">
          {currentCategory.items.map(item => <MenuItem key={item.id} item={item} />)}
        </div>
      </div>
      <FloatingCartButton />
      <BottomNav active="order" />
    </div>
  );
}

function MenuItem({ item, showFavorite = true }) {
  const { setCurrentScreen, favorites, setFavorites, preferredLocation, setSelectedLocation } = useContext(AppContext);
  const isFavorite = favorites.includes(item.id);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    setFavorites(isFavorite ? favorites.filter(id => id !== item.id) : [...favorites, item.id]);
  };

  const handleClick = () => {
    if (item.id) {
      if (!preferredLocation) {
        setCurrentScreen('location');
      } else {
        setSelectedLocation(preferredLocation);
        window.selectedMenuItem = item;
        setCurrentScreen('itemDetail');
      }
    }
  };

  return (
    <div className="menu-item" onClick={handleClick}>
      <div className="item-image"></div>
      <div className="item-info">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-description">{item.description}</p>
        <div className="item-price">AED {item.price}</div>
      </div>
      {showFavorite && item.id && (
        <button className={isFavorite ? "favorite-btn-active" : "favorite-btn"} onClick={toggleFavorite}>
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  );
}

function ItemDetailScreen() {
  const { setCurrentScreen, cart, setCart, favorites, setFavorites, preferences } = useContext(AppContext);
  const item = window.selectedMenuItem;
  const [size, setSize] = useState('Regular');
  const [milk, setMilk] = useState(preferences.milkPreference && preferences.milkPreference !== '' ? preferences.milkPreference : 'Regular');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const isFavorite = favorites.includes(item.id);

  const addToCart = () => {
    setCart([...cart, { ...item, size, milk, quantity, notes, customPrice: item.price * quantity }]);
    setCurrentScreen('menu');
  };

  const toggleFavorite = () => {
    setFavorites(isFavorite ? favorites.filter(id => id !== item.id) : [...favorites, item.id]);
  };

  return (
    <div className="screen">
      <StatusBar />
      <div className="nav-header">
        <div className="back-btn" onClick={() => setCurrentScreen('menu')}>←</div>
        <h1 className="nav-title">{item.name}</h1>
        <button className={isFavorite ? "favorite-btn-active" : "favorite-btn"} onClick={toggleFavorite}>
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div className="item-detail-scroll">
        <div className="item-detail-image"></div>
        <div className="detail-card">
          <h2 className="detail-title">{item.name}</h2>
          <p className="detail-description">{item.description}</p>
          <div className="detail-price">AED {item.price}</div>
        </div>
        <div className="detail-card">
          <h3 className="option-title">Size</h3>
          <div className="option-buttons">
            {['Small', 'Regular', 'Large'].map(s => (
              <div key={s} className={size === s ? "option-btn-active" : "option-btn"} onClick={() => setSize(s)}>{s}</div>
            ))}
          </div>
        </div>
        <div className="detail-card">
          <h3 className="option-title">Milk Options</h3>
          <div className="option-grid">
            {['Regular', 'Oat', 'Almond', 'Soy', 'Coconut'].map(m => (
              <div key={m} className={milk === m ? "option-btn-active" : "option-btn"} onClick={() => setMilk(m)}>{m}</div>
            ))}
          </div>
        </div>
        <div className="detail-card">
          <h3 className="option-title">Special Instructions</h3>
          <textarea className="textarea" placeholder="Any special requests?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="item-detail-footer">
        <div className="quantity-row">
          <span className="quantity-label">Quantity</span>
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
            <span className="quantity-value">{quantity}</span>
            <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>
        <button className="btn-primary" onClick={addToCart}>Add to Cart - AED {item.price * quantity}</button>
      </div>
      <BottomNav active="order" />
    </div>
  );
}

function CartScreen() {
  const { setCurrentScreen, cart, setCart } = useContext(AppContext);
  const [pickupTime, setPickupTime] = useState('ASAP');

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    newCart[index].customPrice = newCart[index].price * newCart[index].quantity;
    setCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.customPrice, 0);

  return (
    <div className="screen">
      <StatusBar />
      <NavHeader title="Your Cart" onBack={() => setCurrentScreen('menu')} />
      <div className="cart-scroll">
        <div className="location-banner">
          <p className="pickup-label">Picking up from</p>
          <p className="pickup-value">Birdies DIFC</p>
        </div>
        {cart.map((item, index) => (
          <div key={index} className="cart-item">
            <div>
              <h3 className="cart-item-name">{item.name}</h3>
              <p className="cart-item-details">{item.size} • {item.milk} milk</p>
            </div>
            <div className="cart-item-right">
              <div className="cart-item-price">AED {item.customPrice}</div>
              <div className="quantity-controls">
                <button className="quantity-btn" onClick={() => updateQuantity(index, -1)}>−</button>
                <span className="quantity-value">{item.quantity}</span>
                <button className="quantity-btn" onClick={() => updateQuantity(index, 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
        <div className="detail-card">
          <h3 className="option-title">Pickup Time</h3>
          <div className="option-buttons">
            <div className={pickupTime === 'ASAP' ? "option-btn-active" : "option-btn"} onClick={() => setPickupTime('ASAP')}>ASAP (15 min)</div>
            <div className={pickupTime === 'Schedule' ? "option-btn-active" : "option-btn"} onClick={() => setPickupTime('Schedule')}>Schedule</div>
          </div>
        </div>
      </div>
      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>AED {subtotal}</span></div>
        <div className="summary-row"><span>Stars Discount</span><span style={{color: '#D4A574'}}>-AED 0</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>AED {subtotal}</span></div>
        <button className="btn-primary" onClick={() => setCurrentScreen('checkout')}>Proceed to Checkout</button>
      </div>
      <BottomNav active="order" />
    </div>
  );
}

function CheckoutScreen() {
  const { setCurrentScreen, cart, setOrders, setCurrentOrder } = useContext(AppContext);
  const [useStars, setUseStars] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.customPrice, 0);

  const placeOrder = () => {
    const order = {
      id: `B${Math.floor(Math.random() * 10000)}`,
      items: cart,
      total: subtotal,
      location: 'Birdies DIFC',
      time: new Date().toLocaleString(),
      status: 'preparing',
    };
    setCurrentOrder(order);
    setOrders(prev => [...prev, order]);
    setCurrentScreen('confirmation');
  };

  return (
    <div className="screen">
      <StatusBar />
      <NavHeader title="Checkout" onBack={() => setCurrentScreen('cart')} />
      <div className="checkout-scroll">
        <div className="detail-card">
          <h3 className="option-title">Order Summary</h3>
          {cart.map((item, index) => (
            <div key={index} className={index < cart.length - 1 ? "order-summary-item" : ""}>
              <div className="summary-item-row">
                <span>{item.name} ({item.quantity}x)</span>
                <span style={{color: '#666'}}>AED {item.customPrice}</span>
              </div>
              <p className="summary-item-details">{item.size}, {item.milk} milk</p>
            </div>
          ))}
        </div>
        <div className="detail-card">
          <h3 className="option-title">Use Stars</h3>
          <div className="stars-toggle">
            <div><div className="stars-toggle-label">Available Stars</div><div className="stars-toggle-value">⭐ 47</div></div>
            <label className="switch">
              <input type="checkbox" checked={useStars} onChange={() => setUseStars(!useStars)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="detail-card">
          <h3 className="option-title">Payment Method</h3>
          <div className="payment-card">
            <div className="card-info">
              <div className="card-icon"></div>
              <div><div className="card-number">•••• 4242</div><div className="card-expiry">Expires 12/25</div></div>
            </div>
            <div className="radio-selected"></div>
          </div>
          <button className="add-card-btn">+ Add New Card</button>
        </div>
        <div className="detail-card">
          <h3 className="option-title">Contact Info</h3>
          <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="input" style={{marginTop: 10}} />
        </div>
      </div>
      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>AED {subtotal}</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>AED {subtotal}</span></div>
        <button className="btn-primary" onClick={placeOrder}>Place Order</button>
      </div>
      <BottomNav active="order" />
    </div>
  );
}

function ConfirmationScreen() {
  const { setCurrentScreen, currentOrder, stars, setStars, setCart } = useContext(AppContext);

  React.useEffect(() => {
    setStars(stars + currentOrder.total);
    setCart([]);
  }, []);

  return (
    <div className="screen">
      <StatusBar />
      <div className="confirmation-scroll">
        <div className="success-icon">✓</div>
        <h2 className="confirmation-title">Order Confirmed!</h2>
        <p className="confirmation-subtitle">Your order has been placed successfully</p>
        <div className="order-number">#{currentOrder.id}</div>
        <div className="order-details">
          <div className="detail-row"><span className="detail-label">Location</span><span className="detail-value">{currentOrder.location}</span></div>
          <div className="detail-row"><span className="detail-label">Pickup Time</span><span className="detail-value">Today, 10:00 AM</span></div>
          <div className="detail-row"><span className="detail-label">Total Paid</span><span className="detail-value">AED {currentOrder.total}</span></div>
          <div className="detail-row"><span className="detail-label">Stars Earned</span><span className="detail-value" style={{color: '#D4A574'}}>⭐ +{currentOrder.total}</span></div>
        </div>
        <button className="btn-primary" onClick={() => setCurrentScreen('tracking')}>Track Order</button>
        <button className="btn-outline">View Receipt</button>
      </div>
      <BottomNav active="order" />
    </div>
  );
}

function TrackingScreen() {
  const { setCurrentScreen, currentOrder } = useContext(AppContext);

  return (
    <div className="screen">
      <StatusBar />
      <NavHeader title="Order Status" onBack={() => setCurrentScreen('home')} />
      <div className="tracking-scroll">
        <div className="tracking-header">
          <h2 className="tracking-title">Order #{currentOrder.id}</h2>
          <p className="tracking-time">Estimated ready time: 10:00 AM</p>
        </div>
        <div className="progress-tracker">
          <ProgressStep title="Order Placed" time="9:43 AM" completed />
          <ProgressStep title="Order Confirmed" time="9:44 AM" completed />
          <ProgressStep title="Preparing" time="In progress..." active />
          <ProgressStep title="Ready for Pickup" time="We'll notify you" />
        </div>
        <div className="detail-card">
          <h3 className="option-title">Your Order</h3>
          {currentOrder.items.map((item, index) => (
            <div key={index} className={index < currentOrder.items.length - 1 ? "order-summary-item" : ""}>
              <div className="summary-item-row">
                <span>{item.name} ({item.quantity}x)</span>
                <span style={{color: '#666'}}>AED {item.customPrice}</span>
              </div>
              <p className="summary-item-details">{item.size}, {item.milk} milk</p>
            </div>
          ))}
        </div>
        <div className="contact-cafe">
          <p className="contact-text">Need help with your order?</p>
          <button className="btn-secondary">Contact Cafe</button>
        </div>
      </div>
      <BottomNav active="order" />
    </div>
  );
}

function ProgressStep({ title, time, completed, active }) {
  return (
    <div className="progress-step">
      <div className={completed ? "step-icon-completed" : active ? "step-icon-active" : "step-icon"}>
        {completed ? '✓' : active ? '●' : '○'}
      </div>
      <div><h3 className="step-title">{title}</h3><p className="step-time">{time}</p></div>
    </div>
  );
}

function NavHeader({ title, onBack, rightIcon, onRightClick }) {
  return (
    <div className="nav-header">
      <div className="back-btn" onClick={onBack}>←</div>
      <h1 className="nav-title">{title}</h1>
      {rightIcon ? <div className="header-right-btn" onClick={onRightClick}>{rightIcon}</div> : <div style={{width: 32}}></div>}
    </div>
  );
}

function BottomNav({ active }) {
  const { setCurrentScreen, preferredLocation, setSelectedLocation } = useContext(AppContext);
  
  const handleNavClick = (screen) => {
    if (screen === 'order') {
      if (preferredLocation) {
        setSelectedLocation(preferredLocation);
        setCurrentScreen('menu');
      } else {
        setCurrentScreen('location');
      }
    } else {
      setCurrentScreen(screen);
    }
  };
  
  const navItems = [
    { id: 'home', label: 'Home', screen: 'home' },
    { id: 'order', label: 'Order', screen: 'order' },
    { id: 'stars', label: 'Stars', screen: 'home' },
    { id: 'events', label: 'Events', screen: 'home' },
    { id: 'account', label: 'Account', screen: 'home' },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <div key={item.id} className={active === item.id ? "nav-item-active" : "nav-item"} onClick={() => handleNavClick(item.screen)}>
          <div className="nav-icon"></div>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function FloatingCartButton() {
  const { cart, setCurrentScreen } = useContext(AppContext);
  
  if (cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="floating-cart-btn" onClick={() => setCurrentScreen('cart')}>
      <div className="cart-icon">🛒</div>
      <div className="cart-badge">{totalItems}</div>
    </div>
  );
}