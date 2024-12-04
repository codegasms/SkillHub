import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  walletBalance: 0,
  funds: [], 
  earnings: [], 
  payments: [] 
};

const fundsSlice = createSlice({
  name: "funds",
  initialState,
  reducers: {
    setWalletBalance: (state, action) => {
      state.walletBalance = action.payload;
    },
    setFunds: (state, action) => {
      state.funds = action.payload;
    },
    addFund: (state, action) => {
      state.funds.push(action.payload);
    },
    setEarnings: (state, action) => {
      state.earnings = action.payload;
    },
    addEarning: (state, action) => {
      state.earnings.push(action.payload);
      state.walletBalance += action.payload.amount;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
    },
    addPayment: (state, action) => {
      state.payments.push(action.payload);
      state.walletBalance -= action.payload.amount;
    }
  }
});

// Export actions
export const { 
  setWalletBalance, 
  setFunds,
  addFund,
  setEarnings, 
  addEarning,
  setPayments, 
  addPayment
} = fundsSlice.actions;

// Export selectors
export const selectWalletBalance = (state) => state.funds.walletBalance;
export const selectFunds = (state) => state.funds.funds;
export const selectEarnings = (state) => state.funds.earnings;
export const selectPayments = (state) => state.funds.payments;

// Export reducer
export default fundsSlice.reducer;