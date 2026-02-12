// Data synchronization utility for multi-user real-time updates
// Uses localStorage with polling mechanism to sync data between users

let syncInterval = null;
let lastSyncTimestamp = null;

// Get last sync timestamp from localStorage
const getLastSyncTimestamp = () => {
  if (typeof window === "undefined") return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  const timestamp = localStorage.getItem(`finmaster_last_sync_user_${userId}`);
  return timestamp ? parseInt(timestamp) : null;
};

// Set last sync timestamp
const setLastSyncTimestamp = (timestamp) => {
  if (typeof window === "undefined") return;
  const userId = getCurrentUserId();
  if (!userId) return;
  localStorage.setItem(`finmaster_last_sync_user_${userId}`, timestamp.toString());
  lastSyncTimestamp = timestamp;
};

// Get current user ID (same as in localStorage.js)
const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user?.id || null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
};

// Export getStorageKey helper
export const getStorageKey = (baseKey) => {
  const userId = getCurrentUserId();
  if (userId) {
    return `${baseKey}_user_${userId}`;
  }
  return baseKey;
};

// Compare two data arrays and return differences
const compareData = (oldData, newData, key = 'id') => {
  const oldMap = new Map(oldData.map(item => [item[key], item]));
  const newMap = new Map(newData.map(item => [item[key], item]));
  
  const added = [];
  const updated = [];
  const deleted = [];
  
  // Check for added/updated items
  newMap.forEach((newItem, id) => {
    const oldItem = oldMap.get(id);
    if (!oldItem) {
      added.push(newItem);
    } else {
      // Compare objects (simple deep comparison)
      const oldStr = JSON.stringify(oldItem);
      const newStr = JSON.stringify(newItem);
      if (oldStr !== newStr) {
        updated.push(newItem);
      }
    }
  });
  
  // Check for deleted items
  oldMap.forEach((oldItem, id) => {
    if (!newMap.has(id)) {
      deleted.push(oldItem);
    }
  });
  
  return { added, updated, deleted };
};

// Merge data from multiple sources (localStorage keys)
const mergeData = (localData, remoteData, key = 'id') => {
  const localMap = new Map(localData.map(item => [item[key], item]));
  const remoteMap = new Map(remoteData.map(item => [item[key], item]));
  
  // Merge: remote takes precedence if timestamp is newer
  const merged = [];
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
  
  allIds.forEach(id => {
    const localItem = localMap.get(id);
    const remoteItem = remoteMap.get(id);
    
    if (localItem && remoteItem) {
      // Compare timestamps if available
      const localTime = localItem.updatedAt || localItem.createdAt || 0;
      const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || 0;
      
      // Use the newer one
      merged.push(remoteTime > localTime ? remoteItem : localItem);
    } else if (remoteItem) {
      merged.push(remoteItem);
    } else if (localItem) {
      merged.push(localItem);
    }
  });
  
  return merged;
};

// Sync data from localStorage (simulating server sync)
// In a real app, this would fetch from API
export const syncData = (storageKey, getDataFunc, setDataFunc, onUpdate) => {
  if (typeof window === "undefined") return;
  
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Get current local data
  const localData = getDataFunc();
  
  // In a real implementation, this would fetch from server API
  // For now, we'll use a shared localStorage key as a simple sync mechanism
  // This works for same-domain tabs/windows
  const syncKey = `${storageKey}_sync_user_${userId}`;
  const syncDataStr = localStorage.getItem(syncKey);
  
  // CRITICAL: Kiểm tra xem sync key có đúng userId hiện tại không
  // Tránh trường hợp đổi nick nhưng vẫn sync dữ liệu từ user cũ
  if (!syncKey.includes(`_user_${userId}`)) {
    console.warn('[DataSync] Skip sync - userId mismatch:', syncKey, userId);
    return localData;
  }
  
  if (syncDataStr) {
    try {
      const syncData = JSON.parse(syncDataStr);
      const remoteData = syncData.data || [];
      const remoteTimestamp = syncData.timestamp || 0;
      const localTimestamp = getLastSyncTimestamp() || 0;
      
      // Only merge if remote is newer
      if (remoteTimestamp > localTimestamp) {
        const merged = mergeData(localData, remoteData);
        
        // Update local storage
        localStorage.setItem(storageKey, JSON.stringify(merged));
        
        // Notify callback
        if (onUpdate) {
          onUpdate(merged, localData);
        }
        
        // Update sync timestamp
        setLastSyncTimestamp(remoteTimestamp);
        
        return merged;
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }
  
  return localData;
};

// Broadcast data changes to other tabs/windows
export const broadcastDataChange = (storageKey, data) => {
  if (typeof window === "undefined") return;
  
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Update sync storage
  const syncKey = `${storageKey}_sync_user_${userId}`;
  const syncData = {
    data: data,
    timestamp: Date.now(),
  };
  localStorage.setItem(syncKey, JSON.stringify(syncData));
  
  // Broadcast to other tabs using BroadcastChannel API
  try {
    const channel = new BroadcastChannel(`finmaster_sync_${userId}`);
    channel.postMessage({
      type: 'data_update',
      storageKey: storageKey,
      data: data,
      timestamp: syncData.timestamp,
    });
    channel.close();
  } catch (error) {
    // BroadcastChannel not supported, fallback to storage event
    console.log('BroadcastChannel not supported, using storage event');
  }
  
  // Update last sync timestamp
  setLastSyncTimestamp(syncData.timestamp);
};

// Start data synchronization
export const startDataSync = (config) => {
  if (typeof window === "undefined") return;
  
  const {
    storageKeys = [],
    getDataFuncs = {},
    setDataFuncs = {},
    onUpdateCallbacks = {},
    interval = 2000, // 2 seconds default
  } = config;
  
  // Stop existing sync if any
  stopDataSync();
  
  // Initialize last sync timestamp
  lastSyncTimestamp = getLastSyncTimestamp() || Date.now();
  
  // Listen for BroadcastChannel messages
  const userId = getCurrentUserId();
  if (userId) {
    try {
      const channel = new BroadcastChannel(`finmaster_sync_${userId}`);
      channel.onmessage = (event) => {
        const { type, storageKey, data, timestamp, userId: messageUserId } = event.data;
        if (type === 'data_update' && storageKeys.includes(storageKey)) {
          // CRITICAL: Kiểm tra userId hiện tại có khớp không
          const currentUserId = getCurrentUserId();
          
          // Double check: currentUserId phải khớp cả với channel userId VÀ message userId
          if (currentUserId !== userId) {
            console.warn('[DataSync] Skip broadcast - userId changed:', currentUserId, userId);
            return;
          }
          
          // CRITICAL: Validate userId trong message
          if (messageUserId && messageUserId !== currentUserId) {
            console.warn('[DataSync] Skip broadcast - message userId mismatch:', messageUserId, currentUserId);
            return;
          }
          
          const getDataFunc = getDataFuncs[storageKey];
          const setDataFunc = setDataFuncs[storageKey];
          const onUpdate = onUpdateCallbacks[storageKey];
          
          if (getDataFunc && setDataFunc) {
            const localData = getDataFunc();
            const merged = mergeData(localData, data);
            setDataFunc(merged);
            
            if (onUpdate) {
              onUpdate(merged, localData);
            }
            
            setLastSyncTimestamp(timestamp);
          }
        }
      };
      
      // Store channel reference for cleanup
      window._finmasterSyncChannel = channel;
    } catch (error) {
      console.log('BroadcastChannel not supported');
    }
  }
  
  // Listen for storage events (fallback for same-origin)
  const handleStorageChange = (e) => {
    if (e.key && storageKeys.some(key => e.key.includes(key) && e.key.includes('_sync_'))) {
      const storageKey = storageKeys.find(key => e.key.includes(key));
      if (storageKey) {
        const getDataFunc = getDataFuncs[storageKey];
        const setDataFunc = setDataFuncs[storageKey];
        const onUpdate = onUpdateCallbacks[storageKey];
        
        if (getDataFunc && setDataFunc) {
          syncData(storageKey, getDataFunc, setDataFunc, onUpdate);
        }
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  window._finmasterStorageHandler = handleStorageChange;
  
  // Start polling sync
  syncInterval = setInterval(() => {
    storageKeys.forEach(storageKey => {
      const getDataFunc = getDataFuncs[storageKey];
      const setDataFunc = setDataFuncs[storageKey];
      const onUpdate = onUpdateCallbacks[storageKey];
      
      if (getDataFunc && setDataFunc) {
        syncData(storageKey, getDataFunc, setDataFunc, onUpdate);
      }
    });
  }, interval);
  
  console.log('Data sync started');
};

// Stop data synchronization
export const stopDataSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  
  if (window._finmasterSyncChannel) {
    window._finmasterSyncChannel.close();
    window._finmasterSyncChannel = null;
  }
  
  if (window._finmasterStorageHandler) {
    window.removeEventListener('storage', window._finmasterStorageHandler);
    window._finmasterStorageHandler = null;
  }
  
  console.log('Data sync stopped');
};
