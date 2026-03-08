import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface MinimalProfile {
  id: string;
  name: string;
  age: number;
  department: string;
  distance: string;
  primaryPhoto: string;
}

export interface DiscoverState {
  visibleProfiles: MinimalProfile[];
  queue: MinimalProfile[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: DiscoverState = {
  visibleProfiles: [],
  queue: [],
  isLoading: false,
  error: null,
  currentPage: 1,
};

// Async thunk to fetch recommendations batch
export const fetchRecommendations = createAsyncThunk(
  'discover/fetchRecommendations',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(`/discover/recommendations?page=${page}`);
      // return response.data;
      
      // Mock data for now
      return [
        { id: `mock-${page}-1`, name: 'Priya', age: 20, department: 'CSE', distance: '2.3km', primaryPhoto: 'https://via.placeholder.com/400x600' },
        { id: `mock-${page}-2`, name: 'Rahul', age: 21, department: 'ECE', distance: '1.5km', primaryPhoto: 'https://via.placeholder.com/400x600' },
        { id: `mock-${page}-3`, name: 'Sneha', age: 19, department: 'IT', distance: '3.0km', primaryPhoto: 'https://via.placeholder.com/400x600' },
      ];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch recommendations');
    }
  }
);

export const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    // Call this when a card is swiped to remove it from visible and pull from queue
    swipeCard: (state, action: PayloadAction<'like' | 'pass' | 'super_like'>) => {
      // Remove the top card
      state.visibleProfiles.shift();
      
      // If we have items in the queue, move one to visible
      if (state.queue.length > 0) {
        state.visibleProfiles.push(state.queue.shift()!);
      }
    },
    resetDiscoverState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // If visible is empty, fill it up (max 3)
        const incoming = [...action.payload];
        while (state.visibleProfiles.length < 3 && incoming.length > 0) {
          state.visibleProfiles.push(incoming.shift()!);
        }
        
        // Put the rest in the queue
        state.queue.push(...incoming);
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { swipeCard, resetDiscoverState } = discoverSlice.actions;

export default discoverSlice.reducer;
