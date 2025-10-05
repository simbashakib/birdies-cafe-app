// src/App.js - Birdies Cafe App with Real Firebase Authentication
import React, { createContext, useContext, useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

// ==================== CONTEXT ====================
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [preferences, setPreferences] = useState({
    milk: '',
    diet: '',
    allergies: []
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [preferredLocation, setPreferredLocation] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stars, setStars] = useState(0);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('✅ User signed in:', firebaseUser.email);
        
        // Load user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
            setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);
            setPreferences(userData.preferences || { milk: '', diet: '', allergies: [] });
            setPreferredLocation(userData.preferredLocation || null);
            setFavorites(userData.favorites || []);
            setStars(userData.stars || 0);
          } else {
            // User document doesn't exist yet (just created)
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        // User is signed out
        console.log('❌ User signed out');
        setUser(null);
        setHasCompletedOnboarding(false);
        setPreferences({ milk: '', diet: '', allergies: [] });
        setPreferredLocation(null);
        setFavorites([]);
        setStars(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save user data to Firestore whenever it changes
  const saveUserData = async (updates) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ User data saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
  };

  // Complete onboarding
  const completeOnboarding = async (prefs) => {
    setPreferences(prefs);
    setHasCompletedOnboarding(true);
    
    await saveUserData({
      preferences: prefs,
      hasCompletedOnboarding: true
    });
  };

  // Set preferred location
  const setPreferredLocationAndSave = async (location) => {
    setPreferredLocation(location);
    await saveUserData({ preferredLocation: location });
  };

  // Toggle favorite
  const toggleFavorite = async (itemId) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    
    setFavorites(newFavorites);
    await saveUserData({ favorites: newFavorites });
  };

  // Add to cart
  const addToCart = (item) => {
    setCart(prev => [...prev, { ...item, cartId: Date.now() }]);
  };

  // Remove from cart
  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  // Update cart item quantity
  const updateCartItemQuantity = (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(prev => prev.map(item => 
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Place order
  const placeOrder = async (orderDetails) => {
    if (!user) return;

    try {
      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userEmail: user.email,
        items: cart,
        location: selectedLocation,
        pickupTime: orderDetails.pickupTime,
        contactInfo: orderDetails.contactInfo,
        paymentMethod: orderDetails.paymentMethod,
        total: orderDetails.total,
        status: 'placed',
        orderNumber: `BC${Date.now().toString().slice(-6)}`,
        createdAt: serverTimestamp()
      });

      const newOrder = {
        id: orderRef.id,
        ...orderDetails,
        items: cart,
        location: selectedLocation,
        status: 'confirmed',
        orderNumber: `BC${Date.now().toString().slice(-6)}`,
        timestamp: new Date()
      };

      // Calculate stars earned (1 star per 10 AED)
      const starsEarned = Math.floor(orderDetails.total / 10);
      const newStarsTotal = stars + starsEarned;

      // Update local state
      setCurrentOrder(newOrder);
      setOrders(prev => [...prev, newOrder]);
      setStars(newStarsTotal);
      setCart([]);

      // Save to Firestore
      await saveUserData({ stars: newStarsTotal });

      // If this is the first order, save location as preferred
      if (!preferredLocation) {
        await setPreferredLocationAndSave(selectedLocation);
      }

      console.log('✅ Order placed successfully');
      return newOrder;
    } catch (error) {
      console.error('❌ Error placing order:', error);
      throw error;
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear all local state
      setCart([]);
      setSelectedLocation(null);
      setCurrentOrder(null);
      setOrders([]);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    hasCompletedOnboarding,
    preferences,
    selectedLocation,
    setSelectedLocation,
    preferredLocation,
    setPreferredLocation: setPreferredLocationAndSave,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    favorites,
    toggleFavorite,
    currentOrder,
    setCurrentOrder,
    orders,
    stars,
    completeOnboarding,
    placeOrder,
    signOut: handleSignOut
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Birdies...</p>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ==================== MOCK DATA ====================
const locations = [
  { id: 'difc', name: 'DIFC', address: 'Gate Village 5, DIFC', coordinates: { lat: 25.2138, lng: 55.2794 } },
  { id: 'jbr', name: 'JBR', address: 'The Beach, JBR', coordinates: { lat: 25.0772, lng: 55.1358 } },
  { id: 'downtown', name: 'Downtown', address: 'Boulevard Plaza, Downtown', coordinates: { lat: 25.1972, lng: 55.2744 } }
];

const menuItems = [
  // Coffee
  { id: 1, name: 'Espresso', category: 'coffee', price: 12, description: 'Rich, bold espresso', image: '☕' },
  { id: 2, name: 'Cappuccino', category: 'coffee', price: 18, description: 'Classic Italian coffee', image: '☕' },
  { id: 3, name: 'Flat White', category: 'coffee', price: 20, description: 'Smooth microfoam', image: '☕' },
  { id: 4, name: 'Latte', category: 'coffee', price: 20, description: 'Creamy and smooth', image: '☕' },
  
  // Cold Drinks
  { id: 5, name: 'Iced Latte', category: 'cold', price: 22, description: 'Refreshing iced coffee', image: '🥤' },
  { id: 6, name: 'Cold Brew', category: 'cold', price: 24, description: 'Smooth cold brew', image: '🥤' },
  { id: 7, name: 'Matcha Latte', category: 'cold', price: 26, description: 'Japanese green tea', image: '🍵' },
  
  // Food
  { id: 8, name: 'Avocado Toast', category: 'food', price: 35, description: 'Fresh avocado on sourdough', image: '🥑' },
  { id: 9, name: 'Shakshuka', category: 'food', price: 42, description: 'Middle Eastern eggs', image: '🍳' },
  { id: 10, name: 'Granola Bowl', category: 'food', price: 38, description: 'Yogurt and fresh fruit', image: '🥣' },
  
  // Pastries
  { id: 11, name: 'Croissant', category: 'pastries', price: 15, description: 'Buttery and flaky', image: '🥐' },
  { id: 12, name: 'Pain au Chocolat', category: 'pastries', price: 18, description: 'Chocolate croissant', image: '🥐' },
  { id: 13, name: 'Cinnamon Roll', category: 'pastries', price: 20, description: 'Sweet and sticky', image: '🥨' }
];

const featuredItems = [
  { id: 101, name: 'Pistachio Latte', price: 28, description: 'Limited edition', image: '🥤', tag: 'NEW' },
  { id: 102, name: 'Cardamom Coffee', price: 25, description: 'Arabic inspired', image: '☕', tag: 'SEASONAL' },
  { id: 103, name: 'Rose Matcha', price: 30, description: 'Floral & earthy', image: '🍵', tag: 'NEW' }
];

// ==================== AUTH SCREENS ====================
function LoginScreen({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');
      // onAuthStateChanged in AppProvider will handle the rest
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">🦜</div>
        <h1>Welcome to Birdies</h1>
        <p className="auth-subtitle">Sign in to order your favorites</p>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button onClick={onSwitchToSignup} className="auth-link">
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupScreen({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Signup successful');

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        name: name,
        hasCompletedOnboarding: false,
        preferences: { milk: '', diet: '', allergies: [] },
        favorites: [],
        stars: 0,
        createdAt: serverTimestamp()
      });

      console.log('✅ User document created');
      // onAuthStateChanged in AppProvider will handle the rest
    } catch (error) {
      console.error('❌ Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">🦜</div>
        <h1>Join Birdies</h1>
        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <button onClick={onSwitchToLogin} className="auth-link">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== ONBOARDING ====================
function OnboardingFlow() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [milk, setMilk] = useState('');
  const [diet, setDiet] = useState('');
  const [allergies, setAllergies] = useState([]);

  const milkOptions = ['Oat', 'Almond', 'Soy', 'Regular', 'Coconut'];
  const dietOptions = ['None', 'Vegan', 'Vegetarian'];
  const allergyOptions = ['Dairy', 'Nuts', 'Gluten', 'Soy', 'Eggs'];

  const toggleAllergy = (allergy) => {
    setAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleComplete = () => {
    completeOnboarding({ milk, diet, allergies });
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-container">
        <div className="onboarding-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
          <p>Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="onboarding-step">
            <h2>🥛 Milk Preference</h2>
            <p>We'll remember this for faster ordering</p>
            <div className="option-grid">
              {milkOptions.map(option => (
                <button
                  key={option}
                  className={`option-button ${milk === option ? 'selected' : ''}`}
                  onClick={() => setMilk(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button 
              className="onboarding-next" 
              onClick={() => setStep(2)}
              disabled={!milk}
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>🥗 Dietary Preference</h2>
            <p>Help us suggest the right items</p>
            <div className="option-grid">
              {dietOptions.map(option => (
                <button
                  key={option}
                  className={`option-button ${diet === option ? 'selected' : ''}`}
                  onClick={() => setDiet(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="onboarding-buttons">
              <button className="onboarding-back" onClick={() => setStep(1)}>
                Back
              </button>
              <button 
                className="onboarding-next" 
                onClick={() => setStep(3)}
                disabled={!diet}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h2>⚠️ Allergies</h2>
            <p>Select any allergies we should know about</p>
            <div className="option-grid">
              {allergyOptions.map(option => (
                <button
                  key={option}
                  className={`option-button ${allergies.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleAllergy(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="onboarding-buttons">
              <button className="onboarding-back" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="onboarding-next" onClick={handleComplete}>
                Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== LOCATION SELECTOR ====================
function LocationSelector() {
  const { selectedLocation, setSelectedLocation, preferredLocation, setPreferredLocation } = useApp();

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    if (!preferredLocation) {
      setPreferredLocation(location);
    }
  };

  return (
    <div className="location-screen">
      <div className="location-container">
        <h1>Choose Your Location</h1>
        <p className="location-subtitle">Select where you'd like to order from</p>

        <div className="location-map">
          <div className="map-placeholder">🗺️ Map View</div>
        </div>

        <div className="location-list">
          {locations.map(location => (
            <div
              key={location.id}
              className={`location-card ${selectedLocation?.id === location.id ? 'selected' : ''}`}
              onClick={() => handleSelectLocation(location)}
            >
              <div className="location-info">
                <h3>{location.name}</h3>
                <p>{location.address}</p>
              </div>
              {preferredLocation?.id === location.id && (
                <span className="location-badge">Last Ordered</span>
              )}
            </div>
          ))}
        </div>

        <button
          className="location-button"
          disabled={!selectedLocation}
          onClick={() => {}}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ==================== MENU ====================
function MenuScreen({ onItemClick }) {
  const { favorites, toggleFavorite, selectedLocation, setSelectedLocation } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All', emoji: '🍽️' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'cold', name: 'Cold Drinks', emoji: '🥤' },
    { id: 'food', name: 'Food', emoji: '🍳' },
    { id: 'pastries', name: 'Pastries', emoji: '🥐' }
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <div className="menu-location">
          <span className="location-icon">📍</span>
          <span>{selectedLocation?.name}</span>
          <button 
            className="location-change"
            onClick={() => setSelectedLocation(null)}
          >
            Change
          </button>
        </div>
        
        <div className="menu-search">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="featured-section">
        <h2>What's New</h2>
        <div className="featured-scroll">
          {featuredItems.map(item => (
            <div key={item.id} className="featured-card" onClick={() => onItemClick(item)}>
              <div className="featured-tag">{item.tag}</div>
              <div className="featured-image">{item.image}</div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="featured-price">AED {item.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="category-emoji">{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-card" onClick={() => onItemClick(item)}>
            <button
              className="favorite-button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
            >
              {favorites.includes(item.id) ? '★' : '☆'}
            </button>
            <div className="menu-card-image">{item.image}</div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="menu-card-footer">
              <span className="price">AED {item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== ITEM DETAIL ====================
function ItemDetailScreen({ item, onClose, onAddToCart }) {
  const { preferences, favorites, toggleFavorite } = useApp();
  const [size, setSize] = useState('Regular');
  const [milk, setMilk] = useState(preferences.milk || 'Regular');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const sizes = ['Small', 'Regular', 'Large'];
  const milkOptions = ['Regular', 'Oat', 'Almond', 'Soy', 'Coconut'];

  const getPriceForSize = () => {
    if (size === 'Small') return item.price - 3;
    if (size === 'Large') return item.price + 3;
    return item.price;
  };

  const totalPrice = getPriceForSize() * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      ...item,
      size,
      milk,
      specialInstructions,
      quantity,
      price: getPriceForSize()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content item-detail" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="item-detail-header">
          <div className="item-detail-image">{item.image}</div>
          <button
            className="favorite-button-large"
            onClick={() => toggleFavorite(item.id)}
          >
            {favorites.includes(item.id) ? '★' : '☆'}
          </button>
        </div>

        <h2>{item.name}</h2>
        <p className="item-description">{item.description}</p>

        {item.category === 'coffee' || item.category === 'cold' ? (
          <>
            <div className="customization-section">
              <h3>Size</h3>
              <div className="option-buttons">
                {sizes.map(s => (
                  <button
                    key={s}
                    className={`option-btn ${size === s ? 'selected' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="customization-section">
              <h3>Milk</h3>
              <div className="option-buttons">
                {milkOptions.map(m => (
                  <button
                    key={m}
                    className={`option-btn ${milk === m ? 'selected' : ''}`}
                    onClick={() => setMilk(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="customization-section">
          <h3>Special Instructions</h3>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Add any special requests..."
            rows="3"
          />
        </div>

        <div className="customization-section">
          <h3>Quantity</h3>
          <div className="quantity-controls">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>

        <button className="add-to-cart-button" onClick={handleAddToCart}>
          Add to Cart - AED {totalPrice}
        </button>
      </div>
    </div>
  );
}

// ==================== CART ====================
function CartScreen({ onClose, onCheckout }) {
  const { cart, updateCartItemQuantity, removeFromCart } = useApp();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content cart-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some items to get started</p>
            <button className="btn-primary" onClick={onClose}>
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cart-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Your Cart</h2>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.cartId} className="cart-item">
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                {item.size && <p>Size: {item.size}</p>}
                {item.milk && <p>Milk: {item.milk}</p>}
                {item.specialInstructions && (
                  <p className="special-instructions">{item.specialInstructions}</p>
                )}
                <p className="item-price">AED {item.price}</p>
              </div>
              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <button onClick={() => updateCartItemQuantity(item.cartId, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateCartItemQuantity(item.cartId, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item.cartId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>AED {subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>AED {tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
        </div>

        <button className="checkout-button" onClick={() => onCheckout(total)}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

// ==================== CHECKOUT ====================
function CheckoutScreen({ total, onClose, onConfirm }) {
  const { stars } = useApp();
  const [pickupTime, setPickupTime] = useState('asap');
  const [customTime, setCustomTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleConfirm = () => {
    onConfirm({
      pickupTime: pickupTime === 'scheduled' ? customTime : 'ASAP',
      contactInfo: { name, phone },
      paymentMethod,
      total
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Checkout</h2>

        <div className="checkout-section">
          <h3>Pickup Time</h3>
          <div className="radio-group">
            <label className={pickupTime === 'asap' ? 'selected' : ''}>
              <input
                type="radio"
                value="asap"
                checked={pickupTime === 'asap'}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              <span>ASAP (15-20 mins)</span>
            </label>
            <label className={pickupTime === 'scheduled' ? 'selected' : ''}>
              <input
                type="radio"
                value="scheduled"
                checked={pickupTime === 'scheduled'}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              <span>Schedule for later</span>
            </label>
          </div>
          {pickupTime === 'scheduled' && (
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="time-input"
            />
          )}
        </div>

        <div className="checkout-section">
          <h3>Contact Information</h3>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="checkout-section">
          <h3>Payment Method</h3>
          <div className="radio-group">
            <label className={paymentMethod === 'card' ? 'selected' : ''}>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Credit/Debit Card</span>
            </label>
            <label className={paymentMethod === 'apple' ? 'selected' : ''}>
              <input
                type="radio"
                value="apple"
                checked={paymentMethod === 'apple'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span> Apple Pay</span>
            </label>
            <label className={paymentMethod === 'cash' ? 'selected' : ''}>
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💵 Cash on Pickup</span>
            </label>
          </div>
        </div>

        <div className="checkout-section">
          <div className="stars-info">
            <span>⭐ Available Stars: {stars}</span>
            <span className="stars-note">(Redemption coming in Phase 2)</span>
          </div>
        </div>

        <div className="checkout-summary">
          <div className="summary-row total">
            <span>Total</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
          <p className="stars-earned">You'll earn {Math.floor(total / 10)} stars with this order!</p>
        </div>

        <button
          className="confirm-button"
          onClick={handleConfirm}
          disabled={!name || !phone}
        >
          Confirm Order
        </button>
      </div>
    </div>
  );
}

// ==================== ORDER CONFIRMATION ====================
function OrderConfirmation({ order, onClose }) {
  const starsEarned = Math.floor(order.total / 10);

  return (
    <div className="modal-overlay">
      <div className="modal-content order-confirmation">
        <div className="confirmation-icon">✓</div>
        <h2>Order Confirmed!</h2>
        <p className="order-number">Order #{order.orderNumber}</p>

        <div className="confirmation-details">
          <div className="detail-row">
            <span>Pickup Location:</span>
            <strong>{order.location.name}</strong>
          </div>
          <div className="detail-row">
            <span>Pickup Time:</span>
            <strong>{order.pickupTime}</strong>
          </div>
          <div className="detail-row">
            <span>Total:</span>
            <strong>AED {order.total.toFixed(2)}</strong>
          </div>
          <div className="stars-earned-box">
            <span>⭐ You earned {starsEarned} stars!</span>
          </div>
        </div>

        <p className="confirmation-message">
          We'll notify you when your order is ready for pickup.
        </p>

        <button className="btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

// ==================== HOME SCREEN ====================
function HomeScreen({ onNavigate }) {
  const { user, stars, currentOrder, favorites, selectedLocation } = useApp();
  const favoriteItems = menuItems.filter(item => favorites.includes(item.id));

  return (
    <div className="home-screen">
      <div className="home-header">
        <div>
          <h1>Welcome back!</h1>
          <p className="user-email">{user?.email}</p>
        </div>
        <div className="stars-badge">
          ⭐ {stars}
        </div>
      </div>

      {currentOrder && (
        <div className="active-order-card">
          <h3>Active Order</h3>
          <p className="order-number">Order #{currentOrder.orderNumber}</p>
          <div className="order-status">
            <span className="status-badge">Preparing</span>
          </div>
          <div className="order-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div className="order-actions">
            <button onClick={() => onNavigate('tracking')}>Track Order</button>
            <button>View Receipt</button>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <div
          className="action-card"
          onClick={() => {
            if (selectedLocation) {
              onNavigate('menu');
            } else {
              onNavigate('location');
            }
          }}
        >
          <div className="action-icon">☕</div>
          <h3>Order Now</h3>
          <p>Browse menu</p>
        </div>
        <div className="action-card" onClick={() => onNavigate('location')}>
          <div className="action-icon">📍</div>
          <h3>Find Location</h3>
          <p>Choose pickup spot</p>
        </div>
        <div className="action-card" onClick={() => onNavigate('events')}>
          <div className="action-icon">🎉</div>
          <h3>Events</h3>
          <p>Sunday Set & more</p>
        </div>
      </div>

      {favoriteItems.length > 0 && (
        <div className="favorites-section">
          <h2>Your Favorites</h2>
          <div className="favorites-grid">
            {favoriteItems.slice(0, 4).map(item => (
              <div key={item.id} className="favorite-card">
                <div className="favorite-image">{item.image}</div>
                <h4>{item.name}</h4>
                <p>AED {item.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ORDER TRACKING ====================
function OrderTrackingScreen({ onBack }) {
  const { currentOrder } = useApp();

  const stages = [
    { id: 1, label: 'Order Placed', completed: true },
    { id: 2, label: 'Order Confirmed', completed: true },
    { id: 3, label: 'Preparing', completed: false, active: true },
    { id: 4, label: 'Ready for Pickup', completed: false }
  ];

  return (
    <div className="tracking-screen">
      <button className="back-button" onClick={onBack}>← Back</button>
      
      <div className="tracking-header">
        <h1>Order Tracking</h1>
        <p className="order-number">Order #{currentOrder?.orderNumber}</p>
      </div>

      <div className="tracking-progress">
        {stages.map((stage, index) => (
          <div key={stage.id} className="tracking-stage">
            <div className={`stage-indicator ${stage.completed ? 'completed' : ''} ${stage.active ? 'active' : ''}`}>
              {stage.completed ? '✓' : stage.id}
            </div>
            <div className="stage-info">
              <h3>{stage.label}</h3>
              {stage.active && <p className="stage-time">In progress...</p>}
            </div>
            {index < stages.length - 1 && (
              <div className={`stage-line ${stage.completed ? 'completed' : ''}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="tracking-details">
        <h3>Order Details</h3>
        <div className="detail-row">
          <span>Location:</span>
          <strong>{currentOrder?.location.name}</strong>
        </div>
        <div className="detail-row">
          <span>Pickup Time:</span>
          <strong>{currentOrder?.pickupTime}</strong>
        </div>
        <div className="detail-row">
          <span>Total:</span>
          <strong>AED {currentOrder?.total.toFixed(2)}</strong>
        </div>
      </div>

      <div className="tracking-items">
        <h3>Items</h3>
        {currentOrder?.items.map((item, index) => (
          <div key={index} className="tracking-item">
            <span>{item.quantity}x {item.name}</span>
            <span>AED {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== STARS SCREEN ====================
function StarsScreen() {
  const { stars } = useApp();

  return (
    <div className="stars-screen">
      <div className="stars-header">
        <div className="stars-circle">
          <span className="stars-count">{stars}</span>
          <span className="stars-label">Stars</span>
        </div>
        <h2>Birdies Rewards</h2>
        <p>Earn 1 star for every AED 10 spent</p>
      </div>

      <div className="rewards-info">
        <h3>Coming Soon in Phase 2!</h3>
        <ul className="rewards-list">
          <li>✨ Redeem stars for free items</li>
          <li>🎁 Exclusive member rewards</li>
          <li>🎂 Birthday surprises</li>
          <li>⚡ Early access to new items</li>
        </ul>
      </div>

      <div className="progress-card">
        <h3>Your Progress</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(stars % 50) * 2}%` }}></div>
        </div>
        <p>{50 - (stars % 50)} stars until next reward</p>
      </div>
    </div>
  );
}

// ==================== EVENTS SCREEN ====================
function EventsScreen() {
  const events = [
    {
      id: 1,
      title: 'Sunday Set',
      description: 'Live DJ every Sunday 2-6 PM',
      image: '🎵',
      date: 'Every Sunday'
    },
    {
      id: 2,
      title: 'Coffee Cupping',
      description: 'Learn about specialty coffee',
      image: '☕',
      date: 'First Saturday of Month'
    }
  ];

  return (
    <div className="events-screen">
      <h1>Upcoming Events</h1>
      <p className="events-subtitle">Join us for special experiences</p>

      <div className="events-list">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-image">{event.image}</div>
            <div className="event-info">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <span className="event-date">{event.date}</span>
            </div>
            <button className="event-button">Register</button>
          </div>
        ))}
      </div>

      <div className="events-note">
        <p>Full event registration system coming in Phase 3!</p>
      </div>
    </div>
  );
}

// ==================== ACCOUNT SCREEN ====================
function AccountScreen() {
  const { user, stars, preferences, signOut } = useApp();

  return (
    <div className="account-screen">
      <div className="account-header">
        <div className="account-avatar">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <h2>{user?.email}</h2>
        <p className="stars-total">⭐ {stars} Stars</p>
      </div>

      <div className="account-section">
        <h3>Preferences</h3>
        <div className="preference-item">
          <span>Milk Preference:</span>
          <strong>{preferences.milk || 'Not set'}</strong>
        </div>
        <div className="preference-item">
          <span>Dietary:</span>
          <strong>{preferences.diet || 'Not set'}</strong>
        </div>
        <div className="preference-item">
          <span>Allergies:</span>
          <strong>{preferences.allergies?.length > 0 ? preferences.allergies.join(', ') : 'None'}</strong>
        </div>
      </div>

      <div className="account-section">
        <h3>Settings</h3>
        <button className="account-button">Edit Profile</button>
        <button className="account-button">Order History</button>
        <button className="account-button">Payment Methods</button>
        <button className="account-button">Notifications</button>
      </div>

      <button className="sign-out-button" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}

// ==================== MAIN APP CONTENT ====================
function AppContent() {
  const { user, hasCompletedOnboarding, selectedLocation, cart } = useApp();
  const [authMode, setAuthMode] = useState('login');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const { addToCart, placeOrder } = useApp();

  // Show auth screen if not logged in
  if (!user) {
    return authMode === 'login' ? (
      <LoginScreen onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupScreen onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  // Show location selector if no location selected
  if (!selectedLocation && currentScreen === 'menu') {
    return <LocationSelector />;
  }

  const handleAddToCart = (item) => {
    addToCart(item);
    setSelectedItem(null);
  };

  const handleCheckout = (total) => {
    setCheckoutTotal(total);
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = async (orderDetails) => {
    try {
      const order = await placeOrder(orderDetails);
      setConfirmedOrder(order);
      setShowCheckout(false);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmedOrder(null);
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'menu':
        return <MenuScreen onItemClick={setSelectedItem} />;
      case 'location':
        return <LocationSelector />;
      case 'tracking':
        return <OrderTrackingScreen onBack={() => setCurrentScreen('home')} />;
      case 'stars':
        return <StarsScreen />;
      case 'events':
        return <EventsScreen />;
      case 'account':
        return <AccountScreen />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  const handleNavigation = (screen) => {
    if (screen === 'order') {
      if (selectedLocation) {
        setCurrentScreen('menu');
      } else {
        setCurrentScreen('location');
      }
    } else {
      setCurrentScreen(screen);
    }
  };

  return (
    <div className="app">
      <main className="app-main">
        {renderScreen()}
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button className="floating-cart" onClick={() => setShowCart(true)}>
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{cart.length}</span>
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={currentScreen === 'home' ? 'active' : ''}
          onClick={() => handleNavigation('home')}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button
          className={currentScreen === 'menu' ? 'active' : ''}
          onClick={() => handleNavigation('order')}
        >
          <span>☕</span>
          <span>Order</span>
        </button>
        <button
          className={currentScreen === 'stars' ? 'active' : ''}
          onClick={() => handleNavigation('stars')}
        >
          <span>⭐</span>
          <span>Stars</span>
        </button>
        <button
          className={currentScreen === 'events' ? 'active' : ''}
          onClick={() => handleNavigation('events')}
        >
          <span>🎉</span>
          <span>Events</span>
        </button>
        <button
          className={currentScreen === 'account' ? 'active' : ''}
          onClick={() => handleNavigation('account')}
        >
          <span>👤</span>
          <span>Account</span>
        </button>
      </nav>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailScreen
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <CartScreen
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
      )}

      {showCheckout && (
        <CheckoutScreen
          total={checkoutTotal}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {showConfirmation && confirmedOrder && (
        <OrderConfirmation
          order={confirmedOrder}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
}

// ==================== MAIN APP ====================
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;