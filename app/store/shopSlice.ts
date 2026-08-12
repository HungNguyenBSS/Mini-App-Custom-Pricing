import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../mock/api";
import type { ShopData } from "../types";

interface ShopState {
  data: ShopData | null;
  loading: boolean;
}

const initialState: ShopState = { data: null, loading: false };

export const fetchShopData = createAsyncThunk(
  "shop/fetch",
  async (shopDomain: string) => {
    return api.getShop(shopDomain);
  },
);

export const updateSenderEmail = createAsyncThunk(
  "shop/updateSenderEmail",
  async (
    { shopDomain, email, enabled }: { shopDomain: string; email: string; enabled: boolean },
  ) => {
    return api.updateSenderEmail(shopDomain, email, enabled);
  },
);

const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShopData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchShopData.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateSenderEmail.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSenderEmail.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(updateSenderEmail.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default shopSlice.reducer;