// app/store/shopSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../mock/api";
import type { ShopData } from "../types";

interface ShopState {
  data: ShopData | null;
  loading: boolean;
}

const initialState: ShopState = { data: null, loading: false };

export const fetchShopData = createAsyncThunk("shop/fetch", async () => {
  return api.getShop();
});

export const updateSenderEmail = createAsyncThunk(
  "shop/updateSenderEmail",
  async ({ email, enabled }: { email: string; enabled: boolean }) => {
    return api.updateSenderEmail(email, enabled);
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
